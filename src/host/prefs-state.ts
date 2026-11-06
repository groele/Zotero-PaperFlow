/**
 * Zotero PaperFlow - Host Runtime Preferences, UI State & Notification Observers
 */

import { ADDON_ID, CHROME_ROOT, PREF_PREFIX } from '../config.js';
import { getLiteratureItem } from '../modules/academic-citation.js';

declare var Zotero: any;
declare var Services: any;
declare var PathUtils: any;
declare var IOUtils: any;
declare var RFArchitectureGuard: any;

export const hostPrefsStateMethods = {
  ensureLocalization(this: any, doc: any) {
    if (!doc || this.localizedDocs.has(doc)) return;
    const existing = doc.querySelector('link[rel="localization"][href="researchflow.ftl"]');
    if (existing) return;
    try {
      doc.defaultView?.MozXULElement?.insertFTLIfNeeded('researchflow.ftl');
      if (doc.querySelector('link[rel="localization"][href="researchflow.ftl"]')) {
        this.localizedDocs.add(doc);
      }
    } catch (error: any) {
      Zotero.logError?.('[PaperFlow] Could not load translations: ' + error);
    }
  },

  getPref(this: any, key: string, defaultValue: any) {
    try {
      if (Zotero.Prefs) {
        const val = Zotero.Prefs.get(`${PREF_PREFIX}${key}`, true);
        return val !== undefined ? val : defaultValue;
      }
    } catch (_) {}
    return defaultValue;
  },

  setPref(this: any, key: string, value: any) {
    try {
      if (Zotero.Prefs) {
        Zotero.Prefs.set(`${PREF_PREFIX}${key}`, value, true);
      }
    } catch (_) {}
  },

  getDataFilePath(this: any) {
    return PathUtils.join(Zotero.DataDirectory.dir, 'researchflow-data.json');
  },

  getSyncedSettingsFromPrefs(this: any, existingSettings: any = {}) {
    const s: any = { ...(existingSettings || {}) };
    const get = (k: string, def: any) => this.getPref(k, def);
    s.windowMode = get('windowMode', 'tab');
    s.defaultView = get('defaultView', 'view-dashboard');
    s.language = get('language', 'en');
    s.theme = get('theme', 'system');
    s.subwindowAlwaysOnTop = Boolean(get('subwindowAlwaysOnTop', false));
    s.subwindowCompactMode = Boolean(get('subwindowCompactMode', true));
    s.enableItemPane = Boolean(get('enableItemPane', false));
    s.showContextMenu = Boolean(get('showContextMenu', false));
    s.enableReaderIntegration = Boolean(get('enableReaderIntegration', true));
    s.syncStatusTags = Boolean(get('syncStatusTags', false));
    s.locateOnManuscriptClick = Boolean(get('locateOnManuscriptClick', true));
    s.autoLinkSelectedPaper = Boolean(get('autoLinkSelectedPaper', true));
    s.showJournalPortals = Boolean(get('showJournalPortals', true));
    s.collapseEmptyKanbanStages = Boolean(get('collapseEmptyKanbanStages', false));
    s.defaultRebuttalExportFormat = get('defaultRebuttalExportFormat', 'latex');
    s.autoSync = Boolean(get('autoSync', true));
    s.autoBackupOnSave = Boolean(get('autoBackupOnSave', true));
    s.importMode = get('importMode', 'merge');
    s.autoSyncChildNotes = Boolean(get('autoSyncChildNotes', true));
    s.autoAddToPipelineCollection = Boolean(get('autoAddToPipelineCollection', true));
    s.enableAcceptanceCelebration = Boolean(get('enableAcceptanceCelebration', true));
    return s;
  },

  getBackupFilePath(this: any) {
    return PathUtils.join(Zotero.DataDirectory.dir, 'researchflow-pre-import-backup.json');
  },

  getUiStateFilePath(this: any) {
    return PathUtils.join(Zotero.DataDirectory.dir, 'researchflow-ui-state.json');
  },

  async loadUiState(this: any) {
    if (this._uiState) return this._uiState;
    const filePath = this.getUiStateFilePath();
    if (!await IOUtils.exists(filePath)) return (this._uiState = {});
    const parsed = JSON.parse(await IOUtils.readUTF8(filePath));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid ResearchFlow UI state');
    return (this._uiState = parsed);
  },

  async updateUiState(this: any, values: any = {}, removeKeys: string[] = []) {
    const operation = async () => {
      const current = await this.loadUiState();
      const next = { ...current, ...values };
      for (const key of removeKeys) delete next[key];
      const filePath = this.getUiStateFilePath();
      await IOUtils.writeUTF8(filePath, JSON.stringify(next), { tmpPath: `${filePath}.tmp` });
      this._uiState = next;
      return next;
    };
    const result = (this._uiStateQueue || Promise.resolve()).catch(() => {}).then(operation);
    this._uiStateQueue = result;
    return result;
  },

  registerDataListener(this: any, callback: Function) {
    if (typeof callback === 'function') {
      this._dataListeners.add(callback);
    }
  },

  unregisterDataListener(this: any, callback: Function) {
    this._dataListeners.delete(callback);
  },

  broadcastToClients(this: any, msg: any) {
    return this.broadcastToIframes(msg);
  },

  broadcastToIframes(this: any, msg: any) {
    try {
      const windows = Services.wm.getEnumerator(null);
      while (windows.hasMoreElements()) {
        const win = windows.getNext();
        const iframe = win.document?.getElementById('researchflow-tab-iframe');
        if (iframe?.contentWindow?.postMessage) {
          try { iframe.contentWindow.postMessage(msg, '*'); } catch (_) {}
        }
        if (win.name === 'ResearchFlow_Window' || win.name === 'ResearchFlow_SubWindow' || win.document?.title?.includes('ResearchFlow')) {
          if (typeof win.postMessage === 'function') {
            try { win.postMessage(msg, '*'); } catch (_) {}
          }
        }
      }
    } catch (_) {}
  },

  async syncStatusTagToItem(this: any, item: any, status: any) {
    if (typeof RFArchitectureGuard !== 'undefined' && RFArchitectureGuard.syncStatusTagToItem) {
      return RFArchitectureGuard.syncStatusTagToItem(this, item, status);
    }
    if (!this.getPref('syncStatusTags', false)) {
      return true;
    }
    const target = getLiteratureItem(item);
    if (!target || target.deleted || (typeof target.isEditable === 'function' && !target.isEditable())) {
      Zotero.logError?.('[PaperFlow] syncStatusTagToItem blocked: Item is read-only or in trash');
      return false;
    }
    return false;
  },

  async addItemToPipelineCollection(this: any, item: any) {
    if (!this.getPref('autoAddToPipelineCollection', true)) {
      return null;
    }
    const target = getLiteratureItem(item);
    if (!target) return null;
    if (target.deleted || (typeof target.isEditable === 'function' && !target.isEditable())) {
      Zotero.logError?.('[PaperFlow] addItemToPipelineCollection blocked: Item is read-only or in trash');
      return null;
    }
    const libraryID = target.libraryID || Zotero.Libraries?.userLibraryID || 1;
    const collectionName = '🚀 Zotero PaperFlow 论文管线';
    try {
      let collection = Zotero.Collections?.getByLibrary?.(libraryID)
        ?.find((c: any) => !c.deleted && (c.name === collectionName || c.name === '🚀 ResearchFlow 论文管线')) || null;
      if (!collection && Zotero.Collection) {
        collection = new Zotero.Collection();
        collection.libraryID = libraryID;
        collection.name = collectionName;
        await collection.saveTx();
      }
      if (collection) {
        if (typeof target.inCollection === 'function' && !target.inCollection(collection.id)) {
          target.addToCollection(collection.id);
          await target.saveTx();
        }
      }
      return collection;
    } catch (e) {
      Zotero.logError?.('[PaperFlow] addItemToPipelineCollection error: ' + e);
      return null;
    }
  },

  showToast(this: any, title: string, message: string, type: string = 'info', duration: number = 3500) {
    try {
      if (Zotero.ProgressWindow) {
        const pw = new Zotero.ProgressWindow({ closeOnClick: true });
        pw.changeHeadline(`Zotero PaperFlow · ${title}`);
        const icon = (type === 'success')
          ? 'chrome://zotero/skin/tick.png'
          : (type === 'error')
            ? 'chrome://zotero/skin/cross.png'
            : (type === 'warning')
              ? 'chrome://zotero/skin/warning.png'
              : `${CHROME_ROOT}icons/researchflow.svg`;
        const itemProgress = new pw.ItemProgress(icon, message);
        itemProgress.setProgress(100);
        pw.show();
        pw.startCloseTimer(duration);
      }
    } catch (_) {}
  },

  initNotifier(this: any) {
    if (!Zotero.Notifier?.registerObserver) return;
    try {
      this.notifierID = Zotero.Notifier.registerObserver({
        notify: async (event: any, type: string, ids: any) => {
          if (type === 'item') {
            if (event === 'modify' || event === 'trash' || event === 'delete' || event === 'add') {
              this.notifyDataChanged();
              this.broadcastToIframes({
                type: 'RESEARCHFLOW_ITEM_UPDATED',
                event,
                ids
              });
            }
          } else if (type === 'collection') {
            this.broadcastToIframes({
              type: 'RESEARCHFLOW_COLLECTION_UPDATED',
              event,
              ids
            });
          }
        }
      }, ['item', 'collection'], ADDON_ID);
    } catch (err: any) {
      Zotero.logError?.('[PaperFlow] Notifier registration failed: ' + err);
    }
  },

  destroyNotifier(this: any) {
    if (this.notifierID && Zotero.Notifier?.unregisterObserver) {
      try {
        Zotero.Notifier.unregisterObserver(this.notifierID);
      } catch (_) {}
      this.notifierID = null;
    }
  },

  initPrefObserver(this: any) {
    if (Zotero.Prefs?.registerObserver) {
      try {
        this._prefObserverSymbol = Symbol('ResearchFlowPrefObserver');
        Zotero.Prefs.registerObserver('extensions.researchflow.showContextMenu', () => {
          this.updateItemContextMenu();
        }, this._prefObserverSymbol);
        Zotero.Prefs.registerObserver('extensions.researchflow.enableItemPane', () => {
          this.updateItemPaneSection();
        }, this._prefObserverSymbol);
        Zotero.Prefs.registerObserver('extensions.researchflow.enableReaderIntegration', () => {
          this.updateReaderContextMenu();
        }, this._prefObserverSymbol);
        Zotero.Prefs.registerObserver('extensions.researchflow.', (pref: string) => {
          const prefix = 'extensions.researchflow.';
          const key = pref && pref.startsWith(prefix) ? pref.slice(prefix.length) : pref;
          if (key) {
            const val = this.getPref(key);
            if (this._cachedData) {
              if (!this._cachedData.settings) this._cachedData.settings = {};
              this._cachedData.settings[key] = val;
            }
            this.broadcastToIframes({
              type: 'RESEARCHFLOW_PREF_CHANGED',
              key,
              value: val
            });
          }
        }, this._prefObserverSymbol);
      } catch (_) {}
    }
  },

  destroyPrefObserver(this: any) {
    if (this._prefObserverSymbol && Zotero.Prefs?.unregisterObserver) {
      try {
        Zotero.Prefs.unregisterObserver(this._prefObserverSymbol);
      } catch (_) {}
      this._prefObserverSymbol = null;
    }
  }
};
