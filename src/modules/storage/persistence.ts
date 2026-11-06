/**
 * Zotero PaperFlow Storage - Persistence Layer
 */
import { DEFAULT_DB } from './types.js';
import { StorageBase } from './base.js';

declare var RFPlatform: any;
declare var ZoteroBridge: any;
declare var t: (key: string) => string;

export class StoragePersistence extends StorageBase {
  async loadAll(): Promise<any> {
    if (this.cache) return JSON.parse(JSON.stringify(this.cache));
    if (!this.loadPromise) {
      this.loadPromise = this.loadDatabase().finally(() => { this.loadPromise = null; });
    }
    return JSON.parse(JSON.stringify(await this.loadPromise));
  }

  async loadDatabase(): Promise<any> {
    const zotero = this.getZoteroInstance();
    if (zotero?.ResearchFlow?.loadDatabase) {
      const data = await zotero.ResearchFlow.loadDatabase();
      const normalized = await this.ensureDbShape(data || DEFAULT_DB, { stamp: false });
      this.cache = normalized;
      return this.cache;
    }

    if (this.isZotero()) throw new Error('Zotero database host unavailable. Reopen the ResearchFlow workspace.');

    if (typeof RFPlatform !== 'undefined' && RFPlatform.storage?.local) {
      const result: any = await new Promise((resolve, reject) => {
        RFPlatform.storage.local.get(['researchflow_db'], (res: any) => {
          const error = RFPlatform.runtime?.lastError;
          if (error) reject(new Error(error.message || 'Local storage read failed.'));
          else resolve(res);
        });
      });
      let source = result?.researchflow_db;
      if (!source) {
        try {
          const response = await this.fetchWithTimeout(RFPlatform.runtime.getURL('data/preloaded_db.json'));
          if (response.ok) source = await response.json();
        } catch (error: any) {
          console.warn('Preloaded database unavailable:', error.message);
        }
      }
      const normalized = await this.ensureDbShape(source || DEFAULT_DB, { stamp: false });
      await this.persistLocal(normalized);
      this.cache = normalized;
      return this.cache;
    }

    try {
      const item = typeof localStorage !== 'undefined' ? localStorage.getItem('researchflow_db') : null;
      let source = item ? JSON.parse(item) : null;
      if (!source) {
        try {
          const res = await this.fetchWithTimeout('data/preloaded_db.json');
          if (res.ok) source = await res.json();
        } catch (_) {}
      }
      const normalized = await this.ensureDbShape(source || DEFAULT_DB, { stamp: false });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('researchflow_db', JSON.stringify(normalized));
      }
      this.cache = normalized;
      return this.cache;
    } catch (_) {
      const normalized = await this.ensureDbShape(DEFAULT_DB, { stamp: false });
      this.cache = normalized;
      return this.cache;
    }
  }

  async saveAll(data: any, options: any = {}): Promise<any> {
    const notify = (state: string, error: string = '') => {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('researchflow-save-state', { detail: { state, error } }));
      }
    };
    notify('saving');
    try {
      const saved = await this.saveDatabase(data, options);
      notify(this.hasPendingEdits(data) ? 'pending' : 'saved');
      return saved;
    } catch (error: any) {
      notify('error', error.message);
      throw error;
    }
  }

  async saveDatabase(data: any, options: any = {}): Promise<any> {
    if (!this._activeEditorSaves) this._activeEditorSaves = new WeakMap();
    this._activeEditorSaves.set(data, (this._activeEditorSaves.get(data) || 0) + 1);
    try {
      return await this.commitEditorDatabase(data, options);
    } finally {
      const remaining = (this._activeEditorSaves.get(data) || 1) - 1;
      if (remaining) this._activeEditorSaves.set(data, remaining);
      else this._activeEditorSaves.delete(data);
    }
  }

  isSaving(target: any): boolean {
    return Boolean(target && this._activeEditorSaves?.has(target));
  }

  async commitEditorDatabase(data: any, options: any = {}): Promise<any> {
    const requested = JSON.parse(JSON.stringify(data));
    const zotero = this.getZoteroInstance();
    if (zotero?.ResearchFlow?.saveDatabase) {
      const dataRevision = Number(requested?.revision);
      const expectedRevision = options.expectedRevision ?? (Number.isFinite(dataRevision) ? dataRevision : undefined);
      const normalized = await this.ensureDbShape(JSON.parse(JSON.stringify(requested)), { stamp: true });
      const saved = await zotero.ResearchFlow.saveDatabase(normalized, { expectedRevision, replace: options.replace === true });
      const adopted = this.adoptSavedSnapshot(data, saved, requested);
      try {
        if (await (this as any).shouldRunCloudSync(this.cache)) this.scheduleBackgroundSync();
      } catch (error: any) {
        console.warn('Cloud sync scheduling unavailable:', error.message);
      }
      return adopted;
    }

    if (this.isZotero() && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) {
      const dataRevision = Number(requested?.revision);
      const expectedRevision = options.expectedRevision ?? (Number.isFinite(dataRevision) ? dataRevision : undefined);
      const normalized = await this.ensureDbShape(JSON.parse(JSON.stringify(requested)), { stamp: true });
      const response = await ZoteroBridge.request('RESEARCHFLOW_STORAGE_SET', {
        payload: normalized, expectedRevision, replace: options.replace === true
      }, 15000);
      if (!response?.success) throw new Error(response?.error || 'Zotero database save failed. Please retry.');
      return this.adoptSavedSnapshot(data, response.data || normalized, requested);
    }

    const normalized = await this.ensureDbShape(JSON.parse(JSON.stringify(requested)), { stamp: true });
    await this.persistLocal(normalized);
    const adopted = this.adoptSavedSnapshot(data, normalized, requested);

    if (typeof RFPlatform !== 'undefined' && RFPlatform.runtime?.sendMessage) {
      RFPlatform.runtime.sendMessage({ action: 'DATABASE_UPDATED', data: this.cache }).catch(() => {});
    }

    try {
      if (await (this as any).shouldRunCloudSync(this.cache)) this.scheduleBackgroundSync();
    } catch (error: any) {
      console.warn('Cloud sync scheduling unavailable:', error.message);
    }
    return adopted;
  }

  hasPendingEdits(target: any): boolean {
    return Boolean(target && this._pendingEditorTargets?.has(target));
  }

  mergePendingEdits(before: any, local: any, committed: any): any {
    const missing = Symbol('missing');
    const object = (value: any) => value !== missing && value !== null && typeof value === 'object' && !Array.isArray(value);
    const same = (a: any, b: any): boolean => {
      if (a === b) return true;
      if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
      if (object(a) && object(b)) return Object.keys(a).length === Object.keys(b).length
        && Object.keys(a).every(key => Object.hasOwn(b, key) && same(a[key], b[key]));
      return false;
    };
    const identified = (value: any) => Array.isArray(value) && value.every(item => object(item)
      && (typeof item.id === 'string' || (typeof item.id === 'number' && Number.isFinite(item.id))))
      && new Set(value.map(item => String(item.id))).size === value.length;
    const conflicts: string[] = [];
    const merge = (base: any, edited: any, latest: any, path: string = ''): any => {
      if (same(base, edited)) return latest;
      if (same(base, latest) || same(edited, latest)) return edited;
      if (object(base) && object(edited) && object(latest)) {
        const result: Record<string, any> = {};
        for (const key of new Set([...Object.keys(latest), ...Object.keys(edited), ...Object.keys(base)])) {
          if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
          const value = (obj: any) => Object.hasOwn(obj, key) ? obj[key] : missing;
          const combined = !path && ['revision', 'lastUpdated', 'updatedAt', 'deviceId'].includes(key)
            ? value(latest) : merge(value(base), value(edited), value(latest), path ? path + '.' + key : key);
          if (combined !== missing) result[key] = combined;
        }
        return result;
      }
      if (identified(base) && identified(edited) && identified(latest)) {
        const map = (list: any[]) => new Map(list.map(item => [String(item.id), item]));
        const old = map(base), ours = map(edited), theirs = map(latest);
        const common = new Set([...old.keys()].filter(id => ours.has(id) && theirs.has(id)));
        const order = (entries: Map<string, any>) => [...entries.keys()].filter(id => common.has(id));
        const oursMoved = !same(order(old), order(ours));
        const theirsMoved = !same(order(old), order(theirs));
        if (oursMoved && theirsMoved && !same(order(ours), order(theirs))) conflicts.push(path + '.order');
        const preferred = oursMoved && !theirsMoved ? ours : theirs;
        const result: any[] = [];
        for (const id of new Set([...preferred.keys(), ...theirs.keys(), ...ours.keys(), ...old.keys()])) {
          const entry = (entries: Map<string, any>) => entries.has(id) ? entries.get(id) : missing;
          const combined = merge(entry(old), entry(ours), entry(theirs), path + '[' + id + ']');
          if (combined !== missing) result.push(combined);
        }
        return result;
      }
      conflicts.push(path);
      return latest;
    };
    return { data: merge(before, local, committed), pending: !same(before, local), conflicts };
  }

  adoptSavedSnapshot(target: any, savedSnapshot: any, requested: any): any {
    if (Number(this.cache?.revision) > Number(savedSnapshot?.revision)
      || Number(target?.revision) > Number(savedSnapshot?.revision)) return target;

    this.cache = JSON.parse(JSON.stringify(savedSnapshot));
    if (
      target
      && savedSnapshot
      && target !== savedSnapshot
      && typeof target === 'object'
      && !Array.isArray(target)
    ) {
      if (!this._pendingEditorTargets) this._pendingEditorTargets = new WeakSet();
      const merged = this.mergePendingEdits(requested, target, savedSnapshot);
      if (merged.pending) this._pendingEditorTargets.add(target);
      else this._pendingEditorTargets.delete(target);
      if (merged.conflicts.length) return target;
      Object.keys(target).forEach((key) => delete target[key]);
      Object.assign(target, JSON.parse(JSON.stringify(merged.data)));
      return target;
    }
    return savedSnapshot;
  }

  scheduleBackgroundSync(delayMs: number = 1000): void {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      (this as any).syncDatabaseNow?.().catch(console.error);
    }, delayMs);
  }

  async persistLocal(data: any, options: any = {}): Promise<any> {
    const zotero = this.getZoteroInstance();
    if (zotero?.ResearchFlow?.saveDatabase) {
      return await zotero.ResearchFlow.saveDatabase(data, options);
    }
    if (this.isZotero()) {
      if (typeof ZoteroBridge === 'undefined' || !ZoteroBridge.isZotero) {
        throw new Error('Zotero database host unavailable. Reopen the ResearchFlow workspace.');
      }
      const response = await ZoteroBridge.request('RESEARCHFLOW_STORAGE_SET', {
        payload: data, expectedRevision: options.expectedRevision, replace: options.replace === true
      }, 15000);
      if (!response?.success) throw new Error(response?.error || 'Zotero database save failed. Please retry.');
      return response.data || data;
    }

    const safeData = (this as any).sanitizeDatabaseForExternalUse(data);
    if (typeof RFPlatform !== 'undefined' && RFPlatform.storage?.local) {
      await new Promise<void>((resolve, reject) => {
        RFPlatform.storage.local.set({ researchflow_db: safeData }, () => {
          const error = RFPlatform.runtime?.lastError;
          if (error) reject(new Error(error.message || 'Local storage write failed.'));
          else resolve();
        });
      });
      return data;
    }

    if (typeof localStorage === 'undefined') {
      throw new Error(typeof t === 'function' ? t('localStorageUnavailable')
        : 'Local storage unavailable. Reopen the workspace and retry.');
    }
    localStorage.setItem('researchflow_db', JSON.stringify(safeData));
    return data;
  }
}
