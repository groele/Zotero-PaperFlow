# Zotero PaperFlow 12.0.0

## 品牌与体验全面重构大版本 / Major Milestone Release: Brand Rebirth & Experience Re-architecture

**Zotero PaperFlow** 迎来 **V12 (12.0.0)** 历史性大版本发布！本版本系统性重构了品牌标识、视觉体系、交互布局与系统集成，带来了更加沉浸、优雅、克制的现代化科研工作台体验。

Zotero PaperFlow welcomes the landmark **V12 (12.0.0)** major release, introducing an end-to-end reconstruction of brand identity, visual aesthetics, streamlined sidebar architecture, and seamless Zotero desktop integration.

---

### 1. 品牌全面焕新 / Brand Rebirth
- **全新名称**：正式升级为 **Zotero PaperFlow**（GitHub: `groele/Zotero-PaperFlow`）。
- **英文标语**：*From Manuscript to Publication.*
- **中文定位**：*面向科研论文全生命周期的智能投稿与审稿管理工作台。*
- **全新三维阶梯推进标识系统**：
  - **阶段一（青色柱体与实心节点）**：代表 Manuscript / Draft（手稿写作、构思与选刊准备）；
  - **阶段二（靛蓝柱体与白色核心）**：代表 In Submission / Review（投递、外审、修回与同行评议）；
  - **阶段三（玫瑰红柱体与琥珀金星级节点）**：代表 Publication / Accepted（录用、Proof 校对与发表见刊）。
- **全套多格式图像资产**：全分辨率高精 PNG（16×16 至 1024×1024）、原生矢量 SVG（`icon.svg` 与 `researchflow.svg`）及复合 Windows ICO（`icon.ico` / `favicon.ico`）全面落地。

---

### 2. 工作台侧边栏重构与配色协调 / Streamlined Sidebar & Harmonized Aesthetics
- **标识板块置底**：工作台侧边栏顶部的品牌/版本卡片重构并移至侧边栏**最底部**；导航菜单直接置顶，点击路径更短，视野更加开阔通透。
- **色彩体系重构**：
  - 彻底摒弃原顶部厚重的深蓝色块，重构为与 Zotero 原生浅色界面融为一体的现代半透微光卡片，自适应浅色与深色模式。
  - 导航激活项（Active Nav Item）与主视觉焦点深度同步新品牌图标的主色调 **Rose 600 (`#e11d48`)** 与 **Indigo (`#6366f1`)**，左侧强调线条更加精致细腻。
- **LOGO 容器矢量优化**：`.logo-orb` 采用高精矢量无损 SVG，去除生硬外阴影，完美呈现晶莹剔透的三柱图标。

---

### 3. 菜单与右侧栏极简净化 / Cleaned UI Footprint
- **移除“工具”菜单中的多余设置项**：清理 Zotero 主菜单“工具”下拉列表，仅保留唯一的 **“Zotero PaperFlow 工作台”** 核心入口，配置项直接内聚于工作台内完成。
- **移除右侧文献条目栏图标**：完全关闭向 Zotero 右侧文献条目栏（ItemPane Sidebar）注册的图标与面板，杜绝侧栏图标尺寸异常与空间抢占。
- **自动清理旧版残留 DOM 节点**：启动及窗口监听中增加自动垃圾清理逻辑，无需手动清理旧版本缓存节点。

---

### 4. 平滑升级与数据延续 / Seamless Upgrade & Data Continuity
- **新插件唯一标识**：升级为 `zotero-paperflow@groele.org`。
- **向后兼容与升级通道**：保留旧版 ID `researchflow@groele.org` 的升级通道与本地数据库结构，历史论文管线、审稿矩阵与日程任务 100% 自动无缝继承。
- **系统兼容**：深度验证并完美支持 Zotero 7+ 与 Zotero 10。
