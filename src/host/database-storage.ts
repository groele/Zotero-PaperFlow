/**
 * Zotero PaperFlow - Host Database Storage, Validation & Snapshot Persist
 */
import { CHROME_ROOT } from '../config.js';
import { getLiteratureItem, serializeLiteratureItem } from '../modules/academic-citation.js';

declare var Zotero: any;
declare var IOUtils: any;

export const hostDatabaseStorageMethods = {
  async searchLibrary(this: any, query: string, limit = 15) {
    const libraryID = arguments[2] ?? null;
    if (!query || typeof query !== 'string') return [];
    const q = query.trim();
    if (!q) return [];
    try {
      const results: any[] = [];
      const seenKeys = new Set();
      if (Zotero.Search) {
        const userLibID = Zotero.Libraries?.userLibraryID || 1;
        const targetLibs = libraryID
          ? [libraryID]
          : [userLibID, ...(typeof Zotero.Libraries?.getAll === 'function' ? Zotero.Libraries.getAll().map((l: any) => l.libraryID || l.id).filter((id: any) => id && id !== userLibID) : [])];

        for (const targetLib of targetLibs) {
          if (results.length >= limit) break;
          try {
            const s = new Zotero.Search();
            s.libraryID = targetLib;
            s.addCondition('quicksearch-titleCreatorYear', 'contains', q);
            const ids = (await s.search()) || [];
            for (const id of ids.slice(0, limit * 2)) {
              const it = Zotero.Items.get(id);
              const lit = getLiteratureItem(it);
              if (lit && !seenKeys.has(lit.key)) {
                seenKeys.add(lit.key);
                results.push(serializeLiteratureItem(lit));
                if (results.length >= limit) break;
              }
            }
          } catch (_) {}
        }
      }
      return results;
    } catch (err) {
      Zotero.logError?.('[PaperFlow] searchLibrary error: ' + err);
      return [];
    }
  },

  notifyDataChanged(this: any) {
    for (const listener of this._dataListeners) {
      try { listener(); } catch (_) {}
    }
    this.broadcastToIframes({ type: 'RESEARCHFLOW_DATA_UPDATED', data: this._cachedData });
  },

  databaseCollections(this: any) {
    return ['researchAreas', 'projects', 'researchRecords', 'manuscripts', 'submissions', 'tasks'];
  },

  databaseError(this: any, key: string, args: any = {}) {
    if (!this._databaseL10n) {
      const { Localization } = Zotero.getMainWindow();
      this._databaseL10n = new Localization(['researchflow.ftl'], true);
    }
    return new Error(this._databaseL10n.formatValueSync(`researchflow-database-${key}`, args));
  },

  validateDatabase(this: any, data: any) {
    const isObject = (value: any) => value && typeof value === 'object' && !Array.isArray(value);
    const collections = this.databaseCollections();
    if (!isObject(data) || !collections.some((key: string) => Array.isArray(data[key]))) {
      throw this.databaseError('invalid-backup');
    }
    if (data.schemaVersion != null && (!Number.isInteger(Number(data.schemaVersion))
      || Number(data.schemaVersion) < 1 || Number(data.schemaVersion) > 7)) {
      throw this.databaseError('unsupported-version');
    }
    const checkRecords = (records: any[], key: string) => {
      if (!Array.isArray(records)) throw this.databaseError('invalid-collection', { field: key });
      const seen = new Set();
      for (const record of records) {
        const id = record?.id;
        if (!isObject(record) || !((typeof id === 'string' && id.trim())
          || (typeof id === 'number' && Number.isFinite(id)))) {
          throw this.databaseError('invalid-id', { field: key });
        }
        if (seen.has(String(id))) throw this.databaseError('duplicate-id', { field: key });
        seen.add(String(id));
      }
    };
    for (const key of collections) {
      if (key in data) checkRecords(data[key], key);
    }
    if ('settings' in data && !isObject(data.settings)) throw this.databaseError('invalid-settings');
    if ('deletedEntities' in data) {
      if (!isObject(data.deletedEntities)) throw this.databaseError('invalid-deletions');
      for (const key of collections) {
        if (key in data.deletedEntities) checkRecords(data.deletedEntities[key], `deletedEntities.${key}`);
      }
    }
  },

  cloneDatabase(this: any, data: any) {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(data);
      } catch (_) {}
    }
    return JSON.parse(JSON.stringify(data));
  },

  enqueueDatabaseOperation(this: any, operation: () => Promise<any>) {
    const result = (this._saveQueue || Promise.resolve()).catch(() => {}).then(operation);
    this._saveQueue = result;
    return result;
  },

  async loadDatabase(this: any) {
    return this.enqueueDatabaseOperation(() => this.readDatabaseSnapshot());
  },

  rememberDatabaseSnapshot(this: any, data: any) {
    if (!this._databaseHistory) this._databaseHistory = new Map();
    const revision = Number(data.revision) || 0;
    this._databaseHistory.set(revision, JSON.stringify(data));
    let size = Array.from(this._databaseHistory.values()).reduce((sum: number, text: any) => sum + (text?.length || 0), 0);
    while (this._databaseHistory.size > 12 || size > 4 * 1024 * 1024) {
      const oldest = this._databaseHistory.keys().next().value;
      size -= (this._databaseHistory.get(oldest) as any)?.length || 0;
      this._databaseHistory.delete(oldest);
    }
  },


  async readDatabaseSnapshot(this: any) {
    if (this._cachedData) return this.cloneDatabase(this._cachedData);
    const filePath = this.getDataFilePath();
    const exists = await IOUtils.exists(filePath);
    if (exists) {
      try {
        const content = await IOUtils.readUTF8(filePath);
        const parsed = JSON.parse(content);
        this.validateDatabase(parsed);
        if (!parsed.settings) parsed.settings = {};
        if (typeof this.getSyncedSettingsFromPrefs === 'function') {
          parsed.settings = this.getSyncedSettingsFromPrefs(parsed.settings);
        }
        this._cachedData = parsed;
        this.rememberDatabaseSnapshot(parsed);
        return this.cloneDatabase(parsed);
      } catch (e) {
        Zotero.logError?.('[PaperFlow] Failed to read researchflow-data.json: ' + e);
        throw e;
      }
    }

    let preloaded = null;
    try {
      const response = await fetch(`${CHROME_ROOT}data/preloaded_db.json`);
      if (response.ok) preloaded = await response.json();
    } catch (error) {
      Zotero.logError?.('[PaperFlow] Bundled database unavailable: ' + error);
    }
    if (preloaded) {
      this.validateDatabase(preloaded);
      return this.writeDatabaseSnapshot(preloaded);
    }

    const initial = {
      schemaVersion: 7,
      lastUpdated: Date.now(),
      updatedAt: new Date().toISOString(),
      revision: 1,
      deviceId: 'zotero_' + Math.random().toString(36).slice(2),
      researchAreas: [],
      projects: [],
      researchRecords: [],
      manuscripts: [],
      submissions: [],
      tasks: [],
      deletedEntities: { researchAreas: [], projects: [], researchRecords: [], manuscripts: [], submissions: [], tasks: [] },
      settings: {
        syncProviders: { metadata: { provider: 'local', config: {}, autoSync: true } },
        profile: { displayName: '', chineseName: '', englishName: '', affiliation: '', orcid: '', language: 'zh', theme: 'system' }
      }
    };
    return this.writeDatabaseSnapshot(initial);
  },

  async saveDatabase(this: any, data: any, options = {}) {
    this.validateDatabase(data);
    let snapshot = this.cloneDatabase(data);
    const expectedRevision = (options as any)?.expectedRevision;
    const replace = (options as any)?.replace === true;
    return this.enqueueDatabaseOperation(async () => {
      const current = await this.readDatabaseSnapshot();
      if (expectedRevision != null) {
        const actualRevision = Number(current.revision) || 0;
        if (!Number.isInteger(Number(expectedRevision)) || Number(expectedRevision) < 0) {
          throw this.databaseError('revision-conflict', {
            expected: Number(expectedRevision),
            actual: actualRevision
          });
        }
        if (Number(expectedRevision) !== actualRevision) {
          const storedBase = this._databaseHistory?.get(Number(expectedRevision));
          const base = storedBase ? JSON.parse(storedBase) : null;
          const merged = base && !replace ? this.mergeDatabaseEdits(base, snapshot, current) : null;
          if (!merged || merged.conflicts.length) {
            throw await this.preserveDatabaseConflict(base, snapshot, current,
              merged?.conflicts || ['database']);
          }
          snapshot = merged.data;
          this.validateDatabase(snapshot);
        }
      }
      return this.writeDatabaseSnapshot(snapshot);
    });
  },

  async writeDatabaseSnapshot(this: any, data: any, fallbackRevision = 0) {
    const previousRevision = Number(this._cachedData?.revision) || Number(fallbackRevision) || 0;
    const snapshot = { ...data, revision: previousRevision + 1,
      lastUpdated: Date.now(), updatedAt: new Date().toISOString() };
    const filePath = this.getDataFilePath();
    try {
      await IOUtils.writeUTF8(filePath, JSON.stringify(snapshot, null, 2), { tmpPath: `${filePath}.tmp` });
      this._cachedData = this.cloneDatabase(snapshot);
      this.rememberDatabaseSnapshot(snapshot);
      this.notifyDataChanged();
      return this.cloneDatabase(snapshot);
    } catch (error) {
      Zotero.logError?.('[PaperFlow] Failed to write researchflow-data.json: ' + error);
      throw error;
    }
  },

  mergeDatabaseBackup(this: any, current: any, incoming: any) {
    const merged = { ...current, ...incoming };
    const mergeObjects = (oldValue: any, newValue: any) => {
      const result: Record<string, any> = { ...oldValue };
      for (const [key, value] of Object.entries(newValue || {})) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
        result[key] = value && typeof value === 'object' && !Array.isArray(value)
          ? mergeObjects(oldValue?.[key], value) : value;
      }
      return result;
    };
    merged.settings = mergeObjects(current.settings, incoming.settings);
    merged.deletedEntities = { ...current.deletedEntities, ...incoming.deletedEntities };
    const timestamp = (item: any) => Date.parse(item?.deletedAt || item?.updatedAt || item?.createdAt || '') || 0;
    for (const key of this.databaseCollections()) {
      const records = new Map();
      for (const item of current[key] || []) records.set(String(item.id), item);
      for (const item of incoming[key] || []) {
        const id = String(item.id);
        records.set(id, { ...records.get(id), ...item });
      }
      const deleted = new Map();
      for (const item of [...(current.deletedEntities?.[key] || []), ...(incoming.deletedEntities?.[key] || [])]) {
        const id = String(item.id);
        if (!deleted.has(id) || timestamp(item) >= timestamp(deleted.get(id))) deleted.set(id, item);
      }
      merged.deletedEntities[key] = Array.from(deleted.values());
      merged[key] = Array.from(records.values()).filter((item) =>
        !deleted.has(String(item.id)) || timestamp(item) > timestamp(deleted.get(String(item.id))));
    }
    return merged;
  },

  async importDatabase(this: any, importedData: any, mode = 'merge') {
    this.validateDatabase(importedData);
    if (mode !== 'merge' && mode !== 'overwrite') throw new Error('无效的导入方式');
    const incoming = this.cloneDatabase(importedData);
    return this.enqueueDatabaseOperation(async () => {
      const current = await this.readDatabaseSnapshot();
      const importedSnapshot = mode === 'overwrite' ? incoming : this.mergeDatabaseBackup(current, incoming);
      this.validateDatabase(importedSnapshot);
      const backupPath = this.getBackupFilePath();
      await IOUtils.writeUTF8(backupPath, JSON.stringify(current, null, 2), { tmpPath: `${backupPath}.tmp` });
      const saved = await this.writeDatabaseSnapshot(importedSnapshot);
      if (mode === 'overwrite') {
        this._databaseHistory = new Map();
        this.rememberDatabaseSnapshot(saved);
      }
      return saved;
    });
  },

  async restoreBackupDatabase(this: any) {
    return this.enqueueDatabaseOperation(async () => {
      const backupPath = this.getBackupFilePath();
      if (!await IOUtils.exists(backupPath)) throw new Error('未找到前次导入备份文件');
      const restored = JSON.parse(await IOUtils.readUTF8(backupPath));
      this.validateDatabase(restored);
      let fallbackRevision = 0;
      try { await this.readDatabaseSnapshot(); }
      catch (error) {
        Zotero.logError?.('[PaperFlow] Restoring backup over unreadable database: ' + error);
        fallbackRevision = Number(restored.revision) || 0;
      }
      const saved = await this.writeDatabaseSnapshot(restored, fallbackRevision);
      this._databaseHistory = new Map();
      this.rememberDatabaseSnapshot(saved);
      return saved;
    });
  }
};
