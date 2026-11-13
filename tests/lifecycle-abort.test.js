const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function makeEventTarget(id = '') {
  const listeners = new Map();
  return {
    id,
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, v) {
        if (v === undefined) this._set.has(c) ? this._set.delete(c) : this._set.add(c);
        else if (v) this._set.add(c);
        else this._set.delete(c);
      },
      contains(c) { return this._set.has(c); }
    },
    dataset: {},
    style: {},
    attributes: {},
    isConnected: true,
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] ?? null; },
    removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(type, fn, opts) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      const entry = { fn, capture: typeof opts === 'boolean' ? opts : Boolean(opts?.capture), signal: opts?.signal };
      listeners.get(type).add(entry);
      if (opts?.signal?.addEventListener) {
        opts.signal.addEventListener('abort', () => listeners.get(type)?.delete(entry), { once: true });
      }
    },
    removeEventListener(type, fn) {
      const set = listeners.get(type);
      if (!set) return;
      for (const entry of set) {
        if (entry.fn === fn) set.delete(entry);
      }
    },
    dispatchEvent(evt) {
      const e = typeof evt === 'string' ? { type: evt, stopPropagation() {}, preventDefault() {} } : evt;
      for (const entry of Array.from(listeners.get(e.type) || [])) {
        if (!entry.signal?.aborted) entry.fn(e);
      }
    },
    listenerCount(type) { return listeners.get(type)?.size || 0; },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    closest() { return null; },
    appendChild(child) { this.children = this.children || []; this.children.push(child); return child; },
    replaceChildren(...items) { this.children = [...items]; },
    remove() { this.isConnected = false; }
  };
}

