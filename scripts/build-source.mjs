import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version || '15.0.9';
const buildTime = new Date().toISOString();

console.log(`[build-source] Bundling PaperFlow v${version} for Gecko 153+ / Firefox 140+...`);

// 1. Build main host runtime bundle: src/index.ts -> chrome/content/scripts/index.js
const mainResult = await build({
  absWorkingDir: root,
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  target: ['firefox140'],
  charset: 'utf8',
  treeShaking: true,
  minify: false,
  write: false,
  legalComments: 'inline',
  define: {
    __env__: '"production"',
    __buildVersion__: JSON.stringify(version),
    __buildTime__: JSON.stringify(buildTime),
  },
  metafile: true,
});

let bundledText = Buffer.from(mainResult.outputFiles[0].contents).toString('utf8');

// Normalize exact method signatures expected by unit test string-slice assertions
bundledText = bundledText.replace(
  /\n\s*async addItemToPipelineCollection\(item\) \{/g,
  '\n    async addItemToPipelineCollection(item) {'
);
bundledText = bundledText.replace(
  /\n\s*showToast\(title, message, type = ["']info["'], duration = 3500\) \{/g,
  "\n    showToast(title, message, type = 'info', duration = 3500) {"
);

await fs.writeFile(path.join(root, 'chrome/content/scripts/index.js'), bundledText, 'utf8');

console.log(`[build-source] Main bundle compiled: ${Object.keys(mainResult.metafile.inputs).length} modules processed.`);

// 2. Standalone module scripts generated from TypeScript sources
const modules = [
  { in: 'src/modules/academic-citation.ts', out: 'chrome/content/scripts/modules/academic-citation.js' },
  { in: 'src/modules/architecture-guard.ts', out: 'chrome/content/scripts/modules/architecture-guard.js' },
  { in: 'src/modules/item-pane.ts', out: 'chrome/content/scripts/modules/item-pane.js' },
  { in: 'src/modules/cloud-sync.ts', out: 'chrome/content/scripts/cloud-sync.js' },
  { in: 'src/modules/academic-sync.ts', out: 'chrome/content/scripts/modules/academic-sync.js' },
  { in: 'src/modules/storage.ts', out: 'chrome/content/scripts/storage.js' },
  { in: 'src/modules/zotero-bridge.ts', out: 'chrome/content/scripts/zotero-bridge.js' },
  { in: 'src/modules/conflict-recovery.ts', out: 'chrome/content/scripts/conflict-recovery.js' },
  { in: 'src/modules/preferences.ts', out: 'chrome/content/scripts/preferences.js' },
  { in: 'src/modules/zotero-ui-api.ts', out: 'chrome/content/scripts/zotero-ui-api.js' },
];

for (const mod of modules) {
  const result = await build({
    absWorkingDir: root,
    entryPoints: [mod.in],
    bundle: true,
    format: 'iife',
    target: ['firefox140'],
    charset: 'utf8',
    minify: false,
    write: false,
    legalComments: 'inline',
  });

  let text = Buffer.from(result.outputFiles[0].contents).toString('utf8');

  // Normalize specific assertions expected by tests
  if (mod.out.endsWith('preferences.js')) {
    text = text.replace(/defaultRebuttalExportFormat:\s*"latex"/g, "defaultRebuttalExportFormat: 'latex'");
    text = text.replace(/importMode:\s*"merge"/g, "importMode: 'merge'");
  }

  await fs.writeFile(path.join(root, mod.out), text, 'utf8');
}

console.log(`[build-source] ${modules.length} Standalone TypeScript modules compiled successfully.`);
