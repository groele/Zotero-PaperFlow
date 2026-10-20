/* Zotero PaperFlow settings pane script for Zotero 7+ & 10 */
window.ResearchFlow_Preferences = (() => {
  let initialized = false;
  const PREFIX = 'extensions.researchflow.';
  const HTML = 'http://www.w3.org/1999/xhtml';

  const DEFAULTS = {
    // Window Modes
    windowMode: 'tab',
    subwindowAlwaysOnTop: false,
    showContextMenu: false
  };

  const FIELDS = {
    window: [
      {
        key: 'windowMode',
        label: '工作区默认打开模式',
        desc: '选择从主工具栏或快捷键唤起 Zotero PaperFlow 时的首选展现形态。',
        type: 'select',
        options: [
          ['tab', '📑 Zotero 内部选项卡 (无缝融入主界面标签栏)'],
          ['subwindow', '🗗 伴读紧凑子窗口 (480×780，轻量悬浮，边读文献边跟踪稿件)'],
          ['window', '⬚ 独立桌面大窗口 (1240×820，大屏全景规划)']
        ]
      },
      {
        key: 'subwindowAlwaysOnTop',
        label: '伴读子窗口始终置顶',
        desc: '开启后伴读窗口浮于所有窗口顶层，边阅读 PDF 原文边随时记录投稿灵感与审稿要点。',
        type: 'check'
      },
      {
        key: 'showContextMenu',
        label: '在文献右键菜单中显示快捷操作',
        desc: '默认关闭以保持 Zotero 主界面整洁。关闭时可通过工具栏按钮或快捷键快速操作。',
        type: 'check'
      }
    ]
  };

  const getPref = (key) => {
    try {
      if (typeof Zotero !== 'undefined' && Zotero.Prefs) {
        const val = Zotero.Prefs.get(`${PREFIX}${key}`, true);
        return val !== undefined ? val : DEFAULTS[key];
      }
    } catch (_) {}
    return DEFAULTS[key];
  };

  const setPref = (key, val) => {
    try {
      if (typeof Zotero !== 'undefined' && Zotero.Prefs) {
        Zotero.Prefs.set(`${PREFIX}${key}`, val, true);
      }
    } catch (_) {}
  };

  const setStatus = (element, message, error = false) => {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('rf-pref-error', error);
  };

  const renderSection = (doc, containerId, fields) => {
    const container = doc.getElementById(containerId);
    if (!container) return;
    container.replaceChildren();

    fields.forEach((field) => {
      const { key, label, desc, type, options } = field;
      const val = getPref(key);

      if (type === 'check') {
        const item = doc.createElementNS(HTML, 'div');
        item.className = 'rf-setting-item';

        const header = doc.createElementNS(HTML, 'label');
        header.className = 'rf-check-header';

        const chk = doc.createElementNS(HTML, 'input');
        chk.type = 'checkbox';
        chk.checked = Boolean(val);
        chk.addEventListener('change', () => {
          setPref(key, chk.checked);
          notifyConfigChanged();
        });

        const title = doc.createElementNS(HTML, 'span');
        title.className = 'rf-check-title';
        title.textContent = label;

        header.append(chk, title);
        item.appendChild(header);

        if (desc) {
          const descEl = doc.createElementNS(HTML, 'div');
          descEl.className = 'rf-setting-desc';
          descEl.textContent = desc;
          item.appendChild(descEl);
        }

        container.appendChild(item);
      } else if (type === 'select') {
        const item = doc.createElementNS(HTML, 'div');
        item.className = 'rf-control-row';

        const lbl = doc.createElementNS(HTML, 'label');
        lbl.className = 'rf-control-label';
        lbl.textContent = label;

        const sel = doc.createElementNS(HTML, 'select');
        sel.className = 'rf-control';
        options.forEach(([optVal, optLabel]) => {
          const opt = doc.createElementNS(HTML, 'option');
          opt.value = optVal;
          opt.textContent = optLabel;
          if (String(optVal) === String(val)) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.addEventListener('change', () => {
          setPref(key, sel.value);
          notifyConfigChanged();
        });

        item.append(lbl, sel);

        if (desc) {
          const descEl = doc.createElementNS(HTML, 'div');
          descEl.className = 'rf-setting-desc';
          descEl.style.margin = '4px 0 0 0';
          descEl.textContent = desc;
          item.appendChild(descEl);
        }

        container.appendChild(item);
      }
    });
  };

  const notifyConfigChanged = () => {
    try {
      Zotero?.ResearchFlow?.notifyDataChanged?.();
      Zotero?.ResearchFlow?.updateItemContextMenu?.();
    } catch (_) {}
  };

  return {
    init(window) {
      if (initialized) return;
      initialized = true;
      const doc = window.document;
      const status = doc.getElementById('rf-pref-status');
      setStatus(status, '首选项已就绪。所有更改将实时生效并保存。');

      renderSection(doc, 'rf-pref-window', FIELDS.window);

      // Display data path
      try {
        const pathLabel = doc.getElementById('rf-data-path-label');
        if (pathLabel && Zotero?.ResearchFlow?.getDataFilePath) {
          pathLabel.textContent = Zotero.ResearchFlow.getDataFilePath();
        }
      } catch (_) {}

      // Fast Launch Buttons
      doc.getElementById('rf-btn-open-workspace')?.addEventListener('click', () => {
        Zotero?.ResearchFlow?.openResearchFlow?.({ currentWindowType: 'tab' }, window, 'tab');
      });
      doc.getElementById('rf-btn-open-subwindow')?.addEventListener('click', () => {
        Zotero?.ResearchFlow?.openStandaloneWindow?.({}, window, 'subwindow');
      });
      doc.getElementById('rf-btn-open-window')?.addEventListener('click', () => {
        Zotero?.ResearchFlow?.openStandaloneWindow?.({}, window, 'window');
      });

      // Cloud settings shortcut
      doc.getElementById('rf-btn-open-cloud-settings')?.addEventListener('click', () => {
        Zotero?.ResearchFlow?.openResearchFlow?.({ view: 'view-settings' }, window, 'tab');
      });

      // Export Buttons
      doc.getElementById('rf-btn-export-db')?.addEventListener('click', async () => {
        try {
          if (!Zotero?.ResearchFlow?.exportDatabaseFile) throw new Error('PaperFlow 宿主尚未就绪');
          const result = await Zotero.ResearchFlow.exportDatabaseFile();
          if (result?.cancelled) return;
          if (!result?.success) throw new Error(result?.error || '数据库导出失败');
          setStatus(status, `✅ 数据库已导出至：${result.filePath}`);
        } catch (e) {
          setStatus(status, `❌ 导出失败：${e.message}`, true);
        }
      });

      doc.getElementById('rf-btn-export-diag')?.addEventListener('click', async () => {
        try {
          const db = await Zotero?.ResearchFlow?.loadDatabase?.();
          const diag = {
            exportedAt: new Date().toISOString(),
            zoteroVersion: Zotero.version,
            researchflowVersion: '12.2.0',
            schemaVersion: db?.schemaVersion,
            counts: {
              manuscripts: db?.manuscripts?.length || 0,
              submissions: db?.submissions?.length || 0,
              projects: db?.projects?.length || 0,
              tasks: db?.tasks?.length || 0
            }
          };
          if (!Zotero?.ResearchFlow?.exportDiagnosticsFile) throw new Error('PaperFlow 宿主尚未就绪');
          const result = await Zotero.ResearchFlow.exportDiagnosticsFile(diag);
          if (result?.cancelled) return;
          if (!result?.success) throw new Error(result?.error || '诊断报告导出失败');
          setStatus(status, `✅ 诊断报告已导出至：${result.filePath}`);
        } catch (e) {
          setStatus(status, `❌ 诊断报告导出失败：${e.message}`, true);
        }
      });

      // Import File Button
      doc.getElementById('rf-btn-import-file')?.addEventListener('click', async () => {
        const statusEl = doc.getElementById('rf-import-status');
        try {
          if (!Zotero?.ResearchFlow?.importDatabaseFile) throw new Error('PaperFlow 宿主尚未就绪');
          const mode = doc.getElementById('rf-import-mode')?.value || 'merge';
          const result = await Zotero.ResearchFlow.importDatabaseFile(mode);
          if (result?.cancelled) return;
          if (!result?.success) throw new Error(result?.error || '数据库导入失败');
          setStatus(statusEl, `✅ 导入成功！(${mode === 'merge' ? '已智能合并' : '已完全替换'}，当前共 ${result.data?.manuscripts?.length || 0} 个稿件管线)`);
        } catch (e) {
          setStatus(statusEl, `❌ 导入失败：${e.message}`, true);
        }
      });

      // Restore Backup Button
      doc.getElementById('rf-btn-restore-backup')?.addEventListener('click', async () => {
        const statusEl = doc.getElementById('rf-import-status');
        try {
          if (!Zotero?.ResearchFlow?.restoreBackupDatabase) throw new Error('PaperFlow 宿主尚未就绪');
          const res = await Zotero.ResearchFlow.restoreBackupDatabase();
          if (statusEl) {
            setStatus(statusEl, `✅ 备份恢复成功！(当前共 ${res?.manuscripts?.length || 0} 个稿件管线)`);
          }
        } catch (e) {
          setStatus(statusEl, `❌ 恢复备份失败：${e.message}`, true);
        }
      });
    }
  };
})();

// Zotero loads preference scripts before inserting the pane markup. Observe the
// insertion so every control is initialized on first open, even when XUL's
// synthetic showing event is not delivered to an imported HTML/XUL fragment.
(() => {
  const paneId = 'researchflow-preferences-pane';
  const start = () => {
    if (!window.document.getElementById(paneId)) return false;
    window.ResearchFlow_Preferences.init(window);
    return true;
  };
  if (start()) return;
  const observer = new window.MutationObserver(() => {
    if (start()) observer.disconnect();
  });
  observer.observe(window.document.documentElement, { childList: true, subtree: true });
})();