function makeFakeTimers() {
  let nextId = 1;
  const timers = new Map();
  const intervals = new Map();
  const rafs = new Map();
  return {
    timers,
    intervals,
    rafs,
    setTimeout(fn, delay) { const id = nextId++; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn, delay) { const id = nextId++; intervals.set(id, { fn, delay }); return id; },
    clearInterval(id) { intervals.delete(id); },
    requestAnimationFrame(fn) { const id = nextId++; rafs.set(id, fn); return id; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    flushTimers() {
      for (const [id, entry] of Array.from(timers.entries())) {
        timers.delete(id);
        entry.fn();
      }
    }
  };
}

function loadCjsModule(relPath, extraGlobals = {}) {
  const result = buildSync({
    entryPoints: [path.join(ROOT, relPath)],
    bundle: true,
    format: 'cjs',
    write: false,
    platform: 'node'
  });
  const context = {
    module: { exports: {} },
    exports: {},
    console,
    AbortController,
    AbortSignal,
    Date,
    Math,
    Set,
    Map,
    WeakMap,
    JSON,
    Promise,
    ...extraGlobals
  };
  context.globalThis = context;
  if (!context.window) context.window = context;
  vm.runInNewContext(result.outputFiles[0].text, context);
  return { exports: context.module.exports, context };
}

test('LifecycleScope aborts listeners, timers, intervals, animation frames, and child scopes', () => {
  const timers = makeFakeTimers();
  const { exports } = loadCjsModule('src/modules/ui-utils/lifecycle.ts', {
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    setInterval: timers.setInterval,
    clearInterval: timers.clearInterval,
    requestAnimationFrame: timers.requestAnimationFrame,
    cancelAnimationFrame: timers.cancelAnimationFrame
  });
  const target = makeEventTarget('btn');
  let fired = 0;

  const parent = exports.createLifecycleScope();
  const child = parent.child();
  parent.on(target, 'click', () => { fired++; });
  parent.setTimeout(() => { fired++; }, 50);
  parent.setInterval(() => { fired++; }, 100);
  parent.raf(() => { fired++; });
  child.on(target, 'keydown', () => { fired++; });

  assert.equal(target.listenerCount('click'), 1);
  assert.equal(target.listenerCount('keydown'), 1);
  assert.equal(timers.timers.size, 1);
  assert.equal(timers.intervals.size, 1);
  assert.equal(timers.rafs.size, 1);

  parent.abort('teardown');
  assert.equal(parent.aborted, true);
  assert.equal(child.aborted, true);
  assert.equal(target.listenerCount('click'), 0);
  assert.equal(target.listenerCount('keydown'), 0);
  assert.equal(timers.timers.size, 0);
  assert.equal(timers.intervals.size, 0);
  assert.equal(timers.rafs.size, 0);

  target.dispatchEvent('click');
  target.dispatchEvent('keydown');
  timers.flushTimers();
  assert.equal(fired, 0);
});

test('pipeline card interactions and dashboard filters avoid listener multiplication and dispose on eviction', () => {
  let navCalls = 0;
  const btnOpen = makeEventTarget('c1-open');
  const card = makeEventTarget('c1');
  card.querySelectorAll = (sel) => (sel.includes('.btn-pipeline-open') ? [btnOpen] : []);

  const cardAccepted = makeEventTarget('card-filter-accepted');
  const cardActive = makeEventTarget('card-filter-active');
  const cardAll = makeEventTarget('card-filter-all');
  const byId = {
    'card-filter-accepted': cardAccepted,
    'card-filter-active': cardActive,
    'card-filter-all': cardAll
  };
  const win = makeEventTarget('win');
  const { exports } = loadCjsModule('src/modules/dashboard-view/card-interactions.ts', {
    document: { getElementById: (id) => byId[id] || null },
    window: win,
    navigateToSubmissionDetails: () => { navCalls++; },
    renderDashboard: () => {},
    t: (k) => k
  });
  const cacheMod = loadCjsModule('src/modules/dashboard-view/card-cache.ts', {
    disposePipelineCardInteractions: exports.disposePipelineCardInteractions
  });

  const container = { children: [], replaceChildren(...els) { this.children = els; } };
  cacheMod.exports.reconcilePipelineCards(container, [{
    key: 'k1', signature: 's1',
    create: () => { exports.bindPipelineCardInteractions(card, { id: 'sub-1' }); return card; }
  }]);
  assert.equal(btnOpen.listenerCount('click'), 1);

  cacheMod.exports.reconcilePipelineCards(container, []);
  assert.equal(btnOpen.listenerCount('click'), 0);
  btnOpen.dispatchEvent('click');
  assert.equal(navCalls, 0);

  for (let i = 0; i < 4; i++) exports.setupDashboardFilterListeners();
  assert.equal(cardAccepted.listenerCount('click'), 1);
  assert.equal(cardActive.listenerCount('click'), 1);
  assert.equal(cardAll.listenerCount('click'), 1);
  assert.equal(win.listenerCount('unload'), 1);
});

test('modal teardown cancels 60ms active-item timer in Zotero modal binder', () => {
  const timers = makeFakeTimers();
  const modalCleanups = [];
  let activeLookupCalls = 0;
  const elements = new Map([
    ['btn-zotero-toggle-search', makeEventTarget('btn-zotero-toggle-search')],
    ['btn-zotero-fetch-active', makeEventTarget('btn-zotero-fetch-active')],
    ['zotero-bind-status', makeEventTarget('zotero-bind-status')]
  ]);
  const { exports } = loadCjsModule('src/modules/kanban-view/zotero-modal-binder.ts', {
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    document: { getElementById: (id) => elements.get(id) || null },
    ZoteroBridge: {
      isZotero: true,
      getPref: (_k, def) => def,
      async getActiveItem() { activeLookupCalls++; return { key: 'K1', title: 'Paper' }; }
    },
    registerModalCleanup(fn) { modalCleanups.push(fn); },
    t: (k) => k
  });

  exports.setupZoteroModalBindings({});
  assert.equal(timers.timers.size, 1);
  assert.equal(elements.get('btn-zotero-toggle-search').listenerCount('click'), 1);
  assert.equal(elements.get('btn-zotero-fetch-active').listenerCount('click'), 1);

  modalCleanups.forEach((fn) => fn());
  assert.equal(timers.timers.size, 0);
  assert.equal(elements.get('btn-zotero-toggle-search').listenerCount('click'), 0);
  assert.equal(elements.get('btn-zotero-fetch-active').listenerCount('click'), 0);
  timers.flushTimers();
  assert.equal(activeLookupCalls, 0);
});

test('submission autosave rebind cancels prior timers and removes window listeners', () => {
  const timers = makeFakeTimers();
  const win = makeEventTarget('win');
  const statusEl = makeEventTarget('autosave-status');
  const editCenter = makeEventTarget('submission-entry-editor-panel');
  editCenter.querySelector = (sel) => (sel === '[data-submission-autosave-status]' ? statusEl : null);
  const doc = Object.assign(makeEventTarget('doc'), {
    getElementById: (id) => (id === 'submission-entry-editor-panel' ? editCenter : null)
  });
  let saves = 0;
  function MockInput() {}
  function MockTextArea() {}
  function MockSelect() {}

  const { exports } = loadCjsModule('src/modules/submissions-view/autosave-and-editor.ts', {
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    window: win,
    document: doc,
    HTMLInputElement: MockInput,
    HTMLTextAreaElement: MockTextArea,
    HTMLSelectElement: MockSelect,
    db: { submissions: [{ id: 'sub-1', title: 'A' }] },
    collectSubmissionChecklistFromEditor: () => [],
    collectSubmissionChecklistKeysFromEditor: () => [],
    collectSubmissionReviewMatrixFromEditor: () => [],
    saveSubmissionEditFromValues: async () => { saves++; return true; },
    storage: { saveAll: async () => { saves++; } },
    t: (k) => k
  });

  const sub = { id: 'sub-1', title: 'A' };
  exports.setupSubmissionAutoSave(sub);
  const titleInput = Object.assign(new MockInput(), makeEventTarget('sub-edit-title'), { value: 'Updated Title', tagName: 'INPUT' });
  doc.getElementById = (id) => (id === 'submission-entry-editor-panel' ? editCenter : (id === 'sub-edit-title' ? titleInput : null));
  editCenter.dispatchEvent({ type: 'input', target: titleInput });
  assert.equal(timers.timers.size, 1);
  assert.equal(editCenter.listenerCount('input'), 1);
  assert.equal(win.listenerCount('pagehide'), 1);
  assert.equal(doc.listenerCount('visibilitychange'), 1);

  exports.setupSubmissionAutoSave(sub);
  assert.equal(timers.timers.size, 0, 'prior pending autosave debounce timer must be cancelled');
  assert.equal(editCenter.listenerCount('input'), 1);
  assert.equal(win.listenerCount('pagehide'), 1);
  assert.equal(doc.listenerCount('visibilitychange'), 1);
  timers.flushTimers();
  assert.equal(saves, 0);
});
