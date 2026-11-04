/**
 * ResearchFlow OS - Options Dashboard Controller
 * Manages full routing, CRUD forms, kanbans, timeline charts, and sync settings.
 */

let db = null;

function applyDatabaseUpdate(newData) {
  if (!newData) return;
  if (window.storage?.hasPendingEdits?.(db) || window.storage?.isSaving?.(db)) return;
  // Zotero echoes a successful save to the originating page. A delayed echo
  // must not replace newer edits or rebuild the editor between keystrokes.
  if (db && Number(newData.revision || 0) <= Number(db.revision || 0)
    && Number(newData.lastUpdated || 0) <= Number(db.lastUpdated || 0)) return;
  db = newData;
  if (typeof window !== 'undefined') {
    window.db = newData;
  }
  syncManuscriptStatusesFromSubmissions(db);
  if (typeof window.storage !== 'undefined') {
    window.storage.cache = newData;
  }
  const activeView = document.querySelector('.content-view.active')?.id;
  if (activeView === 'view-dashboard') renderDashboard();
  else if (activeView === 'view-manuscripts') renderKanban();
  else if (activeView === 'view-submissions') {
    const editorState = document.querySelector('[data-submission-autosave-status]')?.dataset.state;
    renderSubmissions({ refreshDetails: pendingSubmissionSaves === 0 && !['pending', 'saving', 'invalid', 'error'].includes(editorState) });
  }
}
let selectedProjectId = null;
let selectedSubmissionId = null;
let currentDashboardFilter = 'all'; // 'all', 'accepted', 'active'
let currentLanguage = 'en';
let isPipelineExpanded = false;
let showEmptyKanbanColumns = true;
let submissionAutoSaveCleanup = null;
let pendingSubmissionSaves = 0;
let acceptanceCelebrationCleanup = null;
let previousModalFocus = null;
let activeSharePreviewUrl = null;
let activeSharePreviewCleanup = null;
let sharePreferenceWrites = Promise.resolve();
let currentModalCleanup = null;

function registerModalCleanup(fn) {
  if (typeof fn !== 'function') return;
  const previous = currentModalCleanup;
  currentModalCleanup = () => {
    try { previous?.(); } catch (_) {}
    try { fn(); } catch (_) {}
  };
}
if (typeof window !== 'undefined') {
  window.registerModalCleanup = registerModalCleanup;
}

const RF_OPTIONS_RENDER_VERSION = '14.0.1';
const PRE_IMPORT_BACKUP_KEY = 'researchflow_pre_import_backup';
const SHARE_PREFS_STORAGE_KEY = 'researchflow_share_visibility';
const MAX_IMPORT_BYTES = 25 * 1024 * 1024;
const UI_THEME_OPTIONS = new Set(['system', 'light', 'dark']);

// --- DYNAMIC DIALOG MODAL CONTROLLER ---
const modal = document.getElementById('modal-container');
const modalContent = document.getElementById('modal-card-content');

function openModal(htmlContent) {
  if (typeof currentModalCleanup === 'function') {
    try { currentModalCleanup(); } catch (_) {}
    currentModalCleanup = null;
  }
  activeSharePreviewCleanup?.();
  if (!modal.classList.contains('active')) {
    const activeElement = document.activeElement;
    previousModalFocus = activeElement instanceof HTMLElement && !modal.contains(activeElement)
      ? activeElement
      : null;
  }
  window.RFUI.setHTML(modalContent, htmlContent);
  modalContent.classList.toggle('stage-modal-wide', htmlContent.includes('stage-editor'));
  modalContent.classList.toggle('share-preview-card', htmlContent.includes('share-preview-shell'));
  const isCaptureReview = htmlContent.includes('submission-capture-review')
    || htmlContent.includes('academic-capture-review')
    || htmlContent.includes('academic-capture-chooser');
  modalContent.setAttribute('aria-modal', String(!isCaptureReview));
  const heading = modalContent.querySelector('h2');
  if (heading) {
    if (!heading.id) heading.id = `modal-title-${Date.now()}`;
    modalContent.setAttribute('aria-labelledby', heading.id);
  } else {
    modalContent.removeAttribute('aria-labelledby');
  }
  modal.inert = false;
  modal.removeAttribute('inert');
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('active');

  // Auto-bind close trigger inside modal
  const closeBtn = document.getElementById('btn-close-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  window.requestAnimationFrame(() => {
    const initialFocus = modalContent.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])');
    (initialFocus || modalContent).focus();
  });
}

