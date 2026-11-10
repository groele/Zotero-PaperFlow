/**
 * Zotero PaperFlow - Dashboard KPI Cards, Timeline Gantt & Alerts Renderer
 */
import { sortDashboardSubmissions } from './field-helpers.js';
import {
  setPipelineViewMode,
  updatePipelineViewToggle,
  getDashboardFilterLabel
} from './transfer-and-status.js';
import { renderTimelineAlerts } from './timeline-alerts.js';
import { buildPipelineEventCard } from './event-card-builder.js';
import { reconcilePipelineCards } from './card-cache.js';

export { renderTimelineAlerts };

declare const db: any;
declare const currentLanguage: string;
declare function t(key: string): string;
declare function applyLanguage(): void;
declare function analyzeSubmission(sub: any): any;
declare function isAcceptedSubmission(sub: any): boolean;

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

  // Dashboard filter buttons
  const filterMap: Record<string, string> = {
    'card-filter-accepted': 'accepted',
    'card-filter-active': 'active',
    'card-filter-all': 'all'
  };
  Object.entries(filterMap).forEach(([id, filter]) => {
    const btn = document.getElementById(id);
    if (btn && !btn.dataset.filterBound) {
      btn.dataset.filterBound = 'true';
      btn.dataset.filter = filter;
      btn.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
        g.currentDashboardFilter = filter;
        renderDashboard();
      });
    }
  });
}

export function renderDashboard(): void {
  const w = window as any;
  if (w.RFUI?.isViewDeferred?.('view-dashboard')) return;

  const currentDashboardFilter = w.currentDashboardFilter || 'all';
  const database = w.db || (typeof db !== 'undefined' ? db : null) || {};
  const manuscriptsById = new Map((database.manuscripts || []).map((m: any) => [m.id, m]));
  const visibleManuscripts = database.manuscripts || [];
  const allSubmissions = (database.submissions || []).filter((s: any) => !s.deleted && !s.isDeleted);
  const visibleSubmissions = allSubmissions.filter((s: any) => s.status !== 'rejected');

  // 0. Update top 3 KPI stat counters and interactive filter cards
  const checkAccepted = (s: any): boolean => {
    if (!s) return false;
    if (typeof isAcceptedSubmission === 'function') {
      try { return isAcceptedSubmission(s); } catch (_) {}
    }
    const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
    if (typeof g.isAcceptedSubmission === 'function') {
      try { return g.isAcceptedSubmission(s); } catch (_) {}
    }
    if (typeof g.analyzeSubmission === 'function') {
      try { return Boolean(g.analyzeSubmission(s)?.accepted); } catch (_) {}
    }
    const st = String(s.status || '').toLowerCase();
    return st === 'accepted' || st === 'published';
  };

  const acceptedCount = visibleSubmissions.filter(checkAccepted).length;
  const activeCount = visibleSubmissions.filter((s: any) => !checkAccepted(s)).length;
  const totalCount = allSubmissions.length;

  const setStat = (id: string, val: number) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof w.RFUI?.animateMetricValue === 'function') {
      w.RFUI.animateMetricValue(el, val);
    } else {
      el.textContent = String(val);
    }
  };
  setStat('stat-accepted-submissions', acceptedCount);
  setStat('stat-active-submissions', activeCount);
  setStat('stat-total-submissions', totalCount);

  const filterCards = [
    { id: 'card-filter-accepted', filter: 'accepted' },
    { id: 'card-filter-active', filter: 'active' },
    { id: 'card-filter-all', filter: 'all' }
  ];
  filterCards.forEach(({ id, filter }) => {
    const el = document.getElementById(id);
    if (el) {
      const isActive = currentDashboardFilter === filter;
      el.classList.toggle('active', isActive);
      el.setAttribute('aria-pressed', String(isActive));
    }
  });
  const filterLabelEl = document.getElementById('dashboard-filter-label');
  if (filterLabelEl) filterLabelEl.textContent = getDashboardFilterLabel();

  // Group by manuscript: select canonical submission or keep independent
  const processedSubIds = new Set<string>();
  const manuscriptPipelines: any[] = [];

  visibleManuscripts.forEach((m: any) => {
    const canonicalSub = w.RFCore?.getCurrentSubmission?.(database, m.id);
    if (canonicalSub && !canonicalSub.deleted && !canonicalSub.isDeleted) {
      manuscriptPipelines.push({ manuscript: m, submission: canonicalSub });
      processedSubIds.add(canonicalSub.id);
    }
  });

  visibleSubmissions.forEach((sub: any) => {
    if (!processedSubIds.has(sub.id)) {
      const man = manuscriptsById.get(sub.manuscriptId);
      if (man) {
        manuscriptPipelines.push({ manuscript: man, submission: sub });
        processedSubIds.add(sub.id);
      } else {
        manuscriptPipelines.push({ manuscript: null, submission: sub });
        processedSubIds.add(sub.id);
      }
    }
  });

  const analysisById = new Map<string, any>();
  const analyzeCached = (sub: any) => {
    if (!analysisById.has(sub.id)) analysisById.set(sub.id, analyzeSubmission(sub));
    return analysisById.get(sub.id);
  };
  const analyses = manuscriptPipelines.map((p: any) => analyzeCached(p.submission));
  const expSubmit = analyses.map((a: any) => a.expToSubmit).filter((v: any) => v !== null && !isNaN(v) && v >= 0);
  const submitNow = analyses.filter((a: any) => !a.accepted).map((a: any) => a.submitToNow).filter((v: any) => v !== null && !isNaN(v) && v >= 0);
  const r1Now = analyses.filter((a: any) => !a.accepted).map((a: any) => a.r1ToNow).filter((v: any) => v !== null && !isNaN(v) && v >= 0);
  const submitAccept = analyses.filter((a: any) => a.accepted).map((a: any) => a.submitToAccept).filter((v: any) => v !== null && !isNaN(v) && v >= 0);

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

  let submissionsList = visibleSubmissions;
  if (currentDashboardFilter === 'accepted') {
    submissionsList = submissionsList.filter(checkAccepted);
  } else if (currentDashboardFilter === 'active') {
    submissionsList = submissionsList.filter((s: any) => !checkAccepted(s));
  }
  submissionsList = sortDashboardSubmissions(submissionsList);

  if (submissionsList.length === 0) {
    reconcilePipelineCards(ganttBox, []);
    w.RFUI.setHTML(ganttBox, `<p class="empty-state">${t('noPipelines')}</p>`);
  } else {
    const day = new Date().toDateString();
    reconcilePipelineCards(ganttBox, submissionsList.map((sub: any, index: number) => {
      const displayIndex = submissionsList.length - index;
      const man = manuscriptsById.get(sub.manuscriptId) as any;
      return {
        key: sub.id,
        signature: JSON.stringify([sub, man, currentLanguage, day, index, displayIndex]),
        create: () => buildPipelineEventCard(sub, man, index, displayIndex, analyzeCached(sub)),
      };
    }));
  }

  // 3. Timeline alerts and review milestones
  renderTimelineAlerts();
}
