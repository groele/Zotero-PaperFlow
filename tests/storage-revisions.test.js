const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../chrome/content/scripts/storage.js'), 'utf8');
function engine(globals = {}) {
  const context = vm.createContext({ console, ...globals });
  vm.runInContext(source, context);
  const storage = context.storage;
  storage.ensureDbShape = async data => ({ ...data, revision: data.revision + 1 });
  storage.shouldRunCloudSync = async () => false;
  return storage;
}

test('GitHub creation preflight merges a file created by another device before using its SHA', async () => {
  const storage = engine({ btoa: value => Buffer.from(value, 'binary').toString('base64'),
    atob: value => Buffer.from(value, 'base64').toString('binary'), TextDecoder, unescape, encodeURIComponent });
  const database = id => ({ revision: 1, settings: {}, deletedEntities: {}, tasks: [{ id, title: id }] });
  const local = database('local'), remote = database('other-device');
  let written;
  storage.fetchWithTimeout = async (_url, options = {}) => {
    if (options.method === 'PUT') {
      written = JSON.parse(options.body);
      return { ok: true, json: async () => ({ content: { sha: 'committed-sha' } }) };
    }
    return { ok: true, json: async () => ({ sha: 'created-sha', content: Buffer.from(JSON.stringify(remote)).toString('base64') }) };
  };
  await storage.saveToGitHub({ token: 'fixture', repo: 'fixture/repo' }, local);
  const payload = JSON.parse(Buffer.from(written.content, 'base64').toString('utf8'));
  assert.deepEqual(payload.tasks.map(task => task.id).sort(), ['local', 'other-device']);
  assert.equal(written.sha, 'created-sha');
  assert.deepEqual(Array.from(local.tasks, task => task.id).sort(), ['local', 'other-device']);
  assert.equal(local._github_sha, 'committed-sha');
});

test('a second GitHub race retains both preflight and conflict-refresh records', async () => {
  const storage = engine({ btoa: value => Buffer.from(value, 'binary').toString('base64'),
    atob: value => Buffer.from(value, 'base64').toString('binary'), TextDecoder, unescape, encodeURIComponent });
  const database = id => ({ revision: 1, settings: {}, deletedEntities: {}, tasks: [{ id }] });
  const local = database('local'), writes = [];
  let reads = 0;
  storage.fetchWithTimeout = async (_url, options = {}) => {
    if (options.method === 'PUT') {
      writes.push(JSON.parse(options.body));
      return writes.length === 1 ? { status: 409 } : { ok: true, json: async () => ({ content: { sha: 'saved' } }) };
    }
    const remote = database(++reads === 1 ? 'first-remote' : 'second-remote');
    return { ok: true, json: async () => ({ sha: 'remote-' + reads, content: Buffer.from(JSON.stringify(remote)).toString('base64') }) };
  };
  await storage.saveToGitHub({ repo: 'fixture/repo' }, local);
  assert.equal(writes.length, 2);
  const saved = JSON.parse(Buffer.from(writes[1].content, 'base64').toString('utf8'));
  assert.deepEqual(saved.tasks.map(task => task.id).sort(), ['first-remote', 'local', 'second-remote']);
  assert.equal(writes[1].sha, 'remote-2');
  assert.equal(local._github_sha, 'saved');
});

test('a failed GitHub preflight never writes remote data or mutates the local snapshot', async () => {
  const storage = engine(), local = { revision: 1, tasks: [{ id: 'local' }] };
  const before = JSON.stringify(local);
  let writes = 0;
  storage.fetchWithTimeout = async (_url, options = {}) => {
    if (options.method === 'PUT') writes++;
    return { ok: false, status: 503, statusText: 'Unavailable' };
  };
  await assert.rejects(storage.saveToGitHub({ repo: 'fixture/repo' }, local), /GitHub fetch failed/);
  assert.equal(writes, 0);
  assert.equal(JSON.stringify(local), before);
});

test('direct host saves send the editor revision and adopt the committed revision', async () => {
  let observed;
  const storage = engine({ window: { Zotero: { ResearchFlow: {
    saveDatabase: async (data, options) => {
      observed = options.expectedRevision;
      return { ...data, revision: 8 };
    }
  } } } });
  const data = { revision: 3, tasks: [] };
  const saved = await storage.saveDatabase(data);
  assert.equal(observed, 3);
  assert.equal(saved.revision, 8);
  assert.equal(data.revision, 8);
});

test('bridge saves adopt the returned host snapshot instead of the predicted revision', async () => {
  let observed;
  const storage = engine({ ZoteroBridge: { isZotero: true, request: async (type, request) => {
    observed = request.expectedRevision;
    return { success: true, data: { ...request.payload, revision: 9 } };
  } } });
  const saved = await storage.saveDatabase({ revision: 3, tasks: [] });
  assert.equal(observed, 3);
  assert.equal(saved.revision, 9);
});

