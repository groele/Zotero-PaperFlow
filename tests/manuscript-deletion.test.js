const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const uiUtilsSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/ui-utils.js'), 'utf8');
const coreSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/core/research-core.js'), 'utf8');
const i18nSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/i18n.js'), 'utf8');
const dashboardViewSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/dashboard-view.js'), 'utf8');
const storageSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/storage.js'), 'utf8');
const kanbanSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/kanban-view.js'), 'utf8');

function setupTestContext(initialDb = {}, confirmResult = true) {
  const elements = new Map();
  function getOrCreateElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        children: [],
        childNodes: [],
        classList: {
          _set: new Set(),
          add(c) { this._set.add(c); },
          remove(c) { this._set.delete(c); },
          contains(c) { return this._set.has(c); },
          toggle(c, v) { if (v === undefined) v = !this._set.has(c); if (v) this._set.add(c); else this._set.delete(c); return v; }
        },
        style: {},
        dataset: {},
        innerHTML: '',
        textContent: '',
        remove() {},
        replaceChildren(...nodes) { this.children = nodes; },
        ownerDocument: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild(child) { this.children.push(child); return child; },
        querySelector: () => null,
        querySelectorAll: () => []
      });
    }
    const el = elements.get(id);
    el.ownerDocument = mockDoc;
    return el;
  }

  const mockDoc = {
    defaultView: null,
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => getOrCreateElement('mock-' + sel),
    querySelectorAll: () => [],
    createElement: (tag) => getOrCreateElement('created-' + tag + '-' + Math.random()),
    createTextNode: (text) => ({ textContent: String(text) }),
    importNode: (node) => node,
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const db = {
    deviceId: 'test-device-1',
    schemaVersion: 7,
    revision: 1,
    manuscripts: [],
    submissions: [],
    deletedEntities: {},
    settings: {},
    ...initialDb
  };

  const calls = {
    saves: 0,
    renderKanban: 0,
    renderDashboard: 0,
    renderSubmissions: 0,
    toasts: []
  };

  const sandbox = {
    window: null,
    document: mockDoc,
    console,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    confirm: () => confirmResult,
    db,
    currentLanguage: 'zh',
    showEmptyKanbanColumns: false,
    DOMParser: class DOMParser {
      parseFromString() {
        return {
          querySelectorAll: () => [],
          body: {
            childNodes: [{ cloneNode: () => getOrCreateElement('node-' + Math.random()) }],
            querySelectorAll: () => []
          }
        };
      }
    },
    escapeHTML: (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    selectedSubmissionId: null,
    renderKanban: () => { calls.renderKanban++; },
    renderDashboard: () => { calls.renderDashboard++; },
    renderSubmissions: () => { calls.renderSubmissions++; },
    showGlobalToast: (msg, type) => { calls.toasts.push({ msg, type }); },
    closeModal: () => {}
  };
  sandbox.window = sandbox;
  mockDoc.defaultView = sandbox;

  const context = vm.createContext(sandbox);

  // Load scripts
  vm.runInContext(uiUtilsSource, context);
  vm.runInContext(coreSource, context);
  vm.runInContext(i18nSource, context);
  vm.runInContext(dashboardViewSource, context);
  vm.runInContext(storageSource, context);
  vm.runInContext(kanbanSource, context);

  // Mock storage.saveAll
  context.window.storage.saveAll = async () => { calls.saves++; return true; };
  context.renderKanban = () => { calls.renderKanban++; };
  context.renderDashboard = () => { calls.renderDashboard++; };
  context.renderSubmissions = () => { calls.renderSubmissions++; };

  return { context, db, calls };
}

test('deleteManuscript deletes standalone manuscript and records tombstone', async () => {
  const initialDb = {
    manuscripts: [
      { id: 'man-1', title: 'Paper 1', status: 'planning' },
      { id: 'man-2', title: 'Paper 2', status: 'drafting' }
    ],
    submissions: []
  };

  const { context, db, calls } = setupTestContext(initialDb, true);
  const result = await context.deleteManuscript('man-1');

  assert.equal(result, true, 'deleteManuscript should return true on success');
  assert.equal(db.manuscripts.length, 1, 'Manuscript should be removed from db.manuscripts');
  assert.equal(db.manuscripts[0].id, 'man-2');

  const tombstones = db.deletedEntities?.manuscripts || [];
  assert.equal(tombstones.length, 1, 'Tombstone should be recorded for manuscript');
  assert.equal(tombstones[0].id, 'man-1');
  assert.ok(tombstones[0].deletedAt, 'Tombstone must contain deletedAt timestamp');

  assert.equal(calls.saves, 1, 'storage.saveAll must be called once');
  assert.equal(calls.renderKanban, 1, 'renderKanban must be called');
  assert.equal(calls.renderDashboard, 1, 'renderDashboard must be called');
  assert.equal(calls.renderSubmissions, 1, 'renderSubmissions must be called');
  assert.ok(calls.toasts.length > 0, 'Toast notification must be shown');
});

test('deleteManuscript cascades deletion to linked submissions and records tombstones', async () => {
  const initialDb = {
    manuscripts: [
      { id: 'man-target', title: 'Target Paper', status: 'submitted' },
      { id: 'man-other', title: 'Other Paper', status: 'idea' }
    ],
    submissions: [
      { id: 'sub-1', manuscriptId: 'man-target', journal: 'Nature' },
      { id: 'sub-2', manuscriptId: 'man-target', journal: 'Science' },
      { id: 'sub-3', manuscriptId: 'man-other', journal: 'Cell' }
    ]
  };

  const { context, db, calls } = setupTestContext(initialDb, true);
  context.selectedSubmissionId = 'sub-1';

  const result = await context.deleteManuscript('man-target');

  assert.equal(result, true);
  assert.equal(db.manuscripts.length, 1);
  assert.equal(db.manuscripts[0].id, 'man-other');

  // Submissions check
  assert.equal(db.submissions.length, 1, 'Associated submissions must be pruned');
  assert.equal(db.submissions[0].id, 'sub-3');

  // Selected submission ID reset check
  assert.equal(context.selectedSubmissionId, null, 'Active selectedSubmissionId must be reset if deleted');

  // Submissions tombstones check
  const subTombstones = db.deletedEntities?.submissions || [];
  assert.equal(subTombstones.length, 2, 'Tombstones should be recorded for both linked submissions');
  assert.deepEqual(JSON.parse(JSON.stringify(subTombstones.map(s => s.id).sort())), ['sub-1', 'sub-2']);

  // Manuscript tombstone check
  const manTombstones = db.deletedEntities?.manuscripts || [];
  assert.equal(manTombstones.length, 1);
  assert.equal(manTombstones[0].id, 'man-target');
});

test('deleteManuscript cancels gracefully when user cancels confirm prompt', async () => {
  const initialDb = {
    manuscripts: [{ id: 'man-keep', title: 'Keep Paper', status: 'outline' }],
    submissions: [{ id: 'sub-keep', manuscriptId: 'man-keep' }]
  };

  const { context, db, calls } = setupTestContext(initialDb, false); // cancel confirm
  const result = await context.deleteManuscript('man-keep');

  assert.equal(result, false, 'deleteManuscript should return false when cancelled');
  assert.equal(db.manuscripts.length, 1, 'Manuscripts list must remain unchanged');
  assert.equal(db.submissions.length, 1, 'Submissions list must remain unchanged');
  assert.equal(calls.saves, 0, 'No saves should be executed when cancelled');
});
