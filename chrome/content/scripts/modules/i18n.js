/**
 * Zotero PaperFlow - I18N and Localization Module
 * Manages translation dictionaries, language switching, and UI text bindings.
 */
const I18N = {
  en: {
    recoveryTitle: 'Conflict recovery',
    recoveryHelp: 'Compare saved drafts with the latest database. Choose each conflicting value, then preview all changes. Original drafts and a separate backup are kept.',
    recoveryRefresh: 'Refresh drafts', recoveryOpen: 'Compare', recoveryResolved: 'Recovered', recoveryEmpty: 'No conflict drafts found.',
    recoveryListLimit: 'Showing the latest 100 drafts. Older files are preserved in the Zotero data directory.',
    recoveryBase: 'Baseline', recoveryLocal: 'Local draft', recoveryCurrent: 'Current database',
    recoveryMissing: '(field or record absent)', recoveryTruncated: 'Value shortened; inspect the original draft for the full value.',
    recoveryPreview: 'Preview recovery', recoveryApply: 'Confirm recovery', recoveryBack: 'Change choices',
    recoveryCompareTitle: 'Choose a value for every conflict', recoveryPreviewTitle: 'Review all changes before writing',
    recoveryAutomatic: 'Independent local edits are included automatically. Values without conflicts need no selection.',
    recoveryNoConflicts: 'No conflicting fields remain. Preview the independent local edits before recovering.',
    recoveryNoChanges: 'No changes to write. The database is unchanged.',
    recoveryBefore: 'Before recovery', recoveryAfter: 'After recovery', recoveryBusy: 'Working…',
    recoveryPending: 'Save or resolve unsaved edits in this workspace before recovering.',
    recoverySuccess: 'Recovery saved. Backup: ',
    recoveryReceiptWarning: ' Recovery succeeded, but its status receipt could not be saved. The original draft remains listed.',
    recoveryUnavailable: 'Open this page in Zotero to recover local conflict drafts.',
    recoveryInvalidated: 'New data arrived. Reopen the draft to compare the latest values.',
    recoveryRevision: 'Database revision: ', recoveryFailed: 'Recovery could not continue: ',
    searchClear: 'Clear search', searchStatus: 'Filter by status', searchAll: 'All statuses', searchActive: 'In progress', searchRevision: 'Revision', searchAccepted: 'Accepted / Published', searchRejected: 'Rejected', searchEmpty: 'No matching submissions', searchEmptyHelp: 'Try a shorter keyword or another status.', searchReset: 'Clear filters',
    shareZoom: 'Enlarge preview',
    shareFit: 'Fit image',
    shareAppearance: 'Card appearance',
    shareGallery: 'Explore styles',
    shareBrandSize: 'Brand presence',
    shareBrandCompact: 'Subtle', shareBrandBalanced: 'Balanced', shareBrandBold: 'Prominent',
    shareResolution: 'Export quality', shareResolutionStandard: 'Standard · 720 px wide', shareResolutionHigh: 'High · 1440 px wide', shareResolutionUltra: 'Ultra · 2160 px wide',
    shareResolutionLimited: 'Resolution adjusted for a long image',
    shareOmitted: '{count} earlier milestones are summarized in the card',
    shareRetry: 'Retry preview', sharePreviewError: 'Preview could not be generated. Try again or choose a lower export quality.',
    shareStyleReset: 'Reset design', shareStyleResetHelp: 'Resets the style and export settings. Hidden information stays hidden.',
    sharePrefsFailed: 'The image is ready to use, but these settings could not be saved.',
    shareEstuary: 'Estuary · blue to jade',
    shareIris: 'Iris · blue to rose',
    shareAmber: 'Amber · sand to sage',
    shareJournal: 'Journal cover · editorial',
    shareConference: 'Conference poster · teal',
    shareArchive: 'Lab archive · ledger',
    sharePaper: 'Paper · calm & clear',
    shareInk: 'Ink · after hours',
    shareBlueprint: 'Blueprint · structured',
    shareMinimal: 'Minimal · title first',
    shareCyber: 'Cyber Neon · signal glow',
    shareAurora: 'Aurora Lab · spectral',
    shareTerminal: 'Terminal Grid · precise',
    shareRendering: 'Preparing your image…',
    submissionSearch: 'Find a submission',
    submissionSearchPlaceholder: 'Title, journal, author or ID',
    submissionSearchCount: '{count} / {total}',
    dashboardNav: 'Dashboard Overview',
    manuscriptsNav: 'Manuscripts Kanban',
    submissionsNav: 'Submissions & Review',
    settingsNav: 'Multi-Cloud Settings',
    forceSync: 'Sync cloud now',
    dashboardTitle: 'Dashboard Overview',
    dashboardSubtitle: "A bird's eye view of your scientific progress and pipelines.",
    acceptedPublished: '🎉 Accepted & Published',
    activeReview: '🕒 Active Submissions',
    totalSubmissions: '📊 Total Submission Attempts',
    clickToFilter: 'Click to filter',
    timelineTitle: '📅 Manuscript Pipeline Timelines',
    timelineSubtitle: 'Track experiments, writing, submission, revision, acceptance, and publication through visual manuscript pipelines.',
    timelineSortedBySubmissionDate: 'Latest submissions first',
    compact: 'Compact',
    expanded: 'Expanded',
    allPipelines: 'All pipelines',
    activePipelines: 'Active in review',
    acceptedPipelines: 'Accepted / published',
    metricExpSubmit: 'Avg. experiment → submit',
    metricSubmitToday: 'Avg. in review: submit → today',
    metricR1Today: 'Avg. in review: R1 → today',
    metricSubmitAccept: 'Avg. accepted: submit → accept',
    recentLogs: '⚡ Recent Research Logs',
    timelineAlerts: '🔔 Timeline Alerts',
    addEvent: '+ Event',
    latestEvent: 'Latest Event',
    timelineEvents: 'Timeline Events',
    manageEvents: 'Manage Events',
    openSubmissionDetails: 'Details',
    shareJourney: 'Share journey',
    shareJourneyTitle: 'Submission journey',
    shareJourneyHelp: 'Generated locally. Save or copy the image to use it elsewhere.',
    shareJourneyDownload: 'Save PNG as…',
    shareJourneyCopy: 'Copy image',
    shareJourneyCopied: 'Share image copied to clipboard.',
    shareJourneySaved: 'Image saved to: {path}',
    shareJourneySaveHelp: 'Choose a folder in the Save As dialog. The saved path will appear here.',
    shareJourneySaving: 'Choose a folder and save the PNG…',
    shareJourneySaveCancelled: 'Save cancelled. No image was saved.',
    shareJourneySaveFailed: 'Could not save the image: {error}',
    shareJourneyCopyFailed: 'Could not copy the image. Use Save PNG as… instead.',
    shareJourneyReady: 'Share image is ready.',
    shareJourneyFailed: 'Could not generate the share image.',
    shareJourneyEyebrow: 'ZOTERO PAPERFLOW · SUBMISSION JOURNEY',
    shareJourneyStatus: 'CURRENT STATUS',
    shareJourneyDuration: 'DAYS IN THIS JOURNEY',
    shareJourneyTimeline: 'JOURNEY MILESTONES',
    shareJournalLabel: 'TARGET JOURNAL',
    shareJourneyNoEvents: 'No dated milestones yet',
    shareJourneyFooter: 'Built locally from your Zotero PaperFlow timeline',
    shareVisibilityTitle: 'Visible information',
    shareVisibilityHelp: 'Your choices are remembered for the next image.',
    shareTimelineStart: 'Timeline starts at',
    shareTimelineStartExperiment: 'Experiment start',
    shareTimelineStartSubmission: 'Submission start',
    shareFieldTitle: 'Title',
    shareFieldJournal: 'Journal',
    shareFieldAuthor: 'First author',
    shareFieldStatus: 'Status',
    shareFieldDuration: 'Journey days',
    shareFieldDates: 'Milestone dates',
    shareFieldFooter: 'Zotero PaperFlow branding',
    shareSizeTitle: 'Image size',
    shareSizePortrait: 'Portrait · expands to fit',
    shareSizeStory: 'Story · taller composition',
    shareSizeAuto: 'Adaptive long image',
    noEventYet: 'No event yet',
    addEventStart: 'Add an event to start tracking',
    clickAddEvent: 'Click here to add a timeline event for this manuscript.',
    clickEditEvent: 'Click to edit this event.',
    settingsTitle: 'Multi-Cloud Settings',
    settingsSubtitle: 'Manage synchronization, workspace preferences, and backups.',
    settingsKicker: 'Workspace control',
    settingsTrustSummary: 'Data protection summary',
    settingsLocalFirst: 'Local database',
    settingsDeviceSecrets: 'Device-only credentials',
    settingsPreferencesAutosave: 'Optional cloud sync',
    settingsSecurityEyebrow: 'Privacy by architecture',
    settingsSecurityTitle: 'Privacy by default',
    settingsSecurityHelp: 'Your research data stays on this device by default. Cloud sync only starts after you choose and configure a provider; passwords and tokens stay out of database files, exports, and cloud payloads.',
    settingsRoutingEyebrow: 'Data destination',
    settingsRoutePrivacy: 'Secrets are stored only on this device.',
    settingsLocalEyebrow: 'Active route',
    settingsLocalTitle: 'Local cache only',
    settingsLocalHelp: 'Research data remains inside this local device (Zotero data directory) until you export or select a cloud route.',
    settingsLocalPointAccount: 'No account required',
    settingsLocalPointSync: 'Manual cloud sync is off',
    settingsLocalPointBackup: 'JSON backup remains available',
    settingsProviderEyebrow: 'Provider credentials',
    settingsWebdavHelp: 'Connect a private WebDAV folder for the database JSON.',
    settingsCredentialNote: 'Credentials never enter exported or synchronized JSON.',
    settingsGithubHelp: 'Store the database JSON in a private repository branch.',
    settingsGithubCredentialNote: 'Use a repository-scoped token with Contents access.',
    settingsLanguageEyebrow: 'Interface',
    settingsAssistEyebrow: 'Browser intelligence',
    settingsBackupEyebrow: 'Data resilience',
    settingsBackupNote: 'A recoverable snapshot is kept before every valid import.',
    languageCardTitle: 'Interface Preferences',
    languageLabel: 'Display Language',
    languageHelp: 'Choose the language and appearance used across this workspace.',
    languageAutoSaved: 'Interface preferences are saved automatically.',
    appearanceLabel: 'Appearance',
    appearanceSystem: 'Follow system',
    appearanceLight: 'Light',
    appearanceDark: 'Dark',
    appearanceSaved: 'Appearance preference saved.',
    autoCloudSyncLabel: 'Automatic cloud sync',
    autoCloudSyncHelp: 'Sync valid cloud routes shortly after local changes are saved.',
    autoCloudSyncLocalHelp: 'Choose WebDAV or GitHub to enable automatic cloud sync.',
    detectedSubmissionPrefilled: 'Captured from {platform}. Review every field before creating the project.',
    captureReviewTitle: 'Review captured submission',
    captureReviewHelp: 'Nothing is saved yet. Check the detected fields, then confirm to create a linked project, manuscript, and submission record.',
    captureConfidence: 'Recognition confidence',
    captureFieldsDetected: '{count} fields detected',
    captureProjectTitle: 'New Project Name',
    captureProjectPlaceholder: 'e.g. Nano Letters submission — interface polarization',
    manuscriptIdLabel: 'Manuscript / Submission ID',
    capturedStatusLabel: 'Detected Workflow Status',
    firstAuthorLabel: 'First Author',
    firstAuthorHelp: 'Shown on the dashboard and kept with the linked manuscript.',
    firstAuthorPlaceholder: 'e.g. Alex Chen',
    firstAuthorNotSet: 'Not set',
    authorsLabel: 'Authors',
    abstractLabel: 'Abstract / Project Summary',
    keywordsLabel: 'Keywords',
    revisionDueLabel: 'Revision Due Date',
    confirmCreateProject: 'Confirm & Create Project',
    captureCreatedToast: 'New project, manuscript, and submission created after review.',
    captureExistingOpenedToast: 'This captured submission already exists. The existing record was opened.',
    confidenceHigh: 'High',
    confidenceMedium: 'Medium',
    confidenceLow: 'Needs review',
    cloudRoutingTitle: 'Cloud synchronization',
    webdavTitle: 'WebDAV Credentials',
    githubTitle: 'GitHub Private Repository Sync',
    backupTitle: 'Database Backup & Import',
    saveLanguage: 'Save Language',
    saveMappings: 'Save Storage Mapping',
    exportDb: 'Export Database',
    exportDiagnostics: 'Export Diagnostics',
    importJson: 'Import JSON',
    restoreImportBackup: 'Restore Pre-Import Backup',
    languageSaved: 'Language preference saved.',
    databaseExported: 'Database JSON exported!',
    diagnosticsExported: 'Privacy-safe diagnostics exported.',
    databaseImported: 'Database JSON imported successfully.',
    importBackupRestored: 'The database state from before the last import was restored.',
    noImportBackup: 'No pre-import backup is available on this device.',
    restoreImportConfirm: 'Restore the database state saved immediately before the last import? Current unsaved changes will be replaced.',
    importFileTooLarge: 'The selected backup is larger than 25 MB and was not opened.',
    invalidBackup: 'This file is not a recognized Zotero PaperFlow database backup.',
    noUrgentEvents: 'No urgent review or timeline events.',
    noRecentRecords: 'No research records captured yet.',
    noPipelines: 'No manuscript submission pipelines in progress.',
    eventNameRequired: 'Event name is required.',
    zoteroSync: 'Import to Zotero',
    untitledEvent: 'Untitled Event',
    untitledManuscript: 'Untitled Manuscript',
    untitledProject: 'Untitled Project',
    targetJournal: 'Target Journal',
    typeNoEvent: 'No Event',
    eventTypeResearch: 'Research',
    eventTypeWriting: 'Writing',
    eventTypeSubmission: 'Submission',
    eventTypeReview: 'Review',
    eventTypeRevision: 'Revision',
    eventTypePublication: 'Publication',
    eventTypeSpecial: 'Special',
    statusCompleted: 'Completed',
    statusActive: 'Active',
    statusPending: 'Planned',
    statusBlocked: 'Blocked',
    inlineAddTimelineEvent: 'Add timeline event',
    keyEventPreset: 'Key Event',
    customEvent: 'Custom event',
    eventNotesShort: 'Notes',
    cancel: 'Cancel',
    eventPlaceholder: 'Event, e.g. R1 comments received',
    noDate: 'No date',
    days: 'days',
    dayUnitShort: 'd',
    relativeToday: 'today',
    relativeDaysAgo: '{count} days ago',
    relativeInDays: 'in {count} days',
    nodesSaved: '{count} nodes saved',
    expSubmitShort: 'Exp→Submit',
    keyEventRail: 'Key event rail',
    countingNow: 'Counting now',
    completedInterval: 'Completed interval',
    displayPrepareLabel: 'Experiment → Submission',
    displayPrepareCaption: 'Current focus: finish the pre-submission cycle.',
    displayAcceptedLabel: 'Submission → Acceptance',
    displayAcceptedCaption: 'Accepted manuscripts show the total time from submission to acceptance.',
    displayR1Label: 'R1 Comments → Today',
    displayR1Caption: 'R1 returned; the active window now starts from the first decision.',
    displayReviewLabel: 'Submission → Today',
    displayReviewCaption: 'In review; track the turnaround duration since submission.',
    milestoneExperimentStart: 'Experiments started',
    milestoneExperimentDone: 'Experiments done',
    milestoneSubmission: 'Submission',
    milestoneAcceptance: 'Acceptance',
    milestoneR1Comments: 'R1 comments',
    milestoneToday: 'Today',
    statePreparing: 'Preparing',
    stateOnline: 'Online',
    stateAccepted: 'Accepted',
    stateAfterR1: 'After R1',
    stateUnderReview: 'Under Review',
    stateSubmitted: 'Submitted',
    stateNotSubmitted: 'Not submitted',
    stateSinceR1: '{count} d since R1',
    stateSinceSubmit: '{count} d since submit',
    defaultExperimentsStarted: 'Experiments Started',
    defaultExperimentsCompleted: 'Experiments Completed',
    defaultDataOrganization: 'Data Organization',
    defaultDraftCompleted: 'Draft Completed',
    defaultManuscriptSubmitted: 'Manuscript Submitted',
    defaultReviewCommentsR1: 'Review Comments R1',
    defaultR1RevisionSubmitted: 'R1 Revision Submitted',
    defaultReviewCommentsR2: 'Review Comments R2',
    defaultR2RevisionSubmitted: 'R2 Revision Submitted',
    defaultAccepted: 'Accepted',
    defaultOnlinePublication: 'Online Publication',
    defaultProof: 'Proof',
    editTimelineEvent: 'Edit Timeline Event',
    close: 'Close',
    eventName: 'Event Name',
    type: 'Type',
    status: 'Status',
    keyEventMapping: 'Key Event Mapping',
    eventDate: 'Event Date',
    eventDateHelp: 'One timeline event only needs one date: the day this mapped event happened. Deadlines and source dates are managed in the Submission Entry Editor.',
    plannedDate: 'Planned Date',
    initialSubmissionDate: 'Initial Submission Date',
    deadlineDate: 'Deadline / Due Date',
    completionDate: 'Completion Date',
    firstDecisionDate: 'First Decision / R1 Date',
    revisionDueDateLabel: 'Revision Due Date',
    timelineDateSource: 'Date source',
    doiLabel: 'DOI',
    articlePage: 'Article page',
    doiNotSet: 'DOI not set',
    trackSubmissionTitle: 'Track Journal Submission',
    manuscriptPaper: 'Manuscript / Paper',
    targetJournalInput: 'Target Journal',
    articleUrlLabel: 'Article / Journal URL',
    articleUrlPlaceholder: 'https://doi.org/10.xxxx/xxxxx',
    trackSubmissionButton: 'Track Submission',
    manuscriptJournalRequired: 'Manuscript and Journal are required',
    submissionAddedToast: 'New submission added to pipeline!',
    dateSourceSubmission: 'submission record',
    dateSourceTimeline: 'timeline node',
    dateSourceMissing: 'not set',
    planToday: 'Plan Today',
    setToday: 'Set Today',
    due14: 'Due +14d',
    markActive: 'Mark Active',
    markDoneToday: 'Mark Done Today',
    clearDates: 'Clear Dates',
    clearDate: 'Clear Date',
    notes: 'Notes',
    notesPlaceholder: 'Decision details, reviewer deadline, portal note, or next action...',
    delete: 'Delete',
    saveChanges: 'Save Changes',
    keyAuto: 'Auto detect',
    keyExperimentsStarted: 'Key: Experiments started',
    keyExperimentsDone: 'Key: Experiments done',
    keyDraftDone: 'Key: Draft done',
    keySubmitted: 'Key: Submitted',
    keyR1Comments: 'Key: R1 comments',
    keyR1Resubmitted: 'Key: R1 resubmitted',
    keyR2Comments: 'Key: R2 comments',
    keyR2Resubmitted: 'Key: R2 resubmitted',
    keyAccepted: 'Key: Accepted',
    keyOnlinePublished: 'Key: Online / Published',
    statusPlannedNotStarted: 'Planned / Not Started',
    statusInProgress: 'In Progress',
    statusBlockedException: 'Blocked / Exception',
    statusOverdue: 'Overdue',
    statusDueSoon: 'Due soon',
    statusUpcoming: 'Upcoming',
    specialException: 'Special / Exception',
    manuscriptNotFound: 'Manuscript not found. Refreshing workspace.',
    manuscriptStatusUpdated: 'Manuscript status updated.',
    manuscriptStatusUpdatedTo: 'Manuscript status updated to {status}.',
    submissionNotFound: 'Submission not found. Refreshing dashboard.',
    eventNotFound: 'Event not found. Refreshing dashboard.',
    eventAddedToast: 'Added event "{name}".',
    eventSavedToast: 'Event "{name}" saved.',
    eventRemovedToast: 'Event removed from pipeline',
    confirmDeleteEvent: 'Are you sure you want to delete event "{name}"?',
    confirmUpdateEvent: 'This key event already exists. Update "{name}" instead of adding a duplicate?',
    statusRejected: 'Rejected',
    markRejected: 'Mark Rejected',
    transferToJournal: 'Transfer to New Journal',
    transferSubmissionTitle: 'Rejected: Submit to Another Journal',
    newTargetJournal: 'New Target Journal',
    rejectionDate: 'Rejection Date',
    rejectionNote: 'Decision note',
    transferButton: 'Create New Submission',
    rejectedToast: 'Submission marked rejected.',
    transferToast: 'New target journal submission created.',
    manuscriptsTitle: 'Manuscripts Kanban',
    manuscriptsSubtitle: 'Track your writing process from outline/drafting to final peer-review.',
    addManuscript: '+ Add Manuscript',
    kanbanIdea: 'Planning',
    kanbanDrafting: 'In Progress',
    kanbanSubmitted: 'Submitted',
    kanbanAccepted: 'Accepted / Published',
    kanbanShowEmpty: 'Show empty stages',
    kanbanHideEmpty: 'Hide empty stages',
    kanbanStageSummary: '{count} of {total} stages contain manuscripts',
    submissionsPageTitle: 'Submissions & Peer Review Matrix',
    submissionsPageSubtitle: 'Follow each submission from journal entry through review, revision, and publication.',
    activeSubmissionsTitle: 'Active Submissions',
    activeSubmissionsHelp: 'Choose a submission to read its timeline, status, and review notes.',
    submissionEmptyDetail: 'Select a submission; the entry editor opens under Workflow Context.',
    journalPortalsTitle: 'Quick Submission Portals',
    journalPortalsHelp: 'Open, edit, or add your journal submission websites.',
    trackNewSubmissionButton: '+ Track New Submission',
    submissionDetailKicker: 'Journal Submission',
    currentStageLabel: 'Current Stage',
    trackedSinceLabel: 'Tracked since',
    workflowContextTitle: 'Workflow Context',
    workflowNeedsLinking: 'Needs linking',
    linkManuscript: 'Link manuscript',
    linkSubmissionTitle: 'Link Submission to Manuscript',
    linkSubmissionHelp: 'Choose the manuscript that owns this submission record.',
    linkSubmissionConfirm: 'Link Submission',
    linkSubmissionSaved: 'Submission linked to the selected manuscript.',
    noManuscriptsToLink: 'No manuscripts are available. Create a manuscript first.',
    workflowLinkedFlow: 'Linked flow',
    workflowManuscriptLabel: 'Manuscript',
    workflowTimelineLabel: 'Timeline',
    workflowReviewerCommentsLabel: 'Reviewer Comments',
    editFields: 'Edit fields',
    jumpToEditor: 'Jump to editor',
    submissionEntryEditorTitle: 'Submission Entry Editor',
    submissionEntryEditorHelp: 'Edit the selected entry here. Changes are saved automatically as you type.',
    linkedManuscriptBadge: 'Linked manuscript',
    detachedSubmissionBadge: 'Detached submission',
    manuscriptSection: 'Manuscript',
    manuscriptTitleLabel: 'Manuscript Title',
    paperTitlePlaceholder: 'Paper title',
    submissionPortalUrl: 'Submission Portal URL',
    reviewTimingSection: 'Review Timing',
    publicationSection: 'Publication',
    submissionChecklistSection: 'Submission Checklist',
    peerReviewMatrixSection: 'Peer Review Response Matrix',
    addComment: 'Add Comment',
    reviewEditorHelp: 'Reviewer comments and author responses are saved automatically as you type.',
    autoSavePending: 'Waiting to save',
    autoSaveSaving: 'Saving changes…',
    autoSaveSaved: 'All changes saved',
    autoSaveInvalid: 'Check the highlighted field',
    autoSaveFailed: 'Auto-save failed. Your text remains in this form.',
    localStorageUnavailable: 'Local storage unavailable. Reopen the workspace and retry.',
    saveNewEditsPending: 'New edits made during saving are still pending. Save again to include them.',
    acceptanceCelebrationEyebrow: 'Milestone unlocked',
    acceptanceCelebrationTitle: 'Accepted — congratulations!',
    acceptanceCelebrationBody: '{title} has crossed an important research milestone.',
    transferRoundHelp: 'Close the current round and create the next target journal record in one step.',
    savedReviewPreviewTitle: 'Saved Review Preview',
    savedReviewPreviewHelp: 'Read-only snapshot kept in sync with the Submission Entry Editor.',
    exportTable: 'Export Table',
    emptyReviewEditor: 'No reviewer comments recorded. Add one here; it will save automatically.',
    emptyReviewPreview: 'No saved reviewer comments yet.',
    reviewerCommentLabel: 'Reviewer Comment #{count}',
    reviewerCommentPlaceholder: 'Paste reviewer comment...',
    authorResponseLabel: 'Author Response',
    authorResponsePlaceholder: 'Draft your professional response...',
    copy: 'Copy',
    removeComment: 'Remove comment',
    checklistLabel: 'Checklist',
    responsesLabel: 'Responses',
    responseSaved: 'Response saved',
    responsePending: 'Response pending',
    noCommentText: 'No comment text saved yet.',
    submissionEditsSaved: 'Submission edits saved.',
    confirmDeleteSubmission: 'Delete tracking for this submission?',
    confirmMarkRejected: 'Mark this submission as rejected?',
    deleteSubmissionTitle: 'Delete submission tracking',
    deleteManuscript: 'Delete Manuscript',
    confirmDeleteManuscript: 'Are you sure you want to delete this manuscript? This will also remove any tracked submissions associated with it.',
    manuscriptDeletedToast: 'Manuscript deleted successfully.',
    cycleTimeCompleted: 'Cycle Time Completed',
    cycleTimeCompletedText: 'Submitted {start}; accepted/published {end}. Total duration: {days} days.',
    submissionCycleTracking: 'Submission Cycle Tracking',
    submissionCycleText: 'Submitted {start}. Current elapsed time: {days} days in review.',
    publicationLinksKept: 'Publication links are kept for Accepted or Published submissions.',
    editorRenderFailedTitle: 'Submission editor failed to render',
    editorRenderFailedHelp: 'The submission detail template did not create the edit form. Reload the extension and report this state if it persists.',
    editorMounted: 'Edit form active v{version}',
    editorMissing: 'Edit form missing v{version}',
    noSubmissionsTracked: 'No submissions tracked yet.',
    portalEmpty: 'No journal portals saved.',
    portalDeleteTitle: 'Delete portal',
    portalDeleteConfirm: 'Are you sure you want to delete the portal for {name}?',
    portalDeletedToast: 'Portal "{name}" deleted',
    addPortalTitle: 'Add Journal Submission Portal',
    portalNameLabel: 'Journal / Publisher Name',
    portalNamePlaceholder: 'e.g. ACS, Wiley, Nature, APL',
    portalUrlLabel: 'Portal Login URL',
    portalColorLabel: 'Brand Theme Color',
    portalColorHelp: 'Pick custom color for brand avatar badge',
    addPortalButton: 'Add Portal',
    fillAllFields: 'Please fill out all fields.',
    validUrlRequired: 'Please enter a valid URL (e.g. https://example.com)',
    portalAddedToast: 'Journal portal "{name}" added.',
    storageRoutingHelp: 'Choose where the Zotero PaperFlow metadata database is synchronized.',
    routeDbLabel: 'Sync destination',
    optionLocalCache: 'None (Local Cache Only)',
    optionWebDavDrive: 'WebDAV Drive (Jianguoyun, Nextcloud)',
    optionGithubRepo: 'GitHub Private Repository',
    localSyncSummary: 'Local-only mode: data stays on this device and manual cloud sync is disabled.',
    webdavSyncSummary: 'WebDAV mode: configure and test the WebDAV account shown below.',
    githubSyncSummary: 'GitHub mode: configure and test the private repository shown below.',
    webdavUrlLabel: 'WebDAV Server Base URL',
    usernameEmailLabel: 'Username / Email',
    appPasswordLabel: 'App-Specific Password',
    testWebdav: 'Test WebDAV Connection',
    githubPatLabel: 'GitHub Personal Access Token (PAT)',
    githubRepoLabel: 'Repository Name (owner/repo)',
    githubBranchLabel: 'Branch Name',
    testGithub: 'Test GitHub Repository',
    backupHelp: 'Export your research database to JSON, or import/migrate existing Zotero PaperFlow JSON backups.',
    noReviewerCommentsExport: 'No reviewer comments to export.',
    latexDownloaded: 'LaTeX template downloaded.',
    currentJournalLabel: 'Current journal',
    transferModalHelp: 'This will mark the current submission as rejected and create a new active submission for the next journal.',
    validPortalUrlOrBlank: 'Please enter a valid portal URL, or leave it blank.',
    newManuscriptTitleLabel: 'New Manuscript Title',
    createNewManuscriptOption: '+ Create new manuscript...',
    targetJournalPlaceholder: 'e.g. Advanced Functional Materials',
    rejectionNotePlaceholder: 'Optional editor decision, scope mismatch, reviewer summary, or next-action note...',
    editManuscriptMetadata: 'Edit Manuscript Metadata',
    addNewManuscriptTitle: 'Add New Manuscript',
    writingStatus: 'Writing Status',
    statusPlanning: 'Planning',
    statusIdea: 'Idea',
    statusOutline: 'Outline',
    statusInProgress: 'In Progress',
    statusFiguresPrep: 'Figures Prep',
    statusDrafting: 'Drafting',
    statusInternalReview: 'Internal Review',
    abstractDraft: 'Abstract Draft',
    abstractPlaceholder: 'Outline manuscript abstract draft...',
    createManuscript: 'Create Manuscript',
    academicCapturePrefilled: 'Scholar result captured for review. Confirm the fields before creating the manuscript.',
    scholarSourcePage: 'Scholar result / article URL',
    manuscriptTitleRequired: 'Enter a manuscript title before continuing.',
    academicCaptureChooseTitle: 'Choose a Scholar result',
    academicCaptureChooseHelp: 'Select the paper you intended to capture. Nothing is saved until you confirm the form.',
    academicCaptureSource: 'Capture source',
    academicCaptureConfidence: 'Detection confidence',
    academicCaptureDetected: 'results detected',
    academicDuplicateConfirm: 'A matching manuscript already exists. Update the existing record with the reviewed fields?',
    academicDuplicateUpdated: 'Existing manuscript updated without creating a duplicate.',
    academicCaptureSaved: 'Zotero manuscript reviewed and saved.'
  },
  zh: {
    recoveryTitle: '冲突恢复',
    recoveryHelp: '将已保存的草稿与最新数据库比较，逐字段选择，再预览全部变化。原草稿和独立的恢复前备份都会保留。',
    recoveryRefresh: '刷新草稿', recoveryOpen: '比较', recoveryResolved: '已恢复', recoveryEmpty: '没有发现冲突草稿。',
    recoveryListLimit: '显示最近 100 份草稿。更早的原文件仍保留在 Zotero 数据目录中。',
    recoveryBase: '基线', recoveryLocal: '本地草稿', recoveryCurrent: '当前数据库',
    recoveryMissing: '（字段或记录不存在）', recoveryTruncated: '数值显示已缩略，完整内容请核对原始草稿。',
    recoveryPreview: '预览恢复', recoveryApply: '确认恢复', recoveryBack: '修改选择',
    recoveryCompareTitle: '为每个冲突选择保留值', recoveryPreviewTitle: '写入前核对全部变化',
    recoveryAutomatic: '互不冲突的本地编辑会自动合并，无需逐项选择。',
    recoveryNoConflicts: '当前已无冲突字段。恢复前请预览可自动合并的本地编辑。',
    recoveryNoChanges: '没有需要写入的变化，数据库未作修改。',
    recoveryBefore: '恢复前', recoveryAfter: '恢复后', recoveryBusy: '正在处理…',
    recoveryPending: '请先保存或处理此工作台中尚未保存的编辑，再执行恢复。',
    recoverySuccess: '恢复已保存。恢复前备份：',
    recoveryReceiptWarning: ' 恢复已成功，但状态凭据保存失败，原草稿仍会出现在列表中。',
    recoveryUnavailable: '请在 Zotero 中打开此页面，恢复本地冲突草稿。',
    recoveryInvalidated: '检测到新数据，请重新打开草稿，比较最新值。',
    recoveryRevision: '数据库版本：', recoveryFailed: '无法继续恢复：',
    searchClear: '清除关键词', searchStatus: '按状态筛选', searchAll: '全部状态', searchActive: '进行中', searchRevision: '修回中', searchAccepted: '已接收 / 发表', searchRejected: '已拒稿', searchEmpty: '没有找到匹配的投稿', searchEmptyHelp: '试试更短的关键词，或切换投稿状态。', searchReset: '清除筛选条件',
    shareZoom: '放大预览',
    shareFit: '适应窗口',
    shareAppearance: '卡片风格',
    shareGallery: '浏览风格',
    shareBrandSize: '品牌视觉大小',
    shareBrandCompact: '精致', shareBrandBalanced: '均衡', shareBrandBold: '醒目',
    shareResolution: '导出清晰度', shareResolutionStandard: '标准 · 宽 720 像素', shareResolutionHigh: '高清 · 宽 1440 像素', shareResolutionUltra: '超清 · 宽 2160 像素',
    shareResolutionLimited: '长图已自动调整分辨率',
    shareOmitted: '另有 {count} 个较早节点在图中以提示概括',
    shareRetry: '重新生成', sharePreviewError: '预览生成失败，请重试或降低导出清晰度。',
    shareStyleReset: '重置设计', shareStyleResetHelp: '恢复风格与导出设置，已隐藏的信息仍保持隐藏。',
    sharePrefsFailed: '图片可以正常使用，但此次设置未能保存。',
    shareEstuary: '江湾 · 雾蓝青玉渐变',
    shareIris: '鸢尾 · 蓝紫蔷薇渐变',
    shareAmber: '琥珀 · 暖砂青灰渐变',
    shareJournal: '期刊封面 · 学术蓝',
    shareConference: '会议海报 · 青绿渐变',
    shareArchive: '实验档案 · 暖纸记录',
    sharePaper: '清纸 · 简洁明亮',
    shareInk: '墨夜 · 深色质感',
    shareBlueprint: '蓝图 · 理性结构',
    shareMinimal: '极简 · 聚焦标题',
    shareCyber: '赛博霓虹 · 信号光晕',
    shareAurora: '极光实验室 · 光谱感',
    shareTerminal: '终端网格 · 精密感',
    shareRendering: '正在生成分享图…',
    submissionSearch: '查找投稿',
    submissionSearchPlaceholder: '搜索标题、期刊、作者或编号',
    submissionSearchCount: '{count} / {total} 条',
    dashboardNav: '仪表盘总览',
    manuscriptsNav: '手稿看板',
    submissionsNav: '投稿与审稿',
    settingsNav: '多云设置',
    forceSync: '立即同步云端',
    dashboardTitle: '仪表盘总览',
    dashboardSubtitle: '集中查看科研进展、投稿状态和关键时间线。',
    acceptedPublished: '🎉 已接收 / 已发表',
    activeReview: '🕒 进行中的投稿',
    totalSubmissions: '📊 投稿尝试总数',
    clickToFilter: '点击筛选',
    timelineTitle: '📅 手稿流水线时间线',
    timelineSubtitle: '通过可视化手稿流水线跟踪实验、写作、投稿、修改、接收和发表。',
    timelineSortedBySubmissionDate: '按投稿时间排序',
    compact: '紧凑',
    expanded: '展开',
    allPipelines: '全部流水线',
    activePipelines: '进行中的审稿',
    acceptedPipelines: '已接收 / 已发表',
    metricExpSubmit: '平均 实验 → 投稿',
    metricSubmitToday: '平均 在审：投稿 → 今天',
    metricR1Today: '平均 在审：R1 → 今天',
    metricSubmitAccept: '平均 已接收：投稿 → 接收',
    recentLogs: '⚡ 最近研究动态',
    timelineAlerts: '🔔 时间线提醒',
    addEvent: '+ 事件',
    latestEvent: '最新事件',
    timelineEvents: '时间线事件',
    manageEvents: '管理事件',
    openSubmissionDetails: '详情',
    shareJourney: '分享历程',
    shareJourneyTitle: '投稿历程分享图',
    shareJourneyHelp: '图片仅在本地生成，可另存为或复制后使用。',
    shareJourneyDownload: '另存为 PNG…',
    shareJourneyCopy: '复制图片',
    shareJourneyCopied: '分享图已复制到剪贴板。',
    shareJourneySaved: '图片已保存至：{path}',
    shareJourneySaveHelp: '点击“另存为 PNG”选择保存文件夹，保存后将在此显示完整路径。',
    shareJourneySaving: '请选择文件夹并保存 PNG…',
    shareJourneySaveCancelled: '已取消保存，未保存图片。',
    shareJourneySaveFailed: '图片保存失败：{error}',
    shareJourneyCopyFailed: '复制图片失败，请使用“另存为 PNG”。',
    shareJourneyReady: '分享图已生成。',
    shareJourneyFailed: '分享图生成失败。',
    shareJourneyEyebrow: 'ZOTERO PAPERFLOW · 投稿历程',
    shareJourneyStatus: '当前状态',
    shareJourneyDuration: '历程天数',
    shareJourneyTimeline: '关键节点',
    shareJournalLabel: '目标期刊',
    shareJourneyNoEvents: '暂无已记录日期的节点',
    shareJourneyFooter: '由 Zotero PaperFlow 在本地根据你的时间线生成',
    shareVisibilityTitle: '显示内容',
    shareVisibilityHelp: '隐藏选择会自动保存，并沿用到下一张分享图。',
    shareTimelineStart: '时间线起点',
    shareTimelineStartExperiment: '实验开始',
    shareTimelineStartSubmission: '投稿开始',
    shareFieldTitle: '题目',
    shareFieldJournal: '期刊',
    shareFieldAuthor: '第一作者',
    shareFieldStatus: '当前状态',
    shareFieldDuration: '历程天数',
    shareFieldDates: '节点日期',
    shareFieldFooter: 'Zotero PaperFlow 品牌标识',
    shareSizeTitle: '图片尺寸',
    shareSizePortrait: '竖版海报 · 随内容延展',
    shareSizeStory: '故事长幅 · 更高的构图',
    shareSizeAuto: '自适应长图',
    noEventYet: '暂无事件',
    addEventStart: '添加事件开始跟踪',
    clickAddEvent: '点击此处为此手稿添加时间线事件。',
    clickEditEvent: '点击编辑此事件。',
    settingsTitle: '多云设置',
    settingsSubtitle: '管理云端同步、工作区偏好与数据备份。',
    settingsKicker: '工作区控制中心',
    settingsTrustSummary: '数据保护摘要',
    settingsLocalFirst: '数据库本地保存',
    settingsDeviceSecrets: '凭据仅限本设备',
    settingsPreferencesAutosave: '云同步按需开启',
    settingsSecurityEyebrow: '架构级隐私保护',
    settingsSecurityTitle: '默认隐私保护',
    settingsSecurityHelp: '研究数据默认仅保存在当前设备。只有在你主动选择并配置云服务后才会同步；密码与令牌不会进入数据库文件、导出备份或云端同步载荷。',
    settingsRoutingEyebrow: '数据去向',
    settingsRoutePrivacy: '密码与令牌只保存在当前设备。',
    settingsLocalEyebrow: '当前存储方式',
    settingsLocalTitle: '仅使用本地缓存',
    settingsLocalHelp: '研究数据保存在当前本地设备（Zotero 数据目录）中，直到你导出备份或选择云端同步。',
    settingsLocalPointAccount: '无需注册同步账号',
    settingsLocalPointSync: '云端手动同步已关闭',
    settingsLocalPointBackup: '仍可随时导出 JSON',
    settingsProviderEyebrow: '服务凭据',
    settingsWebdavHelp: '连接私有 WebDAV 文件夹，用于保存数据库 JSON。',
    settingsCredentialNote: '凭据不会进入导出文件或远程同步数据库。',
    settingsGithubHelp: '将数据库 JSON 保存到私有仓库的指定分支。',
    settingsGithubCredentialNote: '建议使用仅限目标仓库且具有 Contents 权限的令牌。',
    settingsLanguageEyebrow: '界面',
    settingsAssistEyebrow: '浏览器智能识别',
    settingsBackupEyebrow: '数据韧性',
    settingsBackupNote: '每次有效导入前都会保留一个可恢复快照。',
    languageCardTitle: '界面偏好',
    languageLabel: '显示语言',
    languageHelp: '设置整个工作区使用的语言与外观模式。',
    languageAutoSaved: '界面偏好修改后会自动保存。',
    appearanceLabel: '外观模式',
    appearanceSystem: '跟随系统',
    appearanceLight: '浅色',
    appearanceDark: '深色',
    appearanceSaved: '外观偏好已保存。',
    autoCloudSyncLabel: '自动云同步',
    autoCloudSyncHelp: '本地修改保存后，自动同步到已配置完成的云端。',
    autoCloudSyncLocalHelp: '选择 WebDAV 或 GitHub 后可启用自动云同步。',
    detectedSubmissionPrefilled: '已从 {platform} 捕获信息，请逐项核对后再新建项目。',
    captureReviewTitle: '核对捕获的投稿信息',
    captureReviewHelp: '当前尚未保存。请人工核对识别字段，确认后再创建相互关联的项目、稿件和投稿记录。',
    captureConfidence: '识别置信度',
    captureFieldsDetected: '已识别 {count} 项信息',
    captureProjectTitle: '新建项目名称',
    captureProjectPlaceholder: '例如：Nano Letters 投稿—界面极化研究',
    manuscriptIdLabel: '稿件 / 投稿编号',
    capturedStatusLabel: '识别到的流程状态',
    firstAuthorLabel: '第一作者',
    firstAuthorHelp: '将在仪表盘条目中显示，并同步保存到关联稿件。',
    firstAuthorPlaceholder: '例如：陈晓明',
    firstAuthorNotSet: '未填写',
    authorsLabel: '作者',
    abstractLabel: '摘要 / 项目说明',
    keywordsLabel: '关键词',
    revisionDueLabel: '修回截止日期',
    confirmCreateProject: '确认并新建项目',
    captureCreatedToast: '已在人工核对后创建项目、稿件和投稿记录。',
    captureExistingOpenedToast: '该投稿已录入，已打开现有记录以避免重复创建。',
    confidenceHigh: '高',
    confidenceMedium: '中',
    confidenceLow: '需重点核对',
    cloudRoutingTitle: '云端同步',
    webdavTitle: 'WebDAV 凭据',
    githubTitle: 'GitHub 私有仓库同步',
    backupTitle: '数据库备份与导入',
    saveLanguage: '保存语言设置',
    saveMappings: '保存存储映射',
    exportDb: '导出数据库',
    exportDiagnostics: '导出诊断信息',
    importJson: '导入 JSON',
    restoreImportBackup: '恢复导入前备份',
    languageSaved: '语言偏好已保存。',
    databaseExported: '数据库 JSON 已导出！',
    diagnosticsExported: '已导出不含凭据的诊断信息。',
    databaseImported: '数据库 JSON 已成功导入。',
    importBackupRestored: '已恢复到上一次导入操作前的数据库状态。',
    noImportBackup: '当前设备上没有可恢复的导入前备份。',
    restoreImportConfirm: '确定恢复上一次导入前保存的数据库吗？当前未保存的更改将被替换。',
    importFileTooLarge: '所选备份超过 25 MB，未执行读取。',
    invalidBackup: '该文件不是可识别的 Zotero PaperFlow 数据库备份。',
    noUrgentEvents: '暂无紧急审稿或时间线事件。',
    noRecentRecords: '暂无研究动态。',
    noPipelines: '暂无进行中的手稿投稿流水线。',
    eventNameRequired: '事件名称必填。',
    zoteroSync: '导入到 Zotero',
    untitledEvent: '未命名事件',
    untitledManuscript: '未命名手稿',
    untitledProject: '未命名项目',
    targetJournal: '目标期刊',
    typeNoEvent: '无事件',
    eventTypeResearch: '研究',
    eventTypeWriting: '写作',
    eventTypeSubmission: '投稿',
    eventTypeReview: '审稿',
    eventTypeRevision: '修改',
    eventTypePublication: '出版',
    eventTypeSpecial: '特殊',
    statusCompleted: '已完成',
    statusActive: '进行中',
    statusPending: '计划中',
    statusBlocked: '受阻',
    inlineAddTimelineEvent: '添加时间线事件',
    keyEventPreset: '关键事件',
    customEvent: '自定义事件',
    eventNotesShort: '备注',
    cancel: '取消',
    eventPlaceholder: '事件，如 收到 R1 审稿意见',
    noDate: '无日期',
    days: '天',
    dayUnitShort: '天',
    relativeToday: '今天',
    relativeDaysAgo: '{count} 天前',
    relativeInDays: '{count} 天后',
    nodesSaved: '已保存 {count} 个节点',
    expSubmitShort: '实验→投稿',
    keyEventRail: '关键事件轨',
    countingNow: '计时中',
    completedInterval: '已完成区间',
    displayPrepareLabel: '实验 → 投稿',
    displayPrepareCaption: '当前重点：完成投稿前周期。',
    displayAcceptedLabel: '投稿 → 接收',
    displayAcceptedCaption: '已接收手稿显示从投稿到接收的总时长。',
    displayR1Label: 'R1 审稿意见 → 今天',
    displayR1Caption: 'R1 意见已返回；活动窗口现在从第一次决定开始算起。',
    displayReviewLabel: '投稿 → 今天',
    displayReviewCaption: '审稿进行中；持续追踪投稿后的流转时长。',
    milestoneExperimentStart: '实验开始',
    milestoneExperimentDone: '实验完成',
    milestoneSubmission: '投稿',
    milestoneAcceptance: '接收',
    milestoneR1Comments: 'R1 意见',
    milestoneToday: '今天',
    statePreparing: '准备中',
    stateOnline: '在线',
    stateAccepted: '已接收',
    stateAfterR1: 'R1 之后',
    stateUnderReview: '审稿中',
    stateSubmitted: '已投稿',
    stateNotSubmitted: '未投稿',
    stateSinceR1: '距 R1 {count} 天',
    stateSinceSubmit: '距投稿 {count} 天',
    defaultExperimentsStarted: '实验开始',
    defaultExperimentsCompleted: '实验完成',
    defaultDataOrganization: '数据整理',
    defaultDraftCompleted: '初稿完成',
    defaultManuscriptSubmitted: '手稿已投稿',
    defaultReviewCommentsR1: 'R1 审稿意见',
    defaultR1RevisionSubmitted: 'R1 修改稿已提交',
    defaultReviewCommentsR2: 'R2 审稿意见',
    defaultR2RevisionSubmitted: 'R2 修改稿已提交',
    defaultAccepted: '已接收',
    defaultOnlinePublication: '网络见刊',
    defaultProof: '校样',
    editTimelineEvent: '编辑时间线事件',
    close: '关闭',
    eventName: '事件名称',
    type: '类型',
    status: '状态',
    keyEventMapping: '关键事件映射',
    eventDate: '事件日期',
    eventDateHelp: '时间线事件仅需一个日期：事件发生日。截止日期在投稿编辑器中管理。',
    plannedDate: '计划日期',
    initialSubmissionDate: '首次投稿日期',
    deadlineDate: '截止日期',
    completionDate: '完成日期',
    firstDecisionDate: '首次决定 / R1 日期',
    revisionDueDateLabel: '修改截止日期',
    timelineDateSource: '日期来源',
    doiLabel: 'DOI',
    articlePage: '文章页面',
    doiNotSet: '未设置 DOI',
    trackSubmissionTitle: '跟踪期刊投稿',
    manuscriptPaper: '手稿 / 论文',
    targetJournalInput: '目标期刊',
    articleUrlLabel: '文章 / 期刊 URL',
    articleUrlPlaceholder: 'https://doi.org/10.xxxx/xxxxx',
    trackSubmissionButton: '跟踪投稿',
    manuscriptJournalRequired: '手稿和目标期刊为必填项',
    submissionAddedToast: '新投稿已添加到流水线！',
    dateSourceSubmission: '投稿记录',
    dateSourceTimeline: '时间线节点',
    dateSourceMissing: '未设置',
    planToday: '计划为今天',
    setToday: '设为今天',
    due14: '截止 +14天',
    markActive: '标记为进行中',
    markDoneToday: '今天标记完成',
    clearDates: '清除日期',
    clearDate: '清除日期',
    notes: '备注',
    notesPlaceholder: '决定细节、审稿截止日、系统备注或下一步...',
    delete: '删除',
    saveChanges: '保存更改',
    keyAuto: '自动识别',
    keyExperimentsStarted: '关键：实验开始',
    keyExperimentsDone: '关键：实验完成',
    keyDraftDone: '关键：初稿完成',
    keySubmitted: '关键：已投稿',
    keyR1Comments: '关键：R1 意见',
    keyR1Resubmitted: '关键：R1 已重投',
    keyR2Comments: '关键：R2 意见',
    keyR2Resubmitted: '关键：R2 已重投',
    keyAccepted: '关键：已接收',
    keyOnlinePublished: '关键：网络见刊',
    statusPlannedNotStarted: '计划中 / 未开始',
    statusInProgress: '进行中',
    statusBlockedException: '受阻 / 异常',
    statusOverdue: '已逾期',
    statusDueSoon: '即将到期',
    statusUpcoming: '未来计划',
    specialException: '特殊 / 异常',
    manuscriptNotFound: '未找到手稿记录，正在刷新工作区。',
    manuscriptStatusUpdated: '手稿状态已更新。',
    manuscriptStatusUpdatedTo: '手稿状态已更新为“{status}”。',
    submissionNotFound: '未找到投稿记录。正在刷新仪表盘。',
    eventNotFound: '未找到事件。正在刷新仪表盘。',
    eventAddedToast: '已添加事件“{name}”。',
    eventSavedToast: '已保存事件“{name}”。',
    eventRemovedToast: '已从流水线移除事件',
    confirmDeleteEvent: '确定要删除事件“{name}”吗？',
    confirmUpdateEvent: '此关键事件已存在。是否更新“{name}”而非重复添加？',
    statusRejected: '已拒稿',
    markRejected: '标记为拒稿',
    transferToJournal: '转投新期刊',
    transferSubmissionTitle: '拒稿：转投其他期刊',
    newTargetJournal: '新目标期刊',
    rejectionDate: '拒稿日期',
    rejectionNote: '决定备注',
    transferButton: '创建新投稿',
    rejectedToast: '已标记为拒稿。',
    transferToast: '新的目标期刊投稿已创建。',
    manuscriptsTitle: '手稿看板',
    manuscriptsSubtitle: '跟踪从提纲、写作到投稿和同行评审的全过程。',
    addManuscript: '+ 新建手稿',
    kanbanIdea: '规划',
    kanbanDrafting: '正在进行',
    kanbanSubmitted: '已投稿',
    kanbanAccepted: '已接收 / 已发表',
    kanbanShowEmpty: '显示空阶段',
    kanbanHideEmpty: '隐藏空阶段',
    kanbanStageSummary: '4 个阶段中有 {count} 个包含手稿',
    submissionsPageTitle: '投稿与同行评审矩阵',
    submissionsPageSubtitle: '按期刊追踪投稿、审稿、返修与发表，并集中管理回复记录。',
    activeSubmissionsTitle: '进行中的投稿',
    activeSubmissionsHelp: '选择投稿，查看时间线、状态和审稿记录。',
    submissionEmptyDetail: '选择一个投稿；编辑区会在工作流上下文下方打开。',
    journalPortalsTitle: '常用投稿入口',
    journalPortalsHelp: '打开、编辑或添加期刊投稿网址。',
    trackNewSubmissionButton: '+ 跟踪新投稿',
    submissionDetailKicker: '期刊投稿',
    currentStageLabel: '当前阶段',
    trackedSinceLabel: '跟踪始于',
    workflowContextTitle: '工作流上下文',
    workflowNeedsLinking: '需要关联',
    linkManuscript: '关联手稿',
    linkSubmissionTitle: '将投稿关联到手稿',
    linkSubmissionHelp: '请选择此投稿记录所属的手稿。',
    linkSubmissionConfirm: '确认关联',
    linkSubmissionSaved: '投稿已关联到所选手稿。',
    noManuscriptsToLink: '暂无可关联手稿，请先新建手稿。',
    workflowLinkedFlow: '已关联流程',
    workflowManuscriptLabel: '手稿',
    workflowTimelineLabel: '时间线',
    workflowReviewerCommentsLabel: '审稿意见',
    editFields: '编辑字段',
    jumpToEditor: '前往编辑器',
    submissionEntryEditorTitle: '投稿记录编辑器',
    submissionEntryEditorHelp: '在此编辑选中的条目，填写内容会自动保存。',
    linkedManuscriptBadge: '已关联手稿',
    detachedSubmissionBadge: '未关联手稿',
    manuscriptSection: '手稿',
    manuscriptTitleLabel: '手稿题目',
    paperTitlePlaceholder: '论文题目',
    submissionPortalUrl: '投稿入口 URL',
    reviewTimingSection: '审稿时间线',
    publicationSection: '出版信息',
    submissionChecklistSection: '投稿清单',
    peerReviewMatrixSection: '同行评审回复矩阵',
    addComment: '添加审稿意见',
    reviewEditorHelp: '审稿意见和作者回复会在填写时自动保存。',
    autoSavePending: '等待保存',
    autoSaveSaving: '正在保存更改…',
    autoSaveSaved: '所有更改均已自动保存',
    autoSaveInvalid: '请检查当前填写内容',
    autoSaveFailed: '自动保存失败，当前填写内容仍保留在表单中。',
    localStorageUnavailable: '本地存储不可用。请重新打开工作台后重试。',
    saveNewEditsPending: '保存期间产生了新编辑，仍有内容待保存。请再次保存以包含这些修改。',
    acceptanceCelebrationEyebrow: '重要里程碑达成',
    acceptanceCelebrationTitle: '文章已接收，恭喜！',
    acceptanceCelebrationBody: '《{title}》跨过了一个重要的科研里程碑。',
    transferRoundHelp: '一步关闭当前轮次并创建下一个目标期刊记录。',
    savedReviewPreviewTitle: '已保存审稿预览',
    savedReviewPreviewHelp: '与投稿记录编辑器自动同步的只读快照。',
    exportTable: '导出表格',
    emptyReviewEditor: '暂未记录审稿意见；在此添加后将自动保存。',
    emptyReviewPreview: '暂无已保存的审稿意见。',
    reviewerCommentLabel: '审稿意见 #{count}',
    reviewerCommentPlaceholder: '粘贴审稿意见...',
    authorResponseLabel: '作者回复',
    authorResponsePlaceholder: '撰写你的专业回复...',
    copy: '复制',
    removeComment: '删除意见',
    checklistLabel: '清单',
    responsesLabel: '回复',
    responseSaved: '回复已保存',
    responsePending: '等待回复',
    noCommentText: '暂未保存意见文本。',
    submissionEditsSaved: '投稿编辑已保存。',
    confirmDeleteSubmission: '确定删除此投稿跟踪？',
    confirmMarkRejected: '确定将此投稿标记为拒稿？',
    deleteSubmissionTitle: '删除投稿跟踪',
    deleteManuscript: '删除稿件',
    confirmDeleteManuscript: '确定要删除此稿件吗？此操作将同步删除关联的所有投稿跟踪记录。',
    manuscriptDeletedToast: '稿件已成功删除。',
    noReviewerCommentsExport: '暂无审稿意见可导出。',
    latexDownloaded: 'LaTeX 模板已下载。',
    currentJournalLabel: '当前期刊',
    transferModalHelp: '这会将当前投稿标记为拒稿，并为下一个期刊创建新的进行中投稿。',
    validPortalUrlOrBlank: '请输入有效的期刊入口 URL，或保持为空。',
    newManuscriptTitleLabel: '新手稿题目',
    createNewManuscriptOption: '+ 创建新手稿...',
    targetJournalPlaceholder: '例如：Advanced Functional Materials',
    rejectionNotePlaceholder: '可选的主编决定、范围不符说明、审稿总结或下一步操作备注...',
    editManuscriptMetadata: '编辑手稿元数据',
    addNewManuscriptTitle: '添加新手稿',
    writingStatus: '写作状态',
    statusPlanning: '规划',
    statusIdea: '想法',
    statusOutline: '提纲',
    statusInProgress: '正在进行',
    statusFiguresPrep: '图件准备',
    statusDrafting: '写作中',
    statusInternalReview: '内部评审',
    abstractDraft: '摘要草稿',
    abstractPlaceholder: '撰写手稿摘要草稿...',
    createManuscript: '创建手稿',
    academicCapturePrefilled: '已捕获学术搜索结果，请核对信息后创建手稿。',
    scholarSourcePage: '学术结果 / 文章链接',
    manuscriptTitleRequired: '请填写手稿题目后再继续。',
    academicCaptureChooseTitle: '选择要录入的学术结果',
    academicCaptureChooseHelp: '请选择你要捕获的论文；在核对表单并确认前不会写入数据库。',
    academicCaptureSource: '捕获来源',
    academicCaptureConfidence: '识别置信度',
    academicCaptureDetected: '条结果已识别',
    academicDuplicateConfirm: '检测到相同手稿。是否用当前核对后的信息更新已有记录，避免重复创建？',
    academicDuplicateUpdated: '已更新现有手稿，未创建重复条目。',
    academicCaptureSaved: 'Zotero 手稿已核对并保存。',
    storageRoutingHelp: '选择 Zotero PaperFlow 元数据数据库的存储与同步位置。',
    routeDbLabel: '同步位置',
    optionLocalCache: '无（仅使用本地缓存）',
    optionWebDavDrive: 'WebDAV 网盘（坚果云、Nextcloud）',
    optionGithubRepo: 'GitHub 私有仓库',
    localSyncSummary: '仅本地模式：数据保存在当前设备，云端手动同步已停用。',
    webdavSyncSummary: 'WebDAV 模式：请在下方配置并测试 WebDAV 账户。',
    githubSyncSummary: 'GitHub 模式：请在下方配置并测试私有仓库。',
    webdavUrlLabel: 'WebDAV 服务器基础 URL',
    usernameEmailLabel: '用户名 / 邮箱',
    appPasswordLabel: '应用专用密码',
    testWebdav: '测试 WebDAV 连接',
    githubPatLabel: 'GitHub Personal Access Token（PAT）',
    githubRepoLabel: '仓库名称（所有者/仓库）',
    githubBranchLabel: '分支名称',
    testGithub: '测试 GitHub 仓库',
    backupHelp: '将研究数据库导出为 JSON，或导入并迁移现有的 Zotero PaperFlow JSON 备份。'
  }
};

