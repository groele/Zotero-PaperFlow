/**
 * Zotero PaperFlow Storage - Cloud Synchronization & Network Operations
 */
import { CloudSyncProvider } from '../cloud-sync.js';
import { StorageTombstones } from './tombstones.js';

declare var RFPlatform: any;

export class StorageCloudSync extends StorageTombstones {
  async testConnection(provider: string, config: any): Promise<any> {
    try {
      if (provider === 'webdav') {
        const { url, username, password } = config;
        if (!url || !username || !password) throw new Error('Missing configuration fields');
        await this.ensureHostPermissionForUrl(url);

        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const headers = new Headers();
        const credentialBytes = new TextEncoder().encode(`${username}:${password}`);
        headers.set('Authorization', 'Basic ' + btoa(String.fromCharCode(...credentialBytes)));

        const response = await this.fetchWithTimeout(cleanUrl, {
          method: 'PROPFIND',
          headers: headers,
          body: `<?xml version="1.0" encoding="utf-8" ?>
            <d:propfind xmlns:d="DAV:">
              <d:prop><d:displayname/></d:prop>
            </d:propfind>`
        });
        if (response.status >= 200 && response.status < 300) {
          return { success: true };
        } else {
          return { success: false, error: `Server returned status ${response.status}` };
        }
      } else if (provider === 'github') {
        const { token, repo } = config;
        if (!token || !repo) throw new Error('Missing token or repository');

        const response = await this.fetchWithTimeout(`https://api.github.com/repos/${repo}`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (response.ok) {
          return { success: true };
        } else {
          const errData: any = await response.json().catch(() => ({}));
          return { success: false, error: errData.message || `GitHub error ${response.status}` };
        }
      } else if (provider === 'local') {
        return { success: true };
      }
      return { success: false, error: 'Unsupported provider' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async syncDatabaseNow(): Promise<any> {
    if (this.syncing) return { success: false, error: 'Sync already in progress' };
    this.syncing = true;
    try {
      const initial = await this.loadAll();
      const provider = await this.getEffectiveMetadataProvider(initial);
      if (provider.provider === 'local') return { success: true, localOnly: true };
      const issue = this.getSyncConfigurationIssue(provider);
      if (issue) return { success: false, skipped: true, error: issue };
      const remote = provider.provider === 'webdav'
        ? await this.fetchFromWebDAV(provider.config)
        : await this.fetchFromGitHub(provider.config);
      const pushDb = await this.enqueueCommit(async () => {
        const latest = await this.loadAll();
        const merged = remote ? await this.mergeDatabases(latest, remote) : latest;
        const committed = await this.ensureDbShape(merged, { stamp: true });
        const saved = await this.persistLocal(committed, { expectedRevision: latest.revision });
        this.cache = saved || committed;
        if (typeof RFPlatform !== 'undefined' && RFPlatform.runtime?.sendMessage) {
          RFPlatform.runtime.sendMessage({ action: 'DATABASE_UPDATED', data: this.cache }).catch(() => {});
        }
        return JSON.parse(JSON.stringify(this.cache));
      });
      await this.saveToCloud(provider.provider, provider.config, pushDb);
      const pending = await this.enqueueCommit(async () => {
        const latest = await this.loadAll();
        const merged = await this.mergeDatabases(latest, pushDb);
        const hasPending = this.hasMeaningfulChanges(pushDb, merged);
        const saved = await this.persistLocal(merged, { expectedRevision: latest.revision });
        this.cache = saved || merged;
        if (typeof RFPlatform !== 'undefined' && RFPlatform.runtime?.sendMessage) {
          RFPlatform.runtime.sendMessage({ action: 'DATABASE_UPDATED', data: this.cache }).catch(() => {});
        }
        return hasPending;
      });
      if (pending) this.scheduleBackgroundSync();
      return { success: true, pending };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      this.syncing = false;
    }
  }

  async saveToCloud(provider: string, config: any, db: any): Promise<void> {
    if (provider === 'webdav') {
      await this.saveToWebDAV(config, db);
    } else if (provider === 'github') {
      await this.saveToGitHub(config, db);
    }
  }

  async mergeDatabases(localDb: any, remoteDb: any): Promise<any> {
    const local = await this.ensureDbShape(localDb, { stamp: false });
    const remote = await this.ensureDbShape(remoteDb, { stamp: false, migrateCredentials: false });
    const merged = this.deepMerge(local, remote);

    [
      'researchAreas',
      'projects',
      'researchRecords',
      'manuscripts',
      'submissions',
      'tasks'
    ].forEach((collectionName) => {
      merged.deletedEntities[collectionName] = this.normalizeDeletionTombstones([
        ...(local.deletedEntities?.[collectionName] || []),
        ...(remote.deletedEntities?.[collectionName] || [])
      ]);
      merged[collectionName] = this.filterDeletedEntities(
        this.mergeEntityArray(local[collectionName], remote[collectionName]),
        merged.deletedEntities[collectionName]
      );
    });

    merged.settings = local.settings;
    merged._github_sha = remote._github_sha || local._github_sha;
    merged._webdav_etag = remote._webdav_etag !== undefined ? remote._webdav_etag : local._webdav_etag;
    merged.lastUpdated = Math.max(Number(local.lastUpdated) || 0, Number(remote.lastUpdated) || 0);
    merged.updatedAt = new Date(merged.lastUpdated || Date.now()).toISOString();
    merged.revision = Math.max(Number(local.revision) || 0, Number(remote.revision) || 0);
    return merged;
  }

  mergeEntityArray(localItems: any[] = [], remoteItems: any[] = []): any[] {
    const byId = new Map();
    [...localItems, ...remoteItems].forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const id = item.id || `${item.title || item.name || 'entity'}_${item.createdAt || ''}`;
      const previous = byId.get(id);
      if (!previous) {
        byId.set(id, item);
        return;
      }
      byId.set(id, this.pickNewerEntity(previous, item));
    });
    return Array.from(byId.values()).sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
  }

  pickNewerEntity(a: any, b: any): any {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (timeA === timeB) return this.deepMerge(a, b);
    return timeB > timeA ? this.deepMerge(a, b) : this.deepMerge(b, a);
  }

  hasMeaningfulChanges(a: any, b: any): boolean {
    const clean = (value: any) => {
      const clone = JSON.parse(JSON.stringify(value || {}));
      delete clone.lastUpdated;
      delete clone.updatedAt;
      delete clone.revision;
      delete clone._github_sha;
      return clone;
    };
    return JSON.stringify(clean(a)) !== JSON.stringify(clean(b));
  }

  _getCloudProvider(): any {
    if (typeof CloudSyncProvider !== 'undefined') return CloudSyncProvider;
    if (typeof globalThis !== 'undefined' && (globalThis as any).CloudSyncProvider) return (globalThis as any).CloudSyncProvider;
    if (typeof window !== 'undefined' && (window as any).CloudSyncProvider) return (window as any).CloudSyncProvider;
    return null;
  }

  async fetchFromWebDAV(config: any): Promise<any> {
    const provider = this._getCloudProvider();
    if (provider?.fetchFromWebDAV) return provider.fetchFromWebDAV(this, config);
    throw new Error('CloudSyncProvider is not available');
  }

  async saveToWebDAV(config: any, db: any): Promise<void> {
    const provider = this._getCloudProvider();
    if (provider?.saveToWebDAV) return provider.saveToWebDAV(this, config, db);
    throw new Error('CloudSyncProvider is not available');
  }

  async ensureHostPermissionForUrl(url: string): Promise<boolean> {
    const provider = this._getCloudProvider();
    if (provider?.ensureHostPermissionForUrl) return provider.ensureHostPermissionForUrl(url);
    throw new Error('CloudSyncProvider is not available');
  }

  async fetchFromGitHub(config: any): Promise<any> {
    const provider = this._getCloudProvider();
    if (provider?.fetchFromGitHub) return provider.fetchFromGitHub(this, config);
    throw new Error('CloudSyncProvider is not available');
  }

  async saveToGitHub(config: any, db: any): Promise<void> {
    const provider = this._getCloudProvider();
    if (provider?.saveToGitHub) return provider.saveToGitHub(this, config, db);
    throw new Error('CloudSyncProvider is not available');
  }
}
