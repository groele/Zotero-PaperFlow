import {
  collectSubmissionChecklistFromEditor,
  collectSubmissionChecklistKeysFromEditor,
  collectSubmissionReviewMatrixFromEditor,
  renderSubmissionReviewPreview,
  getSubmissionChecklistKeys,
} from './checklist-and-matrix';
import { saveSubmissionEditFromValues } from './editor-sync';
import {
  selectedSubmissionId,
  submissionAutoSaveCleanup,
  setSelectedSubmissionId,
  setSubmissionAutoSaveCleanup,
  clearSubmissionAutoSave,
  incrementPendingSubmissionSaves,
  decrementPendingSubmissionSaves,
} from './submission-state';
import { createLifecycleScope, type LifecycleScope } from '../ui-utils/lifecycle.js';

declare var db: any;
declare function t(key: string): string;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;

let focusHighlightScope: LifecycleScope | null = null;

export function focusSubmissionEditCenter(): void {
  const detailPanel = document.getElementById('submission-detail-panel');
  const editCenter = detailPanel?.querySelector('#submission-entry-editor-panel') as HTMLElement | null;
  const titleInput = editCenter?.querySelector('#sub-edit-title') as HTMLInputElement | null;
  if (!detailPanel || !editCenter) return;

  const panelRect = detailPanel.getBoundingClientRect();
  const editorRect = editCenter.getBoundingClientRect();
  const targetTop = Math.max(detailPanel.scrollTop + editorRect.top - panelRect.top - 12, 0);
  if (typeof detailPanel.scrollTo === 'function') {
    detailPanel.scrollTo({ top: targetTop, behavior: 'auto' });
  } else {
    detailPanel.scrollTop = targetTop;
  }

  focusHighlightScope?.abort('re-focus');
  const fScope = createLifecycleScope();
  focusHighlightScope = fScope;
  editCenter.classList.remove('submission-edit-center-focused');
  editCenter.classList.add('submission-edit-center-focused');
  fScope.setTimeout(() => editCenter.classList.remove('submission-edit-center-focused'), 2400);

  if (titleInput) {
    fScope.raf(() => {
      try { titleInput.focus({ preventScroll: true }); }
      catch (_) { titleInput.focus(); }
      titleInput.select();
    });
  }
}

export function canLeaveSubmissionEditor(): boolean {
  const w = window as any;
  const editor = document.getElementById('submission-entry-editor-panel');
  const state = (editor?.querySelector('[data-submission-autosave-status]') as HTMLElement | null)?.dataset.state || '';
  if (!editor || !['pending', 'invalid', 'error'].includes(state)) return true;
  const plan = w.RFUI.buildSubmissionEditSyncPlan(getSubmissionEditValues('sub-edit'));
  if (plan.ok) return true;
  showGlobalToast(plan.error, 'error');
  (document.getElementById('sub-edit-title') as HTMLElement | null)?.focus();
  return false;
}

export function openSubmissionForEditing(sub: any, options: { focusEditCenter?: boolean } = {}): void {
  if (!canLeaveSubmissionEditor()) return;
  clearSubmissionAutoSave();
  setSelectedSubmissionId(sub.id);
  const w = window as any;
  w.renderSubmissions?.();
  w.renderSubmissionDetails?.(sub);
  if (options.focusEditCenter) {
    requestAnimationFrame(focusSubmissionEditCenter);
  }
}

export function navigateToSubmissionDetails(submissionId: string): void {
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  const database = g?.db || (typeof db !== 'undefined' ? db : null);
  const submission = (database?.submissions || []).find((item: any) => item.id === submissionId);
  if (!submission) {
    showGlobalToast(t('submissionNotFound'), 'error');
    return;
  }
  const submissionView = document.getElementById('view-submissions');
  if (!submissionView?.classList.contains('active')) {
    if (typeof (window as any).activateWorkspaceView === 'function') {
      (window as any).activateWorkspaceView('view-submissions');
    } else {
      (document.querySelector('.nav-item[data-view="view-submissions"]') as HTMLElement | null)?.click();
    }
  }
  openSubmissionForEditing(submission);
  document.getElementById('submission-detail-panel')?.scrollTo({ top: 0 });
}

export function getSubmissionEditValues(prefix: string): any {
  return {
    title: (document.getElementById(`${prefix}-title`) as HTMLInputElement | null)?.value || '',
    firstAuthor: (document.getElementById(`${prefix}-first-author`) as HTMLInputElement | null)?.value || '',
    journal: (document.getElementById(`${prefix}-journal`) as HTMLInputElement | null)?.value || '',
    journalUrl: (document.getElementById(`${prefix}-journal-url`) as HTMLInputElement | null)?.value || '',
    externalManuscriptId: (document.getElementById(`${prefix}-external-id`) as HTMLInputElement | null)?.value?.trim() || '',
    status: (document.getElementById(`${prefix}-status`) as HTMLSelectElement | null)?.value || 'submitted',
    submissionDate: (document.getElementById(`${prefix}-submission-date`) as HTMLInputElement | null)?.value || '',
    firstDecisionDate: (document.getElementById(`${prefix}-r1-date`) as HTMLInputElement | null)?.value || '',
    revisionDueDate: (document.getElementById(`${prefix}-revision-due`) as HTMLInputElement | null)?.value || '',
    decisionDate: (document.getElementById(`${prefix}-decision-date`) as HTMLInputElement | null)?.value || '',
    doi: (document.getElementById(`${prefix}-doi`) as HTMLInputElement | null)?.value || '',
    articleUrl: (document.getElementById(`${prefix}-article-url`) as HTMLInputElement | null)?.value || '',
    complianceChecklist: collectSubmissionChecklistFromEditor(),
    complianceChecklistKeys: collectSubmissionChecklistKeysFromEditor(),
    reviewMatrix: collectSubmissionReviewMatrixFromEditor(),
  };
}

