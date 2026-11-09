declare var db: any;
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
declare function openSubmissionShareModal(subId: string): Promise<void>;
declare function openSubmissionForEditing(subOrId: any, options?: any): void;
declare function deleteTimelineNode(sub: any, nodeId: string): any;
declare function syncManuscriptStatusFromSubmission(sub: any, database?: any): boolean;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function renderSubmissions(): void;
declare function showGlobalToast(message: string, type?: string): void;
declare function getTimelineNodeDisplayName(node: any): string;

export function bindPipelineCardInteractions(card: HTMLElement, sub: any): void {
  card.querySelectorAll('.interactive-capsule, .interactive-dot, .btn-event-edit').forEach((cap: any) => {
    cap.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const sId = cap.getAttribute('data-sub-id');
      const nId = cap.getAttribute('data-node-id');
      if (sId && nId) openStageDrawer(sId, nId);
    });
  });

  card.querySelectorAll('.btn-event-delete').forEach((btn: any) => {
    btn.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      const sId = btn.getAttribute('data-sub-id');
      const nId = btn.getAttribute('data-node-id');
      const targetSub = db.submissions.find((s: any) => s.id === sId);
      const targetNode = targetSub?.timelineNodes?.find((n: any) => n.id === nId);
      if (!targetSub || !targetNode) return;
      if (!confirm(tf('confirmDeleteEvent', { name: getTimelineNodeDisplayName(targetNode) }))) return;
      deleteTimelineNode(targetSub, nId);
      syncManuscriptStatusFromSubmission(targetSub);
      const w = window as any;
      await w.storage.saveAll(db);
      renderDashboard();
      renderKanban();
      renderSubmissions();
      showGlobalToast(t('eventRemovedToast'), 'success');
    });
  });

  card.querySelectorAll('.btn-inline-add-event').forEach((btn: any) => {
    btn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      toggleInlineStageEditor(card);
    });
  });

  const inlineEditor = card.querySelector('.inline-stage-editor') as HTMLElement | null;
  if (inlineEditor) {
    inlineEditor.querySelector('.inline-stage-key')?.addEventListener('change', () => {
      syncInlineStagePreset(inlineEditor);
    });
    inlineEditor.querySelector('.inline-stage-type')?.addEventListener('change', () => {
      const typeSelect = inlineEditor.querySelector('.inline-stage-type') as HTMLSelectElement | null;
      const keySelect = inlineEditor.querySelector('.inline-stage-key') as HTMLSelectElement | null;
      const isReview = typeSelect?.value === 'review' || keySelect?.value === 'r1_comments' || keySelect?.value === 'r2_comments';
      inlineEditor.classList.toggle('is-review', Boolean(isReview));
      const deadlineField = inlineEditor.querySelector('.inline-stage-deadline-field') as HTMLElement | null;
      const decisionField = inlineEditor.querySelector('.inline-stage-decision-field') as HTMLElement | null;
      if (deadlineField) deadlineField.hidden = !isReview;
      if (decisionField) decisionField.hidden = !isReview;
      updateInlineStageDeadlineStatus(inlineEditor);
    });
    inlineEditor.querySelector('.inline-stage-deadline')?.addEventListener('input', () => {
      updateInlineStageDeadlineStatus(inlineEditor);
    });
    inlineEditor.querySelector('.btn-inline-stage-reset')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      resetInlineStageEditor(inlineEditor);
    });
    inlineEditor.querySelector('.btn-inline-stage-cancel')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      toggleInlineStageEditor(card, false);
    });
    inlineEditor.querySelector('.btn-inline-stage-save')?.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      const saveButton = inlineEditor.querySelector('.btn-inline-stage-save') as HTMLButtonElement | null;
      if (saveButton?.disabled) return;
      setInlineStageBusy(inlineEditor, true, t('autoSaveSaving'));
      try {
        await saveInlineStageEvent(inlineEditor);
      } finally {
        if (inlineEditor.isConnected) setInlineStageBusy(inlineEditor, false);
      }
    });
    inlineEditor.querySelectorAll('input, select').forEach((field: any) => {
      field.addEventListener('keydown', async (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const saveButton = inlineEditor.querySelector('.btn-inline-stage-save') as HTMLButtonElement | null;
          if (saveButton?.disabled) return;
          setInlineStageBusy(inlineEditor, true, t('autoSaveSaving'));
          try {
            await saveInlineStageEvent(inlineEditor);
          } finally {
            if (inlineEditor.isConnected) setInlineStageBusy(inlineEditor, false);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          toggleInlineStageEditor(card, false);
        }
      });
    });
  }

  card.querySelector('.btn-share-submission')?.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    openSubmissionShareModal(sub.id);
  });

  card.querySelector('.btn-open-submission-detail')?.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    openSubmissionForEditing(sub, { switchView: true, focusEditCenter: true });
  });

  const pZotBadge = card.querySelector('.pipeline-zotero-badge');
  if (pZotBadge) {
    pZotBadge.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const key = pZotBadge.getAttribute('data-item-key');
      if (key && typeof ZoteroBridge !== 'undefined') {
        const linkedMan = db.manuscripts?.find((item: any) => item.id === sub.manuscriptId);
        ZoteroBridge.selectItemInZotero(key, linkedMan?.zoteroLibraryID);
      }
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
