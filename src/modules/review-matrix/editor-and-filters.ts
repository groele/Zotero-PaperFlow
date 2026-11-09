/**
 * Zotero PaperFlow - Peer Review Matrix Editor, Filters, Collapse & Smooth Rebuttal Progress
 */
import { getSubmissionChecklistKeys, getSubmissionChecklistLabel } from './checklist.js';
import {
  getFilterState,
  collectSubmissionReviewMatrixFromEditor,
  updateSubmissionRebuttalProgress,
  applyReviewMatrixFilter,
  autoResizeReviewTextarea,
} from './filter-and-progress.js';

export {
  collectSubmissionReviewMatrixFromEditor,
  updateSubmissionRebuttalProgress,
  applyReviewMatrixFilter,
};

declare var currentLanguage: string;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function escapeHTML(value: any): string;
declare function showGlobalToast(message: string, type?: string): void;
declare function renderRebuttalProgressTracker(sub: any): string;
declare function openBatchReviewImportModal(sub: any, reviewBox: any, onComplete?: () => void): void;

const g: any = typeof globalThis !== 'undefined' ? globalThis : window;

export function getSubmissionReviewMatrixRows(sub: any, initialDraft = ''): any[] {
  if (Array.isArray(sub?.reviewMatrix) && sub.reviewMatrix.length) {
    return window.RFUI.normalizeReviewMatrix(sub.reviewMatrix);
  }
  const fallback = String(sub?.notes || initialDraft || '').trim();
  return fallback
    ? [window.RFUI.normalizeReviewMatrixRow({ id: 'rev_1', comment: fallback, response: '' }, 0)]
    : [];
}

