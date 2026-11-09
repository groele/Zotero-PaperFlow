/**
 * Zotero PaperFlow - Share Journey Studio Entry Point
 */
import {
  SHARE_THEME_DEFAULT,
  SHARE_SIZE_DEFAULT,
  SHARE_TIMELINE_START_DEFAULT,
  SHARE_BRAND_SIZE_DEFAULT,
  SHARE_RESOLUTION_DEFAULT,
  getShareThemes,
  getShareFieldControls,
  normalizeSharePreferences,
  getSharePreferences,
  persistSharePreferences,
  buildSubmissionShareJourneyData,
  canvasToPngBlob,
  shareCardFileName,
  savePngBlobWithPath,
  copyPngBlobToClipboard
} from './share-studio/preferences-and-data.js';

import {
  clearActiveSharePreview,
  openSubmissionShareModal
} from './share-studio/modal-controller.js';

const shareStudioExports = {
  SHARE_THEME_DEFAULT,
  SHARE_SIZE_DEFAULT,
  SHARE_TIMELINE_START_DEFAULT,
  SHARE_BRAND_SIZE_DEFAULT,
  SHARE_RESOLUTION_DEFAULT,
  getShareThemes,
  getShareFieldControls,
  normalizeSharePreferences,
  getSharePreferences,
  persistSharePreferences,
  buildSubmissionShareJourneyData,
  canvasToPngBlob,
  shareCardFileName,
  savePngBlobWithPath,
  copyPngBlobToClipboard,
  clearActiveSharePreview,
  openSubmissionShareModal,
  openSubmissionSharePreview: openSubmissionShareModal
};

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, shareStudioExports);
}
if (typeof window !== 'undefined') {
  Object.assign(window, shareStudioExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...(module.exports || {}), ...shareStudioExports };
}