function closeModal() {
  if (typeof currentModalCleanup === 'function') {
    try { currentModalCleanup(); } catch (_) {}
    currentModalCleanup = null;
  }
  activeSharePreviewCleanup?.();
  const restoreTarget = previousModalFocus?.isConnected && !modal.contains(previousModalFocus)
    ? previousModalFocus
    : null;
  if (restoreTarget) {
    restoreTarget.focus({ preventScroll: true });
  }
  const focusedElement = document.activeElement;
  if (focusedElement instanceof HTMLElement && modal.contains(focusedElement)) {
    focusedElement.blur();
  }

  modal.inert = true;
  modal.setAttribute('inert', '');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  modalContent.classList.remove('submission-capture-card');
  modalContent.classList.remove('academic-capture-card');
  modalContent.classList.remove('share-preview-card');
  if (activeSharePreviewUrl) {
    URL.revokeObjectURL(activeSharePreviewUrl);
    activeSharePreviewUrl = null;
  }
  document.body.classList.remove('submission-capture-mode');
  document.body.classList.remove('academic-capture-mode');
  const url = new URL(window.location.href);
  if (url.searchParams.has('mode')) {
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', url);
  }
  previousModalFocus = null;
}

function setupGlobalModalListeners() {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });
}

function showAcceptanceCelebration(submission) {
  acceptanceCelebrationCleanup?.();
  if (typeof ZoteroBridge !== 'undefined') {
    const enabled = ZoteroBridge.getPref('enableAcceptanceCelebration', true);
    if (!enabled) return;
  }

  const manuscript = db.manuscripts.find(item => item.id === submission.manuscriptId);
  const title = String(manuscript?.title || submission.title || t('untitledManuscript')).trim();
  const layer = document.createElement('div');
  layer.className = 'acceptance-celebration';
  layer.dataset.acceptanceCelebration = 'active';
  layer.setAttribute('role', 'status');
  layer.setAttribute('aria-live', 'assertive');
  layer.setAttribute('aria-atomic', 'true');

  const particles = document.createElement('div');
  particles.className = 'acceptance-confetti-field';
  particles.setAttribute('aria-hidden', 'true');

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  if (!reducedMotion) {
    const colors = ['#059669', '#10b981', '#06b6d4', '#f59e0b', '#fbbf24', '#f97316'];
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 54; index += 1) {
      const particle = document.createElement('i');
      particle.className = 'acceptance-confetti-piece';
      particle.dataset.shape = index % 4 === 0 ? 'round' : 'strip';
      particle.style.setProperty('--confetti-x', `${Math.random() * 100}vw`);
      particle.style.setProperty('--confetti-drift', `${(Math.random() - 0.5) * 34}vw`);
      particle.style.setProperty('--confetti-rotate', `${540 + Math.random() * 900}deg`);
      particle.style.setProperty('--confetti-delay', `${Math.random() * 0.55}s`);
      particle.style.setProperty('--confetti-duration', `${2.25 + Math.random() * 1.15}s`);
      particle.style.setProperty('--confetti-color', colors[index % colors.length]);
      fragment.appendChild(particle);
    }
    particles.appendChild(fragment);
  }

  const banner = document.createElement('div');
  banner.className = 'acceptance-celebration-banner';

  const seal = document.createElement('span');
  seal.className = 'acceptance-celebration-seal';
  seal.setAttribute('aria-hidden', 'true');
  window.RFUI.setHTML(seal, `
    <svg viewBox="0 0 24 24">
      <path d="M7 12.4 10.2 16 17.4 8.2"></path>
      <circle cx="12" cy="12" r="9"></circle>
    </svg>
  `);

  const copy = document.createElement('span');
  copy.className = 'acceptance-celebration-copy';
  const eyebrow = document.createElement('small');
  eyebrow.textContent = t('acceptanceCelebrationEyebrow');
  const heading = document.createElement('strong');
  heading.textContent = t('acceptanceCelebrationTitle');
  const body = document.createElement('span');
  body.textContent = tf('acceptanceCelebrationBody', { title });
  copy.append(eyebrow, heading, body);
  banner.append(seal, copy);
  layer.append(particles, banner);
  document.body.appendChild(layer);

  let removeTimer = null;
  const leaveTimer = window.setTimeout(() => {
    layer.classList.add('is-leaving');
    removeTimer = window.setTimeout(() => cleanup(), 520);
  }, reducedMotion ? 2400 : 3300);

  const cleanup = () => {
    clearTimeout(leaveTimer);
    if (removeTimer) clearTimeout(removeTimer);
    layer.remove();
    if (acceptanceCelebrationCleanup === cleanup) acceptanceCelebrationCleanup = null;
  };
  acceptanceCelebrationCleanup = cleanup;
}

