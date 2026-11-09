/**
 * Zotero PaperFlow - Workspace Initialization, Host Action Dispatcher & Cloud Sync Trigger
 */
import {
  activateWorkspaceView,
  openSubmissionForEditing,
  showGlobalToast
} from './navigation-and-modal.js';

declare var db: any;
declare var currentLanguage: string;
declare var ZoteroBridge: any;
declare function t(key: string): string;
declare function resolvePreferredLanguage(): string;
declare function applyThemePreference(value: any): string;
declare function applyLanguage(): void;
declare function normalizeSubmissionStatuses(database: any): boolean;
declare function clearUnacceptedPublicationLinks(database: any): boolean;
declare function syncManuscriptStatusesFromSubmissions(database: any): boolean;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function renderSubmissions(): void;
declare function renderSettings(): Promise<void>;
declare function setupSubmissionSearch(): void;
declare function setupJournalPortalListeners(): void;
declare function openManuscriptModal(man: any, prefill?: any): void;

export function bindZoteroActionListeners(): void {
  window.addEventListener('researchflow:action', (e: any) => {
    const detail = e.detail;
    if (!detail) return;

    if (detail.view) {
      const navBtn = document.querySelector(`.nav-item[data-view="${detail.view}"]`) as HTMLElement | null;
      if (navBtn) navBtn.click();
    }

    if (detail.action === 'create_manuscript_from_item' && detail.item) {
      const navBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]') as HTMLElement | null;
      if (navBtn) navBtn.click();
      setTimeout(() => {
        if (typeof openManuscriptModal === 'function') {
          openManuscriptModal(null, {
            title: detail.item.title,
            publication: detail.item.publication,
            authors: detail.item.authors,
            doi: detail.item.doi,
            articleUrl: detail.item.url,
            abstract: detail.item.abstract,
            zoteroItemKey: detail.item.key,
            zoteroLibraryID: detail.item.libraryID ?? null,
            zoteroUri: detail.item.zoteroUri,
            pdfUri: detail.item.pdfUri,
            citekey: detail.item.citekey,
            bibtex: detail.item.bibtex,
            citationApa: detail.item.citationApa,
            relatedItems: detail.item.relatedItems,
            status: 'planning'
          });
        }
      }, 150);
    } else if (detail.action === 'create_submission_from_item' && detail.item) {
      const navBtn = document.querySelector('.nav-item[data-view="view-submissions"]') as HTMLElement | null;
      if (navBtn) navBtn.click();
      setTimeout(() => {
        const existingMan = (db?.manuscripts || []).find((m: any) =>
          (m.zoteroItemKey && m.zoteroItemKey === detail.item.key) ||
          (detail.item.doi && m.doi && m.doi.toLowerCase() === detail.item.doi.toLowerCase())
        );
        const existingSub = existingMan
          ? (db?.submissions || []).find((s: any) => s.manuscriptId === existingMan.id)
          : null;
        if (existingSub && typeof openSubmissionForEditing === 'function') {
          openSubmissionForEditing(existingSub.id, { switchView: true, focusEditCenter: true });
          showGlobalToast(currentLanguage === 'zh'
            ? `已打开《${(detail.item.title || '').slice(0, 18)}…》的投稿与修回记录`
            : `Opened submission record for "${(detail.item.title || '').slice(0, 22)}..."`, 'info');
        } else {
          document.getElementById('btn-add-submission')?.click();
        }
      }, 160);
    } else if (detail.action === 'link_item_to_manuscript' && detail.item) {
      const navBtn = document.querySelector('.nav-item[data-view="view-manuscripts"]') as HTMLElement | null;
      if (navBtn) navBtn.click();
      showGlobalToast(`请点击要与《${(detail.item.title || '').slice(0, 20)}…》关联的稿件卡片，或在编辑窗口中保存绑定`, 'info');
      (window as any)._pendingZoteroLinkItem = detail.item;
      if (typeof renderKanban === 'function') renderKanban();
    }
  });

  window.addEventListener('researchflow:data-updated', (e: any) => {
    if (e.detail) {
      db = e.detail;
      const activeView = document.querySelector('.content-view.active')?.id || 'view-dashboard';
      const dirtyViews = window.RFUI?.getDirtyViewsSet?.();
      ['view-dashboard', 'view-manuscripts', 'view-submissions'].forEach((vid) => {
        if (vid !== activeView) dirtyViews?.add(vid);
      });
      if (activeView === 'view-dashboard' && typeof renderDashboard === 'function') renderDashboard();
      else if (activeView === 'view-manuscripts' && typeof renderKanban === 'function') renderKanban();
      else if (activeView === 'view-submissions' && typeof renderSubmissions === 'function') renderSubmissions();
    }
  });

  window.addEventListener('researchflow:prefs-updated', (e: any) => {
    if (!e.detail) return;
    if (e.detail.language && (e.detail.language === 'zh' || e.detail.language === 'en')) {
      currentLanguage = e.detail.language;
      if (db?.settings?.profile) db.settings.profile.language = currentLanguage;
      if (typeof applyLanguage === 'function') applyLanguage();
    }
    if (e.detail.theme) {
      if (db?.settings?.profile) db.settings.profile.theme = e.detail.theme;
      if (typeof applyThemePreference === 'function') applyThemePreference(e.detail.theme);
    }
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderKanban === 'function') renderKanban();
    if (typeof renderSubmissions === 'function') renderSubmissions();
  });
}

