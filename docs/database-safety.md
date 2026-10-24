# Database import and recovery guarantees

The Zotero host owns `researchflow-data.json` and the latest pre-import recovery snapshot, `researchflow-pre-import-backup.json`. Keep these names and existing add-on/preference identities compatible.

## Commit ordering

Host reads, saves, imports and restores share one queue. An import reads the latest preceding committed state, prepares its merged snapshot, writes an atomic pre-import backup and then atomically writes the database. Another queued operation cannot enter between these steps. A failed backup prevents the import write; a failed database write preserves the preceding committed cache and recovery snapshot. Later operations can retry after failures.

Zotero-hosted full-database saves carry the revision read by the editor. Every successful write, including import and restore, increments the local revision; imported or restored revision numbers cannot rewind or replace it. The direct and message bridges adopt the committed host snapshot, and background synchronization supplies the same revision precondition.

When an editor is stale, the host performs a three-way merge of its original revision, submitted edits and the latest committed snapshot inside the write queue. Independent records, independent fields, nested settings and lists with unique record IDs merge automatically. A reorder is retained when the other writer only changes record fields; incompatible concurrent reorders conflict. Plain arrays without unique IDs are treated as indivisible values. The history retains at most 12 revisions and 4 Mi UTF-16 code units of serialized JSON; if the base is no longer available, the save follows the conflict-recovery path instead of guessing.

Conflicting changes to the same field, deletion versus modification, unavailable bases and stale intentional replacements leave the main database and pre-import backup unchanged. The host atomically saves a uniquely named local `researchflow-data.json.conflict-*.json` recovery file containing the base (when available), submitted version, current version and conflict field paths. A localized error identifies this file. A failed draft write reports failure without claiming recovery succeeded. Drafts stay local and are not uploaded by this feature. Review and retain or remove these recovery files as needed; this feature does not delete them automatically.

Successful overwrite imports and restores reset merge history so old editors cannot silently reintroduce data deliberately replaced by the user. Failed writes retain the preceding revision and merge history.

Payloads are copied when a save/import is requested. Read results and saved results are separate copies, so an unsaved UI edit cannot silently mutate the host cache or change what the next import backs up. First-run initialization uses the same queue without nesting a queued save inside a queued read.

Frontend saves also freeze the request before normalization. A late response rebases edits made during the request onto the committed snapshot only when independent. The committed frontend cache remains detached from the live editor. Overlapping changes preserve the live draft and its original revision so another save can use the host conflict-recovery path; the UI reports pending edits. Older responses cannot replace a newer adopted revision. Data-update broadcasts do not replace an editor known to have pending edits.

## Merge and validation

- Merge all six collections by ID: research areas, projects, research records, manuscripts, submission rounds and tasks.
- For an existing ID, explicitly imported fields take precedence; unspecified fields remain. Explicitly imported arrays, such as a review list, replace the corresponding field rather than attempting an undocumented element merge.
- Merge nested settings while retaining unspecified local settings. Merge deletion logs by ID and newest deletion timestamp; older or undated records do not resurrect a deleted entity. A record updated after its deletion marker can reappear.
- Preserve custom record fields, submission histories, review replies and Zotero link identifiers unless the imported record explicitly replaces their fields.
- Reject unsupported schemas, malformed collections, missing/duplicate record IDs, invalid settings containers and malformed deletion-log containers before changing an existing recovery backup.
- Overwrite mode intentionally replaces the database instead of merging it. Restore validates its backup before committing.
- A validated backup can recover an unreadable main file. If no readable committed revision is available, recovery starts from the backup revision plus one; it does not cache a partial database on failure.
- Native import/restore errors remain visible errors. The workspace must not silently switch to browser storage after a host operation fails.

## Validation and boundaries

Run `node --test tests/*.test.js` and build with `python tools/build-xpi.py`. Regression tests exercise queue ordering, recovery failure, retries, caller mutation, corrupt files, schema validation and UI error routing.

The 2026-10-22 release was tested in an isolated Windows Zotero 10.0.6 profile using real IOUtils writes, Fluent messages, concurrent host operations, backup restoration and a fresh-process restart. These checks cover the tested Zotero 10.0.6 profile only; they do not establish compatibility across every declared host version.

This queue coordinates one host process. Revision checks protect editor and background-sync writes in the Zotero host; legacy direct callers without a precondition remain compatible. Automatic merging requires an available baseline and compatible edits; true same-field conflicts still require a final choice using the preserved drafts. Cross-process file locking, cross-device conflict resolution and power-loss recovery spanning multiple files are outside this change. The browser-only legacy import adapter is outside this change. Main-profile installation, manual file-picker interaction and cloud-provider acceptance were not performed.
