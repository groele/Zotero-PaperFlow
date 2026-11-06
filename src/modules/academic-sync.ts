/**
 * Zotero PaperFlow - Academic Metadata & Status Sync Module
 * Manages manuscript-submission bidirectional status sync, DOI parsing, and author parsing.
 */

declare var db: any;
declare var currentDashboardFilter: any;
declare var currentLanguage: any;
declare var t: (key: string) => string;
declare var analyzeSubmission: (sub: any) => any;
declare var computeNodeStatus: (node: any) => string;
declare var canHavePublicationLink: (sub: any) => boolean;
declare var normalizeDateString: (val: any) => string;
declare var getNodeDate: (node: any) => string;
declare var getLatestTimelineNode: (nodes: any[]) => any;
declare var clearPublicationLinkFields: (sub: any) => void;
declare var clearPublicationTimelineCompletion: (sub: any) => void;
declare var normalizeSubmissionTimeline: (sub: any) => boolean;
declare var hasPublicationStatus: (sub: any) => boolean;
declare var getTimelineNodeByKey: (sub: any, key: string) => any;
declare var dateInputToIso: (val: any) => string;
declare var inferKey: (node: any) => string;
declare var todayString: () => string;
declare var createTimelineNode: (subId: string, values: any) => any;
declare var escapeHTML: (val: any) => string;
declare var ZoteroBridge: any;

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

export function normalizeDoi(value: any): string {
  return String(value || '').trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
}

export function extractDoiFromText(value: any): string {
  const match = String(value || '').match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return match ? normalizeDoi(match[0].replace(/[.,;)\]]+$/, '')) : '';
}

export function getDashboardFilterLabel(): string {
  if (typeof currentDashboardFilter !== 'undefined') {
    if (currentDashboardFilter === 'accepted') return typeof t === 'function' ? t('acceptedPipelines') : 'Accepted Pipelines';
    if (currentDashboardFilter === 'active') return typeof t === 'function' ? t('activePipelines') : 'Active Pipelines';
  }
  return typeof t === 'function' ? t('allPipelines') : 'All Pipelines';
}

export function getSubmissionAttentionScore(sub: any): number {
  const analysis = typeof analyzeSubmission === 'function' ? analyzeSubmission(sub) : {};
  const nodes = sub?.timelineNodes || [];
  const hasBlocked = nodes.some((n: any) => (typeof computeNodeStatus === 'function' ? computeNodeStatus(n) : '') === 'blocked');
  const hasOverdue = nodes.some((n: any) => (typeof computeNodeStatus === 'function' ? computeNodeStatus(n) : '') === 'overdue');
  const hasDueSoon = nodes.some((n: any) => (typeof computeNodeStatus === 'function' ? computeNodeStatus(n) : '') === 'due_soon');
  const hasRevision = /revision/.test(sub?.status || '') || Boolean(analysis.r1Date);

  if (hasBlocked || hasOverdue) return 0;
  if (hasRevision) return 1;
  if (!analysis.accepted && analysis.submitDate) return 2;
  if (hasDueSoon) return 3;
  if (!analysis.submitDate) return 4;
  return analysis.accepted ? 6 : 5;
}

export function getSubmissionDoi(sub: any): string {
  if (typeof canHavePublicationLink === 'function' && !canHavePublicationLink(sub)) return '';

  const direct = normalizeDoi(sub?.doi || sub?.DOI || sub?.articleDoi || sub?.metadata?.doi || sub?.attributes?.doi);
  if (direct) return direct;

  const textDoi = extractDoiFromText([sub?.notes, sub?.summary, sub?.description, sub?.articleUrl, sub?.journalUrl].filter(Boolean).join(' '));
  if (textDoi) return textDoi;

  const activeDb = typeof db !== 'undefined' ? db : null;
  const manuscript = activeDb?.manuscripts?.find((m: any) => m.id === sub?.manuscriptId);
  const title = normalizeText(manuscript?.title || sub?.title || '');
  const journal = normalizeText(sub?.targetJournal || sub?.journalName || '');
  const achievement = activeDb?.achievements?.find((ach: any) => {
    const achTitle = normalizeText(ach.title || '');
    const achJournal = normalizeText(ach.journal || '');
    return ach.doi && (
      (title && achTitle && (achTitle === title || achTitle.includes(title) || title.includes(achTitle))) ||
      (journal && achJournal && achJournal === journal)
    );
  });
  return normalizeDoi(achievement?.doi || '');
}

