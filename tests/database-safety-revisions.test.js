const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../chrome/content/scripts/index.js'), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const database = overrides => ({ schemaVersion: 7, revision: 3, researchAreas: [], projects: [],
  researchRecords: [], manuscripts: [], submissions: [], tasks: [], settings: {}, ...overrides });
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

function host(initial = database(), options = {}) {
  const files = new Map(initial === null ? [] : [['/data.json', JSON.stringify(initial)]]);
  const state = { writes: [], notifications: 0, errors: [] };
  const context = vm.createContext({
    CHROME_ROOT: 'chrome://researchflow/content/',
    TextEncoder, TextDecoder,
    Zotero: {
      log() {},
      logError: error => state.errors.push(String(error)),
      Prefs: { get() {}, set() {} },
      Utilities: { Internal: { md5: text => crypto.createHash('md5').update(text).digest('hex') } },
      getMainWindow: () => ({ Localization: class {
        formatValueSync(key, args) { return key + ': ' + JSON.stringify(args); }
      } })
    },
    Services: { wm: { getEnumerator: () => ({ hasMoreElements: () => false }) } },
    PathUtils: { filename: path.posix.basename, parent: path.posix.dirname, join: path.posix.join },
    fetch: async () => ({ ok: false }),
    IOUtils: {
      exists: async file => files.has(file),
      readUTF8: async file => { if (!files.has(file)) throw new Error('Missing file'); return files.get(file); },
      writeUTF8: async (file, text, settings) => {
        await options.beforeWrite?.(file, text);
        files.set(file, text);
        state.writes.push({ file, data: JSON.parse(text), settings });
      }
    }
  });
  vm.runInContext(source, context);
  const runtime = context.Zotero.ResearchFlow;
  runtime._cachedData = null;
  runtime.getSyncedSettingsFromPrefs = undefined;
  runtime.getDataFilePath = () => '/data.json';
  runtime.getBackupFilePath = () => '/backup.json';
  runtime.notifyDataChanged = () => { state.notifications++; };
  return { runtime, state, files, disk: () => JSON.parse(files.get('/data.json')) };
}


test('a stale full-database save is rejected without overwriting the newer committed snapshot', async () => {
  const initial = database({ revision: 4, projects: [{ id: 'project', title: 'newer title' }] });
  const { runtime, disk, files } = host(initial);
  await runtime.loadDatabase();
  const stale = database({ revision: 5, projects: [{ id: 'project', title: 'stale title' }] });
  await assert.rejects(runtime.saveDatabase(stale, { expectedRevision: 3 }), /merge-conflict/);
  assert.deepEqual(disk(), initial);
  assert.equal(files.has('/backup.json'), false);
  assert.equal((await runtime.loadDatabase()).projects[0].title, 'newer title');
});

