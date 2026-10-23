const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../chrome/content/scripts/index.js'), 'utf8');
const start = source.indexOf('    notifyDataChanged() {');
const end = source.indexOf('    async saveShareImageFile(', start);
assert.ok(start >= 0 && end > start, 'Host database methods must be present');
const methods = source.slice(start, end);
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
    Zotero: { logError: error => state.errors.push(String(error)), getMainWindow: () => ({ Localization: class {
      formatValueSync(key, args) { return `${key}: ${JSON.stringify(args)}`; }
    } }) },
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
  const runtime = vm.runInContext(`({ _cachedData: null, ${methods} })`, context);
  runtime.getDataFilePath = () => '/data.json';
  runtime.getBackupFilePath = () => '/backup.json';
  runtime.notifyDataChanged = () => { state.notifications++; };
  return { runtime, state, files, disk: () => JSON.parse(files.get('/data.json')) };
}

test('merge retains local and imported research areas and all six collections', async () => {
  const keys = ['researchAreas', 'projects', 'researchRecords', 'manuscripts', 'submissions', 'tasks'];
  const initial = database(Object.fromEntries(keys.map(key => [key, [{ id: key + '-local' }]])));
  const imported = database(Object.fromEntries(keys.map(key => [key, [{ id: key + '-imported' }]])));
  const { runtime, files } = host(initial);
  const saved = await runtime.importDatabase(imported);
  for (const key of keys) assert.deepEqual(plain(saved[key].map(item => item.id)), [key + '-local', key + '-imported']);
  assert.deepEqual(JSON.parse(files.get('/backup.json')), initial);
});

test('merge preserves nested settings, review history and unknown record fields', async () => {
  const { runtime } = host(database({ settings: { profile: { language: 'zh', theme: 'dark' } },
    submissions: [{ id: 's', reviews: [{ id: 'review', reply: 'response' }], custom: { tracked: true } }] }));
  const saved = await runtime.importDatabase({ tasks: [], settings: { profile: { displayName: 'Reader' } },
    submissions: [{ id: 's', status: 'revision' }] });
  assert.deepEqual(plain(saved.settings.profile), { language: 'zh', theme: 'dark', displayName: 'Reader' });
  assert.equal(saved.submissions[0].reviews[0].reply, 'response');
  assert.equal(saved.submissions[0].custom.tracked, true);
  assert.equal(saved.submissions[0].status, 'revision');
});

test('pending save commits before import reads and backs up the current database', async () => {
  const gate = deferred();
  let first = true;
  const { runtime, files, disk } = host(database(), { beforeWrite: async file => {
    if (file === '/data.json' && first) { first = false; await gate.promise; }
  } });
  await runtime.loadDatabase();
  const save = runtime.saveDatabase(database({ projects: [{ id: 'just-saved' }] }));
  const importing = runtime.importDatabase({ projects: [{ id: 'imported' }] });
  await new Promise(resolve => setImmediate(resolve));
  gate.resolve();
  await Promise.all([save, importing]);
  assert.deepEqual(disk().projects.map(item => item.id), ['just-saved', 'imported']);
  assert.deepEqual(JSON.parse(files.get('/backup.json')).projects, [{ id: 'just-saved' }]);
});

test('simultaneous imports retain both batches and backup the immediately preceding state', async () => {
  const { runtime, files, disk } = host(database({ projects: [{ id: 'local' }] }));
  await Promise.all([
    runtime.importDatabase({ projects: [{ id: 'first' }] }),
    runtime.importDatabase({ projects: [{ id: 'second' }] })
  ]);
  assert.deepEqual(disk().projects.map(item => item.id), ['local', 'first', 'second']);
  assert.deepEqual(JSON.parse(files.get('/backup.json')).projects.map(item => item.id), ['local', 'first']);
});

test('queued save captures its payload before the caller can mutate it', async () => {
  const { runtime, disk } = host();
  const data = database({ projects: [{ id: 'p', title: 'submitted' }] });
  const saving = runtime.saveDatabase(data);
  data.projects[0].title = 'later edit';
  await saving;
  assert.equal(disk().projects[0].title, 'submitted');
});

test('reads and saved results cannot mutate host cache or backup without a save', async () => {
  const { runtime, files, disk } = host(database({ tasks: [{ id: 't', title: 'original' }] }));
  const loaded = await runtime.loadDatabase();
  loaded.tasks[0].title = 'unsaved';
  assert.equal((await runtime.loadDatabase()).tasks[0].title, 'original');
  const saved = await runtime.saveDatabase(database({ tasks: [{ id: 't', title: 'saved' }] }));
  saved.tasks[0].title = 'changed result';
  await runtime.importDatabase({ projects: [] });
  assert.equal(disk().tasks[0].title, 'saved');
  assert.equal(JSON.parse(files.get('/backup.json')).tasks[0].title, 'saved');
});