function t(key) {
  return I18N[currentLanguage]?.[key] || I18N.en[key] || key;
}

function normalizeThemePreference(value) {
  const normalized = String(value || 'system').trim().toLowerCase();
  return UI_THEME_OPTIONS.has(normalized) ? normalized : 'system';
}

function resolvePreferredLanguage() {
  if (db?.settings?.profile?.language === 'zh' || db?.settings?.profile?.language === 'en') {
    return db.settings.profile.language;
  }
  try {
    const zotero = (typeof Zotero !== 'undefined' ? Zotero : null) || (typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null);
    if (zotero?.locale && String(zotero.locale).toLowerCase().startsWith('zh')) return 'zh';
    if (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('zh')) return 'zh';
  } catch (_) {}
  return 'en';
}

function applyThemePreference(value) {
  const theme = normalizeThemePreference(value);
  if (theme === 'system') {
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = 'light dark';
    try {
      const parentDoc = window.parent?.document?.documentElement;
      const isDarkParent =
        parentDoc?.classList?.contains('dark') ||
        parentDoc?.getAttribute('data-theme') === 'dark' ||
        parentDoc?.getAttribute('tz-theme') === 'dark' ||
        window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      if (isDarkParent) {
        document.documentElement.dataset.theme = 'dark';
        document.documentElement.style.colorScheme = 'dark';
      }
    } catch (_) {}
  } else {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }
  return theme;
}

