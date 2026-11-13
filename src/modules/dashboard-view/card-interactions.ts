declare var db: any;
declare var currentLanguage: string;
declare var ZoteroBridge: any;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function openStageDrawer(subId: string, nodeId: string): void;
declare function toggleInlineStageEditor(card: any, shouldOpen?: boolean | null): void;
declare function syncInlineStagePreset(editor: any): void;
declare function updateInlineStageDeadlineStatus(editor: any): void;
declare function resetInlineStageEditor(editor: any): void;
declare function setInlineStageBusy(editor: any, busy: boolean, message?: string): void;
declare function saveInlineStageEvent(editor: any): Promise<void>;
declare function openSubmissionSharePreview(subId: string, triggerBtn?: any): Promise<void>;
declare function openSubmissionShareModal(subId: string): Promise<void>;
declare function navigateToSubmissionDetails(subId: string): void;
declare function openTimelineEventManager(subId: string): void;
declare function renderDashboard(): void;
declare function showGlobalToast(message: string, type?: string): void;

interface LocalScope {
  on: (target: any, type: string, listener: (...args: any[]) => any, options?: any) => void;
  abort: (reason?: unknown) => void;
}

function createCardScope(): LocalScope {
  const rfui = typeof globalThis !== 'undefined' ? (globalThis as any).RFUI : null;
  if (rfui && typeof rfui.createLifecycleScope === 'function') {
    return rfui.createLifecycleScope();
  }
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const cleanups: Array<() => void> = [];
  let aborted = false;
  return {
    on(target: any, type: string, listener: (...args: any[]) => any, options?: any) {
      if (!target || typeof target.addEventListener !== 'function' || aborted) return;
      const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
      const opts = ac?.signal
        ? (typeof options === 'boolean' ? { capture, signal: ac.signal } : { ...(options || {}), signal: ac.signal })
        : options;
      target.addEventListener(type, listener, opts);
      cleanups.push(() => {
        target.removeEventListener?.(type, listener, capture);
      });
    },
    abort(reason?: unknown) {
      if (aborted) return;
      aborted = true;
      try { ac?.abort(reason); } catch (_) {}
      for (const fn of cleanups.splice(0)) {
        try { fn(); } catch (_) {}
      }
    }
  };
}

export const pipelineCardScopes = new WeakMap<HTMLElement, LocalScope>();
let saveErrorScope: LocalScope | null = null;
let dashboardFilterScope: LocalScope | null = null;

export function disposePipelineCardInteractions(card: HTMLElement | null | undefined): void {
  if (!card) return;
  const existing = pipelineCardScopes.get(card);
  if (existing) {
    pipelineCardScopes.delete(card);
    existing.abort('card-removed');
  }
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).disposePipelineCardInteractions = disposePipelineCardInteractions;
}

