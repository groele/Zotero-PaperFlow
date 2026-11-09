import { openSubmissionForEditing } from './autosave-and-editor';
import {
  renderJournalPortals,
  openJournalPortalEditor,
  setupJournalPortalListeners,
} from './journal-portals';

export {
  renderJournalPortals,
  openJournalPortalEditor,
  setupJournalPortalListeners,
};

declare var db: any;
declare var selectedSubmissionId: any;
declare const currentLanguage: string;
declare const modal: HTMLElement | null;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function t(key: string): string;
declare function tf(key: string, vars?: Record<string, any>): string;
declare function sortDashboardSubmissions(submissions: any[]): any[];
declare function getSubmissionJournalName(sub: any): string;
declare function getSubmissionStatusLabel(status: string): string;
declare function normalizeSubmissionStatus(status: string): string;
declare function getSubmissionFirstAuthor(sub: any, man?: any): string;
declare function syncManuscriptStatusesFromSubmissions(database?: any): void;
declare function openModal(html: string): void;
declare function closeModal(): void;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;

export function setupSubmissionSearch(): void {
  const input = document.getElementById('submission-search') as HTMLInputElement | null;
  if (!input || input.dataset.bound) return;
  input.dataset.bound = 'true';
  input.addEventListener('input', (event: any) => { if (!event.isComposing) applySubmissionSearch(); });
  input.addEventListener('compositionend', applySubmissionSearch);
  document.getElementById('submission-search-status')?.addEventListener('change', applySubmissionSearch);
  const clear = (all = false) => {
    input.value = '';
    const statusSelect = document.getElementById('submission-search-status') as HTMLSelectElement | null;
    if (all && statusSelect) statusSelect.value = 'all';
    applySubmissionSearch();
    input.focus();
  };
  document.getElementById('submission-search-clear')?.addEventListener('click', () => clear());
  document.getElementById('submission-search-reset')?.addEventListener('click', () => clear(true));
  input.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); clear(); }
    if (event.key === 'Enter') {
      event.preventDefault();
      (document.querySelector('.submission-card-item:not([hidden]) .btn-edit-submission') as HTMLElement | null)?.click();
    }
  });
  document.addEventListener('keydown', (event: any) => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || (typeof modal !== 'undefined' && modal?.classList?.contains('active'))) return;
    if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (document.getElementById('view-submissions')?.classList?.contains('active')) {
      event.preventDefault();
      input.focus();
    }
  });
}

export function applySubmissionSearch(): void {
  const w = window as any;
  const input = document.getElementById('submission-search') as HTMLInputElement | null;
  if (!input) return;
  const filter = (document.getElementById('submission-search-status') as HTMLSelectElement | null)?.value || 'all';
  const terms = w.RFUI.normalizeSearchText(input.value).split(/\s+/).filter(Boolean);
  const cards = document.querySelectorAll('#submissions-list-container .submission-card-item');
  let count = 0;
  cards.forEach((card: any) => {
    const matches = w.RFUI.matchesSubmissionSearch(card.dataset.searchText, card.dataset.searchStatus, terms, filter);
    if (card.hidden === matches) card.hidden = !matches;
    if (matches) count += 1;
  });
  const clearBtn = document.getElementById('submission-search-clear') as HTMLElement | null;
  if (clearBtn) clearBtn.hidden = !input.value;
  const emptyEl = document.getElementById('submission-search-empty') as HTMLElement | null;
  if (emptyEl) emptyEl.hidden = count > 0 || cards.length === 0;
  const countEl = document.getElementById('submission-search-count');
  if (countEl) countEl.textContent = tf('submissionSearchCount', { count, total: cards.length });
}

