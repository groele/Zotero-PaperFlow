/**
 * Zotero PaperFlow - Manuscript & Submission Status Synchronization
 */

declare var db: any;
declare var todayString: () => string;

export function normalizeText(value: any): string {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeSubmissionStatus(value: any): string {
  const normalized = normalizeText(value).replace(/[\s-]+/g, '_');
  const aliases: Record<string, string> = {
    accept: 'accepted',
    accepted: 'accepted',
    online: 'published',
    publication: 'published',
    published: 'published',
    underreview: 'under_review',
    in_review: 'under_review',
    review: 'under_review',
    revise: 'revision',
    revision_required: 'revision',
    resubmit: 'revision',
    reject: 'rejected',
    rejected: 'rejected',
    submit: 'submitted'
  };
  const canonical = aliases[normalized] || normalized;
  return ['submitted', 'under_review', 'revision', 'accepted', 'published', 'rejected'].includes(canonical)
    ? canonical
    : 'submitted';
}

export function normalizeWorkflowFields(sub: any): boolean {
  if (!sub || typeof sub !== 'object') return false;
  let changed = false;
  if (!sub.targetJournal && sub.journal) {
    sub.targetJournal = sub.journal;
    changed = true;
  }
  return changed;
}

export function normalizeSubmissionStatuses(database: any): boolean {
  let changed = false;
  (database?.submissions || []).forEach((submission: any) => {
    changed = normalizeWorkflowFields(submission) || changed;
    const canonical = normalizeSubmissionStatus(submission.status);
    if (submission.status !== canonical) {
      submission.status = canonical;
      submission.updatedAt = new Date().toISOString();
      changed = true;
    }
  });
  return changed;
}

export function normalizeSyncedPublicationStatus(status: any): string {
  const normalized = normalizeSubmissionStatus(status);
  return normalized === 'published' ? 'published' : 'accepted';
}

export function isSubmissionLifecycleStatus(status: any): boolean {
  const s = String(status || '').toLowerCase();
  return ['submitted', 'under_review', 'revision', 'accepted', 'published'].includes(s);
}

export function getSubmissionLifecycleRank(status: any): number {
  const rankMap: Record<string, number> = {
    submitted: 1,
    under_review: 2,
    revision: 3,
    accepted: 4,
    published: 5
  };
  return rankMap[String(status || '').toLowerCase()] || 0;
}

export function getLinkedActiveSubmissions(manuscriptId: string, database: any = (typeof db !== 'undefined' ? db : null)): any[] {
  if (!manuscriptId || !database) return [];
  return (database.submissions || []).filter((sub: any) =>
    sub.manuscriptId === manuscriptId && sub.status !== 'rejected' && sub.status !== 'withdrawn'
  );
}

function resolveCurrentSubmissionForSync(manuscriptId: string, database: any): any | null {
  if (!manuscriptId || !database) return null;
  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
  if (g?.RFCore?.getCurrentSubmission) {
    return g.RFCore.getCurrentSubmission(database, manuscriptId);
  }
  const activeSubs = getLinkedActiveSubmissions(manuscriptId, database);
  const pool = activeSubs.length ? activeSubs : (database.submissions || []).filter((s: any) => s?.manuscriptId === manuscriptId);
  if (!pool.length) return null;
  const predecessors = new Set(pool.map((s: any) => s?.previousSubmissionId || s?.transferredFromId).filter(Boolean));
  return [...pool].sort((a: any, b: any) => {
    const aHead = predecessors.has(a.id) ? 0 : 1;
    const bHead = predecessors.has(b.id) ? 0 : 1;
    if (aHead !== bHead) return bHead - aHead;
    const roundDiff = (Number(b?.round ?? b?.roundIndex) || 1) - (Number(a?.round ?? a?.roundIndex) || 1);
    if (roundDiff !== 0) return roundDiff;
    const timeA = Date.parse(a?.updatedAt || a?.submissionDate || a?.createdAt || '') || 0;
    const timeB = Date.parse(b?.updatedAt || b?.submissionDate || b?.createdAt || '') || 0;
    return timeB - timeA;
  })[0] || null;
}

export function syncLinkedSubmissionsFromManuscript(manuscript: any, database: any = (typeof db !== 'undefined' ? db : null)): boolean {
  if (!manuscript || !database) return false;
  const currentSub = resolveCurrentSubmissionForSync(manuscript.id, database);
  if (!currentSub) return false;

  const targetStatus = manuscript.status;
  if (['submitted', 'under_review', 'revision', 'accepted', 'published'].includes(targetStatus)) {
    const canonical = normalizeSubmissionStatus(targetStatus);
    if (currentSub.status !== canonical) {
      currentSub.status = canonical;
      currentSub.updatedAt = new Date().toISOString();
      return true;
    }
  }
  return false;
}

export function setManuscriptStatus(manuscript: any, status: any, { syncSubmissions = true, database = (typeof db !== 'undefined' ? db : null) }: any = {}): boolean {
  if (!manuscript) return false;
  const prevStatus = manuscript.status;
  manuscript.status = status;
  manuscript.updatedAt = new Date().toISOString();
  let changed = prevStatus !== status;

  if (syncSubmissions && database) {
    changed = syncLinkedSubmissionsFromManuscript(manuscript, database) || changed;
  }
  return changed;
}

export function syncManuscriptStatusFromSubmission(submission: any, database: any = (typeof db !== 'undefined' ? db : null)): boolean {
  if (!submission?.manuscriptId || !database) return false;
  const manuscript = (database.manuscripts || []).find((m: any) => m.id === submission.manuscriptId);
  if (!manuscript) return false;

  const canonicalSubStatus = normalizeSubmissionStatus(submission.status);
  const manuscriptStatus = manuscript.status;

  if (isSubmissionLifecycleStatus(canonicalSubStatus)) {
    const subRank = getSubmissionLifecycleRank(canonicalSubStatus);
    const mRank = getSubmissionLifecycleRank(manuscriptStatus);
    if (subRank > mRank || (subRank > 0 && mRank === 0)) {
      manuscript.status = canonicalSubStatus;
      manuscript.updatedAt = new Date().toISOString();
      return true;
    }
  }
  return false;
}

export function validateLinkedManuscriptStatus(manuscript: any, status: any): void {
  if (!manuscript) return;
  const valid = [
    'planning', 'idea', 'outline', 'data_collection',
    'in_progress', 'figure_preparation', 'drafting', 'internal_review',
    'submitted', 'under_review', 'revision',
    'accepted', 'published', 'rejected'
  ];
  if (!valid.includes(status)) {
    throw new Error(`Invalid manuscript status: ${status}`);
  }
}

export function syncWorkflowAliases(sub: any, manuscript: any): boolean {
  if (!sub || !manuscript) return false;
  let changed = false;
  if (!sub.manuscriptTitle && manuscript.title) {
    sub.manuscriptTitle = manuscript.title;
    changed = true;
  }
  if (!sub.targetJournal && manuscript.targetJournal) {
    sub.targetJournal = manuscript.targetJournal;
    changed = true;
  }
  return changed;
}

export function syncLinkedManuscriptSnapshots(manuscript: any, database: any): boolean {
  if (!manuscript || !database?.submissions) return false;
  let changed = false;
  database.submissions.forEach((sub: any) => {
    if (sub.manuscriptId === manuscript.id) {
      changed = syncWorkflowAliases(sub, manuscript) || changed;
    }
  });
  return changed;
}

export function syncManuscriptStatusesFromSubmissions(database: any): boolean {
  if (!database?.submissions || !database?.manuscripts) return false;
  let changed = false;
  database.submissions.forEach((submission: any) => {
    changed = syncManuscriptStatusFromSubmission(submission, database) || changed;
  });
  return changed;
}

export function clearOnlinePublicationCompletion(sub: any): void {
  if (!sub) return;
  sub.publicationUrl = '';
  sub.doi = '';
  if (Array.isArray(sub.timelineNodes)) {
    sub.timelineNodes = sub.timelineNodes.filter((n: any) => n.key !== 'online_publication');
  }
}

export function createRejectedTimelineNode(sub: any, rejectionDate: any = null, note: string = ''): any {
  const date = rejectionDate || (typeof todayString === 'function' ? todayString() : new Date().toISOString().split('T')[0]);
  return {
    id: 'node_' + Math.random().toString(36).substring(2, 9),
    submissionId: sub?.id || '',
    key: 'rejected',
    title: 'Rejected',
    status: 'completed',
    date,
    note
  };
}

export function markSubmissionRejected(sub: any, rejectionDate: any = (typeof todayString === 'function' ? todayString() : new Date().toISOString().split('T')[0]), note: string = ''): boolean {
  if (!sub) return false;
  sub.status = 'rejected';
  sub.updatedAt = new Date().toISOString();
  if (!Array.isArray(sub.timelineNodes)) {
    sub.timelineNodes = [];
  }
  sub.timelineNodes.push(createRejectedTimelineNode(sub, rejectionDate, note));
  return true;
}

export function getNextSubmissionRound(manuscriptId: string, database: any = (typeof db !== 'undefined' ? db : null)): number {
  if (!manuscriptId || !database?.submissions) return 1;
  const count = database.submissions.filter((s: any) => s.manuscriptId === manuscriptId).length;
  return count + 1;
}

export function createTransferredSubmission(sourceSub: any, targetJournal: string, submissionDate: any = (typeof todayString === 'function' ? todayString() : new Date().toISOString().split('T')[0]), journalUrl: string = ''): any {
  return {
    id: 'sub_' + Math.random().toString(36).substring(2, 9),
    manuscriptId: sourceSub?.manuscriptId || '',
    manuscriptTitle: sourceSub?.manuscriptTitle || '',
    targetJournal,
    journalUrl,
    submissionDate,
    status: 'submitted',
    round: (Number(sourceSub?.round ?? sourceSub?.roundIndex) || 1) + 1,
    transferredFromId: sourceSub?.id || null,
    timelineNodes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