export function getSubmissionJournalName(sub: any): string {
  if (!sub) return typeof t === 'function' ? t('targetJournal') : 'Target Journal';
  const activeDb = typeof db !== 'undefined' ? db : null;
  const manuscript = activeDb?.manuscripts?.find((m: any) => m.id === sub.manuscriptId);
  const manuscriptJournal = Array.isArray(manuscript?.targetJournals)
    ? manuscript.targetJournals[0]
    : manuscript?.targetJournal;
  return sub.targetJournal || sub.journalName || sub.journal || sub.publisher || manuscriptJournal || (typeof t === 'function' ? t('targetJournal') : 'Target Journal');
}

export function normalizeAuthorName(author: any): string {
  if (typeof author === 'string') return author.trim();
  if (!author || typeof author !== 'object') return '';
  return String(author.name || author.fullName || author.displayName || '').trim();
}

export function firstAuthorFromList(authors: any): string {
  if (Array.isArray(authors)) {
    return normalizeAuthorName(authors.find(author => normalizeAuthorName(author)));
  }
  const value = String(authors || '').trim();
  if (!value) return '';
  return value.split(/\s*(?:;|；|\n|\band\b)\s*/i)[0].trim();
}

export function getSubmissionFirstAuthor(sub: any, manuscript: any = null): string {
  const activeDb = typeof db !== 'undefined' ? db : null;
  const man = manuscript || activeDb?.manuscripts?.find((item: any) => item.id === sub?.manuscriptId);
  return String(
    sub?.firstAuthor ||
    man?.firstAuthor ||
    firstAuthorFromList(man?.authors) ||
    firstAuthorFromList(sub?.authors) ||
    ''
  ).trim();
}

export function getSubmissionArticleUrl(sub: any): string {
  if (typeof canHavePublicationLink === 'function' && !canHavePublicationLink(sub)) return '';

  const explicitUrl = String(sub?.articleUrl || sub?.publicationUrl || sub?.url || sub?.journalArticleUrl || '').trim();
  if (explicitUrl) return explicitUrl;
  const doi = getSubmissionDoi(sub);
  return doi ? `https://doi.org/${doi}` : '';
}

export function getSubmissionSortTime(sub: any): number {
  const analysis = typeof analyzeSubmission === 'function' ? analyzeSubmission(sub) : {};
  const normalized = (typeof normalizeDateString === 'function' ? normalizeDateString(sub?.submissionDate) : '') || analysis.submitDate || (typeof normalizeDateString === 'function' ? normalizeDateString(sub?.submittedAt) : '');
  if (normalized) return new Date(`${normalized}T12:00:00.000Z`).getTime();
  return 0;
}

export function sortDashboardSubmissions(submissions: any[]): any[] {
  return [...submissions].sort((a, b) => {
    const submittedA = getSubmissionSortTime(a);
    const submittedB = getSubmissionSortTime(b);
    if (submittedA !== submittedB) return submittedB - submittedA;

    const da = (typeof getNodeDate === 'function' && typeof getLatestTimelineNode === 'function' ? getNodeDate(getLatestTimelineNode(a.timelineNodes || [])) : '') || a.updatedAt || a.createdAt || '';
    const dbTime = (typeof getNodeDate === 'function' && typeof getLatestTimelineNode === 'function' ? getNodeDate(getLatestTimelineNode(b.timelineNodes || [])) : '') || b.updatedAt || b.createdAt || '';
    return new Date(dbTime || 0).getTime() - new Date(da || 0).getTime();
  });
}

export function normalizeSyncedPublicationStatus(status: any): string {
  const normalized = normalizeText(status);
  if (normalized === 'accept') return 'accepted';
  return normalized;
}

export function isSubmissionLifecycleStatus(status: any): boolean {
  return ['submitted', 'under_review', 'revision', 'accepted', 'published'].includes(normalizeSyncedPublicationStatus(status));
}

