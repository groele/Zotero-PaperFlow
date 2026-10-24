# Zotero PaperFlow


**Zotero Flow Series · 投稿审稿**

*让研究的每一步衔接起来。 / Connect each step of research.*

管理手稿、投稿轮次与审稿回复。

[简体中文](README.md) · [English](README.en.md)

[![当前版本](https://img.shields.io/badge/version-12.5.5-245ac7?style=flat-square)](https://github.com/groele/Zotero-PaperFlow/releases/tag/v12.5.5) · [下载 XPI](https://github.com/groele/Zotero-PaperFlow/releases/download/v12.5.5/zotero-paperflow-12.5.5.xpi) · [问题反馈](https://github.com/groele/Zotero-PaperFlow/issues)

[产品定位](#overview) · [安装与更新](#installation) · [快速开始](#quick-start) · [核心功能](#features) · [设置与使用](#settings) · [数据、同步与外部服务](#data) · [兼容性与验证范围](#compatibility) · [常见问题](#troubleshooting) · [开发与详细文档](#development) · [系列产品](#series) · [项目来源与许可](#license)

<a id="overview"></a>

## 产品定位

面向需要跟踪论文处理过程的研究者，将手稿阶段、投稿历史、审稿意见、回复与关键日期连接到 Zotero 文献库。

本插件可以独立安装，按需与系列其他插件组合使用。

<a id="installation"></a>

## 安装与更新

1. 下载 [zotero-paperflow-12.5.5.xpi](https://github.com/groele/Zotero-PaperFlow/releases/download/v12.5.5/zotero-paperflow-12.5.5.xpi)（插件版本 **12.5.5**），不要安装 Source code ZIP。
2. 在 Zotero 打开 **工具 → 插件／附加组件**，从齿轮菜单选择 **从文件安装插件**。
3. 选择 XPI，完成安装；按提示重启 Zotero。

后续可在插件管理器中检查更新。自动检查／安装取决于 Zotero 与该插件的更新设置和兼容范围。升级或迁移前备份重要数据。

更新清单: [update.json](https://github.com/groele/Zotero-PaperFlow/blob/main/update.json) · 插件 ID: `zotero-paperflow@groele.org`.

更新清单同时保留旧 `researchflow@groele.org` 入口。

<a id="quick-start"></a>

## 快速开始

1. 打开工作台，新建手稿并关联需要的 Zotero 条目。
2. 记录投稿轮次、日期与处理状态，再逐条整理审稿意见和回复。
3. 更新看板并导出 JSON 备份；需要多设备使用时再配置同步。

<a id="features"></a>

## 核心功能

| 功能 | 使用范围 |
|---|---|
| 手稿看板 | 按阶段组织手稿与关键任务，查看研究时间线。 |
| 投稿轮次 | 记录目标期刊、投稿日期、状态和历史轮次。 |
| 审稿回复 | 整理审稿意见、回复内容与处理进度。 |
| 备份与分享 | 导出数据库备份；使用分享图与可选远端同步。 |

<a id="settings"></a>

## 设置与使用

在 **Zotero → 设置 → Zotero PaperFlow** 中查看插件偏好页。

Zotero 偏好页配置窗口和数据维护；工作台中的业务设置按实际模块使用。XPI 安装不要求 Node.js 或 Python。

<a id="data"></a>

## 数据、同步与外部服务

- 主数据库位于 Zotero 数据目录中的 researchflow-data.json；导出 JSON 用于备份和恢复。
- Zotero 子笔记与插件数据库是不同的数据副本，不能仅凭子笔记同步认定整个工作台已同步。
- WebDAV 或 GitHub 同步需用户配置；连接前确认敏感审稿材料与凭据的保存和上传范围。

<a id="compatibility"></a>

## 兼容性与验证范围

| 项目 | 范围 |
|---|---|
| 当前插件版本 | 12.5.5 |
| 清单声明的 Zotero 范围 | `6.999` 至 `15.*` |
| 当前说明 | 12.3.4 设置页已在 Windows Zotero 10.0.6 原生检查（含同窗连续切换与 MetaFlow 卡片配色对照）；声明兼容范围为 6.999–15.*，本轮未覆盖所有宿主、云服务或多设备并发。 |

插件版本与 Zotero 版本分别管理。清单允许安装，不代表所有版本、操作系统和外部服务均已验证。本轮验证覆盖并发保存回归、失败写入提示和安装包完整性；真实 Zotero 与外部同步验收范围见版本说明。

<a id="troubleshooting"></a>

## 常见问题

迁移设备时优先核对导出的数据库和同步配置；导入替换前保留旧备份。投稿状态由用户维护，不能将记录界面理解为期刊系统的实时状态接口。

反馈时提供插件与 Zotero 版本、系统、操作步骤、预期／实际结果和脱敏错误。

<a id="development"></a>

## 开发与详细文档

普通安装无需开发环境。以下为仓库已有开发入口，涉及原生测试时使用独立配置。

```powershell
node --test tests/*.test.js
python scripts/test-release-package.py
python tools/build-xpi.py --update-feeds
python tools/build-xpi.py --verify-only
```

- [版本说明 / Release notes](docs/releases/v12.5.5.md)
- [产品简介 / Product profile](docs/brand/PRODUCT.md)
- [品牌规范 / Brand guide](docs/brand/BRAND.md)
- [README 模板 / README template](docs/brand/README-TEMPLATE.md)
- [后续提升清单 / Improvement priorities](docs/brand/IMPROVEMENTS.md)
- [原详细指南 · README.md](docs/reference/README.md)

原详细指南保留功能细节、快捷键、历史验证与完整致谢；其中版本和测试结果属于各自记录时间。

<a id="series"></a>

## 系列产品

| 产品 | 定位 |
|---|---|
| [Zotero RefFlow](https://github.com/groele/Zotero-RefFlow) | 文献发现 · 检索参考文献、被引文献与相关研究。 |
| [Zotero MetaFlow](https://github.com/groele/Zotero-MetaFlow) | 元数据整理 · 校验、规范并补全文献元数据。 |
| [Zotero ViewFlow](https://github.com/groele/Zotero-ViewFlow) | 阅读预览 · 在 Zotero 侧栏预览并复制格式化引文。 |
| [Zotero MindFlow](https://github.com/groele/Zotero-MindFlow) | 知识组织 · 将文献、批注与思路组织为可编辑导图。 |
| [Zotero TaskFlow](https://github.com/groele/Zotero-TaskFlow) | 任务推进 · 将文献研读转化为可追踪的任务与计划。 |
| [Zotero CiteFlow](https://github.com/groele/Zotero-CiteFlow) | 写作引用 · 追踪 Word 文档引用，并连接 Zotero 文献操作。 |
| [Zotero PaperFlow](https://github.com/groele/Zotero-PaperFlow) | 投稿审稿 · 管理手稿、投稿轮次与审稿回复。 |

各插件分别安装和更新；同属一个系列不意味着共享数据库或已自动联通所有流程。

<a id="license"></a>

## 项目来源与许可

当前仓库没有独立 LICENSE 文件；本次不替作者新增授权。发布或再分发前，应由权利人明确许可范围。

本系列独立维护，并非 Zotero 官方产品。Zotero 及第三方名称、商标与材料归各自权利人所有。

[Release/tag policy](docs/release-tag-policy.md)
