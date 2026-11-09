import {
  focusSubmissionEditCenter,
  setupSubmissionAutoSave,
} from './autosave-and-editor';
import {
  renderSubmissionChecklistEditor,
  renderSubmissionReviewMatrixEditor,
  renderSubmissionReviewPreview,
  getSubmissionChecklistKeys,
} from './checklist-and-matrix';
import { openLinkSubmissionModal, renderSubmissions } from './list-and-portals';
import { openAcademicRebuttalExportModal } from './rebuttal-export-modal';
import { openTransferSubmissionModal } from './modals-and-creation';

declare var db: any;
declare var selectedSubmissionId: any;
declare var submissionAutoSaveCleanup: any;
declare const currentLanguage: string;
declare const RF_OPTIONS_RENDER_VERSION: string;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function t(key: string): string;
declare function tf(key: string, vars?: Record<string, any>): string;
declare function getSubmissionStatusLabel(status: string): string;
declare function normalizeSubmissionStatus(status: string): string;
declare function markSubmissionRejected(sub: any, rejectionDate: string, reasonNote?: string): void;
declare function todayString(): string;
declare function normalizeSubmissionTimeline(sub: any): any[];
declare function syncManuscriptStatusFromSubmission(sub: any, database?: any): any;
declare function syncManuscriptStatusesFromSubmissions(database?: any): void;
declare function analyzeSubmission(sub: any): any;
declare function normalizeDateString(val: any): string;
declare function getSubmissionJournalName(sub: any): string;
declare function getSubmissionFirstAuthor(sub: any, man?: any): string;
declare function getSubmissionDoi(sub: any): string;
declare function getSubmissionArticleUrl(sub: any): string;
declare function getSubmissionCycleTime(sub: any): any;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;

