researchflow-menu-open = Zotero PaperFlow 科研工作台
researchflow-menu-preferences = Zotero PaperFlow 偏好设置...
researchflow-toolbar-tooltip = 打开 Zotero PaperFlow 工作台 (Ctrl+Alt+R)
    .tooltiptext = 打开 Zotero PaperFlow 工作台 (Ctrl+Alt+R)
researchflow-item-menu-create = 新建论文稿件管线
researchflow-item-menu-link = 关联到现有论文稿件
researchflow-collection-menu-create = 为此分类创建论文稿件管线
researchflow-reader-add-record = 将选中文本/批注添加至稿件管线 (Ctrl+Shift+R)
researchflow-item-pane-header = 稿件管线
    .label = 稿件管线
    .tooltiptext = Zotero PaperFlow 论文稿件管线与期刊投稿管理
researchflow-item-pane-sidenav =
    .label =
    .tooltiptext = Zotero PaperFlow 论文稿件管线与期刊投稿管理
    .aria-label = 稿件管线
researchflow-item-pane-count =
    { $count ->
        [0] 此文献尚未关联稿件管线
       *[other] 已关联 { $count } 个论文稿件管线
    }
researchflow-item-pane-create = 新建稿件管线
researchflow-item-pane-open-workspace = 打开 Zotero PaperFlow 工作台
researchflow-item-pane-sync-note = 📝 同步为文献笔记
researchflow-item-pane-open-pdf = 📖 打开 PDF 伴读
researchflow-item-pane-status-drafting = 初稿撰写中
researchflow-item-pane-status-under-review = 审稿中
researchflow-item-pane-status-revision = 修回修订中
researchflow-item-pane-status-accepted = 已录用
researchflow-item-pane-status-published = 已发表
researchflow-database-invalid-backup = 所选文件不是 Zotero PaperFlow 数据库备份。
researchflow-database-recovery-invalid = 无法识别此冲突草稿或恢复请求。原文件已保留。
researchflow-database-recovery-size = 草稿过大或变更超过 500 项，无法安全显示。请保留原文件并分批处理。
researchflow-database-recovery-expired = 恢复预览已失效或已使用，请重新打开草稿并预览。
researchflow-database-recovery-resolved = 此草稿已完成恢复，原草稿与恢复前备份仍然保留。
researchflow-database-recovery-base = 此草稿缺少基线，无法逐字段比较。原草稿已保留，请使用备份或人工核对。
researchflow-database-recovery-stale = 数据或草稿已发生变化。请重新打开草稿，核验最新值后再恢复。
researchflow-database-recovery-choice = 请为每个冲突字段明确选择基线、本地或当前值。
researchflow-database-recovery-empty = 预览没有需要写入的变化，数据库未作修改。
researchflow-database-unsupported-version = 不支持此数据库版本，请使用匹配版本的 Zotero PaperFlow。
researchflow-database-invalid-collection = 数据库字段 { $field } 必须是数组。
researchflow-database-invalid-id = 数据库字段 { $field } 包含缺少有效 ID 的记录。
researchflow-database-duplicate-id = 数据库字段 { $field } 包含重复 ID。
researchflow-database-invalid-settings = 数据库设置格式无效。
researchflow-database-invalid-deletions = 数据库删除记录格式无效。
researchflow-recovery-open = 比较并恢复冲突草稿
researchflow-recovery-release-note = 新增冲突草稿逐字段比较、变更预览与备份恢复
researchflow-database-merge-conflict = 同时编辑的内容在 { $fields } 存在冲突，当前数据库已保留。请从 Zotero PaperFlow 设置页“数据与同步 → 比较并恢复冲突草稿”入口核对并恢复。你的修改及双方数据库版本已保存到本地恢复文件：{ $file }。
researchflow-database-conflict-draft-failed = 同时编辑的内容无法自动合并，且恢复草稿写入失败：{ $reason }。数据库未被覆盖。请保持此窗口打开，并复制尚未保存的内容。
researchflow-database-revision-conflict = 另一个 PaperFlow 窗口已更新数据库（本窗口版本 { $expected }，当前版本 { $actual }）。本次保存未写入。请先复制尚未保存的内容，再重新打开工作台继续编辑。

