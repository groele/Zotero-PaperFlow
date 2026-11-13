/**
 * Zotero PaperFlow Preferences - Button & Diagnostics Actions
 */
declare var Zotero: any;

type GetPrefFn = (key: string) => any;
type SetPrefFn = (key: string, value: any) => void;

function setImportStatus(doc: Document, message: string, isError = false): void {
  const el = doc.getElementById('rf-import-status');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('rf-pref-error', isError);
}

function bindClick(
  doc: Document,
  id: string,
  handler: (event: Event) => void | Promise<void>
): void {
  const btn = doc.getElementById(id) as HTMLButtonElement | null;
  if (!btn || (btn as any).dataset?.rfBound) return;
  if ((btn as any).dataset) (btn as any).dataset.rfBound = 'true';
  btn.addEventListener('click', (event) => {
    void handler(event);
  });
}

function isZhLocale(doc: Document, getPrefValue: GetPrefFn): boolean {
  const lang = String(getPrefValue('language') || doc.documentElement?.lang || 'zh').toLowerCase();
  return lang.startsWith('zh');
}

export function bindPreferenceActions(
  doc: Document,
  win: Window,
  getPrefValue: GetPrefFn,
  setPrefValue: SetPrefFn
): void {
  const zotero = typeof Zotero !== 'undefined' ? Zotero : (win as any).Zotero;
  const host = zotero?.ResearchFlow || zotero?.PaperFlow;
  const zh = isZhLocale(doc, getPrefValue);

  const pathLabel = doc.getElementById('rf-data-path-label');
  if (pathLabel && typeof host?.getDataFilePath === 'function') {
    try {
      const actualPath = host.getDataFilePath();
      if (actualPath) pathLabel.textContent = actualPath;
    } catch (_) {}
  }

  const importModeSelect = doc.getElementById('rf-import-mode') as HTMLSelectElement | null;
  if (importModeSelect) {
    const savedMode = String(getPrefValue('importMode') || 'merge');
    importModeSelect.value = savedMode === 'overwrite' ? 'overwrite' : 'merge';
    if (!(importModeSelect as any).dataset?.rfBound) {
      if ((importModeSelect as any).dataset) (importModeSelect as any).dataset.rfBound = 'true';
      importModeSelect.addEventListener('change', () => {
        setPrefValue('importMode', importModeSelect.value);
      });
    }
  }

  bindClick(doc, 'rf-btn-open-workspace', () => {
    host?.openResearchFlow?.({}, win, 'tab');
  });

  bindClick(doc, 'rf-btn-open-subwindow', () => {
    host?.openStandaloneWindow?.({}, win, 'subwindow');
  });

  bindClick(doc, 'rf-btn-open-window', () => {
    host?.openStandaloneWindow?.({}, win, 'window');
  });

  bindClick(doc, 'rf-btn-open-cloud-settings', () => {
    host?.openResearchFlow?.({ view: 'view-settings' }, win, 'tab');
  });

  bindClick(doc, 'rf-btn-conflict-recovery', () => {
    host?.openResearchFlow?.({ view: 'view-settings' }, win, 'tab');
  });

  bindClick(doc, 'rf-btn-export-db', async () => {
    if (typeof host?.exportDatabaseFile !== 'function') return;
    const res = await host.exportDatabaseFile(win);
    if (res?.success) {
      setImportStatus(doc, zh ? `已导出备份：${res.filePath || ''}` : `Exported backup: ${res.filePath || ''}`);
    } else if (res?.error) {
      setImportStatus(doc, (zh ? '导出失败：' : 'Export failed: ') + res.error, true);
    }
  });

  bindClick(doc, 'rf-btn-import-file', async () => {
    if (typeof host?.importDatabaseFile !== 'function') return;
    const mode = importModeSelect?.value || String(getPrefValue('importMode') || 'merge');
    const res = await host.importDatabaseFile(mode, win);
    if (res?.success) {
      setImportStatus(doc, zh ? '数据库已成功导入并同步。' : 'Database imported and synced successfully.');
    } else if (res?.error) {
      setImportStatus(doc, (zh ? '导入失败：' : 'Import failed: ') + res.error, true);
    }
  });

  bindClick(doc, 'rf-btn-restore-backup', async () => {
    if (typeof host?.restoreBackupDatabase !== 'function') return;
    const res = await host.restoreBackupDatabase();
    if (res && !res.error) {
      setImportStatus(doc, zh ? '已从最近安全快照恢复数据。' : 'Restored database from latest backup snapshot.');
    } else {
      setImportStatus(doc, zh ? '未找到可用的本地备份快照。' : 'No local backup snapshot available.', true);
    }
  });

  bindClick(doc, 'rf-btn-export-diag', async () => {
    if (typeof host?.exportDiagnosticsFile !== 'function') return;
    const report = {
      app: 'Zotero PaperFlow',
      exportedAt: new Date().toISOString(),
      dataFilePath: typeof host?.getDataFilePath === 'function' ? host.getDataFilePath() : null,
      preferences: {
        windowMode: getPrefValue('windowMode'),
        defaultView: getPrefValue('defaultView'),
        language: getPrefValue('language'),
        theme: getPrefValue('theme'),
        autoSync: getPrefValue('autoSync'),
        autoBackupOnSave: getPrefValue('autoBackupOnSave')
      }
    };
    await host.exportDiagnosticsFile(report, win);
  });
}
