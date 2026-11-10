const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transformSync } = require('esbuild');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('both workspace entry pages expose the modal nodes used by the controller', () => {
  for (const entry of ['index.html', 'pages/options.html']) {
    const html = fs.readFileSync(path.join(__dirname, '../chrome/content', entry), 'utf8');
    assert.match(html, /id="modal-overlay"/);
    assert.match(html, /id="modal-body"/);
  }
});

test('native action mount restores stripped controls with safe text and submission identity', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/modules/dashboard-view/card-actions.ts'), 'utf8');
  const context = { exports: {}, module: { exports: {} }, t: key => key };
  vm.runInNewContext(transformSync(source, { loader: 'ts', format: 'cjs' }).code, context);
  const bar = { children: [], replaceChildren(...buttons) { this.children = buttons; } };
  const card = {
    querySelector: () => bar,
    ownerDocument: {
      createElement: tag => ({ tag, dataset: {}, setAttribute(key, value) { this[key] = value; } }),
    },
  };
  const title = '<img src=x onerror=alert(1)>';
  const mount = context.module.exports.mountPipelineActions;
  mount(card, 'sub-1', title);
  assert.deepEqual(bar.children.map(b => b.className.split(' ').at(-1)), [
    'btn-pipeline-open', 'btn-pipeline-add', 'btn-pipeline-manage', 'btn-pipeline-share',
  ]);
  for (const button of bar.children) {
    assert.equal(button.tag, 'button');
    assert.equal(button.type, 'button');
    assert.equal(button.dataset.subId, 'sub-1');
    assert.ok(button['aria-label'].endsWith(title));
    assert.ok(button.textContent.length > 0);
    assert.equal(button.innerHTML, undefined);
  }
  mount(card, 'sub-2', title);
  assert.equal(bar.children.length, 4, 'rerender replaces controls without duplication');
  assert.ok(bar.children.every(b => b.dataset.subId === 'sub-2'));
});
