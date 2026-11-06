/**
 * Zotero PaperFlow - Item Pane Section Registration
 */
declare var RFItemPaneSection: any;

export const hostItemPaneMethods = {
  registerItemPaneSection(this: any) {
    if (typeof RFItemPaneSection !== 'undefined' && RFItemPaneSection.registerItemPaneSection) {
      this.itemPaneSectionID = RFItemPaneSection.registerItemPaneSection(this);
    }
  }
};
