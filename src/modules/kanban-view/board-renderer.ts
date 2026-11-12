import { persistManuscriptStatusChange, updateKanbanEmptyColumns } from './status-helpers.js';
import { buildKanbanCard } from './card-builder.js';

declare const db: any;
declare const currentLanguage: string;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function setText(target: any, value: any): any;
declare function t(key: string): string;
declare function tf(key: string, vars?: Record<string, any>): string;
declare function getManuscriptStatusLabel(status: string): string;
declare function renderDashboard(): void;
declare function renderSubmissions(): void;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;
declare function showAcceptanceCelebration(opts: { title: string; manuscriptId: string }): void;

function removeKanbanDropPlaceholders(): void {
  document.querySelectorAll('.kanban-drop-placeholder').forEach((el) => el.remove());
}

export function renderKanban(): void {
  const w = window as any;
  if (w.RFUI?.isViewDeferred?.('view-manuscripts')) return;

  const columns = ['idea', 'drafting', 'submitted', 'accepted'];
  columns.forEach((col) => {
    w.RFUI.setHTML(document.getElementById(`cards-${col}`), '');
  });

  const viewSection = document.getElementById('view-manuscripts');
  let banner = document.getElementById('zotero-link-banner');
  if (w._pendingZoteroLinkItem && viewSection) {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'zotero-link-banner';
      banner.className = 'zotero-link-banner';
      const board = viewSection.querySelector('.kanban-board');
      if (board) viewSection.insertBefore(banner, board);
      else viewSection.prepend(banner);
    }
    const pItem = w._pendingZoteroLinkItem;
    w.RFUI.setHTML(banner, `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:20px;">📎</span>
        <div>
          <div style="font-weight:600; color:hsl(var(--text-primary));">正在关联 Zotero 文献：${escapeHTML(pItem.title || '无标题文献')}</div>
          <div style="font-size:11px; color:hsl(var(--text-secondary));">${escapeHTML(pItem.authors || '')} ${pItem.year ? `· ${escapeHTML(pItem.year)}` : ''} ${pItem.publication ? `· ${escapeHTML(pItem.publication)}` : ''}</div>
        </div>
      </div>
      <button class="btn-secondary" id="btn-cancel-zotero-link" style="padding:4px 10px; font-size:12px;">取消关联</button>
    `);
    document.getElementById('btn-cancel-zotero-link')?.addEventListener('click', () => {
      w._pendingZoteroLinkItem = null;
      renderKanban();
    });
  } else if (banner) {
    banner.remove();
  }

  const mCount: Record<string, number> = { idea: 0, drafting: 0, submitted: 0, accepted: 0 };
  let visibleManuscripts: any[] = db.manuscripts || [];
  if (w._activeZoteroCollectionFilter && w._activeZoteroCollectionItemKeys) {
    visibleManuscripts = visibleManuscripts.filter((m) =>
      m.zoteroItemKey && w._activeZoteroCollectionItemKeys.has(m.zoteroItemKey)
    );
  }

  visibleManuscripts.forEach((m) => {
    let col = 'idea';
    if (m.status === 'planning' || m.status === 'outline' || m.status === 'idea' || m.status === 'data_collection') col = 'idea';
    else if (m.status === 'in_progress' || m.status === 'drafting' || m.status === 'figure_preparation' || m.status === 'internal_review' || m.status === 'rejected') col = 'drafting';
    else if (m.status === 'submitted' || m.status === 'under_review' || m.status === 'revision') col = 'submitted';
    else if (m.status === 'accepted' || m.status === 'published') col = 'accepted';

    mCount[col]++;
    const linkedSubmission = w.RFCore.getCurrentSubmission(db, m.id);
    const card = buildKanbanCard(m, linkedSubmission, renderKanban, removeKanbanDropPlaceholders);
    document.getElementById(`cards-${col}`)?.appendChild(card);
  });

  bindKanbanColumnsAndPlaceholders(columns, mCount, visibleManuscripts.length);
}

