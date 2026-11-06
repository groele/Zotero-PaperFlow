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

if (typeof window !== 'undefined') {
  (window as any).initPreferencesWindow = initPreferencesWindow;
  (window as any).DEFAULTS = DEFAULTS;
  (window as any).FIELDS = FIELDS;
}