export function getSubmissionLifecycleRank(status: any): number {
  const ranks: Record<string, number> = {
    submitted: 1,
    under_review: 2,
    revision: 3,
    accepted: 4,
    published: 5
  };
  return ranks[normalizeSyncedPublicationStatus(status)] || 0;
}

export function getLinkedActiveSubmissions(manuscriptId: string, database: any = (typeof db !== 'undefined' ? db : null)): any[] {
  const current = typeof window !== 'undefined' && window.RFCore?.getCurrentSubmission
    ? window.RFCore.getCurrentSubmission(database, manuscriptId)
    : null;
  return current ? [current] : [];
}

export function syncLinkedSubmissionsFromManuscript(manuscript: any, database: any = (typeof db !== 'undefined' ? db : null)): boolean {
  if (!manuscript) return false;
  const nextStatus = normalizeSyncedPublicationStatus(manuscript.status);
  let changed = false;

  getLinkedActiveSubmissions(manuscript.id, database).forEach(sub => {
    const patch: any = {
      title: manuscript.title,
      targetJournal: manuscript.targetJournals?.[0] || null,
      firstAuthor: manuscript.firstAuthor || firstAuthorFromList(manuscript.authors) || null
    };
    if (isSubmissionLifecycleStatus(nextStatus) || nextStatus === 'rejected') patch.status = nextStatus;
    if (nextStatus === 'accepted' || nextStatus === 'published') {
      patch.doi = manuscript.doi || sub.doi || null;
      patch.articleUrl = manuscript.articleUrl || sub.articleUrl || null;
    }
    if (Object.entries(patch).some(([key, value]) => sub[key] !== value)) {
      const previousStatus = sub.status;
      Object.assign(sub, patch);
      sub.updatedAt = new Date().toISOString();
      if (isSubmissionLifecycleStatus(nextStatus) && nextStatus !== 'accepted' && nextStatus !== 'published') {
        if (typeof clearPublicationLinkFields === 'function') clearPublicationLinkFields(sub);
        if (typeof clearPublicationTimelineCompletion === 'function') clearPublicationTimelineCompletion(sub);
      }
      if (previousStatus === 'published' && nextStatus === 'accepted') {
        clearOnlinePublicationCompletion(sub);
      }
      changed = true;
    }
    if (typeof normalizeSubmissionTimeline === 'function') changed = normalizeSubmissionTimeline(sub) || changed;
    changed = syncWorkflowAliases(sub, manuscript) || changed;
  });

  return syncLinkedManuscriptSnapshots(manuscript, database) || changed;
}

export function setManuscriptStatus(manuscript: any, status: any, { syncSubmissions = true, database = (typeof db !== 'undefined' ? db : null) }: any = {}): boolean {
  if (!manuscript) return false;
  const nextStatus = normalizeSyncedPublicationStatus(status);
  let changed = false;
  if (manuscript.status !== nextStatus) {
    manuscript.status = nextStatus;
    manuscript.updatedAt = new Date().toISOString();
    changed = true;
  }
  if (syncSubmissions) {
    changed = syncLinkedSubmissionsFromManuscript(manuscript, database) || changed;
  }
  return changed;
}

