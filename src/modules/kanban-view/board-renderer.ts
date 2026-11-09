import { deleteManuscript, updateKanbanEmptyColumns } from './status-helpers';
import { openManuscriptModal } from './manuscript-modal';

declare const db: any;
declare const currentLanguage: string;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function setText(target: any, value: any): any;
declare function t(key: string): string;
declare function tf(key: string, vars?: Record<string, any>): string;
declare function getManuscriptStatusLabel(status: string): string;
declare function getSubmissionStatusLabel(status: string): string;
declare function normalizeKanbanStatusClass(status: string): string;
declare function persistManuscriptStatusChange(manuscript: any, nextStatus: string): Promise<any>;
declare function navigateToSubmissionDetails(subId: string): void;
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
    const currentJournal = linkedSubmission?.targetJournal || linkedSubmission?.journalName || m.targetJournals?.[0] || (currentLanguage === 'zh' ? '待定' : 'TBD');

    const card = document.createElement('div');
    card.className = `glass-card kanban-card kanban-status-${normalizeKanbanStatusClass(m.status)}`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', m.id);
    card.setAttribute('data-manuscript-id', m.id);

    const zoteroRowHtml = m.zoteroItemKey ? `
      <div class="kanban-zotero-row">
        <span class="zotero-card-badge" data-item-key="${escapeHTML(m.zoteroItemKey)}" title="在 Zotero 文献库中选中此条目">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
          Zotero
        </span>
        ${m.citekey ? `<span class="zotero-citekey-badge" id="badge-citekey-${m.id}" data-citekey="${escapeHTML(m.citekey)}" title="点击复制 Citation Key">[@${escapeHTML(m.citekey)}]</span>` : ''}
        ${m.pdfUri ? `<span class="zotero-pdf-badge" data-item-key="${escapeHTML(m.zoteroItemKey)}" title="在 Zotero PDF 阅读器中打开">📖 PDF</span>` : ''}
        ${m.annotationCount ? `<span class="zotero-anno-badge" title="包含 ${m.annotationCount} 条 Zotero PDF 高亮批注">📑 ${m.annotationCount}</span>` : ''}
        <span class="zotero-sync-note-badge" id="badge-sync-note-${m.id}" data-item-key="${escapeHTML(m.zoteroItemKey)}" title="同步审稿进展至 Zotero 云端笔记">📝 同步</span>
      </div>` : '';

    const pendingLinkBtnHtml = w._pendingZoteroLinkItem
      ? `<button class="btn-primary" style="padding: 2px 8px; font-size:10px; height: 24px; background:#e11d48; border-color:#be123c;" id="btn-link-this-${m.id}">🔗 ${currentLanguage === 'zh' ? '关联此文献' : 'Link Item'}</button>`
      : '';
    const targetJournalLabel = currentLanguage === 'zh' ? '目标期刊' : 'Target';
    const editLabel = currentLanguage === 'zh' ? '编辑' : 'Edit';
    const deleteLabel = currentLanguage === 'zh' ? '删除' : 'Delete';

    w.RFUI.setHTML(card, `
      <div class="kanban-card-title-row">
        <h4 title="${escapeHTML(m.title)}">${escapeHTML(m.title)}</h4>
      </div>
      <div class="kanban-card-meta-row">
        <span class="kanban-status-pill">${escapeHTML(getManuscriptStatusLabel(m.status))}</span>
        ${linkedSubmission?.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:10px; padding:1px 5px; border-radius:3px;" title="Manuscript ID: ${escapeHTML(linkedSubmission.externalManuscriptId)}">ID: ${escapeHTML(linkedSubmission.externalManuscriptId)}</span>` : ''}
        <p>${targetJournalLabel}: <strong>${escapeHTML(currentJournal)}</strong></p>
      </div>
      ${zoteroRowHtml}
      <div class="kanban-card-controls">
        <select class="kanban-card-select" id="sel-man-status-${m.id}" aria-label="${escapeHTML(t('status'))}: ${escapeHTML(m.title)}">
          <option value="planning" ${m.status === 'planning' ? 'selected' : ''}>${escapeHTML(t('statusPlanning'))}</option>
          <option value="idea" ${m.status === 'idea' ? 'selected' : ''}>${escapeHTML(t('statusIdea'))}</option>
          <option value="outline" ${m.status === 'outline' ? 'selected' : ''}>${escapeHTML(t('statusOutline'))}</option>
          <option value="in_progress" ${m.status === 'in_progress' ? 'selected' : ''}>${escapeHTML(t('statusInProgress'))}</option>
          <option value="figure_preparation" ${m.status === 'figure_preparation' ? 'selected' : ''}>${escapeHTML(t('statusFiguresPrep'))}</option>
          <option value="drafting" ${m.status === 'drafting' ? 'selected' : ''}>${escapeHTML(t('statusDrafting'))}</option>
          <option value="internal_review" ${m.status === 'internal_review' ? 'selected' : ''}>${escapeHTML(t('statusInternalReview'))}</option>
          <option value="submitted" ${m.status === 'submitted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('submitted'))}</option>
          <option value="under_review" ${m.status === 'under_review' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('under_review'))}</option>
          <option value="revision" ${m.status === 'revision' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('revision'))}</option>
          <option value="accepted" ${m.status === 'accepted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('accepted'))}</option>
          <option value="published" ${m.status === 'published' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('published'))}</option>
          <option value="rejected" ${m.status === 'rejected' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('rejected'))}</option>
        </select>
        <div class="kanban-card-actions">
          ${pendingLinkBtnHtml}
          ${linkedSubmission ? `<button type="button" class="btn-secondary btn-open-linked-submission" data-sub-id="${escapeHTML(linkedSubmission.id)}" aria-label="${escapeHTML(t('openSubmissionDetails'))}: ${escapeHTML(m.title)}">${escapeHTML(t('openSubmissionDetails'))}</button>` : ''}
          <button type="button" class="btn-secondary btn-edit-manuscript" id="btn-edit-man-${m.id}">${editLabel}</button>
          <button type="button" class="btn-secondary btn-delete-manuscript" id="btn-delete-man-${m.id}" title="${escapeHTML(deleteLabel)}">${deleteLabel}</button>
        </div>
      </div>
    `);

    card.addEventListener('dragstart', (e: DragEvent) => {
      card.classList.add('dragging');
      e.dataTransfer?.setData('text/plain', m.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      removeKanbanDropPlaceholders();
    });

    document.getElementById(`cards-${col}`)?.appendChild(card);

    card.querySelector('.btn-open-linked-submission')?.addEventListener('click', (event: any) => {
      event.stopPropagation();
      navigateToSubmissionDetails(event.currentTarget.dataset.subId);
    });

    document.getElementById(`sel-man-status-${m.id}`)?.addEventListener('change', async (e: any) => {
      const boardEl = document.querySelector('.kanban-board');
      const beforeRects = w.RFUI?.captureElementRects?.(boardEl, '.kanban-card[data-manuscript-id]', 'data-manuscript-id');
      try {
        const result = await persistManuscriptStatusChange(m, e.target.value);
        if (m.zoteroItemKey && typeof ZoteroBridge !== 'undefined') {
          ZoteroBridge.syncStatusTag(m.zoteroItemKey, e.target.value, m.zoteroLibraryID);
          if (ZoteroBridge.getPref('autoAddToPipelineCollection', true)) {
            ZoteroBridge.addToPipelineCollection(m.zoteroItemKey, m.zoteroLibraryID);
          }
          if (ZoteroBridge.getPref('autoSyncChildNotes', true)) {
            ZoteroBridge.syncNote(m.zoteroItemKey, m.zoteroLibraryID);
          }
        }
        renderKanban();
        w.RFUI?.playFlipAnimation?.(boardEl, '.kanban-card[data-manuscript-id]', 'data-manuscript-id', beforeRects, {
          duration: 280,
          highlightKey: m.id,
          highlightClass: 'kanban-card-landed',
        });
        renderDashboard();
        renderSubmissions();
        showGlobalToast(t('manuscriptStatusUpdated'), 'success');
        if (result.shouldCelebrate && (typeof ZoteroBridge === 'undefined' || ZoteroBridge.getPref('enableAcceptanceCelebration', true))) {
          showAcceptanceCelebration({ title: result.manuscript.title, manuscriptId: result.manuscript.id });
        }
      } catch (error: any) {
        console.error('Manuscript status save failed:', error);
        renderKanban();
        showGlobalToast(error.message || t('autoSaveFailed'), 'error');
      }
    });

    card.addEventListener('click', (e: any) => {
      if (e.target.closest?.('button, select, a, input, textarea, .zotero-card-badge, .zotero-pdf-badge, .zotero-citekey-badge')) return;
      if (m.zoteroItemKey && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.getPref('locateOnManuscriptClick', true)) {
        ZoteroBridge.selectItemInZotero(m.zoteroItemKey, m.zoteroLibraryID);
      }
    });

    document.getElementById(`btn-edit-man-${m.id}`)?.addEventListener('click', () => openManuscriptModal(m));
    document.getElementById(`btn-delete-man-${m.id}`)?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteManuscript(m.id);
    });

    bindKanbanCardBadges(card, m);
  });

  bindKanbanColumnsAndPlaceholders(columns, mCount, visibleManuscripts.length);
}

function bindKanbanCardBadges(card: HTMLElement, m: any): void {
  const w = window as any;
  card.querySelector(`#btn-link-this-${m.id}`)?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const pItem = w._pendingZoteroLinkItem;
    if (!pItem) return;
    m.zoteroItemKey = pItem.key;
    m.zoteroLibraryID = pItem.libraryID ?? null;
    m.zoteroUri = pItem.zoteroUri;
    m.pdfUri = pItem.pdfUri;
    if (!m.doi && pItem.doi) m.doi = pItem.doi;
    m.updatedAt = new Date().toISOString();
    await w.storage.saveAll(db);
    w._pendingZoteroLinkItem = null;
    renderKanban();
    showGlobalToast(`已将文献《${(pItem.title || '').slice(0, 18)}…》成功关联到稿件！`, 'success');
    if (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero && ZoteroBridge.getPref('autoSyncChildNotes', true)) {
      ZoteroBridge.syncNote(m.zoteroItemKey, m.zoteroLibraryID);
    }
  });

  card.querySelector('.zotero-card-badge')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof ZoteroBridge !== 'undefined') ZoteroBridge.selectItemInZotero(m.zoteroItemKey, m.zoteroLibraryID);
  });
  card.querySelector('.zotero-pdf-badge')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof ZoteroBridge !== 'undefined') ZoteroBridge.openPdf(m.zoteroItemKey, null, m.zoteroLibraryID);
  });
  card.querySelector(`#badge-citekey-${m.id}`)?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (m.citekey && typeof ZoteroBridge !== 'undefined') {
      ZoteroBridge.copyText(`[@${m.citekey}]`, currentLanguage === 'zh' ? `已复制 Citation Key: [@${m.citekey}]` : `Copied Citation Key: [@${m.citekey}]`);
    }
  });
  const syncBadge = card.querySelector(`#badge-sync-note-${m.id}`);
  syncBadge?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (typeof ZoteroBridge !== 'undefined') {
      syncBadge.textContent = currentLanguage === 'zh' ? '⏳ 同步中' : '⏳ Syncing';
      const ok = await ZoteroBridge.syncNote(m.zoteroItemKey, m.zoteroLibraryID);
      syncBadge.textContent = ok ? (currentLanguage === 'zh' ? '✅ 已同步' : '✅ Synced') : (currentLanguage === 'zh' ? '❌ 失败' : '❌ Failed');
      if (ok) showGlobalToast(currentLanguage === 'zh' ? '审稿进展已成功同步至 Zotero 云端笔记！' : 'Synced pipeline progress to Zotero child note!', 'success');
      setTimeout(() => { syncBadge.textContent = currentLanguage === 'zh' ? '📝 同步' : '📝 Sync'; }, 2000);
    }
  });
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
