/**
 * Zotero PaperFlow - Dashboard Field Normalization, Authors & Date Math Helpers
 */
declare var db: any;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function normalizeDoi(value: any): string;
declare function extractDoiFromText(value: any): string;
declare function inferKey(node: any): string;
declare function canHavePublicationLink(sub: any): boolean;

export function firstAuthorFromList(authors: any): string {
  if (Array.isArray(authors)) return String(authors[0] || '').trim();
  const raw = String(authors || '').trim();
  if (!raw) return '';
  return raw.split(/\s*(?:;|,|，|、|\band\b)\s*/i).map((item) => item.trim()).filter(Boolean)[0] || '';
}

export function normalizeWorkflowFields(record: any): boolean {
  if (!record || typeof record !== 'object') return false;
  let changed = false;
  const externalId = String(
    record.externalManuscriptId || record.manuscriptNumber || record.trackingId || record.submissionCode || ''
  ).trim();
  if (externalId && record.externalManuscriptId !== externalId) {
    record.externalManuscriptId = externalId;
    changed = true;
  }
  const firstAuthor = String(record.firstAuthor || firstAuthorFromList(record.authors) || '').trim();
  if (firstAuthor && record.firstAuthor !== firstAuthor) {
    record.firstAuthor = firstAuthor;
    changed = true;
  }
  if (!Array.isArray(record.authors) && firstAuthor) {
    record.authors = [firstAuthor];
    changed = true;
  }
  return changed;
}

export function getSubmissionFirstAuthor(sub: any, man = db?.manuscripts?.find((item: any) => item.id === sub?.manuscriptId)): string {
  return String(
    sub?.firstAuthor ||
    man?.firstAuthor ||
    firstAuthorFromList(sub?.authors) ||
    firstAuthorFromList(man?.authors) ||
    ''
  ).trim();
}

export function getSubmissionDoi(sub: any): string {
  if (!canHavePublicationLink(sub)) return '';
  const direct = normalizeDoi(sub?.doi || sub?.DOI || sub?.articleDoi || '');
  if (direct) return direct;
  const fromUrl = extractDoiFromText(sub?.articleUrl || sub?.publicationUrl || sub?.journalUrl || '');
  if (fromUrl) return fromUrl;
  return (sub?.timelineNodes || [])
    .map((node: any) => extractDoiFromText(`${node.name || ''} ${node.notes || ''}`))
    .find(Boolean) || '';
}

export function getSubmissionJournalName(sub: any): string {
  const man = (db.manuscripts || []).find((m: any) => m.id === sub?.manuscriptId);
  const raw = sub?.targetJournal
    || sub?.journalName
    || sub?.journal
    || sub?.publicationVenue
    || (Array.isArray(man?.targetJournals) ? man.targetJournals[0] : '')
    || '';
  return String(raw).trim() || t('targetJournal');
}

export function getSubmissionArticleUrl(sub: any): string {
  if (!canHavePublicationLink(sub)) return '';
  const explicitUrl = String(sub?.articleUrl || sub?.publicationUrl || sub?.journalArticleUrl || '').trim();
  if (explicitUrl) return explicitUrl;
  const doi = getSubmissionDoi(sub);
  return doi ? `https://doi.org/${doi}` : '';
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function normalizeDateString(dateStr: any): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (_) {
    return '';
  }
}

export function addDays(dateStr: string, days: number): string {
  const base = normalizeDateString(dateStr) || todayString();
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function dateInputToIso(dateStr: string): string | null {
  const normalized = normalizeDateString(dateStr);
  return normalized ? new Date(normalized + 'T12:00:00').toISOString() : null;
}

export function getNodeDate(node: any): string {
  if (!node) return '';
  return normalizeDateString(node.completeDate || node.dueDate || node.planDate || '');
}

export function getLatestTimelineNode(nodes: any[] = []): any | null {
  const dated = nodes
    .map((node: any) => ({ node, date: getNodeDate(node) }))
    .filter((item) => item.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return dated.length ? dated[dated.length - 1].node : (nodes[nodes.length - 1] || null);
}

export function getRelativeDayLabel(dateStr: any): string {
  const normalized = normalizeDateString(dateStr);
  if (!normalized) return '';
  const target = new Date(normalized + 'T00:00:00').getTime();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t('relativeToday');
  if (diffDays < 0) return tf('relativeDaysAgo', { count: Math.abs(diffDays) });
  return tf('relativeInDays', { count: diffDays });
}

export function getDaysDiff(startDateStr: any, endDateStr: any): number | null {
  const start = normalizeDateString(startDateStr);
  const end = normalizeDateString(endDateStr);
  if (!start || !end) return null;
  const s = new Date(start + 'T00:00:00').getTime();
  const e = new Date(end + 'T00:00:00').getTime();
  if (isNaN(s) || isNaN(e)) return null;
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

export function average(values: any[]): number | null {
  const valid = values.filter((v) => typeof v === 'number' && !isNaN(v));
  if (!valid.length) return null;
  return Math.round(valid.reduce((sum, v) => sum + v, 0) / valid.length);
}

export function getSubmissionSortableTimestamp(sub: any): number {
  const explicitSubmitDate = normalizeDateString(sub?.submissionDate);
  const submitNode = (sub?.timelineNodes || []).find((node: any) => inferKey(node) === 'submit');
  const timelineSubmitDate = normalizeDateString(getNodeDate(submitNode));
  const rawDate = explicitSubmitDate || timelineSubmitDate || sub?.createdAt || sub?.updatedAt || '';
  if (!rawDate) return 0;
  const timestamp = new Date(rawDate).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function sortDashboardSubmissions(submissions: any[] = []): any[] {
  return [...submissions].sort((a, b) => {
    const timeDiff = getSubmissionSortableTimestamp(b) - getSubmissionSortableTimestamp(a);
    if (timeDiff !== 0) return timeDiff;
    return String(b?.id || '').localeCompare(String(a?.id || ''));
  });
}

export function createTimelineNode(subId: string, values: any = {}): any {
  const now = new Date().toISOString();
  return {
    id: values.id || `tn_${Math.random().toString(36).substring(2, 9)}`,
    submissionId: subId,
    name: values.name || 'Untitled Event',
    type: values.type || 'research',
    status: values.status || 'pending',
    key: values.key || 'auto',
    planDate: normalizeDateString(values.planDate),
    dueDate: normalizeDateString(values.dueDate),
    completeDate: normalizeDateString(values.completeDate),
    reviewDecision: values.reviewDecision || '',
    notes: values.notes || '',
    createdAt: values.createdAt || now,
    updatedAt: now
  };
}
