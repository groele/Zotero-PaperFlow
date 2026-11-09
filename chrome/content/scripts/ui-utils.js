"use strict";
(() => {
  // src/modules/ui-utils/data-helpers.ts
  var DOI_TEXT_PATTERN = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;
  var URL_TEXT_PATTERN = /^https?:\/\/\S+$/i;
  function escapeHTML(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function cleanText(value, maxLength = 500) {
    return String(value ?? "").trim().slice(0, maxLength);
  }
  function normalizeIdentifier(value) {
    return cleanText(value, 300).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  }
  function isValidDoiOrBlank(value) {
    const normalized = normalizeIdentifier(value);
    return !normalized || DOI_TEXT_PATTERN.test(normalized);
  }
  function isValidHttpUrlOrBlank(value) {
    const text = cleanText(value, 1e3);
    if (!text) return true;
    if (!URL_TEXT_PATTERN.test(text)) return false;
    try {
      const parsed = new URL(text);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (_) {
      return false;
    }
  }
  function isSafeWebUrl(value) {
    const text = cleanText(value, 1e3);
    return Boolean(text) && isValidHttpUrlOrBlank(text);
  }
  function normalizeReviewMatrixRow(row = {}, index = 0) {
    const statusRaw = cleanText(row.status, 30).toLowerCase();
    const validStatuses = ["pending", "in_progress", "addressed", "clarified"];
    const comment = cleanText(row.comment, 8e3);
    const response = cleanText(row.response, 12e3);
    const changes = cleanText(row.changes, 4e3);
    let status = validStatuses.includes(statusRaw) ? statusRaw : "";
    if (!status) {
      status = response ? "addressed" : "pending";
    }
    return {
      id: cleanText(row.id, 80) || `rev_${index + 1}`,
      reviewer: cleanText(row.reviewer, 60) || "Reviewer #1",
      status,
      comment,
      response,
      changes
    };
  }
  function normalizeReviewMatrix(rows = []) {
    if (!Array.isArray(rows)) return [];
    return rows.map((row, index) => normalizeReviewMatrixRow(row, index)).filter((row) => row.comment || row.response || row.changes);
  }
  function getTimelineEventDate(node = {}, key = "") {
    if (!node || typeof node !== "object") return "";
    if (key === "submit") return cleanText(node.completeDate || node.planDate || node.dueDate, 40);
    if (key === "r1_comments" || key === "accept" || key === "online") {
      return cleanText(node.completeDate, 40);
    }
    return cleanText(node.completeDate || node.planDate || node.dueDate, 40);
  }
  function getSubmissionStatusBadgeClass(status) {
    const normalized = cleanText(status || "submitted", 40).toLowerCase().replace(/[\s-]+/g, "_");
    const statusTone = {
      submitted: "badge-info",
      under_review: "badge-purple",
      revision: "badge-warning",
      accepted: "badge-success",
      published: "badge-success",
      rejected: "badge-danger"
    };
    return `badge ${statusTone[normalized] || "badge-info"}`;
  }
  function shouldCelebrateAcceptance(previousStatus, nextStatus) {
    const prev = cleanText(previousStatus, 40).toLowerCase().replace(/[\s-]+/g, "_");
    const next = cleanText(nextStatus, 40).toLowerCase().replace(/[\s-]+/g, "_");
    const wasAccepted = prev === "accepted" || prev === "published";
    const isAccepted = next === "accepted" || next === "published";
    return !wasAccepted && isAccepted;
  }
  function buildSubmissionCreateMode(input = {}) {
    const selectedId = cleanText(input.selectedManuscriptId, 120);
    const newTitle = cleanText(input.newManuscriptTitle, 300);
    const targetJournal = cleanText(input.targetJournal, 200);
    if (!targetJournal) {
      return { ok: false, error: "Manuscript and Journal are required" };
    }
    if (selectedId === "__new__" || !selectedId) {
      if (!newTitle) {
        return { ok: false, error: "Enter a manuscript title before continuing." };
      }
      return {
        ok: true,
        mode: "new",
        manuscriptId: null,
        title: newTitle,
        targetJournal
      };
    }
    return {
      ok: true,
      mode: "existing",
      manuscriptId: selectedId,
      title: null,
      targetJournal
    };
  }
  function buildSubmissionRelationshipSummary(input = {}) {
    const submission = input.submission || {};
    const manuscript = input.manuscript || null;
    const project = input.project || null;
    const records = Array.isArray(input.records) ? input.records : [];
    const projectId = manuscript?.projectId || submission.projectId || project?.id || null;
    const relatedRecordCount = projectId ? records.filter((record) => record?.projectId === projectId).length : 0;
    const reviewRows = normalizeReviewMatrix(submission.reviewMatrix);
    const timelineNodes = Array.isArray(submission.timelineNodes) ? submission.timelineNodes : [];
    const completedNodes = timelineNodes.filter((node) => Boolean(node?.completeDate || node?.status === "completed")).length;
    return {
      hasManuscript: Boolean(manuscript),
      hasProject: Boolean(project),
      manuscriptId: manuscript?.id || submission.manuscriptId || null,
      manuscriptTitle: cleanText(manuscript?.title || submission.title, 300) || "Untitled Manuscript",
      manuscriptStatus: cleanText(manuscript?.status, 60) || null,
      projectId,
      projectTitle: cleanText(project?.title, 200) || null,
      relatedRecordCount,
      reviewerCommentCount: reviewRows.length,
      timelineNodeCount: timelineNodes.length,
      completedTimelineNodeCount: completedNodes,
      isOrphanSubmission: !manuscript
    };
  }
  function getPipelineTitleDisplay(input = {}) {
    const title = cleanText(input.title, 300) || "Untitled Manuscript";
    return {
      fullTitle: title,
      displayTitle: title,
      showTooltip: true
    };
  }
  function buildSubmissionEditSyncPlan(input = {}) {
    const title = cleanText(input.title, 300);
    const journal = cleanText(input.journal, 200);
    const journalUrl = cleanText(input.journalUrl, 1e3);
    const externalManuscriptId = cleanText(input.externalManuscriptId, 120);
    const status = cleanText(input.status || "submitted", 40).toLowerCase().replace(/[\s-]+/g, "_");
    const submissionDate = cleanText(input.submissionDate, 40);
    const firstDecisionDate = cleanText(input.firstDecisionDate, 40);
    const revisionDueDate = cleanText(input.revisionDueDate, 40);
    const decisionDate = cleanText(input.decisionDate, 40);
    const doi = normalizeIdentifier(input.doi);
    const articleUrl = cleanText(input.articleUrl, 1e3);
    const canKeepPublicationLinks = status === "accepted" || status === "published" || Boolean(decisionDate);
    if (!title || !journal) {
      return { ok: false, error: "Manuscript title and journal are required." };
    }
    if (!isValidHttpUrlOrBlank(journalUrl)) {
      return { ok: false, error: "Please enter a valid portal URL, or leave it blank." };
    }
    if (canKeepPublicationLinks && !isValidDoiOrBlank(doi)) {
      return { ok: false, error: "Please enter a valid DOI, such as 10.1002/adfm.202528029, or leave it blank." };
    }
    if (canKeepPublicationLinks && !isValidHttpUrlOrBlank(articleUrl)) {
      return { ok: false, error: "Please enter a valid article URL starting with https:// or leave it blank." };
    }
    return {
      ok: true,
      manuscriptPatch: {
        title,
        targetJournals: [journal]
      },
      detachedSubmissionTitle: title,
      submissionPatch: {
        targetJournal: journal,
        journalUrl: journalUrl || null,
        externalManuscriptId: externalManuscriptId || null,
        status,
        submissionDate: submissionDate ? new Date(submissionDate).toISOString() : null,
        firstDecisionDate: firstDecisionDate ? new Date(firstDecisionDate).toISOString() : null,
        revisionDueDate: revisionDueDate ? new Date(revisionDueDate).toISOString() : null,
        decisionDate: decisionDate ? new Date(decisionDate).toISOString() : null
      },
      publicationPatch: canKeepPublicationLinks ? {
        doi: doi || null,
        articleUrl: articleUrl || (doi ? `https://doi.org/${doi}` : null)
      } : null,
      shouldMarkRejected: status === "rejected",
      rejectionDate: decisionDate || null,
      shouldClearPublication: !canKeepPublicationLinks
    };
  }

  // src/modules/ui-utils/dom-helpers.ts
  function normalizeSearchText(value) {
    return String(value ?? "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  }
  function matchesSubmissionSearch(text, status, terms = [], statusFilter = "all") {
    const normalizedStatus = cleanText(status || "submitted", 40).toLowerCase().replace(/[\s-]+/g, "_");
    const filter = cleanText(statusFilter || "all", 40).toLowerCase();
    const statusMatches = filter === "all" || filter === "active" && ["submitted", "under_review", "revision"].includes(normalizedStatus) || filter === "accepted" && ["accepted", "published"].includes(normalizedStatus) || normalizedStatus === filter;
    if (!statusMatches) return false;
    const activeTerms = Array.isArray(terms) ? terms.filter(Boolean) : [];
    if (!activeTerms.length) return true;
    const haystack = normalizeSearchText(text);
    return activeTerms.every((term) => haystack.includes(term));
  }
  function getSafeDomDocument(target) {
    if (target?.ownerDocument) return target.ownerDocument;
    if (typeof document !== "undefined") return document;
    return null;
  }
  function sanitizeDomTree(root) {
    const blockedTags = /* @__PURE__ */ new Set(["script", "iframe", "object", "embed", "meta", "base"]);
    const urlAttrs = /* @__PURE__ */ new Set(["href", "src", "xlink:href", "formaction"]);
    const walk = (node) => {
      for (const child of Array.from(node.childNodes || [])) {
        if (child.nodeType !== 1) continue;
        const tag = String(child.tagName || "").toLowerCase();
        if (blockedTags.has(tag)) {
          child.remove();
          continue;
        }
        for (const attr of Array.from(child.attributes || [])) {
          const name = String(attr.name || "").toLowerCase();
          const value = String(attr.value || "").trim();
          if (name.startsWith("on") || name === "srcdoc") {
            child.removeAttribute(attr.name);
          } else if (urlAttrs.has(name) && /^(javascript|vbscript|data:text\/html):/i.test(value)) {
            child.removeAttribute(attr.name);
          }
        }
        walk(child);
      }
    };
    walk(root);
  }
  function createFragment(doc, html) {
    const ownerDocument = doc?.createRange ? doc : getSafeDomDocument(doc);
    if (!ownerDocument?.createRange) {
      throw new Error("Document range parser unavailable");
    }
    const range = ownerDocument.createRange();
    range.selectNode(ownerDocument.body || ownerDocument.documentElement);
    const fragment = range.createContextualFragment(String(html ?? ""));
    sanitizeDomTree(fragment);
    return fragment;
  }
  function setHTML(element, html) {
    if (!element) return;
    const text = String(html ?? "");
    const ownerDocument = getSafeDomDocument(element);
    if (typeof element.replaceChildren === "function" && ownerDocument?.createRange) {
      if (!text) {
        element.replaceChildren();
        return;
      }
      element.replaceChildren(createFragment(ownerDocument, text));
      return;
    }
    if ("innerHTML" in element) {
      element.innerHTML = text;
    }
  }
  function getDirtyViewsSet() {
    const g = typeof window !== "undefined" ? window : globalThis;
    if (!(g._dirtyViews instanceof Set)) {
      g._dirtyViews = /* @__PURE__ */ new Set();
    }
    return g._dirtyViews;
  }
  function isViewDeferred(viewId) {
    if (typeof document === "undefined" || typeof document.getElementById !== "function") return false;
    const viewEl = document.getElementById(viewId);
    if (!viewEl || !viewEl.classList || typeof viewEl.classList.contains !== "function") return false;
    if (!viewEl.classList.contains("content-view")) return false;
    if (viewEl.classList.contains("active")) {
      getDirtyViewsSet().delete(viewId);
      return false;
    }
    getDirtyViewsSet().add(viewId);
    return true;
  }
  function prefersReducedMotion() {
    try {
      return Boolean(typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    } catch (_) {
      return false;
    }
  }
  function animateMetricValue(el, nextValue) {
    if (!el) return;
    const nextText = String(nextValue ?? "");
    const prevText = String(el.textContent ?? "");
    el.textContent = nextText;
    if (prevText && prevText !== nextText && !prefersReducedMotion() && el.classList?.add) {
      el.classList.remove("stat-value-updated");
      void el.offsetWidth;
      el.classList.add("stat-value-updated");
    }
  }
  function captureElementRects(container, selector, keyAttr) {
    const rects = /* @__PURE__ */ new Map();
    if (!container || prefersReducedMotion() || typeof container.querySelectorAll !== "function") return rects;
    try {
      container.querySelectorAll(selector).forEach((el) => {
        const key = el.getAttribute?.(keyAttr) || el.dataset?.[keyAttr] || el.id;
        if (key && typeof el.getBoundingClientRect === "function") {
          const r = el.getBoundingClientRect();
          if (r && (r.width > 0 || r.height > 0)) {
            rects.set(String(key), r);
          }
        }
      });
    } catch (_) {
    }
    return rects;
  }
  function playFlipAnimation(container, selector, keyAttr, prevRects, highlightClass = "") {
    if (!container || !prevRects || prevRects.size === 0 || prefersReducedMotion()) return;
    if (typeof container.querySelectorAll !== "function") return;
    try {
      container.querySelectorAll(selector).forEach((el) => {
        const key = el.getAttribute?.(keyAttr) || el.dataset?.[keyAttr] || el.id;
        if (!key || !prevRects.has(String(key)) || typeof el.getBoundingClientRect !== "function") return;
        const first = prevRects.get(String(key));
        const last = el.getBoundingClientRect();
        const dx = (first.left || 0) - (last.left || 0);
        const dy = (first.top || 0) - (last.top || 0);
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        if (el.style) {
          el.style.transition = "none";
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          void el.offsetWidth;
          el.style.transition = "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)";
          el.style.transform = "translate(0, 0)";
          setTimeout(() => {
            if (el.style) {
              el.style.transition = "";
              el.style.transform = "";
            }
          }, 260);
        }
        if (highlightClass && el.classList?.add) {
          el.classList.remove(highlightClass);
          void el.offsetWidth;
          el.classList.add(highlightClass);
          setTimeout(() => el.classList?.remove?.(highlightClass), 700);
        }
      });
    } catch (_) {
    }
  }

  // src/modules/ui-utils.ts
  var RFUI = {
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
  if (typeof globalThis !== "undefined") {
    globalThis.RFUI = RFUI;
    globalThis.escapeHTML = escapeHTML;
  }
  if (typeof window !== "undefined") {
    window.RFUI = RFUI;
    window.escapeHTML = escapeHTML;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ...RFUI, escapeHTML };
  }
})();
