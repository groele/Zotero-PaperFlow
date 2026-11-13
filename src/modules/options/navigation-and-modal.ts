/**
 * Zotero PaperFlow - Workspace Navigation, Modal Lifecycle & Toast Celebrations
 */
import { createLifecycleScope, type LifecycleScope } from '../ui-utils/lifecycle.js';
import { showGlobalToast, showAcceptanceCelebration } from './toast-and-celebration.js';

export { showGlobalToast, showAcceptanceCelebration };

export const RF_OPTIONS_RENDER_VERSION = '17.0.0';
export const UI_THEME_OPTIONS = new Set(['system', 'light', 'dark']);

let modalScope: LifecycleScope | null = null;
let focusEditTimerScope: LifecycleScope | null = null;
let workspaceNavScope: LifecycleScope | null = null;

export function getModalLifecycleScope(): LifecycleScope {
  if (!modalScope || modalScope.aborted) {
    modalScope = createLifecycleScope();
    const created = modalScope;
    registerModalCleanup(() => created.abort('modal-closed'));
  }
  return modalScope;
}

export function getModalAbortSignal() {
  return getModalLifecycleScope().signal;
}

const g: any = typeof globalThis !== 'undefined' ? globalThis : window;
if (!('db' in g)) g.db = null;
if (!('currentLanguage' in g)) g.currentLanguage = 'zh';
if (!('selectedProjectId' in g)) g.selectedProjectId = null;
if (!('selectedSubmissionId' in g)) g.selectedSubmissionId = null;
if (!('currentDashboardFilter' in g)) g.currentDashboardFilter = 'all';
if (!('isPipelineExpanded' in g)) g.isPipelineExpanded = false;
if (!('showEmptyKanbanColumns' in g)) g.showEmptyKanbanColumns = true;
if (!('submissionAutoSaveCleanup' in g)) g.submissionAutoSaveCleanup = null;
if (!('pendingSubmissionSaves' in g)) g.pendingSubmissionSaves = 0;
if (!('acceptanceCelebrationCleanup' in g)) g.acceptanceCelebrationCleanup = null;
if (!('previousModalFocus' in g)) g.previousModalFocus = null;
if (!('currentModalCleanup' in g)) g.currentModalCleanup = null;
g.RF_OPTIONS_RENDER_VERSION = RF_OPTIONS_RENDER_VERSION;
g.UI_THEME_OPTIONS = UI_THEME_OPTIONS;
g.getModalLifecycleScope = getModalLifecycleScope;
g.getModalAbortSignal = getModalAbortSignal;

declare var db: any;
declare var selectedSubmissionId: string | null;
declare var submissionAutoSaveCleanup: (() => void) | null;
declare var acceptanceCelebrationCleanup: (() => void) | null;
declare var previousModalFocus: any;
declare var currentModalCleanup: (() => void) | null;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function escapeHTML(value: any): string;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function renderSubmissions(opts?: any): void;
declare function renderSubmissionDetails(sub: any): void;
declare function renderSettings(): Promise<void>;

export function activateWorkspaceView(viewId: string): void {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.content-view');
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  if (viewId !== 'view-submissions') {
    focusEditTimerScope?.abort('view-switch');
    focusEditTimerScope = null;
    try { g?.submissionAutoSaveCleanup?.(); } catch (_) {}
  }
  navItems.forEach((nav: any) => {
    nav.classList.toggle('active', nav.getAttribute('data-view') === viewId);
  });
  views.forEach((view: any) => {
    view.classList.toggle('active', view.id === viewId);
  });

  const dirtyViews = window.RFUI?.getDirtyViewsSet?.();
  dirtyViews?.delete(viewId);
  try {
    if (viewId === 'view-dashboard' && typeof renderDashboard === 'function') renderDashboard();
    else if (viewId === 'view-manuscripts' && typeof renderKanban === 'function') renderKanban();
    else if (viewId === 'view-submissions' && typeof renderSubmissions === 'function') renderSubmissions();
    else if (viewId === 'view-settings' && typeof renderSettings === 'function') renderSettings();
  } catch (err) {
    console.error('[PaperFlow] View render error:', err);
  }
}

export function focusSubmissionEditCenter(): void {
  const editCenter = document.getElementById('submission-entry-editor-panel');
  if (!editCenter) return;
  editCenter.classList.remove('submission-edit-center-focus');
  void editCenter.offsetWidth;
  editCenter.classList.add('submission-edit-center-focus');
  editCenter.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const titleInput = document.getElementById('sub-edit-title') as HTMLInputElement | null;
  if (titleInput) {
    focusEditTimerScope?.abort('re-focus');
    focusEditTimerScope = createLifecycleScope();
    focusEditTimerScope.setTimeout(() => {
      titleInput.focus({ preventScroll: true });
      titleInput.select?.();
    }, 120);
  }
}

