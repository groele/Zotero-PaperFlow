const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const citationSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/academic-citation.js'), 'utf8');
const architectureGuardSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/architecture-guard.js'), 'utf8');
const itemPaneSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/item-pane.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/index.js'), 'utf8');

function createHostContext(initialDb = { manuscripts: [{ id: 'm1', title: 'Test Paper', zoteroItemKey: 'ITEM1' }], submissions: [] }, initialPrefs = {}) {
  const errors = [];
  const logs = [];
  const savedNotes = [];
  const registeredSections = [];
  const unregisteredSections = [];
  const unregisteredPrefPanes = [];
  const prefs = { ...initialPrefs };

  const context = vm.createContext({
    console,
    ADDON_ID: 'zotero-paperflow@groele.org',
    CHROME_ROOT: 'chrome://researchflow/content/',
    PREF_PREFIX: 'extensions.researchflow.',
    Services: {
      wm: {
        getEnumerator: () => ({ hasMoreElements: () => false, getNext: () => null }),
        addListener: () => {},
        removeListener: () => {}
      }
    },
    Zotero: {
      log: msg => logs.push(msg),
      logError: err => errors.push(String(err)),
      initializationPromise: Promise.resolve(),
      DataDirectory: { dir: '/fake/data' },
      Prefs: {
        get: (key, fallback) => (key in prefs ? prefs[key] : fallback),
        set: (key, val) => { prefs[key] = val; },
        registerObserver: () => {},
        unregisterObserver: () => {}
      },
      Item: class MockItem {
        constructor(type) {
          this.type = type;
          this.libraryID = 1;
          this.tags = [];
        }
        setNote(html) { this.note = html; }
        getNote() { return this.note; }
        addTag(t) { this.tags.push(t); }
        async saveTx() { savedNotes.push(this); }
      },
      Items: {
        get: () => null
      },
      ItemPaneManager: {
        registerSection: (def) => {
          registeredSections.push(def);
          return def.paneID || 'section-123';
        },
        unregisterSection: (id) => {
          unregisteredSections.push(id);
        }
      },
      PreferencePanes: {
        register: async (def) => 'pref-pane-paperflow',
        unregister: (id) => {
          unregisteredPrefPanes.push(id);
        }
      }
    },
    IOUtils: {
      exists: async () => true,
      readUTF8: async () => JSON.stringify(initialDb),
      writeUTF8: async () => {}
    },
    PathUtils: {
      join: (...parts) => parts.join('/')
    }
  });

  // Evaluate modules and index.js inside context
  vm.runInContext(citationSource, context);
  vm.runInContext(architectureGuardSource, context);
  vm.runInContext(itemPaneSource, context);
  vm.runInContext(indexSource, context);
  return { context, errors, logs, savedNotes, prefs, registeredSections, unregisteredSections, unregisteredPrefPanes };
}

test('syncManuscriptToChildNote blocks read-only items and returns null', async () => {
  const { context, errors, savedNotes } = createHostContext();
  const readOnlyItem = {
    key: 'ITEM1',
    isRegularItem: () => true,
    isEditable: () => false,
    deleted: false,
    getField: () => 'Test Paper',
    getCreators: () => [],
    getAttachments: () => [],
    getNotes: () => []
  };

  const result = await context.Zotero.ResearchFlow.syncManuscriptToChildNote(readOnlyItem);
  assert.equal(result, null);
  assert.equal(savedNotes.length, 0);
  assert.ok(errors.some(e => e.includes('read-only or in trash')));
});

test('syncManuscriptToChildNote blocks deleted items in trash and returns null', async () => {
  const { context, errors, savedNotes } = createHostContext();
  const deletedItem = {
    key: 'ITEM1',
    isRegularItem: () => true,
    isEditable: () => true,
    deleted: true,
    getField: () => 'Test Paper',
    getCreators: () => [],
    getAttachments: () => [],
    getNotes: () => []
  };

  const result = await context.Zotero.ResearchFlow.syncManuscriptToChildNote(deletedItem);
  assert.equal(result, null);
  assert.equal(savedNotes.length, 0);
  assert.ok(errors.some(e => e.includes('read-only or in trash')));
});

test('syncStatusTagToItem blocks read-only and deleted items and returns false', async () => {
  const { context, errors } = createHostContext();
  const readOnlyItem = {
    key: 'ITEM1',
    isRegularItem: () => true,
    isEditable: () => false,
    deleted: false
  };

  const result1 = await context.Zotero.ResearchFlow.syncStatusTagToItem(readOnlyItem, 'drafting');
  assert.equal(result1, false);

  const deletedItem = {
    key: 'ITEM1',
    isRegularItem: () => true,
    isEditable: () => true,
    deleted: true
  };

  const result2 = await context.Zotero.ResearchFlow.syncStatusTagToItem(deletedItem, 'drafting');
  assert.equal(result2, false);
  assert.ok(errors.some(e => e.includes('read-only or in trash')));
});

test('addItemToPipelineCollection blocks read-only and deleted items and returns null', async () => {
  const { context, errors } = createHostContext();
  const readOnlyItem = {
    key: 'ITEM1',
    isRegularItem: () => true,
    isEditable: () => false,
    deleted: false
  };

  const result1 = await context.Zotero.ResearchFlow.addItemToPipelineCollection(readOnlyItem);
  assert.equal(result1, null);

  const deletedItem = {
    key: 'ITEM1',
    isRegularItem: () => true,
    isEditable: () => true,
    deleted: true
  };

  const result2 = await context.Zotero.ResearchFlow.addItemToPipelineCollection(deletedItem);
  assert.equal(result2, null);
  assert.ok(errors.some(e => e.includes('read-only or in trash')));
});
