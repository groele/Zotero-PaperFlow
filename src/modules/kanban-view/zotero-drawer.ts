import { acquireModalScope, type LifecycleScope } from '../ui-utils/lifecycle.js';

declare const currentLanguage: string;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;

export interface ZoteroModalBindState {
  currentZoteroItemKey: string | null;
  currentZoteroLibraryID: number | null;
  currentZoteroUri: string | null;
  currentPdfUri: string | null;
  currentCiteKey: string;
  currentBibtex: string;
  currentCitationApa: string;
  currentRelatedItems: any[];
}

export function bindZoteroReadingAssetsDrawer(state: ZoteroModalBindState, parentScope?: LifecycleScope): void {
  const w = window as any;
  const modalScope = parentScope || acquireModalScope();
  let drawerContentScope = modalScope.child();

  modalScope.on(document.getElementById('btn-zotero-toggle-annos'), 'click', async () => {
    const panel = document.getElementById('man-zotero-annotations-panel');
    if (!panel || !state.currentZoteroItemKey || typeof ZoteroBridge === 'undefined') return;
    if (panel.style.display !== 'none') {
      drawerContentScope.abort('drawer-collapsed');
      panel.style.display = 'none';
      return;
    }
    drawerContentScope.abort('drawer-reload');
    drawerContentScope = modalScope.child();
    const contentScope = drawerContentScope;

    panel.style.display = 'flex';
    w.RFUI.setHTML(panel, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">⏳ 正在读取 Zotero 研读资产库 (PDF划线、独立笔记、分类标签)...</div>');

    const assets = typeof ZoteroBridge.getReadingAssets === 'function'
      ? await ZoteroBridge.getReadingAssets(state.currentZoteroItemKey, state.currentZoteroLibraryID)
      : { annotations: await ZoteroBridge.getAnnotations(state.currentZoteroItemKey, state.currentZoteroLibraryID), notes: [], collections: [], tags: [] };

    if (contentScope.aborted || panel.style.display === 'none') return;

    const annos = assets.annotations || [];
    const notes = assets.notes || [];
    const collections = assets.collections || [];
    const tags = assets.tags || [];

    w.RFUI.setHTML(panel, `
      <div class="zotero-drawer-tabs">
        <button type="button" class="zotero-drawer-tab active" data-tab="annos">🖍️ PDF 批注 <span class="zotero-drawer-badge">${annos.length}</span></button>
        <button type="button" class="zotero-drawer-tab" data-tab="notes">📝 独立笔记 <span class="zotero-drawer-badge">${notes.length}</span></button>
        <button type="button" class="zotero-drawer-tab" data-tab="meta">📁 分类与标签 <span class="zotero-drawer-badge">${collections.length + tags.length}</span></button>
      </div>
      <div id="zotero-tab-content-annos" class="zotero-drawer-section"></div>
      <div id="zotero-tab-content-notes" class="zotero-drawer-section" style="display:none;"></div>
      <div id="zotero-tab-content-meta" class="zotero-drawer-section" style="display:none;"></div>
    `);

    panel.querySelectorAll('.zotero-drawer-tab').forEach((tabBtn: any) => {
      contentScope.on(tabBtn, 'click', (e: Event) => {
        e.preventDefault();
        panel.querySelectorAll('.zotero-drawer-tab').forEach((b) => b.classList.remove('active'));
        tabBtn.classList.add('active');
        const targetTab = tabBtn.dataset.tab;
        const secAnnos = panel.querySelector('#zotero-tab-content-annos') as HTMLElement | null;
        const secNotes = panel.querySelector('#zotero-tab-content-notes') as HTMLElement | null;
        const secMeta = panel.querySelector('#zotero-tab-content-meta') as HTMLElement | null;
        if (secAnnos) secAnnos.style.display = targetTab === 'annos' ? 'flex' : 'none';
        if (secNotes) secNotes.style.display = targetTab === 'notes' ? 'flex' : 'none';
        if (secMeta) secMeta.style.display = targetTab === 'meta' ? 'flex' : 'none';
      });
    });

    populateZoteroAnnosTab(panel, annos, state, contentScope);
    populateZoteroNotesTab(panel, notes, state, contentScope);
    populateZoteroMetaTab(panel, collections, tags, contentScope);
  });
}

function populateZoteroAnnosTab(panel: HTMLElement, annos: any[], state: ZoteroModalBindState, contentScope: LifecycleScope): void {
  const w = window as any;
  const annosContainer = panel.querySelector('#zotero-tab-content-annos');
  if (!annosContainer) return;
  if (annos.length === 0) {
    w.RFUI.setHTML(annosContainer, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">该文献 PDF 暂无高亮划线。您可在 Zotero 阅读器中选中文字添加高亮与批注。</div>');
    return;
  }
  if (annos.length > 1) {
    const batchBar = document.createElement('div');
    batchBar.className = 'zotero-batch-toolbar';
    w.RFUI.setHTML(batchBar, `
      <span>共检测到 <strong>${annos.length}</strong> 条 PDF 批注划线</span>
      <button type="button" class="btn-secondary" id="btn-batch-insert-annos" style="font-size:10px; padding:2px 8px; color:var(--text-accent, #e11d48); font-weight:600; cursor:pointer;">➕ 全部汇入研读草稿</button>
    `);
    contentScope.on(batchBar.querySelector('#btn-batch-insert-annos'), 'click', () => {
      const absBox = document.getElementById('man-abstract') as HTMLTextAreaElement | null;
      if (absBox) {
        const allQuotes = annos.filter((a) => a.text || a.comment).map((a) => `> "${a.text || a.comment}" (第 ${a.page} 页)`).join('\n\n');
        absBox.value = `${absBox.value}\n\n【Zotero PDF 研读摘录汇编】\n${allQuotes}`.trim();
        showGlobalToast(`已将全部 ${annos.length} 条批注汇入草稿！`, 'success');
      }
    });
    annosContainer.appendChild(batchBar);
  }

  annos.forEach((a) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'zotero-annotation-item';
    w.RFUI.setHTML(itemEl, `
      <div class="zotero-annotation-head">
        <span style="font-weight:600; color:${a.color || '#e11d48'};">● 第 ${a.page} 页 ${a.type === 'note' ? '独立批注' : '高亮划线'}</span>
        <span>${a.date ? new Date(a.date).toLocaleDateString() : ''}</span>
      </div>
      ${a.text ? `<div class="zotero-annotation-body" style="border-left-color:${a.color || '#ffd400'};">${escapeHTML(a.text)}</div>` : ''}
      ${a.comment ? `<div class="zotero-annotation-comment">💡 批注：${escapeHTML(a.comment)}</div>` : ''}
      <div class="zotero-annotation-actions">
        <button type="button" class="btn-secondary btn-quote-insert" style="font-size:10px; padding:2px 6px;">➕ 插入草稿</button>
        <button type="button" class="btn-secondary btn-quote-jump" style="font-size:10px; padding:2px 6px;">📖 原文第 ${a.page} 页</button>
      </div>
    `);
    contentScope.on(itemEl.querySelector('.btn-quote-insert'), 'click', () => {
      const absBox = document.getElementById('man-abstract') as HTMLTextAreaElement | null;
      if (absBox) {
        absBox.value = `${absBox.value}\n\n> "${a.text || a.comment}" (第 ${a.page} 页)`.trim();
        showGlobalToast('已将划线批注插入到研读草稿中', 'success');
      }
    });
    contentScope.on(itemEl.querySelector('.btn-quote-jump'), 'click', () => {
      if (state.currentZoteroItemKey && typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.openPdf(state.currentZoteroItemKey, a.pageIndex + 1, state.currentZoteroLibraryID);
      }
    });
    annosContainer.appendChild(itemEl);
  });
}

function populateZoteroNotesTab(panel: HTMLElement, notes: any[], state: ZoteroModalBindState, contentScope: LifecycleScope): void {
  const w = window as any;
  const notesContainer = panel.querySelector('#zotero-tab-content-notes');
  if (!notesContainer) return;
  if (notes.length === 0) {
    w.RFUI.setHTML(notesContainer, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">该文献在 Zotero 中暂无独立文献笔记。您可在 Zotero 中为该条目添加子笔记记录研读心得。</div>');
    return;
  }
  notes.forEach((n) => {
    const noteEl = document.createElement('div');
    noteEl.className = 'zotero-note-item';
    w.RFUI.setHTML(noteEl, `
      <div class="zotero-note-head">
        <span>📝 ${escapeHTML(n.title || 'Zotero 笔记')}</span>
        <span style="font-size:10px; color:#64748b; font-weight:normal;">${n.date ? new Date(n.date).toLocaleDateString() : ''}</span>
      </div>
      <div class="zotero-note-body">${escapeHTML(n.snippet || '')}</div>
      <div class="zotero-note-actions">
        <button type="button" class="btn-secondary btn-insert-note" style="font-size:10px; padding:2px 6px;">➕ 插入草稿</button>
        <button type="button" class="btn-secondary btn-locate-note" style="font-size:10px; padding:2px 6px;">🔗 定位笔记</button>
      </div>
    `);
    contentScope.on(noteEl.querySelector('.btn-insert-note'), 'click', () => {
      const absBox = document.getElementById('man-abstract') as HTMLTextAreaElement | null;
      if (absBox) {
        absBox.value = `${absBox.value}\n\n【Zotero 研读笔记摘记】\n${n.snippet || ''}`.trim();
        showGlobalToast('已将文献笔记插入到研读草稿中', 'success');
      }
    });
    contentScope.on(noteEl.querySelector('.btn-locate-note'), 'click', () => {
      if (typeof ZoteroBridge !== 'undefined') ZoteroBridge.selectItemInZotero(n.key, state.currentZoteroLibraryID);
    });
    notesContainer.appendChild(noteEl);
  });
}

function populateZoteroMetaTab(panel: HTMLElement, collections: any[], tags: string[], contentScope: LifecycleScope): void {
  const w = window as any;
  const metaContainer = panel.querySelector('#zotero-tab-content-meta');
  if (!metaContainer) return;
  w.RFUI.setHTML(metaContainer, '');
  if (collections.length > 0) {
    const colSection = document.createElement('div');
    w.RFUI.setHTML(colSection, `<strong style="font-size:11px; color:hsl(var(--text-secondary)); display:block; margin-bottom:4px;">📁 所属 Zotero 知识库分类：</strong>`);
    const pillsWrap = document.createElement('div');
    pillsWrap.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px;';
    collections.forEach((col) => {
      const pill = document.createElement('span');
      pill.className = 'zotero-collection-pill';
      pill.textContent = `📁 ${col.path || col.name}`;
      pillsWrap.appendChild(pill);
    });
    colSection.appendChild(pillsWrap);
    metaContainer.appendChild(colSection);
  }

  if (tags.length > 0) {
    const tagSection = document.createElement('div');
    tagSection.style.marginTop = '6px';
    w.RFUI.setHTML(tagSection, `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <strong style="font-size:11px; color:hsl(var(--text-secondary));">🏷️ Zotero 文献标签：</strong>
        <button type="button" class="btn-secondary" id="btn-extract-tags-to-notes" style="font-size:10px; padding:2px 6px;">➕ 提取为主题标签</button>
      </div>
    `);
    const tagsWrap = document.createElement('div');
    tagsWrap.style.cssText = 'display:flex; flex-wrap:wrap; gap:4px;';
    tags.forEach((tg) => {
      const tagPill = document.createElement('span');
      tagPill.className = 'zotero-tag-pill';
      tagPill.textContent = `#${tg}`;
      tagsWrap.appendChild(tagPill);
    });
    tagSection.appendChild(tagsWrap);
    contentScope.on(tagSection.querySelector('#btn-extract-tags-to-notes'), 'click', () => {
      const absBox = document.getElementById('man-abstract') as HTMLTextAreaElement | null;
      if (absBox) {
        absBox.value = `${absBox.value}\n\n【主题关键词】：${tags.join(', ')}`.trim();
        showGlobalToast(`已将 ${tags.length} 个标签添加至研读草稿！`, 'success');
      }
    });
    metaContainer.appendChild(tagSection);
  }

  if (collections.length === 0 && tags.length === 0) {
    w.RFUI.setHTML(metaContainer, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">该文献暂未分配分类目录与标签。</div>');
  }
}

export function bindZoteroLiveSearchDropdown(applyItemToForm: (item: any) => void, parentScope?: LifecycleScope): void {
  const w = window as any;
  const searchInput = document.getElementById('ipt-zotero-live-search') as HTMLInputElement | null;
  const dropdown = document.getElementById('zotero-search-results-dropdown');
  if (!searchInput || !dropdown) return;
  const modalScope = parentScope || acquireModalScope();
  let searchTimerScope = modalScope.child();
  let dropdownListScope = modalScope.child();

  modalScope.on(searchInput, 'input', (e: any) => {
    const query = e.target.value.trim();
    searchTimerScope.abort('search-debounce');
    searchTimerScope = modalScope.child();
    const activeSearchScope = searchTimerScope;
    if (query.length < 2) {
      dropdown.style.display = 'none';
      w.RFUI.setHTML(dropdown, '');
      return;
    }
    activeSearchScope.setTimeout(async () => {
      w.RFUI.setHTML(dropdown, `<div class="zotero-search-empty">🔍 ${escapeHTML(currentLanguage === 'zh' ? '检索中...' : 'Searching...')}</div>`);
      dropdown.style.display = 'block';
      const results = typeof ZoteroBridge !== 'undefined' ? await ZoteroBridge.searchLibrary(query, 10) : [];
      if (activeSearchScope.aborted) return;
      dropdownListScope.abort('refresh-results');
      dropdownListScope = modalScope.child();
      if (!results || results.length === 0) {
        w.RFUI.setHTML(dropdown, `<div class="zotero-search-empty">${escapeHTML(currentLanguage === 'zh' ? '未找到匹配的 Zotero 文献' : 'No matching Zotero items found')}</div>`);
        return;
      }
      w.RFUI.setHTML(dropdown, '');
      results.forEach((res: any) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'zotero-search-result-item';
        w.RFUI.setHTML(itemEl, `
          <div class="zotero-search-result-title">${escapeHTML(res.title || '无标题文献')}</div>
          <div class="zotero-search-result-meta">${escapeHTML(res.authors || '')} ${res.year ? `· ${escapeHTML(res.year)}` : ''} ${res.publication ? `· ${escapeHTML(res.publication)}` : ''}</div>
        `);
        dropdownListScope.on(itemEl, 'click', () => {
          applyItemToForm(res);
          dropdown.style.display = 'none';
          searchInput.value = '';
        });
        dropdown.appendChild(itemEl);
      });
    }, 220);
  });

  modalScope.on(document, 'click', (e: any) => {
    if (!searchInput.contains?.(e.target) && !dropdown.contains?.(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}
