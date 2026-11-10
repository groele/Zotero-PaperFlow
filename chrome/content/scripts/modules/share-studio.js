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
  function normalizeResValue(rawRes) {
    if (rawRes === 1 || rawRes === "1") return "standard";
    if (rawRes === 2 || rawRes === "2") return "high";
    if (rawRes === 3 || rawRes === "3") return "ultra";
    return (/* @__PURE__ */ new Set(["standard", "high", "ultra"])).has(rawRes) ? rawRes : SHARE_RESOLUTION_DEFAULT;
  }
  function normalizeSharePreferences(raw = {}) {
    const validThemes = new Set(getShareThemes().map((item) => item.id));
    const validSizes = /* @__PURE__ */ new Set(["portrait", "story", "auto"]);
    const validStarts = /* @__PURE__ */ new Set(["experiment", "submission"]);
    const validBrandSizes = /* @__PURE__ */ new Set(["compact", "balanced", "bold"]);
    const visible = Object.fromEntries(getShareFieldControls().map(({ key }) => {
      if (raw?.visible && key in raw.visible) return [key, Boolean(raw.visible[key])];
      if (raw && typeof raw === "object" && key in raw) return [key, Boolean(raw[key])];
      return [key, true];
    }));
    const rawTheme = raw?.appearance || raw?.theme;
    const theme = validThemes.has(rawTheme) ? rawTheme : SHARE_THEME_DEFAULT;
    return {
      theme,
      appearance: theme,
      size: validSizes.has(raw?.size) ? raw.size : SHARE_SIZE_DEFAULT,
      timelineStart: validStarts.has(raw?.timelineStart) ? raw.timelineStart : SHARE_TIMELINE_START_DEFAULT,
      brandSize: validBrandSizes.has(raw?.brandSize) ? raw.brandSize : SHARE_BRAND_SIZE_DEFAULT,
      resolution: normalizeResValue(raw?.resolution),
      visible
    };
  }
  function getDatabase() {
    const win = typeof window !== "undefined" ? window : globalThis;
    if (win.db && typeof win.db === "object") return win.db;
    if (typeof db !== "undefined" && db && typeof db === "object") return db;
    if (!win.db) win.db = {};
    return win.db;
  }
  function getSharePreferences() {
    const database = getDatabase();
    if (!database.settings) database.settings = {};
    database.settings.shareCard = normalizeSharePreferences(database.settings.shareCard);
    return database.settings.shareCard;
  }
  async function persistSharePreferences(nextPrefs) {
    const database = getDatabase();
    if (!database.settings) database.settings = {};
    const normalized = normalizeSharePreferences(nextPrefs);
    database.settings.shareCard = normalized;
    sharePreferenceWrites = (sharePreferenceWrites || Promise.resolve()).catch(() => {
    }).then(async () => {
      if (!window.storage?.saveAll) return;
      const latest = await window.storage.loadAll();
      const live = getDatabase();
      const liveCount = Array.isArray(live?.submissions) ? live.submissions.length : 0;
      const latestCount = Array.isArray(latest?.submissions) ? latest.submissions.length : 0;
      const target = liveCount > latestCount ? live : latest || live;
      if (!target.settings) target.settings = {};
      target.settings.shareCard = normalized;
      const rawSaved = await window.storage.saveAll(target, { mergeOnConflict: true });
      const saved = rawSaved && typeof rawSaved === "object" ? rawSaved : target;
      if (!saved.settings) saved.settings = {};
      saved.settings.shareCard = normalized;
      const win = typeof window !== "undefined" ? window : globalThis;
      const currentLiveCount = Array.isArray(win.db?.submissions) ? win.db.submissions.length : 0;
      const savedCount = Array.isArray(saved?.submissions) ? saved.submissions.length : 0;
      if (savedCount >= currentLiveCount) {
        win.db = saved;
        if (typeof db !== "undefined") db = saved;
      } else {
        win.db.settings = { ...win.db.settings || {}, shareCard: normalized };
      }
    }).catch((error) => {
      console.warn("Could not persist share card preferences:", error);
      showGlobalToast(t("sharePrefsFailed"), "warning");
    });
    return sharePreferenceWrites;
  }
  function buildSubmissionShareJourneyData(sub, overrides = {}) {
    const database = getDatabase();
    const man = (database.manuscripts || []).find((item) => item.id === sub.manuscriptId) || null;
    const analysis = analyzeSubmission(sub);
    const language = typeof currentLanguage === "string" && currentLanguage === "zh" ? "zh" : "en";
    const zh = language === "zh";
    const title = man?.title || sub.title || t("untitledManuscript");
    const journal = getSubmissionJournalName(sub);
    const firstAuthor = getSubmissionFirstAuthor(sub, man);
    const statusLabel = getSubmissionStatusLabel(sub.status || "submitted");
    const prefs = normalizeSharePreferences({
      ...getSharePreferences(),
      ...overrides,
      visible: { ...getSharePreferences().visible, ...overrides.visible || {} }
    });
    const sortedNodes = typeof autoSortNodes === "function" ? autoSortNodes(sub.timelineNodes || []) : analysis.events || [];
    const events = sortedNodes.map((node) => {
      const key = inferKey(node);
      const date = window.RFUI?.getTimelineEventDate ? window.RFUI.getTimelineEventDate(node, key) : getNodeDate(node);
      const nodeStatus = typeof computeNodeStatus === "function" ? computeNodeStatus(node) : node.status || "";
      const completed = Boolean(node.completeDate || nodeStatus === "completed");
      const due = !node.completeDate && !node.planDate && Boolean(node.dueDate);
      return {
        key,
        type: node.type || "special",
        name: node.name,
        rawName: node.name,
        label: getTimelineNodeDisplayName(node),
        date,
        completed,
        due,
        status: nodeStatus,
        planDate: node.planDate || "",
        dueDate: node.dueDate || "",
        completeDate: node.completeDate || ""
      };
    });
    const datedEvents = events.filter((e) => e.date && !Number.isNaN(new Date(e.date).getTime()));
    const start = prefs.timelineStart === "submission" ? analysis.submitDate || datedEvents.find((e) => e.key === "submit" || e.type === "submission")?.date || "" : analysis.experimentStartDate || datedEvents.find((e) => e.key === "experiment_start")?.date || datedEvents.find((e) => e.type === "research")?.date || datedEvents[0]?.date || "";
    const subStatus = typeof normalizeSubmissionStatus === "function" ? normalizeSubmissionStatus(sub.status) : sub.status || "submitted";
    const today = typeof todayString === "function" ? todayString() : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const end = analysis.accepted ? analysis.acceptDate || analysis.onlineDate : subStatus === "rejected" ? sub.rejectedAt || sub.decisionDate : today;
    const diffDays = start && end && typeof getDaysDiff === "function" ? getDaysDiff(start, end) : null;
    const durationDays = diffDays !== null && diffDays >= 0 ? diffDays : null;
    const startText = prefs.timelineStart === "submission" ? zh ? "投稿" : "submission" : zh ? "首个记录节点" : "first recorded milestone";
    const endText = analysis.accepted ? zh ? "接收 / 发表" : "acceptance / publication" : subStatus === "rejected" ? zh ? "决定日期" : "decision" : zh ? "今天" : "today";
    const durationLabel = zh ? `从${startText}至${endText}` : `From ${startText} to ${endText}`;
    return window.RFShareCard.buildSubmissionShareCardData({
      language,
      theme: prefs.theme,
      appearance: prefs.theme,
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
      durationLabel,
      events
    });
  }
  function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      if (typeof canvas.toBlob === "function") {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("PNG blob unavailable"));
        }, "image/png", 0.96);
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
    const host = (window.Zotero || window.parent?.Zotero)?.ResearchFlow;
    const bridge = window.ZoteroBridge;
    if (typeof host?.saveShareImageFile === "function" || bridge?.isZotero && bridge.saveShareImage) {
      const language = typeof currentLanguage === "string" ? currentLanguage : "en";
      const result = typeof host?.saveShareImageFile === "function" ? await host.saveShareImageFile(new Uint8Array(await blob.arrayBuffer()), filename, language) : await bridge.saveShareImage(blob, filename, language);
      if (result?.cancelled) return { cancelled: true, path: "" };
      if (!result?.success || !result.filePath) throw new Error(result?.error || "PNG save was not confirmed.");
      return { cancelled: false, path: result.filePath };
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

  // src/modules/share-studio/modal-template.ts
  function findAppearancePalette(id, palettes) {
    const match = palettes.find((item) => item?.id === id);
    return match || { id, paper: "#e4f2ef", ink: "#153d4a", accent: "#186d7c" };
  }
  function buildShareModal(prefs) {
    const themes = getShareThemes();
    const palettes = typeof window !== "undefined" && window.RFShareCard?.getAppearances ? window.RFShareCard.getAppearances() : [];
    const appearanceOptions = themes.map((theme) => `<option value="${escapeHTML(theme.id)}" ${prefs.theme === theme.id ? "selected" : ""}>${escapeHTML(t(theme.labelKey))}</option>`).join("");
    const styleGallery = themes.map((theme) => {
      const palette = findAppearancePalette(theme.id, palettes);
      const fullName = t(theme.labelKey);
      const shortName = fullName.split(" · ")[0];
      const background = palette.paperGradient ? `linear-gradient(135deg, ${palette.paperGradient.join(", ")})` : palette.paper;
      const isPressed = prefs.theme === theme.id ? "true" : "false";
      return `
      <button type="button" class="share-style-tile${prefs.theme === theme.id ? " active" : ""}" data-share-theme="${escapeHTML(theme.id)}" aria-pressed="${isPressed}" title="${escapeHTML(fullName)}">
        <span class="share-style-sample" aria-hidden="true" style="--sample-bg:${escapeHTML(background)};--sample-ink:${escapeHTML(palette.ink)};--sample-accent:${escapeHTML(palette.accent)}">
          <i></i><b>Aa</b><em></em>
        </span>
        <span>${escapeHTML(shortName)}</span>
      </button>
    `;
    }).join("");
    const visibilityControls = getShareFieldControls().map((field) => `
    <label class="share-visibility-chip${field.key === "footer" ? " share-visibility-chip-wide" : ""}">
      <input type="checkbox" data-share-visible="${escapeHTML(field.key)}" ${prefs.visible[field.key] ? "checked" : ""}>
      <span>${escapeHTML(t(field.labelKey))}</span>
    </label>
  `).join("");
    const brandSizeOptions = ["compact", "balanced", "bold"].map((key) => {
      const labelKey = `shareBrand${key[0].toUpperCase()}${key.slice(1)}`;
      return `<option value="${key}" ${prefs.brandSize === key ? "selected" : ""}>${escapeHTML(t(labelKey))}</option>`;
    }).join("");
    return `
    <div class="share-preview-shell">
      <div class="share-preview-header">
        <div>
          <span class="share-preview-kicker">Zotero PaperFlow / Share Studio</span>
          <h2>${escapeHTML(t("shareJourneyTitle"))}</h2>
          <p>${escapeHTML(t("shareJourneyHelp"))}</p>
        </div>
        <button class="btn-icon share-preview-close" id="btn-close-modal" type="button" aria-label="${escapeHTML(t("close"))}" title="${escapeHTML(t("close"))}">×</button>
      </div>
      <div class="share-preview-workbench">
        <aside class="share-visibility-panel" aria-label="${escapeHTML(t("shareVisibilityTitle"))}">
          <div class="share-visibility-heading">
            <strong>${escapeHTML(t("shareVisibilityTitle"))}</strong>
            <small>${escapeHTML(t("shareVisibilityHelp"))}</small>
          </div>
          <label class="share-size-control" for="share-appearance">
            <span>${escapeHTML(t("shareAppearance"))}</span>
            <select id="share-appearance">${appearanceOptions}</select>
          </label>
          <details class="share-style-browser" open>
            <summary>${escapeHTML(t("shareGallery"))}</summary>
            <div class="share-style-gallery" role="group" aria-label="${escapeHTML(t("shareAppearance"))}">${styleGallery}</div>
          </details>
          <div class="share-visibility-list">${visibilityControls}</div>
          <label class="share-size-control" for="share-brand-size">
            <span>${escapeHTML(t("shareBrandSize"))}</span>
            <select id="share-brand-size"${prefs.visible.footer ? "" : " disabled"}>${brandSizeOptions}</select>
          </label>
          <div class="share-timeline-start-control">
            <span>${escapeHTML(t("shareTimelineStart"))}</span>
            <div class="share-timeline-start-options" role="group" aria-label="${escapeHTML(t("shareTimelineStart"))}">
              <label><input type="radio" name="share-timeline-start" value="experiment" ${prefs.timelineStart === "experiment" ? "checked" : ""}><span>${escapeHTML(t("shareTimelineStartExperiment"))}</span></label>
              <label><input type="radio" name="share-timeline-start" value="submission" ${prefs.timelineStart === "submission" ? "checked" : ""}><span>${escapeHTML(t("shareTimelineStartSubmission"))}</span></label>
            </div>
          </div>
          <label class="share-size-control" for="share-card-size">
            <span>${escapeHTML(t("shareSizeTitle"))}</span>
            <select id="share-card-size">
              <option value="portrait" ${prefs.size === "portrait" ? "selected" : ""}>${escapeHTML(t("shareSizePortrait"))}</option>
              <option value="story" ${prefs.size === "story" ? "selected" : ""}>${escapeHTML(t("shareSizeStory"))}</option>
              <option value="auto" ${prefs.size === "auto" ? "selected" : ""}>${escapeHTML(t("shareSizeAuto"))}</option>
            </select>
          </label>
          <label class="share-size-control" for="share-card-resolution">
            <span>${escapeHTML(t("shareResolution"))}</span>
            <select id="share-card-resolution">
              <option value="standard" ${prefs.resolution === "standard" ? "selected" : ""}>${escapeHTML(t("shareResolutionStandard"))}</option>
              <option value="high" ${prefs.resolution === "high" ? "selected" : ""}>${escapeHTML(t("shareResolutionHigh"))}</option>
              <option value="ultra" ${prefs.resolution === "ultra" ? "selected" : ""}>${escapeHTML(t("shareResolutionUltra"))}</option>
            </select>
          </label>
          <button type="button" class="btn-secondary share-design-reset" id="btn-reset-share-style" title="${escapeHTML(t("shareStyleResetHelp"))}">${escapeHTML(t("shareStyleReset"))}</button>
          <small class="share-reset-help">${escapeHTML(t("shareStyleResetHelp"))}</small>
        </aside>
        <div class="share-preview-frame" id="share-journey-preview-wrap" data-render-state="idle" aria-live="polite">
          <div class="share-preview-loading" id="share-preview-loading" hidden>${escapeHTML(t("shareRendering"))}</div>
          <div class="share-preview-error" id="share-preview-error" hidden role="alert">
            <p>${escapeHTML(t("sharePreviewError"))}</p>
            <button type="button" class="btn-secondary" id="btn-retry-share-preview">${escapeHTML(t("shareRetry"))}</button>
          </div>
          <img id="share-journey-preview" alt="${escapeHTML(t("shareJourneyTitle"))}">
        </div>
      </div>
      <div class="share-preview-actions">
        <span class="share-local-note" id="share-preview-dimensions" role="status">${escapeHTML(t("shareRendering"))}</span>
        <button type="button" class="btn-secondary" id="btn-toggle-share-zoom" aria-pressed="false">${escapeHTML(t("shareZoom"))}</button>
        <button type="button" class="btn-primary" id="btn-download-share-image" aria-describedby="share-journey-save-status">${escapeHTML(t("shareJourneyDownload"))}</button>
        <button type="button" class="btn-secondary" id="btn-copy-share-image">${escapeHTML(t("shareJourneyCopy"))}</button>
        <span class="share-save-status" id="share-journey-save-status" role="status" aria-live="polite">${escapeHTML(t("shareJourneySaveHelp"))}</span>
      </div>
    </div>
  `;
  }
  var init_modal_template = __esm({
    "src/modules/share-studio/modal-template.ts"() {
      "use strict";
      init_preferences_and_data();
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
  async function openSubmissionShareModal(subId, triggerButton) {
    const g2 = typeof window !== "undefined" ? window : globalThis;
    const database = g2.db || (typeof db !== "undefined" ? db : null) || {};
    const sub = (database.submissions || []).find((item) => item.id === subId);
    if (!sub) {
      showGlobalToast(t("submissionNotFound"), "error");
      if (typeof renderDashboard === "function") renderDashboard();
      return;
    }
    if (!window.RFShareCard?.renderSubmissionShareCard) {
      showGlobalToast(t("shareJourneyFailed"), "error");
      return;
    }
    if (triggerButton) {
      triggerButton.disabled = true;
      triggerButton.setAttribute("aria-busy", "true");
    }
    try {
      clearActiveSharePreview();
      let prefs = getSharePreferences();
      const openModalFn = g2.openModal || (typeof openModal === "function" ? openModal : null);
      if (!openModalFn) {
        showGlobalToast(t("shareJourneyFailed"), "error");
        return;
      }
      openModalFn(buildShareModal(prefs));
      const modalEl = document.getElementById("modal-body") || (typeof modalContent !== "undefined" ? modalContent : null);
      modalEl?.classList?.add("share-preview-card");
      const regCleanup = g2.registerModalCleanup || (typeof registerModalCleanup === "function" ? registerModalCleanup : null);
      if (regCleanup) regCleanup(() => modalEl?.classList?.remove("share-preview-card"));
      const preview = document.getElementById("share-journey-preview");
      const previewWrap = document.getElementById("share-journey-preview-wrap");
      const loadingEl = document.getElementById("share-preview-loading");
      const errorEl = document.getElementById("share-preview-error");
      const dimensionsEl = document.getElementById("share-preview-dimensions");
      const zoomBtn = document.getElementById("btn-toggle-share-zoom");
      const retryBtn = document.getElementById("btn-retry-share-preview");
      const statusEl = document.getElementById("share-journey-save-status");
      const downloadBtn = document.getElementById("btn-download-share-image");
      const copyBtn = document.getElementById("btn-copy-share-image");
      const filename = shareCardFileName(sub);
      let currentBlob = null;
      let currentKey = "";
      let renderSeq = 0;
      let closed = false;
      let prefsTimer = null;
      const pendingUrls = /* @__PURE__ */ new Set();
      activeSharePreviewCleanup = () => {
        closed = true;
        renderSeq += 1;
        if (prefsTimer !== null) {
          clearTimeout(prefsTimer);
          prefsTimer = null;
          void persistSharePreferences(prefs);
        }
        pendingUrls.forEach((url) => URL.revokeObjectURL(url));
        pendingUrls.clear();
      };
      if (regCleanup) regCleanup(clearActiveSharePreview);
      const setSaveStatus = (message, state = "neutral") => {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.dataset.state = state;
      };
      const setBusy = () => {
        currentBlob = null;
        currentKey = "";
        if (downloadBtn) downloadBtn.disabled = true;
        if (copyBtn) copyBtn.disabled = true;
        if (previewWrap) {
          previewWrap.dataset.renderState = "rendering";
          previewWrap.setAttribute("aria-busy", "true");
        }
        if (loadingEl) loadingEl.hidden = false;
        if (errorEl) errorEl.hidden = true;
        if (preview) preview.classList.add("is-rendering");
        if (dimensionsEl) dimensionsEl.textContent = t("shareRendering");
      };
      const syncControlSelection = () => {
        modalEl?.querySelectorAll("[data-share-theme]").forEach((btn) => {
          const active = btn.getAttribute("data-share-theme") === prefs.theme;
          btn.classList.toggle("active", active);
          btn.setAttribute("aria-pressed", active ? "true" : "false");
        });
        modalEl?.querySelectorAll("[data-share-visible]").forEach((input) => {
          input.checked = Boolean(prefs.visible[input.getAttribute("data-share-visible")]);
        });
        modalEl?.querySelectorAll('input[name="share-timeline-start"]').forEach((radio) => {
          radio.checked = radio.value === prefs.timelineStart;
        });
        const appearanceSelect = document.getElementById("share-appearance");
        const sizeSelect = document.getElementById("share-card-size");
        const brandSelect = document.getElementById("share-brand-size");
        const resolutionSelect = document.getElementById("share-card-resolution");
        if (appearanceSelect) appearanceSelect.value = prefs.theme;
        if (sizeSelect) sizeSelect.value = prefs.size;
        if (brandSelect) {
          brandSelect.value = prefs.brandSize;
          brandSelect.disabled = !prefs.visible.footer;
        }
        if (resolutionSelect) resolutionSelect.value = prefs.resolution;
      };
      const renderPreview = async () => {
        const seq = ++renderSeq;
        const snapshot = { ...prefs, visible: { ...prefs.visible } };
        const snapshotKey = JSON.stringify(snapshot);
        let nextUrl = "";
        setBusy();
        try {
          const canvas = document.createElement("canvas");
          const cardData = buildSubmissionShareJourneyData(sub, snapshot);
          const result = window.RFShareCard.renderSubmissionShareCard(canvas, cardData);
          const blob = await canvasToPngBlob(canvas);
          const pixelWidth = canvas.width;
          const pixelHeight = canvas.height;
          canvas.width = canvas.height = 1;
          if (closed || seq !== renderSeq) return;
          nextUrl = URL.createObjectURL(blob);
          pendingUrls.add(nextUrl);
          if (preview) {
            preview.src = nextUrl;
            if (typeof preview.decode === "function") await preview.decode().catch(() => {
            });
          }
          if (closed || seq !== renderSeq) return;
          const prevUrl = activeSharePreviewUrl;
          activeSharePreviewUrl = nextUrl;
          pendingUrls.delete(nextUrl);
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          currentBlob = blob;
          currentKey = snapshotKey;
          if (preview) {
            preview.hidden = false;
            preview.classList.remove("is-rendering");
          }
          if (loadingEl) loadingEl.hidden = true;
          if (errorEl) errorEl.hidden = true;
          if (previewWrap) {
            previewWrap.dataset.shareSize = snapshot.size;
            previewWrap.dataset.appearance = snapshot.theme;
            previewWrap.dataset.renderState = "ready";
            previewWrap.setAttribute("aria-busy", "false");
          }
          if (dimensionsEl) {
            const kb = Math.max(1, Math.ceil(blob.size / 1024));
            const limitedText = result?.resolutionLimited ? ` · ${t("shareResolutionLimited")}` : "";
            const omittedText = result?.omitted ? ` · ${tf("shareOmitted", { count: result.omitted })}` : "";
            dimensionsEl.textContent = `${pixelWidth} × ${pixelHeight} · PNG · ${kb} KB${limitedText}${omittedText}`;
          }
        } catch (error) {
          if (closed || seq !== renderSeq) return;
          console.error("Share card generation failed:", error);
          currentBlob = null;
          currentKey = "";
          if (loadingEl) loadingEl.hidden = true;
          if (errorEl) errorEl.hidden = false;
          if (preview) {
            preview.hidden = true;
            preview.classList.remove("is-rendering");
          }
          if (previewWrap) {
            previewWrap.dataset.renderState = "error";
            previewWrap.setAttribute("aria-busy", "false");
          }
          if (dimensionsEl) dimensionsEl.textContent = t("shareJourneyFailed");
          setSaveStatus(t("sharePreviewError"), "error");
          showGlobalToast(t("shareJourneyFailed"), "error");
        } finally {
          if (nextUrl && pendingUrls.has(nextUrl)) {
            URL.revokeObjectURL(nextUrl);
            pendingUrls.delete(nextUrl);
          }
          if (!closed && seq === renderSeq) {
            const ready = Boolean(currentBlob);
            if (downloadBtn) downloadBtn.disabled = !ready;
            if (copyBtn) copyBtn.disabled = !ready;
          }
        }
      };
      const updatePrefs = (patch) => {
        renderSeq += 1;
        prefs = normalizeSharePreferences({ ...prefs, ...patch, visible: { ...prefs.visible, ...patch.visible || {} } });
        syncControlSelection();
        setBusy();
        if (prefsTimer !== null) clearTimeout(prefsTimer);
        prefsTimer = setTimeout(async () => {
          prefsTimer = null;
          if (closed) return;
          await renderPreview();
          await persistSharePreferences(prefs);
        }, 90);
      };
      const getExportBlob = async () => {
        const key = JSON.stringify({ ...prefs, visible: { ...prefs.visible } });
        if (currentBlob && currentKey === key) return currentBlob;
        const canvas = document.createElement("canvas");
        window.RFShareCard.renderSubmissionShareCard(canvas, buildSubmissionShareJourneyData(sub, prefs));
        const blob = await canvasToPngBlob(canvas);
        canvas.width = canvas.height = 1;
        return blob;
      };
      document.getElementById("share-appearance")?.addEventListener("change", (e) => updatePrefs({ theme: e.target.value, appearance: e.target.value }));
      modalEl?.querySelectorAll("[data-share-theme]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-share-theme");
          updatePrefs({ theme: id, appearance: id });
        });
      });
      modalEl?.querySelectorAll("[data-share-visible]").forEach((input) => {
        input.addEventListener("change", () => updatePrefs({ visible: { [input.getAttribute("data-share-visible")]: input.checked } }));
      });
      modalEl?.querySelectorAll('input[name="share-timeline-start"]').forEach((input) => {
        input.addEventListener("change", () => {
          if (input.checked) updatePrefs({ timelineStart: input.value });
        });
      });
      document.getElementById("share-card-size")?.addEventListener("change", (e) => updatePrefs({ size: e.target.value }));
      document.getElementById("share-brand-size")?.addEventListener("change", (e) => updatePrefs({ brandSize: e.target.value }));
      document.getElementById("share-card-resolution")?.addEventListener("change", (e) => updatePrefs({ resolution: e.target.value }));
      document.getElementById("btn-reset-share-style")?.addEventListener("click", () => {
        updatePrefs({ theme: SHARE_THEME_DEFAULT, appearance: SHARE_THEME_DEFAULT, size: SHARE_SIZE_DEFAULT, timelineStart: SHARE_TIMELINE_START_DEFAULT, brandSize: SHARE_BRAND_SIZE_DEFAULT, resolution: SHARE_RESOLUTION_DEFAULT });
      });
      const toggleZoom = () => {
        if (!previewWrap || !zoomBtn) return;
        const zoomed = previewWrap.classList.toggle("is-zoomed");
        zoomBtn.setAttribute("aria-pressed", zoomed ? "true" : "false");
        zoomBtn.textContent = t(zoomed ? "shareFit" : "shareZoom");
        previewWrap.scrollTo?.({ top: 0, left: 0 });
      };
      zoomBtn?.addEventListener("click", toggleZoom);
      preview?.addEventListener("click", toggleZoom);
      retryBtn?.addEventListener("click", () => {
        void renderPreview();
      });
      downloadBtn?.addEventListener("click", async () => {
        if (!currentBlob) return;
        downloadBtn.disabled = true;
        try {
          setSaveStatus(t("shareJourneySaving"), "pending");
          const blob = await getExportBlob();
          if (closed) return;
          const result = await savePngBlobWithPath(blob, filename);
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
          if (!closed) downloadBtn.disabled = !currentBlob;
        }
      });
      copyBtn?.addEventListener("click", async () => {
        if (!currentBlob) return;
        copyBtn.disabled = true;
        try {
          const blob = await getExportBlob();
          if (closed) return;
          const copied = await copyPngBlobToClipboard(blob);
          if (!copied) throw new Error("Clipboard image unsupported");
          setSaveStatus(t("shareJourneyCopied"), "success");
          showGlobalToast(t("shareJourneyCopied"), "success");
        } catch {
          setSaveStatus(t("shareJourneyCopyFailed"), "warning");
          showGlobalToast(t("shareJourneyCopyFailed"), "warning");
        } finally {
          if (!closed) copyBtn.disabled = !currentBlob;
        }
      });
      await renderPreview();
    } finally {
      if (triggerButton) {
        triggerButton.disabled = false;
        triggerButton.removeAttribute("aria-busy");
      }
    }
  }
  var init_modal_controller = __esm({
    "src/modules/share-studio/modal-controller.ts"() {
      "use strict";
      init_modal_template();
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
