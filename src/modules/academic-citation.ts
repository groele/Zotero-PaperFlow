/**
 * Zotero PaperFlow - Academic Citation & Literature Serialization Engine
 * Encapsulates literature item identification, BibTeX / APA citation generation,
 * PDF annotation extraction, note extraction, related items, and item serialization.
 */

export const itemSelectUri = (item: any): string => {
  if (!item) return '';
  const key = item.key || item.id;
  const groupID = (typeof Zotero !== 'undefined' ? Zotero.Libraries?.get?.(item.libraryID)?.groupID : null);
  return groupID
    ? `zotero://select/groups/${groupID}/items/${key}`
    : `zotero://select/library/items/${key}`;
};

export const getLiteratureItem = (item: any): any => {
  if (!item) return null;
  let target = item;
  try {
    if (target.topLevelItem && typeof target.topLevelItem.isRegularItem === 'function' && target.topLevelItem.isRegularItem()) {
      return target.topLevelItem;
    }
  } catch (_) {}
  if (typeof target.isAttachment === 'function' && target.isAttachment()) {
    if (target.parentItemID && typeof Zotero !== 'undefined' && Zotero.Items) {
      target = Zotero.Items.get(target.parentItemID) || target;
    }
  }
  if (typeof target.isNote === 'function' && target.isNote()) {
    if (target.parentItemID && typeof Zotero !== 'undefined' && Zotero.Items) {
      target = Zotero.Items.get(target.parentItemID) || target;
    }
  }
  try {
    if (target.topLevelItem && typeof target.topLevelItem.isRegularItem === 'function' && target.topLevelItem.isRegularItem()) {
      return target.topLevelItem;
    }
  } catch (_) {}
  return target && typeof target.isRegularItem === 'function' && target.isRegularItem() ? target : null;
};

export const findItemByKey = (itemKey: string, libraryID: any = null): any => {
  if (!itemKey || typeof Zotero === 'undefined' || !Zotero.Items) return null;
  const key = String(itemKey).trim();
  if (!key) return null;

  // 1. Explicit libraryID lookup
  if (libraryID !== null && libraryID !== undefined) {
    try {
      const item = Zotero.Items.getByLibraryAndKey(libraryID, key);
      if (item) return getLiteratureItem(item);
    } catch (_) {}
  }

  // 2. User personal library lookup
  const userLibID = Zotero.Libraries?.userLibraryID || 1;
  try {
    const item = Zotero.Items.getByLibraryAndKey(userLibID, key);
    if (item) return getLiteratureItem(item);
  } catch (_) {}

  // 3. Fallback: Search all registered libraries (including group libraries)
  try {
    const allLibs = typeof Zotero.Libraries?.getAll === 'function' ? Zotero.Libraries.getAll() : [];
    for (const lib of allLibs) {
      const libId = lib?.libraryID || lib?.id;
      if (libId && libId !== userLibID) {
        const item = Zotero.Items.getByLibraryAndKey(libId, key);
        if (item) return getLiteratureItem(item);
      }
    }
  } catch (_) {}

  return null;
};

export const STATUS_TAG_MAP: Record<string, string> = {
  idea: 'PaperFlow/01-选题大纲',
  outline: 'PaperFlow/01-选题大纲',
  data_collection: 'PaperFlow/01-选题大纲',
  figure_preparation: 'PaperFlow/02-图表初稿',
  drafting: 'PaperFlow/02-图表初稿',
  internal_review: 'PaperFlow/02-组内评审',
  submitted: 'PaperFlow/03-已正式投稿',
  under_review: 'PaperFlow/04-同行审稿中',
  revision: 'PaperFlow/05-修回修订中',
  accepted: 'PaperFlow/06-已录用Accepted',
  published: 'PaperFlow/07-已正式发表'
};

