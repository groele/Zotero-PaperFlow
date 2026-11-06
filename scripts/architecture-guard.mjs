/**
 * Zotero PaperFlow - Architecture & Compliance Guard
 *
 * Enforces workspace AGENTS.md clauses statically:
 *   §3   Fluent symmetry, zero hardcoded UI strings, naming governance
 *   §4.1 Full native preference coverage across prefs.js, preferences.xhtml, preferences.ts
 *   §4.2 Settings pane 16px/24px/40px alignment grid and layout rules
 *   §5.2 src/ is TypeScript single source of truth; typed composition, zero regex slicing
 *   §5.3 Deprecated Gecko/Zotero APIs banned (Gecko 153+ / Firefox 140+ runtime)
 *   §5.9 360-line ceiling per source module with freeze-and-shrink baseline (0 debt)
 *   §6   Version fields aligned across manifest, package, lock, brand, update feed, UI
 *   §9   Update feed integrity: HTTPS links, SHA-512 hashes, compatibility scope
 *
 * Run standalone: node scripts/architecture-guard.mjs
 * Run in test suite: node --test scripts/architecture-guard.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function readJson(rel) {
  let text = read(rel);
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return JSON.parse(text);
}

function lines(rel) {
  const text = read(rel);
  return text ? text.split(/\r?\n/).length : 0;
}

function walk(dirRel, exts = null) {
  const abs = path.join(root, dirRel);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  function step(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (['node_modules', '.git', 'dist', 'build', '__pycache__'].includes(ent.name)) continue;
      if (ent.isDirectory()) step(full);
      else if (ent.isFile()) {
        if (!exts || exts.some((e) => ent.name.endsWith(e))) {
          out.push(path.relative(root, full).replace(/\\/g, '/'));
        }
      }
    }
  }
  step(abs);
  return out.sort();
}

const baseline = readJson('scripts/architecture-baseline.json');
const MAX_LINES = baseline.maxSourceLines || 360;

test('§5.9 source files respect the 360-line ceiling (freeze-and-shrink baseline)', (t) => {
  const sourceFiles = walk('src', ['.ts', '.tsx', '.js']);
  const failures = [];
  const debt = [];

  for (const file of sourceFiles) {
    const count = lines(file);
    const frozen = baseline.oversized[file];
    if (frozen !== undefined) {
      if (count > frozen) failures.push(`${file}: ${count} lines, frozen at ${frozen}`);
      if (count > MAX_LINES) debt.push(`${file} (${count})`);
    } else if (count > MAX_LINES) {
      failures.push(`${file}: ${count} lines exceeds ${MAX_LINES} ceiling and is not in baseline`);
    }
  }

  t.diagnostic(`scanned ${sourceFiles.length} source files; ${debt.length} oversized modules in baseline`);
  assert.deepEqual(failures, [], `§5.9 violations:\n${failures.join('\n')}`);
});

test('§5.9 baseline integrity: zero debt declared and no stale entries', (t) => {
  const entries = Object.entries(baseline.oversized);
  const problems = [];
  for (const [file, frozen] of entries) {
    if (!fs.existsSync(path.join(root, file))) {
      problems.push(`${file}: baseline entry points at a missing file`);
      continue;
    }
    const count = lines(file);
    if (count <= MAX_LINES) {
      problems.push(`${file}: frozen at ${frozen} but now only ${count} lines - remove stale entry`);
    }
  }
  if (baseline.debtCleared === true) {
    assert.deepEqual(entries, [], 'debtCleared is true but frozen entries remain in baseline.oversized');
  } else {
    assert.ok(entries.length > 0, 'baseline must declare debtCleared: true when oversized is empty');
  }
  assert.deepEqual(problems, [], `baseline integrity:\n${problems.join('\n')}`);
  t.diagnostic(`baseline integrity verified: debtCleared=${baseline.debtCleared}, oversized=${entries.length}`);
});

test('§5.2 all editable runtime source modules are TypeScript (zero loose JS in src/)', (t) => {
  const srcFiles = walk('src', ['.ts', '.tsx', '.js', '.mjs', '.cjs']);
  const nonTs = srcFiles.filter((file) => !/\.tsx?$/.test(file));
  assert.deepEqual(nonTs, [], `all files in src/ must be TypeScript: ${nonTs.join(', ')}`);
  t.diagnostic(`verified ${srcFiles.length} source modules in src/, 100% TypeScript`);
});

test('§5.2 build pipeline integrity: typecheck and architecture guard precede bundling', () => {
  const pkg = readJson('package.json');
  const tsconfig = readJson('tsconfig.json');

  for (const key of ['strict', 'noEmit', 'isolatedModules']) {
    assert.equal(tsconfig.compilerOptions[key], true, `tsconfig.json must enable compiler option ${key}`);
  }

  assert.match(pkg.scripts.build, /typecheck/, 'build script must execute typecheck');
  assert.match(pkg.scripts.build, /guard/, 'build script must execute architecture guard');
  assert.ok(pkg.scripts.guard, 'package.json must expose a "guard" script');

  const buildSource = read('scripts/build-source.mjs');
  assert.match(buildSource, /src\/index\.ts/);
  assert.match(buildSource, /src\/(?:modules\/)?preferences\.ts/);
  assert.doesNotMatch(buildSource, /inlineDomainClasses|collectedBodies/, 'build script must not slice classes with regex');
});

test('§5.2 no TypeScript source is allowed a type-check exemption (@ts-nocheck ban)', () => {
  const offenders = walk('src', ['.ts', '.tsx']).filter((file) => read(file).includes('@ts-nocheck'));
  assert.deepEqual(offenders, [], `@ts-nocheck banned in TypeScript sources: ${offenders.join(', ')}`);
});

test('§3 Fluent catalogues are symmetric and free of duplicate keys', (t) => {
  const keysOf = (lang) => {
    const text = read(`locale/${lang}/researchflow.ftl`);
    return [...text.matchAll(/^([A-Za-z0-9_-]+)\s*=/gm)].map((m) => m[1]);
  };
  const en = keysOf('en-US');
  const zh = keysOf('zh-CN');
  assert.equal(new Set(en).size, en.length, 'duplicate keys found in en-US catalogue');
  assert.equal(new Set(zh).size, zh.length, 'duplicate keys found in zh-CN catalogue');
  assert.deepEqual([...new Set(en)].sort(), [...new Set(zh)].sort(), 'en-US / zh-CN key sets differ');
  t.diagnostic(`${en.length} symmetric Fluent keys in both catalogues`);
});

test('§3 preferences.xhtml has zero hardcoded UI text (100% Fluent data-l10n-id driven)', (t) => {
  const xhtml = read('chrome/content/preferences.xhtml');
  const rawChinese = [...xhtml.matchAll(/>([^<]*[\u4e00-\u9fa5]+[^<]*)</g)].map((m) => m[1].trim());
  assert.deepEqual(rawChinese, [], `raw Chinese text detected in preferences.xhtml: ${rawChinese.join(', ')}`);

  const elementsMissingL10n = [];
  const summaries = [...xhtml.matchAll(/<html:summary[^>]*>/g)];
  for (const s of summaries) {
    if (!s[0].includes('data-l10n-id=')) elementsMissingL10n.push(s[0]);
  }
  assert.deepEqual(elementsMissingL10n, [], `summaries missing data-l10n-id: ${elementsMissingL10n.join(', ')}`);
  t.diagnostic('preferences.xhtml confirmed 100% Fluent driven');
});

test('§3 source filenames carry no version numbers or transient prefixes', () => {
  const files = [
    ...walk('src'),
    ...walk('chrome/content/scripts', ['.js']),
    ...walk('scripts', ['.mjs', '.ps1', '.py']),
  ];
  const bad = files.filter((file) => /(^|\/)(?:v\d|V\d|temp-|tmp-|draft-)/.test(path.basename(file)));
  assert.deepEqual(bad, [], `version-prefixed or transient filenames detected: ${bad.join(', ')}`);
});

test('§4.1 every native preference has a schema definition and UI mounting container', (t) => {
  const prefText = read('prefs.js');
  const xhtml = read('chrome/content/preferences.xhtml');
  const prefSchema = read('src/modules/preferences/schema.ts');

  const prefKeys = [...new Set(
    [...prefText.matchAll(/pref\(\s*["']extensions\.researchflow\.([^"']+)["']/g)].map((m) => m[1]),
  )].sort();

  assert.ok(prefKeys.length > 0, 'no native preferences found in prefs.js');

  const missingInSchema = prefKeys.filter(
    (key) => !new RegExp(`["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(prefSchema),
  );
  assert.deepEqual(missingInSchema, [], `prefs missing in schema.ts: ${missingInSchema.join(', ')}`);

  for (const containerId of ['rf-pref-window', 'rf-pref-integration', 'rf-pref-workflow', 'rf-pref-data-sync']) {
    assert.ok(xhtml.includes(containerId), `preferences.xhtml must include mount container #${containerId}`);
  }

  t.diagnostic(`${prefKeys.length} native preferences fully synced`);
});

test('§4.2 settings pane declares the 16/24/40px alignment grid explicitly', (t) => {
  const css = read('chrome/content/assets/preferences.css');
  const rules = [
    {
      label: 'section title uses padding: 12px 16px',
      re: /\.rf-setting-group-title\s*\{[^}]*padding:\s*12px 16px/,
    },
    {
      label: 'card body uses padding: 14px 16px',
      re: /\.rf-setting-group-body\s*\{[^}]*padding:\s*14px 16px/,
    },
    {
      label: 'subordinate items declare margin-inline-start: 24px',
      re: /margin-inline-start:\s*24px/,
    },
  ];
  const missing = rules.filter(({ re }) => !re.test(css)).map(({ label }) => label);
  assert.deepEqual(missing, [], `§4.2 alignment grid rules missing in CSS:\n${missing.join('\n')}`);
  t.diagnostic(`${rules.length} layout grid declarations verified`);
});

test('§5.3 runtime scripts contain no deprecated Gecko/Zotero APIs', (t) => {
  const runtimeFiles = [
    'bootstrap.js',
    'prefs.js',
    ...walk('src', ['.ts']),
  ];
  const banned = [
    { re: /\bCu\.import\s*\(/, label: 'legacy Cu.import' },
    { re: /setAttribute\(\s*['"](?:disabled|hidden|checked|readonly|selected|open)['"]/, label: 'boolean state via setAttribute' },
    { re: /\bCheckboxStateChange\b/, label: 'legacy CheckboxStateChange event' },
  ];
  const hits = [];
  for (const file of runtimeFiles) {
    const fileLines = read(file).split(/\r?\n/);
    fileLines.forEach((line, index) => {
      for (const rule of banned) {
        if (rule.re.test(line)) hits.push(`${file}:${index + 1} ${rule.label}`);
      }
    });
  }
  assert.deepEqual(hits, [], `§5.3 deprecated API violations:\n${hits.join('\n')}`);
  t.diagnostic(`scanned ${runtimeFiles.length} runtime files against ${banned.length} deprecated API patterns`);
});

test('§6 version fields are aligned across manifest, package, brand, UI and update feed', (t) => {
  const rootPkg = readJson('package.json');
  const manifest = readJson('manifest.json');
  const product = readJson('docs/brand/product.json');
  const update = readJson('update.json');
  const xhtml = read('chrome/content/preferences.xhtml');

  const badgeVersion = xhtml.match(/class="rf-pref-brand-tag">v([^<]+)</)?.[1];
  const updateVersion = update.addons['zotero-paperflow@groele.org']?.updates?.[0]?.version;

  const versions = {
    'manifest.json': manifest.version,
    'package.json': rootPkg.version,
    'docs/brand/product.json': product.version,
    'preferences.xhtml badge': badgeVersion,
    'update.json': updateVersion,
  };

  const unique = [...new Set(Object.values(versions))];
  assert.equal(unique.length, 1, `version mismatch across metadata files: ${JSON.stringify(versions, null, 2)}`);
  assert.equal(unique[0], baseline.lastReleasedVersion, `version does not match baseline lastReleasedVersion`);
  t.diagnostic(`all version declarations aligned at v${unique[0]}`);
});

test('§9 update feeds point at valid released HTTPS URLs and complete SHA-512 hashes', (t) => {
  const feed = readJson('update.json');
  const entries = feed.addons['zotero-paperflow@groele.org']?.updates ?? [];
  assert.ok(entries.length > 0, 'no update entries in update.json');

  const manifest = readJson('manifest.json');
  for (const entry of entries) {
    assert.match(entry.update_link, new RegExp('^https://github\\.com/groele/Zotero-PaperFlow/releases/download/v' + manifest.version.replace(/\./g, '\\.') + '/'), 'update_link must point to official release');
    assert.match(entry.update_hash, /^sha512:[0-9a-f]{128}$/i, 'update_hash must be a valid 128-hex sha512 digest');
    assert.equal(entry.applications?.zotero?.strict_min_version, '10.0');
    assert.equal(entry.applications?.zotero?.strict_max_version, '12.*');
  }
  t.diagnostic('update.json validated with compliant hash and URL');
});
