const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const bridgeSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/zotero-bridge.js'), 'utf8');
const optionsSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/options.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/index.js'), 'utf8');

test('resolveZoteroItem resolves item by explicit libraryID', () => {
  const mockItem = { id: 101, key: 'ABCDEFGH', libraryID: 42, isEditable: () => true };
  const mockZotero = {
    Libraries: { userLibraryID: 1, getAll: () => [{ id: 1 }, { id: 42 }] },
    Items: {
      getByLibraryAndKey(libId, key) {
        if (libId === 42 && key === 'ABCDEFGH') return mockItem;
        return null;
      }
    }
  };

  const sandbox = {
    window: { Zotero: mockZotero },
    globalThis: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(bridgeSource, sandbox);

  const ZoteroBridge = sandbox.globalThis.ZoteroBridge;
  assert.ok(ZoteroBridge, 'ZoteroBridge must be initialized');

  const resolved = ZoteroBridge.resolveZoteroItem(mockZotero, 'ABCDEFGH', 42);
  assert.equal(resolved?.id, 101);
  assert.equal(resolved?.libraryID, 42);
});

test('resolveZoteroItem scans group libraries when libraryID is omitted and item is not in user library', () => {
  const groupItem = { id: 202, key: 'GROUPKEY1', libraryID: 99, isEditable: () => true };
  const mockZotero = {
    Libraries: {
      userLibraryID: 1,
      getAll: () => [
        { libraryID: 1, name: 'My Library' },
        { libraryID: 88, name: 'Lab Group A' },
        { libraryID: 99, name: 'Collab Group B' }
      ]
    },
    Items: {
      getByLibraryAndKey(libId, key) {
        if (libId === 99 && key === 'GROUPKEY1') return groupItem;
        return null;
      }
    }
  };

  const sandbox = {
    window: { Zotero: mockZotero },
    globalThis: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(bridgeSource, sandbox);

  const ZoteroBridge = sandbox.globalThis.ZoteroBridge;
  const resolved = ZoteroBridge.resolveZoteroItem(mockZotero, 'GROUPKEY1');
  assert.equal(resolved?.id, 202);
  assert.equal(resolved?.libraryID, 99);
});

test('ZoteroBridge.getPref reads directly from host Zotero.ResearchFlow and falls back safely', () => {
  const mockZotero = {
    ResearchFlow: {
      getPref(key, def) {
        if (key === 'locateOnManuscriptClick') return false;
        if (key === 'showJournalPortals') return true;
        if (key === 'autoSyncChildNotes') return false;
        return def;
      }
    }
  };

  const sandbox = {
    window: { Zotero: mockZotero, db: { settings: { locateOnManuscriptClick: true } } },
    globalThis: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(bridgeSource, sandbox);

  const ZoteroBridge = sandbox.globalThis.ZoteroBridge;
  assert.equal(ZoteroBridge.getPref('locateOnManuscriptClick', true), false);
  assert.equal(ZoteroBridge.getPref('showJournalPortals', false), true);
  assert.equal(ZoteroBridge.getPref('autoSyncChildNotes', true), false);
  assert.equal(ZoteroBridge.getPref('nonexistentPref', 'fallbackVal'), 'fallbackVal');
});

test('registerModalCleanup registers cleanup callbacks and closeModal executes and resets them', () => {
  let cleaned1 = false;
  let cleaned2 = false;

  const mockDoc = {
    getElementById(id) {
      return {
        classList: { add() {}, remove() {}, contains() { return true; } },
        setAttribute() {},
        removeAttribute() {},
        focus() {}
      };
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    activeElement: null,
    body: { classList: { add() {}, remove() {} } }
  };

  const sandbox = {
    window: {
      location: { href: 'chrome://researchflow/content/pages/options.html', searchParams: new URLSearchParams() },
      history: { replaceState() {} },
      RFUI: { setHTML() {} },
      addEventListener() {},
      removeEventListener() {}
    },
    document: mockDoc,
    HTMLElement: class {},
    URL: globalThis.URL
  };
  vm.createContext(sandbox);
  vm.runInContext(optionsSource, sandbox);

  const registerModalCleanup = sandbox.window.registerModalCleanup;
  const closeModal = sandbox.closeModal;

  assert.equal(typeof registerModalCleanup, 'function', 'registerModalCleanup must be exported to window');
  assert.equal(typeof closeModal, 'function', 'closeModal must be defined');

  registerModalCleanup(() => { cleaned1 = true; });
  registerModalCleanup(() => { cleaned2 = true; });

  assert.equal(cleaned1, false);
  assert.equal(cleaned2, false);

  closeModal();

  assert.equal(cleaned1, true, 'First cleanup callback must have executed');
  assert.equal(cleaned2, true, 'Second cleanup callback must have executed');
});

test('addItemToPipelineCollection respects autoAddToPipelineCollection preference', async () => {
  let createdCollection = false;
  const mockItem = {
    isEditable: () => true,
    deleted: false,
    libraryID: 1,
    inCollection: () => false,
    addToCollection() {},
    saveTx: async () => {}
  };

  const sandbox = {
    getLiteratureItem: it => it,
    Zotero: {
      logError: () => {},
      Libraries: { userLibraryID: 1 },
      Collections: { getByLibrary: () => [] },
      Collection: class {
        constructor() { createdCollection = true; }
        saveTx() { return Promise.resolve(); }
      }
    }
  };

  const runtime = {
    getPref(key, def) {
      if (key === 'autoAddToPipelineCollection') return false;
      return def;
    }
  };

  const codeStart = indexSource.indexOf('    async addItemToPipelineCollection(item) {');
  const codeEnd = indexSource.indexOf('    showToast(title, message, type = \'info\', duration = 3500) {');
  assert.ok(codeStart > 0 && codeEnd > codeStart, 'addItemToPipelineCollection must be found');
  const methodCode = indexSource.slice(codeStart, codeEnd);

  const context = vm.createContext(sandbox);
  const fn = vm.runInContext(`({ ${methodCode} }).addItemToPipelineCollection`, context);

  const res = await fn.call(runtime, mockItem);
  assert.equal(res, null, 'addItemToPipelineCollection must return null when preference is disabled');
  assert.equal(createdCollection, false, 'No collection should be created when preference is disabled');
});

test('showAcceptanceCelebration respects enableAcceptanceCelebration preference', () => {
  let celebrationRendered = false;
  const mockDoc = {
    getElementById(id) {
      return {
        classList: { add() {}, remove() {}, contains() { return true; } },
        setAttribute() {},
        removeAttribute() {},
        focus() {}
      };
    },
    createElement(tag) {
      if (tag === 'div') celebrationRendered = true;
      return {
        classList: { add() {}, remove() {} },
        setAttribute() {},
        dataset: {},
        style: { setProperty() {} },
        appendChild() {}
      };
    },
    createDocumentFragment() {
      return { appendChild() {} };
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    activeElement: null,
    body: {
      classList: { add() {}, remove() {} },
      appendChild() {}
    }
  };

  const sandbox = {
    window: {
      location: { href: 'chrome://researchflow/content/pages/options.html', searchParams: new URLSearchParams() },
      history: { replaceState() {} },
      RFUI: { setHTML() {} },
      addEventListener() {},
      removeEventListener() {},
      matchMedia: () => ({ matches: false })
    },
    document: mockDoc,
    HTMLElement: class {},
    URL: globalThis.URL,
    ZoteroBridge: {
      getPref(key, def) {
        if (key === 'enableAcceptanceCelebration') return false;
        return def;
      }
    },
    db: { manuscripts: [] },
    t: () => ''
  };

  vm.createContext(sandbox);
  vm.runInContext(optionsSource, sandbox);

  sandbox.showAcceptanceCelebration({ manuscriptId: 'm1', title: 'Test Paper' });
  assert.equal(celebrationRendered, false, 'Celebration animation must be skipped when enableAcceptanceCelebration is false');
});
