// ResearchFlow Zotero Bridge - Facilitates communication between ResearchFlow UI and Zotero host

function resolveZoteroItem(zotero, itemKey, libraryID = null) {
  if (!zotero || !itemKey) return null;
  const key = String(itemKey).trim();
  if (!key) return null;

  if (typeof zotero.ResearchFlow?.findItemByKey === 'function') {
    try {
      const it = zotero.ResearchFlow.findItemByKey(key, libraryID);
      if (it) return it;
    } catch (_) {}
  }

  if (!zotero.Items?.getByLibraryAndKey) return null;

  if (libraryID !== null && libraryID !== undefined) {
    try {
      const it = zotero.Items.getByLibraryAndKey(libraryID, key);
      if (it) return it;
    } catch (_) {}
  }

  const userLibID = zotero.Libraries?.userLibraryID || 1;
  try {
    const it = zotero.Items.getByLibraryAndKey(userLibID, key);
    if (it) return it;
  } catch (_) {}

  try {
    const allLibs = typeof zotero.Libraries?.getAll === 'function' ? zotero.Libraries.getAll() : [];
    for (const lib of allLibs) {
      const libId = lib?.libraryID || lib?.id;
      if (libId && libId !== userLibID) {
        const it = zotero.Items.getByLibraryAndKey(libId, key);
        if (it) return it;
      }
    }
  } catch (_) {}

  return null;
}

