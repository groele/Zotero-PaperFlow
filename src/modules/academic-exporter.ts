/**
 * Zotero PaperFlow - Academic Rebuttal Matrix & Response Letter Exporter Entry Point
 */
import {
  escapeLatexText,
  safeEscapeLatex,
  copyRebuttalRichText,
  getSubmissionReviewMatrixRows,
} from './academic-exporter/latex-helpers';

import { generateAcademicRebuttalLetter } from './academic-exporter/rebuttal-letter';
import { generateRevisionCoverLetter } from './academic-exporter/cover-letter';
import { parseReviewCommentsBatch } from './academic-exporter/batch-parser';
import { renderRebuttalProgressTracker } from './academic-exporter/progress-tracker';
import { openBatchReviewImportModal } from './academic-exporter/batch-modal';

export const RFAcademicExport = {
  generateAcademicRebuttalLetter,
  generateRevisionCoverLetter,
  parseReviewCommentsBatch,
  renderRebuttalProgressTracker,
  escapeLatexText,
  safeEscapeLatex,
  copyRebuttalRichText,
  openBatchReviewImportModal,
  getSubmissionReviewMatrixRows,
};

const academicExports = {
  ...RFAcademicExport,
  RFAcademicExport,
};

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, academicExports);
}
if (typeof window !== 'undefined') {
  Object.assign(window, academicExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...(module.exports || {}), ...academicExports };
}
