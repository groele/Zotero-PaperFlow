/**
 * Zotero PaperFlow Preferences - Controller & DOM Bindings
 */
import { DEFAULTS, FIELDS } from './schema.js';
import { bindPreferenceActions } from './actions.js';
import { createLifecycleScope, resetWeakScope, type LifecycleScope } from '../ui-utils/lifecycle.js';

declare var Zotero: any;
const HTML_NS = 'http://www.w3.org/1999/xhtml';
const SUBORDINATE_KEYS = new Set(['subwindowAlwaysOnTop', 'subwindowCompactMode']);
const prefWindowScopes = new WeakMap<Window, LifecycleScope>();
const prefRenderScopes = new WeakMap<Window, LifecycleScope>();

function createHtmlElement<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className?: string
): HTMLElementTagNameMap[K] {
  const el = (typeof doc.createElementNS === 'function'
    ? doc.createElementNS(HTML_NS, tag)
    : doc.createElement(tag)) as HTMLElementTagNameMap[K];
  if (className) el.className = className;
  return el;
}

export function getPrefValue(key: string): any {
  if (typeof Zotero === 'undefined' || !Zotero.Prefs) {
    return (DEFAULTS as any)[key];
  }
  const val = Zotero.Prefs.get(`extensions.researchflow.${key}`, true);
  return (val !== undefined && val !== null) ? val : (DEFAULTS as any)[key];
}

export function setPrefValue(key: string, value: any): void {
  if (typeof Zotero === 'undefined' || !Zotero.Prefs) return;
  Zotero.Prefs.set(`extensions.researchflow.${key}`, value, true);
}

export function buildSettingRow(field: any, doc: Document, scope?: LifecycleScope): HTMLElement {
  const currentVal = getPrefValue(field.key);
  const subordinate = SUBORDINATE_KEYS.has(field.key);

  if (field.type === 'check') {
    const item = createHtmlElement(doc, 'div', subordinate ? 'rf-setting-item rf-subordinate-row' : 'rf-setting-item');
    item.id = `rf-pref-row-${field.key}`;

    const header = createHtmlElement(doc, 'label', 'rf-check-header');
    const input = createHtmlElement(doc, 'input');
    input.type = 'checkbox';
    input.id = `rf-pref-${field.key}`;
    input.checked = Boolean(currentVal);
    const onCheckChange = () => {
      setPrefValue(field.key, input.checked);
      updateSubordinateStates(doc);
    };
    if (scope) scope.on(input, 'change', onCheckChange);
    else input.addEventListener('change', onCheckChange);

    const title = createHtmlElement(doc, 'span', 'rf-check-title');
    if (field.l10nLabel) {
      title.setAttribute('data-l10n-id', field.l10nLabel);
      if (!(doc as any).l10n) title.textContent = field.label;
    } else {
      title.textContent = field.label;
    }

    header.appendChild(input);
    header.appendChild(title);
    item.appendChild(header);

    const desc = createHtmlElement(doc, 'p', 'rf-setting-desc');
    if (field.l10nDesc) {
      desc.setAttribute('data-l10n-id', field.l10nDesc);
      if (!(doc as any).l10n) desc.textContent = field.desc;
    } else {
      desc.textContent = field.desc;
    }
    item.appendChild(desc);
    return item;
  }

  const row = createHtmlElement(doc, 'div', subordinate ? 'rf-pref-row rf-subordinate-row' : 'rf-pref-row');
  row.id = `rf-pref-row-${field.key}`;

  const info = createHtmlElement(doc, 'div', 'rf-pref-info');
  const label = createHtmlElement(doc, 'div', 'rf-pref-label');
  if (field.l10nLabel) {
    label.setAttribute('data-l10n-id', field.l10nLabel);
    if (!(doc as any).l10n) label.textContent = field.label;
  } else {
    label.textContent = field.label;
  }

  const desc = createHtmlElement(doc, 'div', 'rf-pref-desc');
  if (field.l10nDesc) {
    desc.setAttribute('data-l10n-id', field.l10nDesc);
    if (!(doc as any).l10n) desc.textContent = field.desc;
  } else {
    desc.textContent = field.desc;
  }

  info.appendChild(label);
  info.appendChild(desc);
  row.appendChild(info);

  const ctrl = createHtmlElement(doc, 'div', 'rf-pref-ctrl');
  if (field.type === 'select') {
    const select = createHtmlElement(doc, 'select');
    select.id = `rf-pref-${field.key}`;
    for (const [val, text, l10nId] of field.options) {
      const opt = createHtmlElement(doc, 'option');
      opt.value = val;
      if (l10nId) {
        opt.setAttribute('data-l10n-id', l10nId);
        if (!(doc as any).l10n) opt.textContent = text;
      } else {
        opt.textContent = text;
      }
      if (val === currentVal) opt.selected = true;
      select.appendChild(opt);
    }
    const onSelectChange = () => {
      setPrefValue(field.key, select.value);
    };
    if (scope) scope.on(select, 'change', onSelectChange);
    else select.addEventListener('change', onSelectChange);
    ctrl.appendChild(select);
  }

  row.appendChild(ctrl);
  return row;
}

