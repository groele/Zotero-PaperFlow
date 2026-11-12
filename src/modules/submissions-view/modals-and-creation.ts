import { renderSubmissions } from './list-and-portals';
import { renderSubmissionDetails } from './details-renderer';
import { setSelectedSubmissionId } from './submission-state';

declare var db: any;
declare const currentLanguage: string;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function t(key: string): string;
declare function getSubmissionJournalName(sub: any): string;
declare function todayString(): string;
declare function openModal(html: string): void;
declare function closeModal(): void;
declare function markSubmissionRejected(sub: any, rejectionDate: string, reasonNote?: string): void;
declare function createTransferredSubmission(sourceSub: any, targetJournal: string, submissionDate: string, journalUrl?: string): any;
declare function syncManuscriptStatusFromSubmission(sub: any, database?: any): any;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;
declare function firstAuthorFromList(authors: any): string;
declare function dateInputToIso(val: any): string;
declare function normalizeSubmissionTimeline(sub: any): any[];

export function openTransferSubmissionModal(sourceSub: any): void {
  const w = window as any;
  const sourceJournal = getSubmissionJournalName(sourceSub);
  const today = todayString();
  openModal(`
    <div class="modal-header">
      <h2>${t('transferSubmissionTitle')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    <div class="glass-card" style="margin-bottom:12px;">
      <p style="font-size:12px; margin:0;">${escapeHTML(t('currentJournalLabel'))}: <strong>${escapeHTML(sourceJournal)}</strong></p>
      <p class="text-muted" style="font-size:11px; margin-top:4px;">${escapeHTML(t('transferModalHelp'))}</p>
    </div>
    <div class="grid-cols-2" style="gap:10px;">
      <div class="form-group">
        <label>${t('rejectionDate')}</label>
        <input type="date" id="transfer-rejection-date" value="${today}">
      </div>
      <div class="form-group">
        <label>${t('milestoneSubmission')}</label>
        <input type="date" id="transfer-submission-date" value="${today}">
      </div>
    </div>
    <div class="form-group">
      <label>${t('newTargetJournal')}</label>
      <input type="text" id="transfer-target-journal" placeholder="${escapeHTML(t('targetJournalPlaceholder'))}">
    </div>
    <div class="form-group">
      <label>${escapeHTML(t('submissionPortalUrl'))}</label>
      <input type="url" id="transfer-journal-url" placeholder="https://...">
    </div>
    <div class="form-group">
      <label>${t('rejectionNote')}</label>
      <textarea id="transfer-rejection-note" rows="3" placeholder="${escapeHTML(t('rejectionNotePlaceholder'))}"></textarea>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-cancel-transfer">${escapeHTML(t('cancel') || '取消')}</button>
      <button type="button" class="btn-primary" id="btn-create-transfer-sub" style="min-width:130px;">${t('transferButton')}</button>
    </div>
  `);

  document.getElementById('btn-cancel-transfer')?.addEventListener('click', closeModal);
  document.getElementById('btn-create-transfer-sub')?.addEventListener('click', async () => {
    const targetJournal = ((document.getElementById('transfer-target-journal') as HTMLInputElement | null)?.value || '').trim();
    const rejectionDate = (document.getElementById('transfer-rejection-date') as HTMLInputElement | null)?.value || today;
    const submissionDate = (document.getElementById('transfer-submission-date') as HTMLInputElement | null)?.value || today;
    const journalUrl = ((document.getElementById('transfer-journal-url') as HTMLInputElement | null)?.value || '').trim();
    const rejectionNote = ((document.getElementById('transfer-rejection-note') as HTMLTextAreaElement | null)?.value || '').trim();

    if (!targetJournal) {
      alert(t('manuscriptJournalRequired'));
      return;
    }

    if (journalUrl) {
      try { new URL(journalUrl); }
      catch (_) {
        alert(t('validPortalUrlOrBlank'));
        return;
      }
    }

    markSubmissionRejected(sourceSub, rejectionDate, rejectionNote);
    const newSub = createTransferredSubmission(sourceSub, targetJournal, submissionDate, journalUrl);
    db.submissions.push(newSub);
    syncManuscriptStatusFromSubmission(newSub);
    setSelectedSubmissionId(newSub.id);

    await w.storage.saveAll(db);
    closeModal();
    renderDashboard();
    renderKanban();
    renderSubmissions();
    renderSubmissionDetails(newSub);
    showGlobalToast(t('transferToast'), 'success');
  });
}

