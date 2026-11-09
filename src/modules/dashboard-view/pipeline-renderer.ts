/**
 * Zotero PaperFlow - Dashboard KPI Cards, Timeline Gantt & Alerts Renderer
 */
import {
  getSubmissionFirstAuthor,
  getSubmissionDoi,
  getSubmissionJournalName,
  getSubmissionArticleUrl,
  getNodeDate,
  sortDashboardSubmissions
} from './field-helpers.js';

import {
  setPipelineViewMode,
  updatePipelineViewToggle,
  getDashboardFilterLabel
} from './transfer-and-status.js';

import { renderTimelineAlerts } from './timeline-alerts.js';
import { bindPipelineCardInteractions } from './card-interactions.js';
export { renderTimelineAlerts };

export function bindDashboardControls(): void {
  const toggleBtn = document.getElementById('btn-pipeline-view-toggle');
  if (toggleBtn && !toggleBtn.dataset.bound) {
    toggleBtn.dataset.bound = 'true';
    toggleBtn.addEventListener('click', (e: Event) => {
      e.preventDefault();
      const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
      setPipelineViewMode(!Boolean(g.isPipelineExpanded));
    });
  }

  const compactBtn = document.getElementById('btn-pipeline-compact');
  if (compactBtn && !compactBtn.dataset.bound) {
    compactBtn.dataset.bound = 'true';
    compactBtn.addEventListener('click', () => setPipelineViewMode(false));
  }

  const expandedBtn = document.getElementById('btn-pipeline-expanded');
  if (expandedBtn && !expandedBtn.dataset.bound) {
    expandedBtn.dataset.bound = 'true';
    expandedBtn.addEventListener('click', () => setPipelineViewMode(true));
  }
}

declare var db: any;
declare var currentLanguage: string;
declare var currentDashboardFilter: string;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function escapeHTML(value: any): string;
declare function analyzeSubmission(sub: any): any;
declare function isAcceptedSubmission(sub: any): boolean;
declare function computeNodeStatus(node: any): string;
declare function autoSortNodes(nodes: any[]): any[];
declare function buildDefaultSubmissionTimeline(sub: any): any[];
declare function normalizeSubmissionTimeline(sub: any): boolean;
declare function buildInlineStageEditor(subId: string): string;
declare function getTimelineTypeMeta(type: string): { color: string; label: string };
declare function getRelativeDateLabel(dateStr: string): string;
declare function isReviewTimelineNode(node: any): boolean;
declare function getReviewDecisionLabel(decision: string): string;
declare function normalizeSubmissionStatus(status: any): string;
declare function getTimelineNodeDisplayName(node: any): string;
declare function formatShortDate(dateStr: any): string;
declare function applyLanguage(): void;

