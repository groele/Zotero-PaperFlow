# Zotero PaperFlow 仓库规范

适用范围：`github-sources/Zotero-PaperFlow` 仓库。
开始工作前，先阅读并遵循工作区根目录的 [AGENTS.md](../../AGENTS.md)。本文件记录 PaperFlow 的架构细节、构建脚本、测试套件与特殊业务规则。

---

## 1. 产品定位与核心职责

Zotero PaperFlow 是面向科研论文全生命周期的智能投稿与审稿管理工作台，属于 **Zotero Flow** 系列的“投稿审稿（Publication）”角色：

- **手稿看板（Manuscripts Kanban）**：按选题大纲、图表初稿、撰写、组内评审、正式投稿、同行审稿、修回修订、录用发表等全生命周期阶段管理手稿管线。
- **投稿轮次与时间轴（Submissions & Milestones）**：记录投稿期刊、提交日期、审稿状态、处理决定及截止时间轴。
- **审稿意见与回复矩阵（Reviewer Comments & Response Matrix）**：逐条梳理审稿人意见与作者回应，关联 Zotero 批注与文献。
- **并发保存与冲突恢复（Storage Revisions & Conflict Recovery）**：基于本地优先原则（`researchflow-data.json`），检测多窗口与多设备并发冲突；保留未合并原草稿与独立安全备份，支持逐字段比较、预览与恢复。
- **Zotero 云端子笔记同步**：将手稿进展与审稿矩阵一键同步为标准 Zotero 文献子笔记，利用 Zotero 官方同步服务实现多端查看。

---

## 2. 宿主基准与兼容性约束

- **统一面向 Zotero 10+（Gecko 153+ Web Components 现代架构）**：
  - `manifest.json` 与 `update.json` 中严格声明：
    - `strict_min_version`: `"10.0"`
    - `strict_max_version`: `"12.*"`
  - 严禁将过时的 Zotero 7、旧 XUL 窗体或废弃 Gecko 引擎假设引入新功能。
- **多窗口穿透枚举**：
  - 在 Zotero 10 中，PDF 阅读器支持拆分为独立窗口。所有窗口遍历操作使用 `Services.wm.getEnumerator("")` 全局窗口枚举器穿透扫描所有活动窗口，确保外置阅读器与拆分窗口均能即时生效。
- **条目信息面板集成（ItemPane Section）**：
  - 使用 `Zotero.ItemPaneManager.registerSection` 官方 API 注册专有面板 `researchflow-item-pane`。

---

## 3. 安全防护与数据完整性

- **条目编辑状态与只读防护（Read-only Guard）**：
  - 深度遵循 `item.isEditable()` 原生安全检查。
  - 当条目位于只读群组库（Group Library）或回收站（Trash，`item.deleted === true`）时，所有数据写入（如 `syncManuscriptToChildNote`、`syncStatusTagToItem`）必须自动拦截退出并记录错误，条目面板上的编辑与同步控件必须自动降级为禁用只读状态（`disabled = true`）。
- **保存事务原子性与冲突防护**：
  - 数据写入使用 `saveTx()` 事务；
  - 外部导入或冲突恢复前必须调用 `getBackupFilePath()` 生成独立灾备快照；
  - 冲突草稿写入独立的 `researchflow-conflict-*.json`，严禁静默覆盖或清空本地数据。
- **HTML 转义与注入防护**：
  - 用户或条目元数据（标题、作者、摘要、审稿意见、回复）插入 DOM 或生成子笔记 HTML 时必须经过 `escapeHtml()` 转义。

---

## 4. 品牌与标识兼容性

- **用户可见品牌**：统一使用 `Zotero PaperFlow`（保留空格与大小写），仓库路径固定为 `github-sources/Zotero-PaperFlow`。
- **内部兼容标识保留**：
  - 插件 ID：`zotero-paperflow@groele.org`（同时在 `update.json` 中保留旧别名 `researchflow@groele.org`）。
  - Preference 前缀：`extensions.researchflow.`。
  - 数据存储文件名：`researchflow-data.json`。
  - 运行时命名空间：`Zotero.ResearchFlow`。
  - 本地化文件：`researchflow.ftl`。
  - 不得以“统一外观”为由随意更改已有内部标识，确保用户既有数据平滑向下兼容。

