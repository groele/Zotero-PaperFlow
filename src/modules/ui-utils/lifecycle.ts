/**
 * Zotero PaperFlow - Scoped AbortController Lifecycle Utilities
 * Manages event listeners, timers, and animation frames per view render, modal, or window.
 */

export type ListenerTarget = {
  addEventListener?: (type: string, listener: any, options?: any) => void;
  removeEventListener?: (type: string, listener: any, options?: any) => void;
};

export interface LifecycleSignal {
  readonly aborted: boolean;
  readonly reason?: unknown;
  addEventListener: (type: string, listener: any, options?: any) => void;
  removeEventListener?: (type: string, listener: any, options?: any) => void;
}

export interface LifecycleScope {
  readonly signal: AbortSignal | LifecycleSignal;
  readonly aborted: boolean;
  abort: (reason?: unknown) => void;
  on: (
    target: ListenerTarget | null | undefined,
    type: string,
    listener: (...args: any[]) => any,
    options?: AddEventListenerOptions | boolean
  ) => () => void;
  setTimeout: (fn: () => void, delay?: number) => number;
  setInterval: (fn: () => void, delay?: number) => number;
  raf: (fn: (ts: number) => void) => number;
  onAbort: (fn: () => void) => () => void;
  child: () => LifecycleScope;
}

function createFallbackController(): { signal: LifecycleSignal; abort: (reason?: unknown) => void } {
  let aborted = false;
  let reason: unknown;
  const listeners = new Set<(evt: any) => void>();
  const signal: LifecycleSignal = {
    get aborted() {
      return aborted;
    },
    get reason() {
      return reason;
    },
    addEventListener(type: string, listener: any) {
      if (type !== 'abort' || typeof listener !== 'function') return;
      if (aborted) {
        try {
          listener({ type: 'abort' });
        } catch (_) {}
        return;
      }
      listeners.add(listener);
    },
    removeEventListener(type: string, listener: any) {
      if (type !== 'abort') return;
      listeners.delete(listener);
    }
  };
  return {
    signal,
    abort(nextReason?: unknown) {
      if (aborted) return;
      aborted = true;
      reason = nextReason;
      const snapshot = Array.from(listeners);
      listeners.clear();
      for (const listener of snapshot) {
        try {
          listener({ type: 'abort' });
        } catch (_) {}
      }
    }
  };
}

function isNativeAbortSignal(signal: unknown): signal is AbortSignal {
  return typeof AbortSignal !== 'undefined' && signal instanceof AbortSignal;
}

