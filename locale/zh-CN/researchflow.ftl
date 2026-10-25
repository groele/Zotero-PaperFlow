researchflow-menu-open = Zotero PaperFlow 科研工作台
researchflow-menu-preferences = Zotero PaperFlow 偏好设置...
researchflow-toolbar-tooltip = 打开 Zotero PaperFlow 工作台 (Ctrl+Alt+R)
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