export function bindPipelineCardInteractions(card: HTMLElement, sub: any): void {
  disposePipelineCardInteractions(card);
  const cardScope = createCardScope();
  pipelineCardScopes.set(card, cardScope);

  // 1. Interactive timeline dots in Col 2
  card.querySelectorAll('.dot.interactive-dot').forEach((dot: any) => {
    cardScope.on(dot, 'click', (e: Event) => {
      e.stopPropagation();
      const nodeId = dot.getAttribute('data-node-id');
      const subId = dot.getAttribute('data-sub-id') || sub.id;
      if (subId && nodeId) openStageDrawer(subId, nodeId);
    });
  });

  // 2. Latest node window in Col 3
  const latestWindow = card.querySelector('.latest-window');
  if (latestWindow) {
    cardScope.on(latestWindow, 'click', (e: Event) => {
      e.stopPropagation();
      const latestId = latestWindow.getAttribute('data-latest-id');
      const subId = latestWindow.getAttribute('data-sub-id') || sub.id;
      if (latestId) {
        openStageDrawer(subId, latestId);
      } else {
        toggleInlineStageEditor(card, true);
      }
    });
  }

  // 3. Action buttons in Col 1
  card.querySelectorAll('.btn-pipeline-open').forEach((btn: any) => {
    cardScope.on(btn, 'click', (e: Event) => {
      e.stopPropagation();
      try {
        const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
        const navFn = g.navigateToSubmissionDetails || (typeof navigateToSubmissionDetails === 'function' ? navigateToSubmissionDetails : null);
        if (typeof navFn === 'function') {
          navFn(sub.id);
        }
      } catch (err) {
        console.error('[PaperFlow] Failed to navigate to submission details:', err);
      }
    });
  });

  card.querySelectorAll('.btn-pipeline-add, .btn-quick-add-event').forEach((btn: any) => {
    cardScope.on(btn, 'click', (e: Event) => {
      e.stopPropagation();
      try {
        const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
        if (typeof g.toggleInlineStageEditor === 'function') {
          g.toggleInlineStageEditor(card, true);
        } else if (typeof toggleInlineStageEditor === 'function') {
          toggleInlineStageEditor(card, true);
        }
      } catch (err) {
        console.error('[PaperFlow] Failed to toggle inline stage editor:', err);
      }
    });
  });

  card.querySelectorAll('.btn-pipeline-manage').forEach((btn: any) => {
    cardScope.on(btn, 'click', (e: Event) => {
      e.stopPropagation();
      try {
        const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
        const manageFn = g.openTimelineEventManager || (typeof openTimelineEventManager === 'function' ? openTimelineEventManager : null);
        if (typeof manageFn === 'function') {
          manageFn(sub.id);
        }
      } catch (err) {
        console.error('[PaperFlow] Failed to open timeline event manager:', err);
      }
    });
  });

  card.querySelectorAll('.btn-pipeline-share, .btn-quick-share').forEach((btn: any) => {
    cardScope.on(btn, 'click', (e: Event) => {
      e.stopPropagation();
      try {
        const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
        const shareFn = g.openSubmissionSharePreview || g.openSubmissionShareModal || (typeof openSubmissionSharePreview === 'function' ? openSubmissionSharePreview : openSubmissionShareModal);
        if (typeof shareFn === 'function') {
          shareFn(sub.id, e.currentTarget);
        }
      } catch (err) {
        console.error('[PaperFlow] Failed to open submission share modal:', err);
      }
    });
  });

  // 4. Zotero Badges in Col 1
  cardScope.on(card.querySelector('.zotero-card-badge'), 'click', (e: Event) => {
    e.stopPropagation();
    const badge = e.currentTarget as HTMLElement;
    const key = badge.getAttribute('data-item-key');
    const rawLib = badge.getAttribute('data-library-id');
    const libId = rawLib ? (Number(rawLib) || rawLib) : null;
    if (key && typeof ZoteroBridge !== 'undefined') {
      ZoteroBridge.selectItemInZotero(key, libId);
    }
  });

  cardScope.on(card.querySelector('.zotero-citekey-badge'), 'click', (e: Event) => {
    e.stopPropagation();
    const badge = e.currentTarget as HTMLElement;
    const ck = badge.getAttribute('data-citekey');
    if (ck && typeof ZoteroBridge !== 'undefined') {
      const curLang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'en';
      ZoteroBridge.copyText(`[@${ck}]`, curLang === 'zh' ? `已复制 Citation Key: [@${ck}]` : `Copied Citation Key: [@${ck}]`);
    }
  });

  cardScope.on(card.querySelector('.zotero-pdf-badge'), 'click', (e: Event) => {
    e.stopPropagation();
    const badge = e.currentTarget as HTMLElement;
    const key = badge.getAttribute('data-item-key');
    const rawLib = badge.getAttribute('data-library-id');
    const libId = rawLib ? (Number(rawLib) || rawLib) : null;
    if (key && typeof ZoteroBridge !== 'undefined') {
      ZoteroBridge.openPdf(key, null, libId);
    }
  });

  // 5. Inline Stage Editor bindings
  cardScope.on(card.querySelector('.btn-inline-stage-cancel'), 'click', (e: Event) => {
    e.stopPropagation();
    const btn = e.currentTarget as HTMLButtonElement;
    if (btn?.disabled) return;
    toggleInlineStageEditor(card, false);
    (card.querySelector('.btn-pipeline-add') as HTMLElement)?.focus?.();
  });

  const inlineEditor = card.querySelector('.inline-stage-editor') as HTMLElement | null;
  if (inlineEditor) {
    cardScope.on(inlineEditor.querySelector('.inline-stage-key'), 'change', () => {
      syncInlineStagePreset(inlineEditor);
    });
    cardScope.on(inlineEditor.querySelector('.inline-stage-type'), 'change', () => {
      syncInlineStagePreset(inlineEditor);
    });
    cardScope.on(inlineEditor.querySelector('.inline-stage-deadline'), 'input', () => {
      updateInlineStageDeadlineStatus(inlineEditor);
    });
    cardScope.on(inlineEditor.querySelector('.btn-inline-stage-reset'), 'click', (e: Event) => {
      e.stopPropagation();
      resetInlineStageEditor(inlineEditor);
    });
    cardScope.on(inlineEditor.querySelector('.btn-inline-stage-save'), 'click', async (e: Event) => {
      e.stopPropagation();
      const saveBtn = inlineEditor.querySelector('.btn-inline-stage-save') as HTMLButtonElement | null;
      if (saveBtn?.disabled) return;
      setInlineStageBusy(inlineEditor, true);
      let errorMessage = '';
      try {
        await saveInlineStageEvent(inlineEditor);
      } catch (error: any) {
        errorMessage = error?.message || t('autoSaveFailed');
        showGlobalToast(errorMessage, 'error');
      } finally {
        if (inlineEditor.isConnected) setInlineStageBusy(inlineEditor, false, errorMessage);
      }
    });
    cardScope.on(inlineEditor, 'keydown', (event: any) => {
      if (event.key !== 'Escape' || inlineEditor.querySelector('.btn-inline-stage-save')?.hasAttribute('disabled')) return;
      event.preventDefault();
      event.stopPropagation();
      toggleInlineStageEditor(card, false);
      (card.querySelector('.btn-pipeline-add') as HTMLElement)?.focus?.();
    });
    inlineEditor.querySelectorAll('.inline-stage-fields input').forEach((input: any) => {
      cardScope.on(input, 'keydown', (event: any) => {
        if (event.key !== 'Enter' || event.isComposing) return;
        event.preventDefault();
        (inlineEditor.querySelector('.btn-inline-stage-save') as HTMLButtonElement)?.click?.();
      });
    });
  }
}

