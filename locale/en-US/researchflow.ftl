researchflow-menu-open = Zotero PaperFlow Workspace
researchflow-menu-preferences = Zotero PaperFlow Preferences...
researchflow-toolbar-tooltip = Open Zotero PaperFlow Workspace (Ctrl+Alt+R)
researchflow-item-menu-create = New Manuscript Pipeline for Selected Item
researchflow-item-menu-link = Link to Existing Manuscript
researchflow-collection-menu-create = Create Manuscript Pipeline for This Collection
researchflow-reader-add-record = Add Selection/Annotation to Manuscript Pipeline (Ctrl+Shift+R)
researchflow-item-pane-header = Manuscript Pipelines
    .label = Manuscript Pipelines
    .tooltiptext = Zotero PaperFlow Manuscript Pipelines & Journal Submissions
researchflow-item-pane-sidenav =
    .label =
    .tooltiptext = Zotero PaperFlow Manuscript Pipelines & Journal Submissions
    .aria-label = Manuscript Pipelines
researchflow-item-pane-count =
    { $count ->
        [0] No manuscript pipelines linked to this item
       *[other] { $count } linked manuscript pipeline(s)
    }
researchflow-item-pane-create = New Pipeline
researchflow-item-pane-open-workspace = Open in Workspace
researchflow-item-pane-sync-note = 📝 Sync to Child Note
researchflow-item-pane-open-pdf = 📖 Open PDF Companion
researchflow-item-pane-status-drafting = Drafting
researchflow-item-pane-status-under-review = Under Review
researchflow-item-pane-status-revision = Revision
researchflow-item-pane-status-accepted = Accepted
researchflow-item-pane-status-published = Published
researchflow-database-invalid-backup = This file is not a Zotero PaperFlow database backup.
researchflow-database-unsupported-version = Unsupported database version. Use a matching version of Zotero PaperFlow.
researchflow-database-invalid-collection = Database field { $field } must be an array.
researchflow-database-invalid-id = Database field { $field } contains a record without a valid ID.
researchflow-database-duplicate-id = Database field { $field } contains duplicate IDs.
researchflow-database-invalid-settings = Invalid database settings.
researchflow-database-invalid-deletions = Invalid database deletion log.
researchflow-database-merge-conflict = Concurrent edits conflict at { $fields }. The current database was preserved. Your edits and both database versions were saved locally to { $file } for recovery.
researchflow-database-conflict-draft-failed = Concurrent edits could not be merged, and the recovery draft could not be written: { $reason }. The database was not overwritten. Keep this window open and copy your unsaved changes.
researchflow-database-revision-conflict = This database changed in another PaperFlow window (expected revision { $expected }, current revision { $actual }). Your save was not applied. Copy your unsaved changes before reopening the workspace to continue editing.
