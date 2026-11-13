import { deleteManuscript } from './status-helpers';
import { renderKanban } from './board-renderer';
import { type ZoteroModalBindState } from './zotero-drawer';
import { setupZoteroModalBindings } from './zotero-modal-binder';
import { acquireModalScope } from '../ui-utils/lifecycle.js';

declare const db: any;
declare const currentLanguage: string;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function t(key: string): string;
declare function getSubmissionStatusLabel(status: string): string;
declare function buildAcademicCaptureSummary(prefill: any): string;
declare function splitAcademicAuthors(raw: any): string[];
declare function normalizeDoi(value: any): string;
declare function findAcademicManuscriptMatch(criteria: any): any;
declare function validateLinkedManuscriptStatus(manuscript: any, nextStatus: string): void;
declare function setManuscriptStatus(manuscript: any, nextStatus: string): any;
declare function syncLinkedSubmissionsFromManuscript(manuscript: any): boolean;
declare function academicCaptureProvenance(prefill: any): any;
declare function openModal(html: string): void;
declare function closeModal(): void;
declare function renderDashboard(): void;
declare function renderSubmissions(): void;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;

export function bindAddManuscriptButton(): void {
  document.getElementById('btn-add-manuscript')?.addEventListener('click', () => {
    openManuscriptModal(null);
  });
}

