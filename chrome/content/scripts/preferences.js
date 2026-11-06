"use strict";
(() => {
  // src/modules/preferences.ts
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
        label: "新建手稿时自动关联当前选中的文献",
        desc: "若在主界面选中了某篇文献后打开新建弹窗，自动预填标题、作者、DOI 并建立关联。",
        l10nLabel: "researchflow-pref-field-auto-link-selected-paper-label",
        l10nDesc: "researchflow-pref-field-auto-link-selected-paper-desc",
        type: "check"
      },
      {
        key: "autoSyncChildNotes",
        label: "手稿更新自动同步云端子笔记 (Child Notes)",
        desc: "重要进展自动生成或更新标准 Zotero 文献子笔记，利用官方同步服务实现多端查看。",
        l10nLabel: "researchflow-pref-field-auto-sync-child-notes-label",
        l10nDesc: "researchflow-pref-field-auto-sync-child-notes-desc",
        type: "check"
      },
      {
        key: "autoAddToPipelineCollection",
        label: "自动将手稿文献归入专用分类 (Collection)",
        desc: "新建手稿时自动将关联条目放入“PaperFlow 写作管线”分类，方便集中筛选归档。",
        l10nLabel: "researchflow-pref-field-auto-add-to-pipeline-collection-label",
        l10nDesc: "researchflow-pref-field-auto-add-to-pipeline-collection-desc",
        type: "check"
      }
    ],
    workflow: [
      {
        key: "showJournalPortals",
        label: "投稿系统快速跳转导航 (Journal Portals)",
        desc: "在投稿管理视图顶部常驻 ACS, Wiley, Nature 等各大出版社投审稿系统直达链接。",
        l10nLabel: "researchflow-pref-field-show-journal-portals-label",
        l10nDesc: "researchflow-pref-field-show-journal-portals-desc",
        type: "check"
      },
      {
        key: "collapseEmptyKanbanStages",
        label: "手稿看板自动折叠无卡片阶段",
        desc: "当某个阶段（如“组内评审”）无进行中稿件时自动紧凑折叠，节省横向滚动空间。",
        l10nLabel: "researchflow-pref-field-collapse-empty-kanban-stages-label",
        l10nDesc: "researchflow-pref-field-collapse-empty-kanban-stages-desc",
        type: "check"
      },
      {
        key: "defaultRebuttalExportFormat",
        label: "审稿回复矩阵 (Rebuttal) 默认导出格式",
        desc: "导出点对点作者回复信时的首选排版模板。",
        l10nLabel: "researchflow-pref-field-default-rebuttal-export-format-label",
        l10nDesc: "researchflow-pref-field-default-rebuttal-export-format-desc",
        type: "select",
        options: [
          ["latex", "LaTeX (*.tex，含 tcolorbox 彩色意见框与学术版面)", "researchflow-pref-opt-rebuttal-latex"],
          ["markdown", "Markdown (*.md，标准学术排版与审稿人表格)", "researchflow-pref-opt-rebuttal-markdown"],
          ["html", "Word 友好网页 (*.html，支持直接复制粘贴至 MS Word)", "researchflow-pref-opt-rebuttal-html"]
        ]
      },
      {
        key: "enableAcceptanceCelebration",
        label: "手稿被接收时的彩带庆祝动效 (Celebration)",
        desc: "当稿件流转至“已接收 (Accepted)”状态时，全屏播放学术喜报礼花动画。",
        l10nLabel: "researchflow-pref-field-enable-acceptance-celebration-label",
        l10nDesc: "researchflow-pref-field-enable-acceptance-celebration-desc",
        type: "check"
      }
    ],
    storage: [
      {
        key: "autoSync",
        label: "修改后自动保存并触发多云同步",
        desc: "在工作台进行任何编辑操作后，自动持久化至本地 JSON 并按配置调度 WebDAV/GitHub 同步。",
        l10nLabel: "researchflow-pref-field-auto-sync-label",
        l10nDesc: "researchflow-pref-field-auto-sync-desc",
        type: "check"
      },
      {
        key: "autoBackupOnSave",
        label: "关键操作前自动保留独立灾备快照",
        desc: "在全量导入或执行冲突覆盖前，自动在数据目录生成备份快照（可一键安全回退）。",
        l10nLabel: "researchflow-pref-field-auto-backup-on-save-label",
        l10nDesc: "researchflow-pref-field-auto-backup-on-save-desc",
        type: "check"
      },
      {
        key: "importMode",
        label: "外部数据导入默认策略",
        desc: "从 JSON 文件导入手稿数据时的合并规则。",
        l10nLabel: "researchflow-pref-field-import-mode-label",
        l10nDesc: "researchflow-pref-field-import-mode-desc",
        type: "select",
        options: [
          ["merge", "🔀 智能双向合并 (保留本地与外部较新版本，安全优先)", "researchflow-pref-opt-import-mode-merge"],
          ["replace", "⚠️ 完全覆盖替换 (清除当前工作区所有既有数据)", "researchflow-pref-opt-import-mode-replace"]
        ]
      }
    ]
  };
  var PREFIX = "extensions.researchflow.";
  var HTML = "http://www.w3.org/1999/xhtml";
  var ResearchFlow_Preferences = {
    init(windowContext) {
      const doc = windowContext?.document;
      if (!doc) return;
      const setStatus = (el, msg, isError = false) => {
        if (!el) return;
        el.textContent = msg;
        el.style.color = isError ? "var(--material-error, #d9383a)" : "var(--material-success, #2e7d32)";
        setTimeout(() => {
          if (el) el.textContent = "";
        }, 4500);
      };
      const getPref = (key) => {
        try {
          if (Zotero.Prefs) {
            const val = Zotero.Prefs.get(`${PREFIX}${key}`, true);
            return val !== void 0 ? val : DEFAULTS[key];
          }
        } catch (_) {
        }
        return DEFAULTS[key];
      };
      const setPref = (key, val) => {
        try {
          if (Zotero.Prefs) {
            Zotero.Prefs.set(`${PREFIX}${key}`, val, true);
          }
        } catch (_) {
        }
      };
      const renderGroup = (containerId, groupKey) => {
        const container = doc.getElementById(containerId);
        if (!container) return;
        container.replaceChildren();
        const fields = FIELDS[groupKey] || [];
        fields.forEach((field) => {
          const row = doc.createElementNS(HTML, "div");
          row.className = "rf-pref-row";
          if (field.subordinate) row.classList.add("subordinate-row");
          const info = doc.createElementNS(HTML, "div");
          info.className = "rf-pref-info";
          const label = doc.createElementNS(HTML, "label");
          label.className = "rf-pref-label";
          if (field.l10nLabel) label.setAttribute("data-l10n-id", field.l10nLabel);
          label.textContent = field.label;
          const desc = doc.createElementNS(HTML, "div");
          desc.className = "rf-pref-desc";
          if (field.l10nDesc) desc.setAttribute("data-l10n-id", field.l10nDesc);
          desc.textContent = field.desc;
          info.append(label, desc);
          const ctrl = doc.createElementNS(HTML, "div");
          ctrl.className = "rf-pref-ctrl";
          if (field.type === "check") {
            const checkbox = doc.createElementNS(HTML, "input");
            checkbox.type = "checkbox";
            checkbox.id = `rf-pref-${field.key}`;
            checkbox.checked = Boolean(getPref(field.key));
            checkbox.addEventListener("change", () => {
              setPref(field.key, checkbox.checked);
              updateDependencies();
            });
            ctrl.append(checkbox);
          } else if (field.type === "select") {
            const select = doc.createElementNS(HTML, "select");
            select.id = `rf-pref-${field.key}`;
            field.options.forEach(([optVal, optLabel, optL10n]) => {
              const opt = doc.createElementNS(HTML, "option");
              opt.value = optVal;
              if (optL10n) opt.setAttribute("data-l10n-id", optL10n);
              opt.textContent = optLabel;
              select.append(opt);
            });
            select.value = String(getPref(field.key));
            select.addEventListener("change", () => {
              setPref(field.key, select.value);
              updateDependencies();
            });
            ctrl.append(select);
          }
          row.append(info, ctrl);
          container.append(row);
        });
      };
      const updateDependencies = () => {
      };
      renderGroup("rf-pref-window-container", "window");
      renderGroup("rf-pref-integration-container", "integration");
      renderGroup("rf-pref-workflow-container", "workflow");
      renderGroup("rf-pref-storage-container", "storage");
      updateDependencies();
      doc.getElementById("rf-btn-reset-defaults")?.addEventListener("click", () => {
        Object.entries(DEFAULTS).forEach(([key, val]) => {
          setPref(key, val);
        });
        renderGroup("rf-pref-window-container", "window");
        renderGroup("rf-pref-integration-container", "integration");
        renderGroup("rf-pref-workflow-container", "workflow");
        renderGroup("rf-pref-storage-container", "storage");
        updateDependencies();
      });
      doc.getElementById("rf-btn-open-workspace")?.addEventListener("click", () => {
        Zotero?.ResearchFlow?.openResearchFlow?.({ currentWindowType: "tab" }, windowContext, "tab");
      });
      doc.getElementById("rf-btn-open-subwindow")?.addEventListener("click", () => {
        Zotero?.ResearchFlow?.openStandaloneWindow?.({}, windowContext, "subwindow");
      });
      doc.getElementById("rf-btn-open-window")?.addEventListener("click", () => {
        Zotero?.ResearchFlow?.openStandaloneWindow?.({}, windowContext, "window");
      });
      doc.getElementById("rf-btn-open-cloud-settings")?.addEventListener("click", () => {
        Zotero?.ResearchFlow?.openResearchFlow?.({ view: "view-settings" }, windowContext, "tab");
      });
      doc.getElementById("rf-btn-export-db")?.addEventListener("click", async () => {
        const status = doc.getElementById("rf-import-status");
        try {
          if (!Zotero?.ResearchFlow?.exportDatabaseFile) throw new Error("PaperFlow 宿主尚未就绪");
          const result = await Zotero.ResearchFlow.exportDatabaseFile();
          if (result?.cancelled) return;
          if (!result?.success) throw new Error(result?.error || "数据库导出失败");
          setStatus(status, `✅ 数据库已导出至：${result.filePath}`);
        } catch (e) {
          setStatus(status, `❌ 导出失败：${e.message}`, true);
        }
      });
      doc.getElementById("rf-btn-import-file")?.addEventListener("click", async () => {
        const statusEl = doc.getElementById("rf-import-status");
        try {
          if (!Zotero?.ResearchFlow?.importDatabaseFile) throw new Error("PaperFlow 宿主尚未就绪");
          const mode = doc.getElementById("rf-import-mode")?.value || "merge";
          const result = await Zotero.ResearchFlow.importDatabaseFile(mode);
          if (result?.cancelled) return;
          if (!result?.success) throw new Error(result?.error || "数据库导入失败");
          setStatus(statusEl, `✅ 导入成功！(${mode === "merge" ? "已智能合并" : "已完全替换"}，当前共 ${result.data?.manuscripts?.length || 0} 个稿件管线)`);
        } catch (e) {
          setStatus(statusEl, `❌ 导入失败：${e.message}`, true);
        }
      });
      doc.getElementById("rf-btn-restore-backup")?.addEventListener("click", async () => {
        const statusEl = doc.getElementById("rf-import-status");
        try {
          if (!Zotero?.ResearchFlow?.restoreBackupDatabase) throw new Error("PaperFlow 宿主尚未就绪");
          const res = await Zotero.ResearchFlow.restoreBackupDatabase();
          if (statusEl) {
            setStatus(statusEl, `✅ 备份恢复成功！(当前共 ${res?.manuscripts?.length || 0} 个稿件管线)`);
          }
        } catch (e) {
          setStatus(statusEl, `❌ 恢复备份失败：${e.message}`, true);
        }
      });
      doc.getElementById("rf-btn-conflict-recovery")?.addEventListener("click", () => {
        Zotero?.ResearchFlow?.openStandaloneWindow?.({ view: "view-settings", settingsOnly: true }, windowContext, "window");
      });
      doc.getElementById("rf-btn-export-diag")?.addEventListener("click", async () => {
        const status = doc.getElementById("rf-import-status");
        try {
          const db = await Zotero?.ResearchFlow?.loadDatabase?.();
          const diag = {
            exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
            zoteroVersion: Zotero.version,
            paperflowVersion: Zotero?.ResearchFlow?.version || "15.0.0",
            schemaVersion: db?.schemaVersion,
            counts: {
              manuscripts: db?.manuscripts?.length || 0,
              submissions: db?.submissions?.length || 0,
              projects: db?.projects?.length || 0,
              tasks: db?.tasks?.length || 0
            }
          };
          if (!Zotero?.ResearchFlow?.exportDiagnosticsFile) throw new Error("PaperFlow 宿主尚未就绪");
          const result = await Zotero.ResearchFlow.exportDiagnosticsFile(diag);
          if (result?.cancelled) return;
          if (!result?.success) throw new Error(result?.error || "诊断报告导出失败");
          setStatus(status, `✅ 诊断报告已导出至：${result.filePath}`);
        } catch (e) {
          setStatus(status, `❌ 诊断报告导出失败：${e.message}`, true);
        }
      });
    }
  };
  if (typeof window !== "undefined") {
    window.ResearchFlow_Preferences = ResearchFlow_Preferences;
    const paneId = "researchflow-preferences-pane";
    const start = () => {
      if (!window.document.getElementById(paneId)) return false;
      ResearchFlow_Preferences.init(window);
      return true;
    };
    if (!start()) {
      const observer = new window.MutationObserver(() => {
        if (start()) {
          observer.disconnect();
          window.removeEventListener("unload", onUnload);
        }
      });
      const onUnload = () => {
        try {
          observer.disconnect();
        } catch (_) {
        }
      };
      window.addEventListener("unload", onUnload, { once: true });
      observer.observe(window.document.documentElement, { childList: true, subtree: true });
    }
  }
  if (typeof globalThis !== "undefined") {
    globalThis.ResearchFlow_Preferences = ResearchFlow_Preferences;
  }
})();
