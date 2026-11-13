/**
 * Zotero PaperFlow settings pane script for Zotero 10 ~ 12
 */

import { DEFAULTS, FIELDS } from './preferences/schema.js';
import {
  getPrefValue,
  setPrefValue,
  buildSettingRow,
  updateSubordinateStates,
  renderPreferencesSection,
  initPreferencesWindow
} from './preferences/controller.js';

export const ResearchFlow_Preferences = {
  DEFAULTS,
  FIELDS,
  getPrefValue,
  setPrefValue,
  buildSettingRow,
  updateSubordinateStates,
  renderPreferencesSection,
  init: initPreferencesWindow,
  initPreferencesWindow
};

export {
  DEFAULTS,
  FIELDS,
  getPrefValue,
  setPrefValue,
  buildSettingRow,
  updateSubordinateStates,
  renderPreferencesSection,
  initPreferencesWindow
};

const initializedDocs = new WeakSet<Document>();

function safeInitPreferencesWindow(win: Window): void {
  const doc = win?.document;
  if (!doc || initializedDocs.has(doc)) return;
  if (!doc.getElementById('rf-pref-window')) return;
  initializedDocs.add(doc);
  initPreferencesWindow(win);
}

if (typeof window !== 'undefined') {
  (window as any).ResearchFlow_Preferences = {
    ...ResearchFlow_Preferences,
    init: (win: Window) => safeInitPreferencesWindow(win),
  };
  (window as any).initPreferencesWindow = initPreferencesWindow;
  (window as any).DEFAULTS = DEFAULTS;
  (window as any).FIELDS = FIELDS;

  const doc = window.document;
  if (doc) {
    if (doc.getElementById('rf-pref-window')) {
      safeInitPreferencesWindow(window);
    } else if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', () => safeInitPreferencesWindow(window), { once: true });
    }
    window.addEventListener('load', () => safeInitPreferencesWindow(window), { once: true });
  }
}
