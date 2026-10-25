const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../chrome/content/scripts/zotero-bridge.js'), 'utf8');
function bridge(host, extras = {}) {
  const context = vm.createContext({ URLSearchParams, window: { Zotero: host ? { ResearchFlow: host } : null, parent: {},
    location: { search: '', protocol: 'chrome:', hostname: 'researchflow' } }, ...extras });
  vm.runInContext(source, context);
  const value = context.ZoteroBridge; value.isZotero = true; return value;
}
test('native recovery failures are propagated without retrying through the message bridge', async () => {
  let calls = 0;
  const value = bridge({ databaseConflictRecovery: async () => { calls++; throw new Error('disk full'); } });
  value.request = () => { throw new Error('duplicate transport'); };
  await assert.rejects(value.conflictRecovery('apply', { token: 'preview' }), /disk full/);
  assert.equal(calls, 1);
});
test('message recovery waits for the final write acknowledgement and forwards the preview token', async () => {
  const value = bridge();
  value.request = async (type, payload, timeout) => {
    assert.equal(type, 'RESEARCHFLOW_CONFLICT_RECOVERY'); assert.equal(timeout, 0);
    assert.equal(payload.action, 'apply'); assert.equal(payload.payload.token, 'preview');
    return { success: true, data: { backup: 'preserved.json' } };
  };
  assert.equal((await value.conflictRecovery('apply', { token: 'preview' })).backup, 'preserved.json');
});
test('invalid actions and failed reads do not become successful recovery results', async () => {
  const value = bridge(); value.request = async () => ({ success: false, error: 'stale preview' });
  await assert.rejects(value.conflictRecovery('inspect', { id: 'draft' }), /stale preview/);
  await assert.rejects(value.conflictRecovery('delete'), /Invalid recovery action/);
  value.isZotero = false;
  await assert.rejects(value.conflictRecovery('list'), /requires Zotero/);
});

test('a standalone privileged workspace resolves the existing host without WindowWatcher arguments', async () => {
  let calls = 0;
  const value = bridge(null, { Components: { interfaces: { nsISupports: {} }, classes: { '@zotero.org/Zotero;1': {
    getService: () => ({ wrappedJSObject: { ResearchFlow: { databaseConflictRecovery: async () => { calls++; return { entries: [] }; } } } })
  } } } });
  value.detectEnvironment();
  assert.equal((await value.conflictRecovery('list')).entries.length, 0); assert.equal(calls, 1);
});

test('host service lookup is limited to the PaperFlow chrome origin', async () => {
  let calls = 0;
  const value = bridge(null, { window: { location: { search: '', protocol: 'https:', hostname: 'example.org' }, parent: {} },
    Components: { classes: { '@zotero.org/Zotero;1': { getService() { calls++; } } }, interfaces: {} } });
  value.detectEnvironment(); assert.equal(calls, 0);
});

test('a service lookup failure still allows an embedded page to use its existing parent host', async () => {
  const host = { ResearchFlow: { databaseConflictRecovery: async () => ({ entries: ['parent'] }) } };
  const value = bridge(null, { window: { parent: { Zotero: host }, location: { search: '', protocol: 'chrome:', hostname: 'researchflow' } },
    Components: { interfaces: {}, classes: { '@zotero.org/Zotero;1': { getService() { throw new Error('not exposed here'); } } } } });
  value.detectEnvironment();
  assert.equal((await value.conflictRecovery('list')).entries[0], 'parent');
});

test('standalone windows receive their host before DOM initialization and release window tracking on close', () => {
  const text = fs.readFileSync(path.join(__dirname, '../chrome/content/scripts/index.js'), 'utf8');
  const method = text.slice(text.indexOf('    openStandaloneWindow('), text.indexOf('    openPreferencesPane('));
  const handlers = new Map(); let opened, focused = false;
  const page = {}, win = { wrappedJSObject: page, addEventListener: (name, fn) => handlers.set(name, fn), focus() { focused = true; } };
  const host = {}, main = { setTimeout: fn => fn() };
  const runtime = vm.runInNewContext(`({ ${method} })`, { CHROME_ROOT: 'chrome://researchflow/content/',
    Zotero: Object.assign(host, { getMainWindow: () => main }), Services: { ww: { openWindow: (...args) => { opened = args; return win; } } } });
  runtime.openStandaloneWindow({ view: 'view-settings', settingsOnly: true });
  assert.equal(page.Zotero, host);
  assert.ok(opened[1].endsWith('settingsOnly=1#paperflow-recovery'));
  assert.equal(opened[2], 'ResearchFlow_Recovery');
  assert.equal(page._researchflowPending.view, 'view-settings');
  delete page.Zotero; handlers.get('DOMContentLoaded')(); assert.equal(page.Zotero, host);
  assert.equal(runtime._standaloneWindows.size, 1);
  handlers.get('unload')(); assert.equal(runtime._standaloneWindows.size, 1);
  win.closed = true; handlers.get('unload')();
  assert.equal(runtime._standaloneWindows.size, 0); assert.ok(focused);
});
