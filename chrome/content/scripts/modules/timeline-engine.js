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

  // src/modules/timeline-engine/event-manager.ts
  function buildTimelineEventManager(sub, { inModal = false } = {}) {
    const sortedNodes = autoSortNodes(sub.timelineNodes || []);
    if (sortedNodes.length === 0) return "";
    const items = sortedNodes.map((node) => {
      const computedStatus = computeNodeStatus(node);
      const dateStr = getNodeDate(node);
      const shortDate = dateStr ? formatShortDate(dateStr) : t("noDate");
      const dueSummary = node.dueDate ? ` · ${t("deadlineShort")} ${formatShortDate(node.dueDate)}` : "";
      const decisionSummary = node.reviewDecision ? ` · ${node.reviewDecision === "major" ? t("majorRevision") : t("minorRevision")}` : "";
      const dateSummary = `${shortDate}${dueSummary}${decisionSummary}`;
      const typeClass = `type-${node.type || "research"}`;
      return `
      <div class="timeline-event-chip status-${computedStatus} ${typeClass}" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}">
        <button class="timeline-event-main btn-event-edit" type="button" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}" title="${escapeHTML(t("clickEditEvent"))}">
          <span class="timeline-event-dot"></span>
          <span class="timeline-event-text">
            <strong>${escapeHTML(getTimelineNodeDisplayName(node))}</strong>
            <small>${escapeHTML(dateSummary)} · ${escapeHTML(getNodeStatusLabel(computedStatus))}</small>
          </span>
        </button>
        <button class="timeline-event-delete btn-event-delete" type="button" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}" title="${escapeHTML(t("delete"))}">×</button>
      </div>
    `;
    }).join("");
    return `
    <div class="timeline-event-manager ${inModal ? "modal-event-manager" : ""}">
      <div class="timeline-event-manager-head">${t("timelineEvents")}</div>
      <div class="timeline-event-list">${items}</div>
    </div>
  `;
  }
  function openTimelineEventManager(subId) {
    const sub = db.submissions.find((s) => s.id === subId);
    if (!sub) {
      showGlobalToast(t("submissionNotFound"), "error");
      return;
    }
    openModal(`
    <div class="modal-header">
      <h2>${t("timelineEvents")}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="${escapeHTML(t("close"))}">✕</button>
    </div>
    ${buildTimelineEventManager(sub, { inModal: true }) || `<p class="empty-state">${t("noEventYet")}</p>`}
    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-footer-close-events">${escapeHTML(t("close") || "关闭")}</button>
    </div>
  `);
    document.getElementById("btn-footer-close-events")?.addEventListener("click", closeModal);
    modalContent.querySelectorAll(".btn-event-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        closeModal();
        openStageDrawer(btn.getAttribute("data-sub-id"), btn.getAttribute("data-node-id"));
      });
    });
    modalContent.querySelectorAll(".btn-event-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const latestSub = db.submissions.find((s) => s.id === btn.getAttribute("data-sub-id"));
        const nodeId = btn.getAttribute("data-node-id");
        const node = latestSub?.timelineNodes?.find((n) => n.id === nodeId);
        if (!latestSub || !node) {
          showGlobalToast(t("eventNotFound"), "error");
          closeModal();
          renderDashboard();
          return;
        }
        if (!confirm(tf("confirmDeleteEvent", { name: getTimelineNodeDisplayName(node) }))) return;
        deleteTimelineNode(latestSub, nodeId);
        syncManuscriptStatusFromSubmission(latestSub);
        const w = window;
        await w.storage.saveAll(db);
        closeModal();
        renderDashboard();
        renderKanban();
        renderSubmissions();
        showGlobalToast(t("eventRemovedToast"), "success");
      });
    });
  }
  function deleteTimelineNode(sub, nodeId) {
    if (!sub || !Array.isArray(sub.timelineNodes)) return null;
    const node = sub.timelineNodes.find((n) => n.id === nodeId);
    if (!node) return null;
    const key = inferKey(node);
    sub.timelineNodes = sub.timelineNodes.filter((n) => n.id !== nodeId);
    if (key === "submit") {
      sub.submissionDate = null;
      if (sub.status === "submitted") sub.status = "under_review";
    } else if (key === "r1_comments") {
      sub.firstDecisionDate = null;
      sub.revisionDueDate = null;
      if (sub.status === "revision") sub.status = "under_review";
    } else if (key === "accept" || key === "online") {
      sub.decisionDate = null;
      sub.acceptedAt = null;
      sub.publishedAt = null;
      if (sub.status === "accepted" || sub.status === "published") {
        sub.status = getTimelineNodeByKey(sub, "r1_comments") ? "revision" : "under_review";
      }
      clearPublicationLinkFields(sub);
      clearPublicationTimelineCompletion(sub);
    } else if (key === "rejected") {
      sub.rejectedAt = null;
      sub.rejectionNote = "";
      if (sub.status === "rejected") {
        sub.status = getTimelineNodeByKey(sub, "r1_comments") ? "revision" : "under_review";
      }
    }
    sub.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return node;
  }
  var init_event_manager = __esm({
    "src/modules/timeline-engine/event-manager.ts"() {
      "use strict";
    }
  });

  // src/modules/timeline-engine/drawer-and-manager.ts
  function getTimelineTypeMeta(type) {
    const meta = typeMeta[type] || typeMeta.special;
    return { ...meta, label: t(meta.labelKey || "eventTypeSpecial") };
  }
  function buildOptions(options, selectedValue) {
    return options.map((option) => {
      const value = typeof option === "string" ? option : option.value;
      const label = typeof option === "string" ? option : option.label;
      return `<option value="${escapeHTML(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHTML(label)}</option>`;
    }).join("");
  }
  function openStageDrawer2(subId, nodeId) {
    const sub = db.submissions.find((s) => s.id === subId);
    const node = sub?.timelineNodes?.find((n) => n.id === nodeId);
    if (!sub || !node) return;
    if (typeof document !== "undefined" && typeof document.querySelectorAll === "function") {
      const activeChips = document.querySelectorAll(`.timeline-event-chip[data-sub-id="${subId}"][data-node-id="${nodeId}"], .dot.interactive-dot[data-sub-id="${subId}"][data-node-id="${nodeId}"]`);
      activeChips.forEach((chip) => chip.classList?.add?.("is-editing"));
      if (typeof registerModalCleanup === "function") {
        registerModalCleanup(() => {
          activeChips.forEach((chip) => chip.classList?.remove?.("is-editing"));
        });
      }
    }
    const displayName = getTimelineNodeDisplayName(node);
    const eventDate = normalizeDateString(node.completeDate || node.planDate || (node.type !== "review" ? node.dueDate : ""));
    const deadlineDate = normalizeDateString(node.dueDate || (inferKey(node) === "r1_comments" ? sub.revisionDueDate : ""));
    const reviewDecision = node.reviewDecision || sub.reviewDecision || "";
    const typeOptions = [
      { value: "research", label: t("eventTypeResearch") },
      { value: "writing", label: t("eventTypeWriting") },
      { value: "submission", label: t("eventTypeSubmission") },
      { value: "review", label: t("eventTypeReview") },
      { value: "revision", label: t("eventTypeRevision") },
      { value: "rejection", label: t("statusRejected") },
      { value: "publication", label: t("eventTypePublication") },
      { value: "special", label: t("specialException") }
    ];
    const statusOptions = [
      { value: "pending", label: t("statusPlannedNotStarted") },
      { value: "active", label: t("statusInProgress") },
      { value: "completed", label: t("statusCompleted") },
      { value: "blocked", label: t("statusBlockedException") }
    ];
    const keyOptions = [
      { value: "auto", label: t("keyAuto") },
      { value: "experiment_start", label: t("keyExperimentsStarted") },
      { value: "experiment_done", label: t("keyExperimentsDone") },
      { value: "draft_done", label: t("keyDraftDone") },
      { value: "submit", label: t("keySubmitted") },
      { value: "r1_comments", label: t("keyR1Comments") },
      { value: "r1_revised", label: t("keyR1Resubmitted") },
      { value: "r2_comments", label: t("keyR2Comments") },
      { value: "r2_revised", label: t("keyR2Resubmitted") },
      { value: "accept", label: t("keyAccepted") },
      { value: "online", label: t("keyOnlinePublished") },
      { value: "rejected", label: t("statusRejected") }
    ];
    openModal(`
    <div class="modal-header">
      <h2>${t("editTimelineEvent")}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="${escapeHTML(t("close"))}">✕</button>
    </div>

    <div class="form-group">
      <label>${t("eventName")}</label>
      <input type="text" id="drawer-name" value="${escapeHTML(displayName)}">
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div class="form-group">
        <label>${t("type")}</label>
        <select id="drawer-type">
          ${buildOptions(typeOptions, node.type)}
        </select>
      </div>
      <div class="form-group">
        <label>${t("status")}</label>
        <select id="drawer-status">
          ${buildOptions(statusOptions, node.status === "danger" ? "blocked" : node.status)}
        </select>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
      <div class="form-group">
        <label>${t("keyEventMapping")}</label>
        <select id="drawer-key">
          ${buildOptions(keyOptions, node.key || "auto")}
        </select>
      </div>
      <div class="form-group">
        <label>${t("eventDate")}</label>
        <input type="date" id="drawer-date" value="${eventDate}">
      </div>
      <div class="form-group">
        <label>${t("eventDeadline")}</label>
        <input type="date" id="drawer-deadline" value="${deadlineDate}">
      </div>
    </div>

    <div class="form-group">
      <label>${t("reviewDecision")}</label>
      <select id="drawer-decision">
        ${buildOptions([
      { value: "", label: t("noReviewDecision") },
      { value: "major", label: t("majorRevision") },
      { value: "minor", label: t("minorRevision") }
    ], reviewDecision)}
      </select>
    </div>

    <div class="text-muted" style="font-size:11px; margin:-4px 0 12px;">
      ${t("eventDateHelp")}
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">
      <button class="btn-secondary btn-sm" id="quick-plan-today" type="button">${t("setToday")}</button>
      <button class="btn-secondary btn-sm" id="quick-due-14" type="button">${t("due14")}</button>
      <button class="btn-secondary btn-sm" id="quick-active" type="button">${t("markActive")}</button>
      <button class="btn-secondary btn-sm" id="quick-done-today" type="button">${t("markDoneToday")}</button>
      <button class="btn-secondary btn-sm" id="quick-clear-dates" type="button">${t("clearDate")}</button>
    </div>

    <div class="form-group">
      <label>${t("notes")}</label>
      <textarea id="drawer-notes" rows="3" placeholder="${escapeHTML(t("notesPlaceholder"))}">${escapeHTML(node.notes || "")}</textarea>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:16px;">
      <button class="btn-danger" id="btn-delete-stage" type="button" style="width:auto; padding:8px 14px;">${t("delete")}</button>
      <button class="btn-primary" id="btn-save-stage" type="button" style="flex:1; margin-top:0;">${t("saveChanges")}</button>
    </div>
  `);
    document.getElementById("quick-plan-today")?.addEventListener("click", () => {
      document.getElementById("drawer-date").value = todayString();
    });
    document.getElementById("quick-due-14")?.addEventListener("click", () => {
      const base = document.getElementById("drawer-date").value || todayString();
      document.getElementById("drawer-deadline").value = addDays(base, 14);
      document.getElementById("drawer-type").value = "review";
      document.getElementById("drawer-status").value = "active";
    });
    document.getElementById("quick-active")?.addEventListener("click", () => {
      document.getElementById("drawer-status").value = "active";
    });
    document.getElementById("quick-done-today")?.addEventListener("click", () => {
      document.getElementById("drawer-date").value = todayString();
      document.getElementById("drawer-status").value = "completed";
    });
    document.getElementById("quick-clear-dates")?.addEventListener("click", () => {
      document.getElementById("drawer-date").value = "";
      document.getElementById("drawer-deadline").value = "";
    });
    document.getElementById("btn-save-stage")?.addEventListener("click", async () => {
      const latestSub = db.submissions.find((s) => s.id === subId);
      const latestNode = latestSub?.timelineNodes?.find((n) => n.id === nodeId);
      if (!latestSub || !latestNode) {
        showGlobalToast(t("eventNotFound"), "error");
        closeModal();
        renderDashboard();
        return;
      }
      const name = document.getElementById("drawer-name").value.trim();
      if (!name) {
        alert(t("eventNameRequired"));
        return;
      }
      const nextType = document.getElementById("drawer-type").value;
      const nextStatus = document.getElementById("drawer-status").value;
      const nextKey = document.getElementById("drawer-key").value;
      const selectedDate = document.getElementById("drawer-date").value;
      const selectedDeadline = normalizeDateString(document.getElementById("drawer-deadline")?.value || "");
      const selectedDecision = document.getElementById("drawer-decision")?.value || "";
      const isReview = nextType === "review" || nextKey === "r1_comments" || nextKey === "r2_comments";
      if (isReview && !selectedDeadline && !selectedDecision) {
        alert(t("reviewDeadlineOrDecisionRequired"));
        document.getElementById("drawer-deadline")?.focus();
        return;
      }
      latestNode.name = name;
      latestNode.type = nextType;
      latestNode.status = nextStatus;
      latestNode.key = nextKey;
      latestNode.planDate = nextStatus === "pending" ? selectedDate : "";
      latestNode.dueDate = isReview ? selectedDeadline : nextStatus === "active" || nextStatus === "blocked" ? selectedDeadline || selectedDate : "";
      latestNode.completeDate = isReview ? selectedDate : nextStatus === "completed" ? selectedDate : "";
      latestNode.reviewDecision = isReview ? selectedDecision : "";
      latestNode.notes = document.getElementById("drawer-notes").value.trim();
      latestNode.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      const mappedKey = inferKey(latestNode);
      if (selectedDate) {
        applyInlineEventToSubmission(latestSub, mappedKey, selectedDate, latestNode.notes);
      }
      if (isReview) {
        latestSub.revisionDueDate = selectedDeadline ? dateInputToIso(selectedDeadline) : null;
        latestSub.reviewDecision = selectedDecision;
      }
      normalizeSubmissionTimeline(latestSub);
      syncManuscriptStatusFromSubmission(latestSub);
      await window.storage.saveAll(db);
      closeModal();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      showGlobalToast(tf("eventSavedToast", { name: getTimelineNodeDisplayName(latestNode) }), "success");
    });
    document.getElementById("btn-delete-stage")?.addEventListener("click", async () => {
      const latestSub = db.submissions.find((s) => s.id === subId);
      const latestNode = latestSub?.timelineNodes?.find((n) => n.id === nodeId);
      if (!latestSub || !latestNode) {
        showGlobalToast(t("eventNotFound"), "error");
        closeModal();
        renderDashboard();
        return;
      }
      if (!confirm(tf("confirmDeleteEvent", { name: getTimelineNodeDisplayName(latestNode) }))) return;
      deleteTimelineNode(latestSub, nodeId);
      syncManuscriptStatusFromSubmission(latestSub);
      await window.storage.saveAll(db);
      closeModal();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      showGlobalToast(t("eventRemovedToast"), "success");
    });
  }
  var g, typeMeta;
  var init_drawer_and_manager = __esm({
    "src/modules/timeline-engine/drawer-and-manager.ts"() {
      "use strict";
      init_event_manager();
      g = typeof globalThis !== "undefined" ? globalThis : window;
      typeMeta = {
        research: { labelKey: "eventTypeResearch", color: "#2563eb" },
        writing: { labelKey: "eventTypeWriting", color: "#0f766e" },
        submission: { labelKey: "eventTypeSubmission", color: "#f97316" },
        review: { labelKey: "eventTypeReview", color: "#dc2626" },
        revision: { labelKey: "eventTypeRevision", color: "#d97706" },
        rejection: { labelKey: "statusRejected", color: "#dc2626" },
        publication: { labelKey: "eventTypePublication", color: "#16a34a" },
        special: { labelKey: "eventTypeSpecial", color: "#334155" }
      };
      g.typeMeta = typeMeta;
      g.getTimelineTypeMeta = getTimelineTypeMeta;
    }
  });

  // src/modules/timeline-engine/inline-editor.ts
  function getInlineEventPresets() {
    return [
      { key: "submit", label: t("defaultManuscriptSubmitted"), name: "Manuscript Submitted", type: "submission" },
      { key: "r1_comments", label: t("defaultReviewCommentsR1"), name: "Review Comments R1", type: "review" },
      { key: "r1_revised", label: t("defaultR1RevisionSubmitted"), name: "R1 Revision Submitted", type: "revision" },
      { key: "r2_comments", label: t("defaultReviewCommentsR2"), name: "Review Comments R2", type: "review" },
      { key: "r2_revised", label: t("defaultR2RevisionSubmitted"), name: "R2 Revision Submitted", type: "revision" },
      { key: "accept", label: t("defaultAccepted"), name: "Accepted", type: "publication" },
      { key: "online", label: t("defaultOnlinePublication"), name: "Online Publication", type: "publication" },
      { key: "rejected", label: t("statusRejected"), name: "Rejected", type: "rejection" },
      { key: "experiment_start", label: t("defaultExperimentsStarted"), name: "Experiments Started", type: "research" },
      { key: "experiment_done", label: t("defaultExperimentsCompleted"), name: "Experiments Completed", type: "research" },
      { key: "draft_done", label: t("defaultDraftCompleted"), name: "Draft Completed", type: "writing" },
      { key: "custom", label: t("customEvent"), name: "", type: "review" }
    ];
  }
  function getInlineEventPreset(key) {
    return getInlineEventPresets().find((preset) => preset.key === key) || getInlineEventPresets()[0];
  }
  function buildInlineStageEditor(subId) {
    const keyOptions = getInlineEventPresets().map((preset) => ({ value: preset.key, label: preset.label }));
    const typeOptions = [
      { value: "research", label: t("eventTypeResearch") },
      { value: "writing", label: t("eventTypeWriting") },
      { value: "submission", label: t("eventTypeSubmission") },
      { value: "review", label: t("eventTypeReview") },
      { value: "revision", label: t("eventTypeRevision") },
      { value: "rejection", label: t("statusRejected") },
      { value: "publication", label: t("eventTypePublication") },
      { value: "special", label: t("eventTypeSpecial") }
    ];
    return `
    <div class="inline-stage-editor" data-sub-id="${escapeHTML(subId)}" hidden>
      <div class="inline-stage-head">
        <span class="inline-stage-title"><span class="inline-stage-title-mark" aria-hidden="true">+</span>${t("inlineAddTimelineEvent")}</span>
        <span class="inline-stage-hint">${escapeHTML(t("inlineEventHint"))}</span>
      </div>
      <div class="inline-stage-fields" role="group" aria-label="${escapeHTML(t("inlineAddTimelineEvent"))}">
        <div class="inline-stage-section inline-stage-section-main">
          <div class="inline-stage-section-label">${escapeHTML(t("eventDetails"))}</div>
          <div class="inline-stage-main-grid">
            <label class="inline-stage-field inline-stage-field-preset"><span>${escapeHTML(t("keyEventPreset"))}</span><select class="inline-stage-key" aria-label="${escapeHTML(t("keyEventPreset"))}" title="${escapeHTML(t("keyEventPreset"))}">${buildOptions(keyOptions, "submit")}</select></label>
            <label class="inline-stage-field inline-stage-field-name"><span>${escapeHTML(t("eventName"))}</span><input type="text" class="inline-stage-name" aria-label="${escapeHTML(t("eventName"))}" value="${escapeHTML(t("defaultManuscriptSubmitted"))}" placeholder="${escapeHTML(t("eventPlaceholder"))}" maxlength="160"></label>
            <label class="inline-stage-field inline-stage-field-type"><span>${escapeHTML(t("inlineEventType"))}</span><select class="inline-stage-type" aria-label="${escapeHTML(t("inlineEventType"))}">${buildOptions(typeOptions, "submission")}</select></label>
          </div>
        </div>
        <div class="inline-stage-section inline-stage-section-dates">
          <div class="inline-stage-section-label">${escapeHTML(t("eventSchedule"))}</div>
          <div class="inline-stage-date-grid">
            <label class="inline-stage-field inline-stage-date-field"><span>${escapeHTML(t("eventDate"))}</span><input type="date" class="inline-stage-date" aria-label="${escapeHTML(t("eventDate"))}" value="${todayString()}"></label>
            <label class="inline-stage-field inline-stage-deadline-field"><span>${escapeHTML(t("eventDeadline"))}</span><input type="date" class="inline-stage-deadline" aria-label="${escapeHTML(t("eventDeadline"))}" title="${escapeHTML(t("eventDeadline"))}"></label>
            <label class="inline-stage-field inline-stage-decision-field"><span>${escapeHTML(t("reviewDecision"))}</span><select class="inline-stage-decision" aria-label="${escapeHTML(t("reviewDecision"))}" title="${escapeHTML(t("reviewDecision"))}">${buildOptions([
      { value: "", label: t("noReviewDecision") },
      { value: "major", label: t("majorRevision") },
      { value: "minor", label: t("minorRevision") }
    ], "")}</select></label>
          </div>
        </div>
        <label class="inline-stage-field inline-stage-notes-field"><span>${escapeHTML(t("eventNotesShort"))} <span class="inline-stage-optional">· ${escapeHTML(t("optional"))}</span></span><input type="text" class="inline-stage-notes" aria-label="${escapeHTML(t("eventNotesShort"))}" placeholder="${escapeHTML(t("inlineEventNotesPlaceholder"))}" maxlength="500"></label>
        <div class="inline-stage-actions"><button class="btn-secondary btn-sm btn-inline-stage-cancel" type="button">${escapeHTML(t("cancel"))}</button><button class="btn-secondary btn-sm btn-inline-stage-reset" type="button">${escapeHTML(t("reset"))}</button><button class="btn-primary btn-sm btn-inline-stage-save" type="button">${escapeHTML(t("inlineEventAdd"))}</button></div>
      </div>
      <div class="inline-stage-footer"><span class="inline-stage-status-dot" data-inline-stage-status-dot aria-hidden="true"></span><span class="inline-stage-status" data-inline-stage-status role="status" aria-live="polite"></span><span class="inline-stage-context" data-inline-stage-context></span></div>
    </div>
  `;
  }
  function toggleInlineStageEditor(card, shouldOpen = null) {
    const editor = card?.querySelector(".inline-stage-editor");
    if (!editor) return;
    if (shouldOpen !== false && typeof setPipelineViewMode === "function") setPipelineViewMode(true);
    const nextHidden = shouldOpen === null ? !editor.hidden : !shouldOpen;
    editor.hidden = nextHidden;
    editor.classList?.toggle?.("is-open", !nextHidden);
    card?.classList?.toggle?.("has-open-stage-editor", !nextHidden);
    card?.querySelectorAll?.(".btn-inline-add-event").forEach((btn) => {
      btn.classList?.toggle?.("is-active", !nextHidden);
      btn.setAttribute?.("aria-expanded", !nextHidden ? "true" : "false");
    });
    if (!editor.hidden) {
      syncInlineStagePreset(editor);
      const nameInput = editor.querySelector(".inline-stage-name");
      if (nameInput) nameInput.focus();
    }
  }
  function syncInlineStagePreset(editor) {
    const keySelect = editor.querySelector(".inline-stage-key");
    const nameInput = editor.querySelector(".inline-stage-name");
    const typeSelect = editor.querySelector(".inline-stage-type");
    const deadlineInput = editor.querySelector(".inline-stage-deadline");
    const decisionSelect = editor.querySelector(".inline-stage-decision");
    const deadlineField = editor.querySelector(".inline-stage-deadline-field");
    const decisionField = editor.querySelector(".inline-stage-decision-field");
    if (!keySelect || !nameInput || !typeSelect) return;
    const preset = getInlineEventPreset(keySelect.value);
    if (preset.key !== "custom") {
      nameInput.value = t(defaultTimelineNameKeys[preset.name] || "") || preset.label || preset.name;
      typeSelect.value = preset.type;
    } else if (nameInput.readOnly) {
      nameInput.value = "";
    }
    nameInput.readOnly = preset.key !== "custom";
    typeSelect.disabled = preset.key !== "custom";
    const isReview = typeSelect.value === "review" || preset.key === "r1_comments" || preset.key === "r2_comments";
    editor.classList.toggle("is-review", isReview);
    if (deadlineField) deadlineField.hidden = !isReview;
    if (decisionField) decisionField.hidden = !isReview;
    if (deadlineInput) deadlineInput.hidden = false;
    if (decisionSelect) decisionSelect.hidden = false;
    updateInlineStageDeadlineStatus(editor);
  }
  function updateInlineStageDeadlineStatus(editor) {
    const status = editor?.querySelector("[data-inline-stage-status]");
    const dot = editor?.querySelector("[data-inline-stage-status-dot]");
    const context = editor?.querySelector("[data-inline-stage-context]");
    const deadline = normalizeDateString(editor?.querySelector(".inline-stage-deadline")?.value || "");
    const isReview = editor?.classList.contains("is-review");
    const presetLabel = editor?.querySelector(".inline-stage-key")?.selectedOptions?.[0]?.textContent || "";
    if (context) context.textContent = presetLabel;
    if (!status) return;
    let level = "normal";
    if (!isReview) {
      status.textContent = t("ordinaryEventStatus");
    } else if (!deadline) {
      status.textContent = t("reviewDeadlinePrompt");
      level = "pending";
    } else {
      const meta = getRevisionCountdownMeta(deadline);
      status.textContent = meta?.text || `${t("deadlineShort")} ${formatShortDate(deadline)}`;
      level = meta?.level || "normal";
    }
    if (dot) dot.setAttribute("data-level", level);
  }
  function resetInlineStageEditor(editor) {
    if (editor?.querySelector(".btn-inline-stage-save")?.disabled) return;
    const keySelect = editor?.querySelector(".inline-stage-key");
    if (!keySelect) return;
    keySelect.value = "submit";
    const dateInput = editor.querySelector(".inline-stage-date");
    const deadlineInput = editor.querySelector(".inline-stage-deadline");
    const decisionSelect = editor.querySelector(".inline-stage-decision");
    const notesInput = editor.querySelector(".inline-stage-notes");
    if (dateInput) dateInput.value = todayString();
    if (deadlineInput) deadlineInput.value = "";
    if (decisionSelect) decisionSelect.value = "";
    if (notesInput) notesInput.value = "";
    syncInlineStagePreset(editor);
    keySelect.focus();
  }
  function applyInlineEventToSubmission2(sub, key, eventDate, note = "") {
    const isoDate = dateInputToIso(eventDate);
    if (key === "submit") {
      sub.submissionDate = isoDate;
    } else if (key === "r1_comments" || key === "r2_comments") {
      if (key === "r1_comments") sub.firstDecisionDate = isoDate;
      if (!hasPublicationStatus(sub) && sub.status !== "rejected") sub.status = "revision";
    } else if (key === "r1_revised" || key === "r2_revised") {
      if (!hasPublicationStatus(sub) && sub.status !== "rejected") sub.status = "under_review";
    } else if (key === "accept") {
      sub.decisionDate = isoDate;
      sub.acceptedAt = isoDate;
      if (sub.status !== "published") sub.status = "accepted";
    } else if (key === "online") {
      sub.decisionDate = sub.decisionDate || isoDate;
      sub.status = "published";
      sub.publishedAt = isoDate;
      sub.acceptedAt = sub.acceptedAt || sub.decisionDate;
    } else if (key === "rejected") {
      markSubmissionRejected(sub, eventDate, note);
    }
  }
  function setInlineStageBusy(editor, busy, message = "") {
    const button = editor?.querySelector(".btn-inline-stage-save");
    const resetButton = editor?.querySelector(".btn-inline-stage-reset");
    const cancelButton = editor?.querySelector(".btn-inline-stage-cancel");
    const status = editor?.querySelector("[data-inline-stage-status]");
    if (button) {
      button.disabled = busy;
      button.setAttribute("aria-busy", String(busy));
    }
    if (resetButton) resetButton.disabled = busy;
    if (cancelButton) cancelButton.disabled = busy;
    if (status && message) status.textContent = message;
    else if (!busy) updateInlineStageDeadlineStatus(editor);
  }
  async function saveInlineStageEvent(editor) {
    const subId = editor.getAttribute("data-sub-id");
    const sub = db.submissions.find((s) => s.id === subId);
    if (!sub) {
      showGlobalToast(t("submissionNotFound"), "error");
      renderDashboard();
      return;
    }
    const selectedKey = editor.querySelector(".inline-stage-key")?.value || "custom";
    const preset = getInlineEventPreset(selectedKey);
    const name = editor.querySelector(".inline-stage-name").value.trim() || preset.name;
    const eventDate = editor.querySelector(".inline-stage-date").value || todayString();
    const deadline = normalizeDateString(editor.querySelector(".inline-stage-deadline")?.value || "");
    const reviewDecision = editor.querySelector(".inline-stage-decision")?.value || "";
    const type = editor.querySelector(".inline-stage-type").value;
    const notes = editor.querySelector(".inline-stage-notes")?.value.trim() || "";
    if (!name) {
      alert(t("eventNameRequired"));
      editor.querySelector(".inline-stage-name").focus();
      return;
    }
    const isReview = type === "review" || selectedKey === "r1_comments" || selectedKey === "r2_comments";
    if (isReview && !deadline && !reviewDecision) {
      alert(t("reviewDeadlineOrDecisionRequired"));
      editor.querySelector(".inline-stage-deadline")?.focus();
      return;
    }
    if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
    let node = null;
    const nodeKey = selectedKey === "custom" ? "auto" : selectedKey;
    if (selectedKey === "rejected") {
      const existingRejected = getTimelineNodeByKey(sub, "rejected");
      if (existingRejected && !confirm(tf("confirmUpdateEvent", { name: getTimelineNodeDisplayName(existingRejected) }))) {
        return;
      }
      markSubmissionRejected(sub, eventDate, notes);
      node = getTimelineNodeByKey(sub, "rejected");
    } else {
      node = selectedKey === "custom" ? null : getTimelineNodeByKey(sub, selectedKey);
      if (node && selectedKey !== "custom" && node.completeDate) {
        const shouldUpdate = confirm(tf("confirmUpdateEvent", { name: getTimelineNodeDisplayName(node) }));
        if (!shouldUpdate) return;
      }
      const nodeValues = {
        key: nodeKey,
        name,
        type,
        status: "completed",
        planDate: "",
        dueDate: isReview ? deadline : "",
        completeDate: eventDate,
        notes,
        reviewDecision: isReview ? reviewDecision : ""
      };
      if (node) {
        Object.assign(node, nodeValues, { updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      } else {
        node = createTimelineNode(subId, nodeValues);
        sub.timelineNodes.push(node);
      }
      if (isReview) {
        sub.revisionDueDate = deadline ? dateInputToIso(deadline) : null;
        sub.reviewDecision = reviewDecision;
      }
      applyInlineEventToSubmission2(sub, nodeKey, eventDate, notes);
    }
    normalizeSubmissionTimeline(sub);
    syncManuscriptStatusFromSubmission(sub);
    await window.storage.saveAll(db);
    renderDashboard();
    renderKanban();
    renderSubmissions();
    showGlobalToast(tf("eventAddedToast", { name: getTimelineNodeDisplayName(node) }), "success");
  }
  var init_inline_editor = __esm({
    "src/modules/timeline-engine/inline-editor.ts"() {
      "use strict";
      init_drawer_and_manager();
    }
  });

  // src/modules/timeline-engine/node-helpers.ts
  function getTimelineNodeDisplayName2(node) {
    const rawName = (node?.name || "").trim();
    if (!rawName) return t("untitledEvent");
    const defaultKey = defaultTimelineNameKeys2[rawName];
    return defaultKey ? t(defaultKey) : rawName;
  }
  function getDaysDiff2(dateStr1, dateStr2) {
    if (!dateStr1 || !dateStr2) return null;
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.max(0, Math.round((utc2 - utc1) / 864e5));
  }
  function getRelativeDateLabel(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const today = /* @__PURE__ */ new Date();
    const utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.round((utcToday - utcDate) / 864e5);
    if (diff === 0) return t("relativeToday");
    if (diff > 0) return tf("relativeDaysAgo", { count: diff });
    return tf("relativeInDays", { count: Math.abs(diff) });
  }
  function todayString2() {
    return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  }
  function normalizeDateString2(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }
  function dateInputToIso2(value) {
    const normalized = normalizeDateString2(value);
    return normalized ? `${normalized}T12:00:00.000Z` : null;
  }
  function getNodeDate2(node) {
    return node?.completeDate || node?.planDate || node?.dueDate || "";
  }
  function isReviewTimelineNode(node, inferKeyFn = inferKey) {
    if (!node) return false;
    const key = node.key || (typeof inferKeyFn === "function" ? inferKeyFn(node) : "");
    return node.type === "review" || key === "r1_comments" || key === "r2_comments";
  }
  function getReviewDecisionLabel(decision) {
    if (decision === "major") return t("majorRevision");
    if (decision === "minor") return t("minorRevision");
    return "";
  }
  function getLatestTimelineNode2(nodes = []) {
    const datedNodes = nodes.filter(getNodeDate2).sort((a, b) => new Date(getNodeDate2(b)).getTime() - new Date(getNodeDate2(a)).getTime());
    if (datedNodes.length) return datedNodes[0];
    return [...nodes].reverse().find(
      (node) => node.status === "active" || node.status === "completed" || node.status === "blocked" || node.status === "danger"
    ) || nodes[0] || null;
  }
  function createTimelineNode2(subId, values = {}) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      id: `node_${subId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: (values.name || t("untitledEvent")).trim(),
      type: values.type || "research",
      key: values.key || "auto",
      status: values.status || "pending",
      planDate: values.planDate || "",
      dueDate: values.dueDate || "",
      completeDate: values.completeDate || "",
      notes: values.notes || "",
      createdAt: now,
      updatedAt: now
    };
  }
  var defaultTimelineNameKeys2;
  var init_node_helpers = __esm({
    "src/modules/timeline-engine/node-helpers.ts"() {
      "use strict";
      defaultTimelineNameKeys2 = {
        "Research Started": "defaultResearchStarted",
        "研究启动": "defaultResearchStarted",
        "Experiments Completed": "defaultExperimentsCompleted",
        "实验完成": "defaultExperimentsCompleted",
        "First Draft Completed": "defaultFirstDraftCompleted",
        "初稿完成": "defaultFirstDraftCompleted",
        "Submitted": "defaultSubmitted",
        "已投稿": "defaultSubmitted",
        "Review Comments R1": "defaultReviewCommentsR1",
        "收到 R1 审稿意见": "defaultReviewCommentsR1",
        "R1 Revision Submitted": "defaultR1RevisionSubmitted",
        "R1 修回已提交": "defaultR1RevisionSubmitted",
        "Review Comments R2": "defaultReviewCommentsR2",
        "收到 R2 审稿意见": "defaultReviewCommentsR2",
        "R2 Revision Submitted": "defaultR2RevisionSubmitted",
        "R2 修回已提交": "defaultR2RevisionSubmitted",
        "Accepted": "defaultAccepted",
        "已接收": "defaultAccepted",
        "Online Publication": "defaultOnlinePublication",
        "上线发表": "defaultOnlinePublication",
        "Proof": "defaultProof",
        "校样": "defaultProof"
      };
    }
  });

  // src/modules/timeline-engine/submission-analyzer.ts
  function analyzeSubmission(sub) {
    normalizeSubmissionTimeline2(sub);
    const events = [...sub.timelineNodes || []].sort((a, b) => {
      const da = a.completeDate || a.planDate || a.dueDate || a.createdAt || "";
      const dbDate = b.completeDate || b.planDate || b.dueDate || b.createdAt || "";
      return new Date(da).getTime() - new Date(dbDate).getTime();
    });
    const getKeyEventDate = (key) => {
      const node = events.find((e) => inferKey2(e) === key);
      const w = window;
      const nodeDate = node ? normalizeDateString(w.RFUI?.getTimelineEventDate?.(node, key)) : null;
      if (key === "submit") return normalizeDateString(sub.submissionDate) || nodeDate;
      if (key === "r1_comments") return normalizeDateString(sub.firstDecisionDate) || nodeDate;
      if (key === "accept" || key === "online") {
        return normalizeDateString(sub.decisionDate) && hasPublicationStatus2(sub) ? normalizeDateString(sub.decisionDate) : nodeDate;
      }
      return nodeDate;
    };
    const datedResearchEvent = events.find((e) => e.type === "research" && getNodeDate(e));
    const experimentStartDate = getKeyEventDate("experiment_start");
    const experimentDate = getKeyEventDate("experiment_done") || (datedResearchEvent ? getNodeDate(datedResearchEvent) : null);
    const submitDate = getKeyEventDate("submit");
    const submitNode = events.find((e) => inferKey2(e) === "submit");
    const submitDateSource = normalizeDateString(sub.submissionDate) ? t("dateSourceSubmission") : normalizeDateString(getNodeDate(submitNode)) ? t("dateSourceTimeline") : t("dateSourceMissing");
    const r1Date = getKeyEventDate("r1_comments");
    const acceptDate = getKeyEventDate("accept");
    const onlineDate = getKeyEventDate("online");
    const latest = getLatestTimelineNode(sub.timelineNodes || []);
    const accepted = Boolean(acceptDate) || hasPublicationStatus2(sub);
    const expToSubmit = experimentDate && submitDate ? getDaysDiff(experimentDate, submitDate) : null;
    const submitToNow = submitDate && !accepted ? getDaysDiff(submitDate, todayString()) : null;
    const r1ToNow = r1Date && !accepted ? getDaysDiff(r1Date, todayString()) : null;
    const submitToAccept = submitDate && acceptDate ? getDaysDiff(submitDate, acceptDate) : null;
    const acceptToOnline = acceptDate && onlineDate ? getDaysDiff(acceptDate, onlineDate) : null;
    let display = {
      mode: "prepare",
      label: t("displayPrepareLabel"),
      value: expToSubmit,
      color: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe",
      caption: t("displayPrepareCaption"),
      pending: false,
      milestones: [
        { name: t("milestoneExperimentStart"), date: experimentStartDate, color: "#0891b2", emphasis: true, node: events.find((e) => inferKey2(e) === "experiment_start") },
        { name: t("milestoneExperimentDone"), date: experimentDate, color: "#2563eb", emphasis: true, node: events.find((e) => inferKey2(e) === "experiment_done") },
        { name: t("milestoneSubmission"), date: submitDate, color: "#f97316", emphasis: true, node: events.find((e) => inferKey2(e) === "submit") }
      ]
    };
    if (accepted) {
      display = {
        mode: "accepted",
        label: t("displayAcceptedLabel"),
        value: submitToAccept,
        color: "#16a34a",
        bg: "#f0fdf4",
        border: "#bbf7d0",
        caption: t("displayAcceptedCaption"),
        pending: false,
        milestones: [
          { name: t("milestoneSubmission"), date: submitDate, color: "#f97316", emphasis: true, node: events.find((e) => inferKey2(e) === "submit") },
          { name: t("milestoneAcceptance"), date: acceptDate, color: "#16a34a", emphasis: true, node: events.find((e) => inferKey2(e) === "accept") }
        ]
      };
    } else if (r1Date) {
      display = {
        mode: "r1-active",
        label: t("displayR1Label"),
        value: r1ToNow,
        color: "#dc2626",
        bg: "#fef2f2",
        border: "#fecaca",
        caption: t("displayR1Caption"),
        pending: true,
        milestones: [
          { name: t("milestoneSubmission"), date: submitDate, color: "#f97316", emphasis: false, node: events.find((e) => inferKey2(e) === "submit") },
          { name: t("milestoneR1Comments"), date: r1Date, color: "#dc2626", emphasis: true, node: events.find((e) => inferKey2(e) === "r1_comments") },
          { name: t("milestoneToday"), date: todayString(), color: "#dc2626", emphasis: true, today: true }
        ]
      };
    } else if (submitDate) {
      display = {
        mode: "under-review",
        label: t("displayReviewLabel"),
        value: submitToNow,
        color: "#f97316",
        bg: "#fff7ed",
        border: "#fed7aa",
        caption: t("displayReviewCaption"),
        pending: true,
        milestones: [
          { name: t("milestoneSubmission"), date: submitDate, color: "#f97316", emphasis: true, node: events.find((e) => inferKey2(e) === "submit") },
          { name: t("milestoneToday"), date: todayString(), color: "#f97316", emphasis: true, today: true }
        ]
      };
    }
    const isDarkMode = isDarkThemeActive();
    if (isDarkMode) {
      if (display.mode === "prepare") {
        display.bg = "rgba(37,99,235,0.08)";
        display.border = "rgba(37,99,235,0.3)";
      } else if (display.mode === "accepted") {
        display.bg = "rgba(22,163,74,0.08)";
        display.border = "rgba(22,163,74,0.3)";
      } else if (display.mode === "r1-active") {
        display.bg = "rgba(220,38,38,0.08)";
        display.border = "rgba(220,38,38,0.3)";
      } else if (display.mode === "under-review") {
        display.bg = "rgba(249,115,22,0.08)";
        display.border = "rgba(249,115,22,0.3)";
      }
    }
    const explicitStatus = normalizeSubmissionStatus(sub.status || "submitted");
    const statusPresentation = {
      submitted: { label: t("stateSubmitted"), color: "#64748b" },
      under_review: { label: t("stateUnderReview"), color: "#0891b2" },
      revision: { label: getSubmissionStatusLabel("revision"), color: "#d97706" },
      accepted: { label: t("stateAccepted"), color: "#16a34a" },
      published: { label: t("stateOnline"), color: "#15803d" },
      rejected: { label: getSubmissionStatusLabel("rejected"), color: "#dc2626" }
    }[explicitStatus] || { label: t("statePreparing"), color: "#64748b" };
    const stateLabel = statusPresentation.label;
    const stateColor = statusPresentation.color;
    let stateNote = submitDate ? tf("stateSinceSubmit", { count: submitToNow ?? "—" }) : t("stateNotSubmitted");
    if (explicitStatus === "revision" && r1Date) stateNote = tf("stateSinceR1", { count: r1ToNow ?? "—" });
    if (explicitStatus === "accepted" && acceptDate) stateNote = formatShortDate(acceptDate);
    if (explicitStatus === "published" && onlineDate) stateNote = formatShortDate(onlineDate);
    return { events, experimentStartDate, experimentDate, submitDate, submitDateSource, r1Date, acceptDate, onlineDate, latest, accepted, expToSubmit, submitToNow, r1ToNow, submitToAccept, acceptToOnline, display, stateLabel, stateColor, stateNote };
  }
  var init_submission_analyzer = __esm({
    "src/modules/timeline-engine/submission-analyzer.ts"() {
      "use strict";
      init_normalizer_and_analyzer();
    }
  });

  // src/modules/timeline-engine/normalizer-and-analyzer.ts
  function inferKey2(node) {
    if (node.key && node.key !== "auto") return node.key;
    const text = `${node.name || ""} ${node.notes || ""}`.toLowerCase();
    if (/reject|rejected|decline|declined|拒稿|拒绝|退稿/.test(text) || node.type === "rejection") return "rejected";
    if (/online|publication|published|见刊|上线/.test(text) || node.type === "publication" && text.includes("online")) return "online";
    if (/accept|accepted|接收|录用/.test(text) || node.type === "publication" && text.includes("accept")) return "accept";
    if (/r2|second/.test(text) && (/submit|revis|修回|resubmitted/.test(text) || node.type === "revision")) return "r2_revised";
    if (/r2|second/.test(text) && (/comment|decision|review|意见|returned/.test(text) || node.type === "review")) return "r2_comments";
    if (/r1|first/.test(text) && (/submit|revis|修回|resubmitted/.test(text) || node.type === "revision")) return "r1_revised";
    if (/r1|first|comment|decision|审稿意见|一审|returned/.test(text) || node.type === "review" || node.type === "revision") return "r1_comments";
    if (/submit|submission|submitted|投稿/.test(text) || node.type === "submission") return "submit";
    if (/draft|manuscript|completed|finished|手稿/.test(text) || node.type === "writing") return "draft_done";
    if (/experiment\s*(start|started|begin|began)|start(ed)?\s*(experiment|research)|实验(开始|启动)|研究开始/.test(text)) return "experiment_start";
    if (/experiment|data|complete|completed|实验|数据/.test(text) || node.type === "research") return "experiment_done";
    return "auto";
  }
  function getTimelineNodeByKey2(sub, key) {
    return (sub.timelineNodes || []).find((node) => node.key === key || inferKey2(node) === key) || null;
  }
  function setTimelineNodeDate(node, date, field = "completeDate") {
    if (!node || !date) return false;
    let changed = false;
    ["planDate", "dueDate", "completeDate"].forEach((dateField) => {
      const next = dateField === field ? date : "";
      if ((node[dateField] || "") !== next) {
        node[dateField] = next;
        changed = true;
      }
    });
    return changed;
  }
  function createCanonicalTimelineNode(subId, key, name, type, status = "pending") {
    return createTimelineNode2(subId, { key, name, type, status });
  }
  function ensureTimelineNode(sub, key, name, type, status = "pending") {
    if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
    let node = getTimelineNodeByKey2(sub, key);
    if (!node) {
      node = createCanonicalTimelineNode(sub.id, key, name, type, status);
      sub.timelineNodes.push(node);
      return { node, changed: true };
    }
    let changed = false;
    if (node.key !== key) {
      node.key = key;
      changed = true;
    }
    if (!node.type || node.type === "special") {
      node.type = type;
      changed = true;
    }
    return { node, changed };
  }
  function hasPublicationStatus2(sub) {
    const status = normalizeSubmissionStatus(sub?.status);
    return status === "accepted" || status === "published";
  }
  function initializeSubmissionTimelineNodes(sub) {
    const submitDate = normalizeDateString2(sub.submissionDate);
    const firstDecisionDate = normalizeDateString2(sub.firstDecisionDate);
    const revisionDueDate = normalizeDateString2(sub.revisionDueDate);
    const decisionDate = normalizeDateString2(sub.decisionDate);
    const linkedMan = db?.manuscripts?.find((m) => m.id === sub?.manuscriptId);
    const isAcceptedOrPublished = hasPublicationStatus2(sub) || Boolean(linkedMan && (hasPublicationStatus2(linkedMan) || linkedMan.status === "accepted" || linkedMan.status === "published"));
    const isPublished = sub?.status === "published" || Boolean(linkedMan && linkedMan.status === "published");
    sub.timelineNodes = [
      createTimelineNode2(sub.id, { key: "experiment_start", name: "Experiments Started", type: "research", status: "completed" }),
      createTimelineNode2(sub.id, { key: "experiment_done", name: "Experiments Completed", type: "research", status: "completed" }),
      createTimelineNode2(sub.id, { key: "draft_done", name: "Draft Completed", type: "writing", status: submitDate || isAcceptedOrPublished ? "completed" : "pending" }),
      createTimelineNode2(sub.id, {
        key: "submit",
        name: "Manuscript Submitted",
        type: "submission",
        status: submitDate || isAcceptedOrPublished ? "completed" : "pending",
        completeDate: submitDate
      }),
      createTimelineNode2(sub.id, {
        key: "r1_comments",
        name: "Review Comments R1",
        type: "review",
        status: firstDecisionDate || isAcceptedOrPublished ? "completed" : revisionDueDate ? "active" : "pending",
        completeDate: firstDecisionDate,
        dueDate: firstDecisionDate || isAcceptedOrPublished ? "" : revisionDueDate
      }),
      createTimelineNode2(sub.id, { key: "r1_revised", name: "R1 Revision Submitted", type: "revision", status: isAcceptedOrPublished ? "completed" : "pending" }),
      createTimelineNode2(sub.id, {
        key: "accept",
        name: "Accepted",
        type: "publication",
        status: isAcceptedOrPublished ? "completed" : "pending",
        completeDate: decisionDate && isAcceptedOrPublished ? decisionDate : isAcceptedOrPublished ? sub.acceptedAt || "" : ""
      }),
      createTimelineNode2(sub.id, {
        key: "online",
        name: "Online Publication",
        type: "publication",
        status: isPublished ? "completed" : "pending",
        completeDate: isPublished ? sub.publishedAt || decisionDate || "" : ""
      })
    ];
  }
  function syncSubmissionFieldsFromTimeline(sub) {
    if (!sub || !Array.isArray(sub.timelineNodes)) return false;
    let changed = false;
    const submitNode = getTimelineNodeByKey2(sub, "submit");
    const submitNodeDate = normalizeDateString2(getNodeDate2(submitNode));
    if (submitNodeDate && normalizeDateString2(sub.submissionDate) !== submitNodeDate) {
      sub.submissionDate = dateInputToIso2(submitNodeDate);
      changed = true;
    }
    const r1Node = getTimelineNodeByKey2(sub, "r1_comments");
    const r1Date = normalizeDateString2(r1Node?.completeDate || "");
    if (r1Date && normalizeDateString2(sub.firstDecisionDate) !== r1Date) {
      sub.firstDecisionDate = dateInputToIso2(r1Date);
      changed = true;
    }
    const acceptNode = getTimelineNodeByKey2(sub, "accept") || getTimelineNodeByKey2(sub, "online");
    const acceptDate = normalizeDateString2(acceptNode?.completeDate || "");
    if (acceptDate && normalizeDateString2(sub.decisionDate) !== acceptDate) {
      sub.decisionDate = dateInputToIso2(acceptDate);
      changed = true;
    }
    return changed;
  }
  function normalizeSubmissionTimeline2(sub) {
    if (!sub) return false;
    let changed = false;
    if (!Array.isArray(sub.timelineNodes) || sub.timelineNodes.length === 0) {
      initializeSubmissionTimelineNodes(sub);
      changed = true;
    }
    const linkedMan = db?.manuscripts?.find((m) => m.id === sub.manuscriptId);
    const isAcceptedOrPublished = hasPublicationStatus2(sub) || Boolean(normalizeDateString2(sub.decisionDate || sub.acceptedAt)) || Boolean(getTimelineNodeByKey2(sub, "accept")?.completeDate) || Boolean(linkedMan && (hasPublicationStatus2(linkedMan) || linkedMan.status === "accepted" || linkedMan.status === "published"));
    const isPublished = sub.status === "published" || Boolean(linkedMan && linkedMan.status === "published");
    if (linkedMan && (linkedMan.status === "accepted" || linkedMan.status === "published") && sub.status !== linkedMan.status) {
      const currentForMan = window.RFCore?.getCurrentSubmission(db, linkedMan.id);
      if (!currentForMan || currentForMan.id === sub.id) {
        sub.status = linkedMan.status;
        changed = true;
      }
    }
    const submitDate = normalizeDateString2(sub.submissionDate);
    if (submitDate) {
      const result = ensureTimelineNode(sub, "submit", "Manuscript Submitted", "submission", "completed");
      changed = result.changed || changed;
      changed = setTimelineNodeDate(result.node, submitDate, "completeDate") || changed;
      if (result.node.status !== "completed") {
        result.node.status = "completed";
        changed = true;
      }
    } else {
      changed = syncSubmissionFieldsFromTimeline(sub) || changed;
    }
    const firstDecisionDate = normalizeDateString2(sub.firstDecisionDate);
    if (firstDecisionDate) {
      const result = ensureTimelineNode(sub, "r1_comments", "Review Comments R1", "review", "completed");
      changed = result.changed || changed;
      if ((result.node.completeDate || "") !== firstDecisionDate) {
        result.node.completeDate = firstDecisionDate;
        changed = true;
      }
      const normalizedDueDate = normalizeDateString2(sub.revisionDueDate);
      if ((result.node.dueDate || "") !== normalizedDueDate) {
        result.node.dueDate = normalizedDueDate;
        changed = true;
      }
      if (result.node.status !== "completed") {
        result.node.status = "completed";
        changed = true;
      }
    }
    const revisionDueDate = normalizeDateString2(sub.revisionDueDate);
    if (revisionDueDate && !isAcceptedOrPublished) {
      const result = ensureTimelineNode(sub, "r1_comments", "Review Comments R1", "review", "active");
      changed = result.changed || changed;
      if ((result.node.dueDate || "") !== revisionDueDate) {
        result.node.dueDate = revisionDueDate;
        changed = true;
      }
      if (result.node.status === "pending") {
        result.node.status = "active";
        changed = true;
      }
    }
    const decisionDate = normalizeDateString2(sub.decisionDate || sub.acceptedAt);
    if (isAcceptedOrPublished) {
      const result = ensureTimelineNode(sub, "accept", "Accepted", "publication", "completed");
      changed = result.changed || changed;
      if (decisionDate) {
        changed = setTimelineNodeDate(result.node, decisionDate, "completeDate") || changed;
      }
      if (result.node.status !== "completed") {
        result.node.status = "completed";
        changed = true;
      }
      (sub.timelineNodes || []).forEach((node) => {
        const key = node.key || inferKey2(node);
        const isPreAcceptance = node.type === "research" || node.type === "writing" || node.type === "submission" || node.type === "review" || node.type === "revision" || key === "submit" || key === "r1_comments" || key === "r1_revised" || key === "r2_comments" || key === "r2_revised" || key === "draft_done" || key === "experiment_done" || key === "experiment_start";
        if (isPreAcceptance && node.status !== "completed") {
          node.status = "completed";
          changed = true;
        }
      });
    }
    if (isPublished) {
      const onlineDate = normalizeDateString2(sub.publishedAt || getTimelineNodeByKey2(sub, "online")?.completeDate || sub.decisionDate);
      const result = ensureTimelineNode(sub, "online", "Online Publication", "publication", "completed");
      changed = result.changed || changed;
      if (onlineDate) {
        changed = setTimelineNodeDate(result.node, onlineDate, "completeDate") || changed;
      }
      if (result.node.status !== "completed") {
        result.node.status = "completed";
        changed = true;
      }
    }
    if (changed) sub.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return changed;
  }
  var init_normalizer_and_analyzer = __esm({
    "src/modules/timeline-engine/normalizer-and-analyzer.ts"() {
      "use strict";
      init_node_helpers();
      init_submission_analyzer();
    }
  });

  // src/modules/timeline-engine/status-lifecycle.ts
  function isAcceptedSubmission(sub) {
    return Boolean(sub && analyzeSubmission(sub).accepted);
  }
  function canHavePublicationLink(sub) {
    if (!sub) return false;
    if (hasPublicationStatus2(sub)) return true;
    if (normalizeDateString(sub.acceptedAt || sub.publishedAt)) return true;
    return isAcceptedSubmission(sub);
  }
  function clearPublicationLinkFields2(sub) {
    if (!sub) return false;
    let changed = false;
    ["doi", "DOI", "articleDoi", "articleUrl", "publicationUrl", "journalArticleUrl"].forEach((field) => {
      if (sub[field]) {
        sub[field] = null;
        changed = true;
      }
    });
    return changed;
  }
  function clearPublicationTimelineCompletion2(sub) {
    if (!sub || !Array.isArray(sub.timelineNodes)) return false;
    let changed = false;
    sub.timelineNodes.forEach((node) => {
      if (inferKey2(node) !== "accept" && inferKey2(node) !== "online") return;
      if (node.completeDate) {
        node.completeDate = "";
        changed = true;
      }
      if (node.status === "completed") {
        node.status = "pending";
        changed = true;
      }
    });
    return changed;
  }
  function clearUnacceptedPublicationLinks(database) {
    if (!database || !Array.isArray(database.submissions)) return false;
    let changed = false;
    database.submissions.forEach((sub) => {
      if (!canHavePublicationLink(sub)) {
        changed = clearPublicationLinkFields2(sub) || changed;
      }
    });
    return changed;
  }
  function getSubmissionCycleTime(sub) {
    const start = sub.submissionDate ? new Date(sub.submissionDate) : sub.createdAt ? new Date(sub.createdAt) : /* @__PURE__ */ new Date();
    const isCompleted = sub.status === "accepted" || sub.status === "published";
    let end = /* @__PURE__ */ new Date();
    if (isCompleted) {
      if (sub.decisionDate) {
        end = new Date(sub.decisionDate);
      } else {
        const completionNode = sub.timelineNodes?.find((n) => {
          if (!n.name || !n.completeDate) return false;
          const nodeName = n.name.toLowerCase();
          return n.name.includes("接收") || nodeName.includes("accept") || nodeName.includes("online");
        });
        if (completionNode) {
          end = new Date(completionNode.completeDate);
        } else if (sub.updatedAt) {
          end = new Date(sub.updatedAt);
        }
      }
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    return {
      days: diffDays,
      isCompleted,
      startDateStr: start.toLocaleDateString(),
      endDateStr: end.toLocaleDateString()
    };
  }
  function computeNodeStatus2(node) {
    if (node.completeDate || node.status === "completed") return "completed";
    if (node.status === "danger" || node.status === "blocked") return "blocked";
    if (node.dueDate) {
      const dueTime = new Date(node.dueDate).getTime();
      const now = /* @__PURE__ */ new Date();
      now.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dueTime - now.getTime()) / (1e3 * 60 * 60 * 24));
      if (diffDays < 0) return "overdue";
      if (diffDays <= 7) return "due_soon";
    }
    if (node.status === "active") return "in_progress";
    if (node.status === "pending") return "not_started";
    return "upcoming";
  }
  function getNodeStatusLabel2(status) {
    const keyMap = {
      completed: "statusCompleted",
      blocked: "statusBlocked",
      overdue: "statusOverdue",
      due_soon: "statusDueSoon",
      in_progress: "statusInProgress",
      not_started: "statusPlannedNotStarted",
      upcoming: "statusUpcoming"
    };
    return t(keyMap[status] || "statusUpcoming");
  }
  function autoSortNodes2(nodes) {
    return [...nodes].sort((a, b) => {
      const getDate = (n) => n.completeDate || n.planDate || n.dueDate || n.createdAt || "";
      const da = getDate(a);
      const dbDate = getDate(b);
      if (!da && !dbDate) return 0;
      if (!da) return 1;
      if (!dbDate) return -1;
      return new Date(da).getTime() - new Date(dbDate).getTime();
    });
  }
  function getCapsuleIcon(status, _type) {
    if (status === "completed") return "✓";
    if (status === "blocked") return "✕";
    if (status === "overdue") return "🔴";
    if (status === "due_soon") return "⚠";
    if (status === "in_progress") return "●";
    if (status === "not_started" || status === "upcoming") return "◯";
    if (status === "milestone") return "⭐";
    return "◯";
  }
  function formatShortDate2(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      const locale = currentLanguage === "zh" ? "zh-CN" : "en-US";
      return d.toLocaleDateString(locale, currentLanguage === "zh" ? { month: "numeric", day: "numeric" } : { month: "short", day: "numeric" });
    } catch (_) {
      return "";
    }
  }
  function getRevisionCountdownMeta2(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return null;
    const now = /* @__PURE__ */ new Date();
    const utcDue = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
    const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((utcDue - utcNow) / 864e5);
    const isZh = typeof currentLanguage !== "undefined" ? currentLanguage === "zh" : true;
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        days: diffDays,
        level: "overdue",
        badgeClass: "badge-danger",
        icon: "🚨",
        text: isZh ? `已逾期 ${overdueDays} 天` : `${overdueDays}d overdue`,
        title: isZh ? `该稿件修回已超出截止日期 ${overdueDays} 天，建议尽快提交或联系编辑申请延期` : `Revision is ${overdueDays} days past due. Submit ASAP or request an extension.`
      };
    }
    if (diffDays === 0) {
      return {
        days: 0,
        level: "due_today",
        badgeClass: "badge-danger",
        icon: "🚨",
        text: isZh ? "今天截止" : "Due today",
        title: isZh ? "今天是修回最后截止日！请确认修订稿与回复信已准备就绪" : "Revision deadline is TODAY! Ensure revisions and rebuttals are ready."
      };
    }
    if (diffDays <= 7) {
      return {
        days: diffDays,
        level: "due_soon",
        badgeClass: "badge-warning",
        icon: "⚠️",
        text: isZh ? `仅剩 ${diffDays} 天` : `${diffDays}d left`,
        title: isZh ? `距离修回截止仅剩 ${diffDays} 天，请抓紧完善审稿回复与修改` : `${diffDays} days left until revision deadline. Finalize responses promptly.`
      };
    }
    return {
      days: diffDays,
      level: "upcoming",
      badgeClass: "badge-info",
      icon: "📅",
      text: isZh ? `剩 ${diffDays} 天` : `${diffDays}d left`,
      title: isZh ? `修回截止日期：${dueDate}（还剩 ${diffDays} 天）` : `Revision due date: ${dueDate} (${diffDays} days remaining)`
    };
  }
  var init_status_lifecycle = __esm({
    "src/modules/timeline-engine/status-lifecycle.ts"() {
      "use strict";
      init_normalizer_and_analyzer();
    }
  });

  // src/modules/timeline-engine/calendar-export.ts
  function formatIcsDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }
  function formatIcsDateTime(date) {
    const d = date || /* @__PURE__ */ new Date();
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }
  function escapeIcsText(str) {
    if (!str) return "";
    return String(str).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }
  function generateSubmissionCalendarFeed(submissions, manuscripts = [], options = {}) {
    const subs = Array.isArray(submissions) ? submissions : [submissions].filter(Boolean);
    const nowStamp = formatIcsDateTime(/* @__PURE__ */ new Date());
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Zotero Flow//Zotero PaperFlow//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:" + escapeIcsText(options.calName || "PaperFlow Revision Deadlines"),
      "X-WR-TIMEZONE:UTC"
    ];
    subs.forEach((sub) => {
      const dueDate = sub.revisionDueDate || sub.revisionDeadline;
      if (!dueDate) return;
      const startDate = formatIcsDate(dueDate);
      if (!startDate) return;
      const dueObj = new Date(dueDate);
      dueObj.setUTCDate(dueObj.getUTCDate() + 1);
      const endDate = formatIcsDate(dueObj);
      const man = manuscripts.find((m) => m.id === sub.manuscriptId);
      const paperTitle = man?.title || sub.title || "Untitled Manuscript";
      const journal = typeof getSubmissionJournalName === "function" ? getSubmissionJournalName(sub) : sub.targetJournal || sub.journal || "Target Journal";
      const reviewRows = typeof getSubmissionReviewMatrixRows === "function" ? getSubmissionReviewMatrixRows(sub) : sub.reviewMatrix || [];
      const commentsCount = reviewRows.length;
      const answeredCount = reviewRows.filter((r) => (r.response || "").trim()).length;
      const uid = `paperflow-${sub.id}-${startDate}@zoteroflow`;
      const summary = `[PaperFlow 修回截止] ${journal}: ${paperTitle}`;
      const desc = `手稿: ${paperTitle}
目标期刊: ${journal}
当前状态: ${sub.status || "revision"}
修回截止日期: ${dueDate}
审稿意见进度: 已回复 ${answeredCount}/${commentsCount} 条

请在 Zotero PaperFlow 中查阅同行评审回复矩阵与手稿修订时间轴。`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `DESCRIPTION:${escapeIcsText(desc)}`,
        `LOCATION:${escapeIcsText(journal)}`,
        "STATUS:CONFIRMED",
        "CATEGORIES:Academic,PaperFlow,Revision",
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeIcsText(`[PaperFlow] 距离 ${journal} 修回截止还剩 7 天！`)}`,
        "END:VALARM",
        "BEGIN:VALARM",
        "TRIGGER:-P3D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeIcsText(`[PaperFlow 紧急] 距离 ${journal} 修回截止仅剩 3 天！`)}`,
        "END:VALARM",
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeIcsText(`[PaperFlow 紧急] 明天是 ${journal} 修回最终截止日！`)}`,
        "END:VALARM",
        "END:VEVENT"
      );
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }
  function triggerCalendarDownload(icsContent, filename = "paperflow_deadlines.ics") {
    if (typeof Blob === "undefined" || typeof URL === "undefined" || typeof document === "undefined") {
      return;
    }
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function getExportedEscapeLatex() {
    return typeof escapeLatex === "function" ? escapeLatex : void 0;
  }
  var RFCalendar;
  var init_calendar_export = __esm({
    "src/modules/timeline-engine/calendar-export.ts"() {
      "use strict";
      init_status_lifecycle();
      RFCalendar = {
        getRevisionCountdownMeta: getRevisionCountdownMeta2,
        formatIcsDate,
        formatIcsDateTime,
        escapeIcsText,
        generateSubmissionCalendarFeed,
        triggerCalendarDownload
      };
    }
  });

  // src/modules/timeline-engine/calendar-and-status.ts
  var init_calendar_and_status = __esm({
    "src/modules/timeline-engine/calendar-and-status.ts"() {
      "use strict";
      init_status_lifecycle();
      init_calendar_export();
    }
  });

  // src/modules/timeline-engine.ts
  var require_timeline_engine = __commonJS({
    "src/modules/timeline-engine.ts"(exports, module) {
      init_drawer_and_manager();
      init_inline_editor();
      init_node_helpers();
      init_normalizer_and_analyzer();
      init_calendar_and_status();
      var timelineExports = {
        typeMeta,
        getTimelineTypeMeta,
        buildOptions,
        openStageDrawer: openStageDrawer2,
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
        applyInlineEventToSubmission: applyInlineEventToSubmission2,
        setInlineStageBusy,
        saveInlineStageEvent,
        todayString: todayString2,
        normalizeDateString: normalizeDateString2,
        dateInputToIso: dateInputToIso2,
        getNodeDate: getNodeDate2,
        isReviewTimelineNode,
        getReviewDecisionLabel,
        getLatestTimelineNode: getLatestTimelineNode2,
        createTimelineNode: createTimelineNode2,
        getTimelineNodeDisplayName: getTimelineNodeDisplayName2,
        getDaysDiff: getDaysDiff2,
        getRelativeDateLabel,
        inferKey: inferKey2,
        getTimelineNodeByKey: getTimelineNodeByKey2,
        setTimelineNodeDate,
        createCanonicalTimelineNode,
        ensureTimelineNode,
        hasPublicationStatus: hasPublicationStatus2,
        initializeSubmissionTimelineNodes,
        syncSubmissionFieldsFromTimeline,
        normalizeSubmissionTimeline: normalizeSubmissionTimeline2,
        analyzeSubmission,
        isAcceptedSubmission,
        canHavePublicationLink,
        clearPublicationLinkFields: clearPublicationLinkFields2,
        clearPublicationTimelineCompletion: clearPublicationTimelineCompletion2,
        clearUnacceptedPublicationLinks,
        getSubmissionCycleTime,
        computeNodeStatus: computeNodeStatus2,
        getNodeStatusLabel: getNodeStatusLabel2,
        autoSortNodes: autoSortNodes2,
        getCapsuleIcon,
        formatShortDate: formatShortDate2,
        getRevisionCountdownMeta: getRevisionCountdownMeta2,
        formatIcsDate,
        formatIcsDateTime,
        escapeIcsText,
        generateSubmissionCalendarFeed,
        triggerCalendarDownload,
        RFCalendar
      };
      var maybeEscapeLatex = getExportedEscapeLatex();
      if (maybeEscapeLatex) {
        timelineExports.escapeLatex = maybeEscapeLatex;
      }
      if (typeof globalThis !== "undefined") {
        Object.assign(globalThis, timelineExports);
      }
      if (typeof window !== "undefined") {
        Object.assign(window, timelineExports);
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = { ...module.exports || {}, ...timelineExports };
      }
    }
  });
  require_timeline_engine();
})();
