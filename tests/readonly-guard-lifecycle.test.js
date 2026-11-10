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


test('authoritative versions across package.json, manifest, product.json, preferences, READMEs, and workspace are unified at 16.4.1', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const product = JSON.parse(fs.readFileSync(path.join(root, 'docs/brand/product.json'), 'utf8'));
  const prefsXhtml = fs.readFileSync(path.join(root, 'chrome/content/preferences.xhtml'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(root, 'chrome/content/index.html'), 'utf8');
  const optionsHtml = fs.readFileSync(path.join(root, 'chrome/content/pages/options.html'), 'utf8');
  const optionsJs = fs.readFileSync(path.join(root, 'chrome/content/scripts/options.js'), 'utf8');
  const readmeZh = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const readmeEn = fs.readFileSync(path.join(root, 'README.en.md'), 'utf8');
  const updateJson = JSON.parse(fs.readFileSync(path.join(root, 'update.json'), 'utf8'));

  const expectedVersion = '16.4.1';
  assert.equal(pkg.version, expectedVersion);
  assert.equal(manifest.version, expectedVersion);
  assert.equal(product.version, expectedVersion);
  assert.ok(prefsXhtml.includes(`>v${expectedVersion}<`));
  assert.ok(prefsXhtml.includes(`zotero-paperflow-${expectedVersion}.xpi`));
  assert.ok(indexHtml.includes(`v${expectedVersion} Zotero`));
  assert.ok(optionsHtml.includes(`v${expectedVersion} Zotero`));
  assert.ok(optionsJs.includes(`const RF_OPTIONS_RENDER_VERSION = '${expectedVersion}';`));
  assert.ok(readmeZh.includes(`version-${expectedVersion}-`));
  assert.ok(readmeZh.includes(`zotero-paperflow-${expectedVersion}.xpi`));
  assert.ok(readmeEn.includes(`version-${expectedVersion}-`));
  assert.ok(readmeEn.includes(`zotero-paperflow-${expectedVersion}.xpi`));

  for (const addonId of ['zotero-paperflow@groele.org', 'researchflow@groele.org']) {
    const entry = updateJson.addons[addonId].updates[0];
    assert.equal(entry.version, expectedVersion);
    assert.equal(entry.applications.zotero.strict_min_version, '10.0');
    assert.equal(entry.applications.zotero.strict_max_version, '12.*');
  }
});

test('Zotero.PaperFlow alias is exported and equivalent to Zotero.ResearchFlow', () => {
  const { context } = createHostContext();
  assert.ok(context.Zotero.ResearchFlow);
  assert.ok(context.Zotero.PaperFlow);
  assert.strictEqual(context.Zotero.PaperFlow, context.Zotero.ResearchFlow);
});