test('background persistence forwards revision checks and returns committed metadata', async () => {
  let observed;
  const storage = engine({ window: { Zotero: { ResearchFlow: {
    saveDatabase: async (data, options) => {
      observed = options.expectedRevision;
      return { ...data, revision: 6 };
    }
  } } } });
  const saved = await storage.persistLocal({ revision: 5, tasks: [] }, { expectedRevision: 4 });
  assert.equal(observed, 4);
  assert.equal(saved.revision, 6);
});

test('bridge background persistence forwards the precondition and propagates a rejected save', async () => {
  let observed;
  const storage = engine({ ZoteroBridge: { isZotero: true, request: async (type, request) => {
    observed = request.expectedRevision;
    return { success: false, error: 'Conflicting revision' };
  } } });
  await assert.rejects(storage.persistLocal({ revision: 5 }, { expectedRevision: 4 }), /Conflicting revision/);
  assert.equal(observed, 4);
});

test('local quota failure preserves the committed cache and reports an error instead of saved', async () => {
  const states = [];
  const storage = engine({
    window: { dispatchEvent: event => states.push(event.detail.state) },
    CustomEvent: class { constructor(type, options) { this.detail = options.detail; } },
    localStorage: { setItem() { throw new Error('QuotaExceededError'); } }
  });
  const committed = { revision: 3, tasks: [{ id: 'old' }] };
  storage.cache = committed;
  const edited = { revision: 3, tasks: [{ id: 'new' }] };
  await assert.rejects(storage.saveAll(edited), /QuotaExceededError/);
  assert.equal(storage.cache, committed);
  assert.equal(edited.revision, 3);
  assert.deepEqual(states, ['saving', 'error']);
});

test('unavailable local storage is a failed persistence operation', async () => {
  const storage = engine();
  await assert.rejects(storage.persistLocal({ revision: 1, tasks: [] }), /Local storage unavailable/);
});

test('successful local persistence writes the data before reporting saved', async () => {
  let written;
  const states = [];
  const storage = engine({
    window: { dispatchEvent: event => {
      if (event.detail.state === 'saved') assert.ok(written);
      states.push(event.detail.state);
    } },
    CustomEvent: class { constructor(type, options) { this.detail = options.detail; } },
    localStorage: { setItem(key, value) { assert.equal(key, 'researchflow_db'); written = JSON.parse(value); } }
  });
  const saved = await storage.saveAll({ revision: 2, tasks: [{ id: 'new' }] });
  assert.equal(written.tasks[0].id, 'new');
  assert.equal(saved.revision, 3);
  assert.deepEqual(states, ['saving', 'saved']);
});

test('edits while a native save is pending survive its response and rebase on committed metadata', async () => {
  let complete;
  let submitted;
  const storage = engine({ window: { Zotero: { ResearchFlow: {
    saveDatabase: (data) => {
      submitted = JSON.parse(JSON.stringify(data));
      return new Promise(resolve => { complete = resolve; });
    }
  } } } });
  const data = { revision: 3, tasks: [{ id: 'a', title: 'first' }] };
  const saving = storage.saveDatabase(data);
  await new Promise(resolve => setImmediate(resolve));
  data.tasks[0].title = 'typed while saving';
  complete({ ...submitted, revision: 8, projects: [{ id: 'remote' }] });
  const saved = await saving;
  assert.equal(saved, data);
  assert.equal(data.tasks[0].title, 'typed while saving');
  assert.equal(data.revision, 8);
  assert.equal(data.projects[0].id, 'remote');
  assert.equal(storage.cache.tasks[0].title, 'first');
});

test('save request and committed cache never share nested objects with the live editor', async () => {
  let submitted;
  const storage = engine({ window: { Zotero: { ResearchFlow: {
    saveDatabase: async data => { submitted = data; return { ...data, revision: 8 }; }
  } } } });
  const data = { revision: 3, tasks: [{ id: 'a', title: 'first' }] };
  const saved = await storage.saveDatabase(data);
  data.tasks[0].title = 'unsaved edit';
  assert.equal(submitted.tasks[0].title, 'first');
  assert.equal(storage.cache.tasks[0].title, 'first');
  assert.notEqual(storage.cache, saved);
});

