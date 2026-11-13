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
  function acquireModalScope() {
    const g = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : {};
    if (typeof g?.getModalLifecycleScope === "function") {
      return g.getModalLifecycleScope();
    }
    const scope = createLifecycleScope();
    const register = g?.registerModalCleanup || (typeof window !== "undefined" ? window.registerModalCleanup : null);
    if (typeof register === "function") {
      register(() => scope.abort("modal-closed"));
    }
    return scope;
  }

  // src/modules/settings-view/sync-routing.ts
  function getDeviceSyncSecretsFromInputs() {
    const webdavPass = document.getElementById("webdav-pass")?.value ?? "";
    const githubPat = document.getElementById("github-pat")?.value ?? "";
    return {
      webdav: { pass: webdavPass },
      github: { pat: githubPat }
    };
  }
  async function renderSettings2() {
    if (!db.settings) db.settings = { syncProviders: {} };
    if (!db.settings.profile) db.settings.profile = {};
    if (!db.settings.syncProviders) db.settings.syncProviders = {};
    const sp = db.settings.syncProviders;
    const secrets = window.storage?.getDeviceSyncSecrets ? await window.storage.getDeviceSyncSecrets() : { webdav: {}, github: {} };
    const langSelect = document.getElementById("settings-language");
    if (langSelect) {
      langSelect.value = currentLanguage;
    }
    const themeSelect = document.getElementById("settings-theme");
    if (themeSelect) {
      themeSelect.value = normalizeThemePreference(db.settings.profile.theme);
    }
    if (sp.metadata) {
      const routeDb = document.getElementById("route-db");
      const autoSync = document.getElementById("settings-auto-sync");
      if (routeDb) routeDb.value = sp.metadata.provider || "local";
      if (autoSync) autoSync.checked = sp.metadata.autoSync !== false;
    }
    const webdavConfig = sp.metadata?.provider === "webdav" ? sp.metadata.config : sp.webdavConfig;
    if (webdavConfig) {
      const urlInput = document.getElementById("webdav-url");
      const userInput = document.getElementById("webdav-user");
      if (urlInput) urlInput.value = webdavConfig.url || "";
      if (userInput) userInput.value = webdavConfig.user || "";
    }
    const webdavPassInput = document.getElementById("webdav-pass");
    if (webdavPassInput) {
      webdavPassInput.value = secrets.webdav?.pass || webdavConfig?.pass || "";
    }
    const githubConfig = sp.metadata?.provider === "github" ? sp.metadata.config : sp.githubConfig;
    if (githubConfig) {
      const repoInput = document.getElementById("github-repo");
      const branchInput = document.getElementById("github-branch");
      if (repoInput) repoInput.value = githubConfig.repo || "";
      if (branchInput) branchInput.value = githubConfig.branch || "main";
    }
    const githubPatInput = document.getElementById("github-pat");
    if (githubPatInput) {
      githubPatInput.value = secrets.github?.pat || githubConfig?.pat || "";
    }
    updateSyncRouteNotice();
    if (typeof refreshConflictDrafts === "function") {
      await refreshConflictDrafts();
    }
  }
  function updateSyncRouteNotice() {
    const provider = document.getElementById("route-db")?.value || db?.settings?.syncProviders?.metadata?.provider || "local";
    const summaryKey = provider === "webdav" ? "webdavSyncSummary" : provider === "github" ? "githubSyncSummary" : "localSyncSummary";
    setText("#sync-route-summary", t(summaryKey));
    const forceSyncBtn = document.getElementById("btn-force-sync");
    if (forceSyncBtn) {
      forceSyncBtn.disabled = provider === "local";
    }
    const autoSyncToggle = document.getElementById("settings-auto-sync");
    if (autoSyncToggle) {
      autoSyncToggle.disabled = provider === "local";
    }
    setText("#settings-auto-sync-help", t(provider === "local" ? "autoCloudSyncLocalHelp" : "autoCloudSyncHelp"));
    const localCard = document.getElementById("settings-local-card");
    const webdavCard = document.getElementById("settings-webdav-card");
    const githubCard = document.getElementById("settings-github-card");
    if (localCard) localCard.hidden = provider !== "local";
    if (webdavCard) webdavCard.hidden = provider !== "webdav";
    if (githubCard) githubCard.hidden = provider !== "github";
  }
  async function saveSettingsFromInputs({ showToast = true } = {}) {
    const routeDb = document.getElementById("route-db")?.value || "local";
    const autoSync = document.getElementById("settings-auto-sync")?.checked !== false;
    const language = document.getElementById("settings-language")?.value === "en" ? "en" : "zh";
    const theme = normalizeThemePreference(document.getElementById("settings-theme")?.value);
    const webdavConfig = {
      url: document.getElementById("webdav-url")?.value.trim() || "",
      user: document.getElementById("webdav-user")?.value.trim() || ""
    };
    const githubConfig = {
      repo: document.getElementById("github-repo")?.value.trim() || "",
      branch: document.getElementById("github-branch")?.value.trim() || "main"
    };
    if (!db.settings) db.settings = {};
    if (!db.settings.profile) db.settings.profile = {};
    db.settings.profile.language = language;
    db.settings.profile.theme = theme;
    currentLanguage = language;
    applyThemePreference(theme);
    db.settings.syncProviders = {
      webdavConfig,
      githubConfig,
      metadata: {
        provider: routeDb,
        autoSync,
        config: routeDb === "webdav" ? webdavConfig : routeDb === "github" ? githubConfig : {}
      }
    };
    if (window.storage?.saveDeviceSyncSecrets) {
      await window.storage.saveDeviceSyncSecrets(getDeviceSyncSecretsFromInputs());
    }
    await window.storage.saveAll(db);
    applyLanguage();
    renderDashboard();
    renderKanban();
    renderSubmissions();
    if (showToast) {
      showGlobalToast("Cloud Sync Configuration Saved! Active on next data write.", "success");
    }
  }
  var routingScope = createLifecycleScope();
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("unload", () => routingScope.abort(), { once: true });
  }
  function bindSettingsRoutingListeners() {
    routingScope.abort();
    routingScope = createLifecycleScope();
    routingScope.on(document.getElementById("settings-language"), "change", async () => {
      await saveSettingsFromInputs({ showToast: false });
      showGlobalToast(t("languageSaved"), "success");
    });
    routingScope.on(document.getElementById("settings-theme"), "change", async () => {
      await saveSettingsFromInputs({ showToast: false });
      showGlobalToast(t("appearanceSaved"), "success");
    });
    routingScope.on(document.getElementById("route-db"), "change", () => {
      updateSyncRouteNotice();
    });
    routingScope.on(document.getElementById("settings-auto-sync"), "change", async () => {
      await saveSettingsFromInputs({ showToast: false });
    });
    routingScope.on(document.getElementById("btn-save-mappings"), "click", async () => {
      await saveSettingsFromInputs({ showToast: true });
    });
    routingScope.on(document.getElementById("btn-test-webdav"), "click", async () => {
      const url = document.getElementById("webdav-url")?.value.trim() || "";
      const user = document.getElementById("webdav-user")?.value.trim() || "";
      const pass = document.getElementById("webdav-pass")?.value.trim() || "";
      const statusEl = document.getElementById("webdav-status");
      if (!statusEl) return;
      if (!url || !user || !pass) {
        statusEl.textContent = "❌ Please fill in all WebDAV fields.";
        statusEl.style.color = "hsl(var(--status-danger))";
        return;
      }
      statusEl.textContent = "⏳ Testing connection to WebDAV...";
      statusEl.style.color = "hsl(var(--text-secondary))";
      const res = await window.storage.testWebDAV({ url, user, pass });
      if (res.success) {
        statusEl.textContent = "✅ Connected successfully!";
        statusEl.style.color = "hsl(var(--status-success))";
        await saveSettingsFromInputs({ showToast: false });
      } else {
        statusEl.textContent = `❌ Failed: ${res.message}`;
        statusEl.style.color = "hsl(var(--status-danger))";
      }
    });
    routingScope.on(document.getElementById("btn-test-github"), "click", async () => {
      const pat = document.getElementById("github-pat")?.value.trim() || "";
      const repo = document.getElementById("github-repo")?.value.trim() || "";
      const branch = document.getElementById("github-branch")?.value.trim() || "main";
      const statusEl = document.getElementById("github-status");
      if (!statusEl) return;
      if (!pat || !repo) {
        statusEl.textContent = "❌ Please provide PAT and Repo.";
        statusEl.style.color = "hsl(var(--status-danger))";
        return;
      }
      statusEl.textContent = "⏳ Verifying GitHub repository...";
      statusEl.style.color = "hsl(var(--text-secondary))";
      const res = await window.storage.testGitHub({ pat, repo, branch });
      if (res.success) {
        statusEl.textContent = `✅ Repository "${res.repoName}" Verified!`;
        statusEl.style.color = "hsl(var(--status-success))";
        await saveSettingsFromInputs({ showToast: false });
      } else {
        statusEl.textContent = `❌ Failed: ${res.message}`;
        statusEl.style.color = "hsl(var(--status-danger))";
      }
    });
  }

  // src/modules/settings-view/backup-and-conflict.ts
  function stripCredentialsForExport(sourceDb) {
    const clone = JSON.parse(JSON.stringify(sourceDb || {}));
    const sp = clone.settings?.syncProviders;
    if (sp) {
      if (sp.webdavConfig) delete sp.webdavConfig.pass;
      if (sp.githubConfig) delete sp.githubConfig.pat;
      if (sp.metadata?.config) {
        delete sp.metadata.config.pass;
        delete sp.metadata.config.pat;
      }
    }
    return clone;
  }
  function buildPrivacySafeDiagnostics(sourceDb) {
    const sp = sourceDb?.settings?.syncProviders || {};
    const count = (key) => Array.isArray(sourceDb?.[key]) ? sourceDb[key].length : 0;
    const deletedCount = (key) => Array.isArray(sourceDb?.deletedEntities?.[key]) ? sourceDb.deletedEntities[key].length : 0;
    return {
      app: "Zotero PaperFlow",
      version: "17.0.0",
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      environment: {
        language: currentLanguage,
        theme: normalizeThemePreference(sourceDb?.settings?.profile?.theme),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown"
      },
      database: {
        schemaVersion: sourceDb?.schemaVersion ?? null,
        revision: sourceDb?.revision ?? null,
        lastUpdated: sourceDb?.lastUpdated ?? null,
        updatedAt: sourceDb?.updatedAt ?? null,
        counts: {
          researchAreas: count("researchAreas"),
          projects: count("projects"),
          researchRecords: count("researchRecords"),
          manuscripts: count("manuscripts"),
          submissions: count("submissions"),
          tasks: count("tasks")
        },
        deletedCounts: {
          researchAreas: deletedCount("researchAreas"),
          projects: deletedCount("projects"),
          researchRecords: deletedCount("researchRecords"),
          manuscripts: deletedCount("manuscripts"),
          submissions: deletedCount("submissions"),
          tasks: deletedCount("tasks")
        }
      },
      sync: {
        provider: sp.metadata?.provider || "local",
        autoSync: sp.metadata?.autoSync !== false,
        webdavConfigured: Boolean(sp.webdavConfig?.url || sp.metadata?.config?.url),
        githubConfigured: Boolean(sp.githubConfig?.repo || sp.metadata?.config?.repo),
        credentialsIncluded: false
      }
    };
  }
  var MAX_IMPORT_DATABASE_BYTES = 25 * 1024 * 1024;
  var DATABASE_COLLECTION_KEYS = ["researchAreas", "projects", "researchRecords", "manuscripts", "submissions", "tasks"];
  function isValidImportedDatabaseObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return DATABASE_COLLECTION_KEYS.some((key) => Array.isArray(value[key]));
  }
  function formatConflictValue(value) {
    if (value === void 0) return { text: t("recoveryMissing"), truncated: false };
    const raw = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    const text = raw ?? String(value);
    return text.length > 600 ? { text: `${text.slice(0, 600)}…`, truncated: true } : { text, truncated: false };
  }
  function renderConflictValueCell(value) {
    const formatted = formatConflictValue(value);
    return `<pre>${escapeHTML(formatted.text)}</pre>${formatted.truncated ? `<small class="conflict-truncated-note">${escapeHTML(t("recoveryTruncated"))}</small>` : ""}`;
  }
  function formatConflictTimestamp(value) {
    const time = Date.parse(value || "");
    return Number.isFinite(time) ? new Date(time).toLocaleString() : String(value || "");
  }
  var conflictListScope = createLifecycleScope();
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("unload", () => conflictListScope.abort(), { once: true });
  }
  async function refreshConflictDrafts2() {
    conflictListScope.abort();
    conflictListScope = createLifecycleScope();
    const container = document.getElementById("conflict-recovery-list");
    if (!container) return;
    if (typeof window.storage?.listConflictDrafts !== "function") {
      window.RFUI.setHTML(container, `<p class="conflict-empty">${escapeHTML(t("recoveryUnavailable"))}</p>`);
      return;
    }
    window.RFUI.setHTML(container, `<p class="conflict-empty">${escapeHTML(t("recoveryBusy"))}</p>`);
    try {
      const drafts = await window.storage.listConflictDrafts();
      if (!Array.isArray(drafts) || !drafts.length) {
        window.RFUI.setHTML(container, `<p class="conflict-empty">${escapeHTML(t("recoveryEmpty"))}</p>`);
        return;
      }
      window.RFUI.setHTML(container, drafts.map((draft) => {
        const conflicts = Array.isArray(draft.conflicts) ? draft.conflicts : [];
        return `
        <div class="conflict-draft-row">
          <div class="conflict-draft-meta">
            <strong>${escapeHTML(draft.fileName)}</strong>
            <span>${escapeHTML(formatConflictTimestamp(draft.savedAt))} · ${escapeHTML(t("recoveryRevision"))}${escapeHTML(String(draft.expectedRevision ?? "—"))} → ${escapeHTML(String(draft.actualRevision ?? "—"))}</span>
            <div class="conflict-chip-row">
              ${draft.resolvedAt ? `<span class="settings-trust-pill">${escapeHTML(t("recoveryResolved"))}</span>` : ""}
              ${conflicts.slice(0, 6).map((item) => `<span class="conflict-chip">${escapeHTML(item)}</span>`).join("")}
            </div>
          </div>
          <button class="btn-secondary btn-open-conflict" type="button" data-conflict-file="${escapeHTML(draft.fileName)}">${escapeHTML(t("recoveryOpen"))}</button>
        </div>
      `;
      }).join(""));
      container.querySelectorAll(".btn-open-conflict").forEach((button) => {
        conflictListScope.on(button, "click", () => openConflictRecoveryModal(button.dataset.conflictFile));
      });
    } catch (error) {
      window.RFUI.setHTML(container, `<p class="conflict-empty">${escapeHTML(t("recoveryFailed") + (error.message || error))}</p>`);
    }
  }
  async function openConflictRecoveryModal(fileName) {
    if (!fileName || typeof window.storage?.inspectConflictDraft !== "function") return;
    try {
      const plan = await window.storage.inspectConflictDraft(fileName);
      const items = Array.isArray(plan?.items) ? plan.items : [];
      const unresolved = items.filter((item) => item.conflict);
      const choices = {};
      unresolved.forEach((item) => {
        choices[item.id] = "current";
      });
      openModal("");
      const modalScope = acquireModalScope();
      let viewScope = modalScope.child();
      const resetViewScope = () => {
        viewScope.abort();
        viewScope = modalScope.child();
        return viewScope;
      };
      const modalEl = document.getElementById("modal-overlay");
      const modalBody = document.getElementById("modal-body");
      const renderCompare = () => {
        if (modalScope.aborted || !modalEl?.classList.contains("active") || !modalBody) return;
        const scope = resetViewScope();
        const rows = unresolved.length ? unresolved.map((item, idx) => `
        <div class="conflict-compare-item">
          <div class="conflict-item-head">
            <strong>${escapeHTML(item.label)}</strong>
            <span>${escapeHTML(item.collection ? `${item.collection} · ${item.field || item.recordId}` : item.id)}</span>
          </div>
          <div class="conflict-choice-grid">
            ${["current", "local", "base"].map((source) => `
              <label class="conflict-choice-card ${choices[item.id] === source ? "selected" : ""}">
                <input type="radio" name="conflict-choice-${idx}" data-conflict-id="${escapeHTML(item.id)}" value="${source}" ${choices[item.id] === source ? "checked" : ""}>
                <span>${escapeHTML(t(source === "current" ? "recoveryCurrent" : source === "local" ? "recoveryLocal" : "recoveryBase"))}</span>
                ${renderConflictValueCell(item[`${source}Value`])}
              </label>
            `).join("")}
          </div>
        </div>
      `).join("") : `<p class="conflict-empty">${escapeHTML(t("recoveryNoConflicts"))}</p>`;
        window.RFUI.setHTML(modalBody, `
        <div class="modal-header">
          <div>
            <h2>${escapeHTML(t("recoveryCompareTitle"))}</h2>
            <p class="text-muted">${escapeHTML(fileName)} · ${escapeHTML(t("recoveryAutomatic"))}</p>
          </div>
          <button class="btn-secondary btn-icon" id="btn-close-modal" type="button" aria-label="${escapeHTML(t("cancel"))}">✕</button>
        </div>
        <div class="conflict-compare-list">${rows}</div>
        <div class="modal-footer">
          <button class="btn-secondary" id="btn-cancel-recovery" type="button">${escapeHTML(t("cancel"))}</button>
          <button class="btn-primary" id="btn-preview-recovery" type="button">${escapeHTML(t("recoveryPreview"))}</button>
        </div>
      `);
        scope.on(modalBody.querySelector("#btn-close-modal"), "click", closeModal);
        scope.on(modalBody.querySelector("#btn-cancel-recovery"), "click", closeModal);
        modalBody.querySelectorAll("input[data-conflict-id]").forEach((input) => {
          scope.on(input, "change", () => {
            choices[input.dataset.conflictId] = input.value;
            input.closest(".conflict-choice-grid")?.querySelectorAll(".conflict-choice-card").forEach((card) => card.classList.toggle("selected", card.contains(input)));
          });
        });
        scope.on(modalBody.querySelector("#btn-preview-recovery"), "click", () => renderPreview());
      };
      const renderPreview = async () => {
        const preview = await window.storage.inspectConflictDraft(fileName, choices);
        if (modalScope.aborted || !modalEl?.classList.contains("active") || !modalBody) return;
        const scope = resetViewScope();
        if (preview.currentRevision !== plan.currentRevision) {
          showGlobalToast(t("recoveryInvalidated"), "warning");
          closeModal();
          await refreshConflictDrafts2();
          return;
        }
        const changes = Array.isArray(preview?.changes) ? preview.changes : [];
        const rows = changes.length ? changes.map((change) => `
        <div class="conflict-preview-item">
          <strong>${escapeHTML(change.label)}</strong>
          <div class="conflict-preview-grid">
            <div><span>${escapeHTML(t("recoveryBefore"))}</span>${renderConflictValueCell(change.before)}</div>
            <div><span>${escapeHTML(t("recoveryAfter"))}</span>${renderConflictValueCell(change.after)}</div>
          </div>
        </div>
      `).join("") : `<p class="conflict-empty">${escapeHTML(t("recoveryNoChanges"))}</p>`;
        window.RFUI.setHTML(modalBody, `
        <div class="modal-header">
          <div>
            <h2>${escapeHTML(t("recoveryPreviewTitle"))}</h2>
            <p class="text-muted">${escapeHTML(fileName)} · ${escapeHTML(t("recoveryRevision"))}${escapeHTML(String(preview.currentRevision ?? "—"))}</p>
          </div>
          <button class="btn-secondary btn-icon" id="btn-close-modal" type="button" aria-label="${escapeHTML(t("cancel"))}">✕</button>
        </div>
        <div class="conflict-compare-list">${rows}</div>
        <div class="modal-footer">
          <button class="btn-secondary" id="btn-back-recovery" type="button">${escapeHTML(t("recoveryBack"))}</button>
          <button class="btn-primary" id="btn-apply-recovery" type="button" ${changes.length ? "" : "disabled"}>${escapeHTML(t("recoveryApply"))}</button>
        </div>
      `);
        scope.on(modalBody.querySelector("#btn-close-modal"), "click", closeModal);
        scope.on(modalBody.querySelector("#btn-back-recovery"), "click", renderCompare);
        scope.on(modalBody.querySelector("#btn-apply-recovery"), "click", async (event) => {
          if (pendingSubmissionSaves > 0 || document.querySelector('[data-submission-autosave-status][data-state="pending"], [data-submission-autosave-status][data-state="saving"]')) {
            showGlobalToast(t("recoveryPending"), "warning");
            return;
          }
          const button = event.currentTarget;
          button.disabled = true;
          try {
            const result = await window.storage.applyConflictDraftResolution(
              fileName,
              choices,
              preview.currentRevision
            );
            db = await window.storage.loadAll();
            currentLanguage = resolvePreferredLanguage();
            applyThemePreference(db?.settings?.profile?.theme);
            applyLanguage();
            renderDashboard();
            renderKanban();
            renderSubmissions();
            await renderSettings();
            closeModal();
            const receiptWarning = result?.receiptError ? t("recoveryReceiptWarning") : "";
            showGlobalToast(`${t("recoverySuccess")}${result?.backupFileName || ""}${receiptWarning}`, result?.receiptError ? "warning" : "success");
          } catch (error) {
            button.disabled = false;
            showGlobalToast(t("recoveryFailed") + (error.message || error), "error");
          }
        });
      };
      renderCompare();
    } catch (error) {
      showGlobalToast(t("recoveryFailed") + (error.message || error), "error");
    }
  }

  // src/modules/settings-view.ts
  var settingsViewScope = createLifecycleScope();
  var settingsListenersScope = settingsViewScope.child();
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("unload", () => settingsViewScope.abort(), { once: true });
  }
  bindSettingsRoutingListeners();
  function setupSettingsListeners() {
    settingsListenersScope.abort();
    settingsListenersScope = settingsViewScope.child();
    const languageSelect = document.getElementById("ui-language");
    if (languageSelect) {
      settingsListenersScope.on(languageSelect, "change", async () => {
        currentLanguage = languageSelect.value;
        document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
        db.settings = db.settings || {};
        db.settings.profile = db.settings.profile || {};
        db.settings.profile.language = currentLanguage;
        if (typeof applyLanguage === "function") applyLanguage();
        if (typeof refreshActiveViewForLanguage === "function") refreshActiveViewForLanguage();
        languageSelect.disabled = true;
        try {
          if (window.storage?.saveAll) await window.storage.saveAll(db);
        } finally {
          languageSelect.disabled = false;
        }
        showGlobalToast(t("languageSaved"), "success");
      });
    }
    const themeSelect = document.getElementById("ui-theme");
    if (themeSelect) {
      settingsListenersScope.on(themeSelect, "change", async () => {
        const previousTheme = typeof normalizeThemePreference === "function" ? normalizeThemePreference(db.settings?.profile?.theme) : "";
        const nextTheme = typeof applyThemePreference === "function" ? applyThemePreference(themeSelect.value) : themeSelect.value;
        db.settings = db.settings || {};
        db.settings.profile = db.settings.profile || {};
        db.settings.profile.theme = nextTheme;
        themeSelect.disabled = true;
        try {
          if (window.storage?.saveAll) await window.storage.saveAll(db);
        } finally {
          themeSelect.disabled = false;
        }
        if (previousTheme !== nextTheme) {
          showGlobalToast(t("themeSaved"), "success");
        }
      });
    }
  }
  setupSettingsListeners();
  settingsViewScope.on(document.getElementById("btn-export-db"), "click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stripCredentialsForExport(db), null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `zotero_paperflow_backup_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`);
    dlAnchorElem.click();
    showGlobalToast(t("databaseExported"), "success");
  });
  settingsViewScope.on(document.getElementById("btn-export-diagnostics"), "click", () => {
    const report = buildPrivacySafeDiagnostics(db);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `zotero_paperflow_diagnostics_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`);
    dlAnchorElem.click();
    showGlobalToast(t("diagnosticsExported"), "success");
  });
  document.getElementById("btn-trigger-import")?.addEventListener("click", async () => {
    const isZoteroEnv = Boolean(
      typeof ZoteroBridge !== "undefined" && ZoteroBridge.isZotero || typeof window !== "undefined" && (window.Zotero || window.parent?.Zotero)
    );
    if (isZoteroEnv && typeof ZoteroBridge !== "undefined" && ZoteroBridge.importDatabase) {
      try {
        const res = await ZoteroBridge.importDatabase("merge");
        if (res?.success && res.data) {
          db = res.data;
          if (typeof renderAllViews === "function") await renderAllViews();
          if (typeof loadSettings === "function") await loadSettings();
          showGlobalToast(t("databaseImported") || "数据库导入成功！", "success");
          return;
        }
        if (res?.cancelled) {
          return;
        }
        showGlobalToast(res?.error || t("invalidBackup"), "error");
      } catch (e) {
        console.error("[PaperFlow] Zotero native import failed:", e);
        showGlobalToast(e.message || t("invalidBackup"), "error");
      }
      return;
    }
    document.getElementById("import-db-file")?.click();
  });
  document.getElementById("btn-restore-import-backup")?.addEventListener("click", async () => {
    if (!confirm(t("restoreImportConfirm"))) return;
    const isZoteroEnv = Boolean(
      typeof ZoteroBridge !== "undefined" && ZoteroBridge.isZotero || typeof window !== "undefined" && (window.Zotero || window.parent?.Zotero)
    );
    if (isZoteroEnv && typeof ZoteroBridge !== "undefined" && ZoteroBridge.restoreBackup) {
      try {
        const res = await ZoteroBridge.restoreBackup();
        if (res?.success && res.data) {
          db = res.data;
          if (typeof renderAllViews === "function") await renderAllViews();
          if (typeof loadSettings === "function") await loadSettings();
          showGlobalToast(t("importBackupRestored"), "success");
          return;
        }
        if (res?.error) {
          showGlobalToast(res.error, "error");
          return;
        }
        showGlobalToast(t("invalidBackup"), "error");
      } catch (e) {
        console.error("[PaperFlow] Zotero restore failed:", e);
        showGlobalToast(e.message || t("invalidBackup"), "error");
      }
      return;
    }
    const PRE_IMPORT_BACKUP_KEY = "paperflow_pre_import_backup";
    const result = await new Promise((resolve) => {
      if (typeof RFPlatform !== "undefined" && RFPlatform.storage?.local?.get) {
        RFPlatform.storage.local.get([PRE_IMPORT_BACKUP_KEY], resolve);
      } else {
        resolve(null);
      }
    });
    const backup = result?.[PRE_IMPORT_BACKUP_KEY];
    if (!backup?.database) {
      showGlobalToast(t("noImportBackup"), "error");
      return;
    }
    try {
      const normalizedBackup = await window.storage.ensureDbShape(backup.database, { stamp: false });
      db = await window.storage.saveAll(normalizedBackup, { replace: true, expectedRevision: db.revision });
      if (typeof renderAllViews === "function") await renderAllViews();
      if (typeof loadSettings === "function") await loadSettings();
      showGlobalToast(t("importBackupRestored"), "success");
    } catch (err) {
      console.error("Failed to restore pre-import backup.", err);
      showGlobalToast(err.message || t("invalidBackup"), "error");
    }
  });
    // Handle Imported JSON File
  settingsViewScope.on(document.getElementById("import-db-file"), "change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_DATABASE_BYTES) {
      showGlobalToast(t("importFileTooLarge"), "error");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!isValidImportedDatabaseObject(importedData)) {
          showGlobalToast(t("invalidBackup"), "error");
          return;
        }
        const mode = e.target.dataset.importMode === "overwrite" ? "overwrite" : "merge";
        delete e.target.dataset.importMode;
        await window.storage.importDatabase(importedData, mode);
        db = await window.storage.loadAll();
        currentLanguage = resolvePreferredLanguage();
        applyThemePreference(db?.settings?.profile?.theme);
        applyLanguage();
        renderDashboard();
        renderKanban();
        renderSubmissions();
        await renderSettings2();
        showGlobalToast(t("databaseImported"), "success");
      } catch (err) {
        console.error(err);
        showGlobalToast((currentLanguage === "zh" ? "导入 JSON 失败：" : "Failed to parse JSON: ") + err.message, "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });
  settingsViewScope.on(document.getElementById("btn-refresh-conflicts"), "click", () => {
    refreshConflictDrafts2();
  });
  var settingsViewExports = {
    getDeviceSyncSecretsFromInputs,
    renderSettings: renderSettings2,
    updateSyncRouteNotice,
    saveSettingsFromInputs,
    stripCredentialsForExport,
    buildPrivacySafeDiagnostics,
    MAX_IMPORT_DATABASE_BYTES,
    isValidImportedDatabaseObject,
    formatConflictValue,
    renderConflictValueCell,
    formatConflictTimestamp,
    refreshConflictDrafts: refreshConflictDrafts2,
    openConflictRecoveryModal,
    setupSettingsListeners
  };
  if (typeof globalThis !== "undefined") {
    Object.assign(globalThis, settingsViewExports);
  }
  if (typeof window !== "undefined") {
    Object.assign(window, settingsViewExports);
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ...module.exports || {}, ...settingsViewExports };
  }
})();