export function renderDashboard(): void {
  const w = window as any;
  if (w.RFUI?.isViewDeferred?.('view-dashboard')) return;

  const manuscriptsById = new Map((db.manuscripts || []).map((manuscript: any) => [manuscript.id, manuscript]));
  // Calculate interactive stats counts
  const allSubmissions = db.submissions || [];
  const visibleSubmissions = allSubmissions.filter((s: any) => s.status !== 'rejected');
  let timelineChanged = false;
  visibleSubmissions.forEach((sub: any) => {
    if (!Array.isArray(sub.timelineNodes) || sub.timelineNodes.length === 0) {
      sub.timelineNodes = typeof buildDefaultSubmissionTimeline === 'function' ? buildDefaultSubmissionTimeline(sub) : [];
      timelineChanged = true;
    }
    if (typeof normalizeSubmissionTimeline === 'function') {
      timelineChanged = normalizeSubmissionTimeline(sub) || timelineChanged;
    }
  });

  const acceptedCount = visibleSubmissions.filter((s: any) => isAcceptedSubmission(s)).length;
  const activeCount = visibleSubmissions.filter((s: any) => !isAcceptedSubmission(s)).length;
  const totalCount = allSubmissions.length;

  const statAccepted = document.getElementById('stat-accepted-submissions');
  if (statAccepted) statAccepted.textContent = String(acceptedCount);
  const statActive = document.getElementById('stat-active-submissions');
  if (statActive) statActive.textContent = String(activeCount);
  const statTotal = document.getElementById('stat-total-submissions');
  if (statTotal) statTotal.textContent = String(totalCount);
  const filterLabel = document.getElementById('dashboard-filter-label');
  if (filterLabel) filterLabel.textContent = getDashboardFilterLabel();

  // Calculate top summary metrics per manuscript (各个稿件的平均值)
  const manuscriptPipelines: any[] = [];
  const processedSubIds = new Set();

  (db.manuscripts || []).forEach((man: any) => {
    const sub = w.RFCore?.getCurrentSubmission?.(db, man.id);
    if (sub && sub.status !== 'rejected') {
      manuscriptPipelines.push({ manuscript: man, submission: sub });
      processedSubIds.add(sub.id);
    }
  });

  (db.submissions || []).forEach((sub: any) => {
    if (sub.status !== 'rejected' && !processedSubIds.has(sub.id)) {
      if (!sub.manuscriptId || !manuscriptsById.has(sub.manuscriptId)) {
        manuscriptPipelines.push({ manuscript: null, submission: sub });
        processedSubIds.add(sub.id);
      }
    }
  });

  const analyses = manuscriptPipelines.map((p: any) => analyzeSubmission(p.submission));
  const expSubmit = analyses.map((a: any) => a.expToSubmit).filter((v: any) => v !== null && !isNaN(v) && v >= 0);
  const submitNow = analyses.filter((a: any) => !a.accepted).map((a: any) => a.submitToNow).filter((v: any) => v !== null && !isNaN(v) && v >= 0);
  const r1Now = analyses.filter((a: any) => !a.accepted).map((a: any) => a.r1ToNow).filter((v: any) => v !== null && !isNaN(v) && v >= 0);
  const submitAccept = analyses.filter((a: any) => a.accepted).map((a: any) => a.submitToAccept).filter((v: any) => v !== null && !isNaN(v) && v >= 0);

  if (typeof applyLanguage === 'function') applyLanguage();
  const avgText = (arr: number[]) => arr.length ? `${Math.round(arr.reduce((s: number, n: number) => s + n, 0) / arr.length)}${t('dayUnitShort')}` : '—';

  const elExpSubmit = document.getElementById('mExpSubmit');
  if (elExpSubmit) {
    elExpSubmit.textContent = avgText(expSubmit);
    elExpSubmit.parentElement?.setAttribute('title', currentLanguage === 'zh'
      ? `各个稿件平均值：基于 ${expSubmit.length} 篇有实验记录的稿件`
      : `Average across manuscripts: based on ${expSubmit.length} manuscripts with experiment records`);
  }
  const elSubmitNow = document.getElementById('mSubmitNow');
  if (elSubmitNow) {
    elSubmitNow.textContent = avgText(submitNow);
    elSubmitNow.parentElement?.setAttribute('title', currentLanguage === 'zh'
      ? `各个稿件平均值：基于 ${submitNow.length} 篇在审稿件`
      : `Average across manuscripts: based on ${submitNow.length} manuscripts in review`);
  }
  const elR1Now = document.getElementById('mR1Now');
  if (elR1Now) {
    elR1Now.textContent = avgText(r1Now);
    elR1Now.parentElement?.setAttribute('title', currentLanguage === 'zh'
      ? `各个稿件平均值：基于 ${r1Now.length} 篇一审修回中的稿件`
      : `Average across manuscripts: based on ${r1Now.length} manuscripts awaiting post-R1 decisions`);
  }
  const elSubmitAccept = document.getElementById('mSubmitAccept');
  if (elSubmitAccept) {
    elSubmitAccept.textContent = avgText(submitAccept);
    elSubmitAccept.parentElement?.setAttribute('title', currentLanguage === 'zh'
      ? `各个稿件平均值：基于 ${submitAccept.length} 篇已接收/发表的稿件`
      : `Average across manuscripts: based on ${submitAccept.length} accepted manuscripts`);
  }

  // 1. Pipeline Timeline Cards
  const ganttBox = document.getElementById('dashboard-gantt');
  if (!ganttBox) return;
  updatePipelineViewToggle();
  bindDashboardControls();
  w.RFUI.setHTML(ganttBox, '');

  let submissionsList = visibleSubmissions;
  if (currentDashboardFilter === 'accepted') {
    submissionsList = submissionsList.filter(isAcceptedSubmission);
  } else if (currentDashboardFilter === 'active') {
    submissionsList = submissionsList.filter((s: any) => !isAcceptedSubmission(s));
  }
  submissionsList = sortDashboardSubmissions(submissionsList);

  if (submissionsList.length === 0) {
    w.RFUI.setHTML(ganttBox, `<p class="empty-state">${t('noPipelines')}</p>`);
  } else {
    submissionsList.forEach((sub: any, index: number) => {
      const displayIndex = submissionsList.length - index;
      const man = manuscriptsById.get(sub.manuscriptId) as any;
      const manTitle = man ? man.title : (sub.title || t('untitledManuscript'));
      const journalName = getSubmissionJournalName(sub);
      const firstAuthor = getSubmissionFirstAuthor(sub, man);

      // Analyze submission via the unified helper
      const a = analyzeSubmission(sub);

      // Determine visual stage category borders
      let stageClass = 'stage-active';
      if (a.accepted || sub.status === 'accepted' || sub.status === 'published') {
        stageClass = 'stage-accepted';
      } else if ((sub.status || '').includes('revision')) {
        stageClass = 'stage-revision';
      } else {
        const sortedNodes = autoSortNodes(sub.timelineNodes || []);
        const hasOverdue = sortedNodes.some((n: any) => { const s = computeNodeStatus(n); return s === 'overdue' || s === 'blocked'; });
        if (hasOverdue) stageClass = 'stage-exception';
      }

      // Build premium 4-column event rail card matching the reference design
      const card = document.createElement('div');
      card.className = `pipeline-card ${stageClass}`;
      card.style?.setProperty?.('--card-index', String(index));
      card.style?.setProperty?.('--state-color', a.stateColor);

      const latestMeta = a.latest ? getTimelineTypeMeta(a.latest.type) : { color: '#64748b', label: t('typeNoEvent') };
      const latestDate = a.latest ? getNodeDate(a.latest) : '';
      const latestRelative = latestDate ? getRelativeDateLabel(latestDate) : '';
      const reviewNode = [...(sub.timelineNodes || [])]
        .filter((node: any) => isReviewTimelineNode(node) && node.dueDate)
        .sort((left: any, right: any) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0];
      const reviewDeadlineHtml = reviewNode
        ? `<div class="latest-deadline ${computeNodeStatus(reviewNode) === 'overdue' ? 'is-overdue' : ''}">${escapeHTML(t('eventDeadline'))}：${escapeHTML(formatShortDate(reviewNode.dueDate))}${reviewNode.reviewDecision ? ` · ${escapeHTML(getReviewDecisionLabel(reviewNode.reviewDecision))}` : ''}</div>`
        : '';
      const submissionDoi = getSubmissionDoi(sub);
      const articleUrl = getSubmissionArticleUrl(sub);
      const doiHtml = submissionDoi
        ? `<a class="doi-link" href="${escapeHTML(articleUrl || `https://doi.org/${submissionDoi}`)}" target="_blank" rel="noopener noreferrer">${t('doiLabel')}: ${escapeHTML(submissionDoi)}</a>`
        : (articleUrl
          ? `<a class="doi-link" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${t('articlePage')}</a>`
          : `<span class="doi-missing">${t('doiNotSet')}</span>`);

      // Col 2 Event Rail details
      const milestones = a.display.milestones.filter((m: any) => m.name && m.date !== undefined);
      const count = Math.max(2, milestones.length);
      const timelineIsActive = a.display.pending &&
        ['submitted', 'under_review', 'revision'].includes(normalizeSubmissionStatus(sub.status));

      let railHtml = `
        <div class="event-rail ${timelineIsActive ? 'is-tracking' : ''}" style="--count:${count}">
          <div class="rail-track ${a.display.pending ? 'pending' : ''}"></div>
      `;

      milestones.forEach((m: any) => {
        const isInteractive = Boolean(m.node);
        railHtml += `
          <div class="milestone">
            <div class="dot-wrap">
              <div class="dot ${m.emphasis ? 'emphasis' : ''} ${m.today ? 'today' : ''} ${isInteractive ? 'interactive-dot' : ''}"
                   style="--dot-color:${m.color || a.display.color}; ${isInteractive ? 'cursor: pointer;' : ''}"
                   ${isInteractive ? `data-node-id="${escapeHTML(m.node.id)}" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('clickEditEvent'))}: ${escapeHTML(m.name)}"` : ''}></div>
            </div>
            <div class="milestone-name">${escapeHTML(m.name)}</div>
            <div class="milestone-date">${m.date ? formatShortDate(m.date) : '—'}</div>
          </div>
        `;
      });

      railHtml += `
        </div>
        <div class="rail-caption">
          <span>${t('keyEventRail')}</span>
          <span class="caption-highlight">${a.display.pending ? t('countingNow') : t('completedInterval')}</span>
        </div>
      `;

      w.RFUI.setHTML(card, `
        <!-- Col 1: Manuscript Info -->
        <div class="project-info">
          <div class="project-heading-row">
            <span class="submission-index">${displayIndex}</span>
            <div class="journal" title="${escapeHTML(journalName)}">${escapeHTML(journalName)}</div>
            ${sub.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:10px; padding:1px 6px; border-radius:3px;" title="Manuscript ID: ${escapeHTML(sub.externalManuscriptId)}">ID: ${escapeHTML(sub.externalManuscriptId)}</span>` : ''}
            <span class="pipeline-compact-status" style="--state-color:${a.stateColor}">${escapeHTML(a.stateLabel)}</span>
          </div>
          <h3 class="project-title" title="${escapeHTML(manTitle)}">${escapeHTML(manTitle)}</h3>
          <div class="project-meta">
            <span>${tf('nodesSaved', { count: (sub.timelineNodes || []).length })}</span>
            <span>${t('timelineSortedBySubmissionDate')}: ${a.submitDate ? escapeHTML(formatShortDate(a.submitDate)) : t('noDate')}</span>
            <span>${t('expSubmitShort')} ${a.expToSubmit === null ? '—' : a.expToSubmit + t('dayUnitShort')}</span>
            <span>${t('timelineDateSource')}: ${escapeHTML(a.submitDateSource)}</span>
            <span class="pipeline-first-author ${firstAuthor ? '' : 'is-empty'}" title="${escapeHTML(t('firstAuthorLabel'))}: ${escapeHTML(firstAuthor || t('firstAuthorNotSet'))}">
              <span class="pipeline-first-author-label">${escapeHTML(t('firstAuthorLabel'))}:</span>
              <strong>${escapeHTML(firstAuthor || t('firstAuthorNotSet'))}</strong>
            </span>
          </div>
          <div class="pipeline-link-row">
            ${doiHtml}
            ${man?.zoteroItemKey ? `
              <span class="zotero-card-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" data-library-id="${escapeHTML(man.zoteroLibraryID || '')}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 文献库中选中此条目' : 'Select in Zotero library')}" style="margin-left: 6px;">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
                Zotero
              </span>
              ${man.citekey ? `<span class="zotero-citekey-badge" data-citekey="${escapeHTML(man.citekey)}" title="${escapeHTML(currentLanguage === 'zh' ? '点击复制 Citation Key' : 'Click to copy Citation Key')}">[@${escapeHTML(man.citekey)}]</span>` : ''}
              ${man.pdfUri ? `<span class="zotero-pdf-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" data-library-id="${escapeHTML(man.zoteroLibraryID || '')}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 阅读器中打开 PDF' : 'Open PDF in Zotero reader')}">📖 PDF</span>` : ''}
            ` : ''}
          </div>
          <div class="pipeline-actions" style="margin-top: 12px; display: flex; gap: 8px;">
            <button type="button" class="btn-secondary btn-sm btn-pipeline-open" data-sub-id="${escapeHTML(sub.id)}" aria-label="${escapeHTML(t('openSubmissionDetails'))}: ${escapeHTML(manTitle)}">${escapeHTML(t('openSubmissionDetails'))}</button>
            <button class="btn-secondary btn-sm btn-pipeline-add" data-sub-id="${escapeHTML(sub.id)}">${t('addEvent')}</button>
            <button class="btn-secondary btn-sm btn-pipeline-manage" data-sub-id="${escapeHTML(sub.id)}">${t('manageEvents')}</button>
            <button class="btn-secondary btn-sm btn-pipeline-share" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('shareJourney'))}" aria-label="${escapeHTML(t('shareJourney'))}: ${escapeHTML(manTitle)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>
              <span>${escapeHTML(t('shareJourney'))}</span>
            </button>
          </div>
        </div>

        <!-- Col 2: Middle Core Panel -->
        <div class="core-panel" style="--panel-color:${a.display.color}; --panel-bg:${a.display.bg}; --panel-border:${a.display.border}">
          <div class="core-head">
            <div>
              <div class="core-label">${escapeHTML(a.display.label)}</div>
              <div class="core-sub">${escapeHTML(a.display.caption)}</div>
            </div>
            <div class="core-value"><strong>${a.display.value === null ? '—' : a.display.value}</strong><span>${t('days')}</span></div>
          </div>
          ${railHtml}
        </div>

        <!-- Col 3: Latest Node Window -->
        <div class="latest-window" data-sub-id="${escapeHTML(sub.id)}" data-latest-id="${a.latest ? escapeHTML(a.latest.id) : ''}">
          <div class="latest-head">
            <span>${t('latestEvent')}</span>
            <span class="node-type" style="--node-color:${latestMeta.color}">${escapeHTML(latestMeta.label)}</span>
          </div>
          <div class="latest-title">${a.latest ? escapeHTML(getTimelineNodeDisplayName(a.latest)) : t('noEventYet')}</div>
          <div class="latest-date">${a.latest ? `${latestDate ? escapeHTML(formatShortDate(latestDate)) : t('noDate')}${latestRelative ? ` · ${escapeHTML(latestRelative)}` : ''}` : t('addEventStart')}</div>
          ${reviewDeadlineHtml}
          <div class="latest-note">${a.latest ? escapeHTML(a.latest.notes || t('clickEditEvent')) : t('clickAddEvent')}</div>
        </div>

        <!-- Col 4: State Box -->
        <div class="state-box">
          <span class="state-pill" style="--state-color:${a.stateColor}">${escapeHTML(a.stateLabel)}</span>
          <div class="state-note">${escapeHTML(a.stateNote)}</div>
        </div>
        ${buildInlineStageEditor(sub.id)}
      `);

      ganttBox.appendChild(card);
      bindPipelineCardInteractions(card, sub);
    });
  }

  // 3. Timeline alerts and review milestones
  renderTimelineAlerts();
}
