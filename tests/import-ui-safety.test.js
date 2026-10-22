const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../chrome/content/scripts/options.js'), 'utf8');
const start = source.indexOf("  document.getElementById('btn-trigger-import').addEventListener");
const end = source.indexOf('  // Handle Imported JSON File', start);
assert.ok(start >= 0 && end > start);

for (const action of ['import', 'restore']) {
  for (const failure of ['reported', 'thrown']) {
    test(`native ${action} ${failure} error is visible and never falls back to browser data`, async () => {
      const handlers = {}, errors = [];
      let fallbacks = 0;
      const failing = async () => {
        if (failure === 'thrown') throw new Error('Native operation failed');
        return { success: false, error: 'Native operation failed' };
      };
      const context = vm.createContext({
        window: {}, ZoteroBridge: { isZotero: true, importDatabase: failing, restoreBackup: failing },
        document: { getElementById: id => ({ addEventListener: (_, fn) => { handlers[id] = fn; },
          click: () => { fallbacks++; } }) },
        RFPlatform: { storage: { local: { get: () => { fallbacks++; } } } },
        t: key => key, confirm: () => true, console: { warn() {}, error() {} },
        showGlobalToast: (message, state) => { errors.push({ message, state }); }
      });
      vm.runInContext(source.slice(start, end), context);
      await handlers[action === 'import' ? 'btn-trigger-import' : 'btn-restore-import-backup']();
      assert.equal(fallbacks, 0);
      assert.equal(errors.length, 1);
      assert.equal(errors[0].message, 'Native operation failed');
      assert.equal(errors[0].state, 'error');
    });
  }
}
