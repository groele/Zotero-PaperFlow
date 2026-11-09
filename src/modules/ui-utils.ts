/**
 * Zotero PaperFlow - UI Utilities Entry Point
 */
import {
  escapeHTML,
  cleanText,
  normalizeIdentifier,
  isValidDoiOrBlank,
  isValidHttpUrlOrBlank,
  isSafeWebUrl,
  normalizeReviewMatrixRow,
  normalizeReviewMatrix,
  getTimelineEventDate,
  getSubmissionStatusBadgeClass,
  shouldCelebrateAcceptance,
  buildSubmissionCreateMode,
  buildSubmissionRelationshipSummary,
  getPipelineTitleDisplay,
  buildSubmissionEditSyncPlan
} from './ui-utils/data-helpers.js';

import {
  normalizeSearchText,
  matchesSubmissionSearch,
  createFragment,
  setHTML,
  getDirtyViewsSet,
  isViewDeferred,
  prefersReducedMotion,
  animateMetricValue,
  captureElementRects,
  playFlipAnimation
} from './ui-utils/dom-helpers.js';

export const RFUI = {
  escapeHTML,
  cleanText,
  normalizeIdentifier,
  isValidDoiOrBlank,
  isValidHttpUrlOrBlank,
  isSafeWebUrl,
  normalizeReviewMatrixRow,
  normalizeReviewMatrix,
  getTimelineEventDate,
  getSubmissionStatusBadgeClass,
  shouldCelebrateAcceptance,
  buildSubmissionCreateMode,
  buildSubmissionRelationshipSummary,
  getPipelineTitleDisplay,
  buildSubmissionEditSyncPlan,
  normalizeSearchText,
  matchesSubmissionSearch,
  createFragment,
  setHTML,
  getDirtyViewsSet,
  isViewDeferred,
  prefersReducedMotion,
  animateMetricValue,
  captureElementRects,
  playFlipAnimation
};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).RFUI = RFUI;
  (globalThis as any).escapeHTML = escapeHTML;
}
if (typeof window !== 'undefined') {
  (window as any).RFUI = RFUI;
  (window as any).escapeHTML = escapeHTML;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...RFUI, escapeHTML };
}
