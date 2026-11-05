import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version || '14.0.1';
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

// 2. Also ensure standalone module scripts are generated / kept in sync for standalone HTML pages
const modules = [
  { in: 'src/modules/academic-citation.ts', out: 'chrome/content/scripts/modules/academic-citation.js' },
  { in: 'src/modules/architecture-guard.ts', out: 'chrome/content/scripts/modules/architecture-guard.js' },
  { in: 'src/modules/item-pane.ts', out: 'chrome/content/scripts/modules/item-pane.js' },
];

for (const mod of modules) {
  await build({
    absWorkingDir: root,
    entryPoints: [mod.in],
    outfile: mod.out,
    bundle: true,
    format: 'iife',
    target: ['firefox140'],
    charset: 'utf8',
    minify: false,
    legalComments: 'inline',
  });
}

console.log(`[build-source] Standalone modules compiled successfully.`);
