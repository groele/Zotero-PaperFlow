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

export function bindPipelineCardInteractions(card: HTMLElement, sub: any): void {
  // 1. Interactive timeline dots in Col 2
  card.querySelectorAll('.dot.interactive-dot').forEach((dot: any) => {
    dot.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const nodeId = dot.getAttribute('data-node-id');
      const subId = dot.getAttribute('data-sub-id') || sub.id;
      if (subId && nodeId) openStageDrawer(subId, nodeId);
    });
  });

  // 2. Latest node window in Col 3
  const latestWindow = card.querySelector('.latest-window');
  if (latestWindow) {
    latestWindow.addEventListener('click', (e: Event) => {
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
    btn.addEventListener('click', (e: Event) => {
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
    btn.addEventListener('click', (e: Event) => {
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
    btn.addEventListener('click', (e: Event) => {
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
    btn.addEventListener('click', (e: Event) => {
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
  card.querySelector('.zotero-card-badge')?.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    const badge = e.currentTarget as HTMLElement;
    const key = badge.getAttribute('data-item-key');
    const rawLib = badge.getAttribute('data-library-id');
    const libId = rawLib ? (Number(rawLib) || rawLib) : null;
    if (key && typeof ZoteroBridge !== 'undefined') {
      ZoteroBridge.selectItemInZotero(key, libId);
    }
  });

  card.querySelector('.zotero-citekey-badge')?.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    const badge = e.currentTarget as HTMLElement;
    const ck = badge.getAttribute('data-citekey');
    if (ck && typeof ZoteroBridge !== 'undefined') {
      const curLang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'en';
      ZoteroBridge.copyText(`[@${ck}]`, curLang === 'zh' ? `已复制 Citation Key: [@${ck}]` : `Copied Citation Key: [@${ck}]`);
    }
  });

  card.querySelector('.zotero-pdf-badge')?.addEventListener('click', (e: Event) => {
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
  card.querySelector('.btn-inline-stage-cancel')?.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    const btn = e.currentTarget as HTMLButtonElement;
    if (btn?.disabled) return;
    toggleInlineStageEditor(card, false);
    (card.querySelector('.btn-pipeline-add') as HTMLElement)?.focus?.();
  });

  const inlineEditor = card.querySelector('.inline-stage-editor') as HTMLElement | null;
  if (inlineEditor) {
    inlineEditor.querySelector('.inline-stage-key')?.addEventListener('change', () => {
      syncInlineStagePreset(inlineEditor);
    });
    inlineEditor.querySelector('.inline-stage-type')?.addEventListener('change', () => {
      syncInlineStagePreset(inlineEditor);
    });
    inlineEditor.querySelector('.inline-stage-deadline')?.addEventListener('input', () => {
      updateInlineStageDeadlineStatus(inlineEditor);
    });
    inlineEditor.querySelector('.btn-inline-stage-reset')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      resetInlineStageEditor(inlineEditor);
    });
    inlineEditor.querySelector('.btn-inline-stage-save')?.addEventListener('click', async (e: Event) => {
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
    inlineEditor.addEventListener('keydown', (event: any) => {
      if (event.key !== 'Escape' || inlineEditor.querySelector('.btn-inline-stage-save')?.hasAttribute('disabled')) return;
      event.preventDefault();
      event.stopPropagation();
      toggleInlineStageEditor(card, false);
      (card.querySelector('.btn-pipeline-add') as HTMLElement)?.focus?.();
    });
    inlineEditor.querySelectorAll('.inline-stage-fields input').forEach((input: any) => {
      input.addEventListener('keydown', (event: any) => {
        if (event.key !== 'Enter' || event.isComposing) return;
        event.preventDefault();
        (inlineEditor.querySelector('.btn-inline-stage-save') as HTMLButtonElement)?.click?.();
      });
    });
  }
}

export function setupSaveErrorListener(): void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  window.addEventListener('researchflow-save-state', (event: any) => {
    const { state, error } = event.detail || {};
    const curLang = typeof (window as any).currentLanguage !== 'undefined' ? (window as any).currentLanguage : 'en';
    if (state === 'error') showGlobalToast(error || (curLang === 'zh' ? '保存失败，请重试' : 'Save failed, please retry'), 'error');
    if (state === 'pending') showGlobalToast(t('saveNewEditsPending'), 'info');
  });
}

export function setupDashboardFilterListeners(): void {
  const cardAccepted = document.getElementById('card-filter-accepted');
  const cardActive = document.getElementById('card-filter-active');
  const cardAll = document.getElementById('card-filter-all');

  if (!cardAccepted || !cardActive || !cardAll) return;

  const clearActiveClasses = () => {
    [cardAccepted, cardActive, cardAll].forEach((c) => {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
  };

  cardAccepted.addEventListener('click', () => {
    (window as any).currentDashboardFilter = 'accepted';
    clearActiveClasses();
    cardAccepted.classList.add('active');
    cardAccepted.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });

  cardActive.addEventListener('click', () => {
    (window as any).currentDashboardFilter = 'active';
    clearActiveClasses();
    cardActive.classList.add('active');
    cardActive.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });

  cardAll.addEventListener('click', () => {
    (window as any).currentDashboardFilter = 'all';
    clearActiveClasses();
    cardAll.classList.add('active');
    cardAll.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });
}
