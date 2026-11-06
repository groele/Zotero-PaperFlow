#!/usr/bin/env node
/**
 * Zotero PaperFlow - Release Tags Validator
 * Validate or create immutable annotated SemVer release tags.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const VERSION_RE = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-(?:alpha|beta|rc)\.[1-9][0-9]*)?$/;

export function validTag(tag) {
  return typeof tag === 'string' && tag.startsWith('v') && VERSION_RE.test(tag.slice(1));
}

export function currentVersion(root = ROOT) {
  const versions = [];
  for (const filename of ['package.json', 'manifest.json']) {
    const file = path.join(root, filename);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const val = data.version;
      if (val && !val.startsWith('__')) {
        if (!VERSION_RE.test(val)) {
          throw new Error(`${filename} has an invalid version: ${val}`);
        }
        versions.push(val);
      }
    }
  }
  if (!versions.length || new Set(versions).size !== 1) {
    throw new Error(`Authoritative version fields disagree: ${versions.join(', ')}`);
  }
  return versions[0];
}

function git(...args) {
  return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

export function checkTag(tag, root = ROOT) {
  if (!validTag(tag)) {
    throw new Error('Expected vMAJOR.MINOR.PATCH or vMAJOR.MINOR.PATCH-(alpha|beta|rc).N');
  }
  if (tag !== 'v' + currentVersion(root)) {
    throw new Error('Tag and authoritative package version disagree');
  }
  if (git('cat-file', '-t', 'refs/tags/' + tag) !== 'tag') {
    throw new Error('New release tags must be annotated');
  }
  if (git('rev-parse', tag + '^{}') !== git('rev-parse', 'HEAD')) {
    throw new Error('Release tag must resolve to the checked-out commit');
  }
}

export function selfTest() {
  for (const val of ['v0.0.0', 'v12.6.0', 'v12.6.0-rc.1', 'v1.0.0-alpha.2', 'v1.0.0-beta.1']) {
    if (!validTag(val)) throw new Error(`Expected valid tag: ${val}`);
  }
  for (const val of ['V12.6.0', '12.6.0', 'v12', 'v12.6', 'v01.2.3', 'v1.2.3-rc.0', 'v1.2.3-rc.01', 'v1.2.3+build', 'refflow-v1.2.3', 'v1.2.3\n', '']) {
    if (validTag(val)) throw new Error(`Expected invalid tag: ${val}`);
  }
  console.log('Tag syntax self-test passed');
}

const args = process.argv.slice(2);
if (args.includes('--self-test')) {
  selfTest();
  console.log('Release version valid:', currentVersion());
} else if (args.includes('--create-tag')) {
  const tagIdx = args.indexOf('--create-tag') + 1;
  const tag = args[tagIdx];
  const version = currentVersion();
  if (!validTag(tag) || tag !== 'v' + version) {
    throw new Error('Requested tag must equal the authoritative version');
  }
  if (git('status', '--porcelain')) {
    throw new Error('Commit the reviewed release payload before tagging');
  }
  if (git('tag', '--list', tag)) {
    throw new Error('Existing tags are immutable; use a new version');
  }
  execFileSync('git', ['-C', ROOT, 'tag', '-a', tag, '-m', tag], { stdio: 'inherit' });
  checkTag(tag);
  console.log('Created tag:', tag);
} else if (args.includes('--tag')) {
  const tagIdx = args.indexOf('--tag') + 1;
  const tag = args[tagIdx];
  checkTag(tag);
  console.log('Release version valid:', currentVersion());
}
