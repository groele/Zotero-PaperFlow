/**
 * Zotero PaperFlow - Multi-Cloud Settings View Module
 * Manages WebDAV/GitHub sync configuration, database import/export, and diagnostic reports.
 */
function updateSyncProviderVisibility() {
  const routeSelect = document.getElementById('route-db');
  if (!routeSelect) return;
  const provider = routeSelect.value || 'local';
  document.querySelectorAll('[data-sync-provider]').forEach((card) => {
    const isActive = card.dataset.syncProvider === provider;
    card.hidden = !isActive;
    card.style.display = isActive ? 'block' : 'none';
    card.classList.toggle('active', isActive);
    card.setAttribute('aria-hidden', String(!isActive));
  });

  const summary = document.getElementById('sync-route-summary');
  if (summary) {
    const summaryKey = provider === 'webdav'
      ? 'webdavSyncSummary'
      : (provider === 'github' ? 'githubSyncSummary' : 'localSyncSummary');
    summary.textContent = t(summaryKey);
    summary.dataset.provider = provider;
  }

  const localOnly = provider === 'local';
  const syncNowButton = document.getElementById('btn-sync-cloud-now');
  if (syncNowButton) {
    const configuredProvider = db?.settings?.syncProviders?.metadata?.provider || 'local';
    syncNowButton.disabled = localOnly || provider !== configuredProvider;
    syncNowButton.title = provider !== configuredProvider
      ? (currentLanguage === 'zh' ? '请先保存当前云端配置' : 'Save this cloud configuration first')
      : '';
  }

  const autoSyncToggle = document.getElementById('auto-cloud-sync');
  const autoSyncControl = document.getElementById('settings-auto-sync-control');
  const autoSyncHelp = document.getElementById('auto-cloud-sync-help');
  if (autoSyncToggle) {
    autoSyncToggle.disabled = localOnly;
    autoSyncToggle.checked = localOnly
      ? false
      : autoSyncToggle.dataset.savedValue !== 'false';
  }
  if (autoSyncControl) autoSyncControl.classList.toggle('is-disabled', localOnly);
  if (autoSyncHelp) {
    autoSyncHelp.textContent = t(localOnly ? 'autoCloudSyncLocalHelp' : 'autoCloudSyncHelp');
  }
}
window.updateSyncProviderVisibility = updateSyncProviderVisibility;

async function loadSettings() {
  const syncProviders = db.settings?.syncProviders || DEFAULT_DB.settings.syncProviders;
  const profile = db.settings?.profile || DEFAULT_DB.settings.profile;
  const credentials = await window.storage.loadSyncCredentials();

  const languageSelect = document.getElementById('ui-language');
  if (languageSelect) languageSelect.value = currentLanguage || profile.language || 'en';
  const themeSelect = document.getElementById('ui-theme');
  if (themeSelect) themeSelect.value = normalizeThemePreference(profile.theme);

  const autoSyncToggle = document.getElementById('auto-cloud-sync');
  if (autoSyncToggle) {
    const autoSyncEnabled = syncProviders.metadata.autoSync !== false;
    autoSyncToggle.dataset.savedValue = String(autoSyncEnabled);
    autoSyncToggle.checked = autoSyncEnabled;
  }

  // Cloud routing
  document.getElementById('route-db').value = syncProviders.metadata.provider || 'local';
  updateSyncProviderVisibility();

  // WebDAV
  document.getElementById('webdav-url').value = syncProviders.metadata.config?.url || '';
  document.getElementById('webdav-username').value = credentials.webdav?.username || '';
  document.getElementById('webdav-password').value = credentials.webdav?.password || '';

  // GitHub
  document.getElementById('github-token').value = credentials.github?.token || '';
  document.getElementById('github-repo').value = syncProviders.metadata.config?.repo || '';
  document.getElementById('github-branch').value = syncProviders.metadata.config?.branch || 'main';

  applyLanguage();
}

