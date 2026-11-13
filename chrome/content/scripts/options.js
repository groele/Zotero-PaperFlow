/**
 * ----------------------------------------------------------------------------------
 * ⚡ AUTO-GENERATED BUNDLE BY ESBUILD - DO NOT EDIT DIRECTLY
 * ----------------------------------------------------------------------------------
 * Source authority: `src/` TypeScript modules (100% strictly <= 360 lines).
 * Target runtime: Gecko 153+ / Firefox 140+ (minify: false for Error Console audit)
 * ----------------------------------------------------------------------------------
 */
const RF_OPTIONS_RENDER_VERSION = '17.0.0';
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

  // src/modules/options/toast-and-celebration.ts
  function ensureToastScope() {
    if (!toastScope || toastScope.aborted) {
      toastScope = createLifecycleScope();
      if (typeof window !== "undefined") {
        toastScope.on(window, "unload", () => {
          toastScope?.abort("unload");
          celebrationScope?.abort("unload");
        }, { once: true });
      }
    }
    return toastScope;
  }
  function showGlobalToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const scope = ensureToastScope();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "warning") icon = "⚠️";
    const iconEl = document.createElement("span");
    iconEl.textContent = icon;
    const textEl = document.createElement("span");
    textEl.textContent = String(message ?? "");
    toast.append(iconEl, textEl);
    container.appendChild(toast);
    scope.setTimeout(() => {
      toast.classList.add("fade-out");
      scope.setTimeout(() => toast.remove(), 300);
    }, 4e3);
  }
  function showAcceptanceCelebration(submission = {}) {
    try {
      (typeof window !== "undefined" ? window : globalThis)?.acceptanceCelebrationCleanup?.();
    } catch (_) {
    }
    if (typeof ZoteroBridge !== "undefined" && typeof ZoteroBridge.getPref === "function") {
      const enabled = ZoteroBridge.getPref("enableAcceptanceCelebration", true);
      if (!enabled) return;
    }
    const manuscript = (db?.manuscripts || []).find((item) => item.id === submission.manuscriptId);
    const title = String(manuscript?.title || submission.title || t("untitledManuscript")).trim();
    const layer = document.createElement("div");
    layer.className = "acceptance-celebration";
    layer.dataset.acceptanceCelebration = "active";
    layer.setAttribute("role", "status");
    layer.setAttribute("aria-live", "assertive");
    layer.setAttribute("aria-atomic", "true");
    const particles = document.createElement("div");
    particles.className = "acceptance-confetti-field";
    particles.setAttribute("aria-hidden", "true");
    const reducedMotion = window.RFUI?.prefersReducedMotion?.() !== false;
    if (!reducedMotion) {
      const colors = ["#059669", "#10b981", "#06b6d4", "#f59e0b", "#fbbf24", "#f97316"];
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < 54; index += 1) {
        const particle = document.createElement("i");
        particle.className = "acceptance-confetti-piece";
        particle.dataset.shape = index % 4 === 0 ? "round" : "strip";
        particle.style.setProperty("--confetti-x", `${Math.random() * 100}vw`);
        particle.style.setProperty("--confetti-drift", `${(Math.random() - 0.5) * 34}vw`);
        particle.style.setProperty("--confetti-rotate", `${540 + Math.random() * 900}deg`);
        particle.style.setProperty("--confetti-delay", `${Math.random() * 0.55}s`);
        particle.style.setProperty("--confetti-duration", `${2.25 + Math.random() * 1.15}s`);
        particle.style.setProperty("--confetti-color", colors[index % colors.length]);
        fragment.appendChild(particle);
      }
      particles.appendChild(fragment);
    }
    const banner = document.createElement("div");
    banner.className = "acceptance-celebration-banner";
    const seal = document.createElement("span");
    seal.className = "acceptance-celebration-seal";
    seal.setAttribute("aria-hidden", "true");
    const w = window;
    if (w.RFUI?.setHTML) w.RFUI.setHTML(seal, '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>');
    const copy = document.createElement("div");
    copy.className = "acceptance-celebration-copy";
    const eyebrow = document.createElement("span");
    eyebrow.className = "acceptance-celebration-eyebrow";
    eyebrow.textContent = t("celebrationEyebrow") || "Paper Accepted!";
    const heading = document.createElement("strong");
    heading.textContent = t("celebrationTitle") || "Congratulations on Acceptance";
    const desc = document.createElement("p");
    desc.textContent = title;
    copy.appendChild(eyebrow);
    copy.appendChild(heading);
    copy.appendChild(desc);
    banner.appendChild(seal);
    banner.appendChild(copy);
    layer.appendChild(particles);
    layer.appendChild(banner);
    document.body?.appendChild(layer);
    const scope = ensureToastScope();
    const cleanup = () => {
      celebrationScope?.abort("celebration-cleanup");
      celebrationScope = null;
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      acceptanceCelebrationCleanup = null;
    };
    celebrationScope?.abort("replace-celebration");
    celebrationScope = scope.child();
    acceptanceCelebrationCleanup = cleanup;
    celebrationScope.setTimeout(cleanup, 4500);
  }
  var celebrationScope, toastScope;
  var init_toast_and_celebration = __esm({
    "src/modules/options/toast-and-celebration.ts"() {
      "use strict";
      init_lifecycle();
      celebrationScope = null;
      toastScope = null;
    }
  });

  // src/modules/options/navigation-and-modal.ts
  function getModalLifecycleScope() {
    if (!modalScope || modalScope.aborted) {
      modalScope = createLifecycleScope();
      const created = modalScope;
      registerModalCleanup(() => created.abort("modal-closed"));
    }
    return modalScope;
  }
  function getModalAbortSignal() {
    return getModalLifecycleScope().signal;
  }
  function activateWorkspaceView(viewId) {
    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".content-view");
    const g2 = typeof window !== "undefined" ? window : globalThis;
    if (viewId !== "view-submissions") {
      focusEditTimerScope?.abort("view-switch");
      focusEditTimerScope = null;
      try {
        g2?.submissionAutoSaveCleanup?.();
      } catch (_) {
      }
    }
    navItems.forEach((nav) => {
      nav.classList.toggle("active", nav.getAttribute("data-view") === viewId);
    });
    views.forEach((view) => {
      view.classList.toggle("active", view.id === viewId);
    });
    const dirtyViews = window.RFUI?.getDirtyViewsSet?.();
    dirtyViews?.delete(viewId);
    try {
      if (viewId === "view-dashboard" && typeof renderDashboard === "function") renderDashboard();
      else if (viewId === "view-manuscripts" && typeof renderKanban === "function") renderKanban();
      else if (viewId === "view-submissions" && typeof renderSubmissions === "function") renderSubmissions();
      else if (viewId === "view-settings" && typeof renderSettings === "function") renderSettings();
    } catch (err) {
      console.error("[PaperFlow] View render error:", err);
    }
  }
  function focusSubmissionEditCenter() {
    const editCenter = document.getElementById("submission-entry-editor-panel");
    if (!editCenter) return;
    editCenter.classList.remove("submission-edit-center-focus");
    void editCenter.offsetWidth;
    editCenter.classList.add("submission-edit-center-focus");
    editCenter.scrollIntoView({ behavior: "smooth", block: "start" });
    const titleInput = document.getElementById("sub-edit-title");
    if (titleInput) {
      focusEditTimerScope?.abort("re-focus");
      focusEditTimerScope = createLifecycleScope();
      focusEditTimerScope.setTimeout(() => {
        titleInput.focus({ preventScroll: true });
        titleInput.select?.();
      }, 120);
    }
  }
  function openSubmissionForEditing(subOrId, options = {}) {
    const g2 = typeof window !== "undefined" ? window : globalThis;
    const database = g2?.db || (typeof db !== "undefined" ? db : null);
    const sub = typeof subOrId === "string" ? (database?.submissions || []).find((item) => item.id === subOrId) : subOrId;
    if (!sub) {
      showGlobalToast(t("submissionNotFound"), "error");
      return;
    }
    try {
      g2?.submissionAutoSaveCleanup?.();
    } catch (_) {
    }
    if (g2) g2.selectedSubmissionId = sub.id;
    if (options.switchView) {
      activateWorkspaceView("view-submissions");
    }
    renderSubmissions({ refreshDetails: false });
    renderSubmissionDetails(sub);
    if (options.focusEditCenter) {
      focusSubmissionEditCenter();
    }
  }
  function getModalFocusableElements() {
    const modal = document.getElementById("modal-overlay");
    const modalContent = document.getElementById("modal-body");
    if (!modal || !modal.classList.contains("active") || !modalContent) return [];
    const selector = [
      "a[href]",
      "button:not([disabled])",
      'input:not([disabled]):not([type="hidden"])',
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])'
    ].join(", ");
    return Array.from(modalContent.querySelectorAll(selector)).filter((el) => el instanceof HTMLElement && !el.hidden && el.offsetParent !== null);
  }
  function openModal(htmlContent) {
    const modal = document.getElementById("modal-overlay");
    const modalContent = document.getElementById("modal-body");
    if (!modal || !modalContent) return;
    modalScope?.abort("open-modal");
    modalScope = null;
    if (typeof currentModalCleanup === "function") {
      const cleanup = currentModalCleanup;
      currentModalCleanup = null;
      cleanup();
    }
    const activeScope = createLifecycleScope();
    modalScope = activeScope;
    previousModalFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.RFUI.setHTML(modalContent, htmlContent);
    modal.inert = false;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    activeScope.on(document.getElementById("btn-close-modal"), "click", closeModal);
    activeScope.setTimeout(() => {
      const firstFocusable = getModalFocusableElements()[0] || modalContent;
      firstFocusable?.focus?.({ preventScroll: true });
    }, 0);
  }
  function registerModalCleanup(fn) {
    const prev = currentModalCleanup;
    currentModalCleanup = () => {
      try {
        if (typeof prev === "function") prev();
      } catch (_) {
      }
      try {
        if (typeof fn === "function") fn();
      } catch (_) {
      }
    };
  }
  function closeModal() {
    const modal = document.getElementById("modal-overlay");
    const modalContent = document.getElementById("modal-body");
    const activeScope = modalScope;
    modalScope = null;
    activeScope?.abort("close-modal");
    if (typeof currentModalCleanup === "function") {
      const cleanup = currentModalCleanup;
      currentModalCleanup = null;
      cleanup();
    }
    if (!modal || !modalContent) return;
    modal.classList.remove("active");
    modal.inert = true;
    modal.setAttribute("aria-hidden", "true");
    window.RFUI.setHTML(modalContent, "");
    if (previousModalFocus && typeof previousModalFocus.focus === "function" && previousModalFocus.isConnected) {
      previousModalFocus.focus({ preventScroll: true });
    }
    previousModalFocus = null;
  }
  function bindModalAndNavListeners() {
    workspaceNavScope?.abort("rebind");
    const navScope = createLifecycleScope();
    workspaceNavScope = navScope;
    if (typeof window !== "undefined") {
      navScope.on(window, "unload", () => {
        focusEditTimerScope?.abort("unload");
        modalScope?.abort("unload");
        try {
          g?.acceptanceCelebrationCleanup?.();
        } catch (_) {
        }
        try {
          g?.submissionAutoSaveCleanup?.();
        } catch (_) {
        }
        navScope.abort("unload");
      }, { once: true });
    }
    const bindNav = () => {
      const navItems = document.querySelectorAll?.(".nav-item") || [];
      navItems.forEach((item) => {
        if (item && !item.dataset.navBound) {
          item.dataset.navBound = "true";
          navScope.on(item, "click", (e) => {
            e.preventDefault();
            const targetId = item.getAttribute("data-view");
            if (targetId) activateWorkspaceView(targetId);
          });
        }
      });
    };
    bindNav();
    if (typeof document !== "undefined" && document.readyState === "loading") {
      navScope.on(document, "DOMContentLoaded", bindNav, { once: true });
    }
    const modal = document.getElementById("modal-overlay");
    if (typeof modal?.addEventListener === "function" && !modal.dataset.modalBound) {
      modal.dataset.modalBound = "true";
      navScope.on(modal, "click", (e) => {
        if (e.target === modal) closeModal();
      });
    }
    if (typeof document?.addEventListener === "function" && !document._pfKeydownBound) {
      document._pfKeydownBound = true;
      navScope.on(document, "keydown", (event) => {
        const modalEl = document.getElementById("modal-overlay");
        if (!modalEl || !modalEl.classList.contains("active")) return;
        if (event.key === "Escape") {
          event.preventDefault();
          closeModal();
          return;
        }
        if (event.key !== "Tab") return;
        const focusables = getModalFocusableElements();
        if (focusables.length === 0) {
          event.preventDefault();
          document.getElementById("modal-body")?.focus?.({ preventScroll: true });
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && (document.activeElement === first || !modalEl.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    }
  }
  var RF_OPTIONS_RENDER_VERSION, UI_THEME_OPTIONS, modalScope, focusEditTimerScope, workspaceNavScope, g;
  var init_navigation_and_modal = __esm({
    "src/modules/options/navigation-and-modal.ts"() {
      "use strict";
      init_lifecycle();
      init_toast_and_celebration();
      RF_OPTIONS_RENDER_VERSION = "17.0.0";
      UI_THEME_OPTIONS = /* @__PURE__ */ new Set(["system", "light", "dark"]);
      modalScope = null;
      focusEditTimerScope = null;
      workspaceNavScope = null;
      g = typeof globalThis !== "undefined" ? globalThis : window;
      if (!("db" in g)) g.db = null;
      if (!("currentLanguage" in g)) g.currentLanguage = "zh";
      if (!("selectedProjectId" in g)) g.selectedProjectId = null;
      if (!("selectedSubmissionId" in g)) g.selectedSubmissionId = null;
      if (!("currentDashboardFilter" in g)) g.currentDashboardFilter = "all";
      if (!("isPipelineExpanded" in g)) g.isPipelineExpanded = false;
      if (!("showEmptyKanbanColumns" in g)) g.showEmptyKanbanColumns = true;
      if (!("submissionAutoSaveCleanup" in g)) g.submissionAutoSaveCleanup = null;
      if (!("pendingSubmissionSaves" in g)) g.pendingSubmissionSaves = 0;
      if (!("acceptanceCelebrationCleanup" in g)) g.acceptanceCelebrationCleanup = null;
      if (!("previousModalFocus" in g)) g.previousModalFocus = null;
      if (!("currentModalCleanup" in g)) g.currentModalCleanup = null;
      g.RF_OPTIONS_RENDER_VERSION = RF_OPTIONS_RENDER_VERSION;
      g.UI_THEME_OPTIONS = UI_THEME_OPTIONS;
      g.getModalLifecycleScope = getModalLifecycleScope;
      g.getModalAbortSignal = getModalAbortSignal;
    }
  });

  // src/modules/options/bootstrap-and-actions.ts
  function bindZoteroActionListeners() {
    actionScope?.abort("rebind");
    const scope = createLifecycleScope();
    actionScope = scope;
    scope.on(window, "unload", () => {
      pendingActionTimerScope?.abort("unload");
      bootstrapScope?.abort("unload");
      scope.abort("unload");
    }, { once: true });
    scope.on(window, "researchflow:action", (e) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.view) {
        const navBtn = document.querySelector(`.nav-item[data-view="${detail.view}"]`);
        if (navBtn) navBtn.click();
      }
      if (detail.action === "create_manuscript_from_item" && detail.item) {
        const navBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
        if (navBtn) navBtn.click();
        pendingActionTimerScope?.abort("superseded");
        pendingActionTimerScope = scope.child();
        pendingActionTimerScope.setTimeout(() => {
          if (typeof openManuscriptModal === "function") {
            openManuscriptModal(null, {
              title: detail.item.title,
              publication: detail.item.publication,
              authors: detail.item.authors,
              doi: detail.item.doi,
              articleUrl: detail.item.url,
              abstract: detail.item.abstract,
              zoteroItemKey: detail.item.key,
              zoteroLibraryID: detail.item.libraryID ?? null,
              zoteroUri: detail.item.zoteroUri,
              pdfUri: detail.item.pdfUri,
              citekey: detail.item.citekey,
              bibtex: detail.item.bibtex,
              citationApa: detail.item.citationApa,
              relatedItems: detail.item.relatedItems,
              status: "planning"
            });
          }
        }, 150);
      } else if (detail.action === "create_submission_from_item" && detail.item) {
        const navBtn = document.querySelector('.nav-item[data-view="view-submissions"]');
        if (navBtn) navBtn.click();
        pendingActionTimerScope?.abort("superseded");
        pendingActionTimerScope = scope.child();
        pendingActionTimerScope.setTimeout(() => {
          const existingMan = (db?.manuscripts || []).find(
            (m) => m.zoteroItemKey && m.zoteroItemKey === detail.item.key || detail.item.doi && m.doi && m.doi.toLowerCase() === detail.item.doi.toLowerCase()
          );
          const existingSub = existingMan ? (db?.submissions || []).find((s) => s.manuscriptId === existingMan.id) : null;
          if (existingSub && typeof openSubmissionForEditing === "function") {
            openSubmissionForEditing(existingSub.id, { switchView: true, focusEditCenter: true });
            showGlobalToast(currentLanguage === "zh" ? `已打开《${(detail.item.title || "").slice(0, 18)}…》的投稿与修回记录` : `Opened submission record for "${(detail.item.title || "").slice(0, 22)}..."`, "info");
          } else {
            document.getElementById("btn-add-submission")?.click();
          }
        }, 160);
      } else if (detail.action === "link_item_to_manuscript" && detail.item) {
        const navBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
        if (navBtn) navBtn.click();
        showGlobalToast(`请点击要与《${(detail.item.title || "").slice(0, 20)}…》关联的稿件卡片，或在编辑窗口中保存绑定`, "info");
        window._pendingZoteroLinkItem = detail.item;
        if (typeof renderKanban === "function") renderKanban();
      }
    });
    scope.on(window, "researchflow:data-updated", (e) => {
      if (e.detail) {
        db = e.detail;
        const activeView = document.querySelector(".content-view.active")?.id || "view-dashboard";
        const dirtyViews = window.RFUI?.getDirtyViewsSet?.();
        ["view-dashboard", "view-manuscripts", "view-submissions"].forEach((vid) => {
          if (vid !== activeView) dirtyViews?.add(vid);
        });
        if (activeView === "view-dashboard" && typeof renderDashboard === "function") renderDashboard();
        else if (activeView === "view-manuscripts" && typeof renderKanban === "function") renderKanban();
        else if (activeView === "view-submissions" && typeof renderSubmissions === "function") renderSubmissions();
      }
    });
    scope.on(window, "researchflow:prefs-updated", (e) => {
      if (!e.detail) return;
      if (e.detail.language && (e.detail.language === "zh" || e.detail.language === "en")) {
        currentLanguage = e.detail.language;
        if (db?.settings?.profile) db.settings.profile.language = currentLanguage;
        if (typeof applyLanguage === "function") applyLanguage();
      }
      if (e.detail.theme) {
        if (db?.settings?.profile) db.settings.profile.theme = e.detail.theme;
        if (typeof applyThemePreference === "function") applyThemePreference(e.detail.theme);
      }
      if (typeof renderDashboard === "function") renderDashboard();
      if (typeof renderKanban === "function") renderKanban();
      if (typeof renderSubmissions === "function") renderSubmissions();
    });
  }
  async function initializeWorkspace() {
    if (!window.storage) {
      console.error("Storage engine not loaded!");
      return;
    }
    bootstrapScope?.abort("reinit");
    const scope = createLifecycleScope();
    bootstrapScope = scope;
    db = await window.storage.loadAll();
    const normalizedStatuses = normalizeSubmissionStatuses(db);
    const cleanedPublicationLinks = clearUnacceptedPublicationLinks(db);
    const syncedManuscripts = syncManuscriptStatusesFromSubmissions(db);
    if (normalizedStatuses || cleanedPublicationLinks || syncedManuscripts) {
      await window.storage.saveAll(db);
    }
    currentLanguage = resolvePreferredLanguage();
    applyThemePreference(db?.settings?.profile?.theme);
    if (window.matchMedia) {
      const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemThemeChange = () => {
        if ((db?.settings?.profile?.theme || "system") === "system") {
          applyThemePreference("system");
          renderDashboard();
        }
      };
      if (typeof darkScheme.addEventListener === "function") {
        scope.on(darkScheme, "change", handleSystemThemeChange);
      }
    }
    const defaultTab = typeof ZoteroBridge !== "undefined" ? ZoteroBridge.getPref("defaultWorkspaceTab", "view-dashboard") : "view-dashboard";
    if (defaultTab && defaultTab !== "view-dashboard") {
      activateWorkspaceView(defaultTab);
    }
    applyLanguage();
    if (typeof window.initializePipelineViewMode === "function") {
      window.initializePipelineViewMode();
    }
    if (typeof window.initializeKanbanEmptyColumnsMode === "function") {
      window.initializeKanbanEmptyColumnsMode();
    }
    if (typeof window.bindDashboardControls === "function") {
      window.bindDashboardControls();
    }
    renderDashboard();
    renderKanban();
    renderSubmissions();
    await renderSettings();
    setupSubmissionSearch();
    setupJournalPortalListeners();
    scope.on(document.getElementById("btn-force-sync"), "click", async () => {
      const provider = document.getElementById("route-db")?.value || db?.settings?.syncProviders?.metadata?.provider || "local";
      if (provider === "local") {
        showGlobalToast(t("localSyncSummary"), "info");
        return;
      }
      const btn = document.getElementById("btn-force-sync");
      if (!btn) return;
      const origNodes = Array.from(btn.childNodes).map((node) => node.cloneNode(true));
      btn.textContent = "⏳ Syncing...";
      btn.disabled = true;
      const result = await window.storage.syncNow();
      if (scope.aborted) return;
      if (result?.success) {
        db = await window.storage.loadAll();
        renderDashboard();
        renderKanban();
        renderSubmissions();
        await renderSettings();
        btn.textContent = "✅ Synced!";
        showGlobalToast("Cloud database synchronized successfully.", "success");
      } else {
        btn.textContent = "❌ Sync Failed";
        showGlobalToast(result?.message || "Cloud sync failed. Check your provider settings.", "error");
      }
      scope.setTimeout(() => {
        btn.replaceChildren(...origNodes);
        btn.disabled = false;
      }, 2e3);
    });
  }
  var actionScope, pendingActionTimerScope, bootstrapScope;
  var init_bootstrap_and_actions = __esm({
    "src/modules/options/bootstrap-and-actions.ts"() {
      "use strict";
      init_navigation_and_modal();
      init_lifecycle();
      actionScope = null;
      pendingActionTimerScope = null;
      bootstrapScope = null;
    }
  });

  // src/modules/options.ts
  var require_options = __commonJS({
    "src/modules/options.ts"(exports, module) {
      init_navigation_and_modal();
      init_bootstrap_and_actions();
      bindZoteroActionListeners();
      document.addEventListener("DOMContentLoaded", () => {
        initializeWorkspace();
      });
      bindModalAndNavListeners();
      var optionsExports = {
        RF_OPTIONS_RENDER_VERSION,
        UI_THEME_OPTIONS,
        activateWorkspaceView,
        focusSubmissionEditCenter,
        openSubmissionForEditing,
        getModalFocusableElements,
        openModal,
        registerModalCleanup,
        closeModal,
        showGlobalToast,
        showAcceptanceCelebration
      };
      if (typeof globalThis !== "undefined") {
        Object.assign(globalThis, optionsExports);
        globalThis.modal = document.getElementById("modal-overlay");
        globalThis.modalContent = document.getElementById("modal-body");
      }
      if (typeof window !== "undefined") {
        Object.assign(window, optionsExports);
        window.modal = document.getElementById("modal-overlay");
        window.modalContent = document.getElementById("modal-body");
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = { ...module.exports || {}, ...optionsExports };
      }
    }
  });
  require_options();
})();
