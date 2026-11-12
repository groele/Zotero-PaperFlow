researchflow-menu-open = Zotero PaperFlow Workspace
researchflow-menu-preferences = Zotero PaperFlow Preferences...
researchflow-toolbar-tooltip = Open Zotero PaperFlow Workspace (Ctrl+Alt+R)
    .tooltiptext = Open Zotero PaperFlow Workspace (Ctrl+Alt+R)
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
researchflow-database-recovery-invalid = This conflict draft or recovery request is invalid. The original file is preserved.
researchflow-database-recovery-size = The draft is too large or contains over 500 changes to display safely. Keep the original and process smaller batches.
researchflow-database-recovery-expired = This recovery preview expired or was already used. Reopen the draft and preview again.
researchflow-database-recovery-resolved = This draft has been recovered. Its original and the backup before recovery are preserved.
researchflow-database-recovery-base = This draft has no baseline for field comparison. Keep it and use a backup or compare it manually.
researchflow-database-recovery-stale = The database or draft changed. Reopen the draft and review the latest values before recovering.
researchflow-database-recovery-choice = Choose the baseline, local or current value for every conflicting field.
researchflow-database-recovery-empty = The preview contains no changes to write. The database was not modified.
researchflow-database-unsupported-version = Unsupported database version. Use a matching version of Zotero PaperFlow.
researchflow-database-invalid-collection = Database field { $field } must be an array.
researchflow-database-invalid-id = Database field { $field } contains a record without a valid ID.
researchflow-database-duplicate-id = Database field { $field } contains duplicate IDs.
researchflow-database-invalid-settings = Invalid database settings.
researchflow-database-invalid-deletions = Invalid database deletion log.
researchflow-recovery-open = Compare and recover conflict drafts
researchflow-recovery-release-note = Adds field comparison, change previews and recovery backups for conflict drafts
researchflow-database-merge-conflict = Concurrent edits conflict at { $fields }. The current database was preserved. In the Zotero PaperFlow settings pane, open Data and sync → Compare and recover conflict drafts. Your edits and both database versions were saved locally to { $file } for recovery.
researchflow-database-conflict-draft-failed = Concurrent edits could not be merged, and the recovery draft could not be written: { $reason }. The database was not overwritten. Keep this window open and copy your unsaved changes.
researchflow-database-revision-conflict = This database changed in another PaperFlow window (expected revision { $expected }, current revision { $actual }). Your save was not applied. Copy your unsaved changes before reopening the workspace to continue editing.

# =========================================================================
# Preferences Pane Localization (Zotero PaperFlow Preferences)
# =========================================================================

# Preferences Header
researchflow-pref-brand-title = Zotero PaperFlow
researchflow-pref-brand-slogan = From Manuscript to Publication. Intelligent manuscript lifecycle, submission, and peer-review workspace.
researchflow-pref-status-ready = Preferences ready. All changes are saved and applied in real time.

# Preferences Module 1: Window & Workspace
researchflow-pref-group-window-title = Interface & Window Presentation
researchflow-pref-group-window-desc = Configure PaperFlow default workspace mode, startup view, window pin behavior, and language/theme preferences:
researchflow-pref-btn-open-workspace = 📑 Open Workspace in Zotero Main Tab
researchflow-pref-btn-open-subwindow = 🗗 Open 480×780 Companion Subwindow (track progress while reading)
researchflow-pref-btn-open-window = ⬚ Open 1240×820 Standalone Full Workspace Window

# Preferences Module 2: Host & Literature Integration
researchflow-pref-group-integration-title = Zotero Host & Library Integration
researchflow-pref-group-integration-desc = Control integration depth with the Zotero desktop client. Flexibly toggle item pane cards, context menus, reader highlights, and item tags:

# Preferences Module 3: Writing & Review Workflow
researchflow-pref-group-workflow-title = Manuscripts Kanban & Peer Review Workflow
researchflow-pref-group-workflow-desc = Customize manuscript stage transitions, peer-review response matrix defaults, and academic export preferences:

