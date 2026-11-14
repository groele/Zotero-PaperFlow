# Third-party rights and release checklist

PaperFlow's rights holder describes the original PaperFlow code as independently developed, **not as a fork or derivative of another Zotero plugin**. This does not imply ownership of third-party software, external datasets or trademarks.

## Declared build dependencies
package.json (reviewed 2026-11-14) declares:
- esbuild: 0.28.2 — MIT (verify resolved distribution's license).
- TypeScript: 5.9.3 — Apache-2.0 (verify resolved distribution's license).
- @types/node: ^22.13.0 — MIT (verify resolved distribution's license).

These are declared as development dependencies. Whether any third-party runtime code or assets enter a published XPI must be verified against the **actual package**, not inferred from package.json.

## Other rights and publication
- Zotero APIs, Zotero name and logos are controlled by their respective owners. Independence and non-endorsement must remain clear.
- If any third-party icon, font, design, snippet, template, data, or bundled runtime component is added, record source URL, exact version, copyright, license, obligations, and distribution path.
- External journal information, editorial correspondence and user content do not become PaperFlow's proprietary content through storage in the plugin.

## Before publishing an XPI
- [ ] Inspect the assembled XPI and all bundled assets.
- [ ] Check resolved dependencies and any vendored code against upstream LICENSE/NOTICE files.
- [ ] Ship all required copyright, license and attribution notices.
- [ ] Make complete corresponding source and build instructions available to recipients as required by AGPL-3.0-or-later.
- [ ] Check that published update links and source references resolve to the matching version.
- [ ] Repeat when adding assets or dependencies.

This is a documented verification framework, not an assertion that an exhaustive source audit has been completed.
