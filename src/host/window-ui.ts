/**
 * Zotero PaperFlow - Host Toolbar UI and Standalone Window Launchers
 */
import { CHROME_ROOT } from '../config.js';

declare var Zotero: any;
declare var Services: any;

export const hostWindowUiMethods = {
  ensureToolbarButton(this: any, window: any, windowElements: any[], retryCount = 0) {
    if (!window || !window.document) return;
    const doc = window.document;

    const toolbar =
      doc.getElementById('zotero-item-toolbar') ||
      doc.getElementById('zotero-items-toolbar') ||
      doc.getElementById('zotero-tb');

    if (!toolbar) {
      if (retryCount < 5) {
        const retryTimer = window.setTimeout(() => this.ensureToolbarButton(window, windowElements, retryCount + 1), 500);
        if (windowElements) {
          windowElements.push({ remove: () => window.clearTimeout(retryTimer) });
        }
      }
      return;
    }

    const isResearchFlowButton = (b: any) =>
      b.id === 'researchflow-toolbar-button' ||
      ((b.getAttribute('label') === 'Zotero PaperFlow' || b.getAttribute('label') === 'ResearchFlow') &&
        String(b.getAttribute('image') || '').includes('researchflow.svg'));

    const existing = (Array.from(doc.querySelectorAll('toolbarbutton')) as any[]).filter(isResearchFlowButton);
    let btn: any = existing[0] || null;
    if (existing.length > 1) {
      for (let i = 1; i < existing.length; i++) {
        try { existing[i].remove(); } catch (_) {}
      }
    }

    if (!btn) {
      btn = this.createXULElement(doc, 'toolbarbutton');
      btn.id = 'researchflow-toolbar-button';
      btn.setAttribute('data-l10n-id', 'researchflow-toolbar-tooltip');
      btn.setAttribute('data-l10n-attrs', 'tooltiptext,aria-label');
      const zh = !Zotero?.locale || String(Zotero.locale).toLowerCase().startsWith('zh');
      btn.setAttribute('tooltiptext', zh ? '打开 Zotero PaperFlow 工作台 (Ctrl+Alt+R)' : 'Open Zotero PaperFlow Workspace (Ctrl+Alt+R)');
      btn.setAttribute('image', `${CHROME_ROOT}icons/researchflow.svg`);
      btn.setAttribute('class', 'zotero-tb-button toolbarbutton-1 chromeclass-toolbar-additional');
      btn.setAttribute(
        'style',
        'cursor: pointer; margin: 0 4px; width: 28px; height: 28px; min-width: 28px; max-width: 28px; max-height: 28px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden;'
      );
      btn.addEventListener('command', (e: any) => {
        if (e) {
          e.preventDefault?.();
          e.stopPropagation?.();
        }
        this.triggerResearchFlowOpen(window);
      });
    }

    btn.setAttribute('label', '');
    btn.setAttribute('aria-label', 'Zotero PaperFlow');

    const constrainIcon = () => {
      try {
        const img = btn?.querySelector('.toolbarbutton-icon') || btn?.querySelector('image') || btn?.querySelector('img');
        if (img) {
          img.style.width = '20px';
          img.style.height = '20px';
          img.style.maxWidth = '20px';
          img.style.maxHeight = '20px';
          img.setAttribute('width', '20');
          img.setAttribute('height', '20');
        }
      } catch (_) {}
    };
    constrainIcon();
    const t1 = window.setTimeout(constrainIcon, 150);
    const t2 = window.setTimeout(constrainIcon, 800);
    if (windowElements) {
      windowElements.push(
        { remove: () => window.clearTimeout(t1) },
        { remove: () => window.clearTimeout(t2) }
      );
    }

    const toolbarChildren = Array.from(toolbar.children || []) as any[];
    const flexibleSpacerIndex = toolbarChildren.findIndex((child) => {
      const tag = String(child.localName || child.tagName || '').toLowerCase();
      return tag === 'toolbarspring' ||
        (tag === 'spacer' && Number(child.getAttribute('flex') || 0) > 0) ||
        child.id === 'zotero-tb-search' ||
        child.id === 'zotero-tb-search-textbox' ||
        child.classList?.contains('zotero-search-box') ||
        child.classList?.contains('search-box');
    });

    const leadingActionItems = flexibleSpacerIndex >= 0
      ? toolbarChildren.slice(0, flexibleSpacerIndex)
      : toolbarChildren;

    const toolbarButtons = leadingActionItems.filter((child) =>
      String(child.localName || child.tagName || '').toLowerCase() === 'toolbarbutton' &&
      !isResearchFlowButton(child) &&
      !child.hidden &&
      child.getAttribute('hidden') !== 'true' &&
      child.getAttribute('collapsed') !== 'true'
    );

    const anchor: any = toolbarButtons.reverse().find((child: any) => {
      try {
        const style = window.getComputedStyle(child);
        return style.display !== 'none' && style.visibility !== 'collapse';
      } catch (_) {
        return true;
      }
    }) || null;

    if (anchor && anchor.parentNode === toolbar) {
      if (anchor.nextSibling !== btn) {
        anchor.parentNode.insertBefore(btn, anchor.nextSibling);
      }
    } else {
      const searchBox =
        doc.getElementById('zotero-tb-search-textbox') ||
        doc.getElementById('zotero-tb-search') ||
        toolbar.querySelector('input') ||
        (flexibleSpacerIndex >= 0 ? toolbarChildren[flexibleSpacerIndex] : null);
      if (searchBox && searchBox.parentNode === toolbar) {
        toolbar.insertBefore(btn, searchBox);
      } else {
        toolbar.appendChild(btn);
      }
    }

    if (windowElements && !windowElements.includes(btn)) {
      windowElements.push(btn);
    }
  },

  openStandaloneWindow(this: any, options: any = {}, targetWindow: any = null, windowType = 'window') {
    try {
      const ww = Services.ww;
      let features = '';
      let windowName = '';
      const url = `${CHROME_ROOT}index.html?mode=${encodeURIComponent(windowType)}${options.settingsOnly === true ? '&settingsOnly=1#paperflow-recovery' : ''}`;
      if (windowType === 'subwindow') {
        const alwaysRaised = this.getPref('subwindowAlwaysOnTop', false) ? ',alwaysRaised=yes' : '';
        features = `chrome,dialog=no,all,resizable=yes,minimizable=yes,width=480,height=780,top=80,left=80${alwaysRaised}`;
        windowName = 'ResearchFlow_SubWindow';
      } else {
        features = 'chrome,dialog=no,all,resizable=yes,minimizable=yes,width=1240,height=820,centerscreen';
        windowName = 'ResearchFlow_Window';
      }
      if (options.settingsOnly === true) windowName = 'ResearchFlow_Recovery';

      const mainWin = (targetWindow && targetWindow.Zotero_Tabs)
        ? targetWindow
        : (Zotero.getMainWindow ? Zotero.getMainWindow() : Services.wm.getMostRecentWindow('navigator:browser'));

      const win = ww.openWindow(
        mainWin,
        url,
        windowName,
        features,
        { Zotero, options: { ...options, currentWindowType: windowType } }
      );
      if (win) {
        const attachHost = () => {
          const page = win.wrappedJSObject || win;
          page.Zotero = Zotero;
          page._researchflowPending = { ...options, currentWindowType: windowType };
        };
        attachHost();
        win.addEventListener('DOMContentLoaded', attachHost, { once: true, capture: true });
        if (!this._standaloneWindows) this._standaloneWindows = new Set();
        this._standaloneWindows.add(win);
        win.addEventListener('unload', () => {
          mainWin.setTimeout(() => { if (win.closed) this._standaloneWindows?.delete(win); }, 0);
        });
      }
      if (win && win.focus) win.focus();
    } catch (err) {
      Zotero.logError?.('[PaperFlow] openStandaloneWindow error: ' + err);
    }
  },

  openPreferencesPane(this: any, window: any) {
    try {
      const win = window || Zotero.getMainWindow?.();
      if (Zotero.Utilities?.Internal?.openPreferences) {
        Zotero.Utilities.Internal.openPreferences('researchflow-preferences-pane');
      } else if (win?.openPreferences) {
        win.openPreferences('researchflow-preferences-pane');
      } else {
        win?.openDialog?.('chrome://zotero/content/preferences/preferences.xhtml', 'Preferences', 'chrome,titlebar,toolbar,centerscreen,dialog=yes');
      }
    } catch (e) {
      Zotero.logError?.('[PaperFlow] Could not open preferences: ' + e);
    }
  }
};
