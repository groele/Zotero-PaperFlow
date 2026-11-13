const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs');
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
    children: [],
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
    appendChild(child) { this.children.push(child); return child; },
    insertBefore(child) { this.children.push(child); return child; },
    replaceChildren(...items) { this.children = [...items]; },
    remove() {}
  };
}

function makeFakeTimers() {
  let nextId = 1;
  const timers = new Map();
  return {
    timers,
    setTimeout(fn, delay) { const id = nextId++; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
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

test('initPreferencesWindow aborts prior listeners across resets and cleans up on unload', () => {
  const win = makeEventTarget('prefs-win');
  const elements = new Map();
  const getEl = (id) => {
    if (!elements.has(id)) {
      const el = Object.assign(makeEventTarget(id), { value: 'tab', innerHTML: '' });
      el.appendChild = (c) => { if (c.id) elements.set(c.id, c); return c; };
      elements.set(id, el);
    }
    return elements.get(id);
  };
  let unregistered = 0;
  const zotero = {
    Prefs: {
      _map: new Map(),
      get(k, fb) { return this._map.has(k) ? this._map.get(k) : fb; },
      set(k, v) { this._map.set(k, v); },
      registerObserver() {},
      unregisterObserver() { unregistered++; }
    }
  };
  const doc = {
    documentElement: { lang: 'en' },
    getElementById: getEl,
    createElement(tag) {
      const el = Object.assign(makeEventTarget(), { tagName: tag });
      el.appendChild = (c) => { if (c.id) elements.set(c.id, c); return c; };
      return el;
    },
    createElementNS(_ns, tag) { return this.createElement(tag); }
  };
  win.document = doc;
  win.Zotero = zotero;

  const { exports } = loadCjsModule('src/modules/preferences/controller.ts', { window: win, document: doc, Zotero: zotero });
  const resetBtn = getEl('rf-btn-reset-defaults');
  const importMode = getEl('rf-import-mode');
  exports.initPreferencesWindow(win);
  exports.initPreferencesWindow(win);
  exports.initPreferencesWindow(win);

  assert.equal(resetBtn.listenerCount('click'), 1);
  assert.equal(importMode.listenerCount('change'), 1);
  assert.equal(win.listenerCount('unload'), 1);

  win.dispatchEvent('unload');
  assert.equal(resetBtn.listenerCount('click'), 0);
  assert.equal(importMode.listenerCount('change'), 0);
  assert.ok(unregistered >= 1);
});

test('host removeFromWindow aborts window listeners and pending toolbar timers', () => {
  const timers = makeFakeTimers();
  const indexSource = fs.readFileSync(path.join(ROOT, 'chrome/content/scripts/index.js'), 'utf8');
  const win = makeEventTarget('zotero-main-win');
  const doc = {
    getElementById: () => null,
    querySelector: () => null,
    createXULElement: (tag) => makeEventTarget(tag),
    head: makeEventTarget('head'),
    documentElement: makeEventTarget('root')
  };
  Object.assign(win, {
    document: doc,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    ZoteroPane: { getSelectedItems: () => [] }
  });
  const context = vm.createContext({
    console,
    AbortController,
    AbortSignal,
    Set,
    Map,
    WeakMap,
    ADDON_ID: 'zotero-paperflow@groele.org',
    CHROME_ROOT: 'chrome://researchflow/content/',
    PREF_PREFIX: 'extensions.researchflow.',
    Services: { wm: { getEnumerator: () => ({ hasMoreElements: () => false }), addListener() {}, removeListener() {} } },
    Zotero: {
      log() {},
      logError() {},
      Prefs: { get: (_k, d) => d, set() {}, registerObserver() {}, unregisterObserver() {} },
      ItemPaneManager: { registerSection: () => 'sec1', unregisterSection() {} },
      PreferencePanes: { unregister() {} }
    }
  });
  vm.runInNewContext(indexSource, context);
  const host = context.Zotero.PaperFlow;
  host.addToWindow(win);
  assert.equal(win.listenerCount('keydown'), 1);
  assert.equal(win.listenerCount('message'), 1);
  assert.ok(timers.timers.size >= 1);

  host.removeFromWindow(win);
  assert.equal(win.listenerCount('keydown'), 0);
  assert.equal(win.listenerCount('message'), 0);
  assert.equal(timers.timers.size, 0);
});

test('ItemPaneSection aborts prior render listeners on re-render and onDestroy', async () => {
  const timers = makeFakeTimers();
  let registered = null;
  const created = [];
  const doc = {
    createElement(tag) {
      const el = makeEventTarget(tag);
      el.append = (...nodes) => { el.children.push(...nodes); };
      created.push(el);
      return el;
    },
    createElementNS(_ns, tag) {
      const el = makeEventTarget(tag);
      el.append = (...nodes) => { el.children.push(...nodes); };
      created.push(el);
      return el;
    },
    defaultView: null
  };
  const body = Object.assign(makeEventTarget('pane-body'), { ownerDocument: doc });
  body.append = (...nodes) => { body.children.push(...nodes); };
  const item = { key: 'ITEM1', getField: () => 'My Paper' };
  const host = {
    addonId: 'zotero-paperflow@groele.org',
    CHROME_ROOT: 'chrome://researchflow/content/',
    getLiteratureItem: (it) => it,
    registerDataListener() {},
    unregisterDataListener() {},
    async loadDatabase() {
      return {
        manuscripts: [{ id: 'm1', title: 'My Paper', status: 'under_review', zoteroItemKey: 'ITEM1' }],
        submissions: []
      };
    },
    serializeLiteratureItem: () => ({ key: 'ITEM1' }),
    triggerResearchFlowOpen() {}
  };
  const { exports } = loadCjsModule('src/modules/item-pane.ts', {
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    window: { setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout },
    Zotero: {
      log() {},
      logError() {},
      ItemPaneManager: { registerSection: (def) => { registered = def; return 'pane1'; } }
    }
  });
  exports.registerItemPaneSection(host);
  assert.ok(registered);

  registered.onInit({ doc, body, item, refresh: () => {} });
  await registered.onRender({ body, item, setSectionSummary() {} });
  const firstClickTargets = created.filter((el) => el.listenerCount('click') > 0);
  assert.ok(firstClickTargets.length >= 1);

  await registered.onRender({ body, item, setSectionSummary() {} });
  firstClickTargets.forEach((el) => assert.equal(el.listenerCount('click'), 0));

  const secondClickTargets = created.filter((el) => el.listenerCount('click') > 0);
  assert.ok(secondClickTargets.length >= 1);

  registered.onDestroy({ body });
  created.forEach((el) => assert.equal(el.listenerCount('click'), 0));
});
