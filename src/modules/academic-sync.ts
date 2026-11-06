/**
 * Zotero PaperFlow - Academic Metadata & Status Sync Module
 */

import {
  normalizeText,
  normalizeSubmissionStatus,
  normalizeWorkflowFields,
  normalizeSubmissionStatuses,
  normalizeSyncedPublicationStatus,
  isSubmissionLifecycleStatus,
  getSubmissionLifecycleRank,
  getLinkedActiveSubmissions,
  syncLinkedSubmissionsFromManuscript,
  setManuscriptStatus,
  syncManuscriptStatusFromSubmission,
  validateLinkedManuscriptStatus,
  syncWorkflowAliases,
  syncLinkedManuscriptSnapshots,
  syncManuscriptStatusesFromSubmissions,
  clearOnlinePublicationCompletion,
  createRejectedTimelineNode,
  markSubmissionRejected,
  getNextSubmissionRound,
  createTransferredSubmission
} from './academic-sync/status-sync.js';

import {
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
  getSubmissionBadgeClass,
  splitAcademicAuthors,
  normalizeAcademicTitle,
  normalizeAcademicUrl,
  findAcademicManuscriptMatch,
  academicCaptureProvenance,
  buildAcademicCaptureSummary
} from './academic-sync/metadata-sync.js';

export {
  normalizeText,
  normalizeSubmissionStatus,
  normalizeWorkflowFields,
  normalizeSubmissionStatuses,
  normalizeSyncedPublicationStatus,
  isSubmissionLifecycleStatus,
  getSubmissionLifecycleRank,
  getLinkedActiveSubmissions,
  syncLinkedSubmissionsFromManuscript,
  setManuscriptStatus,
  syncManuscriptStatusFromSubmission,
  validateLinkedManuscriptStatus,
  syncWorkflowAliases,
  syncLinkedManuscriptSnapshots,
  syncManuscriptStatusesFromSubmissions,
  clearOnlinePublicationCompletion,
  createRejectedTimelineNode,
  markSubmissionRejected,
  getNextSubmissionRound,
  createTransferredSubmission,
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
  getSubmissionBadgeClass,
  splitAcademicAuthors,
  normalizeAcademicTitle,
  normalizeAcademicUrl,
  findAcademicManuscriptMatch,
  academicCaptureProvenance,
  buildAcademicCaptureSummary
};

export const RFAcademicSync = {
  normalizeText,
  normalizeSubmissionStatus,
  normalizeWorkflowFields,
  normalizeSubmissionStatuses,
  normalizeSyncedPublicationStatus,
  isSubmissionLifecycleStatus,
  getSubmissionLifecycleRank,
  getLinkedActiveSubmissions,
  syncLinkedSubmissionsFromManuscript,
  setManuscriptStatus,
  syncManuscriptStatusFromSubmission,
  validateLinkedManuscriptStatus,
  syncWorkflowAliases,
  syncLinkedManuscriptSnapshots,
  syncManuscriptStatusesFromSubmissions,
  clearOnlinePublicationCompletion,
  createRejectedTimelineNode,
  markSubmissionRejected,
  getNextSubmissionRound,
  createTransferredSubmission,
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
