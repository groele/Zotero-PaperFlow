/**
 * ResearchFlow for Zotero - Host Runtime Script
 * Seamlessly integrates ResearchFlow with Zotero 7+ & 10 desktop:
 * - Native Zotero Tab & Standalone Companion Window / Subwindow
 * - Main Toolbar Icon & Tools Menu
 * - Library Item & Collection Context Menus
 * - PDF Reader companion
 * - Item Pane Section
 * - Automated Zotero Child Note Cloud Syncing
 * - High-speed IOUtils JSON persistence in Zotero Data Directory
 */

import { ADDON_ID, DEFAULT_VERSION } from './config.js';
import {
  serializeLiteratureItem,
  getLiteratureAnnotations,
  getLiteratureNotes,
  getLiteratureCollections,
  getLiteratureReadingAssets,
  extractCiteKey,
  generateBibTeX,
  generateAPACitation,
  getRelatedItems,
  getLiteratureItem,
  findItemByKey
} from './modules/academic-citation.js';
import { allHostMethods } from './host/index.js';

declare var Zotero: any;
declare var rootURI: any;
declare var version: any;
declare var addonId: any;

(function () {
  if (typeof Zotero === 'undefined') {
    return;
  }

  const currentAddonId = (typeof addonId !== 'undefined' && addonId) ? addonId : ADDON_ID;
  const currentVersion = (typeof version !== 'undefined' && version) ? version : DEFAULT_VERSION;

  const baseHost = {
    rootURI: typeof rootURI !== 'undefined' ? rootURI : '',
    addonId: currentAddonId,
    version: currentVersion,
    serializeLiteratureItem,
    getLiteratureAnnotations,
    getLiteratureNotes,
    getLiteratureCollections,
    getLiteratureReadingAssets,
    extractCiteKey,
    generateBibTeX,
    generateAPACitation,
    getRelatedItems,
    getLiteratureItem,
    findItemByKey,
    resolveItem: findItemByKey,

    localizedDocs: new Set(),
    _cachedData: null,
    _dataListeners: new Set(),
    _prefPaneID: null,
    itemPaneSectionID: null,
    notifierID: null,
    _menuManagerItem: null,
    _menuManagerReader: null,
    _shareImageSavePending: false,
    _standaloneWindows: new Set(),
    _recoveryTokens: new Map()
  };

  Zotero.ResearchFlow = Object.assign(baseHost, allHostMethods);
  Zotero.PaperFlow = Zotero.ResearchFlow;

  // Kickstart initialization
  Zotero.ResearchFlow.init().catch((err: any) => {
    Zotero.logError?.('[PaperFlow] init error: ' + err);
  });
})();