# Preferences Module 4: Data Storage, Cloud Sync & Resilience
researchflow-pref-group-data-title = Data Storage, Multi-Cloud Sync & Resilience
researchflow-pref-subgroup-sync-title = Multi-Cloud Sync & Local Storage
researchflow-pref-subgroup-sync-desc = PaperFlow adheres to local-first principles. Research data is stored safely in your Zotero data directory and can sync privately with WebDAV or GitHub:
researchflow-pref-storage-path-prefix = 📁 Local Storage Location:
researchflow-pref-btn-cloud-settings = 🌐 Configure WebDAV and GitHub Sync Credentials in Workspace
researchflow-pref-subgroup-export-title = Full Database Backup & Multi-Format Export
researchflow-pref-subgroup-export-desc = Export manuscript pipelines, review response matrices, milestones, and journal records to standard JSON backups:
researchflow-pref-btn-export-db = 📑 Export Full JSON Database Backup
researchflow-pref-subgroup-import-title = Data Import, Emergency Disaster Recovery & Conflict Resolution
researchflow-pref-subgroup-import-desc = Restore research pipeline data from Zotero PaperFlow JSON backups (an automatic snapshot is preserved prior to import):
researchflow-pref-import-mode-label = Conflict Resolution Strategy:
researchflow-pref-import-mode-merge = Smart Merge (preserve current data and apply incoming additions)
researchflow-pref-import-mode-overwrite = Full Overwrite (replace database entirely with imported backup)
researchflow-pref-btn-import-file = 📂 Select Local JSON Backup to Restore
researchflow-pref-btn-restore-backup = ⏮️ Restore Pre-Import Safety Snapshot

# Preferences Module 5: Version Information & Diagnostics
researchflow-pref-group-about-title = Version Information & Diagnostics
researchflow-pref-group-about-desc = Inspect Zotero PaperFlow runtime environment, release notes, release assets, and sanitized diagnostic reports:
researchflow-pref-version-label = Current Version
researchflow-pref-compat-label = Platform Compatibility
researchflow-pref-compat-value = Zotero 10 ~ 12 (Modern Gecko 153+ Architecture)
researchflow-pref-release-desc-label = Release Highlights
researchflow-pref-release-desc-value = Architectural decoupling, zero hardcoded UI Fluent governance, and full-spectrum specification alignment
researchflow-pref-build-date-label = Build Date
researchflow-pref-package-label = Official Package
researchflow-pref-repo-label = Open-Source Repository
researchflow-pref-btn-export-diag = 🔍 Export Sanitized Diagnostic Report (for troubleshooting)

# Dynamic Settings Field Keys
researchflow-pref-field-window-mode-label = Default Workspace Window Mode
researchflow-pref-field-window-mode-desc = Preferred window presentation when launching PaperFlow from the toolbar or shortcut (Ctrl+Alt+R).
researchflow-pref-opt-window-mode-tab = 📑 Zotero Main Tab (seamlessly integrated into tab bar)
researchflow-pref-opt-window-mode-subwindow = 🗗 Companion Subwindow (480×780, lightweight floating window)
researchflow-pref-opt-window-mode-window = ⬚ Standalone Desktop Window (1240×820, panoramic view)

researchflow-pref-field-default-view-label = Default Startup View
researchflow-pref-field-default-view-desc = First screen module displayed when opening PaperFlow.
researchflow-pref-opt-default-view-dashboard = 📊 Dashboard Overview (pipeline progress, timeline, and metrics)
researchflow-pref-opt-default-view-manuscripts = 🎯 Manuscripts Kanban (writing stages and manuscript cards)
researchflow-pref-opt-default-view-submissions = 🚀 Submissions & Peer Review (journal rounds, response matrix, and exports)

researchflow-pref-field-language-label = Workspace Display Language
researchflow-pref-field-language-desc = Interface language for PaperFlow workspace and academic export tools.
researchflow-pref-opt-language-zh = 简体中文 (Chinese)
researchflow-pref-opt-language-en = English

researchflow-pref-field-theme-label = Interface Theme
researchflow-pref-field-theme-desc = Color scheme for workspace and companion windows.
researchflow-pref-opt-theme-system = 🌓 Follow System & Host Theme
researchflow-pref-opt-theme-light = ☀️ Light Mode
researchflow-pref-opt-theme-dark = 🌙 Dark Mode

researchflow-pref-field-subwindow-always-on-top-label = Keep Companion Subwindow Always on Top
researchflow-pref-field-subwindow-always-on-top-desc = Floats the companion subwindow above other windows to take notes while reading PDFs.

