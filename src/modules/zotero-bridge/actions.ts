import { handleHostNavigation } from './navigation-handler.js';
/**
 * Zotero PaperFlow - Bridge Actions, Handlers & Navigation
 */
import { resolveZoteroItem } from './resolver.js';

export const bridgeActionMethods = {
  async getActiveItem(this: any): Promise<any> {
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
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

  openPdf(this: any, itemKey: string, page: any = null, libraryID: any = null): void {
    if (!itemKey) return;
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
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

  async syncNote(this: any, itemKey: string, libraryID: any = null): Promise<boolean> {
    if (!itemKey) return false;
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
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

  async getCollections(this: any, libraryID: any = null): Promise<any[]> {
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
      if (zotero?.ResearchFlow?.getZoteroCollections) {
        return zotero.ResearchFlow.getZoteroCollections(libraryID);
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_GET_COLLECTIONS', { libraryID });
    return res?.collections || [];
  },

  async searchLibrary(this: any, query: string, limit: number = 15): Promise<any[]> {
    if (!query) return [];
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
      if (zotero?.ResearchFlow?.searchLibrary) {
        return await zotero.ResearchFlow.searchLibrary(query, limit);
      }
    } catch (_) {}
    const res = await this.request('RESEARCHFLOW_SEARCH_LIBRARY', { query, limit });
    return res?.results || [];
  },

  showNativeToast(this: any, title: string, message: string, type: string = 'info'): void {
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
      if (zotero?.ResearchFlow?.showToast) {
        zotero.ResearchFlow.showToast(title, message, type);
        return;
      }
    } catch (_) {}
    this.sendToHost({ type: 'RESEARCHFLOW_SHOW_TOAST', title, message, toastType: type });
  },

  async getAnnotations(this: any, itemKey: string, libraryID: any = null): Promise<any[]> {
    if (!itemKey) return [];
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
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

  async getReadingAssets(this: any, itemKey: string, libraryID: any = null): Promise<any> {
    if (!itemKey) return { annotations: [], notes: [], collections: [], tags: [], relatedItems: [] };
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
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

  async getNotes(this: any, itemKey: string, libraryID: any = null): Promise<any[]> {
    if (!itemKey) return [];
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
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

  async syncStatusTag(this: any, itemKey: string, status: string, libraryID: any = null): Promise<boolean> {
    if (!itemKey || !status) return false;
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
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

  async addToPipelineCollection(this: any, itemKey: string, libraryID: any = null): Promise<boolean> {
    if (!itemKey) return false;
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
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

  async saveShareImage(this: any, blob: Blob, fileName: string, language: string = 'en'): Promise<any> {
    try {
      const pngBytes = new Uint8Array(await blob.arrayBuffer());
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
      if (zotero?.ResearchFlow?.saveShareImageFile) {
        return await zotero.ResearchFlow.saveShareImageFile(pngBytes, fileName, language);
      }
      return await this.request('RESEARCHFLOW_SAVE_SHARE_IMAGE', { pngBytes, fileName, language }, 0);
    } catch (error: any) {
      return { success: false, error: String(error?.message || error) };
    }
  },

  async exportDatabase(this: any): Promise<any> {
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
      if (zotero?.ResearchFlow?.exportDatabaseFile) {
        return await zotero.ResearchFlow.exportDatabaseFile();
      }
    } catch (error: any) { return { success: false, error: String(error?.message || error) }; }
    return await this.request('RESEARCHFLOW_EXPORT_DB');
  },

  async importDatabase(this: any, mode: string = 'merge'): Promise<any> {
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
      if (zotero?.ResearchFlow?.importDatabaseFile) {
        return await zotero.ResearchFlow.importDatabaseFile(mode);
      }
    } catch (error: any) { return { success: false, error: String(error?.message || error) }; }
    return await this.request('RESEARCHFLOW_IMPORT_DB', { mode });
  },

  async exportDiagnostics(this: any, report: any): Promise<any> {
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
      if (zotero?.ResearchFlow?.exportDiagnosticsFile) {
        return await zotero.ResearchFlow.exportDiagnosticsFile(report);
      }
    } catch (error: any) { return { success: false, error: String(error?.message || error) }; }
    return await this.request('RESEARCHFLOW_EXPORT_DIAGNOSTICS', { report });
  },

  async restoreBackup(this: any): Promise<any> {
    try {
      const zotero = typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null;
      if (zotero?.ResearchFlow?.restoreBackupDatabase) {
        const restored = await zotero.ResearchFlow.restoreBackupDatabase();
        return { success: true, data: restored };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
    return await this.request('RESEARCHFLOW_RESTORE_BACKUP');
  },

  async copyText(this: any, text: string, successToast: string = '已复制到剪贴板'): Promise<boolean> {
    if (!text) return false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        if (typeof (window as any).showGlobalToast === 'function' && successToast) {
          (window as any).showGlobalToast(successToast, 'success');
        }
        return true;
      }
    } catch (_) {}
    try {
      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        if (typeof (window as any).showGlobalToast === 'function' && successToast) {
          (window as any).showGlobalToast(successToast, 'success');
        }
        return true;
      }
    } catch (e) {
      console.warn('[ZoteroBridge] copyText failed:', e);
      return false;
    }
    return false;
  },

  handleHostNavigation,

  selectItemInZotero(this: any, itemKey: string, libraryID: any = null): void {
    if (!itemKey || typeof window === 'undefined') return;
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

  openExternal(this: any, url: string): void {
    if (!url || typeof window === 'undefined') return;
    try {
      const zotero = window.Zotero || window.parent?.Zotero;
      if (typeof zotero?.launchURL === 'function') {
        zotero.launchURL(url);
        return;
      }
    } catch (_) {}
    this.sendToHost({ type: 'RESEARCHFLOW_OPEN_EXTERNAL', url });
    try {
      if (window.open) {
        window.open(url, '_blank');
      }
    } catch (_) {}
  }
};
