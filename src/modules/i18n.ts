/**
 * Zotero PaperFlow - I18N and Localization Module Entry Point
 */
import {
  I18N,
  t,
  tf,
  normalizeThemePreference,
  resolvePreferredLanguage,
  applyThemePreference,
  isDarkThemeActive,
  normalizeText,
  normalizeSubmissionStatus,
  normalizeSubmissionStatuses,
  normalizeDoi,
  extractDoiFromText,
  normalizeKanbanStatusClass,
  getSubmissionStatusLabel,
  getManuscriptStatusLabel
} from './i18n/status-helpers.js';

import {
  setText,
  setAllText,
  setPlaceholder,
  setTitle,
  setOptionText,
  setTableHeaderText,
  setNavText,
  setButtonText,
  setFilterCardTitle,
  applyLanguage,
  defaultTimelineNameKeys,
  getTimelineNodeDisplayName,
  submissionComplianceChecklistPresets
} from './i18n/apply-language.js';

const i18nExports = {
  I18N,
  t,
  tf,
  normalizeThemePreference,
  resolvePreferredLanguage,
  applyThemePreference,
  isDarkThemeActive,
  normalizeText,
  normalizeSubmissionStatus,
  normalizeSubmissionStatuses,
  normalizeDoi,
  extractDoiFromText,
  normalizeKanbanStatusClass,
  getSubmissionStatusLabel,
  getManuscriptStatusLabel,
  setText,
  setAllText,
  setPlaceholder,
  setTitle,
  setOptionText,
  setTableHeaderText,
  setNavText,
  setButtonText,
  setFilterCardTitle,
  applyLanguage,
  defaultTimelineNameKeys,
  getTimelineNodeDisplayName,
  submissionComplianceChecklistPresets
};

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, i18nExports);
}
if (typeof window !== 'undefined') {
  Object.assign(window, i18nExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...(module.exports || {}), ...i18nExports };
}