export async function persistManuscriptStatusChange(manuscript: any, nextStatus: any): Promise<any> {
  const activeDb = typeof db !== 'undefined' ? db : null;
  const liveManuscript = activeDb?.manuscripts?.find((item: any) => item.id === manuscript.id);
  if (!liveManuscript) throw new Error(typeof t === 'function' ? t('manuscriptNotFound') : 'Manuscript not found');
  validateLinkedManuscriptStatus(liveManuscript, nextStatus);
  const previousStatus = normalizeSyncedPublicationStatus(liveManuscript.status);
  const workingDatabase = typeof structuredClone === 'function'
    ? structuredClone(activeDb)
    : JSON.parse(JSON.stringify(activeDb));
  const workingManuscript = workingDatabase.manuscripts.find((item: any) => item.id === manuscript.id);
  if (!workingManuscript) throw new Error(typeof t === 'function' ? t('manuscriptNotFound') : 'Manuscript not found');

  setManuscriptStatus(workingManuscript, nextStatus, { database: workingDatabase });
  const savedDatabase = await (typeof window !== 'undefined' && window.storage?.saveAll ? window.storage.saveAll(workingDatabase, { mergeOnConflict: true }) : null);
  if (typeof (globalThis as any).db !== 'undefined') {
    (globalThis as any).db = savedDatabase || workingDatabase;
  }
  const savedDb = savedDatabase || workingDatabase;
  const savedManuscript = savedDb.manuscripts.find((item: any) => item.id === manuscript.id);
  if (!savedManuscript) throw new Error(typeof t === 'function' ? t('manuscriptNotFound') : 'Manuscript not found');
  Object.assign(manuscript, savedManuscript);

  if (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero && savedManuscript.zoteroItemKey) {
    try {
      ZoteroBridge.syncStatusTag(savedManuscript.zoteroItemKey, savedManuscript.status);
      ZoteroBridge.syncNote(savedManuscript.zoteroItemKey);
    } catch (_) {}
  }

  return {
    manuscript: savedManuscript,
    shouldCelebrate: typeof window !== 'undefined' && window.RFUI?.shouldCelebrateAcceptance
      ? window.RFUI.shouldCelebrateAcceptance(
          previousStatus,
          normalizeSyncedPublicationStatus(savedManuscript.status)
        )
      : false
  };
}

export function syncManuscriptStatusFromSubmission(submission: any, database: any = (typeof db !== 'undefined' ? db : null)): boolean {
  if (!submission) return false;
  const manuscript = database?.manuscripts?.find((man: any) => man.id === submission.manuscriptId);
  if (!manuscript) return false;
  if (typeof window !== 'undefined' && window.RFCore?.getCurrentSubmission?.(database, manuscript.id)?.id !== submission.id) return false;
  const normalized = normalizeWorkflowFields(submission);
  const patch: any = {
    status: normalizeSubmissionStatus(submission.status),
    targetJournals: 'targetJournal' in submission ? (submission.targetJournal ? [submission.targetJournal] : []) : (manuscript.targetJournals || []),
    firstAuthor: submission.firstAuthor || manuscript.firstAuthor || firstAuthorFromList(manuscript.authors) || null
  };
  if (typeof hasPublicationStatus === 'function' && hasPublicationStatus(submission)) {
    patch.doi = submission.doi || manuscript.doi || null;
    patch.articleUrl = submission.articleUrl || manuscript.articleUrl || null;
  }
  const changed = Object.entries(patch).some(([key, value]) => JSON.stringify(manuscript[key]) !== JSON.stringify(value));
  if (changed) Object.assign(manuscript, patch, { updatedAt: submission.updatedAt || new Date().toISOString() });
  return syncLinkedManuscriptSnapshots(manuscript, database) || changed || normalized;
}

export function normalizeWorkflowFields(sub: any): boolean {
  let changed = false;
  for (const [alias, key] of [['journalName', 'targetJournal'], ['submittedAt', 'submissionDate'], ['decisionAt', 'decisionDate'], ['revisionDeadline', 'revisionDueDate']]) {
    if (!(key in sub) && alias in sub) { sub[key] = sub[alias]; changed = true; }
  }
  return changed;
}

export function validateLinkedManuscriptStatus(manuscript: any, status: any): void {
  const activeDb = typeof db !== 'undefined' ? db : null;
  if (typeof window !== 'undefined' && window.RFCore?.getCurrentSubmission?.(activeDb, manuscript.id) && !isSubmissionLifecycleStatus(status) && status !== 'rejected') {
    const lang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'en';
    throw new Error(lang === 'zh'
      ? '该手稿已有投稿记录，请选择投稿、审稿、返修、接收、发表或拒稿状态。若需退回准备阶段，请先删除对应投稿跟踪。'
      : 'This manuscript has a submission. Choose a submission status, or delete its submission tracking before returning to preparation.');
  }
}

