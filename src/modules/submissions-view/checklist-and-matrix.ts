declare const t: (key: string) => string;
declare const tf: (key: string, vars?: Record<string, any>) => string;
declare const escapeHTML: (str: any) => string;
declare const RFReviewMatrix: any;

export function getDefaultSubmissionChecklistKeys(): Array<{ key: string; label: string }> {
  return [
    { key: 'cover_letter_ready', label: 'Cover Letter drafted' },
    { key: 'title_page_ready', label: 'Title page formatted' },
    { key: 'data_availability_statement', label: 'Data Availability statement' },
    { key: 'author_contribution', label: 'CRedIT Author statements' },
    { key: 'figure_resolution_checked', label: 'High-res figures checked' },
    { key: 'conflict_of_interest', label: 'Conflict of Interest statement' },
  ];
}

export function getSubmissionChecklistKeys(sub: any): Array<{ key: string; label: string }> {
  return Array.isArray(sub?.complianceChecklistKeys) && sub.complianceChecklistKeys.length > 0
    ? sub.complianceChecklistKeys
    : getDefaultSubmissionChecklistKeys();
}

export function getSubmissionReviewMatrixRows(sub: any): any[] {
  if (Array.isArray(sub?.reviewMatrix)) return sub.reviewMatrix;
  if (Array.isArray(sub?.rebuttalMatrix)) return sub.rebuttalMatrix;
  return [];
}

export function collectSubmissionChecklistFromEditor(): Record<string, boolean> {
  const compliance: Record<string, boolean> = {};
  document.querySelectorAll('#sub-edit-compliance-checklist-container [data-checklist-key]').forEach((input: any) => {
    compliance[input.dataset.checklistKey] = input.checked;
  });
  return compliance;
}

export function collectSubmissionChecklistKeysFromEditor(): Array<{ key: string; label: string }> {
  return Array.from(document.querySelectorAll('#sub-edit-compliance-checklist-container [data-checklist-key]')).map((input: any) => ({
    key: input.dataset.checklistKey,
    label: input.dataset.checklistLabel || input.dataset.checklistKey,
  }));
}

export function collectSubmissionReviewMatrixFromEditor(): any[] {
  if (typeof RFReviewMatrix !== 'undefined' && RFReviewMatrix.collectSubmissionReviewMatrixFromEditor) {
    return RFReviewMatrix.collectSubmissionReviewMatrixFromEditor();
  }
  return [];
}

export function createSubmissionReviewEditorRow(row: any = {}, index = 0): HTMLElement {
  if (typeof RFReviewMatrix !== 'undefined' && RFReviewMatrix.createSubmissionReviewEditorRow) {
    return RFReviewMatrix.createSubmissionReviewEditorRow(row, index);
  }
  return document.createElement('div');
}

export function reindexSubmissionReviewEditorRows(container: HTMLElement | null): void {
  if (typeof RFReviewMatrix !== 'undefined' && RFReviewMatrix.reindexSubmissionReviewEditorRows) {
    return RFReviewMatrix.reindexSubmissionReviewEditorRows(container);
  }
}

export function renderSubmissionChecklistEditor(sub: any, checklistKeys: any[]): void {
  if (typeof RFReviewMatrix !== 'undefined' && RFReviewMatrix.renderSubmissionChecklistEditor) {
    return RFReviewMatrix.renderSubmissionChecklistEditor(sub, checklistKeys);
  }
}

export function renderSubmissionReviewMatrixEditor(sub: any, manAbstract?: string): void {
  if (typeof RFReviewMatrix !== 'undefined' && RFReviewMatrix.renderSubmissionReviewMatrixEditor) {
    return RFReviewMatrix.renderSubmissionReviewMatrixEditor(sub, manAbstract);
  }
}

export function renderSubmissionReviewPreview(sub: any, checklistKeys: any[]): void {
  const w = window as any;
  const previewBox = document.getElementById('submission-review-preview');
  if (!previewBox) return;
  const compliance = sub.complianceChecklist && typeof sub.complianceChecklist === 'object' && !Array.isArray(sub.complianceChecklist)
    ? sub.complianceChecklist
    : {};
  const completedChecks = checklistKeys.filter((chk) => compliance[chk.key] === true).length;
  const reviewRows = getSubmissionReviewMatrixRows(sub);
  const reviewPreview = reviewRows.length
    ? reviewRows.map((row: any, index: number) => {
        const reviewerTag = row.reviewer ? `<span class="badge badge-purple" style="font-size:10px; margin-left:6px; font-weight:normal;">${escapeHTML(row.reviewer)}</span>` : '';
        const statusVal = row.status || (row.response?.trim() ? 'addressed' : 'pending');
        let statusBadge = `<span class="badge badge-secondary" style="font-size:10px; margin-left:4px;">${escapeHTML(t('statusPending') || '待处理')}</span>`;
        if (statusVal === 'addressed') statusBadge = `<span class="badge badge-success" style="font-size:10px; margin-left:4px;">${escapeHTML(t('statusAddressed') || '已解决')}</span>`;
        else if (statusVal === 'in_progress') statusBadge = `<span class="badge badge-warning" style="font-size:10px; margin-left:4px;">${escapeHTML(t('statusInProgress') || '处理中')}</span>`;
        else if (statusVal === 'clarified') statusBadge = `<span class="badge badge-info" style="font-size:10px; margin-left:4px;">${escapeHTML(t('statusClarified') || '辩明')}</span>`;

        const changesNote = row.changes ? `<div style="font-size:11px; color:var(--accent-blue, #0284c7); margin-top:3px; background:rgba(2,132,199,0.06); padding:2px 6px; border-radius:3px;">📝 ${escapeHTML(row.changes)}</div>` : '';
        return `
        <div class="submission-review-preview-row">
          <strong>${escapeHTML(tf('reviewerCommentLabel', { count: index + 1 }))}${reviewerTag}${statusBadge}</strong>
          <p>${escapeHTML(row.comment || t('noCommentText'))}</p>
          <span>${escapeHTML(row.response ? t('responseSaved') : t('responsePending'))}</span>
          ${changesNote}
        </div>`;
      }).join('')
    : `<p class="empty-state">${escapeHTML(t('emptyReviewPreview'))}</p>`;
  const progressHtml = w.RFAcademicExport?.renderRebuttalProgressTracker ? w.RFAcademicExport.renderRebuttalProgressTracker(sub) : '';
  w.RFUI.setHTML(previewBox, `
    ${progressHtml}
    <div class="workflow-context-grid submission-review-preview-grid">
      <div class="workflow-context-item"><span>${escapeHTML(t('checklistLabel'))}</span><strong>${completedChecks}/${checklistKeys.length}</strong></div>
      <div class="workflow-context-item"><span>${escapeHTML(t('workflowReviewerCommentsLabel'))}</span><strong>${reviewRows.length}</strong></div>
      <div class="workflow-context-item"><span>${escapeHTML(t('responsesLabel'))}</span><strong>${reviewRows.filter((row: any) => row.response).length}/${reviewRows.length}</strong></div>
    </div>
    <div class="submission-review-preview-list">${reviewPreview}</div>
  `);
}
