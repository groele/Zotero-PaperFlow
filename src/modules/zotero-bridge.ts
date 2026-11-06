/**
 * ResearchFlow Zotero Bridge - Facilitates communication between ResearchFlow UI and Zotero host
 */

import { resolveZoteroItem } from './zotero-bridge/resolver.js';
import { bridgeMessengerMethods } from './zotero-bridge/messenger.js';
import { bridgeActionMethods } from './zotero-bridge/actions.js';

export { resolveZoteroItem };

export const ZoteroBridge: any = {
  isZotero: false,
  resolveZoteroItem,
  resolveItem(itemKey: any, libraryID: any = null): any {
    return resolveZoteroItem((typeof window !== 'undefined' ? (window.Zotero || window.parent?.Zotero) : null), itemKey, libraryID);
  },
  _pendingRequestId: 0,
  _requestCallbacks: new Map<string, (val: any) => void>(),
  _pendingNavigation: null as any,
  _directPrefObserverSymbol: null as any,

  init(): void {
    this.detectEnvironment();
    this.setupMessageListener();
    this.initDirectPrefObserver();
    if (typeof window !== 'undefined') {
      window.addEventListener('researchflow-workspace-ready', () => {
        if (this._pendingNavigation) {
          const options = this._pendingNavigation;
          this._pendingNavigation = null;
          this.handleHostNavigation(options);
        }
      });
    }

    if (this.isZotero && typeof document !== 'undefined') {
      document.documentElement.classList.add('zotero-env');
      document.body?.classList?.add('zotero-env');
      this.sendToHost({ type: 'RESEARCHFLOW_READY' });
      console.log('[ResearchFlow] Running in Zotero environment');

      document.addEventListener('click', (e: any) => {
        const link = e.target?.closest?.('a[href^="http"]');
        if (link && !link.dataset.internal) {
          e.preventDefault();
          this.openExternal(link.href);
        }
      });
    }

    if (typeof window !== 'undefined') {
      const initialOptions = window.arguments?.[0]?.options || (window as any)._researchflowPending;
      if (initialOptions) {
        this.handleHostNavigation(initialOptions);
      }
    }
  },

  ...bridgeMessengerMethods,
  ...bridgeActionMethods
};

// Initialize bridge
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ZoteroBridge.init());
  } else {
    ZoteroBridge.init();
  }
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).ZoteroBridge = ZoteroBridge;
  (globalThis as any).resolveZoteroItem = resolveZoteroItem;
}
if (typeof window !== 'undefined') {
  (window as any).ZoteroBridge = ZoteroBridge;
  (window as any).resolveZoteroItem = resolveZoteroItem;
}
