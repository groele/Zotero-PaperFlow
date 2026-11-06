"use strict";
(() => {
  // src/modules/storage/types.ts
  var SYNC_CREDENTIALS_KEY = "researchflow_sync_credentials";
  var SYNC_SECRET_KEYS = /* @__PURE__ */ new Set(["token", "password", "accesstoken", "refreshtoken", "clientsecret", "authorization"]);
  var DEFAULT_DB = {
    schemaVersion: 7,
    lastUpdated: 0,
    updatedAt: null,
    revision: 0,
    deviceId: "",
    researchAreas: [],
    projects: [],
    researchRecords: [],
    manuscripts: [],
    submissions: [],
    tasks: [],
    deletedEntities: {
      researchAreas: [],
      projects: [],
      researchRecords: [],
      manuscripts: [],
      submissions: [],
      tasks: []
    },
    settings: {
      syncProviders: {
        metadata: { provider: "local", config: {}, autoSync: true }
      },
      profile: {
        displayName: "",
        chineseName: "",
        englishName: "",
        affiliation: "",
        orcid: "",
        language: "en",
        theme: "system"
      },
      journalPortals: [
        { id: "acs", name: "ACS", url: "https://publish.acs.org/app/login?code=1000", color: "#002C6C", isDefault: true },
        { id: "wiley", name: "Wiley", url: "https://submission.wiley.com/submission/dashboard", color: "#00A4E4", isDefault: true },
        { id: "apl", name: "APL", url: "https://apl.peerx-press.org/cgi-bin/main.plex", color: "#D22630", isDefault: true },
        { id: "nature", name: "Nature", url: "https://mts-ncomms.nature.com/cgi-bin/main.plex", color: "#B59E50", isDefault: true }
      ]
    }
  };

  // src/modules/cloud-sync.ts
  function toBase64Utf8(obj) {
    const text = JSON.stringify(obj, null, 2);
    if (typeof TextEncoder !== "undefined") {
      const bytes = new TextEncoder().encode(text);
      let bin = "";
      for (let i = 0; i < bytes.length; i += 8192) {
        bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 8192)));
      }
      return btoa(bin);
    }
    return btoa(unescape(encodeURIComponent(text)));
  }
  var CloudSyncProvider = class {
    // --- WebDAV Protocol Methods ---
    static async ensureHostPermissionForUrl(url) {
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) throw new Error();
        return true;
      } catch (_) {
        throw new Error("Invalid WebDAV URL");
      }
    }
    static async fetchFromWebDAV(engine, config) {
      const { url, username, password } = config;
      await this.ensureHostPermissionForUrl(url);
      const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
      const dbUrl = `${cleanUrl}/researchflow_db.json`;
      const headers = new Headers();
      const credentialBytes = new TextEncoder().encode(`${username}:${password}`);
      headers.set("Authorization", "Basic " + btoa(String.fromCharCode(...credentialBytes)));
      const response = await engine.fetchWithTimeout(dbUrl, { method: "GET", headers });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`WebDAV read failed: ${response.statusText}`);
      const parsed = await response.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        parsed._webdav_etag = response.headers?.get?.("etag") || null;
      }
      return parsed;
    }
    static async saveToWebDAV(engine, config, db) {
      const { url, username, password } = config;
      await this.ensureHostPermissionForUrl(url);
      const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
      const dbUrl = `${cleanUrl}/researchflow_db.json`;
      const headers = new Headers();
      const credentialBytes = new TextEncoder().encode(`${username}:${password}`);
      headers.set("Authorization", "Basic " + btoa(String.fromCharCode(...credentialBytes)));
      headers.set("Content-Type", "application/json");
      if (db._webdav_etag === null) throw new Error("WebDAV server did not provide an ETag. A safe overwrite is unavailable.");
      if (db._webdav_etag) headers.set("If-Match", db._webdav_etag);
      else headers.set("If-None-Match", "*");
      const response = await engine.fetchWithTimeout(dbUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(engine.sanitizeDatabaseForExternalUse(db), null, 2)
      });
      if (response.status === 409 || response.status === 412) {
        throw new Error("WebDAV conflict: the remote database changed. Sync again to merge before retrying.");
      }
      if (!response.ok) throw new Error(`WebDAV write failed: ${response.statusText}`);
      db._webdav_etag = response.headers?.get?.("etag") || null;
    }
    // --- GitHub REST API Protocol Methods ---
    static async fetchFromGitHub(engine, config) {
      const { token, repo, branch = "main" } = config;
      const dbUrl = `https://api.github.com/repos/${repo}/contents/researchflow_db.json?ref=${encodeURIComponent(branch)}`;
      const response = await engine.fetchWithTimeout(dbUrl, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`GitHub fetch failed: ${response.statusText}`);
      const data = await response.json();
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
        Uint8Array.from(atob(data.content.replace(/\s/g, "")), (char) => char.charCodeAt(0))
      );
      const parsed = JSON.parse(decoded);
      parsed._github_sha = data.sha;
      return parsed;
    }
    static async saveToGitHub(engine, config, db) {
      const { token, repo, branch = "main" } = config;
      const dbUrl = `https://api.github.com/repos/${repo}/contents/researchflow_db.json`;
      let sha = db._github_sha;
      let rebasedDatabase = null;
      if (!sha) {
        const existing = await this.fetchFromGitHub(engine, config);
        if (existing) {
          if (!existing._github_sha) throw new Error("GitHub preflight returned no file SHA");
          rebasedDatabase = await engine.mergeDatabases(db, existing);
          sha = existing._github_sha;
        }
      }
      const cleanDb = engine.sanitizeDatabaseForExternalUse(rebasedDatabase || db);
      const base64Body = toBase64Utf8(cleanDb);
      const putBody = {
        message: "sync: update researchflow database",
        content: base64Body,
        branch
      };
      if (sha) putBody.sha = sha;
      let response = await engine.fetchWithTimeout(dbUrl, {
        method: "PUT",
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github.v3+json"
        },
        body: JSON.stringify(putBody)
      });
      if (response.status === 409 || response.status === 422) {
        const latestRemote = await this.fetchFromGitHub(engine, config);
        if (latestRemote?._github_sha) {
          const rebased = await engine.mergeDatabases(rebasedDatabase || db, latestRemote);
          rebasedDatabase = rebased;
          const retryBody = {
            message: "sync: merge and update researchflow database",
            content: toBase64Utf8(engine.sanitizeDatabaseForExternalUse(rebased)),
            branch,
            sha: latestRemote._github_sha
          };
          response = await engine.fetchWithTimeout(dbUrl, {
            method: "PUT",
            headers: {
              "Authorization": `token ${token}`,
              "Content-Type": "application/json",
              "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify(retryBody)
          });
        }
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`GitHub save failed: ${err.message || response.statusText}`);
      }
      const saved = await response.json().catch(() => null);
      if (rebasedDatabase) {
        Object.keys(db).forEach((key) => delete db[key]);
        Object.assign(db, rebasedDatabase);
      }
      if (saved?.content?.sha) db._github_sha = saved.content.sha;
    }
  };
  if (typeof globalThis !== "undefined") {
    globalThis.CloudSyncProvider = CloudSyncProvider;
    globalThis.RFCloudSync = CloudSyncProvider;
  }
  if (typeof window !== "undefined") {
    window.CloudSyncProvider = CloudSyncProvider;
    window.RFCloudSync = CloudSyncProvider;
  }
  if (typeof globalThis.module !== "undefined" && globalThis.module?.exports) {
    globalThis.module.exports = CloudSyncProvider;
  }

  // src/modules/storage/base.ts
  var StorageBase = class {
    cache = null;
    loadPromise = null;
    syncing = false;
    deviceIdPromise = null;
    syncTimer = null;
    syncCredentials = null;
    commitQueue;
    enqueueCommit;
    _activeEditorSaves;
    _pendingEditorTargets;
    constructor() {
      if (typeof RFPlatform !== "undefined" && RFPlatform.storage?.onChanged) {
        RFPlatform.storage.onChanged.addListener((changes, area) => {
          if (area === "local" && changes[SYNC_CREDENTIALS_KEY]) this.syncCredentials = null;
        });
      }
      this.commitQueue = Promise.resolve();
      this.enqueueCommit = (operation) => {
        const result = this.commitQueue.catch(() => {
        }).then(operation);
        this.commitQueue = result;
        return result;
      };
    }
    isZotero() {
      return Boolean(
        typeof window !== "undefined" && (window.Zotero || window.parent?.Zotero || window.arguments?.[0]?.Zotero) || typeof ZoteroBridge !== "undefined" && ZoteroBridge.isZotero || typeof window !== "undefined" && window.location?.protocol === "chrome:" && window.location?.host === "researchflow"
      );
    }
    getZoteroInstance() {
      if (typeof window === "undefined") return null;
      return window.Zotero || window.parent?.Zotero || window.arguments?.[0]?.Zotero || null;
    }
    async fetchWithTimeout(url, options = {}) {
      const { timeout = 15e3, ...rest } = options;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        return await fetch(url, { ...rest, signal: controller.signal });
      } finally {
        clearTimeout(id);
      }
    }
    async ensureDbShape(data, options = {}) {
      const db = data && typeof data === "object" ? data : {};
      db.schemaVersion = 7;
      db.lastUpdated = typeof db.lastUpdated === "number" ? db.lastUpdated : Date.now();
      db.updatedAt = typeof db.updatedAt === "string" ? db.updatedAt : (/* @__PURE__ */ new Date()).toISOString();
      db.revision = typeof db.revision === "number" && Number.isFinite(db.revision) ? db.revision : 0;
      db.deviceId = typeof db.deviceId === "string" && db.deviceId ? db.deviceId : await this.getDeviceId();
      const collections = ["researchAreas", "projects", "researchRecords", "manuscripts", "submissions", "tasks"];
      collections.forEach((name) => {
        if (!Array.isArray(db[name])) db[name] = [];
      });
      db.deletedEntities = db.deletedEntities && typeof db.deletedEntities === "object" ? db.deletedEntities : {};
      collections.forEach((name) => {
        if (!Array.isArray(db.deletedEntities[name])) db.deletedEntities[name] = [];
      });
      db.settings = db.settings && typeof db.settings === "object" ? db.settings : {};
      if (!db.settings.profile || typeof db.settings.profile !== "object") {
        db.settings.profile = { ...DEFAULT_DB.settings.profile };
      }
      if (!Array.isArray(db.settings.journalPortals) || !db.settings.journalPortals.length) {
        db.settings.journalPortals = [...DEFAULT_DB.settings.journalPortals];
      }
      if (!db.settings.syncProviders || typeof db.settings.syncProviders !== "object") {
        db.settings.syncProviders = { ...DEFAULT_DB.settings.syncProviders };
      }
      if (!db.settings.syncProviders.metadata) {
        db.settings.syncProviders.metadata = { provider: "local", config: {}, autoSync: true };
      }
      delete db.evidenceLocker;
      delete db.aiSettings;
      delete db.settings?.ai;
      delete db.settings?.cloudSync;
      delete db.settings?.evidenceLocker;
      return db;
    }
    async getDeviceId() {
      if (this.cache?.deviceId) return this.cache.deviceId;
      if (this.deviceIdPromise) return this.deviceIdPromise;
      this.deviceIdPromise = (async () => {
        try {
          if (typeof RFPlatform !== "undefined" && RFPlatform.storage?.local?.get) {
            const res = await RFPlatform.storage.local.get("researchflow_device_id");
            if (res?.researchflow_device_id) return res.researchflow_device_id;
            const newId = "dev_" + Math.random().toString(36).substring(2, 10);
            await RFPlatform.storage.local.set({ researchflow_device_id: newId });
            return newId;
          }
        } catch (_) {
        }
        return "dev_default_" + Math.random().toString(36).substring(2, 6);
      })();
      return this.deviceIdPromise;
    }
    deepMerge(target, source) {
      if (!source || typeof source !== "object") return target;
      const output = Array.isArray(target) ? [...target] : { ...target };
      Object.keys(source).forEach((key) => {
        const srcVal = source[key];
        const tgtVal = output[key];
        if (Array.isArray(srcVal)) {
          output[key] = [...srcVal];
        } else if (srcVal && typeof srcVal === "object") {
          output[key] = this.deepMerge(tgtVal && typeof tgtVal === "object" ? tgtVal : {}, srcVal);
        } else {
          output[key] = srcVal;
        }
      });
      return output;
    }
  };

  // src/modules/storage/persistence.ts
  var StoragePersistence = class extends StorageBase {
    async loadAll() {
      if (this.cache) return JSON.parse(JSON.stringify(this.cache));
      if (!this.loadPromise) {
        this.loadPromise = this.loadDatabase().finally(() => {
          this.loadPromise = null;
        });
      }
      return JSON.parse(JSON.stringify(await this.loadPromise));
    }
    async loadDatabase() {
      const zotero = this.getZoteroInstance();
      if (zotero?.ResearchFlow?.loadDatabase) {
        const data = await zotero.ResearchFlow.loadDatabase();
        const normalized = await this.ensureDbShape(data || DEFAULT_DB, { stamp: false });
        this.cache = normalized;
        return this.cache;
      }
      if (this.isZotero()) throw new Error("Zotero database host unavailable. Reopen the ResearchFlow workspace.");
      if (typeof RFPlatform !== "undefined" && RFPlatform.storage?.local) {
        const result = await new Promise((resolve, reject) => {
          RFPlatform.storage.local.get(["researchflow_db"], (res) => {
            const error = RFPlatform.runtime?.lastError;
            if (error) reject(new Error(error.message || "Local storage read failed."));
            else resolve(res);
          });
        });
        let source = result?.researchflow_db;
        if (!source) {
          try {
            const response = await this.fetchWithTimeout(RFPlatform.runtime.getURL("data/preloaded_db.json"));
            if (response.ok) source = await response.json();
          } catch (error) {
            console.warn("Preloaded database unavailable:", error.message);
          }
        }
        const normalized = await this.ensureDbShape(source || DEFAULT_DB, { stamp: false });
        await this.persistLocal(normalized);
        this.cache = normalized;
        return this.cache;
      }
      try {
        const item = typeof localStorage !== "undefined" ? localStorage.getItem("researchflow_db") : null;
        let source = item ? JSON.parse(item) : null;
        if (!source) {
          try {
            const res = await this.fetchWithTimeout("data/preloaded_db.json");
            if (res.ok) source = await res.json();
          } catch (_) {
          }
        }
        const normalized = await this.ensureDbShape(source || DEFAULT_DB, { stamp: false });
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("researchflow_db", JSON.stringify(normalized));
        }
        this.cache = normalized;
        return this.cache;
      } catch (_) {
        const normalized = await this.ensureDbShape(DEFAULT_DB, { stamp: false });
        this.cache = normalized;
        return this.cache;
      }
    }
    async saveAll(data, options = {}) {
      const notify = (state, error = "") => {
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("researchflow-save-state", { detail: { state, error } }));
        }
      };
      notify("saving");
      try {
        const saved = await this.saveDatabase(data, options);
        notify(this.hasPendingEdits(data) ? "pending" : "saved");
        return saved;
      } catch (error) {
        notify("error", error.message);
        throw error;
      }
    }
    async saveDatabase(data, options = {}) {
      if (!this._activeEditorSaves) this._activeEditorSaves = /* @__PURE__ */ new WeakMap();
      this._activeEditorSaves.set(data, (this._activeEditorSaves.get(data) || 0) + 1);
      try {
        return await this.commitEditorDatabase(data, options);
      } finally {
        const remaining = (this._activeEditorSaves.get(data) || 1) - 1;
        if (remaining) this._activeEditorSaves.set(data, remaining);
        else this._activeEditorSaves.delete(data);
      }
    }
    isSaving(target) {
      return Boolean(target && this._activeEditorSaves?.has(target));
    }
    async commitEditorDatabase(data, options = {}) {
      const requested = JSON.parse(JSON.stringify(data));
      const zotero = this.getZoteroInstance();
      if (zotero?.ResearchFlow?.saveDatabase) {
        const dataRevision = Number(requested?.revision);
        const expectedRevision = options.expectedRevision ?? (Number.isFinite(dataRevision) ? dataRevision : void 0);
        const normalized2 = await this.ensureDbShape(JSON.parse(JSON.stringify(requested)), { stamp: true });
        const saved = await zotero.ResearchFlow.saveDatabase(normalized2, { expectedRevision, replace: options.replace === true });
        const adopted2 = this.adoptSavedSnapshot(data, saved, requested);
        try {
          if (await this.shouldRunCloudSync(this.cache)) this.scheduleBackgroundSync();
        } catch (error) {
          console.warn("Cloud sync scheduling unavailable:", error.message);
        }
        return adopted2;
      }
      if (this.isZotero() && typeof ZoteroBridge !== "undefined" && ZoteroBridge.isZotero) {
        const dataRevision = Number(requested?.revision);
        const expectedRevision = options.expectedRevision ?? (Number.isFinite(dataRevision) ? dataRevision : void 0);
        const normalized2 = await this.ensureDbShape(JSON.parse(JSON.stringify(requested)), { stamp: true });
        const response = await ZoteroBridge.request("RESEARCHFLOW_STORAGE_SET", {
          payload: normalized2,
          expectedRevision,
          replace: options.replace === true
        }, 15e3);
        if (!response?.success) throw new Error(response?.error || "Zotero database save failed. Please retry.");
        return this.adoptSavedSnapshot(data, response.data || normalized2, requested);
      }
      const normalized = await this.ensureDbShape(JSON.parse(JSON.stringify(requested)), { stamp: true });
      await this.persistLocal(normalized);
      const adopted = this.adoptSavedSnapshot(data, normalized, requested);
      if (typeof RFPlatform !== "undefined" && RFPlatform.runtime?.sendMessage) {
        RFPlatform.runtime.sendMessage({ action: "DATABASE_UPDATED", data: this.cache }).catch(() => {
        });
      }
      try {
        if (await this.shouldRunCloudSync(this.cache)) this.scheduleBackgroundSync();
      } catch (error) {
        console.warn("Cloud sync scheduling unavailable:", error.message);
      }
      return adopted;
    }
    hasPendingEdits(target) {
      return Boolean(target && this._pendingEditorTargets?.has(target));
    }
    mergePendingEdits(before, local, committed) {
      const missing = /* @__PURE__ */ Symbol("missing");
      const object = (value) => value !== missing && value !== null && typeof value === "object" && !Array.isArray(value);
      const same = (a, b) => {
        if (a === b) return true;
        if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
        if (object(a) && object(b)) return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((key) => Object.hasOwn(b, key) && same(a[key], b[key]));
        return false;
      };
      const identified = (value) => Array.isArray(value) && value.every((item) => object(item) && (typeof item.id === "string" || typeof item.id === "number" && Number.isFinite(item.id))) && new Set(value.map((item) => String(item.id))).size === value.length;
      const conflicts = [];
      const merge = (base, edited, latest, path = "") => {
        if (same(base, edited)) return latest;
        if (same(base, latest) || same(edited, latest)) return edited;
        if (object(base) && object(edited) && object(latest)) {
          const result = {};
          for (const key of /* @__PURE__ */ new Set([...Object.keys(latest), ...Object.keys(edited), ...Object.keys(base)])) {
            if (["__proto__", "constructor", "prototype"].includes(key)) continue;
            const value = (obj) => Object.hasOwn(obj, key) ? obj[key] : missing;
            const combined = !path && ["revision", "lastUpdated", "updatedAt", "deviceId"].includes(key) ? value(latest) : merge(value(base), value(edited), value(latest), path ? path + "." + key : key);
            if (combined !== missing) result[key] = combined;
          }
          return result;
        }
        if (identified(base) && identified(edited) && identified(latest)) {
          const map = (list) => new Map(list.map((item) => [String(item.id), item]));
          const old = map(base), ours = map(edited), theirs = map(latest);
          const common = new Set([...old.keys()].filter((id) => ours.has(id) && theirs.has(id)));
          const order = (entries) => [...entries.keys()].filter((id) => common.has(id));
          const oursMoved = !same(order(old), order(ours));
          const theirsMoved = !same(order(old), order(theirs));
          if (oursMoved && theirsMoved && !same(order(ours), order(theirs))) conflicts.push(path + ".order");
          const preferred = oursMoved && !theirsMoved ? ours : theirs;
          const result = [];
          for (const id of /* @__PURE__ */ new Set([...preferred.keys(), ...theirs.keys(), ...ours.keys(), ...old.keys()])) {
            const entry = (entries) => entries.has(id) ? entries.get(id) : missing;
            const combined = merge(entry(old), entry(ours), entry(theirs), path + "[" + id + "]");
            if (combined !== missing) result.push(combined);
          }
          return result;
        }
        conflicts.push(path);
        return latest;
      };
      return { data: merge(before, local, committed), pending: !same(before, local), conflicts };
    }
    adoptSavedSnapshot(target, savedSnapshot, requested) {
      if (Number(this.cache?.revision) > Number(savedSnapshot?.revision) || Number(target?.revision) > Number(savedSnapshot?.revision)) return target;
      this.cache = JSON.parse(JSON.stringify(savedSnapshot));
      if (target && savedSnapshot && target !== savedSnapshot && typeof target === "object" && !Array.isArray(target)) {
        if (!this._pendingEditorTargets) this._pendingEditorTargets = /* @__PURE__ */ new WeakSet();
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
    scheduleBackgroundSync(delayMs = 1e3) {
      if (this.syncTimer) clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(() => {
        this.syncTimer = null;
        this.syncDatabaseNow?.().catch(console.error);
      }, delayMs);
    }
    async persistLocal(data, options = {}) {
      const zotero = this.getZoteroInstance();
      if (zotero?.ResearchFlow?.saveDatabase) {
        return await zotero.ResearchFlow.saveDatabase(data, options);
      }
      if (this.isZotero()) {
        if (typeof ZoteroBridge === "undefined" || !ZoteroBridge.isZotero) {
          throw new Error("Zotero database host unavailable. Reopen the ResearchFlow workspace.");
        }
        const response = await ZoteroBridge.request("RESEARCHFLOW_STORAGE_SET", {
          payload: data,
          expectedRevision: options.expectedRevision,
          replace: options.replace === true
        }, 15e3);
        if (!response?.success) throw new Error(response?.error || "Zotero database save failed. Please retry.");
        return response.data || data;
      }
      const safeData = this.sanitizeDatabaseForExternalUse(data);
      if (typeof RFPlatform !== "undefined" && RFPlatform.storage?.local) {
        await new Promise((resolve, reject) => {
          RFPlatform.storage.local.set({ researchflow_db: safeData }, () => {
            const error = RFPlatform.runtime?.lastError;
            if (error) reject(new Error(error.message || "Local storage write failed."));
            else resolve();
          });
        });
        return data;
      }
      if (typeof localStorage === "undefined") {
        throw new Error(typeof t === "function" ? t("localStorageUnavailable") : "Local storage unavailable. Reopen the workspace and retry.");
      }
      localStorage.setItem("researchflow_db", JSON.stringify(safeData));
      return data;
    }
  };

  // src/modules/storage/tombstones.ts
  var StorageTombstones = class extends StoragePersistence {
    recordEntityDeletion(database, collectionName, entityId) {
      if (!database || !entityId || !Array.isArray(database?.[collectionName])) return false;
      database.deletedEntities = database.deletedEntities && typeof database.deletedEntities === "object" ? database.deletedEntities : {};
      const existing = this.normalizeDeletionTombstones(database.deletedEntities[collectionName]);
      const deletedAt = (/* @__PURE__ */ new Date()).toISOString();
      database.deletedEntities[collectionName] = existing.filter((item) => String(item.id) !== String(entityId)).concat({
        id: String(entityId),
        deletedAt,
        deviceId: String(database.deviceId || "")
      });
      database[collectionName] = database[collectionName].filter((item) => String(item?.id) !== String(entityId));
      return true;
    }
    normalizeDeletionTombstones(items) {
      const byId = /* @__PURE__ */ new Map();
      (Array.isArray(items) ? items : []).forEach((item) => {
        if (!item || typeof item !== "object" || !String(item.id || "").trim()) return;
        const normalized = {
          id: String(item.id),
          deletedAt: item.deletedAt || item.updatedAt || (/* @__PURE__ */ new Date(0)).toISOString(),
          deviceId: String(item.deviceId || "")
        };
        const previous = byId.get(normalized.id);
        if (!previous || this.getEntityTimestamp(normalized) >= this.getEntityTimestamp(previous)) {
          byId.set(normalized.id, normalized);
        }
      });
      return Array.from(byId.values());
    }
    getEntityTimestamp(item) {
      const timestamp = new Date(item?.deletedAt || item?.updatedAt || item?.createdAt || 0).getTime();
      return Number.isFinite(timestamp) ? timestamp : 0;
    }
    filterDeletedEntities(items, tombstones) {
      const deletedById = new Map(
        this.normalizeDeletionTombstones(tombstones).map((item) => [item.id, item])
      );
      return (Array.isArray(items) ? items : []).filter((item) => {
        const tombstone = deletedById.get(String(item?.id || ""));
        if (!tombstone) return true;
        return this.getEntityTimestamp(item) > this.getEntityTimestamp(tombstone);
      });
    }
    getSyncConfigurationIssue(metadataProvider) {
      const provider = String(metadataProvider?.provider || "local").trim().toLowerCase();
      const config = metadataProvider?.config && typeof metadataProvider.config === "object" ? metadataProvider.config : {};
      if (provider === "local") return null;
      if (provider === "webdav") {
        const url = String(config.url || "").trim();
        if (!url) return "WebDAV URL is required.";
        try {
          const parsed = new URL(url);
          if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
            return "Invalid WebDAV URL";
          }
        } catch (_) {
          return "Invalid WebDAV URL";
        }
        if (!String(config.username || "").trim() || !String(config.password || "").trim()) {
          return "WebDAV username and app password are required.";
        }
        return null;
      }
      if (provider === "github") {
        if (!String(config.token || "").trim()) return "GitHub token is required.";
        if (!/^[^/\s]+\/[^/\s]+$/.test(String(config.repo || "").trim())) {
          return "GitHub repository must use the owner/repository format.";
        }
        return null;
      }
      return `Unsupported sync provider: ${provider}`;
    }
    async shouldRunCloudSync(database = this.cache) {
      const metadata = database?.settings?.syncProviders?.metadata;
      if (metadata?.autoSync === false) return false;
      const metadataProvider = await this.getEffectiveMetadataProvider(database);
      return metadataProvider.provider !== "local" && !this.getSyncConfigurationIssue(metadataProvider);
    }
    getPublicSyncConfig(provider, config = {}) {
      if (provider === "webdav") {
        return { url: String(config.url || "").trim() };
      }
      if (provider === "github") {
        return {
          repo: String(config.repo || "").trim(),
          branch: String(config.branch || "main").trim() || "main"
        };
      }
      return {};
    }
    getCredentialPatch(provider, config = {}) {
      if (provider === "webdav") {
        return {
          username: String(config.username || "").trim(),
          password: String(config.password || "")
        };
      }
      if (provider === "github") {
        return { token: String(config.token || "").trim() };
      }
      return {};
    }
    async loadSyncCredentials() {
      if (this.syncCredentials) return this.deepMerge({}, this.syncCredentials);
      const zotero = this.getZoteroInstance();
      if (zotero?.Prefs) {
        try {
          const raw = zotero.Prefs.get("extensions.researchflow.syncCredentials", true);
          this.syncCredentials = raw ? JSON.parse(raw) : {};
          return this.deepMerge({}, this.syncCredentials);
        } catch (_) {
        }
      }
      if (typeof RFPlatform !== "undefined" && RFPlatform.storage?.local) {
        this.syncCredentials = await new Promise((resolve, reject) => {
          RFPlatform.storage.local.get([SYNC_CREDENTIALS_KEY], (result) => {
            if (RFPlatform.runtime?.lastError) {
              reject(new Error(RFPlatform.runtime.lastError.message));
              return;
            }
            const stored = result?.[SYNC_CREDENTIALS_KEY];
            resolve(stored && typeof stored === "object" ? stored : {});
          });
        });
        return this.deepMerge({}, this.syncCredentials);
      }
      try {
        const stored = typeof localStorage !== "undefined" ? localStorage.getItem(SYNC_CREDENTIALS_KEY) : null;
        this.syncCredentials = stored ? JSON.parse(stored) : {};
      } catch (_) {
        this.syncCredentials = {};
      }
      return this.deepMerge({}, this.syncCredentials);
    }
    async saveSyncCredentials(provider, config = {}) {
      const credentials = await this.loadSyncCredentials();
      if (provider === "webdav" || provider === "github") {
        credentials[provider] = this.getCredentialPatch(provider, config);
      }
      const zotero = this.getZoteroInstance();
      if (zotero?.Prefs) {
        try {
          zotero.Prefs.set("extensions.researchflow.syncCredentials", JSON.stringify(credentials), true);
        } catch (_) {
        }
      }
      if (typeof RFPlatform !== "undefined" && RFPlatform.storage?.local) {
        await new Promise((resolve, reject) => {
          RFPlatform.storage.local.set({ [SYNC_CREDENTIALS_KEY]: credentials }, () => {
            if (RFPlatform.runtime?.lastError) reject(new Error(RFPlatform.runtime.lastError.message));
            else resolve();
          });
        });
      } else {
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(SYNC_CREDENTIALS_KEY, JSON.stringify(credentials));
          }
        } catch (_) {
        }
      }
      this.syncCredentials = credentials;
      return this.getCredentialPatch(provider, credentials[provider] || {});
    }
    async migrateSyncCredentials(database) {
      const metadata = database?.settings?.syncProviders?.metadata;
      if (!metadata || typeof metadata !== "object") return;
      const provider = String(metadata.provider || "local").trim().toLowerCase();
      const config = metadata.config && typeof metadata.config === "object" ? metadata.config : {};
      const credentialPatch = this.getCredentialPatch(provider, config);
      if (Object.values(credentialPatch).some(Boolean)) {
        await this.saveSyncCredentials(provider, credentialPatch);
      } else {
        await this.loadSyncCredentials();
      }
      metadata.config = this.getPublicSyncConfig(provider, config);
    }
    async getEffectiveMetadataProvider(database = this.cache) {
      const metadata = database?.settings?.syncProviders?.metadata || { provider: "local", config: {} };
      const provider = String(metadata.provider || "local").trim().toLowerCase();
      const credentials = await this.loadSyncCredentials();
      return {
        provider,
        config: {
          ...this.getPublicSyncConfig(provider, metadata.config),
          ...credentials[provider] || {}
        }
      };
    }
    sanitizeDatabaseForExternalUse(database) {
      const sanitized = JSON.parse(JSON.stringify(database || {}));
      const metadata = sanitized?.settings?.syncProviders?.metadata;
      if (metadata) {
        metadata.config = this.getPublicSyncConfig(metadata.provider, metadata.config);
      }
      const scrub = (value) => {
        if (!value || typeof value !== "object") return;
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
    normalizeEntityMetadata(database) {
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      [
        "researchAreas",
        "projects",
        "researchRecords",
        "manuscripts",
        "submissions",
        "tasks"
      ].forEach((collectionName) => {
        database[collectionName].forEach((entity) => {
          if (!entity || typeof entity !== "object") return;
          if (!entity.id) entity.id = `${collectionName}_${Math.random().toString(36).slice(2, 9)}`;
          if (!entity.createdAt) entity.createdAt = entity.updatedAt || database.updatedAt || nowIso;
          if (!entity.updatedAt) entity.updatedAt = entity.createdAt || database.updatedAt || nowIso;
        });
      });
    }
  };

  // src/modules/storage/cloud.ts
  var StorageCloudSync = class extends StorageTombstones {
    async testConnection(provider, config) {
      try {
        if (provider === "webdav") {
          const { url, username, password } = config;
          if (!url || !username || !password) throw new Error("Missing configuration fields");
          await this.ensureHostPermissionForUrl(url);
          const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
          const headers = new Headers();
          const credentialBytes = new TextEncoder().encode(`${username}:${password}`);
          headers.set("Authorization", "Basic " + btoa(String.fromCharCode(...credentialBytes)));
          const response = await this.fetchWithTimeout(cleanUrl, {
            method: "PROPFIND",
            headers,
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
        } else if (provider === "github") {
          const { token, repo } = config;
          if (!token || !repo) throw new Error("Missing token or repository");
          const response = await this.fetchWithTimeout(`https://api.github.com/repos/${repo}`, {
            headers: {
              "Authorization": `token ${token}`,
              "Accept": "application/vnd.github.v3+json"
            }
          });
          if (response.ok) {
            return { success: true };
          } else {
            const errData = await response.json().catch(() => ({}));
            return { success: false, error: errData.message || `GitHub error ${response.status}` };
          }
        } else if (provider === "local") {
          return { success: true };
        }
        return { success: false, error: "Unsupported provider" };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    async syncDatabaseNow() {
      if (this.syncing) return { success: false, error: "Sync already in progress" };
      this.syncing = true;
      try {
        const initial = await this.loadAll();
        const provider = await this.getEffectiveMetadataProvider(initial);
        if (provider.provider === "local") return { success: true, localOnly: true };
        const issue = this.getSyncConfigurationIssue(provider);
        if (issue) return { success: false, skipped: true, error: issue };
        const remote = provider.provider === "webdav" ? await this.fetchFromWebDAV(provider.config) : await this.fetchFromGitHub(provider.config);
        const pushDb = await this.enqueueCommit(async () => {
          const latest = await this.loadAll();
          const merged = remote ? await this.mergeDatabases(latest, remote) : latest;
          const committed = await this.ensureDbShape(merged, { stamp: true });
          const saved = await this.persistLocal(committed, { expectedRevision: latest.revision });
          this.cache = saved || committed;
          if (typeof RFPlatform !== "undefined" && RFPlatform.runtime?.sendMessage) {
            RFPlatform.runtime.sendMessage({ action: "DATABASE_UPDATED", data: this.cache }).catch(() => {
            });
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
          if (typeof RFPlatform !== "undefined" && RFPlatform.runtime?.sendMessage) {
            RFPlatform.runtime.sendMessage({ action: "DATABASE_UPDATED", data: this.cache }).catch(() => {
            });
          }
          return hasPending;
        });
        if (pending) this.scheduleBackgroundSync();
        return { success: true, pending };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        this.syncing = false;
      }
    }
    async saveToCloud(provider, config, db) {
      if (provider === "webdav") {
        await this.saveToWebDAV(config, db);
      } else if (provider === "github") {
        await this.saveToGitHub(config, db);
      }
    }
    async mergeDatabases(localDb, remoteDb) {
      const local = await this.ensureDbShape(localDb, { stamp: false });
      const remote = await this.ensureDbShape(remoteDb, { stamp: false, migrateCredentials: false });
      const merged = this.deepMerge(local, remote);
      [
        "researchAreas",
        "projects",
        "researchRecords",
        "manuscripts",
        "submissions",
        "tasks"
      ].forEach((collectionName) => {
        merged.deletedEntities[collectionName] = this.normalizeDeletionTombstones([
          ...local.deletedEntities?.[collectionName] || [],
          ...remote.deletedEntities?.[collectionName] || []
        ]);
        merged[collectionName] = this.filterDeletedEntities(
          this.mergeEntityArray(local[collectionName], remote[collectionName]),
          merged.deletedEntities[collectionName]
        );
      });
      merged.settings = local.settings;
      merged._github_sha = remote._github_sha || local._github_sha;
      merged._webdav_etag = remote._webdav_etag !== void 0 ? remote._webdav_etag : local._webdav_etag;
      merged.lastUpdated = Math.max(Number(local.lastUpdated) || 0, Number(remote.lastUpdated) || 0);
      merged.updatedAt = new Date(merged.lastUpdated || Date.now()).toISOString();
      merged.revision = Math.max(Number(local.revision) || 0, Number(remote.revision) || 0);
      return merged;
    }
    mergeEntityArray(localItems = [], remoteItems = []) {
      const byId = /* @__PURE__ */ new Map();
      [...localItems, ...remoteItems].forEach((item) => {
        if (!item || typeof item !== "object") return;
        const id = item.id || `${item.title || item.name || "entity"}_${item.createdAt || ""}`;
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
    pickNewerEntity(a, b) {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      if (timeA === timeB) return this.deepMerge(a, b);
      return timeB > timeA ? this.deepMerge(a, b) : this.deepMerge(b, a);
    }
    hasMeaningfulChanges(a, b) {
      const clean = (value) => {
        const clone = JSON.parse(JSON.stringify(value || {}));
        delete clone.lastUpdated;
        delete clone.updatedAt;
        delete clone.revision;
        delete clone._github_sha;
        return clone;
      };
      return JSON.stringify(clean(a)) !== JSON.stringify(clean(b));
    }
    _getCloudProvider() {
      if (typeof CloudSyncProvider !== "undefined") return CloudSyncProvider;
      if (typeof globalThis !== "undefined" && globalThis.CloudSyncProvider) return globalThis.CloudSyncProvider;
      if (typeof window !== "undefined" && window.CloudSyncProvider) return window.CloudSyncProvider;
      return null;
    }
    async fetchFromWebDAV(config) {
      const provider = this._getCloudProvider();
      if (provider?.fetchFromWebDAV) return provider.fetchFromWebDAV(this, config);
      throw new Error("CloudSyncProvider is not available");
    }
    async saveToWebDAV(config, db) {
      const provider = this._getCloudProvider();
      if (provider?.saveToWebDAV) return provider.saveToWebDAV(this, config, db);
      throw new Error("CloudSyncProvider is not available");
    }
    async ensureHostPermissionForUrl(url) {
      const provider = this._getCloudProvider();
      if (provider?.ensureHostPermissionForUrl) return provider.ensureHostPermissionForUrl(url);
      throw new Error("CloudSyncProvider is not available");
    }
    async fetchFromGitHub(config) {
      const provider = this._getCloudProvider();
      if (provider?.fetchFromGitHub) return provider.fetchFromGitHub(this, config);
      throw new Error("CloudSyncProvider is not available");
    }
    async saveToGitHub(config, db) {
      const provider = this._getCloudProvider();
      if (provider?.saveToGitHub) return provider.saveToGitHub(this, config, db);
      throw new Error("CloudSyncProvider is not available");
    }
  };

  // src/modules/storage.ts
  var StorageEngine = class extends StorageCloudSync {
  };
  var storage = new StorageEngine();
  if (typeof globalThis !== "undefined") {
    globalThis.DEFAULT_DB = DEFAULT_DB;
    globalThis.SYNC_CREDENTIALS_KEY = SYNC_CREDENTIALS_KEY;
    globalThis.StorageEngine = StorageEngine;
    globalThis.storage = storage;
  }
  if (typeof window !== "undefined") {
    window.DEFAULT_DB = DEFAULT_DB;
    window.SYNC_CREDENTIALS_KEY = SYNC_CREDENTIALS_KEY;
    window.StorageEngine = StorageEngine;
    window.storage = storage;
  }
})();
