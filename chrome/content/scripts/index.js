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
  // src/config.ts
  var ADDON_ID = "zotero-paperflow@groele.org";
  var CHROME_ROOT = "chrome://researchflow/content/";
  var PREF_PREFIX = "extensions.researchflow.";
  var DEFAULT_VERSION = "16.4.4";

  // src/modules/academic-citation/formatters.ts
  var extractCiteKey = (target) => {
    if (!target) return "";
    const extra = typeof target.getField === "function" ? target.getField("extra") || "" : "";
    const m = extra.match(/(?:Citation Key|tex\.citationkey|bibtex):\s*([^\s\n\r]+)/i);
    if (m && m[1]) return m[1].trim();
    let firstAuthor = "author";
    try {
      const creators = target.getCreators?.() || [];
      if (creators.length > 0) {
        firstAuthor = (creators[0].lastName || creators[0].name || "author").replace(/[^a-zA-Z]/g, "").toLowerCase();
      }
    } catch (_) {
    }
    const date = typeof target.getField === "function" ? target.getField("date") : "";
    const ym = String(date || "").match(/\b(19|20)\d{2}\b/);
    const year = ym ? ym[0] : "2024";
    const title = (typeof target.getField === "function" ? target.getField("title") : "") || "";
    const firstWord = (title.split(/\s+/)[0] || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return `${firstAuthor}${year}${firstWord ? firstWord : ""}`;
  };
  var generateBibTeX = (target) => {
    if (!target) return "";
    const citekey = extractCiteKey(target);
    const title = typeof target.getField === "function" ? target.getField("title") || "" : "";
    const journal = typeof target.getField === "function" ? target.getField("publicationTitle") || target.getField("proceedingsTitle") || target.getField("publisher") || "" : "";
    const date = typeof target.getField === "function" ? target.getField("date") : "";
    const ym = String(date || "").match(/\b(19|20)\d{2}\b/);
    const year = ym ? ym[0] : "";
    const doi = typeof target.getField === "function" ? target.getField("DOI") || "" : "";
    const url = typeof target.getField === "function" ? target.getField("url") || "" : "";
    let authorStr = "";
    try {
      const creators = target.getCreators?.() || [];
      authorStr = creators.map((c) => `${c.lastName || ""}, ${c.firstName || ""}`.trim()).filter(Boolean).join(" and ");
    } catch (_) {
    }
    return `@article{${citekey},
  title = {${title}},
  author = {${authorStr}},
  journal = {${journal}},
  year = {${year}}${doi ? `,
  doi = {${doi}}` : ""}${url ? `,
  url = {${url}}` : ""}
}`;
  };
  var generateAPACitation = (target) => {
    if (!target) return "";
    let authors = [];
    try {
      authors = (target.getCreators?.() || []).map((c) => c.lastName ? `${c.lastName}, ${c.firstName ? c.firstName[0] + "." : ""}` : c.name).filter(Boolean);
    } catch (_) {
    }
    const authorStr = authors.length > 0 ? authors.slice(0, 3).join(", ") + (authors.length > 3 ? ", et al." : "") : "Anonymous";
    const date = typeof target.getField === "function" ? target.getField("date") : "";
    const ym = String(date || "").match(/\b(19|20)\d{2}\b/);
    const yearStr = ym ? `(${ym[0]})` : "(n.d.)";
    const title = (typeof target.getField === "function" ? target.getField("title") : "") || "";
    const journal = typeof target.getField === "function" ? target.getField("publicationTitle") || "" : "";
    const doi = typeof target.getField === "function" ? target.getField("DOI") : "";
    return `${authorStr} ${yearStr}. ${title}. ${journal ? journal + "." : ""}${doi ? " https://doi.org/" + doi : ""}`.trim();
  };

  // src/modules/academic-citation/items.ts
  var itemSelectUri = (item) => {
    if (!item) return "";
    const key = item.key || item.id;
    const groupID = typeof Zotero !== "undefined" ? Zotero.Libraries?.get?.(item.libraryID)?.groupID : null;
    return groupID ? `zotero://select/groups/${groupID}/items/${key}` : `zotero://select/library/items/${key}`;
  };
  var getLiteratureItem = (item) => {
    if (!item) return null;
    let target = item;
    try {
      if (target.topLevelItem && typeof target.topLevelItem.isRegularItem === "function" && target.topLevelItem.isRegularItem()) {
        return target.topLevelItem;
      }
    } catch (_) {
    }
    if (typeof target.isAttachment === "function" && target.isAttachment()) {
      if (target.parentItemID && typeof Zotero !== "undefined" && Zotero.Items) {
        target = Zotero.Items.get(target.parentItemID) || target;
      }
    }
    if (typeof target.isNote === "function" && target.isNote()) {
      if (target.parentItemID && typeof Zotero !== "undefined" && Zotero.Items) {
        target = Zotero.Items.get(target.parentItemID) || target;
      }
    }
    try {
      if (target.topLevelItem && typeof target.topLevelItem.isRegularItem === "function" && target.topLevelItem.isRegularItem()) {
        return target.topLevelItem;
      }
    } catch (_) {
    }
    return target && typeof target.isRegularItem === "function" && target.isRegularItem() ? target : null;
  };
  var findItemByKey = (itemKey, libraryID = null) => {
    if (!itemKey || typeof Zotero === "undefined" || !Zotero.Items) return null;
    const key = String(itemKey).trim();
    if (!key) return null;
    if (libraryID !== null && libraryID !== void 0) {
      try {
        const item = Zotero.Items.getByLibraryAndKey(libraryID, key);
        if (item) return getLiteratureItem(item);
      } catch (_) {
      }
    }
    const userLibID = Zotero.Libraries?.userLibraryID || 1;
    try {
      const item = Zotero.Items.getByLibraryAndKey(userLibID, key);
      if (item) return getLiteratureItem(item);
    } catch (_) {
    }
    try {
      const allLibs = typeof Zotero.Libraries?.getAll === "function" ? Zotero.Libraries.getAll() : [];
      for (const lib of allLibs) {
        const libId = lib?.libraryID || lib?.id;
        if (libId && libId !== userLibID) {
          const item = Zotero.Items.getByLibraryAndKey(libId, key);
          if (item) return getLiteratureItem(item);
        }
      }
    } catch (_) {
    }
    return null;
  };
  var STATUS_TAG_MAP = {
    idea: "PaperFlow/01-选题大纲",
    outline: "PaperFlow/01-选题大纲",
    data_collection: "PaperFlow/01-选题大纲",
    figure_preparation: "PaperFlow/02-图表初稿",
    drafting: "PaperFlow/02-图表初稿",
    internal_review: "PaperFlow/02-组内评审",
    submitted: "PaperFlow/03-已正式投稿",
    under_review: "PaperFlow/04-同行审稿中",
    revision: "PaperFlow/05-修回修订中",
    accepted: "PaperFlow/06-已录用Accepted",
    published: "PaperFlow/07-已正式发表"
  };
  var getLiteratureAnnotations = (item) => {
    const target = getLiteratureItem(item);
    if (!target) return [];
    const annotations = [];
    try {
      const attIds = typeof target.getAttachments === "function" ? target.getAttachments() : [];
      for (const attId of attIds) {
        const att = typeof Zotero !== "undefined" && Zotero.Items ? Zotero.Items.get(attId) : null;
        if (att && (typeof att.isPDFAttachment === "function" && att.isPDFAttachment() || att.contentType === "application/pdf")) {
          const groupID = Zotero.Libraries?.get?.(att.libraryID)?.groupID;
          const pdfBaseUri = groupID ? `zotero://open-pdf/groups/${groupID}/items/${att.key}` : `zotero://open-pdf/library/items/${att.key}`;
          if (typeof att.getAnnotations === "function") {
            const annos = att.getAnnotations();
            for (const a of annos || []) {
              if (a.annotationText || a.annotationComment) {
                let pageIndex = 0;
                try {
                  if (a.annotationPosition) {
                    const pos = typeof a.annotationPosition === "string" ? JSON.parse(a.annotationPosition) : a.annotationPosition;
                    pageIndex = typeof pos.pageIndex === "number" ? pos.pageIndex : 0;
                  }
                } catch (_) {
                }
                const pageNum = a.annotationPageLabel || pageIndex + 1;
                annotations.push({
                  key: a.key,
                  type: a.annotationType || "highlight",
                  text: String(a.annotationText || "").trim(),
                  comment: String(a.annotationComment || "").trim(),
                  color: a.annotationColor || "#ffd400",
                  page: pageNum,
                  pageIndex,
                  date: a.dateModified || a.dateAdded || "",
                  pdfUri: `${pdfBaseUri}?page=${pageIndex + 1}&annotation=${a.key}`
                });
              }
            }
          }
        }
      }
    } catch (err) {
      if (typeof Zotero !== "undefined") Zotero.logError?.("[PaperFlow] getLiteratureAnnotations error: " + err);
    }
    return annotations;
  };
  var getRelatedItems = (item) => {
    const target = getLiteratureItem(item);
    if (!target) return [];
    const related = [];
    try {
      if (typeof target.getRelatedItemIDs === "function") {
        const rIds = target.getRelatedItemIDs();
        for (const rId of (rIds || []).slice(0, 6)) {
          const rItem = typeof Zotero !== "undefined" && Zotero.Items ? Zotero.Items.get(rId) : null;
          const lit = getLiteratureItem(rItem);
          if (lit) {
            const date = typeof lit.getField === "function" ? lit.getField("date") : "";
            const ym = String(date || "").match(/\b(19|20)\d{2}\b/);
            related.push({
              id: lit.id,
              key: lit.key,
              title: (typeof lit.getField === "function" ? lit.getField("title") : "") || "未命名文献",
              year: ym ? ym[0] : "",
              authors: (lit.getCreators?.() || []).map((c) => c.lastName || c.name).filter(Boolean).slice(0, 2).join(", "),
              zoteroUri: itemSelectUri(lit)
            });
          }
        }
      }
    } catch (_) {
    }
    return related;
  };
  var getLiteratureCollections = (item) => {
    const target = getLiteratureItem(item);
    if (!target) return [];
    const collections = [];
    try {
      if (typeof target.getCollections === "function") {
        const colIds = target.getCollections();
        for (const cId of colIds || []) {
          const col = typeof Zotero !== "undefined" ? Zotero.Collections?.get?.(cId) : null;
          if (col) {
            let path = col.name;
            let parentID = col.parentID;
            let depth = 0;
            while (parentID && depth < 6) {
              const p = Zotero.Collections?.get?.(parentID);
              if (!p) break;
              path = `${p.name} / ${path}`;
              parentID = p.parentID;
              depth++;
            }
            collections.push({
              id: col.id,
              key: col.key,
              name: col.name,
              path
            });
          }
        }
      }
    } catch (_) {
    }
    return collections;
  };
  var getLiteratureNotes = (item) => {
    const target = getLiteratureItem(item);
    if (!target) return [];
    const notes = [];
    try {
      if (typeof target.getNotes === "function") {
        const noteIds = target.getNotes();
        for (const nId of noteIds || []) {
          const nItem = typeof Zotero !== "undefined" ? Zotero.Items?.get?.(nId) : null;
          if (nItem && typeof nItem.isNote === "function" && nItem.isNote()) {
            const rawNote = (typeof nItem.getNote === "function" ? nItem.getNote() : "") || "";
            if (rawNote.includes("[ResearchFlow]") || rawNote.includes("ResearchFlow for Zotero") || rawNote.includes("[PaperFlow]") || rawNote.includes("Zotero PaperFlow")) {
              continue;
            }
            const snippet = rawNote.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (snippet || rawNote) {
              const titleMatch = rawNote.match(/<(?:h[1-6]|p|strong)[^>]*>(.*?)<\/(?:h[1-6]|p|strong)>/i);
              const noteTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : snippet.slice(0, 24) || "Zotero 笔记";
              notes.push({
                id: nItem.id,
                key: nItem.key,
                title: noteTitle,
                rawHtml: rawNote,
                snippet: snippet.slice(0, 300) + (snippet.length > 300 ? "…" : ""),
                date: nItem.dateModified || nItem.dateAdded || "",
                zoteroUri: itemSelectUri(nItem)
              });
            }
          }
        }
      }
    } catch (err) {
      if (typeof Zotero !== "undefined") Zotero.logError?.("[PaperFlow] getLiteratureNotes error: " + err);
    }
    return notes;
  };
  var getLiteratureReadingAssets = (item) => {
    const target = getLiteratureItem(item);
    if (!target) {
      return { annotations: [], notes: [], collections: [], tags: [], relatedItems: [], citekey: "", bibtex: "", citationApa: "" };
    }
    return {
      annotations: getLiteratureAnnotations(target),
      notes: getLiteratureNotes(target),
      collections: getLiteratureCollections(target),
      tags: typeof target.getTags === "function" ? target.getTags().map((t) => t.tag || String(t)).filter(Boolean) : [],
      relatedItems: getRelatedItems(target),
      citekey: extractCiteKey(target),
      bibtex: generateBibTeX(target),
      citationApa: generateAPACitation(target)
    };
  };
  var serializeLiteratureItem = (item) => {
    const target = getLiteratureItem(item);
    if (!target) return null;
    const title = (typeof target.getField === "function" ? target.getField("title") : target.title) || "无标题文献";
    const date = typeof target.getField === "function" ? target.getField("date") : target.date;
    let year = "";
    if (date) {
      const match = String(date).match(/\b(19|20)\d{2}\b/);
      year = match ? match[0] : String(date).slice(0, 4);
    }
    let authors = [];
    try {
      if (typeof target.getCreators === "function") {
        authors = target.getCreators().map((c) => c.lastName || c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim()).filter(Boolean);
      }
    } catch (_) {
    }
    const publication = typeof target.getField === "function" ? target.getField("publicationTitle") || target.getField("proceedingsTitle") || target.getField("publisher") || "" : "";
    const doi = typeof target.getField === "function" ? target.getField("DOI") || "" : "";
    const url = typeof target.getField === "function" ? target.getField("url") || "" : "";
    const abstract = typeof target.getField === "function" ? target.getField("abstractNote") || "" : "";
    let tags = [];
    try {
      if (typeof target.getTags === "function") {
        tags = target.getTags().map((t) => t.tag || String(t)).filter(Boolean);
      }
    } catch (_) {
    }
    let pdfUri = null;
    try {
      if (typeof target.getAttachments === "function") {
        const attIds = target.getAttachments();
        for (const attId of attIds) {
          const att = typeof Zotero !== "undefined" && Zotero.Items ? Zotero.Items.get(attId) : null;
          if (att && (typeof att.isPDFAttachment === "function" && att.isPDFAttachment() || att.contentType === "application/pdf")) {
            const groupID = Zotero.Libraries?.get?.(att.libraryID)?.groupID;
            pdfUri = groupID ? `zotero://open-pdf/groups/${groupID}/items/${att.key}` : `zotero://open-pdf/library/items/${att.key}`;
            break;
          }
        }
      }
    } catch (_) {
    }
    const citekey = extractCiteKey(target);
    const bibtex = generateBibTeX(target);
    const citationApa = generateAPACitation(target);
    const relatedItems = getRelatedItems(target);
    const annotations = getLiteratureAnnotations(target);
    const annotationCount = annotations.length;
    const collections = getLiteratureCollections(target);
    const notes = getLiteratureNotes(target);
    const notesCount = notes.length;
    return {
      key: target.key || String(target.id),
      id: target.id,
      libraryID: target.libraryID,
      title,
      authors: authors.slice(0, 3).join(", ") + (authors.length > 3 ? " 等" : ""),
      authorList: authors,
      year,
      publication,
      doi,
      url,
      abstract,
      tags,
      collections,
      citekey,
      bibtex,
      citationApa,
      annotationCount,
      notesCount,
      relatedItems,
      zoteroUri: itemSelectUri(target),
      pdfUri
    };
  };

  // src/modules/academic-citation.ts
  var RFAcademicCitation = {
    itemSelectUri,
    getLiteratureItem,
    findItemByKey,
    STATUS_TAG_MAP,
    extractCiteKey,
    generateBibTeX,
    generateAPACitation,
    getLiteratureAnnotations,
    getRelatedItems,
    getLiteratureCollections,
    getLiteratureNotes,
    getLiteratureReadingAssets,
    serializeLiteratureItem
  };
  if (typeof globalThis !== "undefined") {
    globalThis.RFAcademicCitation = RFAcademicCitation;
  }
  if (typeof window !== "undefined") {
    window.RFAcademicCitation = RFAcademicCitation;
  }

  // src/host/prefs-state.ts
  var hostPrefsStateMethods = {
    ensureLocalization(doc) {
      if (!doc || this.localizedDocs.has(doc)) return;
      const existing = doc.querySelector('link[rel="localization"][href="researchflow.ftl"]');
      if (existing) return;
      try {
        doc.defaultView?.MozXULElement?.insertFTLIfNeeded("researchflow.ftl");
        if (doc.querySelector('link[rel="localization"][href="researchflow.ftl"]')) {
          this.localizedDocs.add(doc);
        }
      } catch (error) {
        Zotero.logError?.("[PaperFlow] Could not load translations: " + error);
      }
    },
    getPref(key, defaultValue) {
      try {
        if (Zotero.Prefs) {
          const val = Zotero.Prefs.get(`${PREF_PREFIX}${key}`, true);
          return val !== void 0 ? val : defaultValue;
        }
      } catch (_) {
      }
      return defaultValue;
    },
    setPref(key, value) {
      try {
        if (Zotero.Prefs) {
          Zotero.Prefs.set(`${PREF_PREFIX}${key}`, value, true);
        }
      } catch (_) {
      }
    },
    getDataFilePath() {
      return PathUtils.join(Zotero.DataDirectory.dir, "researchflow-data.json");
    },
    getSyncedSettingsFromPrefs(existingSettings = {}) {
      const s = { ...existingSettings || {} };
      const get = (k, def) => this.getPref(k, def);
      s.windowMode = get("windowMode", "tab");
      s.defaultView = get("defaultView", "view-dashboard");
      s.language = get("language", "en");
      s.theme = get("theme", "system");
      s.subwindowAlwaysOnTop = Boolean(get("subwindowAlwaysOnTop", false));
      s.subwindowCompactMode = Boolean(get("subwindowCompactMode", true));
      s.enableItemPane = Boolean(get("enableItemPane", false));
      s.showContextMenu = Boolean(get("showContextMenu", false));
      s.enableReaderIntegration = Boolean(get("enableReaderIntegration", true));
      s.syncStatusTags = Boolean(get("syncStatusTags", false));
      s.locateOnManuscriptClick = Boolean(get("locateOnManuscriptClick", true));
      s.autoLinkSelectedPaper = Boolean(get("autoLinkSelectedPaper", true));
      s.showJournalPortals = Boolean(get("showJournalPortals", true));
      s.collapseEmptyKanbanStages = Boolean(get("collapseEmptyKanbanStages", false));
      s.defaultRebuttalExportFormat = get("defaultRebuttalExportFormat", "latex");
      s.autoSync = Boolean(get("autoSync", true));
      s.autoBackupOnSave = Boolean(get("autoBackupOnSave", true));
      s.importMode = get("importMode", "merge");
      s.autoSyncChildNotes = Boolean(get("autoSyncChildNotes", true));
      s.autoAddToPipelineCollection = Boolean(get("autoAddToPipelineCollection", true));
      s.enableAcceptanceCelebration = Boolean(get("enableAcceptanceCelebration", true));
      return s;
    },
    getBackupFilePath() {
      return PathUtils.join(Zotero.DataDirectory.dir, "researchflow-pre-import-backup.json");
    },
    getUiStateFilePath() {
      return PathUtils.join(Zotero.DataDirectory.dir, "researchflow-ui-state.json");
    },
    async loadUiState() {
      if (this._uiState) return this._uiState;
      const filePath = this.getUiStateFilePath();
      if (!await IOUtils.exists(filePath)) return this._uiState = {};
      const parsed = JSON.parse(await IOUtils.readUTF8(filePath));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid ResearchFlow UI state");
      return this._uiState = parsed;
    },
    async updateUiState(values = {}, removeKeys = []) {
      const operation = async () => {
        const current = await this.loadUiState();
        const next = { ...current, ...values };
        for (const key of removeKeys) delete next[key];
        const filePath = this.getUiStateFilePath();
        await IOUtils.writeUTF8(filePath, JSON.stringify(next), { tmpPath: `${filePath}.tmp` });
        this._uiState = next;
        return next;
      };
      const result = (this._uiStateQueue || Promise.resolve()).catch(() => {
      }).then(operation);
      this._uiStateQueue = result;
      return result;
    },
    registerDataListener(callback) {
      if (typeof callback === "function") {
        this._dataListeners.add(callback);
      }
    },
    unregisterDataListener(callback) {
      this._dataListeners.delete(callback);
    },
    broadcastToClients(msg) {
      return this.broadcastToIframes(msg);
    },
    broadcastToIframes(msg) {
      try {
        const windows = Services.wm.getEnumerator(null);
        while (windows.hasMoreElements()) {
          const win = windows.getNext();
          const iframe = win.document?.getElementById("researchflow-tab-iframe");
          if (iframe?.contentWindow?.postMessage) {
            try {
              iframe.contentWindow.postMessage(msg, "*");
            } catch (_) {
            }
          }
          if (win.name === "ResearchFlow_Window" || win.name === "ResearchFlow_SubWindow" || win.document?.title?.includes("ResearchFlow")) {
            if (typeof win.postMessage === "function") {
              try {
                win.postMessage(msg, "*");
              } catch (_) {
              }
            }
          }
        }
      } catch (_) {
      }
    },
    async syncStatusTagToItem(item, status) {
      if (typeof RFArchitectureGuard !== "undefined" && RFArchitectureGuard.syncStatusTagToItem) {
        return RFArchitectureGuard.syncStatusTagToItem(this, item, status);
      }
      if (!this.getPref("syncStatusTags", false)) {
        return true;
      }
      const target = getLiteratureItem(item);
      if (!target || target.deleted || typeof target.isEditable === "function" && !target.isEditable()) {
        Zotero.logError?.("[PaperFlow] syncStatusTagToItem blocked: Item is read-only or in trash");
        return false;
      }
      return false;
    },
    async addItemToPipelineCollection(item) {
      if (!this.getPref("autoAddToPipelineCollection", true)) {
        return null;
      }
      const target = getLiteratureItem(item);
      if (!target) return null;
      if (target.deleted || typeof target.isEditable === "function" && !target.isEditable()) {
        Zotero.logError?.("[PaperFlow] addItemToPipelineCollection blocked: Item is read-only or in trash");
        return null;
      }
      const libraryID = target.libraryID || Zotero.Libraries?.userLibraryID || 1;
      const collectionName = "🚀 Zotero PaperFlow 论文管线";
      try {
        let collection = Zotero.Collections?.getByLibrary?.(libraryID)?.find((c) => !c.deleted && (c.name === collectionName || c.name === "🚀 ResearchFlow 论文管线")) || null;
        if (!collection && Zotero.Collection) {
          collection = new Zotero.Collection();
          collection.libraryID = libraryID;
          collection.name = collectionName;
          await collection.saveTx();
        }
        if (collection) {
          if (typeof target.inCollection === "function" && !target.inCollection(collection.id)) {
            target.addToCollection(collection.id);
            await target.saveTx();
          }
        }
        return collection;
      } catch (e) {
        Zotero.logError?.("[PaperFlow] addItemToPipelineCollection error: " + e);
        return null;
      }
    },
    showToast(title, message, type = 'info', duration = 3500) {
      try {
        if (Zotero.ProgressWindow) {
          const pw = new Zotero.ProgressWindow({ closeOnClick: true });
          pw.changeHeadline(`Zotero PaperFlow · ${title}`);
          const icon = type === "success" ? "chrome://zotero/skin/tick.png" : type === "error" ? "chrome://zotero/skin/cross.png" : type === "warning" ? "chrome://zotero/skin/warning.png" : `${CHROME_ROOT}icons/researchflow.svg`;
          const itemProgress = new pw.ItemProgress(icon, message);
          itemProgress.setProgress(100);
          pw.show();
          pw.startCloseTimer(duration);
        }
      } catch (_) {
      }
    },
    initNotifier() {
      if (!Zotero.Notifier?.registerObserver) return;
      try {
        this.notifierID = Zotero.Notifier.registerObserver({
          notify: async (event, type, ids) => {
            if (type === "item") {
              if (event === "modify" || event === "trash" || event === "delete" || event === "add") {
                this.notifyDataChanged();
                this.broadcastToIframes({
                  type: "RESEARCHFLOW_ITEM_UPDATED",
                  event,
                  ids
                });
              }
            } else if (type === "collection") {
              this.broadcastToIframes({
                type: "RESEARCHFLOW_COLLECTION_UPDATED",
                event,
                ids
              });
            }
          }
        }, ["item", "collection"], ADDON_ID);
      } catch (err) {
        Zotero.logError?.("[PaperFlow] Notifier registration failed: " + err);
      }
    },
    destroyNotifier() {
      if (this.notifierID && Zotero.Notifier?.unregisterObserver) {
        try {
          Zotero.Notifier.unregisterObserver(this.notifierID);
        } catch (_) {
        }
        this.notifierID = null;
      }
    },
    initPrefObserver() {
      if (Zotero.Prefs?.registerObserver) {
        try {
          this._prefObserverSymbol = /* @__PURE__ */ Symbol("ResearchFlowPrefObserver");
          Zotero.Prefs.registerObserver("extensions.researchflow.showContextMenu", () => {
            this.updateItemContextMenu();
          }, this._prefObserverSymbol);
          Zotero.Prefs.registerObserver("extensions.researchflow.enableItemPane", () => {
            this.updateItemPaneSection();
          }, this._prefObserverSymbol);
          Zotero.Prefs.registerObserver("extensions.researchflow.enableReaderIntegration", () => {
            this.updateReaderContextMenu();
          }, this._prefObserverSymbol);
          Zotero.Prefs.registerObserver("extensions.researchflow.", (pref) => {
            const prefix = "extensions.researchflow.";
            const key = pref && pref.startsWith(prefix) ? pref.slice(prefix.length) : pref;
            if (key) {
              const val = this.getPref(key);
              if (this._cachedData) {
                if (!this._cachedData.settings) this._cachedData.settings = {};
                this._cachedData.settings[key] = val;
              }
              this.broadcastToIframes({
                type: "RESEARCHFLOW_PREF_CHANGED",
                key,
                value: val
              });
            }
          }, this._prefObserverSymbol);
        } catch (_) {
        }
      }
    },
    destroyPrefObserver() {
      if (this._prefObserverSymbol && Zotero.Prefs?.unregisterObserver) {
        try {
          Zotero.Prefs.unregisterObserver(this._prefObserverSymbol);
        } catch (_) {
        }
        this._prefObserverSymbol = null;
      }
    }
  };

  // src/host/menus.ts
  var hostMenuMethods = {
    registerMenus() {
      this.updateItemContextMenu();
      this.updateReaderContextMenu();
    },
    updateReaderContextMenu() {
      if (this._menuManagerReader && Zotero.MenuManager?.unregisterMenu) {
        try {
          Zotero.MenuManager.unregisterMenu(this._menuManagerReader);
        } catch (_) {
        }
        this._menuManagerReader = null;
      }
      const enableReader = Boolean(this.getPref("enableReaderIntegration", true));
      if (enableReader && Zotero.MenuManager && typeof Zotero.MenuManager.registerMenu === "function") {
        try {
          this._menuManagerReader = Zotero.MenuManager.registerMenu({
            menuID: "researchflow-reader-context",
            pluginID: ADDON_ID,
            target: "reader/menubar/edit",
            menus: [
              {
                menuType: "menuitem",
                label: "📝 摘录至 Zotero PaperFlow 稿件研究笔记",
                icon: `${CHROME_ROOT}icons/researchflow.svg`,
                onCommand: (event) => {
                  try {
                    this.createRecordFromReader(event?.target?.ownerDocument?.defaultView || event?.target?.ownerGlobal);
                  } catch (err) {
                    Zotero.logError?.("[PaperFlow] Reader context error: " + err);
                  }
                }
              }
            ]
          });
        } catch (err) {
          Zotero.logError?.("[PaperFlow] MenuManager register failed: " + err);
        }
      }
    },
    updateItemContextMenu() {
      if (this._menuManagerItem && Zotero.MenuManager?.unregisterMenu) {
        try {
          Zotero.MenuManager.unregisterMenu(this._menuManagerItem);
        } catch (_) {
        }
        this._menuManagerItem = null;
      }
      this.purgeStaleContextMenus();
      const showContextMenu = Boolean(this.getPref("showContextMenu", false));
      if (showContextMenu && Zotero.MenuManager && typeof Zotero.MenuManager.registerMenu === "function") {
        try {
          this._menuManagerItem = Zotero.MenuManager.registerMenu({
            menuID: "researchflow-itemmenu-actions",
            pluginID: ADDON_ID,
            target: "main/library/item",
            menus: [
              {
                menuType: "menuitem",
                label: "新建论文稿件管线",
                icon: `${CHROME_ROOT}icons/researchflow.svg`,
                onCommand: () => {
                  try {
                    this.createManuscriptFromSelection();
                  } catch (err) {
                    Zotero.logError?.("[PaperFlow] MenuManager create error: " + err);
                  }
                }
              },
              {
                menuType: "menuitem",
                label: "关联到现有稿件",
                icon: `${CHROME_ROOT}icons/researchflow.svg`,
                onCommand: () => {
                  try {
                    this.linkSelectionToManuscript();
                  } catch (err) {
                    Zotero.logError?.("[PaperFlow] MenuManager link error: " + err);
                  }
                }
              }
            ]
          });
        } catch (err) {
          Zotero.logError?.("[PaperFlow] MenuManager register failed: " + err);
        }
      }
    },
    purgeStaleContextMenus(targetWindow) {
      const staleMenuIds = [
        "researchflow-tools-preferences",
        "researchflow-itemmenu-separator",
        "researchflow-itemmenu-create",
        "researchflow-itemmenu-link",
        "researchflow-collectionmenu-separator",
        "researchflow-collectionmenu-create"
      ];
      const windows = targetWindow ? [targetWindow] : (() => {
        const list = [];
        if (typeof Services !== "undefined" && Services.wm?.getEnumerator) {
          try {
            const en = Services.wm.getEnumerator("");
            if (en && en.hasMoreElements()) {
              while (en.hasMoreElements()) list.push(en.getNext());
            } else {
              const enBrowser = Services.wm.getEnumerator("navigator:browser");
              while (enBrowser && enBrowser.hasMoreElements()) list.push(enBrowser.getNext());
            }
          } catch (_) {
          }
        }
        return list;
      })();
      windows.forEach((win) => {
        const doc = win?.document;
        if (!doc) return;
        staleMenuIds.forEach((id) => {
          try {
            doc.getElementById(id)?.remove();
          } catch (_) {
          }
        });
        doc.querySelectorAll?.('[pane-id="researchflow-item-pane"], [data-pane-id="researchflow-item-pane"], #researchflow-item-pane').forEach((el) => {
          try {
            el.remove();
          } catch (_) {
          }
        });
      });
    },
    unregisterMenus() {
      if (this._menuManagerItem && Zotero.MenuManager?.unregisterMenu) {
        try {
          Zotero.MenuManager.unregisterMenu(this._menuManagerItem);
        } catch (_) {
        }
        this._menuManagerItem = null;
      }
      if (this._menuManagerReader && Zotero.MenuManager?.unregisterMenu) {
        try {
          Zotero.MenuManager.unregisterMenu(this._menuManagerReader);
        } catch (_) {
        }
        this._menuManagerReader = null;
      }
      this.purgeStaleContextMenus();
    }
  };

  // src/host/database-recovery.ts
  var hostDatabaseRecoveryMethods = {
    recoveryFile(id) {
      const name = PathUtils.filename(this.getDataFilePath());
      const prefix = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (typeof id !== "string" || !new RegExp(`^${prefix}\\.conflict-\\d+-[a-z0-9]+\\.json$`).test(id)) {
        throw this.databaseError("recovery-invalid");
      }
      return PathUtils.join(PathUtils.parent(this.getDataFilePath()), id);
    },
    async readRecoveryJSON(file) {
      const info = await IOUtils.stat(file);
      if (info.type !== "regular" || info.size > 32 * 1024 * 1024) throw this.databaseError("recovery-size");
      const text = await IOUtils.readUTF8(file);
      return { data: JSON.parse(text), fingerprint: Zotero.Utilities.Internal.md5(text) };
    },
    recoveryToken(value) {
      if (!this._recoveryTokens) this._recoveryTokens = /* @__PURE__ */ new Map();
      for (const [key, item] of this._recoveryTokens) {
        if (Date.now() - item.time > 10 * 60 * 1e3) this._recoveryTokens.delete(key);
      }
      if (typeof value === "string") {
        const item = this._recoveryTokens.get(value);
        if (!item) throw this.databaseError("recovery-expired");
        return item;
      }
      while (this._recoveryTokens.size >= 8) this._recoveryTokens.delete(this._recoveryTokens.keys().next().value);
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      this._recoveryTokens.set(token, { ...value, time: Date.now() });
      return token;
    },
    async readRecoveryState(id) {
      const file = this.recoveryFile(id);
      if (await IOUtils.exists(`${file}.resolved.json`)) throw this.databaseError("recovery-resolved");
      const draft = await this.readRecoveryJSON(file);
      if (draft.data.format !== "zotero-paperflow-conflict-v1") throw this.databaseError("recovery-invalid");
      if (!draft.data.base) throw this.databaseError("recovery-base");
      for (const value of [draft.data.base, draft.data.local, draft.data.current]) this.validateDatabase(value);
      const current = await this.readRecoveryJSON(this.getDataFilePath());
      this.validateDatabase(current.data);
      return { file, draft, current };
    },
    recoveryChanges(before, after) {
      const rows = [];
      const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
      const visit = (oldValue, newValue, path, oldExists = true, newExists = true) => {
        if (oldExists === newExists && JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
        if (oldExists && newExists && object(oldValue) && object(newValue)) {
          for (const key of /* @__PURE__ */ new Set([...Object.keys(oldValue), ...Object.keys(newValue)])) {
            if (!path && ["revision", "lastUpdated", "updatedAt", "deviceId"].includes(key)) continue;
            visit(oldValue[key], newValue[key], path ? `${path}.${key}` : key, Object.hasOwn(oldValue, key), Object.hasOwn(newValue, key));
          }
          return;
        }
        const identified = (value) => Array.isArray(value) && value.every((item) => object(item) && Object.hasOwn(item, "id")) && new Set(value.map((item) => String(item.id))).size === value.length;
        if (oldExists && newExists && identified(oldValue) && identified(newValue)) {
          const old = new Map(oldValue.map((item) => [String(item.id), item]));
          const next = new Map(newValue.map((item) => [String(item.id), item]));
          if (JSON.stringify([...old.keys()]) !== JSON.stringify([...next.keys()])) {
            rows.push({ path: `${path}.order`, before: { exists: true, value: [...old.keys()] }, after: { exists: true, value: [...next.keys()] } });
          }
          for (const id of /* @__PURE__ */ new Set([...old.keys(), ...next.keys()])) visit(old.get(id), next.get(id), `${path}[${id}]`, old.has(id), next.has(id));
        } else rows.push({
          path,
          before: oldExists ? { exists: true, value: oldValue } : { exists: false },
          after: newExists ? { exists: true, value: newValue } : { exists: false }
        });
        if (rows.length > 500) throw this.databaseError("recovery-size");
      };
      visit(before, after, "");
      return rows;
    },
    recoveryDisplay(rows) {
      const redact = (value, key = "") => {
        if (/(password|secret|token|api.?key|authorization)/i.test(key)) return "••••••";
        if (Array.isArray(value)) return value.map((item) => redact(item));
        if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
        return value;
      };
      return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
        if (!["base", "local", "current", "before", "after"].includes(key)) return [key, value];
        if (!value?.exists) return [key, value];
        const text = JSON.stringify(redact(value.value, row.path), null, 2);
        return [key, { exists: true, text: text.slice(0, 12e3), truncated: text.length > 12e3 }];
      })));
    },
    async databaseConflictRecovery(action, payload = {}) {
      return this.enqueueDatabaseOperation(async () => {
        if (action === "list") {
          const paths = await IOUtils.getChildren(PathUtils.parent(this.getDataFilePath()));
          const entries = [];
          for (const path of paths) {
            const id2 = PathUtils.filename(path);
            try {
              this.recoveryFile(id2);
            } catch (_) {
              continue;
            }
            entries.push({ id: id2, createdAt: Number(id2.match(/\.conflict-(\d+)-/)[1]) });
          }
          entries.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
          const visible = entries.slice(0, 100);
          for (const item of visible) item.resolved = await IOUtils.exists(`${this.recoveryFile(item.id)}.resolved.json`);
          return { entries: visible, truncated: entries.length > visible.length };
        }
        if (!["inspect", "preview", "apply"].includes(action)) throw this.databaseError("recovery-invalid");
        const previous = action === "inspect" ? null : this.recoveryToken(payload.token);
        if (previous && previous.stage !== (action === "preview" ? "inspect" : "preview")) throw this.databaseError("recovery-expired");
        const id = previous?.id || payload.id;
        const state = await this.readRecoveryState(id);
        const { draft, current, file } = state;
        if (previous && (previous.draft !== draft.fingerprint || previous.current !== current.fingerprint)) throw this.databaseError("recovery-stale");
        const choices = action === "apply" ? previous.choices : payload.choices;
        const merge = this.mergeDatabaseEdits(draft.data.base, draft.data.local, current.data, { details: true, choices });
        if (merge.details.length > 500) throw this.databaseError("recovery-size");
        const stamp = { id, draft: draft.fingerprint, current: current.fingerprint };
        if (action === "inspect") return {
          id,
          createdAt: draft.data.createdAt,
          revision: current.data.revision,
          rows: this.recoveryDisplay(merge.details),
          token: this.recoveryToken({ ...stamp, stage: "inspect" })
        };
        const keys = merge.details.map((row) => row.key);
        if (!choices || typeof choices !== "object" || Array.isArray(choices) || Object.keys(choices).length !== keys.length || !keys.every((key) => Object.hasOwn(choices, key) && ["base", "local", "current"].includes(choices[key]))) {
          throw this.databaseError("recovery-choice");
        }
        this.validateDatabase(merge.data);
        const changes = this.recoveryChanges(current.data, merge.data);
        if (action === "preview") return {
          revision: current.data.revision,
          changes: this.recoveryDisplay(changes),
          token: this.recoveryToken({ ...stamp, stage: "preview", choices: this.cloneDatabase(choices) })
        };
        if (!changes.length) throw this.databaseError("recovery-empty");
        const backup = `${this.getDataFilePath()}.before-recovery-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
        await IOUtils.writeUTF8(backup, JSON.stringify(current.data, null, 2), { tmpPath: `${backup}.tmp` });
        const lastRead = await this.readRecoveryJSON(this.getDataFilePath());
        if (lastRead.fingerprint !== current.fingerprint) throw this.databaseError("recovery-stale");
        this._cachedData = this.cloneDatabase(current.data);
        this.rememberDatabaseSnapshot(current.data);
        const saved = await this.writeDatabaseSnapshot(merge.data);
        this._recoveryTokens.delete(payload.token);
        let warning = false;
        try {
          await IOUtils.writeUTF8(`${file}.resolved.json`, JSON.stringify({
            format: "zotero-paperflow-resolution-v1",
            resolvedAt: (/* @__PURE__ */ new Date()).toISOString(),
            revision: saved.revision,
            backup: PathUtils.filename(backup)
          }), { tmpPath: `${file}.resolved.json.tmp` });
        } catch (error) {
          warning = true;
          Zotero.logError?.(error);
        }
        return { data: saved, backup: PathUtils.filename(backup), warning };
      });
    },
    async preserveDatabaseConflict(base, local, current, conflicts) {
      const file = `${this.getDataFilePath()}.conflict-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
      const draft = {
        format: "zotero-paperflow-conflict-v1",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        conflicts,
        base,
        local,
        current
      };
      try {
        await IOUtils.writeUTF8(file, JSON.stringify(draft, null, 2), { tmpPath: `${file}.tmp` });
      } catch (error) {
        throw this.databaseError("conflict-draft-failed", { reason: String(error?.message || error) });
      }
      return this.databaseError("merge-conflict", { fields: conflicts.slice(0, 3).join(", "), file });
    }
  };

  // src/host/database-merge.ts
  var hostDatabaseMergeMethods = {
    mergeDatabaseEdits(base, local, current, options = {}) {
      const missing = /* @__PURE__ */ Symbol("missing");
      const conflicts = [];
      const details = [];
      const conflict = (before, edited, latest, path, tokens, kind = "value") => {
        const key = JSON.stringify([kind, ...tokens]);
        const box = (value) => value === missing ? { exists: false } : { exists: true, value };
        conflicts.push(path);
        if (options.details) details.push({ key, path, kind, base: box(before), local: box(edited), current: box(latest) });
        const choice = options.choices?.[key];
        return choice === "base" ? before : choice === "local" ? edited : latest;
      };
      const object = (value) => value !== missing && value !== null && typeof value === "object" && !Array.isArray(value);
      const same = (a, b) => {
        if (a === b) return true;
        if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
        if (object(a) && object(b)) {
          const keys = Object.keys(a);
          return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && same(a[key], b[key]));
        }
        return false;
      };
      const identified = (values) => Array.isArray(values) && values.every((item) => object(item) && (typeof item.id === "string" && item.id.trim() || typeof item.id === "number" && Number.isFinite(item.id))) && new Set(values.map((item) => String(item.id))).size === values.length;
      const merge = (before, edited, latest, path, tokens = []) => {
        if (same(edited, before)) return latest;
        if (same(latest, before) || same(edited, latest)) return edited;
        if (object(edited) && object(latest) && (object(before) || before === missing)) {
          const result = {};
          for (const key of /* @__PURE__ */ new Set([...Object.keys(latest), ...Object.keys(edited), ...Object.keys(before === missing ? {} : before)])) {
            if (["__proto__", "constructor", "prototype"].includes(key)) continue;
            const value = (obj) => obj !== missing && Object.hasOwn(obj, key) ? obj[key] : missing;
            let combined;
            if (!path && ["revision", "lastUpdated", "updatedAt", "deviceId"].includes(key)) combined = value(latest);
            else if (["updatedAt", "deletedAt"].includes(key) && Date.parse(edited[key]) && Date.parse(latest[key])) {
              combined = Date.parse(edited[key]) >= Date.parse(latest[key]) ? edited[key] : latest[key];
            } else combined = merge(value(before), value(edited), value(latest), path ? `${path}.${key}` : key, [...tokens, ["field", key]]);
            if (combined !== missing) result[key] = combined;
          }
          return result;
        }
        if (identified(edited) && identified(latest) && (identified(before) || before === missing)) {
          const map = (values) => new Map((values === missing ? [] : values).map((item) => [String(item.id), item]));
          const old = map(before), ours = map(edited), theirs = map(latest);
          const common = new Set([...old.keys()].filter((id) => ours.has(id) && theirs.has(id)));
          const order = (records) => [...records.keys()].filter((id) => common.has(id));
          const localReordered = !same(order(old), order(ours));
          const latestReordered = !same(order(old), order(theirs));
          let preferred = localReordered && !latestReordered ? ours : theirs;
          if (localReordered && latestReordered && !same(order(ours), order(theirs))) {
            const selected = conflict([...old.keys()], [...ours.keys()], [...theirs.keys()], `${path}.order`, tokens, "order");
            preferred = new Map(selected.map((id) => [id, null]));
          }
          const result = [];
          for (const id of /* @__PURE__ */ new Set([...preferred.keys(), ...theirs.keys(), ...ours.keys(), ...old.keys()])) {
            const entry = (records) => records.has(id) ? records.get(id) : missing;
            const combined = merge(entry(old), entry(ours), entry(theirs), `${path}[${id}]`, [...tokens, ["id", id]]);
            if (combined !== missing) result.push(combined);
          }
          return result;
        }
        return conflict(before, edited, latest, path, tokens);
      };
      const data = merge(base, local, current, "");
      return options.details ? { data, conflicts, details } : { data, conflicts };
    }
  };

  // src/host/database-storage.ts
  var hostDatabaseStorageMethods = {
    async searchLibrary(query, limit = 15) {
      const libraryID = arguments[2] ?? null;
      if (!query || typeof query !== "string") return [];
      const q = query.trim();
      if (!q) return [];
      try {
        const results = [];
        const seenKeys = /* @__PURE__ */ new Set();
        if (Zotero.Search) {
          const userLibID = Zotero.Libraries?.userLibraryID || 1;
          const targetLibs = libraryID ? [libraryID] : [userLibID, ...typeof Zotero.Libraries?.getAll === "function" ? Zotero.Libraries.getAll().map((l) => l.libraryID || l.id).filter((id) => id && id !== userLibID) : []];
          for (const targetLib of targetLibs) {
            if (results.length >= limit) break;
            try {
              const s = new Zotero.Search();
              s.libraryID = targetLib;
              s.addCondition("quicksearch-titleCreatorYear", "contains", q);
              const ids = await s.search() || [];
              for (const id of ids.slice(0, limit * 2)) {
                const it = Zotero.Items.get(id);
                const lit = getLiteratureItem(it);
                if (lit && !seenKeys.has(lit.key)) {
                  seenKeys.add(lit.key);
                  results.push(serializeLiteratureItem(lit));
                  if (results.length >= limit) break;
                }
              }
            } catch (_) {
            }
          }
        }
        return results;
      } catch (err) {
        Zotero.logError?.("[PaperFlow] searchLibrary error: " + err);
        return [];
      }
    },
    notifyDataChanged() {
      for (const listener of this._dataListeners) {
        try {
          listener();
        } catch (_) {
        }
      }
      this.broadcastToIframes({ type: "RESEARCHFLOW_DATA_UPDATED", data: this._cachedData });
    },
    databaseCollections() {
      return ["researchAreas", "projects", "researchRecords", "manuscripts", "submissions", "tasks"];
    },
    databaseError(key, args = {}) {
      if (!this._databaseL10n) {
        const { Localization } = Zotero.getMainWindow();
        this._databaseL10n = new Localization(["researchflow.ftl"], true);
      }
      return new Error(this._databaseL10n.formatValueSync(`researchflow-database-${key}`, args));
    },
    validateDatabase(data) {
      const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
      const collections = this.databaseCollections();
      if (!isObject(data) || !collections.some((key) => Array.isArray(data[key]))) {
        throw this.databaseError("invalid-backup");
      }
      if (data.schemaVersion != null && (!Number.isInteger(Number(data.schemaVersion)) || Number(data.schemaVersion) < 1 || Number(data.schemaVersion) > 7)) {
        throw this.databaseError("unsupported-version");
      }
      const checkRecords = (records, key) => {
        if (!Array.isArray(records)) throw this.databaseError("invalid-collection", { field: key });
        const seen = /* @__PURE__ */ new Set();
        for (const record of records) {
          const id = record?.id;
          if (!isObject(record) || !(typeof id === "string" && id.trim() || typeof id === "number" && Number.isFinite(id))) {
            throw this.databaseError("invalid-id", { field: key });
          }
          if (seen.has(String(id))) throw this.databaseError("duplicate-id", { field: key });
          seen.add(String(id));
        }
      };
      for (const key of collections) {
        if (key in data) checkRecords(data[key], key);
      }
      if ("settings" in data && !isObject(data.settings)) throw this.databaseError("invalid-settings");
      if ("deletedEntities" in data) {
        if (!isObject(data.deletedEntities)) throw this.databaseError("invalid-deletions");
        for (const key of collections) {
          if (key in data.deletedEntities) checkRecords(data.deletedEntities[key], `deletedEntities.${key}`);
        }
      }
    },
    cloneDatabase(data) {
      if (typeof structuredClone === "function") {
        try {
          return structuredClone(data);
        } catch (_) {
        }
      }
      return JSON.parse(JSON.stringify(data));
    },
    enqueueDatabaseOperation(operation) {
      const result = (this._saveQueue || Promise.resolve()).catch(() => {
      }).then(operation);
      this._saveQueue = result;
      return result;
    },
    async loadDatabase() {
      return this.enqueueDatabaseOperation(() => this.readDatabaseSnapshot());
    },
    rememberDatabaseSnapshot(data) {
      if (!this._databaseHistory) this._databaseHistory = /* @__PURE__ */ new Map();
      const revision = Number(data.revision) || 0;
      this._databaseHistory.set(revision, JSON.stringify(data));
      let size = Array.from(this._databaseHistory.values()).reduce((sum, text) => sum + (text?.length || 0), 0);
      while (this._databaseHistory.size > 12 || size > 4 * 1024 * 1024) {
        const oldest = this._databaseHistory.keys().next().value;
        size -= this._databaseHistory.get(oldest)?.length || 0;
        this._databaseHistory.delete(oldest);
      }
    },
    async readDatabaseSnapshot() {
      if (this._cachedData) return this.cloneDatabase(this._cachedData);
      const filePath = this.getDataFilePath();
      const exists = await IOUtils.exists(filePath);
      if (exists) {
        try {
          const content = await IOUtils.readUTF8(filePath);
          const parsed = JSON.parse(content);
          this.validateDatabase(parsed);
          if (!parsed.settings) parsed.settings = {};
          if (typeof this.getSyncedSettingsFromPrefs === "function") {
            parsed.settings = this.getSyncedSettingsFromPrefs(parsed.settings);
          }
          this._cachedData = parsed;
          this.rememberDatabaseSnapshot(parsed);
          return this.cloneDatabase(parsed);
        } catch (e) {
          Zotero.logError?.("[PaperFlow] Failed to read researchflow-data.json: " + e);
          throw e;
        }
      }
      let preloaded = null;
      try {
        const response = await fetch(`${CHROME_ROOT}data/preloaded_db.json`);
        if (response.ok) preloaded = await response.json();
      } catch (error) {
        Zotero.logError?.("[PaperFlow] Bundled database unavailable: " + error);
      }
      if (preloaded) {
        this.validateDatabase(preloaded);
        return this.writeDatabaseSnapshot(preloaded);
      }
      const initial = {
        schemaVersion: 7,
        lastUpdated: Date.now(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        revision: 1,
        deviceId: "zotero_" + Math.random().toString(36).slice(2),
        researchAreas: [],
        projects: [],
        researchRecords: [],
        manuscripts: [],
        submissions: [],
        tasks: [],
        deletedEntities: { researchAreas: [], projects: [], researchRecords: [], manuscripts: [], submissions: [], tasks: [] },
        settings: {
          syncProviders: { metadata: { provider: "local", config: {}, autoSync: true } },
          profile: { displayName: "", chineseName: "", englishName: "", affiliation: "", orcid: "", language: "zh", theme: "system" }
        }
      };
      return this.writeDatabaseSnapshot(initial);
    },
    async saveDatabase(data, options = {}) {
      this.validateDatabase(data);
      let snapshot = this.cloneDatabase(data);
      const expectedRevision = options?.expectedRevision;
      const replace = options?.replace === true;
      return this.enqueueDatabaseOperation(async () => {
        const current = await this.readDatabaseSnapshot();
        if (expectedRevision != null) {
          const actualRevision = Number(current.revision) || 0;
          if (!Number.isInteger(Number(expectedRevision)) || Number(expectedRevision) < 0) {
            throw this.databaseError("revision-conflict", {
              expected: Number(expectedRevision),
              actual: actualRevision
            });
          }
          if (Number(expectedRevision) !== actualRevision) {
            const storedBase = this._databaseHistory?.get(Number(expectedRevision));
            const base = storedBase ? JSON.parse(storedBase) : null;
            const merged = base && !replace ? this.mergeDatabaseEdits(base, snapshot, current) : null;
            if (!merged || merged.conflicts.length) {
              throw await this.preserveDatabaseConflict(
                base,
                snapshot,
                current,
                merged?.conflicts || ["database"]
              );
            }
            snapshot = merged.data;
            this.validateDatabase(snapshot);
          }
        }
        return this.writeDatabaseSnapshot(snapshot);
      });
    },
    async writeDatabaseSnapshot(data, fallbackRevision = 0) {
      const previousRevision = Number(this._cachedData?.revision) || Number(fallbackRevision) || 0;
      const snapshot = {
        ...data,
        revision: previousRevision + 1,
        lastUpdated: Date.now(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const filePath = this.getDataFilePath();
      try {
        await IOUtils.writeUTF8(filePath, JSON.stringify(snapshot, null, 2), { tmpPath: `${filePath}.tmp` });
        this._cachedData = this.cloneDatabase(snapshot);
        this.rememberDatabaseSnapshot(snapshot);
        this.notifyDataChanged();
        return this.cloneDatabase(snapshot);
      } catch (error) {
        Zotero.logError?.("[PaperFlow] Failed to write researchflow-data.json: " + error);
        throw error;
      }
    },
    mergeDatabaseBackup(current, incoming) {
      const merged = { ...current, ...incoming };
      const mergeObjects = (oldValue, newValue) => {
        const result = { ...oldValue };
        for (const [key, value] of Object.entries(newValue || {})) {
          if (["__proto__", "constructor", "prototype"].includes(key)) continue;
          result[key] = value && typeof value === "object" && !Array.isArray(value) ? mergeObjects(oldValue?.[key], value) : value;
        }
        return result;
      };
      merged.settings = mergeObjects(current.settings, incoming.settings);
      merged.deletedEntities = { ...current.deletedEntities, ...incoming.deletedEntities };
      const timestamp = (item) => Date.parse(item?.deletedAt || item?.updatedAt || item?.createdAt || "") || 0;
      for (const key of this.databaseCollections()) {
        const records = /* @__PURE__ */ new Map();
        for (const item of current[key] || []) records.set(String(item.id), item);
        for (const item of incoming[key] || []) {
          const id = String(item.id);
          records.set(id, { ...records.get(id), ...item });
        }
        const deleted = /* @__PURE__ */ new Map();
        for (const item of [...current.deletedEntities?.[key] || [], ...incoming.deletedEntities?.[key] || []]) {
          const id = String(item.id);
          if (!deleted.has(id) || timestamp(item) >= timestamp(deleted.get(id))) deleted.set(id, item);
        }
        merged.deletedEntities[key] = Array.from(deleted.values());
        merged[key] = Array.from(records.values()).filter((item) => !deleted.has(String(item.id)) || timestamp(item) > timestamp(deleted.get(String(item.id))));
      }
      return merged;
    },
    async importDatabase(importedData, mode = "merge") {
      this.validateDatabase(importedData);
      if (mode !== "merge" && mode !== "overwrite") throw new Error("无效的导入方式");
      const incoming = this.cloneDatabase(importedData);
      return this.enqueueDatabaseOperation(async () => {
        const current = await this.readDatabaseSnapshot();
        const importedSnapshot = mode === "overwrite" ? incoming : this.mergeDatabaseBackup(current, incoming);
        this.validateDatabase(importedSnapshot);
        const backupPath = this.getBackupFilePath();
        await IOUtils.writeUTF8(backupPath, JSON.stringify(current, null, 2), { tmpPath: `${backupPath}.tmp` });
        const saved = await this.writeDatabaseSnapshot(importedSnapshot);
        if (mode === "overwrite") {
          this._databaseHistory = /* @__PURE__ */ new Map();
          this.rememberDatabaseSnapshot(saved);
        }
        return saved;
      });
    },
    async restoreBackupDatabase() {
      return this.enqueueDatabaseOperation(async () => {
        const backupPath = this.getBackupFilePath();
        if (!await IOUtils.exists(backupPath)) throw new Error("未找到前次导入备份文件");
        const restored = JSON.parse(await IOUtils.readUTF8(backupPath));
        this.validateDatabase(restored);
        let fallbackRevision = 0;
        try {
          await this.readDatabaseSnapshot();
        } catch (error) {
          Zotero.logError?.("[PaperFlow] Restoring backup over unreadable database: " + error);
          fallbackRevision = Number(restored.revision) || 0;
        }
        const saved = await this.writeDatabaseSnapshot(restored, fallbackRevision);
        this._databaseHistory = /* @__PURE__ */ new Map();
        this.rememberDatabaseSnapshot(saved);
        return saved;
      });
    }
  };

  // src/host/file-pickers.ts
  var hostFilePickerMethods = {
    async saveShareImageFile(pngBytes, fileName, language = "en", window2 = null) {
      if (this._shareImageSavePending) return { success: false, error: "An image save is already in progress." };
      this._shareImageSavePending = true;
      try {
        const bytes = new Uint8Array(pngBytes);
        const signature = [137, 80, 78, 71, 13, 10, 26, 10];
        if (bytes.length < 8 || bytes.length > 64 * 1024 * 1024 || !signature.every((value, index) => bytes[index] === value)) {
          throw new Error("Invalid PNG image.");
        }
        const { FilePicker } = ChromeUtils.importESModule("chrome://zotero/content/modules/filePicker.mjs");
        const fp = new FilePicker();
        const win = window2 || Zotero.getMainWindow?.() || Services.wm?.getMostRecentWindow("navigator:browser");
        if (!win?.browsingContext) throw new Error("Zotero window is unavailable.");
        fp.init(win, language === "zh" ? "另存为 Zotero PaperFlow 图片" : "Save Zotero PaperFlow image as", fp.modeSave);
        fp.defaultExtension = "png";
        fp.appendFilter("PNG (*.png)", "*.png");
        const safeName = String(fileName || "researchflow-journey.png").replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").slice(0, 140).replace(/[. ]+$/g, "");
        fp.defaultString = /\.png$/i.test(safeName) ? safeName : `${safeName || "researchflow-journey"}.png`;
        const result = await fp.show();
        if (result !== fp.returnOK && result !== fp.returnReplace) return { success: false, cancelled: true };
        const filePath = fp.file;
        if (!filePath) throw new Error("No save path was selected.");
        await IOUtils.write(filePath, bytes);
        return { success: true, filePath };
      } catch (error) {
        Zotero.logError?.("[PaperFlow] saveShareImageFile error: " + error);
        return { success: false, error: String(error?.message || error) };
      } finally {
        this._shareImageSavePending = false;
      }
    },
    async exportDatabaseFile(window2 = null) {
      try {
        const { FilePicker } = ChromeUtils.importESModule("chrome://zotero/content/modules/filePicker.mjs");
        const fp = new FilePicker();
        const win = Zotero.getMainWindow?.() || window2 || Services.wm?.getMostRecentWindow("navigator:browser");
        if (!win?.browsingContext) throw new Error("Zotero 主窗口不可用");
        fp.init(win, "导出 ResearchFlow 数据库", fp.modeSave);
        fp.defaultExtension = "json";
        fp.appendFilter("JSON Files (*.json)", "*.json");
        const dateStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        fp.defaultString = `researchflow-export-${dateStr}.json`;
        const res = await fp.show();
        if (res === fp.returnOK || res === fp.returnReplace) {
          const filePath = fp.file;
          const data = await this.loadDatabase();
          const jsonStr = JSON.stringify(data, null, 2);
          await IOUtils.writeUTF8(filePath, jsonStr);
          this.showToast("导出成功", `数据库已保存至：${filePath}`, "success");
          return { success: true, filePath };
        }
      } catch (err) {
        Zotero.logError?.("[PaperFlow] exportDatabaseFile error: " + err);
        this.showToast("导出失败", String(err?.message || err), "error");
        return { success: false, error: err?.message };
      }
      return { success: false, cancelled: true };
    },
    async importDatabaseFile(mode = "merge", window2 = null) {
      try {
        const { FilePicker } = ChromeUtils.importESModule("chrome://zotero/content/modules/filePicker.mjs");
        const fp = new FilePicker();
        const win = Zotero.getMainWindow?.() || window2 || Services.wm?.getMostRecentWindow("navigator:browser");
        if (!win?.browsingContext) throw new Error("Zotero 主窗口不可用");
        fp.init(win, "选择 ResearchFlow JSON 备份文件导入", fp.modeOpen);
        fp.defaultExtension = "json";
        fp.appendFilter("JSON Files (*.json)", "*.json");
        const res = await fp.show();
        if (res === fp.returnOK) {
          const filePath = fp.file;
          const rawText = await IOUtils.readUTF8(filePath);
          let importedJson;
          try {
            importedJson = JSON.parse(rawText);
          } catch (pe) {
            throw new Error("所选文件不是合法的 JSON 格式备份");
          }
          const saved = await this.importDatabase(importedJson, mode);
          this.showToast("导入成功", `已从 ${filePath} 导入数据库`, "success");
          return { success: true, data: saved };
        }
      } catch (err) {
        Zotero.logError?.("[PaperFlow] importDatabaseFile error: " + err);
        this.showToast("导入失败", String(err?.message || err), "error");
        return { success: false, error: err?.message };
      }
      return { success: false, cancelled: true };
    },
    async exportDiagnosticsFile(report = null, window2 = null) {
      try {
        const { FilePicker } = ChromeUtils.importESModule("chrome://zotero/content/modules/filePicker.mjs");
        const fp = new FilePicker();
        const win = Zotero.getMainWindow?.() || window2 || Services.wm?.getMostRecentWindow("navigator:browser");
        if (!win?.browsingContext) throw new Error("Zotero 主窗口不可用");
        fp.init(win, "导出 ResearchFlow 诊断报告", fp.modeSave);
        fp.defaultExtension = "json";
        fp.appendFilter("JSON Files (*.json)", "*.json");
        const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        fp.defaultString = `researchflow-diagnostics-${dateStr}.json`;
        const res = await fp.show();
        if (res === fp.returnOK || res === fp.returnReplace) {
          const filePath = fp.file;
          const jsonStr = JSON.stringify(report || {}, null, 2);
          await IOUtils.writeUTF8(filePath, jsonStr);
          this.showToast("导出成功", `诊断信息已保存至：${filePath}`, "success");
          return { success: true, filePath };
        }
      } catch (err) {
        Zotero.logError?.("[PaperFlow] exportDiagnosticsFile error: " + err);
        this.showToast("导出失败", String(err?.message || err), "error");
        return { success: false, error: err?.message };
      }
      return { success: false, cancelled: true };
    }
  };

  // src/host/child-notes.ts
  var hostChildNoteMethods = {
    async syncManuscriptToChildNote(item, manuscript = null) {
      if (typeof RFArchitectureGuard !== "undefined" && RFArchitectureGuard.syncManuscriptToChildNote) {
        return RFArchitectureGuard.syncManuscriptToChildNote(this, item, manuscript);
      }
      const target = getLiteratureItem(item);
      if (!target || target.deleted || typeof target.isEditable === "function" && !target.isEditable()) {
        Zotero.logError?.("[PaperFlow] syncManuscriptToChildNote blocked: Item is read-only or in trash");
        return null;
      }
      return null;
    }
  };

  // src/host/window-ui.ts
  var hostWindowUiMethods = {
    ensureToolbarButton(window2, windowElements, retryCount = 0) {
      if (!window2 || !window2.document) return;
      const doc = window2.document;
      const toolbar = doc.getElementById("zotero-item-toolbar") || doc.getElementById("zotero-items-toolbar") || doc.getElementById("zotero-tb");
      if (!toolbar) {
        if (retryCount < 5) {
          const retryTimer = window2.setTimeout(() => this.ensureToolbarButton(window2, windowElements, retryCount + 1), 500);
          if (windowElements) {
            windowElements.push({ remove: () => window2.clearTimeout(retryTimer) });
          }
        }
        return;
      }
      const isResearchFlowButton = (b) => b.id === "researchflow-toolbar-button" || (b.getAttribute("label") === "Zotero PaperFlow" || b.getAttribute("label") === "ResearchFlow") && String(b.getAttribute("image") || "").includes("researchflow.svg");
      const existing = Array.from(doc.querySelectorAll("toolbarbutton")).filter(isResearchFlowButton);
      let btn = existing[0] || null;
      if (existing.length > 1) {
        for (let i = 1; i < existing.length; i++) {
          try {
            existing[i].remove();
          } catch (_) {
          }
        }
      }
      if (!btn) {
        btn = this.createXULElement(doc, "toolbarbutton");
        btn.id = "researchflow-toolbar-button";
        btn.setAttribute("tooltiptext", "打开 Zotero PaperFlow 工作台 (Ctrl+Alt+R)");
        btn.setAttribute("image", `${CHROME_ROOT}icons/researchflow.svg`);
        btn.setAttribute("class", "zotero-tb-button toolbarbutton-1 chromeclass-toolbar-additional");
        btn.setAttribute(
          "style",
          "cursor: pointer; margin: 0 4px; width: 28px; height: 28px; min-width: 28px; max-width: 28px; max-height: 28px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden;"
        );
        btn.addEventListener("command", (e) => {
          if (e) {
            e.preventDefault?.();
            e.stopPropagation?.();
          }
          this.triggerResearchFlowOpen(window2);
        });
      }
      btn.setAttribute("label", "");
      btn.setAttribute("aria-label", "Zotero PaperFlow");
      const constrainIcon = () => {
        try {
          const img = btn?.querySelector(".toolbarbutton-icon") || btn?.querySelector("image") || btn?.querySelector("img");
          if (img) {
            img.style.width = "20px";
            img.style.height = "20px";
            img.style.maxWidth = "20px";
            img.style.maxHeight = "20px";
            img.setAttribute("width", "20");
            img.setAttribute("height", "20");
          }
        } catch (_) {
        }
      };
      constrainIcon();
      const t1 = window2.setTimeout(constrainIcon, 150);
      const t2 = window2.setTimeout(constrainIcon, 800);
      if (windowElements) {
        windowElements.push(
          { remove: () => window2.clearTimeout(t1) },
          { remove: () => window2.clearTimeout(t2) }
        );
      }
      const toolbarChildren = Array.from(toolbar.children || []);
      const flexibleSpacerIndex = toolbarChildren.findIndex((child) => {
        const tag = String(child.localName || child.tagName || "").toLowerCase();
        return tag === "toolbarspring" || tag === "spacer" && Number(child.getAttribute("flex") || 0) > 0 || child.id === "zotero-tb-search" || child.id === "zotero-tb-search-textbox" || child.classList?.contains("zotero-search-box") || child.classList?.contains("search-box");
      });
      const leadingActionItems = flexibleSpacerIndex >= 0 ? toolbarChildren.slice(0, flexibleSpacerIndex) : toolbarChildren;
      const toolbarButtons = leadingActionItems.filter(
        (child) => String(child.localName || child.tagName || "").toLowerCase() === "toolbarbutton" && !isResearchFlowButton(child) && !child.hidden && child.getAttribute("hidden") !== "true" && child.getAttribute("collapsed") !== "true"
      );
      const anchor = toolbarButtons.reverse().find((child) => {
        try {
          const style = window2.getComputedStyle(child);
          return style.display !== "none" && style.visibility !== "collapse";
        } catch (_) {
          return true;
        }
      }) || null;
      if (anchor && anchor.parentNode === toolbar) {
        if (anchor.nextSibling !== btn) {
          anchor.parentNode.insertBefore(btn, anchor.nextSibling);
        }
      } else {
        const searchBox = doc.getElementById("zotero-tb-search-textbox") || doc.getElementById("zotero-tb-search") || toolbar.querySelector("input") || (flexibleSpacerIndex >= 0 ? toolbarChildren[flexibleSpacerIndex] : null);
        if (searchBox && searchBox.parentNode === toolbar) {
          toolbar.insertBefore(btn, searchBox);
        } else {
          toolbar.appendChild(btn);
        }
      }
      if (windowElements && !windowElements.includes(btn)) {
        windowElements.push(btn);
      }
    },
    openStandaloneWindow(options = {}, targetWindow = null, windowType = "window") {
      try {
        const ww = Services.ww;
        let features = "";
        let windowName = "";
        const url = `${CHROME_ROOT}index.html?mode=${encodeURIComponent(windowType)}${options.settingsOnly === true ? "&settingsOnly=1#paperflow-recovery" : ""}`;
        if (windowType === "subwindow") {
          const alwaysRaised = this.getPref("subwindowAlwaysOnTop", false) ? ",alwaysRaised=yes" : "";
          features = `chrome,dialog=no,all,resizable=yes,minimizable=yes,width=480,height=780,top=80,left=80${alwaysRaised}`;
          windowName = "ResearchFlow_SubWindow";
        } else {
          features = "chrome,dialog=no,all,resizable=yes,minimizable=yes,width=1240,height=820,centerscreen";
          windowName = "ResearchFlow_Window";
        }
        if (options.settingsOnly === true) windowName = "ResearchFlow_Recovery";
        const mainWin = targetWindow && targetWindow.Zotero_Tabs ? targetWindow : Zotero.getMainWindow ? Zotero.getMainWindow() : Services.wm.getMostRecentWindow("navigator:browser");
        const win = ww.openWindow(
          mainWin,
          url,
          windowName,
          features,
          { Zotero, options: { ...options, currentWindowType: windowType } }
        );
        if (win) {
          const attachHost = () => {
            const page = win.wrappedJSObject || win;
            page.Zotero = Zotero;
            page._researchflowPending = { ...options, currentWindowType: windowType };
          };
          attachHost();
          win.addEventListener("DOMContentLoaded", attachHost, { once: true, capture: true });
          if (!this._standaloneWindows) this._standaloneWindows = /* @__PURE__ */ new Set();
          this._standaloneWindows.add(win);
          win.addEventListener("unload", () => {
            mainWin.setTimeout(() => {
              if (win.closed) this._standaloneWindows?.delete(win);
            }, 0);
          });
        }
        if (win && win.focus) win.focus();
      } catch (err) {
        Zotero.logError?.("[PaperFlow] openStandaloneWindow error: " + err);
      }
    },
    openPreferencesPane(window2) {
      try {
        const win = window2 || Zotero.getMainWindow?.();
        if (Zotero.Utilities?.Internal?.openPreferences) {
          Zotero.Utilities.Internal.openPreferences("researchflow-preferences-pane");
        } else if (win?.openPreferences) {
          win.openPreferences("researchflow-preferences-pane");
        } else {
          win?.openDialog?.("chrome://zotero/content/preferences/preferences.xhtml", "Preferences", "chrome,titlebar,toolbar,centerscreen,dialog=yes");
        }
      } catch (e) {
        Zotero.logError?.("[PaperFlow] Could not open preferences: " + e);
      }
    }
  };

  // src/host/message-handler.ts
  function createHostMessageHandler(host, window2) {
    return function handleHostMessage(event) {
      try {
        const data = event.data;
        if (!data || typeof data !== "object") return;
        if (typeof data.type !== "string" || !data.type.startsWith("RESEARCHFLOW_")) return;
        const sourceWin = event.source;
        const iframe = window2.document.getElementById("researchflow-tab-iframe");
        const replyResult = (msgObj) => {
          try {
            if (sourceWin && typeof sourceWin.postMessage === "function") {
              sourceWin.postMessage(msgObj, "*");
            } else if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage(msgObj, "*");
            }
          } catch (_) {
          }
        };
        if (data.type === "RESEARCHFLOW_CONFLICT_RECOVERY") {
          const knownFrame = iframe?.contentWindow;
          let trusted = Boolean(knownFrame && (!sourceWin || sourceWin === knownFrame));
          try {
            const url = new URL(sourceWin?.location?.href);
            trusted ||= url.protocol === "chrome:" && url.hostname === "researchflow" && ["/content/index.html", "/content/pages/options.html"].includes(url.pathname);
          } catch (_) {
          }
          if (!trusted) return;
          host.databaseConflictRecovery(data.action, data.payload).then((result) => {
            replyResult({ requestId: data.requestId, success: true, data: result });
          }).catch((error) => replyResult({ requestId: data.requestId, success: false, error: String(error?.message || error) }));
          return;
        }
        if (data.type === "RESEARCHFLOW_READY") {
          host.loadDatabase().then((storedData) => {
            replyResult({
              type: "RESEARCHFLOW_INIT_DATA",
              data: storedData,
              pending: iframe?._researchflowPending || null
            });
            if (iframe) iframe._researchflowPending = null;
          });
          return;
        }
        if (data.type === "RESEARCHFLOW_STORAGE_SET" && data.payload) {
          host.saveDatabase(data.payload, { expectedRevision: data.expectedRevision, replace: data.replace }).then((saved) => {
            if (data.requestId) {
              replyResult({ requestId: data.requestId, success: true, data: saved });
            }
          }).catch((error) => {
            if (data.requestId) replyResult({ requestId: data.requestId, success: false, error: String(error?.message || error) });
          });
          return;
        }
        if (data.type === "RESEARCHFLOW_SELECT_ITEM" && data.itemKey) {
          try {
            const item = findItemByKey(data.itemKey, data.libraryID);
            if (item && window2.ZoteroPane) {
              window2.ZoteroPane.selectItem(item.id);
            }
          } catch (_) {
          }
          return;
        }
        if (data.type === "RESEARCHFLOW_GET_ACTIVE_ITEM") {
          const active = host.getCurrentActiveItem(window2);
          const serialized = active ? serializeLiteratureItem(active) : null;
          replyResult({
            requestId: data.requestId,
            item: serialized
          });
          return;
        }
        if (data.type === "RESEARCHFLOW_OPEN_PDF" && data.itemKey) {
          const item = findItemByKey(data.itemKey, data.libraryID);
          if (item) {
            host.openPdfAttachment(item, data.page);
          }
          return;
        }
        if (data.type === "RESEARCHFLOW_SYNC_NOTE" && data.itemKey) {
          const item = findItemByKey(data.itemKey, data.libraryID);
          if (item) {
            host.syncManuscriptToChildNote(item).then((note) => {
              if (data.requestId) {
                replyResult({ requestId: data.requestId, success: Boolean(note), noteId: note?.id });
              }
            });
          } else if (data.requestId) {
            replyResult({ requestId: data.requestId, success: false });
          }
          return;
        }
        if (data.type === "RESEARCHFLOW_GET_COLLECTIONS") {
          const cols = host.getZoteroCollections(data.libraryID);
          replyResult({
            requestId: data.requestId,
            collections: cols
          });
          return;
        }
        if (data.type === "RESEARCHFLOW_SEARCH_LIBRARY") {
          host.searchLibrary(data.query, data.limit || 15).then((results) => {
            replyResult({
              requestId: data.requestId,
              results: results || []
            });
          });
          return;
        }
        if (data.type === "RESEARCHFLOW_GET_ANNOTATIONS" && data.itemKey) {
          const item = findItemByKey(data.itemKey, data.libraryID);
          const annos = item ? getLiteratureAnnotations(item) : [];
          replyResult({ requestId: data.requestId, annotations: annos });
          return;
        }
        if (data.type === "RESEARCHFLOW_SYNC_STATUS_TAG" && data.itemKey && data.status) {
          const item = findItemByKey(data.itemKey, data.libraryID);
          if (item) {
            host.syncStatusTagToItem(item, data.status).then((success) => {
              replyResult({ requestId: data.requestId, success });
            });
          } else {
            replyResult({ requestId: data.requestId, success: false });
          }
          return;
        }
        if (data.type === "RESEARCHFLOW_ADD_TO_PIPELINE_COLLECTION" && data.itemKey) {
          const item = findItemByKey(data.itemKey, data.libraryID);
          if (item) {
            host.addItemToPipelineCollection(item).then((col) => {
              replyResult({ requestId: data.requestId, success: Boolean(col) });
            });
          } else {
            replyResult({ requestId: data.requestId, success: false });
          }
          return;
        }
        if (data.type === "RESEARCHFLOW_GET_READING_ASSETS" && data.itemKey) {
          const item = findItemByKey(data.itemKey, data.libraryID);
          const assets = item ? getLiteratureReadingAssets(item) : { annotations: [], notes: [], collections: [], tags: [], relatedItems: [] };
          replyResult({ requestId: data.requestId, assets });
          return;
        }
        if (data.type === "RESEARCHFLOW_GET_NOTES" && data.itemKey) {
          const item = findItemByKey(data.itemKey, data.libraryID);
          const notes = item ? getLiteratureNotes(item) : [];
          replyResult({ requestId: data.requestId, notes });
          return;
        }
        if (data.type === "RESEARCHFLOW_GET_ALL_PREFS") {
          replyResult({ requestId: data.requestId, prefs: host.getSyncedSettingsFromPrefs() });
          return;
        }
        if (data.type === "RESEARCHFLOW_GET_PREF") {
          replyResult({ requestId: data.requestId, value: host.getPref(data.key, data.defaultValue) });
          return;
        }
        if (data.type === "RESEARCHFLOW_SET_PREF") {
          host.setPref(data.key, data.value);
          if (host._cachedData) {
            if (!host._cachedData.settings) host._cachedData.settings = {};
            host._cachedData.settings[data.key] = data.value;
          }
          host.broadcastToIframes({
            type: "RESEARCHFLOW_PREF_CHANGED",
            key: data.key,
            value: data.value
          });
          replyResult({ requestId: data.requestId, success: true });
          return;
        }
        if (data.type === "RESEARCHFLOW_SAVE_SHARE_IMAGE") {
          host.saveShareImageFile(data.pngBytes, data.fileName, data.language, window2).then((result) => {
            replyResult({ requestId: data.requestId, ...result });
          });
          return;
        }
        if (data.type === "RESEARCHFLOW_EXPORT_DB") {
          host.exportDatabaseFile(window2).then((result) => {
            replyResult({ requestId: data.requestId, ...result });
          });
          return;
        }
        if (data.type === "RESEARCHFLOW_IMPORT_DB") {
          host.importDatabaseFile(data.mode || "merge", window2).then((result) => {
            replyResult({ requestId: data.requestId, ...result });
          });
          return;
        }
        if (data.type === "RESEARCHFLOW_EXPORT_DIAGNOSTICS") {
          host.exportDiagnosticsFile(data.report, window2).then((result) => {
            replyResult({ requestId: data.requestId, ...result });
          });
          return;
        }
        if (data.type === "RESEARCHFLOW_RESTORE_BACKUP") {
          host.restoreBackupDatabase().then((restored) => {
            replyResult({ requestId: data.requestId, success: true, data: restored });
          }).catch((err) => {
            replyResult({ requestId: data.requestId, success: false, error: err.message });
          });
          return;
        }
        if (data.type === "RESEARCHFLOW_SHOW_TOAST") {
          host.showToast(data.title || "通知", data.message || "", data.toastType || "info");
          return;
        }
        if (data.type === "RESEARCHFLOW_OPEN_PREFS") {
          host.openPreferencesPane(window2);
          return;
        }
        if (data.type === "RESEARCHFLOW_OPEN_EXTERNAL" && data.url) {
          try {
            if (typeof Zotero.launchURL === "function") {
              Zotero.launchURL(data.url);
            } else {
              const uri = Services.io.newURI(data.url);
              Cc["@mozilla.org/uriloader/external-protocol-service;1"]?.getService(Ci.nsIExternalProtocolService)?.loadURI(uri);
            }
          } catch (_) {
          }
          return;
        }
      } catch (err) {
        Zotero.logError?.("[PaperFlow] handleHostMessage error: " + err);
      }
    };
  }

  // src/host/window-lifecycle.ts
  var injectedElements = /* @__PURE__ */ new Map();
  var pendingWindowLoads = /* @__PURE__ */ new Map();
  var activeWindowListener = null;
  function clearWindowListener() {
    if (activeWindowListener && Services.wm?.removeListener) {
      try {
        Services.wm.removeListener(activeWindowListener);
      } catch (_) {
      }
    }
    activeWindowListener = null;
  }
  var hostWindowLifecycleMethods = {
    createXULElement(doc, tagName) {
      if (!doc) return null;
      if (typeof doc.createXULElement === "function") {
        return doc.createXULElement(tagName);
      }
      return doc.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", tagName);
    },
    async init() {
      Zotero.log?.("[PaperFlow] Initializing host runtime...");
      await this.loadDatabase();
      this.initNotifier();
      this.initPrefObserver();
      this.registerMenus();
      this.initWindowListener();
      const winEnum = Services.wm?.getEnumerator ? Services.wm.getEnumerator("") : null;
      const windows = winEnum && winEnum.hasMoreElements() ? winEnum : Services.wm?.getEnumerator?.("navigator:browser");
      while (windows && windows.hasMoreElements()) {
        const win = windows.getNext();
        this.addToWindow(win);
      }
      if (Zotero.PreferencePanes && typeof Zotero.PreferencePanes.register === "function") {
        try {
          const prefSrc = this.rootURI ? `${this.rootURI}chrome/content/preferences.xhtml` : `${CHROME_ROOT}preferences.xhtml`;
          const prefScript = this.rootURI ? `${this.rootURI}chrome/content/scripts/preferences.js` : `${CHROME_ROOT}scripts/preferences.js`;
          const prefCss = this.rootURI ? `${this.rootURI}chrome/content/assets/preferences.css` : `${CHROME_ROOT}assets/preferences.css`;
          const prefIcon = this.rootURI ? `${this.rootURI}chrome/content/icons/researchflow.svg` : `${CHROME_ROOT}icons/researchflow.svg`;
          this._prefPaneID = await Zotero.PreferencePanes.register({
            pluginID: ADDON_ID,
            id: "researchflow-preferences-pane",
            src: prefSrc,
            label: "Zotero PaperFlow",
            image: prefIcon,
            scripts: [prefScript],
            stylesheets: [prefCss]
          });
        } catch (prefErr) {
          Zotero.log?.("[PaperFlow] PreferencePanes registration note: " + prefErr);
        }
      }
      this.updateItemPaneSection();
      Zotero.log?.("[PaperFlow] Initialized successfully in Zotero");
    },
    updateItemPaneSection() {
      const enabled = Boolean(this.getPref("enableItemPane", false));
      if (enabled) {
        if (!this.itemPaneSectionID) {
          this.registerItemPaneSection();
        }
      } else {
        if (this.itemPaneSectionID && typeof Zotero.ItemPaneManager?.unregisterSection === "function") {
          try {
            Zotero.ItemPaneManager.unregisterSection(this.itemPaneSectionID);
          } catch (_) {
          }
          this.itemPaneSectionID = null;
        } else if (typeof Zotero.ItemPaneManager?.unregisterSection === "function") {
          try {
            Zotero.ItemPaneManager.unregisterSection("researchflow-item-pane");
          } catch (_) {
          }
        }
      }
    },
    initWindowListener() {
      activeWindowListener = {
        onOpenWindow: (xulWindow) => {
          let domWindow;
          try {
            domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
          } catch (_) {
            return;
          }
          const onLoad = () => {
            domWindow.removeEventListener("load", onLoad, false);
            pendingWindowLoads.delete(domWindow);
            if (!domWindow.closed) Zotero.ResearchFlow?.addToWindow(domWindow);
          };
          pendingWindowLoads.set(domWindow, onLoad);
          domWindow.addEventListener("load", onLoad, { once: true });
          if (domWindow.document?.readyState === "complete") onLoad();
        },
        onCloseWindow: (xulWindow) => {
          try {
            const domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
            const onLoad = pendingWindowLoads.get(domWindow);
            if (onLoad) domWindow.removeEventListener("load", onLoad, false);
            pendingWindowLoads.delete(domWindow);
            Zotero.ResearchFlow?.removeFromWindow(domWindow);
          } catch (_) {
          }
        }
      };
      Services.wm?.addListener?.(activeWindowListener);
    },
    addToWindow(window2) {
      if (!window2 || !window2.document) return;
      const doc = window2.document;
      this.purgeStaleContextMenus(window2);
      if (doc.getElementById("researchflow-tools-menu")) return;
      const windowElements = [];
      this.ensureLocalization(doc);
      const toolsPopup = doc.getElementById("menu_ToolsPopup");
      if (toolsPopup) {
        const toolsItem = this.createXULElement(doc, "menuitem");
        toolsItem.id = "researchflow-tools-menu";
        toolsItem.setAttribute("label", "Zotero PaperFlow 工作台");
        toolsItem.setAttribute("image", `${CHROME_ROOT}icons/researchflow.svg`);
        toolsItem.setAttribute("class", "menuitem-iconic");
        toolsItem.addEventListener("command", () => {
          this.triggerResearchFlowOpen(window2);
        });
        toolsPopup.appendChild(toolsItem);
        windowElements.push(toolsItem);
      }
      try {
        if (!doc.getElementById("researchflow-tab-style")) {
          const style = doc.createElement("style");
          style.id = "researchflow-tab-style";
          style.textContent = `
          tab[type="researchflow"] .tab-icon,
          .tab[type="researchflow"] .tab-icon {
            list-style-image: url("${CHROME_ROOT}icons/researchflow.svg") !important;
            width: 16px !important;
            height: 16px !important;
            max-width: 16px !important;
            max-height: 16px !important;
          }

          #researchflow-toolbar-button,
          toolbarbutton#researchflow-toolbar-button {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            max-width: 28px !important;
            max-height: 28px !important;
            padding: 0 4px !important;
            margin: 0 4px !important;
            box-sizing: border-box !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
          }

          #researchflow-toolbar-button .toolbarbutton-icon,
          #researchflow-toolbar-button image,
          #researchflow-toolbar-button img {
            width: 20px !important;
            height: 20px !important;
            min-width: 20px !important;
            max-width: 20px !important;
            min-height: 20px !important;
            max-height: 20px !important;
            object-fit: contain !important;
            display: block !important;
            margin: 0 auto !important;
          }

          menuitem#researchflow-tools-menu .menu-iconic-icon,
          menuitem#researchflow-itemmenu-create .menu-iconic-icon,
          menuitem#researchflow-itemmenu-link .menu-iconic-icon,
          menuitem#researchflow-collectionmenu-create .menu-iconic-icon {
            width: 16px !important;
            height: 16px !important;
            max-width: 16px !important;
            max-height: 16px !important;
          }
        `;
          (doc.head || doc.documentElement).appendChild(style);
          windowElements.push(style);
        }
      } catch (_) {
      }
      const handleGlobalKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === "r" || e.key === "R")) {
          e.preventDefault?.();
          e.stopPropagation?.();
          this.triggerResearchFlowOpen(window2);
        } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "r" || e.key === "R")) {
          e.preventDefault?.();
          e.stopPropagation?.();
          const tabs = window2?.Zotero_Tabs || (typeof window2.Zotero_Tabs !== "undefined" ? window2.Zotero_Tabs : null);
          if (tabs && tabs.selectedTab && tabs.selectedTab.type === "reader") {
            this.createRecordFromReader(window2);
          } else {
            this.createManuscriptFromSelection(window2);
          }
        }
      };
      window2.addEventListener("keydown", handleGlobalKeyDown, true);
      windowElements.push({
        remove: () => window2.removeEventListener("keydown", handleGlobalKeyDown, true)
      });
      const handleHostMessage = createHostMessageHandler(this, window2);
      window2.addEventListener("message", handleHostMessage);
      windowElements.push({
        remove: () => window2.removeEventListener("message", handleHostMessage)
      });
      this.ensureToolbarButton(window2, windowElements);
      injectedElements.set(window2, windowElements);
    },
    removeFromWindow(window2) {
      if (!window2 || !injectedElements.has(window2)) return;
      const elements = injectedElements.get(window2);
      elements.forEach((el) => {
        try {
          if (typeof el?.remove === "function") el.remove();
          else if (el?.parentNode) el.parentNode.removeChild(el);
        } catch (_) {
        }
      });
      injectedElements.delete(window2);
    }
  };

  // src/host/navigation.ts
  var hostNavigationMethods = {
    getSelectedRegularItems(window2) {
      const pane = window2?.ZoteroPane || (Zotero.getActiveZoteroPane ? Zotero.getActiveZoteroPane() : null) || (Zotero.getMainWindow ? Zotero.getMainWindow().ZoteroPane : null);
      let rawSelection = [];
      try {
        if (pane?.getSelectedItems) {
          rawSelection = pane.getSelectedItems();
        }
      } catch (_) {
      }
      return rawSelection.map(getLiteratureItem).filter(Boolean);
    },
    getCurrentActiveItem(window2) {
      const tabs = window2?.Zotero_Tabs || (typeof window2.Zotero_Tabs !== "undefined" ? window2.Zotero_Tabs : null);
      if (tabs && tabs.selectedTab && tabs.selectedTab.type === "reader") {
        const reader = Zotero.Reader?.getByTabID?.(tabs.selectedTab.id);
        const itemID = reader?.itemID || tabs.selectedTab.data?.itemID;
        if (itemID) {
          const item = Zotero.Items.get(itemID);
          return getLiteratureItem(item);
        }
      }
      const selected = this.getSelectedRegularItems(window2);
      return selected[0] || null;
    },
    getZoteroCollections(libraryID = null) {
      const targetLibID = libraryID || Zotero.Libraries?.userLibraryID || 1;
      const collections = Zotero.Collections?.getByLibrary?.(targetLibID) || [];
      return collections.map((col) => {
        let itemKeys = [];
        try {
          const childIds = typeof col.getChildItems === "function" ? col.getChildItems(true) : [];
          itemKeys = (childIds || []).map((id) => {
            const it = Zotero.Items.get(id);
            return it?.key || null;
          }).filter(Boolean);
        } catch (_) {
        }
        return {
          id: col.id,
          key: col.key,
          name: col.name,
          parentID: col.parentID,
          itemKeys
        };
      });
    },
    openPdfAttachment(item, page = null) {
      const target = getLiteratureItem(item);
      if (!target) return;
      try {
        const attIds = typeof target.getAttachments === "function" ? target.getAttachments() : [];
        for (const attId of attIds) {
          const att = Zotero.Items.get(attId);
          if (att && (typeof att.isPDFAttachment === "function" && att.isPDFAttachment() || att.contentType === "application/pdf")) {
            const win = Zotero.getMainWindow?.() || Services.wm?.getMostRecentWindow?.("navigator:browser");
            const pageIndex = page && Number(page) > 0 ? Math.max(0, Number(page) - 1) : 0;
            if (Zotero.Reader && typeof Zotero.Reader.open === "function") {
              Promise.resolve(Zotero.Reader.open(att.id, { pageIndex })).catch(() => {
                try {
                  Zotero.Reader.open({ itemID: att.id, pageIndex });
                } catch (_) {
                }
              });
              return;
            }
            if (win?.ZoteroPane?.openAttachment) {
              win.ZoteroPane.openAttachment(att.id);
              return;
            }
            break;
          }
        }
      } catch (err) {
        Zotero.logError?.("[PaperFlow] openPdfAttachment error: " + err);
      }
    },
    createManuscriptFromSelection(window2) {
      const items = this.getSelectedRegularItems(window2);
      if (!items || items.length === 0) {
        this.showToast("未选择文献", "请在 Zotero 文献库中先选中一篇论文条目。", "warning");
        return;
      }
      const serialized = serializeLiteratureItem(items[0]);
      this.triggerResearchFlowOpen(window2, {
        action: "create_manuscript_from_item",
        item: serialized
      });
    },
    linkSelectionToManuscript(window2) {
      const items = this.getSelectedRegularItems(window2);
      if (!items || items.length === 0) {
        this.showToast("未选择文献", "请在 Zotero 文献库中先选中一篇论文条目。", "warning");
        return;
      }
      const serialized = serializeLiteratureItem(items[0]);
      this.triggerResearchFlowOpen(window2, {
        action: "link_item_to_manuscript",
        item: serialized
      });
    },
    async createManuscriptFromCollection(collection, window2 = null) {
      if (!collection) return;
      try {
        const win = window2 || (Zotero.getMainWindow ? Zotero.getMainWindow() : null);
        const childItemIDs = collection.getChildItems ? collection.getChildItems(true) : [];
        const childMetas = [];
        for (const id of childItemIDs.slice(0, 30)) {
          const item = Zotero.Items.get(id);
          const lit = getLiteratureItem(item);
          if (lit) {
            childMetas.push(serializeLiteratureItem(lit));
          }
        }
        this.triggerResearchFlowOpen(win, {
          action: "create_from_collection",
          collectionName: collection.name,
          collectionId: collection.id,
          items: childMetas
        });
      } catch (err) {
        Zotero.logError?.("[PaperFlow] createManuscriptFromCollection error: " + err);
      }
    },
    async createRecordFromReader(window2 = null) {
      const win = window2 || (Zotero.getMainWindow ? Zotero.getMainWindow() : null);
      const tabs = win?.Zotero_Tabs || (typeof win?.Zotero_Tabs !== "undefined" ? win.Zotero_Tabs : null);
      if (!win?.reader && (!tabs || !tabs.selectedTab || tabs.selectedTab.type !== "reader")) {
        const selected = this.getSelectedRegularItems(win);
        if (selected.length > 0) {
          this.createManuscriptFromSelection(win);
        }
        return;
      }
      try {
        const reader = win?.reader || Zotero.Reader?.getByTabID?.(tabs.selectedTab.id);
        const itemID = reader?.itemID || tabs?.selectedTab?.data?.itemID;
        if (!itemID) return;
        const attachmentItem = Zotero.Items.get(itemID);
        const regularItem = getLiteratureItem(attachmentItem);
        if (!regularItem) return;
        const meta = serializeLiteratureItem(regularItem);
        let selectedText = "";
        try {
          if (typeof reader.getSelectedText === "function") {
            selectedText = await reader.getSelectedText();
          }
        } catch (_) {
        }
        if (!selectedText && reader._iframeWindow) {
          try {
            selectedText = reader._iframeWindow.getSelection?.()?.toString() || "";
          } catch (_) {
          }
        }
        selectedText = String(selectedText || "").trim();
        let pageIndex = 0;
        try {
          if (reader.state && typeof reader.state.pageIndex === "number") {
            pageIndex = reader.state.pageIndex;
          } else if (reader._iframeWindow?.PDFViewerApplication?.page) {
            pageIndex = reader._iframeWindow.PDFViewerApplication.page - 1;
          }
        } catch (_) {
        }
        const pageNum = pageIndex + 1;
        const pdfKey = attachmentItem?.key || meta.key;
        const groupID = Zotero.Libraries?.get?.(regularItem.libraryID)?.groupID;
        const pageLink = groupID ? `zotero://open-pdf/groups/${groupID}/items/${pdfKey}?page=${pageNum}` : `zotero://open-pdf/library/items/${pdfKey}?page=${pageNum}`;
        this.triggerResearchFlowOpen(win, {
          action: "reader_excerpt",
          item: meta,
          excerpt: selectedText,
          page: pageNum,
          pdfLink: pageLink
        });
      } catch (err) {
        Zotero.logError?.("[PaperFlow] createRecordFromReader error: " + err);
      }
    },
    triggerResearchFlowOpen(window2, options = {}) {
      const mode = this.getPref("windowMode", "tab");
      if (mode === "subwindow") {
        this.openStandaloneWindow(options, window2, "subwindow");
      } else if (mode === "window") {
        this.openStandaloneWindow(options, window2, "window");
      } else {
        this.openResearchFlow(options, window2, "tab");
      }
    },
    openResearchFlow(options = {}, targetWindow = null, windowType = "tab") {
      try {
        const mainWin = targetWindow && targetWindow.Zotero_Tabs ? targetWindow : Zotero.getMainWindow ? Zotero.getMainWindow() : Services.wm?.getMostRecentWindow?.("navigator:browser");
        if (windowType === "tab" && mainWin && mainWin.Zotero_Tabs) {
          const tabs = mainWin.Zotero_Tabs;
          const existingTab = tabs._tabs?.find?.((t) => t.type === "researchflow") || tabs._tabs?.find?.((t) => t.title && (t.title.includes("Zotero PaperFlow") || t.title.includes("ResearchFlow")));
          if (existingTab) {
            tabs.select(existingTab.id);
            if (mainWin.focus) mainWin.focus();
            const iframe = mainWin.document.getElementById("researchflow-tab-iframe") || existingTab.container && existingTab.container.querySelector("iframe");
            if (iframe) {
              iframe._researchflowPending = options;
              try {
                if (iframe.contentWindow?.postMessage) {
                  iframe.contentWindow.postMessage({ type: "RESEARCHFLOW_NAVIGATE", options }, "*");
                }
              } catch (_) {
              }
            }
            return;
          }
          const tabResult = tabs.add({
            type: "researchflow",
            title: "Zotero PaperFlow",
            select: true,
            data: options,
            onClose: () => {
              Zotero.log?.("[PaperFlow] Tab closed");
            }
          });
          const container = tabResult && tabResult.container || tabs.getTabContainer && tabs.getTabContainer(tabResult.id || tabResult) || tabs.getTab && tabs.getTab(tabResult?.id)?.container;
          if (container) {
            const doc = container.ownerDocument || mainWin.document;
            const iframe = doc.createElement("iframe");
            iframe.id = "researchflow-tab-iframe";
            iframe.setAttribute("src", `${CHROME_ROOT}index.html`);
            iframe.setAttribute("style", "width: 100%; height: 100%; border: none; flex: 1; display: block;");
            iframe.setAttribute("flex", "1");
            iframe._researchflowReady = false;
            iframe._researchflowPending = options;
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.width = "100%";
            container.style.height = "100%";
            container.style.overflow = "hidden";
            iframe.addEventListener("load", () => {
              try {
                if (iframe.contentWindow) {
                  iframe.contentWindow.Zotero = Zotero;
                  iframe.contentWindow._researchflowPending = options;
                  if (iframe.contentWindow.postMessage) {
                    iframe.contentWindow.postMessage({ type: "RESEARCHFLOW_NAVIGATE", options }, "*");
                  }
                }
              } catch (_) {
              }
            });
            container.appendChild(iframe);
          }
          if (mainWin.focus) mainWin.focus();
          return;
        }
      } catch (e) {
        Zotero.logError?.("[PaperFlow] openResearchFlow error: " + e);
      }
      this.openStandaloneWindow(options, targetWindow, "window");
    }
  };

  // src/host/item-pane.ts
  var hostItemPaneMethods = {
    registerItemPaneSection() {
      if (typeof RFItemPaneSection !== "undefined" && RFItemPaneSection.registerItemPaneSection) {
        this.itemPaneSectionID = RFItemPaneSection.registerItemPaneSection(this);
      }
    }
  };

  // src/host/shutdown.ts
  var hostShutdownMethods = {
    async shutdown() {
      for (const win of this._standaloneWindows || []) {
        try {
          win.close();
        } catch (_) {
        }
      }
      this._standaloneWindows?.clear();
      this._recoveryTokens?.clear();
      this._dataListeners?.clear();
      this.destroyNotifier();
      this.destroyPrefObserver();
      this.unregisterMenus();
      clearWindowListener();
      for (const [, elements] of injectedElements) {
        elements.forEach((el) => {
          try {
            if (typeof el?.remove === "function") el.remove();
            else if (el?.parentNode) el.parentNode.removeChild(el);
          } catch (_) {
          }
        });
      }
      injectedElements.clear();
      if (this._prefPaneID && Zotero.PreferencePanes?.unregister) {
        try {
          Zotero.PreferencePanes.unregister(this._prefPaneID);
        } catch (_) {
        }
        this._prefPaneID = null;
      }
      if (this.itemPaneSectionID && Zotero.ItemPaneManager?.unregisterSection) {
        try {
          Zotero.ItemPaneManager.unregisterSection(this.itemPaneSectionID);
        } catch (_) {
        }
        this.itemPaneSectionID = null;
      }
      Zotero.log?.("[PaperFlow] Shutdown complete");
    }
  };

  // src/host/index.ts
  var allHostMethods = {
    ...hostPrefsStateMethods,
    ...hostMenuMethods,
    ...hostDatabaseRecoveryMethods,
    ...hostDatabaseMergeMethods,
    ...hostDatabaseStorageMethods,
    ...hostFilePickerMethods,
    ...hostChildNoteMethods,
    ...hostWindowUiMethods,
    ...hostWindowLifecycleMethods,
    ...hostNavigationMethods,
    ...hostItemPaneMethods,
    ...hostShutdownMethods
  };

  // src/index.ts
  (function() {
    if (typeof Zotero === "undefined") {
      return;
    }
    const currentAddonId = typeof addonId !== "undefined" && addonId ? addonId : ADDON_ID;
    const currentVersion = typeof version !== "undefined" && version ? version : DEFAULT_VERSION;
    const baseHost = {
      rootURI: typeof rootURI !== "undefined" ? rootURI : "",
      addonId: currentAddonId,
      version: currentVersion,
      serializeLiteratureItem,
      getLiteratureAnnotations,
      getLiteratureNotes,
      getLiteratureCollections,
      getLiteratureReadingAssets,
      extractCiteKey,
      generateBibTeX,
      generateAPACitation,
      getRelatedItems,
      getLiteratureItem,
      findItemByKey,
      resolveItem: findItemByKey,
      localizedDocs: /* @__PURE__ */ new Set(),
      _cachedData: null,
      _dataListeners: /* @__PURE__ */ new Set(),
      _prefPaneID: null,
      itemPaneSectionID: null,
      notifierID: null,
      _menuManagerItem: null,
      _menuManagerReader: null,
      _shareImageSavePending: false,
      _standaloneWindows: /* @__PURE__ */ new Set(),
      _recoveryTokens: /* @__PURE__ */ new Map()
    };
    Zotero.ResearchFlow = Object.assign(baseHost, allHostMethods);
    Zotero.PaperFlow = Zotero.ResearchFlow;
    Zotero.ResearchFlow.init().catch((err) => {
      Zotero.logError?.("[PaperFlow] init error: " + err);
    });
  })();
})();
