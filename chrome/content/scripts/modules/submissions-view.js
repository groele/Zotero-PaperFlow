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

  // src/modules/submissions-view/submission-state.ts
  function setSelectedSubmissionId(id) {
    selectedSubmissionId = id;
    if (typeof window !== "undefined") window.selectedSubmissionId = id;
    if (typeof globalThis !== "undefined") globalThis.selectedSubmissionId = id;
  }
  function setSubmissionAutoSaveCleanup(fn) {
    submissionAutoSaveCleanup = fn;
    if (typeof window !== "undefined") window.submissionAutoSaveCleanup = fn;
    if (typeof globalThis !== "undefined") globalThis.submissionAutoSaveCleanup = fn;
  }
  function clearSubmissionAutoSave() {
    const win = typeof window !== "undefined" ? window : globalThis;
    try {
      if (typeof win.submissionAutoSaveCleanup === "function") win.submissionAutoSaveCleanup();
      else if (typeof submissionAutoSaveCleanup === "function") submissionAutoSaveCleanup();
    } catch (_) {
    }
    setSubmissionAutoSaveCleanup(null);
  }
  function incrementPendingSubmissionSaves() {
    pendingSubmissionSaves += 1;
    const win = typeof window !== "undefined" ? window : globalThis;
    win.pendingSubmissionSaves = pendingSubmissionSaves;
    return pendingSubmissionSaves;
  }
  function decrementPendingSubmissionSaves() {
    pendingSubmissionSaves = Math.max(0, pendingSubmissionSaves - 1);
    const win = typeof window !== "undefined" ? window : globalThis;
    win.pendingSubmissionSaves = pendingSubmissionSaves;
    return pendingSubmissionSaves;
  }
  var g, selectedSubmissionId, submissionAutoSaveCleanup, pendingSubmissionSaves;
  var init_submission_state = __esm({
    "src/modules/submissions-view/submission-state.ts"() {
      "use strict";
      g = typeof window !== "undefined" ? window : globalThis;
      selectedSubmissionId = g.selectedSubmissionId || null;
      submissionAutoSaveCleanup = g.submissionAutoSaveCleanup || null;
      pendingSubmissionSaves = g.pendingSubmissionSaves || 0;
    }
  });

  // src/modules/submissions-view/checklist-and-matrix.ts
  function getDefaultSubmissionChecklistKeys() {
    return [
      { key: "cover_letter_ready", label: "Cover Letter drafted" },
      { key: "title_page_ready", label: "Title page formatted" },
      { key: "data_availability_statement", label: "Data Availability statement" },
      { key: "author_contribution", label: "CRedIT Author statements" },
      { key: "figure_resolution_checked", label: "High-res figures checked" },
      { key: "conflict_of_interest", label: "Conflict of Interest statement" }
    ];
  }
  function getSubmissionChecklistKeys(sub) {
    return Array.isArray(sub?.complianceChecklistKeys) && sub.complianceChecklistKeys.length > 0 ? sub.complianceChecklistKeys : getDefaultSubmissionChecklistKeys();
  }
  function getSubmissionReviewMatrixRows(sub) {
    if (Array.isArray(sub?.reviewMatrix)) return sub.reviewMatrix;
    if (Array.isArray(sub?.rebuttalMatrix)) return sub.rebuttalMatrix;
    return [];
  }
  function collectSubmissionChecklistFromEditor() {
    const compliance = {};
    document.querySelectorAll("#sub-edit-compliance-checklist-container [data-checklist-key]").forEach((input) => {
      compliance[input.dataset.checklistKey] = input.checked;
    });
    return compliance;
  }
  function collectSubmissionChecklistKeysFromEditor() {
    return Array.from(document.querySelectorAll("#sub-edit-compliance-checklist-container [data-checklist-key]")).map((input) => ({
      key: input.dataset.checklistKey,
      label: input.dataset.checklistLabel || input.dataset.checklistKey
    }));
  }
  function collectSubmissionReviewMatrixFromEditor() {
    if (typeof RFReviewMatrix !== "undefined" && RFReviewMatrix.collectSubmissionReviewMatrixFromEditor) {
      return RFReviewMatrix.collectSubmissionReviewMatrixFromEditor();
    }
    return [];
  }
  function createSubmissionReviewEditorRow(row = {}, index = 0) {
    if (typeof RFReviewMatrix !== "undefined" && RFReviewMatrix.createSubmissionReviewEditorRow) {
      return RFReviewMatrix.createSubmissionReviewEditorRow(row, index);
    }
    return document.createElement("div");
  }
  function reindexSubmissionReviewEditorRows(container) {
    if (typeof RFReviewMatrix !== "undefined" && RFReviewMatrix.reindexSubmissionReviewEditorRows) {
      return RFReviewMatrix.reindexSubmissionReviewEditorRows(container);
    }
  }
  function renderSubmissionChecklistEditor(sub, checklistKeys) {
    if (typeof RFReviewMatrix !== "undefined" && RFReviewMatrix.renderSubmissionChecklistEditor) {
      return RFReviewMatrix.renderSubmissionChecklistEditor(sub, checklistKeys);
    }
  }
  function renderSubmissionReviewMatrixEditor(sub, manAbstract) {
    if (typeof RFReviewMatrix !== "undefined" && RFReviewMatrix.renderSubmissionReviewMatrixEditor) {
      return RFReviewMatrix.renderSubmissionReviewMatrixEditor(sub, manAbstract);
    }
  }
  function renderSubmissionReviewPreview(sub, checklistKeys) {
    const w = window;
    const previewBox = document.getElementById("submission-review-preview");
    if (!previewBox) return;
    const compliance = sub.complianceChecklist && typeof sub.complianceChecklist === "object" && !Array.isArray(sub.complianceChecklist) ? sub.complianceChecklist : {};
    const completedChecks = checklistKeys.filter((chk) => compliance[chk.key] === true).length;
    const reviewRows = getSubmissionReviewMatrixRows(sub);
    const reviewPreview = reviewRows.length ? reviewRows.map((row, index) => {
      const reviewerTag = row.reviewer ? `<span class="badge badge-purple" style="font-size:10px; margin-left:6px; font-weight:normal;">${escapeHTML(row.reviewer)}</span>` : "";
      const statusVal = row.status || (row.response?.trim() ? "addressed" : "pending");
      let statusBadge = `<span class="badge badge-secondary" style="font-size:10px; margin-left:4px;">${escapeHTML(t("statusPending") || "待处理")}</span>`;
      if (statusVal === "addressed") statusBadge = `<span class="badge badge-success" style="font-size:10px; margin-left:4px;">${escapeHTML(t("statusAddressed") || "已解决")}</span>`;
      else if (statusVal === "in_progress") statusBadge = `<span class="badge badge-warning" style="font-size:10px; margin-left:4px;">${escapeHTML(t("statusInProgress") || "处理中")}</span>`;
      else if (statusVal === "clarified") statusBadge = `<span class="badge badge-info" style="font-size:10px; margin-left:4px;">${escapeHTML(t("statusClarified") || "辩明")}</span>`;
      const changesNote = row.changes ? `<div style="font-size:11px; color:var(--accent-blue, #0284c7); margin-top:3px; background:rgba(2,132,199,0.06); padding:2px 6px; border-radius:3px;">📝 ${escapeHTML(row.changes)}</div>` : "";
      return `
        <div class="submission-review-preview-row">
          <strong>${escapeHTML(tf("reviewerCommentLabel", { count: index + 1 }))}${reviewerTag}${statusBadge}</strong>
          <p>${escapeHTML(row.comment || t("noCommentText"))}</p>
          <span>${escapeHTML(row.response ? t("responseSaved") : t("responsePending"))}</span>
          ${changesNote}
        </div>`;
    }).join("") : `<p class="empty-state">${escapeHTML(t("emptyReviewPreview"))}</p>`;
    const progressHtml = w.RFAcademicExport?.renderRebuttalProgressTracker ? w.RFAcademicExport.renderRebuttalProgressTracker(sub) : "";
    w.RFUI.setHTML(previewBox, `
    ${progressHtml}
    <div class="workflow-context-grid submission-review-preview-grid">
      <div class="workflow-context-item"><span>${escapeHTML(t("checklistLabel"))}</span><strong>${completedChecks}/${checklistKeys.length}</strong></div>
      <div class="workflow-context-item"><span>${escapeHTML(t("workflowReviewerCommentsLabel"))}</span><strong>${reviewRows.length}</strong></div>
      <div class="workflow-context-item"><span>${escapeHTML(t("responsesLabel"))}</span><strong>${reviewRows.filter((row) => row.response).length}/${reviewRows.length}</strong></div>
    </div>
    <div class="submission-review-preview-list">${reviewPreview}</div>
  `);
  }
  var init_checklist_and_matrix = __esm({
    "src/modules/submissions-view/checklist-and-matrix.ts"() {
      "use strict";
    }
  });

  // src/modules/submissions-view/editor-sync.ts
  function applySubmissionEditSync(sub, man, syncPlan, database = db) {
    const w = window;
    const previousStatus = sub.status;
    if (man) {
      man.title = syncPlan.manuscriptPatch.title;
      if (w.RFCore?.getCurrentSubmission(database, man.id)?.id === sub.id) {
        man.targetJournals = syncPlan.manuscriptPatch.targetJournals;
      }
      man.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    } else {
      sub.title = syncPlan.detachedSubmissionTitle;
    }
    Object.assign(sub, syncPlan.submissionPatch);
    if (syncPlan.shouldMarkRejected) {
      markSubmissionRejected(sub, syncPlan.rejectionDate || todayString());
    } else {
      sub.status = syncPlan.submissionPatch.status;
    }
    if (syncPlan.submissionPatch.status === "accepted") {
      sub.acceptedAt = sub.decisionDate || sub.acceptedAt || (/* @__PURE__ */ new Date()).toISOString();
    } else if (syncPlan.submissionPatch.status === "published") {
      sub.publishedAt = sub.publishedAt || getTimelineNodeByKey(sub, "online")?.completeDate || sub.decisionDate || (/* @__PURE__ */ new Date()).toISOString();
      sub.acceptedAt = sub.acceptedAt || sub.publishedAt;
    }
    if (previousStatus === "published" && sub.status === "accepted") clearOnlinePublicationCompletion(sub);
    if (syncPlan.publicationPatch) {
      const doi = normalizeDoi(syncPlan.publicationPatch.doi);
      sub.doi = doi || null;
      sub.articleUrl = syncPlan.publicationPatch.articleUrl || (doi ? `https://doi.org/${doi}` : null);
    } else if (syncPlan.shouldClearPublication) {
      clearPublicationLinkFields(sub);
      clearPublicationTimelineCompletion(sub);
    }
    sub.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    normalizeSubmissionTimeline(sub);
    syncManuscriptStatusFromSubmission(sub, database);
    if (man) syncLinkedManuscriptSnapshots(man, database);
  }
  function refreshSubmissionStatusPresentation(sub) {
    const w = window;
    const detailPanel = document.getElementById("submission-detail-panel");
    if (!detailPanel || detailPanel.dataset.currentSubmissionId !== sub.id) return;
    const status = normalizeSubmissionStatus(sub.status);
    const statusText = getSubmissionStatusLabel(status);
    const badgeClass = w.RFUI.getSubmissionStatusBadgeClass(status);
    detailPanel.querySelectorAll("[data-submission-status-badge]").forEach((badge) => {
      badge.className = badgeClass;
      badge.textContent = badge.dataset.submissionStatusBadge === "stage" ? `${t("currentStageLabel")}: ${statusText}` : statusText;
    });
    const summary = detailPanel.querySelector("[data-submission-status-summary]");
    if (summary) {
      const analysis = analyzeSubmission(sub);
      const submitDate = normalizeDateString(sub.submissionDate || analysis.submitDate);
      summary.textContent = `${getSubmissionJournalName(sub)} / ${statusText} / ${t("milestoneSubmission")} ${submitDate || t("noDate")}`;
    }
    const cycle = getSubmissionCycleTime(sub);
    const cycleCard = detailPanel.querySelector("[data-submission-cycle-card]");
    if (cycleCard) {
      cycleCard.classList.toggle("submission-cycle-card-complete", cycle.isCompleted);
      cycleCard.classList.toggle("submission-cycle-card-active", !cycle.isCompleted);
      const label = cycleCard.querySelector("[data-submission-cycle-label]");
      const text = cycleCard.querySelector("[data-submission-cycle-text]");
      const icon = cycleCard.querySelector(".submission-cycle-icon");
      if (label) label.textContent = t(cycle.isCompleted ? "cycleTimeCompleted" : "submissionCycleTracking");
      if (text) {
        text.textContent = cycle.isCompleted ? tf("cycleTimeCompletedText", { start: cycle.startDateStr, end: cycle.endDateStr, days: cycle.days }) : tf("submissionCycleText", { start: cycle.startDateStr, days: cycle.days });
      }
      if (icon) {
        w.RFUI.setHTML(icon, cycle.isCompleted ? '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>' : '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>');
      }
    }
  }
  async function saveSubmissionEditFromValues(sub, prefix, options = {}, getEditValuesFn) {
    const w = window;
    const editValues = options.values || (getEditValuesFn ? getEditValuesFn(prefix) : window.getSubmissionEditValues?.(prefix));
    const syncPlan = w.RFUI.buildSubmissionEditSyncPlan(editValues);
    if (!syncPlan.ok) {
      if (options.alertOnError !== false) alert(syncPlan.error);
      if (typeof options.onValidationError === "function") options.onValidationError(syncPlan.error);
      return false;
    }
    const liveSub = db.submissions.find((item) => item.id === sub.id);
    if (!liveSub) throw new Error(t("submissionNotFound"));
    const previousStatus = normalizeSubmissionStatus(liveSub.status);
    const workingDatabase = typeof structuredClone === "function" ? structuredClone(db) : JSON.parse(JSON.stringify(db));
    const workingSub = workingDatabase.submissions.find((item) => item.id === sub.id);
    if (!workingSub) throw new Error(t("submissionNotFound"));
    const workingMan = workingDatabase.manuscripts.find((item) => item.id === workingSub.manuscriptId);
    applySubmissionEditSync(workingSub, workingMan, syncPlan, workingDatabase);
    const firstAuthor = String(editValues.firstAuthor || "").trim().slice(0, 160);
    workingSub.firstAuthor = firstAuthor || null;
    if (workingMan) {
      workingMan.firstAuthor = firstAuthor || null;
      syncLinkedManuscriptSnapshots(workingMan, workingDatabase);
    }
    workingSub.complianceChecklist = editValues.complianceChecklist;
    workingSub.complianceChecklistKeys = editValues.complianceChecklistKeys;
    workingSub.reviewMatrix = editValues.reviewMatrix;
    const savedDatabase = await w.storage.saveAll(workingDatabase, { mergeOnConflict: options.mergeOnConflict === true });
    db = savedDatabase || workingDatabase;
    const savedSub = db.submissions.find((item) => item.id === sub.id);
    if (!savedSub) throw new Error(t("submissionNotFound"));
    Object.assign(sub, savedSub);
    if (typeof ZoteroBridge !== "undefined" && ZoteroBridge.isZotero && workingMan?.zoteroItemKey) {
      try {
        ZoteroBridge.syncStatusTag(workingMan.zoteroItemKey, workingMan.status || savedSub.status, workingMan.zoteroLibraryID);
        if (ZoteroBridge.getPref("autoSyncChildNotes", true)) ZoteroBridge.syncNote(workingMan.zoteroItemKey, workingMan.zoteroLibraryID);
      } catch (_) {
      }
    }
    const shouldCelebrate = w.RFUI.shouldCelebrateAcceptance(previousStatus, normalizeSubmissionStatus(savedSub.status));
    const activeView = document.querySelector(".content-view.active")?.id;
    if (activeView === "view-dashboard") renderDashboard();
    if (activeView === "view-manuscripts") renderKanban();
    if (activeView === "view-submissions") w.renderSubmissions?.({ refreshDetails: options.renderDetails !== false });
    if (options.renderDetails !== false) w.renderSubmissionDetails?.(savedSub);
    else if (selectedSubmissionId === savedSub.id) refreshSubmissionStatusPresentation(savedSub);
    if (options.notify !== false) showGlobalToast(t("submissionEditsSaved"), "success");
    if (shouldCelebrate && (typeof ZoteroBridge === "undefined" || ZoteroBridge.getPref("enableAcceptanceCelebration", true))) {
      showAcceptanceCelebration(savedSub);
    }
    return true;
  }
  var init_editor_sync = __esm({
    "src/modules/submissions-view/editor-sync.ts"() {
      "use strict";
      init_submission_state();
    }
  });

  // src/modules/submissions-view/autosave-and-editor.ts
  function focusSubmissionEditCenter() {
    const detailPanel = document.getElementById("submission-detail-panel");
    const editCenter = detailPanel?.querySelector("#submission-entry-editor-panel");
    const titleInput = editCenter?.querySelector("#sub-edit-title");
    if (!detailPanel || !editCenter) return;
    const panelRect = detailPanel.getBoundingClientRect();
    const editorRect = editCenter.getBoundingClientRect();
    const targetTop = Math.max(detailPanel.scrollTop + editorRect.top - panelRect.top - 12, 0);
    if (typeof detailPanel.scrollTo === "function") {
      detailPanel.scrollTo({ top: targetTop, behavior: "smooth" });
    } else {
      detailPanel.scrollTop = targetTop;
    }
    editCenter.classList.remove("submission-edit-center-focused");
    void editCenter.offsetWidth;
    editCenter.classList.add("submission-edit-center-focused");
    window.setTimeout(() => editCenter.classList.remove("submission-edit-center-focused"), 2400);
    if (titleInput) {
      window.requestAnimationFrame(() => {
        try {
          titleInput.focus({ preventScroll: true });
        } catch (_) {
          titleInput.focus();
        }
        titleInput.select();
      });
    }
  }
  function canLeaveSubmissionEditor() {
    const w = window;
    const editor = document.getElementById("submission-entry-editor-panel");
    const state = editor?.querySelector("[data-submission-autosave-status]")?.dataset.state || "";
    if (!editor || !["pending", "invalid", "error"].includes(state)) return true;
    const plan = w.RFUI.buildSubmissionEditSyncPlan(getSubmissionEditValues("sub-edit"));
    if (plan.ok) return true;
    showGlobalToast(plan.error, "error");
    document.getElementById("sub-edit-title")?.focus();
    return false;
  }
  function openSubmissionForEditing(sub, options = {}) {
    if (!canLeaveSubmissionEditor()) return;
    clearSubmissionAutoSave();
    setSelectedSubmissionId(sub.id);
    const w = window;
    w.renderSubmissions?.();
    w.renderSubmissionDetails?.(sub);
    if (options.focusEditCenter) {
      requestAnimationFrame(focusSubmissionEditCenter);
    }
  }
  function navigateToSubmissionDetails(submissionId) {
    const g2 = typeof window !== "undefined" ? window : globalThis;
    const database = g2?.db || (typeof db !== "undefined" ? db : null);
    const submission = (database?.submissions || []).find((item) => item.id === submissionId);
    if (!submission) {
      showGlobalToast(t("submissionNotFound"), "error");
      return;
    }
    const submissionView = document.getElementById("view-submissions");
    if (!submissionView?.classList.contains("active")) {
      if (typeof window.activateWorkspaceView === "function") {
        window.activateWorkspaceView("view-submissions");
      } else {
        document.querySelector('.nav-item[data-view="view-submissions"]')?.click();
      }
    }
    openSubmissionForEditing(submission);
    document.getElementById("submission-detail-panel")?.scrollTo({ top: 0 });
  }
  function getSubmissionEditValues(prefix) {
    return {
      title: document.getElementById(`${prefix}-title`)?.value || "",
      firstAuthor: document.getElementById(`${prefix}-first-author`)?.value || "",
      journal: document.getElementById(`${prefix}-journal`)?.value || "",
      journalUrl: document.getElementById(`${prefix}-journal-url`)?.value || "",
      externalManuscriptId: document.getElementById(`${prefix}-external-id`)?.value?.trim() || "",
      status: document.getElementById(`${prefix}-status`)?.value || "submitted",
      submissionDate: document.getElementById(`${prefix}-submission-date`)?.value || "",
      firstDecisionDate: document.getElementById(`${prefix}-r1-date`)?.value || "",
      revisionDueDate: document.getElementById(`${prefix}-revision-due`)?.value || "",
      decisionDate: document.getElementById(`${prefix}-decision-date`)?.value || "",
      doi: document.getElementById(`${prefix}-doi`)?.value || "",
      articleUrl: document.getElementById(`${prefix}-article-url`)?.value || "",
      complianceChecklist: collectSubmissionChecklistFromEditor(),
      complianceChecklistKeys: collectSubmissionChecklistKeysFromEditor(),
      reviewMatrix: collectSubmissionReviewMatrixFromEditor()
    };
  }
  function setupSubmissionAutoSave(sub) {
    submissionAutoSaveCleanup?.();
    const editCenter = document.getElementById("submission-entry-editor-panel");
    const status = editCenter?.querySelector("[data-submission-autosave-status]");
    if (!editCenter || !status) return;
    let debounceTimer = null;
    let revision = 0;
    let saveChain = Promise.resolve();
    let lastSavedSnapshot = JSON.stringify(getSubmissionEditValues("sub-edit"));
    const debounceMs = 650;
    const setStatus = (state, message, detail = "") => {
      if (!editCenter.isConnected) return;
      status.dataset.state = state;
      status.title = detail || "";
      const label = status.querySelector("[data-submission-autosave-label]");
      if (label) label.textContent = message;
    };
    const persist = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      const requestedRevision = revision;
      const values = getSubmissionEditValues("sub-edit");
      const currentSnapshot = JSON.stringify(values);
      incrementPendingSubmissionSaves();
      setStatus("saving", t("autoSaveSaving"));
      saveChain = saveChain.catch(() => {
      }).then(async () => {
        if (currentSnapshot === lastSavedSnapshot) {
          if (requestedRevision === revision) setStatus("saved", t("autoSaveSaved"));
          return;
        }
        let validationError = "";
        const saved = await saveSubmissionEditFromValues(sub, "sub-edit", {
          values,
          alertOnError: false,
          renderDetails: false,
          notify: false,
          mergeOnConflict: true,
          onValidationError: (error) => {
            validationError = error;
          }
        }, getSubmissionEditValues);
        if (!editCenter.isConnected) return;
        if (!saved) {
          setStatus("invalid", t("autoSaveInvalid"), validationError);
          return;
        }
        lastSavedSnapshot = currentSnapshot;
        if (requestedRevision === revision) {
          setStatus("saved", t("autoSaveSaved"));
          renderSubmissionReviewPreview(sub, getSubmissionChecklistKeys(sub));
        }
      }).catch((error) => {
        console.error("Submission auto-save failed:", error);
        setStatus("error", t("autoSaveFailed"), String(error?.message || error || ""));
        showGlobalToast(t("autoSaveFailed"), "error");
      }).finally(() => {
        decrementPendingSubmissionSaves();
      });
    };
    const requestSave = ({ immediate = false } = {}) => {
      revision += 1;
      if (debounceTimer) clearTimeout(debounceTimer);
      setStatus("pending", t("autoSavePending"));
      if (immediate) persist();
      else debounceTimer = window.setTimeout(persist, debounceMs);
    };
    editCenter.addEventListener("input", (event) => {
      const control = event.target;
      if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
      if (control.type === "checkbox" || control.type === "radio") return;
      requestSave();
    });
    editCenter.addEventListener("change", (event) => {
      const control = event.target;
      if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) return;
      requestSave({ immediate: true });
    });
    editCenter.addEventListener("submission-autosave-request", (event) => {
      requestSave({ immediate: event.detail?.immediate !== false });
    });
    const flushPendingSave = () => {
      if (debounceTimer) persist();
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushPendingSave();
    };
    window.addEventListener("pagehide", flushPendingSave);
    document.addEventListener("visibilitychange", flushWhenHidden);
    const cleanupFn = () => {
      flushPendingSave();
      window.removeEventListener("pagehide", flushPendingSave);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      setSubmissionAutoSaveCleanup(null);
    };
    setSubmissionAutoSaveCleanup(cleanupFn);
  }
  var init_autosave_and_editor = __esm({
    "src/modules/submissions-view/autosave-and-editor.ts"() {
      "use strict";
      init_checklist_and_matrix();
      init_editor_sync();
      init_submission_state();
    }
  });

  // src/modules/submissions-view/journal-portals.ts
  function renderJournalPortals() {
    const w = window;
    const toolsRow = document.querySelector(".submission-tools-row");
    const portalList = document.getElementById("journal-portals-list");
    if (!portalList) return;
    const showPortals = typeof ZoteroBridge !== "undefined" ? ZoteroBridge.getPref("showJournalPortals", true) : db?.settings?.showJournalPortals ?? true;
    if (toolsRow) toolsRow.style.display = showPortals ? "" : "none";
    if (!showPortals) return;
    w.RFUI.setHTML(portalList, "");
    if (!db.settings) db.settings = {};
    if (!db.settings.journalPortals) {
      db.settings.journalPortals = [
        { id: "acs", name: "ACS", url: "https://publish.acs.org/app/login?code=1000", color: "#002C6C", isDefault: true },
        { id: "wiley", name: "Wiley", url: "https://submission.wiley.com/submission/dashboard", color: "#00A4E4", isDefault: true },
        { id: "apl", name: "APL", url: "https://apl.peerx-press.org/cgi-bin/main.plex", color: "#D22630", isDefault: true },
        { id: "nature", name: "Nature", url: "https://mts-ncomms.nature.com/cgi-bin/main.plex", color: "#B59E50", isDefault: true }
      ];
    }
    const portals = db.settings.journalPortals;
    if (portals.length === 0) {
      w.RFUI.setHTML(portalList, `<p class="empty-state" style="padding: 12px; font-size: 11px;">${escapeHTML(t("portalEmpty"))}</p>`);
      return;
    }
    portals.forEach((portal) => {
      const card = document.createElement("div");
      card.className = "portal-item-card";
      const safeUrl = w.RFUI.isSafeWebUrl(portal.url) ? portal.url : "";
      let domain = "";
      try {
        domain = new URL(portal.url).hostname;
      } catch (_) {
        domain = portal.url;
      }
      const initial = String(portal.name || "").charAt(0).toUpperCase();
      const portalColor = /^#[0-9a-f]{6}$/i.test(portal.color || "") ? portal.color : "var(--accent-purple)";
      card.title = `${portal.name} - ${domain}`;
      w.RFUI.setHTML(card, `
      <a class="portal-open" href="${escapeHTML(safeUrl || "#")}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(portal.name)} · ${escapeHTML(domain)}">
      <div class="portal-info">
        <div class="portal-avatar" style="background-color: ${portalColor};">${escapeHTML(initial)}</div>
        <div class="portal-text">
          <span class="portal-name">${escapeHTML(portal.name)}</span>
          <span class="portal-domain" title="${escapeHTML(portal.url)}">${escapeHTML(domain)}</span>
        </div>
      </div>
      </a>
      <div class="portal-actions">
        <button type="button" class="btn-edit-portal" title="${currentLanguage === "zh" ? "编辑投稿入口" : "Edit portal"}" aria-label="${currentLanguage === "zh" ? "编辑" : "Edit"} ${escapeHTML(portal.name)}">✎</button>
        <button type="button" class="btn-delete-portal" title="${escapeHTML(t("portalDeleteTitle"))}" aria-label="${escapeHTML(t("portalDeleteTitle"))} ${escapeHTML(portal.name)}" data-id="${escapeHTML(portal.id)}">✕</button>
      </div>
    `);
      card.querySelector(".portal-open")?.addEventListener("click", (event) => {
        if (!safeUrl) event.preventDefault();
      });
      card.querySelector(".btn-edit-portal")?.addEventListener("click", () => openJournalPortalEditor(portal));
      card.querySelector(".btn-delete-portal")?.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(tf("portalDeleteConfirm", { name: portal.name }))) {
          const previous = db.settings.journalPortals;
          try {
            db.settings.journalPortals = previous.filter((p) => p.id !== portal.id);
            db = await w.storage.saveAll(db) || db;
            renderJournalPortals();
            showGlobalToast(tf("portalDeletedToast", { name: portal.name }), "success");
          } catch (error) {
            db.settings.journalPortals = previous;
            showGlobalToast(error.message || String(error), "error");
          }
        }
      });
      portalList.appendChild(card);
    });
  }
  function openJournalPortalEditor(portal = null) {
    const w = window;
    const editing = Boolean(portal);
    openModal(`
    <div class="modal-header">
      <h2>${editing ? currentLanguage === "zh" ? "编辑投稿入口" : "Edit journal portal" : escapeHTML(t("addPortalTitle"))}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" aria-label="${escapeHTML(t("cancel"))}">✕</button>
    </div>
    <div class="form-group">
      <label for="portal-name">${escapeHTML(t("portalNameLabel"))}</label>
      <input type="text" id="portal-name" maxlength="60" value="${escapeHTML(portal?.name || "")}" placeholder="${escapeHTML(t("portalNamePlaceholder"))}">
    </div>
    <div class="form-group">
      <label for="portal-url">${escapeHTML(t("portalUrlLabel"))}</label>
      <input type="url" id="portal-url" value="${escapeHTML(portal?.url || "")}" placeholder="https://..." inputmode="url">
    </div>
    <div class="form-group">
      <label for="portal-color">${escapeHTML(t("portalColorLabel"))}</label>
      <div style="display: flex; gap: 12px; align-items: center;">
        <input type="color" id="portal-color" value="${/^#[0-9a-f]{6}$/i.test(portal?.color || "") ? portal.color : "#8b5cf6"}" style="width: 48px; height: 36px; border: none; padding: 0; background: transparent;">
        <span style="font-size: 12px; color: hsl(var(--text-muted));">${escapeHTML(t("portalColorHelp"))}</span>
      </div>
    </div>
    <button type="button" class="btn-primary w-full" id="btn-save-portal" style="margin-top:12px;">${editing ? currentLanguage === "zh" ? "保存修改" : "Save changes" : escapeHTML(t("addPortalButton"))}</button>
  `);
    document.getElementById("btn-save-portal")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const name = (document.getElementById("portal-name")?.value || "").trim();
      const url = (document.getElementById("portal-url")?.value || "").trim();
      const color = document.getElementById("portal-color")?.value || "#8b5cf6";
      if (!name || !url) {
        showGlobalToast(t("fillAllFields"), "error");
        return;
      }
      if (!w.RFUI.isSafeWebUrl(url)) {
        showGlobalToast(t("validUrlRequired"), "error");
        return;
      }
      const previous = Array.isArray(db.settings?.journalPortals) ? db.settings.journalPortals : [];
      const nextPortal = editing ? { ...portal, name, url, color } : { id: `portal_${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 11)}`, name, url, color, isDefault: false };
      const next = editing ? previous.map((item) => item.id === portal.id ? nextPortal : item) : [...previous, nextPortal];
      button.disabled = true;
      try {
        db.settings.journalPortals = next;
        db = await w.storage.saveAll(db) || db;
        closeModal();
        renderJournalPortals();
        showGlobalToast(editing ? currentLanguage === "zh" ? "投稿入口已更新" : "Portal updated" : tf("portalAddedToast", { name }), "success");
      } catch (error) {
        db.settings.journalPortals = previous;
        showGlobalToast(error.message || String(error), "error");
      } finally {
        button.disabled = false;
      }
    });
  }
  function setupJournalPortalListeners() {
    document.getElementById("btn-add-portal")?.addEventListener("click", () => openJournalPortalEditor());
  }
  var init_journal_portals = __esm({
    "src/modules/submissions-view/journal-portals.ts"() {
      "use strict";
    }
  });

  // src/modules/submissions-view/list-and-portals.ts
  function setupSubmissionSearch() {
    const input = document.getElementById("submission-search");
    if (!input || input.dataset.bound) return;
    input.dataset.bound = "true";
    input.addEventListener("input", (event) => {
      if (!event.isComposing) applySubmissionSearch();
    });
    input.addEventListener("compositionend", applySubmissionSearch);
    document.getElementById("submission-search-status")?.addEventListener("change", applySubmissionSearch);
    const clear = (all = false) => {
      input.value = "";
      const statusSelect = document.getElementById("submission-search-status");
      if (all && statusSelect) statusSelect.value = "all";
      applySubmissionSearch();
      input.focus();
    };
    document.getElementById("submission-search-clear")?.addEventListener("click", () => clear());
    document.getElementById("submission-search-reset")?.addEventListener("click", () => clear(true));
    input.addEventListener("keydown", (event) => {
      if (event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        clear();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        document.querySelector(".submission-card-item:not([hidden]) .btn-edit-submission")?.click();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || typeof modal !== "undefined" && modal?.classList?.contains("active")) return;
      if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (document.getElementById("view-submissions")?.classList?.contains("active")) {
        event.preventDefault();
        input.focus();
      }
    });
  }
  function applySubmissionSearch() {
    const w = window;
    const input = document.getElementById("submission-search");
    if (!input) return;
    const filter = document.getElementById("submission-search-status")?.value || "all";
    const terms = w.RFUI.normalizeSearchText(input.value).split(/\s+/).filter(Boolean);
    const cards = document.querySelectorAll("#submissions-list-container .submission-card-item");
    let count = 0;
    cards.forEach((card) => {
      const matches = w.RFUI.matchesSubmissionSearch(card.dataset.searchText, card.dataset.searchStatus, terms, filter);
      if (card.hidden === matches) card.hidden = !matches;
      if (matches) count += 1;
    });
    const clearBtn = document.getElementById("submission-search-clear");
    if (clearBtn) clearBtn.hidden = !input.value;
    const emptyEl = document.getElementById("submission-search-empty");
    if (emptyEl) emptyEl.hidden = count > 0 || cards.length === 0;
    const countEl = document.getElementById("submission-search-count");
    if (countEl) countEl.textContent = tf("submissionSearchCount", { count, total: cards.length });
  }
  function renderSubmissions({ refreshDetails = true } = {}) {
    const w = window;
    if (w.RFUI?.isViewDeferred?.("view-submissions")) return;
    const container = document.getElementById("submissions-list-container");
    w.RFUI.setHTML(container, "");
    if (db.submissions.length === 0) {
      w.RFUI.setHTML(container, `<p class="empty-state">${escapeHTML(t("noSubmissionsTracked"))}</p>`);
      setSelectedSubmissionId(null);
    } else {
      const sortedSubmissions = sortDashboardSubmissions(db.submissions);
      const manuscriptsById = new Map(db.manuscripts.map((manuscript) => [manuscript.id, manuscript]));
      const cards = document.createDocumentFragment();
      if (!sortedSubmissions.some((sub) => sub.id === selectedSubmissionId)) {
        setSelectedSubmissionId(sortedSubmissions[0].id);
      }
      const currentSelectedId = window.selectedSubmissionId || selectedSubmissionId;
      const selectedSubmission = sortedSubmissions.find((sub) => sub.id === currentSelectedId) || sortedSubmissions[0];
      sortedSubmissions.forEach((sub, index) => {
        const displayIndex = sortedSubmissions.length - index;
        const card = document.createElement("div");
        card.className = `glass-card submission-card-item ${sub.id === currentSelectedId ? "selected" : ""}`;
        const man = manuscriptsById.get(sub.manuscriptId);
        const manTitle = man ? man.title : sub.title || t("untitledManuscript");
        const journalName = getSubmissionJournalName(sub);
        const statusText = getSubmissionStatusLabel(sub.status || "submitted");
        card.dataset.searchStatus = normalizeSubmissionStatus(sub.status);
        card.dataset.searchText = w.RFUI.normalizeSearchText([manTitle, journalName, sub.externalManuscriptId, getSubmissionFirstAuthor(sub, man), man?.authors, man?.doi, sub.doi, statusText, sub.status].filter(Boolean).join(" "));
        const transferText = sub.previousJournal ? `<span class="submission-card-meta">${escapeHTML(t("transferToJournal"))}: ${escapeHTML(sub.previousJournal)}</span>` : "";
        let cardCountdownHtml = "";
        if (sub.revisionDueDate && (sub.status === "revision" || sub.status === "under_review")) {
          const cd = w.RFCalendar?.getRevisionCountdownMeta ? w.RFCalendar.getRevisionCountdownMeta(sub.revisionDueDate) : null;
          if (cd) {
            cardCountdownHtml = `<span class="${escapeHTML(cd.badgeClass)}" style="font-size:10px; padding:1px 6px; border-radius:3px;" title="${escapeHTML(cd.title)}">${escapeHTML(cd.icon)} ${escapeHTML(cd.text)}</span>`;
          }
        }
        w.RFUI.setHTML(card, `
        <div class="submission-card-heading">
          <div class="submission-card-title-group">
            <span class="submission-index">${displayIndex}</span>
            <div class="submission-card-copy">
              <h4 title="${escapeHTML(journalName)}">${escapeHTML(journalName)}</h4>
              <p class="submission-card-title">${escapeHTML(manTitle)}</p>
            </div>
          </div>
          <div style="display: flex; gap: 4px; align-items: center;">
            <button type="button" class="btn-secondary btn-icon btn-sub-card-share" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t("shareJourney"))}">
              <svg viewBox="0 0 24 24" aria-hidden="true" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>
            </button>
            <button class="btn-secondary btn-icon submission-card-edit btn-edit-submission" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t("editFields"))}">
              <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
          </div>
        </div>
        <div class="submission-card-footer">
          <span class="${w.RFUI.getSubmissionStatusBadgeClass(sub.status)}">${escapeHTML(statusText)}</span>
          ${sub.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:10px; padding:1px 6px; border-radius:3px;" title="Manuscript ID: ${escapeHTML(sub.externalManuscriptId)}">ID: ${escapeHTML(sub.externalManuscriptId)}</span>` : ""}
          ${cardCountdownHtml}
          ${transferText}
          ${man?.zoteroItemKey ? `
            <span class="zotero-card-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" title="${escapeHTML(currentLanguage === "zh" ? "在 Zotero 文献库中选中此条目" : "Select in Zotero library")}" style="padding:1px 6px; font-size:10px; margin-left:auto;">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
              Zotero
            </span>
          ` : ""}
        </div>
      `);
        card.addEventListener("click", () => openSubmissionForEditing(sub));
        card.querySelector(".btn-edit-submission")?.addEventListener("click", (event) => {
          event.stopPropagation();
          openSubmissionForEditing(sub, { focusEditCenter: true });
        });
        card.querySelector(".btn-sub-card-share")?.addEventListener("click", (event) => {
          event.stopPropagation();
          const shareFn = w.openSubmissionSharePreview || w.openSubmissionShareModal;
          if (typeof shareFn === "function") shareFn(sub.id, event.currentTarget);
        });
        const cardZoteroBadge = card.querySelector(".zotero-card-badge");
        cardZoteroBadge?.addEventListener("click", (event) => {
          event.stopPropagation();
          const key = cardZoteroBadge.getAttribute("data-item-key");
          if (key && typeof ZoteroBridge !== "undefined") {
            const linkedMan = db.manuscripts?.find((item) => item.id === sub.manuscriptId);
            ZoteroBridge.selectItemInZotero(key, linkedMan?.zoteroLibraryID);
          }
        });
        cards.appendChild(card);
      });
      container?.appendChild(cards);
      const detailPanel = document.getElementById("submission-detail-panel");
      if (refreshDetails || detailPanel?.dataset.currentSubmissionId !== selectedSubmission.id) {
        w.renderSubmissionDetails?.(selectedSubmission);
      }
    }
    renderJournalPortals();
    applySubmissionSearch();
  }
  function openLinkSubmissionModal(submission) {
    const w = window;
    const manuscripts = Array.isArray(db.manuscripts) ? db.manuscripts : [];
    if (manuscripts.length === 0) {
      showGlobalToast(t("noManuscriptsToLink"), "warning");
      return;
    }
    const manuscriptOptions = manuscripts.slice().sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""))).map((m) => `<option value="${escapeHTML(m.id)}">${escapeHTML(m.title || t("untitledManuscript"))}</option>`).join("");
    openModal(`
    <div class="modal-header">
      <div>
        <h2>${escapeHTML(t("linkSubmissionTitle"))}</h2>
        <p class="text-muted">${escapeHTML(t("linkSubmissionHelp"))}</p>
      </div>
      <button class="btn-secondary btn-icon" id="btn-close-modal" aria-label="${escapeHTML(t("cancel"))}">✕</button>
    </div>
    <div class="form-group">
      <label for="submission-link-manuscript">${escapeHTML(t("workflowManuscriptLabel"))}</label>
      <select id="submission-link-manuscript">${manuscriptOptions}</select>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-cancel-link-sub">${escapeHTML(t("cancel") || "取消")}</button>
      <button type="button" class="btn-primary" id="btn-confirm-submission-link" style="min-width:130px;">${escapeHTML(t("linkSubmissionConfirm"))}</button>
    </div>
  `);
    document.getElementById("btn-cancel-link-sub")?.addEventListener("click", closeModal);
    document.getElementById("btn-confirm-submission-link")?.addEventListener("click", async () => {
      const manuscriptId = document.getElementById("submission-link-manuscript")?.value;
      const manuscript = db.manuscripts.find((item) => item.id === manuscriptId);
      const liveSubmission = db.submissions.find((item) => item.id === submission.id);
      if (!manuscript || !liveSubmission) return;
      const previous = { manuscriptId: liveSubmission.manuscriptId, projectId: liveSubmission.projectId, updatedAt: liveSubmission.updatedAt };
      const manuscriptStates = db.manuscripts.map((item) => [item, item.status, item.updatedAt]);
      try {
        liveSubmission.manuscriptId = manuscript.id;
        liveSubmission.projectId = manuscript.projectId || liveSubmission.projectId || null;
        liveSubmission.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        syncManuscriptStatusesFromSubmissions(db);
        db = await w.storage.saveAll(db) || db;
        closeModal();
        renderDashboard();
        renderKanban();
        renderSubmissions();
        const linkedSubmission = db.submissions.find((item) => item.id === submission.id);
        if (linkedSubmission) w.renderSubmissionDetails?.(linkedSubmission);
        showGlobalToast(t("linkSubmissionSaved"), "success");
      } catch (error) {
        Object.assign(liveSubmission, previous);
        manuscriptStates.forEach(([item, status, updatedAt]) => {
          item.status = status;
          item.updatedAt = updatedAt;
        });
        showGlobalToast(error.message || String(error), "error");
      }
    });
  }
  function getRebuttalEngine() {
    const w = typeof window !== "undefined" ? window : null;
    if (w?.RFAcademicExport) return w.RFAcademicExport;
    if (globalThis?.RFAcademicExport) return globalThis.RFAcademicExport;
    return {};
  }
  function escapeLatexText(value) {
    return (getRebuttalEngine().escapeLatexText || ((v) => String(v ?? "")))(value);
  }
  function safeEscapeLatex(value) {
    return (getRebuttalEngine().safeEscapeLatex || ((v) => String(v ?? "")))(value);
  }
  function copyRebuttalRichText(htmlContent, plainFallback) {
    return (getRebuttalEngine().copyRebuttalRichText || (async () => false))(htmlContent, plainFallback);
  }
  function generateAcademicRebuttalLetter(sub, man, format = "latex") {
    return (getRebuttalEngine().generateAcademicRebuttalLetter || (() => ""))(sub, man, format);
  }
  function parseReviewCommentsBatch(rawText = "", defaultReviewer = "Reviewer #1") {
    return (getRebuttalEngine().parseReviewCommentsBatch || (() => []))(rawText, defaultReviewer);
  }
  function renderRebuttalProgressTracker(sub = {}) {
    return (getRebuttalEngine().renderRebuttalProgressTracker || (() => ""))(sub);
  }
  function generateRevisionCoverLetter(sub = {}, man = {}, format = "html") {
    return (getRebuttalEngine().generateRevisionCoverLetter || (() => ""))(sub, man, format);
  }
  function openBatchReviewImportModal(sub, reviewBox, onComplete) {
    return (getRebuttalEngine().openBatchReviewImportModal || (() => {
    }))(sub, reviewBox, onComplete);
  }
  var init_list_and_portals = __esm({
    "src/modules/submissions-view/list-and-portals.ts"() {
      "use strict";
      init_autosave_and_editor();
      init_journal_portals();
      init_submission_state();
    }
  });

  // src/modules/submissions-view/rebuttal-export-modal.ts
  function openAcademicRebuttalExportModal(sub, man) {
    const w = window;
    const savedReviewRows = getSubmissionReviewMatrixRows(sub);
    if (savedReviewRows.length === 0) {
      showGlobalToast(t("noReviewerCommentsExport"), "warning");
      return;
    }
    const wordHtml = generateAcademicRebuttalLetter(sub, man, "word");
    const mdCode = generateAcademicRebuttalLetter(sub, man, "md");
    const latexCode = generateAcademicRebuttalLetter(sub, man, "latex");
    const tableCode = generateAcademicRebuttalLetter(sub, man, "table");
    const coverHtml = generateRevisionCoverLetter(sub, man, "html");
    const coverMd = generateRevisionCoverLetter(sub, man, "md");
    const coverLatex = generateRevisionCoverLetter(sub, man, "latex");
    openModal(`
    <div class="modal-header">
      <h2>📋 ${escapeHTML(t("exportAcademicMatrixTitle") || (currentLanguage === "zh" ? "导出标准学术审稿回复信与修回矩阵" : "Export Response Letter & Rebuttal Matrix"))}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    <div style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">
      ${escapeHTML(currentLanguage === "zh" ? `共检测到 ${savedReviewRows.length} 条审稿意见与回复。支持直接复制 Word 富文本 (保留格式、排版与表格)、学术 Markdown 模版、编译版 LaTeX 答复信或配套修回投稿信。` : `Detected ${savedReviewRows.length} comments and responses. Export formatted Word text, academic Markdown, LaTeX response letter, or revision cover letter.`)}
    </div>
    <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
      <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-word" style="font-size:12px; font-weight:600; padding:5px 12px; border-color:#e11d48; color:#e11d48;">📄 ${escapeHTML(t("exportTabWord") || "Word / 富文本 (带格式)")}</button>
      <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-md" style="font-size:12px; font-weight:600; padding:5px 12px;">📝 ${escapeHTML(t("exportTabMarkdown") || "学术 Markdown 模版")}</button>
      <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-latex" style="font-size:12px; font-weight:600; padding:5px 12px;">📑 ${escapeHTML(t("exportTabLatex") || "LaTeX 宏包答复信 (.tex)")}</button>
      <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-table" style="font-size:12px; font-weight:600; padding:5px 12px;">📊 ${escapeHTML(t("exportTabTable") || "意见矩阵汇总表")}</button>
      <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-cover" style="font-size:12px; font-weight:600; padding:5px 12px;">✉ ${escapeHTML(t("revisionCoverLetterTab") || "修回投稿自述信")}</button>
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <div id="rebuttal-word-preview-box" style="display:block; max-height:280px; overflow-y:auto; border:1px solid var(--input-border); border-radius:6px; padding:14px; background:#ffffff; color:#111827;"></div>
      <textarea id="rebuttal-export-preview" rows="12" readonly style="display:none; font-family:monospace; font-size:11px; line-height:1.5; width:100%; box-sizing:border-box; background:var(--input-bg); color:hsl(var(--text-primary)); border:1px solid var(--input-border); border-radius:6px; resize:vertical;"></textarea>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:14px;">
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn-primary" id="btn-copy-rebuttal-word" style="font-size:12px;">
          <span>📋 ${escapeHTML(currentLanguage === "zh" ? "复制富文本 (直接粘贴至 Word / WPS)" : "Copy Rich Text (Paste to Word)")}</span>
        </button>
        <button type="button" class="btn-secondary" id="btn-copy-rebuttal-code" style="font-size:12px;">
          <span>📋 ${escapeHTML(currentLanguage === "zh" ? "复制当前代码" : "Copy Code")}</span>
        </button>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn-secondary" id="btn-download-tex" style="font-size:12px;">
          <span>💾 ${escapeHTML(t("downloadTex") || "下载 .tex 文件")}</span>
        </button>
        <button type="button" class="btn-secondary" id="btn-download-md" style="font-size:12px;">
          <span>💾 ${escapeHTML(t("downloadMd") || "下载 .md 文件")}</span>
        </button>
        <button type="button" class="btn-secondary" id="btn-download-doc" style="font-size:12px;">
          <span>💾 ${escapeHTML(t("downloadDoc") || "下载 Word 兼容文件")}</span>
        </button>
      </div>
    </div>
  `);
    let defaultFormat = typeof ZoteroBridge !== "undefined" ? ZoteroBridge.getPref("defaultRebuttalExportFormat", "word") : db?.settings?.defaultRebuttalExportFormat || "word";
    if (defaultFormat === "markdown") defaultFormat = "md";
    let currentFormat = ["word", "md", "latex", "table", "cover"].includes(defaultFormat) ? defaultFormat : "word";
    const previewArea = document.getElementById("rebuttal-export-preview");
    const wordBox = document.getElementById("rebuttal-word-preview-box");
    const tabs = [
      { id: "word", el: document.getElementById("modal-tab-word") },
      { id: "md", el: document.getElementById("modal-tab-md") },
      { id: "latex", el: document.getElementById("modal-tab-latex") },
      { id: "table", el: document.getElementById("modal-tab-table") },
      { id: "cover", el: document.getElementById("modal-tab-cover") }
    ];
    const updatePreview = () => {
      tabs.forEach((tItem) => {
        if (!tItem.el) return;
        if (tItem.id === currentFormat) {
          tItem.el.style.borderColor = "#e11d48";
          tItem.el.style.color = "#e11d48";
        } else {
          tItem.el.style.borderColor = "var(--input-border)";
          tItem.el.style.color = "hsl(var(--text-primary))";
        }
      });
      if (currentFormat === "word") {
        if (wordBox) {
          wordBox.style.display = "block";
          w.RFUI.setHTML(wordBox, wordHtml);
        }
        if (previewArea) previewArea.style.display = "none";
      } else if (currentFormat === "cover") {
        if (wordBox) {
          wordBox.style.display = "block";
          w.RFUI.setHTML(wordBox, coverHtml);
        }
        if (previewArea) previewArea.style.display = "none";
      } else {
        if (wordBox) wordBox.style.display = "none";
        if (previewArea) {
          previewArea.style.display = "block";
          if (currentFormat === "md") previewArea.value = mdCode;
          else if (currentFormat === "latex") previewArea.value = latexCode;
          else if (currentFormat === "table") previewArea.value = tableCode;
        }
      }
    };
    updatePreview();
    tabs.forEach((item) => {
      item.el?.addEventListener("click", () => {
        currentFormat = item.id;
        updatePreview();
      });
    });
    document.getElementById("btn-copy-rebuttal-word")?.addEventListener("click", async () => {
      const activeHtml = currentFormat === "cover" ? coverHtml : wordHtml;
      const activeText = currentFormat === "cover" ? coverMd : mdCode;
      await copyRebuttalRichText(activeHtml, activeText);
      showGlobalToast(t("copyWordSuccess") || (currentLanguage === "zh" ? "已复制 Word 富文本至剪贴板！可直接粘贴至 Word / WPS。" : "Copied rich text to clipboard! Ready to paste into Word."), "success");
    });
    document.getElementById("btn-copy-rebuttal-code")?.addEventListener("click", () => {
      let codeToCopy = mdCode;
      if (currentFormat === "cover") codeToCopy = coverMd;
      else if (currentFormat === "latex") codeToCopy = latexCode;
      else if (currentFormat === "word") codeToCopy = wordHtml;
      else if (currentFormat === "table") codeToCopy = tableCode;
      if (typeof ZoteroBridge !== "undefined") {
        ZoteroBridge.copyText(codeToCopy, t("copyCodeSuccess") || (currentLanguage === "zh" ? "已复制到剪贴板！" : "Copied to clipboard!"));
      } else {
        navigator.clipboard?.writeText(codeToCopy);
        showGlobalToast(t("copyCodeSuccess") || (currentLanguage === "zh" ? "已复制到剪贴板！" : "Copied to clipboard!"), "success");
      }
    });
    const triggerDownload = (content, filename, mimeType) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    const getExportFilename = (prefix, ext) => {
      const safeId = String(sub.externalManuscriptId || sub.id).replace(/[^a-zA-Z0-9_-]/g, "_");
      return `${prefix}_${safeId}.${ext}`;
    };
    document.getElementById("btn-download-tex")?.addEventListener("click", () => {
      const content = currentFormat === "cover" ? coverLatex : latexCode;
      const name = currentFormat === "cover" ? getExportFilename("cover_letter", "tex") : getExportFilename("rebuttal_letter", "tex");
      triggerDownload(content, name, "text/plain;charset=utf-8");
      showGlobalToast(t("latexDownloaded"), "success");
    });
    document.getElementById("btn-download-md")?.addEventListener("click", () => {
      const content = currentFormat === "cover" ? coverMd : mdCode;
      const name = currentFormat === "cover" ? getExportFilename("cover_letter", "md") : getExportFilename("rebuttal_letter", "md");
      triggerDownload(content, name, "text/markdown;charset=utf-8");
      showGlobalToast(currentLanguage === "zh" ? "已下载学术 Markdown 模版" : "Downloaded Markdown document", "success");
    });
    document.getElementById("btn-download-doc")?.addEventListener("click", () => {
      const content = currentFormat === "cover" ? coverHtml : wordHtml;
      const name = currentFormat === "cover" ? getExportFilename("cover_letter", "doc") : getExportFilename("rebuttal_letter", "doc");
      triggerDownload(content, name, "application/msword;charset=utf-8");
      showGlobalToast(currentLanguage === "zh" ? "已下载 Word 兼容文件" : "Downloaded Word document", "success");
    });
  }
  var init_rebuttal_export_modal = __esm({
    "src/modules/submissions-view/rebuttal-export-modal.ts"() {
      "use strict";
      init_list_and_portals();
      init_checklist_and_matrix();
    }
  });

  // src/modules/submissions-view/modals-and-creation.ts
  function openTransferSubmissionModal(sourceSub) {
    const w = window;
    const sourceJournal = getSubmissionJournalName(sourceSub);
    const today = todayString();
    openModal(`
    <div class="modal-header">
      <h2>${t("transferSubmissionTitle")}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    <div class="glass-card" style="margin-bottom:12px;">
      <p style="font-size:12px; margin:0;">${escapeHTML(t("currentJournalLabel"))}: <strong>${escapeHTML(sourceJournal)}</strong></p>
      <p class="text-muted" style="font-size:11px; margin-top:4px;">${escapeHTML(t("transferModalHelp"))}</p>
    </div>
    <div class="grid-cols-2" style="gap:10px;">
      <div class="form-group">
        <label>${t("rejectionDate")}</label>
        <input type="date" id="transfer-rejection-date" value="${today}">
      </div>
      <div class="form-group">
        <label>${t("milestoneSubmission")}</label>
        <input type="date" id="transfer-submission-date" value="${today}">
      </div>
    </div>
    <div class="form-group">
      <label>${t("newTargetJournal")}</label>
      <input type="text" id="transfer-target-journal" placeholder="${escapeHTML(t("targetJournalPlaceholder"))}">
    </div>
    <div class="form-group">
      <label>${escapeHTML(t("submissionPortalUrl"))}</label>
      <input type="url" id="transfer-journal-url" placeholder="https://...">
    </div>
    <div class="form-group">
      <label>${t("rejectionNote")}</label>
      <textarea id="transfer-rejection-note" rows="3" placeholder="${escapeHTML(t("rejectionNotePlaceholder"))}"></textarea>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-cancel-transfer">${escapeHTML(t("cancel") || "取消")}</button>
      <button type="button" class="btn-primary" id="btn-create-transfer-sub" style="min-width:130px;">${t("transferButton")}</button>
    </div>
  `);
    document.getElementById("btn-cancel-transfer")?.addEventListener("click", closeModal);
    document.getElementById("btn-create-transfer-sub")?.addEventListener("click", async () => {
      const targetJournal = (document.getElementById("transfer-target-journal")?.value || "").trim();
      const rejectionDate = document.getElementById("transfer-rejection-date")?.value || today;
      const submissionDate = document.getElementById("transfer-submission-date")?.value || today;
      const journalUrl = (document.getElementById("transfer-journal-url")?.value || "").trim();
      const rejectionNote = (document.getElementById("transfer-rejection-note")?.value || "").trim();
      if (!targetJournal) {
        alert(t("manuscriptJournalRequired"));
        return;
      }
      if (journalUrl) {
        try {
          new URL(journalUrl);
        } catch (_) {
          alert(t("validPortalUrlOrBlank"));
          return;
        }
      }
      markSubmissionRejected(sourceSub, rejectionDate, rejectionNote);
      const newSub = createTransferredSubmission(sourceSub, targetJournal, submissionDate, journalUrl);
      db.submissions.push(newSub);
      syncManuscriptStatusFromSubmission(newSub);
      setSelectedSubmissionId(newSub.id);
      await w.storage.saveAll(db);
      closeModal();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      renderSubmissionDetails(newSub);
      showGlobalToast(t("transferToast"), "success");
    });
  }
  function bindTrackSubmissionButton() {
    document.getElementById("btn-add-submission")?.addEventListener("click", openTrackSubmissionModal);
  }
  function openTrackSubmissionModal() {
    const w = window;
    let manOpts = (db.manuscripts || []).map((m) => `
    <option value="${escapeHTML(m.id)}">${escapeHTML(m.title || t("untitledManuscript"))}</option>
  `).join("");
    manOpts += `<option value="__new__">${escapeHTML(t("createNewManuscriptOption"))}</option>`;
    const defaultManuscriptMode = !db.manuscripts || db.manuscripts.length === 0 ? "__new__" : db.manuscripts[0]?.id || "__new__";
    manOpts = manOpts.replace(`value="${escapeHTML(defaultManuscriptMode)}"`, `value="${escapeHTML(defaultManuscriptMode)}" selected`);
    openModal(`
    <div class="modal-header">
      <h2>${t("trackSubmissionTitle")}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    <div id="sub-zotero-active-item-banner" class="zotero-active-item-banner" style="display:none; align-items:center; justify-content:space-between; gap:10px; padding:10px 14px; background:rgba(204,0,0,0.06); border:1px solid rgba(204,0,0,0.22); border-radius:8px; margin-bottom:12px;">
      <span id="sub-zotero-active-item-text" style="font-size:12px; color:hsl(var(--text-primary)); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:75%;"></span>
      <button type="button" class="btn-secondary" id="btn-sub-zotero-quick-bind-active" style="padding:4px 10px; font-size:11px; white-space:nowrap; border-color:rgba(204,0,0,0.3); color:#cc0000; font-weight:600; cursor:pointer;">⚡ 一键载入</button>
    </div>
    <div class="form-group">
      <label for="sub-man-select">${t("manuscriptPaper")}</label>
      <select id="sub-man-select">${manOpts}</select>
    </div>
    <div class="quick-new-manuscript-panel" id="sub-new-manuscript-panel" ${defaultManuscriptMode === "__new__" ? "" : "hidden"}>
      <div class="form-group" style="margin-bottom:0;">
        <label for="sub-new-man-title" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${escapeHTML(t("newManuscriptTitleLabel"))}</span>
          <span style="font-size:10px; font-weight:normal; text-transform:none; color:hsl(var(--text-muted));">${escapeHTML(currentLanguage === "zh" ? "将同步创建稿件条目" : "Will create manuscript entry")}</span>
        </label>
        <input type="text" id="sub-new-man-title" placeholder="${escapeHTML(currentLanguage === "zh" ? "输入论文稿件标题 (如: Deep Learning for Genomic Effect...)" : t("paperTitlePlaceholder"))}">
      </div>
    </div>
    <div class="grid-cols-2">
      <div class="form-group">
        <label for="sub-first-author">${escapeHTML(t("firstAuthorLabel"))}</label>
        <input type="text" id="sub-first-author" value="" placeholder="${escapeHTML(currentLanguage === "zh" ? "例如: Zhang San" : t("firstAuthorPlaceholder"))}">
      </div>
      <div class="form-group">
        <label for="sub-journal">${t("targetJournalInput")}</label>
        <input type="text" id="sub-journal" placeholder="${escapeHTML(currentLanguage === "zh" ? "例如: Nature / IEEE TPAMI" : t("targetJournalPlaceholder"))}">
      </div>
    </div>
    <div class="grid-cols-2">
      <div class="form-group">
        <label for="sub-journal-url">${escapeHTML(t("submissionPortalUrl"))}</label>
        <input type="url" id="sub-journal-url" placeholder="https://...">
      </div>
      <div class="form-group">
        <label for="sub-date">${t("initialSubmissionDate")}</label>
        <input type="date" id="sub-date" value="${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}">
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-cancel-sub">${escapeHTML(t("cancel") || "取消")}</button>
      <button type="button" class="btn-primary" id="btn-submit-sub" style="min-width:140px;">${t("trackSubmissionButton")}</button>
    </div>
  `);
    document.getElementById("btn-cancel-sub")?.addEventListener("click", closeModal);
    const manuscriptSelect = document.getElementById("sub-man-select");
    const newManuscriptPanel = document.getElementById("sub-new-manuscript-panel");
    const autoFillFromManuscript = (mId) => {
      if (mId && mId !== "__new__") {
        const selectedMan = (db.manuscripts || []).find((m) => m.id === mId);
        if (selectedMan) {
          const authorInput = document.getElementById("sub-first-author");
          const journalInput = document.getElementById("sub-journal");
          const urlInput = document.getElementById("sub-journal-url");
          if (authorInput && !authorInput.value.trim() && selectedMan.authors) {
            authorInput.value = firstAuthorFromList(selectedMan.authors) || selectedMan.authors;
          }
          if (journalInput && !journalInput.value.trim() && (selectedMan.journal || selectedMan.publication)) {
            journalInput.value = selectedMan.journal || selectedMan.publication;
          }
          if (urlInput && !urlInput.value.trim() && (selectedMan.articleUrl || selectedMan.doi)) {
            urlInput.value = selectedMan.articleUrl || (selectedMan.doi ? `https://doi.org/${selectedMan.doi}` : "");
          }
        }
      }
    };
    manuscriptSelect?.addEventListener("change", () => {
      const isNew = manuscriptSelect.value === "__new__";
      if (newManuscriptPanel) newManuscriptPanel.hidden = !isNew;
      if (isNew) document.getElementById("sub-new-man-title")?.focus();
      else autoFillFromManuscript(manuscriptSelect.value);
    });
    if (defaultManuscriptMode !== "__new__") {
      autoFillFromManuscript(defaultManuscriptMode);
    }
    setupActiveItemDetection(manuscriptSelect, newManuscriptPanel);
    setupSubmitSubmissionListener(manuscriptSelect);
  }
  function setupActiveItemDetection(manuscriptSelect, newManuscriptPanel) {
    const w = window;
    setTimeout(async () => {
      try {
        if (typeof ZoteroBridge !== "undefined") {
          const activeItem = await ZoteroBridge.getActiveItem();
          const banner = document.getElementById("sub-zotero-active-item-banner");
          const textEl = document.getElementById("sub-zotero-active-item-text");
          const quickBindBtn = document.getElementById("btn-sub-zotero-quick-bind-active");
          if (activeItem && activeItem.title && banner && textEl) {
            w.RFUI.setHTML(textEl, `📌 <strong>${escapeHTML(currentLanguage === "zh" ? "检测到 Zotero 选中文献：" : "Active Zotero item: ")}</strong>《${escapeHTML(activeItem.title)}》`);
            banner.style.display = "flex";
            quickBindBtn?.addEventListener("click", () => {
              const match = (db.manuscripts || []).find(
                (m) => m.zoteroItemKey && m.zoteroItemKey === activeItem.key || m.title && m.title.trim().toLowerCase() === activeItem.title.trim().toLowerCase()
              );
              if (match && manuscriptSelect) {
                manuscriptSelect.value = match.id;
                if (newManuscriptPanel) newManuscriptPanel.hidden = true;
              } else if (manuscriptSelect) {
                manuscriptSelect.value = "__new__";
                if (newManuscriptPanel) newManuscriptPanel.hidden = false;
                const titleInput = document.getElementById("sub-new-man-title");
                if (titleInput) titleInput.value = activeItem.title;
              }
              const authorInput = document.getElementById("sub-first-author");
              const journalInput = document.getElementById("sub-journal");
              const urlInput = document.getElementById("sub-journal-url");
              if (authorInput && activeItem.authors) {
                authorInput.value = firstAuthorFromList(activeItem.authors) || activeItem.authors;
              }
              if (journalInput && activeItem.publication) journalInput.value = activeItem.publication;
              if (urlInput) urlInput.value = activeItem.url || (activeItem.doi ? `https://doi.org/${activeItem.doi}` : "");
              banner.style.display = "none";
              showGlobalToast(currentLanguage === "zh" ? "已从 Zotero 选中文献载入投稿信息" : "Loaded submission metadata from active Zotero item", "success");
            });
          }
        }
      } catch (_) {
      }
    }, 60);
  }
  function setupSubmitSubmissionListener(manuscriptSelect) {
    const w = window;
    document.getElementById("btn-submit-sub")?.addEventListener("click", async () => {
      const createMode = w.RFUI.buildSubmissionCreateMode({
        selectedManuscriptId: manuscriptSelect?.value || "__new__",
        newManuscriptTitle: document.getElementById("sub-new-man-title")?.value || "",
        targetJournal: document.getElementById("sub-journal")?.value || ""
      });
      const subDate = document.getElementById("sub-date")?.value || "";
      const journalUrl = (document.getElementById("sub-journal-url")?.value || "").trim();
      const firstAuthor = (document.getElementById("sub-first-author")?.value || "").trim().slice(0, 160);
      if (!createMode.ok) {
        alert(createMode.error);
        return;
      }
      if (journalUrl) {
        try {
          const parsed = new URL(journalUrl);
          if (!/^https?:$/.test(parsed.protocol)) throw new Error("unsupported");
        } catch (_) {
          alert(t("validPortalUrlOrBlank"));
          return;
        }
      }
      let manuscriptId = createMode.manuscriptId;
      if (createMode.mode === "new") {
        const newMan = {
          id: "man_" + Math.random().toString(36).substring(2, 9),
          userId: "user",
          projectId: null,
          title: createMode.title,
          shortTitle: null,
          manuscriptType: "article",
          status: "submitted",
          abstract: "",
          keywords: [],
          authors: firstAuthor ? [firstAuthor] : [],
          firstAuthor: firstAuthor || null,
          correspondingAuthors: [],
          targetJournals: [createMode.targetJournal],
          currentVersion: "1.0",
          plannedFigures: [],
          notes: "Created inline while tracking a new submission",
          externalManuscriptId: null,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.manuscripts.push(newMan);
        manuscriptId = newMan.id;
      }
      const linkedManuscript = db.manuscripts.find((m) => m.id === manuscriptId);
      if (linkedManuscript && firstAuthor) {
        linkedManuscript.firstAuthor = firstAuthor;
        linkedManuscript.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      const newSub = {
        id: "sub_" + Math.random().toString(36).substring(2, 9),
        userId: "user",
        manuscriptId,
        projectId: db.manuscripts.find((m) => m.id === manuscriptId)?.projectId || null,
        targetJournal: createMode.targetJournal,
        journalUrl: journalUrl || null,
        doi: null,
        articleUrl: null,
        status: "submitted",
        submissionDate: dateInputToIso(subDate),
        decisionDate: null,
        revisionDueDate: null,
        firstDecisionDate: null,
        complianceChecklist: {},
        reviewMatrix: [],
        timelineNodes: [],
        externalManuscriptId: null,
        firstAuthor: firstAuthor || null,
        captureProvenance: null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      normalizeSubmissionTimeline(newSub);
      db.submissions.push(newSub);
      syncManuscriptStatusFromSubmission(newSub);
      setSelectedSubmissionId(newSub.id);
      await w.storage.saveAll(db);
      closeModal();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      showGlobalToast(t("submissionAddedToast"), "success");
    });
  }
  var init_modals_and_creation = __esm({
    "src/modules/submissions-view/modals-and-creation.ts"() {
      "use strict";
      init_list_and_portals();
      init_details_renderer();
      init_submission_state();
    }
  });

  // src/modules/submissions-view/details-renderer.ts
  function renderSubmissionDetails(sub) {
    const w = window;
    clearSubmissionAutoSave();
    sub.status = normalizeSubmissionStatus(sub.status);
    normalizeSubmissionTimeline(sub);
    const detailPanel = document.getElementById("submission-detail-panel");
    if (!detailPanel) return;
    const man = (db.manuscripts || []).find((m) => m.id === sub.manuscriptId);
    const project = (db.projects || []).find((item) => item.id === (sub.projectId || man?.projectId)) || null;
    const relationship = w.RFUI.buildSubmissionRelationshipSummary({
      submission: sub,
      manuscript: man,
      project,
      records: db.researchRecords || []
    });
    const manuscriptTitle = man ? man.title : sub.title || t("untitledManuscript");
    const manAbstract = man ? man.abstract || "" : "";
    const firstAuthor = getSubmissionFirstAuthor(sub, man);
    const journalName = getSubmissionJournalName(sub);
    const submissionJournalUrl = sub.journalUrl || sub.submissionUrl || "";
    const submissionDoi = getSubmissionDoi(sub);
    const articleUrl = getSubmissionArticleUrl(sub);
    const timelineAnalysis = analyzeSubmission(sub);
    const timelineSubmissionDate = normalizeDateString(sub.submissionDate || timelineAnalysis.submitDate);
    const timelineFirstDecisionDate = normalizeDateString(sub.firstDecisionDate || timelineAnalysis.r1Date);
    const timelineRevisionDueDate = normalizeDateString(sub.revisionDueDate);
    const timelineDecisionDate = normalizeDateString(sub.decisionDate || timelineAnalysis.acceptDate || timelineAnalysis.onlineDate);
    const statusText = getSubmissionStatusLabel(sub.status || "submitted");
    const statusBadgeClass = w.RFUI.getSubmissionStatusBadgeClass(sub.status || "submitted");
    const cycle = getSubmissionCycleTime(sub);
    const cycleTimeHtml = buildCycleTimeCardHtml(cycle);
    const countdownPillHtml = buildCountdownPillHtml(sub);
    w.RFUI.setHTML(detailPanel, `
    <div class="submission-detail-hero">
      <div class="submission-detail-heading">
        <span class="submission-detail-kicker">${escapeHTML(t("submissionDetailKicker"))}</span>
        <h2>${escapeHTML(journalName)}</h2>
        ${sub.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:11px; font-weight:600; width:fit-content; margin-top:3px;">ID: ${escapeHTML(sub.externalManuscriptId)}</span>` : ""}
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <button type="button" class="btn-secondary btn-icon submission-share-button" id="btn-share-sub-journey" title="${escapeHTML(t("shareJourney"))}">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>
        </button>
        <button class="btn-danger btn-icon submission-delete-button" id="btn-delete-sub" title="${escapeHTML(t("deleteSubmissionTitle"))}">
          <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>
    <div class="submission-detail-meta" style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
      <span class="${statusBadgeClass}" data-submission-status-badge="stage">${escapeHTML(t("currentStageLabel"))}: ${escapeHTML(statusText)}</span>
      ${countdownPillHtml}
      <span class="recent-item-date">${escapeHTML(t("trackedSinceLabel"))}: ${sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : t("noDate")}</span>
    </div>
    ${buildWorkflowContextCardHtml(relationship)}
    ${buildEditorPanelHtml({ sub, man, manuscriptTitle, firstAuthor, journalName, submissionJournalUrl, submissionDoi, articleUrl, statusText, statusBadgeClass, timelineSubmissionDate, timelineFirstDecisionDate, timelineRevisionDueDate, timelineDecisionDate, timelineAnalysis })}
    <div class="glass-card submission-action-card" style="margin-top: 12px;">
      <div class="submission-action-copy">
        <span class="submission-action-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 12h14"/><path d="m12 6 6 6-6 6"/><path d="M4 5v14"/></svg></span>
        <div><h3>${t("transferToJournal")}</h3><p>${escapeHTML(t("transferRoundHelp"))}</p></div>
      </div>
      <div class="submission-action-buttons">
        <button class="btn-secondary" id="btn-mark-sub-rejected"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/></svg><span>${t("markRejected")}</span></button>
        <button class="btn-primary" id="btn-transfer-submission"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11v11"/><path d="M18 7 6 19"/></svg><span>${t("transferToJournal")}</span></button>
      </div>
    </div>
    ${cycleTimeHtml}
    <div class="glass-card submission-work-card submission-readonly-review-card" style="margin-top: 16px;">
      <div class="submission-work-head">
        <div class="submission-work-title">
          <span class="submission-work-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg></span>
          <div><h3>${escapeHTML(t("savedReviewPreviewTitle"))}</h3><p>${escapeHTML(t("savedReviewPreviewHelp"))}</p></div>
        </div>
        <div class="submission-work-actions">
          ${man?.zoteroItemKey ? `<button class="btn-secondary submission-work-button" id="btn-sync-submission-to-zotero" title="${escapeHTML(currentLanguage === "zh" ? "同步审稿回复与修回矩阵至 Zotero 笔记" : "Sync Review & Rebuttal Matrix to Zotero Note")}"><svg class="svg-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg><span>${escapeHTML(currentLanguage === "zh" ? "同步至 Zotero 笔记" : "Sync to Zotero Note")}</span></button>` : ""}
          <button class="btn-secondary submission-work-button" id="btn-export-rebuttal-table"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>${escapeHTML(t("exportTable"))}</span></button>
        </div>
      </div>
      <div class="submission-review-preview" id="submission-review-preview"></div>
    </div>
  `);
    detailPanel.dataset.rfRenderVersion = typeof RF_OPTIONS_RENDER_VERSION !== "undefined" ? RF_OPTIONS_RENDER_VERSION : "16.4.0";
    detailPanel.dataset.rfEditorMounted = "true";
    detailPanel.dataset.currentSubmissionId = sub.id;
    detailPanel.scrollTop = 0;
    bindSubmissionDetailListeners(sub, man);
    const checklistKeys = getSubmissionChecklistKeys(sub);
    renderSubmissionChecklistEditor(sub, checklistKeys);
    renderSubmissionReviewMatrixEditor(sub, manAbstract);
    renderSubmissionReviewPreview(sub, checklistKeys);
    setupSubmissionAutoSave(sub);
  }
  function buildCountdownPillHtml(sub) {
    const w = window;
    if (!sub.revisionDueDate) return "";
    const cd = w.RFCalendar?.getRevisionCountdownMeta ? w.RFCalendar.getRevisionCountdownMeta(sub.revisionDueDate) : null;
    if (!cd) return "";
    return `
    <span class="${escapeHTML(cd.badgeClass)}" id="btn-export-submission-ics" style="display:inline-flex; align-items:center; gap:5px; font-weight:600; cursor:pointer; padding:2px 8px; border-radius:4px;" title="${escapeHTML(currentLanguage === "zh" ? "点击导出修回截止日历提醒 (.ics)" : "Click to export revision deadline (.ics)")}">
      <span>${escapeHTML(cd.icon)} ${escapeHTML(cd.text)}</span>
      <span style="font-size:10px; opacity:0.85; text-decoration:underline;">📅 .ics</span>
    </span>
  `;
  }
  function buildCycleTimeCardHtml(cycle) {
    const cardClass = cycle.isCompleted ? "submission-cycle-card-complete" : "submission-cycle-card-active";
    const icon = cycle.isCompleted ? '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>' : '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';
    const label = t(cycle.isCompleted ? "cycleTimeCompleted" : "submissionCycleTracking");
    const text = cycle.isCompleted ? tf("cycleTimeCompletedText", { start: `<strong>${escapeHTML(cycle.startDateStr)}</strong>`, end: `<strong>${escapeHTML(cycle.endDateStr)}</strong>`, days: `<strong>${cycle.days}</strong>` }) : tf("submissionCycleText", { start: `<strong>${escapeHTML(cycle.startDateStr)}</strong>`, days: `<strong>${cycle.days}</strong>` });
    return `
    <div class="submission-cycle-card ${cardClass}" data-submission-cycle-card>
      <span class="submission-cycle-icon" aria-hidden="true">${icon}</span>
      <div class="submission-cycle-copy"><span class="submission-cycle-label" data-submission-cycle-label>${escapeHTML(label)}</span><span data-submission-cycle-text>${text}</span></div>
    </div>
  `;
  }
  function buildWorkflowContextCardHtml(relationship) {
    return `
    <div class="glass-card workflow-context-card" data-submission-workflow-context="true">
      <div class="workflow-context-head">
        <div class="submission-work-title">
          <span class="submission-work-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M5 8h14"/><path d="M5 16h14"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/></svg></span>
          <div><h3>${escapeHTML(t("workflowContextTitle"))}</h3></div>
        </div>
        <div class="workflow-context-actions">
          ${relationship.isOrphanSubmission ? `<span class="badge badge-warning">${escapeHTML(t("workflowNeedsLinking"))}</span><button type="button" class="btn-secondary workflow-link-button" id="btn-link-submission-manuscript">${escapeHTML(t("linkManuscript"))}</button>` : `<span class="badge badge-success">${escapeHTML(t("workflowLinkedFlow"))}</span>`}
          <button type="button" class="btn-secondary workflow-edit-summary-button" id="btn-focus-edit-center" aria-controls="submission-entry-editor-panel"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg><span>${escapeHTML(t("jumpToEditor"))}</span></button>
        </div>
      </div>
      <div class="workflow-context-grid">
        <div class="workflow-context-item"><span>${escapeHTML(t("workflowManuscriptLabel"))}</span><strong>${escapeHTML(relationship.manuscriptTitle)}</strong></div>
        <div class="workflow-context-item"><span>${escapeHTML(t("workflowTimelineLabel"))}</span><strong>${relationship.completedTimelineNodeCount}/${relationship.timelineNodeCount}</strong></div>
        <div class="workflow-context-item"><span>${escapeHTML(t("workflowReviewerCommentsLabel"))}</span><strong>${relationship.reviewerCommentCount}</strong></div>
      </div>
    </div>
  `;
  }
  function buildEditorPanelHtml(d) {
    return `
    <div class="glass-card submission-edit-center submission-entry-editor-card" id="submission-entry-editor-panel" data-side-entry-editor="true">
      <div class="submission-edit-center-head">
        <div class="submission-edit-title-row">
          <span class="submission-edit-emblem" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="18" x2="13" y2="18"/></svg></span>
          <div><h3>${escapeHTML(t("submissionEntryEditorTitle"))}</h3><p>${escapeHTML(t("submissionEntryEditorHelp"))}</p></div>
        </div>
        <div class="submission-edit-badges">
          <span class="badge badge-purple">${escapeHTML(d.man ? t("linkedManuscriptBadge") : t("detachedSubmissionBadge"))}</span>
          <span class="${d.statusBadgeClass}" data-submission-status-badge="editor">${escapeHTML(d.statusText)}</span>
          ${d.articleUrl ? `<a class="doi-link" href="${escapeHTML(d.articleUrl)}" target="_blank" rel="noopener noreferrer">${t("articlePage")}</a>` : ""}
          ${d.man?.zoteroItemKey ? `
            <span class="zotero-card-badge" id="sub-detail-zotero-badge" data-item-key="${escapeHTML(d.man.zoteroItemKey)}" title="${escapeHTML(currentLanguage === "zh" ? "在 Zotero 文献库中选中此条目" : "Select in Zotero library")}"><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>Zotero</span>
            ${d.man.citekey ? `<span class="zotero-citekey-badge" id="sub-detail-citekey-badge" data-citekey="${escapeHTML(d.man.citekey)}" title="${escapeHTML(currentLanguage === "zh" ? "点击复制 Citation Key" : "Click to copy Citation Key")}">[@${escapeHTML(d.man.citekey)}]</span>` : ""}
            ${d.man.pdfUri ? `<span class="zotero-pdf-badge" id="sub-detail-pdf-badge" data-item-key="${escapeHTML(d.man.zoteroItemKey)}" title="${escapeHTML(currentLanguage === "zh" ? "在 Zotero 阅读器中打开 PDF" : "Open PDF in Zotero reader")}">📖 PDF</span>` : ""}
          ` : ""}
        </div>
      </div>
      <div class="submission-edit-section">
        <div class="submission-edit-section-head"><span class="submission-edit-section-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span><span>${escapeHTML(t("manuscriptSection"))}</span></div>
        <div class="submission-edit-grid submission-edit-grid-identity">
          <div class="form-group submission-edit-title-field"><label>${escapeHTML(t("manuscriptTitleLabel"))}</label><input type="text" id="sub-edit-title" value="${escapeHTML(d.manuscriptTitle)}" placeholder="${escapeHTML(t("paperTitlePlaceholder"))}"></div>
          <div class="form-group"><label>${t("targetJournalInput")}</label><input type="text" id="sub-edit-journal" value="${escapeHTML(d.journalName)}" placeholder="${escapeHTML(t("targetJournalInput"))}"></div>
          <div class="form-group"><label>${escapeHTML(t("externalManuscriptIdLabel") || "稿件编号 (Manuscript ID)")}</label><input type="text" id="sub-edit-external-id" value="${escapeHTML(d.sub.externalManuscriptId || "")}" placeholder="${escapeHTML(t("externalManuscriptIdPlaceholder") || "例如: AFM-2026-08123")}"></div>
          <div class="form-group"><label>${escapeHTML(t("submissionPortalUrl"))}</label><input type="url" id="sub-edit-journal-url" value="${escapeHTML(d.submissionJournalUrl)}" placeholder="https://..."></div>
          <div class="form-group"><label>${t("status")}</label><select id="sub-edit-status">
            <option value="submitted" ${d.sub.status === "submitted" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("submitted"))}</option>
            <option value="under_review" ${d.sub.status === "under_review" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("under_review"))}</option>
            <option value="revision" ${d.sub.status === "revision" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("revision"))}</option>
            <option value="accepted" ${d.sub.status === "accepted" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("accepted"))}</option>
            <option value="published" ${d.sub.status === "published" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("published"))}</option>
            <option value="rejected" ${d.sub.status === "rejected" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("rejected"))}</option>
          </select></div>
        </div>
        <details class="submission-author-details"><summary>${escapeHTML(t("firstAuthorLabel"))}</summary>
          <div class="submission-first-author-module"><div class="submission-first-author-identity"><span class="submission-first-author-index" aria-hidden="true">1</span><div><label for="sub-edit-first-author">${escapeHTML(t("firstAuthorLabel"))}</label><small>${escapeHTML(t("firstAuthorHelp"))}</small></div></div><input type="text" id="sub-edit-first-author" value="${escapeHTML(d.firstAuthor)}" placeholder="${escapeHTML(t("firstAuthorPlaceholder"))}"></div>
        </details>
      </div>
      <div class="submission-edit-section">
        <div class="submission-edit-section-head"><span class="submission-edit-section-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span><span>${escapeHTML(t("reviewTimingSection"))}</span></div>
        <div class="submission-edit-grid submission-edit-grid-dates">
          <div class="form-group"><label>${t("initialSubmissionDate")}</label><input type="date" id="sub-edit-submission-date" value="${escapeHTML(d.timelineSubmissionDate)}"></div>
          <div class="form-group"><label>${t("firstDecisionDate")}</label><input type="date" id="sub-edit-r1-date" value="${escapeHTML(d.timelineFirstDecisionDate)}"></div>
          <div class="form-group"><div style="display:flex; justify-content:space-between; align-items:center;"><label for="sub-edit-revision-due">${t("revisionDueDateLabel")}</label>${d.timelineRevisionDueDate ? `<button type="button" class="btn-secondary" id="btn-editor-due-ics" style="font-size:11px; padding:1px 6px; border-radius:3px; height:20px;" title="${escapeHTML(t("exportCalendarIcs") || "导出修回日历 (.ics)")}">📅 .ics</button>` : ""}</div><input type="date" id="sub-edit-revision-due" value="${escapeHTML(d.timelineRevisionDueDate)}"></div>
          <div class="form-group"><label>${t("completionDate")} / ${t("stateAccepted")}</label><input type="date" id="sub-edit-decision-date" value="${escapeHTML(d.timelineDecisionDate)}"></div>
        </div>
      </div>
      <div class="submission-edit-section">
        <div class="submission-edit-section-head"><span class="submission-edit-section-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.43"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.33-1.33"/></svg></span><span>${escapeHTML(t("publicationSection"))}</span></div>
        <div class="submission-edit-grid submission-edit-grid-publication">
          <div class="form-group"><label>${t("doiLabel")}</label><input type="text" id="sub-edit-doi" value="${escapeHTML(d.submissionDoi)}" placeholder="10.1002/adfm.202528029"></div>
          <div class="form-group"><label>${t("articleUrlLabel")}</label><input type="url" id="sub-edit-article-url" value="${escapeHTML(d.articleUrl)}" placeholder="${t("articleUrlPlaceholder")}"></div>
        </div>
      </div>
      <div class="submission-edit-section submission-edit-checklist-section">
        <div class="submission-edit-section-head submission-edit-section-head-row"><div class="submission-edit-section-title"><span class="submission-edit-section-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span><span>${escapeHTML(t("submissionChecklistSection"))}</span></div></div>
        <div class="submission-checklist-grid submission-edit-checklist-grid" id="sub-edit-compliance-checklist-container"></div>
      </div>
      <div class="submission-edit-section submission-edit-review-section">
        <div class="submission-edit-section-head submission-edit-section-head-row">
          <div class="submission-section-title-group"><div class="submission-edit-section-title"><span class="submission-edit-section-icon" aria-hidden="true"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg></span><span>${escapeHTML(t("peerReviewMatrixSection") || "同行评审回复矩阵")}</span></div><div class="submission-edit-review-help">${escapeHTML(t("reviewEditorHelp") || "审稿意见和作者回复会在填写时自动保存。")}</div></div>
          <div class="submission-section-actions">
            <button type="button" class="btn-secondary submission-work-button" id="btn-batch-import-reviews"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg><span>${escapeHTML(t("smartBatchImport") || "智能批量导入")}</span></button>
            <button type="button" class="btn-primary submission-work-button" id="btn-add-review-comment"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>${escapeHTML(t("addComment") || "添加审稿意见")}</span></button>
          </div>
        </div>
        <div id="sub-edit-rebuttal-progress-container"></div>
        <div class="submission-edit-review-container" id="sub-edit-review-matrix-container"></div>
      </div>
      <div class="submission-edit-savebar">
        <p>${escapeHTML(t("timelineDateSource"))}: ${escapeHTML(d.timelineAnalysis.submitDateSource)}. ${escapeHTML(t("publicationLinksKept"))}</p>
        <div class="submission-autosave-status" data-submission-autosave-status data-state="saved" role="status" aria-live="polite"><span class="submission-autosave-dot" aria-hidden="true"></span><span data-submission-autosave-label>${escapeHTML(t("autoSaveSaved"))}</span></div>
      </div>
    </div>
  `;
  }
  function bindSubmissionDetailListeners(sub, man) {
    const w = window;
    const journalName = getSubmissionJournalName(sub);
    document.getElementById("btn-link-submission-manuscript")?.addEventListener("click", () => openLinkSubmissionModal(sub));
    document.getElementById("btn-focus-edit-center")?.addEventListener("click", (e) => {
      e.preventDefault();
      focusSubmissionEditCenter();
    });
    document.getElementById("btn-mark-sub-rejected")?.addEventListener("click", async () => {
      if (!confirm(t("confirmMarkRejected"))) return;
      markSubmissionRejected(sub, todayString());
      syncManuscriptStatusFromSubmission(sub);
      await w.storage.saveAll(db);
      renderDashboard();
      renderKanban();
      renderSubmissions();
      renderSubmissionDetails(sub);
      showGlobalToast(t("rejectedToast"), "success");
    });
    document.getElementById("btn-share-sub-journey")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const shareFn = w.openSubmissionSharePreview || w.openSubmissionShareModal;
      if (typeof shareFn === "function") shareFn(sub.id, e.currentTarget);
    });
    document.getElementById("btn-transfer-submission")?.addEventListener("click", () => openTransferSubmissionModal(sub));
    document.getElementById("btn-delete-sub")?.addEventListener("click", async () => {
      if (confirm(t("confirmDeleteSubmission"))) {
        w.storage.recordEntityDeletion(db, "submissions", sub.id);
        syncManuscriptStatusesFromSubmissions(db);
        setSelectedSubmissionId(null);
        await w.storage.saveAll(db);
        renderDashboard();
        renderKanban();
        renderSubmissions();
        w.RFUI.setHTML(document.getElementById("submission-detail-panel"), `
        <div class="empty-state"><svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg><h3>${escapeHTML(t("submissionEmptyDetail"))}</h3></div>
      `);
      }
    });
    document.getElementById("btn-sync-submission-to-zotero")?.addEventListener("click", async () => {
      if (typeof ZoteroBridge !== "undefined" && man?.zoteroItemKey) {
        const btn = document.getElementById("btn-sync-submission-to-zotero");
        if (btn) btn.disabled = true;
        try {
          const ok = await ZoteroBridge.syncNote(man.zoteroItemKey, man.zoteroLibraryID);
          showGlobalToast(ok ? currentLanguage === "zh" ? "已成功同步审稿记录与修回矩阵至 Zotero 笔记" : "Successfully synced review & rebuttal matrix to Zotero note" : currentLanguage === "zh" ? "同步至 Zotero 笔记失败" : "Failed to sync to Zotero note", ok ? "success" : "error");
        } catch (e) {
          showGlobalToast(String(e.message || e), "error");
        }
        setTimeout(() => {
          if (btn) btn.disabled = false;
        }, 1200);
      }
    });
    const detailPanel = document.getElementById("submission-detail-panel");
    detailPanel?.querySelector("#sub-detail-zotero-badge")?.addEventListener("click", () => {
      if (man?.zoteroItemKey && typeof ZoteroBridge !== "undefined") ZoteroBridge.selectItemInZotero(man.zoteroItemKey, man.zoteroLibraryID);
    });
    detailPanel?.querySelector("#sub-detail-citekey-badge")?.addEventListener("click", () => {
      if (man?.citekey && typeof ZoteroBridge !== "undefined") ZoteroBridge.copyText(`[@${man.citekey}]`, currentLanguage === "zh" ? `已复制 Citation Key: [@${man.citekey}]` : `Copied Citation Key: [@${man.citekey}]`);
    });
    detailPanel?.querySelector("#sub-detail-pdf-badge")?.addEventListener("click", () => {
      if (man?.zoteroItemKey && typeof ZoteroBridge !== "undefined") ZoteroBridge.openPdf(man.zoteroItemKey, null, man.zoteroLibraryID);
    });
    const triggerSubIcs = () => {
      if (!sub.revisionDueDate) {
        showGlobalToast(currentLanguage === "zh" ? "请先设置修回截止日期" : "Please set revision due date first", "warning");
        return;
      }
      if (w.RFCalendar?.generateSubmissionCalendarFeed && w.RFCalendar?.triggerCalendarDownload) {
        const feed = w.RFCalendar.generateSubmissionCalendarFeed([sub], db.manuscripts, { calName: `${journalName} Revision Deadline` });
        w.RFCalendar.triggerCalendarDownload(feed, `revision_deadline_${sub.id}.ics`);
        showGlobalToast(t("calendarExportedToast") || (currentLanguage === "zh" ? "修回截止日历 (.ics) 已导出！" : "Revision deadline calendar (.ics) exported."), "success");
      }
    };
    detailPanel?.querySelector("#btn-export-submission-ics")?.addEventListener("click", triggerSubIcs);
    detailPanel?.querySelector("#btn-editor-due-ics")?.addEventListener("click", triggerSubIcs);
    document.getElementById("btn-export-rebuttal-table")?.addEventListener("click", () => openAcademicRebuttalExportModal(sub, man));
  }
  var init_details_renderer = __esm({
    "src/modules/submissions-view/details-renderer.ts"() {
      "use strict";
      init_autosave_and_editor();
      init_checklist_and_matrix();
      init_list_and_portals();
      init_rebuttal_export_modal();
      init_modals_and_creation();
      init_submission_state();
    }
  });

  // src/modules/submissions-view.ts
  var require_submissions_view = __commonJS({
    "src/modules/submissions-view.ts"(exports, module) {
      init_submission_state();
      init_autosave_and_editor();
      init_editor_sync();
      init_checklist_and_matrix();
      init_list_and_portals();
      init_details_renderer();
      init_rebuttal_export_modal();
      init_modals_and_creation();
      setupJournalPortalListeners();
      bindTrackSubmissionButton();
      setupSubmissionSearch();
      var exportedApi = {
        selectedSubmissionId,
        submissionAutoSaveCleanup,
        setSelectedSubmissionId,
        clearSubmissionAutoSave,
        focusSubmissionEditCenter,
        canLeaveSubmissionEditor,
        openSubmissionForEditing,
        navigateToSubmissionDetails,
        getDefaultSubmissionChecklistKeys,
        getSubmissionChecklistKeys,
        getSubmissionReviewMatrixRows,
        collectSubmissionChecklistFromEditor,
        collectSubmissionChecklistKeysFromEditor,
        collectSubmissionReviewMatrixFromEditor,
        createSubmissionReviewEditorRow,
        reindexSubmissionReviewEditorRows,
        renderSubmissionChecklistEditor,
        renderSubmissionReviewMatrixEditor,
        renderSubmissionReviewPreview,
        getSubmissionEditValues,
        applySubmissionEditSync,
        refreshSubmissionStatusPresentation,
        saveSubmissionEditFromValues,
        setupSubmissionAutoSave,
        setupSubmissionSearch,
        applySubmissionSearch,
        renderSubmissions,
        renderJournalPortals,
        openJournalPortalEditor,
        setupJournalPortalListeners,
        openLinkSubmissionModal,
        escapeLatexText,
        safeEscapeLatex,
        copyRebuttalRichText,
        generateAcademicRebuttalLetter,
        parseReviewCommentsBatch,
        renderRebuttalProgressTracker,
        generateRevisionCoverLetter,
        openBatchReviewImportModal,
        renderSubmissionDetails,
        openAcademicRebuttalExportModal,
        openTransferSubmissionModal,
        openTrackSubmissionModal
      };
      var g2 = typeof globalThis !== "undefined" ? globalThis : window;
      Object.assign(g2, exportedApi);
      if (typeof window !== "undefined") {
        Object.assign(window, exportedApi);
        window.RFAcademicExport = window.RFAcademicExport || {
          generateAcademicRebuttalLetter,
          generateRevisionCoverLetter,
          parseReviewCommentsBatch,
          renderRebuttalProgressTracker,
          escapeLatexText,
          safeEscapeLatex,
          copyRebuttalRichText,
          openBatchReviewImportModal
        };
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          ...module.exports || {},
          ...exportedApi
        };
      }
    }
  });
  require_submissions_view();
})();
