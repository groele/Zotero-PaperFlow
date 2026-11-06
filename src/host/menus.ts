/**
 * Zotero PaperFlow - Host Context Menus
 */
import { ADDON_ID, CHROME_ROOT } from '../config.js';

declare var Zotero: any;
declare var Services: any;

export const hostMenuMethods = {
  registerMenus(this: any) {
    this.updateItemContextMenu();
    this.updateReaderContextMenu();
  },

  updateReaderContextMenu(this: any) {
    if (this._menuManagerReader && Zotero.MenuManager?.unregisterMenu) {
      try {
        Zotero.MenuManager.unregisterMenu(this._menuManagerReader);
      } catch (_) {}
      this._menuManagerReader = null;
    }

    const enableReader = Boolean(this.getPref('enableReaderIntegration', true));
    if (enableReader && Zotero.MenuManager && typeof Zotero.MenuManager.registerMenu === 'function') {
      try {
        this._menuManagerReader = Zotero.MenuManager.registerMenu({
          menuID: 'researchflow-reader-context',
          pluginID: ADDON_ID,
          target: 'reader/menubar/edit',
          menus: [
            {
              menuType: 'menuitem',
              label: '📝 摘录至 Zotero PaperFlow 稿件研究笔记',
              icon: `${CHROME_ROOT}icons/researchflow.svg`,
              onCommand: (event: any) => {
                try {
                  this.createRecordFromReader((event?.target as HTMLElement)?.ownerDocument?.defaultView || (event?.target as any)?.ownerGlobal);
                } catch (err) {
                  Zotero.logError?.('[PaperFlow] Reader context error: ' + err);
                }
              }
            }
          ]
        });
      } catch (err) {
        Zotero.logError?.('[PaperFlow] MenuManager register failed: ' + err);
      }
    }
  },

  updateItemContextMenu(this: any) {
    if (this._menuManagerItem && Zotero.MenuManager?.unregisterMenu) {
      try {
        Zotero.MenuManager.unregisterMenu(this._menuManagerItem);
      } catch (_) {}
      this._menuManagerItem = null;
    }

    this.purgeStaleContextMenus();

    const showContextMenu = Boolean(this.getPref('showContextMenu', false));
    if (showContextMenu && Zotero.MenuManager && typeof Zotero.MenuManager.registerMenu === 'function') {
      try {
        this._menuManagerItem = Zotero.MenuManager.registerMenu({
          menuID: 'researchflow-itemmenu-actions',
          pluginID: ADDON_ID,
          target: 'main/library/item',
          menus: [
            {
              menuType: 'menuitem',
              label: '新建论文稿件管线',
              icon: `${CHROME_ROOT}icons/researchflow.svg`,
              onCommand: () => {
                try {
                  this.createManuscriptFromSelection();
                } catch (err) {
                  Zotero.logError?.('[PaperFlow] MenuManager create error: ' + err);
                }
              }
            },
            {
              menuType: 'menuitem',
              label: '关联到现有稿件',
              icon: `${CHROME_ROOT}icons/researchflow.svg`,
              onCommand: () => {
                try {
                  this.linkSelectionToManuscript();
                } catch (err) {
                  Zotero.logError?.('[PaperFlow] MenuManager link error: ' + err);
                }
              }
            }
          ]
        });
      } catch (err) {
        Zotero.logError?.('[PaperFlow] MenuManager register failed: ' + err);
      }
    }
  },

  purgeStaleContextMenus(this: any, targetWindow?: any) {
    const staleMenuIds = [
      'researchflow-tools-preferences',
      'researchflow-itemmenu-separator',
      'researchflow-itemmenu-create',
      'researchflow-itemmenu-link',
      'researchflow-collectionmenu-separator',
      'researchflow-collectionmenu-create',
    ];
    const windows = targetWindow
      ? [targetWindow]
      : (() => {
          const list: any[] = [];
          if (typeof Services !== 'undefined' && Services.wm?.getEnumerator) {
            try {
              const en = Services.wm.getEnumerator('');
              if (en && en.hasMoreElements()) {
                while (en.hasMoreElements()) list.push(en.getNext());
              } else {
                const enBrowser = Services.wm.getEnumerator('navigator:browser');
                while (enBrowser && enBrowser.hasMoreElements()) list.push(enBrowser.getNext());
              }
            } catch (_) {}
          }
          return list;
        })();

    windows.forEach((win: any) => {
      const doc = win?.document;
      if (!doc) return;
      staleMenuIds.forEach((id) => {
        try {
          doc.getElementById(id)?.remove();
        } catch (_) {}
      });
      doc.querySelectorAll?.('[pane-id="researchflow-item-pane"], [data-pane-id="researchflow-item-pane"], #researchflow-item-pane').forEach((el: any) => {
        try { el.remove(); } catch (_) {}
      });
    });
  },

  unregisterMenus(this: any) {
    if (this._menuManagerItem && Zotero.MenuManager?.unregisterMenu) {
      try { Zotero.MenuManager.unregisterMenu(this._menuManagerItem); } catch (_) {}
      this._menuManagerItem = null;
    }
    if (this._menuManagerReader && Zotero.MenuManager?.unregisterMenu) {
      try { Zotero.MenuManager.unregisterMenu(this._menuManagerReader); } catch (_) {}
      this._menuManagerReader = null;
    }
    this.purgeStaleContextMenus();
  }
};
