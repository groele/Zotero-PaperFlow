/**
 * Zotero PaperFlow Preferences - Controller & DOM Bindings
 */
import { DEFAULTS, FIELDS } from './schema.js';

declare var Zotero: any;

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

export function buildSettingRow(field: any, doc: Document): HTMLElement {
  const row = doc.createElement('div');
  row.className = 'rf-pref-row';
  row.id = `rf-pref-row-${field.key}`;

  const info = doc.createElement('div');
  info.className = 'rf-pref-info';

  const label = doc.createElement('div');
  label.className = 'rf-pref-label';
  if (field.l10nLabel) {
    label.setAttribute('data-l10n-id', field.l10nLabel);
    if (!(doc as any).l10n) label.textContent = field.label;
  } else {
    label.textContent = field.label;
  }

  const desc = doc.createElement('div');
  desc.className = 'rf-pref-desc';
  if (field.l10nDesc) {
    desc.setAttribute('data-l10n-id', field.l10nDesc);
    if (!(doc as any).l10n) desc.textContent = field.desc;
  } else {
    desc.textContent = field.desc;
  }

  info.appendChild(label);
  info.appendChild(desc);
  row.appendChild(info);

  const ctrl = doc.createElement('div');
  ctrl.className = 'rf-pref-ctrl';

  const currentVal = getPrefValue(field.key);

  if (field.type === 'check') {
    const input = doc.createElement('input');
    input.type = 'checkbox';
    input.id = `rf-pref-${field.key}`;
    input.checked = Boolean(currentVal);
    input.addEventListener('change', () => {
      setPrefValue(field.key, input.checked);
      updateSubordinateStates(doc);
    });
    ctrl.appendChild(input);
  } else if (field.type === 'select') {
    const select = doc.createElement('select');
    select.id = `rf-pref-${field.key}`;
    for (const [val, text, l10nId] of field.options) {
      const opt = doc.createElement('option');
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
    select.addEventListener('change', () => {
      setPrefValue(field.key, select.value);
    });
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

export function renderPreferencesSection(containerId: string, sectionKey: string, doc: Document): void {
  const container = doc.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const fields = FIELDS[sectionKey] || [];
  for (const field of fields) {
    container.appendChild(buildSettingRow(field, doc));
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

  renderPreferencesSection(getSectionContainerId(doc, 'rf-pref-window', 'rf-window-settings-list'), 'window', doc);
  renderPreferencesSection(getSectionContainerId(doc, 'rf-pref-integration', 'rf-integration-settings-list'), 'integration', doc);
  renderPreferencesSection(getSectionContainerId(doc, 'rf-pref-workflow', 'rf-workflow-settings-list'), 'workflow', doc);
  renderPreferencesSection(getSectionContainerId(doc, 'rf-pref-data-sync', 'rf-storage-settings-list'), 'storage', doc);

  updateSubordinateStates(doc);

  const windowModeSelect = doc.getElementById('rf-pref-windowMode') as HTMLSelectElement | null;
  if (windowModeSelect) {
    windowModeSelect.addEventListener('change', () => {
      updateSubordinateStates(doc);
    });
  }

  const zotero = typeof Zotero !== 'undefined' ? Zotero : (win as any).Zotero;
  const hostWin = win as any;
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
      if (!hostWin._rfPrefUnloadBound && typeof win.addEventListener === 'function') {
        hostWin._rfPrefUnloadBound = true;
        win.addEventListener('unload', () => {
          if (hostWin._rfPrefObserverSymbol && zotero?.Prefs?.unregisterObserver) {
            try { zotero.Prefs.unregisterObserver(hostWin._rfPrefObserverSymbol); } catch (_) {}
            hostWin._rfPrefObserverSymbol = null;
          }
        }, { once: true });
      }
    } catch (_) {}
  }

  const resetBtn = doc.getElementById('rf-btn-reset-defaults');
  if (resetBtn && !(resetBtn as any).dataset?.rfBound) {
    if ((resetBtn as any).dataset) (resetBtn as any).dataset.rfBound = 'true';
    resetBtn.addEventListener('click', () => {
      if (zotero?.Prefs) {
        for (const [key, val] of Object.entries(DEFAULTS)) {
          zotero.Prefs.set(`extensions.researchflow.${key}`, val, true);
        }
        initPreferencesWindow(win);
      }
    });
  }
}
