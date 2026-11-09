/**
 * Zotero PaperFlow - Dashboard KPI Cards, Timeline Gantt & Alerts Renderer
 */
import {
  getSubmissionFirstAuthor,
  getSubmissionDoi,
  getSubmissionJournalName,
  getSubmissionArticleUrl,
  normalizeDateString,
  getNodeDate,
  getRelativeDayLabel,
  average,
  sortDashboardSubmissions
} from './field-helpers.js';

import {
  setPipelineViewMode,
  setDashboardFilter,
  updateDashboardFilterUI
} from './transfer-and-status.js';

import { renderTimelineAlerts } from './timeline-alerts.js';
import { bindPipelineCardInteractions } from './card-interactions.js';
export { renderTimelineAlerts };

declare var db: any;
declare var currentLanguage: string;
declare var currentDashboardFilter: string;
declare var isPipelineExpanded: boolean;
declare var ZoteroBridge: any;
declare var typeMeta: Record<string, { labelKey: string; color: string }>;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function escapeHTML(value: any): string;
declare function analyzeSubmission(sub: any): any;
declare function isAcceptedSubmission(sub: any): boolean;
declare function computeNodeStatus(node: any): string;
declare function getNodeStatusLabel(status: string): string;
declare function autoSortNodes(nodes: any[]): any[];
declare function getCapsuleIcon(status: string, type?: string): string;
declare function formatShortDate(dateStr: any): string;
declare function getTimelineNodeDisplayName(node: any): string;
declare function buildInlineStageEditor(subId: string): string;
declare function buildTimelineEventManager(sub: any, opts?: any): string;
declare function openStageDrawer(subId: string, nodeId: string): void;
declare function toggleInlineStageEditor(card: any, shouldOpen?: boolean | null): void;
declare function syncInlineStagePreset(editor: any): void;
declare function updateInlineStageDeadlineStatus(editor: any): void;
declare function resetInlineStageEditor(editor: any): void;
declare function setInlineStageBusy(editor: any, busy: boolean, message?: string): void;
declare function saveInlineStageEvent(editor: any): Promise<void>;
declare function openSubmissionShareModal(subId: string): Promise<void>;
declare function openSubmissionForEditing(subOrId: any, options?: any): void;
declare function deleteTimelineNode(sub: any, nodeId: string): any;
declare function syncManuscriptStatusFromSubmission(sub: any, database?: any): boolean;
declare function renderKanban(): void;
declare function renderSubmissions(): void;
declare function showGlobalToast(message: string, type?: string): void;

export function bindDashboardControls(): void {
  document.getElementById('btn-pipeline-compact')?.addEventListener('click', () => setPipelineViewMode(false));
  document.getElementById('btn-pipeline-expanded')?.addEventListener('click', () => setPipelineViewMode(true));

  const filterCardBindings: Array<[string, string]> = [
    ['card-filter-accepted', 'accepted'],
    ['card-filter-active', 'active'],
    ['card-filter-all', 'all']
  ];
  filterCardBindings.forEach(([id, filter]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => setDashboardFilter(filter));
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setDashboardFilter(filter);
      }
    });
  });
}