function bindKanbanColumnsAndPlaceholders(columns: string[], mCount: Record<string, number>, totalVisible: number): void {
  const w = window as any;
  const collapseEmpty = typeof ZoteroBridge !== 'undefined' ? ZoteroBridge.getPref('collapseEmptyKanbanStages', false) : false;
  const emptyHints: Record<string, { icon: string; text: string; sub: string }> = {
    idea: { icon: '🎯', text: currentLanguage === 'zh' ? '暂无规划手稿' : 'No planned manuscripts', sub: currentLanguage === 'zh' ? '可拖拽手稿至此阶段' : 'Drag manuscripts here' },
    drafting: { icon: '⏳', text: currentLanguage === 'zh' ? '暂无进行中手稿' : 'No active drafts', sub: currentLanguage === 'zh' ? '可拖拽手稿至此阶段' : 'Drag manuscripts here' },
    submitted: { icon: '🚀', text: currentLanguage === 'zh' ? '暂无已投稿件' : 'No submissions', sub: currentLanguage === 'zh' ? '可拖拽手稿至此阶段' : 'Drag manuscripts here' },
    accepted: { icon: '🎉', text: currentLanguage === 'zh' ? '暂无已接收手稿' : 'No accepted papers', sub: currentLanguage === 'zh' ? '可拖拽手稿至此阶段' : 'Drag manuscripts here' },
  };

  columns.forEach((col) => {
    const countEl = document.getElementById(`count-${col}`);
    if (countEl) countEl.textContent = String(mCount[col]);
    const colEl = document.querySelector(`.kanban-col[data-status="${col}"]`);
    if (colEl) {
      colEl.classList.toggle('is-empty', mCount[col] === 0);
      colEl.classList.toggle('is-collapsed-empty', collapseEmpty && mCount[col] === 0);
    }

    const colCardsContainer = document.getElementById(`cards-${col}`);
    if (!colCardsContainer) return;
    if (mCount[col] === 0) {
      const hint = emptyHints[col] || { icon: '📥', text: currentLanguage === 'zh' ? '暂无条目' : 'No items', sub: '' };
      w.RFUI.setHTML(colCardsContainer, `
        <div class="kanban-empty-placeholder">
          <span class="empty-icon">${hint.icon}</span>
          <span class="empty-text">${escapeHTML(hint.text)}</span>
          <span class="empty-subtext">${escapeHTML(hint.sub)}</span>
        </div>
      `);
    }

    if (!colCardsContainer.dataset.dragBound) {
      colCardsContainer.dataset.dragBound = 'true';
      colCardsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        colCardsContainer.classList.add('drag-over');
        if (!colCardsContainer.querySelector?.('.kanban-drop-placeholder')) {
          removeKanbanDropPlaceholders();
          const ph = document.createElement('div');
          ph.className = 'kanban-drop-placeholder';
          colCardsContainer.appendChild(ph);
        }
      });

      colCardsContainer.addEventListener('dragleave', (e: any) => {
        if (e.relatedTarget && colCardsContainer.contains?.(e.relatedTarget)) return;
        colCardsContainer.classList.remove('drag-over');
        colCardsContainer.querySelector?.('.kanban-drop-placeholder')?.remove();
      });

      colCardsContainer.addEventListener('drop', async (e: DragEvent) => {
        e.preventDefault();
        colCardsContainer.classList.remove('drag-over');
        removeKanbanDropPlaceholders();
        const manuscriptId = e.dataTransfer?.getData('text/plain');
        const man = (db.manuscripts || []).find((x: any) => x.id === manuscriptId);
        if (!man) return;
        const newStatus = col === 'idea' ? 'planning' : (col === 'drafting' ? 'in_progress' : col);
        const boardEl = document.querySelector('.kanban-board');
        const beforeRects = w.RFUI?.captureElementRects?.(boardEl, '.kanban-card[data-manuscript-id]', 'data-manuscript-id');
        try {
          const result = await persistManuscriptStatusChange(man, newStatus);
          renderKanban();
          w.RFUI?.playFlipAnimation?.(boardEl, '.kanban-card[data-manuscript-id]', 'data-manuscript-id', beforeRects, {
            duration: 280,
            highlightKey: man.id,
            highlightClass: 'kanban-card-landed',
          });
          renderDashboard();
          renderSubmissions();
          showGlobalToast(tf('manuscriptStatusUpdatedTo', { status: getManuscriptStatusLabel(newStatus) }), 'success');
          if (result.shouldCelebrate) {
            showAcceptanceCelebration({ title: result.manuscript.title, manuscriptId: result.manuscript.id });
          }
        } catch (error: any) {
          console.error('Manuscript status drop save failed:', error);
          renderKanban();
          showGlobalToast(error.message || t('autoSaveFailed'), 'error');
        }
      });
    }
  });

  document.querySelector('.kanban-board')?.classList.toggle('all-empty', totalVisible === 0);
  setText('#kanban-stage-summary', tf('kanbanStageSummary', { count: columns.filter((col) => mCount[col] > 0).length, total: columns.length }));
  updateKanbanEmptyColumns();
}