// --- GLOBALLY ACCESSIBLE TOAST BANNER ---
function showGlobalToast(message, type = 'success') {
  let toast = document.querySelector('[data-global-toast]');
  if (!toast) {
    toast = document.createElement('div');
    toast.dataset.globalToast = 'true';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = '999999';
    toast.style.padding = '10px 20px';
    toast.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.4)';
    toast.style.fontSize = '13px';
    document.body.appendChild(toast);
  }

  clearTimeout(toast._hideTimer);
  clearTimeout(toast._removeTimer);
  toast.className = `badge badge-${type === 'success' ? 'success' : 'danger'}`;
  toast.style.opacity = '1';
  toast.style.transition = 'none';
  toast.style.animation = 'slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
  toast.textContent = message;

  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s ease';
    toast._removeTimer = setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// Warn only while an edit is dirty or a commit is outstanding.
window.addEventListener('beforeunload', event => {
  const state = document.querySelector('[data-submission-autosave-status]')?.dataset.state;
  if (pendingSubmissionSaves || ['pending', 'saving', 'error', 'invalid'].includes(state)) {
    event.preventDefault();
    event.returnValue = '';
  }
});


window.showLinkManuscriptModal = function(item) {
  if (!item) return;
  const manuscripts = db.manuscripts || [];
  if (manuscripts.length === 0) {
    showGlobalToast(currentLanguage === 'zh' ? '当前管线中暂无稿件，正在为您直接新建稿件...' : 'No manuscripts found in pipeline. Creating new manuscript...', 'info');
    openManuscriptModal(null, {
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
      tags: item.tags || []
    });
    return;
  }

  const listHtml = manuscripts.map(m => `
    <div class="zotero-link-manuscript-item" data-id="${m.id}" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:8px; background:hsl(var(--card-bg));">
      <div style="flex:1; margin-right:12px; min-width:0;">
        <div style="font-weight:600; font-size:13px; color:hsl(var(--text-primary)); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(m.title)}</div>
        <div style="font-size:11px; color:hsl(var(--text-secondary)); margin-top:2px; display:flex; gap:8px;">
          <span>${currentLanguage === 'zh' ? '状态' : 'Status'}: <strong>${escapeHTML(getManuscriptStatusLabel(m.status))}</strong></span>
          ${m.targetJournals?.[0] ? `<span>${currentLanguage === 'zh' ? '期刊' : 'Journal'}: ${escapeHTML(m.targetJournals[0])}</span>` : ''}
          ${m.zoteroItemKey ? `<span style="color:#059669;">(${currentLanguage === 'zh' ? '已关联文献' : 'Linked'})</span>` : `<span style="color:#64748b;">(${currentLanguage === 'zh' ? '未关联文献' : 'Unlinked'})</span>`}
        </div>
      </div>
      <button type="button" class="btn-primary btn-bind-manuscript" data-id="${m.id}" style="padding:4px 10px; font-size:11px; white-space:nowrap; cursor:pointer;">
        🔗 ${currentLanguage === 'zh' ? '绑定此稿件' : 'Bind Manuscript'}
      </button>
    </div>
  `).join('');

  openModal(`
    <div class="modal-header">
      <h2>🔗 ${currentLanguage === 'zh' ? '关联 Zotero 文献至稿件管线' : 'Link Zotero Item to Pipeline'}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    <div style="background:var(--material-background, rgba(0,0,0,0.02)); border:1px solid var(--border-color); border-radius:6px; padding:10px; margin-bottom:14px; font-size:12px;">
      <div style="font-weight:600; color:var(--text-accent, #e11d48);">${currentLanguage === 'zh' ? '选中 Zotero 文献：' : 'Selected Zotero Item:'}</div>
      <div style="margin-top:2px; color:hsl(var(--text-primary)); font-size:13px; font-weight:500;">${escapeHTML(item.title || (currentLanguage === 'zh' ? '未命名文献' : 'Untitled Literature'))}</div>
      <div style="font-size:11px; color:hsl(var(--text-secondary)); margin-top:2px;">
        ${escapeHTML(item.authors || '')} (${escapeHTML(item.year || '')}) ${item.citekey ? `<code>[@${escapeHTML(item.citekey)}]</code>` : ''}
      </div>
    </div>
    <div style="font-size:12px; font-weight:600; margin-bottom:8px; color:hsl(var(--text-primary));">${currentLanguage === 'zh' ? '请选择要绑定的 Zotero PaperFlow 稿件：' : 'Select a Zotero PaperFlow manuscript to link:'}</div>
    <div style="max-height:300px; overflow-y:auto; padding-right:4px;">
      ${listHtml}
    </div>
  `);

  document.querySelectorAll('.btn-bind-manuscript').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const manId = e.target.dataset.id;
      const targetMan = manuscripts.find(m => m.id === manId);
      if (!targetMan) return;
      targetMan.zoteroItemKey = item.key;
      targetMan.zoteroUri = item.zoteroUri;
      targetMan.pdfUri = item.pdfUri;
      targetMan.citekey = item.citekey || targetMan.citekey || null;
      targetMan.bibtex = item.bibtex || targetMan.bibtex || null;
      targetMan.citationApa = item.citationApa || targetMan.citationApa || null;
      targetMan.updatedAt = new Date().toISOString();

      await window.storage.saveAll(db);
      if (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) {
        ZoteroBridge.syncStatusTag(item.key, targetMan.status);
        ZoteroBridge.addToPipelineCollection(item.key);
        ZoteroBridge.syncNote(item.key);
      }
      closeModal();
      renderKanban();
      renderDashboard();
      renderSubmissions();
      showGlobalToast(currentLanguage === 'zh'
        ? `成功将《${(item.title || '').slice(0, 16)}…》关联至稿件《${(targetMan.title || '').slice(0, 16)}…》！`
        : `Successfully linked "${(item.title || '').slice(0, 16)}..." to manuscript "${(targetMan.title || '').slice(0, 16)}..."!`, 'success');
    });
  });
};

