/**
 * Zotero PaperFlow - Host Navigation, Openers & Reader Integration
 */
import { CHROME_ROOT } from '../config.js';
import { createLifecycleScope } from '../modules/ui-utils/lifecycle.js';
import { windowScopes } from './window-lifecycle.js';
import {
  getLiteratureItem,
  serializeLiteratureItem
} from '../modules/academic-citation.js';

declare var Zotero: any;
declare var Services: any;

export const hostNavigationMethods = {
  getSelectedRegularItems(this: any, window: any) {
    const pane =
      window?.ZoteroPane ||
      (Zotero.getActiveZoteroPane ? Zotero.getActiveZoteroPane() : null) ||
      (Zotero.getMainWindow ? Zotero.getMainWindow().ZoteroPane : null);
    let rawSelection: any[] = [];
    try {
      if (pane?.getSelectedItems) {
        rawSelection = pane.getSelectedItems();
      }
    } catch (_) {}
    return rawSelection.map(getLiteratureItem).filter(Boolean);
  },

  getCurrentActiveItem(this: any, window: any) {
    const tabs = window?.Zotero_Tabs || (typeof (window as any).Zotero_Tabs !== 'undefined' ? (window as any).Zotero_Tabs : null);
    if (tabs && tabs.selectedTab && tabs.selectedTab.type === 'reader') {
      const reader = Zotero.Reader?.getByTabID?.(tabs.selectedTab.id);
      const itemID = reader?.itemID || tabs.selectedTab.data?.itemID;
      if (itemID) {
        const item = Zotero.Items.get(itemID);
        return getLiteratureItem(item);
      }
    }
    const selected = this.getSelectedRegularItems(window);
    return selected[0] || null;
  },

  getZoteroCollections(this: any, libraryID: any = null) {
    const targetLibID = libraryID || Zotero.Libraries?.userLibraryID || 1;
    const collections = Zotero.Collections?.getByLibrary?.(targetLibID) || [];
    return collections.map((col: any) => {
      let itemKeys: any[] = [];
      try {
        const childIds = typeof col.getChildItems === 'function' ? col.getChildItems(true) : [];
        itemKeys = (childIds || []).map((id: any) => {
          const it = Zotero.Items.get(id);
          return it?.key || null;
        }).filter(Boolean);
      } catch (_) {}
      return {
        id: col.id,
        key: col.key,
        name: col.name,
        parentID: col.parentID,
        itemKeys
      };
    });
  },

  openPdfAttachment(this: any, item: any, page: any = null) {
    const target = getLiteratureItem(item);
    if (!target) return;
    try {
      const attIds = typeof target.getAttachments === 'function' ? target.getAttachments() : [];
      for (const attId of attIds) {
        const att = Zotero.Items.get(attId);
        if (att && ((typeof att.isPDFAttachment === 'function' && att.isPDFAttachment()) || att.contentType === 'application/pdf')) {
          const win = Zotero.getMainWindow?.() || Services.wm?.getMostRecentWindow?.('navigator:browser');
          const pageIndex = (page && Number(page) > 0) ? Math.max(0, Number(page) - 1) : 0;
          if (Zotero.Reader && typeof Zotero.Reader.open === 'function') {
            Promise.resolve(Zotero.Reader.open(att.id, { pageIndex })).catch(() => {
              try { Zotero.Reader.open({ itemID: att.id, pageIndex }); } catch (_) {}
            });
            return;
          }
          if (win?.ZoteroPane?.openAttachment) {
            win.ZoteroPane.openAttachment(att.id);
            return;
          }
          break;
        }
      }
    } catch (err) {
      Zotero.logError?.('[PaperFlow] openPdfAttachment error: ' + err);
    }
  },

  createManuscriptFromSelection(this: any, window: any) {
    const items = this.getSelectedRegularItems(window);
    if (!items || items.length === 0) {
      this.showToast('未选择文献', '请在 Zotero 文献库中先选中一篇论文条目。', 'warning');
      return;
    }
    const serialized = serializeLiteratureItem(items[0]);
    this.triggerResearchFlowOpen(window, {
      action: 'create_manuscript_from_item',
      item: serialized
    });
  },

  linkSelectionToManuscript(this: any, window: any) {
    const items = this.getSelectedRegularItems(window);
    if (!items || items.length === 0) {
      this.showToast('未选择文献', '请在 Zotero 文献库中先选中一篇论文条目。', 'warning');
      return;
    }
    const serialized = serializeLiteratureItem(items[0]);
    this.triggerResearchFlowOpen(window, {
      action: 'link_item_to_manuscript',
      item: serialized
    });
  },

  async createManuscriptFromCollection(this: any, collection: any, window: any = null) {
    if (!collection) return;
    try {
      const win = window || (Zotero.getMainWindow ? Zotero.getMainWindow() : null);
      const childItemIDs = collection.getChildItems ? collection.getChildItems(true) : [];
      const childMetas: any[] = [];
      for (const id of childItemIDs.slice(0, 30)) {
        const item = Zotero.Items.get(id);
        const lit = getLiteratureItem(item);
        if (lit) {
          childMetas.push(serializeLiteratureItem(lit));
        }
      }
      this.triggerResearchFlowOpen(win, {
        action: 'create_from_collection',
        collectionName: collection.name,
        collectionId: collection.id,
        items: childMetas
      });
    } catch (err) {
      Zotero.logError?.('[PaperFlow] createManuscriptFromCollection error: ' + err);
    }
  },

  async createRecordFromReader(this: any, window: any = null) {
    const win = window || (Zotero.getMainWindow ? Zotero.getMainWindow() : null);
    const tabs = win?.Zotero_Tabs || (typeof (win as any)?.Zotero_Tabs !== 'undefined' ? (win as any).Zotero_Tabs : null);
    if (!win?.reader && (!tabs || !tabs.selectedTab || tabs.selectedTab.type !== 'reader')) {
      const selected = this.getSelectedRegularItems(win);
      if (selected.length > 0) {
        this.createManuscriptFromSelection(win);
      }
      return;
    }

    try {
      const reader = win?.reader || Zotero.Reader?.getByTabID?.(tabs.selectedTab.id);
      const itemID = reader?.itemID || tabs?.selectedTab?.data?.itemID;
      if (!itemID) return;

      const attachmentItem = Zotero.Items.get(itemID);
      const regularItem = getLiteratureItem(attachmentItem);
      if (!regularItem) return;

      const meta = serializeLiteratureItem(regularItem);

      // Get selected text if any
      let selectedText = '';
      try {
        if (typeof reader.getSelectedText === 'function') {
          selectedText = await reader.getSelectedText();
        }
      } catch (_) {}

      if (!selectedText && reader._iframeWindow) {
        try {
          selectedText = reader._iframeWindow.getSelection?.()?.toString() || '';
        } catch (_) {}
      }
      selectedText = String(selectedText || '').trim();

      // Get page index
      let pageIndex = 0;
      try {
        if (reader.state && typeof reader.state.pageIndex === 'number') {
          pageIndex = reader.state.pageIndex;
        } else if (reader._iframeWindow?.PDFViewerApplication?.page) {
          pageIndex = reader._iframeWindow.PDFViewerApplication.page - 1;
        }
      } catch (_) {}
      const pageNum = pageIndex + 1;

      // Construct PDF anchor deep link
      const pdfKey = attachmentItem?.key || meta.key;
      const groupID = Zotero.Libraries?.get?.(regularItem.libraryID)?.groupID;
      const pageLink = groupID
        ? `zotero://open-pdf/groups/${groupID}/items/${pdfKey}?page=${pageNum}`
        : `zotero://open-pdf/library/items/${pdfKey}?page=${pageNum}`;

      this.triggerResearchFlowOpen(win, {
        action: 'reader_excerpt',
        item: meta,
        excerpt: selectedText,
        page: pageNum,
        pdfLink: pageLink
      });
    } catch (err) {
      Zotero.logError?.('[PaperFlow] createRecordFromReader error: ' + err);
    }
  },

  triggerResearchFlowOpen(this: any, window: any, options: any = {}) {
    const mode = this.getPref('windowMode', 'tab');
    if (mode === 'subwindow') {
      this.openStandaloneWindow(options, window, 'subwindow');
    } else if (mode === 'window') {
      this.openStandaloneWindow(options, window, 'window');
    } else {
      this.openResearchFlow(options, window, 'tab');
    }
  },

  openResearchFlow(this: any, options: any = {}, targetWindow: any = null, windowType = 'tab') {
    try {
      const mainWin = (targetWindow && (targetWindow as any).Zotero_Tabs)
        ? targetWindow
        : (Zotero.getMainWindow ? Zotero.getMainWindow() : Services.wm?.getMostRecentWindow?.('navigator:browser'));

      if (windowType === 'tab' && mainWin && mainWin.Zotero_Tabs) {
        const tabs = mainWin.Zotero_Tabs;
        // Check if tab already exists
        const existingTab = tabs._tabs?.find?.((t: any) => t.type === 'researchflow') ||
          tabs._tabs?.find?.((t: any) => t.title && (t.title.includes('Zotero PaperFlow') || t.title.includes('ResearchFlow')));

        if (existingTab) {
          tabs.select(existingTab.id);
          if (mainWin.focus) mainWin.focus();

          const iframe = mainWin.document.getElementById('researchflow-tab-iframe') ||
            (existingTab.container && existingTab.container.querySelector('iframe'));
          if (iframe) {
            iframe._researchflowPending = options;
            try {
              if (iframe.contentWindow?.postMessage) {
                iframe.contentWindow.postMessage({ type: 'RESEARCHFLOW_NAVIGATE', options }, '*');
              }
            } catch (_) {}
          }
          return;
        }

        // Open new internal tab
        const tabScope = createLifecycleScope(windowScopes.get(mainWin)?.signal);
        const tabResult = tabs.add({
          type: 'researchflow',
          title: 'Zotero PaperFlow',
          select: true,
          data: options,
          onClose: () => {
            tabScope.abort('tab-close');
            Zotero.log?.('[PaperFlow] Tab closed');
          }
        });

        const container = (tabResult && tabResult.container) ||
          (tabs.getTabContainer && tabs.getTabContainer(tabResult.id || tabResult)) ||
          (tabs.getTab && tabs.getTab(tabResult?.id)?.container);

        if (container) {
          const doc = container.ownerDocument || mainWin.document;
          const iframe = doc.createElement('iframe');
          iframe.id = 'researchflow-tab-iframe';
          iframe.setAttribute('src', `${CHROME_ROOT}index.html`);
          iframe.setAttribute('style', 'width: 100%; height: 100%; border: none; flex: 1; display: block;');
          iframe.setAttribute('flex', '1');
          iframe._researchflowReady = false;
          iframe._researchflowPending = options;

          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.overflow = 'hidden';

          tabScope.on(iframe, 'load', () => {
            if (this._disposed || tabScope.aborted) return;
            try {
              if (iframe.contentWindow) {
                iframe.contentWindow.Zotero = Zotero;
                iframe.contentWindow._researchflowPending = options;
                if (iframe.contentWindow.postMessage) {
                  iframe.contentWindow.postMessage({ type: 'RESEARCHFLOW_NAVIGATE', options }, '*');
                }
              }
            } catch (_) {}
          });

          container.appendChild(iframe);
        }

        if (mainWin.focus) mainWin.focus();
        return;
      }
    } catch (e) {
      Zotero.logError?.('[PaperFlow] openResearchFlow error: ' + e);
    }

    this.openStandaloneWindow(options, targetWindow, 'window');
  }
};
