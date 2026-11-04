const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const bridgeSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/zotero-bridge.js'), 'utf8');
const optionsSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/options.js'), 'utf8');

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
