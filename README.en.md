> **16.4.7 Timeline Alerts Revision Countdown Release**: Activated authoritative revision deadline countdown alerts in Dashboard Timeline Alerts. Directly extracts submission-level `revisionDueDate`, calculates accurate remaining days, and renders tiered badges (🚨 Xd overdue / 🚨 Due today / ⚠️ Xd left / 📅 Xd left) with one-click .ics calendar export. [Release notes](docs/releases/v16.4.7.md).

# Zotero PaperFlow


**Zotero Flow Series · Publication**

*让研究的每一步衔接起来。 / Connect each step of research.*

Manage manuscripts, submission rounds, and review responses.

[简体中文](README.md) · [English](README.en.md)

[![Release](https://img.shields.io/badge/version-16.4.7-245ac7?style=flat-square)](https://github.com/groele/Zotero-PaperFlow/releases/tag/v16.4.7) · [Download XPI](https://github.com/groele/Zotero-PaperFlow/releases/download/v16.4.7/zotero-paperflow-16.4.7.xpi) · [Report an issue](https://github.com/groele/Zotero-PaperFlow/issues)

[Overview](#overview) · [Installation and updates](#installation) · [Quick start](#quick-start) · [Key features](#features) · [Settings](#settings) · [Data, sync, and services](#data) · [Compatibility and validation](#compatibility) · [Troubleshooting](#troubleshooting) · [Development and documentation](#development) · [The Flow series](#series) · [Origin and license](#license)

<a id="overview"></a>

## Overview

For researchers tracking a paper through publication: connect manuscript stages, submission history, reviewer comments, responses, and key dates to the Zotero library.

Install this add-on independently and combine it with other Flow products as needed.

<a id="installation"></a>

## Installation and updates

1. Download [zotero-paperflow-16.4.6.xpi](https://github.com/groele/Zotero-PaperFlow/releases/download/v16.4.6/zotero-paperflow-16.4.6.xpi) (add-on version **16.4.6**), not the Source code ZIP.
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

| Differentiator | What it does | Boundary |
|---|---|---|
| Manuscript board and research timeline | Connects manuscript stages, key dates, research tasks, and progress in one view of a paper’s path to publication. | It does not replace Zotero’s library/PDF functions or citation functions in word processors. |
| Traceable submission rounds | Records target journal, date, state, decision, and prior rounds for every submission instead of scattering the process across notes. | Records are user-maintained; the add-on does not scrape or verify external submission-system status. |
| Reviewer-comment and response workspace | Keeps reviewer comments, response drafts, action progress, and relevant Zotero items in one workflow for item-by-item progress. | Response text remains research work material and cannot substitute for human review of editorial decisions or scientific arguments. |
| Concurrent saving and conflict recovery | Saves locally first and, on concurrent-write conflict, preserves the original draft and a separate backup for field-by-field comparison, preview, and recovery. | Recovery requires explicit user choices and confirmation; it never silently overwrites another draft. |
| Portable backup and optional sync | Exports/imports database backups and can use WebDAV or GitHub synchronization, while documenting multi-device conflict boundaries. | Remote synchronization is optional; credentials and service availability remain under the user and provider. |
| Share Studio and local save | Produces submission/research-progress graphics for preview, copy, and user-chosen PNG save locations. | An image reflects current records only; it neither publishes to social services nor replaces source-data backup. |

<a id="settings"></a>

## Settings

Open **Zotero Settings → Zotero PaperFlow → Data and sync → Compare and recover conflict drafts**. Choose each conflicting value, preview all changes, then confirm. Original drafts and a separate backup are preserved.

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
| Current add-on version | 16.4.6 |
| Declared Zotero range | `10.0` through `12.*` (for modern Zotero 10+ Web Components architecture) |
| Evidence boundary | Strict TypeScript checks, 16 architecture guards, 149 unit tests, and packaging/tag self-tests. Headless Edge browser checks verify Light/Dark themes and 1440×900, 1024×523, and 640×800 viewports for Share Studio and Timeline Event Manager. Native Zotero runtime UI inspection remains pending user reinstall and restart. |

Add-on and Zotero versions are separate. Manifest compatibility does not establish testing on every host, operating system, or service. This version passed automated and Chromium page checks. Installation and native visual acceptance in the main Zotero profile remain pending.

<a id="troubleshooting"></a>

## Troubleshooting

When moving devices, check the exported database and sync configuration. Keep a prior backup before replacement imports. Submission status is user maintained, not a live journal-system status interface.

For an issue, include add-on/Zotero versions, OS, steps, expected/actual results, and sanitized errors.

<a id="development"></a>

## Development and documentation

Normal installation needs no development environment. Existing developer entry points follow; use an isolated profile for native tests.

```powershell
node --test tests/*.test.js
python scripts/test-release-package.py
python tools/build-xpi.py --update-feeds
python tools/build-xpi.py --verify-only
```

- [版本说明 / Release notes](docs/releases/v13.0.0.md)
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

**Development-origin notice:** The maintained repository’s README, manifest, and release documents do not identify a third-party Zotero add-on as PaperFlow’s derivative base; it is provided as an independently maintained Zotero Flow add-on. This fact grants no additional code or redistribution rights.

The repository has no standalone LICENSE file. This update does not grant new rights on the author’s behalf; the rights holder should clarify licensing before redistribution.

This series is independently maintained and is not an official Zotero product. Zotero and third-party names, trademarks, and materials belong to their respective rights holders.

[Release/tag policy](docs/release-tag-policy.md)
