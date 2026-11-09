import {
  collectSubmissionChecklistFromEditor,
  collectSubmissionChecklistKeysFromEditor,
  collectSubmissionReviewMatrixFromEditor,
  renderSubmissionReviewPreview,
  getSubmissionChecklistKeys,
} from './checklist-and-matrix';
import { saveSubmissionEditFromValues } from './editor-sync';

declare var db: any;
declare var selectedSubmissionId: any;
declare var submissionAutoSaveCleanup: any;
declare var pendingSubmissionSaves: number;
declare function t(key: string): string;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;

export function focusSubmissionEditCenter(): void {
  const detailPanel = document.getElementById('submission-detail-panel');
  const editCenter = detailPanel?.querySelector('#submission-entry-editor-panel') as HTMLElement | null;
  const titleInput = editCenter?.querySelector('#sub-edit-title') as HTMLInputElement | null;
  if (!detailPanel || !editCenter) return;

  const panelRect = detailPanel.getBoundingClientRect();
  const editorRect = editCenter.getBoundingClientRect();
  const targetTop = Math.max(detailPanel.scrollTop + editorRect.top - panelRect.top - 12, 0);
  if (typeof detailPanel.scrollTo === 'function') {
    detailPanel.scrollTo({ top: targetTop, behavior: 'smooth' });
  } else {
    detailPanel.scrollTop = targetTop;
  }

  editCenter.classList.remove('submission-edit-center-focused');
  void editCenter.offsetWidth;
  editCenter.classList.add('submission-edit-center-focused');
  window.setTimeout(() => editCenter.classList.remove('submission-edit-center-focused'), 2400);

  if (titleInput) {
    window.requestAnimationFrame(() => {
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
  submissionAutoSaveCleanup?.();
  selectedSubmissionId = sub.id;
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

  let debounceTimer: any = null;
  let revision = 0;
  let saveChain = Promise.resolve();
  let lastSavedSnapshot = JSON.stringify(getSubmissionEditValues('sub-edit'));
  const debounceMs = 650;

  const setStatus = (state: string, message: string, detail = '') => {
    if (!editCenter.isConnected) return;
    status.dataset.state = state;
    status.title = detail || '';
    const label = status.querySelector('[data-submission-autosave-label]');
    if (label) label.textContent = message;
  };

  const persist = () => {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    const requestedRevision = revision;
    const values = getSubmissionEditValues('sub-edit');
    const currentSnapshot = JSON.stringify(values);
    pendingSubmissionSaves += 1;
    setStatus('saving', t('autoSaveSaving'));

    saveChain = saveChain.catch(() => {}).then(async () => {
      if (currentSnapshot === lastSavedSnapshot) {
        if (requestedRevision === revision) setStatus('saved', t('autoSaveSaved'));
        return;
      }
      let validationError = '';
      const saved = await saveSubmissionEditFromValues(sub, 'sub-edit', {
        values, alertOnError: false, renderDetails: false, notify: false, mergeOnConflict: true,
        onValidationError: (error: string) => { validationError = error; },
      }, getSubmissionEditValues);
      if (!editCenter.isConnected) return;
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
    }).finally(() => { pendingSubmissionSaves -= 1; });
  };

  const requestSave = ({ immediate = false } = {}) => {
    revision += 1;
    if (debounceTimer) clearTimeout(debounceTimer);
    setStatus('pending', t('autoSavePending'));
    if (immediate) persist();
    else debounceTimer = window.setTimeout(persist, debounceMs);
  };

  editCenter.addEventListener('input', (event: any) => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
    if (control.type === 'checkbox' || control.type === 'radio') return;
    requestSave();
  });

  editCenter.addEventListener('change', (event: any) => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) return;
    requestSave({ immediate: true });
  });

  editCenter.addEventListener('submission-autosave-request', (event: any) => {
    requestSave({ immediate: event.detail?.immediate !== false });
  });

  const flushPendingSave = () => { if (debounceTimer) persist(); };
  const flushWhenHidden = () => { if (document.visibilityState === 'hidden') flushPendingSave(); };
  window.addEventListener('pagehide', flushPendingSave);
  document.addEventListener('visibilitychange', flushWhenHidden);
  submissionAutoSaveCleanup = () => {
    flushPendingSave();
    window.removeEventListener('pagehide', flushPendingSave);
    document.removeEventListener('visibilitychange', flushWhenHidden);
    submissionAutoSaveCleanup = null;
  };
}
