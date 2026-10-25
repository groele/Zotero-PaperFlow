const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../chrome/content/scripts/index.js'), 'utf8');
const methods = source.slice(source.indexOf('    notifyDataChanged() {'), source.indexOf('    async saveShareImageFile('));
const plain = value => JSON.parse(JSON.stringify(value));
const db = (title = 'base') => ({ schemaVersion: 7, revision: 3, tasks: [{ id: 'a.[x]', title, note: 'original' }], settings: {} });
function fixture(options = {}) {
  const files = new Map();
  const context = vm.createContext({
    CHROME_ROOT: '', fetch: async () => ({ ok: false }),
    Zotero: { logError() {}, Utilities: { Internal: { md5: text => crypto.createHash('md5').update(text).digest('hex') } },
      getMainWindow: () => ({ Localization: class { formatValueSync(key) { return key; } } }) },
    PathUtils: { filename: path.posix.basename, parent: path.posix.dirname, join: path.posix.join },
    IOUtils: { exists: async file => files.has(file), getChildren: async () => [...files.keys()],
      stat: async file => { if (!files.has(file)) throw new Error('Missing file'); return { type: 'regular', size: Buffer.byteLength(files.get(file)) }; },
      readUTF8: async file => { if (!files.has(file)) throw new Error('Missing file'); return files.get(file); },
      writeUTF8: async (file, text) => { await options.beforeWrite?.(file, text); files.set(file, text); } }
  });
  const runtime = vm.runInContext(`({ ${methods} })`, context);
  runtime.getDataFilePath = () => '/data.json';
  runtime.notifyDataChanged = () => {};
  const id = 'data.json.conflict-123456-test.json';
  const base = db(), local = db('local'), current = db('current');
  current.revision = 5;
  local.tasks[0].note = 'independent local note';
  const draft = { format: 'zotero-paperflow-conflict-v1', createdAt: '2026-10-25T00:00:00Z', base, local, current };
  const write = () => { files.set('/data.json', JSON.stringify(current)); files.set('/' + id, JSON.stringify(draft)); };
  write();
  const call = (action, payload) => runtime.databaseConflictRecovery(action, payload);
  const inspect = () => call('inspect', { id });
  const preview = async (choice = 'local') => { const view = await inspect(); return call('preview', { token: view.token,
    choices: Object.fromEntries(view.rows.map(row => [row.key, choice])) }); };
  return { runtime, files, id, draft, current, write, call, inspect, preview, disk: () => JSON.parse(files.get('/data.json')) };
}

test('recovery lists only sibling drafts, previews independent edits, backs up and commits once', async () => {
  const f = fixture();
  f.files.set('/data.json.conflict-1-bad.json.tmp', '{}');
  const list = await f.call('list');
  assert.deepEqual(plain(list.entries.map(item => item.id)), [f.id]);
  const view = await f.inspect();
  assert.equal(view.rows.length, 1);
  assert.equal(view.rows[0].path, 'tasks[a.[x]].title');
  assert.equal(view.rows[0].base.text, '"base"');
  const preview = await f.preview();
  assert.equal(preview.changes.length, 2);
  assert.equal(f.disk().tasks[0].title, 'current');
  const result = await f.call('apply', { token: preview.token });
  assert.equal(result.data.revision, 6);
  assert.equal(f.disk().tasks[0].title, 'local');
  assert.equal(f.disk().tasks[0].note, 'independent local note');
  assert.deepEqual(JSON.parse(f.files.get('/' + result.backup)), f.current);
  assert.ok(f.files.has('/' + f.id));
  assert.equal((await f.call('list')).entries[0].resolved, true);
  await assert.rejects(f.call('apply', { token: preview.token }), /expired/);
  await assert.rejects(f.inspect(), /resolved/);
});

for (const stage of ['preview', 'apply']) test(`${stage} rejects an external same-revision disk change despite a stale cache`, async () => {
  const f = fixture();
  f.runtime._cachedData = db('obsolete cache');
  const token = stage === 'preview' ? (await f.inspect()).token : (await f.preview()).token;
  f.current.tasks[0].note = 'new disk edit'; f.files.set('/data.json', JSON.stringify(f.current));
  await assert.rejects(f.call(stage, { token, choices: {} }), /stale/);
  assert.equal(f.disk().tasks[0].note, 'new disk edit');
  assert.equal([...f.files.keys()].filter(key => key.includes('before-recovery')).length, 0);
});

test('changes made while recovery backup is being written cancel the commit', async () => {
  let f;
  f = fixture({ beforeWrite: async file => { if (file.includes('before-recovery')) {
    f.current.tasks[0].title = 'concurrent'; f.files.set('/data.json', JSON.stringify(f.current));
  } } });
  await assert.rejects(f.call('apply', { token: (await f.preview()).token }), /stale/);
  assert.equal(f.disk().tasks[0].title, 'concurrent');
});

for (const target of ['backup', 'main']) test(`${target} write failure preserves data and draft and permits retry`, async () => {
  let fail = true;
  const f = fixture({ beforeWrite: async file => { if (fail && (target === 'backup' ? file.includes('before-recovery') : file === '/data.json')) throw new Error('disk full'); } });
  const preview = await f.preview();
  await assert.rejects(f.call('apply', { token: preview.token }), /disk full/);
  assert.equal(f.disk().tasks[0].title, 'current'); assert.ok(f.files.has('/' + f.id));
  fail = false;
  assert.equal((await f.call('apply', { token: preview.token })).data.tasks[0].title, 'local');
});