test('revision-checked saves serialize and merge independent stale writers', async () => {
  const { runtime, disk } = host(database({ revision: 3 }));
  await runtime.loadDatabase();
  const first = database({ revision: 4, projects: [{ id: 'first' }] });
  const second = database({ revision: 4, projects: [{ id: 'second' }] });
  const results = await Promise.allSettled([
    runtime.saveDatabase(first, { expectedRevision: 3 }),
    runtime.saveDatabase(second, { expectedRevision: 3 })
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 2);
  assert.deepEqual(disk().projects.map(item => item.id), ['first', 'second']);
  assert.equal(disk().revision, 5);
});

test('imports and restores advance the local revision and invalidate stale editors', async () => {
  const { runtime, disk } = host(database({ revision: 3 }));
  const editor = await runtime.loadDatabase();
  const imported = await runtime.importDatabase(database({ revision: 900, tasks: [{ id: 'imported' }] }));
  assert.equal(imported.revision, 4, 'Imported revision must not replace the local commit counter');
  await assert.rejects(runtime.saveDatabase(editor, { expectedRevision: editor.revision, replace: true }), /merge-conflict/);
  const restored = await runtime.restoreBackupDatabase();
  assert.equal(restored.revision, 5, 'Restoring an old backup must not rewind the commit counter');
  await assert.rejects(runtime.saveDatabase(imported, { expectedRevision: imported.revision }), /merge-conflict/);
  assert.equal(disk().revision, 5);
});

test('host revisions advance even when a caller reuses the same payload revision', async () => {
  const { runtime } = host(database({ revision: 3 }));
  const first = await runtime.saveDatabase(database({ revision: 3 }));
  const second = await runtime.saveDatabase(database({ revision: 3 }));
  assert.equal(first.revision, 4);
  assert.equal(second.revision, 5);
});

test('a validated backup can still restore a corrupt uncached database', async () => {
  const { runtime, files, disk } = host();
  files.set('/data.json', '{corrupt');
  files.set('/backup.json', JSON.stringify(database({ revision: 7, tasks: [{ id: 'recovered' }] })));
  const restored = await runtime.restoreBackupDatabase();
  assert.equal(restored.revision, 8);
  assert.equal(disk().tasks[0].id, 'recovered');
});

test('three-way merge preserves independent fields, nested settings and review replies', async () => {
  const initial = database({ manuscripts: [{ id: 'm', title: 'base', status: 'draft' }],
    submissions: [{ id: 's', reviews: [{ id: 'r', reply: 'base', done: false }] }],
    settings: { profile: { theme: 'light', language: 'en' } } });
  const { runtime } = host(initial);
  const a = await runtime.loadDatabase(), b = await runtime.loadDatabase();
  a.manuscripts[0].title = 'new title';
  a.submissions[0].reviews[0].reply = 'new reply';
  a.settings.profile.theme = 'dark';
  await runtime.saveDatabase(a, { expectedRevision: 3 });
  b.manuscripts[0].status = 'submitted';
  b.submissions[0].reviews[0].done = true;
  b.settings.profile.language = 'zh';
  const merged = await runtime.saveDatabase(b, { expectedRevision: 3 });
  assert.deepEqual(plain(merged.manuscripts[0]), { id: 'm', title: 'new title', status: 'submitted' });
  assert.deepEqual(plain(merged.submissions[0].reviews[0]), { id: 'r', reply: 'new reply', done: true });
  assert.deepEqual(plain(merged.settings.profile), { theme: 'dark', language: 'zh' });
});

test('overlapping edits preserve base and both versions in a local draft without partial commits', async () => {
  const { runtime, files, disk } = host(database({ projects: [{ id: 'p', title: 'base' }] }));
  const a = await runtime.loadDatabase(), b = await runtime.loadDatabase();
  a.projects[0].title = 'first';
  await runtime.saveDatabase(a, { expectedRevision: 3 });
  const before = files.get('/data.json');
  b.projects[0].title = 'second';
  b.tasks.push({ id: 'also-unsaved' });
  await assert.rejects(runtime.saveDatabase(b, { expectedRevision: 3 }), /projects\[p\]\.title/);
  assert.equal(files.get('/data.json'), before);
  const draftName = Array.from(files.keys()).find(file => file.startsWith('/data.json.conflict-'));
  const draft = JSON.parse(files.get(draftName));
  assert.equal(draft.base.projects[0].title, 'base');
  assert.equal(draft.local.projects[0].title, 'second');
  assert.equal(draft.current.projects[0].title, 'first');
  assert.equal(draft.local.tasks[0].id, 'also-unsaved');
  assert.equal(disk().tasks.length, 0);
});

test('delete versus edit is a conflict while independent deletions and additions merge', async () => {
  const { runtime, disk } = host(database({ projects: [{ id: 'p', title: 'base' }, { id: 'q' }] }));
  const edited = await runtime.loadDatabase();
  const deleted = plain(edited);
  deleted.projects = deleted.projects.filter(item => item.id !== 'p');
  await runtime.saveDatabase(deleted, { expectedRevision: 3 });
  edited.projects[0].title = 'local edit';
  await assert.rejects(runtime.saveDatabase(edited, { expectedRevision: 3 }), /merge-conflict/);
  assert.deepEqual(disk().projects.map(item => item.id), ['q']);
  const base = await runtime.loadDatabase();
  const other = plain(base);
  base.projects = [];
  await runtime.saveDatabase(base, { expectedRevision: 4 });
  other.tasks.push({ id: 'new-task' });
  const merged = await runtime.saveDatabase(other, { expectedRevision: 4 });
  assert.equal(merged.projects.length, 0);
  assert.equal(merged.tasks[0].id, 'new-task');
});

test('draft write failures report failure and do not overwrite the database', async () => {
  const { runtime, files } = host(database({ tasks: [{ id: 't', title: 'base' }] }), {
    beforeWrite: async file => { if (file.includes('.conflict-')) throw new Error('Disk full'); }
  });
  const a = await runtime.loadDatabase(), b = await runtime.loadDatabase();
  a.tasks[0].title = 'first';
  await runtime.saveDatabase(a, { expectedRevision: 3 });
  const before = files.get('/data.json');
  b.tasks[0].title = 'second';
  await assert.rejects(runtime.saveDatabase(b, { expectedRevision: 3 }), /conflict-draft-failed/);
  assert.equal(files.get('/data.json'), before);
});

test('expired merge history and overwrite imports cannot resurrect old editor data', async () => {
  const { runtime, disk } = host(database({ projects: [{ id: 'old' }] }));
  const editor = await runtime.loadDatabase();
  for (let i = 0; i < 15; i++) await runtime.saveDatabase(database({ tasks: [{ id: 'latest' }] }));
  editor.tasks.push({ id: 'old-window' });
  await assert.rejects(runtime.saveDatabase(editor, { expectedRevision: 3 }), /merge-conflict/);
  assert.ok(runtime._databaseHistory.size <= 12);
  const beforeOverwrite = await runtime.loadDatabase();
  await runtime.importDatabase(database({ tasks: [{ id: 'replacement' }] }), 'overwrite');
  await assert.rejects(runtime.saveDatabase(beforeOverwrite, { expectedRevision: beforeOverwrite.revision }), /merge-conflict/);
  assert.equal(disk().tasks[0].id, 'replacement');
});

test('a local reorder survives an independent field edit and incompatible reorders conflict', async () => {
  const { runtime } = host(database({ tasks: [{ id: 'a', title: 'base' }, { id: 'b' }, { id: 'c' }] }));
  const first = await runtime.loadDatabase(), local = await runtime.loadDatabase();
  first.tasks[0].title = 'new title';
  await runtime.saveDatabase(first, { expectedRevision: 3 });
  local.tasks.reverse();
  const merged = await runtime.saveDatabase(local, { expectedRevision: 3 });
  assert.deepEqual(plain(merged.tasks.map(item => item.id)), ['c', 'b', 'a']);
  assert.equal(merged.tasks[2].title, 'new title');
  const a = await runtime.loadDatabase(), b = await runtime.loadDatabase();
  a.tasks.reverse();
  b.tasks = [b.tasks[1], b.tasks[0], b.tasks[2]];
  await runtime.saveDatabase(a, { expectedRevision: 5 });
  await assert.rejects(runtime.saveDatabase(b, { expectedRevision: 5 }), /tasks.order/);
});

test('corrupt on-disk data stays intact instead of being replaced by defaults', async () => {
  const { runtime, files, state } = host();
  files.set('/data.json', '{invalid JSON');
  await assert.rejects(runtime.loadDatabase());
  assert.equal(files.get('/data.json'), '{invalid JSON');
  assert.equal(state.writes.length, 0);
  files.set('/data.json', JSON.stringify(database({ tasks: [{ id: 'recovered' }] })));
  assert.equal((await runtime.loadDatabase()).tasks[0].id, 'recovered');
});