for (const [name, invalid] of [
  ['future schema', { schemaVersion: 8, tasks: [] }],
  ['non-array collection', { tasks: [], projects: {} }],
  ['missing record ID', { tasks: [{ title: 'no ID' }] }],
  ['duplicate record IDs', { tasks: [{ id: 'same' }, { id: 'same' }] }],
  ['primitive record', { tasks: ['not a record'] }],
  ['array settings', { tasks: [], settings: [] }],
  ['malformed deletion log', { tasks: [], deletedEntities: { tasks: {} } }]
]) {
  test(`rejects ${name} before changing database or existing recovery backup`, async () => {
    const { runtime, files, state, disk } = host();
    files.set('/backup.json', 'previous recovery backup');
    await assert.rejects(runtime.importDatabase(invalid));
    assert.deepEqual(disk(), database());
    assert.equal(files.get('/backup.json'), 'previous recovery backup');
    assert.equal(state.writes.length, 0);
  });
}

test('failed backup leaves database intact and the next import can retry', async () => {
  let fail = true;
  const { runtime, disk } = host(database(), { beforeWrite: async file => {
    if (file === '/backup.json' && fail) throw new Error('Backup permission denied');
  } });
  await assert.rejects(runtime.importDatabase({ projects: [{ id: 'p' }] }), /Backup permission/);
  assert.deepEqual(disk(), database());
  fail = false;
  assert.equal((await runtime.importDatabase({ projects: [{ id: 'p' }] })).projects.length, 1);
});

test('failed database write keeps committed cache and recoverable pre-import snapshot', async () => {
  let fail = true;
  const initial = database({ projects: [{ id: 'local' }] });
  const { runtime, files, disk, state } = host(initial, { beforeWrite: async file => {
    if (file === '/data.json' && fail) throw new Error('Disk full');
  } });
  await runtime.loadDatabase();
  await assert.rejects(runtime.importDatabase({ projects: [{ id: 'imported' }] }), /Disk full/);
  assert.deepEqual(disk(), initial);
  assert.deepEqual(plain(await runtime.loadDatabase()), initial);
  assert.deepEqual(JSON.parse(files.get('/backup.json')), initial);
  assert.equal(state.notifications, 0);
  fail = false;
  await runtime.importDatabase({ projects: [{ id: 'retry' }] });
  assert.equal(disk().projects.length, 2);
});

test('restore validates backups before writing and succeeds after a failed attempt', async () => {
  const { runtime, files, disk } = host();
  files.set('/backup.json', JSON.stringify({ schemaVersion: 99, tasks: [] }));
  await assert.rejects(runtime.restoreBackupDatabase());
  assert.deepEqual(disk(), database());
  const restored = database({ projects: [{ id: 'restored' }] });
  files.set('/backup.json', JSON.stringify(restored));
  assert.equal((await runtime.restoreBackupDatabase()).projects[0].id, 'restored');
});

test('overwrite replaces collections while merge respects deletion logs', async () => {
  const { runtime } = host(database({ projects: [{ id: 'local' }],
    deletedEntities: { tasks: [{ id: 'deleted', deletedAt: '2026-10-22T00:00:00Z' }] } }));
  const merged = await runtime.importDatabase({ tasks: [
    { id: 'deleted', updatedAt: '2026-10-21T00:00:00Z' }, { id: 'kept' }
  ], deletedEntities: { tasks: [{ id: 'other', deletedAt: '2026-10-20T00:00:00Z' }] } });
  assert.deepEqual(plain(merged.tasks.map(item => item.id)), ['kept']);
  assert.equal(merged.deletedEntities.tasks.length, 2);
  const replaced = await runtime.importDatabase({ projects: [{ id: 'replacement' }] }, 'overwrite');
  assert.deepEqual(plain(replaced.projects.map(item => item.id)), ['replacement']);
});

test('first-run initialization and repeated reads use a single queued commit', async () => {
  const { runtime, state } = host(null);
  const [a, b] = await Promise.all([runtime.loadDatabase(), runtime.loadDatabase()]);
  assert.equal(state.writes.length, 1);
  assert.deepEqual(plain(a), plain(b));
});

test('queued imports capture their payload and invalid modes do not replace backups', async () => {
  const { runtime, files } = host();
  const incoming = { tasks: [{ id: 'submitted' }] };
  const importing = runtime.importDatabase(incoming);
  incoming.tasks[0].id = 'mutated-after-call';
  assert.equal((await importing).tasks[0].id, 'submitted');
  const backup = files.get('/backup.json');
  await assert.rejects(runtime.importDatabase({ tasks: [] }, 'unsupported'));
  assert.equal(files.get('/backup.json'), backup);
});

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
