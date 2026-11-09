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

  // src/modules/architecture-guard.ts
  var escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  function isItemEditableAndActive(item) {
    if (!item) return false;
    if (item.deleted) return false;
    if (typeof item.isEditable === "function" && !item.isEditable()) return false;
    return true;
  }
  async function syncStatusTagToItem(host, item, status) {
    if (!host?.getPref?.("syncStatusTags", false)) {
      return true;
    }
    const target = host?.getLiteratureItem ? host.getLiteratureItem(item) : item?.topLevelItem || item;
    if (!target) return false;
    if (!isItemEditableAndActive(target)) {
      if (typeof Zotero !== "undefined") {
        Zotero.logError?.("[PaperFlow] syncStatusTagToItem blocked: Item is read-only or in trash");
      }
      return false;
    }
    try {
      const tagMap = typeof RFAcademicCitation !== "undefined" && RFAcademicCitation.STATUS_TAG_MAP ? RFAcademicCitation.STATUS_TAG_MAP : {
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
      const existingTags = typeof target.getTags === "function" ? target.getTags() : [];
      for (const t of existingTags) {
        const tagName = t.tag || String(t);
        if (tagName.startsWith("PaperFlow/") || tagName.startsWith("ResearchFlow/") || tagName.startsWith("RF/")) {
          target.removeTag(tagName);
        }
      }
      const newTag = tagMap[status];
      if (newTag) {
        target.addTag(newTag, 0);
      }
      await target.saveTx();
      return true;
    } catch (e) {
      if (typeof Zotero !== "undefined") {
        Zotero.logError?.("[PaperFlow] syncStatusTagToItem error: " + e);
      }
      return false;
    }
  }
  async function addItemToPipelineCollection(host, item) {
    if (!host?.getPref?.("autoAddToPipelineCollection", true)) {
      return null;
    }
    const target = host?.getLiteratureItem ? host.getLiteratureItem(item) : item?.topLevelItem || item;
    if (!target) return null;
    if (!isItemEditableAndActive(target)) {
      if (typeof Zotero !== "undefined") {
        Zotero.logError?.("[PaperFlow] addItemToPipelineCollection blocked: Item is read-only or in trash");
      }
      return null;
    }
    const libraryID = target.libraryID || (typeof Zotero !== "undefined" ? Zotero.Libraries?.userLibraryID : 1) || 1;
    const collectionName = "🚀 Zotero PaperFlow 论文管线";
    try {
      const collections = typeof Zotero !== "undefined" && Zotero.getCollections ? Zotero.getCollections(libraryID) : [];
      let targetCol = (collections || []).find((c) => c.name === collectionName);
      if (!targetCol && typeof Zotero !== "undefined" && Zotero.Collection) {
        targetCol = new Zotero.Collection();
        targetCol.name = collectionName;
        targetCol.libraryID = libraryID;
        await targetCol.saveTx();
      }
      if (targetCol && typeof target.getCollections === "function") {
        const itemCols = target.getCollections();
        if (!itemCols.includes(targetCol.id)) {
          target.setCollections([...itemCols, targetCol.id]);
          await target.saveTx();
        }
      }
      return targetCol;
    } catch (e) {
      if (typeof Zotero !== "undefined") {
        Zotero.logError?.("[PaperFlow] addItemToPipelineCollection error: " + e);
      }
      return null;
    }
  }
  async function syncManuscriptToChildNote(host, item, manuscript = null) {
    const target = host?.getLiteratureItem ? host.getLiteratureItem(item) : item?.topLevelItem || item;
    if (!target) return null;
    if (!isItemEditableAndActive(target)) {
      if (typeof Zotero !== "undefined") {
        Zotero.logError?.("[PaperFlow] syncManuscriptToChildNote blocked: Item is read-only or in trash");
      }
      return null;
    }
    try {
      const db = await host.loadDatabase();
      let targetMan = manuscript;
      if (!targetMan) {
        targetMan = (db.manuscripts || []).find((m) => {
          if (m.zoteroItemKey && m.zoteroItemKey === target.key) return true;
          if (m.doi && target.getField && m.doi.toLowerCase() === (target.getField("DOI") || "").toLowerCase()) return true;
          return false;
        });
      }
      if (!targetMan) return null;
      const meta = (host?.serializeLiteratureItem ? host.serializeLiteratureItem(target) : null) || (typeof RFAcademicCitation !== "undefined" && RFAcademicCitation.serializeLiteratureItem ? RFAcademicCitation.serializeLiteratureItem(target) : null) || {};
      const statusMap = {
        idea: "选题萌芽",
        outline: "大纲规划",
        data_collection: "数据整理",
        figure_preparation: "图表绘制",
        drafting: "初稿撰写中",
        internal_review: "组内评审",
        submitted: "已正式投稿",
        under_review: "期刊同行审稿中",
        revision: "审稿意见修回修订中",
        accepted: "🎉 已正式录用 (Accepted)",
        published: "🚀 正式发表 (Published)"
      };
      const statusText = statusMap[targetMan.status] || targetMan.status || "撰写中";
      const linkedSubmissions = (db.submissions || []).filter((s) => s.manuscriptId === targetMan.id);
      const predecessorIds = new Set(linkedSubmissions.map((s) => s.previousSubmissionId).filter(Boolean));
      const activeCandidates = linkedSubmissions.filter((s) => !predecessorIds.has(s.id));
      const parseSubTime = (v) => Date.parse(v || "") || 0;
      const sub = [...activeCandidates.length ? activeCandidates : linkedSubmissions].sort(
        (a, b) => (Number(b.roundIndex) || 1) - (Number(a.roundIndex) || 1) || parseSubTime(b.submissionDate || b.submittedAt || b.createdAt) - parseSubTime(a.submissionDate || a.submittedAt || a.createdAt) || parseSubTime(b.createdAt) - parseSubTime(a.createdAt) || String(a.id || "").localeCompare(String(b.id || ""))
      )[0] || null;
      const targetJournalName = sub?.targetJournal || sub?.journalName || targetMan.targetJournal || targetMan.targetJournals?.[0] || "待定";
      let noteHtml = `<h1>🚀 [Zotero PaperFlow] 论文稿件与审稿跟踪快报</h1>`;
      noteHtml += `<p><strong>稿件标题：</strong>${escapeHtml(targetMan.title)}</p>`;
      noteHtml += `<p><strong>目标期刊：</strong>${escapeHtml(targetJournalName)} | <strong>当前状态：</strong><span style="color:#e11d48; font-weight:700;">${escapeHtml(statusText)}</span></p>`;
      if (sub?.externalManuscriptId) {
        noteHtml += `<p><strong>期刊稿号 (Manuscript ID)：</strong><code>${escapeHtml(sub.externalManuscriptId)}</code></p>`;
      }
      if (targetMan.citekey || meta.citekey) {
        noteHtml += `<p><strong>Citation Key:</strong> <code>[@${escapeHtml(targetMan.citekey || meta.citekey)}]</code></p>`;
      }
      if (targetMan.doi) {
        noteHtml += `<p><strong>DOI:</strong> <a href="https://doi.org/${encodeURIComponent(targetMan.doi)}">${escapeHtml(targetMan.doi)}</a></p>`;
      }
      noteHtml += `<p><strong>关联文献：</strong>${escapeHtml(meta.title || targetMan.title)} (${escapeHtml(meta.authors || "")} ${escapeHtml(meta.year || "")})</p>`;
      if (meta.citationApa) {
        noteHtml += `<p><strong>标准引用 (APA):</strong> ${escapeHtml(meta.citationApa)}</p>`;
      }
      if (targetMan.abstract) {
        noteHtml += `<h3>📄 稿件摘要 / 研读笔记草稿</h3><blockquote>${escapeHtml(targetMan.abstract).replace(/\n/g, "<br/>")}</blockquote>`;
      }
      if (sub && Array.isArray(sub.timelineNodes) && sub.timelineNodes.length > 0) {
        noteHtml += `<h3>📅 稿件管线里程碑时间轴</h3><ul>`;
        for (const node of sub.timelineNodes) {
          const isCompleted = Boolean(node.completed || node.completeDate || node.status === "completed" || node.status === "done");
          const completedMark = isCompleted ? "✅" : "⏳";
          const rawDate = node.completeDate || node.date || node.planDate || node.dueDate || "";
          const dateStr = rawDate ? ` (${escapeHtml(String(rawDate).slice(0, 10))})` : "";
          noteHtml += `<li>${completedMark} <strong>${escapeHtml(node.name)}</strong>${dateStr}</li>`;
        }
        noteHtml += `</ul>`;
      }
      if (sub?.refereeFeedback) {
        noteHtml += `<h3>📝 审稿人总体意见与修回要点</h3>`;
        noteHtml += `<blockquote>${escapeHtml(sub.refereeFeedback).replace(/\n/g, "<br/>")}</blockquote>`;
      }
      const reviewRows = Array.isArray(sub?.reviewMatrix) && sub.reviewMatrix.length > 0 ? sub.reviewMatrix : Array.isArray(sub?.rebuttalMatrix) ? sub.rebuttalMatrix : [];
      if (reviewRows.length > 0) {
        noteHtml += `<h3>📋 审稿人逐条意见与修回回复矩阵 (Response Matrix)</h3>`;
        noteHtml += `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:12px; border-color:#cbd5e1;">`;
        noteHtml += `<tr style="background:#f1f5f9; font-weight:600;"><th style="width:45%; text-align:left;">审稿人意见 (Reviewer Comment)</th><th style="width:55%; text-align:left;">作者修回回复 (Author Response)</th></tr>`;
        const statusBadgeMap = {
          addressed: { text: "✔ 已答复", bg: "#dcfce7", color: "#166534" },
          clarified: { text: "💬 已辩明", bg: "#ccfbf1", color: "#115e59" },
          in_progress: { text: "⏳ 处理中", bg: "#fef3c7", color: "#92400e" },
          pending: { text: "⭕ 待处理", bg: "#f1f5f9", color: "#475569" }
        };
        for (let i = 0; i < reviewRows.length; i++) {
          const r = reviewRows[i];
          const cmt = escapeHtml(r.comment || "").replace(/\n/g, "<br/>");
          const resp = escapeHtml(r.response || "").replace(/\n/g, "<br/>");
          const reviewerBadge = r.reviewer ? ` <span style="background:#e0e7ff; color:#3730a3; padding:1px 5px; border-radius:3px; font-size:10px;">${escapeHtml(r.reviewer)}</span>` : "";
          const resolvedStatusKey = r.status || (r.response && String(r.response).trim() ? "addressed" : "pending");
          const statusMeta = statusBadgeMap[resolvedStatusKey] || statusBadgeMap.pending;
          const statusBadge = ` <span style="background:${statusMeta.bg}; color:${statusMeta.color}; padding:1px 5px; border-radius:3px; font-size:10px;">${statusMeta.text}</span>`;
          const changesRow = r.changes ? `<div style="margin-top:4px; font-size:11px; color:#0369a1;"><strong>📝 修改说明:</strong> ${escapeHtml(r.changes)}</div>` : "";
          noteHtml += `<tr><td style="vertical-align:top; background:#f8fafc;"><strong>#${i + 1}</strong>${reviewerBadge}${statusBadge}<br/>${cmt || '<em style="color:#94a3b8;">暂无内容</em>'}</td><td style="vertical-align:top;">${resp || '<em style="color:#94a3b8;">待撰写回复</em>'}${changesRow}</td></tr>`;
        }
        noteHtml += `</table>`;
      }
      noteHtml += `<hr/><p style="font-size:11px;color:#94a3b8;">由 Zotero PaperFlow 自动生成并同步至 Zotero 云端笔记 | 更新时间：${(/* @__PURE__ */ new Date()).toLocaleString()}</p>`;
      let targetNote = null;
      if (typeof target.getNotes === "function") {
        const noteIDs = target.getNotes();
        for (const nid of noteIDs) {
          const noteItem = typeof Zotero !== "undefined" && Zotero.Items ? Zotero.Items.get(nid) : null;
          if (noteItem && !noteItem.deleted && isItemEditableAndActive(noteItem) && typeof noteItem.isNote === "function" && noteItem.isNote()) {
            const content = noteItem.getNote();
            if (content && (content.includes("[ResearchFlow]") || content.includes("ResearchFlow for Zotero") || content.includes("Zotero PaperFlow") || content.includes("[Zotero PaperFlow]"))) {
              targetNote = noteItem;
              break;
            }
          }
        }
      }
      if (targetNote) {
        targetNote.setNote(noteHtml);
        await targetNote.saveTx();
      } else if (typeof Zotero !== "undefined" && Zotero.Item) {
        const newNote = new Zotero.Item("note");
        newNote.libraryID = target.libraryID;
        newNote.parentID = target.id;
        newNote.setNote(noteHtml);
        try {
          newNote.addTag("ResearchFlow");
        } catch (_) {
        }
        await newNote.saveTx();
        targetNote = newNote;
      }
      return targetNote;
    } catch (e) {
      if (typeof Zotero !== "undefined") {
        Zotero.logError?.("[PaperFlow] syncManuscriptToChildNote error: " + e);
      }
      return null;
    }
  }
  var RFArchitectureGuard = {
    isItemEditableAndActive,
    syncStatusTagToItem,
    syncManuscriptToChildNote,
    addItemToPipelineCollection
  };
  if (typeof globalThis !== "undefined") {
    globalThis.RFArchitectureGuard = RFArchitectureGuard;
  }
  if (typeof window !== "undefined") {
    window.RFArchitectureGuard = RFArchitectureGuard;
  }
})();
