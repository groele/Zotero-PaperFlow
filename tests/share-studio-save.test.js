const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const vm = require('node:vm');
const path = require('node:path');

test('share studio uses the native save API and propagates cancellation and write failures', async () => {
  let response = { success: true, filePath: 'D:/fixture/图片.png' };
  let seen;
  const host = { async saveShareImageFile(bytes, filename, language) {
    assert.equal(this, host);
    seen = { bytes: Array.from(bytes), filename, language };
    return response;
  } };
  const context = { module: { exports: {} }, exports: {}, Uint8Array, Blob, currentLanguage: 'zh',
    window: { Zotero: { ResearchFlow: host } } };
  const result = buildSync({ entryPoints: [path.join(__dirname, '../src/modules/share-studio/preferences-and-data.ts')],
    bundle: true, format: 'cjs', write: false, platform: 'node' });
  vm.runInNewContext(result.outputFiles[0].text, context);
  const save = context.module.exports.savePngBlobWithPath;
  const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });
  assert.equal((await save(blob, 'image.png')).path, response.filePath);
  assert.equal(seen.filename, 'image.png');
  assert.equal(seen.language, 'zh');
  assert.deepEqual(seen.bytes, [137, 80, 78, 71]);
  response = { success: false, cancelled: true };
  assert.equal((await save(blob, 'image.png')).cancelled, true);
  response = { success: false, error: 'Permission denied' };
  await assert.rejects(save(blob, 'image.png'), /Permission denied/);
});
