/**
 * Zotero PaperFlow - Workspace Navigation, Modal Lifecycle & Toast Celebrations
 */
export const RF_OPTIONS_RENDER_VERSION = '16.5.2';
export const UI_THEME_OPTIONS = new Set(['system', 'light', 'dark']);

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
    window.setTimeout(() => {
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
  if (typeof currentModalCleanup === 'function') {
    const cleanup = currentModalCleanup;
    currentModalCleanup = null;
    cleanup();
  }
  previousModalFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  window.RFUI.setHTML(modalContent, htmlContent);
  modal.inert = false;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  setTimeout(() => {
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
  if (!modal || !modalContent) return;
  if (typeof currentModalCleanup === 'function') {
    const cleanup = currentModalCleanup;
    currentModalCleanup = null;
    cleanup();
  }
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
  const bindNav = () => {
    const navItems = document.querySelectorAll?.('.nav-item') || [];
    navItems.forEach((item: any) => {
      if (item && !item.dataset.navBound) {
        item.dataset.navBound = 'true';
        item.addEventListener('click', (e: Event) => {
          e.preventDefault();
          const targetId = item.getAttribute('data-view');
          if (targetId) activateWorkspaceView(targetId);
        });
      }
    });
  };

  bindNav();
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindNav);
  }

  const modal = document.getElementById('modal-overlay');
  if (typeof modal?.addEventListener === 'function' && !modal.dataset.modalBound) {
    modal.dataset.modalBound = 'true';
    modal.addEventListener('click', (e: any) => {
      if (e.target === modal) closeModal();
    });
  }

  if (typeof document?.addEventListener === 'function' && !(document as any)._pfKeydownBound) {
    (document as any)._pfKeydownBound = true;
    document.addEventListener('keydown', (event: KeyboardEvent) => {
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

export function showGlobalToast(message: string, type = 'info'): void {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  const iconEl = document.createElement('span');
  iconEl.textContent = icon;
  const textEl = document.createElement('span');
  textEl.textContent = String(message ?? '');
  toast.append(iconEl, textEl);
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function showAcceptanceCelebration(submission: any = {}): void {
  try { ((typeof window !== 'undefined' ? window : globalThis) as any)?.acceptanceCelebrationCleanup?.(); } catch (_) {}
  if (typeof ZoteroBridge !== 'undefined' && typeof ZoteroBridge.getPref === 'function') {
    const enabled = ZoteroBridge.getPref('enableAcceptanceCelebration', true);
    if (!enabled) return;
  }

  const manuscript = (db?.manuscripts || []).find((item: any) => item.id === submission.manuscriptId);
  const title = String(manuscript?.title || submission.title || t('untitledManuscript')).trim();
  const layer = document.createElement('div');
  layer.className = 'acceptance-celebration';
  layer.dataset.acceptanceCelebration = 'active';
  layer.setAttribute('role', 'status');
  layer.setAttribute('aria-live', 'assertive');
  layer.setAttribute('aria-atomic', 'true');

  const particles = document.createElement('div');
  particles.className = 'acceptance-confetti-field';
  particles.setAttribute('aria-hidden', 'true');

  const reducedMotion = window.RFUI?.prefersReducedMotion?.() !== false;
  if (!reducedMotion) {
    const colors = ['#059669', '#10b981', '#06b6d4', '#f59e0b', '#fbbf24', '#f97316'];
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 54; index += 1) {
      const particle = document.createElement('i');
      particle.className = 'acceptance-confetti-piece';
      particle.dataset.shape = index % 4 === 0 ? 'round' : 'strip';
      particle.style.setProperty('--confetti-x', `${Math.random() * 100}vw`);
      particle.style.setProperty('--confetti-drift', `${(Math.random() - 0.5) * 34}vw`);
      particle.style.setProperty('--confetti-rotate', `${540 + Math.random() * 900}deg`);
      particle.style.setProperty('--confetti-delay', `${Math.random() * 0.55}s`);
      particle.style.setProperty('--confetti-duration', `${2.25 + Math.random() * 1.15}s`);
      particle.style.setProperty('--confetti-color', colors[index % colors.length]);
      fragment.appendChild(particle);
    }
    particles.appendChild(fragment);
  }

  const banner = document.createElement('div');
  banner.className = 'acceptance-celebration-banner';

  const seal = document.createElement('span');
  seal.className = 'acceptance-celebration-seal';
  seal.setAttribute('aria-hidden', 'true');
  const w = window as any;
  if (w.RFUI?.setHTML) w.RFUI.setHTML(seal, '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>');

  const copy = document.createElement('div');
  copy.className = 'acceptance-celebration-copy';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'acceptance-celebration-eyebrow';
  eyebrow.textContent = t('celebrationEyebrow') || 'Paper Accepted!';
  const heading = document.createElement('strong');
  heading.textContent = t('celebrationTitle') || 'Congratulations on Acceptance';
  const desc = document.createElement('p');
  desc.textContent = title;
  copy.appendChild(eyebrow);
  copy.appendChild(heading);
  copy.appendChild(desc);

  banner.appendChild(seal);
  banner.appendChild(copy);
  layer.appendChild(particles);
  layer.appendChild(banner);
  document.body?.appendChild(layer);

  const cleanup = () => {
    if (layer.parentNode) layer.parentNode.removeChild(layer);
    acceptanceCelebrationCleanup = null;
  };
  acceptanceCelebrationCleanup = cleanup;
  window.setTimeout(cleanup, 4500);
}
