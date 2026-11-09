/**
 * Zotero PaperFlow - Multi-Cloud Sync Routing, Credentials & Interface Settings
 */
declare var db: any;
declare var currentLanguage: string;
declare function t(key: string): string;
declare function setText(selector: string, value: any): void;
declare function showGlobalToast(message: string, type?: string): void;
declare function normalizeThemePreference(value: any): string;
declare function applyThemePreference(value: any): string;
declare function applyLanguage(): void;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function renderSubmissions(): void;
declare function refreshConflictDrafts(): Promise<void>;

export function getDeviceSyncSecretsFromInputs(): any {
  const webdavPass = (document.getElementById('webdav-pass') as HTMLInputElement | null)?.value ?? '';
  const githubPat = (document.getElementById('github-pat') as HTMLInputElement | null)?.value ?? '';
  return {
    webdav: { pass: webdavPass },
    github: { pat: githubPat }
  };
}

export async function renderSettings(): Promise<void> {
  if (!db.settings) db.settings = { syncProviders: {} };
  if (!db.settings.profile) db.settings.profile = {};
  if (!db.settings.syncProviders) db.settings.syncProviders = {};
  const sp = db.settings.syncProviders;
  const secrets = window.storage?.getDeviceSyncSecrets
    ? await window.storage.getDeviceSyncSecrets()
    : { webdav: {}, github: {} };

  const langSelect = document.getElementById('settings-language') as HTMLSelectElement | null;
  if (langSelect) {
    langSelect.value = currentLanguage;
  }
  const themeSelect = document.getElementById('settings-theme') as HTMLSelectElement | null;
  if (themeSelect) {
    themeSelect.value = normalizeThemePreference(db.settings.profile.theme);
  }

  if (sp.metadata) {
    const routeDb = document.getElementById('route-db') as HTMLSelectElement | null;
    const autoSync = document.getElementById('settings-auto-sync') as HTMLInputElement | null;
    if (routeDb) routeDb.value = sp.metadata.provider || 'local';
    if (autoSync) autoSync.checked = sp.metadata.autoSync !== false;
  }

  const webdavConfig = sp.metadata?.provider === 'webdav' ? sp.metadata.config : sp.webdavConfig;
  if (webdavConfig) {
    const urlInput = document.getElementById('webdav-url') as HTMLInputElement | null;
    const userInput = document.getElementById('webdav-user') as HTMLInputElement | null;
    if (urlInput) urlInput.value = webdavConfig.url || '';
    if (userInput) userInput.value = webdavConfig.user || '';
  }
  const webdavPassInput = document.getElementById('webdav-pass') as HTMLInputElement | null;
  if (webdavPassInput) {
    webdavPassInput.value = secrets.webdav?.pass || webdavConfig?.pass || '';
  }

  const githubConfig = sp.metadata?.provider === 'github' ? sp.metadata.config : sp.githubConfig;
  if (githubConfig) {
    const repoInput = document.getElementById('github-repo') as HTMLInputElement | null;
    const branchInput = document.getElementById('github-branch') as HTMLInputElement | null;
    if (repoInput) repoInput.value = githubConfig.repo || '';
    if (branchInput) branchInput.value = githubConfig.branch || 'main';
  }
  const githubPatInput = document.getElementById('github-pat') as HTMLInputElement | null;
  if (githubPatInput) {
    githubPatInput.value = secrets.github?.pat || githubConfig?.pat || '';
  }

  updateSyncRouteNotice();
  if (typeof refreshConflictDrafts === 'function') {
    await refreshConflictDrafts();
  }
}

export function updateSyncRouteNotice(): void {
  const provider = (document.getElementById('route-db') as HTMLSelectElement | null)?.value || db?.settings?.syncProviders?.metadata?.provider || 'local';
  const summaryKey = provider === 'webdav'
    ? 'webdavSyncSummary'
    : (provider === 'github' ? 'githubSyncSummary' : 'localSyncSummary');
  setText('#sync-route-summary', t(summaryKey));
  const forceSyncBtn = document.getElementById('btn-force-sync') as HTMLButtonElement | null;
  if (forceSyncBtn) {
    forceSyncBtn.disabled = provider === 'local';
  }
  const autoSyncToggle = document.getElementById('settings-auto-sync') as HTMLInputElement | null;
  if (autoSyncToggle) {
    autoSyncToggle.disabled = provider === 'local';
  }
  setText('#settings-auto-sync-help', t(provider === 'local' ? 'autoCloudSyncLocalHelp' : 'autoCloudSyncHelp'));
  const localCard = document.getElementById('settings-local-card');
  const webdavCard = document.getElementById('settings-webdav-card');
  const githubCard = document.getElementById('settings-github-card');
  if (localCard) localCard.hidden = provider !== 'local';
  if (webdavCard) webdavCard.hidden = provider !== 'webdav';
  if (githubCard) githubCard.hidden = provider !== 'github';
}