function isDarkThemeActive() {
  const explicitTheme = document.documentElement.dataset.theme;
  if (explicitTheme) return explicitTheme === 'dark';
  return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function tf(key, vars = {}) {
  return t(key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeSubmissionStatus(value) {
  const normalized = normalizeText(value).replace(/[\s-]+/g, '_');
  const aliases = {
    accept: 'accepted',
    accepted: 'accepted',
    online: 'published',
    publication: 'published',
    published: 'published',
    underreview: 'under_review',
    in_review: 'under_review',
    review: 'under_review',
    revise: 'revision',
    revision_required: 'revision',
    resubmit: 'revision',
    reject: 'rejected',
    rejected: 'rejected',
    submit: 'submitted'
  };
  const canonical = aliases[normalized] || normalized;
  return ['submitted', 'under_review', 'revision', 'accepted', 'published', 'rejected'].includes(canonical)
    ? canonical
    : 'submitted';
}

function normalizeSubmissionStatuses(database) {
  let changed = false;
  (database?.submissions || []).forEach((submission) => {
    changed = normalizeWorkflowFields(submission) || changed;
    const canonical = normalizeSubmissionStatus(submission.status);
    if (submission.status !== canonical) {
      submission.status = canonical;
      submission.updatedAt = new Date().toISOString();
      changed = true;
    }
  });
  return changed;
}

function normalizeDoi(value) {
  return String(value || '').trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
}

function extractDoiFromText(value) {
  const match = String(value || '').match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return match ? normalizeDoi(match[0].replace(/[.,;)\]]+$/, '')) : '';
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setAllText(selector, value) {
  document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
}

function setPlaceholder(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('placeholder', value);
}

function setTitle(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('title', value);
}

function setOptionText(selector, value, text) {
  const option = document.querySelector(`${selector} option[value="${value}"]`);
  if (option) option.textContent = text;
}

function setTableHeaderText(selector, index, value) {
  const header = document.querySelectorAll(`${selector} th`)[index];
  if (header) header.textContent = value;
}

function setNavText(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return;
  const icon = el.querySelector('svg');
  window.RFUI.setHTML(el, '');
  if (icon) el.appendChild(icon);
  el.appendChild(document.createTextNode(value));
}

function setButtonText(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return;
  const icon = el.querySelector('svg');
  window.RFUI.setHTML(el, '');
  if (icon) el.appendChild(icon);
  el.appendChild(document.createTextNode(value));
}

function setFilterCardTitle(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return;
  window.RFUI.setHTML(el, `${escapeHTML(value)} <span class="filter-tip">${escapeHTML(t('clickToFilter'))}</span>`);
}

function applyLanguage() {
  setNavText('.nav-item[data-view="view-dashboard"]', t('dashboardNav'));
  setNavText('.nav-item[data-view="view-manuscripts"]', t('manuscriptsNav'));
  setNavText('.nav-item[data-view="view-submissions"]', t('submissionsNav'));
  setNavText('.nav-item[data-view="view-settings"]', t('settingsNav'));

  setText('#view-dashboard .view-header h1', t('dashboardTitle'));
  setText('#view-dashboard .view-header .text-muted', t('dashboardSubtitle'));
  setFilterCardTitle('#card-filter-accepted h4', t('acceptedPublished'));
  setFilterCardTitle('#card-filter-active h4', t('activeReview'));
  setFilterCardTitle('#card-filter-all h4', t('totalSubmissions'));
  setAllText('.filter-tip', t('clickToFilter'));
  setText('.pipeline-module-header h3', t('timelineTitle'));
  setText('.pipeline-module-header .text-muted', t('timelineSubtitle'));
  updatePipelineViewToggle();
  setText('#dashboard-filter-label', getDashboardFilterLabel());
  const summaryCards = document.querySelectorAll('.timeline-summary-header .summary-card .label');
  if (summaryCards[0]) summaryCards[0].textContent = t('metricExpSubmit');
  if (summaryCards[1]) summaryCards[1].textContent = t('metricSubmitToday');
  if (summaryCards[2]) summaryCards[2].textContent = t('metricR1Today');
  if (summaryCards[3]) summaryCards[3].textContent = t('metricSubmitAccept');
  const recentHeads = document.querySelectorAll('#view-dashboard .recent-box h3');
  if (recentHeads[0]) recentHeads[0].textContent = t('timelineAlerts');

  setText('#view-manuscripts .view-header h1', t('manuscriptsTitle'));
  setText('#view-manuscripts .view-header .text-muted', t('manuscriptsSubtitle'));
  setButtonText('#btn-add-manuscript', t('addManuscript'));
  setText('.kanban-col[data-status="idea"] .col-header h3', `🎯 ${t('kanbanIdea')}`);
  setText('.kanban-col[data-status="drafting"] .col-header h3', `⏳ ${t('kanbanDrafting')}`);
  setText('.kanban-col[data-status="submitted"] .col-header h3', `🚀 ${t('kanbanSubmitted')}`);
  setText('.kanban-col[data-status="accepted"] .col-header h3', `🎉 ${t('kanbanAccepted')}`);
  updateKanbanEmptyColumns();

  setText('#view-submissions .view-header h1', t('submissionsPageTitle'));
  setText('#view-submissions .view-header .text-muted', t('submissionsPageSubtitle'));
  setText('.portal-dock-title', t('journalPortalsTitle'));
  setText('#portal-dock-help', t('journalPortalsHelp'));
  setTitle('#btn-add-portal', t('addPortalTitle'));
  setButtonText('#btn-add-submission', t('trackNewSubmissionButton'));
  setText('.submission-list-head h3', t('activeSubmissionsTitle'));
  setText('.submission-list-head .text-muted', t('activeSubmissionsHelp'));
  setText('#submission-search-label', t('submissionSearch'));
  document.getElementById('submission-search')?.setAttribute('placeholder', t('submissionSearchPlaceholder'));
  document.getElementById('submission-search-clear')?.setAttribute('aria-label', t('searchClear'));
  document.getElementById('submission-search-status')?.setAttribute('aria-label', t('searchStatus'));
  for (const [value, key] of [['all', 'searchAll'], ['active', 'searchActive'], ['revision', 'searchRevision'], ['accepted', 'searchAccepted'], ['rejected', 'searchRejected']]) setOptionText('#submission-search-status', value, t(key));
  setText('#submission-search-empty-title', t('searchEmpty'));
  setText('#submission-search-empty-help', t('searchEmptyHelp'));
  setText('#submission-search-reset', t('searchReset'));
  setText('#submission-detail-panel .empty-state h3', t('submissionEmptyDetail'));

  setText('#view-settings .view-header h1', t('settingsTitle'));
  setText('#view-settings .view-header .text-muted', t('settingsSubtitle'));
  document.querySelector('.settings-trust-strip')?.setAttribute('aria-label', t('settingsTrustSummary'));
  setText('#settings-security-title', t('settingsSecurityTitle'));
  setText('#settings-security-help', t('settingsSecurityHelp'));
  setText('#settings-route-privacy-note', t('settingsRoutePrivacy'));
  setText('#settings-local-title', t('settingsLocalTitle'));
  setText('#settings-local-help', t('settingsLocalHelp'));
  setText('#settings-local-point-account', t('settingsLocalPointAccount'));
  setText('#settings-local-point-sync', t('settingsLocalPointSync'));
  setText('#settings-local-point-backup', t('settingsLocalPointBackup'));
  setText('#settings-webdav-help', t('settingsWebdavHelp'));
  setText('#settings-credential-note', t('settingsCredentialNote'));
  setText('#settings-github-help', t('settingsGithubHelp'));
  setText('#settings-github-credential-note', t('settingsGithubCredentialNote'));
  setText('#settings-backup-note', t('settingsBackupNote'));
  setText('#settings-language-card h3', t('languageCardTitle'));
  setText('label[for="ui-language"]', t('languageLabel'));
  setText('label[for="ui-theme"]', t('appearanceLabel'));
  setOptionText('#ui-theme', 'system', t('appearanceSystem'));
  setOptionText('#ui-theme', 'light', t('appearanceLight'));
  setOptionText('#ui-theme', 'dark', t('appearanceDark'));
  setText('#language-help', t('languageHelp'));
  setText('#language-auto-save-status', t('languageAutoSaved'));
  setText('#auto-cloud-sync-label', t('autoCloudSyncLabel'));
  setText('#settings-cloud-card h3', t('cloudRoutingTitle'));
  setText('#settings-webdav-card h3', t('webdavTitle'));
  setText('#settings-github-card h3', t('githubTitle'));
  setText('#settings-backup-card h3', t('backupTitle'));
  setText('#settings-cloud-card .text-muted', t('storageRoutingHelp'));
  setText('label[for="route-db"]', t('routeDbLabel'));
  setOptionText('#route-db', 'local', t('optionLocalCache'));
  setOptionText('#route-db', 'webdav', t('optionWebDavDrive'));
  setOptionText('#route-db', 'github', t('optionGithubRepo'));
  setButtonText('#btn-save-settings', t('saveMappings'));
  setButtonText('#btn-sync-cloud-now', t('forceSync'));
  setText('label[for="webdav-url"]', t('webdavUrlLabel'));
  setText('label[for="webdav-username"]', t('usernameEmailLabel'));
  setText('label[for="webdav-password"]', t('appPasswordLabel'));
  setButtonText('#btn-test-webdav', t('testWebdav'));
  setText('label[for="github-token"]', t('githubPatLabel'));
  setText('label[for="github-repo"]', t('githubRepoLabel'));
  setText('label[for="github-branch"]', t('githubBranchLabel'));
  setButtonText('#btn-test-github', t('testGithub'));
  setText('#settings-backup-card .text-muted', t('backupHelp'));
  setButtonText('#btn-export-db', t('exportDb'));
  setButtonText('#btn-export-diagnostics', t('exportDiagnostics'));
  setButtonText('#btn-trigger-import', t('importJson'));
  setButtonText('#btn-restore-import-backup', t('restoreImportBackup'));
  updateSyncProviderVisibility();
  window.PaperFlowRecovery?.translate();
}

async function renderAllViews() {
  submissionAutoSaveCleanup?.();
  const panel = document.getElementById('submission-detail-panel');
  if (panel) { window.RFUI.setHTML(panel, ''); delete panel.dataset.currentSubmissionId; }
  currentLanguage = resolvePreferredLanguage();
  applyThemePreference(db.settings?.profile?.theme || 'system');
  applyLanguage();
  renderDashboard();
  renderKanban();
  renderSubmissions();
  setupZoteroIntegrations();
}

function refreshActiveViewForLanguage() {
  const activeViewId = document.querySelector('.content-view.active')?.id || 'view-dashboard';
  if (activeViewId === 'view-dashboard') renderDashboard();
  if (activeViewId === 'view-manuscripts') renderKanban();
  if (activeViewId === 'view-submissions') renderSubmissions();
  if (activeViewId === 'view-settings') loadSettings().catch(console.error);
}

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation Routing
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.content-view');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (!db || !canLeaveSubmissionEditor()) return;
      const targetView = item.getAttribute('data-view');
      if (targetView === 'view-settings' && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero
        && !document.documentElement.classList.contains('settings-only')) {
        ZoteroBridge.sendToHost({ type: 'RESEARCHFLOW_OPEN_PREFS' });
        return;
      }
      if (targetView !== 'view-submissions') submissionAutoSaveCleanup?.();

      navItems.forEach(n => n.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(targetView).classList.add('active');
      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.scrollTop = 0;

      // Trigger tab-specific loaders
      if (targetView === 'view-dashboard') renderDashboard();
      if (targetView === 'view-manuscripts') renderKanban();
      if (targetView === 'view-submissions') renderSubmissions();
      if (targetView === 'view-settings') {
        loadSettings().catch(console.error).finally(() => {
          updateSyncProviderVisibility();
        });
      }
    });
  });

  setupSubmissionSearch();

  // Load Database
  try {
    db = await window.storage.loadAll();
  } catch (error) {
    const view = document.getElementById('view-dashboard');
    view.replaceChildren();
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = `无法加载本地数据 / Unable to load local data: ${error.message}`;
    const retry = document.createElement('button');
    retry.className = 'btn-primary';
    retry.textContent = '重新加载 / Retry';
    retry.addEventListener('click', () => location.reload());
    view.append(message, retry);
    return;
  }
  applyThemePreference(db.settings?.profile?.theme || 'system');
  currentLanguage = resolvePreferredLanguage();
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';

  // Dynamic Database Migration: Translate Chinese nodes to English & filter out '手稿定稿'
  const originalDatabase = structuredClone(db);
  let dbMigrationChanged = false;
  if (db && db.submissions) {
    dbMigrationChanged = normalizeSubmissionStatuses(db) || dbMigrationChanged;
    db.submissions.forEach(sub => {
      if (sub.timelineNodes && sub.timelineNodes.length > 0) {
        const originalLength = sub.timelineNodes.length;
        // Filter out '手稿定稿'
        sub.timelineNodes = sub.timelineNodes.filter(node => {
          const nameTrimmed = (node.name || '').trim();
          return nameTrimmed !== '手稿定稿' && nameTrimmed !== 'Manuscript Finalization';
        });

        const nameMapping = {
          '实验完成': 'Experiments Completed',
          '数据整理': 'Data Organization',
          '初稿完成': 'Draft Completed',
          '投稿': 'Manuscript Submitted',
          '审稿意见 R1': 'Review Comments R1',
          'R1 修回提交': 'R1 Revision Submitted',
          '审稿意见 R2': 'Review Comments R2',
          'R2 修回提交': 'R2 Revision Submitted',
          '接收': 'Accepted',
          'Online': 'Online Publication',
          'Proof': 'Proof'
        };

        sub.timelineNodes.forEach(node => {
          const nameTrimmed = (node.name || '').trim();
          if (nameMapping[nameTrimmed]) {
            node.name = nameMapping[nameTrimmed];
            dbMigrationChanged = true;
          }
        });

        if (sub.timelineNodes.length !== originalLength) {
          dbMigrationChanged = true;
        }
      }
    });

    dbMigrationChanged = clearUnacceptedPublicationLinks(db) || dbMigrationChanged;
    dbMigrationChanged = syncManuscriptStatusesFromSubmissions(db) || dbMigrationChanged;

    db.submissions.forEach(sub => { dbMigrationChanged = normalizeSubmissionTimeline(sub) || dbMigrationChanged; });
    if (dbMigrationChanged) {
      try {
        const backupKey = 'researchflow_pre_workflow_sync_backup';
        const existing = await RFPlatform.storage.local.get([backupKey]);
        if (!existing[backupKey]) await RFPlatform.storage.local.set({ [backupKey]: { createdAt: new Date().toISOString(), database: originalDatabase } });
        db = await window.storage.saveAll(db, { mergeOnConflict: true });
      }
      catch (error) { showGlobalToast(error.message, 'error'); }
    }
  }

  // Set up synchronization alerts/updates
  RFPlatform.runtime.onMessage.addListener((message) => {
    if (message.action === 'DATABASE_UPDATED') {
      applyDatabaseUpdate(message.data);
    }
  });

  // Initial load
  applyLanguage();
  renderDashboard();
  setupSettingsListeners();
  setupSaveErrorListener();
  setupGlobalModalListeners();
  setupJournalPortalListeners();
  setupDashboardFilterListeners();
  if (document.documentElement.classList.contains('settings-only')) {
    views.forEach(view => view.classList.toggle('active', view.id === 'view-settings'));
    await loadSettings();
  }
  // Pipeline View Toggle and Drawer Event Listeners
  initializePipelineViewMode();
  initializeKanbanEmptyColumnsMode();
  const btnToggle = document.getElementById('btn-pipeline-view-toggle');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      setPipelineViewMode(!isPipelineExpanded);
    });
  }

  window._researchflowWorkspaceReady = true;
  window.dispatchEvent(new Event('researchflow-workspace-ready'));
});

