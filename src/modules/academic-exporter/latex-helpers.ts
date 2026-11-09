/**
 * Zotero PaperFlow - Academic Exporter LaTeX & Clipboard Helpers
 */
declare var ZoteroBridge: any;
declare function escapeLatex(value: any): string;

export function getSubmissionReviewMatrixRows(sub: any): any[] {
  if (!sub) return [];
  if (Array.isArray(sub.reviewMatrix)) return sub.reviewMatrix;
  if (Array.isArray(sub.reviews)) return sub.reviews;
  return [];
}

export function escapeLatexText(value: any): string {
  return String(value ?? '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%#_{}])/g, '\\$1')
    .replace(/\$/g, '\\$')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\r?\n\r?\n/g, '\\par\\medskip ')
    .replace(/\r?\n/g, '\\par ');
}

export function safeEscapeLatex(value: any): string {
  if (typeof escapeLatex === 'function') {
    return escapeLatex(value);
  }
  return escapeLatexText(value).replace(/\\par\s*/g, ' ');
}

export async function copyRebuttalRichText(htmlContent: string, plainFallback = ''): Promise<boolean> {
  const plain = plainFallback || htmlContent.replace(/<[^>]+>/g, '');
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
    try {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([plain], { type: 'text/plain' });
      const item = new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText });
      await navigator.clipboard.write([item]);
      return true;
    } catch (_) {}
  }
  if (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.copyText) {
    ZoteroBridge.copyText(plain);
    return true;
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(plain);
    return true;
  }
  return false;
}