export function bindTrackSubmissionButton(): void {
  document.getElementById('btn-add-submission')?.addEventListener('click', openTrackSubmissionModal);
}

export function openTrackSubmissionModal(): void {
  const w = window as any;
  let manOpts = (db.manuscripts || []).map((m: any) => `
    <option value="${escapeHTML(m.id)}">${escapeHTML(m.title || t('untitledManuscript'))}</option>
  `).join('');
  manOpts += `<option value="__new__">${escapeHTML(t('createNewManuscriptOption'))}</option>`;
  const defaultManuscriptMode = (!db.manuscripts || db.manuscripts.length === 0) ? '__new__' : (db.manuscripts[0]?.id || '__new__');
  manOpts = manOpts.replace(`value="${escapeHTML(defaultManuscriptMode)}"`, `value="${escapeHTML(defaultManuscriptMode)}" selected`);

  openModal(`
    <div class="modal-header">
      <h2>${t('trackSubmissionTitle')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    <div id="sub-zotero-active-item-banner" class="zotero-active-item-banner" style="display:none; align-items:center; justify-content:space-between; gap:10px; padding:10px 14px; background:rgba(204,0,0,0.06); border:1px solid rgba(204,0,0,0.22); border-radius:8px; margin-bottom:12px;">
      <span id="sub-zotero-active-item-text" style="font-size:12px; color:hsl(var(--text-primary)); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:75%;"></span>
      <button type="button" class="btn-secondary" id="btn-sub-zotero-quick-bind-active" style="padding:4px 10px; font-size:11px; white-space:nowrap; border-color:rgba(204,0,0,0.3); color:#cc0000; font-weight:600; cursor:pointer;">⚡ 一键载入</button>
    </div>
    <div class="form-group">
      <label for="sub-man-select">${t('manuscriptPaper')}</label>
      <select id="sub-man-select">${manOpts}</select>
    </div>
    <div class="quick-new-manuscript-panel" id="sub-new-manuscript-panel" ${defaultManuscriptMode === '__new__' ? '' : 'hidden'}>
      <div class="form-group" style="margin-bottom:0;">
        <label for="sub-new-man-title" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${escapeHTML(t('newManuscriptTitleLabel'))}</span>
          <span style="font-size:10px; font-weight:normal; text-transform:none; color:hsl(var(--text-muted));">${escapeHTML(currentLanguage === 'zh' ? '将同步创建稿件条目' : 'Will create manuscript entry')}</span>
        </label>
        <input type="text" id="sub-new-man-title" placeholder="${escapeHTML(currentLanguage === 'zh' ? '输入论文稿件标题 (如: Deep Learning for Genomic Effect...)' : t('paperTitlePlaceholder'))}">
      </div>
    </div>
    <div class="grid-cols-2">
      <div class="form-group">
        <label for="sub-first-author">${escapeHTML(t('firstAuthorLabel'))}</label>
        <input type="text" id="sub-first-author" value="" placeholder="${escapeHTML(currentLanguage === 'zh' ? '例如: Zhang San' : t('firstAuthorPlaceholder'))}">
      </div>
      <div class="form-group">
        <label for="sub-journal">${t('targetJournalInput')}</label>
        <input type="text" id="sub-journal" placeholder="${escapeHTML(currentLanguage === 'zh' ? '例如: Nature / IEEE TPAMI' : t('targetJournalPlaceholder'))}">
      </div>
    </div>
    <div class="grid-cols-2">
      <div class="form-group">
        <label for="sub-journal-url">${escapeHTML(t('submissionPortalUrl'))}</label>
        <input type="url" id="sub-journal-url" placeholder="https://...">
      </div>
      <div class="form-group">
        <label for="sub-date">${t('initialSubmissionDate')}</label>
        <input type="date" id="sub-date" value="${todayString()}">
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-cancel-sub">${escapeHTML(t('cancel') || '取消')}</button>
      <button type="button" class="btn-primary" id="btn-submit-sub" style="min-width:140px;">${t('trackSubmissionButton')}</button>
    </div>
  `);

  document.getElementById('btn-cancel-sub')?.addEventListener('click', closeModal);
  const manuscriptSelect = document.getElementById('sub-man-select') as HTMLSelectElement | null;
  const newManuscriptPanel = document.getElementById('sub-new-manuscript-panel') as HTMLElement | null;

  const autoFillFromManuscript = (mId: string) => {
    if (mId && mId !== '__new__') {
      const selectedMan = (db.manuscripts || []).find((m: any) => m.id === mId);
      if (selectedMan) {
        const authorInput = document.getElementById('sub-first-author') as HTMLInputElement | null;
        const journalInput = document.getElementById('sub-journal') as HTMLInputElement | null;
        const urlInput = document.getElementById('sub-journal-url') as HTMLInputElement | null;
        if (authorInput && !authorInput.value.trim() && selectedMan.authors) {
          authorInput.value = firstAuthorFromList(selectedMan.authors) || selectedMan.authors;
        }
        if (journalInput && !journalInput.value.trim() && (selectedMan.journal || selectedMan.publication)) {
          journalInput.value = selectedMan.journal || selectedMan.publication;
        }
        if (urlInput && !urlInput.value.trim() && (selectedMan.articleUrl || selectedMan.doi)) {
          urlInput.value = selectedMan.articleUrl || (selectedMan.doi ? `https://doi.org/${selectedMan.doi}` : '');
        }
      }
    }
  };

  manuscriptSelect?.addEventListener('change', () => {
    const isNew = manuscriptSelect.value === '__new__';
    if (newManuscriptPanel) newManuscriptPanel.hidden = !isNew;
    if (isNew) (document.getElementById('sub-new-man-title') as HTMLElement | null)?.focus();
    else autoFillFromManuscript(manuscriptSelect.value);
  });

  if (defaultManuscriptMode !== '__new__') {
    autoFillFromManuscript(defaultManuscriptMode);
  }

  setupActiveItemDetection(manuscriptSelect, newManuscriptPanel);
  setupSubmitSubmissionListener(manuscriptSelect);
}

