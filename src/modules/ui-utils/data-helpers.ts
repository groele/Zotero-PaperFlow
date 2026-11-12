/**
 * Zotero PaperFlow - UI Data & Domain Validation Helpers
 */

const DOI_TEXT_PATTERN = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;
const URL_TEXT_PATTERN = /^https?:\/\/\S+$/i;

export function escapeHTML(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function cleanText(value: any, maxLength = 500): string {
  return String(value ?? '').trim().slice(0, maxLength);
}

export function normalizeIdentifier(value: any): string {
  return cleanText(value, 300).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
}

export function isValidDoiOrBlank(value: any): boolean {
  const normalized = normalizeIdentifier(value);
  return !normalized || DOI_TEXT_PATTERN.test(normalized);
}

export function isValidHttpUrlOrBlank(value: any): boolean {
  const text = cleanText(value, 1000);
  if (!text) return true;
  if (!URL_TEXT_PATTERN.test(text)) return false;
  try {
    const parsed = new URL(text);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export function isSafeWebUrl(value: any): boolean {
  const text = cleanText(value, 1000);
  return Boolean(text) && isValidHttpUrlOrBlank(text);
}

export function normalizeReviewMatrixRow(row: any = {}, index = 0): any {
  const statusRaw = cleanText(row.status, 30).toLowerCase();
  const validStatuses = ['pending', 'in_progress', 'addressed', 'clarified'];
  const comment = cleanText(row.comment, 8000);
  const response = cleanText(row.response, 12000);
  const changes = cleanText(row.changes, 4000);
  let status = validStatuses.includes(statusRaw) ? statusRaw : '';
  if (!status) {
    status = response ? 'addressed' : 'pending';
  }
  return {
    id: cleanText(row.id, 80) || `rev_${index + 1}`,
    reviewer: cleanText(row.reviewer, 60) || 'Reviewer #1',
    status,
    comment,
    response,
    changes
  };
}

export function normalizeReviewMatrix(rows: any[] = []): any[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row, index) => normalizeReviewMatrixRow(row, index))
    .filter((row) => row.comment || row.response || row.changes);
}

export function getTimelineEventDate(node: any = {}, key = ''): string {
  if (!node || typeof node !== 'object') return '';
  if (key === 'submit') return cleanText(node.completeDate || node.planDate || node.dueDate, 40);
  if (key === 'r1_comments' || key === 'accept' || key === 'online') {
    return cleanText(node.completeDate, 40);
  }
  return cleanText(node.completeDate || node.planDate || node.dueDate, 40);
}

export function getSubmissionStatusBadgeClass(status: any): string {
  const normalized = cleanText(status || 'submitted', 40).toLowerCase().replace(/[\s-]+/g, '_');
  const statusTone: Record<string, string> = {
    submitted: 'badge-info',
    under_review: 'badge-purple',
    revision: 'badge-warning',
    accepted: 'badge-success',
    published: 'badge-success',
    rejected: 'badge-danger'
  };
  return `badge ${statusTone[normalized] || 'badge-info'}`;
}

export function shouldCelebrateAcceptance(previousStatus: any, nextStatus: any): boolean {
  const prev = cleanText(previousStatus, 40).toLowerCase().replace(/[\s-]+/g, '_');
  const next = cleanText(nextStatus, 40).toLowerCase().replace(/[\s-]+/g, '_');
  const wasAccepted = prev === 'accepted' || prev === 'published';
  const isAccepted = next === 'accepted' || next === 'published';
  return !wasAccepted && isAccepted;
}

export function buildSubmissionCreateMode(input: any = {}): any {
  const selectedId = cleanText(input.selectedManuscriptId, 120);
  const newTitle = cleanText(input.newManuscriptTitle, 300);
  const targetJournal = cleanText(input.targetJournal, 200);
  if (!targetJournal) {
    return { ok: false, error: 'Manuscript and Journal are required' };
  }
  if (selectedId === '__new__' || !selectedId) {
    if (!newTitle) {
      return { ok: false, error: 'Enter a manuscript title before continuing.' };
    }
    return {
      ok: true,
      mode: 'new',
      manuscriptId: null,
      title: newTitle,
      targetJournal
    };
  }
  return {
    ok: true,
    mode: 'existing',
    manuscriptId: selectedId,
    title: null,
    targetJournal
  };
}

export function buildSubmissionRelationshipSummary(input: any = {}): any {
  const submission = input.submission || {};
  const manuscript = input.manuscript || null;
  const project = input.project || null;
  const records = Array.isArray(input.records) ? input.records : [];
  const projectId = manuscript?.projectId || submission.projectId || project?.id || null;
  const relatedRecordCount = projectId
    ? records.filter((record: any) => record?.projectId === projectId).length
    : 0;
  const reviewRows = normalizeReviewMatrix(submission.reviewMatrix);
  const timelineNodes = Array.isArray(submission.timelineNodes) ? submission.timelineNodes : [];
  const completedNodes = timelineNodes.filter((node: any) => Boolean(node?.completeDate || node?.status === 'completed')).length;

  return {
    hasManuscript: Boolean(manuscript),
    hasProject: Boolean(project),
    manuscriptId: manuscript?.id || submission.manuscriptId || null,
    manuscriptTitle: cleanText(manuscript?.title || submission.title, 300) || 'Untitled Manuscript',
    manuscriptStatus: cleanText(manuscript?.status, 60) || null,
    projectId,
    projectTitle: cleanText(project?.title, 200) || null,
    relatedRecordCount,
    reviewerCommentCount: reviewRows.length,
    timelineNodeCount: timelineNodes.length,
    completedTimelineNodeCount: completedNodes,
    isOrphanSubmission: !manuscript
  };
}

export function getPipelineTitleDisplay(input: any = {}): any {
  const title = cleanText(input.title, 300) || 'Untitled Manuscript';
  return {
    fullTitle: title,
    displayTitle: title,
    showTooltip: true
  };
}

export function buildSubmissionEditSyncPlan(input: any = {}): any {
  const title = cleanText(input.title, 300);
  const journal = cleanText(input.journal, 200);
  const journalUrl = cleanText(input.journalUrl, 1000);
  const externalManuscriptId = cleanText(input.externalManuscriptId, 120);
  const status = cleanText(input.status || 'submitted', 40).toLowerCase().replace(/[\s-]+/g, '_');
  const submissionDate = cleanText(input.submissionDate, 40);
  const firstDecisionDate = cleanText(input.firstDecisionDate, 40);
  const revisionDueDate = cleanText(input.revisionDueDate, 40);
  const decisionDate = cleanText(input.decisionDate, 40);
  const doi = normalizeIdentifier(input.doi);
  const articleUrl = cleanText(input.articleUrl, 1000);
  const canKeepPublicationLinks = status === 'accepted' || status === 'published' || Boolean(decisionDate);

  if (!title || !journal) {
    return { ok: false, error: 'Manuscript title and journal are required.' };
  }
  if (!isValidHttpUrlOrBlank(journalUrl)) {
    return { ok: false, error: 'Please enter a valid portal URL, or leave it blank.' };
  }
  if (canKeepPublicationLinks && !isValidDoiOrBlank(doi)) {
    return { ok: false, error: 'Please enter a valid DOI, such as 10.1002/adfm.202528029, or leave it blank.' };
  }
  if (canKeepPublicationLinks && !isValidHttpUrlOrBlank(articleUrl)) {
    return { ok: false, error: 'Please enter a valid article URL starting with https:// or leave it blank.' };
  }

  return {
    ok: true,
    manuscriptPatch: {
      title,
      targetJournals: [journal]
    },
    detachedSubmissionTitle: title,
    submissionPatch: {
      targetJournal: journal,
      journalUrl: journalUrl || null,
      externalManuscriptId: externalManuscriptId || null,
      status,
      submissionDate: submissionDate
        ? (/^\d{4}-\d{2}-\d{2}$/.test(submissionDate) ? `${submissionDate}T12:00:00.000Z` : new Date(submissionDate).toISOString())
        : null,
      firstDecisionDate: firstDecisionDate
        ? (/^\d{4}-\d{2}-\d{2}$/.test(firstDecisionDate) ? `${firstDecisionDate}T12:00:00.000Z` : new Date(firstDecisionDate).toISOString())
        : null,
      revisionDueDate: revisionDueDate
        ? (/^\d{4}-\d{2}-\d{2}$/.test(revisionDueDate) ? `${revisionDueDate}T12:00:00.000Z` : new Date(revisionDueDate).toISOString())
        : null,
      decisionDate: decisionDate
        ? (/^\d{4}-\d{2}-\d{2}$/.test(decisionDate) ? `${decisionDate}T12:00:00.000Z` : new Date(decisionDate).toISOString())
        : null
    },
    publicationPatch: canKeepPublicationLinks
      ? {
          doi: doi || null,
          articleUrl: articleUrl || (doi ? `https://doi.org/${doi}` : null)
        }
      : null,
    shouldMarkRejected: status === 'rejected',
    rejectionDate: decisionDate || null,
    shouldClearPublication: !canKeepPublicationLinks
  };
}
