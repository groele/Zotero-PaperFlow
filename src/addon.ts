/**
 * Zotero PaperFlow - Addon Controller Class
 */

import { ADDON_ID, CHROME_ROOT, PREF_PREFIX, DEFAULT_VERSION } from './config';
import { RFAcademicCitation } from './modules/academic-citation';
import { RFArchitectureGuard } from './modules/architecture-guard';
import { RFItemPaneSection } from './modules/item-pane';

export class PaperFlowAddon {
  rootURI: string = '';
  addonId: string = ADDON_ID;
  version: string = DEFAULT_VERSION;
  CHROME_ROOT: string = CHROME_ROOT;
  PREF_PREFIX: string = PREF_PREFIX;

  injectedElements: Map<any, any> = new Map();
  pendingWindowLoads: Map<any, any> = new Map();
  windowListener: any = null;
  prefObserver: any = null;
  dataListeners: Set<Function> = new Set();

  _cachedData: any = null;
  _cachedUiState: any = null;
  _inFlightOperations: Promise<any> | null = null;
  _cachedSnapshotTimestamp: number = 0;
  _standaloneWindows: Set<any> = new Set();
  _currentPaneID: string | null = null;

  academicCitation = RFAcademicCitation;
  architectureGuard = RFArchitectureGuard;
  itemPaneSection = RFItemPaneSection;

  async init(ctx?: any): Promise<void> {
    if (ctx?.rootURI) this.rootURI = ctx.rootURI;
    if (ctx?.version) this.version = ctx.version;
    if (ctx?.addonId) this.addonId = ctx.addonId;
    if (typeof Zotero !== 'undefined' && Zotero.ResearchFlow) {
      await Zotero.ResearchFlow.init?.();
    }
  }

  async shutdown(): Promise<void> {
    if (typeof Zotero !== 'undefined' && Zotero.ResearchFlow) {
      await Zotero.ResearchFlow.shutdown?.();
    }
  }

  async onMainWindowLoad(win: any): Promise<void> {
    if (typeof Zotero !== 'undefined' && Zotero.ResearchFlow) {
      Zotero.ResearchFlow.addToWindow?.(win);
    }
  }

  async onMainWindowUnload(win: any): Promise<void> {
    if (typeof Zotero !== 'undefined' && Zotero.ResearchFlow) {
      Zotero.ResearchFlow.removeFromWindow?.(win);
    }
  }
}

export const addon = new PaperFlowAddon();
export default addon;