export function renderSubmissionDetails(sub: any): void {
  const w = window as any;
  submissionAutoSaveCleanup?.();
  sub.status = normalizeSubmissionStatus(sub.status);
  normalizeSubmissionTimeline(sub);
  const detailPanel = document.getElementById('submission-detail-panel');
  if (!detailPanel) return;

  const man = (db.manuscripts || []).find((m: any) => m.id === sub.manuscriptId);
  const project = (db.projects || []).find((item: any) => item.id === (sub.projectId || man?.projectId)) || null;
  const relationship = w.RFUI.buildSubmissionRelationshipSummary({
    submission: sub,
    manuscript: man,
    project,
    records: db.researchRecords || [],
  });

  const manuscriptTitle = man ? man.title : (sub.title || t('untitledManuscript'));
  const manAbstract = man ? man.abstract || '' : '';
  const firstAuthor = getSubmissionFirstAuthor(sub, man);
  const journalName = getSubmissionJournalName(sub);
  const submissionJournalUrl = sub.journalUrl || sub.submissionUrl || '';
  const submissionDoi = getSubmissionDoi(sub);
  const articleUrl = getSubmissionArticleUrl(sub);
  const timelineAnalysis = analyzeSubmission(sub);
  const timelineSubmissionDate = normalizeDateString(sub.submissionDate || timelineAnalysis.submitDate);
  const timelineFirstDecisionDate = normalizeDateString(sub.firstDecisionDate || timelineAnalysis.r1Date);
  const timelineRevisionDueDate = normalizeDateString(sub.revisionDueDate);
  const timelineDecisionDate = normalizeDateString(sub.decisionDate || timelineAnalysis.acceptDate || timelineAnalysis.onlineDate);
  const statusText = getSubmissionStatusLabel(sub.status || 'submitted');
  const statusBadgeClass = w.RFUI.getSubmissionStatusBadgeClass(sub.status || 'submitted');

  const cycle = getSubmissionCycleTime(sub);
  const cycleTimeHtml = buildCycleTimeCardHtml(cycle);
  const countdownPillHtml = buildCountdownPillHtml(sub);

  w.RFUI.setHTML(detailPanel, `
    <div class="submission-detail-hero">
      <div class="submission-detail-heading">
        <span class="submission-detail-kicker">${escapeHTML(t('submissionDetailKicker'))}</span>
        <h2>${escapeHTML(journalName)}</h2>
        ${sub.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:11px; font-weight:600; width:fit-content; margin-top:3px;">ID: ${escapeHTML(sub.externalManuscriptId)}</span>` : ''}
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <button type="button" class="btn-secondary btn-icon submission-share-button" id="btn-share-sub-journey" title="${escapeHTML(t('shareJourney'))}">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>
        </button>
        <button class="btn-danger btn-icon submission-delete-button" id="btn-delete-sub" title="${escapeHTML(t('deleteSubmissionTitle'))}">
          <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>
    <div class="submission-detail-meta" style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
      <span class="${statusBadgeClass}" data-submission-status-badge="stage">${escapeHTML(t('currentStageLabel'))}: ${escapeHTML(statusText)}</span>
      ${countdownPillHtml}
      <span class="recent-item-date">${escapeHTML(t('trackedSinceLabel'))}: ${sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : t('noDate')}</span>
    </div>
    ${buildWorkflowContextCardHtml(relationship)}
    ${buildEditorPanelHtml({ sub, man, manuscriptTitle, firstAuthor, journalName, submissionJournalUrl, submissionDoi, articleUrl, statusText, statusBadgeClass, timelineSubmissionDate, timelineFirstDecisionDate, timelineRevisionDueDate, timelineDecisionDate, timelineAnalysis })}
    <div class="glass-card submission-action-card" style="margin-top: 12px;">
      <div class="submission-action-copy">
        <span class="submission-action-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 12h14"/><path d="m12 6 6 6-6 6"/><path d="M4 5v14"/></svg></span>
        <div><h3>${t('transferToJournal')}</h3><p>${escapeHTML(t('transferRoundHelp'))}</p></div>
      </div>
      <div class="submission-action-buttons">
        <button class="btn-secondary" id="btn-mark-sub-rejected"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/></svg><span>${t('markRejected')}</span></button>
        <button class="btn-primary" id="btn-transfer-submission"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11v11"/><path d="M18 7 6 19"/></svg><span>${t('transferToJournal')}</span></button>
      </div>
    </div>
    ${cycleTimeHtml}
    <div class="glass-card submission-work-card submission-readonly-review-card" style="margin-top: 16px;">
      <div class="submission-work-head">
        <div class="submission-work-title">
          <span class="submission-work-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg></span>
          <div><h3>${escapeHTML(t('savedReviewPreviewTitle'))}</h3><p>${escapeHTML(t('savedReviewPreviewHelp'))}</p></div>
        </div>
        <div class="submission-work-actions">
          ${man?.zoteroItemKey ? `<button class="btn-secondary submission-work-button" id="btn-sync-submission-to-zotero" title="${escapeHTML(currentLanguage === 'zh' ? '同步审稿回复与修回矩阵至 Zotero 笔记' : 'Sync Review & Rebuttal Matrix to Zotero Note')}"><svg class="svg-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg><span>${escapeHTML(currentLanguage === 'zh' ? '同步至 Zotero 笔记' : 'Sync to Zotero Note')}</span></button>` : ''}
          <button class="btn-secondary submission-work-button" id="btn-export-rebuttal-table"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>${escapeHTML(t('exportTable'))}</span></button>
        </div>
      </div>
      <div class="submission-review-preview" id="submission-review-preview"></div>
    </div>
  `);

  detailPanel.dataset.rfRenderVersion = (typeof RF_OPTIONS_RENDER_VERSION !== 'undefined') ? RF_OPTIONS_RENDER_VERSION : '16.3.1';
  detailPanel.dataset.rfEditorMounted = 'true';
  detailPanel.dataset.currentSubmissionId = sub.id;
  detailPanel.scrollTop = 0;

  bindSubmissionDetailListeners(sub, man);
  const checklistKeys = getSubmissionChecklistKeys(sub);
  renderSubmissionChecklistEditor(sub, checklistKeys);
  renderSubmissionReviewMatrixEditor(sub, manAbstract);
  renderSubmissionReviewPreview(sub, checklistKeys);
  setupSubmissionAutoSave(sub);
}

function buildCountdownPillHtml(sub: any): string {
  const w = window as any;
  if (!sub.revisionDueDate) return '';
  const cd = w.RFCalendar?.getRevisionCountdownMeta ? w.RFCalendar.getRevisionCountdownMeta(sub.revisionDueDate) : null;
  if (!cd) return '';
  return `
    <span class="${escapeHTML(cd.badgeClass)}" id="btn-export-submission-ics" style="display:inline-flex; align-items:center; gap:5px; font-weight:600; cursor:pointer; padding:2px 8px; border-radius:4px;" title="${escapeHTML(currentLanguage === 'zh' ? '点击导出修回截止日历提醒 (.ics)' : 'Click to export revision deadline (.ics)')}">
      <span>${escapeHTML(cd.icon)} ${escapeHTML(cd.text)}</span>
      <span style="font-size:10px; opacity:0.85; text-decoration:underline;">📅 .ics</span>
    </span>
  `;
}

function buildCycleTimeCardHtml(cycle: any): string {
  const cardClass = cycle.isCompleted ? 'submission-cycle-card-complete' : 'submission-cycle-card-active';
  const icon = cycle.isCompleted
    ? '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>'
    : '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';
  const label = t(cycle.isCompleted ? 'cycleTimeCompleted' : 'submissionCycleTracking');
  const text = cycle.isCompleted
    ? tf('cycleTimeCompletedText', { start: `<strong>${escapeHTML(cycle.startDateStr)}</strong>`, end: `<strong>${escapeHTML(cycle.endDateStr)}</strong>`, days: `<strong>${cycle.days}</strong>` })
    : tf('submissionCycleText', { start: `<strong>${escapeHTML(cycle.startDateStr)}</strong>`, days: `<strong>${cycle.days}</strong>` });
  return `
    <div class="submission-cycle-card ${cardClass}" data-submission-cycle-card>
      <span class="submission-cycle-icon" aria-hidden="true">${icon}</span>
      <div class="submission-cycle-copy"><span class="submission-cycle-label" data-submission-cycle-label>${escapeHTML(label)}</span><span data-submission-cycle-text>${text}</span></div>
    </div>
  `;
}

function buildWorkflowContextCardHtml(relationship: any): string {
  return `
    <div class="glass-card workflow-context-card" data-submission-workflow-context="true">
      <div class="workflow-context-head">
        <div class="submission-work-title">
          <span class="submission-work-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M5 8h14"/><path d="M5 16h14"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/></svg></span>
          <div><h3>${escapeHTML(t('workflowContextTitle'))}</h3></div>
        </div>
        <div class="workflow-context-actions">
          ${relationship.isOrphanSubmission ? `<span class="badge badge-warning">${escapeHTML(t('workflowNeedsLinking'))}</span><button type="button" class="btn-secondary workflow-link-button" id="btn-link-submission-manuscript">${escapeHTML(t('linkManuscript'))}</button>` : `<span class="badge badge-success">${escapeHTML(t('workflowLinkedFlow'))}</span>`}
          <button type="button" class="btn-secondary workflow-edit-summary-button" id="btn-focus-edit-center" aria-controls="submission-entry-editor-panel"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg><span>${escapeHTML(t('jumpToEditor'))}</span></button>
        </div>
      </div>
      <div class="workflow-context-grid">
        <div class="workflow-context-item"><span>${escapeHTML(t('workflowManuscriptLabel'))}</span><strong>${escapeHTML(relationship.manuscriptTitle)}</strong></div>
        <div class="workflow-context-item"><span>${escapeHTML(t('workflowTimelineLabel'))}</span><strong>${relationship.completedTimelineNodeCount}/${relationship.timelineNodeCount}</strong></div>
        <div class="workflow-context-item"><span>${escapeHTML(t('workflowReviewerCommentsLabel'))}</span><strong>${relationship.reviewerCommentCount}</strong></div>
      </div>
    </div>
  `;
}

function buildEditorPanelHtml(d: any): string {
  return `
    <div class="glass-card submission-edit-center submission-entry-editor-card" id="submission-entry-editor-panel" data-side-entry-editor="true">
      <div class="submission-edit-center-head">
        <div class="submission-edit-title-row">
          <span class="submission-edit-emblem" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="18" x2="13" y2="18"/></svg></span>
          <div><h3>${escapeHTML(t('submissionEntryEditorTitle'))}</h3><p>${escapeHTML(t('submissionEntryEditorHelp'))}</p></div>
        </div>
        <div class="submission-edit-badges">
          <span class="badge badge-purple">${escapeHTML(d.man ? t('linkedManuscriptBadge') : t('detachedSubmissionBadge'))}</span>
          <span class="${d.statusBadgeClass}" data-submission-status-badge="editor">${escapeHTML(d.statusText)}</span>
          ${d.articleUrl ? `<a class="doi-link" href="${escapeHTML(d.articleUrl)}" target="_blank" rel="noopener noreferrer">${t('articlePage')}</a>` : ''}
          ${d.man?.zoteroItemKey ? `
            <span class="zotero-card-badge" id="sub-detail-zotero-badge" data-item-key="${escapeHTML(d.man.zoteroItemKey)}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 文献库中选中此条目' : 'Select in Zotero library')}"><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>Zotero</span>
            ${d.man.citekey ? `<span class="zotero-citekey-badge" id="sub-detail-citekey-badge" data-citekey="${escapeHTML(d.man.citekey)}" title="${escapeHTML(currentLanguage === 'zh' ? '点击复制 Citation Key' : 'Click to copy Citation Key')}">[@${escapeHTML(d.man.citekey)}]</span>` : ''}
            ${d.man.pdfUri ? `<span class="zotero-pdf-badge" id="sub-detail-pdf-badge" data-item-key="${escapeHTML(d.man.zoteroItemKey)}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 阅读器中打开 PDF' : 'Open PDF in Zotero reader')}">📖 PDF</span>` : ''}
          ` : ''}
        </div>
      </div>
      <div class="submission-edit-section">
        <div class="submission-edit-section-head"><span class="submission-edit-section-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span><span>${escapeHTML(t('manuscriptSection'))}</span></div>
        <div class="submission-edit-grid submission-edit-grid-identity">
          <div class="form-group submission-edit-title-field"><label>${escapeHTML(t('manuscriptTitleLabel'))}</label><input type="text" id="sub-edit-title" value="${escapeHTML(d.manuscriptTitle)}" placeholder="${escapeHTML(t('paperTitlePlaceholder'))}"></div>
          <div class="form-group"><label>${t('targetJournalInput')}</label><input type="text" id="sub-edit-journal" value="${escapeHTML(d.journalName)}" placeholder="${escapeHTML(t('targetJournalInput'))}"></div>
          <div class="form-group"><label>${escapeHTML(t('externalManuscriptIdLabel') || '稿件编号 (Manuscript ID)')}</label><input type="text" id="sub-edit-external-id" value="${escapeHTML(d.sub.externalManuscriptId || '')}" placeholder="${escapeHTML(t('externalManuscriptIdPlaceholder') || '例如: AFM-2026-08123')}"></div>
          <div class="form-group"><label>${escapeHTML(t('submissionPortalUrl'))}</label><input type="url" id="sub-edit-journal-url" value="${escapeHTML(d.submissionJournalUrl)}" placeholder="https://..."></div>
          <div class="form-group"><label>${t('status')}</label><select id="sub-edit-status">
            <option value="submitted" ${d.sub.status === 'submitted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('submitted'))}</option>
            <option value="under_review" ${d.sub.status === 'under_review' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('under_review'))}</option>
            <option value="revision" ${d.sub.status === 'revision' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('revision'))}</option>
            <option value="accepted" ${d.sub.status === 'accepted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('accepted'))}</option>
            <option value="published" ${d.sub.status === 'published' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('published'))}</option>
            <option value="rejected" ${d.sub.status === 'rejected' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('rejected'))}</option>
          </select></div>
        </div>
        <details class="submission-author-details"><summary>${escapeHTML(t('firstAuthorLabel'))}</summary>
          <div class="submission-first-author-module"><div class="submission-first-author-identity"><span class="submission-first-author-index" aria-hidden="true">1</span><div><label for="sub-edit-first-author">${escapeHTML(t('firstAuthorLabel'))}</label><small>${escapeHTML(t('firstAuthorHelp'))}</small></div></div><input type="text" id="sub-edit-first-author" value="${escapeHTML(d.firstAuthor)}" placeholder="${escapeHTML(t('firstAuthorPlaceholder'))}"></div>
        </details>
      </div>
      <div class="submission-edit-section">
        <div class="submission-edit-section-head"><span class="submission-edit-section-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span><span>${escapeHTML(t('reviewTimingSection'))}</span></div>
        <div class="submission-edit-grid submission-edit-grid-dates">
          <div class="form-group"><label>${t('initialSubmissionDate')}</label><input type="date" id="sub-edit-submission-date" value="${escapeHTML(d.timelineSubmissionDate)}"></div>
          <div class="form-group"><label>${t('firstDecisionDate')}</label><input type="date" id="sub-edit-r1-date" value="${escapeHTML(d.timelineFirstDecisionDate)}"></div>
          <div class="form-group"><div style="display:flex; justify-content:space-between; align-items:center;"><label for="sub-edit-revision-due">${t('revisionDueDateLabel')}</label>${d.timelineRevisionDueDate ? `<button type="button" class="btn-secondary" id="btn-editor-due-ics" style="font-size:11px; padding:1px 6px; border-radius:3px; height:20px;" title="${escapeHTML(t('exportCalendarIcs') || '导出修回日历 (.ics)')}">📅 .ics</button>` : ''}</div><input type="date" id="sub-edit-revision-due" value="${escapeHTML(d.timelineRevisionDueDate)}"></div>
          <div class="form-group"><label>${t('completionDate')} / ${t('stateAccepted')}</label><input type="date" id="sub-edit-decision-date" value="${escapeHTML(d.timelineDecisionDate)}"></div>
        </div>
      </div>
      <div class="submission-edit-section">
        <div class="submission-edit-section-head"><span class="submission-edit-section-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.43"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.33-1.33"/></svg></span><span>${escapeHTML(t('publicationSection'))}</span></div>
        <div class="submission-edit-grid submission-edit-grid-publication">
          <div class="form-group"><label>${t('doiLabel')}</label><input type="text" id="sub-edit-doi" value="${escapeHTML(d.submissionDoi)}" placeholder="10.1002/adfm.202528029"></div>
          <div class="form-group"><label>${t('articleUrlLabel')}</label><input type="url" id="sub-edit-article-url" value="${escapeHTML(d.articleUrl)}" placeholder="${t('articleUrlPlaceholder')}"></div>
        </div>
      </div>
      <div class="submission-edit-section submission-edit-checklist-section">
        <div class="submission-edit-section-head submission-edit-section-head-row"><div class="submission-edit-section-title"><span class="submission-edit-section-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span><span>${escapeHTML(t('submissionChecklistSection'))}</span></div></div>
        <div class="submission-checklist-grid submission-edit-checklist-grid" id="sub-edit-compliance-checklist-container"></div>
      </div>
      <div class="submission-edit-section submission-edit-review-section">
        <div class="submission-edit-section-head submission-edit-section-head-row">
          <div class="submission-section-title-group"><div class="submission-edit-section-title"><span class="submission-edit-section-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg></span><span>${escapeHTML(t('peerReviewMatrixSection') || '同行评审回复矩阵')}</span></div><div class="submission-edit-review-help">${escapeHTML(t('reviewEditorHelp') || '审稿意见和作者回复会在填写时自动保存。')}</div></div>
          <div class="submission-section-actions">
            <button type="button" class="btn-secondary submission-work-button" id="btn-batch-import-reviews"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg><span>${escapeHTML(t('smartBatchImport') || '智能批量导入')}</span></button>
            <button type="button" class="btn-primary submission-work-button" id="btn-add-review-comment"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>${escapeHTML(t('addComment') || '添加审稿意见')}</span></button>
          </div>
        </div>
        <div id="sub-edit-rebuttal-progress-container"></div>
        <div class="submission-edit-review-container" id="sub-edit-review-matrix-container"></div>
      </div>
      <div class="submission-edit-savebar">
        <p>${escapeHTML(t('timelineDateSource'))}: ${escapeHTML(d.timelineAnalysis.submitDateSource)}. ${escapeHTML(t('publicationLinksKept'))}</p>
        <div class="submission-autosave-status" data-submission-autosave-status data-state="saved" role="status" aria-live="polite"><span class="submission-autosave-dot" aria-hidden="true"></span><span data-submission-autosave-label>${escapeHTML(t('autoSaveSaved'))}</span></div>
      </div>
    </div>
  `;
}

function bindSubmissionDetailListeners(sub: any, man: any): void {
  const w = window as any;
  const journalName = getSubmissionJournalName(sub);
  document.getElementById('btn-link-submission-manuscript')?.addEventListener('click', () => openLinkSubmissionModal(sub));
  document.getElementById('btn-focus-edit-center')?.addEventListener('click', (e) => { e.preventDefault(); focusSubmissionEditCenter(); });
  document.getElementById('btn-mark-sub-rejected')?.addEventListener('click', async () => {
    if (!confirm(t('confirmMarkRejected'))) return;
    markSubmissionRejected(sub, todayString());
    syncManuscriptStatusFromSubmission(sub);
    await w.storage.saveAll(db);
    renderDashboard();
    renderKanban();
    renderSubmissions();
    renderSubmissionDetails(sub);
    showGlobalToast(t('rejectedToast'), 'success');
  });
  document.getElementById('btn-share-sub-journey')?.addEventListener('click', (e: any) => {
    e.stopPropagation();
    const shareFn = (w as any).openSubmissionSharePreview || (w as any).openSubmissionShareModal;
    if (typeof shareFn === 'function') shareFn(sub.id, e.currentTarget);
  });
  document.getElementById('btn-transfer-submission')?.addEventListener('click', () => openTransferSubmissionModal(sub));
  document.getElementById('btn-delete-sub')?.addEventListener('click', async () => {
    if (confirm(t('confirmDeleteSubmission'))) {
      w.storage.recordEntityDeletion(db, 'submissions', sub.id);
      syncManuscriptStatusesFromSubmissions(db);
      selectedSubmissionId = null;
      await w.storage.saveAll(db);
      renderDashboard();
      renderKanban();
      renderSubmissions();
      w.RFUI.setHTML(document.getElementById('submission-detail-panel'), `
        <div class="empty-state"><svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg><h3>${escapeHTML(t('submissionEmptyDetail'))}</h3></div>
      `);
    }
  });

  document.getElementById('btn-sync-submission-to-zotero')?.addEventListener('click', async () => {
    if (typeof ZoteroBridge !== 'undefined' && man?.zoteroItemKey) {
      const btn = document.getElementById('btn-sync-submission-to-zotero') as HTMLButtonElement | null;
      if (btn) btn.disabled = true;
      try {
        const ok = await ZoteroBridge.syncNote(man.zoteroItemKey, man.zoteroLibraryID);
        showGlobalToast(ok ? (currentLanguage === 'zh' ? '已成功同步审稿记录与修回矩阵至 Zotero 笔记' : 'Successfully synced review & rebuttal matrix to Zotero note') : (currentLanguage === 'zh' ? '同步至 Zotero 笔记失败' : 'Failed to sync to Zotero note'), ok ? 'success' : 'error');
      } catch (e: any) { showGlobalToast(String(e.message || e), 'error'); }
      setTimeout(() => { if (btn) btn.disabled = false; }, 1200);
    }
  });

  const detailPanel = document.getElementById('submission-detail-panel');
  detailPanel?.querySelector('#sub-detail-zotero-badge')?.addEventListener('click', () => { if (man?.zoteroItemKey && typeof ZoteroBridge !== 'undefined') ZoteroBridge.selectItemInZotero(man.zoteroItemKey, man.zoteroLibraryID); });
  detailPanel?.querySelector('#sub-detail-citekey-badge')?.addEventListener('click', () => { if (man?.citekey && typeof ZoteroBridge !== 'undefined') ZoteroBridge.copyText(`[@${man.citekey}]`, currentLanguage === 'zh' ? `已复制 Citation Key: [@${man.citekey}]` : `Copied Citation Key: [@${man.citekey}]`); });
  detailPanel?.querySelector('#sub-detail-pdf-badge')?.addEventListener('click', () => { if (man?.zoteroItemKey && typeof ZoteroBridge !== 'undefined') ZoteroBridge.openPdf(man.zoteroItemKey, null, man.zoteroLibraryID); });

  const triggerSubIcs = () => {
    if (!sub.revisionDueDate) { showGlobalToast(currentLanguage === 'zh' ? '请先设置修回截止日期' : 'Please set revision due date first', 'warning'); return; }
    if (w.RFCalendar?.generateSubmissionCalendarFeed && w.RFCalendar?.triggerCalendarDownload) {
      const feed = w.RFCalendar.generateSubmissionCalendarFeed([sub], db.manuscripts, { calName: `${journalName} Revision Deadline` });
      w.RFCalendar.triggerCalendarDownload(feed, `revision_deadline_${sub.id}.ics`);
      showGlobalToast(t('calendarExportedToast') || (currentLanguage === 'zh' ? '修回截止日历 (.ics) 已导出！' : 'Revision deadline calendar (.ics) exported.'), 'success');
    }
  };
  detailPanel?.querySelector('#btn-export-submission-ics')?.addEventListener('click', triggerSubIcs);
  detailPanel?.querySelector('#btn-editor-due-ics')?.addEventListener('click', triggerSubIcs);
  document.getElementById('btn-export-rebuttal-table')?.addEventListener('click', () => openAcademicRebuttalExportModal(sub, man));
}
