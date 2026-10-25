/* Local recovery UI. All file access and final validation belong to the Zotero host. */
(() => {
  'use strict';
  let root, list, editor, status, refresh;
  let generation = 0, busy = false, inspection = null, preview = null, choices = {};
  const tr = key => typeof t === 'function' ? t(key) : key;
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const localized = (tag, key, className) => {
    const node = element(tag, className, tr(key)); node.dataset.recoveryI18n = key; return node;
  };
  function message(key, error = false, suffix = '') {
    status.dataset.error = String(error); status.dataset.key = key; status.dataset.suffix = suffix;
    status.textContent = tr(key) + suffix;
  }
  function translate() {
    if (!root) return;
    root.querySelectorAll('[data-recovery-i18n]').forEach(node => { node.textContent = tr(node.dataset.recoveryI18n); });
    if (status.dataset.key) status.textContent = tr(status.dataset.key) + (status.dataset.suffix || '');
  }
  function pendingEdits() {
    return typeof db !== 'undefined' && (window.storage?.hasPendingEdits?.(db) || window.storage?.isSaving?.(db)
      || (typeof pendingSubmissionSaves !== 'undefined' && pendingSubmissionSaves > 0)
      || ['pending', 'saving', 'invalid', 'error'].includes(document.querySelector('[data-submission-autosave-status]')?.dataset.state));
  }
  function setBusy(value) {
    busy = value;
    root.setAttribute('aria-busy', String(value));
    root.querySelectorAll('button, input').forEach(node => { node.disabled = value; });
    const next = root.querySelector('[data-recovery-preview]');
    if (next) next.disabled = value || !inspection || inspection.rows.some(row => !choices[row.key]);
    const apply = root.querySelector('[data-recovery-apply]');
    if (apply) apply.disabled = value || !preview?.changes.length;
  }
  async function run(operation) {
    if (busy) return;
    const version = ++generation; setBusy(true); message('recoveryBusy');
    try { await operation(version); }
    catch (error) { if (version === generation) message('recoveryFailed', true, String(error.message || error)); }
    finally { if (version === generation) setBusy(false); }
  }
  async function loadList(version) {
    const result = await ZoteroBridge.conflictRecovery('list');
    if (version !== generation) return;
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
        open.addEventListener('click', () => inspect(item.id)); row.append(open);
      }
      list.append(row);
    }
    if (result.truncated) list.append(localized('p', 'recoveryListLimit', 'rf-recovery-help'));
  }
  function valueNode(value) {
    const wrap = element('div');
    const pre = element('pre', '', value.exists ? value.text : tr('recoveryMissing'));
    if (!value.exists) pre.dataset.recoveryI18n = 'recoveryMissing';
    pre.tabIndex = 0; wrap.append(pre);
    if (value.truncated) wrap.append(localized('p', 'recoveryTruncated', 'rf-recovery-help'));
    return wrap;
  }
  function compare() {
    preview = null; editor.replaceChildren();
    editor.append(localized('h4', 'recoveryCompareTitle'), element('p', 'rf-recovery-meta', tr('recoveryRevision') + inspection.revision),
      localized('p', 'recoveryAutomatic', 'rf-recovery-help'));
    if (!inspection.rows.length) editor.append(localized('p', 'recoveryNoConflicts', 'rf-recovery-help'));
    inspection.rows.forEach((row, index) => {
      const field = element('fieldset', 'rf-recovery-row');
      field.append(element('legend', '', row.path));
      const columns = element('div', 'rf-recovery-values');
      for (const [side, key] of [['base', 'recoveryBase'], ['local', 'recoveryLocal'], ['current', 'recoveryCurrent']]) {
        const label = element('label', 'rf-recovery-value');
        const input = element('input'); input.type = 'radio'; input.name = `rf-recovery-field-${index}`; input.value = side;
        input.checked = choices[row.key] === side;
        input.addEventListener('change', () => { choices[row.key] = side; preview = null; setBusy(false); });
        label.append(input, localized('span', key), valueNode(row[side])); columns.append(label);
      }
      field.append(columns); editor.append(field);
    });
    const actions = element('div', 'rf-recovery-actions');
    const next = localized('button', 'recoveryPreview'); next.type = 'button'; next.dataset.recoveryPreview = '';
    next.addEventListener('click', () => run(async version => {
      const result = await ZoteroBridge.conflictRecovery('preview', { token: inspection.token, choices: { ...choices } });
      if (version !== generation) return;
      preview = result; showPreview(); message(result.changes.length ? 'recoveryPreviewTitle' : 'recoveryNoChanges');
    }));
    actions.append(next); editor.append(actions); setBusy(busy);
  }
  function showPreview() {
    editor.replaceChildren(localized('h4', 'recoveryPreviewTitle'));
    preview.changes.forEach(row => {
      const field = element('fieldset', 'rf-recovery-row'); field.append(element('legend', '', row.path));
      const columns = element('div', 'rf-recovery-values rf-recovery-pair');
      for (const [side, key] of [['before', 'recoveryBefore'], ['after', 'recoveryAfter']]) {
        const value = element('div', 'rf-recovery-value'); value.append(localized('span', key), valueNode(row[side])); columns.append(value);
      }
      field.append(columns); editor.append(field);
    });
    const actions = element('div', 'rf-recovery-actions');
    const back = localized('button', 'recoveryBack'); back.type = 'button'; back.addEventListener('click', () => { compare(); message('recoveryCompareTitle'); });
    const apply = localized('button', 'recoveryApply'); apply.type = 'button'; apply.dataset.recoveryApply = '';
    apply.addEventListener('click', () => {
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
    editor.querySelector('h4').tabIndex = -1; editor.querySelector('h4').focus();
  }
  function inspect(id) {
    run(async version => {
      inspection = null; preview = null; choices = {}; editor.replaceChildren();
      const result = await ZoteroBridge.conflictRecovery('inspect', { id });
      if (version !== generation) return;
      inspection = result; choices = {}; compare(); message('recoveryCompareTitle');
      editor.querySelector('input, button')?.focus();
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
    refresh.addEventListener('click', () => run(async version => {
      inspection = null; preview = null; choices = {}; editor.replaceChildren(); await loadList(version); status.textContent = ''; delete status.dataset.key;
      if (location.hash === '#paperflow-recovery') root.scrollIntoView({ block: 'start' });
    }));
    if (!ZoteroBridge.isZotero) { refresh.disabled = true; message('recoveryUnavailable'); return; }
    refresh.click();
    window.addEventListener('message', event => {
      if (event.data?.type !== 'RESEARCHFLOW_DATA_UPDATED' || busy || !inspection) return;
      inspection = null; preview = null; choices = {}; editor.replaceChildren(); message('recoveryInvalidated', true);
    });
    window.addEventListener('unload', () => { generation++; inspection = null; preview = null; }, { once: true });
  }
  window.PaperFlowRecovery = { translate };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
