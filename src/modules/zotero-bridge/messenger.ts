/**
 * Zotero PaperFlow - Bridge Messenger and Environment Detection
 */

export const bridgeMessengerMethods = {
  detectEnvironment(this: any): void {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search || '');
        const mode = params.get('mode');
        if (mode === 'subwindow' || window.arguments?.[0]?.options?.currentWindowType === 'subwindow') {
          if (typeof document !== 'undefined') {
            document.documentElement.classList.add('subwindow-mode');
            document.body?.classList?.add('subwindow-mode');
            if (this.getPref('subwindowCompactMode', true)) {
              document.documentElement.classList.add('compact-mode');
              document.body?.classList?.add('compact-mode');
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
        if (window.location?.protocol === 'chrome:' && window.location.hostname === 'researchflow'
          && (typeof Cc !== 'undefined' || typeof Components !== 'undefined')) {
          try {
            const host = (typeof Cc !== 'undefined' ? Cc['@zotero.org/Zotero;1'] : (Components as any)?.classes?.['@zotero.org/Zotero;1'])
              .getService(typeof Ci !== 'undefined' ? Ci.nsISupports : (Components as any)?.interfaces?.nsISupports).wrappedJSObject;
            if (host?.ResearchFlow) {
              window.Zotero = host;
              this.isZotero = true;
              return;
            }
          } catch (_) { /* Embedded documents can still use their parent host. */ }
        }
        if (window.parent && window.parent !== window && window.parent.Zotero) {
          window.Zotero = window.parent.Zotero;
          this.isZotero = true;
          return;
        }
        if (window.location && (window.location.protocol === 'chrome:' || window.parent !== window)) {
          this.isZotero = true;
          return;
        }
      }
    } catch (_) {}
    this.isZotero = false;
  },

  setupMessageListener(this: any): void {
    if (typeof window === 'undefined') return;
    const onMessage = (event: any) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.requestId && this._requestCallbacks.has(data.requestId)) {
        const cb = this._requestCallbacks.get(data.requestId);
        this._requestCallbacks.delete(data.requestId);
        if (cb) cb(data);
        return;
      }

      if (data.type === 'RESEARCHFLOW_INIT_DATA') {
        if (data.data && typeof window.storage !== 'undefined') {
          window.storage.cache = data.data;
        }
        if (data.pending) {
          this.handleHostNavigation(data.pending);
        }
      }

      if (data.type === 'RESEARCHFLOW_NAVIGATE') {
        this.handleHostNavigation(data.options);
      }

      if (data.type === 'RESEARCHFLOW_DATA_UPDATED' && data.data) {
        if (typeof (window as any).applyDatabaseUpdate === 'function') {
          (window as any).applyDatabaseUpdate(data.data);
        } else {
          if (typeof window.storage !== 'undefined') {
            window.storage.cache = data.data;
          }
          if (typeof (window as any).renderDashboard === 'function' && document.getElementById('view-dashboard')?.classList.contains('active')) {
            (window as any).renderDashboard();
          } else if (typeof (window as any).renderKanban === 'function' && document.getElementById('view-manuscripts')?.classList.contains('active')) {
            (window as any).renderKanban();
          } else if (typeof (window as any).renderSubmissions === 'function' && document.getElementById('view-submissions')?.classList.contains('active')) {
            (window as any).renderSubmissions();
          }
        }
      }

      if (data.type === 'RESEARCHFLOW_PREF_CHANGED' && data.key) {
        const targetDb = window.db || (typeof (globalThis as any).db !== 'undefined' ? (globalThis as any).db : null);
        if (targetDb) {
          if (!targetDb.settings) targetDb.settings = {};
          targetDb.settings[data.key] = data.value;
        }
        if (data.key === 'showJournalPortals' && typeof (window as any).renderJournalPortals === 'function') {
          try { (window as any).renderJournalPortals(); } catch (_) {}
        }
        if (data.key === 'collapseEmptyKanbanStages' && typeof (window as any).renderKanban === 'function') {
          try { (window as any).renderKanban(); } catch (_) {}
        }
        if (data.key === 'subwindowCompactMode' && typeof document !== 'undefined') {
          const isCompact = Boolean(data.value);
          document.documentElement.classList.toggle('compact-mode', isCompact);
          document.body?.classList?.toggle('compact-mode', isCompact);
        }
      }

      if (data.type === 'RESEARCHFLOW_COLLECTION_UPDATED') {
        if (typeof (window as any).refreshZoteroCollectionFilter === 'function') {
          (window as any).refreshZoteroCollectionFilter();
        }
      }

      if (data.type === 'RESEARCHFLOW_ITEM_UPDATED') {
        if (typeof window.storage !== 'undefined' && typeof window.storage.getAll === 'function') {
          window.storage.getAll().then((freshDb: any) => {
            if (freshDb && typeof (window as any).applyDatabaseUpdate === 'function') {
              (window as any).applyDatabaseUpdate(freshDb);
            }
          }).catch(console.error);
        } else {
          if (typeof (window as any).renderDashboard === 'function' && document.getElementById('view-dashboard')?.classList.contains('active')) {
            (window as any).renderDashboard();
          } else if (typeof (window as any).renderKanban === 'function' && document.getElementById('view-manuscripts')?.classList.contains('active')) {
            (window as any).renderKanban();
          } else if (typeof (window as any).renderSubmissions === 'function' && document.getElementById('view-submissions')?.classList.contains('active')) {
            (window as any).renderSubmissions();
          }
        }
      }
    };
    if (this._lifecycleScope) {
      this._lifecycleScope.on(window, 'message', onMessage);
    } else {
      window.addEventListener('message', onMessage);
    }
  },

  sendToHost(this: any, msg: any): void {
    if (!this.isZotero || typeof window === 'undefined') return;
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, '*');
        return;
      }
      if (window.opener) {
        window.opener.postMessage(msg, '*');
        return;
      }
    } catch (_) {}
  },

  request(this: any, type: string, payload: any = {}, timeoutMs: number = 6000): Promise<any> {
    if (!this.isZotero || this._lifecycleScope?.aborted) return Promise.resolve(null);
    const requestId = `rf_req_${++this._pendingRequestId}_${Date.now()}`;
    return new Promise((resolve) => {
      let settled = false;
      let timeout: any = null;
      let detachAbort: (() => void) | null = null;
      const finish = (val: any) => {
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

      this._requestCallbacks.set(requestId, (data: any) => finish(data));

      this.sendToHost({ type, requestId, ...payload });
    });
  },

  initDirectPrefObserver(this: any): void {
    try {
      if (typeof window === 'undefined') return;
      const zotero = window.Zotero || (window.parent !== window ? window.parent?.Zotero : null);
      if (zotero?.Prefs?.registerObserver && !this._directPrefObserverSymbol) {
        this._directPrefObserverSymbol = Symbol('ResearchFlowWorkbenchPrefObserver');
        zotero.Prefs.registerObserver('extensions.researchflow.', (pref: string) => {
          const prefix = 'extensions.researchflow.';
          const key = pref && pref.startsWith(prefix) ? pref.slice(prefix.length) : pref;
          if (key) {
            const val = this.getPref(key);
            const targetDb = window.db || (typeof (globalThis as any).db !== 'undefined' ? (globalThis as any).db : null);
            if (targetDb) {
              if (!targetDb.settings) targetDb.settings = {};
              targetDb.settings[key] = val;
            }
            if (key === 'showJournalPortals' && typeof (window as any).renderJournalPortals === 'function') {
              try { (window as any).renderJournalPortals(); } catch (_) {}
            }
            if (key === 'collapseEmptyKanbanStages' && typeof (window as any).renderKanban === 'function') {
              try { (window as any).renderKanban(); } catch (_) {}
            }
            if (key === 'subwindowCompactMode' && typeof document !== 'undefined') {
              const isCompact = Boolean(val);
              document.documentElement.classList.toggle('compact-mode', isCompact);
              document.body?.classList?.toggle('compact-mode', isCompact);
            }
          }
        }, this._directPrefObserverSymbol);

        window.addEventListener('unload', () => {
          try {
            if (this._directPrefObserverSymbol && zotero.Prefs?.unregisterObserver) {
              zotero.Prefs.unregisterObserver(this._directPrefObserverSymbol);
              this._directPrefObserverSymbol = null;
            }
          } catch (_) {}
        }, { once: true });
      }
    } catch (_) {}
  },

  getPref(this: any, key: string, defaultValue: any): any {
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
      if (typeof zotero?.ResearchFlow?.getPref === 'function') {
        return zotero.ResearchFlow.getPref(key, defaultValue);
      }
      if (typeof zotero?.Prefs?.get === 'function') {
        const val = zotero.Prefs.get(`extensions.researchflow.${key}`, true);
        if (val !== undefined) return val;
      }
    } catch (_) {}
    const currentDb = typeof window !== 'undefined' ? (window.db || (typeof (globalThis as any).db !== 'undefined' ? (globalThis as any).db : null)) : null;
    if (currentDb?.settings && key in currentDb.settings) {
      return currentDb.settings[key];
    }
    return defaultValue;
  },

  async conflictRecovery(this: any, action: string, payload: any = {}): Promise<any> {
    if (!['list', 'inspect', 'preview', 'apply'].includes(action)) throw new Error('Invalid recovery action');
    const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
    if (typeof zotero?.ResearchFlow?.databaseConflictRecovery === 'function') {
      return zotero.ResearchFlow.databaseConflictRecovery(action, payload);
    }
    if (!this.isZotero) throw new Error('Conflict recovery requires Zotero');
    const response = await this.request('RESEARCHFLOW_CONFLICT_RECOVERY', { action, payload }, action === 'apply' ? 0 : 30000);
    if (!response?.success) throw new Error(response?.error || 'Conflict recovery request failed');
    return response.data;
  }
};
