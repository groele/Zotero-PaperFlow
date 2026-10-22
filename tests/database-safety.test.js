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

test('corrupt on-disk data stays intact instead of being replaced by defaults', async () => {
  const { runtime, files, state } = host();
  files.set('/data.json', '{invalid JSON');
  await assert.rejects(runtime.loadDatabase());
  assert.equal(files.get('/data.json'), '{invalid JSON');
  assert.equal(state.writes.length, 0);
  files.set('/data.json', JSON.stringify(database({ tasks: [{ id: 'recovered' }] })));
  assert.equal((await runtime.loadDatabase()).tasks[0].id, 'recovered');
});