# =========================================================================
# 偏好设置面板本地化 (Zotero PaperFlow Preferences)
# =========================================================================

# Preferences Header
researchflow-pref-brand-title = Zotero PaperFlow
researchflow-pref-brand-slogan = From Manuscript to Publication. 面向科研论文全生命周期的智能投稿与审稿管理工作台。
researchflow-pref-status-ready = 首选项已就绪。所有更改将实时生效并保存。

# Preferences Module 1: Window & Workspace
researchflow-pref-group-window-title = 界面交互与窗口唤起
researchflow-pref-group-window-desc = 配置 Zotero PaperFlow 工作台默认打开形态、起始首屏、置顶策略以及多语言与外观主题偏好：
researchflow-pref-btn-open-workspace = 📑 在 Zotero 内部主标签页打开工作台
researchflow-pref-btn-open-subwindow = 🗗 打开 480×780 紧凑伴读子窗口 (边读文献边跟踪进展)
researchflow-pref-btn-open-window = ⬚ 打开 1240×820 独立桌面全功能大窗口

# Preferences Module 2: Host & Literature Integration
researchflow-pref-group-integration-title = Zotero 宿主与文献库深度集成
researchflow-pref-group-integration-desc = 管理与 Zotero 桌面端主界面的联动深度。支持根据科研阅读习惯灵活开关信息面板、上下文菜单、阅读器划词与条目标签：

# Preferences Module 3: Writing & Review Workflow
researchflow-pref-group-workflow-title = 写作看板与审稿回复工作流
researchflow-pref-group-workflow-desc = 定制学术手稿流转、同行评审矩阵与学术导出工具的默认行为与视觉偏好：

# Preferences Module 4: Data Storage, Cloud Sync & Resilience
researchflow-pref-group-data-title = 数据存储、多云同步与灾备韧性
researchflow-pref-subgroup-sync-title = 多云同步与本地数据存储
researchflow-pref-subgroup-sync-desc = PaperFlow 遵循本地优先原则，所有科研数据均安全保存于 Zotero 专属数据目录，可随时配合 WebDAV 或 GitHub 进行私有云端加密同步：
researchflow-pref-storage-path-prefix = 📁 本地存储位置：
researchflow-pref-btn-cloud-settings = 🌐 在工作台中配置 WebDAV 与 GitHub 私有云同步凭据
researchflow-pref-subgroup-export-title = 数据库全量备份与跨格式导出
researchflow-pref-subgroup-export-desc = 支持一键将全部论文管线、审稿意见回复矩阵、日程里程碑与期刊记录导出为 JSON 标准数据包：
researchflow-pref-btn-export-db = 📑 导出 JSON 全量备份数据文件
researchflow-pref-subgroup-import-title = 数据导入、紧急灾备与冲突恢复
researchflow-pref-subgroup-import-desc = 从 Zotero PaperFlow JSON 备份中恢复科研管线数据（导入前系统将自动生成安全灾备快照）：
researchflow-pref-import-mode-label = 数据冲突处理策略：
researchflow-pref-import-mode-merge = 智能合并 (保留现有并补充导入增量)
researchflow-pref-import-mode-overwrite = 完全替换 (以导入备份为准完全覆写)
researchflow-pref-btn-import-file = 📂 选择本地 JSON 备份文件导入并执行恢复
researchflow-pref-btn-restore-backup = ⏮️ 恢复上次导入前的紧急安全备份快照

