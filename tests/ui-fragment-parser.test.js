const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const vm = require('node:vm');
const path = require('node:path');

test('inert parsing preserves form state and sanitizes active markup before importing it', () => {
  function element(tagName, attrs = {}, children = []) {
    const node = {
      nodeType: 1, tagName, attributes: Object.entries(attrs).map(([name, value]) => ({ name, value })),
      childNodes: children,
      removeAttribute(name) { this.attributes = this.attributes.filter(attr => attr.name !== name); },
      remove() { this.parent.childNodes = this.parent.childNodes.filter(child => child !== this); },
    };
    children.forEach(child => { child.parent = node; });
    return node;
  }
  const input = element('INPUT', { checked: '', value: 'safe', onfocus: 'unsafe()' });
  const option = element('OPTION', { selected: '', value: 'a' });
  const link = element('A', { href: 'java\nscript:unsafe()', style: 'background:url(unsafe)' });
  const body = element('BODY', {}, [input, element('SELECT', {}, [option]), link,
    element('SCRIPT'), element('IFRAME'), element('foreignObject')]);
  let imported = 0;
  const doc = {
    createRange() { throw new Error('Privileged fragment parser must not be used'); },
    createDocumentFragment: () => ({ childNodes: [], appendChild(node) { this.childNodes.push(node); } }),
    importNode(node, deep) { assert.equal(deep, true); imported++; return node; },
    defaultView: { DOMParser: class { parseFromString() { return { body }; } } },
  };
  const result = buildSync({ entryPoints: [path.join(__dirname, '../src/modules/ui-utils/dom-helpers.ts')],
    bundle: true, format: 'cjs', write: false, platform: 'node' });
  const context = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, context);
  const fragment = context.module.exports.createFragment(doc, '<template fixture>');
  assert.deepEqual(fragment.childNodes.map(node => node.tagName), ['INPUT', 'SELECT', 'A']);
  assert.equal(imported, 3);
  assert.ok(input.attributes.some(attr => attr.name === 'checked'));
  assert.ok(option.attributes.some(attr => attr.name === 'selected'));
  assert.ok(!input.attributes.some(attr => attr.name === 'onfocus'));
  assert.equal(link.attributes.length, 0);
});
