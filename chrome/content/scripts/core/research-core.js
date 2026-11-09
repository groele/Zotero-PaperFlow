/**
 * ----------------------------------------------------------------------------------
 * ⚡ AUTO-GENERATED BUNDLE BY ESBUILD - DO NOT EDIT DIRECTLY
 * ----------------------------------------------------------------------------------
 * Source authority: `src/` TypeScript modules (100% strictly <= 360 lines).
 * Target runtime: Gecko 153+ / Firefox 140+ (minify: false for Error Console audit)
 * ----------------------------------------------------------------------------------
 */
"use strict";
(() => {
  // src/core/research-core.ts
  var MANUSCRIPT_STATUS_ORDER = [
    "planning",
    "idea",
    "outline",
    "data_collection",
    "in_progress",
    "figure_preparation",
    "drafting",
    "internal_review",
    "submitted",
    "under_review",
    "revision",
    "accepted",
    "published",
    "rejected"
  ];
  var KANBAN_STAGE_BY_STATUS = {
    planning: "idea",
    idea: "idea",
    outline: "idea",
    data_collection: "idea",
    in_progress: "drafting",
    figure_preparation: "drafting",
    drafting: "drafting",
    internal_review: "drafting",
    submitted: "submitted",
    under_review: "submitted",
    revision: "submitted",
    accepted: "accepted",
    published: "accepted",
    rejected: "drafting"
  };
  var SUBMISSION_STATUS_TO_MANUSCRIPT_STATUS = {
    submitted: "submitted",
    under_review: "under_review",
    revision: "revision",
    accepted: "accepted",
    published: "published",
    rejected: "in_progress"
  };
  function normalizeStatus(status, fallback = "planning") {
    const value = String(status || fallback).trim().toLowerCase().replace(/[\s-]+/g, "_");
    const aliases = {
      accept: "accepted",
      online: "published",
      publication: "published",
      underreview: "under_review",
      in_review: "under_review",
      review: "under_review",
      revise: "revision",
      revision_required: "revision",
      resubmit: "revision",
      reject: "rejected",
      submit: "submitted"
    };
    return aliases[value] || value || fallback;
  }
  function getKanbanStage(status) {
    return KANBAN_STAGE_BY_STATUS[normalizeStatus(status)] || "idea";
  }
  function toTimestamp(value) {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }
  function submissionRecencyScore(sub) {
    if (!sub) return 0;
    const nodeTimes = (sub.timelineNodes || []).map((node) => Math.max(
      toTimestamp(node.completeDate),
      toTimestamp(node.dueDate),
      toTimestamp(node.planDate),
      toTimestamp(node.updatedAt),
      toTimestamp(node.createdAt)
    ));
    return Math.max(
      toTimestamp(sub.updatedAt),
      toTimestamp(sub.publishedAt),
      toTimestamp(sub.acceptedAt),
      toTimestamp(sub.decisionDate),
      toTimestamp(sub.revisionDueDate),
      toTimestamp(sub.firstDecisionDate),
      toTimestamp(sub.submissionDate),
      toTimestamp(sub.rejectedAt),
      toTimestamp(sub.createdAt),
      ...nodeTimes
    );
  }
  function isTerminalPublicationStatus(status) {
    const normalized = normalizeStatus(status, "submitted");
    return normalized === "accepted" || normalized === "published";
  }
  function getSubmissionsForManuscript(db, manuscriptId) {
    if (!db || !Array.isArray(db.submissions) || !manuscriptId) return [];
    return db.submissions.filter((sub) => sub && sub.manuscriptId === manuscriptId).slice().sort((a, b) => {
      const aPublished = normalizeStatus(a.status) === "published" ? 2 : isTerminalPublicationStatus(a.status) ? 1 : 0;
      const bPublished = normalizeStatus(b.status) === "published" ? 2 : isTerminalPublicationStatus(b.status) ? 1 : 0;
      if (aPublished !== bPublished) return bPublished - aPublished;
      const aActive = normalizeStatus(a.status) !== "rejected" ? 1 : 0;
      const bActive = normalizeStatus(b.status) !== "rejected" ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return submissionRecencyScore(b) - submissionRecencyScore(a);
    });
  }
  function getCurrentSubmission(db, manuscriptId) {
    return getSubmissionsForManuscript(db, manuscriptId)[0] || null;
  }
  function deriveManuscriptStatusFromSubmission(sub, fallbackStatus = "planning") {
    if (!sub) return normalizeStatus(fallbackStatus);
    const status = normalizeStatus(sub.status, "submitted");
    return SUBMISSION_STATUS_TO_MANUSCRIPT_STATUS[status] || normalizeStatus(fallbackStatus);
  }
  function deriveSubmissionStatusFromManuscript(manuscriptStatus, currentSubmissionStatus = "submitted") {
    const normalized = normalizeStatus(manuscriptStatus);
    if (["submitted", "under_review", "revision", "accepted", "published", "rejected"].includes(normalized)) {
      return normalized;
    }
    if (getKanbanStage(normalized) === "submitted") {
      const current = normalizeStatus(currentSubmissionStatus, "submitted");
      return ["submitted", "under_review", "revision"].includes(current) ? current : "submitted";
    }
    return null;
  }
  var RFCore = {
    MANUSCRIPT_STATUS_ORDER,
    KANBAN_STAGE_BY_STATUS,
    SUBMISSION_STATUS_TO_MANUSCRIPT_STATUS,
    normalizeStatus,
    getKanbanStage,
    getSubmissionsForManuscript,
    getCurrentSubmission,
    deriveManuscriptStatusFromSubmission,
    deriveSubmissionStatusFromManuscript
  };
  if (typeof globalThis !== "undefined") {
    globalThis.RFCore = RFCore;
  }
  if (typeof window !== "undefined") {
    window.RFCore = RFCore;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = RFCore;
  }
})();
