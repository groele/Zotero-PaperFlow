/**
 * Zotero PaperFlow - DOM Language Application & Timeline Presets
 */
import { t } from './status-helpers.js';

declare var db: any;
declare var currentLanguage: string;
declare function escapeHTML(value: any): string;
declare function updatePipelineViewToggle(): void;
declare function getDashboardFilterLabel(): string;
declare function updateKanbanEmptyColumns(): void;
declare function applySubmissionSearch(): void;
declare function updateSyncRouteNotice(): void;

export function setText(selector: string, value: any): void {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

export function setAllText(selector: string, value: any): void {
  document.querySelectorAll(selector).forEach((el) => { el.textContent = value; });
}

export function setPlaceholder(selector: string, value: any): void {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('placeholder', value);
}

export function setTitle(selector: string, value: any): void {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('title', value);
}

export function setOptionText(selector: string, value: string, text: any): void {
  const option = document.querySelector(`${selector} option[value="${value}"]`);
  if (option) option.textContent = text;
}

export function setTableHeaderText(selector: string, index: number, value: any): void {
  const header = document.querySelectorAll(`${selector} th`)[index];
  if (header) header.textContent = value;
}

export function setNavText(selector: string, value: any): void {
  const el = document.querySelector(selector);
  if (!el) return;
  const icon = el.querySelector('svg');
  (window as any).RFUI.setHTML(el, '');
  if (icon) el.appendChild(icon);
  el.appendChild(document.createTextNode(value));
}

export function setButtonText(selector: string, value: any): void {
  const el = document.querySelector(selector);
  if (!el) return;
  const icon = el.querySelector('svg');
  (window as any).RFUI.setHTML(el, '');
  if (icon) el.appendChild(icon);
  el.appendChild(document.createTextNode(value));
}

export function setFilterCardTitle(selector: string, value: any): void {
  const el = document.querySelector(selector);
  if (!el) return;
  (window as any).RFUI.setHTML(el, `${escapeHTML(value)} <span class="filter-tip">${escapeHTML(t('clickToFilter'))}</span>`);
}

export function applyLanguage(): void {
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
  if (typeof updatePipelineViewToggle === 'function') updatePipelineViewToggle();
  if (typeof getDashboardFilterLabel === 'function') setText('#dashboard-filter-label', getDashboardFilterLabel());
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
  if (typeof updateKanbanEmptyColumns === 'function') updateKanbanEmptyColumns();

  setText('#view-submissions .view-header h1', t('submissionsPageTitle'));
  setText('#view-submissions .view-header .text-muted', t('submissionsPageSubtitle'));
  setText('#btn-add-submission', t('trackNewSubmissionButton'));
  setText('.submissions-list-panel > h3', t('activeSubmissionsTitle'));
  setText('#submissions-list-help', t('activeSubmissionsHelp'));
  setText('#submission-search-label', t('submissionSearch'));
  setPlaceholder('#submission-search', t('submissionSearchPlaceholder'));
  setTitle('#submission-search-clear', t('searchClear'));
  document.getElementById('submission-search-clear')?.setAttribute('aria-label', t('searchClear'));
  document.getElementById('submission-search-status')?.setAttribute('aria-label', t('searchStatus'));
  setOptionText('#submission-search-status', 'all', t('searchAll'));
  setOptionText('#submission-search-status', 'active', t('searchActive'));
  setOptionText('#submission-search-status', 'revision', t('searchRevision'));
  setOptionText('#submission-search-status', 'accepted', t('searchAccepted'));
  setOptionText('#submission-search-status', 'rejected', t('searchRejected'));
  setText('#submission-search-empty strong', t('searchEmpty'));
  setText('#submission-search-empty span', t('searchEmptyHelp'));
  setText('#submission-search-reset', t('searchReset'));
  if (typeof applySubmissionSearch === 'function') applySubmissionSearch();
  setText('#submission-detail-panel > .empty-state h3', t('submissionEmptyDetail'));
  setText('.submission-tools-row .portal-header h3', t('journalPortalsTitle'));
  setText('#journal-portals-help', t('journalPortalsHelp'));
  setTitle('#btn-add-portal', t('addPortalTitle'));
  document.getElementById('btn-add-portal')?.setAttribute('aria-label', t('addPortalTitle'));

  setText('#view-settings .view-header h1', t('settingsTitle'));
  setText('#view-settings .view-header .text-muted', t('settingsSubtitle'));
  setText('#settings-kicker', t('settingsKicker'));
  document.getElementById('settings-trust-summary')?.setAttribute('aria-label', t('settingsTrustSummary'));
  setText('#settings-pill-local', t('settingsLocalFirst'));
  setText('#settings-pill-secrets', t('settingsDeviceSecrets'));
  setText('#settings-pill-sync', t('settingsPreferencesAutosave'));
  setText('#settings-security-eyebrow', t('settingsSecurityEyebrow'));
  setText('#settings-security-title', t('settingsSecurityTitle'));
  setText('#settings-security-help', t('settingsSecurityHelp'));
  setText('#settings-language-eyebrow', t('settingsLanguageEyebrow'));
  setText('#settings-language-title', t('languageCardTitle'));
  setText('#settings-language-help', t('languageHelp'));
  setText('#settings-language-label', t('languageLabel'));
  setText('#settings-theme-label', t('appearanceLabel'));
  setOptionText('#settings-theme', 'system', t('appearanceSystem'));
  setOptionText('#settings-theme', 'light', t('appearanceLight'));
  setOptionText('#settings-theme', 'dark', t('appearanceDark'));
  setText('#settings-language-autosave', t('languageAutoSaved'));
  setText('#settings-routing-eyebrow', t('settingsRoutingEyebrow'));
  setText('#settings-routing-title', t('cloudRoutingTitle'));
  setText('#settings-routing-help', t('storageRoutingHelp'));
  setText('#settings-route-db-label', t('routeDbLabel'));
  setOptionText('#route-db', 'local', t('optionLocalCache'));
  setOptionText('#route-db', 'webdav', t('optionWebDavDrive'));
  setOptionText('#route-db', 'github', t('optionGithubRepo'));
  setText('#settings-auto-sync-label', t('autoCloudSyncLabel'));
  setText('#settings-auto-sync-help', t('autoCloudSyncHelp'));
  setButtonText('#btn-save-mappings', t('saveMappings'));
  setButtonText('#btn-force-sync', t('forceSync'));
  setText('#settings-route-privacy', t('settingsRoutePrivacy'));
  setText('#settings-local-eyebrow', t('settingsLocalEyebrow'));
  setText('#settings-local-title', t('settingsLocalTitle'));
  setText('#settings-local-help', t('settingsLocalHelp'));
  setText('#settings-local-point-account', t('settingsLocalPointAccount'));
  setText('#settings-local-point-sync', t('settingsLocalPointSync'));
  setText('#settings-local-point-backup', t('settingsLocalPointBackup'));
  setText('#settings-webdav-eyebrow', t('settingsProviderEyebrow'));
  setText('#settings-webdav-title', t('webdavTitle'));
  setText('#settings-webdav-help', t('settingsWebdavHelp'));
  setText('#settings-webdav-url-label', t('webdavUrlLabel'));
  setText('#settings-webdav-user-label', t('usernameEmailLabel'));
  setText('#settings-webdav-pass-label', t('appPasswordLabel'));
  setText('#settings-webdav-credential-note', t('settingsCredentialNote'));
  setButtonText('#btn-test-webdav', t('testWebdav'));
  setText('#settings-github-eyebrow', t('settingsProviderEyebrow'));
  setText('#settings-github-title', t('githubTitle'));
  setText('#settings-github-help', t('settingsGithubHelp'));
  setText('#settings-github-pat-label', t('githubPatLabel'));
  setText('#settings-github-repo-label', t('githubRepoLabel'));
  setText('#settings-github-branch-label', t('githubBranchLabel'));
  setText('#settings-github-credential-note', t('settingsGithubCredentialNote'));
  setButtonText('#btn-test-github', t('testGithub'));
  setText('#settings-backup-eyebrow', t('settingsBackupEyebrow'));
  setText('#settings-backup-title', t('backupTitle'));
  setText('#settings-backup-help', t('backupHelp'));
  setText('#settings-backup-note', t('settingsBackupNote'));
  setButtonText('#btn-export-db', t('exportDb'));
  setButtonText('#btn-export-diagnostics', t('exportDiagnostics'));
  setButtonText('#btn-trigger-import', t('importJson'));
  setButtonText('#btn-restore-import-backup', t('restoreImportBackup'));
  setText('#settings-recovery-eyebrow', t('settingsBackupEyebrow'));
  setText('#settings-recovery-title', t('recoveryTitle'));
  setText('#settings-recovery-help', t('recoveryHelp'));
  setText('#btn-refresh-conflicts', t('recoveryRefresh'));
  setText('#settings-recovery-note', t('recoveryListLimit'));
  if (typeof updateSyncRouteNotice === 'function') updateSyncRouteNotice();

  const langSelect = document.getElementById('settings-language') as HTMLSelectElement | null;
  if (langSelect) langSelect.value = currentLanguage;
  const themeSelect = document.getElementById('settings-theme') as HTMLSelectElement | null;
  if (themeSelect) {
    const normalizeTheme = (window as any).normalizeThemePreference || ((v: any) => String(v || 'system'));
    themeSelect.value = normalizeTheme(db?.settings?.profile?.theme);
  }
}

export const defaultTimelineNameKeys: Record<string, string> = {
  'Experiments Started': 'defaultExperimentsStarted',
  '实验开始': 'defaultExperimentsStarted',
  'Experiments Completed': 'defaultExperimentsCompleted',
  '实验完成': 'defaultExperimentsCompleted',
  'Data Organization': 'defaultDataOrganization',
  '数据整理': 'defaultDataOrganization',
  'Draft Completed': 'defaultDraftCompleted',
  '初稿完成': 'defaultDraftCompleted',
  'Manuscript Submitted': 'defaultManuscriptSubmitted',
  '手稿已投稿': 'defaultManuscriptSubmitted',
  'Review Comments R1': 'defaultReviewCommentsR1',
  'R1 审稿意见': 'defaultReviewCommentsR1',
  'R1 Revision Submitted': 'defaultR1RevisionSubmitted',
  'R1 修改稿已提交': 'defaultR1RevisionSubmitted',
  'Review Comments R2': 'defaultReviewCommentsR2',
  'R2 审稿意见': 'defaultReviewCommentsR2',
  'R2 Revision Submitted': 'defaultR2RevisionSubmitted',
  'R2 修改稿已提交': 'defaultR2RevisionSubmitted',
  'Accepted': 'defaultAccepted',
  '已接收': 'defaultAccepted',
  'Online Publication': 'defaultOnlinePublication',
  '网络见刊': 'defaultOnlinePublication',
  'Online': 'defaultOnlinePublication',
  'Rejected': 'statusRejected',
  '已拒稿': 'statusRejected',
  'Proof': 'defaultProof',
  '校样': 'defaultProof'
};

export function getTimelineNodeDisplayName(node: any): string {
  if (!node?.name) return t('untitledEvent');
  const translationKey = defaultTimelineNameKeys[node.name];
  return translationKey ? t(translationKey) : node.name;
}

export const submissionComplianceChecklistPresets = [
  {
    key: 'cover_letter',
    legacyLabels: ['Cover Letter', '投稿信 (Cover Letter)'],
    label: () => currentLanguage === 'zh' ? '投稿信 (Cover Letter)' : 'Cover Letter'
  },
  {
    key: 'highlights',
    legacyLabels: ['Highlights / Novelty', '研究亮点 / 创新点'],
    label: () => currentLanguage === 'zh' ? '研究亮点 / 创新点' : 'Highlights / Novelty'
  },
  {
    key: 'graphical_abstract',
    legacyLabels: ['Graphical Abstract (TOC)', '图文摘要 (TOC)'],
    label: () => currentLanguage === 'zh' ? '图文摘要 (TOC)' : 'Graphical Abstract (TOC)'
  },
  {
    key: 'suggested_reviewers',
    legacyLabels: ['Suggested Reviewers (3-5)', '推荐审稿人 (3-5位)'],
    label: () => currentLanguage === 'zh' ? '推荐审稿人 (3-5位)' : 'Suggested Reviewers (3-5)'
  },
  {
    key: 'declaration_of_interests',
    legacyLabels: ['Declaration of Interests', '利益冲突声明'],
    label: () => currentLanguage === 'zh' ? '利益冲突声明' : 'Declaration of Interests'
  },
  {
    key: 'author_approvals',
    legacyLabels: ['All Co-author Approvals', '全部合作者确认'],
    label: () => currentLanguage === 'zh' ? '全部合作者确认' : 'All Co-author Approvals'
  },
  {
    key: 'high_res_figures',
    legacyLabels: ['High-Res Figures Ready', '高分辨率图片就绪'],
    label: () => currentLanguage === 'zh' ? '高分辨率图片就绪' : 'High-Res Figures Ready'
  },
  {
    key: 'data_availability',
    legacyLabels: ['Data Availability Statement', '数据可用性声明'],
    label: () => currentLanguage === 'zh' ? '数据可用性声明' : 'Data Availability Statement'
  }
];