export function renderDashboard(): void {
  if (window.RFUI?.isViewDeferred?.('view-dashboard')) return;

  const allSubmissions = sortDashboardSubmissions(db.submissions || []);
  const allAnalyses = allSubmissions.map((sub: any) => ({ sub, analysis: analyzeSubmission(sub) }));

  const acceptedSubs = allSubmissions.filter((s: any) => isAcceptedSubmission(s));
  const activeSubs = allSubmissions.filter((s: any) => !isAcceptedSubmission(s) && s.status !== 'rejected');

  window.RFUI.animateMetricValue(document.getElementById('stat-accepted-papers'), acceptedSubs.length);
  window.RFUI.animateMetricValue(document.getElementById('stat-active-subs'), activeSubs.length);
  window.RFUI.animateMetricValue(document.getElementById('stat-total-attempts'), allSubmissions.length);
  updateDashboardFilterUI();

  const expSubmitAvg = average(allAnalyses.map((x: any) => x.analysis.expToSubmit));
  const submitNowAvg = average(allAnalyses.filter((x: any) => !x.analysis.accepted && x.sub.status !== 'rejected').map((x: any) => x.analysis.submitToNow));
  const r1NowAvg = average(allAnalyses.filter((x: any) => !x.analysis.accepted && x.sub.status !== 'rejected').map((x: any) => x.analysis.r1ToNow));
  const submitAcceptAvg = average(allAnalyses.filter((x: any) => x.analysis.accepted).map((x: any) => x.analysis.submitToAccept));

  const fmtMetric = (val: number | null) => val === null ? '—' : `${val} ${t('days')}`;
  window.RFUI.animateMetricValue(document.getElementById('metric-exp-submit'), fmtMetric(expSubmitAvg));
  window.RFUI.animateMetricValue(document.getElementById('metric-submit-now'), fmtMetric(submitNowAvg));
  window.RFUI.animateMetricValue(document.getElementById('metric-r1-now'), fmtMetric(r1NowAvg));
  window.RFUI.animateMetricValue(document.getElementById('metric-submit-accept'), fmtMetric(submitAcceptAvg));

  renderTimelineAlerts();

  const ganttBox = document.getElementById('dashboard-gantt');
  if (!ganttBox) return;
  window.RFUI.setHTML(ganttBox, '');
  setPipelineViewMode(isPipelineExpanded);

  const visibleSubmissions = allSubmissions.filter((sub: any) => {
    if (currentDashboardFilter === 'accepted') return isAcceptedSubmission(sub);
    if (currentDashboardFilter === 'active') return !isAcceptedSubmission(sub) && sub.status !== 'rejected';
    return true;
  });

  if (visibleSubmissions.length === 0) {
    window.RFUI.setHTML(ganttBox, `<p class="empty-state">${t('noPipelines')}</p>`);
    return;
  }

  visibleSubmissions.forEach((sub: any, idx: number) => {
    const man = db.manuscripts.find((m: any) => m.id === sub.manuscriptId);
    const titleDisplay = window.RFUI.getPipelineTitleDisplay({
      title: man ? man.title : (sub.title || t('untitledManuscript'))
    });
    const manTitle = titleDisplay.displayTitle;
    const fullManTitle = titleDisplay.fullTitle;
    const firstAuthor = getSubmissionFirstAuthor(sub, man);
    const submissionDoi = getSubmissionDoi(sub);
    const journalName = getSubmissionJournalName(sub);
    const articleUrl = getSubmissionArticleUrl(sub);
    const analysis = analyzeSubmission(sub);
    const d = analysis.display;
    const latestType = analysis.latest ? (typeMeta[analysis.latest.type] || typeMeta.special) : { labelKey: 'typeNoEvent', color: '#64748b' };
    const latestTypeLabel = t(latestType.labelKey);

    const card = document.createElement('div');
    card.className = 'pipeline-card';
    card.style?.setProperty?.('--card-index', String(idx));

    const sortedNodes = autoSortNodes(sub.timelineNodes || []);
    let trackHtml = '';

    if (sortedNodes.length === 0) {
      trackHtml = `
        <div class="pipeline-empty-track btn-inline-add-event" data-sub-id="${sub.id}" title="${escapeHTML(t('clickAddEvent'))}">
          <span>+ ${t('addEventStart')}</span>
        </div>
      `;
    } else {
      const firstDateStr = sortedNodes[0]?.completeDate || sortedNodes[0]?.planDate || sortedNodes[0]?.dueDate;
      const firstDate = firstDateStr ? new Date(firstDateStr) : null;

      const capsules = sortedNodes.map((node: any, index: number) => {
        const computedStatus = computeNodeStatus(node);
        const icon = getCapsuleIcon(computedStatus, node.type);
        const rawDateStr = getNodeDate(node);
        const dateStr = formatShortDate(rawDateStr);

        let deltaStr = '';
        if (index > 0 && firstDate && rawDateStr) {
          const curDate = new Date(rawDateStr);
          if (!isNaN(firstDate.getTime()) && !isNaN(curDate.getTime())) {
            const diffDays = Math.round((curDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) deltaStr = `+${diffDays}${t('dayUnitShort')}`;
          }
        }

        const typeClass = `type-${node.type || 'research'}`;
        const statusLabel = getNodeStatusLabel(computedStatus);
        const dueNote = node.dueDate ? ` | ${t('deadlineShort')}: ${node.dueDate}` : '';
        const decisionNote = node.reviewDecision ? ` | ${node.reviewDecision === 'major' ? t('majorRevision') : t('minorRevision')}` : '';
        const tooltip = `${getTimelineNodeDisplayName(node)} (${statusLabel})${rawDateStr ? ' - ' + rawDateStr : ''}${dueNote}${decisionNote}${node.notes ? ': ' + node.notes : ''}`;

        return `
          <button type="button" class="stage-capsule status-${computedStatus} ${typeClass} interactive-capsule"
               data-sub-id="${sub.id}" data-node-id="${node.id}" title="${escapeHTML(tooltip)}">
            <span class="capsule-icon">${icon}</span>
            <span class="capsule-name">${escapeHTML(getTimelineNodeDisplayName(node))}</span>
            ${dateStr ? `<span class="capsule-date">${dateStr}</span>` : ''}
            ${deltaStr ? `<span class="capsule-delta">${deltaStr}</span>` : ''}
          </button>
        `;
      }).join('<div class="stage-connector"></div>');

      trackHtml = `<div class="pipeline-capsule-track">${capsules}</div>`;
    }

    const milestoneDots = d.milestones.map((m: any) => `
      <div class="milestone" title="${escapeHTML(m.name)}: ${escapeHTML(m.date || t('noDate'))}${m.node ? ' · ' + escapeHTML(t('clickEditEvent')) : ''}">
        <span class="dot ${m.date ? 'active' : ''} ${m.emphasis ? 'emphasis' : ''} ${m.today ? 'today' : ''} ${m.node ? 'interactive-dot' : ''}"
          ${m.node ? `data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(m.node.id)}"` : ''}
          style="${m.date ? `color:${m.color};border-color:${m.color};${m.emphasis ? `background:${m.color};color:#fff;` : ''}` : ''}"></span>
        <div class="m-name" style="${m.emphasis ? `color:${m.color};font-weight:750;` : ''}">${escapeHTML(m.name)}</div>
        <div class="m-date">${escapeHTML(m.date ? formatShortDate(m.date) : '—')}</div>
      </div>
    `).join('');

    const expSubmitBadge = analysis.expToSubmit !== null && d.mode !== 'prepare'
      ? `<span>${t('expSubmitShort')} <strong style="color:hsl(var(--text-primary));">${analysis.expToSubmit} ${t('days')}</strong></span>`
      : '';
    const zoteroItemKey = man?.zoteroItemKey || '';
    const zoteroBadgeHtml = zoteroItemKey ? `
      <span class="zotero-card-badge pipeline-zotero-badge" data-item-key="${escapeHTML(zoteroItemKey)}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 文献库中定位该条目' : 'Locate in Zotero library')}" style="cursor:pointer;">
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
        Zotero
      </span>
    ` : '';
    const doiMetaHtml = submissionDoi
      ? `<span>${escapeHTML(t('doiLabel'))} ${articleUrl
        ? `<a class="doi-link" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(submissionDoi)}</a>`
        : `<strong style="color:hsl(var(--text-primary));">${escapeHTML(submissionDoi)}</strong>`}</span>`
      : '';
    let countdownBadgeHtml = '';
    if (sub.revisionDueDate && !analysis.accepted && sub.status !== 'rejected') {
      const cd = window.RFCalendar?.getRevisionCountdownMeta ? window.RFCalendar.getRevisionCountdownMeta(sub.revisionDueDate) : null;
      if (cd) {
        countdownBadgeHtml = `<span class="meta-badge ${escapeHTML(cd.badgeClass)}" title="${escapeHTML(cd.title)}" style="font-weight:700;">${escapeHTML(cd.icon)} ${escapeHTML(cd.text)}</span>`;
      }
    }

    const totalEvents = analysis.events.length;
    const completedEvents = analysis.events.filter((e: any) => e.completeDate || e.status === 'completed').length;
    const progressPct = analysis.accepted
      ? 100
      : (totalEvents > 0 ? Math.min(95, Math.max(12, Math.round((completedEvents / totalEvents) * 100))) : 15);
    const progressColor = analysis.accepted
      ? '#10b981'
      : (sub.status === 'revision' ? '#f59e0b' : (sub.status === 'rejected' ? '#ef4444' : '#e11d48'));

    window.RFUI.setHTML(card, `
      <div class="pipeline-top">
        <div class="pipeline-title-block">
          <div class="title-line">
            <span class="index-badge">${idx + 1}</span>
            <span class="paper-title" ${titleDisplay.showTooltip ? `title="${escapeHTML(fullManTitle)}"` : ''}>${escapeHTML(manTitle)}</span>
            <span class="journal-pill" title="${escapeHTML(journalName)}">${escapeHTML(journalName)}</span>
            ${sub.externalManuscriptId ? `<span class="meta-badge" style="font-family:monospace; color:#6366f1; border-color:rgba(99,102,241,0.3); background:rgba(99,102,241,0.06);" title="Manuscript ID">${escapeHTML(sub.externalManuscriptId)}</span>` : ''}
            ${countdownBadgeHtml}
            ${zoteroBadgeHtml}
            ${articleUrl ? `<a class="meta-badge article-link-badge" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(t('articlePage'))}</a>` : ''}
            <span class="state-pill" style="background:${analysis.stateColor}14;color:${analysis.stateColor};border-color:${analysis.stateColor}33;">
              ${escapeHTML(analysis.stateLabel)} · ${escapeHTML(analysis.stateNote)}
            </span>
          </div>
          <div class="subline">
            <span>${escapeHTML(t('firstAuthorLabel'))} <strong style="color:hsl(var(--text-primary));">${escapeHTML(firstAuthor || t('firstAuthorNotSet'))}</strong></span>
            <span>${t('milestoneSubmission')} <strong style="color:hsl(var(--text-primary));">${escapeHTML(analysis.submitDate || '—')}</strong></span>
            <span>${t('milestoneR1Comments')} <strong style="color:hsl(var(--text-primary));">${escapeHTML(analysis.r1Date || '—')}</strong></span>
            <span>${t('milestoneAcceptance')} <strong style="color:hsl(var(--text-primary));">${escapeHTML(analysis.acceptDate || '—')}</strong></span>
            ${doiMetaHtml}
            ${expSubmitBadge}
            <span>${tf('nodesSaved', { count: analysis.events.length })}</span>
          </div>
          <div class="pipeline-progress-bar-wrap" title="Pipeline Completion: ${progressPct}%">
            <div class="pipeline-progress-bar-fill" style="width:${progressPct}%; background:${progressColor};"></div>
          </div>
        </div>
        <div class="pipeline-actions">
          <button class="btn-secondary btn-sm btn-inline-add-event" data-sub-id="${escapeHTML(sub.id)}" type="button">${t('addEvent')}</button>
          <button class="btn-secondary btn-sm btn-share-submission" data-sub-id="${escapeHTML(sub.id)}" type="button">${escapeHTML(t('shareJourney'))}</button>
          <button class="btn-secondary btn-sm btn-open-submission-detail" data-sub-id="${escapeHTML(sub.id)}" type="button">${t('openSubmissionDetails')}</button>
        </div>
      </div>

      ${buildInlineStageEditor(sub.id)}

      <div class="pipeline-middle">
        <div class="key-track">
          <div class="track-top">
            <span>${t('keyEventRail')}</span>
            <span>${d.pending ? t('countingNow') : t('completedInterval')}</span>
          </div>
          <div class="milestones" style="grid-template-columns:repeat(${d.milestones.length}, minmax(82px, 1fr));">
            ${milestoneDots}
          </div>
        </div>

        <div class="focus-metric" style="background:${d.bg};border-color:${d.border};">
          <div>
            <div class="fm-label" style="color:${d.color};">${escapeHTML(d.label)}</div>
            <div class="fm-caption">${escapeHTML(d.caption)}</div>
          </div>
          <div class="fm-value" style="color:${d.color};">
            ${d.value ?? '—'}<span class="unit">${d.value !== null && d.value !== undefined ? t('days') : ''}</span>
          </div>
        </div>

        <div class="latest-box">
          <div>
            <div class="lb-head">
              <span class="lb-title">${t('latestEvent')}</span>
              <span class="type-pill" style="background:${latestType.color}14;color:${latestType.color};border-color:${latestType.color}33;">${escapeHTML(latestTypeLabel)}</span>
            </div>
            <div class="lb-event">${escapeHTML(analysis.latest ? getTimelineNodeDisplayName(analysis.latest) : t('noEventYet'))}</div>
          </div>
          <div class="lb-meta">
            <span>${escapeHTML(analysis.latest ? (getNodeDate(analysis.latest) || t('noDate')) : '')}</span>
            <span>${escapeHTML(analysis.latest?.notes || '')}</span>
          </div>
        </div>
      </div>

      ${trackHtml}
      ${buildTimelineEventManager(sub)}
    `);

    ganttBox.appendChild(card);
    bindPipelineCardInteractions(card, sub);
  });
}