export function syncWorkflowAliases(sub: any, manuscript: any): boolean {
  if (!sub || !manuscript) return false;
  let changed = normalizeWorkflowFields(sub);
  const set = (object: any, key: string, value: any) => {
    if (JSON.stringify(object[key]) !== JSON.stringify(value)) { object[key] = value; changed = true; }
  };
  for (const [alias, key] of [['journalName', 'targetJournal'], ['submittedAt', 'submissionDate'], ['decisionAt', 'decisionDate'], ['revisionDeadline', 'revisionDueDate']]) {
    if (alias in sub) set(sub, alias, sub[key] ?? null);
  }
  if ('title' in sub) set(sub, 'title', manuscript.title);
  if ('targetJournal' in manuscript) set(manuscript, 'targetJournal', manuscript.targetJournals?.[0] || null);
  if (sub.manuscript && typeof sub.manuscript === 'object' && !Array.isArray(sub.manuscript)) {
    for (const key of ['id', 'title', 'status', 'firstAuthor', 'updatedAt']) set(sub.manuscript, key, manuscript[key] ?? null);
    if ('targetJournal' in sub.manuscript) set(sub.manuscript, 'targetJournal', manuscript.targetJournals?.[0] || null);
    if ('targetJournals' in sub.manuscript) set(sub.manuscript, 'targetJournals', manuscript.targetJournals || []);
  }
  return changed;
}

export function syncLinkedManuscriptSnapshots(manuscript: any, database: any): boolean {
  if (!manuscript || !database || !Array.isArray(database.submissions)) return false;
  let changed = false;
  database.submissions.filter((sub: any) => sub.manuscriptId === manuscript.id).forEach((sub: any) => {
    changed = syncWorkflowAliases(sub, manuscript) || changed;
  });
  return changed;
}

export function syncManuscriptStatusesFromSubmissions(database: any): boolean {
  if (!database || !Array.isArray(database.manuscripts) || !Array.isArray(database.submissions)) return false;
  let changed = false;
  database.manuscripts.forEach((manuscript: any) => {
    const current = typeof window !== 'undefined' && window.RFCore?.getCurrentSubmission
      ? window.RFCore.getCurrentSubmission(database, manuscript.id)
      : null;
    if (!current) return;
    const online = typeof getTimelineNodeByKey === 'function' ? getTimelineNodeByKey(current, 'online') : null;
    if (current.status === 'accepted' && manuscript.status === 'published' && online?.completeDate) {
      current.status = 'published';
      current.publishedAt = current.publishedAt || (typeof dateInputToIso === 'function' && typeof normalizeDateString === 'function' ? dateInputToIso(normalizeDateString(online.completeDate)) : online.completeDate);
      changed = true;
    }
    changed = syncManuscriptStatusFromSubmission(current, database) || changed;
  });
  return changed;
}

export function clearOnlinePublicationCompletion(sub: any): void {
  delete sub.publishedAt;
  (sub.timelineNodes || []).filter((node: any) => (typeof inferKey === 'function' ? inferKey(node) : '') === 'online').forEach((node: any) => {
    node.completeDate = '';
    node.status = 'pending';
  });
}

export function createRejectedTimelineNode(sub: any, rejectionDate: any = null, note: string = ''): any {
  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
  const existing = sub.timelineNodes.find((node: any) => (typeof inferKey === 'function' ? inferKey(node) : '') === 'rejected');
  const date = rejectionDate || (typeof todayString === 'function' ? todayString() : new Date().toISOString().split('T')[0]);
  const values: any = {
    key: 'rejected',
    name: 'Rejected',
    type: 'rejection',
    status: 'blocked',
    planDate: '',
    dueDate: '',
    completeDate: date,
    notes: note
  };

  if (existing) {
    Object.assign(existing, values, { updatedAt: new Date().toISOString() });
    return existing;
  }

  const node = typeof createTimelineNode === 'function' ? createTimelineNode(sub.id, values) : values;
  sub.timelineNodes.push(node);
  return node;
}

