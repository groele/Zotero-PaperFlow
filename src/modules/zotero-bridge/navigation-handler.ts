/**
 * Zotero PaperFlow - Bridge Host Navigation Handler
 */

export function handleHostNavigation(this: any, options: any): void {
  if (!options || typeof options !== 'object' || typeof window === 'undefined') return;
  if (!(window as any)._researchflowWorkspaceReady) {
    this._pendingNavigation = options;
    return;
  }

  if (options.view && typeof document !== 'undefined') {
    const navBtn: HTMLElement | null = document.querySelector(`.nav-item[data-view="${options.view}"]`);
    if (navBtn) navBtn.click();
  }

  if (options.action === 'create_manuscript_from_item' && options.item && typeof document !== 'undefined') {
    const item = options.item;
    const kanbanBtn: HTMLElement | null = document.querySelector('.nav-item[data-view="view-manuscripts"]');
    if (kanbanBtn) kanbanBtn.click();

    setTimeout(() => {
      if (typeof (window as any).openManuscriptModal === 'function') {
        (window as any).openManuscriptModal(null, {
          title: item.title || '',
          publication: item.publication || '',
          abstract: item.abstract || '',
          authors: item.authors || '',
          doi: item.doi || '',
          articleUrl: item.url || '',
          zoteroItemKey: item.key || '',
          zoteroUri: item.zoteroUri || '',
          pdfUri: item.pdfUri || '',
          citekey: item.citekey || '',
          bibtex: item.bibtex || '',
          citationApa: item.citationApa || '',
          relatedItems: item.relatedItems || [],
          collections: item.collections || [],
          tags: item.tags || [],
          status: 'idea'
        });
        if (typeof (window as any).showGlobalToast === 'function') {
          (window as any).showGlobalToast(`已从 Zotero 文献《${(item.title || '').slice(0, 18)}…》导入元数据`, 'success');
        }
      }
    }, 200);
  } else if (options.action === 'link_item_to_manuscript' && options.item && typeof document !== 'undefined') {
    const item = options.item;
    const kanbanBtn: HTMLElement | null = document.querySelector('.nav-item[data-view="view-manuscripts"]');
    if (kanbanBtn) kanbanBtn.click();

    setTimeout(() => {
      if (typeof (window as any).showLinkManuscriptModal === 'function') {
        (window as any).showLinkManuscriptModal(item);
      }
    }, 200);
  } else if (options.action === 'reader_excerpt' && typeof document !== 'undefined') {
    const kanbanBtn: HTMLElement | null = document.querySelector('.nav-item[data-view="view-manuscripts"]');
    if (kanbanBtn) kanbanBtn.click();

    setTimeout(() => {
      if (typeof (window as any).openManuscriptModal === 'function') {
        const excerptText = options.excerpt
          ? `【PDF 第 ${options.page || 1} 页原文摘录】\n${options.excerpt}\n\n[📖 在 Zotero 阅读器中查看原文](${options.pdfLink || ''})`
          : (options.item?.abstract || '');
        (window as any).openManuscriptModal(null, {
          title: options.item?.title ? `研读笔记：${options.item.title}` : 'PDF 摘录笔记',
          publication: options.item?.publication || '',
          abstract: excerptText,
          authors: options.item?.authors || '',
          doi: options.item?.doi || '',
          articleUrl: options.pdfLink || options.item?.url || '',
          zoteroItemKey: options.item?.key || '',
          zoteroUri: options.item?.zoteroUri || '',
          pdfUri: options.pdfLink || options.item?.pdfUri || '',
          citekey: options.item?.citekey || '',
          bibtex: options.item?.bibtex || '',
          citationApa: options.item?.citationApa || '',
          relatedItems: options.item?.relatedItems || [],
          status: 'idea'
        });
        if (typeof (window as any).showGlobalToast === 'function') {
          (window as any).showGlobalToast(`已从 PDF 第 ${options.page || 1} 页载入摘录内容与文献关联`, 'success');
        }
      }
    }, 200);
  } else if (options.action === 'create_from_collection' && typeof document !== 'undefined') {
    const kanbanBtn: HTMLElement | null = document.querySelector('.nav-item[data-view="view-manuscripts"]');
    if (kanbanBtn) kanbanBtn.click();

    setTimeout(() => {
      if (typeof (window as any).openManuscriptModal === 'function') {
        const colItems = options.items || [];
        const summary = colItems.slice(0, 5).map((it: any, idx: number) => `${idx + 1}. ${it.title} (${it.authors || ''} ${it.year || ''})`.trim()).join('\n');
        (window as any).openManuscriptModal(null, {
          title: `${options.collectionName || '文献分类'} 论文写作管线`,
          publication: '',
          abstract: `基于 Zotero 分类【${options.collectionName || '文献分类'}】创建。\n共包含文献 ${colItems.length} 篇：\n${summary}${colItems.length > 5 ? '\n…' : ''}`,
          authors: '',
          doi: '',
          zoteroItemKey: colItems[0]?.key || '',
          zoteroUri: colItems[0]?.zoteroUri || '',
          pdfUri: colItems[0]?.pdfUri || '',
          status: 'idea'
        });
        if (typeof (window as any).showGlobalToast === 'function') {
          (window as any).showGlobalToast(`已基于分类【${options.collectionName || ''}】初始化论文稿件管线`, 'success');
        }
      }
    }, 200);
  } else if (options.manuscriptId && typeof document !== 'undefined') {
    const kanbanBtn: HTMLElement | null = document.querySelector('.nav-item[data-view="view-manuscripts"]');
    if (kanbanBtn) kanbanBtn.click();
    setTimeout(() => {
      const card: HTMLElement | null = document.querySelector(`[data-manuscript-id="${options.manuscriptId}"]`) ||
        document.querySelector(`[data-id="${options.manuscriptId}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('highlight-pulse');
        setTimeout(() => card.classList.remove('highlight-pulse'), 2500);
      }
    }, 300);
  }
}
