import {
  focusSubmissionEditCenter,
  canLeaveSubmissionEditor,
  openSubmissionForEditing,
  navigateToSubmissionDetails,
  getSubmissionEditValues,
  setupSubmissionAutoSave,
} from './submissions-view/autosave-and-editor';

import {
  applySubmissionEditSync,
  refreshSubmissionStatusPresentation,
  saveSubmissionEditFromValues,
} from './submissions-view/editor-sync';

import {
  getDefaultSubmissionChecklistKeys,
  getSubmissionChecklistKeys,
  getSubmissionReviewMatrixRows,
  collectSubmissionChecklistFromEditor,
  collectSubmissionChecklistKeysFromEditor,
  collectSubmissionReviewMatrixFromEditor,
  createSubmissionReviewEditorRow,
  reindexSubmissionReviewEditorRows,
  renderSubmissionChecklistEditor,
  renderSubmissionReviewMatrixEditor,
  renderSubmissionReviewPreview,
} from './submissions-view/checklist-and-matrix';

import {
  setupSubmissionSearch,
  applySubmissionSearch,
  renderSubmissions,
  renderJournalPortals,
  openJournalPortalEditor,
  setupJournalPortalListeners,
  openLinkSubmissionModal,
  escapeLatexText,
  safeEscapeLatex,
  copyRebuttalRichText,
  generateAcademicRebuttalLetter,
  parseReviewCommentsBatch,
  renderRebuttalProgressTracker,
  generateRevisionCoverLetter,
  openBatchReviewImportModal,
} from './submissions-view/list-and-portals';

import { renderSubmissionDetails } from './submissions-view/details-renderer';
import { openAcademicRebuttalExportModal } from './submissions-view/rebuttal-export-modal';
import {
  openTransferSubmissionModal,
  bindTrackSubmissionButton,
  openTrackSubmissionModal,
} from './submissions-view/modals-and-creation';

declare const module: any;

setupJournalPortalListeners();
bindTrackSubmissionButton();
setupSubmissionSearch();

const exportedApi = {
  focusSubmissionEditCenter,
  canLeaveSubmissionEditor,
  openSubmissionForEditing,
  navigateToSubmissionDetails,
  getDefaultSubmissionChecklistKeys,
  getSubmissionChecklistKeys,
  getSubmissionReviewMatrixRows,
  collectSubmissionChecklistFromEditor,
  collectSubmissionChecklistKeysFromEditor,
  collectSubmissionReviewMatrixFromEditor,
  createSubmissionReviewEditorRow,
  reindexSubmissionReviewEditorRows,
  renderSubmissionChecklistEditor,
  renderSubmissionReviewMatrixEditor,
  renderSubmissionReviewPreview,
  getSubmissionEditValues,
  applySubmissionEditSync,
  refreshSubmissionStatusPresentation,
  saveSubmissionEditFromValues,
  setupSubmissionAutoSave,
  setupSubmissionSearch,
  applySubmissionSearch,
  renderSubmissions,
  renderJournalPortals,
  openJournalPortalEditor,
  setupJournalPortalListeners,
  openLinkSubmissionModal,
  escapeLatexText,
  safeEscapeLatex,
  copyRebuttalRichText,
  generateAcademicRebuttalLetter,
  parseReviewCommentsBatch,
  renderRebuttalProgressTracker,
  generateRevisionCoverLetter,
  openBatchReviewImportModal,
  renderSubmissionDetails,
  openAcademicRebuttalExportModal,
  openTransferSubmissionModal,
  openTrackSubmissionModal,
};

const g = (typeof globalThis !== 'undefined' ? globalThis : window) as any;
Object.assign(g, exportedApi);

if (typeof window !== 'undefined') {
  Object.assign(window as any, exportedApi);
  (window as any).RFAcademicExport = (window as any).RFAcademicExport || {
    generateAcademicRebuttalLetter,
    generateRevisionCoverLetter,
    parseReviewCommentsBatch,
    renderRebuttalProgressTracker,
    escapeLatexText,
    safeEscapeLatex,
    copyRebuttalRichText,
    openBatchReviewImportModal,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...(module.exports || {}),
    ...exportedApi,
  };
}
