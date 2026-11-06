/**
 * Zotero PaperFlow Storage - Base State, Shape & Utilities
 */
import { DEFAULT_DB, SYNC_CREDENTIALS_KEY } from './types.js';

declare var RFPlatform: any;
declare var ZoteroBridge: any;

export class StorageBase {
  cache: any = null;
  loadPromise: Promise<any> | null = null;
  syncing: boolean = false;
  deviceIdPromise: Promise<string> | null = null;
  syncTimer: any = null;
  syncCredentials: any = null;
  commitQueue: Promise<any>;
  enqueueCommit: (operation: () => Promise<any>) => Promise<any>;
  _activeEditorSaves?: WeakMap<any, number>;
  _pendingEditorTargets?: WeakSet<any>;

  constructor() {
    if (typeof RFPlatform !== 'undefined' && RFPlatform.storage?.onChanged) {
      RFPlatform.storage.onChanged.addListener((changes: any, area: string) => {
        if (area === 'local' && changes[SYNC_CREDENTIALS_KEY]) this.syncCredentials = null;
      });
    }
    this.commitQueue = Promise.resolve();
    this.enqueueCommit = (operation: () => Promise<any>) => {
      const result = this.commitQueue.catch(() => {}).then(operation);
      this.commitQueue = result;
      return result;
    };
  }

  isZotero(): boolean {
    return Boolean(
      (typeof window !== 'undefined' && (window.Zotero || window.parent?.Zotero || window.arguments?.[0]?.Zotero)) ||
      (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) ||
      (typeof window !== 'undefined' && window.location?.protocol === 'chrome:' && window.location?.host === 'researchflow')
    );
  }

  getZoteroInstance(): any {
    if (typeof window === 'undefined') return null;
    return window.Zotero || window.parent?.Zotero || window.arguments?.[0]?.Zotero || null;
  }

  async fetchWithTimeout(url: string, options: any = {}): Promise<Response> {
    const { timeout = 15000, ...rest } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...rest, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  async ensureDbShape(data: any, options: any = {}): Promise<any> {
    const db = data && typeof data === 'object' ? data : {};
    db.schemaVersion = 7;
    db.lastUpdated = typeof db.lastUpdated === 'number' ? db.lastUpdated : Date.now();
    db.updatedAt = typeof db.updatedAt === 'string' ? db.updatedAt : new Date().toISOString();
    db.revision = typeof db.revision === 'number' && Number.isFinite(db.revision) ? db.revision : 0;
    db.deviceId = typeof db.deviceId === 'string' && db.deviceId ? db.deviceId : await this.getDeviceId();

    const collections = ['researchAreas', 'projects', 'researchRecords', 'manuscripts', 'submissions', 'tasks'];
    collections.forEach((name) => {
      if (!Array.isArray(db[name])) db[name] = [];
    });

    db.deletedEntities = (db.deletedEntities && typeof db.deletedEntities === 'object') ? db.deletedEntities : {};
    collections.forEach((name) => {
      if (!Array.isArray(db.deletedEntities[name])) db.deletedEntities[name] = [];
    });

    db.settings = (db.settings && typeof db.settings === 'object') ? db.settings : {};
    if (!db.settings.profile || typeof db.settings.profile !== 'object') {
      db.settings.profile = { ...DEFAULT_DB.settings.profile };
    }
    if (!Array.isArray(db.settings.journalPortals) || !db.settings.journalPortals.length) {
      db.settings.journalPortals = [...DEFAULT_DB.settings.journalPortals];
    }
    if (!db.settings.syncProviders || typeof db.settings.syncProviders !== 'object') {
      db.settings.syncProviders = { ...DEFAULT_DB.settings.syncProviders };
    }
    if (!db.settings.syncProviders.metadata) {
      db.settings.syncProviders.metadata = { provider: 'local', config: {}, autoSync: true };
    }

    delete db.evidenceLocker;
    delete db.aiSettings;
    delete db.settings?.ai;
    delete db.settings?.cloudSync;
    delete db.settings?.evidenceLocker;

    return db;
  }

  async getDeviceId(): Promise<string> {
    if (this.cache?.deviceId) return this.cache.deviceId;
    if (this.deviceIdPromise) return this.deviceIdPromise;
    this.deviceIdPromise = (async () => {
      try {
        if (typeof RFPlatform !== 'undefined' && RFPlatform.storage?.local?.get) {
          const res = await RFPlatform.storage.local.get('researchflow_device_id');
          if (res?.researchflow_device_id) return res.researchflow_device_id;
          const newId = 'dev_' + Math.random().toString(36).substring(2, 10);
          await RFPlatform.storage.local.set({ researchflow_device_id: newId });
          return newId;
        }
      } catch (_) {}
      return 'dev_default_' + Math.random().toString(36).substring(2, 6);
    })();
    return this.deviceIdPromise;
  }

  deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') return target;
    const output = Array.isArray(target) ? [...target] : { ...target };
    Object.keys(source).forEach((key) => {
      const srcVal = source[key];
      const tgtVal = output[key];
      if (Array.isArray(srcVal)) {
        output[key] = [...srcVal];
      } else if (srcVal && typeof srcVal === 'object') {
        output[key] = this.deepMerge(tgtVal && typeof tgtVal === 'object' ? tgtVal : {}, srcVal);
      } else {
        output[key] = srcVal;
      }
    });
    return output;
  }
}