# Preferences Module 5: Version Information & Diagnostics
researchflow-pref-group-about-title = 版本信息与运行诊断
researchflow-pref-group-about-desc = 查阅 Zotero PaperFlow 运行环境、版本说明、官方发布资产与脱敏诊断报告：
researchflow-pref-version-label = 当前版本
researchflow-pref-compat-label = 兼容平台
researchflow-pref-compat-value = Zotero 10 ~ 12 (Gecko 153+ 标准现代架构)
researchflow-pref-release-desc-label = 版本说明
researchflow-pref-release-desc-value = 架构解耦重构、设置面板零硬编码 Fluent 治理与全链路规范对齐
researchflow-pref-build-date-label = 构建日期
researchflow-pref-package-label = 官方安装包
researchflow-pref-repo-label = 开源仓库
researchflow-pref-btn-export-diag = 🔍 导出脱敏运行诊断报告 (用于跨设备排查与技术支持)

# Dynamic Settings Field Keys
researchflow-pref-field-window-mode-label = 工作区默认打开形态
researchflow-pref-field-window-mode-desc = 选择从主工具栏图标或快捷键 (Ctrl+Alt+R) 唤起工作台时的首选窗口形态。
researchflow-pref-opt-window-mode-tab = 📑 Zotero 内部主选项卡 (无缝融入主界面标签栏)
researchflow-pref-opt-window-mode-subwindow = 🗗 伴读紧凑子窗口 (480×780，轻量悬浮，边读文献边跟踪进展)
researchflow-pref-opt-window-mode-window = ⬚ 独立桌面大窗口 (1240×820，大屏全景规划)

researchflow-pref-field-default-view-label = 工作区默认起始视图
researchflow-pref-field-default-view-desc = 打开工作台时默认定位的首屏功能模块。
researchflow-pref-opt-default-view-dashboard = 📊 仪表盘总览 (流向进度、时间线与统计概览)
researchflow-pref-opt-default-view-manuscripts = 🎯 手稿看板 (阶段流转与写作卡片跟踪)
researchflow-pref-opt-default-view-submissions = 🚀 投稿与同行评审 (期刊轮次、回复矩阵与学术导出)

researchflow-pref-field-language-label = 工作区显示语言
researchflow-pref-field-language-desc = 设置整个 PaperFlow 工作台与导出工具使用的界面语言。
researchflow-pref-opt-language-zh = 简体中文 (Chinese)
researchflow-pref-opt-language-en = English

researchflow-pref-field-theme-label = 界面外观主题
researchflow-pref-field-theme-desc = 选择工作台与伴读窗的明暗配色方案。
researchflow-pref-opt-theme-system = 🌓 跟随系统与宿主环境
researchflow-pref-opt-theme-light = ☀️ 浅色模式 (Light)
researchflow-pref-opt-theme-dark = 🌙 深色模式 (Dark)

researchflow-pref-field-subwindow-always-on-top-label = 伴读子窗口始终置顶
researchflow-pref-field-subwindow-always-on-top-desc = 开启后伴读窗口浮于所有窗口顶层，边阅读 PDF 原文边随时记录投稿灵感与审稿要点。

researchflow-pref-field-subwindow-compact-mode-label = 伴读子窗口启用紧凑阅读排版
researchflow-pref-field-subwindow-compact-mode-desc = 在小尺寸伴读窗口下隐藏大图与非必要留白，最大化可读面积。

researchflow-pref-field-enable-item-pane-label = 在文献条目右侧信息面板中显示「稿件管线」卡片
researchflow-pref-field-enable-item-pane-desc = 在文献条目信息侧栏注入原生卡片，直接查看关联手稿状态、目标期刊并一键同步子笔记。默认关闭以保持主界面整洁。

researchflow-pref-field-show-context-menu-label = 在文献条目与分类集合右键菜单中显示快捷操作
researchflow-pref-field-show-context-menu-desc = 在文献列表右键菜单提供「新建论文稿件管线」「关联到现有论文稿件」等快捷入口。

researchflow-pref-field-enable-reader-integration-label = 在 PDF 阅读器中启用快捷选中文本/批注摘录
researchflow-pref-field-enable-reader-integration-desc = 在 PDF 阅读器内支持通过右键或快捷键 (Ctrl+Shift+R) 将选中文本/批注快速摘录至手稿管线笔记。