export function updateSubordinateStates(doc: Document): void {
  const windowMode = getPrefValue('windowMode');
  const subCompactRow = doc.getElementById('rf-pref-row-subwindowCompactMode');
  const subTopRow = doc.getElementById('rf-pref-row-subwindowAlwaysOnTop');
  const isSubwindow = windowMode === 'subwindow';

  if (subCompactRow) {
    subCompactRow.classList.toggle('rf-disabled', !isSubwindow);
    const input = subCompactRow.querySelector('input');
    if (input) input.disabled = !isSubwindow;
  }
  if (subTopRow) {
    subTopRow.classList.toggle('rf-disabled', !isSubwindow);
    const input = subTopRow.querySelector('input');
    if (input) input.disabled = !isSubwindow;
  }
}

export function renderPreferencesSection(
  containerId: string,
  sectionKey: string,
  doc: Document,
  scope?: LifecycleScope
): void {
  const container = doc.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const fields = FIELDS[sectionKey] || [];
  for (const field of fields) {
    container.appendChild(buildSettingRow(field, doc, scope));
  }
  try {
    (doc as any).l10n?.translateFragment?.(container);
  } catch (_) {}
}

function getSectionContainerId(doc: Document, primaryId: string, legacyId: string): string {
  return doc.getElementById(primaryId) ? primaryId : legacyId;
}

export function initPreferencesWindow(win: Window): void {
  const doc = win.document;
  const hostWin = win as any;
  let winScope = prefWindowScopes.get(win);
  if (!winScope || winScope.aborted) {
    winScope = createLifecycleScope();
    prefWindowScopes.set(win, winScope);
  }
  const renderScope = resetWeakScope(prefRenderScopes, win, winScope.signal);

  renderPreferencesSection(getSectionContainerId(doc, 'rf-pref-window', 'rf-window-settings-list'), 'window', doc, renderScope);
  renderPreferencesSection(getSectionContainerId(doc, 'rf-pref-integration', 'rf-integration-settings-list'), 'integration', doc, renderScope);
  renderPreferencesSection(getSectionContainerId(doc, 'rf-pref-workflow', 'rf-workflow-settings-list'), 'workflow', doc, renderScope);
  renderPreferencesSection(getSectionContainerId(doc, 'rf-pref-data-sync', 'rf-storage-settings-list'), 'storage', doc, renderScope);

  updateSubordinateStates(doc);

  const windowModeSelect = doc.getElementById('rf-pref-windowMode') as HTMLSelectElement | null;
  if (windowModeSelect) {
    renderScope.on(windowModeSelect, 'change', () => {
      updateSubordinateStates(doc);
    });
  }

  bindPreferenceActions(doc, win, getPrefValue, setPrefValue, renderScope);

  const zotero = typeof Zotero !== 'undefined' ? Zotero : (win as any).Zotero;
  if (hostWin._rfPrefObserverSymbol && zotero?.Prefs?.unregisterObserver) {
    try { zotero.Prefs.unregisterObserver(hostWin._rfPrefObserverSymbol); } catch (_) {}
    hostWin._rfPrefObserverSymbol = null;
  }
  if (zotero?.Prefs?.registerObserver) {
    try {
      const sym = Symbol('ResearchFlowPrefPaneObserver');
      hostWin._rfPrefObserverSymbol = sym;
      zotero.Prefs.registerObserver('extensions.researchflow.', (pref: string) => {
        const prefix = 'extensions.researchflow.';
        const key = pref && pref.startsWith(prefix) ? pref.slice(prefix.length) : pref;
        if (key) {
          const ctrl = doc.getElementById(`rf-pref-${key}`) as any;
          const nextVal = getPrefValue(key);
          if (ctrl) {
            if (ctrl.type === 'checkbox') ctrl.checked = Boolean(nextVal);
            else if ('value' in ctrl) ctrl.value = nextVal;
          }
        }
        updateSubordinateStates(doc);
      }, sym);
    } catch (_) {}
  }

  if (!hostWin._rfPrefUnloadBound && typeof win.addEventListener === 'function') {
    hostWin._rfPrefUnloadBound = true;
    winScope.on(win, 'unload', () => {
      if (hostWin._rfPrefObserverSymbol && zotero?.Prefs?.unregisterObserver) {
        try { zotero.Prefs.unregisterObserver(hostWin._rfPrefObserverSymbol); } catch (_) {}
        hostWin._rfPrefObserverSymbol = null;
      }
      winScope?.abort();
    }, { once: true });
  }

  const resetBtn = doc.getElementById('rf-btn-reset-defaults');
  if (resetBtn) {
    renderScope.on(resetBtn, 'click', () => {
      if (zotero?.Prefs) {
        for (const [key, val] of Object.entries(DEFAULTS)) {
          zotero.Prefs.set(`extensions.researchflow.${key}`, val, true);
        }
        initPreferencesWindow(win);
      }
    });
  }
}
