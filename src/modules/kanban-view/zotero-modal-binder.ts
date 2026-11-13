import { type ZoteroModalBindState, bindZoteroReadingAssetsDrawer, bindZoteroLiveSearchDropdown } from './zotero-drawer';
import { acquireModalScope, type LifecycleScope } from '../ui-utils/lifecycle.js';

declare const currentLanguage: string;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;

export function setupZoteroModalBindings(state: ZoteroModalBindState, parentScope?: LifecycleScope): void {
  const w = window as any;
  const modalScope = parentScope || acquireModalScope();
  let bindUiScope = modalScope.child();

  const updateZoteroBindUI = (item: any) => {
    bindUiScope.abort('refresh-bind-ui');
    bindUiScope = modalScope.child();
    const statusEl = document.getElementById('zotero-bind-status');
    const pdfBtn = document.getElementById('btn-zotero-open-pdf');
    const syncBtn = document.getElementById('btn-zotero-sync-note');
    const locateBtn = document.getElementById('btn-zotero-locate');
    const unlinkBtn = document.getElementById('btn-zotero-unlink');
    const bibBtn = document.getElementById('btn-zotero-copy-bib');
    const apaBtn = document.getElementById('btn-zotero-copy-apa');
    const annoBtn = document.getElementById('btn-zotero-toggle-annos');
    const searchContainer = document.getElementById('zotero-search-container');

    if (item && item.key) {
      state.currentZoteroItemKey = item.key;
      state.currentZoteroLibraryID = item.libraryID ?? null;
      state.currentZoteroUri = item.zoteroUri;
      state.currentPdfUri = item.pdfUri;
      state.currentCiteKey = item.citekey || '';
      state.currentBibtex = item.bibtex || '';
      state.currentCitationApa = item.citationApa || '';
      state.currentRelatedItems = item.relatedItems || [];
      if (statusEl) {
        w.RFUI.setHTML(statusEl, `<span style="color:#059669; font-weight:600; display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>已关联: ${escapeHTML((item.title || '').slice(0, 22))}…</span>`);
        if (state.currentCiteKey) {
          const citeEl = document.createElement('span');
          citeEl.className = 'zotero-citekey-badge';
          citeEl.textContent = `[@${state.currentCiteKey}]`;
          citeEl.title = '点击复制 Citation Key';
          bindUiScope.on(citeEl, 'click', (e: Event) => {
            e.stopPropagation();
            if (typeof ZoteroBridge !== 'undefined') ZoteroBridge.copyText(`[@${state.currentCiteKey}]`, `已复制 Citation Key: [@${state.currentCiteKey}]`);
          });
          statusEl.appendChild(citeEl);
        }
      }
      if (pdfBtn) pdfBtn.style.display = item.pdfUri ? '' : 'none';
      if (syncBtn) syncBtn.style.display = '';
      if (locateBtn) locateBtn.style.display = '';
      if (unlinkBtn) unlinkBtn.style.display = '';
      if (bibBtn) bibBtn.style.display = state.currentBibtex ? '' : 'none';
      if (apaBtn) apaBtn.style.display = state.currentCitationApa ? '' : 'none';
      if (annoBtn) annoBtn.style.display = '';
      if (searchContainer) searchContainer.style.display = 'none';
      const relPanel = document.getElementById('man-zotero-related-panel');
      const relChips = document.getElementById('man-zotero-related-chips');
      if (relPanel && relChips && Array.isArray(item.relatedItems) && item.relatedItems.length > 0) {
        w.RFUI.setHTML(relChips, '');
        item.relatedItems.forEach((r: any) => {
          const chip = document.createElement('span');
          chip.className = 'zotero-related-chip';
          chip.textContent = `${(r.title || '').slice(0, 16)}… (${r.year || ''})`;
          chip.title = `${r.title} - ${r.authors} (点击在文献库定位)`;
          bindUiScope.on(chip, 'click', () => { if (typeof ZoteroBridge !== 'undefined') ZoteroBridge.selectItemInZotero(r.key); });
          relChips.appendChild(chip);
        });
        relPanel.style.display = 'block';
      } else if (relPanel) relPanel.style.display = 'none';
    } else {
      state.currentZoteroItemKey = null; state.currentZoteroLibraryID = null; state.currentZoteroUri = null;
      state.currentPdfUri = null; state.currentCiteKey = ''; state.currentBibtex = ''; state.currentCitationApa = ''; state.currentRelatedItems = [];
      if (statusEl) w.RFUI.setHTML(statusEl, `<span style="color:#64748b; font-weight:500; display:inline-flex; align-items:center; gap:6px;">${escapeHTML(currentLanguage === 'zh' ? '未绑定 Zotero 文献条目 (点击可搜索关联)' : 'No Zotero item linked (Click to search)')}</span>`);
      [pdfBtn, syncBtn, locateBtn, unlinkBtn, bibBtn, apaBtn, annoBtn].forEach((b) => { if (b) b.style.display = 'none'; });
      if (searchContainer) searchContainer.style.display = 'block';
      const relPanel = document.getElementById('man-zotero-related-panel');
      if (relPanel) relPanel.style.display = 'none';
      const annoPanel = document.getElementById('man-zotero-annotations-panel');
      if (annoPanel) annoPanel.style.display = 'none';
    }
  };

  const applyItemToForm = (item: any) => {
    if (!item) return;
    if (item.title) (document.getElementById('man-title') as any).value = item.title;
    if (item.publication) (document.getElementById('man-journal') as any).value = item.publication;
    if (item.authors) (document.getElementById('man-authors') as any).value = item.authors;
    if (item.doi) (document.getElementById('man-doi') as any).value = item.doi;
    if (item.url) (document.getElementById('man-article-url') as any).value = item.url;
    if (item.abstract) (document.getElementById('man-abstract') as any).value = item.abstract;
    updateZoteroBindUI(item);
    showGlobalToast(`已关联并填充文献《${(item.title || '').slice(0, 18)}…》元数据`, 'success');
    if (typeof ZoteroBridge !== 'undefined') ZoteroBridge.showNativeToast('文献已关联', item.title, 'success');
  };

  modalScope.setTimeout(async () => {
    try {
      if (typeof ZoteroBridge !== 'undefined' && !state.currentZoteroItemKey && ZoteroBridge.getPref('autoLinkSelectedPaper', true)) {
        const activeItem = await ZoteroBridge.getActiveItem();
        if (modalScope.aborted) return;
        const banner = document.getElementById('zotero-active-item-banner');
        const textEl = document.getElementById('zotero-active-item-text');
        if (activeItem?.title && banner && textEl) {
          w.RFUI.setHTML(textEl, `📌 <strong>检测到 Zotero 选中文献：</strong>《${escapeHTML(activeItem.title)}》`);
          banner.style.display = 'flex';
          modalScope.on(document.getElementById('btn-zotero-quick-bind-active'), 'click', () => {
            applyItemToForm(activeItem);
            banner.style.display = 'none';
          });
        }
      }
    } catch (_) {}
  }, 60);

  modalScope.on(document.getElementById('zotero-bind-status'), 'click', () => {
    const sc = document.getElementById('zotero-search-container');
    if (sc) { sc.style.display = 'block'; (document.getElementById('ipt-zotero-live-search') as HTMLElement | null)?.focus(); }
  });
  modalScope.on(document.getElementById('btn-zotero-toggle-search'), 'click', () => {
    const sc = document.getElementById('zotero-search-container');
    if (sc) { sc.style.display = sc.style.display === 'none' ? 'block' : 'none'; if (sc.style.display === 'block') (document.getElementById('ipt-zotero-live-search') as HTMLElement | null)?.focus(); }
  });
  modalScope.on(document.getElementById('zotero-modal-citekey'), 'click', (e: Event) => {
    e.stopPropagation();
    if (state.currentCiteKey && typeof ZoteroBridge !== 'undefined') ZoteroBridge.copyText(`[@${state.currentCiteKey}]`, `已复制 Citation Key: [@${state.currentCiteKey}]`);
  });
  modalScope.on(document.getElementById('btn-zotero-copy-bib'), 'click', () => { if (state.currentBibtex && typeof ZoteroBridge !== 'undefined') ZoteroBridge.copyText(state.currentBibtex, '已复制 BibTeX 引用条目'); });
  modalScope.on(document.getElementById('btn-zotero-copy-apa'), 'click', () => { if (state.currentCitationApa && typeof ZoteroBridge !== 'undefined') ZoteroBridge.copyText(state.currentCitationApa, '已复制标准引用 (APA)'); });

  bindZoteroReadingAssetsDrawer(state, modalScope);
  bindZoteroLiveSearchDropdown(applyItemToForm, modalScope);

  modalScope.on(document.getElementById('btn-zotero-fetch-active'), 'click', async () => {
    const activeItem = typeof ZoteroBridge !== 'undefined' ? await ZoteroBridge.getActiveItem() : null;
    if (modalScope.aborted) return;
    if (activeItem) applyItemToForm(activeItem);
    else showGlobalToast('未在 Zotero 中检测到选中条目，请在文献库中单击选中目标论文。', 'warning');
  });
  modalScope.on(document.getElementById('btn-zotero-open-pdf'), 'click', () => { if (state.currentZoteroItemKey && typeof ZoteroBridge !== 'undefined') ZoteroBridge.openPdf(state.currentZoteroItemKey, null, state.currentZoteroLibraryID); });
  modalScope.on(document.getElementById('btn-zotero-sync-note'), 'click', async () => {
    if (state.currentZoteroItemKey && typeof ZoteroBridge !== 'undefined') {
      const ok = await ZoteroBridge.syncNote(state.currentZoteroItemKey, state.currentZoteroLibraryID);
      if (modalScope.aborted) return;
      showGlobalToast(ok ? '已同步审稿进展至 Zotero 云端笔记！' : '同步失败，请检查条目是否存在', ok ? 'success' : 'error');
    }
  });
  modalScope.on(document.getElementById('btn-zotero-locate'), 'click', () => { if (state.currentZoteroItemKey && typeof ZoteroBridge !== 'undefined') ZoteroBridge.selectItemInZotero(state.currentZoteroItemKey, state.currentZoteroLibraryID); });
  modalScope.on(document.getElementById('btn-zotero-unlink'), 'click', () => { updateZoteroBindUI(null); showGlobalToast('已解除 Zotero 文献绑定', 'info'); });
}
