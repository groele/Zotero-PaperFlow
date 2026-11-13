/**
 * Zotero PaperFlow - Multi-Cloud Settings View Entry Point
 */
import { createLifecycleScope } from './ui-utils/lifecycle.js';
import {
  getDeviceSyncSecretsFromInputs,
  renderSettings,
  updateSyncRouteNotice,
  saveSettingsFromInputs,
  bindSettingsRoutingListeners
} from './settings-view/sync-routing.js';

import {
  stripCredentialsForExport,
  buildPrivacySafeDiagnostics,
  MAX_IMPORT_DATABASE_BYTES,
  isValidImportedDatabaseObject,
  formatConflictValue,
  renderConflictValueCell,
  formatConflictTimestamp,
  refreshConflictDrafts,
  openConflictRecoveryModal
} from './settings-view/backup-and-conflict.js';

declare var db: any;
declare var currentLanguage: string;
declare var ZoteroBridge: any;
declare var RFPlatform: any;
declare function t(key: string): string;
declare function escapeHTML(value: any): string;
declare function openModal(html: string): void;
declare function closeModal(): void;
declare function showGlobalToast(message: string, type?: string): void;
declare function resolvePreferredLanguage(): string;
declare function normalizeThemePreference(value: any): string;
declare function applyThemePreference(value: any): string;
declare function applyLanguage(): void;
declare function refreshActiveViewForLanguage(): void;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function renderSubmissions(): void;
declare function renderAllViews(): Promise<void>;
declare function loadSettings(): Promise<void>;

const settingsViewScope = createLifecycleScope();
let settingsListenersScope = settingsViewScope.child();
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('unload', () => settingsViewScope.abort(), { once: true });
}

bindSettingsRoutingListeners();

export function setupSettingsListeners(): void {
  settingsListenersScope.abort();
  settingsListenersScope = settingsViewScope.child();

  const languageSelect = document.getElementById('ui-language') as HTMLSelectElement | null;
  if (languageSelect) {
    settingsListenersScope.on(languageSelect, 'change', async () => {
      currentLanguage = languageSelect.value;
      document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
      db.settings = db.settings || {};
      db.settings.profile = db.settings.profile || {};
      db.settings.profile.language = currentLanguage;
      if (typeof applyLanguage === 'function') applyLanguage();
      if (typeof refreshActiveViewForLanguage === 'function') refreshActiveViewForLanguage();
      languageSelect.disabled = true;
      try {
        if (window.storage?.saveAll) await window.storage.saveAll(db);
      } finally {
        languageSelect.disabled = false;
      }
      showGlobalToast(t('languageSaved'), 'success');
    });
  }

  const themeSelect = document.getElementById('ui-theme') as HTMLSelectElement | null;
  if (themeSelect) {
    settingsListenersScope.on(themeSelect, 'change', async () => {
      const previousTheme = typeof normalizeThemePreference === 'function' ? normalizeThemePreference(db.settings?.profile?.theme) : '';
      const nextTheme = typeof applyThemePreference === 'function' ? applyThemePreference(themeSelect.value) : themeSelect.value;
      db.settings = db.settings || {};
      db.settings.profile = db.settings.profile || {};
      db.settings.profile.theme = nextTheme;
      themeSelect.disabled = true;
      try {
        if (window.storage?.saveAll) await window.storage.saveAll(db);
      } finally {
        themeSelect.disabled = false;
      }
      if (previousTheme !== nextTheme) {
        showGlobalToast(t('themeSaved'), 'success');
      }
    });
  }
}

setupSettingsListeners();

settingsViewScope.on(document.getElementById('btn-export-db'), 'click', () => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(stripCredentialsForExport(db), null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute('href', dataStr);
  dlAnchorElem.setAttribute('download', `zotero_paperflow_backup_${new Date().toISOString().split('T')[0]}.json`);
  dlAnchorElem.click();
  showGlobalToast(t('databaseExported'), 'success');
});

settingsViewScope.on(document.getElementById('btn-export-diagnostics'), 'click', () => {
  const report = buildPrivacySafeDiagnostics(db);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute('href', dataStr);
  dlAnchorElem.setAttribute('download', `zotero_paperflow_diagnostics_${new Date().toISOString().split('T')[0]}.json`);
  dlAnchorElem.click();
  showGlobalToast(t('diagnosticsExported'), 'success');
});

