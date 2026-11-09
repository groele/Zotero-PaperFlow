/**
 * Zotero PaperFlow - Submission Rejection, Transfer & Manuscript Sync State Helpers
 */
import {
  todayString,
  normalizeDateString,
  dateInputToIso,
  createTimelineNode,
  getSubmissionJournalName
} from './field-helpers.js';

declare var db: any;
declare var currentDashboardFilter: string;
declare var isPipelineExpanded: boolean;
declare var ZoteroBridge: any;
declare var RFPlatform: any;
declare function t(key: string): string;
declare function inferKey(node: any): string;
declare function getTimelineNodeByKey(sub: any, key: string): any;
declare function initializeSubmissionTimelineNodes(sub: any): void;
declare function clearPublicationLinkFields(sub: any): boolean;
declare function clearPublicationTimelineCompletion(sub: any): boolean;
declare function renderDashboard(): void;

export function markSubmissionRejected(sub: any, rejectionDate = todayString(), note = ''): void {
  if (!sub) return;
  const cleanDate = normalizeDateString(rejectionDate) || todayString();
  sub.status = 'rejected';
  sub.decisionDate = null;
  sub.acceptedAt = null;
  sub.publishedAt = null;
  sub.rejectedAt = dateInputToIso(cleanDate);
  sub.rejectionNote = note || sub.rejectionNote || '';
  clearPublicationLinkFields(sub);
  clearPublicationTimelineCompletion(sub);

  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
  let rejectNode = getTimelineNodeByKey(sub, 'rejected');
  if (rejectNode) {
    rejectNode.status = 'completed';
    rejectNode.type = 'rejection';
    rejectNode.key = 'rejected';
    rejectNode.completeDate = cleanDate;
    if (note) rejectNode.notes = note;
    rejectNode.updatedAt = new Date().toISOString();
  } else {
    sub.timelineNodes.push(createTimelineNode(sub.id, {
      key: 'rejected',
      name: 'Rejected',
      type: 'rejection',
      status: 'completed',
      completeDate: cleanDate,
      notes: note
    }));
  }
  sub.updatedAt = new Date().toISOString();
}

export function syncManuscriptStatusFromSubmission(sub: any, database = db): boolean {
  if (!sub?.manuscriptId || !database || !Array.isArray(database.manuscripts)) return false;
  const man = database.manuscripts.find((m: any) => m.id === sub.manuscriptId);
  if (!man) return false;
  const currentSub = window.RFCore.getCurrentSubmission(database, man.id) || sub;
  const nextStatus = window.RFCore.deriveManuscriptStatusFromSubmission(currentSub, man.status);
  if (!nextStatus || man.status === nextStatus) return false;
  man.status = nextStatus;
  man.updatedAt = new Date().toISOString();
  return true;
}

export function syncManuscriptStatusesFromSubmissions(database = db): boolean {
  if (!database || !Array.isArray(database.manuscripts)) return false;
  let changed = false;
  database.manuscripts.forEach((manuscript: any) => {
    const currentSub = window.RFCore.getCurrentSubmission(database, manuscript.id);
    if (!currentSub) return;
    const nextStatus = window.RFCore.deriveManuscriptStatusFromSubmission(currentSub, manuscript.status);
    if (nextStatus && manuscript.status !== nextStatus) {
      manuscript.status = nextStatus;
      manuscript.updatedAt = new Date().toISOString();
      changed = true;
    }
  });
  return changed;
}

export function clearOnlinePublicationCompletion(sub: any): boolean {
  if (!sub) return false;
  let changed = Boolean(sub.publishedAt);
  sub.publishedAt = null;
  (sub.timelineNodes || []).forEach((node: any) => {
    if (inferKey(node) !== 'online') return;
    if (node.completeDate || node.status === 'completed') changed = true;
    node.completeDate = '';
    node.status = 'pending';
  });
  return changed;
}

export function syncLinkedSubmissionsFromManuscript(man: any, database = db): boolean {
  if (!man?.id || !database || !Array.isArray(database.submissions)) return false;
  const currentSub = window.RFCore.getCurrentSubmission(database, man.id);
  if (!currentSub) return false;

  const targetSubStatus = window.RFCore.deriveSubmissionStatusFromManuscript(man.status, currentSub.status);
  if (!targetSubStatus) return false;

  const today = todayString();
  let changed = false;
  if (targetSubStatus === 'rejected') {
    markSubmissionRejected(currentSub, today);
    changed = true;
  } else if (currentSub.status !== targetSubStatus) {
    const previousSubStatus = currentSub.status;
    currentSub.status = targetSubStatus;
    if (targetSubStatus === 'accepted') {
      currentSub.decisionDate = currentSub.decisionDate || dateInputToIso(today);
      currentSub.acceptedAt = currentSub.acceptedAt || currentSub.decisionDate;
      if (previousSubStatus === 'published') clearOnlinePublicationCompletion(currentSub);
    } else if (targetSubStatus === 'published') {
      currentSub.decisionDate = currentSub.decisionDate || dateInputToIso(today);
      currentSub.acceptedAt = currentSub.acceptedAt || currentSub.decisionDate;
      currentSub.publishedAt = currentSub.publishedAt || dateInputToIso(today);
    } else {
      currentSub.decisionDate = null;
      currentSub.acceptedAt = null;
      currentSub.publishedAt = null;
      clearPublicationLinkFields(currentSub);
      clearPublicationTimelineCompletion(currentSub);
    }
    currentSub.updatedAt = new Date().toISOString();
    changed = true;
  }

  return changed;
}

