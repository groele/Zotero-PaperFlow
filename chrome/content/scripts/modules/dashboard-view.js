"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/modules/dashboard-view/field-helpers.ts
  function firstAuthorFromList(authors) {
    if (Array.isArray(authors)) return String(authors[0] || "").trim();
    const raw = String(authors || "").trim();
    if (!raw) return "";
    return raw.split(/\s*(?:;|,|，|、|\band\b)\s*/i).map((item) => item.trim()).filter(Boolean)[0] || "";
  }
  function normalizeWorkflowFields(record) {
    if (!record || typeof record !== "object") return false;
    let changed = false;
    const externalId = String(
      record.externalManuscriptId || record.manuscriptNumber || record.trackingId || record.submissionCode || ""
    ).trim();
    if (externalId && record.externalManuscriptId !== externalId) {
      record.externalManuscriptId = externalId;
      changed = true;
    }
    const firstAuthor = String(record.firstAuthor || firstAuthorFromList(record.authors) || "").trim();
    if (firstAuthor && record.firstAuthor !== firstAuthor) {
      record.firstAuthor = firstAuthor;
      changed = true;
    }
    if (!Array.isArray(record.authors) && firstAuthor) {
      record.authors = [firstAuthor];
      changed = true;
    }
    return changed;
  }
  function getSubmissionFirstAuthor(sub, man = db?.manuscripts?.find((item) => item.id === sub?.manuscriptId)) {
    return String(
      sub?.firstAuthor || man?.firstAuthor || firstAuthorFromList(sub?.authors) || firstAuthorFromList(man?.authors) || ""
    ).trim();
  }
  function getSubmissionDoi(sub) {
    if (!canHavePublicationLink(sub)) return "";
    const direct = normalizeDoi(sub?.doi || sub?.DOI || sub?.articleDoi || "");
    if (direct) return direct;
    const fromUrl = extractDoiFromText(sub?.articleUrl || sub?.publicationUrl || sub?.journalUrl || "");
    if (fromUrl) return fromUrl;
    return (sub?.timelineNodes || []).map((node) => extractDoiFromText(`${node.name || ""} ${node.notes || ""}`)).find(Boolean) || "";
  }
  function getSubmissionJournalName(sub) {
    const man = (db.manuscripts || []).find((m) => m.id === sub?.manuscriptId);
    const raw = sub?.targetJournal || sub?.journalName || sub?.journal || sub?.publicationVenue || (Array.isArray(man?.targetJournals) ? man.targetJournals[0] : "") || "";
    return String(raw).trim() || t("targetJournal");
  }
  function getSubmissionArticleUrl(sub) {
    if (!canHavePublicationLink(sub)) return "";
    const explicitUrl = String(sub?.articleUrl || sub?.publicationUrl || sub?.journalArticleUrl || "").trim();
    if (explicitUrl) return explicitUrl;
    const doi = getSubmissionDoi(sub);
    return doi ? `https://doi.org/${doi}` : "";
  }
  function todayString() {
    return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  }
  function normalizeDateString(dateStr) {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch (_) {
      return "";
    }
  }
  function addDays(dateStr, days) {
    const base = normalizeDateString(dateStr) || todayString();
    const d = /* @__PURE__ */ new Date(base + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }
  function dateInputToIso(dateStr) {
    const normalized = normalizeDateString(dateStr);
    return normalized ? (/* @__PURE__ */ new Date(normalized + "T12:00:00")).toISOString() : null;
  }
  function getNodeDate(node) {
    if (!node) return "";
    return normalizeDateString(node.completeDate || node.dueDate || node.planDate || "");
  }
  function getLatestTimelineNode(nodes = []) {
    const dated = nodes.map((node) => ({ node, date: getNodeDate(node) })).filter((item) => item.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return dated.length ? dated[dated.length - 1].node : nodes[nodes.length - 1] || null;
  }
  function getRelativeDayLabel(dateStr) {
    const normalized = normalizeDateString(dateStr);
    if (!normalized) return "";
    const target = (/* @__PURE__ */ new Date(normalized + "T00:00:00")).getTime();
    const now = /* @__PURE__ */ new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - now.getTime()) / (1e3 * 60 * 60 * 24));
    if (diffDays === 0) return t("relativeToday");
    if (diffDays < 0) return tf("relativeDaysAgo", { count: Math.abs(diffDays) });
    return tf("relativeInDays", { count: diffDays });
  }
  function getDaysDiff(startDateStr, endDateStr) {
    const start = normalizeDateString(startDateStr);
    const end = normalizeDateString(endDateStr);
    if (!start || !end) return null;
    const s = (/* @__PURE__ */ new Date(start + "T00:00:00")).getTime();
    const e = (/* @__PURE__ */ new Date(end + "T00:00:00")).getTime();
    if (isNaN(s) || isNaN(e)) return null;
    return Math.max(0, Math.round((e - s) / (1e3 * 60 * 60 * 24)));
  }
  function average(values) {
    const valid = values.filter((v) => typeof v === "number" && !isNaN(v));
    if (!valid.length) return null;
    return Math.round(valid.reduce((sum, v) => sum + v, 0) / valid.length);
  }
  function getSubmissionSortableTimestamp(sub) {
    const explicitSubmitDate = normalizeDateString(sub?.submissionDate);
    const submitNode = (sub?.timelineNodes || []).find((node) => inferKey(node) === "submit");
    const timelineSubmitDate = normalizeDateString(getNodeDate(submitNode));
    const rawDate = explicitSubmitDate || timelineSubmitDate || sub?.createdAt || sub?.updatedAt || "";
    if (!rawDate) return 0;
    const timestamp = new Date(rawDate).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }
  function sortDashboardSubmissions(submissions = []) {
    return [...submissions].sort((a, b) => {
      const timeDiff = getSubmissionSortableTimestamp(b) - getSubmissionSortableTimestamp(a);
      if (timeDiff !== 0) return timeDiff;
      return String(b?.id || "").localeCompare(String(a?.id || ""));
    });
  }
  function createTimelineNode(subId, values = {}) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      id: values.id || `tn_${Math.random().toString(36).substring(2, 9)}`,
      submissionId: subId,
      name: values.name || "Untitled Event",
      type: values.type || "research",
      status: values.status || "pending",
      key: values.key || "auto",
      planDate: normalizeDateString(values.planDate),
      dueDate: normalizeDateString(values.dueDate),
      completeDate: normalizeDateString(values.completeDate),
      reviewDecision: values.reviewDecision || "",
      notes: values.notes || "",
      createdAt: values.createdAt || now,
      updatedAt: now
    };
  }
  var init_field_helpers = __esm({
    "src/modules/dashboard-view/field-helpers.ts"() {
      "use strict";
    }
  });

  // src/modules/dashboard-view/transfer-and-status.ts
  function markSubmissionRejected(sub, rejectionDate = todayString(), note = "") {
    if (!sub) return;
    const cleanDate = normalizeDateString(rejectionDate) || todayString();
    sub.status = "rejected";
    sub.decisionDate = null;
    sub.acceptedAt = null;
    sub.publishedAt = null;
    sub.rejectedAt = dateInputToIso(cleanDate);
    sub.rejectionNote = note || sub.rejectionNote || "";
    clearPublicationLinkFields(sub);
    clearPublicationTimelineCompletion(sub);
    if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
    let rejectNode = getTimelineNodeByKey(sub, "rejected");
    if (rejectNode) {
      rejectNode.status = "completed";
      rejectNode.type = "rejection";
      rejectNode.key = "rejected";
      rejectNode.completeDate = cleanDate;
      if (note) rejectNode.notes = note;
      rejectNode.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    } else {
      sub.timelineNodes.push(createTimelineNode(sub.id, {
        key: "rejected",
        name: "Rejected",
        type: "rejection",
        status: "completed",
        completeDate: cleanDate,
        notes: note
      }));
    }
    sub.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  function syncManuscriptStatusFromSubmission2(sub, database = db) {
    if (!sub?.manuscriptId || !database || !Array.isArray(database.manuscripts)) return false;
    const man = database.manuscripts.find((m) => m.id === sub.manuscriptId);
    if (!man) return false;
    const currentSub = window.RFCore.getCurrentSubmission(database, man.id) || sub;
    const nextStatus = window.RFCore.deriveManuscriptStatusFromSubmission(currentSub, man.status);
    if (!nextStatus || man.status === nextStatus) return false;
    man.status = nextStatus;
    man.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return true;
  }
  function syncManuscriptStatusesFromSubmissions(database = db) {
    if (!database || !Array.isArray(database.manuscripts)) return false;
    let changed = false;
    database.manuscripts.forEach((manuscript) => {
      const currentSub = window.RFCore.getCurrentSubmission(database, manuscript.id);
      if (!currentSub) return;
      const nextStatus = window.RFCore.deriveManuscriptStatusFromSubmission(currentSub, manuscript.status);
      if (nextStatus && manuscript.status !== nextStatus) {
        manuscript.status = nextStatus;
        manuscript.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        changed = true;
      }
    });
    return changed;
  }
  function clearOnlinePublicationCompletion(sub) {
    if (!sub) return false;
    let changed = Boolean(sub.publishedAt);
    sub.publishedAt = null;
    (sub.timelineNodes || []).forEach((node) => {
      if (inferKey(node) !== "online") return;
      if (node.completeDate || node.status === "completed") changed = true;
      node.completeDate = "";
      node.status = "pending";
    });
    return changed;
  }
  function syncLinkedSubmissionsFromManuscript(man, database = db) {
    if (!man?.id || !database || !Array.isArray(database.submissions)) return false;
    const currentSub = window.RFCore.getCurrentSubmission(database, man.id);
    if (!currentSub) return false;
    const targetSubStatus = window.RFCore.deriveSubmissionStatusFromManuscript(man.status, currentSub.status);
    if (!targetSubStatus) return false;
    const today = todayString();
    let changed = false;
    if (targetSubStatus === "rejected") {
      markSubmissionRejected(currentSub, today);
      changed = true;
    } else if (currentSub.status !== targetSubStatus) {
      const previousSubStatus = currentSub.status;
      currentSub.status = targetSubStatus;
      if (targetSubStatus === "accepted") {
        currentSub.decisionDate = currentSub.decisionDate || dateInputToIso(today);
        currentSub.acceptedAt = currentSub.acceptedAt || currentSub.decisionDate;
        if (previousSubStatus === "published") clearOnlinePublicationCompletion(currentSub);
      } else if (targetSubStatus === "published") {
        currentSub.decisionDate = currentSub.decisionDate || dateInputToIso(today);
        currentSub.acceptedAt = currentSub.acceptedAt || currentSub.decisionDate;
        currentSub.publishedAt = currentSub.publishedAt || dateInputToIso(today);
      } else {
        currentSub.decisionDate = null;
        currentSub.acceptedAt = null;
        currentSub.publishedAt = null;
        clearPublicationLinkFields(currentSub);
        clearPublicationTimelineCompletion(currentSub);
      }
      currentSub.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      changed = true;
    }
    return changed;
  }
  function createTransferredSubmission(sourceSub, targetJournal, submissionDate = todayString(), journalUrl = "") {
    const newId = "sub_" + Math.random().toString(36).substring(2, 9);
    const cleanSubmitDate = normalizeDateString(submissionDate) || todayString();
    const baseNodes = (sourceSub?.timelineNodes || []).filter((node) => node.type === "research" || node.type === "writing" || ["experiment_start", "experiment_done", "draft_done"].includes(inferKey(node))).map((node) => createTimelineNode(newId, {
      key: inferKey(node),
      name: node.name,
      type: node.type,
      status: "completed",
      planDate: node.planDate,
      dueDate: node.dueDate,
      completeDate: node.completeDate || node.planDate || node.dueDate,
      notes: node.notes
    }));
    const newSub = {
      id: newId,
      userId: sourceSub?.userId || "user",
      manuscriptId: sourceSub?.manuscriptId || null,
      projectId: sourceSub?.projectId || null,
      targetJournal,
      journalUrl: journalUrl || null,
      doi: null,
      articleUrl: null,
      status: "submitted",
      submissionDate: dateInputToIso(cleanSubmitDate),
      decisionDate: null,
      revisionDueDate: null,
      firstDecisionDate: null,
      previousSubmissionId: sourceSub?.id || null,
      previousJournal: sourceSub ? getSubmissionJournalName(sourceSub) : null,
      round: (sourceSub?.round || 1) + 1,
      complianceChecklist: {},
      reviewMatrix: [],
      timelineNodes: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    initializeSubmissionTimelineNodes(newSub);
    if (baseNodes.length) {
      const nonPrepNodes = newSub.timelineNodes.filter((n) => n.type !== "research" && n.type !== "writing");
      newSub.timelineNodes = [...baseNodes, ...nonPrepNodes];
    }
    const man = db.manuscripts.find((m) => m.id === newSub.manuscriptId);
    if (man) {
      man.status = "submitted";
      man.targetJournals = [targetJournal];
      man.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    return newSub;
  }
  function setPipelineViewMode(expanded) {
    isPipelineExpanded = Boolean(expanded);
    const ganttBox = document.getElementById("dashboard-gantt");
    if (ganttBox) {
      ganttBox.classList.toggle("is-compact", !isPipelineExpanded);
      ganttBox.classList.toggle("is-expanded", isPipelineExpanded);
    }
    updatePipelineViewToggle();
  }
  function updatePipelineViewToggle() {
    const compactBtn = document.getElementById("btn-pipeline-compact");
    const expandedBtn = document.getElementById("btn-pipeline-expanded");
    if (compactBtn) {
      compactBtn.textContent = t("compact");
      compactBtn.classList.toggle("active", !isPipelineExpanded);
      compactBtn.setAttribute("aria-pressed", String(!isPipelineExpanded));
    }
    if (expandedBtn) {
      expandedBtn.textContent = t("expanded");
      expandedBtn.classList.toggle("active", isPipelineExpanded);
      expandedBtn.setAttribute("aria-pressed", String(isPipelineExpanded));
    }
  }
  function setDashboardFilter(filter) {
    currentDashboardFilter = filter;
    renderDashboard();
  }
  function updateDashboardFilterUI() {
    const map = {
      accepted: "card-filter-accepted",
      active: "card-filter-active",
      all: "card-filter-all"
    };
    Object.entries(map).forEach(([filter, id]) => {
      const card = document.getElementById(id);
      if (card) card.classList.toggle("active-filter", currentDashboardFilter === filter);
    });
    const labelEl = document.getElementById("dashboard-filter-label");
    if (labelEl) labelEl.textContent = getDashboardFilterLabel();
  }
  function getDashboardFilterLabel() {
    const showSortHint = typeof ZoteroBridge !== "undefined" ? ZoteroBridge.getPref("showTimelineSortHint", true) : true;
    const sortHint = showSortHint ? ` · ${t("timelineSortedBySubmissionDate")}` : "";
    if (currentDashboardFilter === "accepted") return `${t("acceptedPipelines")}${sortHint}`;
    if (currentDashboardFilter === "active") return `${t("activePipelines")}${sortHint}`;
    return `${t("allPipelines")}${sortHint}`;
  }
  var init_transfer_and_status = __esm({
    "src/modules/dashboard-view/transfer-and-status.ts"() {
      "use strict";
      init_field_helpers();
    }
  });

  // src/modules/dashboard-view/timeline-alerts.ts
  function renderTimelineAlerts() {
    const reviewMilestones = document.getElementById("dashboard-pending-milestones");
    if (reviewMilestones) window.RFUI?.setHTML?.(reviewMilestones, "");
    const alertsList = document.getElementById("dashboard-alerts-list") || reviewMilestones;
    if (!alertsList) return;
    const w = window;
    w.RFUI.setHTML(alertsList, "");
    const alerts = [];
    (db.submissions || []).forEach((sub) => {
      if (isAcceptedSubmission(sub) || sub.status === "rejected") return;
      const man = db.manuscripts.find((m) => m.id === sub.manuscriptId);
      const title = man ? man.title : sub.title || t("untitledManuscript");
      const journalName = getSubmissionJournalName(sub);
      (sub.timelineNodes || []).forEach((node) => {
        const status = computeNodeStatus(node);
        const isReviewDeadline = Boolean(node.dueDate);
        const isDecisionNotice = Boolean(node.reviewDecision);
        const dueEndTime = node.dueDate ? (/* @__PURE__ */ new Date(`${normalizeDateString(node.dueDate)}T23:59:59`)).getTime() : 0;
        const isDecisionStillRelevant = isDecisionNotice && (!dueEndTime || dueEndTime >= Date.now());
        if (status === "overdue" || status === "due_soon" || status === "blocked" || isReviewDeadline || isDecisionStillRelevant) {
          alerts.push({ sub, node, status, title, journalName });
        }
      });
    });
    if (alerts.length === 0) {
      w.RFUI.setHTML(alertsList, `<p class="empty-state">${t("noUrgentEvents")}</p>`);
      return;
    }
    alerts.sort((a, b) => new Date(getNodeDate(a.node) || 0).getTime() - new Date(getNodeDate(b.node) || 0).getTime()).slice(0, 6).forEach(({ sub, node, status, title, journalName }) => {
      const el = document.createElement("div");
      el.className = "recent-item";
      const dueDate = normalizeDateString(node.dueDate);
      const dateStr = dueDate || getNodeDate(node) || t("noDate");
      const relativeStr = dueDate ? getRelativeDayLabel(dueDate) : "";
      const decisionLabel = node.reviewDecision ? node.reviewDecision === "major" ? t("majorRevision") : t("minorRevision") : "";
      const alertLabel = dueDate ? `${t("deadlineShort")} ${formatShortDate(dueDate)}${relativeStr ? ` · ${relativeStr}` : ""}` : getNodeStatusLabel(status);
      w.RFUI.setHTML(el, `
        <div class="recent-item-header">
          <span class="badge ${status === "overdue" || status === "blocked" ? "badge-danger" : "badge-warning"}">${escapeHTML(alertLabel)}</span>
          ${decisionLabel ? `<span class="badge badge-info">${escapeHTML(decisionLabel)}</span>` : ""}
          <span class="recent-item-date">${escapeHTML(dateStr)}</span>
        </div>
        <div class="recent-item-title">${escapeHTML(getTimelineNodeDisplayName(node))} · ${escapeHTML(journalName)}</div>
        <div class="text-muted" style="font-size:12px;">${escapeHTML(title)}</div>
      `);
      el.addEventListener("click", () => openStageDrawer(sub.id, node.id));
      alertsList.appendChild(el);
    });
  }
  var init_timeline_alerts = __esm({
    "src/modules/dashboard-view/timeline-alerts.ts"() {
      "use strict";
      init_field_helpers();
    }
  });

  // src/modules/dashboard-view/card-interactions.ts
  function bindPipelineCardInteractions(card, sub) {
    card.querySelectorAll(".interactive-capsule, .interactive-dot, .btn-event-edit").forEach((cap) => {
      cap.addEventListener("click", (e) => {
        e.stopPropagation();
        const sId = cap.getAttribute("data-sub-id");
        const nId = cap.getAttribute("data-node-id");
        if (sId && nId) openStageDrawer(sId, nId);
      });
    });
    card.querySelectorAll(".btn-event-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const sId = btn.getAttribute("data-sub-id");
        const nId = btn.getAttribute("data-node-id");
        const targetSub = db.submissions.find((s) => s.id === sId);
        const targetNode = targetSub?.timelineNodes?.find((n) => n.id === nId);
        if (!targetSub || !targetNode) return;
        if (!confirm(tf("confirmDeleteEvent", { name: getTimelineNodeDisplayName(targetNode) }))) return;
        deleteTimelineNode(targetSub, nId);
        syncManuscriptStatusFromSubmission(targetSub);
        const w = window;
        await w.storage.saveAll(db);
        renderDashboard();
        renderKanban();
        renderSubmissions();
        showGlobalToast(t("eventRemovedToast"), "success");
      });
    });
    card.querySelectorAll(".btn-inline-add-event").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleInlineStageEditor(card);
      });
    });
    const inlineEditor = card.querySelector(".inline-stage-editor");
    if (inlineEditor) {
      inlineEditor.querySelector(".inline-stage-key")?.addEventListener("change", () => {
        syncInlineStagePreset(inlineEditor);
      });
      inlineEditor.querySelector(".inline-stage-type")?.addEventListener("change", () => {
        const typeSelect = inlineEditor.querySelector(".inline-stage-type");
        const keySelect = inlineEditor.querySelector(".inline-stage-key");
        const isReview = typeSelect?.value === "review" || keySelect?.value === "r1_comments" || keySelect?.value === "r2_comments";
        inlineEditor.classList.toggle("is-review", Boolean(isReview));
        const deadlineField = inlineEditor.querySelector(".inline-stage-deadline-field");
        const decisionField = inlineEditor.querySelector(".inline-stage-decision-field");
        if (deadlineField) deadlineField.hidden = !isReview;
        if (decisionField) decisionField.hidden = !isReview;
        updateInlineStageDeadlineStatus(inlineEditor);
      });
      inlineEditor.querySelector(".inline-stage-deadline")?.addEventListener("input", () => {
        updateInlineStageDeadlineStatus(inlineEditor);
      });
      inlineEditor.querySelector(".btn-inline-stage-reset")?.addEventListener("click", (e) => {
        e.stopPropagation();
        resetInlineStageEditor(inlineEditor);
      });
      inlineEditor.querySelector(".btn-inline-stage-cancel")?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleInlineStageEditor(card, false);
      });
      inlineEditor.querySelector(".btn-inline-stage-save")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const saveButton = inlineEditor.querySelector(".btn-inline-stage-save");
        if (saveButton?.disabled) return;
        setInlineStageBusy(inlineEditor, true, t("autoSaveSaving"));
        try {
          await saveInlineStageEvent(inlineEditor);
        } finally {
          if (inlineEditor.isConnected) setInlineStageBusy(inlineEditor, false);
        }
      });
      inlineEditor.querySelectorAll("input, select").forEach((field) => {
        field.addEventListener("keydown", async (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const saveButton = inlineEditor.querySelector(".btn-inline-stage-save");
            if (saveButton?.disabled) return;
            setInlineStageBusy(inlineEditor, true, t("autoSaveSaving"));
            try {
              await saveInlineStageEvent(inlineEditor);
            } finally {
              if (inlineEditor.isConnected) setInlineStageBusy(inlineEditor, false);
            }
          } else if (e.key === "Escape") {
            e.preventDefault();
            toggleInlineStageEditor(card, false);
          }
        });
      });
    }
    card.querySelector(".btn-share-submission")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openSubmissionShareModal(sub.id);
    });
    card.querySelector(".btn-open-submission-detail")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openSubmissionForEditing(sub, { switchView: true, focusEditCenter: true });
    });
    const pZotBadge = card.querySelector(".pipeline-zotero-badge");
    if (pZotBadge) {
      pZotBadge.addEventListener("click", (e) => {
        e.stopPropagation();
        const key = pZotBadge.getAttribute("data-item-key");
        if (key && typeof ZoteroBridge !== "undefined") {
          const linkedMan = db.manuscripts?.find((item) => item.id === sub.manuscriptId);
          ZoteroBridge.selectItemInZotero(key, linkedMan?.zoteroLibraryID);
        }
      });
    }
  }
  function setupSaveErrorListener() {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    window.addEventListener("researchflow-save-state", (event) => {
      const { state, error } = event.detail || {};
      const curLang = typeof window.currentLanguage !== "undefined" ? window.currentLanguage : "en";
      if (state === "error") showGlobalToast(error || (curLang === "zh" ? "保存失败，请重试" : "Save failed, please retry"), "error");
      if (state === "pending") showGlobalToast(t("saveNewEditsPending"), "info");
    });
  }
  function setupDashboardFilterListeners() {
    const cardAccepted = document.getElementById("card-filter-accepted");
    const cardActive = document.getElementById("card-filter-active");
    const cardAll = document.getElementById("card-filter-all");
    if (!cardAccepted || !cardActive || !cardAll) return;
    const clearActiveClasses = () => {
      [cardAccepted, cardActive, cardAll].forEach((c) => {
        c.classList.remove("active");
        c.setAttribute("aria-pressed", "false");
      });
    };
    cardAccepted.addEventListener("click", () => {
      window.currentDashboardFilter = "accepted";
      clearActiveClasses();
      cardAccepted.classList.add("active");
      cardAccepted.setAttribute("aria-pressed", "true");
      renderDashboard();
    });
    cardActive.addEventListener("click", () => {
      window.currentDashboardFilter = "active";
      clearActiveClasses();
      cardActive.classList.add("active");
      cardActive.setAttribute("aria-pressed", "true");
      renderDashboard();
    });
    cardAll.addEventListener("click", () => {
      window.currentDashboardFilter = "all";
      clearActiveClasses();
      cardAll.classList.add("active");
      cardAll.setAttribute("aria-pressed", "true");
      renderDashboard();
    });
  }
  var init_card_interactions = __esm({
    "src/modules/dashboard-view/card-interactions.ts"() {
      "use strict";
    }
  });

  // src/modules/dashboard-view/pipeline-renderer.ts
  function bindDashboardControls() {
    document.getElementById("btn-pipeline-compact")?.addEventListener("click", () => setPipelineViewMode(false));
    document.getElementById("btn-pipeline-expanded")?.addEventListener("click", () => setPipelineViewMode(true));
    const filterCardBindings = [
      ["card-filter-accepted", "accepted"],
      ["card-filter-active", "active"],
      ["card-filter-all", "all"]
    ];
    filterCardBindings.forEach(([id, filter]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("click", () => setDashboardFilter(filter));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDashboardFilter(filter);
        }
      });
    });
  }
  function renderDashboard2() {
    if (window.RFUI?.isViewDeferred?.("view-dashboard")) return;
    const allSubmissions = sortDashboardSubmissions(db.submissions || []);
    const allAnalyses = allSubmissions.map((sub) => ({ sub, analysis: analyzeSubmission(sub) }));
    const acceptedSubs = allSubmissions.filter((s) => isAcceptedSubmission(s));
    const activeSubs = allSubmissions.filter((s) => !isAcceptedSubmission(s) && s.status !== "rejected");
    window.RFUI.animateMetricValue(document.getElementById("stat-accepted-papers"), acceptedSubs.length);
    window.RFUI.animateMetricValue(document.getElementById("stat-active-subs"), activeSubs.length);
    window.RFUI.animateMetricValue(document.getElementById("stat-total-attempts"), allSubmissions.length);
    updateDashboardFilterUI();
    const expSubmitAvg = average(allAnalyses.map((x) => x.analysis.expToSubmit));
    const submitNowAvg = average(allAnalyses.filter((x) => !x.analysis.accepted && x.sub.status !== "rejected").map((x) => x.analysis.submitToNow));
    const r1NowAvg = average(allAnalyses.filter((x) => !x.analysis.accepted && x.sub.status !== "rejected").map((x) => x.analysis.r1ToNow));
    const submitAcceptAvg = average(allAnalyses.filter((x) => x.analysis.accepted).map((x) => x.analysis.submitToAccept));
    const fmtMetric = (val) => val === null ? "—" : `${val} ${t("days")}`;
    window.RFUI.animateMetricValue(document.getElementById("metric-exp-submit"), fmtMetric(expSubmitAvg));
    window.RFUI.animateMetricValue(document.getElementById("metric-submit-now"), fmtMetric(submitNowAvg));
    window.RFUI.animateMetricValue(document.getElementById("metric-r1-now"), fmtMetric(r1NowAvg));
    window.RFUI.animateMetricValue(document.getElementById("metric-submit-accept"), fmtMetric(submitAcceptAvg));
    renderTimelineAlerts();
    const ganttBox = document.getElementById("dashboard-gantt");
    if (!ganttBox) return;
    window.RFUI.setHTML(ganttBox, "");
    setPipelineViewMode(isPipelineExpanded);
    const visibleSubmissions = allSubmissions.filter((sub) => {
      if (currentDashboardFilter === "accepted") return isAcceptedSubmission(sub);
      if (currentDashboardFilter === "active") return !isAcceptedSubmission(sub) && sub.status !== "rejected";
      return true;
    });
    if (visibleSubmissions.length === 0) {
      window.RFUI.setHTML(ganttBox, `<p class="empty-state">${t("noPipelines")}</p>`);
      return;
    }
    visibleSubmissions.forEach((sub, idx) => {
      const man = db.manuscripts.find((m) => m.id === sub.manuscriptId);
      const titleDisplay = window.RFUI.getPipelineTitleDisplay({
        title: man ? man.title : sub.title || t("untitledManuscript")
      });
      const manTitle = titleDisplay.displayTitle;
      const fullManTitle = titleDisplay.fullTitle;
      const firstAuthor = getSubmissionFirstAuthor(sub, man);
      const submissionDoi = getSubmissionDoi(sub);
      const journalName = getSubmissionJournalName(sub);
      const articleUrl = getSubmissionArticleUrl(sub);
      const analysis = analyzeSubmission(sub);
      const d = analysis.display;
      const latestType = analysis.latest ? typeMeta[analysis.latest.type] || typeMeta.special : { labelKey: "typeNoEvent", color: "#64748b" };
      const latestTypeLabel = t(latestType.labelKey);
      const card = document.createElement("div");
      card.className = "pipeline-card";
      card.style?.setProperty?.("--card-index", String(idx));
      const sortedNodes = autoSortNodes(sub.timelineNodes || []);
      let trackHtml = "";
      if (sortedNodes.length === 0) {
        trackHtml = `
        <div class="pipeline-empty-track btn-inline-add-event" data-sub-id="${sub.id}" title="${escapeHTML(t("clickAddEvent"))}">
          <span>+ ${t("addEventStart")}</span>
        </div>
      `;
      } else {
        const firstDateStr = sortedNodes[0]?.completeDate || sortedNodes[0]?.planDate || sortedNodes[0]?.dueDate;
        const firstDate = firstDateStr ? new Date(firstDateStr) : null;
        const capsules = sortedNodes.map((node, index) => {
          const computedStatus = computeNodeStatus(node);
          const icon = getCapsuleIcon(computedStatus, node.type);
          const rawDateStr = getNodeDate(node);
          const dateStr = formatShortDate(rawDateStr);
          let deltaStr = "";
          if (index > 0 && firstDate && rawDateStr) {
            const curDate = new Date(rawDateStr);
            if (!isNaN(firstDate.getTime()) && !isNaN(curDate.getTime())) {
              const diffDays = Math.round((curDate.getTime() - firstDate.getTime()) / (1e3 * 60 * 60 * 24));
              if (diffDays > 0) deltaStr = `+${diffDays}${t("dayUnitShort")}`;
            }
          }
          const typeClass = `type-${node.type || "research"}`;
          const statusLabel = getNodeStatusLabel(computedStatus);
          const dueNote = node.dueDate ? ` | ${t("deadlineShort")}: ${node.dueDate}` : "";
          const decisionNote = node.reviewDecision ? ` | ${node.reviewDecision === "major" ? t("majorRevision") : t("minorRevision")}` : "";
          const tooltip = `${getTimelineNodeDisplayName(node)} (${statusLabel})${rawDateStr ? " - " + rawDateStr : ""}${dueNote}${decisionNote}${node.notes ? ": " + node.notes : ""}`;
          return `
          <button type="button" class="stage-capsule status-${computedStatus} ${typeClass} interactive-capsule"
               data-sub-id="${sub.id}" data-node-id="${node.id}" title="${escapeHTML(tooltip)}">
            <span class="capsule-icon">${icon}</span>
            <span class="capsule-name">${escapeHTML(getTimelineNodeDisplayName(node))}</span>
            ${dateStr ? `<span class="capsule-date">${dateStr}</span>` : ""}
            ${deltaStr ? `<span class="capsule-delta">${deltaStr}</span>` : ""}
          </button>
        `;
        }).join('<div class="stage-connector"></div>');
        trackHtml = `<div class="pipeline-capsule-track">${capsules}</div>`;
      }
      const milestoneDots = d.milestones.map((m) => `
      <div class="milestone" title="${escapeHTML(m.name)}: ${escapeHTML(m.date || t("noDate"))}${m.node ? " · " + escapeHTML(t("clickEditEvent")) : ""}">
        <span class="dot ${m.date ? "active" : ""} ${m.emphasis ? "emphasis" : ""} ${m.today ? "today" : ""} ${m.node ? "interactive-dot" : ""}"
          ${m.node ? `data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(m.node.id)}"` : ""}
          style="${m.date ? `color:${m.color};border-color:${m.color};${m.emphasis ? `background:${m.color};color:#fff;` : ""}` : ""}"></span>
        <div class="m-name" style="${m.emphasis ? `color:${m.color};font-weight:750;` : ""}">${escapeHTML(m.name)}</div>
        <div class="m-date">${escapeHTML(m.date ? formatShortDate(m.date) : "—")}</div>
      </div>
    `).join("");
      const expSubmitBadge = analysis.expToSubmit !== null && d.mode !== "prepare" ? `<span>${t("expSubmitShort")} <strong style="color:hsl(var(--text-primary));">${analysis.expToSubmit} ${t("days")}</strong></span>` : "";
      const zoteroItemKey = man?.zoteroItemKey || "";
      const zoteroBadgeHtml = zoteroItemKey ? `
      <span class="zotero-card-badge pipeline-zotero-badge" data-item-key="${escapeHTML(zoteroItemKey)}" title="${escapeHTML(currentLanguage === "zh" ? "在 Zotero 文献库中定位该条目" : "Locate in Zotero library")}" style="cursor:pointer;">
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
        Zotero
      </span>
    ` : "";
      const doiMetaHtml = submissionDoi ? `<span>${escapeHTML(t("doiLabel"))} ${articleUrl ? `<a class="doi-link" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(submissionDoi)}</a>` : `<strong style="color:hsl(var(--text-primary));">${escapeHTML(submissionDoi)}</strong>`}</span>` : "";
      let countdownBadgeHtml = "";
      if (sub.revisionDueDate && !analysis.accepted && sub.status !== "rejected") {
        const cd = window.RFCalendar?.getRevisionCountdownMeta ? window.RFCalendar.getRevisionCountdownMeta(sub.revisionDueDate) : null;
        if (cd) {
          countdownBadgeHtml = `<span class="meta-badge ${escapeHTML(cd.badgeClass)}" title="${escapeHTML(cd.title)}" style="font-weight:700;">${escapeHTML(cd.icon)} ${escapeHTML(cd.text)}</span>`;
        }
      }
      const totalEvents = analysis.events.length;
      const completedEvents = analysis.events.filter((e) => e.completeDate || e.status === "completed").length;
      const progressPct = analysis.accepted ? 100 : totalEvents > 0 ? Math.min(95, Math.max(12, Math.round(completedEvents / totalEvents * 100))) : 15;
      const progressColor = analysis.accepted ? "#10b981" : sub.status === "revision" ? "#f59e0b" : sub.status === "rejected" ? "#ef4444" : "#e11d48";
      window.RFUI.setHTML(card, `
      <div class="pipeline-top">
        <div class="pipeline-title-block">
          <div class="title-line">
            <span class="index-badge">${idx + 1}</span>
            <span class="paper-title" ${titleDisplay.showTooltip ? `title="${escapeHTML(fullManTitle)}"` : ""}>${escapeHTML(manTitle)}</span>
            <span class="journal-pill" title="${escapeHTML(journalName)}">${escapeHTML(journalName)}</span>
            ${sub.externalManuscriptId ? `<span class="meta-badge" style="font-family:monospace; color:#6366f1; border-color:rgba(99,102,241,0.3); background:rgba(99,102,241,0.06);" title="Manuscript ID">${escapeHTML(sub.externalManuscriptId)}</span>` : ""}
            ${countdownBadgeHtml}
            ${zoteroBadgeHtml}
            ${articleUrl ? `<a class="meta-badge article-link-badge" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(t("articlePage"))}</a>` : ""}
            <span class="state-pill" style="background:${analysis.stateColor}14;color:${analysis.stateColor};border-color:${analysis.stateColor}33;">
              ${escapeHTML(analysis.stateLabel)} · ${escapeHTML(analysis.stateNote)}
            </span>
          </div>
          <div class="subline">
            <span>${escapeHTML(t("firstAuthorLabel"))} <strong style="color:hsl(var(--text-primary));">${escapeHTML(firstAuthor || t("firstAuthorNotSet"))}</strong></span>
            <span>${t("milestoneSubmission")} <strong style="color:hsl(var(--text-primary));">${escapeHTML(analysis.submitDate || "—")}</strong></span>
            <span>${t("milestoneR1Comments")} <strong style="color:hsl(var(--text-primary));">${escapeHTML(analysis.r1Date || "—")}</strong></span>
            <span>${t("milestoneAcceptance")} <strong style="color:hsl(var(--text-primary));">${escapeHTML(analysis.acceptDate || "—")}</strong></span>
            ${doiMetaHtml}
            ${expSubmitBadge}
            <span>${tf("nodesSaved", { count: analysis.events.length })}</span>
          </div>
          <div class="pipeline-progress-bar-wrap" title="Pipeline Completion: ${progressPct}%">
            <div class="pipeline-progress-bar-fill" style="width:${progressPct}%; background:${progressColor};"></div>
          </div>
        </div>
        <div class="pipeline-actions">
          <button class="btn-secondary btn-sm btn-inline-add-event" data-sub-id="${escapeHTML(sub.id)}" type="button">${t("addEvent")}</button>
          <button class="btn-secondary btn-sm btn-share-submission" data-sub-id="${escapeHTML(sub.id)}" type="button">${escapeHTML(t("shareJourney"))}</button>
          <button class="btn-secondary btn-sm btn-open-submission-detail" data-sub-id="${escapeHTML(sub.id)}" type="button">${t("openSubmissionDetails")}</button>
        </div>
      </div>

      ${buildInlineStageEditor(sub.id)}

      <div class="pipeline-middle">
        <div class="key-track">
          <div class="track-top">
            <span>${t("keyEventRail")}</span>
            <span>${d.pending ? t("countingNow") : t("completedInterval")}</span>
          </div>
          <div class="milestones" style="grid-template-columns:repeat(${d.milestones.length}, minmax(82px, 1fr));">
            ${milestoneDots}
          </div>
        </div>

        <div class="focus-metric" style="background:${d.bg};border-color:${d.border};">
          <div>
            <div class="fm-label" style="color:${d.color};">${escapeHTML(d.label)}</div>
            <div class="fm-caption">${escapeHTML(d.caption)}</div>
          </div>
          <div class="fm-value" style="color:${d.color};">
            ${d.value ?? "—"}<span class="unit">${d.value !== null && d.value !== void 0 ? t("days") : ""}</span>
          </div>
        </div>

        <div class="latest-box">
          <div>
            <div class="lb-head">
              <span class="lb-title">${t("latestEvent")}</span>
              <span class="type-pill" style="background:${latestType.color}14;color:${latestType.color};border-color:${latestType.color}33;">${escapeHTML(latestTypeLabel)}</span>
            </div>
            <div class="lb-event">${escapeHTML(analysis.latest ? getTimelineNodeDisplayName(analysis.latest) : t("noEventYet"))}</div>
          </div>
          <div class="lb-meta">
            <span>${escapeHTML(analysis.latest ? getNodeDate(analysis.latest) || t("noDate") : "")}</span>
            <span>${escapeHTML(analysis.latest?.notes || "")}</span>
          </div>
        </div>
      </div>

      ${trackHtml}
      ${buildTimelineEventManager(sub)}
    `);
      ganttBox.appendChild(card);
      bindPipelineCardInteractions(card, sub);
    });
  }
  var init_pipeline_renderer = __esm({
    "src/modules/dashboard-view/pipeline-renderer.ts"() {
      "use strict";
      init_field_helpers();
      init_transfer_and_status();
      init_timeline_alerts();
      init_card_interactions();
    }
  });

  // src/modules/dashboard-view.ts
  var require_dashboard_view = __commonJS({
    "src/modules/dashboard-view.ts"(exports, module) {
      init_field_helpers();
      init_transfer_and_status();
      init_pipeline_renderer();
      init_card_interactions();
      bindDashboardControls();
      setupSaveErrorListener();
      setupDashboardFilterListeners();
      var dashboardExports = {
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
        syncManuscriptStatusFromSubmission: syncManuscriptStatusFromSubmission2,
        syncManuscriptStatusesFromSubmissions,
        clearOnlinePublicationCompletion,
        syncLinkedSubmissionsFromManuscript,
        createTransferredSubmission,
        setPipelineViewMode,
        updatePipelineViewToggle,
        setDashboardFilter,
        updateDashboardFilterUI,
        getDashboardFilterLabel,
        setupSaveErrorListener,
        setupDashboardFilterListeners,
        renderDashboard: renderDashboard2,
        renderTimelineAlerts
      };
      if (typeof globalThis !== "undefined") {
        Object.assign(globalThis, dashboardExports);
      }
      if (typeof window !== "undefined") {
        Object.assign(window, dashboardExports);
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = { ...module.exports || {}, ...dashboardExports };
      }
    }
  });
  require_dashboard_view();
})();