export function openSubmissionForEditing(subOrId: any, options: any = {}): void {
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  const database = g?.db || (typeof db !== 'undefined' ? db : null);
  const sub = typeof subOrId === 'string'
    ? (database?.submissions || []).find((item: any) => item.id === subOrId)
    : subOrId;
  if (!sub) {
    showGlobalToast(t('submissionNotFound'), 'error');
    return;
  }

  try { g?.submissionAutoSaveCleanup?.(); } catch (_) {}
  if (g) g.selectedSubmissionId = sub.id;
  if (options.switchView) {
    activateWorkspaceView('view-submissions');
  }
  renderSubmissions({ refreshDetails: false });
  renderSubmissionDetails(sub);
  if (options.focusEditCenter) {
    focusSubmissionEditCenter();
  }
}

export function getModalFocusableElements(): HTMLElement[] {
  const modal = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-body');
  if (!modal || !modal.classList.contains('active') || !modalContent) return [];
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  return Array.from(modalContent.querySelectorAll(selector)).filter((el: any) => (
    el instanceof HTMLElement && !el.hidden && el.offsetParent !== null
  )) as HTMLElement[];
}

export function openModal(htmlContent: string): void {
  const modal = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-body');
  if (!modal || !modalContent) return;
  modalScope?.abort('open-modal');
  modalScope = null;
  if (typeof currentModalCleanup === 'function') {
    const cleanup = currentModalCleanup;
    currentModalCleanup = null;
    cleanup();
  }
  const activeScope = createLifecycleScope();
  modalScope = activeScope;
  previousModalFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  window.RFUI.setHTML(modalContent, htmlContent);
  modal.inert = false;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  activeScope.on(document.getElementById('btn-close-modal'), 'click', closeModal);
  activeScope.setTimeout(() => {
    const firstFocusable = getModalFocusableElements()[0] || modalContent;
    firstFocusable?.focus?.({ preventScroll: true });
  }, 0);
}

export function registerModalCleanup(fn: () => void): void {
  const prev = currentModalCleanup;
  currentModalCleanup = () => {
    try { if (typeof prev === 'function') prev(); } catch (_) {}
    try { if (typeof fn === 'function') fn(); } catch (_) {}
  };
}

export function closeModal(): void {
  const modal = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-body');
  const activeScope = modalScope;
  modalScope = null;
  activeScope?.abort('close-modal');
  if (typeof currentModalCleanup === 'function') {
    const cleanup = currentModalCleanup;
    currentModalCleanup = null;
    cleanup();
  }
  if (!modal || !modalContent) return;
  modal.classList.remove('active');
  modal.inert = true;
  modal.setAttribute('aria-hidden', 'true');
  window.RFUI.setHTML(modalContent, '');
  if (previousModalFocus && typeof previousModalFocus.focus === 'function' && previousModalFocus.isConnected) {
    previousModalFocus.focus({ preventScroll: true });
  }
  previousModalFocus = null;
}

export function bindModalAndNavListeners(): void {
  workspaceNavScope?.abort('rebind');
  const navScope = createLifecycleScope();
  workspaceNavScope = navScope;
  if (typeof window !== 'undefined') {
    navScope.on(window, 'unload', () => {
      focusEditTimerScope?.abort('unload');
      modalScope?.abort('unload');
      try { g?.acceptanceCelebrationCleanup?.(); } catch (_) {}
      try { g?.submissionAutoSaveCleanup?.(); } catch (_) {}
      navScope.abort('unload');
    }, { once: true });
  }

  const bindNav = () => {
    const navItems = document.querySelectorAll?.('.nav-item') || [];
    navItems.forEach((item: any) => {
      if (item && !item.dataset.navBound) {
        item.dataset.navBound = 'true';
        navScope.on(item, 'click', (e: Event) => {
          e.preventDefault();
          const targetId = item.getAttribute('data-view');
          if (targetId) activateWorkspaceView(targetId);
        });
      }
    });
  };

  bindNav();
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    navScope.on(document, 'DOMContentLoaded', bindNav, { once: true });
  }

  const modal = document.getElementById('modal-overlay');
  if (typeof modal?.addEventListener === 'function' && !modal.dataset.modalBound) {
    modal.dataset.modalBound = 'true';
    navScope.on(modal, 'click', (e: any) => {
      if (e.target === modal) closeModal();
    });
  }

  if (typeof document?.addEventListener === 'function' && !(document as any)._pfKeydownBound) {
    (document as any)._pfKeydownBound = true;
    navScope.on(document, 'keydown', (event: KeyboardEvent) => {
    const modalEl = document.getElementById('modal-overlay');
    if (!modalEl || !modalEl.classList.contains('active')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = getModalFocusableElements();
    if (focusables.length === 0) {
      event.preventDefault();
      document.getElementById('modal-body')?.focus?.({ preventScroll: true });
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && (document.activeElement === first || !modalEl.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    });
  }
}