export function renderSubmissions({ refreshDetails = true } = {}): void {
  const w = window as any;
  if (w.RFUI?.isViewDeferred?.('view-submissions')) return;

  const container = document.getElementById('submissions-list-container');
  w.RFUI.setHTML(container, '');

  if (db.submissions.length === 0) {
    w.RFUI.setHTML(container, `<p class="empty-state">${escapeHTML(t('noSubmissionsTracked'))}</p>`);
    selectedSubmissionId = null;
  } else {
    const sortedSubmissions = sortDashboardSubmissions(db.submissions);
    const manuscriptsById = new Map<string, any>(db.manuscripts.map((manuscript: any) => [manuscript.id, manuscript]));
    const cards = document.createDocumentFragment();
    if (!sortedSubmissions.some((sub) => sub.id === selectedSubmissionId)) {
      selectedSubmissionId = sortedSubmissions[0].id;
    }
    const selectedSubmission = sortedSubmissions.find((sub) => sub.id === selectedSubmissionId) || sortedSubmissions[0];

    sortedSubmissions.forEach((sub, index) => {
      const displayIndex = sortedSubmissions.length - index;
      const card = document.createElement('div');
      card.className = `glass-card submission-card-item ${sub.id === selectedSubmissionId ? 'selected' : ''}`;

      const man = manuscriptsById.get(sub.manuscriptId);
      const manTitle = man ? man.title : (sub.title || t('untitledManuscript'));
      const journalName = getSubmissionJournalName(sub);
      const statusText = getSubmissionStatusLabel(sub.status || 'submitted');
      card.dataset.searchStatus = normalizeSubmissionStatus(sub.status);
      card.dataset.searchText = w.RFUI.normalizeSearchText([manTitle, journalName, sub.externalManuscriptId, getSubmissionFirstAuthor(sub, man), man?.authors, man?.doi, sub.doi, statusText, sub.status].filter(Boolean).join(' '));
      const transferText = sub.previousJournal
        ? `<span class="submission-card-meta">${escapeHTML(t('transferToJournal'))}: ${escapeHTML(sub.previousJournal)}</span>`
        : '';
      let cardCountdownHtml = '';
      if (sub.revisionDueDate && (sub.status === 'revision' || sub.status === 'under_review')) {
        const cd = w.RFCalendar?.getRevisionCountdownMeta ? w.RFCalendar.getRevisionCountdownMeta(sub.revisionDueDate) : null;
        if (cd) {
          cardCountdownHtml = `<span class="${escapeHTML(cd.badgeClass)}" style="font-size:10px; padding:1px 6px; border-radius:3px;" title="${escapeHTML(cd.title)}">${escapeHTML(cd.icon)} ${escapeHTML(cd.text)}</span>`;
        }
      }

      w.RFUI.setHTML(card, `
        <div class="submission-card-heading">
          <div class="submission-card-title-group">
            <span class="submission-index">${displayIndex}</span>
            <div class="submission-card-copy">
              <h4 title="${escapeHTML(journalName)}">${escapeHTML(journalName)}</h4>
              <p class="submission-card-title">${escapeHTML(manTitle)}</p>
            </div>
          </div>
          <button class="btn-secondary btn-icon submission-card-edit btn-edit-submission" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('editFields'))}">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
        </div>
        <div class="submission-card-footer">
          <span class="${w.RFUI.getSubmissionStatusBadgeClass(sub.status)}">${escapeHTML(statusText)}</span>
          ${sub.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:10px; padding:1px 6px; border-radius:3px;" title="Manuscript ID: ${escapeHTML(sub.externalManuscriptId)}">ID: ${escapeHTML(sub.externalManuscriptId)}</span>` : ''}
          ${cardCountdownHtml}
          ${transferText}
          ${man?.zoteroItemKey ? `
            <span class="zotero-card-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 文献库中选中此条目' : 'Select in Zotero library')}" style="padding:1px 6px; font-size:10px; margin-left:auto;">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
              Zotero
            </span>
          ` : ''}
        </div>
      `);

      card.addEventListener('click', () => openSubmissionForEditing(sub));
      card.querySelector('.btn-edit-submission')?.addEventListener('click', (event) => {
        event.stopPropagation();
        openSubmissionForEditing(sub, { focusEditCenter: true });
      });

      const cardZoteroBadge = card.querySelector('.zotero-card-badge');
      cardZoteroBadge?.addEventListener('click', (event) => {
        event.stopPropagation();
        const key = cardZoteroBadge.getAttribute('data-item-key');
        if (key && typeof ZoteroBridge !== 'undefined') {
          const linkedMan = db.manuscripts?.find((item: any) => item.id === sub.manuscriptId);
          ZoteroBridge.selectItemInZotero(key, linkedMan?.zoteroLibraryID);
        }
      });

      cards.appendChild(card);
    });
    container?.appendChild(cards);

    const detailPanel = document.getElementById('submission-detail-panel');
    if (refreshDetails || detailPanel?.dataset.currentSubmissionId !== selectedSubmission.id) {
      w.renderSubmissionDetails?.(selectedSubmission);
    }
  }

  renderJournalPortals();
  applySubmissionSearch();
}

export function openLinkSubmissionModal(submission: any): void {
  const w = window as any;
  const manuscripts = Array.isArray(db.manuscripts) ? db.manuscripts : [];
  if (manuscripts.length === 0) {
    showGlobalToast(t('noManuscriptsToLink'), 'warning');
    return;
  }

  const manuscriptOptions = manuscripts.slice()
    .sort((a: any, b: any) => String(a.title || '').localeCompare(String(b.title || '')))
    .map((m: any) => `<option value="${escapeHTML(m.id)}">${escapeHTML(m.title || t('untitledManuscript'))}</option>`)
    .join('');

  openModal(`
    <div class="modal-header">
      <div>
        <h2>${escapeHTML(t('linkSubmissionTitle'))}</h2>
        <p class="text-muted">${escapeHTML(t('linkSubmissionHelp'))}</p>
      </div>
      <button class="btn-secondary btn-icon" id="btn-close-modal" aria-label="${escapeHTML(t('cancel'))}">✕</button>
    </div>
    <div class="form-group">
      <label for="submission-link-manuscript">${escapeHTML(t('workflowManuscriptLabel'))}</label>
      <select id="submission-link-manuscript">${manuscriptOptions}</select>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-cancel-link-sub">${escapeHTML(t('cancel') || '取消')}</button>
      <button type="button" class="btn-primary" id="btn-confirm-submission-link" style="min-width:130px;">${escapeHTML(t('linkSubmissionConfirm'))}</button>
    </div>
  `);

  document.getElementById('btn-cancel-link-sub')?.addEventListener('click', closeModal);
  document.getElementById('btn-confirm-submission-link')?.addEventListener('click', async () => {
    const manuscriptId = (document.getElementById('submission-link-manuscript') as HTMLSelectElement | null)?.value;
    const manuscript = db.manuscripts.find((item: any) => item.id === manuscriptId);
    const liveSubmission = db.submissions.find((item: any) => item.id === submission.id);
    if (!manuscript || !liveSubmission) return;
    const previous = { manuscriptId: liveSubmission.manuscriptId, projectId: liveSubmission.projectId, updatedAt: liveSubmission.updatedAt };
    const manuscriptStates = db.manuscripts.map((item: any) => [item, item.status, item.updatedAt]);
    try {
      liveSubmission.manuscriptId = manuscript.id;
      liveSubmission.projectId = manuscript.projectId || liveSubmission.projectId || null;
      liveSubmission.updatedAt = new Date().toISOString();
      syncManuscriptStatusesFromSubmissions(db);
      db = await w.storage.saveAll(db) || db;
      closeModal();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      const linkedSubmission = db.submissions.find((item: any) => item.id === submission.id);
      if (linkedSubmission) w.renderSubmissionDetails?.(linkedSubmission);
      showGlobalToast(t('linkSubmissionSaved'), 'success');
    } catch (error: any) {
      Object.assign(liveSubmission, previous);
      manuscriptStates.forEach(([item, status, updatedAt]: any) => { item.status = status; item.updatedAt = updatedAt; });
      showGlobalToast(error.message || String(error), 'error');
    }
  });
}

function getRebuttalEngine(): any {
  const w = typeof window !== 'undefined' ? (window as any) : null;
  if (w?.RFAcademicExport) return w.RFAcademicExport;
  if ((globalThis as any)?.RFAcademicExport) return (globalThis as any).RFAcademicExport;
  return {};
}

export function escapeLatexText(value: any): string {
  return (getRebuttalEngine().escapeLatexText || ((v: any) => String(v ?? '')))(value);
}

export function safeEscapeLatex(value: any): string {
  return (getRebuttalEngine().safeEscapeLatex || ((v: any) => String(v ?? '')))(value);
}

export function copyRebuttalRichText(htmlContent: string, plainFallback: string): Promise<boolean> {
  return (getRebuttalEngine().copyRebuttalRichText || (async () => false))(htmlContent, plainFallback);
}

export function generateAcademicRebuttalLetter(sub: any, man: any, format = 'latex'): string {
  return (getRebuttalEngine().generateAcademicRebuttalLetter || (() => ''))(sub, man, format);
}

export function parseReviewCommentsBatch(rawText = '', defaultReviewer = 'Reviewer #1'): any[] {
  return (getRebuttalEngine().parseReviewCommentsBatch || (() => []))(rawText, defaultReviewer);
}

export function renderRebuttalProgressTracker(sub: any = {}): string {
  return (getRebuttalEngine().renderRebuttalProgressTracker || (() => ''))(sub);
}

export function generateRevisionCoverLetter(sub: any = {}, man: any = {}, format = 'html'): string {
  return (getRebuttalEngine().generateRevisionCoverLetter || (() => ''))(sub, man, format);
}

export function openBatchReviewImportModal(sub: any, reviewBox: any, onComplete?: () => void): void {
  return (getRebuttalEngine().openBatchReviewImportModal || (() => {}))(sub, reviewBox, onComplete);
}