export function setupSubmissionAutoSave(sub: any): void {
  submissionAutoSaveCleanup?.();
  const editCenter = document.getElementById('submission-entry-editor-panel');
  const status = editCenter?.querySelector('[data-submission-autosave-status]') as HTMLElement | null;
  if (!editCenter || !status) return;

  const autoSaveScope = createLifecycleScope();
  let debounceScope: LifecycleScope | null = null;
  let debouncePending = false;
  let revision = 0;
  let saveChain = Promise.resolve();
  let lastSavedSnapshot = JSON.stringify(getSubmissionEditValues('sub-edit'));
  const debounceMs = 650;

  const clearDebounce = () => {
    debouncePending = false;
    debounceScope?.abort('clear-debounce');
    debounceScope = null;
  };

  const isHostDisposed = (): boolean => {
    const w = window as any;
    return Boolean(
      w.Zotero?.ResearchFlow?._disposed
      || w.opener?.Zotero?.ResearchFlow?._disposed
      || w.top?.Zotero?.ResearchFlow?._disposed
    );
  };

  const setStatus = (state: string, message: string, detail = '') => {
    if (autoSaveScope.aborted || !editCenter.isConnected || isHostDisposed()) return;
    status.dataset.state = state;
    status.title = detail || '';
    const label = status.querySelector('[data-submission-autosave-label]');
    if (label) label.textContent = message;
  };

  const persist = () => {
    clearDebounce();
    if (autoSaveScope.aborted || !editCenter.isConnected || isHostDisposed()) return;
    const requestedRevision = revision;
    const values = getSubmissionEditValues('sub-edit');
    const currentSnapshot = JSON.stringify(values);
    incrementPendingSubmissionSaves();
    setStatus('saving', t('autoSaveSaving'));

    saveChain = saveChain.catch(() => {}).then(async () => {
      if (autoSaveScope.aborted || !editCenter.isConnected || isHostDisposed()) return;
      if (currentSnapshot === lastSavedSnapshot) {
        if (requestedRevision === revision) setStatus('saved', t('autoSaveSaved'));
        return;
      }
      let validationError = '';
      const saved = await saveSubmissionEditFromValues(sub, 'sub-edit', {
        values, alertOnError: false, renderDetails: false, notify: false, mergeOnConflict: true,
        onValidationError: (error: string) => { validationError = error; },
      }, getSubmissionEditValues);
      if (autoSaveScope.aborted || !editCenter.isConnected || isHostDisposed()) return;
      if (!saved) {
        setStatus('invalid', t('autoSaveInvalid'), validationError);
        return;
      }
      lastSavedSnapshot = currentSnapshot;
      if (requestedRevision === revision) {
        setStatus('saved', t('autoSaveSaved'));
        renderSubmissionReviewPreview(sub, getSubmissionChecklistKeys(sub));
      }
    }).catch((error: any) => {
      console.error('Submission auto-save failed:', error);
      setStatus('error', t('autoSaveFailed'), String(error?.message || error || ''));
      showGlobalToast(t('autoSaveFailed'), 'error');
    }).finally(() => { decrementPendingSubmissionSaves(); });
  };

  const requestSave = ({ immediate = false } = {}) => {
    if (autoSaveScope.aborted) return;
    revision += 1;
    clearDebounce();
    setStatus('pending', t('autoSavePending'));
    if (immediate) persist();
    else {
      debouncePending = true;
      debounceScope = autoSaveScope.child();
      debounceScope.setTimeout(persist, debounceMs);
    }
  };

  autoSaveScope.on(editCenter, 'input', (event: any) => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
    if (control.type === 'checkbox' || control.type === 'radio') return;
    requestSave();
  });

  autoSaveScope.on(editCenter, 'change', (event: any) => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) return;
    requestSave({ immediate: true });
  });

  autoSaveScope.on(editCenter, 'submission-autosave-request', (event: any) => {
    requestSave({ immediate: event.detail?.immediate !== false });
  });

  const flushPendingSave = () => { if (debouncePending) persist(); };
  const flushWhenHidden = () => { if (document.visibilityState === 'hidden') flushPendingSave(); };
  autoSaveScope.on(window, 'pagehide', flushPendingSave);
  autoSaveScope.on(document, 'visibilitychange', flushWhenHidden);
  const cleanupFn = () => {
    flushPendingSave();
    focusHighlightScope?.abort('autosave-cleanup');
    autoSaveScope.abort('autosave-cleanup');
    setSubmissionAutoSaveCleanup(null);
  };
  setSubmissionAutoSaveCleanup(cleanupFn);
}
