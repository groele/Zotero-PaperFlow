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

test('native action mount includes SVG share icon when createElementNS is supported', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/modules/dashboard-view/card-actions.ts'), 'utf8');
  const context = { exports: {}, module: { exports: {} }, t: key => (key === 'shareJourney' ? '分享历程' : key) };
  vm.runInNewContext(transformSync(source, { loader: 'ts', format: 'cjs' }).code, context);
  const bar = { children: [], replaceChildren(...buttons) { this.children = buttons; } };
  const card = {
    querySelector: () => bar,
    ownerDocument: {
      createElement: tag => ({
        tag,
        dataset: {},
        children: [],
        setAttribute(k, v) { this[k] = v; },
        replaceChildren(...kids) { this.children = kids; }
      }),
      createElementNS: (ns, tag) => ({
        ns,
        tag,
        dataset: {},
        children: [],
        setAttribute(k, v) { this[k] = v; },
        append(...kids) { this.children.push(...kids); }
      })
    }
  };
  const mount = context.module.exports.mountPipelineActions;
  mount(card, 'sub-99', 'Paper Title');
  assert.equal(bar.children.length, 4);
  const shareBtn = bar.children.find(b => b.className.includes('btn-pipeline-share'));
  assert.ok(shareBtn);
  assert.equal(shareBtn.children.length, 2, 'Share button must have svg icon and text span');
  assert.equal(shareBtn.children[0].tag, 'svg');
  assert.equal(shareBtn.children[0].viewBox, '0 0 24 24');
  assert.equal(shareBtn.children[1].tag, 'span');
  assert.equal(shareBtn.children[1].textContent, '分享历程');
});

test('bindPipelineCardInteractions binds click handlers to all four card action buttons', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/modules/dashboard-view/card-interactions.ts'), 'utf8');
  const calls = { open: 0, add: 0, manage: 0, share: 0 };
  const context = {
    exports: {},
    module: { exports: {} },
    navigateToSubmissionDetails: (id) => { calls.open++; },
    toggleInlineStageEditor: (card, open) => { calls.add++; },
    openTimelineEventManager: (id) => { calls.manage++; },
    openSubmissionSharePreview: (id, btn) => { calls.share++; },
    t: k => k
  };
  vm.runInNewContext(transformSync(source, { loader: 'ts', format: 'cjs' }).code, context);

  function makeMockBtn(className) {
    const listeners = [];
    return {
      className,
      addEventListener(type, fn) { if (type === 'click') listeners.push(fn); },
      click() { listeners.forEach(fn => fn({ stopPropagation() {}, currentTarget: this })); }
    };
  }

  const btnOpen = makeMockBtn('btn-secondary btn-sm btn-pipeline-open');
  const btnAdd = makeMockBtn('btn-secondary btn-sm btn-pipeline-add');
  const btnManage = makeMockBtn('btn-secondary btn-sm btn-pipeline-manage');
  const btnShare = makeMockBtn('btn-secondary btn-sm btn-pipeline-share');

  const card = {
    querySelectorAll: (sel) => {
      if (sel.includes('.btn-pipeline-open')) return [btnOpen];
      if (sel.includes('.btn-pipeline-add')) return [btnAdd];
      if (sel.includes('.btn-pipeline-manage')) return [btnManage];
      if (sel.includes('.btn-pipeline-share')) return [btnShare];
      return [];
    },
    querySelector: () => null
  };

  const bind = context.module.exports.bindPipelineCardInteractions;
  bind(card, { id: 'sub-test-123' });

  btnOpen.click();
  assert.equal(calls.open, 1, 'Details button must call navigateToSubmissionDetails');

  btnAdd.click();
  assert.equal(calls.add, 1, 'Add Event button must call toggleInlineStageEditor');

  btnManage.click();
  assert.equal(calls.manage, 1, 'Manage Events button must call openTimelineEventManager');

  btnShare.click();
  assert.equal(calls.share, 1, 'Share button must call openSubmissionSharePreview');
});
