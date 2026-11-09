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
const academicExporterSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/academic-exporter.js'), 'utf8');
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
        _listeners: new Map(),
        addEventListener(evt, fn) {
          if (!this._listeners.has(evt)) this._listeners.set(evt, []);
          this._listeners.get(evt).push(fn);
        },
        removeEventListener(evt, fn) {
          const list = this._listeners.get(evt) || [];
          this._listeners.set(evt, list.filter((h) => h !== fn));
        },
        dispatchEvent(evt) {
          const type = typeof evt === 'string' ? evt : evt.type;
          (this._listeners.get(type) || []).forEach((fn) => fn(evt));
        },
        click() {
          this.dispatchEvent({ type: 'click', preventDefault() {} });
        },
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
  vm.runInContext(academicExporterSource, context);
  vm.runInContext(submissionsViewSource, context);
  vm.runInContext(settingsViewSource, context);
  vm.runInContext(optionsSource, context);

  return { context, elements };
}


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

test('pipeline view toggle switches between compact and expanded modes and updates UI', () => {
  const { context, elements } = setupEnvironment();
  const mockData = { manuscripts: [], submissions: [], settings: { profile: { theme: 'system', language: 'en' } } };
  vm.runInContext('db = ' + JSON.stringify(mockData) + '; currentLanguage = "en";', context);

  const gantt = context.document.getElementById('dashboard-gantt');
  const btn = context.document.getElementById('btn-pipeline-view-toggle');
  const label = context.document.getElementById('pipeline-view-label');
  const icon = context.document.getElementById('pipeline-view-icon');

  assert.equal(typeof context.setPipelineViewMode, 'function');
  assert.equal(typeof context.bindDashboardControls, 'function');

  context.bindDashboardControls();

  // Initial state is compact (not expanded)
  context.setPipelineViewMode(false);
  assert.equal(gantt.classList.contains('expanded'), false);
  assert.equal(btn.classList.contains('active'), false);
  assert.equal(btn['aria-pressed'], 'false');
  assert.equal(label.textContent, 'Compact');
  assert.equal(icon.textContent, '▤');

  // Toggle to expanded
  btn.click();
  assert.equal(gantt.classList.contains('expanded'), true);
  assert.equal(btn.classList.contains('active'), true);
  assert.equal(btn['aria-pressed'], 'true');
  assert.equal(label.textContent, 'Expanded');
  assert.equal(icon.textContent, '▦');

  // Toggle back to compact
  btn.click();
  assert.equal(gantt.classList.contains('expanded'), false);
  assert.equal(btn.classList.contains('active'), false);
  assert.equal(btn['aria-pressed'], 'false');
  assert.equal(label.textContent, 'Compact');
  assert.equal(icon.textContent, '▤');
});

test('renderDashboard computes top KPI stat counters and renders prominent share buttons', () => {
  const { context, elements } = setupEnvironment();
  const mockData = {
    manuscripts: [
      { id: 'man_1', title: 'Paper 1', status: 'under_review' },
      { id: 'man_2', title: 'Paper 2', status: 'accepted' }
    ],
    submissions: [
      { id: 'sub_1', manuscriptId: 'man_1', targetJournal: 'Nano Letters', status: 'under_review', timelineNodes: [] },
      { id: 'sub_2', manuscriptId: 'man_2', targetJournal: 'Advanced Materials', status: 'accepted', timelineNodes: [] }
    ],
    settings: { profile: { theme: 'system', language: 'zh' } }
  };
  vm.runInContext('db = ' + JSON.stringify(mockData) + '; currentLanguage = "zh";', context);

  assert.doesNotThrow(() => {
    context.renderDashboard();
  });

  // Top 3 KPI stat counters
  const elAccepted = elements.get('stat-accepted-submissions');
  const elActive = elements.get('stat-active-submissions');
  const elTotal = elements.get('stat-total-submissions');

  assert.equal(elAccepted.textContent, '1', 'Accepted submissions count is 1');
  assert.equal(elActive.textContent, '1', 'Active in-review submissions count is 1');
  assert.equal(elTotal.textContent, '2', 'Total submissions count is 2');

  // Dashboard gantt contains cards
  const gantt = elements.get('dashboard-gantt');
  assert.equal(gantt.children.length, 2, '2 pipeline cards rendered');
});

test("activateWorkspaceView switches views safely without ReferenceError on submissionAutoSaveCleanup", () => {
  const { context, elements } = setupEnvironment();
  assert.doesNotThrow(() => {
    context.activateWorkspaceView("view-manuscripts");
    context.activateWorkspaceView("view-submissions");
    context.activateWorkspaceView("view-dashboard");
  });
});

test("pipeline event cards render add-event and share buttons in header row and action bar", () => {
  const { context, elements } = setupEnvironment();
  const mockData = {
    manuscripts: [{ id: "man_1", title: "Quantum Spin Order", status: "accepted" }],
    submissions: [{ id: "sub_1", manuscriptId: "man_1", journal: "Applied Physics Letters", status: "accepted", timelineNodes: [] }],
    settings: { profile: { theme: "system", language: "zh" } }
  };
  vm.runInContext("db = " + JSON.stringify(mockData) + "; currentLanguage = 'zh';", context);
  context.renderDashboard();
  const gantt = elements.get("dashboard-gantt");
  assert.ok(gantt.children.length > 0, "Gantt should have rendered at least 1 card");
});

test("openSubmissionShareModal provides 13 preset style themes", () => {
  const { context } = setupEnvironment();
  const themes = context.getShareThemes ? context.getShareThemes() : [];
  assert.equal(themes.length, 13, "Must provide 13 preset themes");
  const expectedThemeIds = ["estuary", "iris", "amber", "journal", "conference", "archive", "paper", "ink", "blueprint", "minimal", "cyber", "aurora", "terminal"];
  assert.equal(JSON.stringify(themes.map(t => t.id)), JSON.stringify(expectedThemeIds), "Themes must match the 13 defined presets");
});
