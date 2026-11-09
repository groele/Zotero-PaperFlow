import {
  getSubmissionJournalName,
} from './field-helpers.js';

declare var db: any;
declare var currentLanguage: string;
declare function t(key: string): string;
declare function formatShortDate(dateStr: any): string;
declare function isAcceptedSubmission(sub: any): boolean;
declare function hasPublicationStatus(entity: any): boolean;
declare function computeNodeStatus(node: any): string;
declare function getNodeStatusLabel(status: string): string;
declare function inferKey(node: any): string;
declare function getTimelineNodeDisplayName(node: any): string;
declare function showGlobalToast(message: string, type?: string): void;
declare function openStageDrawer(subId: string, nodeId: string): void;

export function renderTimelineAlerts(): void {
  const reviewMilestones = document.getElementById('dashboard-pending-milestones');
  if (!reviewMilestones) return;
  (window as any).RFUI?.setHTML?.(reviewMilestones, '');

  const timelineAlerts: any[] = [];
  (db.submissions || [])
    .filter((s: any) => s.status !== 'rejected')
    .forEach((sub: any) => {
      const man = (db.manuscripts || []).find((m: any) => m.id === sub.manuscriptId);
      if (man) {
        const currentSub = (window as any).RFCore?.getCurrentSubmission?.(db, man.id);
        if (currentSub && currentSub.id !== sub.id) return;
      }

      const isAcceptedOrPublished = hasPublicationStatus(sub) ||
        isAcceptedSubmission(sub) ||
        Boolean(man && (hasPublicationStatus(man) || man.status === 'accepted' || man.status === 'published'));
      const isPublished = sub.status === 'published' || (man && man.status === 'published');

      if (isPublished) return;

      (sub.timelineNodes || []).forEach((node: any) => {
        const computedStatus = computeNodeStatus(node);
        const nodeKey = node.key || inferKey(node);

        if (isAcceptedOrPublished) {
          if (node.type !== 'publication' || nodeKey === 'accept') return;
        }

        if (computedStatus === 'completed') return;

        const importantType = node.type === 'review' || node.type === 'revision' || node.type === 'publication';
        const hasTimelineDate = Boolean(node.dueDate || node.planDate || node.completeDate);
        const actionable = computedStatus === 'overdue' || computedStatus === 'due_soon' || computedStatus === 'blocked' || node.status === 'active';

        if (!actionable && !hasTimelineDate) return;
        if (!importantType && !actionable) return;

        const alertDate = node.dueDate || node.planDate || (node.type === 'review' ? sub.revisionDueDate : '') || node.completeDate || '';
        if (!alertDate && computedStatus !== 'blocked') return;

        timelineAlerts.push({
          sub,
          node,
          computedStatus,
          title: `${getSubmissionJournalName(sub)}: ${getTimelineNodeDisplayName(node)}`,
          date: alertDate,
          manTitle: man ? man.title : t('untitledManuscript')
        });
      });
    });

  const statusRank: Record<string, number> = { overdue: 0, blocked: 1, due_soon: 2, in_progress: 3, not_started: 4, upcoming: 5 };
  timelineAlerts.sort((a, b) => {
    const ra = statusRank[a.computedStatus] ?? 9;
    const rb = statusRank[b.computedStatus] ?? 9;
    if (ra !== rb) return ra - rb;
    return new Date(a.date || '2999-12-31').getTime() - new Date(b.date || '2999-12-31').getTime();
  });

  // Setup All Deadlines Calendar Export button
  const btnExportAllIcs = document.getElementById('btn-dashboard-export-all-ics');
  if (btnExportAllIcs && !btnExportAllIcs.dataset.listenerAttached) {
    btnExportAllIcs.dataset.listenerAttached = 'true';
    btnExportAllIcs.addEventListener('click', () => {
      const activeSubs = (db.submissions || []).filter((s: any) => s.revisionDueDate && s.status !== 'accepted' && s.status !== 'published');
      if (activeSubs.length === 0) {
        showGlobalToast(t('noDeadlinesToExport') || (currentLanguage === 'zh' ? '当前未发现已设置修回截止日期的活跃稿件。' : 'No active submissions with revision due dates found.'), 'warning');
        return;
      }
      const rfCal = (window as any).RFCalendar;
      if (rfCal?.generateSubmissionCalendarFeed && rfCal?.triggerCalendarDownload) {
        const feed = rfCal.generateSubmissionCalendarFeed(activeSubs, db.manuscripts, { calName: 'PaperFlow All Revision Deadlines' });
        rfCal.triggerCalendarDownload(feed, 'paperflow_all_deadlines.ics');
        showGlobalToast(t('calendarExportedToast') || (currentLanguage === 'zh' ? '修回截止日历 (.ics) 已导出！' : 'Revision deadline calendar (.ics) exported.'), 'success');
      }
    });
  }

  if (timelineAlerts.length === 0) {
    (window as any).RFUI?.setHTML?.(reviewMilestones, `<p class="empty-state">${t('noUrgentEvents')}</p>`);
  } else {
    timelineAlerts.slice(0, 5).forEach((alert) => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.title = alert.manTitle;
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        if (typeof openStageDrawer === 'function') {
          openStageDrawer(alert.sub.id, alert.node.id);
        }
      });

      const title = document.createElement('span');
      title.className = 'recent-item-title';
      title.textContent = alert.title;

      const badge = document.createElement('span');
      const badgeClass = alert.computedStatus === 'overdue' || alert.computedStatus === 'blocked'
        ? 'danger'
        : alert.computedStatus === 'due_soon'
          ? 'warning'
          : 'info';
      badge.className = `badge badge-${badgeClass}`;
      badge.textContent = getNodeStatusLabel(alert.computedStatus);

      const date = document.createElement('span');
      date.className = 'recent-item-date';
      date.textContent = alert.date ? formatShortDate(alert.date) : t('noDate');

      item.appendChild(title);
      item.appendChild(badge);
      item.appendChild(date);

      if (alert.sub?.revisionDueDate) {
        const icsBtn = document.createElement('button');
        icsBtn.type = 'button';
        icsBtn.className = 'btn-secondary btn-icon';
        icsBtn.style.cssText = 'font-size:11px; padding:2px 6px; border-radius:3px; margin-left:4px; height:22px;';
        icsBtn.title = t('exportCalendarIcs') || '导出修回日历 (.ics)';
        icsBtn.textContent = '📅';
        icsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const rfCal = (window as any).RFCalendar;
          if (rfCal?.generateSubmissionCalendarFeed && rfCal?.triggerCalendarDownload) {
            const feed = rfCal.generateSubmissionCalendarFeed([alert.sub], db.manuscripts, { calName: `${getSubmissionJournalName(alert.sub)} Revision Deadline` });
            rfCal.triggerCalendarDownload(feed, `revision_deadline_${alert.sub.id}.ics`);
            showGlobalToast(t('calendarExportedToast') || '修回截止日历 (.ics) 已导出！', 'success');
          }
        });
        item.appendChild(icsBtn);
      }

      reviewMilestones.appendChild(item);
    });
  }
}
