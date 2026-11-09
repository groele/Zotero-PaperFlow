/**
 * Zotero PaperFlow - Kanban Card Builder & Interaction Handlers
 */
import { deleteManuscript } from './status-helpers.js';
import { openManuscriptModal } from './manuscript-modal.js';

declare const db: any;
declare const currentLanguage: string;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function t(key: string): string;
declare function getManuscriptStatusLabel(status: string): string;
declare function getSubmissionStatusLabel(status: string): string;
declare function normalizeKanbanStatusClass(status: string): string;
declare function persistManuscriptStatusChange(manuscript: any, nextStatus: string): Promise<any>;
declare function navigateToSubmissionDetails(subId: string): void;
declare function renderDashboard(): void;
declare function renderSubmissions(): void;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;
declare function showAcceptanceCelebration(opts: { title: string; manuscriptId: string }): void;

export function buildKanbanCard(
  m: any,
  linkedSubmission: any,
  onReRender: () => void,
  removeDropPlaceholders: () => void
): HTMLElement {
  const w = window as any;
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
    removeDropPlaceholders();
  });

  card.querySelector('.btn-open-linked-submission')?.addEventListener('click', (event: any) => {
    event.stopPropagation();
    navigateToSubmissionDetails(event.currentTarget.dataset.subId);
  });

  card.querySelector(`#sel-man-status-${m.id}`)?.addEventListener('change', async (e: any) => {
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
      onReRender();
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
      onReRender();
      showGlobalToast(error.message || t('autoSaveFailed'), 'error');
    }
  });

  card.addEventListener('click', (e: any) => {
    if (e.target.closest?.('button, select, a, input, textarea, .zotero-card-badge, .zotero-pdf-badge, .zotero-citekey-badge')) return;
    if (m.zoteroItemKey && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.getPref('locateOnManuscriptClick', true)) {
      ZoteroBridge.selectItemInZotero(m.zoteroItemKey, m.zoteroLibraryID);
    }
  });

  card.querySelector(`#btn-edit-man-${m.id}`)?.addEventListener('click', () => openManuscriptModal(m));
  card.querySelector(`#btn-delete-man-${m.id}`)?.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteManuscript(m.id);
  });

  bindKanbanCardBadges(card, m, onReRender);
  return card;
}

export function bindKanbanCardBadges(card: HTMLElement, m: any, onReRender: () => void): void {
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
    onReRender();
    showGlobalToast(`已将文献《${(pItem.title || '').slice(0, 18)}…》成功关联到稿件！`, 'success');
    if (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero && ZoteroBridge.getPref('autoSyncChildNotes', true)) {
      ZoteroBridge.syncNote(m.zoteroItemKey, m.zoteroLibraryID);
    }
  });

  card.querySelector('.zotero-card-badge')?.addEventListener('click', (e: any) => {
    e.stopPropagation();
    const key = e.currentTarget.dataset.itemKey;
    if (key && typeof ZoteroBridge !== 'undefined') {
      ZoteroBridge.selectItemInZotero(key, m.zoteroLibraryID);
    }
  });

  card.querySelector('.zotero-pdf-badge')?.addEventListener('click', (e: any) => {
    e.stopPropagation();
    const key = e.currentTarget.dataset.itemKey;
    if (key && typeof ZoteroBridge !== 'undefined') {
      ZoteroBridge.openPdf(key, m.zoteroLibraryID);
    }
  });

  card.querySelector('.zotero-citekey-badge')?.addEventListener('click', (e: any) => {
    e.stopPropagation();
    const ck = e.currentTarget.dataset.citekey;
    if (ck) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(`\\cite{${ck}}`);
      }
      showGlobalToast(`已复制引文命令：\\cite{${ck}}`, 'info');
    }
  });

  card.querySelector('.zotero-sync-note-badge')?.addEventListener('click', async (e: any) => {
    e.stopPropagation();
    const key = e.currentTarget.dataset.itemKey;
    if (key && typeof ZoteroBridge !== 'undefined') {
      const ok = await ZoteroBridge.syncNote(key, m.zoteroLibraryID);
      showGlobalToast(ok ? '已成功将审稿时间线同步至 Zotero 笔记！' : '同步失败，请检查条目是否存在', ok ? 'success' : 'error');
    }
  });
}
