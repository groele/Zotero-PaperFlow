/**
 * Zotero PaperFlow - Batch Review Import Modal
 */
import { parseReviewCommentsBatch } from './batch-parser';
import { acquireModalScope } from '../ui-utils/lifecycle.js';

declare var currentLanguage: string;
declare function openModal(html: string): void;
declare function closeModal(): void;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;
declare function createSubmissionReviewEditorRow(item: any, index: number): HTMLElement;
declare function reindexSubmissionReviewEditorRows(box: HTMLElement): void;
declare function escapeHTML(value: any): string;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;

export function openBatchReviewImportModal(sub: any, reviewBox: any, onComplete?: () => void): void {
  if (typeof openModal !== 'function') return;
  const esc = typeof escapeHTML === 'function' ? escapeHTML : ((s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  const tr = typeof t === 'function' ? t : ((k: string) => k);
  const trf = typeof tf === 'function' ? tf : ((k: string, p: any) => k);
  const curLang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'en';

  openModal(`
    <div class="modal-header">
      <h2>✨ ${esc(tr('batchImportTitle') || '智能批量解析导入审稿意见')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    <div style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">
      ${esc(tr('batchImportHelp') || '将期刊审稿邮件或决定信全文直接粘贴至下方，智能解析器将自动按审稿人与编号拆分为独立意见条目。')}
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <label style="font-size:12px; font-weight:600;">${esc(curLang === 'zh' ? '粘贴审稿信原始全文' : 'Raw Decision Letter / Review Text')}</label>
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:11px; color:var(--text-secondary);">${esc(curLang === 'zh' ? '默认审稿人' : 'Default Reviewer')}:</span>
        <select id="batch-import-default-rev" style="font-size:11px; padding:2px 6px; border-radius:4px; border:1px solid var(--input-border); background:var(--input-bg); color:hsl(var(--text-primary));">
          <option value="Reviewer #1">Reviewer #1</option>
          <option value="Reviewer #2">Reviewer #2</option>
          <option value="Reviewer #3">Reviewer #3</option>
          <option value="Editor">Editor</option>
        </select>
      </div>
    </div>
    <textarea id="batch-import-textarea" rows="8" placeholder="${esc(tr('batchImportPlaceholder') || 'Paste review comments here...')}" style="width:100%; box-sizing:border-box; font-family:inherit; font-size:12px; line-height:1.4; padding:8px; border:1px solid var(--input-border); border-radius:6px; background:var(--input-bg); color:hsl(var(--text-primary)); resize:vertical;"></textarea>
    
    <div id="batch-import-preview-container" style="margin-top:10px; max-height:160px; overflow-y:auto; border:1px solid var(--input-border); border-radius:6px; padding:10px; background:hsl(var(--card-bg, 0 0% 100% / 0.5));">
      <p style="font-size:12px; color:var(--text-secondary); margin:0;">${esc(curLang === 'zh' ? '输入文本后在此实时预览解析结果...' : 'Parsed preview will appear here in real time...')}</p>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap; gap:8px;">
      <div id="batch-import-stats" style="font-size:12px; font-weight:600; color:var(--accent-blue, #0284c7);"></div>
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn-secondary" id="btn-batch-do-append">
          <span>➕ ${esc(tr('batchImportAppend') || '追加导入')}</span>
        </button>
        <button type="button" class="btn-primary" id="btn-batch-do-replace">
          <span>🔄 ${esc(tr('batchImportReplace') || '覆盖替换现有')}</span>
        </button>
      </div>
    </div>
  `);

  const modalScope = acquireModalScope();
  const textarea = document.getElementById('batch-import-textarea') as HTMLTextAreaElement | null;
  const defaultRevSelect = document.getElementById('batch-import-default-rev') as HTMLSelectElement | null;
  const previewContainer = document.getElementById('batch-import-preview-container');
  const statsEl = document.getElementById('batch-import-stats');

  let currentParsed: any[] = [];

  function updatePreview() {
    if (!textarea || !defaultRevSelect || !previewContainer || !statsEl) return;
    const raw = textarea.value;
    const defRev = defaultRevSelect.value;
    currentParsed = parseReviewCommentsBatch(raw, defRev);
    if (currentParsed.length === 0) {
      previewContainer.innerHTML = `<p style="font-size:12px; color:var(--text-secondary); margin:0;">${esc(curLang === 'zh' ? '未解析到有效意见条目。请粘贴文本。' : 'No comments detected. Please paste text.')}</p>`;
      statsEl.textContent = '';
      return;
    }
    const revCount = new Set(currentParsed.map((p) => p.reviewer)).size;
    statsEl.textContent = trf('batchImportParsedSummary', { comments: currentParsed.length, reviewers: revCount }) ||
      (curLang === 'zh' ? `已识别到 ${currentParsed.length} 条意见（来自 ${revCount} 位审稿人/编辑）` : `Detected ${currentParsed.length} comments across ${revCount} reviewer(s).`);

    previewContainer.innerHTML = currentParsed.map((item, idx) => `
      <div style="margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid rgba(0,0,0,0.06); font-size:11px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
          <span class="badge badge-purple" style="font-size:10px;">${esc(item.reviewer)}</span>
          <strong>#${idx + 1}</strong>
        </div>
        <div style="color:var(--text-secondary); max-height:40px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${esc(item.comment)}
        </div>
      </div>
    `).join('');
  }

  modalScope.on(textarea, 'input', updatePreview);
  modalScope.on(defaultRevSelect, 'change', updatePreview);

  function executeImport(mode: 'append' | 'replace') {
    if (!currentParsed || currentParsed.length === 0) {
      if (typeof showGlobalToast === 'function') showGlobalToast(tr('batchImportEmptyToast') || '请先粘贴待解析的审稿文本', 'warning');
      return;
    }
    const emptyState = reviewBox?.querySelector?.('.empty-state');
    if (emptyState) emptyState.remove();

    if (mode === 'replace') {
      const w = window as any;
      if (w.RFUI?.setHTML) w.RFUI.setHTML(reviewBox, '');
      else if (reviewBox) reviewBox.innerHTML = '';
    }

    const currentCount = reviewBox ? reviewBox.querySelectorAll('.submission-edit-review-row').length : 0;
    currentParsed.forEach((item, index) => {
      if (typeof createSubmissionReviewEditorRow === 'function' && reviewBox) {
        reviewBox.appendChild(createSubmissionReviewEditorRow(item, currentCount + index));
      }
    });

    if (typeof reindexSubmissionReviewEditorRows === 'function' && reviewBox) {
      reindexSubmissionReviewEditorRows(reviewBox);
    }
    if (typeof onComplete === 'function') onComplete();
    reviewBox?.dispatchEvent(new CustomEvent('submission-autosave-request', {
      bubbles: true,
      detail: { immediate: true }
    }));
    if (typeof closeModal === 'function') closeModal();
    if (typeof showGlobalToast === 'function') {
      showGlobalToast(trf('batchImportSuccessToast', { count: currentParsed.length }) || (curLang === 'zh' ? `成功解析并导入 ${currentParsed.length} 条审稿意见！` : `Successfully imported ${currentParsed.length} comments.`), 'success');
    }
  }

  modalScope.on(document.getElementById('btn-batch-do-append'), 'click', () => executeImport('append'));
  modalScope.on(document.getElementById('btn-batch-do-replace'), 'click', () => executeImport('replace'));
}
