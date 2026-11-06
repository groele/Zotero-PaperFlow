/**
 * Zotero PaperFlow - Extension Shutdown & Lifecycle Teardown
 */
import { injectedElements, clearWindowListener } from './window-lifecycle.js';

declare var Zotero: any;

export const hostShutdownMethods = {
  async shutdown(this: any) {
    for (const win of this._standaloneWindows || []) {
      try { win.close(); } catch (_) {}
    }
    this._standaloneWindows?.clear();
    this._recoveryTokens?.clear();
    this._dataListeners?.clear();
    this.destroyNotifier();
    this.destroyPrefObserver();
    this.unregisterMenus();
    clearWindowListener();

    for (const [, elements] of injectedElements) {
      elements.forEach((el: any) => {
        try {
          if (typeof el?.remove === 'function') el.remove();
          else if (el?.parentNode) el.parentNode.removeChild(el);
        } catch (_) {}
      });
    }
    injectedElements.clear();

    if (this._prefPaneID && Zotero.PreferencePanes?.unregister) {
      try {
        Zotero.PreferencePanes.unregister(this._prefPaneID);
      } catch (_) {}
      this._prefPaneID = null;
    }

    if (this.itemPaneSectionID && Zotero.ItemPaneManager?.unregisterSection) {
      try {
        Zotero.ItemPaneManager.unregisterSection(this.itemPaneSectionID);
      } catch (_) {}
      this.itemPaneSectionID = null;
    }

    Zotero.log?.('[PaperFlow] Shutdown complete');
  }
};
