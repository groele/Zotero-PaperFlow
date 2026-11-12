const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const loadScript = (rel) => fs.readFileSync(path.join(root, 'chrome/content/scripts', rel), 'utf8');

function createDateSandbox(fixedIsoUtc, localParts) {
  const RealDate = Date;
  const fixedMs = RealDate.parse(fixedIsoUtc);
  class FakeDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(fixedMs);
      else super(...args);
    }
    static now() { return fixedMs; }
    getFullYear() { return this.getTime() === fixedMs ? localParts.year : super.getFullYear(); }
    getMonth() { return this.getTime() === fixedMs ? localParts.month - 1 : super.getMonth(); }
    getDate() { return this.getTime() === fixedMs ? localParts.day : super.getDate(); }
  }

  const elements = new Map();
  const makeEl = (id = '') => ({
    id,
    tagName: 'DIV',
    children: [],
    childNodes: [],
    className: '',
    textContent: '',
    title: '',
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k] || ''; },
    appendChild(c) { this.children.push(c); this.childNodes.push(c); return c; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {}
  });

  const sandbox = {
    console,
    Date: FakeDate,
    Math,
    Array,
    Object,
    Boolean,
    String,
    Number,
    Set,
    Map,
    JSON,
    RegExp,
    db: { manuscripts: [], submissions: [], settings: { profile: { theme: 'light' } } },
    currentLanguage: 'en',
    currentDashboardFilter: 'all',
    t: (k) => k,
    tf: (k, v) => `${k}:${JSON.stringify(v || {})}`,
    escapeHTML: (s) => String(s ?? ''),
    RFUI: { setHTML: (el, html) => { el.innerHTML = html; el.children = []; el.childNodes = []; } },
    RFCore: { getCurrentSubmission: () => null },
    document: {
      getElementById: (id) => {
        if (!elements.has(id)) elements.set(id, makeEl(id));
        return elements.get(id);
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => makeEl(),
      documentElement: { lang: '', dataset: {} }
    }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const ctx = vm.createContext(sandbox);
  vm.runInContext(loadScript('core/research-core.js'), ctx);
  vm.runInContext(loadScript('modules/i18n.js'), ctx);
  vm.runInContext(loadScript('modules/timeline-engine.js'), ctx);
  vm.runInContext(loadScript('modules/academic-sync.js'), ctx);
  vm.runInContext(loadScript('modules/dashboard-view.js'), ctx);
  return { ctx, elements };
}

test('P1: todayString uses local calendar date instead of UTC midnight shift', () => {
  // 2026-11-11 17:30 UTC is 2026-11-12 01:30 in UTC+8
  const { ctx } = createDateSandbox('2026-11-11T17:30:00.000Z', { year: 2026, month: 11, day: 12 });
  assert.equal(ctx.todayString(), '2026-11-12');
});

test('P1: addDays returns exact +14 calendar date without UTC off-by-one shift', () => {
  const RealDate = Date;
  // Simulate a Date whose toISOString() is shifted back 1 day from its local midnight
  class ShiftedIsoDate extends RealDate {
    constructor(...args) {
      if (args.length === 1 && typeof args[0] === 'string' && args[0].endsWith('T00:00:00')) {
        super(args[0] + '.000Z');
        this._shiftIso = true;
      } else {
        super(...args);
      }
    }
    toISOString() {
      const shifted = new RealDate(this.getTime() - 8 * 3600 * 1000);
      return shifted.toISOString();
    }
  }
  const { ctx } = createDateSandbox('2026-11-12T04:00:00.000Z', { year: 2026, month: 11, day: 12 });
  ctx.Date = ShiftedIsoDate;
  assert.equal(ctx.addDays('2026-11-12', 14), '2026-11-26');
});

test('P1: computeNodeStatus and getRevisionCountdownMeta agree on overdue date in UTC+8 early morning', () => {
  // Local date is 2026-11-12 (00:30 UTC+8, still 2026-11-11T16:30Z); dueDate 2026-11-11 is overdue (-1d)
  const { ctx } = createDateSandbox('2026-11-11T16:30:00.000Z', { year: 2026, month: 11, day: 12 });
  const nodeStatus = ctx.computeNodeStatus({ dueDate: '2026-11-11', status: 'active' });
  const countdown = ctx.getRevisionCountdownMeta('2026-11-11');
  assert.equal(nodeStatus, 'overdue');
  assert.equal(countdown.level, 'overdue');
  assert.equal(countdown.days, -1);
});

test('P1: getSubmissionCycleTime returns null days when submissionDate missing and rejects negative duration', () => {
  const { ctx } = createDateSandbox('2026-11-12T10:00:00.000Z', { year: 2026, month: 11, day: 12 });
  const noDateCycle = ctx.getSubmissionCycleTime({
    id: 's1',
    status: 'submitted',
    createdAt: '2026-11-01T12:00:00.000Z',
    timelineNodes: []
  });
  assert.equal(noDateCycle.days, null);

  const invertedCycle = ctx.getSubmissionCycleTime({
    id: 's2',
    status: 'accepted',
    submissionDate: '2026-11-10',
    decisionDate: '2026-11-05',
    timelineNodes: []
  });
  assert.equal(invertedCycle.days, null, 'decision before submission must not become positive via Math.abs');
});

test('P1: revision submission without revisionDueDate does not hardcode days: 1', () => {
  const { ctx, elements } = createDateSandbox('2026-11-12T10:00:00.000Z', { year: 2026, month: 11, day: 12 });
  ctx.db.manuscripts = [
    { id: 'm1', title: 'No Deadline Paper', status: 'revision' },
    { id: 'm2', title: 'Dated Revision Paper', status: 'revision' }
  ];
  ctx.db.submissions = [
    { id: 's1', manuscriptId: 'm1', targetJournal: 'JACS', status: 'revision', revisionDueDate: '', timelineNodes: [] },
    { id: 's2', manuscriptId: 'm2', targetJournal: 'Angew', status: 'revision', revisionDueDate: '2026-11-14', timelineNodes: [] }
  ];
  ctx.renderTimelineAlerts();
  const milestones = elements.get('dashboard-pending-milestones');
  assert.equal(milestones.children.length, 2);
  // Real 2-day deadline should sort first; undated revision should not pretend days=1 and beat it
  assert.match(milestones.children[0].children[0].textContent, /Angew/);
});

test('P1: syncManuscriptToChildNote prioritizes zoteroItemKey, skips unbound DOI matches, and uses round field', async () => {
  const savedNotes = [];
  const db = {
    manuscripts: [
      { id: 'm_unbound', title: 'Unbound Old', zoteroItemKey: null, doi: '10.1000/shared', status: 'revision' },
      { id: 'm_bound', title: 'Bound Current', zoteroItemKey: 'ITEM_KEY', doi: '10.1000/other', status: 'submitted' }
    ],
    submissions: [
      { id: 'sub1', manuscriptId: 'm_bound', targetJournal: 'Journal R1', round: 1, status: 'rejected', createdAt: '2026-01-01T12:00:00.000Z' },
      { id: 'sub2', manuscriptId: 'm_bound', targetJournal: 'Journal R2', round: 2, previousSubmissionId: 'sub1', status: 'submitted', createdAt: '2026-01-01T12:00:00.000Z' }
    ]
  };
  const item = {
    id: 10, libraryID: 1, key: 'ITEM_KEY', deleted: false,
    isRegularItem: () => true, isEditable: () => true,
    getField: (f) => (f === 'DOI' ? '10.1000/shared' : 'Paper'),
    getCreators: () => [], getAttachments: () => [], getNotes: () => []
  };

  const makeCtx = (curDb) => {
    const c = vm.createContext({
      console, Date, Math, Array, Object, Boolean, String, Number, Set, Map, JSON, Promise,
      ADDON_ID: 'zotero-paperflow@groele.org', CHROME_ROOT: 'chrome://researchflow/content/', PREF_PREFIX: 'extensions.researchflow.',
      Services: { wm: { getEnumerator: () => ({ hasMoreElements: () => false }), addListener() {}, removeListener() {} } },
      Zotero: {
        log() {}, logError() {}, initializationPromise: Promise.resolve(), DataDirectory: { dir: '/d' },
        Prefs: { get: (_, f) => f, set() {}, registerObserver() {}, unregisterObserver() {} },
        Items: { get: () => null },
        Item: class { setNote(h) { this.note = h; } getNote() { return this.note; } addTag() {} async saveTx() { savedNotes.push(this); } },
        ItemPaneManager: { registerSection: () => 's', unregisterSection() {} },
        PreferencePanes: { register: async () => 'p', unregister() {} }
      },
      IOUtils: { exists: async () => true, readUTF8: async () => JSON.stringify(curDb), writeUTF8: async () => {} },
      PathUtils: { join: (...p) => p.join('/') }
    });
    vm.runInContext(loadScript('modules/academic-citation.js'), c);
    vm.runInContext(loadScript('modules/architecture-guard.js'), c);
    vm.runInContext(loadScript('modules/item-pane.js'), c);
    vm.runInContext(loadScript('index.js'), c);
    return c;
  };

  // Case 1: Key match wins over unbound DOI match, and Round 2 (`round: 2`) beats Round 1 even with identical timestamp
  const c1 = makeCtx(db);
  const note1 = await c1.Zotero.ResearchFlow.syncManuscriptToChildNote(item);
  assert.ok(note1);
  assert.ok(note1.getNote().includes('Bound Current'));
  assert.ok(note1.getNote().includes('Journal R2'));
  assert.ok(!note1.getNote().includes('Journal R1'));

  // Case 2: Only unbound manuscript with matching DOI -> must NOT write note
  savedNotes.length = 0;
  const c2 = makeCtx({ manuscripts: [db.manuscripts[0]], submissions: [] });
  const note2 = await c2.Zotero.ResearchFlow.syncManuscriptToChildNote(item);
  assert.equal(note2, null);
  assert.equal(savedNotes.length, 0);
});

test('P1: shutdown marks _disposed, awaits in-flight _saveQueue, and blocks subsequent saves', async () => {
  let resolveWrite;
  let releaseWrite;
  const writeGate = new Promise((res) => { releaseWrite = res; });
  let writeCount = 0;

  const initialDb = { schemaVersion: 7, revision: 1, manuscripts: [], submissions: [], researchAreas: [], projects: [], researchRecords: [], tasks: [], settings: {} };
  const c = vm.createContext({
    console, Date, Math, Array, Object, Boolean, String, Number, Set, Map, JSON, Promise, setTimeout, clearTimeout,
    ADDON_ID: 'zotero-paperflow@groele.org', CHROME_ROOT: 'chrome://researchflow/content/', PREF_PREFIX: 'extensions.researchflow.',
    Services: { wm: { getEnumerator: () => ({ hasMoreElements: () => false }), addListener() {}, removeListener() {} } },
    Zotero: {
      log() {}, logError() {}, initializationPromise: Promise.resolve(), DataDirectory: { dir: '/d' },
      Prefs: { get: (_, f) => f, set() {}, registerObserver() {}, unregisterObserver() {} },
      Items: { get: () => null },
      ItemPaneManager: { registerSection: () => 's', unregisterSection() {} },
      PreferencePanes: { register: async () => 'p', unregister() {} }
    },
    IOUtils: {
      exists: async () => true,
      readUTF8: async () => JSON.stringify(initialDb),
      writeUTF8: async () => {
        writeCount += 1;
        resolveWrite?.();
        await writeGate;
      }
    },
    PathUtils: { join: (...p) => p.join('/') }
  });
  const startedPromise = new Promise((r) => { resolveWrite = r; });
  vm.runInContext(loadScript('index.js'), c);
  const host = c.Zotero.ResearchFlow;

  const inflight = host.saveDatabase({ ...initialDb, manuscripts: [{ id: 'm1', title: 'A' }] });
  await startedPromise;

  let shutdownDone = false;
  const shutdownPromise = host.shutdown().then(() => { shutdownDone = true; });
  assert.equal(host._disposed, true);
  await Promise.resolve();
  assert.equal(shutdownDone, false, 'shutdown must await in-flight _saveQueue');

  releaseWrite();
  await inflight;
  await shutdownPromise;
  assert.equal(shutdownDone, true);

  await assert.rejects(() => host.saveDatabase({ ...initialDb }), /shutting down/i);
  assert.equal(writeCount, 1);
});

test('P2: shouldRunCloudSync respects ZoteroBridge autoSync pref and ResearchFlow_Preferences attaches window API + pref observer', async () => {
  const registeredObservers = [];
  const doc = {
    getElementById: () => ({
      innerHTML: '',
      value: 'tab',
      dataset: {},
      classList: { toggle() {} },
      querySelector: () => ({ disabled: false }),
      addEventListener() {},
      appendChild() {}
    }),
    l10n: { translateFragment: () => {} },
    createElement: () => ({ className: '', id: '', type: '', value: '', checked: false, selected: false, setAttribute() {}, addEventListener() {}, appendChild() {} })
  };
  const prefWin = {
    document: doc,
    addEventListener() {},
    Zotero: {
      Prefs: {
        get: () => 'tab',
        set() {},
        registerObserver: (pref, fn) => registeredObservers.push({ pref, fn }),
        unregisterObserver() {}
      }
    }
  };
  prefWin.window = prefWin;
  const prefCtx = vm.createContext(prefWin);
  vm.runInContext(loadScript('preferences.js'), prefCtx);
  assert.ok(prefCtx.window.ResearchFlow_Preferences, 'window.ResearchFlow_Preferences must be defined');
  assert.equal(typeof prefCtx.window.ResearchFlow_Preferences.init, 'function');
  prefCtx.window.ResearchFlow_Preferences.init(prefCtx.window);
  assert.ok(registeredObservers.length > 0, 'initPreferencesWindow must register Zotero.Prefs observer');

  let autoSyncPref = false;
  const storageWin = {
    console, JSON, Object, Array, Set, Map, Promise, Error, Date, Math,
    ZoteroBridge: { getPref: (k, def) => (k === 'autoSync' ? autoSyncPref : def) }
  };
  storageWin.window = storageWin;
  storageWin.globalThis = storageWin;
  const storageCtx = vm.createContext(storageWin);
  vm.runInContext(loadScript('storage.js'), storageCtx);
  const store = storageCtx.window.storage;
  const dbWithCloud = { settings: { syncProviders: { metadata: { provider: 'webdav', config: { url: 'https://dav.example.com', username: 'u', password: 'p' }, autoSync: true } } } };
  assert.equal(await store.shouldRunCloudSync(dbWithCloud), false, 'should skip cloud sync when autoSync pref is false');
  autoSyncPref = true;
  assert.equal(await store.shouldRunCloudSync({ settings: { autoSync: false, syncProviders: dbWithCloud.settings.syncProviders } }), false, 'should skip cloud sync when settings.autoSync is false');
});