export function renderSubmissionReviewMatrixEditor(sub: any, initialDraft = ''): void {
  const reviewBox = document.getElementById('sub-edit-review-matrix-container');
  if (!reviewBox) return;

  const requestMatrixAutoSave = (immediate = true) => {
    updateSubmissionRebuttalProgress(sub);
    document.getElementById('submission-entry-editor-panel')?.dispatchEvent(new CustomEvent('submission-autosave-request', {
      detail: { immediate }
    }));
  };

  let rafProgressId: number | null = null;
  const scheduleLiveProgressRefresh = (targetTextarea?: any) => {
    if (targetTextarea) autoResizeReviewTextarea(targetTextarea);
    if (typeof requestAnimationFrame === 'function') {
      if (rafProgressId != null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafProgressId);
      }
      rafProgressId = requestAnimationFrame(() => {
        rafProgressId = null;
        updateSubmissionRebuttalProgress(sub);
      });
    } else {
      updateSubmissionRebuttalProgress(sub);
    }
  };

  const renderRows = (rows: any[], flipRects?: Map<string, any>, flashRowId?: string) => {
    sub.reviewMatrix = rows;
    updateSubmissionRebuttalProgress(sub);
    if (!rows.length) {
      window.RFUI.setHTML(reviewBox, `
        <div class="submission-review-empty">${escapeHTML(t('emptyReviewEditor') || '暂无审稿意见，点击上方“添加审稿意见”或“智能批量导入”开始录入。')}</div>
      `);
      return;
    }

    const reviewerOptions = ['Reviewer #1', 'Reviewer #2', 'Reviewer #3', 'Reviewer #4', 'Editor', 'Associate Editor'];
    const statusOptions = [
      { value: 'pending', label: t('statusPending') || (currentLanguage === 'zh' ? '待处理' : 'Pending') },
      { value: 'in_progress', label: t('statusInProgress') || (currentLanguage === 'zh' ? '处理修改中' : 'In Progress') },
      { value: 'addressed', label: t('statusAddressed') || (currentLanguage === 'zh' ? '已答复完成' : 'Addressed') },
      { value: 'clarified', label: t('statusClarified') || (currentLanguage === 'zh' ? '辩明解释 (无需改动)' : 'Clarified') }
    ];
    const filterState = g._reviewMatrixFilterState || { status: 'all', reviewer: 'all', collapseAddressed: false };

    const filterBarHtml = rows.length > 1 ? `
      <div class="review-matrix-filter-bar" role="toolbar" aria-label="${escapeHTML(t('peerReviewMatrixSection'))}">
        <div class="review-matrix-filter-controls">
          <select id="review-matrix-filter-status" class="review-matrix-filter-select" aria-label="${escapeHTML(t('statusFieldLabel'))}">
            <option value="all" ${filterState.status === 'all' ? 'selected' : ''}>${escapeHTML(t('filterReviewAll'))}</option>
            <option value="pending" ${filterState.status === 'pending' ? 'selected' : ''}>${escapeHTML(t('filterReviewPending'))}</option>
            <option value="addressed" ${filterState.status === 'addressed' ? 'selected' : ''}>${escapeHTML(t('filterReviewAddressed'))}</option>
          </select>
          <select id="review-matrix-filter-reviewer" class="review-matrix-filter-select" aria-label="${escapeHTML(t('reviewerFieldLabel'))}">
            <option value="all" ${filterState.reviewer === 'all' ? 'selected' : ''}>${escapeHTML(t('filterReviewerAll'))}</option>
            ${reviewerOptions.map((opt) => `<option value="${escapeHTML(opt)}" ${filterState.reviewer === opt ? 'selected' : ''}>${escapeHTML(opt)}</option>`).join('')}
          </select>
        </div>
        <button type="button" class="btn-secondary btn-sm btn-collapse-addressed-reviews ${filterState.collapseAddressed ? 'active' : ''}" id="btn-collapse-addressed-reviews" aria-pressed="${filterState.collapseAddressed ? 'true' : 'false'}">
          <span>${escapeHTML(t('collapseAddressedToggle'))}</span>
        </button>
      </div>
    ` : '';

    window.RFUI.setHTML(reviewBox, filterBarHtml + rows.map((row: any, index: number) => {
      const currentReviewer = row.reviewer || 'Reviewer #1';
      const currentStatus = row.status || ((row.response || '').trim() ? 'addressed' : 'pending');
      const isResolved = currentStatus === 'addressed' || currentStatus === 'clarified';
      const isCollapsed = filterState.collapseAddressed && isResolved;
      const commentPreview = String(row.comment || '').trim().slice(0, 72) || t('noCommentText');

      return `
      <div class="submission-edit-review-row status-${escapeHTML(currentStatus)} ${isCollapsed ? 'is-collapsed' : ''}" data-review-row data-review-id="${escapeHTML(row.id || `rev_${index + 1}`)}" data-status="${escapeHTML(currentStatus)}">
        <div class="submission-edit-review-row-head">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="submission-review-index">#${index + 1}</span>
            <select class="sub-edit-review-reviewer" aria-label="${escapeHTML(t('reviewerFieldLabel') || 'Reviewer')}" style="font-size:12px; padding:3px 8px; border-radius:6px; width:auto; min-width:128px; font-weight:600;">
              ${reviewerOptions.map((opt) => `<option value="${escapeHTML(opt)}" ${currentReviewer === opt ? 'selected' : ''}>${escapeHTML(opt)}</option>`).join('')}
            </select>
            <select class="sub-edit-review-status status-select-${escapeHTML(currentStatus)}" aria-label="${escapeHTML(t('statusFieldLabel') || 'Status')}" style="font-size:12px; padding:3px 8px; border-radius:6px; width:auto; min-width:124px; font-weight:600;">
              ${statusOptions.map((opt) => `<option value="${escapeHTML(opt.value)}" ${currentStatus === opt.value ? 'selected' : ''}>${escapeHTML(opt.label)}</option>`).join('')}
            </select>
            <span class="review-row-collapsed-snippet">${escapeHTML(commentPreview)}</span>
          </div>
          <div class="submission-edit-review-actions" style="display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
            <button type="button" class="btn-secondary btn-sm btn-toggle-review-collapse" title="${escapeHTML(t('toggleReviewCollapse'))}" aria-label="${escapeHTML(t('toggleReviewCollapse'))}" style="padding:2px 7px; font-size:11px;">▾</button>
            <button type="button" class="btn-secondary btn-sm btn-move-review-up" ${index === 0 ? 'disabled' : ''} title="${escapeHTML(t('moveCommentUp') || '上移')}" style="padding:2px 7px; font-size:11px;">↑ ${escapeHTML(t('moveUpShort') || (currentLanguage === 'zh' ? '上移' : 'Up'))}</button>
            <button type="button" class="btn-secondary btn-sm btn-move-review-down" ${index === rows.length - 1 ? 'disabled' : ''} title="${escapeHTML(t('moveCommentDown') || '下移')}" style="padding:2px 7px; font-size:11px;">↓ ${escapeHTML(t('moveDownShort') || (currentLanguage === 'zh' ? '下移' : 'Down'))}</button>
            <button type="button" class="btn-secondary btn-sm btn-copy-full-qa" title="${escapeHTML(t('copyFullCommentItem') || '复制完整问答条目')}" style="padding:2px 8px; font-size:11px;">📋 ${escapeHTML(t('copyItemShort') || (currentLanguage === 'zh' ? '复制问答' : 'Copy Q&A'))}</button>
            <button type="button" class="btn-secondary btn-sm btn-copy-review-response" style="padding:2px 8px; font-size:11px;">${escapeHTML(t('copy'))}</button>
            <button type="button" class="btn-danger btn-sm btn-delete-review-row" style="padding:2px 8px; font-size:11px;">${escapeHTML(t('removeComment'))}</button>
          </div>
        </div>
        <div class="submission-edit-review-fields">
          <div class="form-group">
            <label>${escapeHTML(t('reviewerCommentTitle') || tf('reviewerCommentLabel', { count: index + 1 }))}</label>
            <textarea class="sub-edit-review-comment" rows="3" placeholder="${escapeHTML(t('reviewerCommentPlaceholder'))}">${escapeHTML(row.comment || '')}</textarea>
          </div>
          <div class="form-group">
            <label>${escapeHTML(t('authorResponseLabel'))}</label>
            <textarea class="sub-edit-review-response" rows="3" placeholder="${escapeHTML(t('authorResponsePlaceholder'))}">${escapeHTML(row.response || '')}</textarea>
          </div>
          <div class="form-group" style="grid-column: 1 / -1; margin-top: 2px;">
            <label style="display:flex; align-items:center; gap:6px; color:var(--text-secondary);">
              <span>📍 ${escapeHTML(t('changesFieldLabel') || (currentLanguage === 'zh' ? '手稿修订说明与位置 (页码/行号)' : 'Changes in Manuscript & Locations'))}</span>
            </label>
            <input type="text" class="sub-edit-review-changes" value="${escapeHTML(row.changes || '')}" placeholder="${escapeHTML(t('changesPlaceholder') || (currentLanguage === 'zh' ? '例如: Page 4, Lines 120-135; 已补充表 S2' : 'e.g. Page 4, Lines 120-135; Supplementary Table S2 added'))}">
          </div>
        </div>
      </div>
    `;
    }).join(''));

    reviewBox.querySelector('#review-matrix-filter-status')?.addEventListener('change', (e: any) => {
      g._reviewMatrixFilterState.status = e.target.value;
      applyReviewMatrixFilter(reviewBox);
    });
    reviewBox.querySelector('#review-matrix-filter-reviewer')?.addEventListener('change', (e: any) => {
      g._reviewMatrixFilterState.reviewer = e.target.value;
      applyReviewMatrixFilter(reviewBox);
    });
    reviewBox.querySelector('#btn-collapse-addressed-reviews')?.addEventListener('click', () => {
      g._reviewMatrixFilterState.collapseAddressed = !g._reviewMatrixFilterState.collapseAddressed;
      reviewBox.querySelectorAll?.('[data-review-row]').forEach((r: any) => {
        if (r.dataset) {
          delete r.dataset.manualExpanded;
          delete r.dataset.manualCollapsed;
        }
      });
      applyReviewMatrixFilter(reviewBox);
    });

    reviewBox.querySelectorAll('[data-review-row]').forEach((rowEl: any, idx: number) => {
      const statusSel = rowEl.querySelector('.sub-edit-review-status');
      statusSel?.addEventListener('change', () => {
        const nextSt = statusSel.value;
        rowEl.setAttribute('data-status', nextSt);
        rowEl.className = `submission-edit-review-row status-${nextSt}${rowEl.classList?.contains('is-collapsed') ? ' is-collapsed' : ''}`;
        statusSel.className = `sub-edit-review-status status-select-${nextSt}`;
        updateSubmissionRebuttalProgress(sub);
        applyReviewMatrixFilter(reviewBox);
      });

      const collapseRowBtn = rowEl.querySelector('.btn-toggle-review-collapse');
      collapseRowBtn?.addEventListener('click', () => {
        const nextCollapsed = !rowEl.classList?.contains?.('is-collapsed');
        rowEl.classList?.toggle?.('is-collapsed', nextCollapsed);
        if (rowEl.dataset) {
          if (nextCollapsed) {
            rowEl.dataset.manualCollapsed = 'true';
            delete rowEl.dataset.manualExpanded;
          } else {
            rowEl.dataset.manualExpanded = 'true';
            delete rowEl.dataset.manualCollapsed;
          }
        }
      });

      rowEl.querySelectorAll?.('.sub-edit-review-comment, .sub-edit-review-response').forEach((ta: any) => {
        autoResizeReviewTextarea(ta);
        ta.addEventListener?.('input', () => scheduleLiveProgressRefresh(ta));
      });

      const moveUpBtn = rowEl.querySelector('.btn-move-review-up');
      moveUpBtn?.addEventListener('click', () => {
        const current = collectSubmissionReviewMatrixFromEditor();
        if (idx > 0) {
          const prevRects = window.RFUI.captureElementRects(reviewBox, '[data-review-row]', 'data-review-id');
          const movedId = current[idx]?.id;
          const temp = current[idx - 1];
          current[idx - 1] = current[idx];
          current[idx] = temp;
          renderRows(current, prevRects, movedId);
          requestMatrixAutoSave();
        }
      });

      const moveDownBtn = rowEl.querySelector('.btn-move-review-down');
      moveDownBtn?.addEventListener('click', () => {
        const current = collectSubmissionReviewMatrixFromEditor();
        if (idx < current.length - 1) {
          const prevRects = window.RFUI.captureElementRects(reviewBox, '[data-review-row]', 'data-review-id');
          const movedId = current[idx]?.id;
          const temp = current[idx + 1];
          current[idx + 1] = current[idx];
          current[idx] = temp;
          renderRows(current, prevRects, movedId);
          requestMatrixAutoSave();
        }
      });

      const copyQaBtn = rowEl.querySelector('.btn-copy-full-qa');
      copyQaBtn?.addEventListener('click', () => {
        const rev = rowEl.querySelector('.sub-edit-review-reviewer')?.value || 'Reviewer';
        const cmt = rowEl.querySelector('.sub-edit-review-comment')?.value || '';
        const rsp = rowEl.querySelector('.sub-edit-review-response')?.value || '';
        const chg = rowEl.querySelector('.sub-edit-review-changes')?.value || '';
        const block = `[${rev} - Comment #${idx + 1}]\n${cmt}\n\n[Author Response]\n${rsp}${chg ? `\n\n[Changes in Manuscript]\n${chg}` : ''}`;
        navigator.clipboard?.writeText(block);
        showGlobalToast(currentLanguage === 'zh' ? '已复制完整审稿问答块！' : 'Copied Q&A block to clipboard!', 'success');
      });

      const copyBtn = rowEl.querySelector('.btn-copy-review-response');
      copyBtn?.addEventListener('click', () => {
        const val = rowEl.querySelector('.sub-edit-review-response')?.value || '';
        navigator.clipboard?.writeText(val);
        showGlobalToast(currentLanguage === 'zh' ? '已复制回复内容！' : 'Response copied to clipboard!', 'success');
      });

      const deleteBtn = rowEl.querySelector('.btn-delete-review-row');
      deleteBtn?.addEventListener('click', () => {
        const nextRows = collectSubmissionReviewMatrixFromEditor()
          .filter((_: any, rowIndex: number) => rowIndex !== idx);
        renderRows(nextRows);
        requestMatrixAutoSave();
      });
    });

    applyReviewMatrixFilter(reviewBox);
    if (flipRects && flipRects.size > 0) {
      window.RFUI.playFlipAnimation(reviewBox, '[data-review-row]', 'data-review-id', flipRects, 'review-row-reordered-flash');
    } else if (flashRowId) {
      const targetRow = reviewBox.querySelector?.(`[data-review-id="${flashRowId}"]`);
      targetRow?.classList?.add?.('review-row-reordered-flash');
    }
  };

  renderRows(getSubmissionReviewMatrixRows(sub, initialDraft));

  const addButton = document.getElementById('btn-add-review-comment');
  if (addButton) {
    addButton.onclick = () => {
      const existing = collectSubmissionReviewMatrixFromEditor();
      const lastReviewer = existing.length > 0 ? existing[existing.length - 1].reviewer : 'Reviewer #1';
      renderRows([
        ...existing,
        { id: `rev_${Date.now()}`, reviewer: lastReviewer, status: 'pending', comment: '', response: '', changes: '' }
      ]);
      const comments = reviewBox.querySelectorAll('.sub-edit-review-comment');
      (comments[comments.length - 1] as HTMLElement | undefined)?.focus?.();
      requestMatrixAutoSave(false);
    };
  }

  const batchImportButton = document.getElementById('btn-batch-import-reviews');
  if (batchImportButton) {
    batchImportButton.onclick = () => {
      openBatchReviewImportModal(sub, reviewBox, () => {
        renderRows(sub.reviewMatrix || []);
        requestMatrixAutoSave(true);
      });
    };
  }
}

