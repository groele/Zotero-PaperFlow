# Database import and recovery guarantees

The Zotero host owns `researchflow-data.json` and the latest pre-import recovery snapshot, `researchflow-pre-import-backup.json`. Keep these names and existing add-on/preference identities compatible.

## Commit ordering

Host reads, saves, imports and restores share one queue. An import reads the latest preceding committed state, prepares its merged snapshot, writes an atomic pre-import backup and then atomically writes the database. Another queued operation cannot enter between these steps. A failed backup prevents the import write; a failed database write preserves the preceding committed cache and recovery snapshot. Later operations can retry after failures.

Payloads are copied when a save/import is requested. Read results and saved results are separate copies, so an unsaved UI edit cannot silently mutate the host cache or change what the next import backs up. First-run initialization uses the same queue without nesting a queued save inside a queued read.

## Merge and validation

- Merge all six collections by ID: research areas, projects, research records, manuscripts, submission rounds and tasks.
- For an existing ID, explicitly imported fields take precedence; unspecified fields remain. Explicitly imported arrays, such as a review list, replace the corresponding field rather than attempting an undocumented element merge.
- Merge nested settings while retaining unspecified local settings. Merge deletion logs by ID and newest deletion timestamp; older or undated records do not resurrect a deleted entity. A record updated after its deletion marker can reappear.
- Preserve custom record fields, submission histories, review replies and Zotero link identifiers unless the imported record explicitly replaces their fields.
- Reject unsupported schemas, malformed collections, missing/duplicate record IDs, invalid settings containers and malformed deletion-log containers before changing an existing recovery backup.
- Overwrite mode intentionally replaces the database instead of merging it. Restore validates its backup before committing.
- Native import/restore errors remain visible errors. The workspace must not silently switch to browser storage after a host operation fails.

## Validation and boundaries

Run `node --test tests/*.test.js` and build with `python tools/build-xpi.py`. Regression tests exercise queue ordering, recovery failure, retries, caller mutation, corrupt files, schema validation and UI error routing.

The 2026-10-22 release was tested in an isolated Windows Zotero 10.0.6 profile using real IOUtils writes, Fluent messages, concurrent host operations, backup restoration and a fresh-process restart. These checks cover the tested Zotero 10.0.6 profile only; they do not establish compatibility across every declared host version.

This queue coordinates one host process. It does not implement optimistic revision checks for two editors saving different stale full snapshots, cross-process file locking, cross-device conflict resolution, or recovery from power loss spanning both database and backup files. The browser-only legacy import adapter is outside this change. Main-profile installation, manual file-picker interaction and cloud-provider acceptance were not performed.
