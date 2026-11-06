"use strict";
(() => {
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
  var RFCloudSync = CloudSyncProvider;
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
})();
