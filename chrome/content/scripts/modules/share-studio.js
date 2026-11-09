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

  // src/modules/share-studio/preferences-and-data.ts
  function getShareThemes() {
    return [
      { id: "estuary", labelKey: "shareEstuary" },
      { id: "iris", labelKey: "shareIris" },
      { id: "amber", labelKey: "shareAmber" },
      { id: "journal", labelKey: "shareJournal" },
      { id: "conference", labelKey: "shareConference" },
      { id: "archive", labelKey: "shareArchive" },
      { id: "paper", labelKey: "sharePaper" },
      { id: "ink", labelKey: "shareInk" },
      { id: "blueprint", labelKey: "shareBlueprint" },
      { id: "minimal", labelKey: "shareMinimal" },
      { id: "cyber", labelKey: "shareCyber" },
      { id: "aurora", labelKey: "shareAurora" },
      { id: "terminal", labelKey: "shareTerminal" }
    ];
  }
  function getShareFieldControls() {
    return [
      { key: "title", labelKey: "shareFieldTitle" },
      { key: "journal", labelKey: "shareFieldJournal" },
      { key: "author", labelKey: "shareFieldAuthor" },
      { key: "status", labelKey: "shareFieldStatus" },
      { key: "duration", labelKey: "shareFieldDuration" },
      { key: "dates", labelKey: "shareFieldDates" },
      { key: "footer", labelKey: "shareFieldFooter" }
    ];
  }
  function normalizeSharePreferences(raw = {}) {
    const validThemes = new Set(getShareThemes().map((item) => item.id));
    const validSizes = /* @__PURE__ */ new Set(["portrait", "story", "auto"]);
    const validStarts = /* @__PURE__ */ new Set(["experiment", "submission"]);
    const validBrandSizes = /* @__PURE__ */ new Set(["compact", "balanced", "bold"]);
    const validResolutions = /* @__PURE__ */ new Set(["standard", "high", "ultra"]);
    const visible = Object.fromEntries(getShareFieldControls().map(({ key }) => [
      key,
      raw?.visible && key in raw.visible ? Boolean(raw.visible[key]) : true
    ]));
    return {
      theme: validThemes.has(raw?.theme) ? raw.theme : SHARE_THEME_DEFAULT,
      size: validSizes.has(raw?.size) ? raw.size : SHARE_SIZE_DEFAULT,
      timelineStart: validStarts.has(raw?.timelineStart) ? raw.timelineStart : SHARE_TIMELINE_START_DEFAULT,
      brandSize: validBrandSizes.has(raw?.brandSize) ? raw.brandSize : SHARE_BRAND_SIZE_DEFAULT,
      resolution: validResolutions.has(raw?.resolution) ? raw.resolution : SHARE_RESOLUTION_DEFAULT,
      visible
    };
  }
  function getSharePreferences() {
    if (!db.settings) db.settings = {};
    db.settings.shareCard = normalizeSharePreferences(db.settings.shareCard);
    return db.settings.shareCard;
  }
  async function persistSharePreferences(nextPrefs) {
    if (!db.settings) db.settings = {};
    const normalized = normalizeSharePreferences(nextPrefs);
    db.settings.shareCard = normalized;
    sharePreferenceWrites = (sharePreferenceWrites || Promise.resolve()).catch(() => {
    }).then(async () => {
      if (!window.storage?.saveAll) return;
      const latest = await window.storage.loadAll();
      if (!latest.settings) latest.settings = {};
      latest.settings.shareCard = normalized;
      db = await window.storage.saveAll(latest, { mergeOnConflict: true }) || latest;
    }).catch((error) => {
      console.warn("Could not persist share card preferences:", error);
      showGlobalToast(t("sharePrefsFailed"), "warning");
    });
    return sharePreferenceWrites;
  }
  function buildSubmissionShareJourneyData(sub, overrides = {}) {
    const man = (db.manuscripts || []).find((item) => item.id === sub.manuscriptId) || null;
    const analysis = analyzeSubmission(sub);
    const title = man?.title || sub.title || t("untitledManuscript");
    const journal = getSubmissionJournalName(sub);
    const firstAuthor = getSubmissionFirstAuthor(sub, man);
    const statusLabel = getSubmissionStatusLabel(sub.status || "submitted");
    const durationDays = analysis.accepted ? analysis.submitToAccept ?? getSubmissionCycleTime(sub).days : analysis.submitToNow ?? getSubmissionCycleTime(sub).days;
    const events = (analysis.events || []).map((node) => {
      const key = inferKey(node);
      const date = window.RFUI?.getTimelineEventDate ? window.RFUI.getTimelineEventDate(node, key) : getNodeDate(node);
      return {
        key,
        type: node.type,
        name: node.name,
        rawName: node.name,
        label: getTimelineNodeDisplayName(node),
        date
      };
    });
    const prefs = normalizeSharePreferences({
      ...getSharePreferences(),
      ...overrides,
      visible: { ...getSharePreferences().visible, ...overrides.visible || {} }
    });
    const omittedCount = Math.max(0, events.filter((event) => Boolean(event.date)).length - 40);
    return window.RFShareCard.buildSubmissionShareCardData({
      language: currentLanguage,
      theme: prefs.theme,
      size: prefs.size,
      timelineStart: prefs.timelineStart,
      brandSize: prefs.brandSize,
      resolution: prefs.resolution,
      visible: prefs.visible,
      title,
      journal,
      firstAuthor,
      status: sub.status || "submitted",
      statusLabel,
      durationDays,
      events,
      labels: {
        eyebrow: t("shareJourneyEyebrow"),
        journalLabel: t("shareJournalLabel"),
        firstAuthorLabel: t("firstAuthorLabel"),
        statusTitle: t("shareJourneyStatus"),
        durationLabel: t("shareJourneyDuration"),
        daysUnit: t("days"),
        timelineTitle: t("shareJourneyTimeline"),
        emptyEventsText: t("shareJourneyNoEvents"),
        footer: t("shareJourneyFooter"),
        omittedLabel: omittedCount ? tf("shareOmitted", { count: omittedCount }) : ""
      }
    });
  }
  function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      if (typeof canvas.toBlob === "function") {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("PNG blob unavailable"));
        }, "image/png");
        return;
      }
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(",")[1] || "";
        const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
        resolve(new Blob([bytes], { type: "image/png" }));
      } catch (error) {
        reject(error);
      }
    });
  }
  function shareCardFileName(sub) {
    const journal = String(getSubmissionJournalName(sub) || "submission").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 36) || "submission";
    return `zotero-paperflow-${journal}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.png`;
  }
  async function savePngBlobWithPath(blob, filename) {
    const hostSave = window.parent?.Zotero?.ResearchFlow?.saveSharePngWithPicker;
    if (typeof hostSave === "function") {
      const buffer = await blob.arrayBuffer();
      const result = await hostSave(new Uint8Array(buffer), filename);
      if (result?.cancelled) return { cancelled: true, path: "" };
      return { cancelled: false, path: result?.path || filename };
    }
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return { cancelled: false, path: filename };
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
    }
  }
  async function copyPngBlobToClipboard(blob) {
    const hostCopy = window.parent?.Zotero?.ResearchFlow?.copySharePngToClipboard;
    if (typeof hostCopy === "function") {
      const buffer = await blob.arrayBuffer();
      return Boolean(await hostCopy(new Uint8Array(buffer)));
    }
    if (navigator.clipboard?.write && typeof ClipboardItem === "function") {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return true;
    }
    return false;
  }
  var g, SHARE_THEME_DEFAULT, SHARE_SIZE_DEFAULT, SHARE_TIMELINE_START_DEFAULT, SHARE_BRAND_SIZE_DEFAULT, SHARE_RESOLUTION_DEFAULT;
  var init_preferences_and_data = __esm({
    "src/modules/share-studio/preferences-and-data.ts"() {
      "use strict";
      g = typeof globalThis !== "undefined" ? globalThis : window;
      if (!("sharePreferenceWrites" in g)) g.sharePreferenceWrites = Promise.resolve();
      if (!("activeSharePreviewUrl" in g)) g.activeSharePreviewUrl = null;
      if (!("activeSharePreviewCleanup" in g)) g.activeSharePreviewCleanup = null;
      SHARE_THEME_DEFAULT = "estuary";
      SHARE_SIZE_DEFAULT = "portrait";
      SHARE_TIMELINE_START_DEFAULT = "experiment";
      SHARE_BRAND_SIZE_DEFAULT = "balanced";
      SHARE_RESOLUTION_DEFAULT = "high";
    }
  });

  // src/modules/share-studio/modal-controller.ts
  function clearActiveSharePreview() {
    if (activeSharePreviewUrl) {
      URL.revokeObjectURL(activeSharePreviewUrl);
      activeSharePreviewUrl = null;
    }
    if (typeof activeSharePreviewCleanup === "function") {
      const cleanup = activeSharePreviewCleanup;
      activeSharePreviewCleanup = null;
      cleanup();
    }
  }
  async function openSubmissionShareModal(subId) {
    const sub = (db.submissions || []).find((item) => item.id === subId);
    if (!sub) {
      showGlobalToast(t("submissionNotFound"), "error");
      renderDashboard();
      return;
    }
    if (!window.RFShareCard?.renderSubmissionShareCard) {
      showGlobalToast(t("shareJourneyFailed"), "error");
      return;
    }
    clearActiveSharePreview();
    let prefs = getSharePreferences();
    const themeChoices = getShareThemes().map((theme) => `
    <button type="button" class="share-theme-pill ${prefs.theme === theme.id ? "active" : ""}" data-share-theme="${escapeHTML(theme.id)}" aria-pressed="${prefs.theme === theme.id ? "true" : "false"}">
      <span class="share-theme-swatch share-theme-${escapeHTML(theme.id)}" aria-hidden="true"></span>
      <span>${escapeHTML(t(theme.labelKey))}</span>
    </button>
  `).join("");
    const fieldToggles = getShareFieldControls().map((field) => `
    <label class="share-toggle-chip">
      <input type="checkbox" data-share-visible="${escapeHTML(field.key)}" ${prefs.visible[field.key] ? "checked" : ""}>
      <span>${escapeHTML(t(field.labelKey))}</span>
    </label>
  `).join("");
    openModal(`
    <div class="modal-header">
      <div>
        <h2>${escapeHTML(t("shareJourneyTitle"))}</h2>
        <p class="text-muted" style="font-size:12px; margin-top:4px;">${escapeHTML(t("shareJourneyHelp"))}</p>
      </div>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="${escapeHTML(t("close"))}">✕</button>
    </div>
    <div class="share-journey-studio">
      <div class="share-journey-controls" aria-label="${escapeHTML(t("shareAppearance"))}">
        <div class="share-control-group">
          <div class="share-control-head">
            <span>${escapeHTML(t("shareAppearance"))}</span>
            <span class="share-control-caption">${escapeHTML(t("shareGallery"))}</span>
          </div>
          <div class="share-theme-grid" role="group" aria-label="${escapeHTML(t("shareAppearance"))}">${themeChoices}</div>
        </div>
        <div class="share-control-group">
          <div class="share-control-head">
            <span>${escapeHTML(t("shareVisibilityTitle"))}</span>
            <small>${escapeHTML(t("shareVisibilityHelp"))}</small>
          </div>
          <div class="share-toggle-grid">${fieldToggles}</div>
        </div>
        <div class="share-control-group share-select-grid">
          <label class="share-select-field">
            <span>${escapeHTML(t("shareTimelineStart"))}</span>
            <select id="share-timeline-start">
              <option value="experiment" ${prefs.timelineStart === "experiment" ? "selected" : ""}>${escapeHTML(t("shareTimelineStartExperiment"))}</option>
              <option value="submission" ${prefs.timelineStart === "submission" ? "selected" : ""}>${escapeHTML(t("shareTimelineStartSubmission"))}</option>
            </select>
          </label>
          <label class="share-select-field">
            <span>${escapeHTML(t("shareSizeTitle"))}</span>
            <select id="share-card-size">
              <option value="portrait" ${prefs.size === "portrait" ? "selected" : ""}>${escapeHTML(t("shareSizePortrait"))}</option>
              <option value="story" ${prefs.size === "story" ? "selected" : ""}>${escapeHTML(t("shareSizeStory"))}</option>
              <option value="auto" ${prefs.size === "auto" ? "selected" : ""}>${escapeHTML(t("shareSizeAuto"))}</option>
            </select>
          </label>
          <label class="share-select-field">
            <span>${escapeHTML(t("shareBrandSize"))}</span>
            <select id="share-brand-size">
              <option value="compact" ${prefs.brandSize === "compact" ? "selected" : ""}>${escapeHTML(t("shareBrandCompact"))}</option>
              <option value="balanced" ${prefs.brandSize === "balanced" ? "selected" : ""}>${escapeHTML(t("shareBrandBalanced"))}</option>
              <option value="bold" ${prefs.brandSize === "bold" ? "selected" : ""}>${escapeHTML(t("shareBrandBold"))}</option>
            </select>
          </label>
          <label class="share-select-field">
            <span>${escapeHTML(t("shareResolution"))}</span>
            <select id="share-card-resolution">
              <option value="standard" ${prefs.resolution === "standard" ? "selected" : ""}>${escapeHTML(t("shareResolutionStandard"))}</option>
              <option value="high" ${prefs.resolution === "high" ? "selected" : ""}>${escapeHTML(t("shareResolutionHigh"))}</option>
              <option value="ultra" ${prefs.resolution === "ultra" ? "selected" : ""}>${escapeHTML(t("shareResolutionUltra"))}</option>
            </select>
          </label>
        </div>
        <div class="share-control-reset-row">
          <button type="button" class="btn-secondary btn-sm" id="btn-reset-share-style">${escapeHTML(t("shareStyleReset"))}</button>
          <span>${escapeHTML(t("shareStyleResetHelp"))}</span>
        </div>
      </div>
      <div class="share-journey-preview-column">
        <div class="share-preview-toolbar">
          <span class="share-preview-dimensions" id="share-preview-dimensions">720 × 960 px</span>
          <div class="share-preview-toolbar-actions">
            <button type="button" class="btn-secondary btn-sm" id="btn-retry-share-preview" hidden>${escapeHTML(t("shareRetry"))}</button>
            <button type="button" class="btn-secondary btn-sm" id="btn-toggle-share-zoom" aria-pressed="false">${escapeHTML(t("shareZoom"))}</button>
          </div>
        </div>
        <div class="share-journey-preview-wrap" id="share-journey-preview-wrap">
          <img id="share-journey-preview" alt="${escapeHTML(t("shareJourneyTitle"))}">
        </div>
      </div>
    </div>
    <div class="share-journey-save-status" id="share-journey-save-status" role="status" aria-live="polite">
      ${escapeHTML(t("shareJourneySaveHelp"))}
    </div>
    <div class="modal-footer share-journey-actions">
      <button type="button" class="btn-secondary" id="btn-copy-share-image">${escapeHTML(t("shareJourneyCopy"))}</button>
      <button type="button" class="btn-primary" id="btn-download-share-image">${escapeHTML(t("shareJourneyDownload"))}</button>
    </div>
  `);
    const preview = document.getElementById("share-journey-preview");
    const previewWrap = document.getElementById("share-journey-preview-wrap");
    const dimensionsEl = document.getElementById("share-preview-dimensions");
    const zoomBtn = document.getElementById("btn-toggle-share-zoom");
    const retryBtn = document.getElementById("btn-retry-share-preview");
    const statusEl = document.getElementById("share-journey-save-status");
    const downloadBtn = document.getElementById("btn-download-share-image");
    const copyBtn = document.getElementById("btn-copy-share-image");
    const filename = shareCardFileName(sub);
    let currentBlob = null;
    let renderSeq = 0;
    let closed = false;
    activeSharePreviewCleanup = () => {
      closed = true;
    };
    registerModalCleanup(clearActiveSharePreview);
    const setSaveStatus = (message, state = "neutral") => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.dataset.state = state;
    };
    const syncControlSelection = () => {
      modalContent.querySelectorAll("[data-share-theme]").forEach((btn) => {
        const active = btn.getAttribute("data-share-theme") === prefs.theme;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      modalContent.querySelectorAll("[data-share-visible]").forEach((input) => {
        const key = input.getAttribute("data-share-visible");
        input.checked = Boolean(prefs.visible[key]);
      });
      const sizeSelect = document.getElementById("share-card-size");
      const startSelect = document.getElementById("share-timeline-start");
      const brandSelect = document.getElementById("share-brand-size");
      const resolutionSelect = document.getElementById("share-card-resolution");
      if (sizeSelect) sizeSelect.value = prefs.size;
      if (startSelect) startSelect.value = prefs.timelineStart;
      if (brandSelect) brandSelect.value = prefs.brandSize;
      if (resolutionSelect) resolutionSelect.value = prefs.resolution;
    };
    const renderPreview = async () => {
      const seq = ++renderSeq;
      try {
        setSaveStatus(t("shareRendering"), "pending");
        if (retryBtn) retryBtn.hidden = true;
        if (downloadBtn) downloadBtn.disabled = true;
        if (copyBtn) copyBtn.disabled = true;
        const canvas = document.createElement("canvas");
        const cardData = buildSubmissionShareJourneyData(sub, prefs);
        const rendered = window.RFShareCard.renderSubmissionShareCard(canvas, cardData);
        const blob = await canvasToPngBlob(canvas);
        if (closed || seq !== renderSeq) return;
        if (activeSharePreviewUrl) URL.revokeObjectURL(activeSharePreviewUrl);
        activeSharePreviewUrl = URL.createObjectURL(blob);
        currentBlob = blob;
        if (preview) preview.src = activeSharePreviewUrl;
        if (dimensionsEl) {
          const pixelInfo = `${rendered.pixelWidth || rendered.width} × ${rendered.pixelHeight || rendered.height} px`;
          dimensionsEl.textContent = rendered.resolutionLimited ? `${pixelInfo} · ${t("shareResolutionLimited")}` : pixelInfo;
        }
        setSaveStatus(t("shareJourneySaveHelp"), "neutral");
      } catch (error) {
        if (closed || seq !== renderSeq) return;
        console.error("Share card generation failed:", error);
        currentBlob = null;
        if (retryBtn) retryBtn.hidden = false;
        setSaveStatus(t("sharePreviewError"), "error");
        showGlobalToast(t("shareJourneyFailed"), "error");
      } finally {
        if (!closed && seq === renderSeq) {
          const ready = Boolean(currentBlob);
          if (downloadBtn) downloadBtn.disabled = !ready;
          if (copyBtn) copyBtn.disabled = !ready;
        }
      }
    };
    const updatePrefs = async (patch) => {
      prefs = normalizeSharePreferences({
        ...prefs,
        ...patch,
        visible: { ...prefs.visible, ...patch.visible || {} }
      });
      syncControlSelection();
      await renderPreview();
      await persistSharePreferences(prefs);
    };
    modalContent.querySelectorAll("[data-share-theme]").forEach((btn) => {
      btn.addEventListener("click", () => updatePrefs({ theme: btn.getAttribute("data-share-theme") }));
    });
    modalContent.querySelectorAll("[data-share-visible]").forEach((input) => {
      input.addEventListener("change", () => updatePrefs({
        visible: { [input.getAttribute("data-share-visible")]: input.checked }
      }));
    });
    document.getElementById("share-timeline-start")?.addEventListener("change", (event) => {
      updatePrefs({ timelineStart: event.target.value });
    });
    document.getElementById("share-card-size")?.addEventListener("change", (event) => {
      updatePrefs({ size: event.target.value });
    });
    document.getElementById("share-brand-size")?.addEventListener("change", (event) => {
      updatePrefs({ brandSize: event.target.value });
    });
    document.getElementById("share-card-resolution")?.addEventListener("change", (event) => {
      updatePrefs({ resolution: event.target.value });
    });
    document.getElementById("btn-reset-share-style")?.addEventListener("click", () => {
      updatePrefs({
        theme: SHARE_THEME_DEFAULT,
        size: SHARE_SIZE_DEFAULT,
        timelineStart: SHARE_TIMELINE_START_DEFAULT,
        brandSize: SHARE_BRAND_SIZE_DEFAULT,
        resolution: SHARE_RESOLUTION_DEFAULT
      });
    });
    const toggleZoom = () => {
      if (!previewWrap || !zoomBtn) return;
      const zoomed = previewWrap.classList.toggle("is-zoomed");
      zoomBtn.setAttribute("aria-pressed", zoomed ? "true" : "false");
      zoomBtn.textContent = t(zoomed ? "shareFit" : "shareZoom");
    };
    zoomBtn?.addEventListener("click", toggleZoom);
    preview?.addEventListener("click", toggleZoom);
    retryBtn?.addEventListener("click", () => renderPreview());
    downloadBtn?.addEventListener("click", async () => {
      if (!currentBlob) return;
      downloadBtn.disabled = true;
      try {
        setSaveStatus(t("shareJourneySaving"), "pending");
        const result = await savePngBlobWithPath(currentBlob, filename);
        if (result.cancelled) {
          setSaveStatus(t("shareJourneySaveCancelled"), "warning");
          return;
        }
        const savedMessage = tf("shareJourneySaved", { path: result.path || filename });
        setSaveStatus(savedMessage, "success");
        showGlobalToast(savedMessage, "success");
      } catch (error) {
        const failedMessage = tf("shareJourneySaveFailed", { error: error?.message || String(error) });
        setSaveStatus(failedMessage, "error");
        showGlobalToast(failedMessage, "error");
      } finally {
        downloadBtn.disabled = false;
      }
    });
    copyBtn?.addEventListener("click", async () => {
      if (!currentBlob) return;
      copyBtn.disabled = true;
      try {
        const copied = await copyPngBlobToClipboard(currentBlob);
        if (!copied) throw new Error("Clipboard image unsupported");
        setSaveStatus(t("shareJourneyCopied"), "success");
        showGlobalToast(t("shareJourneyCopied"), "success");
      } catch (error) {
        setSaveStatus(t("shareJourneyCopyFailed"), "warning");
        showGlobalToast(t("shareJourneyCopyFailed"), "warning");
      } finally {
        copyBtn.disabled = false;
      }
    });
    await renderPreview();
  }
  var init_modal_controller = __esm({
    "src/modules/share-studio/modal-controller.ts"() {
      "use strict";
      init_preferences_and_data();
    }
  });

  // src/modules/share-studio.ts
  var require_share_studio = __commonJS({
    "src/modules/share-studio.ts"(exports, module) {
      init_preferences_and_data();
      init_modal_controller();
      var shareStudioExports = {
        SHARE_THEME_DEFAULT,
        SHARE_SIZE_DEFAULT,
        SHARE_TIMELINE_START_DEFAULT,
        SHARE_BRAND_SIZE_DEFAULT,
        SHARE_RESOLUTION_DEFAULT,
        getShareThemes,
        getShareFieldControls,
        normalizeSharePreferences,
        getSharePreferences,
        persistSharePreferences,
        buildSubmissionShareJourneyData,
        canvasToPngBlob,
        shareCardFileName,
        savePngBlobWithPath,
        copyPngBlobToClipboard,
        clearActiveSharePreview,
        openSubmissionShareModal,
        openSubmissionSharePreview: openSubmissionShareModal
      };
      if (typeof globalThis !== "undefined") {
        Object.assign(globalThis, shareStudioExports);
      }
      if (typeof window !== "undefined") {
        Object.assign(window, shareStudioExports);
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = { ...module.exports || {}, ...shareStudioExports };
      }
    }
  });
  require_share_studio();
})();