export function createTransferredSubmission(sourceSub: any, targetJournal: string, submissionDate = todayString(), journalUrl = ''): any {
  const newId = 'sub_' + Math.random().toString(36).substring(2, 9);
  const cleanSubmitDate = normalizeDateString(submissionDate) || todayString();
  const baseNodes = (sourceSub?.timelineNodes || [])
    .filter((node: any) => node.type === 'research' || node.type === 'writing' || ['experiment_start', 'experiment_done', 'draft_done'].includes(inferKey(node)))
    .map((node: any) => createTimelineNode(newId, {
      key: inferKey(node),
      name: node.name,
      type: node.type,
      status: 'completed',
      planDate: node.planDate,
      dueDate: node.dueDate,
      completeDate: node.completeDate || node.planDate || node.dueDate,
      notes: node.notes
    }));

  const newSub: any = {
    id: newId,
    userId: sourceSub?.userId || 'user',
    manuscriptId: sourceSub?.manuscriptId || null,
    projectId: sourceSub?.projectId || null,
    targetJournal,
    journalUrl: journalUrl || null,
    doi: null,
    articleUrl: null,
    status: 'submitted',
    submissionDate: dateInputToIso(cleanSubmitDate),
    decisionDate: null,
    revisionDueDate: null,
    firstDecisionDate: null,
    previousSubmissionId: sourceSub?.id || null,
    previousJournal: sourceSub ? getSubmissionJournalName(sourceSub) : null,
    round: (sourceSub?.round || 1) + 1,
    complianceChecklist: {},
    reviewMatrix: [],
    timelineNodes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  initializeSubmissionTimelineNodes(newSub);
  if (baseNodes.length) {
    const nonPrepNodes = newSub.timelineNodes.filter((n: any) => n.type !== 'research' && n.type !== 'writing');
    newSub.timelineNodes = [...baseNodes, ...nonPrepNodes];
  }

  const man = db.manuscripts.find((m: any) => m.id === newSub.manuscriptId);
  if (man) {
    man.status = 'submitted';
    man.targetJournals = [targetJournal];
    man.updatedAt = new Date().toISOString();
  }

  return newSub;
}

export function setPipelineViewMode(expanded: boolean, options: { persist?: boolean } = {}): void {
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  g.isPipelineExpanded = Boolean(expanded);
  isPipelineExpanded = g.isPipelineExpanded;
  const container = document.getElementById('dashboard-gantt');
  if (container) {
    container.classList.toggle('expanded', g.isPipelineExpanded);
    container.classList.toggle('is-compact', !g.isPipelineExpanded);
    container.classList.toggle('is-expanded', g.isPipelineExpanded);
  }
  updatePipelineViewToggle();
  if (options.persist !== false) {
    const rf = typeof (window as any).RFPlatform !== 'undefined'
      ? (window as any).RFPlatform
      : (typeof RFPlatform !== 'undefined' ? RFPlatform : null);
    rf?.storage?.local?.set?.({ researchflow_pipeline_expanded: g.isPipelineExpanded });
  }
}

export function updatePipelineViewToggle(): void {
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  const isExp = Boolean(g.isPipelineExpanded);
  const container = document.getElementById('dashboard-gantt');
  if (container) {
    container.classList.toggle('expanded', isExp);
  }

  const label = document.getElementById('pipeline-view-label');
  if (label) label.textContent = isExp ? t('expanded') : t('compact');

  const icon = document.getElementById('pipeline-view-icon');
  if (icon) icon.textContent = isExp ? '▦' : '▤';

  const button = document.getElementById('btn-pipeline-view-toggle');
  if (button) {
    button.classList.toggle('active', isExp);
    button.setAttribute('aria-pressed', String(isExp));
  }

  const compactBtn = document.getElementById('btn-pipeline-compact');
  if (compactBtn) {
    compactBtn.textContent = t('compact');
    compactBtn.classList.toggle('active', !isExp);
    compactBtn.setAttribute('aria-pressed', String(!isExp));
  }
  const expandedBtn = document.getElementById('btn-pipeline-expanded');
  if (expandedBtn) {
    expandedBtn.textContent = t('expanded');
    expandedBtn.classList.toggle('active', isExp);
    expandedBtn.setAttribute('aria-pressed', String(isExp));
  }
}

export function initializePipelineViewMode(): void {
  const rf = typeof (window as any).RFPlatform !== 'undefined'
    ? (window as any).RFPlatform
    : (typeof RFPlatform !== 'undefined' ? RFPlatform : null);
  rf?.storage?.local?.get?.(['researchflow_pipeline_expanded'], (result: any) => {
    setPipelineViewMode(Boolean(result?.researchflow_pipeline_expanded), { persist: false });
  });
}

export function setDashboardFilter(filter: string): void {
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  g.currentDashboardFilter = filter;
  renderDashboard();
}

export function updateDashboardFilterUI(): void {
  const map: Record<string, string> = {
    accepted: 'card-filter-accepted',
    active: 'card-filter-active',
    all: 'card-filter-all'
  };
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  const filter = String(g.currentDashboardFilter || 'all');
  Object.entries(map).forEach(([flt, id]) => {
    const card = document.getElementById(id);
    if (card) card.classList.toggle('active-filter', filter === flt);
  });
  const labelEl = document.getElementById('dashboard-filter-label');
  if (labelEl) labelEl.textContent = getDashboardFilterLabel();
}

export function getDashboardFilterLabel(): string {
  const showSortHint = typeof ZoteroBridge !== 'undefined'
    ? ZoteroBridge.getPref('showTimelineSortHint', true)
    : true;
  const sortHint = showSortHint ? ` · ${t('timelineSortedBySubmissionDate')}` : '';
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  const filter = String(g.currentDashboardFilter || 'all');
  if (filter === 'accepted') return `${t('acceptedPipelines')}${sortHint}`;
  if (filter === 'active') return `${t('activePipelines')}${sortHint}`;
  return `${t('allPipelines')}${sortHint}`;
}