export function renderSubmissionReviewPreview(sub: any, checklistKeys = getSubmissionChecklistKeys(sub)): void {
  const previewBox = document.getElementById('submission-review-preview');
  if (!previewBox) return;

  const doneCount = checklistKeys.filter((key: string) => Boolean(sub?.complianceChecklist?.[key])).length;
  const reviewRows = getSubmissionReviewMatrixRows(sub);
  const completedReviewCount = reviewRows.filter((row: any) => Boolean(row.response)).length;
  const checklistPreview = checklistKeys.map((key: string) => {
    const done = Boolean(sub?.complianceChecklist?.[key]);
    return `
      <span class="submission-preview-chip ${done ? 'done' : ''}">
        <span aria-hidden="true">${done ? '✓' : '·'}</span>
        <span>${escapeHTML(getSubmissionChecklistLabel(key))}</span>
      </span>
    `;
  }).join('');

  const reviewPreview = reviewRows.length
    ? reviewRows.map((row: any, index: number) => `
      <article class="submission-review-preview-item ${row.response ? 'is-answered' : 'is-pending'}">
        <div class="submission-review-preview-head">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <strong>${escapeHTML(row.reviewer || 'Reviewer #1')} · #${index + 1}</strong>
          </div>
          <span class="badge ${row.status === 'addressed' || row.status === 'clarified' || row.response ? 'badge-success' : (row.status === 'in_progress' ? 'badge-info' : 'badge-warning')}">
            ${escapeHTML(row.status === 'addressed' ? t('statusAddressed') : (row.status === 'clarified' ? t('rebuttalClarified') : (row.status === 'in_progress' ? t('rebuttalInProgress') : (row.response ? t('responseSaved') : t('responsePending')))))}
          </span>
        </div>
        <p>${escapeHTML(row.comment || t('noCommentText'))}</p>
        ${row.response ? `<blockquote>${escapeHTML(row.response)}</blockquote>` : ''}
        ${row.changes ? `<div style="font-size:11px; color:#059669; margin-top:6px; font-weight:500;">📍 ${escapeHTML(row.changes)}</div>` : ''}
      </article>
    `).join('')
    : `<div class="submission-review-empty">${escapeHTML(t('emptyReviewPreview'))}</div>`;

  window.RFUI.setHTML(previewBox, `
    <div class="submission-review-preview-summary">
      <span>${escapeHTML(t('checklistLabel'))}: <strong>${doneCount}/${checklistKeys.length}</strong></span>
      <span>${escapeHTML(t('responsesLabel'))}: <strong>${completedReviewCount}/${reviewRows.length}</strong></span>
    </div>
    <div class="submission-preview-chip-list">${checklistPreview}</div>
    <div class="submission-review-preview-list">${reviewPreview}</div>
  `);
}
