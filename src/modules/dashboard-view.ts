/**
 * Zotero PaperFlow - Dashboard View Entry Point
 */
import {
  firstAuthorFromList,
  normalizeWorkflowFields,
  getSubmissionFirstAuthor,
  getSubmissionDoi,
  getSubmissionJournalName,
  getSubmissionArticleUrl,
  todayString,
  normalizeDateString,
  addDays,
  dateInputToIso,
  getNodeDate,
  getLatestTimelineNode,
  getRelativeDayLabel,
  getDaysDiff,
  average,
  getSubmissionSortableTimestamp,
  sortDashboardSubmissions,
  createTimelineNode
} from './dashboard-view/field-helpers.js';

import {
  markSubmissionRejected,
  syncManuscriptStatusFromSubmission,
  syncManuscriptStatusesFromSubmissions,
  clearOnlinePublicationCompletion,
  syncLinkedSubmissionsFromManuscript,
  createTransferredSubmission,
  setPipelineViewMode,
  updatePipelineViewToggle,
  initializePipelineViewMode,
  setDashboardFilter,
  updateDashboardFilterUI,
  getDashboardFilterLabel
} from './dashboard-view/transfer-and-status.js';

import {
  bindDashboardControls,
  renderDashboard,
  renderTimelineAlerts
} from './dashboard-view/pipeline-renderer.js';

import {
  setupSaveErrorListener,
  setupDashboardFilterListeners
} from './dashboard-view/card-interactions.js';

bindDashboardControls();
initializePipelineViewMode();
setupSaveErrorListener();
setupDashboardFilterListeners();

const dashboardExports = {
  firstAuthorFromList,
  normalizeWorkflowFields,
  getSubmissionFirstAuthor,
  getSubmissionDoi,
  getSubmissionJournalName,
  getSubmissionArticleUrl,
  todayString,
  normalizeDateString,
  addDays,
  dateInputToIso,
  getNodeDate,
  getLatestTimelineNode,
  getRelativeDayLabel,
  getDaysDiff,
  average,
  getSubmissionSortableTimestamp,
  sortDashboardSubmissions,
  createTimelineNode,
  markSubmissionRejected,
  syncManuscriptStatusFromSubmission,
  syncManuscriptStatusesFromSubmissions,
  clearOnlinePublicationCompletion,
  syncLinkedSubmissionsFromManuscript,
  createTransferredSubmission,
  setPipelineViewMode,
  updatePipelineViewToggle,
  initializePipelineViewMode,
  setDashboardFilter,
  updateDashboardFilterUI,
  getDashboardFilterLabel,
  bindDashboardControls,
  setupSaveErrorListener,
  setupDashboardFilterListeners,
  renderDashboard,
  renderTimelineAlerts
};

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, dashboardExports);
}
if (typeof window !== 'undefined') {
  Object.assign(window, dashboardExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...(module.exports || {}), ...dashboardExports };
}
