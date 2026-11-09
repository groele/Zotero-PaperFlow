import {
  generateAcademicRebuttalLetter,
  generateRevisionCoverLetter,
  copyRebuttalRichText,
} from './list-and-portals';
import { getSubmissionReviewMatrixRows } from './checklist-and-matrix';

declare const db: any;
declare const currentLanguage: string;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function t(key: string): string;
declare function openModal(html: string): void;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;

export function openAcademicRebuttalExportModal(sub: any, man: any): void {
  const w = window as any;
  const savedReviewRows = getSubmissionReviewMatrixRows(sub);
  if (savedReviewRows.length === 0) {
    showGlobalToast(t('noReviewerCommentsExport'), 'warning');
    return;
  }

  const wordHtml = generateAcademicRebuttalLetter(sub, man, 'word');
  const mdCode = generateAcademicRebuttalLetter(sub, man, 'md');
  const latexCode = generateAcademicRebuttalLetter(sub, man, 'latex');
  const tableCode = generateAcademicRebuttalLetter(sub, man, 'table');
  const coverHtml = generateRevisionCoverLetter(sub, man, 'html');
  const coverMd = generateRevisionCoverLetter(sub, man, 'md');
  const coverLatex = generateRevisionCoverLetter(sub, man, 'latex');

  openModal(`
    <div class="modal-header">
      <h2>📋 ${escapeHTML(t('exportAcademicMatrixTitle') || (currentLanguage === 'zh' ? '导出标准学术审稿回复信与修回矩阵' : 'Export Response Letter & Rebuttal Matrix'))}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    <div style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">
      ${escapeHTML(currentLanguage === 'zh' ? `共检测到 ${savedReviewRows.length} 条审稿意见与回复。支持直接复制 Word 富文本 (保留格式、排版与表格)、学术 Markdown 模版、编译版 LaTeX 答复信或配套修回投稿信。` : `Detected ${savedReviewRows.length} comments and responses. Export formatted Word text, academic Markdown, LaTeX response letter, or revision cover letter.`)}
    </div>
    <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
      <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-word" style="font-size:12px; font-weight:600; padding:5px 12px; border-color:#e11d48; color:#e11d48;">📄 ${escapeHTML(t('exportTabWord') || 'Word / 富文本 (带格式)')}</button>
      <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-md" style="font-size:12px; font-weight:600; padding:5px 12px;">📝 ${escapeHTML(t('exportTabMarkdown') || '学术 Markdown 模版')}</button>
      <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-latex" style="font-size:12px; font-weight:600; padding:5px 12px;">📑 ${escapeHTML(t('exportTabLatex') || 'LaTeX 宏包答复信 (.tex)')}</button>
      <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-table" style="font-size:12px; font-weight:600; padding:5px 12px;">📊 ${escapeHTML(t('exportTabTable') || '意见矩阵汇总表')}</button>
      <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-cover" style="font-size:12px; font-weight:600; padding:5px 12px;">✉ ${escapeHTML(t('revisionCoverLetterTab') || '修回投稿自述信')}</button>
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <div id="rebuttal-word-preview-box" style="display:block; max-height:280px; overflow-y:auto; border:1px solid var(--input-border); border-radius:6px; padding:14px; background:#ffffff; color:#111827;"></div>
      <textarea id="rebuttal-export-preview" rows="12" readonly style="display:none; font-family:monospace; font-size:11px; line-height:1.5; width:100%; box-sizing:border-box; background:var(--input-bg); color:hsl(var(--text-primary)); border:1px solid var(--input-border); border-radius:6px; resize:vertical;"></textarea>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:14px;">
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn-primary" id="btn-copy-rebuttal-word" style="font-size:12px;">
          <span>📋 ${escapeHTML(currentLanguage === 'zh' ? '复制富文本 (直接粘贴至 Word / WPS)' : 'Copy Rich Text (Paste to Word)')}</span>
        </button>
        <button type="button" class="btn-secondary" id="btn-copy-rebuttal-code" style="font-size:12px;">
          <span>📋 ${escapeHTML(currentLanguage === 'zh' ? '复制当前代码' : 'Copy Code')}</span>
        </button>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn-secondary" id="btn-download-tex" style="font-size:12px;">
          <span>💾 ${escapeHTML(t('downloadTex') || '下载 .tex 文件')}</span>
        </button>
        <button type="button" class="btn-secondary" id="btn-download-md" style="font-size:12px;">
          <span>💾 ${escapeHTML(t('downloadMd') || '下载 .md 文件')}</span>
        </button>
        <button type="button" class="btn-secondary" id="btn-download-doc" style="font-size:12px;">
          <span>💾 ${escapeHTML(t('downloadDoc') || '下载 Word 兼容文件')}</span>
        </button>
      </div>
    </div>
  `);

  let defaultFormat = typeof ZoteroBridge !== 'undefined'
    ? ZoteroBridge.getPref('defaultRebuttalExportFormat', 'word')
    : (db?.settings?.defaultRebuttalExportFormat || 'word');
  if (defaultFormat === 'markdown') defaultFormat = 'md';
  let currentFormat = ['word', 'md', 'latex', 'table', 'cover'].includes(defaultFormat) ? defaultFormat : 'word';
  const previewArea = document.getElementById('rebuttal-export-preview') as HTMLTextAreaElement | null;
  const wordBox = document.getElementById('rebuttal-word-preview-box');
  const tabs = [
    { id: 'word', el: document.getElementById('modal-tab-word') },
    { id: 'md', el: document.getElementById('modal-tab-md') },
    { id: 'latex', el: document.getElementById('modal-tab-latex') },
    { id: 'table', el: document.getElementById('modal-tab-table') },
    { id: 'cover', el: document.getElementById('modal-tab-cover') },
  ];

  const updatePreview = () => {
    tabs.forEach((tItem) => {
      if (!tItem.el) return;
      if (tItem.id === currentFormat) {
        tItem.el.style.borderColor = '#e11d48';
        tItem.el.style.color = '#e11d48';
      } else {
        tItem.el.style.borderColor = 'var(--input-border)';
        tItem.el.style.color = 'hsl(var(--text-primary))';
      }
    });

    if (currentFormat === 'word') {
      if (wordBox) { wordBox.style.display = 'block'; w.RFUI.setHTML(wordBox, wordHtml); }
      if (previewArea) previewArea.style.display = 'none';
    } else if (currentFormat === 'cover') {
      if (wordBox) { wordBox.style.display = 'block'; w.RFUI.setHTML(wordBox, coverHtml); }
      if (previewArea) previewArea.style.display = 'none';
    } else {
      if (wordBox) wordBox.style.display = 'none';
      if (previewArea) {
        previewArea.style.display = 'block';
        if (currentFormat === 'md') previewArea.value = mdCode;
        else if (currentFormat === 'latex') previewArea.value = latexCode;
        else if (currentFormat === 'table') previewArea.value = tableCode;
      }
    }
  };
  updatePreview();

  tabs.forEach((item) => {
    item.el?.addEventListener('click', () => { currentFormat = item.id; updatePreview(); });
  });

  document.getElementById('btn-copy-rebuttal-word')?.addEventListener('click', async () => {
    const activeHtml = currentFormat === 'cover' ? coverHtml : wordHtml;
    const activeText = currentFormat === 'cover' ? coverMd : mdCode;
    await copyRebuttalRichText(activeHtml, activeText);
    showGlobalToast(t('copyWordSuccess') || (currentLanguage === 'zh' ? '已复制 Word 富文本至剪贴板！可直接粘贴至 Word / WPS。' : 'Copied rich text to clipboard! Ready to paste into Word.'), 'success');
  });

  document.getElementById('btn-copy-rebuttal-code')?.addEventListener('click', () => {
    let codeToCopy = mdCode;
    if (currentFormat === 'cover') codeToCopy = coverMd;
    else if (currentFormat === 'latex') codeToCopy = latexCode;
    else if (currentFormat === 'word') codeToCopy = wordHtml;
    else if (currentFormat === 'table') codeToCopy = tableCode;

    if (typeof ZoteroBridge !== 'undefined') {
      ZoteroBridge.copyText(codeToCopy, t('copyCodeSuccess') || (currentLanguage === 'zh' ? '已复制到剪贴板！' : 'Copied to clipboard!'));
    } else {
      navigator.clipboard?.writeText(codeToCopy);
      showGlobalToast(t('copyCodeSuccess') || (currentLanguage === 'zh' ? '已复制到剪贴板！' : 'Copied to clipboard!'), 'success');
    }
  });

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getExportFilename = (prefix: string, ext: string) => {
    const safeId = String(sub.externalManuscriptId || sub.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${prefix}_${safeId}.${ext}`;
  };

  document.getElementById('btn-download-tex')?.addEventListener('click', () => {
    const content = currentFormat === 'cover' ? coverLatex : latexCode;
    const name = currentFormat === 'cover' ? getExportFilename('cover_letter', 'tex') : getExportFilename('rebuttal_letter', 'tex');
    triggerDownload(content, name, 'text/plain;charset=utf-8');
    showGlobalToast(t('latexDownloaded'), 'success');
  });

  document.getElementById('btn-download-md')?.addEventListener('click', () => {
    const content = currentFormat === 'cover' ? coverMd : mdCode;
    const name = currentFormat === 'cover' ? getExportFilename('cover_letter', 'md') : getExportFilename('rebuttal_letter', 'md');
    triggerDownload(content, name, 'text/markdown;charset=utf-8');
    showGlobalToast(currentLanguage === 'zh' ? '已下载学术 Markdown 模版' : 'Downloaded Markdown document', 'success');
  });

  document.getElementById('btn-download-doc')?.addEventListener('click', () => {
    const content = currentFormat === 'cover' ? coverHtml : wordHtml;
    const name = currentFormat === 'cover' ? getExportFilename('cover_letter', 'doc') : getExportFilename('rebuttal_letter', 'doc');
    triggerDownload(content, name, 'application/msword;charset=utf-8');
    showGlobalToast(currentLanguage === 'zh' ? '已下载 Word 兼容文件' : 'Downloaded Word document', 'success');
  });
}
