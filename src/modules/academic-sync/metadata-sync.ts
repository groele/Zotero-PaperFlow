/**
 * Zotero PaperFlow - Academic Metadata Parsing & Dashboard Utilities
 */

declare var currentDashboardFilter: any;
declare var t: (key: string) => string;
declare var analyzeSubmission: (sub: any) => any;
declare var computeNodeStatus: (node: any) => string;

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
  if (sub?.doi) return normalizeDoi(sub.doi);
  if (Array.isArray(sub?.timelineNodes)) {
    for (const node of sub.timelineNodes) {
      if (node.doi) return normalizeDoi(node.doi);
      const extracted = extractDoiFromText(node.note);
      if (extracted) return extracted;
    }
  }
  return '';
}

export function getSubmissionJournalName(sub: any): string {
  return (sub?.targetJournal || sub?.journal || '').trim();
}

export function normalizeAuthorName(author: any): string {
  if (!author) return '';
  if (typeof author === 'string') return author.trim();
  return (author.lastName || author.name || `${author.firstName || ''} ${author.lastName || ''}`).trim();
}

export function firstAuthorFromList(authors: any): string {
  if (!authors) return '';
  if (Array.isArray(authors)) {
    return normalizeAuthorName(authors[0]);
  }
  if (typeof authors === 'string') {
    const list = authors.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
    return list[0] || '';
  }
  return '';
}

export function getSubmissionFirstAuthor(sub: any, manuscript: any = null): string {
  if (manuscript?.firstAuthor) return manuscript.firstAuthor;
  if (manuscript?.authors) return firstAuthorFromList(manuscript.authors);
  if (sub?.firstAuthor) return sub.firstAuthor;
  if (sub?.authors) return firstAuthorFromList(sub.authors);
  return '';
}

export function getSubmissionArticleUrl(sub: any): string {
  if (sub?.articleUrl) return sub.articleUrl.trim();
  if (sub?.publicationUrl) return sub.publicationUrl.trim();
  const doi = getSubmissionDoi(sub);
  return doi ? `https://doi.org/${doi}` : '';
}

export function getSubmissionSortTime(sub: any): number {
  const d = sub?.submissionDate || sub?.updatedAt || sub?.createdAt;
  if (!d) return 0;
  const time = new Date(d).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortDashboardSubmissions(submissions: any[]): any[] {
  if (!Array.isArray(submissions)) return [];
  return [...submissions].sort((a, b) => {
    const scoreA = getSubmissionAttentionScore(a);
    const scoreB = getSubmissionAttentionScore(b);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return getSubmissionSortTime(b) - getSubmissionSortTime(a);
  });
}

export function getSubmissionBadgeClass(sub: any): string {
  const status = (sub?.status || 'submitted').toLowerCase();
  const map: Record<string, string> = {
    submitted: 'rf-badge-submitted',
    under_review: 'rf-badge-under-review',
    revision: 'rf-badge-revision',
    accepted: 'rf-badge-accepted',
    published: 'rf-badge-published',
    rejected: 'rf-badge-rejected'
  };
  return map[status] || 'rf-badge-default';
}

export function splitAcademicAuthors(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => normalizeAuthorName(v)).filter(Boolean);
  return String(value)
    .split(/[,;\n]+| and /i)
    .map(s => s.trim())
    .filter(Boolean);
}

export function normalizeAcademicTitle(value: any): string {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function normalizeAcademicUrl(value: any): string {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('10.')) return `https://doi.org/${url}`;
  return `https://${url}`;
}

export function findAcademicManuscriptMatch({ title, doi, articleUrl }: any, database: any = null): any {
  if (!database?.manuscripts) return null;
  const normTitle = normalizeAcademicTitle(title).toLowerCase();
  const normDoi = normalizeDoi(doi);

  for (const m of database.manuscripts) {
    if (normDoi && m.doi && normalizeDoi(m.doi) === normDoi) return m;
    if (normTitle && m.title && normalizeAcademicTitle(m.title).toLowerCase() === normTitle) return m;
  }
  return null;
}

export function academicCaptureProvenance(prefill: any): any {
  return {
    source: prefill?.source || 'manual',
    capturedAt: new Date().toISOString(),
    doi: prefill?.doi ? normalizeDoi(prefill.doi) : null,
    itemKey: prefill?.itemKey || null
  };
}

export function buildAcademicCaptureSummary(prefill: any): string {
  const parts: string[] = [];
  if (prefill?.title) parts.push(`Title: ${prefill.title}`);
  if (prefill?.journal) parts.push(`Journal: ${prefill.journal}`);
  if (prefill?.doi) parts.push(`DOI: ${prefill.doi}`);
  return parts.join(' | ');
}
