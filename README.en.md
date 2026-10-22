# Zotero PaperFlow


**Zotero Flow Series · Publication**

*让研究的每一步衔接起来。 / Connect each step of research.*

Manage manuscripts, submission rounds, and review responses.

[简体中文](README.md) · [English](README.en.md)

[![Release](https://img.shields.io/badge/version-12.5.1-245ac7?style=flat-square)](https://github.com/groele/Zotero-PaperFlow/releases/tag/v12.5.1) · [Download XPI](https://github.com/groele/Zotero-PaperFlow/releases/download/v12.5.1/zotero-paperflow-12.5.1.xpi) · [Report an issue](https://github.com/groele/Zotero-PaperFlow/issues)

[Overview](#overview) · [Installation and updates](#installation) · [Quick start](#quick-start) · [Key features](#features) · [Settings](#settings) · [Data, sync, and services](#data) · [Compatibility and validation](#compatibility) · [Troubleshooting](#troubleshooting) · [Development and documentation](#development) · [The Flow series](#series) · [Origin and license](#license)

<a id="overview"></a>

## Overview

For researchers tracking a paper through publication: connect manuscript stages, submission history, reviewer comments, responses, and key dates to the Zotero library.

Install this add-on independently and combine it with other Flow products as needed.

<a id="installation"></a>

## Installation and updates

1. Download [zotero-paperflow-12.5.1.xpi](https://github.com/groele/Zotero-PaperFlow/releases/download/v12.5.1/zotero-paperflow-12.5.1.xpi) (add-on version **12.5.1**), not the Source code ZIP.
2. In Zotero, open **Tools → Plugins/Add-ons**, then choose **Install Add-on From File** from the gear menu.
3. Select the XPI, complete installation, and restart if requested.

Use the add-on manager to check for later updates. Automatic checking/installation depends on Zotero, per-add-on update settings, and compatibility. Back up important data before upgrades or migration.

Update feed: [update.json](https://github.com/groele/Zotero-PaperFlow/blob/main/update.json) · Add-on ID: `zotero-paperflow@groele.org`.

The update feed also retains the legacy `researchflow@groele.org` entry.

<a id="quick-start"></a>

## Quick start

1. Open the workspace, create a manuscript, and associate the relevant Zotero items.
2. Record submission rounds, dates, and status, then organize comments and responses.
3. Update the board and export a JSON backup; configure sync only when needed for multiple devices.

<a id="features"></a>

## Key features

| Feature | Scope |
|---|---|
| Manuscript board | Organize manuscripts and key tasks by stage and inspect research timelines. |
| Submission rounds | Record target journals, submission dates, status, and previous rounds. |
| Review responses | Organize reviewer comments, response text, and progress. |
| Backup and sharing | Export database backups, create sharing images, and configure optional remote sync. |

<a id="settings"></a>

## Settings

Open the add-on preference page in **Zotero → Settings → Zotero PaperFlow**.

Zotero preferences configure window behavior and data maintenance; use workspace settings for its business modules. Installing an XPI does not require Node.js or Python.

<a id="data"></a>

## Data, sync, and services

- The main database is researchflow-data.json in Zotero’s data directory; export JSON for backup and recovery.
- Zotero child notes and the add-on database are separate data copies; child-note sync does not establish full workspace synchronization.
- WebDAV or GitHub synchronization requires configuration; check what review materials and credentials are stored or uploaded before connecting.

<a id="compatibility"></a>

## Compatibility and validation

| Item | Scope |
|---|---|
| Current add-on version | 12.5.1 |
| Declared Zotero range | `6.999` through `15.*` |
| Evidence boundary | The 12.3.4 settings pane was checked in Windows Zotero 10.0.6, including sequential navigation and MetaFlow card palette comparison. The declared range is 6.999–15.*; this update does not cover every host, cloud service, or concurrent multi-device scenario. |

Add-on and Zotero versions are separate. Manifest compatibility does not establish testing on every host, operating system, or service. This branding/documentation update does not rerun business workflow tests.

<a id="troubleshooting"></a>

## Troubleshooting

When moving devices, check the exported database and sync configuration. Keep a prior backup before replacement imports. Submission status is user maintained, not a live journal-system status interface.

For an issue, include add-on/Zotero versions, OS, steps, expected/actual results, and sanitized errors.

<a id="development"></a>

## Development and documentation

Normal installation needs no development environment. Existing developer entry points follow; use an isolated profile for native tests.

```powershell
python tools/build-xpi.py
```

- [版本说明 / Release notes](docs/releases/v12.5.1.md)
- [产品简介 / Product profile](docs/brand/PRODUCT.md)
- [品牌规范 / Brand guide](docs/brand/BRAND.md)
- [README 模板 / README template](docs/brand/README-TEMPLATE.md)
- [后续提升清单 / Improvement priorities](docs/brand/IMPROVEMENTS.md)
- [Previous detailed guide · README.md](docs/reference/README.md)

Previous detailed guides retain feature detail, shortcuts, historical evidence, and full attribution. Their versions and test results belong to the recorded stage.

<a id="series"></a>

## The Flow series

| Product | Role |
|---|---|
| [Zotero RefFlow](https://github.com/groele/Zotero-RefFlow) | Discovery · Discover references, citing works, and related research. |
| [Zotero MetaFlow](https://github.com/groele/Zotero-MetaFlow) | Metadata · Validate, normalize, and enrich reference metadata. |
| [Zotero ViewFlow](https://github.com/groele/Zotero-ViewFlow) | Preview · Preview and copy formatted references in Zotero’s item pane. |
| [Zotero MindFlow](https://github.com/groele/Zotero-MindFlow) | Knowledge · Organize papers, annotations, and ideas into editable maps. |
| [Zotero TaskFlow](https://github.com/groele/Zotero-TaskFlow) | Tasks · Turn literature reading into trackable tasks and plans. |
| [Zotero CiteFlow](https://github.com/groele/Zotero-CiteFlow) | Citation · Track Word citations and connect them to Zotero items. |
| [Zotero PaperFlow](https://github.com/groele/Zotero-PaperFlow) | Publication · Manage manuscripts, submission rounds, and review responses. |

Each add-on installs and updates separately. A shared brand does not imply a shared database or automatic integration of every workflow.

<a id="license"></a>

## Origin and license

The repository has no standalone LICENSE file. This update does not grant new rights on the author’s behalf; the rights holder should clarify licensing before redistribution.

This series is independently maintained and is not an official Zotero product. Zotero and third-party names, trademarks, and materials belong to their respective rights holders.

[Release/tag policy](docs/release-tag-policy.md)
