/* Zotero PaperFlow settings pane script for Zotero 10 ~ 12 */
window.ResearchFlow_Preferences = (() => {
  let initialized = false;
  const PREFIX = 'extensions.researchflow.';
  const HTML = 'http://www.w3.org/1999/xhtml';

  const DEFAULTS = {
    // 模块 1: 窗口与界面偏好
    windowMode: 'tab',
    defaultView: 'view-dashboard',
    language: 'en',
    theme: 'system',
    subwindowAlwaysOnTop: false,
    subwindowCompactMode: true,

    // 模块 2: 宿主与文献库集成
    enableItemPane: false,
    showContextMenu: false,
    enableReaderIntegration: true,
    syncStatusTags: false,
    locateOnManuscriptClick: true,
    autoLinkSelectedPaper: true,
    autoSyncChildNotes: true,
    autoAddToPipelineCollection: true,

    // 模块 3: 写作与审稿工作流
    showJournalPortals: true,
    collapseEmptyKanbanStages: false,
    defaultRebuttalExportFormat: 'latex',
    enableAcceptanceCelebration: true,

    // 模块 4: 数据存储与多云同步
    autoSync: true,
    autoBackupOnSave: true,
    importMode: 'merge'
  };

  const FIELDS = {
    window: [
      {
        key: 'windowMode',
        label: '工作区默认打开形态',
        desc: '选择从主工具栏图标或快捷键 (Ctrl+Alt+R) 唤起工作台时的首选窗口形态。',
        type: 'select',
        options: [
          ['tab', '📑 Zotero 内部主选项卡 (无缝融入主界面标签栏)'],
          ['subwindow', '🗗 伴读紧凑子窗口 (480×780，轻量悬浮，边读文献边跟踪进展)'],
          ['window', '⬚ 独立桌面大窗口 (1240×820，大屏全景规划)']
        ]
      },
      {
        key: 'defaultView',
        label: '工作区默认起始视图',
        desc: '打开工作台时默认定位的首屏功能模块。',
        type: 'select',
        options: [
          ['view-dashboard', '📊 仪表盘总览 (流向进度、时间线与统计概览)'],
          ['view-manuscripts', '🎯 手稿看板 (阶段流转与写作卡片跟踪)'],
          ['view-submissions', '🚀 投稿与同行评审 (期刊轮次、回复矩阵与学术导出)']
        ]
      },
      {
        key: 'language',
        label: '工作区显示语言',
        desc: '设置整个 PaperFlow 工作台与导出工具使用的界面语言。',
        type: 'select',
        options: [
          ['zh', '简体中文 (Chinese)'],
          ['en', 'English']
        ]
      },
      {
        key: 'theme',
        label: '界面外观主题',
        desc: '选择工作台与伴读窗的明暗配色方案。',
        type: 'select',
        options: [
          ['system', '🌓 跟随系统与宿主环境'],
          ['light', '☀️ 浅色模式 (Light)'],
          ['dark', '🌙 深色模式 (Dark)']
        ]
      },
      {
        key: 'subwindowAlwaysOnTop',
        label: '伴读子窗口始终置顶',
        desc: '开启后伴读窗口浮于所有窗口顶层，边阅读 PDF 原文边随时记录投稿灵感与审稿要点。',
        type: 'check'
      },
      {
        key: 'subwindowCompactMode',
        label: '伴读子窗口启用紧凑阅读排版',
        desc: '在小尺寸伴读窗口下隐藏大图与非必要留白，最大化可读面积。',
        type: 'check'
      }
    ],

    integration: [
      {
        key: 'enableItemPane',
        label: '在文献条目右侧信息面板中显示「稿件管线」卡片',
        desc: '在文献条目信息侧栏注入原生卡片，直接查看关联手稿状态、目标期刊并一键同步子笔记。默认关闭以保持主界面整洁。',
        type: 'check'
      },
      {
        key: 'showContextMenu',
        label: '在文献条目与分类集合右键菜单中显示快捷操作',
        desc: '在文献列表右键菜单提供「新建论文稿件管线」「关联到现有论文稿件」等快捷入口。',
        type: 'check'
      },
      {
        key: 'enableReaderIntegration',
        label: '在 PDF 阅读器中启用快捷选中文本/批注摘录',
        desc: '在 PDF 阅读器内支持通过右键或快捷键 (Ctrl+Shift+R) 将选中文本/批注快速摘录至手稿管线笔记。',
        type: 'check'
      },
      {
        key: 'syncStatusTags',
        label: '稿件流程状态更新时自动向 Zotero 条目同步彩色标签',
        desc: '开启后自动将稿件当前所处阶段（如 PaperFlow/04-同行审稿中）同步打在关联的 Zotero 文献条目上。默认关闭以防止污染文献标签云。',
        type: 'check'
      },
      {
        key: 'locateOnManuscriptClick',
        label: '工作台点击手稿时自动在 Zotero 文献库中定位对应条目',
        desc: '在工作台看板或投稿列表中点击已关联文献的手稿时，自动在 Zotero 主界面定位并高亮该文献。',
        type: 'check'
      },
      {
        key: 'autoLinkSelectedPaper',
        label: '跟踪新投稿时自动检测并载入 Zotero 当前选中文献',
        desc: '点击「+ 跟踪新投稿」时，自动检测 Zotero 当前选中的文献条目并提供一键载入元数据快捷浮条。',
        type: 'check'
      },
      {
        key: 'autoSyncChildNotes',
        label: '手稿流程更新或关联文献时自动同步更新 Zotero 子笔记',
        desc: '开启后自动将稿件进展与审稿矩阵同步写入文献条目的专属子笔记中。关闭后仅在用户手动点击「同步」时写入。',
        type: 'check'
      },
      {
        key: 'autoAddToPipelineCollection',
        label: '关联手稿时自动将文献条目归入「论文管线」分类集合',
        desc: '开启后自动在当前库中维护「🚀 Zotero PaperFlow 论文管线」分类目录并将关联文献归入其中。',
        type: 'check'
      }
    ],

    workflow: [
      {
        key: 'showJournalPortals',
        label: '在投稿管理界面顶部常驻显示常用期刊投稿入口停靠栏',
        desc: '在投稿与审稿管理视图顶部展示快捷期刊登录入口卡片（如 ACS、Wiley、Nature、APL 等）。',
        type: 'check'
      },
      {
        key: 'collapseEmptyKanbanStages',
        label: '手稿看板中无条目的空阶段列默认自动折叠',
        desc: '当某写作阶段（如选题大纲、图表初稿）没有手稿卡片时默认折叠隐藏，减少横向滚动。',
        type: 'check'
      },
      {
        key: 'defaultRebuttalExportFormat',
        label: '学术审稿回复信与自述信默认导出格式偏好',
        desc: '在导出学术审稿回复信与自述信模态框中默认预选的格式选项卡。',
        type: 'select',
        options: [
          ['latex', '📄 LaTeX 宏包答复信 (.tex with tcolorbox)'],
          ['word', '📝 Word / 富文本带格式 (可在 Word/WPS 中直接编辑)'],
          ['md', '📑 学术 Markdown 模版 (.md)'],
          ['table', '📊 意见与修改汇总表 (Markdown Table)']
        ]
      },
      {
        key: 'enableAcceptanceCelebration',
        label: '论文正式录用接收时播放全屏彩带动画与庆祝卡片',
        desc: '当稿件或投稿轮次状态变更为「已录用接收」时，弹出喜报卡片并播放彩带礼花动效。',
        type: 'check'
      }
    ],

    dataSync: [
      {
        key: 'autoSync',
        label: '本地科研数据保存后自动执行云端同步',
        desc: '在已配置有效 WebDAV 或 GitHub 私有仓库凭据的前提下，本地每次保存后自动在后台静默发起远端同步。',
        type: 'check'
      },
      {
        key: 'autoBackupOnSave',
        label: '本地科研数据保存时自动轮转生成安全灾备快照',
        desc: '本地每次提交保存时，自动在 Zotero 数据目录维护多份滚动版本历史快照，防止断电等意外导致数据损坏。',
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
          notifyConfigChanged(key, chk.checked);
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
          notifyConfigChanged(key, sel.value);
        });

        item.append(lbl, sel);

        if (desc) {
          const descEl = doc.createElementNS(HTML, 'div');
          descEl.className = 'rf-setting-desc';
          descEl.textContent = desc;
          item.appendChild(descEl);
        }

        container.appendChild(item);
      }
    });
  };

  const notifyConfigChanged = (key, value) => {
    try {
      if (Zotero?.ResearchFlow?._cachedData) {
        if (!Zotero.ResearchFlow._cachedData.settings) {
          Zotero.ResearchFlow._cachedData.settings = {};
        }
        Zotero.ResearchFlow._cachedData.settings[key] = value;
      }
      if (typeof Zotero?.ResearchFlow?.broadcastToClients === 'function') {
        Zotero.ResearchFlow.broadcastToClients({
          type: 'RESEARCHFLOW_PREF_CHANGED',
          key,
          value
        });
      }
      Zotero?.ResearchFlow?.notifyDataChanged?.();
      if (key === 'showContextMenu') {
        Zotero?.ResearchFlow?.updateItemContextMenu?.();
      } else if (key === 'enableReaderIntegration') {
        Zotero?.ResearchFlow?.updateReaderContextMenu?.();
      } else if (key === 'enableItemPane') {
        Zotero?.ResearchFlow?.updateItemPaneSection?.();
      }
    } catch (_) {}
  };

  return {
    init(window) {
      if (initialized) return;
      initialized = true;
      const doc = window.document;
      const status = doc.getElementById('rf-pref-status');
      Zotero?.ResearchFlow?.ensureLocalization?.(doc);
      setStatus(status, '首选项已就绪。所有更改将实时生效并保存。');

      // 模块 1 ~ 4 自动化渲染
      renderSection(doc, 'rf-pref-window', FIELDS.window);
      renderSection(doc, 'rf-pref-integration', FIELDS.integration);
      renderSection(doc, 'rf-pref-workflow', FIELDS.workflow);
      renderSection(doc, 'rf-pref-data-sync', FIELDS.dataSync);

      // 显示本地数据路径
      try {
        const pathLabel = doc.getElementById('rf-data-path-label');
        if (pathLabel && Zotero?.ResearchFlow?.getDataFilePath) {
          pathLabel.textContent = Zotero.ResearchFlow.getDataFilePath();
        }
      } catch (_) {}

      // 模块 1: 快捷唤起按钮组
      doc.getElementById('rf-btn-open-workspace')?.addEventListener('click', () => {
        Zotero?.ResearchFlow?.openResearchFlow?.({ currentWindowType: 'tab' }, window, 'tab');
      });
      doc.getElementById('rf-btn-open-subwindow')?.addEventListener('click', () => {
        Zotero?.ResearchFlow?.openStandaloneWindow?.({}, window, 'subwindow');
      });
      doc.getElementById('rf-btn-open-window')?.addEventListener('click', () => {
        Zotero?.ResearchFlow?.openStandaloneWindow?.({}, window, 'window');
      });

      // 模块 4: 云端同步设置入口
      doc.getElementById('rf-btn-open-cloud-settings')?.addEventListener('click', () => {
        Zotero?.ResearchFlow?.openResearchFlow?.({ view: 'view-settings' }, window, 'tab');
      });

      // 模块 4: 数据库全量导出
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

      // 模块 4: 数据库导入
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

      // 模块 4: 恢复上次导入前的紧急灾备快照
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

      // 模块 4: 比较并恢复冲突草稿
      doc.getElementById('rf-btn-conflict-recovery')?.addEventListener('click', () => {
        Zotero?.ResearchFlow?.openStandaloneWindow?.({ view: 'view-settings', settingsOnly: true }, window, 'window');
      });

      // 模块 5: 导出脱敏运行诊断报告
      doc.getElementById('rf-btn-export-diag')?.addEventListener('click', async () => {
        try {
          const db = await Zotero?.ResearchFlow?.loadDatabase?.();
          const diag = {
            exportedAt: new Date().toISOString(),
            zoteroVersion: Zotero.version,
            paperflowVersion: Zotero?.ResearchFlow?.version || '13.8.0',
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
    }
  };
})();

// 监听首选项 DOM 注入，确保首开即自愈初始化并防御性解绑
(() => {
  const paneId = 'researchflow-preferences-pane';
  const start = () => {
    if (!window.document.getElementById(paneId)) return false;
    window.ResearchFlow_Preferences.init(window);
    return true;
  };
  if (start()) return;

  const observer = new window.MutationObserver(() => {
    if (start()) {
      observer.disconnect();
      window.removeEventListener('unload', onUnload);
    }
  });

  const onUnload = () => {
    try { observer.disconnect(); } catch (_) {}
  };
  window.addEventListener('unload', onUnload, { once: true });

  observer.observe(window.document.documentElement, { childList: true, subtree: true });
})();