document.getElementById('btn-trigger-import')?.addEventListener('click', async () => {
  const isZoteroEnv = Boolean(
    (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) ||
    (typeof window !== 'undefined' && ((window as any).Zotero || (window as any).parent?.Zotero))
  );
  if (isZoteroEnv && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.importDatabase) {
    try {
      const res = await ZoteroBridge.importDatabase('merge');
      if (res?.success && res.data) {
        db = res.data;
        if (typeof renderAllViews === 'function') await renderAllViews();
        if (typeof loadSettings === 'function') await loadSettings();
        showGlobalToast(t('databaseImported') || '数据库导入成功！', 'success');
        return;
      }
      if (res?.cancelled) {
        return;
      }
      showGlobalToast(res?.error || t('invalidBackup'), 'error');
    } catch (e: any) {
      console.error('[PaperFlow] Zotero native import failed:', e);
      showGlobalToast(e.message || t('invalidBackup'), 'error');
    }
    return;
  }
  document.getElementById('import-db-file')?.click();
});

document.getElementById('btn-restore-import-backup')?.addEventListener('click', async () => {
  if (!confirm(t('restoreImportConfirm'))) return;

  const isZoteroEnv = Boolean(
    (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) ||
    (typeof window !== 'undefined' && ((window as any).Zotero || (window as any).parent?.Zotero))
  );
  if (isZoteroEnv && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.restoreBackup) {
    try {
      const res = await ZoteroBridge.restoreBackup();
      if (res?.success && res.data) {
        db = res.data;
        if (typeof renderAllViews === 'function') await renderAllViews();
        if (typeof loadSettings === 'function') await loadSettings();
        showGlobalToast(t('importBackupRestored'), 'success');
        return;
      }
      if (res?.error) {
        showGlobalToast(res.error, 'error');
        return;
      }
      showGlobalToast(t('invalidBackup'), 'error');
    } catch (e: any) {
      console.error('[PaperFlow] Zotero restore failed:', e);
      showGlobalToast(e.message || t('invalidBackup'), 'error');
    }
    return;
  }

  const PRE_IMPORT_BACKUP_KEY = 'paperflow_pre_import_backup';
  const result: any = await new Promise((resolve) => {
    if (typeof RFPlatform !== 'undefined' && RFPlatform.storage?.local?.get) {
      RFPlatform.storage.local.get([PRE_IMPORT_BACKUP_KEY], resolve);
    } else {
      resolve(null);
    }
  });
  const backup = result?.[PRE_IMPORT_BACKUP_KEY];
  if (!backup?.database) {
    showGlobalToast(t('noImportBackup'), 'error');
    return;
  }

  try {
    const normalizedBackup = await window.storage.ensureDbShape(backup.database, { stamp: false });
    db = await window.storage.saveAll(normalizedBackup, { replace: true, expectedRevision: db.revision });
    if (typeof renderAllViews === 'function') await renderAllViews();
    if (typeof loadSettings === 'function') await loadSettings();
    showGlobalToast(t('importBackupRestored'), 'success');
  } catch (err: any) {
    console.error('Failed to restore pre-import backup.', err);
    showGlobalToast(err.message || t('invalidBackup'), 'error');
  }
});

// Handle Imported JSON File
settingsViewScope.on(document.getElementById('import-db-file'), 'change', (e: any) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > MAX_IMPORT_DATABASE_BYTES) {
    showGlobalToast(t('importFileTooLarge'), 'error');
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = async (event: any) => {
    try {
      const importedData = JSON.parse(event.target.result);
      if (!isValidImportedDatabaseObject(importedData)) {
        showGlobalToast(t('invalidBackup'), 'error');
        return;
      }

      const mode = e.target.dataset.importMode === 'overwrite' ? 'overwrite' : 'merge';
      delete e.target.dataset.importMode;
      await window.storage.importDatabase(importedData, mode);
      db = await window.storage.loadAll();
      currentLanguage = resolvePreferredLanguage();
      applyThemePreference(db?.settings?.profile?.theme);
      applyLanguage();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      await renderSettings();
      showGlobalToast(t('databaseImported'), 'success');
    } catch (err: any) {
      console.error(err);
      showGlobalToast((currentLanguage === 'zh' ? '导入 JSON 失败：' : 'Failed to parse JSON: ') + err.message, 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

settingsViewScope.on(document.getElementById('btn-refresh-conflicts'), 'click', () => {
  refreshConflictDrafts();
});

const settingsViewExports = {
  getDeviceSyncSecretsFromInputs,
  renderSettings,
  updateSyncRouteNotice,
  saveSettingsFromInputs,
  stripCredentialsForExport,
  buildPrivacySafeDiagnostics,
  MAX_IMPORT_DATABASE_BYTES,
  isValidImportedDatabaseObject,
  formatConflictValue,
  renderConflictValueCell,
  formatConflictTimestamp,
  refreshConflictDrafts,
  openConflictRecoveryModal,
  setupSettingsListeners
};

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, settingsViewExports);
}
if (typeof window !== 'undefined') {
  Object.assign(window, settingsViewExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...(module.exports || {}), ...settingsViewExports };
}
