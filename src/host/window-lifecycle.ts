/**
 * Zotero PaperFlow - Window Lifecycle & DOM Injection
 */
import { ADDON_ID, CHROME_ROOT } from '../config.js';
import { createHostMessageHandler } from './message-handler.js';

declare var Zotero: any;
declare var Services: any;
declare var Ci: any;

export const injectedElements = new Map<any, any>();
export const pendingWindowLoads = new Map<any, any>();
let activeWindowListener: any = null;

export function getWindowListener() {
  return activeWindowListener;
}

export function clearWindowListener() {
  if (activeWindowListener && Services.wm?.removeListener) {
    try {
      Services.wm.removeListener(activeWindowListener);
    } catch (_) {}
  }
  activeWindowListener = null;
}

export const hostWindowLifecycleMethods = {
  createXULElement(this: any, doc: any, tagName: string) {
    if (!doc) return null;
    if (typeof doc.createXULElement === 'function') {
      return doc.createXULElement(tagName);
    }
    return doc.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', tagName);
  },

  async init(this: any) {
    Zotero.log?.('[PaperFlow] Initializing host runtime...');
    await this.loadDatabase();

    this.initNotifier();
    this.initPrefObserver();
    this.registerMenus();
    this.initWindowListener();

    const winEnum = Services.wm?.getEnumerator ? Services.wm.getEnumerator('') : null;
    const windows = (winEnum && winEnum.hasMoreElements()) ? winEnum : Services.wm?.getEnumerator?.('navigator:browser');
    while (windows && windows.hasMoreElements()) {
      const win = windows.getNext();
      this.addToWindow(win);
    }

    // Register Zotero Preference Pane
    if (Zotero.PreferencePanes && typeof Zotero.PreferencePanes.register === 'function') {
      try {
        const prefSrc = this.rootURI
          ? `${this.rootURI}chrome/content/preferences.xhtml`
          : `${CHROME_ROOT}preferences.xhtml`;
        const prefScript = this.rootURI
          ? `${this.rootURI}chrome/content/scripts/preferences.js`
          : `${CHROME_ROOT}scripts/preferences.js`;
        const prefCss = this.rootURI
          ? `${this.rootURI}chrome/content/assets/preferences.css`
          : `${CHROME_ROOT}assets/preferences.css`;
        const prefIcon = this.rootURI
          ? `${this.rootURI}chrome/content/icons/researchflow.svg`
          : `${CHROME_ROOT}icons/researchflow.svg`;

        this._prefPaneID = await Zotero.PreferencePanes.register({
          pluginID: ADDON_ID,
          id: 'researchflow-preferences-pane',
          src: prefSrc,
          label: 'Zotero PaperFlow',
          image: prefIcon,
          scripts: [prefScript],
          stylesheets: [prefCss],
        });
      } catch (prefErr) {
        Zotero.log?.('[PaperFlow] PreferencePanes registration note: ' + prefErr);
      }
    }

    this.updateItemPaneSection();
    Zotero.log?.('[PaperFlow] Initialized successfully in Zotero');
  },

  updateItemPaneSection(this: any) {
    const enabled = Boolean(this.getPref('enableItemPane', false));
    if (enabled) {
      if (!this.itemPaneSectionID) {
        this.registerItemPaneSection();
      }
    } else {
      if (this.itemPaneSectionID && typeof Zotero.ItemPaneManager?.unregisterSection === 'function') {
        try {
          Zotero.ItemPaneManager.unregisterSection(this.itemPaneSectionID);
        } catch (_) {}
        this.itemPaneSectionID = null;
      } else if (typeof Zotero.ItemPaneManager?.unregisterSection === 'function') {
        try {
          Zotero.ItemPaneManager.unregisterSection('researchflow-item-pane');
        } catch (_) {}
      }
    }
  },

  initWindowListener(this: any) {
    activeWindowListener = {
      onOpenWindow: (xulWindow: any) => {
        let domWindow;
        try {
          domWindow = xulWindow
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
        } catch (_) {
          return;
        }
        const onLoad = () => {
          domWindow.removeEventListener('load', onLoad, false);
          pendingWindowLoads.delete(domWindow);
          if (!domWindow.closed) Zotero.ResearchFlow?.addToWindow(domWindow);
        };
        pendingWindowLoads.set(domWindow, onLoad);
        domWindow.addEventListener('load', onLoad, { once: true });
        if (domWindow.document?.readyState === 'complete') onLoad();
      },
      onCloseWindow: (xulWindow: any) => {
        try {
          const domWindow = xulWindow
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
          const onLoad = pendingWindowLoads.get(domWindow);
          if (onLoad) domWindow.removeEventListener('load', onLoad, false);
          pendingWindowLoads.delete(domWindow);
          Zotero.ResearchFlow?.removeFromWindow(domWindow);
        } catch (_) {}
      }
    };
    Services.wm?.addListener?.(activeWindowListener);
  },

  addToWindow(this: any, window: any) {
    if (!window || !window.document) return;
    const doc = window.document;

    this.purgeStaleContextMenus(window);

    if (doc.getElementById('researchflow-tools-menu')) return;

    const windowElements: any[] = [];
    this.ensureLocalization(doc);

    // 1. Add to "Tools" Menu
    const toolsPopup = doc.getElementById('menu_ToolsPopup');
    if (toolsPopup) {
      const toolsItem = this.createXULElement(doc, 'menuitem');
      toolsItem.id = 'researchflow-tools-menu';
      toolsItem.setAttribute('label', 'Zotero PaperFlow 工作台');
      toolsItem.setAttribute('image', `${CHROME_ROOT}icons/researchflow.svg`);
      toolsItem.setAttribute('class', 'menuitem-iconic');
      toolsItem.addEventListener('command', () => {
        this.triggerResearchFlowOpen(window);
      });
      toolsPopup.appendChild(toolsItem);
      windowElements.push(toolsItem);
    }

    // 2. Inject Tab & Toolbar Icon Style
    try {
      if (!doc.getElementById('researchflow-tab-style')) {
        const style = doc.createElement('style');
        style.id = 'researchflow-tab-style';
        style.textContent = `
          tab[type="researchflow"] .tab-icon,
          .tab[type="researchflow"] .tab-icon {
            list-style-image: url("${CHROME_ROOT}icons/researchflow.svg") !important;
            width: 16px !important;
            height: 16px !important;
            max-width: 16px !important;
            max-height: 16px !important;
          }

          #researchflow-toolbar-button,
          toolbarbutton#researchflow-toolbar-button {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            max-width: 28px !important;
            max-height: 28px !important;
            padding: 0 4px !important;
            margin: 0 4px !important;
            box-sizing: border-box !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
          }

          #researchflow-toolbar-button .toolbarbutton-icon,
          #researchflow-toolbar-button image,
          #researchflow-toolbar-button img {
            width: 20px !important;
            height: 20px !important;
            min-width: 20px !important;
            max-width: 20px !important;
            min-height: 20px !important;
            max-height: 20px !important;
            object-fit: contain !important;
            display: block !important;
            margin: 0 auto !important;
          }

          menuitem#researchflow-tools-menu .menu-iconic-icon,
          menuitem#researchflow-itemmenu-create .menu-iconic-icon,
          menuitem#researchflow-itemmenu-link .menu-iconic-icon,
          menuitem#researchflow-collectionmenu-create .menu-iconic-icon {
            width: 16px !important;
            height: 16px !important;
            max-width: 16px !important;
            max-height: 16px !important;
          }
        `;
        (doc.head || doc.documentElement).appendChild(style);
        windowElements.push(style);
      }
    } catch (_) {}

    // 3. Global Keyboard Shortcuts: Ctrl+Alt+R to open, Ctrl+Shift+R to capture/create from selection or reader
    const handleGlobalKeyDown = (e: any) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault?.();
        e.stopPropagation?.();
        this.triggerResearchFlowOpen(window);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault?.();
        e.stopPropagation?.();
        const tabs = window?.Zotero_Tabs || (typeof (window as any).Zotero_Tabs !== 'undefined' ? (window as any).Zotero_Tabs : null);
        if (tabs && tabs.selectedTab && tabs.selectedTab.type === 'reader') {
          this.createRecordFromReader(window);
        } else {
          this.createManuscriptFromSelection(window);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    windowElements.push({
      remove: () => window.removeEventListener('keydown', handleGlobalKeyDown, true),
    });

    // 4. Host-level listener for postMessages from iframes
    const handleHostMessage = createHostMessageHandler(this, window);
    window.addEventListener('message', handleHostMessage);
    windowElements.push({
      remove: () => window.removeEventListener('message', handleHostMessage),
    });

    // 5. Toolbar Button Injection
    this.ensureToolbarButton(window, windowElements);

    injectedElements.set(window, windowElements);
  },

  removeFromWindow(this: any, window: any) {
    if (!window || !injectedElements.has(window)) return;
    const elements = injectedElements.get(window);
    elements.forEach((el: any) => {
      try {
        if (typeof el?.remove === 'function') el.remove();
        else if (el?.parentNode) el.parentNode.removeChild(el);
      } catch (_) {}
    });
    injectedElements.delete(window);
  }
};
