/**
 * Zotero PaperFlow - Host Iframe Message Handler
 */
import {
  findItemByKey,
  serializeLiteratureItem,
  getLiteratureAnnotations,
  getLiteratureReadingAssets,
  getLiteratureNotes
} from '../modules/academic-citation.js';

declare var Zotero: any;
declare var Services: any;
declare var Cc: any;
declare var Ci: any;

export function createHostMessageHandler(host: any, window: any) {
  return function handleHostMessage(event: any) {
    try {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (typeof data.type !== 'string' || !data.type.startsWith('RESEARCHFLOW_')) return;

      const sourceWin = event.source;
      const iframe = window.document.getElementById('researchflow-tab-iframe');

      const replyResult = (msgObj: any) => {
        try {
          if (sourceWin && typeof sourceWin.postMessage === 'function') {
            sourceWin.postMessage(msgObj, '*');
          } else if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(msgObj, '*');
          }
        } catch (_) {}
      };

      // A. Ready Handshake
      if (data.type === 'RESEARCHFLOW_CONFLICT_RECOVERY') {
        const knownFrame = iframe?.contentWindow;
        let trusted = Boolean(knownFrame && (!sourceWin || sourceWin === knownFrame));
        try {
          const url = new URL(sourceWin?.location?.href);
          trusted ||= url.protocol === 'chrome:' && url.hostname === 'researchflow'
            && ['/content/index.html', '/content/pages/options.html'].includes(url.pathname);
        } catch (_) {}
        if (!trusted) return;
        host.databaseConflictRecovery(data.action, data.payload).then((result: any) => {
          replyResult({ requestId: data.requestId, success: true, data: result });
        }).catch((error: any) => replyResult({ requestId: data.requestId, success: false, error: String(error?.message || error) }));
        return;
      }
      if (data.type === 'RESEARCHFLOW_READY') {
        host.loadDatabase().then((storedData: any) => {
          replyResult({
            type: 'RESEARCHFLOW_INIT_DATA',
            data: storedData,
            pending: iframe?._researchflowPending || null
          });
          if (iframe) iframe._researchflowPending = null;
        });
        return;
      }

      // B. Storage Save Request
      if (data.type === 'RESEARCHFLOW_STORAGE_SET' && data.payload) {
        host.saveDatabase(data.payload, { expectedRevision: data.expectedRevision, replace: data.replace }).then((saved: any) => {
          if (data.requestId) {
            replyResult({ requestId: data.requestId, success: true, data: saved });
          }
        }).catch((error: any) => {
          if (data.requestId) replyResult({ requestId: data.requestId, success: false, error: String(error?.message || error) });
        });
        return;
      }

      // C. Select item in Zotero library
      if (data.type === 'RESEARCHFLOW_SELECT_ITEM' && data.itemKey) {
        try {
          const item = findItemByKey(data.itemKey, data.libraryID);
          if (item && window.ZoteroPane) {
            window.ZoteroPane.selectItem(item.id);
          }
        } catch (_) {}
        return;
      }

      // D. Get active item from Zotero
      if (data.type === 'RESEARCHFLOW_GET_ACTIVE_ITEM') {
        const active = host.getCurrentActiveItem(window);
        const serialized = active ? serializeLiteratureItem(active) : null;
        replyResult({
          requestId: data.requestId,
          item: serialized
        });
        return;
      }

      // E. Open PDF Attachment in Reader
      if (data.type === 'RESEARCHFLOW_OPEN_PDF' && data.itemKey) {
        const item = findItemByKey(data.itemKey, data.libraryID);
        if (item) {
          host.openPdfAttachment(item, data.page);
        }
        return;
      }

      // F. Sync to Zotero Child Note
      if (data.type === 'RESEARCHFLOW_SYNC_NOTE' && data.itemKey) {
        const item = findItemByKey(data.itemKey, data.libraryID);
        if (item) {
          host.syncManuscriptToChildNote(item).then((note: any) => {
            if (data.requestId) {
              replyResult({ requestId: data.requestId, success: Boolean(note), noteId: note?.id });
            }
          });
        } else if (data.requestId) {
          replyResult({ requestId: data.requestId, success: false });
        }
        return;
      }

      // G. Get Zotero Collections
      if (data.type === 'RESEARCHFLOW_GET_COLLECTIONS') {
        const cols = host.getZoteroCollections(data.libraryID);
        replyResult({
          requestId: data.requestId,
          collections: cols
        });
        return;
      }

      // I. Search Zotero Library
      if (data.type === 'RESEARCHFLOW_SEARCH_LIBRARY') {
        host.searchLibrary(data.query, data.limit || 15).then((results: any) => {
          replyResult({
            requestId: data.requestId,
            results: results || []
          });
        });
        return;
      }

      // K. Get Literature PDF Annotations & Highlights
      if (data.type === 'RESEARCHFLOW_GET_ANNOTATIONS' && data.itemKey) {
        const item = findItemByKey(data.itemKey, data.libraryID);
        const annos = item ? getLiteratureAnnotations(item) : [];
        replyResult({ requestId: data.requestId, annotations: annos });
        return;
      }

      // L. Sync Status Tag to Zotero Item
      if (data.type === 'RESEARCHFLOW_SYNC_STATUS_TAG' && data.itemKey && data.status) {
        const item = findItemByKey(data.itemKey, data.libraryID);
        if (item) {
          host.syncStatusTagToItem(item, data.status).then((success: boolean) => {
            replyResult({ requestId: data.requestId, success });
          });
        } else {
          replyResult({ requestId: data.requestId, success: false });
        }
        return;
      }

      // M. Add Item to Pipeline Collection
      if (data.type === 'RESEARCHFLOW_ADD_TO_PIPELINE_COLLECTION' && data.itemKey) {
        const item = findItemByKey(data.itemKey, data.libraryID);
        if (item) {
          host.addItemToPipelineCollection(item).then((col: any) => {
            replyResult({ requestId: data.requestId, success: Boolean(col) });
          });
        } else {
          replyResult({ requestId: data.requestId, success: false });
        }
        return;
      }

      // N. Get Reading Assets (Annotations, Notes, Collections, Tags, Related)
      if (data.type === 'RESEARCHFLOW_GET_READING_ASSETS' && data.itemKey) {
        const item = findItemByKey(data.itemKey, data.libraryID);
        const assets = item ? getLiteratureReadingAssets(item) : { annotations: [], notes: [], collections: [], tags: [], relatedItems: [] };
        replyResult({ requestId: data.requestId, assets });
        return;
      }

      // O. Get Literature Notes
      if (data.type === 'RESEARCHFLOW_GET_NOTES' && data.itemKey) {
        const item = findItemByKey(data.itemKey, data.libraryID);
        const notes = item ? getLiteratureNotes(item) : [];
        replyResult({ requestId: data.requestId, notes });
        return;
      }

      if (data.type === 'RESEARCHFLOW_GET_ALL_PREFS') {
        replyResult({ requestId: data.requestId, prefs: host.getSyncedSettingsFromPrefs() });
        return;
      }

      if (data.type === 'RESEARCHFLOW_GET_PREF') {
        replyResult({ requestId: data.requestId, value: host.getPref(data.key, data.defaultValue) });
        return;
      }

      if (data.type === 'RESEARCHFLOW_SET_PREF') {
        host.setPref(data.key, data.value);
        if (host._cachedData) {
          if (!host._cachedData.settings) host._cachedData.settings = {};
          host._cachedData.settings[data.key] = data.value;
        }
        host.broadcastToIframes({
          type: 'RESEARCHFLOW_PREF_CHANGED',
          key: data.key,
          value: data.value
        });
        replyResult({ requestId: data.requestId, success: true });
        return;
      }

      if (data.type === 'RESEARCHFLOW_SAVE_SHARE_IMAGE') {
        host.saveShareImageFile(data.pngBytes, data.fileName, data.language, window).then((result: any) => {
          replyResult({ requestId: data.requestId, ...result });
        });
        return;
      }

      // P. Export Database
      if (data.type === 'RESEARCHFLOW_EXPORT_DB') {
        host.exportDatabaseFile(window).then((result: any) => {
          replyResult({ requestId: data.requestId, ...result });
        });
        return;
      }

      // Q. Import Database
      if (data.type === 'RESEARCHFLOW_IMPORT_DB') {
        host.importDatabaseFile(data.mode || 'merge', window).then((result: any) => {
          replyResult({ requestId: data.requestId, ...result });
        });
        return;
      }

      // R. Export Diagnostics
      if (data.type === 'RESEARCHFLOW_EXPORT_DIAGNOSTICS') {
        host.exportDiagnosticsFile(data.report, window).then((result: any) => {
          replyResult({ requestId: data.requestId, ...result });
        });
        return;
      }

      // S. Restore Backup Database
      if (data.type === 'RESEARCHFLOW_RESTORE_BACKUP') {
        host.restoreBackupDatabase().then((restored: any) => {
          replyResult({ requestId: data.requestId, success: true, data: restored });
        }).catch((err: any) => {
          replyResult({ requestId: data.requestId, success: false, error: err.message });
        });
        return;
      }

      // J. Show Native Zotero ProgressWindow Toast
      if (data.type === 'RESEARCHFLOW_SHOW_TOAST') {
        host.showToast(data.title || '通知', data.message || '', data.toastType || 'info');
        return;
      }

      if (data.type === 'RESEARCHFLOW_OPEN_PREFS') {
        host.openPreferencesPane(window);
        return;
      }

      if (data.type === 'RESEARCHFLOW_OPEN_EXTERNAL' && data.url) {
        try {
          if (typeof Zotero.launchURL === 'function') {
            Zotero.launchURL(data.url);
          } else {
            const uri = Services.io.newURI(data.url);
            Cc['@mozilla.org/uriloader/external-protocol-service;1']
              ?.getService(Ci.nsIExternalProtocolService)
              ?.loadURI(uri);
          }
        } catch (_) {}
        return;
      }
    } catch (err) {
      Zotero.logError?.('[PaperFlow] handleHostMessage error: ' + err);
    }
  };
}