test('syncManuscriptToChildNote selects active round and renders status badges and modern timeline dates', async () => {
  const initialDb = {
    manuscripts: [
      { id: 'm1', title: 'Multi-Round Paper', zoteroItemKey: 'ITEM1', status: 'revision' }
    ],
    submissions: [
      {
        id: 'sub_round1',
        manuscriptId: 'm1',
        targetJournal: 'Rejected Journal A',
        externalManuscriptId: 'RJA-001',
        status: 'rejected',
        roundIndex: 1,
        submissionDate: '2026-08-01T12:00:00.000Z',
        createdAt: '2026-08-01T12:00:00.000Z'
      },
      {
        id: 'sub_round2',
        manuscriptId: 'm1',
        previousSubmissionId: 'sub_round1',
        targetJournal: 'Active Journal B',
        externalManuscriptId: 'AJB-202',
        status: 'revision',
        roundIndex: 2,
        submissionDate: '2026-10-01T12:00:00.000Z',
        createdAt: '2026-10-01T12:00:00.000Z',
        timelineNodes: [
          { name: 'Manuscript Submitted', status: 'completed', completeDate: '2026-10-01' },
          { name: 'Review Comments R1', status: 'pending', dueDate: '2026-11-15' }
        ],
        reviewMatrix: [
          { reviewer: 'Reviewer #1', comment: 'Add XRD', response: 'Added in Fig. 2', changes: 'Page 4', status: 'addressed' },
          { reviewer: 'Reviewer #2', comment: 'Why no annealing?', response: 'Explained thermal budget', changes: '', status: 'clarified' }
        ]
      }
    ]
  };
  const { context, savedNotes } = createHostContext(initialDb);
  const editableItem = {
    id: 101,
    libraryID: 1,
    key: 'ITEM1',
    isRegularItem: () => true,
    isEditable: () => true,
    deleted: false,
    getField: (f) => (f === 'title' ? 'Multi-Round Paper' : ''),
    getCreators: () => [{ firstName: 'Jane', lastName: 'Doe' }],
    getAttachments: () => [],
    getNotes: () => []
  };

  const result = await context.Zotero.ResearchFlow.syncManuscriptToChildNote(editableItem);
  assert.ok(result);
  assert.equal(savedNotes.length, 1);
  const noteHtml = savedNotes[0].getNote();
  assert.ok(noteHtml.includes('Active Journal B'));
  assert.ok(!noteHtml.includes('Rejected Journal A'));
  assert.ok(noteHtml.includes('AJB-202'));
  assert.ok(noteHtml.includes('✅ <strong>Manuscript Submitted</strong> (2026-10-01)'));
  assert.ok(noteHtml.includes('⏳ <strong>Review Comments R1</strong> (2026-11-15)'));
  assert.ok(noteHtml.includes('✔ 已答复'));
  assert.ok(noteHtml.includes('💬 已辩明'));
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

test('preferences definitions and defaults include modular switches and correct defaults', () => {
  const prefsJs = fs.readFileSync(path.join(root, 'prefs.js'), 'utf8');
  const preferencesJs = fs.readFileSync(path.join(root, 'chrome/content/scripts/preferences.js'), 'utf8');

  // Modular prefs in prefs.js
  assert.ok(prefsJs.includes('pref("extensions.researchflow.enableItemPane", false);'));
  assert.ok(prefsJs.includes('pref("extensions.researchflow.enableReaderIntegration", true);'));
  assert.ok(prefsJs.includes('pref("extensions.researchflow.syncStatusTags", false);'));
  assert.ok(prefsJs.includes('pref("extensions.researchflow.showJournalPortals", true);'));
  assert.ok(prefsJs.includes('pref("extensions.researchflow.collapseEmptyKanbanStages", false);'));
  assert.ok(prefsJs.includes('pref("extensions.researchflow.defaultRebuttalExportFormat", "latex");'));
  assert.ok(prefsJs.includes('pref("extensions.researchflow.importMode", "merge");'));

  // Modular prefs in preferences.js
  assert.ok(preferencesJs.includes('enableItemPane: false'));
  assert.ok(preferencesJs.includes('enableReaderIntegration: true'));
  assert.ok(preferencesJs.includes('syncStatusTags: false'));
  assert.ok(preferencesJs.includes('showJournalPortals: true'));
  assert.ok(preferencesJs.includes('collapseEmptyKanbanStages: false'));
  assert.ok(preferencesJs.includes("defaultRebuttalExportFormat: 'latex'"));
  assert.ok(preferencesJs.includes("importMode: 'merge'"));
});

test('syncStatusTagToItem respects syncStatusTags preference and writes PaperFlow/ tags when enabled', async () => {
  const { context, prefs } = createHostContext();
  let addedTags = [];
  let removedTags = [];
  let saved = false;
  const mockItem = {
    key: 'ITEM1',
    isRegularItem: () => true,
    isEditable: () => true,
    deleted: false,
    getTags: () => [{ tag: 'ResearchFlow/01-选题大纲' }, { tag: 'Important' }],
    removeTag: (t) => removedTags.push(t),
    addTag: (t, type) => addedTags.push({ tag: t, type }),
    saveTx: async () => { saved = true; }
  };

  // 1. When syncStatusTags is false -> no tags written, returns true
  prefs['extensions.researchflow.syncStatusTags'] = false;
  const res1 = await context.Zotero.ResearchFlow.syncStatusTagToItem(mockItem, 'drafting');
  assert.equal(res1, true);
  assert.equal(addedTags.length, 0);
  assert.equal(saved, false);

  // 2. When syncStatusTags is true -> writes PaperFlow/ tag, purges legacy tag, saves item
  prefs['extensions.researchflow.syncStatusTags'] = true;
  const res2 = await context.Zotero.ResearchFlow.syncStatusTagToItem(mockItem, 'drafting');
  assert.equal(res2, true);
  assert.deepEqual(removedTags, ['ResearchFlow/01-选题大纲']);
  assert.deepEqual(addedTags, [{ tag: 'PaperFlow/02-图表初稿', type: 0 }]);
  assert.equal(saved, true);
});

