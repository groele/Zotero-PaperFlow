declare var currentLanguage: string;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function escapeHTML(value: any): string;
declare function renderRebuttalProgressTracker(sub: any): string;

export interface ReviewFilterState {
  status: string;
  reviewer: string;
  collapseAddressed: boolean;
}

const g: any = typeof globalThis !== 'undefined' ? globalThis : window;
if (!('_reviewMatrixFilterState' in g)) {
  g._reviewMatrixFilterState = { status: 'all', reviewer: 'all', collapseAddressed: false };
}

export function getFilterState(): ReviewFilterState {
  return g._reviewMatrixFilterState;
}

export function collectSubmissionReviewMatrixFromEditor(): any[] {
  const w = window as any;
  const rows = Array.from(document.querySelectorAll('#sub-edit-review-matrix-container [data-review-row]')).map((row: any, index: number) => ({
    id: row.getAttribute('data-review-id') || `rev_${index + 1}`,
    reviewer: row.querySelector('.sub-edit-review-reviewer')?.value || 'Reviewer #1',
    status: row.querySelector('.sub-edit-review-status')?.value || 'pending',
    comment: row.querySelector('.sub-edit-review-comment')?.value || '',
    response: row.querySelector('.sub-edit-review-response')?.value || '',
    changes: row.querySelector('.sub-edit-review-changes')?.value || '',
  }));
  return w.RFUI.normalizeReviewMatrix(rows);
}

export function updateSubmissionRebuttalProgress(sub: any): void {
  const w = window as any;
  const progressBox = document.getElementById('sub-edit-rebuttal-progress-container');
  if (!progressBox) return;

  const liveRows = collectSubmissionReviewMatrixFromEditor();
  const rows = liveRows.length > 0 ? liveRows : (Array.isArray(sub?.reviewMatrix) ? sub.reviewMatrix : []);
  if (rows.length === 0) {
    w.RFUI.setHTML(progressBox, '');
    return;
  }

  const existingCard = progressBox.querySelector?.('.rebuttal-progress-card');
  const fillEl = existingCard?.querySelector?.('.rebuttal-progress-bar-fill') as HTMLElement | null;
  if (existingCard && fillEl) {
    const total = rows.length;
    const addressed = rows.filter((r: any) => r.status === 'addressed' || r.status === 'clarified' || (r.status !== 'in_progress' && (r.response || '').trim().length > 0)).length;
    const inProgress = rows.filter((r: any) => r.status === 'in_progress').length;
    const pending = Math.max(0, total - addressed - inProgress);
    const pct = total > 0 ? Math.round((addressed / total) * 100) : 0;

    fillEl.style.width = `${pct}%`;
    fillEl.setAttribute?.('aria-valuenow', String(pct));
    fillEl.classList?.toggle?.('is-complete', pct === 100);
    existingCard.classList?.toggle?.('is-complete', pct === 100);

    const pctEl = existingCard.querySelector?.('.rebuttal-progress-pct');
    if (pctEl) pctEl.textContent = `${pct}%`;

    const setStat = (key: string, val: number) => {
      const el = existingCard.querySelector?.(`[data-rebuttal-stat="${key}"]`);
      if (el) el.textContent = String(val);
    };
    setStat('total', total);
    setStat('addressed', addressed);
    setStat('in_progress', inProgress);
    setStat('pending', pending);
    return;
  }

  w.RFUI.setHTML(progressBox, renderRebuttalProgressTracker({ ...sub, reviewMatrix: rows }));
}

export function applyReviewMatrixFilter(reviewBox?: HTMLElement | null): void {
  const box = reviewBox || document.getElementById('sub-edit-review-matrix-container');
  if (!box || typeof box.querySelectorAll !== 'function') return;
  const state: ReviewFilterState = g._reviewMatrixFilterState || { status: 'all', reviewer: 'all', collapseAddressed: false };
  const rows = box.querySelectorAll('[data-review-row]');
  rows.forEach((row: any) => {
    const rowStatus = String(row.querySelector?.('.sub-edit-review-status')?.value || row.getAttribute?.('data-status') || 'pending');
    const rowReviewer = String(row.querySelector?.('.sub-edit-review-reviewer')?.value || 'Reviewer #1');
    const isResolved = rowStatus === 'addressed' || rowStatus === 'clarified';
    const matchesStatus = state.status === 'all'
      || (state.status === 'pending' && !isResolved)
      || (state.status === 'addressed' && isResolved);
    const matchesReviewer = state.reviewer === 'all' || rowReviewer === state.reviewer;
    row.hidden = !(matchesStatus && matchesReviewer);
    if (state.collapseAddressed && isResolved && !row.dataset.manualExpanded) {
      row.classList?.add?.('is-collapsed');
    } else if (!state.collapseAddressed && !row.dataset.manualCollapsed) {
      row.classList?.remove?.('is-collapsed');
    }
  });
  const collapseBtn = document.getElementById('btn-collapse-addressed-reviews');
  if (collapseBtn) {
    collapseBtn.classList?.toggle?.('active', Boolean(state.collapseAddressed));
    collapseBtn.setAttribute?.('aria-pressed', state.collapseAddressed ? 'true' : 'false');
  }
}

export function autoResizeReviewTextarea(textarea: any): void {
  if (!textarea || !textarea.style) return;
  try {
    if (typeof textarea.scrollHeight === 'number' && textarea.scrollHeight > 0) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(300, Math.max(66, textarea.scrollHeight))}px`;
    }
  } catch (_) {}
}
