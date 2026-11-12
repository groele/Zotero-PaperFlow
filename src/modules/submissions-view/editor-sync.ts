import {
  getSubmissionChecklistKeys,
  renderSubmissionReviewPreview,
} from './checklist-and-matrix';
import { selectedSubmissionId } from './submission-state';

declare var db: any;
declare const ZoteroBridge: any;
declare function t(key: string): string;
declare function tf(key: string, vars?: Record<string, any>): string;
declare function getSubmissionStatusLabel(status: string): string;
declare function normalizeSubmissionStatus(status: string): string;
declare function markSubmissionRejected(sub: any, rejectionDate: string, reasonNote?: string): void;
declare function todayString(): string;
declare function getTimelineNodeByKey(sub: any, key: string): any;
declare function clearOnlinePublicationCompletion(sub: any): void;
declare function normalizeDoi(value: any): string;
declare function clearPublicationLinkFields(sub: any): void;
declare function clearPublicationTimelineCompletion(sub: any): void;
declare function normalizeSubmissionTimeline(sub: any): any[];
declare function syncManuscriptStatusFromSubmission(sub: any, database?: any): any;
declare function syncLinkedManuscriptSnapshots(manuscript: any, database?: any): void;
declare function analyzeSubmission(sub: any): any;
declare function normalizeDateString(val: any): string;
declare function getSubmissionJournalName(sub: any): string;
declare function getSubmissionCycleTime(sub: any): any;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;
declare function showAcceptanceCelebration(sub: any): void;

export function applySubmissionEditSync(sub: any, man: any, syncPlan: any, database: any = db): void {
  const w = window as any;
  const previousStatus = sub.status;
  if (man) {
    man.title = syncPlan.manuscriptPatch.title;
    if (w.RFCore?.getCurrentSubmission(database, man.id)?.id === sub.id) {
      man.targetJournals = syncPlan.manuscriptPatch.targetJournals;
    }
    man.updatedAt = new Date().toISOString();
  } else {
    sub.title = syncPlan.detachedSubmissionTitle;
  }

  Object.assign(sub, syncPlan.submissionPatch);
  if (syncPlan.shouldMarkRejected) {
    markSubmissionRejected(sub, syncPlan.rejectionDate || todayString());
  } else {
    sub.status = syncPlan.submissionPatch.status;
  }

  if (syncPlan.submissionPatch.status === 'accepted') {
    sub.acceptedAt = sub.decisionDate || sub.acceptedAt || new Date().toISOString();
  } else if (syncPlan.submissionPatch.status === 'published') {
    sub.publishedAt = sub.publishedAt || getTimelineNodeByKey(sub, 'online')?.completeDate || sub.decisionDate || new Date().toISOString();
    sub.acceptedAt = sub.acceptedAt || sub.publishedAt;
  }
  if (previousStatus === 'published' && sub.status === 'accepted') clearOnlinePublicationCompletion(sub);

  if (syncPlan.publicationPatch) {
    const doi = normalizeDoi(syncPlan.publicationPatch.doi);
    sub.doi = doi || null;
    sub.articleUrl = syncPlan.publicationPatch.articleUrl || (doi ? `https://doi.org/${doi}` : null);
  } else if (syncPlan.shouldClearPublication) {
    clearPublicationLinkFields(sub);
    clearPublicationTimelineCompletion(sub);
  }

  sub.updatedAt = new Date().toISOString();
  normalizeSubmissionTimeline(sub);
  syncManuscriptStatusFromSubmission(sub, database);
  if (man) syncLinkedManuscriptSnapshots(man, database);
}

export function refreshSubmissionStatusPresentation(sub: any): void {
  const w = window as any;
  const detailPanel = document.getElementById('submission-detail-panel');
  if (!detailPanel || detailPanel.dataset.currentSubmissionId !== sub.id) return;

  const status = normalizeSubmissionStatus(sub.status);
  const statusText = getSubmissionStatusLabel(status);
  const badgeClass = w.RFUI.getSubmissionStatusBadgeClass(status);
  detailPanel.querySelectorAll('[data-submission-status-badge]').forEach((badge: any) => {
    badge.className = badgeClass;
    badge.textContent = badge.dataset.submissionStatusBadge === 'stage' ? `${t('currentStageLabel')}: ${statusText}` : statusText;
  });

  const summary = detailPanel.querySelector('[data-submission-status-summary]');
  if (summary) {
    const analysis = analyzeSubmission(sub);
    const submitDate = normalizeDateString(sub.submissionDate || analysis.submitDate);
    summary.textContent = `${getSubmissionJournalName(sub)} / ${statusText} / ${t('milestoneSubmission')} ${submitDate || t('noDate')}`;
  }

  const cycle = getSubmissionCycleTime(sub);
  const cycleCard = detailPanel.querySelector('[data-submission-cycle-card]');
  if (cycleCard) {
    cycleCard.classList.toggle('submission-cycle-card-complete', cycle.isCompleted);
    cycleCard.classList.toggle('submission-cycle-card-active', !cycle.isCompleted);
    const label = cycleCard.querySelector('[data-submission-cycle-label]');
    const text = cycleCard.querySelector('[data-submission-cycle-text]');
    const icon = cycleCard.querySelector('.submission-cycle-icon');
    if (label) label.textContent = t(cycle.isCompleted ? 'cycleTimeCompleted' : 'submissionCycleTracking');
    if (text) {
      if (cycle.days === null || !cycle.hasStartDate) {
        text.textContent = (typeof (window as any).currentLanguage !== 'undefined' && (window as any).currentLanguage === 'zh')
          ? '暂无有效投稿日期，暂无法计算在审天数。'
          : 'No valid submission date recorded yet.';
      } else {
        text.textContent = cycle.isCompleted
          ? tf('cycleTimeCompletedText', { start: cycle.startDateStr, end: cycle.endDateStr, days: cycle.days })
          : tf('submissionCycleText', { start: cycle.startDateStr, days: cycle.days });
      }
    }
    if (icon) {
      w.RFUI.setHTML(icon, cycle.isCompleted
        ? '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>'
        : '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>');
    }
  }
}

