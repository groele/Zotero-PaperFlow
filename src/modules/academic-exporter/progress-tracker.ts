/**
 * Zotero PaperFlow - Academic Rebuttal Progress Metrics Tracker
 */
import { getSubmissionReviewMatrixRows } from './latex-helpers';

declare function escapeHTML(value: any): string;
declare function t(key: string): string;

export function renderRebuttalProgressTracker(sub: any = {}): string {
  const rows = getSubmissionReviewMatrixRows(sub);
  const total = rows.length;
  if (total === 0) return '';

  const esc = typeof escapeHTML === 'function' ? escapeHTML : ((s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  const addressed = rows.filter((r: any) => r.status === 'addressed' || (!r.status && r.response && r.response.trim().length > 0)).length;
  const clarified = rows.filter((r: any) => r.status === 'clarified').length;
  const resolved = addressed + clarified;
  const inProgress = rows.filter((r: any) => r.status === 'in_progress').length;
  const pending = rows.filter((r: any) => r.status === 'pending' || (!r.status && (!r.response || !r.response.trim().length))).length;
  const withChanges = rows.filter((r: any) => Boolean(r.changes && r.changes.trim().length > 0)).length;
  const percent = Math.round((resolved / total) * 100);

  const reviewerMap = new Map<string, { total: number; done: number }>();
  rows.forEach((r: any) => {
    const rev = r.reviewer || 'Reviewer';
    if (!reviewerMap.has(rev)) reviewerMap.set(rev, { total: 0, done: 0 });
    const stat = reviewerMap.get(rev)!;
    stat.total++;
    if (r.status === 'addressed' || r.status === 'clarified' || (!r.status && r.response && r.response.trim().length > 0)) {
      stat.done++;
    }
  });

  const reviewerChips = Array.from(reviewerMap.entries()).map(([rev, stat]) => {
    const isAllDone = stat.done === stat.total;
    const bg = isAllDone ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)';
    const color = isAllDone ? '#16a34a' : '#ca8a04';
    return `<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; padding:2px 8px; border-radius:12px; background:${bg}; color:${color}; font-weight:600;">` +
      `<span>${esc(rev)}:</span> <span>${stat.done}/${stat.total}</span>` +
    `</span>`;
  }).join(' ');

  const tr = typeof t === 'function' ? t : ((k: string) => k);
  return `
    <div class="rebuttal-progress-card">
      <div class="rebuttal-progress-header">
        <div class="rebuttal-progress-title-wrap">
          <span class="rebuttal-progress-icon">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          </span>
          <span class="rebuttal-progress-title">${esc(tr('rebuttalProgressTitle') || '修回攻坚进度')}</span>
          <span class="badge ${percent === 100 ? 'badge-success' : 'badge-warning'} rebuttal-progress-badge">${percent}% ${percent === 100 ? '100% Completed' : 'In Progress'}</span>
        </div>
        <div class="rebuttal-progress-reviewers">
          ${reviewerChips}
        </div>
      </div>
      <div class="rebuttal-progress-bar-track">
        <div class="rebuttal-progress-bar-fill ${percent === 100 ? 'is-complete' : ''}" style="width:${percent}%;"></div>
      </div>
      <div class="rebuttal-progress-kpis">
        <div class="rebuttal-kpi-chip kpi-total">
          <span class="kpi-label">${esc(tr('rebuttalTotalComments') || '总意见')}:</span>
          <strong class="kpi-value"><strong>${total}</strong></strong>
        </div>
        <div class="rebuttal-kpi-chip kpi-addressed">
          <span class="kpi-icon">✔</span>
          <span class="kpi-label">${esc(tr('rebuttalAddressed') || '已答复')}:</span>
          <strong class="kpi-value">${addressed}</strong>
        </div>
        ${clarified > 0 ? `
        <div class="rebuttal-kpi-chip kpi-clarified">
          <span class="kpi-icon">💬</span>
          <span class="kpi-label">${esc(tr('rebuttalClarified') || '已辩明')}:</span>
          <strong class="kpi-value">${clarified}</strong>
        </div>` : ''}
        ${inProgress > 0 ? `
        <div class="rebuttal-kpi-chip kpi-in-progress">
          <span class="kpi-icon">⏳</span>
          <span class="kpi-label">${esc(tr('rebuttalInProgress') || '处理中')}:</span>
          <strong class="kpi-value">${inProgress}</strong>
        </div>` : ''}
        <div class="rebuttal-kpi-chip ${pending > 0 ? 'kpi-pending' : 'kpi-all-clear'}">
          <span class="kpi-icon">⭕</span>
          <span class="kpi-label">${esc(tr('rebuttalPending') || '待答复')}:</span>
          <strong class="kpi-value">${pending}</strong>
        </div>
        <div class="rebuttal-kpi-chip kpi-changes">
          <span class="kpi-icon">📝</span>
          <span class="kpi-label">${esc(tr('rebuttalChangesNoted') || '已标定改动')}:</span>
          <strong class="kpi-value">${withChanges}</strong>
        </div>
      </div>
    </div>
  `;
}