export function markSubmissionRejected(sub: any, rejectionDate: any = (typeof todayString === 'function' ? todayString() : new Date().toISOString().split('T')[0]), note: string = ''): boolean {
  if (!sub) return false;
  const isoDate = typeof dateInputToIso === 'function' ? dateInputToIso(rejectionDate) : rejectionDate;
  sub.status = 'rejected';
  sub.decisionDate = isoDate;
  sub.firstDecisionDate = sub.firstDecisionDate || isoDate;
  sub.rejectedAt = isoDate;
  sub.rejectionNote = note || sub.rejectionNote || '';
  if (note) sub.notes = [sub.notes, `Rejected: ${note}`].filter(Boolean).join('\n');
  if (typeof clearPublicationLinkFields === 'function') clearPublicationLinkFields(sub);
  if (typeof clearPublicationTimelineCompletion === 'function') clearPublicationTimelineCompletion(sub);
  createRejectedTimelineNode(sub, rejectionDate, note);
  sub.updatedAt = new Date().toISOString();
  return true;
}

export function getNextSubmissionRound(manuscriptId: string): number {
  const activeDb = typeof db !== 'undefined' ? db : null;
  const rounds = (activeDb?.submissions || [])
    .filter((sub: any) => sub.manuscriptId === manuscriptId)
    .map((sub: any) => Number(sub.roundIndex) || 1);
  return rounds.length ? Math.max(...rounds) + 1 : 1;
}

export function createTransferredSubmission(sourceSub: any, targetJournal: string, submissionDate: any = (typeof todayString === 'function' ? todayString() : new Date().toISOString().split('T')[0]), journalUrl: string = ''): any {
  const activeDb = typeof db !== 'undefined' ? db : null;
  const manuscript = activeDb?.manuscripts?.find((m: any) => m.id === sourceSub.manuscriptId);
  const now = new Date().toISOString();
  const newSub: any = {
    id: 'sub_' + Math.random().toString(36).substring(2, 9),
    userId: sourceSub.userId || 'user',
    manuscriptId: sourceSub.manuscriptId,
    projectId: sourceSub.projectId || manuscript?.projectId || null,
    targetJournal,
    journalUrl: journalUrl || null,
    doi: null,
    articleUrl: null,
    status: 'submitted',
    submissionDate: typeof dateInputToIso === 'function' ? dateInputToIso(submissionDate) : submissionDate,
    decisionDate: null,
    revisionDueDate: null,
    firstDecisionDate: null,
    previousSubmissionId: sourceSub.id,
    previousJournal: getSubmissionJournalName(sourceSub),
    firstAuthor: getSubmissionFirstAuthor(sourceSub, manuscript) || null,
    roundIndex: getNextSubmissionRound(sourceSub.manuscriptId),
    complianceChecklist: {},
    complianceChecklistKeys: Array.isArray(sourceSub.complianceChecklistKeys) ? sourceSub.complianceChecklistKeys : undefined,
    reviewMatrix: [],
    timelineNodes: [],
    notes: `Transferred after rejection from ${getSubmissionJournalName(sourceSub)}.`,
    createdAt: now,
    updatedAt: now
  };
  if (typeof normalizeSubmissionTimeline === 'function') normalizeSubmissionTimeline(newSub);
  return newSub;
}

export function getSubmissionBadgeClass(sub: any): string {
  const status = normalizeSyncedPublicationStatus(sub?.status || 'submitted');
  if (status === 'rejected') return 'danger';
  if (status === 'revision') return 'warning';
  if (status === 'accepted' || status === 'published') return 'success';
  return 'purple';
}

export function splitAcademicAuthors(value: any): string[] {
  if (Array.isArray(value)) return value.map(normalizeAuthorName).filter(Boolean);
  const text = String(value || '').trim();
  if (!text) return [];
  let authors = text
    .split(/\s*(?:;|；|\n|\band\b|、)\s*/i)
    .map(author => author.trim())
    .filter(Boolean);
  if (authors.length === 1 && text.includes(',')) {
    const commaAuthors = text.split(/\s*,\s*/).map(author => author.trim()).filter(Boolean);
    if (
      commaAuthors.length > 1
      && commaAuthors.length <= 30
      && commaAuthors.every(author => author.split(/\s+/).length <= 6)
    ) {
      authors = commaAuthors;
    }
  }
  return authors;
}

export function normalizeAcademicTitle(value: any): string {
  return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, '');
}

export function normalizeAcademicUrl(value: any): string {
  try {
    const url = new URL(String(value || '').trim());
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid']
      .forEach(key => url.searchParams.delete(key));
    return url.href.replace(/\/$/, '').toLowerCase();
  } catch (_) {
    return '';
  }
}