export function openManuscriptModal(man: any = null, prefill: any = null): void {
  const w = window as any;
  const isEdit = !!man;
  const initialTitle = isEdit ? man.title : prefill?.title;
  const initialJournal = isEdit ? man.targetJournals?.[0] : prefill?.publication;
  const initialAbstract = isEdit ? man.abstract : prefill?.abstract;
  const initialAuthors = isEdit
    ? (Array.isArray(man.authors) ? man.authors.join('; ') : man.authors)
    : (Array.isArray(prefill?.authorList) && prefill.authorList.length ? prefill.authorList.join('; ') : prefill?.authors);
  const initialDoi = isEdit ? man.doi : prefill?.doi;
  const initialArticleUrl = isEdit ? man.articleUrl : (prefill?.articleUrl || prefill?.pdfUrl);
  const initialStatus = isEdit ? man.status : (prefill?.status || (prefill?.isCapturedPublication ? 'published' : 'idea'));

  const state: ZoteroModalBindState = {
    currentZoteroItemKey: isEdit ? (man.zoteroItemKey || null) : (prefill?.zoteroItemKey || null),
    currentZoteroLibraryID: isEdit ? (man.zoteroLibraryID ?? null) : (prefill?.zoteroLibraryID ?? null),
    currentZoteroUri: isEdit ? (man.zoteroUri || null) : (prefill?.zoteroUri || null),
    currentPdfUri: isEdit ? (man.pdfUri || null) : (prefill?.pdfUri || null),
    currentCiteKey: isEdit ? (man.citekey || '') : (prefill?.citekey || ''),
    currentBibtex: isEdit ? (man.bibtex || '') : (prefill?.bibtex || ''),
    currentCitationApa: isEdit ? (man.citationApa || '') : (prefill?.citationApa || ''),
    currentRelatedItems: isEdit ? (man.relatedItems || []) : (prefill?.relatedItems || []),
  };

  const isZoteroEnv = Boolean((typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) || (typeof window !== 'undefined' && (w.Zotero || w.parent?.Zotero)));

  const zoteroActionBarHtml = isZoteroEnv ? `
    <div class="zotero-modal-action-bar" id="zotero-modal-hub" style="background:var(--material-background, rgba(0,0,0,0.02)); border:1px solid var(--border-color); border-radius:8px; padding:10px 14px; margin-bottom:14px; display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
        <div id="zotero-bind-status" style="font-size:12px; display:flex; align-items:center; gap:8px; cursor:pointer;" title="点击检索或关联 Zotero 文献库">
          ${state.currentZoteroItemKey
            ? `<span style="color:#059669; font-weight:600; display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>已关联 Zotero 文献条目</span>`
            : `<span style="color:#64748b; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>${escapeHTML(currentLanguage === 'zh' ? '未绑定 Zotero 文献条目 (点击可搜索关联)' : 'No Zotero item linked (Click to search)')}</span>`}
          <span id="zotero-modal-citekey" class="zotero-citekey-badge" style="${state.currentCiteKey ? '' : 'display:none;'}" title="点击复制 Citation Key">[@${escapeHTML(state.currentCiteKey)}]</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <button type="button" class="btn-secondary" id="btn-zotero-fetch-active" style="padding:4px 9px; font-size:11px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;" title="读取 Zotero 当前选中的文献条目并自动填充各字段">📥 从当前选中导入</button>
          <button type="button" class="btn-secondary" id="btn-zotero-toggle-search" style="padding:4px 9px; font-size:11px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;" title="在 Zotero 文献库中按关键词检索文献">🔍 检索文献库</button>
          <button type="button" class="btn-secondary" id="btn-zotero-copy-bib" style="padding:4px 8px; font-size:11px; color:#475569; ${state.currentBibtex ? '' : 'display:none;'}" title="复制 BibTeX 引用条目">📋 BibTeX</button>
          <button type="button" class="btn-secondary" id="btn-zotero-copy-apa" style="padding:4px 8px; font-size:11px; color:#475569; ${state.currentCitationApa ? '' : 'display:none;'}" title="复制标准引用 (APA)">📋 引用</button>
          <button type="button" class="btn-secondary" id="btn-zotero-toggle-annos" style="padding:4px 8px; font-size:11px; color:#d97706; ${state.currentZoteroItemKey ? '' : 'display:none;'}" title="查看并引用 Zotero 研读资产库">📑 研读资产</button>
          <button type="button" class="btn-secondary" id="btn-zotero-open-pdf" style="padding:4px 8px; font-size:11px; color:#059669; ${state.currentZoteroItemKey ? '' : 'display:none;'}" title="在 Zotero 阅读器中打开 PDF">📖 原文 PDF</button>
          <button type="button" class="btn-secondary" id="btn-zotero-sync-note" style="padding:4px 8px; font-size:11px; color:#e11d48; border-color:rgba(225,29,72,0.3); font-weight:500; ${state.currentZoteroItemKey ? '' : 'display:none;'}" title="同步稿件进展至 Zotero 云笔记">📝 同步笔记</button>
          <button type="button" class="btn-secondary" id="btn-zotero-locate" style="padding:4px 8px; font-size:11px; ${state.currentZoteroItemKey ? '' : 'display:none;'}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 文献库中定位该条目' : 'Locate item in Zotero library')}">🔗 ${escapeHTML(currentLanguage === 'zh' ? '定位' : 'Locate')}</button>
          <button type="button" class="btn-secondary" id="btn-zotero-unlink" style="padding:4px 8px; font-size:11px; color:#ef4444; ${state.currentZoteroItemKey ? '' : 'display:none;'}" title="${escapeHTML(currentLanguage === 'zh' ? '解除与 Zotero 文献的绑定' : 'Unlink from Zotero item')}">✕ ${escapeHTML(currentLanguage === 'zh' ? '解绑' : 'Unlink')}</button>
        </div>
      </div>
      <div id="zotero-active-item-banner" style="display:none; background:rgba(37, 99, 235, 0.08); border:1px solid rgba(37, 99, 235, 0.25); border-radius:6px; padding:7px 10px; font-size:11.5px; color:#1d4ed8; justify-content:space-between; align-items:center;">
        <span id="zotero-active-item-text" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:78%;"></span>
        <button type="button" class="btn-primary" id="btn-zotero-quick-bind-active" style="padding:3px 9px; font-size:11px; cursor:pointer; flex-shrink:0;">⚡ 一键关联填入</button>
      </div>
      <div id="zotero-search-container" style="position:relative; width:100%; display:${state.currentZoteroItemKey ? 'none' : 'block'};">
        <input type="text" id="ipt-zotero-live-search" placeholder="${escapeHTML(currentLanguage === 'zh' ? '🔍 检索 Zotero 10 文献库 (输入标题/作者/DOI/年份) 快速关联并填充...' : '🔍 Search Zotero 10 library (title/author/DOI/year) to link...')}" style="font-size:12px; padding:7px 10px; width:100%; box-sizing:border-box; background:var(--input-bg); color:hsl(var(--text-primary)); border:1px solid var(--input-border); border-radius:6px; outline:none;">
        <div id="zotero-search-results-dropdown" class="zotero-search-dropdown" style="display:none;"></div>
      </div>
      <div id="man-zotero-annotations-panel" class="zotero-annotations-panel" style="display:none;"></div>
      <div id="man-zotero-related-panel" style="display:none; font-size:11px; color:hsl(var(--text-secondary));">
        <strong>🔗 Zotero 关联文献网络：</strong>
        <div id="man-zotero-related-chips" class="zotero-related-chips"></div>
      </div>
    </div>
  ` : '';

  openModal(`
    <div class="modal-header">
      <h2>${escapeHTML(isEdit ? t('editManuscriptMetadata') : t('addNewManuscriptTitle'))}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="关闭">✕</button>
    </div>
    ${buildAcademicCaptureSummary(prefill)}
    ${zoteroActionBarHtml}
    <div class="form-group">
      <label>${escapeHTML(t('manuscriptTitleLabel'))}</label>
      <input type="text" id="man-title" value="${escapeHTML(initialTitle || '')}" placeholder="${escapeHTML(t('paperTitlePlaceholder'))}">
    </div>
    <div class="grid-cols-2">
      <div class="form-group">
        <label>${escapeHTML(t('writingStatus'))}</label>
        <select id="man-status">
          <option value="planning" ${initialStatus === 'planning' ? 'selected' : ''}>${escapeHTML(t('statusPlanning'))}</option>
          <option value="idea" ${initialStatus === 'idea' ? 'selected' : ''}>${escapeHTML(t('statusIdea'))}</option>
          <option value="outline" ${initialStatus === 'outline' ? 'selected' : ''}>${escapeHTML(t('statusOutline'))}</option>
          <option value="in_progress" ${initialStatus === 'in_progress' ? 'selected' : ''}>${escapeHTML(t('statusInProgress'))}</option>
          <option value="figure_preparation" ${initialStatus === 'figure_preparation' ? 'selected' : ''}>${escapeHTML(t('statusFiguresPrep'))}</option>
          <option value="drafting" ${initialStatus === 'drafting' ? 'selected' : ''}>${escapeHTML(t('statusDrafting'))}</option>
          <option value="internal_review" ${initialStatus === 'internal_review' ? 'selected' : ''}>${escapeHTML(t('statusInternalReview'))}</option>
          <option value="submitted" ${initialStatus === 'submitted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('submitted'))}</option>
          <option value="under_review" ${initialStatus === 'under_review' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('under_review'))}</option>
          <option value="revision" ${initialStatus === 'revision' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('revision'))}</option>
          <option value="accepted" ${initialStatus === 'accepted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('accepted'))}</option>
          <option value="published" ${initialStatus === 'published' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('published'))}</option>
          <option value="rejected" ${initialStatus === 'rejected' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('rejected'))}</option>
        </select>
      </div>
      <div class="form-group">
        <label>${escapeHTML(t('targetJournalInput'))}</label>
        <input type="text" id="man-journal" value="${escapeHTML(initialJournal || '')}" placeholder="${escapeHTML(t('targetJournalPlaceholder'))}">
      </div>
    </div>
    <div class="form-group">
      <label>${escapeHTML(t('authorsLabel'))}</label>
      <input type="text" id="man-authors" value="${escapeHTML(initialAuthors || '')}" placeholder="A. Researcher; B. Scientist">
    </div>
    <div class="grid-cols-2">
      <div class="form-group">
        <label>${escapeHTML(t('doiLabel'))}</label>
        <input type="text" id="man-doi" value="${escapeHTML(initialDoi || '')}" placeholder="10.xxxx/xxxxx">
      </div>
      <div class="form-group">
        <label>${escapeHTML(t('scholarSourcePage'))}</label>
        <input type="url" id="man-article-url" value="${escapeHTML(initialArticleUrl || '')}" placeholder="https://…">
      </div>
    </div>
    <div class="form-group">
      <label>${escapeHTML(t('abstractDraft'))}</label>
      <textarea id="man-abstract" placeholder="${escapeHTML(t('abstractPlaceholder'))}">${escapeHTML(initialAbstract || '')}</textarea>
    </div>
    <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        ${isEdit ? `<button type="button" class="btn-danger" id="btn-modal-delete-man" style="cursor:pointer; padding:6px 14px;">${escapeHTML(t('deleteManuscript') || (currentLanguage === 'zh' ? '删除稿件' : 'Delete Manuscript'))}</button>` : ''}
      </div>
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn-secondary" id="btn-cancel-man">${escapeHTML(t('cancel') || '取消')}</button>
        <button type="button" class="btn-primary" id="btn-submit-man" style="min-width:120px;">${escapeHTML(isEdit ? t('saveChanges') : t('createManuscript'))}</button>
      </div>
    </div>
  `);

  const modalScope = acquireModalScope();
  modalScope.on(document.getElementById('btn-cancel-man'), 'click', closeModal);
  modalScope.on(document.getElementById('btn-modal-delete-man'), 'click', () => {
    closeModal();
    deleteManuscript(man.id);
  });

  if (isZoteroEnv) {
    setupZoteroModalBindings(state, modalScope);
  }

  modalScope.on(document.getElementById('btn-submit-man'), 'click', async () => {
    const title = ((document.getElementById('man-title') as HTMLInputElement | null)?.value || '').trim();
    const status = (document.getElementById('man-status') as HTMLSelectElement | null)?.value || 'idea';
    const journal = ((document.getElementById('man-journal') as HTMLInputElement | null)?.value || '').trim();
    const authors = splitAcademicAuthors((document.getElementById('man-authors') as HTMLInputElement | null)?.value || '');
    const doi = normalizeDoi((document.getElementById('man-doi') as HTMLInputElement | null)?.value || '');
    const articleUrl = ((document.getElementById('man-article-url') as HTMLInputElement | null)?.value || '').trim();
    const abstract = ((document.getElementById('man-abstract') as HTMLTextAreaElement | null)?.value || '').trim();

    if (!title) {
      alert(t('manuscriptTitleRequired'));
      return;
    }

    const duplicate = !isEdit && prefill ? findAcademicManuscriptMatch({ title, doi, articleUrl }) : null;
    if (duplicate && !confirm(t('academicDuplicateConfirm'))) return;

    const targetManuscript = isEdit ? man : duplicate;
    if (targetManuscript) {
      try { validateLinkedManuscriptStatus(targetManuscript, status); }
      catch (error: any) { showGlobalToast(error.message, 'error'); return; }
      targetManuscript.title = title;
      setManuscriptStatus(targetManuscript, status);
      targetManuscript.targetJournals = journal ? [journal] : [];
      targetManuscript.abstract = abstract;
      targetManuscript.authors = authors;
      targetManuscript.firstAuthor = authors[0] || targetManuscript.firstAuthor || null;
      targetManuscript.doi = doi || null;
      targetManuscript.articleUrl = articleUrl || null;
      targetManuscript.zoteroItemKey = state.currentZoteroItemKey;
      targetManuscript.zoteroLibraryID = state.currentZoteroLibraryID;
      targetManuscript.zoteroUri = state.currentZoteroUri;
      targetManuscript.pdfUri = state.currentPdfUri;
      targetManuscript.citekey = state.currentCiteKey || targetManuscript.citekey || null;
      targetManuscript.bibtex = state.currentBibtex || targetManuscript.bibtex || null;
      targetManuscript.citationApa = state.currentCitationApa || targetManuscript.citationApa || null;
      if (prefill) targetManuscript.academicCaptureProvenance = academicCaptureProvenance(prefill);
      targetManuscript.updatedAt = new Date().toISOString();
      syncLinkedSubmissionsFromManuscript(targetManuscript);
    } else {
      db.manuscripts.push({
        id: 'man_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        title,
        shortTitle: null,
        manuscriptType: 'article',
        status,
        abstract,
        keywords: [],
        authors,
        firstAuthor: authors[0] || null,
        correspondingAuthors: [],
        targetJournals: journal ? [journal] : [],
        doi: doi || null,
        articleUrl: articleUrl || null,
        zoteroItemKey: state.currentZoteroItemKey || null,
        zoteroLibraryID: state.currentZoteroLibraryID || null,
        zoteroUri: state.currentZoteroUri || null,
        pdfUri: state.currentPdfUri || null,
        citekey: state.currentCiteKey || null,
        bibtex: state.currentBibtex || null,
        citationApa: state.currentCitationApa || null,
        academicCaptureProvenance: academicCaptureProvenance(prefill),
        currentVersion: '1.0',
        plannedFigures: [],
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await w.storage.saveAll(db);
    if (state.currentZoteroItemKey && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) {
      ZoteroBridge.syncStatusTag(state.currentZoteroItemKey, status, state.currentZoteroLibraryID);
      if (ZoteroBridge.getPref('autoAddToPipelineCollection', true)) {
        ZoteroBridge.addToPipelineCollection(state.currentZoteroItemKey, state.currentZoteroLibraryID);
      }
      if (ZoteroBridge.getPref('autoSyncChildNotes', true)) {
        ZoteroBridge.syncNote(state.currentZoteroItemKey, state.currentZoteroLibraryID);
      }
    }
    closeModal();
    renderKanban();
    renderDashboard();
    renderSubmissions();
    showGlobalToast(duplicate ? t('academicDuplicateUpdated') : (prefill ? t('academicCaptureSaved') : 'Manuscripts updated!'), 'success');
  });
}
