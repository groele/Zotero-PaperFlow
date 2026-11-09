/**
 * Zotero PaperFlow - Workspace Options Controller Entry Point
 */
import {
  RF_OPTIONS_RENDER_VERSION,
  UI_THEME_OPTIONS,
  activateWorkspaceView,
  focusSubmissionEditCenter,
  openSubmissionForEditing,
  getModalFocusableElements,
  openModal,
  registerModalCleanup,
  closeModal,
  bindModalAndNavListeners,
  showGlobalToast,
  showAcceptanceCelebration
} from './options/navigation-and-modal.js';

import {
  bindZoteroActionListeners,
  initializeWorkspace
} from './options/bootstrap-and-actions.js';

bindZoteroActionListeners();
document.addEventListener('DOMContentLoaded', () => {
  initializeWorkspace();
});
bindModalAndNavListeners();

const optionsExports = {
  RF_OPTIONS_RENDER_VERSION,
  UI_THEME_OPTIONS,
  activateWorkspaceView,
  focusSubmissionEditCenter,
  openSubmissionForEditing,
  getModalFocusableElements,
  openModal,
  registerModalCleanup,
  closeModal,
  showGlobalToast,
  showAcceptanceCelebration
};

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, optionsExports);
  (globalThis as any).modal = document.getElementById('modal-overlay');
  (globalThis as any).modalContent = document.getElementById('modal-body');
}
if (typeof window !== 'undefined') {
  Object.assign(window, optionsExports);
  (window as any).modal = document.getElementById('modal-overlay');
  (window as any).modalContent = document.getElementById('modal-body');
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...(module.exports || {}), ...optionsExports };
}