export async function saveSettingsFromInputs({ showToast = true } = {}): Promise<void> {
  const routeDb = (document.getElementById('route-db') as HTMLSelectElement | null)?.value || 'local';
  const autoSync = (document.getElementById('settings-auto-sync') as HTMLInputElement | null)?.checked !== false;
  const language = (document.getElementById('settings-language') as HTMLSelectElement | null)?.value === 'en' ? 'en' : 'zh';
  const theme = normalizeThemePreference((document.getElementById('settings-theme') as HTMLSelectElement | null)?.value);

  const webdavConfig = {
    url: (document.getElementById('webdav-url') as HTMLInputElement | null)?.value.trim() || '',
    user: (document.getElementById('webdav-user') as HTMLInputElement | null)?.value.trim() || ''
  };

  const githubConfig = {
    repo: (document.getElementById('github-repo') as HTMLInputElement | null)?.value.trim() || '',
    branch: (document.getElementById('github-branch') as HTMLInputElement | null)?.value.trim() || 'main'
  };

  if (!db.settings) db.settings = {};
  if (!db.settings.profile) db.settings.profile = {};
  db.settings.profile.language = language;
  db.settings.profile.theme = theme;
  currentLanguage = language;
  applyThemePreference(theme);
  db.settings.syncProviders = {
    webdavConfig,
    githubConfig,
    metadata: {
      provider: routeDb,
      autoSync,
      config: routeDb === 'webdav' ? webdavConfig : (routeDb === 'github' ? githubConfig : {})
    }
  };

  if (window.storage?.saveDeviceSyncSecrets) {
    await window.storage.saveDeviceSyncSecrets(getDeviceSyncSecretsFromInputs());
  }
  await window.storage.saveAll(db);
  applyLanguage();
  renderDashboard();
  renderKanban();
  renderSubmissions();
  if (showToast) {
    showGlobalToast('Cloud Sync Configuration Saved! Active on next data write.', 'success');
  }
}

export function bindSettingsRoutingListeners(): void {
  document.getElementById('settings-language')?.addEventListener('change', async () => {
    await saveSettingsFromInputs({ showToast: false });
    showGlobalToast(t('languageSaved'), 'success');
  });

  document.getElementById('settings-theme')?.addEventListener('change', async () => {
    await saveSettingsFromInputs({ showToast: false });
    showGlobalToast(t('appearanceSaved'), 'success');
  });

  document.getElementById('route-db')?.addEventListener('change', () => {
    updateSyncRouteNotice();
  });

  document.getElementById('settings-auto-sync')?.addEventListener('change', async () => {
    await saveSettingsFromInputs({ showToast: false });
  });

  document.getElementById('btn-save-mappings')?.addEventListener('click', async () => {
    await saveSettingsFromInputs({ showToast: true });
  });

  document.getElementById('btn-test-webdav')?.addEventListener('click', async () => {
    const url = (document.getElementById('webdav-url') as HTMLInputElement | null)?.value.trim() || '';
    const user = (document.getElementById('webdav-user') as HTMLInputElement | null)?.value.trim() || '';
    const pass = (document.getElementById('webdav-pass') as HTMLInputElement | null)?.value.trim() || '';
    const statusEl = document.getElementById('webdav-status');
    if (!statusEl) return;

    if (!url || !user || !pass) {
      statusEl.textContent = '❌ Please fill in all WebDAV fields.';
      statusEl.style.color = 'hsl(var(--status-danger))';
      return;
    }

    statusEl.textContent = '⏳ Testing connection to WebDAV...';
    statusEl.style.color = 'hsl(var(--text-secondary))';

    const res = await window.storage.testWebDAV({ url, user, pass });
    if (res.success) {
      statusEl.textContent = '✅ Connected successfully!';
      statusEl.style.color = 'hsl(var(--status-success))';
      await saveSettingsFromInputs({ showToast: false });
    } else {
      statusEl.textContent = `❌ Failed: ${res.message}`;
      statusEl.style.color = 'hsl(var(--status-danger))';
    }
  });

  document.getElementById('btn-test-github')?.addEventListener('click', async () => {
    const pat = (document.getElementById('github-pat') as HTMLInputElement | null)?.value.trim() || '';
    const repo = (document.getElementById('github-repo') as HTMLInputElement | null)?.value.trim() || '';
    const branch = (document.getElementById('github-branch') as HTMLInputElement | null)?.value.trim() || 'main';
    const statusEl = document.getElementById('github-status');
    if (!statusEl) return;

    if (!pat || !repo) {
      statusEl.textContent = '❌ Please provide PAT and Repo.';
      statusEl.style.color = 'hsl(var(--status-danger))';
      return;
    }

    statusEl.textContent = '⏳ Verifying GitHub repository...';
    statusEl.style.color = 'hsl(var(--text-secondary))';

    const res = await window.storage.testGitHub({ pat, repo, branch });
    if (res.success) {
      statusEl.textContent = `✅ Repository "${res.repoName}" Verified!`;
      statusEl.style.color = 'hsl(var(--status-success))';
      await saveSettingsFromInputs({ showToast: false });
    } else {
      statusEl.textContent = `❌ Failed: ${res.message}`;
      statusEl.style.color = 'hsl(var(--status-danger))';
    }
  });
}
