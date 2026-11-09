/**
 * Zotero PaperFlow - Share Card Generator Entry Point
 */
import {
  CARD_WIDTH,
  BASE_HEIGHT,
  STORY_MIN_HEIGHT,
  MAX_HEIGHT,
  MAX_PIXEL_HEIGHT,
  RESOLUTION_SCALES,
  BRAND_SIZES,
  THEMES,
  VISIBLE_FIELDS,
  buildSubmissionShareCardData
} from './share-card/constants-and-data.js';

import {
  wrapTextLines,
  getShareCardLayout,
  renderSubmissionShareCard
} from './share-card/canvas-renderer.js';

export const RFShareCard = {
  CARD_WIDTH,
  BASE_HEIGHT,
  STORY_MIN_HEIGHT,
  MAX_HEIGHT,
  MAX_PIXEL_HEIGHT,
  RESOLUTION_SCALES,
  BRAND_SIZES: Array.from(BRAND_SIZES),
  THEMES: Object.keys(THEMES),
  VISIBLE_FIELDS,
  buildSubmissionShareCardData,
  getShareCardLayout,
  wrapTextLines,
  renderSubmissionShareCard
};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).RFShareCard = RFShareCard;
}
if (typeof window !== 'undefined') {
  (window as any).RFShareCard = RFShareCard;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RFShareCard;
}
