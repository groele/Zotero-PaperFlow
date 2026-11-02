const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const uiUtilsSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/ui-utils.js'), 'utf8');
const i18nSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/i18n.js'), 'utf8');
const timelineSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/timeline-engine.js'), 'utf8');
const academicSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/academic-sync.js'), 'utf8');
const shareStudioSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/share-studio.js'), 'utf8');
const dashboardViewSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/dashboard-view.js'), 'utf8');
const kanbanViewSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/kanban-view.js'), 'utf8');
const submissionsViewSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/submissions-view.js'), 'utf8');
const settingsViewSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/settings-view.js'), 'utf8');
const optionsSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/options.js'), 'utf8');

function setupEnvironment() {
  const elements = new Map();
  const mockDoc = {
    defaultView: null,
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
      if (sel === '.content-view.active') return getOrCreateElement('view-dashboard');
      return getOrCreateElement('mock-' + sel);
    },
    querySelectorAll: (sel) => [],
    createElement: (tag) => {
      const el = getOrCreateElement('created-' + tag + '-' + Math.random());
      el.tagName = tag.toUpperCase();
      return el;
    },
    createDocumentFragment: () => {
      const frag = getOrCreateElement('frag-' + Math.random());
      frag.appendChild = (child) => { frag.children.push(child); return child; };
      return frag;
    },
    createTextNode: (text) => ({ textContent: String(text) }),
    importNode: (node) => node,
    documentElement: null,
    body: null,
    addEventListener: () => {},
    removeEventListener: () => {}
  };

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
        setAttribute(k, v) { this[k] = String(v); },
        getAttribute(k) { return this[k] || null; },
        removeAttribute(k) { delete this[k]; },
        style: {},
        dataset: {},
        addEventListener() {},
        removeEventListener() {},
        appendChild(child) {
          if (child && child.children && child.id && child.id.startsWith('frag-')) {
            this.children.push(...child.children);
            this.childNodes.push(...child.children);
          } else {
            this.children.push(child);
            this.childNodes.push(child);
          }
          return child;
        },
        replaceChildren(...newChildren) { this.children = [...newChildren]; this.childNodes = [...newChildren]; },
        remove() {},
        querySelector() { return null; },
        querySelectorAll() { return []; },
        closest() { return null; },
        parentElement: { setAttribute() {} },
        ownerDocument: mockDoc,
        textContent: '',
        innerHTML: ''
      });
    }
    return elements.get(id);
  }

  mockDoc.documentElement = { lang: '', classList: getOrCreateElement('doc-el').classList, dataset: {} };
  mockDoc.body = getOrCreateElement('body');

  const sandbox = {
    console,
    Date,
    Math,
    Array,
    Object,
    Boolean,
    String,
    Number,
    Set,
    Map,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    structuredClone,
    URL,
    Event: class Event { constructor(type) { this.type = type; } },
    DOMParser: class DOMParser {
      parseFromString(str, type) {
        return {
          querySelectorAll: () => [],
          body: {
            childNodes: [{ cloneNode: () => getOrCreateElement('node-' + Math.random()) }],
            querySelectorAll: () => []
          }
        };
      }
    },
    document: mockDoc,
    location: { reload() {}, href: 'chrome://researchflow/content/index.html' },
    history: { replaceState() {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    window: null,
    RFPlatform: {
      storage: {
        local: {
          get: async () => ({}),
          set: async () => {}
        }
      },
      runtime: {
        onMessage: { addListener() {} }
      }
    },
    RFCore: {
      getCurrentSubmission: (db, manuscriptId) => {
        return (db.submissions || []).filter(s => s.manuscriptId === manuscriptId).slice(-1)[0] || null;
      }
    }
  };
  sandbox.window = sandbox;
  mockDoc.defaultView = sandbox;

  const context = vm.createContext(sandbox);

  vm.runInContext(uiUtilsSource, context);
  vm.runInContext(i18nSource, context);
  vm.runInContext(timelineSource, context);
  vm.runInContext(academicSource, context);
  vm.runInContext(shareStudioSource, context);
  vm.runInContext(dashboardViewSource, context);
  vm.runInContext(kanbanViewSource, context);
  vm.runInContext(submissionsViewSource, context);
  vm.runInContext(settingsViewSource, context);
  vm.runInContext(optionsSource, context);

  return { context, elements };
}

test('all domain modules parse and evaluate without syntax or reference errors', () => {
  const { context } = setupEnvironment();
  const typeMeta = vm.runInContext('typeMeta', context);
  assert.ok(typeMeta, 'typeMeta must be defined');
  assert.equal(typeof context.getTimelineTypeMeta, 'function');
  const researchMeta = context.getTimelineTypeMeta('research');
  assert.equal(researchMeta.color, '#2563eb');
});

test('renderDashboard populates pipeline cards and timeline alerts correctly without throwing', () => {
  const { context, elements } = setupEnvironment();

  const mockData = {
    manuscripts: [
      { id: 'man_1', title: 'todo', status: 'idea' },
      { id: 'man_2', title: 'Paper Two Title', status: 'submitted' },
      { id: 'man_3', title: 'Paper Three Title', status: 'submitted' },
      { id: 'man_4', title: 'Paper Four Title', status: 'accepted' },
      { id: 'man_5', title: 'Paper Five Title', status: 'accepted' },
      { id: 'man_6', title: 'Paper Six Title', status: 'accepted' },
      { id: 'man_7', title: 'Paper Seven Title', status: 'published' }
    ],
    submissions: [
      { id: 'sub_1', manuscriptId: 'man_2', journal: 'Nano Letters', status: 'revision', timelineNodes: [] },
      { id: 'sub_2', manuscriptId: 'man_3', journal: 'Small', status: 'submitted', timelineNodes: [] },
      { id: 'sub_3', manuscriptId: 'man_4', journal: 'Applied Physics Letters', status: 'accepted', timelineNodes: [] },
      { id: 'sub_4', manuscriptId: 'man_5', journal: 'Advanced Functional Materials', status: 'accepted', timelineNodes: [] },
      { id: 'sub_5', manuscriptId: 'man_6', journal: 'Advanced Functional Materials', status: 'accepted', timelineNodes: [] },
      { id: 'sub_6', manuscriptId: 'man_7', journal: 'Advanced Functional Materials', status: 'published', timelineNodes: [] }
    ],
    settings: { profile: { theme: 'system', language: 'zh' } }
  };

  vm.runInContext('db = ' + JSON.stringify(mockData) + '; currentLanguage = "zh";', context);

  assert.doesNotThrow(() => {
    context.renderDashboard();
  });

  const gantt = elements.get('dashboard-gantt');
  assert.ok(gantt, 'dashboard-gantt container must exist');
  assert.equal(gantt.children.length, 6, 'All 6 submissions must render into pipeline cards');

  const milestones = elements.get('dashboard-pending-milestones');
  assert.ok(milestones, 'dashboard-pending-milestones container must exist');
});

test('renderKanban and renderSubmissions execute cleanly across all stages', () => {
  const { context, elements } = setupEnvironment();

  const mockData = {
    manuscripts: [
      { id: 'man_1', title: 'Idea Paper', status: 'idea' },
      { id: 'man_2', title: 'Drafting Paper', status: 'drafting' },
      { id: 'man_3', title: 'Under Review Paper', status: 'submitted' },
      { id: 'man_4', title: 'Published Paper', status: 'accepted' }
    ],
    submissions: [
      { id: 'sub_1', manuscriptId: 'man_3', journal: 'Nature Electronics', status: 'under_review', timelineNodes: [] },
      { id: 'sub_2', manuscriptId: 'man_4', journal: 'Advanced Materials', status: 'accepted', timelineNodes: [] }
    ],
    settings: { profile: { theme: 'system', language: 'zh' } }
  };

  vm.runInContext('db = ' + JSON.stringify(mockData) + '; currentLanguage = "zh";', context);

  assert.doesNotThrow(() => {
    context.renderKanban();
  });

  assert.equal(elements.get('cards-idea').children.length, 1);
  assert.equal(elements.get('cards-drafting').children.length, 1);
  assert.equal(elements.get('cards-submitted').children.length, 1);
  assert.equal(elements.get('cards-accepted').children.length, 1);

  assert.doesNotThrow(() => {
    context.renderSubmissions();
  });
  const subList = elements.get('submissions-list-container');
  assert.ok(subList && subList.children.length >= 2, 'Submissions view renders submission cards');
});

test('setupSaveErrorListener registers without reference error and listens to events', () => {
  const { context } = setupEnvironment();
  assert.equal(typeof context.setupSaveErrorListener, 'function');
  assert.doesNotThrow(() => {
    context.setupSaveErrorListener();
  });
});

test('defensive setup listeners and search handlers execute safely with empty or populated DOM', () => {
  const { context } = setupEnvironment();
  assert.equal(typeof context.setupSubmissionSearch, 'function');
  assert.equal(typeof context.setupJournalPortalListeners, 'function');
  assert.equal(typeof context.setupDashboardFilterListeners, 'function');
  assert.equal(typeof context.setupSettingsListeners, 'function');

  assert.doesNotThrow(() => {
    context.setupSubmissionSearch();
    context.setupJournalPortalListeners();
    context.setupDashboardFilterListeners();
    context.setupSettingsListeners();
  });
});


