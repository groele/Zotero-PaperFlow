/**
 * Zotero PaperFlow - Conflict Recovery UI Module
 * Encapsulates draft inspection, 3-way conflict comparison, preview generation,
 * and conflict draft application.
 */
import { createLifecycleScope } from './ui-utils/lifecycle.js';

declare var t: (key: string) => string;
declare var db: any;
declare var pendingSubmissionSaves: number;
declare var ZoteroBridge: any;
declare var applyDatabaseUpdate: (data: any) => void;

export function initConflictRecovery(): void {
  if (typeof document === 'undefined') return;
  const rootScope = createLifecycleScope();
  let listScope = rootScope.child();
  let editorScope = rootScope.child();
  let root: HTMLElement, list: HTMLElement, editor: HTMLElement, status: HTMLElement, refresh: HTMLButtonElement;
  let generation = 0, busy = false, inspection: any = null, preview: any = null, choices: Record<string, string> = {};
  const tr = (key: string) => typeof t === 'function' ? t(key) : key;
  const element = (tag: string, className?: string, text?: string): any => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const localized = (tag: string, key: string, className?: string): any => {
    const node = element(tag, className, tr(key)); node.dataset.recoveryI18n = key; return node;
  };
  function message(key: string, error: boolean = false, suffix: string = '') {
    status.dataset.error = String(error); status.dataset.key = key; status.dataset.suffix = suffix;
    status.textContent = tr(key) + suffix;
  }
  function translate() {
    if (!root) return;
    root.querySelectorAll('[data-recovery-i18n]').forEach((node: any) => { node.textContent = tr(node.dataset.recoveryI18n); });
    if (status.dataset.key) status.textContent = tr(status.dataset.key) + (status.dataset.suffix || '');
  }
  function pendingEdits(): boolean {
    return typeof db !== 'undefined' && (Boolean((window as any).storage?.hasPendingEdits?.(db)) || Boolean((window as any).storage?.isSaving?.(db))
      || (typeof pendingSubmissionSaves !== 'undefined' && pendingSubmissionSaves > 0)
      || ['pending', 'saving', 'invalid', 'error'].includes((document.querySelector('[data-submission-autosave-status]') as HTMLElement)?.dataset?.state || ''));
  }
  function setBusy(value: boolean) {
    busy = value;
    root.setAttribute('aria-busy', String(value));
    root.querySelectorAll('button, input').forEach((node: any) => { node.disabled = value; });
    const next: HTMLButtonElement | null = root.querySelector('[data-recovery-preview]');
    if (next) next.disabled = value || !inspection || inspection.rows.some((row: any) => !choices[row.key]);
    const apply: HTMLButtonElement | null = root.querySelector('[data-recovery-apply]');
    if (apply) apply.disabled = value || !preview?.changes.length;
  }
  async function run(operation: (version: number) => Promise<void>) {
    if (busy) return;
    const version = ++generation; setBusy(true); message('recoveryBusy');
    try { await operation(version); }
    catch (error: any) { if (version === generation) message('recoveryFailed', true, String(error.message || error)); }
    finally { if (version === generation) setBusy(false); }
  }
  async function loadList(version: number) {
    const result = await ZoteroBridge.conflictRecovery('list');
    if (version !== generation || rootScope.aborted) return;
    listScope.abort();
    listScope = rootScope.child();
    list.replaceChildren();
    if (!result.entries.length) list.append(localized('p', 'recoveryEmpty', 'rf-recovery-help'));
    for (const item of result.entries) {
      const row = element('div', 'rf-recovery-draft');
      const detail = element('div');
      detail.append(element('time', '', new Date(item.createdAt).toLocaleString()), element('code', '', item.id));
      row.append(detail);
      if (item.resolved) row.append(localized('span', 'recoveryResolved', 'rf-recovery-meta'));
      else {
        const open = localized('button', 'recoveryOpen'); open.type = 'button';
        listScope.on(open, 'click', () => inspect(item.id)); row.append(open);
      }
      list.append(row);
    }
    if (result.truncated) list.append(localized('p', 'recoveryListLimit', 'rf-recovery-help'));
  }
  function valueNode(value: any) {
    const wrap = element('div');
    const pre = element('pre', '', value.exists ? value.text : tr('recoveryMissing'));
    if (!value.exists) pre.dataset.recoveryI18n = 'recoveryMissing';
    pre.tabIndex = 0; wrap.append(pre);
    if (value.truncated) wrap.append(localized('p', 'recoveryTruncated', 'rf-recovery-help'));
    return wrap;
  }
  function compare() {
    editorScope.abort();
    editorScope = rootScope.child();
    preview = null; editor.replaceChildren();
    editor.append(localized('h4', 'recoveryCompareTitle'), element('p', 'rf-recovery-meta', tr('recoveryRevision') + inspection.revision),
      localized('p', 'recoveryAutomatic', 'rf-recovery-help'));
    if (!inspection.rows.length) editor.append(localized('p', 'recoveryNoConflicts', 'rf-recovery-help'));
    inspection.rows.forEach((row: any, index: number) => {
      const field = element('fieldset', 'rf-recovery-row');
      field.append(element('legend', '', row.path));
      const columns = element('div', 'rf-recovery-values');
      for (const [side, key] of [['base', 'recoveryBase'], ['local', 'recoveryLocal'], ['current', 'recoveryCurrent']]) {
        const label = element('label', 'rf-recovery-value');
        const input = element('input'); input.type = 'radio'; input.name = `rf-recovery-field-${index}`; input.value = side;
        input.checked = choices[row.key] === side;
        editorScope.on(input, 'change', () => { choices[row.key] = side; preview = null; setBusy(false); });
        label.append(input, localized('span', key), valueNode(row[side])); columns.append(label);
      }
      field.append(columns); editor.append(field);
    });
    const actions = element('div', 'rf-recovery-actions');
    const next = localized('button', 'recoveryPreview'); next.type = 'button'; next.dataset.recoveryPreview = '';
    editorScope.on(next, 'click', () => run(async version => {
      const result = await ZoteroBridge.conflictRecovery('preview', { token: inspection.token, choices: { ...choices } });
      if (version !== generation) return;
      preview = result; showPreview(); message(result.changes.length ? 'recoveryPreviewTitle' : 'recoveryNoChanges');
    }));
    actions.append(next); editor.append(actions); setBusy(busy);
  }
  function showPreview() {
    editorScope.abort();
    editorScope = rootScope.child();
    editor.replaceChildren(localized('h4', 'recoveryPreviewTitle'));
    preview.changes.forEach((row: any) => {
      const field = element('fieldset', 'rf-recovery-row'); field.append(element('legend', '', row.path));
      const columns = element('div', 'rf-recovery-values rf-recovery-pair');
      for (const [side, key] of [['before', 'recoveryBefore'], ['after', 'recoveryAfter']]) {
        const value = element('div', 'rf-recovery-value'); value.append(localized('span', key), valueNode(row[side])); columns.append(value);
      }
      field.append(columns); editor.append(field);
    });
    const actions = element('div', 'rf-recovery-actions');
    const back = localized('button', 'recoveryBack'); back.type = 'button'; editorScope.on(back, 'click', () => { compare(); message('recoveryCompareTitle'); });
    const apply = localized('button', 'recoveryApply'); apply.type = 'button'; apply.dataset.recoveryApply = '';
    editorScope.on(apply, 'click', () => {
      if (pendingEdits()) { message('recoveryPending', true); return; }
      run(async version => {
        const result = await ZoteroBridge.conflictRecovery('apply', { token: preview.token });
        if (version !== generation) return;
        inspection = null; preview = null; choices = {}; editor.replaceChildren();
        if (typeof applyDatabaseUpdate === 'function') applyDatabaseUpdate(result.data);
        message('recoverySuccess', false, result.backup + (result.warning ? tr('recoveryReceiptWarning') : ''));
        status.focus();
        // A list refresh failure must not misreport a completed database write.
        try { await loadList(version); } catch (_) { /* Refresh drafts remains available. */ }
      });
    });
    actions.append(back, apply); editor.append(actions); setBusy(busy);
    (editor.querySelector('h4') as HTMLElement)?.focus();
  }
  function inspect(id: string) {
    run(async version => {
      inspection = null; preview = null; choices = {}; editor.replaceChildren();
      const result = await ZoteroBridge.conflictRecovery('inspect', { id });
      if (version !== generation) return;
      inspection = result; choices = {}; compare(); message('recoveryCompareTitle');
      (editor.querySelector('input, button') as HTMLElement)?.focus();
    });
  }
  function init() {
    const anchor = document.getElementById('settings-backup-card');
    if (!anchor || document.getElementById('paperflow-recovery')) return;
    root = element('section', 'rf-recovery'); root.id = 'paperflow-recovery'; root.setAttribute('aria-labelledby', 'rf-recovery-title');
    const header = element('div', 'rf-recovery-header');
    const title = localized('h3', 'recoveryTitle'); title.id = 'rf-recovery-title';
    refresh = localized('button', 'recoveryRefresh'); refresh.type = 'button';
    header.append(title, refresh); root.append(header, localized('p', 'recoveryHelp', 'rf-recovery-help'));
    status = element('div', 'rf-recovery-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.tabIndex = -1;
    list = element('div'); editor = element('div', 'rf-recovery-editor'); root.append(status, list, editor); anchor.after(root);
    rootScope.on(refresh, 'click', () => run(async version => {
      inspection = null; preview = null; choices = {}; editor.replaceChildren(); await loadList(version); status.textContent = ''; delete status.dataset.key;
      if (location.hash === '#paperflow-recovery') root.scrollIntoView({ block: 'start' });
    }));
    if (!ZoteroBridge?.isZotero) { refresh.disabled = true; message('recoveryUnavailable'); return; }
    refresh.click();
    rootScope.on(window, 'message', (event: any) => {
      if (event.data?.type !== 'RESEARCHFLOW_DATA_UPDATED' || busy || !inspection) return;
      inspection = null; preview = null; choices = {}; editor.replaceChildren(); message('recoveryInvalidated', true);
    });
    rootScope.on(window, 'unload', () => {
      generation++;
      inspection = null;
      preview = null;
      rootScope.abort();
    }, { once: true });
  }
  (window as any).PaperFlowRecovery = { translate };
  if (document.readyState === 'loading') rootScope.on(document, 'DOMContentLoaded', init, { once: true }); else init();
}

export const RFConflictRecovery = {
  initConflictRecovery
};

if (typeof document !== 'undefined') {
  initConflictRecovery();
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).RFConflictRecovery = RFConflictRecovery;
}
