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

  // src/modules/item-pane.ts
  function copyToClipboard(text) {
    if (!text) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
        });
        return;
      }
    } catch (_) {
    }
    try {
      const classes = typeof Cc !== "undefined" ? Cc : typeof Components !== "undefined" ? Components.classes : null;
      const interfaces = typeof Ci !== "undefined" ? Ci : typeof Components !== "undefined" ? Components.interfaces : null;
      const clipboard = classes?.["@mozilla.org/widget/clipboardhelper;1"]?.getService(interfaces?.nsIClipboardHelper);
      if (clipboard) clipboard.copyString(text);
    } catch (_) {
    }
  }
  function registerItemPaneSection(host) {
    if (typeof Zotero === "undefined" || typeof Zotero.ItemPaneManager?.registerSection !== "function") return null;
    try {
      const sectionStates = /* @__PURE__ */ new WeakMap();
      const icon = `${host.CHROME_ROOT || "chrome://researchflow/content/"}icons/researchflow.svg`;
      const ADDON_ID = host.addonId || "zotero-paperflow@groele.org";
      const sectionID = Zotero.ItemPaneManager.registerSection({
        paneID: "researchflow-item-pane",
        pluginID: ADDON_ID,
        header: { l10nID: "researchflow-item-pane-header", icon },
        sidenav: { l10nID: "researchflow-item-pane-sidenav", icon },
        onInit: ({ doc, body, item, refresh }) => {
          const document = doc || body?.ownerDocument;
          if (document) {
            host.ensureLocalization?.(document);
          }
          const target = host.getLiteratureItem?.(item) || item;
          const paneScope = createLifecycleScope();
          const state = {
            itemKey: target?.key || null,
            refresh,
            paneScope,
            renderScope: null,
            onDataChanged: () => {
              if (paneScope.aborted) return;
              Promise.resolve(refresh?.()).catch((err) => {
                if (typeof Zotero !== "undefined") Zotero.logError?.("[PaperFlow] ItemPane refresh failed: " + err);
              });
            }
          };
          host.registerDataListener?.(state.onDataChanged);
          sectionStates.set(body, state);
        },
        onDestroy: ({ body }) => {
          const state = sectionStates.get(body);
          state?.renderScope?.abort("pane-destroy");
          state?.paneScope?.abort("pane-destroy");
          if (state?.onDataChanged) {
            host.unregisterDataListener?.(state.onDataChanged);
          }
          sectionStates.delete(body);
        },
        onItemChange: ({ body, item, setEnabled }) => {
          const target = host.getLiteratureItem?.(item) || item;
          const state = sectionStates.get(body);
          if (state) state.itemKey = target?.key || null;
          setEnabled(Boolean(target));
        },
        onRender: async ({ doc, body, item, setSectionSummary }) => {
          if (!body) return;
          const state = sectionStates.get(body);
          if (state?.paneScope?.aborted) return;
          state?.renderScope?.abort("re-render");
          const renderScope = createLifecycleScope(state?.paneScope?.signal);
          if (state) state.renderScope = renderScope;
          const document = doc || body.ownerDocument;
          body.replaceChildren();
          const target = host.getLiteratureItem?.(item) || item;
          if (!target) return;
          const isReadOnly = Boolean(target.deleted || typeof target.isEditable === "function" && !target.isEditable());
          const db = host._cachedData || await host.loadDatabase();
          if (renderScope.aborted) return;
          const targetKey = target.key;
          const targetDoi = (typeof target.getField === "function" ? target.getField("DOI") : "") || "";
          const allManuscripts = db.manuscripts || [];
          const keyMatched = allManuscripts.filter((m) => m.zoteroItemKey && m.zoteroItemKey === targetKey);
          const doiMatched = !keyMatched.length && targetDoi ? allManuscripts.filter(
            (m) => m.zoteroItemKey === void 0 && !m.zoteroUnbound && m.doi && m.doi.toLowerCase() === targetDoi.toLowerCase()
          ) : [];
          const manuscripts = keyMatched.length ? keyMatched : doiMatched;
          const count = manuscripts.length;
          setSectionSummary?.(count ? `${count} 个稿件管线` : "");
          const wrap = document.createElement("div");
          wrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; padding:6px 2px; font-size:12px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; width:100%; box-sizing:border-box;';
          if (count > 0) {
            manuscripts.forEach((m) => {
              const card = document.createElement("div");
              card.style.cssText = "background:var(--fill-secondary, var(--background-secondary, rgba(127,127,127,0.06))); border:1px solid var(--border-primary, var(--border-color, rgba(127,127,127,0.2))); border-radius:6px; padding:8px 10px; display:flex; flex-direction:column; gap:6px; box-sizing:border-box; color:var(--text-primary, inherit);";
              const header = document.createElement("div");
              header.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:6px;";
              const titleEl = document.createElement("div");
              titleEl.style.cssText = "font-weight:600; font-size:12px; color:#e11d48; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;";
              titleEl.textContent = m.title || "未命名稿件";
              const statusStyles = {
                planning: { bg: "rgba(6,182,212,0.12)", color: "#0891b2", label: "规划中", pct: 15 },
                idea: { bg: "rgba(6,182,212,0.12)", color: "#0891b2", label: "选题中", pct: 15 },
                in_progress: { bg: "rgba(99,102,241,0.12)", color: "#6366f1", label: "正在进行", pct: 40 },
                drafting: { bg: "rgba(99,102,241,0.12)", color: "#6366f1", label: "初稿撰写", pct: 40 },
                under_review: { bg: "rgba(99,102,241,0.18)", color: "#4f46e5", label: "同行审稿", pct: 65 },
                revision: { bg: "rgba(217,119,6,0.12)", color: "#d97706", label: "修回修订", pct: 80 },
                accepted: { bg: "rgba(5,150,105,0.12)", color: "#059669", label: "已录用", pct: 95 },
                published: { bg: "rgba(225,29,72,0.12)", color: "#e11d48", label: "已发表", pct: 100 }
              };
              const st = statusStyles[m.status] || { bg: "rgba(99,102,241,0.12)", color: "#6366f1", label: m.status || "撰写中", pct: 50 };
              const badge = document.createElement("span");
              badge.style.cssText = `font-size:10px; padding:2px 7px; border-radius:4px; background:${st.bg}; color:${st.color}; font-weight:600; white-space:nowrap;`;
              badge.textContent = st.label;
              header.append(titleEl, badge);
              const progTrack = document.createElement("div");
              progTrack.style.cssText = "width:100%; height:3px; background:var(--fill-tertiary, rgba(127,127,127,0.15)); border-radius:2px; overflow:hidden;";
              const progFill = document.createElement("div");
              progFill.style.cssText = `width:${st.pct}%; height:100%; background:${st.color}; border-radius:2px; transition:width 0.3s ease;`;
              progTrack.appendChild(progFill);
              const meta = document.createElement("div");
              meta.style.cssText = "font-size:11px; color:var(--text-secondary, #64748b); display:flex; justify-content:space-between;";
              meta.textContent = m.targetJournal ? `目标期刊: ${m.targetJournal}` : "自拟稿件管线";
              const actionRow = document.createElement("div");
              actionRow.style.cssText = "display:flex; gap:6px; justify-content:flex-end; margin-top:4px; flex-wrap:wrap;";
              const btnView = document.createElement("button");
              btnView.style.cssText = "font-size:11px; padding:3px 8px; border-radius:4px; border:1px solid #e11d48; background:transparent; color:#e11d48; cursor:pointer; font-weight:500;";
              btnView.textContent = "🔍 查看";
              btnView.title = "在 Zotero PaperFlow 工作台中打开该稿件";
              renderScope.on(btnView, "click", () => {
                host.triggerResearchFlowOpen?.(document.defaultView, {
                  view: "view-manuscripts",
                  manuscriptId: m.id
                });
              });
              actionRow.appendChild(btnView);
              const btnSyncNote = document.createElement("button");
              btnSyncNote.style.cssText = "font-size:11px; padding:3px 8px; border-radius:4px; border:1px solid var(--border-primary, #cbd5e1); background:var(--fill-secondary, rgba(127,127,127,0.08)); color:var(--text-primary, #334155); font-weight:500;";
              btnSyncNote.textContent = "📝 同步笔记";
              if (isReadOnly) {
                btnSyncNote.disabled = true;
                btnSyncNote.style.opacity = "0.5";
                btnSyncNote.style.cursor = "not-allowed";
                btnSyncNote.title = "条目处于只读库或回收站，不可同步笔记";
              } else {
                btnSyncNote.style.cursor = "pointer";
                btnSyncNote.title = "将稿件进展与审稿矩阵同步为文献子笔记 (支持 Zotero 云端全平台多端同步)";
                renderScope.on(btnSyncNote, "click", async () => {
                  btnSyncNote.textContent = "⏳ 同步中...";
                  const note = await host.syncManuscriptToChildNote?.(target, m);
                  if (renderScope.aborted) return;
                  if (note) {
                    btnSyncNote.textContent = "✅ 已同步";
                    renderScope.setTimeout(() => {
                      btnSyncNote.textContent = "📝 同步笔记";
                    }, 2e3);
                  } else {
                    btnSyncNote.textContent = "❌ 失败";
                  }
                });
              }
              actionRow.appendChild(btnSyncNote);
              const metaData = host.serializeLiteratureItem?.(target);
              if (metaData?.pdfUri) {
                const btnPdf = document.createElement("button");
                btnPdf.style.cssText = "font-size:11px; padding:3px 8px; border-radius:4px; border:1px solid #059669; background:transparent; color:#059669; cursor:pointer; font-weight:500;";
                btnPdf.textContent = "📖 PDF";
                btnPdf.title = "在 Zotero PDF 阅读器中打开";
                renderScope.on(btnPdf, "click", () => {
                  host.openPdfAttachment?.(target);
                });
                actionRow.appendChild(btnPdf);
              }
              const synergyBar = document.createElement("div");
              synergyBar.style.cssText = "display:flex; align-items:center; justify-content:space-between; font-size:11px; color:var(--text-secondary, #475569); background:var(--fill-tertiary, rgba(127,127,127,0.08)); padding:4px 6px; border-radius:4px; margin-top:2px;";
              const citeChip = document.createElement("span");
              citeChip.style.cssText = "cursor:pointer; font-family:monospace; background:rgba(37,99,235,0.08); color:#2563eb; padding:1px 5px; border-radius:3px; font-weight:600;";
              citeChip.textContent = `[@${metaData?.citekey || ""}]`;
              citeChip.title = "点击复制 Citation Key";
              renderScope.on(citeChip, "click", () => {
                copyToClipboard(`[@${metaData?.citekey || ""}]`);
                citeChip.textContent = "✅ 已复制";
                renderScope.setTimeout(() => {
                  citeChip.textContent = `[@${metaData?.citekey || ""}]`;
                }, 1800);
              });
              const annoInfo = document.createElement("span");
              annoInfo.style.cssText = "font-size:10px; color:var(--text-secondary, #64748b);";
              annoInfo.textContent = metaData?.annotationCount > 0 ? `📑 ${metaData.annotationCount} 条批注` : "暂无批注";
              const notesInfo = document.createElement("span");
              notesInfo.style.cssText = "font-size:10px; color:#2563eb;";
              notesInfo.textContent = metaData?.notesCount > 0 ? `📝 ${metaData.notesCount} 篇笔记` : "";
              synergyBar.append(citeChip, annoInfo);
              if (metaData?.notesCount > 0) synergyBar.appendChild(notesInfo);
              const btnApa = document.createElement("button");
              btnApa.style.cssText = "font-size:11px; padding:3px 8px; border-radius:4px; border:1px solid var(--border-primary, #cbd5e1); background:var(--fill-secondary, rgba(127,127,127,0.08)); color:var(--text-secondary, #475569); cursor:pointer; font-weight:500;";
              btnApa.textContent = "📋 引用";
              btnApa.title = "复制标准引用 (APA)";
              renderScope.on(btnApa, "click", () => {
                copyToClipboard(metaData?.citationApa || "");
                btnApa.textContent = "✅ 已复制";
                renderScope.setTimeout(() => {
                  btnApa.textContent = "📋 引用";
                }, 1800);
              });
              const btnBib = document.createElement("button");
              btnBib.style.cssText = "font-size:11px; padding:3px 8px; border-radius:4px; border:1px solid var(--border-primary, #cbd5e1); background:var(--fill-secondary, rgba(127,127,127,0.08)); color:var(--text-secondary, #475569); cursor:pointer; font-weight:500;";
              btnBib.textContent = "📋 BibTeX";
              btnBib.title = "复制 BibTeX 引用条目";
              renderScope.on(btnBib, "click", () => {
                copyToClipboard(metaData?.bibtex || "");
                btnBib.textContent = "✅ 已复制";
                renderScope.setTimeout(() => {
                  btnBib.textContent = "📋 BibTeX";
                }, 1800);
              });
              actionRow.insertBefore(btnBib, actionRow.firstChild);
              actionRow.insertBefore(btnApa, actionRow.firstChild);
              card.append(header, progTrack, meta, synergyBar, actionRow);
              wrap.appendChild(card);
            });
          } else {
            const emptyCard = document.createElement("div");
            emptyCard.style.cssText = "background:var(--fill-secondary, var(--background-secondary, rgba(127,127,127,0.04))); border:1px dashed var(--border-primary, var(--border-color, rgba(127,127,127,0.25))); border-radius:6px; padding:14px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px;";
            const emptyText = document.createElement("div");
            emptyText.style.cssText = "font-size:11px; color:var(--text-secondary, #64748b);";
            emptyText.textContent = "此文献尚未关联论文稿件管线";
            const btnRow = document.createElement("div");
            btnRow.style.cssText = "display:flex; gap:8px;";
            const createBtn = document.createElement("button");
            createBtn.style.cssText = "font-size:11px; padding:5px 12px; border-radius:5px; background:linear-gradient(135deg, #e11d48, #be123c); color:#fff; border:1px solid #be123c; font-weight:500;";
            createBtn.textContent = "➕ 新建稿件管线";
            const linkBtn = document.createElement("button");
            linkBtn.style.cssText = "font-size:11px; padding:5px 12px; border-radius:5px; background:var(--fill-secondary, rgba(127,127,127,0.1)); color:var(--text-primary, #334155); border:1px solid var(--border-primary, #cbd5e1); font-weight:500;";
            linkBtn.textContent = "🔗 关联现有稿件";
            if (isReadOnly) {
              createBtn.disabled = true;
              createBtn.style.opacity = "0.5";
              createBtn.style.cursor = "not-allowed";
              createBtn.title = "条目处于只读库或回收站，不可创建稿件管线";
              linkBtn.disabled = true;
              linkBtn.style.opacity = "0.5";
              linkBtn.style.cursor = "not-allowed";
              linkBtn.title = "条目处于只读库或回收站，不可关联稿件";
            } else {
              createBtn.style.cursor = "pointer";
              renderScope.on(createBtn, "click", () => {
                const serialized = host.serializeLiteratureItem?.(target);
                host.triggerResearchFlowOpen?.(document.defaultView, {
                  action: "create_manuscript_from_item",
                  item: serialized
                });
              });
              linkBtn.style.cursor = "pointer";
              renderScope.on(linkBtn, "click", () => {
                const serialized = host.serializeLiteratureItem?.(target);
                host.triggerResearchFlowOpen?.(document.defaultView, {
                  action: "link_item_to_manuscript",
                  item: serialized
                });
              });
            }
            btnRow.append(createBtn, linkBtn);
            emptyCard.append(emptyText, btnRow);
            wrap.appendChild(emptyCard);
          }
          body.appendChild(wrap);
        }
      });
      return sectionID;
    } catch (err) {
      if (typeof Zotero !== "undefined") Zotero.logError?.("[PaperFlow] registerItemPaneSection error: " + err);
      return null;
    }
  }
  var RFItemPaneSection = {
    registerItemPaneSection
  };
  if (typeof globalThis !== "undefined") {
    globalThis.RFItemPaneSection = RFItemPaneSection;
  }
  if (typeof window !== "undefined") {
    window.RFItemPaneSection = RFItemPaneSection;
  }
})();