function setupZoteroIntegrations() {
  const isZotero = Boolean(
    (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) ||
    (typeof window !== 'undefined' && (window.Zotero || window.parent?.Zotero || window.arguments?.[0]?.Zotero))
  );

  if (!isZotero) return;

  document.documentElement.classList.add('zotero-env');
  document.body?.classList?.add('zotero-env');

  // 1. Kanban Quick Import Button
  const quickImportBtn = document.getElementById('btn-zotero-quick-import');
  if (quickImportBtn) {
    quickImportBtn.style.display = 'inline-flex';
    window.RFUI.setHTML(quickImportBtn, `<span>📥 ${currentLanguage === 'zh' ? '从 Zotero 选中导入' : 'Import from Zotero Selection'}</span>`);
    if (!quickImportBtn.dataset.bound) {
      quickImportBtn.dataset.bound = 'true';
      quickImportBtn.addEventListener('click', async () => {
        if (typeof ZoteroBridge === 'undefined') return;
        const activeItem = await ZoteroBridge.getActiveItem();
        if (activeItem) {
          openManuscriptModal(null, {
            title: activeItem.title || '',
            publication: activeItem.publication || '',
            abstract: activeItem.abstract || '',
            authors: activeItem.authors || '',
            doi: activeItem.doi || '',
            articleUrl: activeItem.url || '',
            zoteroItemKey: activeItem.key || '',
            zoteroUri: activeItem.zoteroUri || '',
            pdfUri: activeItem.pdfUri || '',
            citekey: activeItem.citekey || '',
            bibtex: activeItem.bibtex || '',
            citationApa: activeItem.citationApa || '',
            relatedItems: activeItem.relatedItems || [],
            collections: activeItem.collections || [],
            tags: activeItem.tags || []
          });
          showGlobalToast(`已从 Zotero 文献《${(activeItem.title || '').slice(0, 18)}…》导入元数据`, 'success');
        } else {
          showGlobalToast('未在 Zotero 中检测到选中条目，请在文献库中单击选中目标论文。', 'warning');
        }
      });
    }
  }

  // Zotero-specific settings controls are shown in the preference pane.
  const zSettingsCard = document.getElementById('zotero-native-settings-card');
  if (zSettingsCard) {
    zSettingsCard.style.display = 'block';
    if (currentLanguage === 'en') {
      const h3 = zSettingsCard.querySelector('h3');
      if (h3) h3.textContent = 'Zotero 10 Native Integration';
      const p = zSettingsCard.querySelector('.text-muted');
      if (p) p.textContent = 'Manage Zotero database storage and bi-directional child note synchronization';
      const desc = zSettingsCard.querySelector('div[style*="font-size:12px"]');
      if (desc) window.RFUI.setHTML(desc, 'Zotero PaperFlow is running directly inside Zotero 10. Data is persisted to <code>researchflow-data.json</code> in your Zotero data directory.');
      const syncBtnText = zSettingsCard.querySelector('#btn-zotero-sync-all-notes span');
      if (syncBtnText) syncBtnText.textContent = '📝 Batch sync all manuscript pipelines to Zotero child notes';
      const prefsBtnText = zSettingsCard.querySelector('#btn-zotero-open-prefs span');
      if (prefsBtnText) prefsBtnText.textContent = '⚙️ Open Zotero Preferences Pane';
    }
  }
  const syncAllNotesBtn = document.getElementById('btn-zotero-sync-all-notes');
  if (syncAllNotesBtn && !syncAllNotesBtn.dataset.bound) {
    syncAllNotesBtn.dataset.bound = 'true';
    syncAllNotesBtn.addEventListener('click', async () => {
      showGlobalToast(currentLanguage === 'zh' ? '正在同步所有关联文献的云端子笔记...' : 'Syncing child notes to Zotero...', 'info');
      let count = 0;
      for (const m of db.manuscripts || []) {
        if (m.zoteroItemKey && typeof ZoteroBridge !== 'undefined') {
          const ok = await ZoteroBridge.syncNote(m.zoteroItemKey);
          if (ok) count++;
        }
      }
      showGlobalToast(currentLanguage === 'zh'
        ? `同步成功！已将 ${count} 篇文献的管线与审稿矩阵同步至 Zotero 云端子笔记。`
        : `Synced ${count} manuscript pipelines to Zotero child notes!`, 'success');
    });
  }
  const openPrefsBtn = document.getElementById('btn-zotero-open-prefs');
  if (openPrefsBtn && !openPrefsBtn.dataset.bound) {
    openPrefsBtn.dataset.bound = 'true';
    openPrefsBtn.addEventListener('click', () => {
      if (typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.sendToHost({ type: 'RESEARCHFLOW_OPEN_PREFS' });
      }
    });
  }

  // 4. Kanban Collection Filter Dropdown
  const collectionSelect = document.getElementById('sel-zotero-collection-filter');
  const collectionFilterContainer = document.getElementById('zotero-collection-filter-container');
  window.refreshZoteroCollectionFilter = async () => {
    if (!collectionSelect || typeof ZoteroBridge === 'undefined') return;
    const collections = await ZoteroBridge.getCollections();
    if (collections && collections.length > 0) {
      if (collectionFilterContainer) collectionFilterContainer.style.display = 'inline-flex';
      const prevVal = collectionSelect.value;
      window.RFUI.setHTML(collectionSelect, `<option value="">📁 ${escapeHTML(currentLanguage === 'zh' ? '全部文献分类' : 'All Collections')}</option>`);
      collections.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col.key;
        const count = col.itemKeys?.length || 0;
        opt.textContent = `${col.name} (${count})`;
        collectionSelect.appendChild(opt);
      });
      collectionSelect.value = prevVal;
    }
  };
  if (collectionSelect && !collectionSelect.dataset.bound) {
    collectionSelect.dataset.bound = 'true';
    collectionSelect.addEventListener('change', async (e) => {
      const key = e.target.value;
      window._activeZoteroCollectionFilter = key;
      if (!key) {
        window._activeZoteroCollectionItemKeys = null;
      } else {
        const cols = await ZoteroBridge.getCollections();
        const targetCol = (cols || []).find(c => c.key === key);
        window._activeZoteroCollectionItemKeys = targetCol ? new Set(targetCol.itemKeys || []) : null;
      }
      renderKanban();
    });
  }
  window.refreshZoteroCollectionFilter().catch(console.error);
}

if (typeof window !== 'undefined') {
  if (typeof openManuscriptModal !== 'undefined') window.openManuscriptModal = openManuscriptModal;
  if (typeof deleteManuscript !== 'undefined') window.deleteManuscript = deleteManuscript;
  if (typeof renderKanban !== 'undefined') window.renderKanban = renderKanban;
  if (typeof renderDashboard !== 'undefined') window.renderDashboard = renderDashboard;
  if (typeof renderSubmissions !== 'undefined') window.renderSubmissions = renderSubmissions;
  window.applyDatabaseUpdate = applyDatabaseUpdate;
}