test('a pending edit conflicts visibly with a changed remote field without replacing the live draft', async () => {
  let complete;
  const states = [];
  const storage = engine({
    CustomEvent: class { constructor(type, options) { this.detail = options.detail; } },
    window: { dispatchEvent: event => states.push(event.detail.state), Zotero: { ResearchFlow: {
      saveDatabase: () => new Promise(resolve => { complete = resolve; })
    } } }
  });
  const data = { revision: 3, tasks: [{ id: 'a', title: 'first' }] };
  const saving = storage.saveAll(data);
  await new Promise(resolve => setImmediate(resolve));
  data.tasks[0].title = 'new local draft';
  complete({ revision: 8, tasks: [{ id: 'a', title: 'remote edit' }] });
  await saving;
  assert.equal(data.tasks[0].title, 'new local draft');
  assert.equal(data.revision, 3);
  assert.equal(storage.cache.tasks[0].title, 'remote edit');
  assert.deepEqual(states, ['saving', 'pending']);
});

test('a delayed older response cannot roll back a newer adopted snapshot', async () => {
  const completions = [];
  const storage = engine({ window: { Zotero: { ResearchFlow: {
    saveDatabase: data => new Promise(resolve => completions.push(saved => resolve({ ...data, ...saved })))
  } } } });
  const data = { revision: 3, tasks: [] };
  const first = storage.saveDatabase(data);
  const second = storage.saveDatabase(data);
  await new Promise(resolve => setImmediate(resolve));
  completions[1]({ revision: 9, tasks: [{ id: 'newer' }] });
  await second;
  completions[0]({ revision: 8, tasks: [{ id: 'older' }] });
  await first;
  assert.equal(data.revision, 9);
  assert.equal(data.tasks[0].id, 'newer');
  assert.equal(storage.cache.revision, 9);
});

test('normalization metadata is not mistaken for a pending user deletion', async () => {
  const storage = engine({ window: { Zotero: { ResearchFlow: {
    saveDatabase: async data => ({ ...data, revision: 8 })
  } } } });
  storage.ensureDbShape = async data => {
    data.tasks[0].createdAt = '2026-10-24T00:00:00Z';
    return data;
  };
  const data = { revision: 3, tasks: [{ id: 'a', title: 'first' }] };
  await storage.saveDatabase(data);
  assert.equal(storage.hasPendingEdits(data), false);
  assert.equal(data.tasks[0].createdAt, '2026-10-24T00:00:00Z');
});

test('pending changes to one record preserve a remotely added record in the same collection', () => {
  const storage = engine();
  const before = { revision: 3, tasks: [{ id: 'a', title: 'first' }] };
  const local = { revision: 3, tasks: [{ id: 'a', title: 'new input' }] };
  const committed = { revision: 8, tasks: [{ id: 'a', title: 'first' }, { id: 'b', title: 'remote' }] };
  const merged = storage.mergePendingEdits(before, local, committed);
  assert.equal(merged.conflicts.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(merged.data.tasks)), [{ id: 'a', title: 'new input' }, { id: 'b', title: 'remote' }]);
  assert.equal(merged.data.revision, 8);
});

test('pending edits on the message bridge use the same safe adoption behavior', async () => {
  let complete;
  const storage = engine({ ZoteroBridge: { isZotero: true, request: () => new Promise(resolve => { complete = resolve; }) } });
  const data = { revision: 3, tasks: [{ id: 'a', title: 'first' }] };
  const saving = storage.saveDatabase(data);
  await new Promise(resolve => setImmediate(resolve));
  data.tasks[0].title = 'new bridge input';
  complete({ success: true, data: { revision: 8, tasks: [{ id: 'a', title: 'first' }] } });
  await saving;
  assert.equal(data.tasks[0].title, 'new bridge input');
  assert.equal(data.revision, 8);
  assert.equal(storage.hasPendingEdits(data), true);
});

test('cached reads return detached editor snapshots', async () => {
  const storage = engine();
  storage.cache = { revision: 3, tasks: [{ id: 'a', title: 'committed' }] };
  const first = await storage.loadAll();
  const second = await storage.loadAll();
  first.tasks[0].title = 'unsaved';
  assert.equal(second.tasks[0].title, 'committed');
  assert.equal(storage.cache.tasks[0].title, 'committed');
});

test('in-flight tracking covers overlapping saves and is released after failure', async () => {
  const responses = [];
  const storage = engine({ window: { Zotero: { ResearchFlow: {
    saveDatabase: () => new Promise((resolve, reject) => responses.push({ resolve, reject }))
  } } } });
  const data = { revision: 3, tasks: [] };
  const first = storage.saveDatabase(data);
  const second = storage.saveDatabase(data);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(storage.isSaving(data), true);
  responses[0].resolve({ revision: 4, tasks: [] });
  await first;
  assert.equal(storage.isSaving(data), true);
  responses[1].reject(new Error('write failed'));
  await assert.rejects(second, /write failed/);
  assert.equal(storage.isSaving(data), false);
});
