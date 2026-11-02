const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
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

  // Evaluate index.js inside context
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

test('authoritative versions across package.json, manifest, product.json, preferences, and workspace are unified at 13.4.0', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const product = JSON.parse(fs.readFileSync(path.join(root, 'docs/brand/product.json'), 'utf8'));
  const prefsXhtml = fs.readFileSync(path.join(root, 'chrome/content/preferences.xhtml'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(root, 'chrome/content/index.html'), 'utf8');
  const optionsHtml = fs.readFileSync(path.join(root, 'chrome/content/pages/options.html'), 'utf8');
  const optionsJs = fs.readFileSync(path.join(root, 'chrome/content/scripts/options.js'), 'utf8');
  const updateJson = JSON.parse(fs.readFileSync(path.join(root, 'update.json'), 'utf8'));

  const expectedVersion = '13.4.0';
  assert.equal(pkg.version, expectedVersion);
  assert.equal(manifest.version, expectedVersion);
  assert.equal(product.version, expectedVersion);
  assert.ok(prefsXhtml.includes(`>v${expectedVersion}<`));
  assert.ok(prefsXhtml.includes(`zotero-paperflow-${expectedVersion}.xpi`));
  assert.ok(indexHtml.includes(`v${expectedVersion} Zotero`));
  assert.ok(optionsHtml.includes(`v${expectedVersion} Zotero`));
  assert.ok(optionsJs.includes(`const RF_OPTIONS_RENDER_VERSION = '${expectedVersion}';`));

  for (const addonId of ['zotero-paperflow@groele.org', 'researchflow@groele.org']) {
    const entry = updateJson.addons[addonId].updates[0];
    assert.equal(entry.version, expectedVersion);
    assert.equal(entry.applications.zotero.strict_min_version, '10.0');
    assert.equal(entry.applications.zotero.strict_max_version, '12.*');
  }
});

test('updateItemPaneSection toggles section registration based on enableItemPane preference', async () => {
  const { context, prefs, registeredSections, unregisteredSections } = createHostContext(
    undefined,
    { 'extensions.researchflow.enableItemPane': false }
  );

  // Initially false: no section registered
  context.Zotero.ResearchFlow.updateItemPaneSection();
  assert.equal(context.Zotero.ResearchFlow.itemPaneSectionID, null);
  assert.equal(registeredSections.length, 0);

  // Turn on: section registers
  prefs['extensions.researchflow.enableItemPane'] = true;
  context.Zotero.ResearchFlow.updateItemPaneSection();
  assert.equal(context.Zotero.ResearchFlow.itemPaneSectionID, 'researchflow-item-pane');
  assert.equal(registeredSections.length, 1);
  assert.equal(registeredSections[0].paneID, 'researchflow-item-pane');

  // Turn off: section unregisters
  prefs['extensions.researchflow.enableItemPane'] = false;
  context.Zotero.ResearchFlow.updateItemPaneSection();
  assert.equal(context.Zotero.ResearchFlow.itemPaneSectionID, null);
  assert.ok(unregisteredSections.includes('researchflow-item-pane'));
});

test('shutdown unregisters _prefPaneID and itemPaneSectionID safely', async () => {
  const { context, unregisteredSections, unregisteredPrefPanes } = createHostContext();
  context.Zotero.ResearchFlow._prefPaneID = 'pref-pane-test-123';
  context.Zotero.ResearchFlow.itemPaneSectionID = 'researchflow-item-pane';

  await context.Zotero.ResearchFlow.shutdown();

  assert.equal(context.Zotero.ResearchFlow._prefPaneID, null);
  assert.equal(context.Zotero.ResearchFlow.itemPaneSectionID, null);
  assert.ok(unregisteredPrefPanes.includes('pref-pane-test-123'));
  assert.ok(unregisteredSections.includes('researchflow-item-pane'));
});

test('preferences definitions and defaults include enableItemPane defaulting to false', () => {
  const prefsJs = fs.readFileSync(path.join(root, 'prefs.js'), 'utf8');
  const preferencesJs = fs.readFileSync(path.join(root, 'chrome/content/scripts/preferences.js'), 'utf8');

  assert.ok(prefsJs.includes('pref("extensions.researchflow.enableItemPane", false);'));
  assert.ok(preferencesJs.includes('enableItemPane: false'));
  assert.ok(preferencesJs.includes("key: 'enableItemPane'"));
});

