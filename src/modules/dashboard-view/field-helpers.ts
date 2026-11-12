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

function formatCalendarParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseCalendarParts(dateStr: any): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  if (typeof dateStr === 'string') {
    const trimmed = dateStr.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.000)?Z$)/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const probe = new Date(Date.UTC(year, month - 1, day));
      if (probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day) {
        return { year, month, day };
      }
      return null;
    }
  }
  try {
    const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  } catch (_) {
    return null;
  }
}

export function todayString(): string {
  const now = new Date();
  return formatCalendarParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function normalizeDateString(dateStr: any): string {
  const parts = parseCalendarParts(dateStr);
  return parts ? formatCalendarParts(parts.year, parts.month, parts.day) : '';
}

export function addDays(dateStr: string, days: number): string {
  const base = normalizeDateString(dateStr) || todayString();
  const parts = parseCalendarParts(base)!;
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return formatCalendarParts(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

export function dateInputToIso(dateStr: string): string | null {
  const normalized = normalizeDateString(dateStr);
  return normalized ? `${normalized}T12:00:00.000Z` : null;
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
  const target = parseCalendarParts(dateStr);
  const now = parseCalendarParts(todayString());
  if (!target || !now) return '';
  const diffDays = Math.round(
    (Date.UTC(target.year, target.month - 1, target.day) - Date.UTC(now.year, now.month - 1, now.day)) / 86400000
  );
  if (diffDays === 0) return t('relativeToday');
  if (diffDays < 0) return tf('relativeDaysAgo', { count: Math.abs(diffDays) });
  return tf('relativeInDays', { count: diffDays });
}

export function getDaysDiff(startDateStr: any, endDateStr: any): number | null {
  const start = parseCalendarParts(startDateStr);
  const end = parseCalendarParts(endDateStr);
  if (!start || !end) return null;
  const s = Date.UTC(start.year, start.month - 1, start.day);
  const e = Date.UTC(end.year, end.month - 1, end.day);
  return Math.max(0, Math.round((e - s) / 86400000));
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