export function setupSaveErrorListener(): void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  saveErrorScope?.abort('rebind');
  const scope = createCardScope();
  saveErrorScope = scope;
  scope.on(window, 'researchflow-save-state', (event: any) => {
    const { state, error } = event.detail || {};
    const curLang = typeof (window as any).currentLanguage !== 'undefined' ? (window as any).currentLanguage : 'en';
    if (state === 'error') showGlobalToast(error || (curLang === 'zh' ? '保存失败，请重试' : 'Save failed, please retry'), 'error');
    if (state === 'pending') showGlobalToast(t('saveNewEditsPending'), 'info');
  });
  scope.on(window, 'unload', () => scope.abort('unload'), { once: true });
}

export function setupDashboardFilterListeners(): void {
  const cardAccepted = document.getElementById('card-filter-accepted');
  const cardActive = document.getElementById('card-filter-active');
  const cardAll = document.getElementById('card-filter-all');

  if (!cardAccepted || !cardActive || !cardAll) return;

  dashboardFilterScope?.abort('rebind');
  const scope = createCardScope();
  dashboardFilterScope = scope;
  if (typeof window !== 'undefined') {
    scope.on(window, 'unload', () => scope.abort('unload'), { once: true });
  }

  const clearActiveClasses = () => {
    [cardAccepted, cardActive, cardAll].forEach((c) => {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
  };

  scope.on(cardAccepted, 'click', () => {
    (window as any).currentDashboardFilter = 'accepted';
    clearActiveClasses();
    cardAccepted.classList.add('active');
    cardAccepted.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });

  scope.on(cardActive, 'click', () => {
    (window as any).currentDashboardFilter = 'active';
    clearActiveClasses();
    cardActive.classList.add('active');
    cardActive.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });

  scope.on(cardAll, 'click', () => {
    (window as any).currentDashboardFilter = 'all';
    clearActiveClasses();
    cardAll.classList.add('active');
    cardAll.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });
}