function setupActiveItemDetection(manuscriptSelect: HTMLSelectElement | null, newManuscriptPanel: HTMLElement | null): void {
  const w = window as any;
  setTimeout(async () => {
    try {
      if (typeof ZoteroBridge !== 'undefined') {
        const activeItem = await ZoteroBridge.getActiveItem();
        const banner = document.getElementById('sub-zotero-active-item-banner');
        const textEl = document.getElementById('sub-zotero-active-item-text');
        const quickBindBtn = document.getElementById('btn-sub-zotero-quick-bind-active');
        if (activeItem && activeItem.title && banner && textEl) {
          w.RFUI.setHTML(textEl, `📌 <strong>${escapeHTML(currentLanguage === 'zh' ? '检测到 Zotero 选中文献：' : 'Active Zotero item: ')}</strong>《${escapeHTML(activeItem.title)}》`);
          banner.style.display = 'flex';
          quickBindBtn?.addEventListener('click', () => {
            const match = (db.manuscripts || []).find((m: any) =>
              (m.zoteroItemKey && m.zoteroItemKey === activeItem.key) ||
              (m.title && m.title.trim().toLowerCase() === activeItem.title.trim().toLowerCase())
            );
            if (match && manuscriptSelect) {
              manuscriptSelect.value = match.id;
              if (newManuscriptPanel) newManuscriptPanel.hidden = true;
            } else if (manuscriptSelect) {
              manuscriptSelect.value = '__new__';
              if (newManuscriptPanel) newManuscriptPanel.hidden = false;
              const titleInput = document.getElementById('sub-new-man-title') as HTMLInputElement | null;
              if (titleInput) titleInput.value = activeItem.title;
            }
            const authorInput = document.getElementById('sub-first-author') as HTMLInputElement | null;
            const journalInput = document.getElementById('sub-journal') as HTMLInputElement | null;
            const urlInput = document.getElementById('sub-journal-url') as HTMLInputElement | null;
            if (authorInput && activeItem.authors) {
              authorInput.value = firstAuthorFromList(activeItem.authors) || activeItem.authors;
            }
            if (journalInput && activeItem.publication) journalInput.value = activeItem.publication;
            if (urlInput) urlInput.value = activeItem.url || (activeItem.doi ? `https://doi.org/${activeItem.doi}` : '');
            banner.style.display = 'none';
            showGlobalToast(currentLanguage === 'zh' ? '已从 Zotero 选中文献载入投稿信息' : 'Loaded submission metadata from active Zotero item', 'success');
          });
        }
      }
    } catch (_) {}
  }, 60);
}