export function createLifecycleScope(parentSignal?: AbortSignal | LifecycleSignal | null): LifecycleScope {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : createFallbackController();
  const cleanups = new Set<() => void>();
  let localAborted = false;

  const runCleanups = () => {
    const snapshot = Array.from(cleanups);
    cleanups.clear();
    for (const cleanup of snapshot) {
      try {
        cleanup();
      } catch (_) {}
    }
  };

  const abort = (reason?: unknown) => {
    if (localAborted) return;
    localAborted = true;
    try {
      (controller as any).abort(reason);
    } catch (_) {}
    runCleanups();
  };

  if (parentSignal) {
    if (parentSignal.aborted) {
      abort(parentSignal.reason);
    } else if (typeof parentSignal.addEventListener === 'function') {
      const onParentAbort = () => abort(parentSignal.reason);
      parentSignal.addEventListener('abort', onParentAbort, { once: true });
      cleanups.add(() => {
        try {
          parentSignal.removeEventListener?.('abort', onParentAbort);
        } catch (_) {}
      });
    }
  }

  const scope: LifecycleScope = {
    signal: controller.signal,
    get aborted() {
      return localAborted || Boolean(controller.signal?.aborted);
    },
    abort,
    onAbort(fn: () => void) {
      if (typeof fn !== 'function') return () => {};
      if (scope.aborted) {
        try {
          fn();
        } catch (_) {}
        return () => {};
      }
      cleanups.add(fn);
      return () => {
        cleanups.delete(fn);
      };
    },
    on(target, type, listener, options) {
      if (!target || typeof target.addEventListener !== 'function' || typeof listener !== 'function' || scope.aborted) {
        return () => {};
      }
      const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
      const baseOpts = typeof options === 'boolean' ? { capture: options } : (options ? { ...options } : {});
      const listenerOptions = isNativeAbortSignal(controller.signal)
        ? { ...baseOpts, signal: controller.signal }
        : (typeof options === 'boolean' ? options : options || undefined);
      target.addEventListener(type, listener, listenerOptions);
      const detach = () => {
        cleanups.delete(detach);
        if (typeof target.removeEventListener === 'function') {
          try {
            target.removeEventListener(type, listener, capture);
          } catch (_) {}
        }
      };
      cleanups.add(detach);
      return detach;
    },
    setTimeout(fn, delay = 0) {
      const st = (globalThis as any).setTimeout;
      const ct = (globalThis as any).clearTimeout;
      if (scope.aborted || typeof st !== 'function') return 0;
      let timerId = 0;
      const cancel = () => {
        cleanups.delete(cancel);
        if (timerId && typeof ct === 'function') {
          ct(timerId);
          timerId = 0;
        }
      };
      cleanups.add(cancel);
      timerId = st(() => {
        cleanups.delete(cancel);
        timerId = 0;
        if (!scope.aborted) fn();
      }, delay);
      return timerId;
    },
    setInterval(fn, delay = 0) {
      const si = (globalThis as any).setInterval;
      const ci = (globalThis as any).clearInterval;
      if (scope.aborted || typeof si !== 'function') return 0;
      let timerId = 0;
      const cancel = () => {
        cleanups.delete(cancel);
        if (timerId && typeof ci === 'function') {
          ci(timerId);
          timerId = 0;
        }
      };
      cleanups.add(cancel);
      timerId = si(() => {
        if (!scope.aborted) fn();
      }, delay);
      return timerId;
    },
    raf(fn) {
      const req = (globalThis as any).requestAnimationFrame;
      const can = (globalThis as any).cancelAnimationFrame;
      if (scope.aborted) return 0;
      if (typeof req !== 'function') {
        return scope.setTimeout(() => fn(Date.now()), 0);
      }
      let rafId = 0;
      const cancel = () => {
        cleanups.delete(cancel);
        if (rafId && typeof can === 'function') {
          can(rafId);
          rafId = 0;
        }
      };
      cleanups.add(cancel);
      rafId = req((ts: number) => {
        cleanups.delete(cancel);
        rafId = 0;
        if (!scope.aborted) fn(ts);
      });
      return rafId;
    },
    child() {
      return createLifecycleScope(controller.signal);
    }
  };

  return scope;
}

export function createScopeRegistry<K = string>() {
  const scopes = new Map<K, LifecycleScope>();
  return {
    reset(key: K, parentSignal?: AbortSignal | LifecycleSignal | null): LifecycleScope {
      const prev = scopes.get(key);
      if (prev) prev.abort('re-render');
      const next = createLifecycleScope(parentSignal);
      scopes.set(key, next);
      next.onAbort(() => {
        if (scopes.get(key) === next) {
          scopes.delete(key);
        }
      });
      return next;
    },
    get(key: K): LifecycleScope | undefined {
      return scopes.get(key);
    },
    abort(key: K, reason?: unknown): void {
      const existing = scopes.get(key);
      if (existing) {
        scopes.delete(key);
        existing.abort(reason);
      }
    },
    abortAll(reason?: unknown): void {
      const snapshot = Array.from(scopes.values());
      scopes.clear();
      for (const scope of snapshot) {
        scope.abort(reason);
      }
    }
  };
}

export function resetWeakScope<K extends object>(
  registry: WeakMap<K, LifecycleScope>,
  key: K,
  parentSignal?: AbortSignal | LifecycleSignal | null
): LifecycleScope {
  const prev = registry.get(key);
  if (prev) prev.abort('re-bind');
  const next = createLifecycleScope(parentSignal);
  registry.set(key, next);
  next.onAbort(() => {
    if (registry.get(key) === next) {
      registry.delete(key);
    }
  });
  return next;
}

export function abortWeakScope<K extends object>(
  registry: WeakMap<K, LifecycleScope>,
  key: K,
  reason?: unknown
): void {
  const existing = registry.get(key);
  if (existing) {
    registry.delete(key);
    existing.abort(reason);
  }
}

export function acquireModalScope(): LifecycleScope {
  const g: any = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
  if (typeof g?.getModalLifecycleScope === 'function') {
    return g.getModalLifecycleScope();
  }
  const scope = createLifecycleScope();
  const register = g?.registerModalCleanup || (typeof window !== 'undefined' ? (window as any).registerModalCleanup : null);
  if (typeof register === 'function') {
    register(() => scope.abort('modal-closed'));
  }
  return scope;
}