researchflow-pref-field-subwindow-compact-mode-label = Enable Compact Layout in Companion Subwindow
researchflow-pref-field-subwindow-compact-mode-desc = Hides non-essential whitespace and large banners in companion mode to maximize readable area.

researchflow-pref-field-enable-item-pane-label = Show Manuscript Pipeline Section in Item Information Pane
researchflow-pref-field-enable-item-pane-desc = Injects native card into the item sidebar to inspect linked manuscripts and sync notes. Disabled by default.

researchflow-pref-field-show-context-menu-label = Show Actions in Item and Collection Context Menus
researchflow-pref-field-show-context-menu-desc = Adds quick actions to library item and collection context menus.

researchflow-pref-field-enable-reader-integration-label = Enable Text Selection & Annotation Excerpts in PDF Reader
researchflow-pref-field-enable-reader-integration-desc = Quickly excerpt text or annotations into manuscript notes via right-click or shortcut (Ctrl+Shift+R).

researchflow-pref-field-sync-status-tags-label = Automatically Synchronize Status Tags to Zotero Items
researchflow-pref-field-sync-status-tags-desc = Applies colorful status tags (e.g. PaperFlow/04-同行审稿中) to linked Zotero items. Disabled by default.

researchflow-pref-field-locate-on-manuscript-click-label = Highlight Item in Zotero Library when Clicking Manuscript Card
researchflow-pref-field-locate-on-manuscript-click-desc = Automatically navigates to and highlights the linked item in Zotero when clicked in PaperFlow.

researchflow-pref-field-auto-link-selected-paper-label = Auto-Detect Selected Item when Tracking New Submission
researchflow-pref-field-auto-link-selected-paper-desc = Detects currently selected library item when adding a submission and offers one-click metadata linking.

researchflow-pref-field-auto-sync-child-notes-label = Automatically Synchronize Child Notes on Manuscript Update
researchflow-pref-field-auto-sync-child-notes-desc = Synchronizes manuscript progress and review matrix into item child notes. When disabled, only manual syncing writes notes.

researchflow-pref-field-auto-add-to-pipeline-collection-label = Automatically Group Items into Pipeline Collection
researchflow-pref-field-auto-add-to-pipeline-collection-desc = Automatically manages and adds linked items to the '🚀 Zotero PaperFlow 论文管线' collection.

researchflow-pref-field-show-journal-portals-label = Show Journal Submission Portals Bar at Top of Submissions View
researchflow-pref-field-show-journal-portals-desc = Displays quick portal launch cards (ACS, Wiley, Nature, APL, etc.) atop submissions management.

researchflow-pref-field-collapse-empty-kanban-stages-label = Automatically Collapse Empty Kanban Stage Columns
researchflow-pref-field-collapse-empty-kanban-stages-desc = Automatically collapses empty writing stages without manuscript cards to reduce horizontal scrolling.

researchflow-pref-field-default-rebuttal-export-format-label = Default Academic Rebuttal & Cover Letter Export Format
researchflow-pref-field-default-rebuttal-export-format-desc = Pre-selects export format in academic response letter export modals.
researchflow-pref-opt-rebuttal-format-latex = 📄 LaTeX Rebuttal Letter (.tex with tcolorbox)
researchflow-pref-opt-rebuttal-format-word = 📝 Word / Rich Text (.html, editable in Word/WPS)
researchflow-pref-opt-rebuttal-format-md = 📑 Academic Markdown Template (.md)
researchflow-pref-opt-rebuttal-format-table = 📊 Review Response Summary Table (Markdown Table)

researchflow-pref-field-enable-acceptance-celebration-label = Play Confetti Animation & Celebration Card upon Acceptance
researchflow-pref-field-enable-acceptance-celebration-desc = Pops up celebration card with celebratory confetti when manuscript status moves to accepted.

researchflow-pref-field-auto-sync-label = Automatically Synchronize to Cloud on Save
researchflow-pref-field-auto-sync-desc = Automatically initiates background cloud sync when WebDAV or GitHub private repository credentials are configured.

researchflow-pref-field-auto-backup-on-save-label = Automatically Rotate Safety Disaster Recovery Snapshots on Save
researchflow-pref-field-auto-backup-on-save-desc = Maintains rolling revision snapshots in the Zotero data directory to prevent data corruption.

