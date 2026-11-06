/**
 * Zotero PaperFlow - Database 3-Way Conflict Recovery Engine
 */
declare var Zotero: any;
declare var IOUtils: any;
declare var PathUtils: any;

export const hostDatabaseRecoveryMethods = {
  recoveryFile(this: any, id: string) {
    const name = PathUtils.filename(this.getDataFilePath());
    const prefix = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (typeof id !== 'string' || !new RegExp(`^${prefix}\\.conflict-\\d+-[a-z0-9]+\\.json$`).test(id)) {
      throw this.databaseError('recovery-invalid');
    }
    return PathUtils.join(PathUtils.parent(this.getDataFilePath()), id);
  },

  async readRecoveryJSON(this: any, file: string) {
    const info = await IOUtils.stat(file);
    if (info.type !== 'regular' || info.size > 32 * 1024 * 1024) throw this.databaseError('recovery-size');
    const text = await IOUtils.readUTF8(file);
    return { data: JSON.parse(text), fingerprint: Zotero.Utilities.Internal.md5(text) };
  },

  recoveryToken(this: any, value: any) {
    if (!this._recoveryTokens) this._recoveryTokens = new Map();
    for (const [key, item] of this._recoveryTokens) {
      if (Date.now() - item.time > 10 * 60 * 1000) this._recoveryTokens.delete(key);
    }
    if (typeof value === 'string') {
      const item = this._recoveryTokens.get(value);
      if (!item) throw this.databaseError('recovery-expired');
      return item;
    }
    while (this._recoveryTokens.size >= 8) this._recoveryTokens.delete(this._recoveryTokens.keys().next().value);
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this._recoveryTokens.set(token, { ...value, time: Date.now() });
    return token;
  },

  async readRecoveryState(this: any, id: string) {
    const file = this.recoveryFile(id);
    if (await IOUtils.exists(`${file}.resolved.json`)) throw this.databaseError('recovery-resolved');
    const draft = await this.readRecoveryJSON(file);
    if (draft.data.format !== 'zotero-paperflow-conflict-v1') throw this.databaseError('recovery-invalid');
    if (!draft.data.base) throw this.databaseError('recovery-base');
    for (const value of [draft.data.base, draft.data.local, draft.data.current]) this.validateDatabase(value);
    // Recovery must see disk changes even when the ordinary host cache is populated.
    const current = await this.readRecoveryJSON(this.getDataFilePath());
    this.validateDatabase(current.data);
    return { file, draft, current };
  },

  recoveryChanges(this: any, before: any, after: any) {
    const rows: any[] = [];
    const object = (value: any) => value !== null && typeof value === 'object' && !Array.isArray(value);
    const visit = (oldValue: any, newValue: any, path: string, oldExists = true, newExists = true) => {
      if (oldExists === newExists && JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
      if (oldExists && newExists && object(oldValue) && object(newValue)) {
        for (const key of new Set([...Object.keys(oldValue), ...Object.keys(newValue)])) {
          if (!path && ['revision', 'lastUpdated', 'updatedAt', 'deviceId'].includes(key)) continue;
          visit(oldValue[key], newValue[key], path ? `${path}.${key}` : key, Object.hasOwn(oldValue, key), Object.hasOwn(newValue, key));
        }
        return;
      }
      const identified = (value: any) => Array.isArray(value) && value.every(item => object(item) && Object.hasOwn(item, 'id'))
        && new Set(value.map(item => String(item.id))).size === value.length;
      if (oldExists && newExists && identified(oldValue) && identified(newValue)) {
        const old = new Map(oldValue.map((item: any) => [String(item.id), item]));
        const next = new Map(newValue.map((item: any) => [String(item.id), item]));
        if (JSON.stringify([...old.keys()]) !== JSON.stringify([...next.keys()])) {
          rows.push({ path: `${path}.order`, before: { exists: true, value: [...old.keys()] }, after: { exists: true, value: [...next.keys()] } });
        }
        for (const id of new Set([...old.keys(), ...next.keys()])) visit(old.get(id), next.get(id), `${path}[${id}]`, old.has(id), next.has(id));
      } else rows.push({ path, before: oldExists ? { exists: true, value: oldValue } : { exists: false },
        after: newExists ? { exists: true, value: newValue } : { exists: false } });
      if (rows.length > 500) throw this.databaseError('recovery-size');
    };
    visit(before, after, '');
    return rows;
  },

  recoveryDisplay(this: any, rows: any[]) {
    const redact = (value: any, key = ''): any => {
      if (/(password|secret|token|api.?key|authorization)/i.test(key)) return '••••••';
      if (Array.isArray(value)) return value.map(item => redact(item));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
      return value;
    };
    return rows.map((row: any) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
      if (!['base', 'local', 'current', 'before', 'after'].includes(key)) return [key, value];
      if (!(value as any)?.exists) return [key, value];
      const text = JSON.stringify(redact((value as any).value, row.path), null, 2);
      return [key, { exists: true, text: text.slice(0, 12000), truncated: text.length > 12000 }];
    })));
  },

  async databaseConflictRecovery(this: any, action: any, payload: any = {}) {
    return this.enqueueDatabaseOperation(async () => {
      if (action === 'list') {
        const paths = await IOUtils.getChildren(PathUtils.parent(this.getDataFilePath()));
        const entries: any[] = [];
        for (const path of paths) {
          const id = PathUtils.filename(path);
          try { this.recoveryFile(id); } catch (_) { continue; }
          entries.push({ id, createdAt: Number(id.match(/\.conflict-(\d+)-/)[1]) });
        }
        entries.sort((a: any, b: any) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
        const visible = entries.slice(0, 100);
        for (const item of visible) item.resolved = await IOUtils.exists(`${this.recoveryFile(item.id)}.resolved.json`);
        return { entries: visible, truncated: entries.length > visible.length };
      }
      if (!['inspect', 'preview', 'apply'].includes(action)) throw this.databaseError('recovery-invalid');
      const previous = action === 'inspect' ? null : this.recoveryToken(payload.token);
      if (previous && previous.stage !== (action === 'preview' ? 'inspect' : 'preview')) throw this.databaseError('recovery-expired');
      const id = previous?.id || payload.id;
      const state = await this.readRecoveryState(id);
      const { draft, current, file } = state;
      if (previous && (previous.draft !== draft.fingerprint || previous.current !== current.fingerprint)) throw this.databaseError('recovery-stale');
      const choices = action === 'apply' ? previous.choices : payload.choices;
      const merge = this.mergeDatabaseEdits(draft.data.base, draft.data.local, current.data, { details: true, choices });
      if (merge.details.length > 500) throw this.databaseError('recovery-size');
      const stamp = { id, draft: draft.fingerprint, current: current.fingerprint };
      if (action === 'inspect') return { id, createdAt: draft.data.createdAt, revision: current.data.revision,
        rows: this.recoveryDisplay(merge.details), token: this.recoveryToken({ ...stamp, stage: 'inspect' }) };
      const keys = merge.details.map((row: any) => row.key);
      if (!choices || typeof choices !== 'object' || Array.isArray(choices) || Object.keys(choices).length !== keys.length
        || !keys.every((key: string) => Object.hasOwn(choices, key) && ['base', 'local', 'current'].includes(choices[key]))) {
        throw this.databaseError('recovery-choice');
      }
      this.validateDatabase(merge.data);
      const changes = this.recoveryChanges(current.data, merge.data);
      if (action === 'preview') return { revision: current.data.revision, changes: this.recoveryDisplay(changes),
        token: this.recoveryToken({ ...stamp, stage: 'preview', choices: this.cloneDatabase(choices) }) };
      if (!changes.length) throw this.databaseError('recovery-empty');
      const backup = `${this.getDataFilePath()}.before-recovery-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
      await IOUtils.writeUTF8(backup, JSON.stringify(current.data, null, 2), { tmpPath: `${backup}.tmp` });
      // Backup I/O yields to other processes; never commit over changes made during that await.
      const lastRead = await this.readRecoveryJSON(this.getDataFilePath());
      if (lastRead.fingerprint !== current.fingerprint) throw this.databaseError('recovery-stale');
      this._cachedData = this.cloneDatabase(current.data);
      this.rememberDatabaseSnapshot(current.data);
      const saved = await this.writeDatabaseSnapshot(merge.data);
      this._recoveryTokens.delete(payload.token);
      let warning = false;
      try {
        await IOUtils.writeUTF8(`${file}.resolved.json`, JSON.stringify({ format: 'zotero-paperflow-resolution-v1',
          resolvedAt: new Date().toISOString(), revision: saved.revision, backup: PathUtils.filename(backup) }), { tmpPath: `${file}.resolved.json.tmp` });
      } catch (error) { warning = true; Zotero.logError?.(error); }
      return { data: saved, backup: PathUtils.filename(backup), warning };
    });
  },

  async preserveDatabaseConflict(this: any, base: any, local: any, current: any, conflicts: any) {
    const file = `${this.getDataFilePath()}.conflict-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
    const draft = { format: 'zotero-paperflow-conflict-v1', createdAt: new Date().toISOString(),
      conflicts, base, local, current };
    try {
      await IOUtils.writeUTF8(file, JSON.stringify(draft, null, 2), { tmpPath: `${file}.tmp` });
    } catch (error) {
      throw this.databaseError('conflict-draft-failed', { reason: String((error as any)?.message || error) });
    }
    return this.databaseError('merge-conflict', { fields: conflicts.slice(0, 3).join(', '), file });
  }
};
