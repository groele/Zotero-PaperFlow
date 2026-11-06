/**
 * Zotero PaperFlow - Host Child Note Cloud Syncing
 */
import { getLiteratureItem } from '../modules/academic-citation.js';

declare var Zotero: any;
declare var RFArchitectureGuard: any;

export const hostChildNoteMethods = {
  async syncManuscriptToChildNote(this: any, item: any, manuscript = null) {
    if (typeof RFArchitectureGuard !== 'undefined' && RFArchitectureGuard.syncManuscriptToChildNote) {
      return RFArchitectureGuard.syncManuscriptToChildNote(this, item, manuscript);
    }
    const target = getLiteratureItem(item);
    if (!target || target.deleted || (typeof target.isEditable === 'function' && !target.isEditable())) {
      Zotero.logError?.('[PaperFlow] syncManuscriptToChildNote blocked: Item is read-only or in trash');
      return null;
    }
    return null;
  }
};