const ZoteroBridge = {
  isZotero: false,
  resolveZoteroItem,
  _pendingRequestId: 0,
  _requestCallbacks: new Map(),
  _pendingNavigation: null,

  async conflictRecovery(action, payload = {}) {
    if (!['list', 'inspect', 'preview', 'apply'].includes(action)) throw new Error('Invalid recovery action');
    const zotero = window.Zotero || window.parent?.Zotero;
    if (typeof zotero?.ResearchFlow?.databaseConflictRecovery === 'function') {
      // A failed write must never be retried through a second transport.
      return zotero.ResearchFlow.databaseConflictRecovery(action, payload);
    }
    if (!this.isZotero) throw new Error('Conflict recovery requires Zotero');
    const response = await this.request('RESEARCHFLOW_CONFLICT_RECOVERY', { action, payload }, action === 'apply' ? 0 : 30000);
    if (!response?.success) throw new Error(response?.error || 'Conflict recovery request failed');
    return response.data;
  },

  init() {
    this.detectEnvironment();
    this.setupMessageListener();
    window.addEventListener('researchflow-workspace-ready', () => {
      if (this._pendingNavigation) {
        const options = this._pendingNavigation;
        this._pendingNavigation = null;
        this.handleHostNavigation(options);
      }
    });

    if (this.isZotero) {
      document.documentElement.classList.add('zotero-env');
      document.body?.classList?.add('zotero-env');
      this.sendToHost({ type: 'RESEARCHFLOW_READY' });
      console.log('[ResearchFlow] Running in Zotero environment');

      if (typeof document !== 'undefined') {
        document.addEventListener('click', (e) => {
          const link = e.target?.closest?.('a[href^="http"]');
          if (link && !link.dataset.internal) {
            e.preventDefault();
            this.openExternal(link.href);
          }
        });
      }
    }

    // Process initial options from window.arguments or window._researchflowPending
    const initialOptions = window.arguments?.[0]?.options || window._researchflowPending;
    if (initialOptions) {
      this.handleHostNavigation(initialOptions);
    }
  },

  detectEnvironment() {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search || '');
        const mode = params.get('mode');
        if (mode === 'subwindow' || window.arguments?.[0]?.options?.currentWindowType === 'subwindow') {
          document.documentElement.classList.add('subwindow-mode');
          document.body?.classList?.add('subwindow-mode');
          if (this.getPref('subwindowCompactMode', true)) {
            document.documentElement.classList.add('compact-mode');
            document.body?.classList?.add('compact-mode');
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
        // WindowWatcher does not expose plain JS arguments in every Gecko window.
        // Resolve the existing host service only in our privileged chrome document.
        if (window.location?.protocol === 'chrome:' && window.location.hostname === 'researchflow'
          && typeof Components !== 'undefined' && Components.classes) {
          try {
            const host = Components.classes['@zotero.org/Zotero;1']
              .getService(Components.interfaces.nsISupports).wrappedJSObject;
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
        // In iframe under chrome://researchflow/
        if (window.location && (window.location.protocol === 'chrome:' || window.parent !== window)) {
          this.isZotero = true;
          return;
        }
      }
    } catch (_) {}
    this.isZotero = false;
  },

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // Handle async request callbacks
      if (data.requestId && this._requestCallbacks.has(data.requestId)) {
        const cb = this._requestCallbacks.get(data.requestId);
        this._requestCallbacks.delete(data.requestId);
        cb(data);
        return;
      }

      // Handle initial data handshake
      if (data.type === 'RESEARCHFLOW_INIT_DATA') {
        if (data.data && typeof window.storage !== 'undefined') {
          window.storage.cache = data.data;
        }
        if (data.pending) {
          this.handleHostNavigation(data.pending);
        }
      }

      // Handle direct navigation request from host
      if (data.type === 'RESEARCHFLOW_NAVIGATE') {
        this.handleHostNavigation(data.options);
      }

      // Handle data updated notification from host
      if (data.type === 'RESEARCHFLOW_DATA_UPDATED' && data.data) {
        if (typeof window.applyDatabaseUpdate === 'function') {
          window.applyDatabaseUpdate(data.data);
        } else {
          if (typeof window.storage !== 'undefined') {
            window.storage.cache = data.data;
          }
          if (typeof window.renderDashboard === 'function' && document.getElementById('view-dashboard')?.classList.contains('active')) {
            window.renderDashboard();
          } else if (typeof window.renderKanban === 'function' && document.getElementById('view-manuscripts')?.classList.contains('active')) {
            window.renderKanban();
          } else if (typeof window.renderSubmissions === 'function' && document.getElementById('view-submissions')?.classList.contains('active')) {
            window.renderSubmissions();
          }
        }
      }

      // Handle preference changed notification from host
      if (data.type === 'RESEARCHFLOW_PREF_CHANGED' && data.key) {
        if (window.db) {
          if (!window.db.settings) window.db.settings = {};
          window.db.settings[data.key] = data.value;
        }
        if (data.key === 'showJournalPortals' && typeof renderJournalPortals === 'function') {
          try { renderJournalPortals(); } catch (_) {}
        }
        if (data.key === 'collapseEmptyKanbanStages' && typeof renderKanban === 'function') {
          try { renderKanban(); } catch (_) {}
        }
      }

      // Handle collection updated notification from host
      if (data.type === 'RESEARCHFLOW_COLLECTION_UPDATED') {
        if (typeof window.refreshZoteroCollectionFilter === 'function') {
          window.refreshZoteroCollectionFilter();
        }
      }

      // Handle item updated notification from host
      if (data.type === 'RESEARCHFLOW_ITEM_UPDATED') {
        if (typeof window.storage !== 'undefined' && typeof window.storage.getAll === 'function') {
          window.storage.getAll().then((freshDb) => {
            if (freshDb && typeof window.applyDatabaseUpdate === 'function') {
              window.applyDatabaseUpdate(freshDb);
            }
          }).catch(console.error);
        } else {
          if (typeof window.renderDashboard === 'function' && document.getElementById('view-dashboard')?.classList.contains('active')) {
            window.renderDashboard();
          } else if (typeof window.renderKanban === 'function' && document.getElementById('view-manuscripts')?.classList.contains('active')) {
            window.renderKanban();
          } else if (typeof window.renderSubmissions === 'function' && document.getElementById('view-submissions')?.classList.contains('active')) {
            window.renderSubmissions();
          }
        }
      }
    });
  },

  sendToHost(msg) {
    if (!this.isZotero) return;
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

  request(type, payload = {}, timeoutMs = 6000) {
    if (!this.isZotero) return Promise.resolve(null);
    const requestId = `rf_req_${++this._pendingRequestId}_${Date.now()}`;
    return new Promise((resolve) => {
      const timeout = timeoutMs > 0 ? setTimeout(() => {
        this._requestCallbacks.delete(requestId);
        resolve(null);
      }, timeoutMs) : null;

      this._requestCallbacks.set(requestId, (data) => {
        if (timeout !== null) clearTimeout(timeout);
        resolve(data);
      });

      this.sendToHost({ type, requestId, ...payload });
    });
  },

  getPref(key, defaultValue) {
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (typeof zotero?.ResearchFlow?.getPref === 'function') {
        return zotero.ResearchFlow.getPref(key, defaultValue);
      }
    } catch (_) {}
    if (window.db?.settings && key in window.db.settings) {
      return window.db.settings[key];
    }
    return defaultValue;
  },

  async getActiveItem() {
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.getCurrentActiveItem) {
        const item = zotero.ResearchFlow.getCurrentActiveItem();
        if (item) {
          return zotero.ResearchFlow.serializeLiteratureItem?.(item) || item;
        }
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_GET_ACTIVE_ITEM');
    return res?.item || null;
  },

  openPdf(itemKey, page = null, libraryID = null) {
    if (!itemKey) return;
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero) {
        const item = resolveZoteroItem(zotero, itemKey, libraryID);
        if (item && zotero.ResearchFlow?.openPdfAttachment) {
          zotero.ResearchFlow.openPdfAttachment(item, page);
          return;
        }
      }
    } catch (_) {}
    this.sendToHost({ type: 'RESEARCHFLOW_OPEN_PDF', itemKey, page, libraryID });
  },

  async syncNote(itemKey, libraryID = null) {
    if (!itemKey) return false;
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero) {
        const item = resolveZoteroItem(zotero, itemKey, libraryID);
        if (item) {
          if (item.deleted || (typeof item.isEditable === 'function' && !item.isEditable())) {
            return false;
          }
          if (zotero.ResearchFlow?.syncManuscriptToChildNote) {
            const note = await zotero.ResearchFlow.syncManuscriptToChildNote(item);
            return Boolean(note);
          }
        }
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_SYNC_NOTE', { itemKey, libraryID });
    return Boolean(res?.success);
  },

  async getCollections(libraryID = null) {
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.getZoteroCollections) {
        return zotero.ResearchFlow.getZoteroCollections(libraryID);
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_GET_COLLECTIONS', { libraryID });
    return res?.collections || [];
  },

  async searchLibrary(query, limit = 15) {
    if (!query) return [];
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.searchLibrary) {
        return await zotero.ResearchFlow.searchLibrary(query, limit);
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_SEARCH_LIBRARY', { query, limit });
    return res?.results || [];
  },

  showNativeToast(title, message, type = 'info') {
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.showToast) {
        zotero.ResearchFlow.showToast(title, message, type);
        return;
      }
    } catch (_) {}
    this.sendToHost({ type: 'RESEARCHFLOW_SHOW_TOAST', title, message, toastType: type });
  },

  async getAnnotations(itemKey, libraryID = null) {
    if (!itemKey) return [];
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.getLiteratureAnnotations) {
        const item = resolveZoteroItem(zotero, itemKey, libraryID);
        if (item) {
          return zotero.ResearchFlow.getLiteratureAnnotations(item);
        }
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_GET_ANNOTATIONS', { itemKey, libraryID });
    return res?.annotations || [];
  },

  async getReadingAssets(itemKey, libraryID = null) {
    if (!itemKey) return { annotations: [], notes: [], collections: [], tags: [], relatedItems: [] };
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.getLiteratureReadingAssets) {
        const item = resolveZoteroItem(zotero, itemKey, libraryID);
        if (item) {
          return zotero.ResearchFlow.getLiteratureReadingAssets(item);
        }
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_GET_READING_ASSETS', { itemKey, libraryID });
    return res?.assets || { annotations: [], notes: [], collections: [], tags: [], relatedItems: [] };
  },

  async getNotes(itemKey, libraryID = null) {
    if (!itemKey) return [];
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.getLiteratureNotes) {
        const item = resolveZoteroItem(zotero, itemKey, libraryID);
        if (item) {
          return zotero.ResearchFlow.getLiteratureNotes(item);
        }
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_GET_NOTES', { itemKey, libraryID });
    return res?.notes || [];
  },

  async syncStatusTag(itemKey, status, libraryID = null) {
    if (!itemKey || !status) return false;
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.syncStatusTagToItem) {
        const item = resolveZoteroItem(zotero, itemKey, libraryID);
        if (item) {
          if (item.deleted || (typeof item.isEditable === 'function' && !item.isEditable())) {
            return false;
          }
          return await zotero.ResearchFlow.syncStatusTagToItem(item, status);
        }
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_SYNC_STATUS_TAG', { itemKey, status, libraryID });
    return Boolean(res?.success);
  },

  async addToPipelineCollection(itemKey, libraryID = null) {
    if (!itemKey) return false;
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.addItemToPipelineCollection) {
        const item = resolveZoteroItem(zotero, itemKey, libraryID);
        if (item) {
          if (item.deleted || (typeof item.isEditable === 'function' && !item.isEditable())) {
            return false;
          }
          const col = await zotero.ResearchFlow.addItemToPipelineCollection(item);
          return Boolean(col);
        }
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_ADD_TO_PIPELINE_COLLECTION', { itemKey, libraryID });
    return Boolean(res?.success);
  },

  async saveShareImage(blob, fileName, language = 'en') {
    try {
      const pngBytes = new Uint8Array(await blob.arrayBuffer());
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.saveShareImageFile) {
        return await zotero.ResearchFlow.saveShareImageFile(pngBytes, fileName, language);
      }
      // A native Save As dialog must stay pending until the user responds.
      return await this.request('RESEARCHFLOW_SAVE_SHARE_IMAGE', { pngBytes, fileName, language }, 0);
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  },

  async exportDatabase() {
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.exportDatabaseFile) {
        return await zotero.ResearchFlow.exportDatabaseFile();
      }
    } catch (error) { return { success: false, error: String(error?.message || error) }; }
    return await this.request('RESEARCHFLOW_EXPORT_DB');
  },

  async importDatabase(mode = 'merge') {
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.importDatabaseFile) {
        return await zotero.ResearchFlow.importDatabaseFile(mode);
      }
    } catch (error) { return { success: false, error: String(error?.message || error) }; }
    return await this.request('RESEARCHFLOW_IMPORT_DB', { mode });
  },

  async exportDiagnostics(report) {
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.exportDiagnosticsFile) {
        return await zotero.ResearchFlow.exportDiagnosticsFile(report);
      }
    } catch (error) { return { success: false, error: String(error?.message || error) }; }
    return await this.request('RESEARCHFLOW_EXPORT_DIAGNOSTICS', { report });
  },

  async restoreBackup() {
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (zotero?.ResearchFlow?.restoreBackupDatabase) {
        const restored = await zotero.ResearchFlow.restoreBackupDatabase();
        return { success: true, data: restored };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
    return await this.request('RESEARCHFLOW_RESTORE_BACKUP');
  },

  async copyText(text, successToast = '已复制到剪贴板') {
    if (!text) return false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        if (typeof window.showGlobalToast === 'function' && successToast) {
          window.showGlobalToast(successToast, 'success');
        }
        return true;
      }
    } catch (_) {}
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      if (typeof window.showGlobalToast === 'function' && successToast) {
        window.showGlobalToast(successToast, 'success');
      }
      return true;
    } catch (e) {
      console.warn('[ZoteroBridge] copyText failed:', e);
      return false;
    }
  },

  handleHostNavigation(options) {
    if (!options || typeof options !== 'object') return;
    if (!window._researchflowWorkspaceReady) {
      this._pendingNavigation = options;
      return;
    }

    // View switching
    if (options.view) {
      const navBtn = document.querySelector(`.nav-item[data-view="${options.view}"]`);
      if (navBtn) {
        navBtn.click();
      }
    }

    // Action handling
    if (options.action === 'create_manuscript_from_item' && options.item) {
      const item = options.item;
      const kanbanBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
      if (kanbanBtn) kanbanBtn.click();

      setTimeout(() => {
        if (typeof window.openManuscriptModal === 'function') {
          window.openManuscriptModal(null, {
            title: item.title || '',
            publication: item.publication || '',
            abstract: item.abstract || '',
            authors: item.authors || '',
            doi: item.doi || '',
            articleUrl: item.url || '',
            zoteroItemKey: item.key || '',
            zoteroUri: item.zoteroUri || '',
            pdfUri: item.pdfUri || '',
            citekey: item.citekey || '',
            bibtex: item.bibtex || '',
            citationApa: item.citationApa || '',
            relatedItems: item.relatedItems || [],
            collections: item.collections || [],
            tags: item.tags || [],
            status: 'idea'
          });
          if (typeof window.showGlobalToast === 'function') {
            window.showGlobalToast(`已从 Zotero 文献《${(item.title || '').slice(0, 18)}…》导入元数据`, 'success');
          }
        }
      }, 200);
    } else if (options.action === 'link_item_to_manuscript' && options.item) {
      const item = options.item;
      const kanbanBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
      if (kanbanBtn) kanbanBtn.click();

      setTimeout(() => {
        if (typeof window.showLinkManuscriptModal === 'function') {
          window.showLinkManuscriptModal(item);
        }
      }, 200);
    } else if (options.action === 'reader_excerpt') {
      const kanbanBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
      if (kanbanBtn) kanbanBtn.click();

      setTimeout(() => {
        if (typeof window.openManuscriptModal === 'function') {
          const excerptText = options.excerpt
            ? `【PDF 第 ${options.page || 1} 页原文摘录】\n${options.excerpt}\n\n[📖 在 Zotero 阅读器中查看原文](${options.pdfLink || ''})`
            : (options.item?.abstract || '');
          window.openManuscriptModal(null, {
            title: options.item?.title ? `研读笔记：${options.item.title}` : 'PDF 摘录笔记',
            publication: options.item?.publication || '',
            abstract: excerptText,
            authors: options.item?.authors || '',
            doi: options.item?.doi || '',
            articleUrl: options.pdfLink || options.item?.url || '',
            zoteroItemKey: options.item?.key || '',
            zoteroUri: options.item?.zoteroUri || '',
            pdfUri: options.pdfLink || options.item?.pdfUri || '',
            citekey: options.item?.citekey || '',
            bibtex: options.item?.bibtex || '',
            citationApa: options.item?.citationApa || '',
            relatedItems: options.item?.relatedItems || [],
            status: 'idea'
          });
          if (typeof window.showGlobalToast === 'function') {
            window.showGlobalToast(`已从 PDF 第 ${options.page || 1} 页载入摘录内容与文献关联`, 'success');
          }
        }
      }, 200);
    } else if (options.action === 'create_from_collection') {
      const kanbanBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
      if (kanbanBtn) kanbanBtn.click();

      setTimeout(() => {
        if (typeof window.openManuscriptModal === 'function') {
          const colItems = options.items || [];
          const summary = colItems.slice(0, 5).map((it, idx) => `${idx + 1}. ${it.title} (${it.authors || ''} ${it.year || ''})`.trim()).join('\n');
          window.openManuscriptModal(null, {
            title: `${options.collectionName || '文献分类'} 论文写作管线`,
            publication: '',
            abstract: `基于 Zotero 分类【${options.collectionName || '文献分类'}】创建。\n共包含文献 ${colItems.length} 篇：\n${summary}${colItems.length > 5 ? '\n…' : ''}`,
            authors: '',
            doi: '',
            zoteroItemKey: colItems[0]?.key || '',
            zoteroUri: colItems[0]?.zoteroUri || '',
            pdfUri: colItems[0]?.pdfUri || '',
            status: 'idea'
          });
          if (typeof window.showGlobalToast === 'function') {
            window.showGlobalToast(`已基于分类【${options.collectionName || ''}】初始化论文稿件管线`, 'success');
          }
        }
      }, 200);
    } else if (options.manuscriptId) {
      const kanbanBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]');
      if (kanbanBtn) kanbanBtn.click();
      setTimeout(() => {
        const card = document.querySelector(`[data-manuscript-id="${options.manuscriptId}"]`) ||
          document.querySelector(`[data-id="${options.manuscriptId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('highlight-pulse');
          setTimeout(() => card.classList.remove('highlight-pulse'), 2500);
        }
      }, 300);
    }
  },

  selectItemInZotero(itemKey, libraryID = null) {
    if (!itemKey) return;
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
    } catch (_) {}
    this.sendToHost({ type: 'RESEARCHFLOW_SELECT_ITEM', itemKey, libraryID });
  },

  openExternal(url) {
    if (!url) return;
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (typeof zotero?.launchURL === 'function') {
        zotero.launchURL(url);
        return;
      }
    } catch (_) {}
    this.sendToHost({ type: 'RESEARCHFLOW_OPEN_EXTERNAL', url });
    try {
      if (typeof window !== 'undefined' && window.open) {
        window.open(url, '_blank');
      }
    } catch (_) {}
  }
};

// Initialize bridge
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ZoteroBridge.init());
  } else {
    ZoteroBridge.init();
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.ZoteroBridge = ZoteroBridge;
}
