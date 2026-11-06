/**
 * Zotero PaperFlow Storage - Tombstones, Credentials & Metadata Sanitization
 */
import { SYNC_CREDENTIALS_KEY, SYNC_SECRET_KEYS } from './types.js';
import { StoragePersistence } from './persistence.js';

declare var RFPlatform: any;

export class StorageTombstones extends StoragePersistence {
  recordEntityDeletion(database: any, collectionName: string, entityId: any): boolean {
    if (!database || !entityId || !Array.isArray(database?.[collectionName])) return false;
    database.deletedEntities = database.deletedEntities && typeof database.deletedEntities === 'object'
      ? database.deletedEntities
      : {};
    const existing = this.normalizeDeletionTombstones(database.deletedEntities[collectionName]);
    const deletedAt = new Date().toISOString();
    database.deletedEntities[collectionName] = existing
      .filter((item: any) => String(item.id) !== String(entityId))
      .concat({
        id: String(entityId),
        deletedAt,
        deviceId: String(database.deviceId || '')
      });
    database[collectionName] = database[collectionName].filter((item: any) => String(item?.id) !== String(entityId));
    return true;
  }

  normalizeDeletionTombstones(items: any[]): any[] {
    const byId = new Map();
    (Array.isArray(items) ? items : []).forEach((item) => {
      if (!item || typeof item !== 'object' || !String(item.id || '').trim()) return;
      const normalized = {
        id: String(item.id),
        deletedAt: item.deletedAt || item.updatedAt || new Date(0).toISOString(),
        deviceId: String(item.deviceId || '')
      };
      const previous = byId.get(normalized.id);
      if (!previous || this.getEntityTimestamp(normalized) >= this.getEntityTimestamp(previous)) {
        byId.set(normalized.id, normalized);
      }
    });
    return Array.from(byId.values());
  }

  getEntityTimestamp(item: any): number {
    const timestamp = new Date(item?.deletedAt || item?.updatedAt || item?.createdAt || 0).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  filterDeletedEntities(items: any[], tombstones: any[]): any[] {
    const deletedById = new Map(
      this.normalizeDeletionTombstones(tombstones).map(item => [item.id, item])
    );
    return (Array.isArray(items) ? items : []).filter((item) => {
      const tombstone = deletedById.get(String(item?.id || ''));
      if (!tombstone) return true;
      return this.getEntityTimestamp(item) > this.getEntityTimestamp(tombstone);
    });
  }

  getSyncConfigurationIssue(metadataProvider: any): string | null {
    const provider = String(metadataProvider?.provider || 'local').trim().toLowerCase();
    const config = metadataProvider?.config && typeof metadataProvider.config === 'object'
      ? metadataProvider.config
      : {};

    if (provider === 'local') return null;

    if (provider === 'webdav') {
      const url = String(config.url || '').trim();
      if (!url) return 'WebDAV URL is required.';
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
          return 'Invalid WebDAV URL';
        }
      } catch (_) {
        return 'Invalid WebDAV URL';
      }
      if (!String(config.username || '').trim() || !String(config.password || '').trim()) {
        return 'WebDAV username and app password are required.';
      }
      return null;
    }

    if (provider === 'github') {
      if (!String(config.token || '').trim()) return 'GitHub token is required.';
      if (!/^[^/\s]+\/[^/\s]+$/.test(String(config.repo || '').trim())) {
        return 'GitHub repository must use the owner/repository format.';
      }
      return null;
    }