export function findAcademicManuscriptMatch({ title, doi, articleUrl }: any): any {
  const normalizedDoi = normalizeDoi(doi);
  const normalizedUrl = normalizeAcademicUrl(articleUrl);
  const normalizedTitle = normalizeAcademicTitle(title);
  const activeDb = typeof db !== 'undefined' ? db : null;
  return activeDb?.manuscripts?.find((manuscript: any) => {
    const manuscriptDoi = normalizeDoi(manuscript.doi);
    if (normalizedDoi && manuscriptDoi && normalizedDoi === manuscriptDoi) return true;
    const manuscriptUrl = normalizeAcademicUrl(manuscript.articleUrl);
    if (normalizedUrl && manuscriptUrl && normalizedUrl === manuscriptUrl) return true;
    return normalizedTitle
      && normalizedTitle.length >= 16
      && normalizedTitle === normalizeAcademicTitle(manuscript.title);
  }) || null;
}

export function academicCaptureProvenance(prefill: any): any {
  if (!prefill) return null;
  return {
    sourceType: prefill.sourceType || 'zotero-library',
    sourceHost: prefill.sourceHost || '',
    sourcePageUrl: prefill.sourcePageUrl || '',
    pdfUrl: prefill.pdfUrl || '',
    confidenceScore: Number(prefill.confidenceScore) || 0,
    capturedAt: new Date().toISOString(),
    reviewedByUser: true
  };
}

export function buildAcademicCaptureSummary(prefill: any): string {
  if (!prefill) return '';
  const source = prefill.sourceHost || prefill.sourceType || 'Zotero';
  const confidence = Math.max(0, Math.min(Number(prefill.confidenceScore) || 0, 100));
  const escape = typeof escapeHTML === 'function' ? escapeHTML : (s: any) => String(s ?? '');
  const trans = typeof t === 'function' ? t : (k: string) => k;
  return `
    <section class="academic-capture-review" aria-label="${escape(trans('academicCaptureSource'))}">
      <div class="academic-capture-review-icon" aria-hidden="true">S</div>
      <div>
        <strong>${escape(trans('academicCaptureSource'))}</strong>
        <span>${escape(source)}</span>
      </div>
      <div class="academic-capture-confidence">
        <strong>${escape(trans('academicCaptureConfidence'))}</strong>
        <span>${confidence}%</span>
      </div>
    </section>
  `;
}

export const RFAcademicSync = {
  normalizeText,
  normalizeSubmissionStatus,
  normalizeSubmissionStatuses,
  normalizeDoi,
  extractDoiFromText,
  getDashboardFilterLabel,
  getSubmissionAttentionScore,
  getSubmissionDoi,
  getSubmissionJournalName,
  normalizeAuthorName,
  firstAuthorFromList,
  getSubmissionFirstAuthor,
  getSubmissionArticleUrl,
  getSubmissionSortTime,
  sortDashboardSubmissions,
  normalizeSyncedPublicationStatus,
  isSubmissionLifecycleStatus,
  getSubmissionLifecycleRank,
  getLinkedActiveSubmissions,
  syncLinkedSubmissionsFromManuscript,
  setManuscriptStatus,
  persistManuscriptStatusChange,
  syncManuscriptStatusFromSubmission,
  normalizeWorkflowFields,
  validateLinkedManuscriptStatus,
  syncWorkflowAliases,
  syncLinkedManuscriptSnapshots,
  syncManuscriptStatusesFromSubmissions,
  clearOnlinePublicationCompletion,
  createRejectedTimelineNode,
  markSubmissionRejected,
  getNextSubmissionRound,
  createTransferredSubmission,
  getSubmissionBadgeClass,
  splitAcademicAuthors,
  normalizeAcademicTitle,
  normalizeAcademicUrl,
  findAcademicManuscriptMatch,
  academicCaptureProvenance,
  buildAcademicCaptureSummary
};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).RFAcademicSync = RFAcademicSync;
  Object.assign(globalThis, RFAcademicSync);
}
if (typeof window !== 'undefined') {
  (window as any).RFAcademicSync = RFAcademicSync;
  Object.assign(window, RFAcademicSync);
}