export async function initializeWorkspace(): Promise<void> {
  if (!window.storage) {
    console.error('Storage engine not loaded!');
    return;
  }

  db = await window.storage.loadAll();
  const normalizedStatuses = normalizeSubmissionStatuses(db);
  const cleanedPublicationLinks = clearUnacceptedPublicationLinks(db);
  const syncedManuscripts = syncManuscriptStatusesFromSubmissions(db);
  if (normalizedStatuses || cleanedPublicationLinks || syncedManuscripts) {
    await window.storage.saveAll(db);
  }
  currentLanguage = resolvePreferredLanguage();
  applyThemePreference(db?.settings?.profile?.theme);
  if (window.matchMedia) {
    const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if ((db?.settings?.profile?.theme || 'system') === 'system') {
        applyThemePreference('system');
        renderDashboard();
      }
    };
    if (typeof darkScheme.addEventListener === 'function') {
      darkScheme.addEventListener('change', handleSystemThemeChange);
    }
  }

  const defaultTab = typeof ZoteroBridge !== 'undefined'
    ? ZoteroBridge.getPref('defaultWorkspaceTab', 'view-dashboard')
    : 'view-dashboard';
  if (defaultTab && defaultTab !== 'view-dashboard') {
    activateWorkspaceView(defaultTab);
  }

  applyLanguage();

  if (typeof (window as any).initializePipelineViewMode === 'function') {
    (window as any).initializePipelineViewMode();
  }
  if (typeof (window as any).initializeKanbanEmptyColumnsMode === 'function') {
    (window as any).initializeKanbanEmptyColumnsMode();
  }
  if (typeof (window as any).bindDashboardControls === 'function') {
    (window as any).bindDashboardControls();
  }

  renderDashboard();
  renderKanban();
  renderSubmissions();
  await renderSettings();
  setupSubmissionSearch();
  setupJournalPortalListeners();

  document.getElementById('btn-force-sync')?.addEventListener('click', async () => {
    const provider = (document.getElementById('route-db') as HTMLSelectElement | null)?.value
      || db?.settings?.syncProviders?.metadata?.provider
      || 'local';
    if (provider === 'local') {
      showGlobalToast(t('localSyncSummary'), 'info');
      return;
    }

    const btn = document.getElementById('btn-force-sync') as HTMLButtonElement | null;
    if (!btn) return;
    const origNodes = Array.from(btn.childNodes).map((node) => node.cloneNode(true));
    btn.textContent = '⏳ Syncing...';
    btn.disabled = true;

    const result = await window.storage.syncNow();
    if (result?.success) {
      db = await window.storage.loadAll();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      await renderSettings();
      btn.textContent = '✅ Synced!';
      showGlobalToast('Cloud database synchronized successfully.', 'success');
    } else {
      btn.textContent = '❌ Sync Failed';
      showGlobalToast(result?.message || 'Cloud sync failed. Check your provider settings.', 'error');
    }
    setTimeout(() => {
      btn.replaceChildren(...origNodes);
      btn.disabled = false;
    }, 2000);
  });
}