export const extractCiteKey = (target: any): string => {
  if (!target) return '';
  const extra = typeof target.getField === 'function' ? (target.getField('extra') || '') : '';
  const m = extra.match(/(?:Citation Key|tex\.citationkey|bibtex):\s*([^\s\n\r]+)/i);
  if (m && m[1]) return m[1].trim();

  let firstAuthor = 'author';
  try {
    const creators = target.getCreators?.() || [];
    if (creators.length > 0) {
      firstAuthor = (creators[0].lastName || creators[0].name || 'author').replace(/[^a-zA-Z]/g, '').toLowerCase();
    }
  } catch (_) {}
  const date = typeof target.getField === 'function' ? target.getField('date') : '';
  const ym = String(date || '').match(/\b(19|20)\d{2}\b/);
  const year = ym ? ym[0] : '2024';

  const title = (typeof target.getField === 'function' ? target.getField('title') : '') || '';
  const firstWord = (title.split(/\s+/)[0] || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  return `${firstAuthor}${year}${firstWord ? firstWord : ''}`;
};

export const generateBibTeX = (target: any): string => {
  if (!target) return '';
  const citekey = extractCiteKey(target);
  const title = typeof target.getField === 'function' ? (target.getField('title') || '') : '';
  const journal = typeof target.getField === 'function'
    ? (target.getField('publicationTitle') || target.getField('proceedingsTitle') || target.getField('publisher') || '')
    : '';
  const date = typeof target.getField === 'function' ? target.getField('date') : '';
  const ym = String(date || '').match(/\b(19|20)\d{2}\b/);
  const year = ym ? ym[0] : '';
  const doi = typeof target.getField === 'function' ? (target.getField('DOI') || '') : '';
  const url = typeof target.getField === 'function' ? (target.getField('url') || '') : '';

  let authorStr = '';
  try {
    const creators = target.getCreators?.() || [];
    authorStr = creators.map((c: any) => `${c.lastName || ''}, ${c.firstName || ''}`.trim()).filter(Boolean).join(' and ');
  } catch (_) {}

  return `@article{${citekey},
  title = {${title}},
  author = {${authorStr}},
  journal = {${journal}},
  year = {${year}}${doi ? `,\n  doi = {${doi}}` : ''}${url ? `,\n  url = {${url}}` : ''}
}`;
};

export const generateAPACitation = (target: any): string => {
  if (!target) return '';
  let authors: string[] = [];
  try {
    authors = (target.getCreators?.() || []).map((c: any) => c.lastName ? `${c.lastName}, ${c.firstName ? c.firstName[0] + '.' : ''}` : c.name).filter(Boolean);
  } catch (_) {}
  const authorStr = authors.length > 0 ? (authors.slice(0, 3).join(', ') + (authors.length > 3 ? ', et al.' : '')) : 'Anonymous';
  const date = typeof target.getField === 'function' ? target.getField('date') : '';
  const ym = String(date || '').match(/\b(19|20)\d{2}\b/);
  const yearStr = ym ? `(${ym[0]})` : '(n.d.)';
  const title = (typeof target.getField === 'function' ? target.getField('title') : '') || '';
  const journal = typeof target.getField === 'function' ? (target.getField('publicationTitle') || '') : '';
  const doi = typeof target.getField === 'function' ? target.getField('DOI') : '';

  return `${authorStr} ${yearStr}. ${title}. ${journal ? journal + '.' : ''}${doi ? ' https://doi.org/' + doi : ''}`.trim();
};

export const getLiteratureAnnotations = (item: any): any[] => {
  const target = getLiteratureItem(item);
  if (!target) return [];
  const annotations: any[] = [];
  try {
    const attIds = typeof target.getAttachments === 'function' ? target.getAttachments() : [];
    for (const attId of attIds) {
      const att = typeof Zotero !== 'undefined' && Zotero.Items ? Zotero.Items.get(attId) : null;
      if (att && ((typeof att.isPDFAttachment === 'function' && att.isPDFAttachment()) || att.contentType === 'application/pdf')) {
        const groupID = Zotero.Libraries?.get?.(att.libraryID)?.groupID;
        const pdfBaseUri = groupID
          ? `zotero://open-pdf/groups/${groupID}/items/${att.key}`
          : `zotero://open-pdf/library/items/${att.key}`;

        if (typeof att.getAnnotations === 'function') {
          const annos = att.getAnnotations();
          for (const a of (annos || [])) {
            if (a.annotationText || a.annotationComment) {
              let pageIndex = 0;
              try {
                if (a.annotationPosition) {
                  const pos = typeof a.annotationPosition === 'string' ? JSON.parse(a.annotationPosition) : a.annotationPosition;
                  pageIndex = typeof pos.pageIndex === 'number' ? pos.pageIndex : 0;
                }
              } catch (_) {}
              const pageNum = a.annotationPageLabel || (pageIndex + 1);

              annotations.push({
                key: a.key,
                type: a.annotationType || 'highlight',
                text: String(a.annotationText || '').trim(),
                comment: String(a.annotationComment || '').trim(),
                color: a.annotationColor || '#ffd400',
                page: pageNum,
                pageIndex,
                date: a.dateModified || a.dateAdded || '',
                pdfUri: `${pdfBaseUri}?page=${pageIndex + 1}&annotation=${a.key}`
              });
            }
          }
        }
      }
    }
  } catch (err) {
    if (typeof Zotero !== 'undefined') Zotero.logError?.('[PaperFlow] getLiteratureAnnotations error: ' + err);
  }
  return annotations;
};

export const getRelatedItems = (item: any): any[] => {
  const target = getLiteratureItem(item);
  if (!target) return [];
  const related: any[] = [];
  try {
    if (typeof target.getRelatedItemIDs === 'function') {
      const rIds = target.getRelatedItemIDs();
      for (const rId of (rIds || []).slice(0, 6)) {
        const rItem = typeof Zotero !== 'undefined' && Zotero.Items ? Zotero.Items.get(rId) : null;
        const lit = getLiteratureItem(rItem);
        if (lit) {
          const date = typeof lit.getField === 'function' ? lit.getField('date') : '';
          const ym = String(date || '').match(/\b(19|20)\d{2}\b/);
          related.push({
            id: lit.id,
            key: lit.key,
            title: (typeof lit.getField === 'function' ? lit.getField('title') : '') || '未命名文献',
            year: ym ? ym[0] : '',
            authors: (lit.getCreators?.() || []).map((c: any) => c.lastName || c.name).filter(Boolean).slice(0, 2).join(', '),
            zoteroUri: itemSelectUri(lit)
          });
        }
      }
    }
  } catch (_) {}
  return related;
};

export const getLiteratureCollections = (item: any): any[] => {
  const target = getLiteratureItem(item);
  if (!target) return [];
  const collections: any[] = [];
  try {
    if (typeof target.getCollections === 'function') {
      const colIds = target.getCollections();
      for (const cId of (colIds || [])) {
        const col = typeof Zotero !== 'undefined' ? Zotero.Collections?.get?.(cId) : null;
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
  } catch (_) {}
  return collections;
};

export const getLiteratureNotes = (item: any): any[] => {
  const target = getLiteratureItem(item);
  if (!target) return [];
  const notes: any[] = [];
  try {
    if (typeof target.getNotes === 'function') {
      const noteIds = target.getNotes();
      for (const nId of (noteIds || [])) {
        const nItem = typeof Zotero !== 'undefined' ? Zotero.Items?.get?.(nId) : null;
        if (nItem && typeof nItem.isNote === 'function' && nItem.isNote()) {
          const rawNote = (typeof nItem.getNote === 'function' ? nItem.getNote() : '') || '';
          if (rawNote.includes('[ResearchFlow]') || rawNote.includes('ResearchFlow for Zotero') || rawNote.includes('[PaperFlow]') || rawNote.includes('Zotero PaperFlow')) {
            continue;
          }
          const snippet = rawNote.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (snippet || rawNote) {
            const titleMatch = rawNote.match(/<(?:h[1-6]|p|strong)[^>]*>(.*?)<\/(?:h[1-6]|p|strong)>/i);
            const noteTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : (snippet.slice(0, 24) || 'Zotero 笔记');
            notes.push({
              id: nItem.id,
              key: nItem.key,
              title: noteTitle,
              rawHtml: rawNote,
              snippet: snippet.slice(0, 300) + (snippet.length > 300 ? '…' : ''),
              date: nItem.dateModified || nItem.dateAdded || '',
              zoteroUri: itemSelectUri(nItem)
            });
          }
        }
      }
    }
  } catch (err) {
    if (typeof Zotero !== 'undefined') Zotero.logError?.('[PaperFlow] getLiteratureNotes error: ' + err);
  }
  return notes;
};

export const getLiteratureReadingAssets = (item: any): any => {
  const target = getLiteratureItem(item);
  if (!target) {
    return { annotations: [], notes: [], collections: [], tags: [], relatedItems: [], citekey: '', bibtex: '', citationApa: '' };
  }
  return {
    annotations: getLiteratureAnnotations(target),
    notes: getLiteratureNotes(target),
    collections: getLiteratureCollections(target),
    tags: typeof target.getTags === 'function' ? target.getTags().map((t: any) => t.tag || String(t)).filter(Boolean) : [],
    relatedItems: getRelatedItems(target),
    citekey: extractCiteKey(target),
    bibtex: generateBibTeX(target),
    citationApa: generateAPACitation(target)
  };
};

export const serializeLiteratureItem = (item: any): any => {
  const target = getLiteratureItem(item);
  if (!target) return null;

  const title = (typeof target.getField === 'function' ? target.getField('title') : target.title) || '无标题文献';
  const date = typeof target.getField === 'function' ? target.getField('date') : target.date;
  let year = '';
  if (date) {
    const match = String(date).match(/\b(19|20)\d{2}\b/);
    year = match ? match[0] : String(date).slice(0, 4);
  }

  let authors: string[] = [];
  try {
    if (typeof target.getCreators === 'function') {
      authors = target.getCreators().map((c: any) => c.lastName || c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()).filter(Boolean);
    }
  } catch (_) {}

  const publication = typeof target.getField === 'function'
    ? (target.getField('publicationTitle') || target.getField('proceedingsTitle') || target.getField('publisher') || '')
    : '';

  const doi = typeof target.getField === 'function' ? (target.getField('DOI') || '') : '';
  const url = typeof target.getField === 'function' ? (target.getField('url') || '') : '';
  const abstract = typeof target.getField === 'function' ? (target.getField('abstractNote') || '') : '';

  let tags: string[] = [];
  try {
    if (typeof target.getTags === 'function') {
      tags = target.getTags().map((t: any) => t.tag || String(t)).filter(Boolean);
    }
  } catch (_) {}

  // Main PDF attachment URI
  let pdfUri: string | null = null;
  try {
    if (typeof target.getAttachments === 'function') {
      const attIds = target.getAttachments();
      for (const attId of attIds) {
        const att = typeof Zotero !== 'undefined' && Zotero.Items ? Zotero.Items.get(attId) : null;
        if (att && ((typeof att.isPDFAttachment === 'function' && att.isPDFAttachment()) || att.contentType === 'application/pdf')) {
          const groupID = Zotero.Libraries?.get?.(att.libraryID)?.groupID;
          pdfUri = groupID
            ? `zotero://open-pdf/groups/${groupID}/items/${att.key}`
            : `zotero://open-pdf/library/items/${att.key}`;
          break;
        }
      }
    }
  } catch (_) {}

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
    authors: authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' 等' : ''),
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
    pdfUri,
  };
};

export const RFAcademicCitation = {
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

if (typeof globalThis !== 'undefined') {
  (globalThis as any).RFAcademicCitation = RFAcademicCitation;
}
if (typeof window !== 'undefined') {
  (window as any).RFAcademicCitation = RFAcademicCitation;
}
