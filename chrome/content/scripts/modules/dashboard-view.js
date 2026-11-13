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
  function formatCalendarParts(year, month, day) {
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function parseCalendarParts(dateStr) {
    if (!dateStr) return null;
    if (typeof dateStr === "string") {
      const trimmed = dateStr.trim();
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.000)?Z$)/);
      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const probe = new Date(Date.UTC(year, month - 1, day));
        if (probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day) {
          return { year, month, day };
        }
        return null;
      }
    }
    try {
      const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    } catch (_) {
      return null;
    }
  }
  function todayString() {
    const now = /* @__PURE__ */ new Date();
    return formatCalendarParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
  function normalizeDateString(dateStr) {
    const parts = parseCalendarParts(dateStr);
    return parts ? formatCalendarParts(parts.year, parts.month, parts.day) : "";
  }
  function addDays(dateStr, days) {
    const base = normalizeDateString(dateStr) || todayString();
    const parts = parseCalendarParts(base);
    const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
    return formatCalendarParts(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
  }
  function dateInputToIso(dateStr) {
    const normalized = normalizeDateString(dateStr);
    return normalized ? `${normalized}T12:00:00.000Z` : null;
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
    const target = parseCalendarParts(dateStr);
    const now = parseCalendarParts(todayString());
    if (!target || !now) return "";
    const diffDays = Math.round(
      (Date.UTC(target.year, target.month - 1, target.day) - Date.UTC(now.year, now.month - 1, now.day)) / 864e5
    );
    if (diffDays === 0) return t("relativeToday");
    if (diffDays < 0) return tf("relativeDaysAgo", { count: Math.abs(diffDays) });
    return tf("relativeInDays", { count: diffDays });
  }
  function getDaysDiff(startDateStr, endDateStr) {
    const start = parseCalendarParts(startDateStr);
    const end = parseCalendarParts(endDateStr);
    if (!start || !end) return null;
    const s = Date.UTC(start.year, start.month - 1, start.day);
    const e = Date.UTC(end.year, end.month - 1, end.day);
    return Math.max(0, Math.round((e - s) / 864e5));
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
  function syncManuscriptStatusFromSubmission(sub, database = db) {
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
      round: (Number(sourceSub?.round ?? sourceSub?.roundIndex) || 1) + 1,
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
  function setPipelineViewMode(expanded, options = {}) {
    const g = typeof window !== "undefined" ? window : globalThis;
    g.isPipelineExpanded = Boolean(expanded);
    isPipelineExpanded = g.isPipelineExpanded;
    const container = document.getElementById("dashboard-gantt");
    if (container) {
      container.classList.toggle("expanded", g.isPipelineExpanded);
      container.classList.toggle("is-compact", !g.isPipelineExpanded);
      container.classList.toggle("is-expanded", g.isPipelineExpanded);
    }
    updatePipelineViewToggle();
    if (options.persist !== false) {
      const rf = typeof window.RFPlatform !== "undefined" ? window.RFPlatform : typeof RFPlatform !== "undefined" ? RFPlatform : null;
      rf?.storage?.local?.set?.({ researchflow_pipeline_expanded: g.isPipelineExpanded });
    }
  }
  function updatePipelineViewToggle() {
    const g = typeof window !== "undefined" ? window : globalThis;
    const isExp = Boolean(g.isPipelineExpanded);
    const container = document.getElementById("dashboard-gantt");
    if (container) {
      container.classList.toggle("expanded", isExp);
    }
    const label = document.getElementById("pipeline-view-label");
    if (label) label.textContent = isExp ? t("expanded") : t("compact");
    const icon = document.getElementById("pipeline-view-icon");
    if (icon) icon.textContent = isExp ? "▦" : "▤";
    const button = document.getElementById("btn-pipeline-view-toggle");
    if (button) {
      button.classList.toggle("active", isExp);
      button.setAttribute("aria-pressed", String(isExp));
    }
    const compactBtn = document.getElementById("btn-pipeline-compact");
    if (compactBtn) {
      compactBtn.textContent = t("compact");
      compactBtn.classList.toggle("active", !isExp);
      compactBtn.setAttribute("aria-pressed", String(!isExp));
    }
    const expandedBtn = document.getElementById("btn-pipeline-expanded");
    if (expandedBtn) {
      expandedBtn.textContent = t("expanded");
      expandedBtn.classList.toggle("active", isExp);
      expandedBtn.setAttribute("aria-pressed", String(isExp));
    }
  }
  function initializePipelineViewMode() {
    const rf = typeof window.RFPlatform !== "undefined" ? window.RFPlatform : typeof RFPlatform !== "undefined" ? RFPlatform : null;
    rf?.storage?.local?.get?.(["researchflow_pipeline_expanded"], (result) => {
      setPipelineViewMode(Boolean(result?.researchflow_pipeline_expanded), { persist: false });
    });
  }
  function setDashboardFilter(filter) {
    const g = typeof window !== "undefined" ? window : globalThis;
    g.currentDashboardFilter = filter;
    renderDashboard();
  }
  function updateDashboardFilterUI() {
    const map = {
      accepted: "card-filter-accepted",
      active: "card-filter-active",
      all: "card-filter-all"
    };
    const g = typeof window !== "undefined" ? window : globalThis;
    const filter = String(g.currentDashboardFilter || "all");
    Object.entries(map).forEach(([flt, id]) => {
      const card = document.getElementById(id);
      if (card) card.classList.toggle("active-filter", filter === flt);
    });
    const labelEl = document.getElementById("dashboard-filter-label");
    if (labelEl) labelEl.textContent = getDashboardFilterLabel();
  }
  function getDashboardFilterLabel() {
    const showSortHint = typeof ZoteroBridge !== "undefined" ? ZoteroBridge.getPref("showTimelineSortHint", true) : true;
    const sortHint = showSortHint ? ` · ${t("timelineSortedBySubmissionDate")}` : "";
    const g = typeof window !== "undefined" ? window : globalThis;
    const filter = String(g.currentDashboardFilter || "all");
    if (filter === "accepted") return `${t("acceptedPipelines")}${sortHint}`;
    if (filter === "active") return `${t("activePipelines")}${sortHint}`;
    return `${t("allPipelines")}${sortHint}`;
  }
  var isPipelineExpanded;
  var init_transfer_and_status = __esm({
    "src/modules/dashboard-view/transfer-and-status.ts"() {
      "use strict";
      init_field_helpers();
      isPipelineExpanded = false;
    }
  });

  // src/modules/ui-utils/lifecycle.ts
  function createFallbackController() {
    let aborted = false;
    let reason;
    const listeners = /* @__PURE__ */ new Set();
    const signal = {
      get aborted() {
        return aborted;
      },
      get reason() {
        return reason;
      },
      addEventListener(type, listener) {
        if (type !== "abort" || typeof listener !== "function") return;
        if (aborted) {
          try {
            listener({ type: "abort" });
          } catch (_) {
          }
          return;
        }
        listeners.add(listener);
      },
      removeEventListener(type, listener) {
        if (type !== "abort") return;
        listeners.delete(listener);
      }
    };
    return {
      signal,
      abort(nextReason) {
        if (aborted) return;
        aborted = true;
        reason = nextReason;
        const snapshot = Array.from(listeners);
        listeners.clear();
        for (const listener of snapshot) {
          try {
            listener({ type: "abort" });
          } catch (_) {
          }
        }
      }
    };
  }
  function isNativeAbortSignal(signal) {
    return typeof AbortSignal !== "undefined" && signal instanceof AbortSignal;
  }
  function createLifecycleScope(parentSignal) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : createFallbackController();
    const cleanups = /* @__PURE__ */ new Set();
    let localAborted = false;
    const runCleanups = () => {
      const snapshot = Array.from(cleanups);
      cleanups.clear();
      for (const cleanup of snapshot) {
        try {
          cleanup();
        } catch (_) {
        }
      }
    };
    const abort = (reason) => {
      if (localAborted) return;
      localAborted = true;
      try {
        controller.abort(reason);
      } catch (_) {
      }
      runCleanups();
    };
    if (parentSignal) {
      if (parentSignal.aborted) {
        abort(parentSignal.reason);
      } else if (typeof parentSignal.addEventListener === "function") {
        const onParentAbort = () => abort(parentSignal.reason);
        parentSignal.addEventListener("abort", onParentAbort, { once: true });
        cleanups.add(() => {
          try {
            parentSignal.removeEventListener?.("abort", onParentAbort);
          } catch (_) {
          }
        });
      }
    }
    const scope = {
      signal: controller.signal,
      get aborted() {
        return localAborted || Boolean(controller.signal?.aborted);
      },
      abort,
      onAbort(fn) {
        if (typeof fn !== "function") return () => {
        };
        if (scope.aborted) {
          try {
            fn();
          } catch (_) {
          }
          return () => {
          };
        }
        cleanups.add(fn);
        return () => {
          cleanups.delete(fn);
        };
      },
      on(target, type, listener, options) {
        if (!target || typeof target.addEventListener !== "function" || typeof listener !== "function" || scope.aborted) {
          return () => {
          };
        }
        const capture = typeof options === "boolean" ? options : Boolean(options?.capture);
        const baseOpts = typeof options === "boolean" ? { capture: options } : options ? { ...options } : {};
        const listenerOptions = isNativeAbortSignal(controller.signal) ? { ...baseOpts, signal: controller.signal } : typeof options === "boolean" ? options : options || void 0;
        target.addEventListener(type, listener, listenerOptions);
        const detach = () => {
          cleanups.delete(detach);
          if (typeof target.removeEventListener === "function") {
            try {
              target.removeEventListener(type, listener, capture);
            } catch (_) {
            }
          }
        };
        cleanups.add(detach);
        return detach;
      },
      setTimeout(fn, delay = 0) {
        const st = globalThis.setTimeout;
        const ct = globalThis.clearTimeout;
        if (scope.aborted || typeof st !== "function") return 0;
        let timerId = 0;
        const cancel = () => {
          cleanups.delete(cancel);
          if (timerId && typeof ct === "function") {
            ct(timerId);
            timerId = 0;
          }
        };
        cleanups.add(cancel);
        timerId = st(() => {
          cleanups.delete(cancel);
          timerId = 0;
          if (!scope.aborted) fn();
        }, delay);
        return timerId;
      },
      setInterval(fn, delay = 0) {
        const si = globalThis.setInterval;
        const ci = globalThis.clearInterval;
        if (scope.aborted || typeof si !== "function") return 0;
        let timerId = 0;
        const cancel = () => {
          cleanups.delete(cancel);
          if (timerId && typeof ci === "function") {
            ci(timerId);
            timerId = 0;
          }
        };
        cleanups.add(cancel);
        timerId = si(() => {
          if (!scope.aborted) fn();
        }, delay);
        return timerId;
      },
      raf(fn) {
        const req = globalThis.requestAnimationFrame;
        const can = globalThis.cancelAnimationFrame;
        if (scope.aborted) return 0;
        if (typeof req !== "function") {
          return scope.setTimeout(() => fn(Date.now()), 0);
        }
        let rafId = 0;
        const cancel = () => {
          cleanups.delete(cancel);
          if (rafId && typeof can === "function") {
            can(rafId);
            rafId = 0;
          }
        };
        cleanups.add(cancel);
        rafId = req((ts) => {
          cleanups.delete(cancel);
          rafId = 0;
          if (!scope.aborted) fn(ts);
        });
        return rafId;
      },
      child() {
        return createLifecycleScope(controller.signal);
      }
    };
    return scope;
  }
  var init_lifecycle = __esm({
    "src/modules/ui-utils/lifecycle.ts"() {
      "use strict";
    }
  });

  // src/modules/dashboard-view/timeline-alerts.ts
  function computeCountdown(dateStr) {
    if (!dateStr) return null;
    const w = typeof window !== "undefined" ? window : globalThis;
    if (w.RFCalendar?.getRevisionCountdownMeta) {
      try {
        const meta = w.RFCalendar.getRevisionCountdownMeta(dateStr);
        if (meta) return meta;
      } catch (_) {
      }
    }
    if (typeof w.getRevisionCountdownMeta === "function") {
      try {
        const meta = w.getRevisionCountdownMeta(dateStr);
        if (meta) return meta;
      } catch (_) {
      }
    }
    return null;
  }
  function renderTimelineAlerts() {
    const reviewMilestones = document.getElementById("dashboard-pending-milestones");
    if (!reviewMilestones) return;
    alertsRenderScope?.abort("re-render");
    const renderScope = createLifecycleScope();
    alertsRenderScope = renderScope;
    const w = typeof window !== "undefined" ? window : globalThis;
    w.RFUI?.setHTML?.(reviewMilestones, "");
    const database = w.db || (typeof db !== "undefined" ? db : null) || {};
    const allSubmissions = database.submissions || [];
    const allManuscripts = database.manuscripts || [];
    const checkPub = (entity) => {
      if (!entity) return false;
      if (typeof hasPublicationStatus === "function") {
        try {
          return hasPublicationStatus(entity);
        } catch (_) {
        }
      }
      const st = String(entity.status || "").toLowerCase();
      return st === "accepted" || st === "published";
    };
    const checkAccepted = (entity) => {
      if (!entity) return false;
      if (typeof isAcceptedSubmission === "function") {
        try {
          return isAcceptedSubmission(entity);
        } catch (_) {
        }
      }
      if (typeof w.isAcceptedSubmission === "function") {
        try {
          return w.isAcceptedSubmission(entity);
        } catch (_) {
        }
      }
      if (typeof w.analyzeSubmission === "function") {
        try {
          return Boolean(w.analyzeSubmission(entity)?.accepted);
        } catch (_) {
        }
      }
      return checkPub(entity);
    };
    const isZh = typeof currentLanguage !== "undefined" ? currentLanguage === "zh" : true;
    const timelineAlerts = [];
    allSubmissions.filter((s) => s && s.status !== "rejected").forEach((sub) => {
      const man = allManuscripts.find((m) => m.id === sub.manuscriptId);
      if (man) {
        const currentSub = w.RFCore?.getCurrentSubmission?.(database, man.id);
        if (currentSub && currentSub.id !== sub.id) return;
      }
      const isAcceptedOrPublished = checkPub(sub) || checkAccepted(sub) || Boolean(man && (checkPub(man) || man.status === "accepted" || man.status === "published"));
      const isPublished = sub.status === "published" || man && man.status === "published";
      if (isPublished) return;
      const journalName = getSubmissionJournalName(sub);
      let hasRevisionAlert = false;
      if (!isAcceptedOrPublished) {
        const revDueDate = sub.revisionDueDate ? String(sub.revisionDueDate).trim() : "";
        const isRevisionStatus = sub.status === "revision";
        const revNode = (sub.timelineNodes || []).find((n) => {
          const k = n.key || inferKey(n);
          return k === "r1_revised" || k === "r2_revised" || n.type === "revision";
        }) || (sub.timelineNodes || []).find((n) => {
          const k = n.key || inferKey(n);
          return k === "r1_comments";
        });
        if (revDueDate) {
          const cd = computeCountdown(revDueDate);
          const revLabel = t("revisionDueLabel") || (isZh ? "修回截止" : "Revision Deadline");
          timelineAlerts.push({
            sub,
            node: revNode || sub.timelineNodes?.[0] || { id: "" },
            computedStatus: cd?.level === "overdue" ? "overdue" : cd?.level === "due_today" ? "due_today" : cd?.level === "due_soon" ? "due_soon" : "upcoming",
            title: `${journalName}: ${revLabel}`,
            date: revDueDate,
            displayDate: `${formatShortDate(revDueDate)}${isZh ? " 截止" : " due"}`,
            countdown: cd,
            manTitle: man ? man.title : t("untitledManuscript"),
            isRevision: true
          });
          hasRevisionAlert = true;
        } else if (isRevisionStatus) {
          timelineAlerts.push({
            sub,
            node: revNode || sub.timelineNodes?.[0] || { id: "" },
            computedStatus: "due_soon",
            title: `${journalName}: ${t("revisionDueLabel") || (isZh ? "修回截止" : "Revision Deadline")}`,
            date: "",
            displayDate: isZh ? "待设截止日" : "No deadline",
            countdown: { icon: "⚠️", text: isZh ? "待设截止日" : "No deadline", level: "due_soon", days: null },
            manTitle: man ? man.title : t("untitledManuscript"),
            isRevision: true
          });
          hasRevisionAlert = true;
        }
      }
      (sub.timelineNodes || []).forEach((node) => {
        const computedStatus = computeNodeStatus(node);
        const nodeKey = node.key || inferKey(node);
        if (isAcceptedOrPublished) {
          if (node.type !== "publication" || nodeKey === "accept") return;
        }
        if (computedStatus === "completed") return;
        if (hasRevisionAlert && (nodeKey === "r1_revised" || nodeKey === "r2_revised" || nodeKey === "r1_comments" || node.type === "revision" || node.type === "review")) return;
        const importantType = node.type === "review" || node.type === "revision" || node.type === "publication";
        const hasTimelineDate = Boolean(node.dueDate || node.planDate || node.completeDate);
        const actionable = computedStatus === "overdue" || computedStatus === "due_soon" || computedStatus === "blocked" || node.status === "active";
        if (!actionable && !hasTimelineDate) return;
        if (!importantType && !actionable) return;
        const alertDate = node.dueDate || node.planDate || (node.type === "review" ? sub.revisionDueDate : "") || node.completeDate || "";
        if (!alertDate && computedStatus !== "blocked") return;
        let cd = null;
        if (alertDate && (computedStatus === "overdue" || computedStatus === "due_soon" || node.dueDate)) {
          cd = computeCountdown(alertDate);
        }
        timelineAlerts.push({
          sub,
          node,
          computedStatus: cd?.level === "overdue" ? "overdue" : cd?.level === "due_today" ? "due_today" : cd?.level === "due_soon" ? "due_soon" : computedStatus,
          title: `${journalName}: ${getTimelineNodeDisplayName(node)}`,
          date: alertDate,
          displayDate: alertDate ? `${formatShortDate(alertDate)}${node.dueDate ? isZh ? " 截止" : "" : ""}` : t("noDate"),
          countdown: cd,
          manTitle: man ? man.title : t("untitledManuscript"),
          isRevision: false
        });
      });
    });
    const statusRank = { overdue: 0, due_today: 0, blocked: 1, due_soon: 2, in_progress: 3, not_started: 4, upcoming: 5 };
    timelineAlerts.sort((a, b) => {
      const hasDaysA = a.countdown && typeof a.countdown.days === "number";
      const hasDaysB = b.countdown && typeof b.countdown.days === "number";
      if (hasDaysA && hasDaysB && a.countdown.days !== b.countdown.days) {
        return a.countdown.days - b.countdown.days;
      }
      const ra = statusRank[a.computedStatus] ?? 9;
      const rb = statusRank[b.computedStatus] ?? 9;
      if (ra !== rb) return ra - rb;
      return new Date(a.date || "2999-12-31").getTime() - new Date(b.date || "2999-12-31").getTime();
    });
    const btnExportAllIcs = document.getElementById("btn-dashboard-export-all-ics");
    if (btnExportAllIcs && !btnExportAllIcs.dataset.listenerAttached) {
      btnExportAllIcs.dataset.listenerAttached = "true";
      exportAllIcsScope?.abort("rebind");
      exportAllIcsScope = createLifecycleScope();
      exportAllIcsScope.on(btnExportAllIcs, "click", () => {
        const activeSubs = (db.submissions || []).filter((s) => s.revisionDueDate && s.status !== "accepted" && s.status !== "published");
        if (activeSubs.length === 0) {
          showGlobalToast(t("noDeadlinesToExport") || (currentLanguage === "zh" ? "当前未发现已设置修回截止日期的活跃稿件。" : "No active submissions with revision due dates found."), "warning");
          return;
        }
        const rfCal = window.RFCalendar;
        if (rfCal?.generateSubmissionCalendarFeed && rfCal?.triggerCalendarDownload) {
          const feed = rfCal.generateSubmissionCalendarFeed(activeSubs, db.manuscripts, { calName: "PaperFlow All Revision Deadlines" });
          rfCal.triggerCalendarDownload(feed, "paperflow_all_deadlines.ics");
          showGlobalToast(t("calendarExportedToast") || (currentLanguage === "zh" ? "修回截止日历 (.ics) 已导出！" : "Revision deadline calendar (.ics) exported."), "success");
        }
      });
    }
    if (timelineAlerts.length === 0) {
      window.RFUI?.setHTML?.(reviewMilestones, `<p class="empty-state">${t("noUrgentEvents")}</p>`);
    } else {
      timelineAlerts.slice(0, 8).forEach((alert) => {
        const item = document.createElement("div");
        item.className = "recent-item";
        item.title = alert.manTitle;
        item.style.cursor = "pointer";
        renderScope.on(item, "click", () => {
          if (typeof openStageDrawer === "function") {
            openStageDrawer(alert.sub.id, alert.node?.id || "");
          }
        });
        const title = document.createElement("span");
        title.className = "recent-item-title";
        title.textContent = alert.title;
        const badge = document.createElement("span");
        let badgeClass = "info";
        let badgeText = getNodeStatusLabel(alert.computedStatus);
        if (alert.countdown && alert.countdown.text) {
          const lvl = alert.countdown.level;
          badgeClass = lvl === "overdue" || lvl === "due_today" ? "danger" : lvl === "due_soon" ? "warning" : "info";
          badgeText = `${alert.countdown.icon ? alert.countdown.icon + " " : ""}${alert.countdown.text}`;
        } else if (alert.computedStatus === "overdue" || alert.computedStatus === "blocked") {
          badgeClass = "danger";
        } else if (alert.computedStatus === "due_soon") {
          badgeClass = "warning";
        }
        badge.className = `badge badge-${badgeClass}`;
        badge.textContent = badgeText;
        if (alert.countdown?.title) {
          badge.title = alert.countdown.title;
        }
        const date = document.createElement("span");
        date.className = "recent-item-date";
        date.textContent = alert.displayDate || (alert.date ? formatShortDate(alert.date) : t("noDate"));
        item.appendChild(title);
        item.appendChild(badge);
        item.appendChild(date);
        if (alert.sub?.revisionDueDate) {
          const icsBtn = document.createElement("button");
          icsBtn.type = "button";
          icsBtn.className = "btn-secondary btn-icon";
          icsBtn.style.cssText = "font-size:11px; padding:2px 6px; border-radius:3px; margin-left:4px; height:22px;";
          icsBtn.title = t("exportCalendarIcs") || "导出修回日历 (.ics)";
          icsBtn.textContent = "📅";
          renderScope.on(icsBtn, "click", (e) => {
            e.stopPropagation();
            const rfCal = window.RFCalendar;
            if (rfCal?.generateSubmissionCalendarFeed && rfCal?.triggerCalendarDownload) {
              const feed = rfCal.generateSubmissionCalendarFeed([alert.sub], db.manuscripts, { calName: `${getSubmissionJournalName(alert.sub)} Revision Deadline` });
              rfCal.triggerCalendarDownload(feed, `revision_deadline_${alert.sub.id}.ics`);
              showGlobalToast(t("calendarExportedToast") || "修回截止日历 (.ics) 已导出！", "success");
            }
          });
          item.appendChild(icsBtn);
        }
        reviewMilestones.appendChild(item);
      });
    }
  }
  var alertsRenderScope, exportAllIcsScope;
  var init_timeline_alerts = __esm({
    "src/modules/dashboard-view/timeline-alerts.ts"() {
      "use strict";
      init_field_helpers();
      init_lifecycle();
      alertsRenderScope = null;
      exportAllIcsScope = null;
    }
  });

  // src/modules/dashboard-view/card-interactions.ts
  function createCardScope() {
    const rfui = typeof globalThis !== "undefined" ? globalThis.RFUI : null;
    if (rfui && typeof rfui.createLifecycleScope === "function") {
      return rfui.createLifecycleScope();
    }
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    const cleanups = [];
    let aborted = false;
    return {
      on(target, type, listener, options) {
        if (!target || typeof target.addEventListener !== "function" || aborted) return;
        const capture = typeof options === "boolean" ? options : Boolean(options?.capture);
        const opts = ac?.signal ? typeof options === "boolean" ? { capture, signal: ac.signal } : { ...options || {}, signal: ac.signal } : options;
        target.addEventListener(type, listener, opts);
        cleanups.push(() => {
          target.removeEventListener?.(type, listener, capture);
        });
      },
      abort(reason) {
        if (aborted) return;
        aborted = true;
        try {
          ac?.abort(reason);
        } catch (_) {
        }
        for (const fn of cleanups.splice(0)) {
          try {
            fn();
          } catch (_) {
          }
        }
      }
    };
  }
  function disposePipelineCardInteractions(card) {
    if (!card) return;
    const existing = pipelineCardScopes.get(card);
    if (existing) {
      pipelineCardScopes.delete(card);
      existing.abort("card-removed");
    }
  }
  function bindPipelineCardInteractions(card, sub) {
    disposePipelineCardInteractions(card);
    const cardScope = createCardScope();
    pipelineCardScopes.set(card, cardScope);
    card.querySelectorAll(".dot.interactive-dot").forEach((dot) => {
      cardScope.on(dot, "click", (e) => {
        e.stopPropagation();
        const nodeId = dot.getAttribute("data-node-id");
        const subId = dot.getAttribute("data-sub-id") || sub.id;
        if (subId && nodeId) openStageDrawer(subId, nodeId);
      });
    });
    const latestWindow = card.querySelector(".latest-window");
    if (latestWindow) {
      cardScope.on(latestWindow, "click", (e) => {
        e.stopPropagation();
        const latestId = latestWindow.getAttribute("data-latest-id");
        const subId = latestWindow.getAttribute("data-sub-id") || sub.id;
        if (latestId) {
          openStageDrawer(subId, latestId);
        } else {
          toggleInlineStageEditor(card, true);
        }
      });
    }
    card.querySelectorAll(".btn-pipeline-open").forEach((btn) => {
      cardScope.on(btn, "click", (e) => {
        e.stopPropagation();
        try {
          const g = typeof window !== "undefined" ? window : globalThis;
          const navFn = g.navigateToSubmissionDetails || (typeof navigateToSubmissionDetails === "function" ? navigateToSubmissionDetails : null);
          if (typeof navFn === "function") {
            navFn(sub.id);
          }
        } catch (err) {
          console.error("[PaperFlow] Failed to navigate to submission details:", err);
        }
      });
    });
    card.querySelectorAll(".btn-pipeline-add, .btn-quick-add-event").forEach((btn) => {
      cardScope.on(btn, "click", (e) => {
        e.stopPropagation();
        try {
          const g = typeof window !== "undefined" ? window : globalThis;
          if (typeof g.toggleInlineStageEditor === "function") {
            g.toggleInlineStageEditor(card, true);
          } else if (typeof toggleInlineStageEditor === "function") {
            toggleInlineStageEditor(card, true);
          }
        } catch (err) {
          console.error("[PaperFlow] Failed to toggle inline stage editor:", err);
        }
      });
    });
    card.querySelectorAll(".btn-pipeline-manage").forEach((btn) => {
      cardScope.on(btn, "click", (e) => {
        e.stopPropagation();
        try {
          const g = typeof window !== "undefined" ? window : globalThis;
          const manageFn = g.openTimelineEventManager || (typeof openTimelineEventManager === "function" ? openTimelineEventManager : null);
          if (typeof manageFn === "function") {
            manageFn(sub.id);
          }
        } catch (err) {
          console.error("[PaperFlow] Failed to open timeline event manager:", err);
        }
      });
    });
    card.querySelectorAll(".btn-pipeline-share, .btn-quick-share").forEach((btn) => {
      cardScope.on(btn, "click", (e) => {
        e.stopPropagation();
        try {
          const g = typeof window !== "undefined" ? window : globalThis;
          const shareFn = g.openSubmissionSharePreview || g.openSubmissionShareModal || (typeof openSubmissionSharePreview === "function" ? openSubmissionSharePreview : openSubmissionShareModal);
          if (typeof shareFn === "function") {
            shareFn(sub.id, e.currentTarget);
          }
        } catch (err) {
          console.error("[PaperFlow] Failed to open submission share modal:", err);
        }
      });
    });
    cardScope.on(card.querySelector(".zotero-card-badge"), "click", (e) => {
      e.stopPropagation();
      const badge = e.currentTarget;
      const key = badge.getAttribute("data-item-key");
      const rawLib = badge.getAttribute("data-library-id");
      const libId = rawLib ? Number(rawLib) || rawLib : null;
      if (key && typeof ZoteroBridge !== "undefined") {
        ZoteroBridge.selectItemInZotero(key, libId);
      }
    });
    cardScope.on(card.querySelector(".zotero-citekey-badge"), "click", (e) => {
      e.stopPropagation();
      const badge = e.currentTarget;
      const ck = badge.getAttribute("data-citekey");
      if (ck && typeof ZoteroBridge !== "undefined") {
        const curLang = typeof currentLanguage !== "undefined" ? currentLanguage : "en";
        ZoteroBridge.copyText(`[@${ck}]`, curLang === "zh" ? `已复制 Citation Key: [@${ck}]` : `Copied Citation Key: [@${ck}]`);
      }
    });
    cardScope.on(card.querySelector(".zotero-pdf-badge"), "click", (e) => {
      e.stopPropagation();
      const badge = e.currentTarget;
      const key = badge.getAttribute("data-item-key");
      const rawLib = badge.getAttribute("data-library-id");
      const libId = rawLib ? Number(rawLib) || rawLib : null;
      if (key && typeof ZoteroBridge !== "undefined") {
        ZoteroBridge.openPdf(key, null, libId);
      }
    });
    cardScope.on(card.querySelector(".btn-inline-stage-cancel"), "click", (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      if (btn?.disabled) return;
      toggleInlineStageEditor(card, false);
      card.querySelector(".btn-pipeline-add")?.focus?.();
    });
    const inlineEditor = card.querySelector(".inline-stage-editor");
    if (inlineEditor) {
      cardScope.on(inlineEditor.querySelector(".inline-stage-key"), "change", () => {
        syncInlineStagePreset(inlineEditor);
      });
      cardScope.on(inlineEditor.querySelector(".inline-stage-type"), "change", () => {
        syncInlineStagePreset(inlineEditor);
      });
      cardScope.on(inlineEditor.querySelector(".inline-stage-deadline"), "input", () => {
        updateInlineStageDeadlineStatus(inlineEditor);
      });
      cardScope.on(inlineEditor.querySelector(".btn-inline-stage-reset"), "click", (e) => {
        e.stopPropagation();
        resetInlineStageEditor(inlineEditor);
      });
      cardScope.on(inlineEditor.querySelector(".btn-inline-stage-save"), "click", async (e) => {
        e.stopPropagation();
        const saveBtn = inlineEditor.querySelector(".btn-inline-stage-save");
        if (saveBtn?.disabled) return;
        setInlineStageBusy(inlineEditor, true);
        let errorMessage = "";
        try {
          await saveInlineStageEvent(inlineEditor);
        } catch (error) {
          errorMessage = error?.message || t("autoSaveFailed");
          showGlobalToast(errorMessage, "error");
        } finally {
          if (inlineEditor.isConnected) setInlineStageBusy(inlineEditor, false, errorMessage);
        }
      });
      cardScope.on(inlineEditor, "keydown", (event) => {
        if (event.key !== "Escape" || inlineEditor.querySelector(".btn-inline-stage-save")?.hasAttribute("disabled")) return;
        event.preventDefault();
        event.stopPropagation();
        toggleInlineStageEditor(card, false);
        card.querySelector(".btn-pipeline-add")?.focus?.();
      });
      inlineEditor.querySelectorAll(".inline-stage-fields input").forEach((input) => {
        cardScope.on(input, "keydown", (event) => {
          if (event.key !== "Enter" || event.isComposing) return;
          event.preventDefault();
          inlineEditor.querySelector(".btn-inline-stage-save")?.click?.();
        });
      });
    }
  }
  function setupSaveErrorListener() {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    saveErrorScope?.abort("rebind");
    const scope = createCardScope();
    saveErrorScope = scope;
    scope.on(window, "researchflow-save-state", (event) => {
      const { state, error } = event.detail || {};
      const curLang = typeof window.currentLanguage !== "undefined" ? window.currentLanguage : "en";
      if (state === "error") showGlobalToast(error || (curLang === "zh" ? "保存失败，请重试" : "Save failed, please retry"), "error");
      if (state === "pending") showGlobalToast(t("saveNewEditsPending"), "info");
    });
    scope.on(window, "unload", () => scope.abort("unload"), { once: true });
  }
  function setupDashboardFilterListeners() {
    const cardAccepted = document.getElementById("card-filter-accepted");
    const cardActive = document.getElementById("card-filter-active");
    const cardAll = document.getElementById("card-filter-all");
    if (!cardAccepted || !cardActive || !cardAll) return;
    dashboardFilterScope?.abort("rebind");
    const scope = createCardScope();
    dashboardFilterScope = scope;
    if (typeof window !== "undefined") {
      scope.on(window, "unload", () => scope.abort("unload"), { once: true });
    }
    const clearActiveClasses = () => {
      [cardAccepted, cardActive, cardAll].forEach((c) => {
        c.classList.remove("active");
        c.setAttribute("aria-pressed", "false");
      });
    };
    scope.on(cardAccepted, "click", () => {
      window.currentDashboardFilter = "accepted";
      clearActiveClasses();
      cardAccepted.classList.add("active");
      cardAccepted.setAttribute("aria-pressed", "true");
      renderDashboard();
    });
    scope.on(cardActive, "click", () => {
      window.currentDashboardFilter = "active";
      clearActiveClasses();
      cardActive.classList.add("active");
      cardActive.setAttribute("aria-pressed", "true");
      renderDashboard();
    });
    scope.on(cardAll, "click", () => {
      window.currentDashboardFilter = "all";
      clearActiveClasses();
      cardAll.classList.add("active");
      cardAll.setAttribute("aria-pressed", "true");
      renderDashboard();
    });
  }
  var pipelineCardScopes, saveErrorScope, dashboardFilterScope;
  var init_card_interactions = __esm({
    "src/modules/dashboard-view/card-interactions.ts"() {
      "use strict";
      pipelineCardScopes = /* @__PURE__ */ new WeakMap();
      saveErrorScope = null;
      dashboardFilterScope = null;
      if (typeof globalThis !== "undefined") {
        globalThis.disposePipelineCardInteractions = disposePipelineCardInteractions;
      }
    }
  });

  // src/modules/dashboard-view/card-actions.ts
  function mountPipelineActions(card, submissionId, title) {
    const actions = card.querySelector(".pipeline-actions");
    if (!actions) return;
    const doc = card.ownerDocument;
    const buttons = [
      ["open", "openSubmissionDetails"],
      ["add", "addEvent"],
      ["manage", "manageEvents"],
      ["share", "shareJourney"]
    ].map(([action, labelKey]) => {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = `btn-secondary btn-sm btn-pipeline-${action}`;
      button.dataset.subId = submissionId;
      button.setAttribute("aria-label", `${t(labelKey)}: ${title}`);
      if (action === "share") {
        button.title = t(labelKey);
        if (typeof doc.createElementNS === "function") {
          const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 24 24");
          svg.setAttribute("aria-hidden", "true");
          svg.setAttribute("width", "13");
          svg.setAttribute("height", "13");
          const c1 = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
          c1.setAttribute("cx", "18");
          c1.setAttribute("cy", "5");
          c1.setAttribute("r", "3");
          const c2 = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
          c2.setAttribute("cx", "6");
          c2.setAttribute("cy", "12");
          c2.setAttribute("r", "3");
          const c3 = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
          c3.setAttribute("cx", "18");
          c3.setAttribute("cy", "19");
          c3.setAttribute("r", "3");
          const p = doc.createElementNS("http://www.w3.org/2000/svg", "path");
          p.setAttribute("d", "m8.6 10.5 6.8-4M8.6 13.5l6.8 4");
          svg.append(c1, c2, c3, p);
          const span = doc.createElement("span");
          span.textContent = t(labelKey);
          if (typeof button.replaceChildren === "function") {
            button.replaceChildren(svg, span);
          } else {
            button.append(svg, span);
          }
        } else {
          button.textContent = t(labelKey);
        }
      } else {
        button.textContent = t(labelKey);
      }
      return button;
    });
    actions.replaceChildren(...buttons);
  }
  var init_card_actions = __esm({
    "src/modules/dashboard-view/card-actions.ts"() {
      "use strict";
    }
  });

  // src/modules/dashboard-view/event-card-builder.ts
  function buildPipelineEventCard(sub, man, index, displayIndex, analysis) {
    const w = window;
    const manTitle = man ? man.title : sub.title || t("untitledManuscript");
    const journalName = getSubmissionJournalName(sub);
    const firstAuthor = getSubmissionFirstAuthor(sub, man);
    const a = analysis || analyzeSubmission(sub);
    let stageClass = "stage-active";
    if (a.accepted || sub.status === "accepted" || sub.status === "published") {
      stageClass = "stage-accepted";
    } else if ((sub.status || "").includes("revision")) {
      stageClass = "stage-revision";
    } else {
      const sortedNodes = autoSortNodes(sub.timelineNodes || []);
      const hasOverdue = sortedNodes.some((n) => {
        const s = computeNodeStatus(n);
        return s === "overdue" || s === "blocked";
      });
      if (hasOverdue) stageClass = "stage-exception";
    }
    const card = document.createElement("div");
    card.className = `pipeline-card ${stageClass}`;
    card.style?.setProperty?.("--card-index", String(index));
    card.style?.setProperty?.("--state-color", a.stateColor);
    const latestMeta = a.latest ? getTimelineTypeMeta(a.latest.type) : { color: "#64748b", label: t("typeNoEvent") };
    const latestDate = a.latest ? getNodeDate(a.latest) : "";
    const latestRelative = latestDate ? getRelativeDateLabel(latestDate) : "";
    const reviewNode = [...sub.timelineNodes || []].filter((node) => isReviewTimelineNode(node) && node.dueDate).sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0];
    const reviewDeadlineHtml = reviewNode ? `<div class="latest-deadline ${computeNodeStatus(reviewNode) === "overdue" ? "is-overdue" : ""}">${escapeHTML(t("eventDeadline"))}：${escapeHTML(formatShortDate(reviewNode.dueDate))}${reviewNode.reviewDecision ? ` · ${escapeHTML(getReviewDecisionLabel(reviewNode.reviewDecision))}` : ""}</div>` : "";
    const submissionDoi = getSubmissionDoi(sub);
    const articleUrl = getSubmissionArticleUrl(sub);
    const doiHtml = submissionDoi ? `<a class="doi-link" href="${escapeHTML(articleUrl || `https://doi.org/${submissionDoi}`)}" target="_blank" rel="noopener noreferrer">${t("doiLabel")}: ${escapeHTML(submissionDoi)}</a>` : articleUrl ? `<a class="doi-link" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${t("articlePage")}</a>` : `<span class="doi-missing">${t("doiNotSet")}</span>`;
    const milestones = a.display.milestones.filter((m) => m.name && m.date !== void 0);
    const count = Math.max(2, milestones.length);
    const timelineIsActive = a.display.pending && ["submitted", "under_review", "revision"].includes(normalizeSubmissionStatus(sub.status));
    let railHtml = `
    <div class="event-rail ${timelineIsActive ? "is-tracking" : ""}" style="--count:${count}">
      <div class="rail-track ${a.display.pending ? "pending" : ""}"></div>
  `;
    milestones.forEach((m) => {
      const isInteractive = Boolean(m.node);
      railHtml += `
      <div class="milestone">
        <div class="dot-wrap">
          <div class="dot ${m.emphasis ? "emphasis" : ""} ${m.today ? "today" : ""} ${isInteractive ? "interactive-dot" : ""}"
               style="--dot-color:${m.color || a.display.color}; ${isInteractive ? "cursor: pointer;" : ""}"
               ${isInteractive ? `data-node-id="${escapeHTML(m.node.id)}" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t("clickEditEvent"))}: ${escapeHTML(m.name)}"` : ""}></div>
        </div>
        <div class="milestone-name">${escapeHTML(m.name)}</div>
        <div class="milestone-date">${m.date ? formatShortDate(m.date) : "—"}</div>
      </div>
    `;
    });
    railHtml += `
    </div>
    <div class="rail-caption">
      <span>${t("keyEventRail")}</span>
      <span class="caption-highlight">${a.display.pending ? t("countingNow") : t("completedInterval")}</span>
    </div>
  `;
    w.RFUI.setHTML(card, `
    <!-- Col 1: Manuscript Info -->
    <div class="project-info">
      <div class="project-heading-row">
        <span class="submission-index" title="${escapeHTML(t("submissionRound") || "序号")}">${displayIndex}</span>
        <div class="journal" title="${escapeHTML(journalName)}">${escapeHTML(journalName)}</div>
        ${sub.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:10px; padding:1px 6px; border-radius:3px;" title="Manuscript ID: ${escapeHTML(sub.externalManuscriptId)}">ID: ${escapeHTML(sub.externalManuscriptId)}</span>` : ""}
        <span class="pipeline-compact-status" style="--state-color:${a.stateColor}">${escapeHTML(a.stateLabel)}</span>
      </div>
      <h3 class="project-title" title="${escapeHTML(manTitle)}">${escapeHTML(manTitle)}</h3>
      <div class="project-meta">
        <span>${tf("nodesSaved", { count: (sub.timelineNodes || []).length })}</span>
        <span>${t("timelineSortedBySubmissionDate")}: ${a.submitDate ? escapeHTML(formatShortDate(a.submitDate)) : t("noDate")}</span>
        <span>${t("expSubmitShort")} ${a.expToSubmit === null ? "—" : a.expToSubmit + t("dayUnitShort")}</span>
        <span>${t("timelineDateSource")}: ${escapeHTML(a.submitDateSource)}</span>
        <span class="pipeline-first-author ${firstAuthor ? "" : "is-empty"}" title="${escapeHTML(t("firstAuthorLabel"))}: ${escapeHTML(firstAuthor || t("firstAuthorNotSet"))}">
          <span class="pipeline-first-author-label">${escapeHTML(t("firstAuthorLabel"))}:</span>
          <strong>${escapeHTML(firstAuthor || t("firstAuthorNotSet"))}</strong>
        </span>
      </div>
      <div class="pipeline-link-row">
        ${doiHtml}
        ${man?.zoteroItemKey ? `
          <span class="zotero-card-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" data-library-id="${escapeHTML(man.zoteroLibraryID || "")}" title="${escapeHTML((w.currentLanguage || "zh") === "zh" ? "在 Zotero 文献库中选中此条目" : "Select in Zotero library")}" style="margin-left: 6px;">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
            Zotero
          </span>
          ${man.citekey ? `<span class="zotero-citekey-badge" data-citekey="${escapeHTML(man.citekey)}" title="${escapeHTML((w.currentLanguage || "zh") === "zh" ? "点击复制 Citation Key" : "Click to copy Citation Key")}">[@${escapeHTML(man.citekey)}]</span>` : ""}
          ${man.pdfUri ? `<span class="zotero-pdf-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" data-library-id="${escapeHTML(man.zoteroLibraryID || "")}" title="${escapeHTML((w.currentLanguage || "zh") === "zh" ? "在 Zotero 阅读器中打开 PDF" : "Open PDF in Zotero reader")}">📖 PDF</span>` : ""}
        ` : ""}
      </div>
      <div class="pipeline-actions"></div>
    </div>

    <!-- Col 2: Middle Core Panel -->
    <div class="core-panel" style="--panel-color:${a.display.color}; --panel-bg:${a.display.bg}; --panel-border:${a.display.border}">
      <div class="core-head">
        <div>
          <div class="core-label">${escapeHTML(a.display.label)}</div>
          <div class="core-sub">${escapeHTML(a.display.caption)}</div>
        </div>
        <div class="core-value"><strong>${a.display.value === null ? "—" : a.display.value}</strong><span>${t("days")}</span></div>
      </div>
      ${railHtml}
    </div>

    <!-- Col 3: Latest Node Window -->
    <div class="latest-window" data-sub-id="${escapeHTML(sub.id)}" data-latest-id="${a.latest ? escapeHTML(a.latest.id) : ""}">
      <div class="latest-head">
        <span>${t("latestEvent")}</span>
        <span class="node-type" style="--node-color:${latestMeta.color}">${escapeHTML(latestMeta.label)}</span>
      </div>
      <div class="latest-title">${a.latest ? escapeHTML(getTimelineNodeDisplayName(a.latest)) : t("noEventYet")}</div>
      <div class="latest-date">${a.latest ? `${latestDate ? escapeHTML(formatShortDate(latestDate)) : t("noDate")}${latestRelative ? ` · ${escapeHTML(latestRelative)}` : ""}` : t("addEventStart")}</div>
      ${reviewDeadlineHtml}
      <div class="latest-note">${a.latest ? escapeHTML(a.latest.notes || t("clickEditEvent")) : t("clickAddEvent")}</div>
    </div>

    <!-- Col 4: State Box -->
    <div class="state-box">
      <span class="state-pill" style="--state-color:${a.stateColor}">${escapeHTML(a.stateLabel)}</span>
      <div class="state-note">${escapeHTML(a.stateNote)}</div>
    </div>
    ${buildInlineStageEditor(sub.id)}
  `);
    mountPipelineActions(card, sub.id, manTitle);
    bindPipelineCardInteractions(card, sub);
    return card;
  }
  var init_event_card_builder = __esm({
    "src/modules/dashboard-view/event-card-builder.ts"() {
      "use strict";
      init_field_helpers();
      init_card_interactions();
      init_card_actions();
    }
  });

  // src/modules/dashboard-view/card-cache.ts
  function reconcilePipelineCards(container, records) {
    const previous = caches.get(container);
    const next = /* @__PURE__ */ new Map();
    const keptCards = /* @__PURE__ */ new Set();
    const cards = records.map((record) => {
      const cached = previous?.get(record.key);
      const entry = cached?.signature === record.signature ? cached : { signature: record.signature, card: record.create() };
      next.set(record.key, entry);
      keptCards.add(entry.card);
      return entry.card;
    });
    if (previous) {
      const disposeCard = typeof globalThis !== "undefined" ? globalThis.disposePipelineCardInteractions : null;
      if (typeof disposeCard === "function") {
        for (const oldEntry of previous.values()) {
          if (!keptCards.has(oldEntry.card)) {
            disposeCard(oldEntry.card);
          }
        }
      }
    }
    const existing = Array.from(container.children);
    if (existing.length !== cards.length || existing.some((card, index) => card !== cards[index])) {
      container.replaceChildren(...cards);
    }
    caches.set(container, next);
  }
  var caches;
  var init_card_cache = __esm({
    "src/modules/dashboard-view/card-cache.ts"() {
      "use strict";
      caches = /* @__PURE__ */ new WeakMap();
    }
  });

  // src/modules/dashboard-view/pipeline-renderer.ts
  function bindDashboardControls() {
    const toggleBtn = document.getElementById("btn-pipeline-view-toggle");
    if (toggleBtn && !toggleBtn.dataset.bound) {
      toggleBtn.dataset.bound = "true";
      toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const g = typeof window !== "undefined" ? window : globalThis;
        setPipelineViewMode(!Boolean(g.isPipelineExpanded));
      });
    }
    const filterMap = {
      "card-filter-accepted": "accepted",
      "card-filter-active": "active",
      "card-filter-all": "all"
    };
    Object.entries(filterMap).forEach(([id, filter]) => {
      const btn = document.getElementById(id);
      if (btn && !btn.dataset.filterBound) {
        btn.dataset.filterBound = "true";
        btn.dataset.filter = filter;
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const g = typeof window !== "undefined" ? window : globalThis;
          g.currentDashboardFilter = filter;
          renderDashboard2();
        });
      }
    });
  }
  function renderDashboard2() {
    const w = window;
    if (w.RFUI?.isViewDeferred?.("view-dashboard")) return;
    const currentDashboardFilter = w.currentDashboardFilter || "all";
    const database = w.db || (typeof db !== "undefined" ? db : null) || {};
    const manuscriptsById = new Map((database.manuscripts || []).map((m) => [m.id, m]));
    const visibleManuscripts = database.manuscripts || [];
    const allSubmissions = (database.submissions || []).filter((s) => !s.deleted && !s.isDeleted);
    const visibleSubmissions = allSubmissions.filter((s) => s.status !== "rejected");
    const checkAccepted = (s) => {
      if (!s) return false;
      if (typeof isAcceptedSubmission === "function") {
        try {
          return isAcceptedSubmission(s);
        } catch (_) {
        }
      }
      const g = typeof window !== "undefined" ? window : globalThis;
      if (typeof g.isAcceptedSubmission === "function") {
        try {
          return g.isAcceptedSubmission(s);
        } catch (_) {
        }
      }
      if (typeof g.analyzeSubmission === "function") {
        try {
          return Boolean(g.analyzeSubmission(s)?.accepted);
        } catch (_) {
        }
      }
      const st = String(s.status || "").toLowerCase();
      return st === "accepted" || st === "published";
    };
    const acceptedCount = visibleSubmissions.filter(checkAccepted).length;
    const activeCount = visibleSubmissions.filter((s) => !checkAccepted(s)).length;
    const totalCount = allSubmissions.length;
    const setStat = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (typeof w.RFUI?.animateMetricValue === "function") {
        w.RFUI.animateMetricValue(el, val);
      } else {
        el.textContent = String(val);
      }
    };
    setStat("stat-accepted-submissions", acceptedCount);
    setStat("stat-active-submissions", activeCount);
    setStat("stat-total-submissions", totalCount);
    const filterCards = [
      { id: "card-filter-accepted", filter: "accepted" },
      { id: "card-filter-active", filter: "active" },
      { id: "card-filter-all", filter: "all" }
    ];
    filterCards.forEach(({ id, filter }) => {
      const el = document.getElementById(id);
      if (el) {
        const isActive = currentDashboardFilter === filter;
        el.classList.toggle("active", isActive);
        el.setAttribute("aria-pressed", String(isActive));
      }
    });
    const filterLabelEl = document.getElementById("dashboard-filter-label");
    if (filterLabelEl) filterLabelEl.textContent = getDashboardFilterLabel();
    const processedSubIds = /* @__PURE__ */ new Set();
    const manuscriptPipelines = [];
    visibleManuscripts.forEach((m) => {
      const canonicalSub = w.RFCore?.getCurrentSubmission?.(database, m.id);
      if (canonicalSub && !canonicalSub.deleted && !canonicalSub.isDeleted) {
        manuscriptPipelines.push({ manuscript: m, submission: canonicalSub });
        processedSubIds.add(canonicalSub.id);
      }
    });
    visibleSubmissions.forEach((sub) => {
      if (!processedSubIds.has(sub.id)) {
        const man = manuscriptsById.get(sub.manuscriptId);
        if (man) {
          manuscriptPipelines.push({ manuscript: man, submission: sub });
          processedSubIds.add(sub.id);
        } else {
          manuscriptPipelines.push({ manuscript: null, submission: sub });
          processedSubIds.add(sub.id);
        }
      }
    });
    const analysisById = /* @__PURE__ */ new Map();
    const analyzeCached = (sub) => {
      if (!analysisById.has(sub.id)) analysisById.set(sub.id, analyzeSubmission(sub));
      return analysisById.get(sub.id);
    };
    const analyses = manuscriptPipelines.map((p) => analyzeCached(p.submission));
    const expSubmit = analyses.map((a) => a.expToSubmit).filter((v) => v !== null && !isNaN(v) && v >= 0);
    const submitNow = analyses.filter((a) => !a.accepted).map((a) => a.submitToNow).filter((v) => v !== null && !isNaN(v) && v >= 0);
    const r1Now = analyses.filter((a) => !a.accepted).map((a) => a.r1ToNow).filter((v) => v !== null && !isNaN(v) && v >= 0);
    const submitAccept = analyses.filter((a) => a.accepted).map((a) => a.submitToAccept).filter((v) => v !== null && !isNaN(v) && v >= 0);
    const avgText = (arr) => arr.length ? `${Math.round(arr.reduce((s, n) => s + n, 0) / arr.length)}${t("dayUnitShort")}` : "—";
    const elExpSubmit = document.getElementById("mExpSubmit");
    if (elExpSubmit) {
      elExpSubmit.textContent = avgText(expSubmit);
      elExpSubmit.parentElement?.setAttribute("title", currentLanguage === "zh" ? `各个稿件平均值：基于 ${expSubmit.length} 篇有实验记录的稿件` : `Average across manuscripts: based on ${expSubmit.length} manuscripts with experiment records`);
    }
    const elSubmitNow = document.getElementById("mSubmitNow");
    if (elSubmitNow) {
      elSubmitNow.textContent = avgText(submitNow);
      elSubmitNow.parentElement?.setAttribute("title", currentLanguage === "zh" ? `各个稿件平均值：基于 ${submitNow.length} 篇在审稿件` : `Average across manuscripts: based on ${submitNow.length} manuscripts in review`);
    }
    const elR1Now = document.getElementById("mR1Now");
    if (elR1Now) {
      elR1Now.textContent = avgText(r1Now);
      elR1Now.parentElement?.setAttribute("title", currentLanguage === "zh" ? `各个稿件平均值：基于 ${r1Now.length} 篇一审修回中的稿件` : `Average across manuscripts: based on ${r1Now.length} manuscripts awaiting post-R1 decisions`);
    }
    const elSubmitAccept = document.getElementById("mSubmitAccept");
    if (elSubmitAccept) {
      elSubmitAccept.textContent = avgText(submitAccept);
      elSubmitAccept.parentElement?.setAttribute("title", currentLanguage === "zh" ? `各个稿件平均值：基于 ${submitAccept.length} 篇已接收/发表的稿件` : `Average across manuscripts: based on ${submitAccept.length} accepted manuscripts`);
    }
    const ganttBox = document.getElementById("dashboard-gantt");
    if (!ganttBox) return;
    updatePipelineViewToggle();
    bindDashboardControls();
    let submissionsList = visibleSubmissions;
    if (currentDashboardFilter === "accepted") {
      submissionsList = submissionsList.filter(checkAccepted);
    } else if (currentDashboardFilter === "active") {
      submissionsList = submissionsList.filter((s) => !checkAccepted(s));
    }
    submissionsList = sortDashboardSubmissions(submissionsList);
    if (submissionsList.length === 0) {
      reconcilePipelineCards(ganttBox, []);
      w.RFUI.setHTML(ganttBox, `<p class="empty-state">${t("noPipelines")}</p>`);
    } else {
      const day = (/* @__PURE__ */ new Date()).toDateString();
      reconcilePipelineCards(ganttBox, submissionsList.map((sub, index) => {
        const displayIndex = submissionsList.length - index;
        const man = manuscriptsById.get(sub.manuscriptId);
        return {
          key: sub.id,
          signature: JSON.stringify([sub, man, currentLanguage, day, index, displayIndex]),
          create: () => buildPipelineEventCard(sub, man, index, displayIndex, analyzeCached(sub))
        };
      }));
    }
    renderTimelineAlerts();
  }
  var init_pipeline_renderer = __esm({
    "src/modules/dashboard-view/pipeline-renderer.ts"() {
      "use strict";
      init_field_helpers();
      init_transfer_and_status();
      init_timeline_alerts();
      init_event_card_builder();
      init_card_cache();
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
      initializePipelineViewMode();
      setupSaveErrorListener();
      setupDashboardFilterListeners();
      var dashboardExports = {
        isPipelineExpanded,
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
