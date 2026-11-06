/**
 * Zotero PaperFlow - Academic Citation & Literature Serialization Engine
 */
import {
  extractCiteKey,
  generateBibTeX,
  generateAPACitation
} from './academic-citation/formatters.js';

import {
  itemSelectUri,
  getLiteratureItem,
  findItemByKey,
  STATUS_TAG_MAP,
  getLiteratureAnnotations,
  getRelatedItems,
  getLiteratureCollections,
  getLiteratureNotes,
  getLiteratureReadingAssets,
  serializeLiteratureItem
} from './academic-citation/items.js';

export {
  extractCiteKey,
  generateBibTeX,
  generateAPACitation,
  itemSelectUri,
  getLiteratureItem,
  findItemByKey,
  STATUS_TAG_MAP,
  getLiteratureAnnotations,
  getRelatedItems,
  getLiteratureCollections,
  getLiteratureNotes,
  getLiteratureReadingAssets,
  serializeLiteratureItem
};

export const RFAcademicCitation = {
  itemSelectUri,
  getLiteratureItem,
  findItemByKey,
  STATUS_TAG_MAP,
  extractCiteKey,
  generateBibTeX,
  generateAPACitation,
  getLiteratureAnnotations,
  getRelatedItems,
  getLiteratureCollections,
  getLiteratureNotes,
  getLiteratureReadingAssets,
  serializeLiteratureItem
};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).RFAcademicCitation = RFAcademicCitation;
}
if (typeof window !== 'undefined') {
  (window as any).RFAcademicCitation = RFAcademicCitation;
}
