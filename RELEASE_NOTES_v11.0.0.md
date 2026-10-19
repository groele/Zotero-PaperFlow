# Zotero PaperFlow 11.0.0

## 品牌重构与重大版本更新 / Major Brand Rebirth & Milestone Update

**Zotero PaperFlow** 迎来 11.0.0 重大版本里程碑。本版本对插件的品牌标识、视觉系统与界面菜单进行了全面重构，进一步明晰了在科研工作流系列中的定位。

Zotero PaperFlow reaches milestone version 11.0.0, introducing a comprehensive rebirth of its brand identity, visual assets, and streamlined interface.

---

### 1. 品牌全面焕新 / Brand Rebirth
- **全新命名**：正式由 ResearchFlow 升级为 **Zotero PaperFlow**（GitHub: `groele/Zotero-PaperFlow`）。
- **英文标语**：*From Manuscript to Publication.*
- **中文定位**：*面向科研论文全生命周期的智能投稿与审稿管理工作台。*
- **全新视觉标识系统**：重构了象征学术论文全流程跃迁的三维递进阶梯图标体系：
  - **阶段一（青色柱体与实心节点）**：代表 Manuscript / Draft（手稿写作、构思与选刊准备）；
  - **阶段二（靛蓝柱体与白色核心）**：代表 In Submission / Review（投递、外审、修回与同行评议）；
  - **阶段三（玫瑰红柱体与琥珀金星级节点）**：代表 Publication / Accepted（录用、Proof 校对与发表见刊）。
- **全套设计资产**：全分辨率高精 PNG（16×16 至 1024×1024）、矢量 SVG（`icon.svg` 与 `researchflow.svg`）及复合 Windows ICO（`icon.ico` / `favicon.ico`）全面接入。

---

### 2. 菜单轻量化与界面净化 / Streamlined Tools Menu
- **移除工具菜单中的偏好设置项**：移除了 Zotero 主窗口“工具”下拉菜单中的独立“偏好设置...”菜单项，工具菜单仅保留优雅且核心的 **“Zotero PaperFlow 工作台”** 入口，解决多插件环境下工具菜单过度冗长的问题。
- **配置内聚一体化**：所有运行配置、备份导出、灾备恢复及 WebDAV / GitHub 云同步均直接在 PaperFlow 工作台内部管理，兼顾 Zotero 首选项面板支持。
- **自动清理旧版残留节点**：启动与窗口监听时自动清理历史 DOM 中遗留的设置项，升级无需手动清理。

---

### 3. 工作台侧边栏重构与配色协调 / Streamlined Sidebar & Color Harmony
- **标识板块置底**：将工作台侧边栏顶部的品牌/版本卡片移至侧边栏最底部，导航按钮直接置顶，结构更舒朗通透。
- **重构色彩体系，完美协调 Zotero 原生设计**：
  - 彻底移除了原顶部沉重的深蓝色外框，改为贴合 Zotero 浅色原生桌面的半透明轻质卡片，并支持自适应深色模式。
  - 导航激活项（Active Item）与主视觉焦点深度对齐新版品牌图标的主色 `#e11d48`（Rose 600 / Zotero Crimson），字体、边框、左侧强调条与高精矢量图标浑然一体。
- **移除 Zotero 右侧文献条目栏图标**：完全移除 Zotero 文献条目右侧导航栏（ItemPane Sidebar）中的独立图标与面板注册，避免右侧工具栏拥挤；同时自动清理历史残留 DOM 节点。

---

### 4. 平滑升级与数据兼容 / Seamless Upgrade & Data Continuity
- **新插件唯一标识**：升级为 `zotero-paperflow@groele.org`。
- **无缝平滑升级**：保留旧版 ID `researchflow@groele.org` 的更新通道与本地数据结构，现有用户的所有论文管线、审稿意见矩阵与项目记录 100% 自动继承，无需额外迁移操作。
- **系统与宿主兼容**：持续保持对 Zotero 7+ 与 Zotero 10 的全面深度兼容。