function setupSubmitSubmissionListener(manuscriptSelect: HTMLSelectElement | null): void {
  const w = window as any;
  document.getElementById('btn-submit-sub')?.addEventListener('click', async () => {
    const createMode = w.RFUI.buildSubmissionCreateMode({
      selectedManuscriptId: manuscriptSelect?.value || '__new__',
      newManuscriptTitle: (document.getElementById('sub-new-man-title') as HTMLInputElement | null)?.value || '',
      targetJournal: (document.getElementById('sub-journal') as HTMLInputElement | null)?.value || '',
    });
    const subDate = (document.getElementById('sub-date') as HTMLInputElement | null)?.value || '';
    const journalUrl = ((document.getElementById('sub-journal-url') as HTMLInputElement | null)?.value || '').trim();
    const firstAuthor = ((document.getElementById('sub-first-author') as HTMLInputElement | null)?.value || '').trim().slice(0, 160);

    if (!createMode.ok) { alert(createMode.error); return; }
    if (journalUrl) {
      try {
        const parsed = new URL(journalUrl);
        if (!/^https?:$/.test(parsed.protocol)) throw new Error('unsupported');
      } catch (_) { alert(t('validPortalUrlOrBlank')); return; }
    }

    let manuscriptId = createMode.manuscriptId;
    if (createMode.mode === 'new') {
      const newMan = {
        id: 'man_' + Math.random().toString(36).substring(2, 9),
        userId: 'user', projectId: null, title: createMode.title, shortTitle: null,
        manuscriptType: 'article', status: 'submitted', abstract: '', keywords: [],
        authors: firstAuthor ? [firstAuthor] : [], firstAuthor: firstAuthor || null,
        correspondingAuthors: [], targetJournals: [createMode.targetJournal],
        currentVersion: '1.0', plannedFigures: [], notes: 'Created inline while tracking a new submission',
        externalManuscriptId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      db.manuscripts.push(newMan);
      manuscriptId = newMan.id;
    }
    const linkedManuscript = db.manuscripts.find((m: any) => m.id === manuscriptId);
    if (linkedManuscript && firstAuthor) {
      linkedManuscript.firstAuthor = firstAuthor;
      linkedManuscript.updatedAt = new Date().toISOString();
    }

    const existingForMan = (db.submissions || []).filter((s: any) => s.manuscriptId === manuscriptId);
    const prevRoundSub = existingForMan.length
      ? (w.RFCore?.getCurrentSubmission?.(db, manuscriptId) || existingForMan[existingForMan.length - 1])
      : null;
    const nextRound = existingForMan.length
      ? existingForMan.reduce((max: number, s: any) => Math.max(max, Number(s?.round ?? s?.roundIndex) || 1), 0) + 1
      : 1;

    const newSub = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      userId: 'user', manuscriptId,
      projectId: db.manuscripts.find((m: any) => m.id === manuscriptId)?.projectId || null,
      targetJournal: createMode.targetJournal, journalUrl: journalUrl || null,
      doi: null, articleUrl: null, status: 'submitted', submissionDate: dateInputToIso(subDate),
      decisionDate: null, revisionDueDate: null, firstDecisionDate: null,
      round: nextRound,
      previousSubmissionId: prevRoundSub?.id || null,
      complianceChecklist: {}, reviewMatrix: [], timelineNodes: [], externalManuscriptId: null,
      firstAuthor: firstAuthor || null, captureProvenance: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };

    normalizeSubmissionTimeline(newSub);
    db.submissions.push(newSub);
    syncManuscriptStatusFromSubmission(newSub);
    setSelectedSubmissionId(newSub.id);
    await w.storage.saveAll(db);

    closeModal();
    renderDashboard();
    renderKanban();
    renderSubmissions();
    showGlobalToast(t('submissionAddedToast'), 'success');
  });
}
