/**
 * Zotero PaperFlow - Toast Notifications & Acceptance Celebrations
 */
import { createLifecycleScope, type LifecycleScope } from '../ui-utils/lifecycle.js';

declare var db: any;
declare var ZoteroBridge: any;
declare var acceptanceCelebrationCleanup: (() => void) | null;
declare function t(key: string): string;

let celebrationScope: LifecycleScope | null = null;
let toastScope: LifecycleScope | null = null;

function ensureToastScope(): LifecycleScope {
  if (!toastScope || toastScope.aborted) {
    toastScope = createLifecycleScope();
    if (typeof window !== 'undefined') {
      toastScope.on(window, 'unload', () => {
        toastScope?.abort('unload');
        celebrationScope?.abort('unload');
      }, { once: true });
    }
  }
  return toastScope;
}

export function showGlobalToast(message: string, type = 'info'): void {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const scope = ensureToastScope();
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

  scope.setTimeout(() => {
    toast.classList.add('fade-out');
    scope.setTimeout(() => toast.remove(), 300);
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

  const scope = ensureToastScope();
  const cleanup = () => {
    celebrationScope?.abort('celebration-cleanup');
    celebrationScope = null;
    if (layer.parentNode) layer.parentNode.removeChild(layer);
    acceptanceCelebrationCleanup = null;
  };
  celebrationScope?.abort('replace-celebration');
  celebrationScope = scope.child();
  acceptanceCelebrationCleanup = cleanup;
  celebrationScope.setTimeout(cleanup, 4500);
}
