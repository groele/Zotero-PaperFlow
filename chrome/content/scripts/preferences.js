/**
 * ----------------------------------------------------------------------------------
 * ⚡ AUTO-GENERATED BUNDLE BY ESBUILD - DO NOT EDIT DIRECTLY
 * ----------------------------------------------------------------------------------
 * Source authority: `src/` TypeScript modules (100% strictly <= 360 lines).
 * Target runtime: Gecko 153+ / Firefox 140+ (minify: false for Error Console audit)
 * ----------------------------------------------------------------------------------
 */
"use strict";
(() => {
  // src/modules/preferences/schema.ts
  var DEFAULTS = {
    // 模块 1: 窗口与界面偏好
    windowMode: "tab",
    defaultView: "view-dashboard",
    language: "en",
    theme: "system",
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
  var FIELDS = {
    window: [
      {
        key: "windowMode",
        label: "工作区默认打开形态",
        desc: "选择从主工具栏图标或快捷键 (Ctrl+Alt+R) 唤起工作台时的首选窗口形态。",
        l10nLabel: "researchflow-pref-field-window-mode-label",
        l10nDesc: "researchflow-pref-field-window-mode-desc",
        type: "select",
        options: [
          ["tab", "📑 Zotero 内部主选项卡 (无缝融入主界面标签栏)", "researchflow-pref-opt-window-mode-tab"],
          ["subwindow", "🗗 伴读紧凑子窗口 (480×780，轻量悬浮，边读文献边跟踪进展)", "researchflow-pref-opt-window-mode-subwindow"],
          ["window", "⬚ 独立桌面大窗口 (1240×820，大屏全景规划)", "researchflow-pref-opt-window-mode-window"]
        ]
      },
      {
        key: "defaultView",
        label: "工作区默认起始视图",
        desc: "打开工作台时默认定位的首屏功能模块。",
        l10nLabel: "researchflow-pref-field-default-view-label",
        l10nDesc: "researchflow-pref-field-default-view-desc",
        type: "select",
        options: [
          ["view-dashboard", "📊 仪表盘总览 (流向进度、时间线与统计概览)", "researchflow-pref-opt-default-view-dashboard"],
          ["view-manuscripts", "🎯 手稿看板 (阶段流转与写作卡片跟踪)", "researchflow-pref-opt-default-view-manuscripts"],
          ["view-submissions", "🚀 投稿与同行评审 (期刊轮次、回复矩阵与学术导出)", "researchflow-pref-opt-default-view-submissions"]
        ]
      },
      {
        key: "language",
        label: "工作区显示语言",
        desc: "设置整个 PaperFlow 工作台与导出工具使用的界面语言。",
        l10nLabel: "researchflow-pref-field-language-label",
        l10nDesc: "researchflow-pref-field-language-desc",
        type: "select",
        options: [
          ["zh", "简体中文 (Chinese)", "researchflow-pref-opt-language-zh"],
          ["en", "English", "researchflow-pref-opt-language-en"]
        ]
      },
      {
        key: "theme",
        label: "界面外观主题",
        desc: "选择工作台与伴读窗的明暗配色方案。",
        l10nLabel: "researchflow-pref-field-theme-label",
        l10nDesc: "researchflow-pref-field-theme-desc",
        type: "select",
        options: [
          ["system", "🌓 跟随系统与宿主环境", "researchflow-pref-opt-theme-system"],
          ["light", "☀️ 浅色模式 (Light)", "researchflow-pref-opt-theme-light"],
          ["dark", "🌙 深色模式 (Dark)", "researchflow-pref-opt-theme-dark"]
        ]
      },
      {
        key: "subwindowAlwaysOnTop",
        label: "伴读子窗口始终置顶",
        desc: "开启后伴读窗口浮于所有窗口顶层，边阅读 PDF 原文边随时记录投稿灵感与审稿要点。",
        l10nLabel: "researchflow-pref-field-subwindow-always-on-top-label",
        l10nDesc: "researchflow-pref-field-subwindow-always-on-top-desc",
        type: "check"
      },
      {
        key: "subwindowCompactMode",
        label: "伴读子窗口紧凑模式",
        desc: "开启后自动隐藏侧边栏与冗余装饰边距，最大化手稿卡片与审稿意见的可视区域。",
        l10nLabel: "researchflow-pref-field-subwindow-compact-mode-label",
        l10nDesc: "researchflow-pref-field-subwindow-compact-mode-desc",
        type: "check"
      }
    ],
    integration: [
      {
        key: "enableItemPane",
        label: "文献详情侧栏集成 (ItemPane Section)",
        desc: "在右侧文献信息栏展示 PaperFlow 手稿管线卡片、目标期刊与修回进度。",
        l10nLabel: "researchflow-pref-field-enable-item-pane-label",
        l10nDesc: "researchflow-pref-field-enable-item-pane-desc",
        type: "check"
      },
      {
        key: "showContextMenu",
        label: "文献列表右键菜单 (Context Menu)",
        desc: "在文献右键菜单中提供“基于此文献创建手稿管线”及“关联至已有稿件”快捷指令。",
        l10nLabel: "researchflow-pref-field-show-context-menu-label",
        l10nDesc: "researchflow-pref-field-show-context-menu-desc",
        type: "check"
      },
      {
        key: "enableReaderIntegration",
        label: "PDF 阅读器划选摘录 (PDF Reader Excerpt)",
        desc: "在内置 PDF 阅读器划选文字或批注时，右键浮窗提供一键发送至手稿撰写笔记。",
        l10nLabel: "researchflow-pref-field-enable-reader-integration-label",
        l10nDesc: "researchflow-pref-field-enable-reader-integration-desc",
        type: "check"
      },
      {
        key: "syncStatusTags",
        label: "手稿阶段自动同步标签 (Status Tags)",
        desc: "流转稿件状态时，自动为对应 Zotero 文献打上 PaperFlow/01-选题大纲 等层级标签。",
        l10nLabel: "researchflow-pref-field-sync-status-tags-label",
        l10nDesc: "researchflow-pref-field-sync-status-tags-desc",
        type: "check"
      },
      {
        key: "locateOnManuscriptClick",
        label: "点击手稿卡片自动定位文献库条目",
        desc: "在看板或列表点击已关联文献的手稿时，主界面列表自动选中对应文献条目。",
        l10nLabel: "researchflow-pref-field-locate-on-manuscript-click-label",
        l10nDesc: "researchflow-pref-field-locate-on-manuscript-click-desc",
        type: "check"
      },
      {
        key: "autoLinkSelectedPaper",
        label: "新建手稿时自动关联当前选中文献",
        desc: "从工具栏或全局菜单创建手稿时，若主界面正选中文献条目，自动预填标题并绑定关联。",
        l10nLabel: "researchflow-pref-field-auto-link-selected-paper-label",
        l10nDesc: "researchflow-pref-field-auto-link-selected-paper-desc",
        type: "check"
      },
      {
        key: "autoSyncChildNotes",
        label: "自动将手稿进展与回复矩阵同步至条目子笔记",
        desc: "保存手稿或修回矩阵时，自动在 Zotero 文献条目下创建/更新富文本子笔记，便于多端同步。",
        l10nLabel: "researchflow-pref-field-auto-sync-child-notes-label",
        l10nDesc: "researchflow-pref-field-auto-sync-child-notes-desc",
        type: "check"
      },
      {
        key: "autoAddToPipelineCollection",
        label: "流转手稿时自动归入 📝 投稿管线 虚拟分类",
        desc: "为进入实际撰写与投稿阶段的文献在对应文库创建统一分类目录，集中归拢管线成果。",
        l10nLabel: "researchflow-pref-field-auto-add-to-pipeline-collection-label",
        l10nDesc: "researchflow-pref-field-auto-add-to-pipeline-collection-desc",
        type: "check"
      }
    ],
    workflow: [
      {
        key: "showJournalPortals",
        label: "投稿轮次展示期刊一键导航与官方投稿入口",
        desc: "在投稿轮次卡片中提供 Elsevier, Springer, Nature, IEEE 等出版商一键查重与系统直达。",
        l10nLabel: "researchflow-pref-field-show-journal-portals-label",
        l10nDesc: "researchflow-pref-field-show-journal-portals-desc",
        type: "check"
      },
      {
        key: "collapseEmptyKanbanStages",
        label: "手稿看板自动折叠暂无卡片的空阶段列",
        desc: "精简大屏横向视野，仅聚焦当前有在研或审稿手稿的活跃阶段。",
        l10nLabel: "researchflow-pref-field-collapse-empty-kanban-stages-label",
        l10nDesc: "researchflow-pref-field-collapse-empty-kanban-stages-desc",
        type: "check"
      },
      {
        key: "defaultRebuttalExportFormat",
        label: "审稿回复函 (Point-by-Point) 默认导出格式",
        desc: "一键生成作者回应时的首选文档排版规范。",
        l10nLabel: "researchflow-pref-field-default-rebuttal-export-format-label",
        l10nDesc: "researchflow-pref-field-default-rebuttal-export-format-desc",
        type: "select",
        options: [
          ["latex", "LaTeX 论文审稿回复专用模板 (.tex)", "researchflow-pref-opt-rebuttal-format-latex"],
          ["markdown", "Markdown 标准格式 (.md，兼容 Typora 与 Obsidian)", "researchflow-pref-opt-rebuttal-format-markdown"],
          ["html", "HTML 打印就绪回复信 (.html)", "researchflow-pref-opt-rebuttal-format-html"]
        ]
      },
      {
        key: "enableAcceptanceCelebration",
        label: "手稿录用 (Accepted) 时播放科研礼炮庆祝动画",
        desc: "当将手稿阶段拖拽或更新至已录用时，触发全屏礼花彩带动画，致敬严谨科研成果。",
        l10nLabel: "researchflow-pref-field-enable-acceptance-celebration-label",
        l10nDesc: "researchflow-pref-field-enable-acceptance-celebration-desc",
        type: "check"
      }
    ],
    storage: [
      {
        key: "autoSync",
        label: "工作台数据变更自动保存至本地磁盘",
        desc: "每次编辑卡片、填写审稿回复后自动进行原子写入，确保无惧异常断电或关闭。",
        l10nLabel: "researchflow-pref-field-auto-sync-label",
        l10nDesc: "researchflow-pref-field-auto-sync-desc",
        type: "check"
      },
      {
        key: "autoBackupOnSave",
        label: "保存时自动生成安全快照 (Backup Snapshot)",
        desc: "在 Zotero 数据目录维护多历史副本，供随时灾备还原与多端冲突检测。",
        l10nLabel: "researchflow-pref-field-auto-backup-on-save-label",
        l10nDesc: "researchflow-pref-field-auto-backup-on-save-desc",
        type: "check"
      },
      {
        key: "importMode",
        label: "外部备份导入默认策略",
        desc: "从 JSON 备份文件恢复数据时采用的合并机制。",
        l10nLabel: "researchflow-pref-field-import-mode-label",
        l10nDesc: "researchflow-pref-field-import-mode-desc",
        type: "select",
        options: [
          ["merge", "🔀 增量安全合并 (按更新时间戳保留更新记录，保留现有独有手稿)", "researchflow-pref-opt-import-mode-merge"],
          ["overwrite", "⚠️ 完全覆盖模式 (清空当前全部手稿与投稿记录，严格以导入文件为准)", "researchflow-pref-opt-import-mode-overwrite"]
        ]
      }
    ]
  };

  // src/modules/preferences/controller.ts
  function getPrefValue(key) {
    if (typeof Zotero === "undefined" || !Zotero.Prefs) {
      return DEFAULTS[key];
    }
    const val = Zotero.Prefs.get(`extensions.researchflow.${key}`, true);
    return val !== void 0 && val !== null ? val : DEFAULTS[key];
  }
  function setPrefValue(key, value) {
    if (typeof Zotero === "undefined" || !Zotero.Prefs) return;
    Zotero.Prefs.set(`extensions.researchflow.${key}`, value, true);
  }
  function buildSettingRow(field, doc) {
    const row = doc.createElement("div");
    row.className = "rf-pref-row";
    row.id = `rf-pref-row-${field.key}`;
    const info = doc.createElement("div");
    info.className = "rf-pref-info";
    const label = doc.createElement("div");
    label.className = "rf-pref-label";
    if (field.l10nLabel) {
      label.setAttribute("data-l10n-id", field.l10nLabel);
      if (!doc.l10n) label.textContent = field.label;
    } else {
      label.textContent = field.label;
    }
    const desc = doc.createElement("div");
    desc.className = "rf-pref-desc";
    if (field.l10nDesc) {
      desc.setAttribute("data-l10n-id", field.l10nDesc);
      if (!doc.l10n) desc.textContent = field.desc;
    } else {
      desc.textContent = field.desc;
    }
    info.appendChild(label);
    info.appendChild(desc);
    row.appendChild(info);
    const ctrl = doc.createElement("div");
    ctrl.className = "rf-pref-ctrl";
    const currentVal = getPrefValue(field.key);
    if (field.type === "check") {
      const input = doc.createElement("input");
      input.type = "checkbox";
      input.id = `rf-pref-${field.key}`;
      input.checked = Boolean(currentVal);
      input.addEventListener("change", () => {
        setPrefValue(field.key, input.checked);
        updateSubordinateStates(doc);
      });
      ctrl.appendChild(input);
    } else if (field.type === "select") {
      const select = doc.createElement("select");
      select.id = `rf-pref-${field.key}`;
      for (const [val, text, l10nId] of field.options) {
        const opt = doc.createElement("option");
        opt.value = val;
        if (l10nId) {
          opt.setAttribute("data-l10n-id", l10nId);
          if (!doc.l10n) opt.textContent = text;
        } else {
          opt.textContent = text;
        }
        if (val === currentVal) opt.selected = true;
        select.appendChild(opt);
      }
      select.addEventListener("change", () => {
        setPrefValue(field.key, select.value);
      });
      ctrl.appendChild(select);
    }
    row.appendChild(ctrl);
    return row;
  }
  function updateSubordinateStates(doc) {
    const windowMode = getPrefValue("windowMode");
    const subCompactRow = doc.getElementById("rf-pref-row-subwindowCompactMode");
    const subTopRow = doc.getElementById("rf-pref-row-subwindowAlwaysOnTop");
    const isSubwindow = windowMode === "subwindow";
    if (subCompactRow) {
      subCompactRow.classList.toggle("rf-disabled", !isSubwindow);
      const input = subCompactRow.querySelector("input");
      if (input) input.disabled = !isSubwindow;
    }
    if (subTopRow) {
      subTopRow.classList.toggle("rf-disabled", !isSubwindow);
      const input = subTopRow.querySelector("input");
      if (input) input.disabled = !isSubwindow;
    }
  }
  function renderPreferencesSection(containerId, sectionKey, doc) {
    const container = doc.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    const fields = FIELDS[sectionKey] || [];
    for (const field of fields) {
      container.appendChild(buildSettingRow(field, doc));
    }
    try {
      doc.l10n?.translateFragment?.(container);
    } catch (_) {
    }
  }
  function getSectionContainerId(doc, primaryId, legacyId) {
    return doc.getElementById(primaryId) ? primaryId : legacyId;
  }
  function initPreferencesWindow(win) {
    const doc = win.document;
    renderPreferencesSection(getSectionContainerId(doc, "rf-pref-window", "rf-window-settings-list"), "window", doc);
    renderPreferencesSection(getSectionContainerId(doc, "rf-pref-integration", "rf-integration-settings-list"), "integration", doc);
    renderPreferencesSection(getSectionContainerId(doc, "rf-pref-workflow", "rf-workflow-settings-list"), "workflow", doc);
    renderPreferencesSection(getSectionContainerId(doc, "rf-pref-data-sync", "rf-storage-settings-list"), "storage", doc);
    updateSubordinateStates(doc);
    const windowModeSelect = doc.getElementById("rf-pref-windowMode");
    if (windowModeSelect) {
      windowModeSelect.addEventListener("change", () => {
        updateSubordinateStates(doc);
      });
    }
    const zotero = typeof Zotero !== "undefined" ? Zotero : win.Zotero;
    const hostWin = win;
    if (hostWin._rfPrefObserverSymbol && zotero?.Prefs?.unregisterObserver) {
      try {
        zotero.Prefs.unregisterObserver(hostWin._rfPrefObserverSymbol);
      } catch (_) {
      }
      hostWin._rfPrefObserverSymbol = null;
    }
    if (zotero?.Prefs?.registerObserver) {
      try {
        const sym = /* @__PURE__ */ Symbol("ResearchFlowPrefPaneObserver");
        hostWin._rfPrefObserverSymbol = sym;
        zotero.Prefs.registerObserver("extensions.researchflow.", (pref) => {
          const prefix = "extensions.researchflow.";
          const key = pref && pref.startsWith(prefix) ? pref.slice(prefix.length) : pref;
          if (key) {
            const ctrl = doc.getElementById(`rf-pref-${key}`);
            const nextVal = getPrefValue(key);
            if (ctrl) {
              if (ctrl.type === "checkbox") ctrl.checked = Boolean(nextVal);
              else if ("value" in ctrl) ctrl.value = nextVal;
            }
          }
          updateSubordinateStates(doc);
        }, sym);
        if (!hostWin._rfPrefUnloadBound && typeof win.addEventListener === "function") {
          hostWin._rfPrefUnloadBound = true;
          win.addEventListener("unload", () => {
            if (hostWin._rfPrefObserverSymbol && zotero?.Prefs?.unregisterObserver) {
              try {
                zotero.Prefs.unregisterObserver(hostWin._rfPrefObserverSymbol);
              } catch (_) {
              }
              hostWin._rfPrefObserverSymbol = null;
            }
          }, { once: true });
        }
      } catch (_) {
      }
    }
    const resetBtn = doc.getElementById("rf-btn-reset-defaults");
    if (resetBtn && !resetBtn.dataset?.rfBound) {
      if (resetBtn.dataset) resetBtn.dataset.rfBound = "true";
      resetBtn.addEventListener("click", () => {
        if (zotero?.Prefs) {
          for (const [key, val] of Object.entries(DEFAULTS)) {
            zotero.Prefs.set(`extensions.researchflow.${key}`, val, true);
          }
          initPreferencesWindow(win);
        }
      });
    }
  }

  // src/modules/preferences.ts
  var ResearchFlow_Preferences = {
    DEFAULTS,
    FIELDS,
    getPrefValue,
    setPrefValue,
    buildSettingRow,
    updateSubordinateStates,
    renderPreferencesSection,
    init: initPreferencesWindow,
    initPreferencesWindow
  };
  if (typeof window !== "undefined") {
    window.ResearchFlow_Preferences = ResearchFlow_Preferences;
    window.initPreferencesWindow = initPreferencesWindow;
    window.DEFAULTS = DEFAULTS;
    window.FIELDS = FIELDS;
  }
})();