---

## 5. 现代化 esbuild + TypeScript 构建流水线与测试发布

本项目已全面升级至全系统一的现代 `esbuild + TypeScript (TS/ESM)` 编译架构：
- **权威源码目录**：`src/` 为唯一权威源码目录，单文件遵循单一职责原则，严禁直接手写散落 JS；
- **类型守卫**：`tsconfig.json` 启用严格模式，构建前强制通过 `npm run typecheck` (`tsc --noEmit`)；
- **打包流水线**：`scripts/build-source.mjs` 调用 `esbuild` 面向 `firefox140` (Gecko 153+) 编译生成 `chrome/content/scripts/index.js` 及模块产物；
- **废弃传统覆盖结构**：移除废弃的 `chrome.manifest`，全生命周期依托 `bootstrap.js` 原生 `amIAddonManagerStartup.registerChrome` 动态注册。

### 5.1 统一构建与测试命令
```bash
# 完整构建（类型检查 -> esbuild 编译 -> 可复现 XPI 打包并同步更新清单）
npm run build

# 快速编译主包与模块
npm run build:bundle

# 严格类型检查
npm run typecheck

# 完整自动化测试（类型守卫 + 编译 + 134 项单元测试 + 8 项打包策略校验）
npm test

# 仅运行单元测试
npm run test:unit

# 仅运行 XPI 打包校验测试
npm run test:package
```

### 5.2 自动化单测
测试套件基于 Node.js 原生测试运行器（`node:test` 与 `node:assert/strict`）：
测试文件涵盖：
- `tests/conflict-bridge.test.js`：窗口消息桥与草稿通信；
- `tests/conflict-recovery.test.js`：冲突草稿字段级对比与预览恢复；
- `tests/context-menu.test.js`：右键菜单注入与配置开关；
- `tests/database-safety.test.js`：数据库读写、并发保护与字段校验；
- `tests/import-ui-safety.test.js`：导入/恢复失败时界面回退防护；
- `tests/readonly-guard.test.js`：条目只读防护与版本一致性校验；
- `tests/share-image.test.js`：分享图片生成与保存；
- `tests/storage-revisions.test.js`：版本号递增、云端同步预检；
- `tests/timeline-alerts.test.js`：时间轴里程碑与修回告警。

### 5.2 XPI 打包与自检
打包脚本全面由纯 Node.js 现代流水线驱动（`scripts/package-xpi.mjs`），进行严格的可复现 ZIP 打包、CRLF/LF 归一化与 SHA-256/SHA-512 哈希同步，同时兼容保留 Python 历史脚本：
```bash
# 纯 Node 构建并同步 update.json 哈希
npm run build:xpi
# 或: node scripts/package-xpi.mjs --update-feeds

# 运行架构守卫（13 项 §5.9 / §3 / §4 / §5.2 规范静态断言）
npm run guard

# 运行打包策略测试与标签自检
npm run test:package
npm run test:tags

# 兼容保留的 Python 打包链路测试
python scripts/test-release-package.py
python scripts/release-tags.py --self-test
```

### 5.3 工作必递增版本规则
任何涉及源码、测试、文档或构建配置的修改，必须同步递增版本（SemVer 规范），并确保以下文件版本严格一致：
1. `manifest.json` (`version`)
2. `docs/brand/product.json` (`version`)
3. `chrome/content/preferences.xhtml` (`rf-pref-brand-tag` & XPI download link)
4. `chrome/content/index.html` (`.version`)
5. `chrome/content/pages/options.html` (`.version`)
6. `chrome/content/scripts/options.js` (`RF_OPTIONS_RENDER_VERSION`)
7. `update.json` (对应 entries 中的 `version` 与 `update_link`)
8. `README.md` 与 `README.en.md` (版本徽标与下载链接)