researchflow-pref-field-sync-status-tags-label = 稿件流程状态更新时自动向 Zotero 条目同步彩色标签
researchflow-pref-field-sync-status-tags-desc = 开启后自动将稿件当前所处阶段（如 PaperFlow/04-同行审稿中）同步打在关联的 Zotero 文献条目上。默认关闭以防止污染文献标签云。

researchflow-pref-field-locate-on-manuscript-click-label = 工作台点击手稿时自动在 Zotero 文献库中定位对应条目
researchflow-pref-field-locate-on-manuscript-click-desc = 在工作台看板或投稿列表中点击已关联文献的手稿时，自动在 Zotero 主界面定位并高亮该文献。

researchflow-pref-field-auto-link-selected-paper-label = 跟踪新投稿时自动检测并载入 Zotero 当前选中文献
researchflow-pref-field-auto-link-selected-paper-desc = 点击「+ 跟踪新投稿」时，自动检测 Zotero 当前选中的文献条目并提供一键载入元数据快捷浮条。

researchflow-pref-field-auto-sync-child-notes-label = 手稿流程更新或关联文献时自动同步更新 Zotero 子笔记
researchflow-pref-field-auto-sync-child-notes-desc = 开启后自动将稿件进展与审稿矩阵同步写入文献条目的专属子笔记中。关闭后仅在用户手动点击「同步」时写入。

researchflow-pref-field-auto-add-to-pipeline-collection-label = 关联手稿时自动将文献条目归入「论文管线」分类集合
researchflow-pref-field-auto-add-to-pipeline-collection-desc = 开启后自动在当前库中维护「🚀 Zotero PaperFlow 论文管线」分类目录并将关联文献归入其中。

researchflow-pref-field-show-journal-portals-label = 在投稿管理界面顶部常驻显示常用期刊投稿入口停靠栏
researchflow-pref-field-show-journal-portals-desc = 在投稿与审稿管理视图顶部展示快捷期刊登录入口卡片（如 ACS、Wiley、Nature、APL 等）。

researchflow-pref-field-collapse-empty-kanban-stages-label = 手稿看板中无条目的空阶段列默认自动折叠
researchflow-pref-field-collapse-empty-kanban-stages-desc = 当某写作阶段（如选题大纲、图表初稿）没有手稿卡片时默认折叠隐藏，减少横向滚动。

researchflow-pref-field-default-rebuttal-export-format-label = 学术审稿回复信与自述信默认导出格式偏好
researchflow-pref-field-default-rebuttal-export-format-desc = 在导出学术审稿回复信与自述信模态框中默认预选的格式选项卡。
researchflow-pref-opt-rebuttal-format-latex = 📄 LaTeX 宏包答复信 (.tex with tcolorbox)
researchflow-pref-opt-rebuttal-format-word = 📝 Word / 富文本带格式 (可在 Word/WPS 中直接编辑)
researchflow-pref-opt-rebuttal-format-md = 📑 学术 Markdown 模版 (.md)
researchflow-pref-opt-rebuttal-format-table = 📊 意见与修改汇总表 (Markdown Table)

researchflow-pref-field-enable-acceptance-celebration-label = 论文正式录用接收时播放全屏彩带动画与庆祝卡片
researchflow-pref-field-enable-acceptance-celebration-desc = 当稿件或投稿轮次状态变更为「已录用接收」时，弹出喜报卡片并播放彩带礼花动效。

researchflow-pref-field-auto-sync-label = 本地科研数据保存后自动执行云端同步
researchflow-pref-field-auto-sync-desc = 在已配置有效 WebDAV 或 GitHub 私有仓库凭据的前提下，本地每次保存后自动在后台静默发起远端同步。

researchflow-pref-field-auto-backup-on-save-label = 本地科研数据保存时自动轮转生成安全灾备快照
researchflow-pref-field-auto-backup-on-save-desc = 本地每次提交保存时，自动在 Zotero 数据目录维护多份滚动版本历史快照，防止断电等意外导致数据损坏。

