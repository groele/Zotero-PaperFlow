/**
 * Zotero PaperFlow - UI Platform Adapter
 * Device-local UI state and messages for the Zotero workspace.
 * Emulates web extension storage/runtime API inside the Zotero workspace HTML page.
 */

export function initUiPlatform(): void {
  if (typeof window === 'undefined' || window.location?.protocol !== 'chrome:' || window.location?.host !== 'researchflow') return;

  const listeners = new Set<Function>();
  const changeListeners = new Set<Function>();
  const prefix = 'researchflow.zotero.ui.';
  const emit = (message: any) => {
    for (const listener of listeners) {
      try { listener(message, {}, () => {}); } catch (error) { console.error('[PaperFlow] UI listener failed:', error); }
    }
  };
  const keysOf = (keys: any): string[] => Array.isArray(keys) ? keys : typeof keys === 'string' ? [keys] : keys && typeof keys === 'object' ? Object.keys(keys) : [];
  const host = () => {
    try { return (window.Zotero || window.parent?.Zotero || window.arguments?.[0]?.Zotero)?.ResearchFlow; }
    catch (_) { return null; }
  };
  const read = (key: string) => {
    const value = window.localStorage.getItem(prefix + key);
    return value === null ? undefined : JSON.parse(value);
  };
  const readAll = async (keys: string[] = []): Promise<Record<string, any>> => {
    if (host()?.loadUiState) return host().loadUiState();
    const result: Record<string, any> = {};
    for (const key of keys) result[key] = read(key);
    return result;
  };
  const finish = (operation: () => Promise<any>, callback?: (res: any) => void): Promise<any> => {
    const result = Promise.resolve().then(operation);
    if (typeof callback !== 'function') return result;
    return result.then((value) => {
      callback(value);
      return value;
    }, (error) => {
      console.error('[PaperFlow] Zotero compatibility operation failed:', error);
      (globalThis as any).RFPlatform.runtime.lastError = { message: String(error?.message || error) };
      try { callback(undefined); } finally { delete (globalThis as any).RFPlatform.runtime.lastError; }
      return undefined;
    });
  };
  const local = {
    get(keys: any, callback?: (res: any) => void) {
      return finish(async () => {
        const stored = await readAll(keysOf(keys));
        const result: Record<string, any> = keys && !Array.isArray(keys) && typeof keys === 'object' ? { ...keys } : {};
        for (const key of keysOf(keys)) {
          const value = stored[key];
          if (value !== undefined) result[key] = value;
        }
        return result;
      }, callback);
    },
    set(values: any, callback?: () => void) {
      return finish(async () => {
        const stored = await readAll(Object.keys(values || {}));
        const changes: Record<string, any> = {};
        for (const [key, value] of Object.entries(values || {})) {
          changes[key] = { oldValue: stored[key], newValue: value };
        }
        if (host()?.updateUiState) await host().updateUiState(values);
        else for (const [key, value] of Object.entries(values || {})) window.localStorage.setItem(prefix + key, JSON.stringify(value));
        for (const listener of changeListeners) listener(changes, 'local');
      }, callback);
    },
    remove(keys: any, callback?: () => void) {
      return finish(async () => {
        const stored = await readAll(keysOf(keys));
        const changes: Record<string, any> = {};
        for (const key of keysOf(keys)) {
          changes[key] = { oldValue: stored[key], newValue: undefined };
        }
        if (host()?.updateUiState) await host().updateUiState({}, keysOf(keys));
        else for (const key of keysOf(keys)) window.localStorage.removeItem(prefix + key);
        for (const listener of changeListeners) listener(changes, 'local');
      }, callback);
    }
  };

  (globalThis as any).RFPlatform = {
    runtime: {
      onMessage: { addListener: (listener: Function) => listeners.add(listener), removeListener: (listener: Function) => listeners.delete(listener) },
      getURL: (path: string) => `chrome://researchflow/content/${String(path || '').replace(/^\/+/, '')}`,
      sendMessage(message: any, callback?: (res: any) => void) {
        const operation = async () => {
          if (message?.action === 'DATABASE_UPDATED' || message?.action === 'SYNC_STATE') {
            emit(message);
            return { success: true };
          }
          throw new Error(`Unsupported Zotero runtime request: ${message?.action || 'unknown'}`);
        };
        return finish(operation, callback);
      }
    },
    storage: {
      local,
      onChanged: { addListener: (listener: Function) => changeListeners.add(listener), removeListener: (listener: Function) => changeListeners.delete(listener) }
    }
  };
}

initUiPlatform();

export const RFPlatformAdapter = {
  initUiPlatform
};
