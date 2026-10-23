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