function setupSettingsListeners() {
  const languageSelect = document.getElementById('ui-language');
  if (languageSelect) {
    languageSelect.addEventListener('change', async () => {
      currentLanguage = languageSelect.value;
      document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
      db.settings = db.settings || {};
      db.settings.profile = db.settings.profile || {};
      db.settings.profile.language = currentLanguage;
      applyLanguage();
      refreshActiveViewForLanguage();
      languageSelect.disabled = true;
      try {
        await window.storage.saveAll(db);
      } finally {
        languageSelect.disabled = false;
      }
      showGlobalToast(t('languageSaved'), 'success');
    });
  }

  const themeSelect = document.getElementById('ui-theme');
  if (themeSelect) {
    themeSelect.addEventListener('change', async () => {
      const previousTheme = normalizeThemePreference(db.settings?.profile?.theme);
      const nextTheme = applyThemePreference(themeSelect.value);
      db.settings = db.settings || {};
      db.settings.profile = db.settings.profile || {};
      db.settings.profile.theme = nextTheme;
      themeSelect.disabled = true;
      try {
        await window.storage.saveAll(db);
      } catch (error) {
        db.settings.profile.theme = previousTheme;
        themeSelect.value = previousTheme;
        applyThemePreference(previousTheme);
        throw error;
      } finally {
        themeSelect.disabled = false;
      }
      showGlobalToast(t('appearanceSaved'), 'success');
    });
  }

  const routeSelect = document.getElementById('route-db');
  if (routeSelect) {
    routeSelect.addEventListener('change', updateSyncProviderVisibility);
    routeSelect.addEventListener('input', updateSyncProviderVisibility);
    updateSyncProviderVisibility();
  }

  const autoSyncToggle = document.getElementById('auto-cloud-sync');
  if (autoSyncToggle) {
    autoSyncToggle.addEventListener('change', () => {
      autoSyncToggle.dataset.savedValue = String(autoSyncToggle.checked);
    });
  }

  // Save Mappings Button
  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const routeDb = document.getElementById('route-db').value;

    const webdavConfig = {
      url: document.getElementById('webdav-url').value.trim(),
      username: document.getElementById('webdav-username').value.trim(),
      password: document.getElementById('webdav-password').value.trim()
    };

    const githubConfig = {
      token: document.getElementById('github-token').value.trim(),
      repo: document.getElementById('github-repo').value.trim(),
      branch: document.getElementById('github-branch').value.trim() || 'main'
    };
    const selectedConfig = routeDb === 'webdav'
      ? webdavConfig
      : (routeDb === 'github' ? githubConfig : {});
    const autoSync = document.getElementById('auto-cloud-sync')?.dataset.savedValue !== 'false';
    const configurationIssue = window.storage.getSyncConfigurationIssue({
      provider: routeDb,
      config: selectedConfig
    });
    if (configurationIssue) {
      showGlobalToast(configurationIssue, 'error');
      return;
    }

    await window.storage.saveSyncCredentials(routeDb, selectedConfig);
    const publicConfig = window.storage.getPublicSyncConfig(routeDb, selectedConfig);

    // Credentials are device-local and never enter the synchronized database.
    db.settings.syncProviders = {
      metadata: {
        provider: routeDb,
        config: publicConfig,
        autoSync
      }
    };

    await window.storage.saveAll(db);
    updateSyncProviderVisibility();
    showGlobalToast('Cloud database mapping saved!', 'success');
  });

  document.getElementById('btn-sync-cloud-now')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      const result = await window.storage.syncDatabaseNow();
      if (!result?.success) throw new Error(result?.error || 'Cloud sync failed');
      db = await window.storage.loadAll();
      await renderAllViews();
      showGlobalToast(result.pending
        ? (currentLanguage === 'zh' ? '已同步，新的本机修改等待下一次同步' : 'Synced; newer local edits remain pending')
        : (currentLanguage === 'zh' ? '云端同步完成' : 'Cloud sync complete'), 'success');
    } catch (error) {
      showGlobalToast(error.message || String(error), 'error');
    } finally {
      button.removeAttribute('aria-busy');
      updateSyncProviderVisibility();
    }
  });

  // Test WebDAV Connection
  document.getElementById('btn-test-webdav').addEventListener('click', async () => {
    const btn = document.getElementById('btn-test-webdav');
    btn.disabled = true;
    btn.textContent = 'Testing connection...';

    const config = {
      url: document.getElementById('webdav-url').value.trim(),
      username: document.getElementById('webdav-username').value.trim(),
      password: document.getElementById('webdav-password').value.trim()
    };

    const result = await window.storage.testConnection('webdav', config);
    if (result.success) {
      showGlobalToast('WebDAV drive connected successfully!', 'success');
    } else {
      alert(`WebDAV test failed: ${result.error}`);
    }
    btn.disabled = false;
    btn.textContent = 'Test WebDAV Connection';
  });

  // Test GitHub Connection
  document.getElementById('btn-test-github').addEventListener('click', async () => {
    const btn = document.getElementById('btn-test-github');
    btn.disabled = true;
    btn.textContent = 'Testing repo...';

    const config = {
      token: document.getElementById('github-token').value.trim(),
      repo: document.getElementById('github-repo').value.trim(),
      branch: document.getElementById('github-branch').value.trim() || 'main'
    };

    const result = await window.storage.testConnection('github', config);
    if (result.success) {
      showGlobalToast('GitHub repository sync mapping validated!', 'success');
    } else {
      alert(`GitHub test failed: ${result.error}`);
    }
    btn.disabled = false;
    btn.textContent = 'Test GitHub Repository';
  });

  // --- DATABASE BACKUP & IMPORT LISTENERS ---
  // Export Database
  document.getElementById('btn-export-db').addEventListener('click', async () => {
    const isZoteroEnv = Boolean(
      (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) ||
      (typeof window !== 'undefined' && (window.Zotero || window.parent?.Zotero))
    );
    if (isZoteroEnv && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.exportDatabase) {
      try {
        const res = await ZoteroBridge.exportDatabase();
        if (res?.success) {
          showGlobalToast(t('databaseExported'), 'success');
          return;
        }
        if (res?.cancelled) {
          return;
        }
      } catch (e) {
        console.warn('[ResearchFlow] Zotero native export failed, falling back to browser download:', e);
      }
    }
    const safeDb = window.storage.sanitizeDatabaseForExternalUse(db);
    const exportBlob = new Blob([JSON.stringify(safeDb, null, 2)], { type: 'application/json;charset=utf-8' });
    const exportUrl = URL.createObjectURL(exportBlob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", exportUrl);
    downloadAnchor.setAttribute("download", `researchflow-export-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(exportUrl), 1000);
    showGlobalToast(t('databaseExported'), 'success');
  });

  document.getElementById('btn-export-diagnostics').addEventListener('click', async () => {
    const metadataRoute = db?.settings?.syncProviders?.metadata || { provider: 'local', config: {} };
    const effectiveRoute = await window.storage.getEffectiveMetadataProvider(db);
    const diagnosticReport = {
      generatedAt: new Date().toISOString(),
      extension: {
        name: RFPlatform?.runtime?.getManifest?.()?.name || 'Zotero PaperFlow',
        version: RFPlatform?.runtime?.getManifest?.()?.version || RF_OPTIONS_RENDER_VERSION,
        schemaVersion: Number(db.schemaVersion) || null,
        revision: Number(db.revision) || 0
      },
      runtime: {
        language: currentLanguage,
        online: navigator.onLine,
        platform: navigator.platform || '',
        userAgent: navigator.userAgent || ''
      },
      database: {
        lastUpdated: db.updatedAt || null,
        counts: {
          projects: db.projects?.length || 0,
          manuscripts: db.manuscripts?.length || 0,
          submissions: db.submissions?.length || 0,
          tasks: db.tasks?.length || 0
        }
      },
      synchronization: {
        provider: metadataRoute.provider || 'local',
        configurationValid: !window.storage.getSyncConfigurationIssue(effectiveRoute)
      },
      capture: {
        submissionRecognitionEnabled: document.getElementById('submission-assist-enabled')?.checked !== false,
        detailedCaptureEnabled: document.getElementById('submission-assist-capture-enabled')?.checked !== false
      },
      privacy: {
        credentialsIncluded: false,
        manuscriptMetadataIncluded: false
      }
    };

    const isZoteroEnv = Boolean(
      (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) ||
      (typeof window !== 'undefined' && (window.Zotero || window.parent?.Zotero))
    );
    if (isZoteroEnv && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.exportDiagnostics) {
      try {
        const res = await ZoteroBridge.exportDiagnostics(diagnosticReport);
        if (res?.success) {
          showGlobalToast(t('diagnosticsExported'), 'success');
          return;
        }
        if (res?.cancelled) {
          return;
        }
      } catch (e) {
        console.warn('[ResearchFlow] Zotero native diagnostics export failed, falling back to blob:', e);
      }
    }

    const diagnosticBlob = new Blob(
      [JSON.stringify(diagnosticReport, null, 2)],
      { type: 'application/json;charset=utf-8' }
    );
    const diagnosticUrl = URL.createObjectURL(diagnosticBlob);
    const anchor = document.createElement('a');
    anchor.href = diagnosticUrl;
    anchor.download = `researchflow-diagnostics-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(diagnosticUrl), 1000);
    showGlobalToast(t('diagnosticsExported'), 'success');
  });

  // Trigger File Import Dialog
  document.getElementById('btn-trigger-import').addEventListener('click', async () => {
    const isZoteroEnv = Boolean(
      (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) ||
      (typeof window !== 'undefined' && (window.Zotero || window.parent?.Zotero))
    );
    if (isZoteroEnv && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.importDatabase) {
      try {
        const res = await ZoteroBridge.importDatabase('merge');
        if (res?.success && res.data) {
          db = res.data;
          await renderAllViews();
          await loadSettings();
          showGlobalToast(t('databaseImported') || '数据库导入成功！', 'success');
          return;
        }
        if (res?.cancelled) {
          return;
        }
        showGlobalToast(res?.error || t('invalidBackup'), 'error');
      } catch (e) {
        console.error('[ResearchFlow] Zotero native import failed:', e);
        showGlobalToast(e.message || t('invalidBackup'), 'error');
      }
      return;
    }
    document.getElementById('import-db-file').click();
  });

  document.getElementById('btn-restore-import-backup').addEventListener('click', async () => {
    if (!confirm(t('restoreImportConfirm'))) return;

    const isZoteroEnv = Boolean(
      (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) ||
      (typeof window !== 'undefined' && (window.Zotero || window.parent?.Zotero))
    );
    if (isZoteroEnv && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.restoreBackup) {
      try {
        const res = await ZoteroBridge.restoreBackup();
        if (res?.success && res.data) {
          db = res.data;
          await renderAllViews();
          await loadSettings();
          showGlobalToast(t('importBackupRestored'), 'success');
          return;
        }
        if (res?.error) {
          showGlobalToast(res.error, 'error');
          return;
        }
        showGlobalToast(t('invalidBackup'), 'error');
      } catch (e) {
        console.error('[ResearchFlow] Zotero restore failed:', e);
        showGlobalToast(e.message || t('invalidBackup'), 'error');
      }
      return;
    }

    const result = await new Promise((resolve) => {
      RFPlatform.storage.local.get([PRE_IMPORT_BACKUP_KEY], resolve);
    });
    const backup = result?.[PRE_IMPORT_BACKUP_KEY];
    if (!backup?.database) {
      showGlobalToast(t('noImportBackup'), 'error');
      return;
    }

    try {
      const normalizedBackup = await window.storage.ensureDbShape(backup.database, { stamp: false });
      db = await window.storage.saveAll(normalizedBackup, { replace: true, expectedRevision: db.revision });
      await renderAllViews();
      await loadSettings();
      showGlobalToast(t('importBackupRestored'), 'success');
    } catch (err) {
      console.error('Failed to restore pre-import backup.', err);
      showGlobalToast(err.message || t('invalidBackup'), 'error');
    }
  });


  // Handle Imported JSON File and Adapt Schema Format
  document.getElementById('import-db-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      e.target.value = '';
      showGlobalToast(t('importFileTooLarge'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importJson = JSON.parse(event.target.result);
        const recognizedCollections = [
          'projects',
          'researchRecords',
          'manuscripts',
          'submissions',
          'tasks',
          'achievements',
          'honorOpportunities',
          'honorApplications'
        ];
        if (
          !importJson
          || typeof importJson !== 'object'
          || Array.isArray(importJson)
          || !recognizedCollections.some((key) => Array.isArray(importJson[key]))
        ) {
          throw new Error(t('invalidBackup'));
        }

        if (Number(importJson.schemaVersion) > 7) throw new Error('This backup requires a newer version of ResearchFlow.');
        function capitalize(str) {
          if (!str) return '';
          return str.charAt(0).toUpperCase() + str.slice(1);
        }

        // Clone current database structure (maintains user's credentials/settings if any)
        const newDb = JSON.parse(JSON.stringify(db));

        // 1. Convert Projects
        if (Array.isArray(importJson.projects)) {
          newDb.projects = importJson.projects.map(proj => ({
            id: proj.id,
            userId: proj.userId || 'user',
            areaId: proj.areaId || null,
            title: proj.title,
            shortTitle: proj.shortTitle || null,
            discipline: capitalize(proj.discipline) || (proj.area ? capitalize(proj.area.name) : 'General'),
            abstract: proj.description || '',
            hypothesis: proj.hypothesis || '',
            objectives: Array.isArray(proj.objectives) ? proj.objectives : [],
            keywords: Array.isArray(proj.keywords) ? proj.keywords : [],
            tags: Array.isArray(proj.tags) ? proj.tags : [],
            customFields: proj.customFields || {},
            currentStage: proj.currentStage || (proj.status === 'completed' ? 'Completed' : 'Planning'),
            status: proj.status || 'planning',
            createdAt: proj.createdAt,
            updatedAt: proj.updatedAt
          }));
        }

        // 2. Convert Research Records
        if (Array.isArray(importJson.researchRecords)) {
          newDb.researchRecords = importJson.researchRecords.map(rec => ({
            id: rec.id,
            userId: rec.userId || 'user',
            projectId: rec.projectId || null,
            title: rec.title,
            recordType: rec.recordType || 'note',
            discipline: rec.discipline || '',
            methodology: rec.methodology || '',
            summary: rec.summary || '',
            rawData: rec.rawData || null,
            content: rec.content || '',
            priority: rec.priority || 'medium',
            status: rec.status || 'idea',
            attributes: rec.attributes || {},
            tags: Array.isArray(rec.tags) ? rec.tags : [],
            occurredAt: rec.occurredAt || rec.createdAt,
            createdAt: rec.createdAt,
            updatedAt: rec.updatedAt
          }));
        }

        // 3. Convert Manuscripts
        if (Array.isArray(importJson.manuscripts)) {
          newDb.manuscripts = importJson.manuscripts.map(man => ({
            id: man.id,
            userId: man.userId || 'user',
            projectId: man.projectId || null,
            title: man.title,
            shortTitle: man.shortTitle || null,
            manuscriptType: man.manuscriptType || 'article',
            status: man.status || 'idea',
            abstract: man.abstract || '',
            keywords: Array.isArray(man.keywords) ? man.keywords : [],
            authors: Array.isArray(man.authors) ? man.authors : [],
            firstAuthor: man.firstAuthor || firstAuthorFromList(man.authors) || null,
            correspondingAuthors: Array.isArray(man.correspondingAuthors) ? man.correspondingAuthors : [],
            targetJournals: Array.isArray(man.targetJournals)
              ? man.targetJournals
              : (man.targetJournal ? [man.targetJournal] : []),
            doi: normalizeDoi(man.doi || man.DOI || '') || null,
            articleUrl: String(man.articleUrl || '').trim() || null,
            academicCaptureProvenance: man.academicCaptureProvenance
              && typeof man.academicCaptureProvenance === 'object'
              && !Array.isArray(man.academicCaptureProvenance)
              ? {
                  sourceType: String(man.academicCaptureProvenance.sourceType || '').slice(0, 40),
                  sourceHost: String(man.academicCaptureProvenance.sourceHost || '').slice(0, 255),
                  sourcePageUrl: String(man.academicCaptureProvenance.sourcePageUrl || '').slice(0, 2000),
                  pdfUrl: String(man.academicCaptureProvenance.pdfUrl || '').slice(0, 2000),
                  confidenceScore: Number(man.academicCaptureProvenance.confidenceScore) || 0,
                  capturedAt: man.academicCaptureProvenance.capturedAt || null,
                  reviewedByUser: man.academicCaptureProvenance.reviewedByUser === true
                }
              : null,
            currentVersion: man.currentVersion || '1.0',
            plannedFigures: Array.isArray(man.plannedFigures) ? man.plannedFigures : [],
            notes: man.notes || null,
            createdAt: man.createdAt,
            updatedAt: man.updatedAt
          }));
        }

        // 4. Convert Submissions
        if (Array.isArray(importJson.submissions)) {
          newDb.submissions = importJson.submissions.map(sub => {
            let compliance = {};
            if (sub.complianceChecklist && typeof sub.complianceChecklist === 'object' && !Array.isArray(sub.complianceChecklist)) {
              compliance = sub.complianceChecklist;
            }
            const status = sub.status || 'submitted';
            const importedSubmission = {
              status,
              acceptedAt: sub.acceptedAt || null,
              publishedAt: sub.publishedAt || null,
              decisionDate: sub.decisionDate || sub.decisionAt || null,
              timelineNodes: Array.isArray(sub.timelineNodes) ? sub.timelineNodes : []
            };
            const keepPublicationLink = canHavePublicationLink(importedSubmission);
            const doi = keepPublicationLink
              ? normalizeDoi(sub.doi || sub.DOI || extractDoiFromText(sub.notes || ''))
              : '';
            return {
              id: sub.id,
              userId: sub.userId || 'user',
              manuscriptId: sub.manuscriptId,
              projectId: sub.projectId || null,
              firstAuthor: sub.firstAuthor || firstAuthorFromList(sub.authors) || null,
              targetJournal: sub.targetJournal || sub.journalName || '',
              journalUrl: sub.journalUrl || sub.submissionUrl || null,
              doi: doi || null,
              articleUrl: keepPublicationLink ? (sub.articleUrl || sub.publicationUrl || sub.url || null) : null,
              status,
              submissionDate: sub.submissionDate || sub.submittedAt || null,
              decisionDate: sub.decisionDate || sub.decisionAt || null,
              firstDecisionDate: sub.firstDecisionDate || null,
              revisionDueDate: sub.revisionDueDate || sub.revisionDeadline || null,
              notes: sub.notes || null,
              complianceChecklist: compliance,
              complianceChecklistKeys: Array.isArray(sub.complianceChecklistKeys)
                ? sub.complianceChecklistKeys
                  .filter(item => item && typeof item === 'object')
                  .map(item => ({
                    key: String(item.key || '').trim(),
                    label: String(item.label || item.key || '').trim()
                  }))
                  .filter(item => item.key && item.label)
                : undefined,
              reviewMatrix: Array.isArray(sub.reviewMatrix)
                ? sub.reviewMatrix
                : (Array.isArray(sub.reviewRounds) ? sub.reviewRounds : []),
              timelineNodes: Array.isArray(sub.timelineNodes) ? sub.timelineNodes : [],
              previousSubmissionId: sub.previousSubmissionId || null,
              previousJournal: sub.previousJournal || null,
              roundIndex: Number.isFinite(Number(sub.roundIndex)) && Number(sub.roundIndex) > 0
                ? Number(sub.roundIndex)
                : 1,
              rejectedAt: sub.rejectedAt || null,
              rejectionNote: sub.rejectionNote || null,
              acceptedAt: sub.acceptedAt || null,
              publishedAt: sub.publishedAt || null,
              externalManuscriptId: sub.externalManuscriptId || null,
              customFields: sub.customFields && typeof sub.customFields === 'object' && !Array.isArray(sub.customFields)
                ? sub.customFields
                : {},
              createdAt: sub.createdAt,
              updatedAt: sub.updatedAt
            };
          });
        }

        // 5. Convert Achievements
        if (Array.isArray(importJson.achievements)) {
          newDb.achievements = importJson.achievements.map(ach => ({
            id: ach.id,
            userId: ach.userId || 'user',
            title: ach.title,
            achievementType: ach.achievementType,
            description: ach.description || null,
            date: ach.date,
            role: ach.role,
            doi: ach.doi || null,
            url: ach.url || null,
            journal: ach.journal || null,
            volume: ach.volume || null,
            pages: ach.pages || null,
            impactSummary: ach.impactSummary || null,
            metadata: ach.metadata || {},
            tags: Array.isArray(ach.tags) ? ach.tags : [],
            createdAt: ach.createdAt,
            updatedAt: ach.updatedAt
          }));
        }

        // 6. Convert Honors
        if (Array.isArray(importJson.honorOpportunities)) {
          newDb.honorOpportunities = importJson.honorOpportunities;
        }
        if (Array.isArray(importJson.honorApplications)) {
          newDb.honorApplications = importJson.honorApplications;
        }
        if (Array.isArray(importJson.tasks)) {
          newDb.tasks = importJson.tasks;
        }

        // Native backups must round-trip tombstones, capture provenance and extension fields.
        // Legacy conversions above remain available for older third-party formats.
        if (Number(importJson.schemaVersion) === 7) {
          Object.assign(newDb, importJson, { settings: newDb.settings, deviceId: db.deviceId, revision: db.revision });
          for (const key of ['researchAreas', 'projects', 'researchRecords', 'manuscripts', 'submissions', 'tasks']) {
            newDb[key] = Array.isArray(importJson[key]) ? importJson[key] : [];
          }
          newDb.deletedEntities = importJson.deletedEntities || {};
        }
        syncManuscriptStatusesFromSubmissions(newDb);
        const normalizedImport = await window.storage.ensureDbShape(newDb, { stamp: false });
        const safeCurrentDb = window.storage.sanitizeDatabaseForExternalUse(db);
        await new Promise((resolve, reject) => {
          RFPlatform.storage.local.set({
            [PRE_IMPORT_BACKUP_KEY]: {
              database: safeCurrentDb,
              createdAt: new Date().toISOString(),
              sourceFileName: String(file.name || '').slice(0, 260)
            }
          }, () => {
            if (RFPlatform.runtime.lastError) {
              reject(new Error(`Unable to create the pre-import backup: ${RFPlatform.runtime.lastError.message}`));
              return;
            }
            resolve();
          });
        });

        // Only replace the in-memory cache after parsing, conversion,
        // normalization and recovery-backup creation have all succeeded.
        db = await window.storage.saveAll(normalizedImport, { replace: true, expectedRevision: db.revision });
        await renderAllViews();
        await loadSettings();
        showGlobalToast(t('databaseImported'), 'success');
      } catch (err) {
        console.error('Failed to import database JSON.', err);
        showGlobalToast(err.message || t('invalidBackup'), 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      e.target.value = '';
      showGlobalToast(t('invalidBackup'), 'error');
    };
    reader.readAsText(file);
  });
}

// --- DYNAMIC DIALOG MODAL CONTROLLER ---

