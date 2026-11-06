"use strict";
(() => {
  // src/modules/academic-sync/status-sync.ts
  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }
  function normalizeSubmissionStatus(value) {
    const normalized = normalizeText(value).replace(/[\s-]+/g, "_");
    const aliases = {
      accept: "accepted",
      accepted: "accepted",
      online: "published",
      publication: "published",
      published: "published",
      underreview: "under_review",
      in_review: "under_review",
      review: "under_review",
      revise: "revision",
      revision_required: "revision",
      resubmit: "revision",
      reject: "rejected",
      rejected: "rejected",
      submit: "submitted"
    };
    const canonical = aliases[normalized] || normalized;
    return ["submitted", "under_review", "revision", "accepted", "published", "rejected"].includes(canonical) ? canonical : "submitted";
  }
  function normalizeWorkflowFields(sub) {
    if (!sub || typeof sub !== "object") return false;
    let changed = false;
    if (!sub.targetJournal && sub.journal) {
      sub.targetJournal = sub.journal;
      changed = true;
    }
    return changed;
  }
  function normalizeSubmissionStatuses(database) {
    let changed = false;
    (database?.submissions || []).forEach((submission) => {
      changed = normalizeWorkflowFields(submission) || changed;
      const canonical = normalizeSubmissionStatus(submission.status);
      if (submission.status !== canonical) {
        submission.status = canonical;
        submission.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        changed = true;
      }
    });
    return changed;
  }
  function normalizeSyncedPublicationStatus(status) {
    const normalized = normalizeSubmissionStatus(status);
    return normalized === "published" ? "published" : "accepted";
  }
  function isSubmissionLifecycleStatus(status) {
    const s = String(status || "").toLowerCase();
    return ["submitted", "under_review", "revision", "accepted", "published"].includes(s);
  }
  function getSubmissionLifecycleRank(status) {
    const rankMap = {
      submitted: 1,
      under_review: 2,
      revision: 3,
      accepted: 4,
      published: 5
    };
    return rankMap[String(status || "").toLowerCase()] || 0;
  }
  function getLinkedActiveSubmissions(manuscriptId, database = typeof db !== "undefined" ? db : null) {
    if (!manuscriptId || !database) return [];
    return (database.submissions || []).filter(
      (sub) => sub.manuscriptId === manuscriptId && sub.status !== "rejected" && sub.status !== "withdrawn"
    );
  }
  function syncLinkedSubmissionsFromManuscript(manuscript, database = typeof db !== "undefined" ? db : null) {
    if (!manuscript || !database) return false;
    let changed = false;
    const activeSubs = getLinkedActiveSubmissions(manuscript.id, database);
    if (!activeSubs.length) return false;
    const targetStatus = manuscript.status;
    if (["submitted", "under_review", "revision", "accepted", "published"].includes(targetStatus)) {
      activeSubs.forEach((sub) => {
        const canonical = normalizeSubmissionStatus(targetStatus);
        if (sub.status !== canonical) {
          sub.status = canonical;
          sub.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          changed = true;
        }
      });
    }
    return changed;
  }
  function setManuscriptStatus(manuscript, status, { syncSubmissions = true, database = typeof db !== "undefined" ? db : null } = {}) {
    if (!manuscript) return false;
    const prevStatus = manuscript.status;
    manuscript.status = status;
    manuscript.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    let changed = prevStatus !== status;
    if (syncSubmissions && database) {
      changed = syncLinkedSubmissionsFromManuscript(manuscript, database) || changed;
    }
    return changed;
  }
  function syncManuscriptStatusFromSubmission(submission, database = typeof db !== "undefined" ? db : null) {
    if (!submission?.manuscriptId || !database) return false;
    const manuscript = (database.manuscripts || []).find((m) => m.id === submission.manuscriptId);
    if (!manuscript) return false;
    const canonicalSubStatus = normalizeSubmissionStatus(submission.status);
    const manuscriptStatus = manuscript.status;
    if (isSubmissionLifecycleStatus(canonicalSubStatus)) {
      const subRank = getSubmissionLifecycleRank(canonicalSubStatus);
      const mRank = getSubmissionLifecycleRank(manuscriptStatus);
      if (subRank > mRank || subRank > 0 && mRank === 0) {
        manuscript.status = canonicalSubStatus;
        manuscript.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        return true;
      }
    }
    return false;
  }
  function validateLinkedManuscriptStatus(manuscript, status) {
    if (!manuscript) return;
    const valid = ["idea", "outline", "data_collection", "figure_preparation", "drafting", "internal_review", "submitted", "under_review", "revision", "accepted", "published", "rejected"];
    if (!valid.includes(status)) {
      throw new Error(`Invalid manuscript status: ${status}`);
    }
  }
  function syncWorkflowAliases(sub, manuscript) {
    if (!sub || !manuscript) return false;
    let changed = false;
    if (!sub.manuscriptTitle && manuscript.title) {
      sub.manuscriptTitle = manuscript.title;
      changed = true;
    }
    if (!sub.targetJournal && manuscript.targetJournal) {
      sub.targetJournal = manuscript.targetJournal;
      changed = true;
    }
    return changed;
  }
  function syncLinkedManuscriptSnapshots(manuscript, database) {
    if (!manuscript || !database?.submissions) return false;
    let changed = false;
    database.submissions.forEach((sub) => {
      if (sub.manuscriptId === manuscript.id) {
        changed = syncWorkflowAliases(sub, manuscript) || changed;
      }
    });
    return changed;
  }
  function syncManuscriptStatusesFromSubmissions(database) {
    if (!database?.submissions || !database?.manuscripts) return false;
    let changed = false;
    database.submissions.forEach((submission) => {
      changed = syncManuscriptStatusFromSubmission(submission, database) || changed;
    });
    return changed;
  }
  function clearOnlinePublicationCompletion(sub) {
    if (!sub) return;
    sub.publicationUrl = "";
    sub.doi = "";
    if (Array.isArray(sub.timelineNodes)) {
      sub.timelineNodes = sub.timelineNodes.filter((n) => n.key !== "online_publication");
    }
  }
  function createRejectedTimelineNode(sub, rejectionDate = null, note = "") {
    const date = rejectionDate || (typeof todayString === "function" ? todayString() : (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    return {
      id: "node_" + Math.random().toString(36).substring(2, 9),
      submissionId: sub?.id || "",
      key: "rejected",
      title: "Rejected",
      status: "completed",
      date,
      note
    };
  }
  function markSubmissionRejected(sub, rejectionDate = typeof todayString === "function" ? todayString() : (/* @__PURE__ */ new Date()).toISOString().split("T")[0], note = "") {
    if (!sub) return false;
    sub.status = "rejected";
    sub.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (!Array.isArray(sub.timelineNodes)) {
      sub.timelineNodes = [];
    }
    sub.timelineNodes.push(createRejectedTimelineNode(sub, rejectionDate, note));
    return true;
  }
  function getNextSubmissionRound(manuscriptId, database = typeof db !== "undefined" ? db : null) {
    if (!manuscriptId || !database?.submissions) return 1;
    const count = database.submissions.filter((s) => s.manuscriptId === manuscriptId).length;
    return count + 1;
  }
  function createTransferredSubmission(sourceSub, targetJournal, submissionDate = typeof todayString === "function" ? todayString() : (/* @__PURE__ */ new Date()).toISOString().split("T")[0], journalUrl = "") {
    return {
      id: "sub_" + Math.random().toString(36).substring(2, 9),
      manuscriptId: sourceSub?.manuscriptId || "",
      manuscriptTitle: sourceSub?.manuscriptTitle || "",
      targetJournal,
      journalUrl,
      submissionDate,
      status: "submitted",
      round: (sourceSub?.round || 1) + 1,
      transferredFromId: sourceSub?.id || null,
      timelineNodes: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }

  // src/modules/academic-sync/metadata-sync.ts
  function normalizeDoi(value) {
    return String(value || "").trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
  }
  function extractDoiFromText(value) {
    const match = String(value || "").match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
    return match ? normalizeDoi(match[0].replace(/[.,;)\]]+$/, "")) : "";
  }
  function getDashboardFilterLabel() {
    if (typeof currentDashboardFilter !== "undefined") {
      if (currentDashboardFilter === "accepted") return typeof t === "function" ? t("acceptedPipelines") : "Accepted Pipelines";
      if (currentDashboardFilter === "active") return typeof t === "function" ? t("activePipelines") : "Active Pipelines";
    }
    return typeof t === "function" ? t("allPipelines") : "All Pipelines";
  }
  function getSubmissionAttentionScore(sub) {
    const analysis = typeof analyzeSubmission === "function" ? analyzeSubmission(sub) : {};
    const nodes = sub?.timelineNodes || [];
    const hasBlocked = nodes.some((n) => (typeof computeNodeStatus === "function" ? computeNodeStatus(n) : "") === "blocked");
    const hasOverdue = nodes.some((n) => (typeof computeNodeStatus === "function" ? computeNodeStatus(n) : "") === "overdue");
    const hasDueSoon = nodes.some((n) => (typeof computeNodeStatus === "function" ? computeNodeStatus(n) : "") === "due_soon");
    const hasRevision = /revision/.test(sub?.status || "") || Boolean(analysis.r1Date);
    if (hasBlocked || hasOverdue) return 0;
    if (hasRevision) return 1;
    if (!analysis.accepted && analysis.submitDate) return 2;
    if (hasDueSoon) return 3;
    if (!analysis.submitDate) return 4;
    return analysis.accepted ? 6 : 5;
  }
  function getSubmissionDoi(sub) {
    if (sub?.doi) return normalizeDoi(sub.doi);
    if (Array.isArray(sub?.timelineNodes)) {
      for (const node of sub.timelineNodes) {
        if (node.doi) return normalizeDoi(node.doi);
        const extracted = extractDoiFromText(node.note);
        if (extracted) return extracted;
      }
    }
    return "";
  }
  function getSubmissionJournalName(sub) {
    return (sub?.targetJournal || sub?.journal || "").trim();
  }
  function normalizeAuthorName(author) {
    if (!author) return "";
    if (typeof author === "string") return author.trim();
    return (author.lastName || author.name || `${author.firstName || ""} ${author.lastName || ""}`).trim();
  }
  function firstAuthorFromList(authors) {
    if (!authors) return "";
    if (Array.isArray(authors)) {
      return normalizeAuthorName(authors[0]);
    }
    if (typeof authors === "string") {
      const list = authors.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
      return list[0] || "";
    }
    return "";
  }
  function getSubmissionFirstAuthor(sub, manuscript = null) {
    if (manuscript?.firstAuthor) return manuscript.firstAuthor;
    if (manuscript?.authors) return firstAuthorFromList(manuscript.authors);
    if (sub?.firstAuthor) return sub.firstAuthor;
    if (sub?.authors) return firstAuthorFromList(sub.authors);
    return "";
  }
  function getSubmissionArticleUrl(sub) {
    if (sub?.articleUrl) return sub.articleUrl.trim();
    if (sub?.publicationUrl) return sub.publicationUrl.trim();
    const doi = getSubmissionDoi(sub);
    return doi ? `https://doi.org/${doi}` : "";
  }
  function getSubmissionSortTime(sub) {
    const d = sub?.submissionDate || sub?.updatedAt || sub?.createdAt;
    if (!d) return 0;
    const time = new Date(d).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
  function sortDashboardSubmissions(submissions) {
    if (!Array.isArray(submissions)) return [];
    return [...submissions].sort((a, b) => {
      const scoreA = getSubmissionAttentionScore(a);
      const scoreB = getSubmissionAttentionScore(b);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return getSubmissionSortTime(b) - getSubmissionSortTime(a);
    });
  }
  function getSubmissionBadgeClass(sub) {
    const status = (sub?.status || "submitted").toLowerCase();
    const map = {
      submitted: "rf-badge-submitted",
      under_review: "rf-badge-under-review",
      revision: "rf-badge-revision",
      accepted: "rf-badge-accepted",
      published: "rf-badge-published",
      rejected: "rf-badge-rejected"
    };
    return map[status] || "rf-badge-default";
  }
  function splitAcademicAuthors(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((v) => normalizeAuthorName(v)).filter(Boolean);
    return String(value).split(/[,;\n]+| and /i).map((s) => s.trim()).filter(Boolean);
  }
  function normalizeAcademicTitle(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }
  function normalizeAcademicUrl(value) {
    const url = String(value || "").trim();
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("10.")) return `https://doi.org/${url}`;
    return `https://${url}`;
  }
  function findAcademicManuscriptMatch({ title, doi, articleUrl }, database = null) {
    if (!database?.manuscripts) return null;
    const normTitle = normalizeAcademicTitle(title).toLowerCase();
    const normDoi = normalizeDoi(doi);
    for (const m of database.manuscripts) {
      if (normDoi && m.doi && normalizeDoi(m.doi) === normDoi) return m;
      if (normTitle && m.title && normalizeAcademicTitle(m.title).toLowerCase() === normTitle) return m;
    }
    return null;
  }
  function academicCaptureProvenance(prefill) {
    return {
      source: prefill?.source || "manual",
      capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
      doi: prefill?.doi ? normalizeDoi(prefill.doi) : null,
      itemKey: prefill?.itemKey || null
    };
  }
  function buildAcademicCaptureSummary(prefill) {
    const parts = [];
    if (prefill?.title) parts.push(`Title: ${prefill.title}`);
    if (prefill?.journal) parts.push(`Journal: ${prefill.journal}`);
    if (prefill?.doi) parts.push(`DOI: ${prefill.doi}`);
    return parts.join(" | ");
  }

  // src/modules/academic-sync.ts
  var RFAcademicSync = {
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
  if (typeof globalThis !== "undefined") {
    globalThis.RFAcademicSync = RFAcademicSync;
    Object.assign(globalThis, RFAcademicSync);
  }
  if (typeof window !== "undefined") {
    window.RFAcademicSync = RFAcademicSync;
    Object.assign(window, RFAcademicSync);
  }
})();
