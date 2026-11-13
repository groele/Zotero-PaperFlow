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

  // src/modules/conflict-recovery.ts
  function initConflictRecovery() {
    if (typeof document === "undefined") return;
    const rootScope = createLifecycleScope();
    let listScope = rootScope.child();
    let editorScope = rootScope.child();
    let root, list, editor, status, refresh;
    let generation = 0, busy = false, inspection = null, preview = null, choices = {};
    const tr = (key) => typeof t === "function" ? t(key) : key;
    const element = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    };
    const localized = (tag, key, className) => {
      const node = element(tag, className, tr(key));
      node.dataset.recoveryI18n = key;
      return node;
    };
    function message(key, error = false, suffix = "") {
      status.dataset.error = String(error);
      status.dataset.key = key;
      status.dataset.suffix = suffix;
      status.textContent = tr(key) + suffix;
    }
    function translate() {
      if (!root) return;
      root.querySelectorAll("[data-recovery-i18n]").forEach((node) => {
        node.textContent = tr(node.dataset.recoveryI18n);
      });
      if (status.dataset.key) status.textContent = tr(status.dataset.key) + (status.dataset.suffix || "");
    }
    function pendingEdits() {
      return typeof db !== "undefined" && (Boolean(window.storage?.hasPendingEdits?.(db)) || Boolean(window.storage?.isSaving?.(db)) || typeof pendingSubmissionSaves !== "undefined" && pendingSubmissionSaves > 0 || ["pending", "saving", "invalid", "error"].includes(document.querySelector("[data-submission-autosave-status]")?.dataset?.state || ""));
    }
    function setBusy(value) {
      busy = value;
      root.setAttribute("aria-busy", String(value));
      root.querySelectorAll("button, input").forEach((node) => {
        node.disabled = value;
      });
      const next = root.querySelector("[data-recovery-preview]");
      if (next) next.disabled = value || !inspection || inspection.rows.some((row) => !choices[row.key]);
      const apply = root.querySelector("[data-recovery-apply]");
      if (apply) apply.disabled = value || !preview?.changes.length;
    }
    async function run(operation) {
      if (busy) return;
      const version = ++generation;
      setBusy(true);
      message("recoveryBusy");
      try {
        await operation(version);
      } catch (error) {
        if (version === generation) message("recoveryFailed", true, String(error.message || error));
      } finally {
        if (version === generation) setBusy(false);
      }
    }
    async function loadList(version) {
      const result = await ZoteroBridge.conflictRecovery("list");
      if (version !== generation || rootScope.aborted) return;
      listScope.abort();
      listScope = rootScope.child();
      list.replaceChildren();
      if (!result.entries.length) list.append(localized("p", "recoveryEmpty", "rf-recovery-help"));
      for (const item of result.entries) {
        const row = element("div", "rf-recovery-draft");
        const detail = element("div");
        detail.append(element("time", "", new Date(item.createdAt).toLocaleString()), element("code", "", item.id));
        row.append(detail);
        if (item.resolved) row.append(localized("span", "recoveryResolved", "rf-recovery-meta"));
        else {
          const open = localized("button", "recoveryOpen");
          open.type = "button";
          listScope.on(open, "click", () => inspect(item.id));
          row.append(open);
        }
        list.append(row);
      }
      if (result.truncated) list.append(localized("p", "recoveryListLimit", "rf-recovery-help"));
    }
    function valueNode(value) {
      const wrap = element("div");
      const pre = element("pre", "", value.exists ? value.text : tr("recoveryMissing"));
      if (!value.exists) pre.dataset.recoveryI18n = "recoveryMissing";
      pre.tabIndex = 0;
      wrap.append(pre);
      if (value.truncated) wrap.append(localized("p", "recoveryTruncated", "rf-recovery-help"));
      return wrap;
    }
    function compare() {
      editorScope.abort();
      editorScope = rootScope.child();
      preview = null;
      editor.replaceChildren();
      editor.append(
        localized("h4", "recoveryCompareTitle"),
        element("p", "rf-recovery-meta", tr("recoveryRevision") + inspection.revision),
        localized("p", "recoveryAutomatic", "rf-recovery-help")
      );
      if (!inspection.rows.length) editor.append(localized("p", "recoveryNoConflicts", "rf-recovery-help"));
      inspection.rows.forEach((row, index) => {
        const field = element("fieldset", "rf-recovery-row");
        field.append(element("legend", "", row.path));
        const columns = element("div", "rf-recovery-values");
        for (const [side, key] of [["base", "recoveryBase"], ["local", "recoveryLocal"], ["current", "recoveryCurrent"]]) {
          const label = element("label", "rf-recovery-value");
          const input = element("input");
          input.type = "radio";
          input.name = `rf-recovery-field-${index}`;
          input.value = side;
          input.checked = choices[row.key] === side;
          editorScope.on(input, "change", () => {
            choices[row.key] = side;
            preview = null;
            setBusy(false);
          });
          label.append(input, localized("span", key), valueNode(row[side]));
          columns.append(label);
        }
        field.append(columns);
        editor.append(field);
      });
      const actions = element("div", "rf-recovery-actions");
      const next = localized("button", "recoveryPreview");
      next.type = "button";
      next.dataset.recoveryPreview = "";
      editorScope.on(next, "click", () => run(async (version) => {
        const result = await ZoteroBridge.conflictRecovery("preview", { token: inspection.token, choices: { ...choices } });
        if (version !== generation) return;
        preview = result;
        showPreview();
        message(result.changes.length ? "recoveryPreviewTitle" : "recoveryNoChanges");
      }));
      actions.append(next);
      editor.append(actions);
      setBusy(busy);
    }
    function showPreview() {
      editorScope.abort();
      editorScope = rootScope.child();
      editor.replaceChildren(localized("h4", "recoveryPreviewTitle"));
      preview.changes.forEach((row) => {
        const field = element("fieldset", "rf-recovery-row");
        field.append(element("legend", "", row.path));
        const columns = element("div", "rf-recovery-values rf-recovery-pair");
        for (const [side, key] of [["before", "recoveryBefore"], ["after", "recoveryAfter"]]) {
          const value = element("div", "rf-recovery-value");
          value.append(localized("span", key), valueNode(row[side]));
          columns.append(value);
        }
        field.append(columns);
        editor.append(field);
      });
      const actions = element("div", "rf-recovery-actions");
      const back = localized("button", "recoveryBack");
      back.type = "button";
      editorScope.on(back, "click", () => {
        compare();
        message("recoveryCompareTitle");
      });
      const apply = localized("button", "recoveryApply");
      apply.type = "button";
      apply.dataset.recoveryApply = "";
      editorScope.on(apply, "click", () => {
        if (pendingEdits()) {
          message("recoveryPending", true);
          return;
        }
        run(async (version) => {
          const result = await ZoteroBridge.conflictRecovery("apply", { token: preview.token });
          if (version !== generation) return;
          inspection = null;
          preview = null;
          choices = {};
          editor.replaceChildren();
          if (typeof applyDatabaseUpdate === "function") applyDatabaseUpdate(result.data);
          message("recoverySuccess", false, result.backup + (result.warning ? tr("recoveryReceiptWarning") : ""));
          status.focus();
          try {
            await loadList(version);
          } catch (_) {
          }
        });
      });
      actions.append(back, apply);
      editor.append(actions);
      setBusy(busy);
      editor.querySelector("h4")?.focus();
    }
    function inspect(id) {
      run(async (version) => {
        inspection = null;
        preview = null;
        choices = {};
        editor.replaceChildren();
        const result = await ZoteroBridge.conflictRecovery("inspect", { id });
        if (version !== generation) return;
        inspection = result;
        choices = {};
        compare();
        message("recoveryCompareTitle");
        editor.querySelector("input, button")?.focus();
      });
    }
    function init() {
      const anchor = document.getElementById("settings-backup-card");
      if (!anchor || document.getElementById("paperflow-recovery")) return;
      root = element("section", "rf-recovery");
      root.id = "paperflow-recovery";
      root.setAttribute("aria-labelledby", "rf-recovery-title");
      const header = element("div", "rf-recovery-header");
      const title = localized("h3", "recoveryTitle");
      title.id = "rf-recovery-title";
      refresh = localized("button", "recoveryRefresh");
      refresh.type = "button";
      header.append(title, refresh);
      root.append(header, localized("p", "recoveryHelp", "rf-recovery-help"));
      status = element("div", "rf-recovery-status");
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.tabIndex = -1;
      list = element("div");
      editor = element("div", "rf-recovery-editor");
      root.append(status, list, editor);
      anchor.after(root);
      rootScope.on(refresh, "click", () => run(async (version) => {
        inspection = null;
        preview = null;
        choices = {};
        editor.replaceChildren();
        await loadList(version);
        status.textContent = "";
        delete status.dataset.key;
        if (location.hash === "#paperflow-recovery") root.scrollIntoView({ block: "start" });
      }));
      if (!ZoteroBridge?.isZotero) {
        refresh.disabled = true;
        message("recoveryUnavailable");
        return;
      }
      refresh.click();
      rootScope.on(window, "message", (event) => {
        if (event.data?.type !== "RESEARCHFLOW_DATA_UPDATED" || busy || !inspection) return;
        inspection = null;
        preview = null;
        choices = {};
        editor.replaceChildren();
        message("recoveryInvalidated", true);
      });
      rootScope.on(window, "unload", () => {
        generation++;
        inspection = null;
        preview = null;
        rootScope.abort();
      }, { once: true });
    }
    window.PaperFlowRecovery = { translate };
    if (document.readyState === "loading") rootScope.on(document, "DOMContentLoaded", init, { once: true });
    else init();
  }
  var RFConflictRecovery = {
    initConflictRecovery
  };
  if (typeof document !== "undefined") {
    initConflictRecovery();
  }
  if (typeof globalThis !== "undefined") {
    globalThis.RFConflictRecovery = RFConflictRecovery;
  }
})();
