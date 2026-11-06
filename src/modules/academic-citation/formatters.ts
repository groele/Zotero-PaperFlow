/**
 * Zotero PaperFlow - Citation Formatters (BibTeX, APA, CiteKey)
 */

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
