/**
 * Zotero PaperFlow - Dashboard 4-Column Event Rail Card Builder
 */
import {
  getSubmissionFirstAuthor,
  getSubmissionDoi,
  getSubmissionJournalName,
  getSubmissionArticleUrl,
  getNodeDate
} from './field-helpers.js';

import { bindPipelineCardInteractions } from './card-interactions.js';

declare const currentLanguage: string;
declare function t(key: string): string;
declare function tf(key: string, vars?: Record<string, any>): string;
declare function escapeHTML(str: any): string;
declare function formatShortDate(dateStr: any): string;
declare function analyzeSubmission(sub: any): any;
declare function autoSortNodes(nodes: any[]): any[];
declare function computeNodeStatus(node: any): string;
declare function getTimelineTypeMeta(type: string): any;
declare function getRelativeDateLabel(dateStr: string): string;
declare function isReviewTimelineNode(node: any): boolean;
declare function getReviewDecisionLabel(decision: string): string;
declare function normalizeSubmissionStatus(status: string): string;
declare function getTimelineNodeDisplayName(node: any): string;
declare function buildInlineStageEditor(subId: string): string;

export function buildPipelineEventCard(
  sub: any,
  man: any,
  index: number,
  displayIndex: number
): HTMLElement {
  const w = window as any;
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
    const hasOverdue = sortedNodes.some((n: any) => {
      const s = computeNodeStatus(n);
      return s === 'overdue' || s === 'blocked';
    });
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
        <span class="submission-index" title="${escapeHTML(t('submissionRound') || '序号')}">${displayIndex}</span>
        <div class="journal" title="${escapeHTML(journalName)}">${escapeHTML(journalName)}</div>
        ${sub.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:10px; padding:1px 6px; border-radius:3px;" title="Manuscript ID: ${escapeHTML(sub.externalManuscriptId)}">ID: ${escapeHTML(sub.externalManuscriptId)}</span>` : ''}
        <span class="pipeline-compact-status" style="--state-color:${a.stateColor}">${escapeHTML(a.stateLabel)}</span>
        <button type="button" class="btn-sm btn-quick-add-event" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('addEvent'))}" aria-label="${escapeHTML(t('addEvent'))}: ${escapeHTML(manTitle)}">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
          <span>${escapeHTML(t('addEvent'))}</span>
        </button>
        <button type="button" class="btn-pipeline-share btn-quick-share" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('shareJourney'))}" aria-label="${escapeHTML(t('shareJourney'))}: ${escapeHTML(manTitle)}">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>
          <span>${escapeHTML(t('shareJourney'))}</span>
        </button>
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
          <span class="zotero-card-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" data-library-id="${escapeHTML(man.zoteroLibraryID || '')}" title="${escapeHTML((w.currentLanguage || 'zh') === 'zh' ? '在 Zotero 文献库中选中此条目' : 'Select in Zotero library')}" style="margin-left: 6px;">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
            Zotero
          </span>
          ${man.citekey ? `<span class="zotero-citekey-badge" data-citekey="${escapeHTML(man.citekey)}" title="${escapeHTML(currentLanguage === 'zh' ? '点击复制 Citation Key' : 'Click to copy Citation Key')}">[@${escapeHTML(man.citekey)}]</span>` : ''}
          ${man.pdfUri ? `<span class="zotero-pdf-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" data-library-id="${escapeHTML(man.zoteroLibraryID || '')}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 阅读器中打开 PDF' : 'Open PDF in Zotero reader')}">📖 PDF</span>` : ''}
        ` : ''}
      </div>
      <div class="pipeline-actions" style="margin-top: 10px; display: flex !important; gap: 8px !important; flex-wrap: wrap !important; visibility: visible !important;">
        <button type="button" class="btn-secondary btn-sm btn-pipeline-open" data-sub-id="${escapeHTML(sub.id)}" aria-label="${escapeHTML(t('openSubmissionDetails'))}: ${escapeHTML(manTitle)}">${escapeHTML(t('openSubmissionDetails'))}</button>
        <button type="button" class="btn-secondary btn-sm btn-pipeline-add" data-sub-id="${escapeHTML(sub.id)}" style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: #4f46e5; border-color: rgba(99, 102, 241, 0.35);">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
          <span>${t('addEvent')}</span>
        </button>
        <button type="button" class="btn-secondary btn-sm btn-pipeline-manage" data-sub-id="${escapeHTML(sub.id)}">${t('manageEvents')}</button>
        <button type="button" class="btn-secondary btn-sm btn-pipeline-share" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('shareJourney'))}" aria-label="${escapeHTML(t('shareJourney'))}: ${escapeHTML(manTitle)}" style="display: inline-flex; align-items: center; gap: 5px; color: #0891b2; border-color: rgba(6, 182, 212, 0.4); font-weight: 600;">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>
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

  bindPipelineCardInteractions(card, sub);
  return card;
}
