/**
 * Zotero PaperFlow - Peer Review Matrix & Compliance Checklist Entry Point
 */
import {
  getSubmissionChecklistPreset,
  getSubmissionChecklistLabel,
  isSubmissionChecklistDone,
  setSubmissionChecklistDone,
  getSubmissionChecklistKeys,
  collectSubmissionChecklistFromEditor,
  collectSubmissionChecklistKeysFromEditor,
  renderSubmissionChecklistEditor
} from './review-matrix/checklist.js';

import {
  getSubmissionReviewMatrixRows,
  collectSubmissionReviewMatrixFromEditor,
  updateSubmissionRebuttalProgress,
  applyReviewMatrixFilter,
  renderSubmissionReviewMatrixEditor,
  renderSubmissionReviewPreview
} from './review-matrix/editor-and-filters.js';

const reviewMatrixExports = {
  getSubmissionChecklistPreset,
  getSubmissionChecklistLabel,
  isSubmissionChecklistDone,
  setSubmissionChecklistDone,
  getSubmissionChecklistKeys,
  collectSubmissionChecklistFromEditor,
  collectSubmissionChecklistKeysFromEditor,
  renderSubmissionChecklistEditor,
  getSubmissionReviewMatrixRows,
  collectSubmissionReviewMatrixFromEditor,
  updateSubmissionRebuttalProgress,
  applyReviewMatrixFilter,
  renderSubmissionReviewMatrixEditor,
  renderSubmissionReviewPreview
};

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, reviewMatrixExports);
}
if (typeof window !== 'undefined') {
  Object.assign(window, reviewMatrixExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...(module.exports || {}), ...reviewMatrixExports };
}
