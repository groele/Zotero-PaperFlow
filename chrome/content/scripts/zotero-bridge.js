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
  // src/modules/zotero-bridge/resolver.ts
  function resolveZoteroItem(zotero, itemKey, libraryID = null) {
    if (!zotero || !itemKey) return null;
    const key = String(itemKey).trim();
    if (!key) return null;
    if (typeof zotero.ResearchFlow?.findItemByKey === "function") {
      try {
        const it = zotero.ResearchFlow.findItemByKey(key, libraryID);
        if (it) return it;
      } catch (_) {
      }
    }
    if (!zotero.Items?.getByLibraryAndKey) return null;
    if (libraryID !== null && libraryID !== void 0) {
      try {
        const it = zotero.Items.getByLibraryAndKey(libraryID, key);
        if (it) return it;
      } catch (_) {
      }
    }
    const userLibID = zotero.Libraries?.userLibraryID || 1;
    try {
      const it = zotero.Items.getByLibraryAndKey(userLibID, key);
      if (it) return it;
    } catch (_) {
    }
    try {
      const allLibs = typeof zotero.Libraries?.getAll === "function" ? zotero.Libraries.getAll() : [];
      for (const lib of allLibs) {
        const libId = lib?.libraryID || lib?.id;
        if (libId && libId !== userLibID) {
          const it = zotero.Items.getByLibraryAndKey(libId, key);
          if (it) return it;
        }
      }
    } catch (_) {
    }
    return null;
  }

  // src/modules/zotero-bridge/messenger.ts
  var bridgeMessengerMethods = {
    detectEnvironment() {
      try {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search || "");
          const mode = params.get("mode");
          if (mode === "subwindow" || window.arguments?.[0]?.options?.currentWindowType === "subwindow") {
            if (typeof document !== "undefined") {
              document.documentElement.classList.add("subwindow-mode");
              document.body?.classList?.add("subwindow-mode");
              if (this.getPref("subwindowCompactMode", true)) {
                document.documentElement.classList.add("compact-mode");
                document.body?.classList?.add("compact-mode");
              }
            }
          }
          if (window.arguments && window.arguments[0] && window.arguments[0].Zotero) {
            window.Zotero = window.arguments[0].Zotero;
            this.isZotero = true;
            return;
          }
          if (window.Zotero) {
            this.isZotero = true;
            return;
          }
          if (window.location?.protocol === "chrome:" && window.location.hostname === "researchflow" && (typeof Cc !== "undefined" || typeof Components !== "undefined")) {
            try {
              const host = (typeof Cc !== "undefined" ? Cc["@zotero.org/Zotero;1"] : Components?.classes?.["@zotero.org/Zotero;1"]).getService(typeof Ci !== "undefined" ? Ci.nsISupports : Components?.interfaces?.nsISupports).wrappedJSObject;
              if (host?.ResearchFlow) {
                window.Zotero = host;
                this.isZotero = true;
                return;
              }
            } catch (_) {
            }
          }
          if (window.parent && window.parent !== window && window.parent.Zotero) {
            window.Zotero = window.parent.Zotero;
            this.isZotero = true;
            return;
          }
          if (window.location && (window.location.protocol === "chrome:" || window.parent !== window)) {
            this.isZotero = true;
            return;
          }
        }
      } catch (_) {
      }
      this.isZotero = false;
    },
    setupMessageListener() {
      if (typeof window === "undefined") return;
      const onMessage = (event) => {
        const data = event.data;
        if (!data || typeof data !== "object") return;
        if (data.requestId && this._requestCallbacks.has(data.requestId)) {
          const cb = this._requestCallbacks.get(data.requestId);
          this._requestCallbacks.delete(data.requestId);
          if (cb) cb(data);
          return;
        }
        if (data.type === "RESEARCHFLOW_INIT_DATA") {
          if (data.data && typeof window.storage !== "undefined") {
            window.storage.cache = data.data;
          }
          if (data.pending) {
            this.handleHostNavigation(data.pending);
          }
        }
        if (data.type === "RESEARCHFLOW_NAVIGATE") {
          this.handleHostNavigation(data.options);
        }
        if (data.type === "RESEARCHFLOW_DATA_UPDATED" && data.data) {
          if (typeof window.applyDatabaseUpdate === "function") {
            window.applyDatabaseUpdate(data.data);
          } else {
            if (typeof window.storage !== "undefined") {
              window.storage.cache = data.data;
            }
            if (typeof window.renderDashboard === "function" && document.getElementById("view-dashboard")?.classList.contains("active")) {
              window.renderDashboard();
            } else if (typeof window.renderKanban === "function" && document.getElementById("view-manuscripts")?.classList.contains("active")) {
              window.renderKanban();
            } else if (typeof window.renderSubmissions === "function" && document.getElementById("view-submissions")?.classList.contains("active")) {
              window.renderSubmissions();
            }
          }
        }
        if (data.type === "RESEARCHFLOW_PREF_CHANGED" && data.key) {
          const targetDb = window.db || (typeof globalThis.db !== "undefined" ? globalThis.db : null);
          if (targetDb) {
            if (!targetDb.settings) targetDb.settings = {};
            targetDb.settings[data.key] = data.value;
          }
          if (data.key === "showJournalPortals" && typeof window.renderJournalPortals === "function") {
            try {
              window.renderJournalPortals();
            } catch (_) {
            }
          }
          if (data.key === "collapseEmptyKanbanStages" && typeof window.renderKanban === "function") {
            try {
              window.renderKanban();
            } catch (_) {
            }
          }
          if (data.key === "subwindowCompactMode" && typeof document !== "undefined") {
            const isCompact = Boolean(data.value);
            document.documentElement.classList.toggle("compact-mode", isCompact);
            document.body?.classList?.toggle("compact-mode", isCompact);
          }
        }
        if (data.type === "RESEARCHFLOW_COLLECTION_UPDATED") {
          if (typeof window.refreshZoteroCollectionFilter === "function") {
            window.refreshZoteroCollectionFilter();
          }
        }
        if (data.type === "RESEARCHFLOW_ITEM_UPDATED") {
          if (typeof window.storage !== "undefined" && typeof window.storage.getAll === "function") {
            window.storage.getAll().then((freshDb) => {
              if (freshDb && typeof window.applyDatabaseUpdate === "function") {
                window.applyDatabaseUpdate(freshDb);
              }
            }).catch(console.error);
          } else {
            if (typeof window.renderDashboard === "function" && document.getElementById("view-dashboard")?.classList.contains("active")) {
              window.renderDashboard();
            } else if (typeof window.renderKanban === "function" && document.getElementById("view-manuscripts")?.classList.contains("active")) {
              window.renderKanban();
            } else if (typeof window.renderSubmissions === "function" && document.getElementById("view-submissions")?.classList.contains("active")) {
              window.renderSubmissions();
            }
          }
        }
      };
      if (this._lifecycleScope) {
        this._lifecycleScope.on(window, "message", onMessage);
      } else {
        window.addEventListener("message", onMessage);
      }
    },
    sendToHost(msg) {
      if (!this.isZotero || typeof window === "undefined") return;
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(msg, "*");
          return;
        }
        if (window.opener) {
          window.opener.postMessage(msg, "*");
          return;
        }
      } catch (_) {
      }
    },
    request(type, payload = {}, timeoutMs = 6e3) {
      if (!this.isZotero || this._lifecycleScope?.aborted) return Promise.resolve(null);
      const requestId = `rf_req_${++this._pendingRequestId}_${Date.now()}`;
      return new Promise((resolve) => {
        let settled = false;
        let timeout = null;
        let detachAbort = null;
        const finish = (val) => {
          if (settled) return;
          settled = true;
          if (timeout !== null) clearTimeout(timeout);
          detachAbort?.();
          this._requestCallbacks.delete(requestId);
          resolve(val);
        };
        if (this._lifecycleScope) {
          detachAbort = this._lifecycleScope.onAbort(() => finish(null));
        }
        if (timeoutMs > 0) {
          timeout = setTimeout(() => finish(null), timeoutMs);
        }
        this._requestCallbacks.set(requestId, (data) => finish(data));
        this.sendToHost({ type, requestId, ...payload });
      });
    },
    initDirectPrefObserver() {
      try {
        if (typeof window === "undefined") return;
        const zotero = window.Zotero || (window.parent !== window ? window.parent?.Zotero : null);
        if (zotero?.Prefs?.registerObserver && !this._directPrefObserverSymbol) {
          this._directPrefObserverSymbol = /* @__PURE__ */ Symbol("ResearchFlowWorkbenchPrefObserver");
          zotero.Prefs.registerObserver("extensions.researchflow.", (pref) => {
            const prefix = "extensions.researchflow.";
            const key = pref && pref.startsWith(prefix) ? pref.slice(prefix.length) : pref;
            if (key) {
              const val = this.getPref(key);
              const targetDb = window.db || (typeof globalThis.db !== "undefined" ? globalThis.db : null);
              if (targetDb) {
                if (!targetDb.settings) targetDb.settings = {};
                targetDb.settings[key] = val;
              }
              if (key === "showJournalPortals" && typeof window.renderJournalPortals === "function") {
                try {
                  window.renderJournalPortals();
                } catch (_) {
                }
              }
              if (key === "collapseEmptyKanbanStages" && typeof window.renderKanban === "function") {
                try {
                  window.renderKanban();
                } catch (_) {
                }
              }
              if (key === "subwindowCompactMode" && typeof document !== "undefined") {
                const isCompact = Boolean(val);
                document.documentElement.classList.toggle("compact-mode", isCompact);
                document.body?.classList?.toggle("compact-mode", isCompact);
              }
            }
          }, this._directPrefObserverSymbol);
          window.addEventListener("unload", () => {
            try {
              if (this._directPrefObserverSymbol && zotero.Prefs?.unregisterObserver) {
                zotero.Prefs.unregisterObserver(this._directPrefObserverSymbol);
                this._directPrefObserverSymbol = null;
              }
            } catch (_) {
            }
          }, { once: true });
        }
      } catch (_) {
      }
    },
    getPref(key, defaultValue) {
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (typeof zotero?.ResearchFlow?.getPref === "function") {
          return zotero.ResearchFlow.getPref(key, defaultValue);
        }
        if (typeof zotero?.Prefs?.get === "function") {
          const val = zotero.Prefs.get(`extensions.researchflow.${key}`, true);
          if (val !== void 0) return val;
        }
      } catch (_) {
      }
      const currentDb = typeof window !== "undefined" ? window.db || (typeof globalThis.db !== "undefined" ? globalThis.db : null) : null;
      if (currentDb?.settings && key in currentDb.settings) {
        return currentDb.settings[key];
      }
      return defaultValue;
    },
    async conflictRecovery(action, payload = {}) {
      if (!["list", "inspect", "preview", "apply"].includes(action)) throw new Error("Invalid recovery action");
      const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
      if (typeof zotero?.ResearchFlow?.databaseConflictRecovery === "function") {
        return zotero.ResearchFlow.databaseConflictRecovery(action, payload);
      }
      if (!this.isZotero) throw new Error("Conflict recovery requires Zotero");
      const response = await this.request("RESEARCHFLOW_CONFLICT_RECOVERY", { action, payload }, action === "apply" ? 0 : 3e4);
      if (!response?.success) throw new Error(response?.error || "Conflict recovery request failed");
      return response.data;
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

  // src/modules/zotero-bridge/navigation-handler.ts
  var pendingNavigationScope = null;
  function handleHostNavigation(options) {
    if (!options || typeof options !== "object" || typeof window === "undefined") return;
    if (!window._researchflowWorkspaceReady) {
      this._pendingNavigation = options;
      return;
    }
    pendingNavigationScope?.abort("superseded");
    pendingNavigationScope = createLifecycleScope(this._lifecycleScope?.signal);
    const navScope = pendingNavigationScope;
    if (options.view && typeof document !== "undefined") {
      const navBtn = document.querySelector(`.nav-item[data-view="${options.view}"]`);
      if (navBtn) navBtn.click();
    }
    if (options.action === "create_manuscript_from_item" && options.item && typeof document !== "undefined") {
      const item = options.item;
      const kanbanBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
      if (kanbanBtn) kanbanBtn.click();
      navScope.setTimeout(() => {
        if (typeof window.openManuscriptModal === "function") {
          window.openManuscriptModal(null, {
            title: item.title || "",
            publication: item.publication || "",
            abstract: item.abstract || "",
            authors: item.authors || "",
            doi: item.doi || "",
            articleUrl: item.url || "",
            zoteroItemKey: item.key || "",
            zoteroUri: item.zoteroUri || "",
            pdfUri: item.pdfUri || "",
            citekey: item.citekey || "",
            bibtex: item.bibtex || "",
            citationApa: item.citationApa || "",
            relatedItems: item.relatedItems || [],
            collections: item.collections || [],
            tags: item.tags || [],
            status: "idea"
          });
          if (typeof window.showGlobalToast === "function") {
            window.showGlobalToast(`已从 Zotero 文献《${(item.title || "").slice(0, 18)}…》导入元数据`, "success");
          }
        }
      }, 200);
    } else if (options.action === "link_item_to_manuscript" && options.item && typeof document !== "undefined") {
      const item = options.item;
      const kanbanBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
      if (kanbanBtn) kanbanBtn.click();
      navScope.setTimeout(() => {
        if (typeof window.showLinkManuscriptModal === "function") {
          window.showLinkManuscriptModal(item);
        }
      }, 200);
    } else if (options.action === "reader_excerpt" && typeof document !== "undefined") {
      const kanbanBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
      if (kanbanBtn) kanbanBtn.click();
      navScope.setTimeout(() => {
        if (typeof window.openManuscriptModal === "function") {
          const excerptText = options.excerpt ? `【PDF 第 ${options.page || 1} 页原文摘录】
${options.excerpt}

[📖 在 Zotero 阅读器中查看原文](${options.pdfLink || ""})` : options.item?.abstract || "";
          window.openManuscriptModal(null, {
            title: options.item?.title ? `研读笔记：${options.item.title}` : "PDF 摘录笔记",
            publication: options.item?.publication || "",
            abstract: excerptText,
            authors: options.item?.authors || "",
            doi: options.item?.doi || "",
            articleUrl: options.pdfLink || options.item?.url || "",
            zoteroItemKey: options.item?.key || "",
            zoteroUri: options.item?.zoteroUri || "",
            pdfUri: options.pdfLink || options.item?.pdfUri || "",
            citekey: options.item?.citekey || "",
            bibtex: options.item?.bibtex || "",
            citationApa: options.item?.citationApa || "",
            relatedItems: options.item?.relatedItems || [],
            status: "idea"
          });
          if (typeof window.showGlobalToast === "function") {
            window.showGlobalToast(`已从 PDF 第 ${options.page || 1} 页载入摘录内容与文献关联`, "success");
          }
        }
      }, 200);
    } else if (options.action === "create_from_collection" && typeof document !== "undefined") {
      const kanbanBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
      if (kanbanBtn) kanbanBtn.click();
      navScope.setTimeout(() => {
        if (typeof window.openManuscriptModal === "function") {
          const colItems = options.items || [];
          const summary = colItems.slice(0, 5).map((it, idx) => `${idx + 1}. ${it.title} (${it.authors || ""} ${it.year || ""})`.trim()).join("\n");
          window.openManuscriptModal(null, {
            title: `${options.collectionName || "文献分类"} 论文写作管线`,
            publication: "",
            abstract: `基于 Zotero 分类【${options.collectionName || "文献分类"}】创建。
共包含文献 ${colItems.length} 篇：
${summary}${colItems.length > 5 ? "\n…" : ""}`,
            authors: "",
            doi: "",
            zoteroItemKey: colItems[0]?.key || "",
            zoteroUri: colItems[0]?.zoteroUri || "",
            pdfUri: colItems[0]?.pdfUri || "",
            status: "idea"
          });
          if (typeof window.showGlobalToast === "function") {
            window.showGlobalToast(`已基于分类【${options.collectionName || ""}】初始化论文稿件管线`, "success");
          }
        }
      }, 200);
    } else if (options.manuscriptId && typeof document !== "undefined") {
      const kanbanBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
      if (kanbanBtn) kanbanBtn.click();
      navScope.setTimeout(() => {
        const card = document.querySelector(`[data-manuscript-id="${options.manuscriptId}"]`) || document.querySelector(`[data-id="${options.manuscriptId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.classList.add("highlight-pulse");
          navScope.setTimeout(() => card.classList.remove("highlight-pulse"), 2500);
        }
      }, 300);
    }
  }

  // src/modules/zotero-bridge/actions.ts
  var bridgeActionMethods = {
    async getActiveItem() {
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.getCurrentActiveItem) {
          const item = zotero.ResearchFlow.getCurrentActiveItem();
          if (item) {
            return zotero.ResearchFlow.serializeLiteratureItem?.(item) || item;
          }
        }
      } catch (_) {
      }
      const res = await this.request("RESEARCHFLOW_GET_ACTIVE_ITEM");
      return res?.item || null;
    },
    openPdf(itemKey, page = null, libraryID = null) {
      if (!itemKey) return;
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero) {
          const item = resolveZoteroItem(zotero, itemKey, libraryID);
          if (item && zotero.ResearchFlow?.openPdfAttachment) {
            zotero.ResearchFlow.openPdfAttachment(item, page);
            return;
          }
        }
      } catch (_) {
      }
      this.sendToHost({ type: "RESEARCHFLOW_OPEN_PDF", itemKey, page, libraryID });
    },
    async syncNote(itemKey, libraryID = null) {
      if (!itemKey) return false;
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero) {
          const item = resolveZoteroItem(zotero, itemKey, libraryID);
          if (item) {
            if (item.deleted || typeof item.isEditable === "function" && !item.isEditable()) {
              return false;
            }
            if (zotero.ResearchFlow?.syncManuscriptToChildNote) {
              const note = await zotero.ResearchFlow.syncManuscriptToChildNote(item);
              return Boolean(note);
            }
          }
        }
      } catch (_) {
      }
      const res = await this.request("RESEARCHFLOW_SYNC_NOTE", { itemKey, libraryID });
      return Boolean(res?.success);
    },
    async getCollections(libraryID = null) {
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.getZoteroCollections) {
          return zotero.ResearchFlow.getZoteroCollections(libraryID);
        }
      } catch (_) {
      }
      const res = await this.request("RESEARCHFLOW_GET_COLLECTIONS", { libraryID });
      return res?.collections || [];
    },
    async searchLibrary(query, limit = 15) {
      if (!query) return [];
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.searchLibrary) {
          return await zotero.ResearchFlow.searchLibrary(query, limit);
        }
      } catch (_) {
      }
      const res = await this.request("RESEARCHFLOW_SEARCH_LIBRARY", { query, limit });
      return res?.results || [];
    },
    showNativeToast(title, message, type = "info") {
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.showToast) {
          zotero.ResearchFlow.showToast(title, message, type);
          return;
        }
      } catch (_) {
      }
      this.sendToHost({ type: "RESEARCHFLOW_SHOW_TOAST", title, message, toastType: type });
    },
    async getAnnotations(itemKey, libraryID = null) {
      if (!itemKey) return [];
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.getLiteratureAnnotations) {
          const item = resolveZoteroItem(zotero, itemKey, libraryID);
          if (item) {
            return zotero.ResearchFlow.getLiteratureAnnotations(item);
          }
        }
      } catch (_) {
      }
      const res = await this.request("RESEARCHFLOW_GET_ANNOTATIONS", { itemKey, libraryID });
      return res?.annotations || [];
    },
    async getReadingAssets(itemKey, libraryID = null) {
      if (!itemKey) return { annotations: [], notes: [], collections: [], tags: [], relatedItems: [] };
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.getLiteratureReadingAssets) {
          const item = resolveZoteroItem(zotero, itemKey, libraryID);
          if (item) {
            return zotero.ResearchFlow.getLiteratureReadingAssets(item);
          }
        }
      } catch (_) {
      }
      const res = await this.request("RESEARCHFLOW_GET_READING_ASSETS", { itemKey, libraryID });
      return res?.assets || { annotations: [], notes: [], collections: [], tags: [], relatedItems: [] };
    },
    async getNotes(itemKey, libraryID = null) {
      if (!itemKey) return [];
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.getLiteratureNotes) {
          const item = resolveZoteroItem(zotero, itemKey, libraryID);
          if (item) {
            return zotero.ResearchFlow.getLiteratureNotes(item);
          }
        }
      } catch (_) {
      }
      const res = await this.request("RESEARCHFLOW_GET_NOTES", { itemKey, libraryID });
      return res?.notes || [];
    },
    async syncStatusTag(itemKey, status, libraryID = null) {
      if (!itemKey || !status) return false;
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.syncStatusTagToItem) {
          const item = resolveZoteroItem(zotero, itemKey, libraryID);
          if (item) {
            if (item.deleted || typeof item.isEditable === "function" && !item.isEditable()) {
              return false;
            }
            return await zotero.ResearchFlow.syncStatusTagToItem(item, status);
          }
        }
      } catch (_) {
      }
      const res = await this.request("RESEARCHFLOW_SYNC_STATUS_TAG", { itemKey, status, libraryID });
      return Boolean(res?.success);
    },
    async addToPipelineCollection(itemKey, libraryID = null) {
      if (!itemKey) return false;
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.addItemToPipelineCollection) {
          const item = resolveZoteroItem(zotero, itemKey, libraryID);
          if (item) {
            if (item.deleted || typeof item.isEditable === "function" && !item.isEditable()) {
              return false;
            }
            const col = await zotero.ResearchFlow.addItemToPipelineCollection(item);
            return Boolean(col);
          }
        }
      } catch (_) {
      }
      const res = await this.request("RESEARCHFLOW_ADD_TO_PIPELINE_COLLECTION", { itemKey, libraryID });
      return Boolean(res?.success);
    },
    async saveShareImage(blob, fileName, language = "en") {
      try {
        const pngBytes = new Uint8Array(await blob.arrayBuffer());
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.saveShareImageFile) {
          return await zotero.ResearchFlow.saveShareImageFile(pngBytes, fileName, language);
        }
        return await this.request("RESEARCHFLOW_SAVE_SHARE_IMAGE", { pngBytes, fileName, language }, 0);
      } catch (error) {
        return { success: false, error: String(error?.message || error) };
      }
    },
    async exportDatabase() {
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.exportDatabaseFile) {
          return await zotero.ResearchFlow.exportDatabaseFile();
        }
      } catch (error) {
        return { success: false, error: String(error?.message || error) };
      }
      return await this.request("RESEARCHFLOW_EXPORT_DB");
    },
    async importDatabase(mode = "merge") {
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.importDatabaseFile) {
          return await zotero.ResearchFlow.importDatabaseFile(mode);
        }
      } catch (error) {
        return { success: false, error: String(error?.message || error) };
      }
      return await this.request("RESEARCHFLOW_IMPORT_DB", { mode });
    },
    async exportDiagnostics(report) {
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.exportDiagnosticsFile) {
          return await zotero.ResearchFlow.exportDiagnosticsFile(report);
        }
      } catch (error) {
        return { success: false, error: String(error?.message || error) };
      }
      return await this.request("RESEARCHFLOW_EXPORT_DIAGNOSTICS", { report });
    },
    async restoreBackup() {
      try {
        const zotero = typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null;
        if (zotero?.ResearchFlow?.restoreBackupDatabase) {
          const restored = await zotero.ResearchFlow.restoreBackupDatabase();
          return { success: true, data: restored };
        }
      } catch (e) {
        return { success: false, error: e.message };
      }
      return await this.request("RESEARCHFLOW_RESTORE_BACKUP");
    },
    async copyText(text, successToast = "已复制到剪贴板") {
      if (!text) return false;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          if (typeof window.showGlobalToast === "function" && successToast) {
            window.showGlobalToast(successToast, "success");
          }
          return true;
        }
      } catch (_) {
      }
      try {
        if (typeof document !== "undefined") {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          if (typeof window.showGlobalToast === "function" && successToast) {
            window.showGlobalToast(successToast, "success");
          }
          return true;
        }
      } catch (e) {
        console.warn("[ZoteroBridge] copyText failed:", e);
        return false;
      }
      return false;
    },
    handleHostNavigation,
    selectItemInZotero(itemKey, libraryID = null) {
      if (!itemKey || typeof window === "undefined") return;
      try {
        const zotero = window.Zotero || window.parent?.Zotero;
        if (zotero) {
          const item = resolveZoteroItem(zotero, itemKey, libraryID);
          const win = window.parent?.ZoteroPane ? window.parent : window;
          if (item && win.ZoteroPane?.selectItem) {
            win.ZoteroPane.selectItem(item.id);
            return;
          }
        }
      } catch (_) {
      }
      this.sendToHost({ type: "RESEARCHFLOW_SELECT_ITEM", itemKey, libraryID });
    },
    openExternal(url) {
      if (!url || typeof window === "undefined") return;
      try {
        const zotero = window.Zotero || window.parent?.Zotero;
        if (typeof zotero?.launchURL === "function") {
          zotero.launchURL(url);
          return;
        }
      } catch (_) {
      }
      this.sendToHost({ type: "RESEARCHFLOW_OPEN_EXTERNAL", url });
      try {
        if (window.open) {
          window.open(url, "_blank");
        }
      } catch (_) {
      }
    }
  };

  // src/modules/zotero-bridge.ts
  var ZoteroBridge = {
    isZotero: false,
    resolveZoteroItem,
    resolveItem(itemKey, libraryID = null) {
      return resolveZoteroItem(typeof window !== "undefined" ? window.Zotero || window.parent?.Zotero : null, itemKey, libraryID);
    },
    _pendingRequestId: 0,
    _requestCallbacks: /* @__PURE__ */ new Map(),
    _pendingNavigation: null,
    _directPrefObserverSymbol: null,
    _lifecycleScope: null,
    destroy() {
      this._lifecycleScope?.abort("bridge-destroy");
      this._lifecycleScope = null;
      this._requestCallbacks.clear();
    },
    init() {
      this.destroy();
      const scope = createLifecycleScope();
      this._lifecycleScope = scope;
      this.detectEnvironment();
      this.setupMessageListener();
      this.initDirectPrefObserver();
      if (typeof window !== "undefined") {
        scope.on(window, "unload", () => this.destroy(), { once: true });
        scope.on(window, "researchflow-workspace-ready", () => {
          if (this._pendingNavigation) {
            const options = this._pendingNavigation;
            this._pendingNavigation = null;
            this.handleHostNavigation(options);
          }
        });
      }
      if (this.isZotero && typeof document !== "undefined") {
        document.documentElement.classList.add("zotero-env");
        document.body?.classList?.add("zotero-env");
        this.sendToHost({ type: "RESEARCHFLOW_READY" });
        scope.on(document, "click", (e) => {
          const link = e.target?.closest?.('a[href^="http"]');
          if (link && !link.dataset.internal) {
            e.preventDefault();
            this.openExternal(link.href);
          }
        });
      }
      if (typeof window !== "undefined") {
        const initialOptions = window.arguments?.[0]?.options || window._researchflowPending;
        if (initialOptions) {
          this.handleHostNavigation(initialOptions);
        }
      }
    },
    ...bridgeMessengerMethods,
    ...bridgeActionMethods
  };
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => ZoteroBridge.init(), { once: true });
    } else {
      ZoteroBridge.init();
    }
  }
  if (typeof globalThis !== "undefined") {
    globalThis.ZoteroBridge = ZoteroBridge;
    globalThis.resolveZoteroItem = resolveZoteroItem;
  }
  if (typeof window !== "undefined") {
    window.ZoteroBridge = ZoteroBridge;
    window.resolveZoteroItem = resolveZoteroItem;
  }
})();
