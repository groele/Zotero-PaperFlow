/**
 * Zotero PaperFlow - Peer Review Response Matrix Editor Module
 * Encapsulates the review matrix card architecture, 2-column split editing,
 * comment reordering, batch import delegation, and progress synchronization.
 */

var RFReviewMatrix = (function () {
  function resolveText(key, zhFallback, enFallback) {
    const val = typeof t === 'function' ? t(key) : '';
    if (val && val !== key) return val;
    return (typeof currentLanguage !== 'undefined' && currentLanguage === 'en') ? enFallback : zhFallback;
  }

  function collectSubmissionReviewMatrixFromEditor() {
    return Array.from(document.querySelectorAll('#sub-edit-review-matrix-container .submission-edit-review-row')).map((row, index) => {
      const response = row.querySelector('.sub-edit-review-response')?.value || '';
      const statusSelect = row.querySelector('.sub-edit-review-status');
      const status = statusSelect ? statusSelect.value : (response.trim() ? 'addressed' : 'pending');
      return {
        id: row.dataset.reviewId || `rev_${Date.now()}_${index}`,
        reviewer: row.querySelector('.sub-edit-review-reviewer')?.value?.trim() || '',
        comment: row.querySelector('.sub-edit-review-comment')?.value || '',
        response,
        changes: row.querySelector('.sub-edit-review-changes')?.value?.trim() || '',
        status,
        recordId: row.dataset.recordId || ''
      };
    });
  }

  function createSubmissionReviewEditorRow(row = {}, index = 0) {
    const safeId = String(row.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
    const rowDiv = document.createElement('div');
    rowDiv.className = 'submission-edit-review-row';
    rowDiv.style.cssText = 'display:flex!important;flex-direction:column!important;gap:12px!important;width:100%!important;box-sizing:border-box!important;';
    rowDiv.dataset.reviewId = safeId;
    rowDiv.dataset.recordId = row.recordId || '';
    const reviewerVal = escapeHTML(row.reviewer || '');
    const changesVal = escapeHTML(row.changes || '');
    const statusVal = row.status || (row.response && row.response.trim() ? 'addressed' : 'pending');

    window.RFUI.setHTML(rowDiv, `
      <!-- TIER 1: Full-Width Symmetrical Header -->
      <div class="submission-edit-review-row-header" style="display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;width:100%!important;box-sizing:border-box!important;">
        <div class="review-row-meta-group" style="display:flex!important;align-items:center!important;gap:12px!important;flex-wrap:wrap!important;">
          <div class="review-row-index-badge">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="submission-edit-review-label">${escapeHTML(tf('reviewerCommentLabel', { count: index + 1 }))}</span>
          </div>
          <div class="review-meta-item review-row-reviewer-box" style="display:inline-flex!important;align-items:center!important;gap:6px!important;white-space:nowrap!important;flex-shrink:0!important;">
            <span class="review-field-prefix-label" style="white-space:nowrap!important;flex-shrink:0!important;">${escapeHTML(resolveText('reviewerFieldLabel', '审稿人', 'Reviewer'))}:</span>
            <input type="text" class="sub-edit-review-reviewer" value="${reviewerVal}" placeholder="Reviewer #1...">
          </div>
          <div class="review-meta-item review-row-status-box" style="display:inline-flex!important;align-items:center!important;gap:6px!important;white-space:nowrap!important;flex-shrink:0!important;">
            <span class="review-field-prefix-label" style="white-space:nowrap!important;flex-shrink:0!important;">${escapeHTML(resolveText('statusFieldLabel', '状态', 'Status'))}:</span>
            <select class="sub-edit-review-status" data-status="${statusVal}" aria-label="Status">
              <option value="pending" ${statusVal === 'pending' ? 'selected' : ''}>⭕ ${escapeHTML(resolveText('statusPending', '待处理', 'Pending'))}</option>
              <option value="in_progress" ${statusVal === 'in_progress' ? 'selected' : ''}>⏳ ${escapeHTML(resolveText('statusInProgress', '处理中', 'In Progress'))}</option>
              <option value="addressed" ${statusVal === 'addressed' ? 'selected' : ''}>✔ ${escapeHTML(resolveText('statusAddressed', '已解决', 'Addressed'))}</option>
              <option value="clarified" ${statusVal === 'clarified' ? 'selected' : ''}>💬 ${escapeHTML(resolveText('statusClarified', '辩明 (无改动)', 'Clarified (No Changes)'))}</option>
            </select>
          </div>
        </div>
        <div class="submission-edit-review-actions" style="display:flex!important;gap:6px!important;align-items:center!important;flex-shrink:0!important;">
          <button type="button" class="btn-secondary btn-review-action btn-move-review-up" title="${escapeHTML(resolveText('moveCommentUp', '上移', 'Move Up'))}" aria-label="Move Up">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>
            <span>${escapeHTML(resolveText('moveUpShort', '上移', 'Up'))}</span>
          </button>
          <button type="button" class="btn-secondary btn-review-action btn-move-review-down" title="${escapeHTML(resolveText('moveCommentDown', '下移', 'Move Down'))}" aria-label="Move Down">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            <span>${escapeHTML(resolveText('moveDownShort', '下移', 'Down'))}</span>
          </button>
          <button type="button" class="btn-secondary btn-review-action btn-copy-full-item" title="${escapeHTML(resolveText('copyFullCommentItem', '复制完整问答条目', 'Copy Full Q&A Block'))}" aria-label="Copy Item">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>${escapeHTML(resolveText('copyItemShort', '复制问答', 'Copy Item'))}</span>
          </button>
          <button type="button" class="btn-danger btn-review-action btn-review-delete btn-delete-review-row" title="${escapeHTML(resolveText('removeComment', '删除意见', 'Remove comment'))}" aria-label="Delete">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span>${escapeHTML(resolveText('delete', '删除', 'Delete'))}</span>
          </button>
        </div>
      </div>

      <!-- TIER 2: Two Equal Columns (Reviewer Comment vs Author Response) -->
      <div class="submission-edit-review-body" style="display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:16px!important;width:100%!important;box-sizing:border-box!important;">
        <!-- Left Column: Reviewer Comment -->
        <div class="submission-edit-review-field submission-review-field-comment" style="min-width:0!important;display:flex!important;flex-direction:column!important;gap:6px!important;">
          <div class="submission-review-column-header">
            <div class="review-subhead-title">
              <span class="subhead-indicator comment-indicator"></span>
              <span>${escapeHTML(resolveText('reviewerCommentTitle', '审稿人原始意见', 'Reviewer Comment'))}</span>
            </div>
          </div>
          <textarea class="sub-edit-review-comment" placeholder="${escapeHTML(resolveText('reviewerCommentPlaceholder', '粘贴审稿意见...', 'Paste reviewer comment...'))}">${escapeHTML(row.comment || '')}</textarea>
        </div>

        <!-- Right Column: Author Response -->
        <div class="submission-edit-review-field submission-review-field-response" style="min-width:0!important;display:flex!important;flex-direction:column!important;gap:6px!important;">
          <div class="submission-review-column-header">
            <div class="review-subhead-title">
              <span class="subhead-indicator response-indicator"></span>
              <span>${escapeHTML(resolveText('authorResponseLabel', '作者学术答复', 'Author Response'))}</span>
            </div>
            <button type="button" class="btn-secondary btn-copy-review-response">
              <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>${escapeHTML(resolveText('copy', '复制', 'Copy'))}</span>
            </button>
          </div>
          <textarea class="sub-edit-review-response" placeholder="${escapeHTML(resolveText('authorResponsePlaceholder', '撰写你的专业回复...', 'Draft your professional response...'))}">${escapeHTML(row.response || '')}</textarea>
        </div>
      </div>

      <!-- TIER 3: Full-Width Manuscript Changes & Location Bar -->
      <div class="submission-edit-review-footer" style="display:flex!important;flex-direction:column!important;width:100%!important;box-sizing:border-box!important;">
        <div class="changes-subhead">
          <span class="changes-icon">📝</span>
          <span class="changes-label">${escapeHTML(resolveText('changesFieldLabel', '手稿修订说明与位置 (页码/行号)', 'Changes in Manuscript & Locations'))}</span>
        </div>
        <input type="text" class="sub-edit-review-changes" value="${changesVal}" placeholder="${escapeHTML(resolveText('changesPlaceholder', '例如: Page 4, Lines 120-135; 已补充表 S2', 'e.g. Page 4, Lines 120-135; Supplementary Table S2 added'))}">
      </div>
    `);
    return rowDiv;
  }

  function reindexSubmissionReviewEditorRows(container) {
    container.querySelectorAll('.submission-edit-review-row').forEach((row, index) => {
      const label = row.querySelector('.submission-edit-review-label');
      if (label) label.textContent = tf('reviewerCommentLabel', { count: index + 1 });
    });
  }

  function renderSubmissionChecklistEditor(sub, checklistKeys) {
    const checklistBox = document.getElementById('sub-edit-compliance-checklist-container');
    if (!checklistBox) return;
    const compliance = sub.complianceChecklist && typeof sub.complianceChecklist === 'object' && !Array.isArray(sub.complianceChecklist)
      ? sub.complianceChecklist
      : {};
    window.RFUI.setHTML(checklistBox, '');
    checklistKeys.forEach(chk => {
      const label = document.createElement('label');
      label.className = 'submission-edit-check-item';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = compliance[chk.key] === true;
      input.dataset.checklistKey = chk.key;
      input.dataset.checklistLabel = chk.label;

      label.appendChild(input);
      label.appendChild(document.createTextNode(chk.label));
      checklistBox.appendChild(label);
    });
  }

  function renderSubmissionReviewMatrixEditor(sub, manAbstract) {
    const reviewBox = document.getElementById('sub-edit-review-matrix-container');
    const addButton = document.getElementById('btn-add-review-comment');
    const batchImportBtn = document.getElementById('btn-batch-import-reviews');
    const progressBox = document.getElementById('sub-edit-rebuttal-progress-container');
    if (!reviewBox) return;

    const updateProgress = () => {
      if (progressBox && typeof renderRebuttalProgressTracker === 'function') {
        const currentRows = collectSubmissionReviewMatrixFromEditor();
        window.RFUI.setHTML(progressBox, renderRebuttalProgressTracker({ reviewMatrix: currentRows }));
      }
    };

    const rows = (typeof getSubmissionReviewMatrixRows === 'function')
      ? getSubmissionReviewMatrixRows(sub)
      : (Array.isArray(sub.reviewMatrix) ? sub.reviewMatrix : []);

    window.RFUI.setHTML(reviewBox, '');
    if (rows.length === 0) {
      window.RFUI.setHTML(reviewBox, `<p class="empty-state">${escapeHTML(t('emptyReviewEditor'))}</p>`);
    } else {
      rows.forEach((row, index) => {
        reviewBox.appendChild(createSubmissionReviewEditorRow(row, index));
      });
    }
    updateProgress();

    if (batchImportBtn) {
      batchImportBtn.onclick = () => {
        if (typeof openBatchReviewImportModal === 'function') {
          openBatchReviewImportModal(sub, reviewBox, updateProgress);
        }
      };
    }

    if (addButton) {
      addButton.onclick = () => {
        const empty = reviewBox.querySelector('.empty-state');
        if (empty) window.RFUI.setHTML(reviewBox, '');
        reviewBox.appendChild(createSubmissionReviewEditorRow({ comment: '', response: '', recordId: '' }, reviewBox.querySelectorAll('.submission-edit-review-row').length));
        updateProgress();
        reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', {
          bubbles: true,
          detail: { immediate: true }
        }));
      };
    }

    reviewBox.addEventListener('click', async event => {
      const upBtn = event.target.closest('.btn-move-review-up');
      if (upBtn) {
        const row = upBtn.closest('.submission-edit-review-row');
        const prev = row?.previousElementSibling;
        if (prev && prev.classList.contains('submission-edit-review-row')) {
          reviewBox.insertBefore(row, prev);
          reindexSubmissionReviewEditorRows(reviewBox);
          updateProgress();
          reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', { bubbles: true, detail: { immediate: true } }));
        }
        return;
      }

      const downBtn = event.target.closest('.btn-move-review-down');
      if (downBtn) {
        const row = downBtn.closest('.submission-edit-review-row');
        const next = row?.nextElementSibling;
        if (next && next.classList.contains('submission-edit-review-row')) {
          reviewBox.insertBefore(next, row);
          reindexSubmissionReviewEditorRows(reviewBox);
          updateProgress();
          reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', { bubbles: true, detail: { immediate: true } }));
        }
        return;
      }

      const copyFullBtn = event.target.closest('.btn-copy-full-item');
      if (copyFullBtn) {
        const row = copyFullBtn.closest('.submission-edit-review-row');
        const reviewer = row?.querySelector('.sub-edit-review-reviewer')?.value.trim() || 'Reviewer Comment';
        const comment = row?.querySelector('.sub-edit-review-comment')?.value.trim() || '';
        const response = row?.querySelector('.sub-edit-review-response')?.value.trim() || '';
        const changes = row?.querySelector('.sub-edit-review-changes')?.value.trim() || '';
        let block = `[${reviewer}]\nComment: ${comment}\n\nResponse: ${response}`;
        if (changes) block += `\n\nManuscript Changes: ${changes}`;
        try {
          await navigator.clipboard.writeText(block);
          showGlobalToast(t('copyCodeSuccess') || 'Copied to clipboard!', 'success');
        } catch (_) {
          showGlobalToast('Copy failed', 'danger');
        }
        return;
      }

      const copyButton = event.target.closest('.btn-copy-review-response');
      if (copyButton) {
        const row = copyButton.closest('.submission-edit-review-row');
        const responseText = row?.querySelector('.sub-edit-review-response')?.value.trim() || '';
        if (!responseText) {
          showGlobalToast(t('responsePending'), 'warning');
          return;
        }
        try {
          await navigator.clipboard.writeText(responseText);
          showGlobalToast(t('copyCodeSuccess') || 'Copied to clipboard!', 'success');
        } catch (_) {
          showGlobalToast('Copy failed', 'danger');
        }
        return;
      }

      const deleteButton = event.target.closest('.btn-delete-review-row');
      if (deleteButton) {
        const row = deleteButton.closest('.submission-edit-review-row');
        if (!row) return;
        const comment = row.querySelector('.sub-edit-review-comment')?.value.trim() || '';
        const response = row.querySelector('.sub-edit-review-response')?.value.trim() || '';
        if (comment || response) {
          const ok = confirm(t('confirmDeleteReviewComment') || 'Are you sure you want to delete this review comment item?');
          if (!ok) return;
        }
        row.remove();
        if (reviewBox.querySelectorAll('.submission-edit-review-row').length === 0) {
          window.RFUI.setHTML(reviewBox, `<p class="empty-state">${escapeHTML(t('emptyReviewEditor'))}</p>`);
        } else {
          reindexSubmissionReviewEditorRows(reviewBox);
        }
        updateProgress();
        reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', {
          bubbles: true,
          detail: { immediate: true }
        }));
      }
    });

    reviewBox.addEventListener('change', event => {
      const statusSelect = event.target.closest('.sub-edit-review-status');
      if (statusSelect) {
        statusSelect.dataset.status = statusSelect.value;
      }
      updateProgress();
      reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', {
        bubbles: true,
        detail: { immediate: false }
      }));
    });
  }

  return {
    collectSubmissionReviewMatrixFromEditor,
    createSubmissionReviewEditorRow,
    reindexSubmissionReviewEditorRows,
    renderSubmissionChecklistEditor,
    renderSubmissionReviewMatrixEditor
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.RFReviewMatrix = RFReviewMatrix;
}
if (typeof window !== 'undefined') {
  window.RFReviewMatrix = RFReviewMatrix;
  window.collectSubmissionReviewMatrixFromEditor = RFReviewMatrix.collectSubmissionReviewMatrixFromEditor;
  window.createSubmissionReviewEditorRow = RFReviewMatrix.createSubmissionReviewEditorRow;
  window.reindexSubmissionReviewEditorRows = RFReviewMatrix.reindexSubmissionReviewEditorRows;
  window.renderSubmissionChecklistEditor = RFReviewMatrix.renderSubmissionChecklistEditor;
  window.renderSubmissionReviewMatrixEditor = RFReviewMatrix.renderSubmissionReviewMatrixEditor;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RFReviewMatrix;
}
