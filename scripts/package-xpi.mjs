#!/usr/bin/env node
/**
 * Zotero PaperFlow - Pure Node.js Reproducible XPI Packager & Verifier
 * Builds byte-reproducible XPI packages with POSIX permissions and normalized line endings.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');
const REPO = 'Zotero-PaperFlow';
const FEEDS = ['update.json'];
const IDENTITIES = ['zotero-paperflow@groele.org', 'researchflow@groele.org'];

// CRC-32 Table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

export function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function readJson(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return JSON.parse(text);
}

export function requireCondition(cond, message) {
  if (!cond) throw new Error(message);
}

export function metadata(root) {
  const manifest = readJson(path.join(root, 'manifest.json'));
  const version = manifest.version;

  for (const name of ['package.json', 'docs/brand/product.json', 'zotero/manifest.json']) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) {
      const data = readJson(file);
      requireCondition(data.version === version, `${name}: version mismatch`);
    }
  }

  const prefsPath = path.join(root, 'chrome/content/preferences.xhtml');
  if (fs.existsSync(prefsPath)) {
    const prefsText = fs.readFileSync(prefsPath, 'utf8');
    requireCondition(prefsText.includes(`>v${version}<`), 'Settings version badge mismatch');
  }

  for (const name of ['chrome/content/index.html', 'chrome/content/pages/options.html']) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, 'utf8');
      requireCondition(text.includes(`>v${version} Zotero<`), `${name}: workspace version mismatch`);
    }
  }

  const optionsJsPath = path.join(root, 'chrome/content/scripts/options.js');
  if (fs.existsSync(optionsJsPath)) {
    const optText = fs.readFileSync(optionsJsPath, 'utf8');
    requireCondition(optText.includes(`const RF_OPTIONS_RENDER_VERSION = '${version}';`),
      'chrome/content/scripts/options.js: render version mismatch');
  }

  for (const name of ['README.md', 'README.en.md']) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, 'utf8');
      requireCondition(text.includes(`version-${version}-`) && text.includes(`zotero-paperflow-${version}.xpi`),
        `${name}: README version mismatch`);
    }
  }

  return manifest;
}

export function payload(filePath) {
  let contents = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  if (['.js', '.json', '.css', '.html', '.xhtml', '.ftl', '.svg', '.manifest', '.properties', '.txt'].includes(ext)) {
    const str = contents.toString('utf8').replace(/\r\n/g, '\n');
    contents = Buffer.from(str, 'utf8');
  }
  return contents;
}

export function walkFiles(dir, rootDir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of list) {
    if (['.DS_Store', 'Thumbs.db', '.git'].includes(ent.name) || ent.name.endsWith('.tmp')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      results = results.concat(walkFiles(full, rootDir));
    } else if (ent.isFile()) {
      results.push(full);
    }
  }
  return results;
}

export function runtimeFiles(root) {
  const topFiles = ['manifest.json', 'bootstrap.js', 'prefs.js'].map(f => path.join(root, f)).filter(f => fs.existsSync(f));
  const chromeFiles = walkFiles(path.join(root, 'chrome'), root);
  const localeFiles = walkFiles(path.join(root, 'locale'), root);
  const all = [...topFiles, ...chromeFiles, ...localeFiles];
  all.sort((a, b) => {
    const relA = path.relative(root, a).replace(/\\/g, '/');
    const relB = path.relative(root, b).replace(/\\/g, '/');
    return relA.localeCompare(relB);
  });
  return all;
}

export function createZipBuffer(entries) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const compressed = zlib.deflateRawSync(data, { level: 9 });

    // Local Header (30 bytes + name)
    const lh = Buffer.alloc(30 + nameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0); // signature
    lh.writeUInt16LE(20, 4);         // version needed: 2.0
    lh.writeUInt16LE(0x0800, 6);     // flags: UTF-8
    lh.writeUInt16LE(8, 8);          // compression: deflate
    lh.writeUInt16LE(0, 10);         // mod time: 00:00:00
    lh.writeUInt16LE(0x0021, 12);    // mod date: 1980-01-01
    lh.writeUInt32LE(crc, 14);       // crc32
    lh.writeUInt32LE(compressed.length, 18); // compressed size
    lh.writeUInt32LE(data.length, 22);       // uncompressed size
    lh.writeUInt16LE(nameBuf.length, 26);    // name length
    lh.writeUInt16LE(0, 28);                 // extra len
    nameBuf.copy(lh, 30);

    localHeaders.push(lh, compressed);

    // Central Directory Header (46 bytes + name)
    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0); // signature
    cd.writeUInt16LE(0x0314, 4);     // version made by (UNIX 2.0)
    cd.writeUInt16LE(20, 6);         // version needed (2.0)
    cd.writeUInt16LE(0x0800, 8);     // flags: UTF-8
    cd.writeUInt16LE(8, 10);         // compression: deflate
    cd.writeUInt16LE(0, 12);         // mod time: 00:00:00
    cd.writeUInt16LE(0x0021, 14);    // mod date: 1980-01-01
    cd.writeUInt32LE(crc, 16);       // crc32
    cd.writeUInt32LE(compressed.length, 20); // compressed size
    cd.writeUInt32LE(data.length, 24);       // uncompressed size
    cd.writeUInt16LE(nameBuf.length, 28);    // name length
    cd.writeUInt16LE(0, 30);                 // extra len
    cd.writeUInt16LE(0, 32);                 // comment len
    cd.writeUInt16LE(0, 34);                 // disk start
    cd.writeUInt16LE(0, 36);                 // internal attr
    cd.writeUInt32LE((0o100644 * 0x10000) >>> 0, 38); // external attr (regular file, 0644)
    cd.writeUInt32LE(offset, 42);            // local header offset
    nameBuf.copy(cd, 46);

    centralHeaders.push(cd);
    offset += lh.length + compressed.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const cd of centralHeaders) cdSize += cd.length;

  // End of Central Directory (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);  // disk num
  eocd.writeUInt16LE(0, 6);  // start disk
  eocd.writeUInt16LE(entries.length, 8);  // entries on disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(cdSize, 12);         // size of CD
  eocd.writeUInt32LE(cdOffset, 16);       // offset of CD
  eocd.writeUInt16LE(0, 20);              // comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

export function readZipEntries(zipBuffer) {
  // Find End of Central Directory
  let eocdOffset = -1;
  for (let i = zipBuffer.length - 22; i >= 0; i--) {
    if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  requireCondition(eocdOffset >= 0, 'Corrupt XPI: End of Central Directory not found');

  const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = zipBuffer.readUInt32LE(eocdOffset + 16);

  let currentOffset = cdOffset;
  const entries = new Map();

  for (let i = 0; i < totalEntries; i++) {
    const sig = zipBuffer.readUInt32LE(currentOffset);
    requireCondition(sig === 0x02014b50, 'Corrupt XPI: Invalid Central Directory signature');

    const method = zipBuffer.readUInt16LE(currentOffset + 10);
    const expectedCrc = zipBuffer.readUInt32LE(currentOffset + 16);
    const compSize = zipBuffer.readUInt32LE(currentOffset + 20);
    const uncompSize = zipBuffer.readUInt32LE(currentOffset + 24);
    const nameLen = zipBuffer.readUInt16LE(currentOffset + 28);
    const extraLen = zipBuffer.readUInt16LE(currentOffset + 30);
    const commentLen = zipBuffer.readUInt16LE(currentOffset + 32);
    const localOffset = zipBuffer.readUInt32LE(currentOffset + 42);

    const name = zipBuffer.toString('utf8', currentOffset + 46, currentOffset + 46 + nameLen);
    currentOffset += 46 + nameLen + extraLen + commentLen;

    // Read Local Header
    const lhSig = zipBuffer.readUInt32LE(localOffset);
    requireCondition(lhSig === 0x04034b50, `Corrupt XPI: Invalid Local Header signature for ${name}`);
    const lhNameLen = zipBuffer.readUInt16LE(localOffset + 26);
    const lhExtraLen = zipBuffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
    const rawData = zipBuffer.subarray(dataStart, dataStart + compSize);

    let decompressed;
    if (method === 0) {
      decompressed = rawData;
    } else if (method === 8) {
      decompressed = zlib.inflateRawSync(rawData);
    } else {
      throw new Error(`Unsupported compression method ${method} in XPI`);
    }

    requireCondition(decompressed.length === uncompSize, `Size mismatch for ${name}`);
    requireCondition(crc32(decompressed) === expectedCrc, `CRC mismatch for ${name}`);

    entries.set(name, decompressed);
  }

  return entries;
}

export function build(root, outputPath) {
  metadata(root);
  const files = runtimeFiles(root);
  const entries = files.map((file) => ({
    name: path.relative(root, file).replace(/\\/g, '/'),
    data: payload(file)
  }));
  const zipBuf = createZipBuffer(entries);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, zipBuf);
  return zipBuf;
}

export function verify(root, outputPath, repo = REPO, feeds = FEEDS, identities = IDENTITIES, update = false) {
  const manifest = metadata(root);
  const version = manifest.version;
  const name = `zotero-${repo.replace(/^Zotero-/, '').toLowerCase()}-${version}.xpi`;

  const files = runtimeFiles(root);
  const expected = new Map();
  for (const f of files) {
    expected.set(path.relative(root, f).replace(/\\/g, '/'), payload(f));
  }

  const zipBytes = fs.readFileSync(outputPath);
  const actualEntries = readZipEntries(zipBytes);

  requireCondition(actualEntries.size === expected.size, 'XPI runtime file set mismatch');
  for (const [key, expVal] of expected.entries()) {
    requireCondition(actualEntries.has(key), `Missing XPI resource: ${key}`);
    const actVal = actualEntries.get(key);
    requireCondition(Buffer.compare(expVal, actVal) === 0, `Stale XPI resource: ${key}`);
  }

  const digest256 = crypto.createHash('sha256').update(zipBytes).digest('hex');
  const digest512 = crypto.createHash('sha512').update(zipBytes).digest('hex');
  const link = `https://github.com/groele/${repo}/releases/download/v${version}/${name}`;

  const documents = [];
  for (const feedName of feeds) {
    const feedPath = path.join(root, feedName);
    const data = readJson(feedPath);
    const addonKeys = Object.keys(data.addons || {});
    for (const id of identities) {
      requireCondition(addonKeys.includes(id), `${feedName}: add-on identities mismatch`);
    }
    for (const addonId of identities) {
      const updates = data.addons[addonId].updates;
      requireCondition(updates && updates.length === 1, `${feedName}: expected one maintained update`);
      const entry = updates[0];
      requireCondition(entry.version === version, `${feedName}: version mismatch`);
      requireCondition(entry.update_link === link, `${feedName}: immutable asset URL mismatch`);
      for (const key of ['strict_min_version', 'strict_max_version']) {
        const expectedVal = manifest.applications?.zotero?.[key] || manifest.browser_specific_settings?.zotero?.[key];
        const actualVal = entry.applications?.zotero?.[key];
        requireCondition(actualVal === expectedVal, `${feedName}: compatibility mismatch`);
      }
      const declaredHash = entry.update_hash || '';
      const algo = declaredHash.includes(':') ? declaredHash.split(':')[0] : 'sha256';
      requireCondition(['sha256', 'sha512'].includes(algo), `${feedName}: unsupported hash algorithm '${algo}'`);
      const actualDigest = algo === 'sha512' ? digest512 : digest256;
      if (update) {
        entry.update_hash = `${algo}:${actualDigest}`;
      } else {
        const expectedHash = `${algo}:${actualDigest}`;
        const mismatchLabel = algo === 'sha256' ? 'SHA-256' : 'SHA512';
        requireCondition(declaredHash === expectedHash, `${feedName}: installer ${mismatchLabel} mismatch`);
      }
    }
    documents.push({ path: feedPath, data });
  }

  if (update) {
    for (const doc of documents) {
      fs.writeFileSync(doc.path, JSON.stringify(doc.data, null, 2) + '\n', 'utf8');
    }
  }

  return {
    version,
    file: name,
    size: fs.statSync(outputPath).size,
    sha256: digest256,
    sha512: digest512,
    entries: expected.size,
    payloadVerifiedAgainstWorkspace: true,
    updateFeedsVerified: [...feeds],
    testHarnessIncluded: false,
    reproducibleZipMetadata: true,
    textLineEndings: 'LF'
  };
}

// Self-Test Suite (replaces test-release-package.py)
export function runSelfTest() {
  console.log('[test] Running package-xpi self-test suite...');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rf-pkg-test-'));

  try {
    const root = tempDir;
    const repo = 'Zotero-Sample';
    const identities = ['sample@example.org', 'legacy@example.org'];
    const feeds = ['update.json', 'zotero/update.json'];
    const manifest = {
      version: '1.2.3',
      applications: { zotero: { id: identities[0], strict_min_version: '10.0', strict_max_version: '12.*' } }
    };

    const writeJsonFile = (rel, obj) => {
      const p = path.join(root, rel);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
    };

    writeJsonFile('manifest.json', manifest);
    for (const name of ['bootstrap.js', 'prefs.js', 'chrome/content/preferences.xhtml']) {
      const p = path.join(root, name);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, '>v1.2.3<', 'utf8');
    }

    const entry = {
      version: '1.2.3',
      update_hash: 'sha256:old',
      update_link: 'https://github.com/groele/Zotero-Sample/releases/download/v1.2.3/zotero-sample-1.2.3.xpi',
      applications: { zotero: { strict_min_version: '10.0', strict_max_version: '12.*' } }
    };

    for (const feed of feeds) {
      writeJsonFile(feed, { addons: { [identities[0]]: { updates: [entry] }, [identities[1]]: { updates: [entry] } } });
    }

    const output = path.join(root, 'candidate.xpi');

    // 1. Stale hash is rejected then synchronized
    build(root, output);
    let threw = false;
    try {
      verify(root, output, repo, feeds, identities, false);
    } catch (e) {
      threw = true;
      requireCondition(e.message.includes('SHA-256 mismatch'), 'Expected SHA-256 mismatch');
    }
    requireCondition(threw, 'Expected stale hash verification to fail');

    const report = verify(root, output, repo, feeds, identities, true);
    const report2 = verify(root, output, repo, feeds, identities, false);
    requireCondition(report.sha256 === report2.sha256, 'Report hashes should match after sync');

    for (const feed of feeds) {
      const data = readJson(path.join(root, feed));
      for (const id of identities) {
        requireCondition(data.addons[id].updates[0].update_hash === 'sha256:' + report.sha256,
          'Feed hash should be updated');
      }
    }

    // 2. SHA-512 supported and synchronized
    for (const feed of feeds) {
      const data = readJson(path.join(root, feed));
      for (const id of identities) {
        data.addons[id].updates[0].update_hash = 'sha512:stale';
      }
      writeJsonFile(feed, data);
    }
    threw = false;
    try {
      verify(root, output, repo, feeds, identities, false);
    } catch (e) {
      threw = true;
      requireCondition(e.message.includes('SHA512 mismatch'), 'Expected SHA512 mismatch');
    }
    requireCondition(threw, 'Expected stale sha512 verification to fail');
    const report512 = verify(root, output, repo, feeds, identities, true);
    for (const feed of feeds) {
      const data = readJson(path.join(root, feed));
      for (const id of identities) {
        requireCondition(data.addons[id].updates[0].update_hash === 'sha512:' + report512.sha512,
          'Feed sha512 should be updated');
      }
    }

    // 3. Rebuild is byte-identical
    build(root, output);
    const beforeBytes = fs.readFileSync(output);
    const bootPath = path.join(root, 'bootstrap.js');
    fs.utimesSync(bootPath, new Date(1500000000000), new Date(1500000000000));
    build(root, output);
    const afterBytes = fs.readFileSync(output);
    requireCondition(Buffer.compare(beforeBytes, afterBytes) === 0, 'Rebuild must be byte-identical');

    // 4. CRLF vs LF produce identical installer
    fs.writeFileSync(bootPath, '// unicode-safe runtime\r\nconst value = 1;\r\n');
    build(root, output);
    const crlfBytes = fs.readFileSync(output);
    fs.writeFileSync(bootPath, '// unicode-safe runtime\nconst value = 1;\n');
    build(root, output);
    const lfBytes = fs.readFileSync(output);
    requireCondition(Buffer.compare(crlfBytes, lfBytes) === 0, 'CRLF and LF must produce identical XPI');

    console.log('[test] All package-xpi self-tests passed successfully!');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// CLI Entrypoint
const args = process.argv.slice(2);
if (args.includes('--test')) {
  runSelfTest();
} else {
  const updateFeeds = args.includes('--update-feeds');
  const verifyOnly = args.includes('--verify-only');
  requireCondition(!(updateFeeds && verifyOnly), 'Cannot combine --update-feeds with --verify-only');

  const root = DEFAULT_ROOT;
  const manifest = readJson(path.join(root, 'manifest.json'));
  const version = manifest.version;
  const xpiName = `zotero-paperflow-${version}.xpi`;
  const output = path.join(root, xpiName);

  if (!verifyOnly) {
    console.log(`[package-xpi] Packaging ${xpiName}...`);
    build(root, output);
  }

  console.log(`[package-xpi] Verifying package and ${updateFeeds ? 'synchronizing' : 'checking'} feeds...`);
  const report = verify(root, output, REPO, FEEDS, IDENTITIES, updateFeeds);

  if (!verifyOnly) {
    const reportPath = path.join(root, `docs/releases/v${version}-verification.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
    fs.writeFileSync(path.join(root, 'SHA256SUMS.txt'), `${report.sha256}  ${xpiName}\n`, 'utf8');
  }

  console.log(JSON.stringify(report, null, 2));
}
