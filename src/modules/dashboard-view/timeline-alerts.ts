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

function computeCountdown(dateStr: string): any {
  if (!dateStr) return null;
  const w = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  if (w.RFCalendar?.getRevisionCountdownMeta) {
    try {
      const meta = w.RFCalendar.getRevisionCountdownMeta(dateStr);
      if (meta) return meta;
    } catch (_) {}
  }
  if (typeof (w as any).getRevisionCountdownMeta === 'function') {
    try {
      const meta = (w as any).getRevisionCountdownMeta(dateStr);
      if (meta) return meta;
    } catch (_) {}
  }
  return null;
}

export function renderTimelineAlerts(): void {
  const reviewMilestones = document.getElementById('dashboard-pending-milestones');
  if (!reviewMilestones) return;
  const w = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  w.RFUI?.setHTML?.(reviewMilestones, '');

  const database = w.db || (typeof db !== 'undefined' ? db : null) || {};
  const allSubmissions = database.submissions || [];
  const allManuscripts = database.manuscripts || [];

  const checkPub = (entity: any): boolean => {
    if (!entity) return false;
    if (typeof hasPublicationStatus === 'function') {
      try { return hasPublicationStatus(entity); } catch (_) {}
    }
    const st = String(entity.status || '').toLowerCase();
    return st === 'accepted' || st === 'published';
  };

  const checkAccepted = (entity: any): boolean => {
    if (!entity) return false;
    if (typeof isAcceptedSubmission === 'function') {
      try { return isAcceptedSubmission(entity); } catch (_) {}
    }
    if (typeof w.isAcceptedSubmission === 'function') {
      try { return w.isAcceptedSubmission(entity); } catch (_) {}
    }
    if (typeof w.analyzeSubmission === 'function') {
      try { return Boolean(w.analyzeSubmission(entity)?.accepted); } catch (_) {}
    }
    return checkPub(entity);
  };

  const isZh = typeof currentLanguage !== 'undefined' ? currentLanguage === 'zh' : true;
  const timelineAlerts: any[] = [];

  allSubmissions
    .filter((s: any) => s && s.status !== 'rejected')
    .forEach((sub: any) => {
      const man = allManuscripts.find((m: any) => m.id === sub.manuscriptId);
      if (man) {
        const currentSub = w.RFCore?.getCurrentSubmission?.(database, man.id);
        if (currentSub && currentSub.id !== sub.id) return;
      }

      const isAcceptedOrPublished = checkPub(sub) ||
        checkAccepted(sub) ||
        Boolean(man && (checkPub(man) || man.status === 'accepted' || man.status === 'published'));
      const isPublished = sub.status === 'published' || (man && man.status === 'published');

      if (isPublished) return;

      const journalName = getSubmissionJournalName(sub);
      let hasRevisionAlert = false;

      // 1. Authoritative revision deadline alert (active non-published/non-accepted submissions)
      if (!isAcceptedOrPublished) {
        const revDueDate = sub.revisionDueDate ? String(sub.revisionDueDate).trim() : '';
        const isRevisionStatus = sub.status === 'revision';

        const revNode = (sub.timelineNodes || []).find((n: any) => {
          const k = n.key || inferKey(n);
          return k === 'r1_revised' || k === 'r2_revised' || n.type === 'revision';
        }) || (sub.timelineNodes || []).find((n: any) => {
          const k = n.key || inferKey(n);
          return k === 'r1_comments';
        });

        if (revDueDate) {
          const cd = computeCountdown(revDueDate);
          const revLabel = t('revisionDueLabel') || (isZh ? '修回截止' : 'Revision Deadline');
          timelineAlerts.push({
            sub,
            node: revNode || sub.timelineNodes?.[0] || { id: '' },
            computedStatus: cd?.level === 'overdue' ? 'overdue' : (cd?.level === 'due_today' ? 'due_today' : (cd?.level === 'due_soon' ? 'due_soon' : 'upcoming')),
            title: `${journalName}: ${revLabel}`,
            date: revDueDate,
            displayDate: `${formatShortDate(revDueDate)}${isZh ? ' 截止' : ' due'}`,
            countdown: cd,
            manTitle: man ? man.title : t('untitledManuscript'),
            isRevision: true
          });
          hasRevisionAlert = true;
        } else if (isRevisionStatus) {
          timelineAlerts.push({
            sub,
            node: revNode || sub.timelineNodes?.[0] || { id: '' },
            computedStatus: 'due_soon',
            title: `${journalName}: ${t('revisionDueLabel') || (isZh ? '修回截止' : 'Revision Deadline')}`,
            date: '',
            displayDate: isZh ? '待设截止日' : 'No deadline',
            countdown: { icon: '⚠️', text: isZh ? '待设截止日' : 'No deadline', level: 'due_soon', days: null },
            manTitle: man ? man.title : t('untitledManuscript'),
            isRevision: true
          });
          hasRevisionAlert = true;
        }
      }

      // 2. Timeline nodes check (upcoming or overdue milestones)
      (sub.timelineNodes || []).forEach((node: any) => {
        const computedStatus = computeNodeStatus(node);
        const nodeKey = node.key || inferKey(node);

        if (isAcceptedOrPublished) {
          if (node.type !== 'publication' || nodeKey === 'accept') return;
        }

        if (computedStatus === 'completed') return;

        // Skip review/revision nodes if already represented by authoritative revision alert
        if (hasRevisionAlert && (nodeKey === 'r1_revised' || nodeKey === 'r2_revised' || nodeKey === 'r1_comments' || node.type === 'revision' || node.type === 'review')) return;

        const importantType = node.type === 'review' || node.type === 'revision' || node.type === 'publication';
        const hasTimelineDate = Boolean(node.dueDate || node.planDate || node.completeDate);
        const actionable = computedStatus === 'overdue' || computedStatus === 'due_soon' || computedStatus === 'blocked' || node.status === 'active';

        if (!actionable && !hasTimelineDate) return;
        if (!importantType && !actionable) return;

        const alertDate = node.dueDate || node.planDate || (node.type === 'review' ? sub.revisionDueDate : '') || node.completeDate || '';
        if (!alertDate && computedStatus !== 'blocked') return;

        let cd: any = null;
        if (alertDate && (computedStatus === 'overdue' || computedStatus === 'due_soon' || node.dueDate)) {
          cd = computeCountdown(alertDate);
        }

        timelineAlerts.push({
          sub,
          node,
          computedStatus: cd?.level === 'overdue' ? 'overdue' : (cd?.level === 'due_today' ? 'due_today' : (cd?.level === 'due_soon' ? 'due_soon' : computedStatus)),
          title: `${journalName}: ${getTimelineNodeDisplayName(node)}`,
          date: alertDate,
          displayDate: alertDate ? `${formatShortDate(alertDate)}${node.dueDate ? (isZh ? ' 截止' : '') : ''}` : t('noDate'),
          countdown: cd,
          manTitle: man ? man.title : t('untitledManuscript'),
          isRevision: false
        });
      });
    });

  const statusRank: Record<string, number> = { overdue: 0, due_today: 0, blocked: 1, due_soon: 2, in_progress: 3, not_started: 4, upcoming: 5 };
  timelineAlerts.sort((a, b) => {
    const hasDaysA = a.countdown && typeof a.countdown.days === 'number';
    const hasDaysB = b.countdown && typeof b.countdown.days === 'number';
    if (hasDaysA && hasDaysB && a.countdown.days !== b.countdown.days) {
      return a.countdown.days - b.countdown.days;
    }
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
    timelineAlerts.slice(0, 8).forEach((alert) => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.title = alert.manTitle;
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        if (typeof openStageDrawer === 'function') {
          openStageDrawer(alert.sub.id, alert.node?.id || '');
        }
      });

      const title = document.createElement('span');
      title.className = 'recent-item-title';
      title.textContent = alert.title;

      const badge = document.createElement('span');
      let badgeClass = 'info';
      let badgeText = getNodeStatusLabel(alert.computedStatus);

      if (alert.countdown && alert.countdown.text) {
        const lvl = alert.countdown.level;
        badgeClass = (lvl === 'overdue' || lvl === 'due_today')
          ? 'danger'
          : lvl === 'due_soon'
            ? 'warning'
            : 'info';
        badgeText = `${alert.countdown.icon ? alert.countdown.icon + ' ' : ''}${alert.countdown.text}`;
      } else if (alert.computedStatus === 'overdue' || alert.computedStatus === 'blocked') {
        badgeClass = 'danger';
      } else if (alert.computedStatus === 'due_soon') {
        badgeClass = 'warning';
      }

      badge.className = `badge badge-${badgeClass}`;
      badge.textContent = badgeText;
      if (alert.countdown?.title) {
        badge.title = alert.countdown.title;
      }

      const date = document.createElement('span');
      date.className = 'recent-item-date';
      date.textContent = alert.displayDate || (alert.date ? formatShortDate(alert.date) : t('noDate'));

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
