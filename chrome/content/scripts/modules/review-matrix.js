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

  // src/modules/review-matrix/checklist.ts
  function getSubmissionChecklistPreset(key) {
    return submissionComplianceChecklistPresets.find((preset) => preset.key === key) || null;
  }
  function getSubmissionChecklistLabel(key) {
    const preset = getSubmissionChecklistPreset(key);
    return preset ? preset.label() : key;
  }
  function isSubmissionChecklistDone(sub, key) {
    if (!sub?.complianceChecklist || typeof sub.complianceChecklist !== "object") return false;
    if (key in sub.complianceChecklist) return Boolean(sub.complianceChecklist[key]);
    const preset = getSubmissionChecklistPreset(key);
    return Boolean(preset?.legacyLabels?.some((label) => sub.complianceChecklist[label]));
  }
  function setSubmissionChecklistDone(sub, key, checked) {
    if (!sub.complianceChecklist || typeof sub.complianceChecklist !== "object") {
      sub.complianceChecklist = {};
    }
    const preset = getSubmissionChecklistPreset(key);
    preset?.legacyLabels?.forEach((label) => {
      delete sub.complianceChecklist[label];
    });
    sub.complianceChecklist[key] = Boolean(checked);
  }
  function getSubmissionChecklistKeys(sub) {
    const savedKeys = Array.isArray(sub?.complianceChecklistKeys) ? sub.complianceChecklistKeys.map((key) => String(key || "").trim()).filter(Boolean) : [];
    if (savedKeys.length) return savedKeys;
    const customKeys = Object.keys(sub?.complianceChecklist || {}).filter((key) => !submissionComplianceChecklistPresets.some((preset) => preset.key === key || preset.legacyLabels.includes(key)));
    return [
      ...submissionComplianceChecklistPresets.map((preset) => preset.key),
      ...customKeys
    ];
  }
  function collectSubmissionChecklistFromEditor() {
    const checklist = {};
    document.querySelectorAll("#sub-edit-compliance-checklist-container [data-checklist-item]").forEach((item) => {
      const key = String(item.getAttribute("data-checklist-key") || "").trim();
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (!key) return;
      checklist[key] = Boolean(checkbox?.checked);
    });
    return checklist;
  }
  function collectSubmissionChecklistKeysFromEditor() {
    return Array.from(document.querySelectorAll("#sub-edit-compliance-checklist-container [data-checklist-item]")).map((item) => String(item.getAttribute("data-checklist-key") || "").trim()).filter(Boolean);
  }
  function renderSubmissionChecklistEditor(sub, checklistKeys = getSubmissionChecklistKeys(sub)) {
    const checklistBox = document.getElementById("sub-edit-compliance-checklist-container");
    if (!checklistBox) return;
    window.RFUI.setHTML(checklistBox, checklistKeys.map((key) => {
      const isDone = isSubmissionChecklistDone(sub, key);
      const label = getSubmissionChecklistLabel(key);
      return `
      <div class="checklist-item submission-checklist-editor-item ${isDone ? "done" : ""}" data-checklist-item data-checklist-key="${escapeHTML(key)}">
        <label class="submission-checklist-toggle">
          <input type="checkbox" ${isDone ? "checked" : ""} data-key="${escapeHTML(key)}">
          <span>${escapeHTML(label)}</span>
        </label>
      </div>
    `;
    }).join(""));
    checklistBox.querySelectorAll("[data-checklist-item]").forEach((item) => {
      const key = item.getAttribute("data-checklist-key");
      const checkbox = item.querySelector('input[type="checkbox"]');
      checkbox?.addEventListener("change", (e) => {
        item.classList.toggle("done", e.target.checked);
        setSubmissionChecklistDone(sub, key, e.target.checked);
      });
    });
  }
  var init_checklist = __esm({
    "src/modules/review-matrix/checklist.ts"() {
      "use strict";
    }
  });

  // src/modules/review-matrix/filter-and-progress.ts
  function collectSubmissionReviewMatrixFromEditor() {
    const w = window;
    const rows = Array.from(document.querySelectorAll("#sub-edit-review-matrix-container [data-review-row]")).map((row, index) => ({
      id: row.getAttribute("data-review-id") || `rev_${index + 1}`,
      reviewer: row.querySelector(".sub-edit-review-reviewer")?.value || "Reviewer #1",
      status: row.querySelector(".sub-edit-review-status")?.value || "pending",
      comment: row.querySelector(".sub-edit-review-comment")?.value || "",
      response: row.querySelector(".sub-edit-review-response")?.value || "",
      changes: row.querySelector(".sub-edit-review-changes")?.value || ""
    }));
    return w.RFUI.normalizeReviewMatrix(rows);
  }
  function updateSubmissionRebuttalProgress(sub) {
    const w = window;
    const progressBox = document.getElementById("sub-edit-rebuttal-progress-container");
    if (!progressBox) return;
    const liveRows = collectSubmissionReviewMatrixFromEditor();
    const rows = liveRows.length > 0 ? liveRows : Array.isArray(sub?.reviewMatrix) ? sub.reviewMatrix : [];
    if (rows.length === 0) {
      w.RFUI.setHTML(progressBox, "");
      return;
    }
    const existingCard = progressBox.querySelector?.(".rebuttal-progress-card");
    const fillEl = existingCard?.querySelector?.(".rebuttal-progress-bar-fill");
    if (existingCard && fillEl) {
      const total = rows.length;
      const addressed = rows.filter((r) => r.status === "addressed" || r.status === "clarified" || r.status !== "in_progress" && (r.response || "").trim().length > 0).length;
      const inProgress = rows.filter((r) => r.status === "in_progress").length;
      const pending = Math.max(0, total - addressed - inProgress);
      const pct = total > 0 ? Math.round(addressed / total * 100) : 0;
      fillEl.style.width = `${pct}%`;
      fillEl.setAttribute?.("aria-valuenow", String(pct));
      fillEl.classList?.toggle?.("is-complete", pct === 100);
      existingCard.classList?.toggle?.("is-complete", pct === 100);
      const pctEl = existingCard.querySelector?.(".rebuttal-progress-pct");
      if (pctEl) pctEl.textContent = `${pct}%`;
      const setStat = (key, val) => {
        const el = existingCard.querySelector?.(`[data-rebuttal-stat="${key}"]`);
        if (el) el.textContent = String(val);
      };
      setStat("total", total);
      setStat("addressed", addressed);
      setStat("in_progress", inProgress);
      setStat("pending", pending);
      return;
    }
    w.RFUI.setHTML(progressBox, renderRebuttalProgressTracker({ ...sub, reviewMatrix: rows }));
  }
  function applyReviewMatrixFilter(reviewBox) {
    const box = reviewBox || document.getElementById("sub-edit-review-matrix-container");
    if (!box || typeof box.querySelectorAll !== "function") return;
    const state = g._reviewMatrixFilterState || { status: "all", reviewer: "all", collapseAddressed: false };
    const rows = box.querySelectorAll("[data-review-row]");
    rows.forEach((row) => {
      const rowStatus = String(row.querySelector?.(".sub-edit-review-status")?.value || row.getAttribute?.("data-status") || "pending");
      const rowReviewer = String(row.querySelector?.(".sub-edit-review-reviewer")?.value || "Reviewer #1");
      const isResolved = rowStatus === "addressed" || rowStatus === "clarified";
      const matchesStatus = state.status === "all" || state.status === "pending" && !isResolved || state.status === "addressed" && isResolved;
      const matchesReviewer = state.reviewer === "all" || rowReviewer === state.reviewer;
      row.hidden = !(matchesStatus && matchesReviewer);
      if (state.collapseAddressed && isResolved && !row.dataset.manualExpanded) {
        row.classList?.add?.("is-collapsed");
      } else if (!state.collapseAddressed && !row.dataset.manualCollapsed) {
        row.classList?.remove?.("is-collapsed");
      }
    });
    const collapseBtn = document.getElementById("btn-collapse-addressed-reviews");
    if (collapseBtn) {
      collapseBtn.classList?.toggle?.("active", Boolean(state.collapseAddressed));
      collapseBtn.setAttribute?.("aria-pressed", state.collapseAddressed ? "true" : "false");
    }
  }
  function autoResizeReviewTextarea(textarea) {
    if (!textarea || !textarea.style) return;
    try {
      if (typeof textarea.scrollHeight === "number" && textarea.scrollHeight > 0) {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(300, Math.max(66, textarea.scrollHeight))}px`;
      }
    } catch (_) {
    }
  }
  var g;
  var init_filter_and_progress = __esm({
    "src/modules/review-matrix/filter-and-progress.ts"() {
      "use strict";
      g = typeof globalThis !== "undefined" ? globalThis : window;
      if (!("_reviewMatrixFilterState" in g)) {
        g._reviewMatrixFilterState = { status: "all", reviewer: "all", collapseAddressed: false };
      }
    }
  });

  // src/modules/review-matrix/editor-and-filters.ts
  function getSubmissionReviewMatrixRows(sub, initialDraft = "") {
    if (Array.isArray(sub?.reviewMatrix) && sub.reviewMatrix.length) {
      return window.RFUI.normalizeReviewMatrix(sub.reviewMatrix);
    }
    const fallback = String(sub?.notes || initialDraft || "").trim();
    return fallback ? [window.RFUI.normalizeReviewMatrixRow({ id: "rev_1", comment: fallback, response: "" }, 0)] : [];
  }
  function renderSubmissionReviewMatrixEditor(sub, initialDraft = "") {
    const reviewBox = document.getElementById("sub-edit-review-matrix-container");
    if (!reviewBox) return;
    const requestMatrixAutoSave = (immediate = true) => {
      updateSubmissionRebuttalProgress(sub);
      document.getElementById("submission-entry-editor-panel")?.dispatchEvent(new CustomEvent("submission-autosave-request", {
        detail: { immediate }
      }));
    };
    let rafProgressId = null;
    const scheduleLiveProgressRefresh = (targetTextarea) => {
      if (targetTextarea) autoResizeReviewTextarea(targetTextarea);
      if (typeof requestAnimationFrame === "function") {
        if (rafProgressId != null && typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(rafProgressId);
        }
        rafProgressId = requestAnimationFrame(() => {
          rafProgressId = null;
          updateSubmissionRebuttalProgress(sub);
        });
      } else {
        updateSubmissionRebuttalProgress(sub);
      }
    };
    const renderRows = (rows, flipRects, flashRowId) => {
      sub.reviewMatrix = rows;
      updateSubmissionRebuttalProgress(sub);
      if (!rows.length) {
        window.RFUI.setHTML(reviewBox, `
        <div class="submission-review-empty">${escapeHTML(t("emptyReviewEditor") || "暂无审稿意见，点击上方“添加审稿意见”或“智能批量导入”开始录入。")}</div>
      `);
        return;
      }
      const reviewerOptions = ["Reviewer #1", "Reviewer #2", "Reviewer #3", "Reviewer #4", "Editor", "Associate Editor"];
      const statusOptions = [
        { value: "pending", label: t("statusPending") || (currentLanguage === "zh" ? "待处理" : "Pending") },
        { value: "in_progress", label: t("statusInProgress") || (currentLanguage === "zh" ? "处理修改中" : "In Progress") },
        { value: "addressed", label: t("statusAddressed") || (currentLanguage === "zh" ? "已答复完成" : "Addressed") },
        { value: "clarified", label: t("statusClarified") || (currentLanguage === "zh" ? "辩明解释 (无需改动)" : "Clarified") }
      ];
      const filterState = g2._reviewMatrixFilterState || { status: "all", reviewer: "all", collapseAddressed: false };
      const filterBarHtml = rows.length > 1 ? `
      <div class="review-matrix-filter-bar" role="toolbar" aria-label="${escapeHTML(t("peerReviewMatrixSection"))}">
        <div class="review-matrix-filter-controls">
          <select id="review-matrix-filter-status" class="review-matrix-filter-select" aria-label="${escapeHTML(t("statusFieldLabel"))}">
            <option value="all" ${filterState.status === "all" ? "selected" : ""}>${escapeHTML(t("filterReviewAll"))}</option>
            <option value="pending" ${filterState.status === "pending" ? "selected" : ""}>${escapeHTML(t("filterReviewPending"))}</option>
            <option value="addressed" ${filterState.status === "addressed" ? "selected" : ""}>${escapeHTML(t("filterReviewAddressed"))}</option>
          </select>
          <select id="review-matrix-filter-reviewer" class="review-matrix-filter-select" aria-label="${escapeHTML(t("reviewerFieldLabel"))}">
            <option value="all" ${filterState.reviewer === "all" ? "selected" : ""}>${escapeHTML(t("filterReviewerAll"))}</option>
            ${reviewerOptions.map((opt) => `<option value="${escapeHTML(opt)}" ${filterState.reviewer === opt ? "selected" : ""}>${escapeHTML(opt)}</option>`).join("")}
          </select>
        </div>
        <button type="button" class="btn-secondary btn-sm btn-collapse-addressed-reviews ${filterState.collapseAddressed ? "active" : ""}" id="btn-collapse-addressed-reviews" aria-pressed="${filterState.collapseAddressed ? "true" : "false"}">
          <span>${escapeHTML(t("collapseAddressedToggle"))}</span>
        </button>
      </div>
    ` : "";
      window.RFUI.setHTML(reviewBox, filterBarHtml + rows.map((row, index) => {
        const currentReviewer = row.reviewer || "Reviewer #1";
        const currentStatus = row.status || ((row.response || "").trim() ? "addressed" : "pending");
        const isResolved = currentStatus === "addressed" || currentStatus === "clarified";
        const isCollapsed = filterState.collapseAddressed && isResolved;
        const commentPreview = String(row.comment || "").trim().slice(0, 72) || t("noCommentText");
        return `
      <div class="submission-edit-review-row status-${escapeHTML(currentStatus)} ${isCollapsed ? "is-collapsed" : ""}" data-review-row data-review-id="${escapeHTML(row.id || `rev_${index + 1}`)}" data-status="${escapeHTML(currentStatus)}">
        <div class="submission-edit-review-row-head">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="submission-review-index">#${index + 1}</span>
            <select class="sub-edit-review-reviewer" aria-label="${escapeHTML(t("reviewerFieldLabel") || "Reviewer")}" style="font-size:12px; padding:3px 8px; border-radius:6px; width:auto; min-width:128px; font-weight:600;">
              ${reviewerOptions.map((opt) => `<option value="${escapeHTML(opt)}" ${currentReviewer === opt ? "selected" : ""}>${escapeHTML(opt)}</option>`).join("")}
            </select>
            <select class="sub-edit-review-status status-select-${escapeHTML(currentStatus)}" aria-label="${escapeHTML(t("statusFieldLabel") || "Status")}" style="font-size:12px; padding:3px 8px; border-radius:6px; width:auto; min-width:124px; font-weight:600;">
              ${statusOptions.map((opt) => `<option value="${escapeHTML(opt.value)}" ${currentStatus === opt.value ? "selected" : ""}>${escapeHTML(opt.label)}</option>`).join("")}
            </select>
            <span class="review-row-collapsed-snippet">${escapeHTML(commentPreview)}</span>
          </div>
          <div class="submission-edit-review-actions" style="display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
            <button type="button" class="btn-secondary btn-sm btn-toggle-review-collapse" title="${escapeHTML(t("toggleReviewCollapse"))}" aria-label="${escapeHTML(t("toggleReviewCollapse"))}" style="padding:2px 7px; font-size:11px;">▾</button>
            <button type="button" class="btn-secondary btn-sm btn-move-review-up" ${index === 0 ? "disabled" : ""} title="${escapeHTML(t("moveCommentUp") || "上移")}" style="padding:2px 7px; font-size:11px;">↑ ${escapeHTML(t("moveUpShort") || (currentLanguage === "zh" ? "上移" : "Up"))}</button>
            <button type="button" class="btn-secondary btn-sm btn-move-review-down" ${index === rows.length - 1 ? "disabled" : ""} title="${escapeHTML(t("moveCommentDown") || "下移")}" style="padding:2px 7px; font-size:11px;">↓ ${escapeHTML(t("moveDownShort") || (currentLanguage === "zh" ? "下移" : "Down"))}</button>
            <button type="button" class="btn-secondary btn-sm btn-copy-full-qa" title="${escapeHTML(t("copyFullCommentItem") || "复制完整问答条目")}" style="padding:2px 8px; font-size:11px;">📋 ${escapeHTML(t("copyItemShort") || (currentLanguage === "zh" ? "复制问答" : "Copy Q&A"))}</button>
            <button type="button" class="btn-secondary btn-sm btn-copy-review-response" style="padding:2px 8px; font-size:11px;">${escapeHTML(t("copy"))}</button>
            <button type="button" class="btn-danger btn-sm btn-delete-review-row" style="padding:2px 8px; font-size:11px;">${escapeHTML(t("removeComment"))}</button>
          </div>
        </div>
        <div class="submission-edit-review-fields">
          <div class="form-group">
            <label>${escapeHTML(t("reviewerCommentTitle") || tf("reviewerCommentLabel", { count: index + 1 }))}</label>
            <textarea class="sub-edit-review-comment" rows="3" placeholder="${escapeHTML(t("reviewerCommentPlaceholder"))}">${escapeHTML(row.comment || "")}</textarea>
          </div>
          <div class="form-group">
            <label>${escapeHTML(t("authorResponseLabel"))}</label>
            <textarea class="sub-edit-review-response" rows="3" placeholder="${escapeHTML(t("authorResponsePlaceholder"))}">${escapeHTML(row.response || "")}</textarea>
          </div>
          <div class="form-group" style="grid-column: 1 / -1; margin-top: 2px;">
            <label style="display:flex; align-items:center; gap:6px; color:var(--text-secondary);">
              <span>📍 ${escapeHTML(t("changesFieldLabel") || (currentLanguage === "zh" ? "手稿修订说明与位置 (页码/行号)" : "Changes in Manuscript & Locations"))}</span>
            </label>
            <input type="text" class="sub-edit-review-changes" value="${escapeHTML(row.changes || "")}" placeholder="${escapeHTML(t("changesPlaceholder") || (currentLanguage === "zh" ? "例如: Page 4, Lines 120-135; 已补充表 S2" : "e.g. Page 4, Lines 120-135; Supplementary Table S2 added"))}">
          </div>
        </div>
      </div>
    `;
      }).join(""));
      reviewBox.querySelector("#review-matrix-filter-status")?.addEventListener("change", (e) => {
        g2._reviewMatrixFilterState.status = e.target.value;
        applyReviewMatrixFilter(reviewBox);
      });
      reviewBox.querySelector("#review-matrix-filter-reviewer")?.addEventListener("change", (e) => {
        g2._reviewMatrixFilterState.reviewer = e.target.value;
        applyReviewMatrixFilter(reviewBox);
      });
      reviewBox.querySelector("#btn-collapse-addressed-reviews")?.addEventListener("click", () => {
        g2._reviewMatrixFilterState.collapseAddressed = !g2._reviewMatrixFilterState.collapseAddressed;
        reviewBox.querySelectorAll?.("[data-review-row]").forEach((r) => {
          if (r.dataset) {
            delete r.dataset.manualExpanded;
            delete r.dataset.manualCollapsed;
          }
        });
        applyReviewMatrixFilter(reviewBox);
      });
      reviewBox.querySelectorAll("[data-review-row]").forEach((rowEl, idx) => {
        const statusSel = rowEl.querySelector(".sub-edit-review-status");
        statusSel?.addEventListener("change", () => {
          const nextSt = statusSel.value;
          rowEl.setAttribute("data-status", nextSt);
          rowEl.className = `submission-edit-review-row status-${nextSt}${rowEl.classList?.contains("is-collapsed") ? " is-collapsed" : ""}`;
          statusSel.className = `sub-edit-review-status status-select-${nextSt}`;
          updateSubmissionRebuttalProgress(sub);
          applyReviewMatrixFilter(reviewBox);
        });
        const collapseRowBtn = rowEl.querySelector(".btn-toggle-review-collapse");
        collapseRowBtn?.addEventListener("click", () => {
          const nextCollapsed = !rowEl.classList?.contains?.("is-collapsed");
          rowEl.classList?.toggle?.("is-collapsed", nextCollapsed);
          if (rowEl.dataset) {
            if (nextCollapsed) {
              rowEl.dataset.manualCollapsed = "true";
              delete rowEl.dataset.manualExpanded;
            } else {
              rowEl.dataset.manualExpanded = "true";
              delete rowEl.dataset.manualCollapsed;
            }
          }
        });
        rowEl.querySelectorAll?.(".sub-edit-review-comment, .sub-edit-review-response").forEach((ta) => {
          autoResizeReviewTextarea(ta);
          ta.addEventListener?.("input", () => scheduleLiveProgressRefresh(ta));
        });
        const moveUpBtn = rowEl.querySelector(".btn-move-review-up");
        moveUpBtn?.addEventListener("click", () => {
          const current = collectSubmissionReviewMatrixFromEditor();
          if (idx > 0) {
            const prevRects = window.RFUI.captureElementRects(reviewBox, "[data-review-row]", "data-review-id");
            const movedId = current[idx]?.id;
            const temp = current[idx - 1];
            current[idx - 1] = current[idx];
            current[idx] = temp;
            renderRows(current, prevRects, movedId);
            requestMatrixAutoSave();
          }
        });
        const moveDownBtn = rowEl.querySelector(".btn-move-review-down");
        moveDownBtn?.addEventListener("click", () => {
          const current = collectSubmissionReviewMatrixFromEditor();
          if (idx < current.length - 1) {
            const prevRects = window.RFUI.captureElementRects(reviewBox, "[data-review-row]", "data-review-id");
            const movedId = current[idx]?.id;
            const temp = current[idx + 1];
            current[idx + 1] = current[idx];
            current[idx] = temp;
            renderRows(current, prevRects, movedId);
            requestMatrixAutoSave();
          }
        });
        const copyQaBtn = rowEl.querySelector(".btn-copy-full-qa");
        copyQaBtn?.addEventListener("click", () => {
          const rev = rowEl.querySelector(".sub-edit-review-reviewer")?.value || "Reviewer";
          const cmt = rowEl.querySelector(".sub-edit-review-comment")?.value || "";
          const rsp = rowEl.querySelector(".sub-edit-review-response")?.value || "";
          const chg = rowEl.querySelector(".sub-edit-review-changes")?.value || "";
          const block = `[${rev} - Comment #${idx + 1}]
${cmt}

[Author Response]
${rsp}${chg ? `

[Changes in Manuscript]
${chg}` : ""}`;
          navigator.clipboard?.writeText(block);
          showGlobalToast(currentLanguage === "zh" ? "已复制完整审稿问答块！" : "Copied Q&A block to clipboard!", "success");
        });
        const copyBtn = rowEl.querySelector(".btn-copy-review-response");
        copyBtn?.addEventListener("click", () => {
          const val = rowEl.querySelector(".sub-edit-review-response")?.value || "";
          navigator.clipboard?.writeText(val);
          showGlobalToast(currentLanguage === "zh" ? "已复制回复内容！" : "Response copied to clipboard!", "success");
        });
        const deleteBtn = rowEl.querySelector(".btn-delete-review-row");
        deleteBtn?.addEventListener("click", () => {
          const nextRows = collectSubmissionReviewMatrixFromEditor().filter((_, rowIndex) => rowIndex !== idx);
          renderRows(nextRows);
          requestMatrixAutoSave();
        });
      });
      applyReviewMatrixFilter(reviewBox);
      if (flipRects && flipRects.size > 0) {
        window.RFUI.playFlipAnimation(reviewBox, "[data-review-row]", "data-review-id", flipRects, "review-row-reordered-flash");
      } else if (flashRowId) {
        const targetRow = reviewBox.querySelector?.(`[data-review-id="${flashRowId}"]`);
        targetRow?.classList?.add?.("review-row-reordered-flash");
      }
    };
    renderRows(getSubmissionReviewMatrixRows(sub, initialDraft));
    const addButton = document.getElementById("btn-add-review-comment");
    if (addButton) {
      addButton.onclick = () => {
        const existing = collectSubmissionReviewMatrixFromEditor();
        const lastReviewer = existing.length > 0 ? existing[existing.length - 1].reviewer : "Reviewer #1";
        renderRows([
          ...existing,
          { id: `rev_${Date.now()}`, reviewer: lastReviewer, status: "pending", comment: "", response: "", changes: "" }
        ]);
        const comments = reviewBox.querySelectorAll(".sub-edit-review-comment");
        comments[comments.length - 1]?.focus?.();
        requestMatrixAutoSave(false);
      };
    }
    const batchImportButton = document.getElementById("btn-batch-import-reviews");
    if (batchImportButton) {
      batchImportButton.onclick = () => {
        openBatchReviewImportModal(sub, reviewBox, () => {
          renderRows(sub.reviewMatrix || []);
          requestMatrixAutoSave(true);
        });
      };
    }
  }
  function renderSubmissionReviewPreview(sub, checklistKeys = getSubmissionChecklistKeys(sub)) {
    const previewBox = document.getElementById("submission-review-preview");
    if (!previewBox) return;
    const doneCount = checklistKeys.filter((key) => Boolean(sub?.complianceChecklist?.[key])).length;
    const reviewRows = getSubmissionReviewMatrixRows(sub);
    const completedReviewCount = reviewRows.filter((row) => Boolean(row.response)).length;
    const checklistPreview = checklistKeys.map((key) => {
      const done = Boolean(sub?.complianceChecklist?.[key]);
      return `
      <span class="submission-preview-chip ${done ? "done" : ""}">
        <span aria-hidden="true">${done ? "✓" : "·"}</span>
        <span>${escapeHTML(getSubmissionChecklistLabel(key))}</span>
      </span>
    `;
    }).join("");
    const reviewPreview = reviewRows.length ? reviewRows.map((row, index) => `
      <article class="submission-review-preview-item ${row.response ? "is-answered" : "is-pending"}">
        <div class="submission-review-preview-head">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <strong>${escapeHTML(row.reviewer || "Reviewer #1")} · #${index + 1}</strong>
          </div>
          <span class="badge ${row.status === "addressed" || row.status === "clarified" || row.response ? "badge-success" : row.status === "in_progress" ? "badge-info" : "badge-warning"}">
            ${escapeHTML(row.status === "addressed" ? t("statusAddressed") : row.status === "clarified" ? t("rebuttalClarified") : row.status === "in_progress" ? t("rebuttalInProgress") : row.response ? t("responseSaved") : t("responsePending"))}
          </span>
        </div>
        <p>${escapeHTML(row.comment || t("noCommentText"))}</p>
        ${row.response ? `<blockquote>${escapeHTML(row.response)}</blockquote>` : ""}
        ${row.changes ? `<div style="font-size:11px; color:#059669; margin-top:6px; font-weight:500;">📍 ${escapeHTML(row.changes)}</div>` : ""}
      </article>
    `).join("") : `<div class="submission-review-empty">${escapeHTML(t("emptyReviewPreview"))}</div>`;
    window.RFUI.setHTML(previewBox, `
    <div class="submission-review-preview-summary">
      <span>${escapeHTML(t("checklistLabel"))}: <strong>${doneCount}/${checklistKeys.length}</strong></span>
      <span>${escapeHTML(t("responsesLabel"))}: <strong>${completedReviewCount}/${reviewRows.length}</strong></span>
    </div>
    <div class="submission-preview-chip-list">${checklistPreview}</div>
    <div class="submission-review-preview-list">${reviewPreview}</div>
  `);
  }
  var g2;
  var init_editor_and_filters = __esm({
    "src/modules/review-matrix/editor-and-filters.ts"() {
      "use strict";
      init_checklist();
      init_filter_and_progress();
      g2 = typeof globalThis !== "undefined" ? globalThis : window;
    }
  });

  // src/modules/review-matrix.ts
  var require_review_matrix = __commonJS({
    "src/modules/review-matrix.ts"(exports, module) {
      init_checklist();
      init_editor_and_filters();
      var reviewMatrixExports = {
        getSubmissionChecklistPreset,
        getSubmissionChecklistLabel,
        isSubmissionChecklistDone,
        setSubmissionChecklistDone,
        getSubmissionChecklistKeys,
        collectSubmissionChecklistFromEditor,
        collectSubmissionChecklistKeysFromEditor,
        renderSubmissionChecklistEditor,
        getSubmissionReviewMatrixRows,
        collectSubmissionReviewMatrixFromEditor,
        updateSubmissionRebuttalProgress,
        applyReviewMatrixFilter,
        renderSubmissionReviewMatrixEditor,
        renderSubmissionReviewPreview
      };
      if (typeof globalThis !== "undefined") {
        Object.assign(globalThis, reviewMatrixExports);
      }
      if (typeof window !== "undefined") {
        Object.assign(window, reviewMatrixExports);
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = { ...module.exports || {}, ...reviewMatrixExports };
      }
    }
  });
  require_review_matrix();
})();
