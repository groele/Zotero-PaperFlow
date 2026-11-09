import {
  getNodeDate,
  normalizeDateString,
  getRelativeDayLabel,
  getSubmissionJournalName,
} from './field-helpers';

declare var db: any;
declare function t(key: string): string;
declare function escapeHTML(value: any): string;
declare function formatShortDate(dateStr: any): string;
declare function isAcceptedSubmission(sub: any): boolean;
declare function computeNodeStatus(node: any): string;
declare function getNodeStatusLabel(status: string): string;
declare function getTimelineNodeDisplayName(node: any): string;
declare function openStageDrawer(subId: string, nodeId: string): void;

export function renderTimelineAlerts(): void {
  const reviewMilestones = document.getElementById('dashboard-pending-milestones');
  if (reviewMilestones) (window as any).RFUI?.setHTML?.(reviewMilestones, '');

  const alertsList = document.getElementById('dashboard-alerts-list') || reviewMilestones;
  if (!alertsList) return;
  const w = window as any;
  w.RFUI.setHTML(alertsList, '');

  const alerts: any[] = [];
  (db.submissions || []).forEach((sub: any) => {
    if (isAcceptedSubmission(sub) || sub.status === 'rejected') return;
    const man = db.manuscripts.find((m: any) => m.id === sub.manuscriptId);
    const title = man ? man.title : (sub.title || t('untitledManuscript'));
    const journalName = getSubmissionJournalName(sub);
    (sub.timelineNodes || []).forEach((node: any) => {
      const status = computeNodeStatus(node);
      const isReviewDeadline = Boolean(node.dueDate);
      const isDecisionNotice = Boolean(node.reviewDecision);
      const dueEndTime = node.dueDate ? new Date(`${normalizeDateString(node.dueDate)}T23:59:59`).getTime() : 0;
      const isDecisionStillRelevant = isDecisionNotice && (!dueEndTime || dueEndTime >= Date.now());
      if (status === 'overdue' || status === 'due_soon' || status === 'blocked' || isReviewDeadline || isDecisionStillRelevant) {
        alerts.push({ sub, node, status, title, journalName });
      }
    });
  });

  if (alerts.length === 0) {
    w.RFUI.setHTML(alertsList, `<p class="empty-state">${t('noUrgentEvents')}</p>`);
    return;
  }

  alerts
    .sort((a, b) => new Date(getNodeDate(a.node) || 0).getTime() - new Date(getNodeDate(b.node) || 0).getTime())
    .slice(0, 6)
    .forEach(({ sub, node, status, title, journalName }) => {
      const el = document.createElement('div');
      el.className = 'recent-item';
      const dueDate = normalizeDateString(node.dueDate);
      const dateStr = dueDate || getNodeDate(node) || t('noDate');
      const relativeStr = dueDate ? getRelativeDayLabel(dueDate) : '';
      const decisionLabel = node.reviewDecision
        ? (node.reviewDecision === 'major' ? t('majorRevision') : t('minorRevision'))
        : '';
      const alertLabel = dueDate
        ? `${t('deadlineShort')} ${formatShortDate(dueDate)}${relativeStr ? ` · ${relativeStr}` : ''}`
        : getNodeStatusLabel(status);
      w.RFUI.setHTML(el, `
        <div class="recent-item-header">
          <span class="badge ${status === 'overdue' || status === 'blocked' ? 'badge-danger' : 'badge-warning'}">${escapeHTML(alertLabel)}</span>
          ${decisionLabel ? `<span class="badge badge-info">${escapeHTML(decisionLabel)}</span>` : ''}
          <span class="recent-item-date">${escapeHTML(dateStr)}</span>
        </div>
        <div class="recent-item-title">${escapeHTML(getTimelineNodeDisplayName(node))} · ${escapeHTML(journalName)}</div>
        <div class="text-muted" style="font-size:12px;">${escapeHTML(title)}</div>
      `);
      el.addEventListener('click', () => openStageDrawer(sub.id, node.id));
      alertsList.appendChild(el);
    });
}