export async function saveSubmissionEditFromValues(
  sub: any,
  prefix: string,
  options: any = {},
  getEditValuesFn?: (p: string) => any
): Promise<boolean> {
  const w = window as any;
  const editValues = options.values || (getEditValuesFn ? getEditValuesFn(prefix) : (window as any).getSubmissionEditValues?.(prefix));
  const syncPlan = w.RFUI.buildSubmissionEditSyncPlan(editValues);
  if (!syncPlan.ok) {
    if (options.alertOnError !== false) alert(syncPlan.error);
    if (typeof options.onValidationError === 'function') options.onValidationError(syncPlan.error);
    return false;
  }

  const liveSub = db.submissions.find((item: any) => item.id === sub.id);
  if (!liveSub) throw new Error(t('submissionNotFound'));
  const previousStatus = normalizeSubmissionStatus(liveSub.status);
  const workingDatabase = typeof structuredClone === 'function' ? structuredClone(db) : JSON.parse(JSON.stringify(db));
  const workingSub = workingDatabase.submissions.find((item: any) => item.id === sub.id);
  if (!workingSub) throw new Error(t('submissionNotFound'));
  const workingMan = workingDatabase.manuscripts.find((item: any) => item.id === workingSub.manuscriptId);

  applySubmissionEditSync(workingSub, workingMan, syncPlan, workingDatabase);
  const firstAuthor = String(editValues.firstAuthor || '').trim().slice(0, 160);
  workingSub.firstAuthor = firstAuthor || null;
  if (workingMan) {
    workingMan.firstAuthor = firstAuthor || null;
    syncLinkedManuscriptSnapshots(workingMan, workingDatabase);
  }
  workingSub.complianceChecklist = editValues.complianceChecklist;
  workingSub.complianceChecklistKeys = editValues.complianceChecklistKeys;
  workingSub.reviewMatrix = editValues.reviewMatrix;
  const savedDatabase = await w.storage.saveAll(workingDatabase, { mergeOnConflict: options.mergeOnConflict === true });
  db = savedDatabase || workingDatabase;
  const savedSub = db.submissions.find((item: any) => item.id === sub.id);
  if (!savedSub) throw new Error(t('submissionNotFound'));
  Object.assign(sub, savedSub);

  if (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero && workingMan?.zoteroItemKey) {
    try {
      ZoteroBridge.syncStatusTag(workingMan.zoteroItemKey, workingMan.status || savedSub.status, workingMan.zoteroLibraryID);
      if (ZoteroBridge.getPref('autoSyncChildNotes', true)) ZoteroBridge.syncNote(workingMan.zoteroItemKey, workingMan.zoteroLibraryID);
    } catch (_) {}
  }

  const shouldCelebrate = w.RFUI.shouldCelebrateAcceptance(previousStatus, normalizeSubmissionStatus(savedSub.status));
  const activeView = document.querySelector('.content-view.active')?.id;
  if (activeView === 'view-dashboard') renderDashboard();
  if (activeView === 'view-manuscripts') renderKanban();
  if (activeView === 'view-submissions') w.renderSubmissions?.({ refreshDetails: options.renderDetails !== false });
  if (options.renderDetails !== false) w.renderSubmissionDetails?.(savedSub);
  else if (selectedSubmissionId === savedSub.id) refreshSubmissionStatusPresentation(savedSub);
  if (options.notify !== false) showGlobalToast(t('submissionEditsSaved'), 'success');
  if (shouldCelebrate && (typeof ZoteroBridge === 'undefined' || ZoteroBridge.getPref('enableAcceptanceCelebration', true))) {
    showAcceptanceCelebration(savedSub);
  }
  return true;
}
