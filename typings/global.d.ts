/**
 * Global sandbox types for Zotero PaperFlow
 */

declare global {
  var Zotero: any;
  var Zotero_Tabs: any;
  var ZoteroPane: any;
  var Services: any;
  var Components: any;
  var ChromeUtils: any;
  var Cc: any;
  var Ci: any;
  var Cu: any;
  var IOUtils: any;
  var PathUtils: any;
  var rootURI: string;
  var addonId: string;
  var version: string;
  var __env__: 'production' | 'development';
  var __buildVersion__: string;
  var __buildTime__: string;

  var RFAcademicCitation: any;
  var RFArchitectureGuard: any;
  var RFItemPaneSection: any;
  var RFReviewMatrix: any;
  var RFSubmissionsView: any;
  var RFKanbanView: any;
  var RFDashboardView: any;
  var RFTimelineEngine: any;
  var RFAcademicExporter: any;
  var RFAcademicSync: any;
  var RFShareStudio: any;
  var RFSettingsView: any;
  var RFI18n: any;

  interface Window {
    [key: string]: any;
    Zotero?: any;
    Zotero_Tabs?: any;
    RFAcademicCitation?: any;
    RFArchitectureGuard?: any;
    RFItemPaneSection?: any;
    RFReviewMatrix?: any;
    RFSubmissionsView?: any;
    RFKanbanView?: any;
    RFDashboardView?: any;
    RFTimelineEngine?: any;
    RFAcademicExporter?: any;
    RFAcademicSync?: any;
    RFShareStudio?: any;
    RFSettingsView?: any;
    RFI18n?: any;
  }
}

export {};