    return `Unsupported sync provider: ${provider}`;
  }

  async shouldRunCloudSync(database: any = this.cache): Promise<boolean> {
    const metadata = database?.settings?.syncProviders?.metadata;
    if (metadata?.autoSync === false) return false;
    const metadataProvider = await this.getEffectiveMetadataProvider(database);
    return metadataProvider.provider !== 'local' && !this.getSyncConfigurationIssue(metadataProvider);
  }

  getPublicSyncConfig(provider: string, config: any = {}): any {
    if (provider === 'webdav') {
      return { url: String(config.url || '').trim() };
    }
    if (provider === 'github') {
      return {
        repo: String(config.repo || '').trim(),
        branch: String(config.branch || 'main').trim() || 'main'
      };
    }
    return {};
  }

  getCredentialPatch(provider: string, config: any = {}): any {
    if (provider === 'webdav') {
      return {
        username: String(config.username || '').trim(),
        password: String(config.password || '')
      };
    }
    if (provider === 'github') {
      return { token: String(config.token || '').trim() };
    }
    return {};
  }

  async loadSyncCredentials(): Promise<any> {
    if (this.syncCredentials) return this.deepMerge({}, this.syncCredentials);
    const zotero = this.getZoteroInstance();
    if (zotero?.Prefs) {
      try {
        const raw = zotero.Prefs.get('extensions.researchflow.syncCredentials', true);
        this.syncCredentials = raw ? JSON.parse(raw) : {};
        return this.deepMerge({}, this.syncCredentials);
      } catch (_) {}
    }

    if (typeof RFPlatform !== 'undefined' && RFPlatform.storage?.local) {
      this.syncCredentials = await new Promise((resolve, reject) => {
        RFPlatform.storage.local.get([SYNC_CREDENTIALS_KEY], (result: any) => {
          if (RFPlatform.runtime?.lastError) { reject(new Error(RFPlatform.runtime.lastError.message)); return; }
          const stored = result?.[SYNC_CREDENTIALS_KEY];
          resolve(stored && typeof stored === 'object' ? stored : {});
        });
      });
      return this.deepMerge({}, this.syncCredentials);
    }

    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(SYNC_CREDENTIALS_KEY) : null;
      this.syncCredentials = stored ? JSON.parse(stored) : {};
    } catch (_) {
      this.syncCredentials = {};
    }
    return this.deepMerge({}, this.syncCredentials);
  }

  async saveSyncCredentials(provider: string, config: any = {}): Promise<any> {
    const credentials = await this.loadSyncCredentials();
    if (provider === 'webdav' || provider === 'github') {
      credentials[provider] = this.getCredentialPatch(provider, config);
    }

    const zotero = this.getZoteroInstance();
    if (zotero?.Prefs) {
      try {
        zotero.Prefs.set('extensions.researchflow.syncCredentials', JSON.stringify(credentials), true);
      } catch (_) {}
    }

    if (typeof RFPlatform !== 'undefined' && RFPlatform.storage?.local) {
      await new Promise<void>((resolve, reject) => {
        RFPlatform.storage.local.set({ [SYNC_CREDENTIALS_KEY]: credentials }, () => {
          if (RFPlatform.runtime?.lastError) reject(new Error(RFPlatform.runtime.lastError.message));
          else resolve();
        });
      });
    } else {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(SYNC_CREDENTIALS_KEY, JSON.stringify(credentials));
        }
      } catch (_) {}
    }
    this.syncCredentials = credentials;
    return this.getCredentialPatch(provider, credentials[provider] || {});
  }

  async migrateSyncCredentials(database: any): Promise<void> {
    const metadata = database?.settings?.syncProviders?.metadata;
    if (!metadata || typeof metadata !== 'object') return;
    const provider = String(metadata.provider || 'local').trim().toLowerCase();
    const config = metadata.config && typeof metadata.config === 'object' ? metadata.config : {};
    const credentialPatch = this.getCredentialPatch(provider, config);
    if (Object.values(credentialPatch).some(Boolean)) {
      await this.saveSyncCredentials(provider, credentialPatch);
    } else {
      await this.loadSyncCredentials();
    }
    metadata.config = this.getPublicSyncConfig(provider, config);
  }

  async getEffectiveMetadataProvider(database: any = this.cache): Promise<any> {
    const metadata = database?.settings?.syncProviders?.metadata || { provider: 'local', config: {} };
    const provider = String(metadata.provider || 'local').trim().toLowerCase();
    const credentials = await this.loadSyncCredentials();
    return {
      provider,
      config: {
        ...this.getPublicSyncConfig(provider, metadata.config),
        ...(credentials[provider] || {})
      }
    };
  }

  sanitizeDatabaseForExternalUse(database: any): any {
    const sanitized = JSON.parse(JSON.stringify(database || {}));
    const metadata = sanitized?.settings?.syncProviders?.metadata;
    if (metadata) {
      metadata.config = this.getPublicSyncConfig(metadata.provider, metadata.config);
    }
    const scrub = (value: any) => {
      if (!value || typeof value !== 'object') return;
      Object.keys(value).forEach((key) => {
        if (SYNC_SECRET_KEYS.has(key.toLowerCase())) {
          delete value[key];
          return;
        }
        scrub(value[key]);
      });
    };
    scrub(sanitized);
    delete sanitized._github_sha;
    delete sanitized._webdav_etag;
    return sanitized;
  }

  normalizeEntityMetadata(database: any): void {
    const nowIso = new Date().toISOString();
    [
      'researchAreas',
      'projects',
      'researchRecords',
      'manuscripts',
      'submissions',
      'tasks'
    ].forEach((collectionName) => {
      database[collectionName].forEach((entity: any) => {
        if (!entity || typeof entity !== 'object') return;
        if (!entity.id) entity.id = `${collectionName}_${Math.random().toString(36).slice(2, 9)}`;
        if (!entity.createdAt) entity.createdAt = entity.updatedAt || database.updatedAt || nowIso;
        if (!entity.updatedAt) entity.updatedAt = entity.createdAt || database.updatedAt || nowIso;
      });
    });
  }
}
