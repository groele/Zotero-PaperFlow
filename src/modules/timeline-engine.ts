/**
 * Zotero PaperFlow - Timeline Engine Entry Point
 */
import {
  typeMeta,
  getTimelineTypeMeta,
  buildOptions,
  openStageDrawer,
  buildTimelineEventManager,
  openTimelineEventManager,
  deleteTimelineNode
} from './timeline-engine/drawer-and-manager.js';

import {
  getInlineEventPresets,
  getInlineEventPreset,
  buildInlineStageEditor,
  toggleInlineStageEditor,
  syncInlineStagePreset,
  updateInlineStageDeadlineStatus,
  resetInlineStageEditor,
  applyInlineEventToSubmission,
  setInlineStageBusy,
  saveInlineStageEvent
} from './timeline-engine/inline-editor.js';

import {
  todayString,
  normalizeDateString,
  dateInputToIso,
  getNodeDate,
  isReviewTimelineNode,
  getReviewDecisionLabel,
  getLatestTimelineNode,
  createTimelineNode,
  getTimelineNodeDisplayName,
  getDaysDiff,
  getRelativeDateLabel
} from './timeline-engine/node-helpers.js';

import {
  inferKey,
  getTimelineNodeByKey,
  setTimelineNodeDate,
  createCanonicalTimelineNode,
  ensureTimelineNode,
  hasPublicationStatus,
  initializeSubmissionTimelineNodes,
  syncSubmissionFieldsFromTimeline,
  normalizeSubmissionTimeline,
  analyzeSubmission
} from './timeline-engine/normalizer-and-analyzer.js';

import {
  isAcceptedSubmission,
  canHavePublicationLink,
  clearPublicationLinkFields,
  clearPublicationTimelineCompletion,
  clearUnacceptedPublicationLinks,
  getSubmissionCycleTime,
  computeNodeStatus,
  getNodeStatusLabel,
  autoSortNodes,
  getCapsuleIcon,
  formatShortDate,
  getRevisionCountdownMeta,
  formatIcsDate,
  formatIcsDateTime,
  escapeIcsText,
  generateSubmissionCalendarFeed,
  triggerCalendarDownload,
  RFCalendar,
  getExportedEscapeLatex
} from './timeline-engine/calendar-and-status.js';

const timelineExports: Record<string, any> = {
  typeMeta,
  getTimelineTypeMeta,
  buildOptions,
  openStageDrawer,
  buildTimelineEventManager,
  openTimelineEventManager,
  deleteTimelineNode,
  getInlineEventPresets,
  getInlineEventPreset,
  buildInlineStageEditor,
  toggleInlineStageEditor,
  syncInlineStagePreset,
  updateInlineStageDeadlineStatus,
  resetInlineStageEditor,
  applyInlineEventToSubmission,
  setInlineStageBusy,
  saveInlineStageEvent,
  todayString,
  normalizeDateString,
  dateInputToIso,
  getNodeDate,
  isReviewTimelineNode,
  getReviewDecisionLabel,
  getLatestTimelineNode,
  createTimelineNode,
  getTimelineNodeDisplayName,
  getDaysDiff,
  getRelativeDateLabel,
  inferKey,
  getTimelineNodeByKey,
  setTimelineNodeDate,
  createCanonicalTimelineNode,
  ensureTimelineNode,
  hasPublicationStatus,
  initializeSubmissionTimelineNodes,
  syncSubmissionFieldsFromTimeline,
  normalizeSubmissionTimeline,
  analyzeSubmission,
  isAcceptedSubmission,
  canHavePublicationLink,
  clearPublicationLinkFields,
  clearPublicationTimelineCompletion,
  clearUnacceptedPublicationLinks,
  getSubmissionCycleTime,
  computeNodeStatus,
  getNodeStatusLabel,
  autoSortNodes,
  getCapsuleIcon,
  formatShortDate,
  getRevisionCountdownMeta,
  formatIcsDate,
  formatIcsDateTime,
  escapeIcsText,
  generateSubmissionCalendarFeed,
  triggerCalendarDownload,
  RFCalendar
};

const maybeEscapeLatex = getExportedEscapeLatex();
if (maybeEscapeLatex) {
  timelineExports.escapeLatex = maybeEscapeLatex;
}

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, timelineExports);
}
if (typeof window !== 'undefined') {
  Object.assign(window, timelineExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...(module.exports || {}), ...timelineExports };
}