test('receipt failure reports a successful commit with warning, without replaying its token', async () => {
  const f = fixture({ beforeWrite: async file => { if (file.endsWith('.resolved.json')) throw new Error('receipt unavailable'); } });
  const preview = await f.preview();
  const result = await f.call('apply', { token: preview.token });
  assert.equal(result.warning, true); assert.equal(f.disk().revision, 6);
  await assert.rejects(f.call('apply', { token: preview.token }), /expired/);
});

test('missing baseline, malformed draft and traversal are rejected without changing originals', async () => {
  const f = fixture();
  for (const id of ['../data.json', '/data.json', 'data.json.conflict-123456-test.json/extra']) await assert.rejects(f.call('inspect', { id }), /invalid/);
  f.draft.base = null; f.write(); await assert.rejects(f.inspect(), /base/);
  f.files.set('/' + f.id, '{broken'); await assert.rejects(f.inspect());
  assert.equal(f.disk().tasks[0].title, 'current');
});

test('every conflict requires an explicit valid choice and only a preview token may apply', async () => {
  const f = fixture(); const view = await f.inspect();
  for (const choices of [{}, { injected: 'local' }, { [view.rows[0].key]: 'evil' }]) {
    await assert.rejects(f.call('preview', { token: view.token, choices }), /choice/);
  }
  await assert.rejects(f.call('apply', { token: view.token }), /expired/);
  const preview = await f.preview('base');
  assert.equal((await f.call('apply', { token: preview.token })).data.tasks[0].title, 'base');
});

test('deletion and null remain distinct and strange record IDs never become mutation paths', async () => {
  const f = fixture();
  delete f.draft.local.tasks[0].title;
  f.current.tasks[0].title = null; f.write();
  const view = await f.inspect(); assert.equal(view.rows[0].local.exists, false);
  assert.equal(view.rows[0].current.text, 'null');
  const result = await f.call('apply', { token: (await f.preview()).token });
  assert.equal(Object.hasOwn(result.data.tasks[0], 'title'), false);
  assert.equal(result.data.tasks[0].id, 'a.[x]');
});

test('order choice does not discard independent edits or additions in either window', async () => {
  const f = fixture(); const base = [{ id: 'a', v: 0 }, { id: 'b', v: 0 }, { id: 'c', v: 0 }];
  const local = [{ id: 'b', v: 1 }, { id: 'a', v: 0 }, { id: 'c', v: 0 }, { id: 'new' }];
  const current = [{ id: 'a', v: 0 }, { id: 'c', v: 2 }, { id: 'b', v: 0 }, { id: 'other' }];
  const info = f.runtime.mergeDatabaseEdits({ tasks: base }, { tasks: local }, { tasks: current }, { details: true });
  assert.equal(info.details.length, 1); assert.equal(info.details[0].kind, 'order');
  const result = f.runtime.mergeDatabaseEdits({ tasks: base }, { tasks: local }, { tasks: current }, { choices: { [info.details[0].key]: 'local' } });
  assert.deepEqual(plain(result.data.tasks.map(item => item.id)), ['b', 'a', 'c', 'new', 'other']);
  assert.equal(result.data.tasks[0].v, 1); assert.equal(result.data.tasks[2].v, 2);
});

test('recovery masks credentials in comparison and preview, keeping the selected underlying value', async () => {
  const f = fixture();
  for (const [value, secret] of [[f.draft.base, 'old-secret'], [f.draft.local, 'local-secret'], [f.current, 'current-secret']]) value.settings = { token: secret };
  f.write();
  assert.ok(!JSON.stringify(await f.inspect()).includes('secret'));
  const preview = await f.preview(); assert.ok(!JSON.stringify(preview).includes('secret'));
  assert.equal((await f.call('apply', { token: preview.token })).data.settings.token, 'local-secret');
});

test('changed draft bytes, expired tokens and more than eight open inspections require a new review', async () => {
  const f = fixture(); const old = await f.inspect();
  f.files.set('/' + f.id, f.files.get('/' + f.id) + ' ');
  await assert.rejects(f.call('preview', { token: old.token, choices: {} }), /stale/);
  const view = await f.inspect();
  f.runtime._recoveryTokens.get(view.token).time = 0;
  await assert.rejects(f.call('preview', { token: view.token, choices: {} }), /expired/);
  const first = await f.inspect(); for (let i = 0; i < 8; i++) await f.inspect();
  await assert.rejects(f.call('preview', { token: first.token, choices: {} }), /expired/);
  assert.equal(f.runtime._recoveryTokens.size, 8);
});

test('delete-versus-edit recovery keeps new current records and preserves whole-record deletion', async () => {
  const f = fixture(); f.draft.local.tasks = []; f.current.tasks.push({ id: 'later', title: 'keep' }); f.write();
  const view = await f.inspect(); assert.equal(view.rows.length, 1); assert.equal(view.rows[0].local.exists, false);
  const saved = await f.call('apply', { token: (await f.preview()).token });
  assert.deepEqual(plain(saved.data.tasks), [{ id: 'later', title: 'keep' }]);
});

test('receipts prevent repeated restoration after a host restart', async () => {
  const f = fixture(); await f.call('apply', { token: (await f.preview()).token });
  f.runtime._recoveryTokens = null; f.runtime._cachedData = null;
  assert.equal((await f.call('list')).entries[0].resolved, true);
  await assert.rejects(f.inspect(), /resolved/);
});
