"use strict";
(() => {
  // src/modules/academic-sync.ts
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
    if (typeof canHavePublicationLink === "function" && !canHavePublicationLink(sub)) return "";
    const direct = normalizeDoi(sub?.doi || sub?.DOI || sub?.articleDoi || sub?.metadata?.doi || sub?.attributes?.doi);
    if (direct) return direct;
    const textDoi = extractDoiFromText([sub?.notes, sub?.summary, sub?.description, sub?.articleUrl, sub?.journalUrl].filter(Boolean).join(" "));
    if (textDoi) return textDoi;
    const activeDb = typeof db !== "undefined" ? db : null;
    const manuscript = activeDb?.manuscripts?.find((m) => m.id === sub?.manuscriptId);
    const title = normalizeText(manuscript?.title || sub?.title || "");
    const journal = normalizeText(sub?.targetJournal || sub?.journalName || "");
    const achievement = activeDb?.achievements?.find((ach) => {
      const achTitle = normalizeText(ach.title || "");
      const achJournal = normalizeText(ach.journal || "");
      return ach.doi && (title && achTitle && (achTitle === title || achTitle.includes(title) || title.includes(achTitle)) || journal && achJournal && achJournal === journal);
    });
    return normalizeDoi(achievement?.doi || "");
  }
  function getSubmissionJournalName(sub) {
    if (!sub) return typeof t === "function" ? t("targetJournal") : "Target Journal";
    const activeDb = typeof db !== "undefined" ? db : null;
    const manuscript = activeDb?.manuscripts?.find((m) => m.id === sub.manuscriptId);
    const manuscriptJournal = Array.isArray(manuscript?.targetJournals) ? manuscript.targetJournals[0] : manuscript?.targetJournal;
    return sub.targetJournal || sub.journalName || sub.journal || sub.publisher || manuscriptJournal || (typeof t === "function" ? t("targetJournal") : "Target Journal");
  }
  function normalizeAuthorName(author) {
    if (typeof author === "string") return author.trim();
    if (!author || typeof author !== "object") return "";
    return String(author.name || author.fullName || author.displayName || "").trim();
  }
  function firstAuthorFromList(authors) {
    if (Array.isArray(authors)) {
      return normalizeAuthorName(authors.find((author) => normalizeAuthorName(author)));
    }
    const value = String(authors || "").trim();
    if (!value) return "";
    return value.split(/\s*(?:;|；|\n|\band\b)\s*/i)[0].trim();
  }
  function getSubmissionFirstAuthor(sub, manuscript = null) {
    const activeDb = typeof db !== "undefined" ? db : null;
    const man = manuscript || activeDb?.manuscripts?.find((item) => item.id === sub?.manuscriptId);
    return String(
      sub?.firstAuthor || man?.firstAuthor || firstAuthorFromList(man?.authors) || firstAuthorFromList(sub?.authors) || ""
    ).trim();
  }
  function getSubmissionArticleUrl(sub) {
    if (typeof canHavePublicationLink === "function" && !canHavePublicationLink(sub)) return "";
    const explicitUrl = String(sub?.articleUrl || sub?.publicationUrl || sub?.url || sub?.journalArticleUrl || "").trim();
    if (explicitUrl) return explicitUrl;
    const doi = getSubmissionDoi(sub);
    return doi ? `https://doi.org/${doi}` : "";
  }
  function getSubmissionSortTime(sub) {
    const analysis = typeof analyzeSubmission === "function" ? analyzeSubmission(sub) : {};
    const normalized = (typeof normalizeDateString === "function" ? normalizeDateString(sub?.submissionDate) : "") || analysis.submitDate || (typeof normalizeDateString === "function" ? normalizeDateString(sub?.submittedAt) : "");
    if (normalized) return (/* @__PURE__ */ new Date(`${normalized}T12:00:00.000Z`)).getTime();
    return 0;
  }
  function sortDashboardSubmissions(submissions) {
    return [...submissions].sort((a, b) => {
      const submittedA = getSubmissionSortTime(a);
      const submittedB = getSubmissionSortTime(b);
      if (submittedA !== submittedB) return submittedB - submittedA;
      const da = (typeof getNodeDate === "function" && typeof getLatestTimelineNode === "function" ? getNodeDate(getLatestTimelineNode(a.timelineNodes || [])) : "") || a.updatedAt || a.createdAt || "";
      const dbTime = (typeof getNodeDate === "function" && typeof getLatestTimelineNode === "function" ? getNodeDate(getLatestTimelineNode(b.timelineNodes || [])) : "") || b.updatedAt || b.createdAt || "";
      return new Date(dbTime || 0).getTime() - new Date(da || 0).getTime();
    });
  }
  function normalizeSyncedPublicationStatus(status) {
    const normalized = normalizeText(status);
    if (normalized === "accept") return "accepted";
    return normalized;
  }
  function isSubmissionLifecycleStatus(status) {
    return ["submitted", "under_review", "revision", "accepted", "published"].includes(normalizeSyncedPublicationStatus(status));
  }
  function getSubmissionLifecycleRank(status) {
    const ranks = {
      submitted: 1,
      under_review: 2,
      revision: 3,
      accepted: 4,
      published: 5
    };
    return ranks[normalizeSyncedPublicationStatus(status)] || 0;
  }
  function getLinkedActiveSubmissions(manuscriptId, database = typeof db !== "undefined" ? db : null) {
    const current = typeof window !== "undefined" && window.RFCore?.getCurrentSubmission ? window.RFCore.getCurrentSubmission(database, manuscriptId) : null;
    return current ? [current] : [];
  }
  function syncLinkedSubmissionsFromManuscript(manuscript, database = typeof db !== "undefined" ? db : null) {
    if (!manuscript) return false;
    const nextStatus = normalizeSyncedPublicationStatus(manuscript.status);
    let changed = false;
    getLinkedActiveSubmissions(manuscript.id, database).forEach((sub) => {
      const patch = {
        title: manuscript.title,
        targetJournal: manuscript.targetJournals?.[0] || null,
        firstAuthor: manuscript.firstAuthor || firstAuthorFromList(manuscript.authors) || null
      };
      if (isSubmissionLifecycleStatus(nextStatus) || nextStatus === "rejected") patch.status = nextStatus;
      if (nextStatus === "accepted" || nextStatus === "published") {
        patch.doi = manuscript.doi || sub.doi || null;
        patch.articleUrl = manuscript.articleUrl || sub.articleUrl || null;
      }
      if (Object.entries(patch).some(([key, value]) => sub[key] !== value)) {
        const previousStatus = sub.status;
        Object.assign(sub, patch);
        sub.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        if (isSubmissionLifecycleStatus(nextStatus) && nextStatus !== "accepted" && nextStatus !== "published") {
          if (typeof clearPublicationLinkFields === "function") clearPublicationLinkFields(sub);
          if (typeof clearPublicationTimelineCompletion === "function") clearPublicationTimelineCompletion(sub);
        }
        if (previousStatus === "published" && nextStatus === "accepted") {
          clearOnlinePublicationCompletion(sub);
        }
        changed = true;
      }
      if (typeof normalizeSubmissionTimeline === "function") changed = normalizeSubmissionTimeline(sub) || changed;
      changed = syncWorkflowAliases(sub, manuscript) || changed;
    });
    return syncLinkedManuscriptSnapshots(manuscript, database) || changed;
  }
  function setManuscriptStatus(manuscript, status, { syncSubmissions = true, database = typeof db !== "undefined" ? db : null } = {}) {
    if (!manuscript) return false;
    const nextStatus = normalizeSyncedPublicationStatus(status);
    let changed = false;
    if (manuscript.status !== nextStatus) {
      manuscript.status = nextStatus;
      manuscript.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      changed = true;
    }
    if (syncSubmissions) {
      changed = syncLinkedSubmissionsFromManuscript(manuscript, database) || changed;
    }
    return changed;
  }
  async function persistManuscriptStatusChange(manuscript, nextStatus) {
    const activeDb = typeof db !== "undefined" ? db : null;
    const liveManuscript = activeDb?.manuscripts?.find((item) => item.id === manuscript.id);
    if (!liveManuscript) throw new Error(typeof t === "function" ? t("manuscriptNotFound") : "Manuscript not found");
    validateLinkedManuscriptStatus(liveManuscript, nextStatus);
    const previousStatus = normalizeSyncedPublicationStatus(liveManuscript.status);
    const workingDatabase = typeof structuredClone === "function" ? structuredClone(activeDb) : JSON.parse(JSON.stringify(activeDb));
    const workingManuscript = workingDatabase.manuscripts.find((item) => item.id === manuscript.id);
    if (!workingManuscript) throw new Error(typeof t === "function" ? t("manuscriptNotFound") : "Manuscript not found");
    setManuscriptStatus(workingManuscript, nextStatus, { database: workingDatabase });
    const savedDatabase = await (typeof window !== "undefined" && window.storage?.saveAll ? window.storage.saveAll(workingDatabase, { mergeOnConflict: true }) : null);
    if (typeof globalThis.db !== "undefined") {
      globalThis.db = savedDatabase || workingDatabase;
    }
    const savedDb = savedDatabase || workingDatabase;
    const savedManuscript = savedDb.manuscripts.find((item) => item.id === manuscript.id);
    if (!savedManuscript) throw new Error(typeof t === "function" ? t("manuscriptNotFound") : "Manuscript not found");
    Object.assign(manuscript, savedManuscript);
    if (typeof ZoteroBridge !== "undefined" && ZoteroBridge.isZotero && savedManuscript.zoteroItemKey) {
      try {
        ZoteroBridge.syncStatusTag(savedManuscript.zoteroItemKey, savedManuscript.status);
        ZoteroBridge.syncNote(savedManuscript.zoteroItemKey);
      } catch (_) {
      }
    }
    return {
      manuscript: savedManuscript,
      shouldCelebrate: typeof window !== "undefined" && window.RFUI?.shouldCelebrateAcceptance ? window.RFUI.shouldCelebrateAcceptance(
        previousStatus,
        normalizeSyncedPublicationStatus(savedManuscript.status)
      ) : false
    };
  }
  function syncManuscriptStatusFromSubmission(submission, database = typeof db !== "undefined" ? db : null) {
    if (!submission) return false;
    const manuscript = database?.manuscripts?.find((man) => man.id === submission.manuscriptId);
    if (!manuscript) return false;
    if (typeof window !== "undefined" && window.RFCore?.getCurrentSubmission?.(database, manuscript.id)?.id !== submission.id) return false;
    const normalized = normalizeWorkflowFields(submission);
    const patch = {
      status: normalizeSubmissionStatus(submission.status),
      targetJournals: "targetJournal" in submission ? submission.targetJournal ? [submission.targetJournal] : [] : manuscript.targetJournals || [],
      firstAuthor: submission.firstAuthor || manuscript.firstAuthor || firstAuthorFromList(manuscript.authors) || null
    };
    if (typeof hasPublicationStatus === "function" && hasPublicationStatus(submission)) {
      patch.doi = submission.doi || manuscript.doi || null;
      patch.articleUrl = submission.articleUrl || manuscript.articleUrl || null;
    }
    const changed = Object.entries(patch).some(([key, value]) => JSON.stringify(manuscript[key]) !== JSON.stringify(value));
    if (changed) Object.assign(manuscript, patch, { updatedAt: submission.updatedAt || (/* @__PURE__ */ new Date()).toISOString() });
    return syncLinkedManuscriptSnapshots(manuscript, database) || changed || normalized;
  }
  function normalizeWorkflowFields(sub) {
    let changed = false;
    for (const [alias, key] of [["journalName", "targetJournal"], ["submittedAt", "submissionDate"], ["decisionAt", "decisionDate"], ["revisionDeadline", "revisionDueDate"]]) {
      if (!(key in sub) && alias in sub) {
        sub[key] = sub[alias];
        changed = true;
      }
    }
    return changed;
  }
  function validateLinkedManuscriptStatus(manuscript, status) {
    const activeDb = typeof db !== "undefined" ? db : null;
    if (typeof window !== "undefined" && window.RFCore?.getCurrentSubmission?.(activeDb, manuscript.id) && !isSubmissionLifecycleStatus(status) && status !== "rejected") {
      const lang = typeof currentLanguage !== "undefined" ? currentLanguage : "en";
      throw new Error(lang === "zh" ? "该手稿已有投稿记录，请选择投稿、审稿、返修、接收、发表或拒稿状态。若需退回准备阶段，请先删除对应投稿跟踪。" : "This manuscript has a submission. Choose a submission status, or delete its submission tracking before returning to preparation.");
    }
  }
  function syncWorkflowAliases(sub, manuscript) {
    if (!sub || !manuscript) return false;
    let changed = normalizeWorkflowFields(sub);
    const set = (object, key, value) => {
      if (JSON.stringify(object[key]) !== JSON.stringify(value)) {
        object[key] = value;
        changed = true;
      }
    };
    for (const [alias, key] of [["journalName", "targetJournal"], ["submittedAt", "submissionDate"], ["decisionAt", "decisionDate"], ["revisionDeadline", "revisionDueDate"]]) {
      if (alias in sub) set(sub, alias, sub[key] ?? null);
    }
    if ("title" in sub) set(sub, "title", manuscript.title);
    if ("targetJournal" in manuscript) set(manuscript, "targetJournal", manuscript.targetJournals?.[0] || null);
    if (sub.manuscript && typeof sub.manuscript === "object" && !Array.isArray(sub.manuscript)) {
      for (const key of ["id", "title", "status", "firstAuthor", "updatedAt"]) set(sub.manuscript, key, manuscript[key] ?? null);
      if ("targetJournal" in sub.manuscript) set(sub.manuscript, "targetJournal", manuscript.targetJournals?.[0] || null);
      if ("targetJournals" in sub.manuscript) set(sub.manuscript, "targetJournals", manuscript.targetJournals || []);
    }
    return changed;
  }
  function syncLinkedManuscriptSnapshots(manuscript, database) {
    if (!manuscript || !database || !Array.isArray(database.submissions)) return false;
    let changed = false;
    database.submissions.filter((sub) => sub.manuscriptId === manuscript.id).forEach((sub) => {
      changed = syncWorkflowAliases(sub, manuscript) || changed;
    });
    return changed;
  }
  function syncManuscriptStatusesFromSubmissions(database) {
    if (!database || !Array.isArray(database.manuscripts) || !Array.isArray(database.submissions)) return false;
    let changed = false;
    database.manuscripts.forEach((manuscript) => {
      const current = typeof window !== "undefined" && window.RFCore?.getCurrentSubmission ? window.RFCore.getCurrentSubmission(database, manuscript.id) : null;
      if (!current) return;
      const online = typeof getTimelineNodeByKey === "function" ? getTimelineNodeByKey(current, "online") : null;
      if (current.status === "accepted" && manuscript.status === "published" && online?.completeDate) {
        current.status = "published";
        current.publishedAt = current.publishedAt || (typeof dateInputToIso === "function" && typeof normalizeDateString === "function" ? dateInputToIso(normalizeDateString(online.completeDate)) : online.completeDate);
        changed = true;
      }
      changed = syncManuscriptStatusFromSubmission(current, database) || changed;
    });
    return changed;
  }
  function clearOnlinePublicationCompletion(sub) {
    delete sub.publishedAt;
    (sub.timelineNodes || []).filter((node) => (typeof inferKey === "function" ? inferKey(node) : "") === "online").forEach((node) => {
      node.completeDate = "";
      node.status = "pending";
    });
  }
  function createRejectedTimelineNode(sub, rejectionDate = null, note = "") {
    if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
    const existing = sub.timelineNodes.find((node2) => (typeof inferKey === "function" ? inferKey(node2) : "") === "rejected");
    const date = rejectionDate || (typeof todayString === "function" ? todayString() : (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    const values = {
      key: "rejected",
      name: "Rejected",
      type: "rejection",
      status: "blocked",
      planDate: "",
      dueDate: "",
      completeDate: date,
      notes: note
    };
    if (existing) {
      Object.assign(existing, values, { updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      return existing;
    }
    const node = typeof createTimelineNode === "function" ? createTimelineNode(sub.id, values) : values;
    sub.timelineNodes.push(node);
    return node;
  }
  function markSubmissionRejected(sub, rejectionDate = typeof todayString === "function" ? todayString() : (/* @__PURE__ */ new Date()).toISOString().split("T")[0], note = "") {
    if (!sub) return false;
    const isoDate = typeof dateInputToIso === "function" ? dateInputToIso(rejectionDate) : rejectionDate;
    sub.status = "rejected";
    sub.decisionDate = isoDate;
    sub.firstDecisionDate = sub.firstDecisionDate || isoDate;
    sub.rejectedAt = isoDate;
    sub.rejectionNote = note || sub.rejectionNote || "";
    if (note) sub.notes = [sub.notes, `Rejected: ${note}`].filter(Boolean).join("\n");
    if (typeof clearPublicationLinkFields === "function") clearPublicationLinkFields(sub);
    if (typeof clearPublicationTimelineCompletion === "function") clearPublicationTimelineCompletion(sub);
    createRejectedTimelineNode(sub, rejectionDate, note);
    sub.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return true;
  }
  function getNextSubmissionRound(manuscriptId) {
    const activeDb = typeof db !== "undefined" ? db : null;
    const rounds = (activeDb?.submissions || []).filter((sub) => sub.manuscriptId === manuscriptId).map((sub) => Number(sub.roundIndex) || 1);
    return rounds.length ? Math.max(...rounds) + 1 : 1;
  }
  function createTransferredSubmission(sourceSub, targetJournal, submissionDate = typeof todayString === "function" ? todayString() : (/* @__PURE__ */ new Date()).toISOString().split("T")[0], journalUrl = "") {
    const activeDb = typeof db !== "undefined" ? db : null;
    const manuscript = activeDb?.manuscripts?.find((m) => m.id === sourceSub.manuscriptId);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newSub = {
      id: "sub_" + Math.random().toString(36).substring(2, 9),
      userId: sourceSub.userId || "user",
      manuscriptId: sourceSub.manuscriptId,
      projectId: sourceSub.projectId || manuscript?.projectId || null,
      targetJournal,
      journalUrl: journalUrl || null,
      doi: null,
      articleUrl: null,
      status: "submitted",
      submissionDate: typeof dateInputToIso === "function" ? dateInputToIso(submissionDate) : submissionDate,
      decisionDate: null,
      revisionDueDate: null,
      firstDecisionDate: null,
      previousSubmissionId: sourceSub.id,
      previousJournal: getSubmissionJournalName(sourceSub),
      firstAuthor: getSubmissionFirstAuthor(sourceSub, manuscript) || null,
      roundIndex: getNextSubmissionRound(sourceSub.manuscriptId),
      complianceChecklist: {},
      complianceChecklistKeys: Array.isArray(sourceSub.complianceChecklistKeys) ? sourceSub.complianceChecklistKeys : void 0,
      reviewMatrix: [],
      timelineNodes: [],
      notes: `Transferred after rejection from ${getSubmissionJournalName(sourceSub)}.`,
      createdAt: now,
      updatedAt: now
    };
    if (typeof normalizeSubmissionTimeline === "function") normalizeSubmissionTimeline(newSub);
    return newSub;
  }
  function getSubmissionBadgeClass(sub) {
    const status = normalizeSyncedPublicationStatus(sub?.status || "submitted");
    if (status === "rejected") return "danger";
    if (status === "revision") return "warning";
    if (status === "accepted" || status === "published") return "success";
    return "purple";
  }
  function splitAcademicAuthors(value) {
    if (Array.isArray(value)) return value.map(normalizeAuthorName).filter(Boolean);
    const text = String(value || "").trim();
    if (!text) return [];
    let authors = text.split(/\s*(?:;|；|\n|\band\b|、)\s*/i).map((author) => author.trim()).filter(Boolean);
    if (authors.length === 1 && text.includes(",")) {
      const commaAuthors = text.split(/\s*,\s*/).map((author) => author.trim()).filter(Boolean);
      if (commaAuthors.length > 1 && commaAuthors.length <= 30 && commaAuthors.every((author) => author.split(/\s+/).length <= 6)) {
        authors = commaAuthors;
      }
    }
    return authors;
  }
  function normalizeAcademicTitle(value) {
    return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, "");
  }
  function normalizeAcademicUrl(value) {
    try {
      const url = new URL(String(value || "").trim());
      url.hash = "";
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"].forEach((key) => url.searchParams.delete(key));
      return url.href.replace(/\/$/, "").toLowerCase();
    } catch (_) {
      return "";
    }
  }
  function findAcademicManuscriptMatch({ title, doi, articleUrl }) {
    const normalizedDoi = normalizeDoi(doi);
    const normalizedUrl = normalizeAcademicUrl(articleUrl);
    const normalizedTitle = normalizeAcademicTitle(title);
    const activeDb = typeof db !== "undefined" ? db : null;
    return activeDb?.manuscripts?.find((manuscript) => {
      const manuscriptDoi = normalizeDoi(manuscript.doi);
      if (normalizedDoi && manuscriptDoi && normalizedDoi === manuscriptDoi) return true;
      const manuscriptUrl = normalizeAcademicUrl(manuscript.articleUrl);
      if (normalizedUrl && manuscriptUrl && normalizedUrl === manuscriptUrl) return true;
      return normalizedTitle && normalizedTitle.length >= 16 && normalizedTitle === normalizeAcademicTitle(manuscript.title);
    }) || null;
  }
  function academicCaptureProvenance(prefill) {
    if (!prefill) return null;
    return {
      sourceType: prefill.sourceType || "zotero-library",
      sourceHost: prefill.sourceHost || "",
      sourcePageUrl: prefill.sourcePageUrl || "",
      pdfUrl: prefill.pdfUrl || "",
      confidenceScore: Number(prefill.confidenceScore) || 0,
      capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
      reviewedByUser: true
    };
  }
  function buildAcademicCaptureSummary(prefill) {
    if (!prefill) return "";
    const source = prefill.sourceHost || prefill.sourceType || "Zotero";
    const confidence = Math.max(0, Math.min(Number(prefill.confidenceScore) || 0, 100));
    const escape = typeof escapeHTML === "function" ? escapeHTML : (s) => String(s ?? "");
    const trans = typeof t === "function" ? t : (k) => k;
    return `
    <section class="academic-capture-review" aria-label="${escape(trans("academicCaptureSource"))}">
      <div class="academic-capture-review-icon" aria-hidden="true">S</div>
      <div>
        <strong>${escape(trans("academicCaptureSource"))}</strong>
        <span>${escape(source)}</span>
      </div>
      <div class="academic-capture-confidence">
        <strong>${escape(trans("academicCaptureConfidence"))}</strong>
        <span>${confidence}%</span>
      </div>
    </section>
  `;
  }
  var RFAcademicSync = {
    normalizeText,
    normalizeSubmissionStatus,
    normalizeSubmissionStatuses,
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
    normalizeSyncedPublicationStatus,
    isSubmissionLifecycleStatus,
    getSubmissionLifecycleRank,
    getLinkedActiveSubmissions,
    syncLinkedSubmissionsFromManuscript,
    setManuscriptStatus,
    persistManuscriptStatusChange,
    syncManuscriptStatusFromSubmission,
    normalizeWorkflowFields,
    validateLinkedManuscriptStatus,
    syncWorkflowAliases,
    syncLinkedManuscriptSnapshots,
    syncManuscriptStatusesFromSubmissions,
    clearOnlinePublicationCompletion,
    createRejectedTimelineNode,
    markSubmissionRejected,
    getNextSubmissionRound,
    createTransferredSubmission,
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
