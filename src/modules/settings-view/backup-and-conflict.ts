/**
 * Zotero PaperFlow - Database Export, Import Backup & Conflict Recovery UI
 */
declare var db: any;
declare var currentLanguage: string;
declare var pendingSubmissionSaves: number;
declare function t(key: string): string;
declare function escapeHTML(value: any): string;
declare function openModal(html: string): void;
declare function closeModal(): void;
declare function showGlobalToast(message: string, type?: string): void;
declare function normalizeThemePreference(value: any): string;
declare function resolvePreferredLanguage(): string;
declare function applyThemePreference(value: any): string;
declare function applyLanguage(): void;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function renderSubmissions(): void;
declare function renderSettings(): Promise<void>;

export function stripCredentialsForExport(sourceDb: any): any {
  const clone = JSON.parse(JSON.stringify(sourceDb || {}));
  const sp = clone.settings?.syncProviders;
  if (sp) {
    if (sp.webdavConfig) delete sp.webdavConfig.pass;
    if (sp.githubConfig) delete sp.githubConfig.pat;
    if (sp.metadata?.config) {
      delete sp.metadata.config.pass;
      delete sp.metadata.config.pat;
    }
  }
  return clone;
}

export function buildPrivacySafeDiagnostics(sourceDb: any): any {
  const sp = sourceDb?.settings?.syncProviders || {};
  const count = (key: string) => Array.isArray(sourceDb?.[key]) ? sourceDb[key].length : 0;
  const deletedCount = (key: string) => Array.isArray(sourceDb?.deletedEntities?.[key]) ? sourceDb.deletedEntities[key].length : 0;
  return {
    app: 'Zotero PaperFlow',
    version: '16.2.0',
    exportedAt: new Date().toISOString(),
    environment: {
      language: currentLanguage,
      theme: normalizeThemePreference(sourceDb?.settings?.profile?.theme),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    },
    database: {
      schemaVersion: sourceDb?.schemaVersion ?? null,
      revision: sourceDb?.revision ?? null,
      lastUpdated: sourceDb?.lastUpdated ?? null,
      updatedAt: sourceDb?.updatedAt ?? null,
      counts: {
        researchAreas: count('researchAreas'),
        projects: count('projects'),
        researchRecords: count('researchRecords'),
        manuscripts: count('manuscripts'),
        submissions: count('submissions'),
        tasks: count('tasks')
      },
      deletedCounts: {
        researchAreas: deletedCount('researchAreas'),
        projects: deletedCount('projects'),
        researchRecords: deletedCount('researchRecords'),
        manuscripts: deletedCount('manuscripts'),
        submissions: deletedCount('submissions'),
        tasks: deletedCount('tasks')
      }
    },
    sync: {
      provider: sp.metadata?.provider || 'local',
      autoSync: sp.metadata?.autoSync !== false,
      webdavConfigured: Boolean(sp.webdavConfig?.url || sp.metadata?.config?.url),
      githubConfigured: Boolean(sp.githubConfig?.repo || sp.metadata?.config?.repo),
      credentialsIncluded: false
    }
  };
}

export const MAX_IMPORT_DATABASE_BYTES = 25 * 1024 * 1024;
const DATABASE_COLLECTION_KEYS = ['researchAreas', 'projects', 'researchRecords', 'manuscripts', 'submissions', 'tasks'];

export function isValidImportedDatabaseObject(value: any): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return DATABASE_COLLECTION_KEYS.some((key) => Array.isArray(value[key]));
}

export function formatConflictValue(value: any): { text: string; truncated: boolean } {
  if (value === undefined) return { text: t('recoveryMissing'), truncated: false };
  const raw = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const text = raw ?? String(value);
  return text.length > 600
    ? { text: `${text.slice(0, 600)}…`, truncated: true }
    : { text, truncated: false };
}

export function renderConflictValueCell(value: any): string {
  const formatted = formatConflictValue(value);
  return `<pre>${escapeHTML(formatted.text)}</pre>${formatted.truncated ? `<small class="conflict-truncated-note">${escapeHTML(t('recoveryTruncated'))}</small>` : ''}`;
}

export function formatConflictTimestamp(value: any): string {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? new Date(time).toLocaleString() : String(value || '');
}

export async function refreshConflictDrafts(): Promise<void> {
  const container = document.getElementById('conflict-recovery-list');
  if (!container) return;
  if (typeof window.storage?.listConflictDrafts !== 'function') {
    window.RFUI.setHTML(container, `<p class="conflict-empty">${escapeHTML(t('recoveryUnavailable'))}</p>`);
    return;
  }
  window.RFUI.setHTML(container, `<p class="conflict-empty">${escapeHTML(t('recoveryBusy'))}</p>`);
  try {
    const drafts = await window.storage.listConflictDrafts();
    if (!Array.isArray(drafts) || !drafts.length) {
      window.RFUI.setHTML(container, `<p class="conflict-empty">${escapeHTML(t('recoveryEmpty'))}</p>`);
      return;
    }
    window.RFUI.setHTML(container, drafts.map((draft: any) => {
      const conflicts = Array.isArray(draft.conflicts) ? draft.conflicts : [];
      return `
        <div class="conflict-draft-row">
          <div class="conflict-draft-meta">
            <strong>${escapeHTML(draft.fileName)}</strong>
            <span>${escapeHTML(formatConflictTimestamp(draft.savedAt))} · ${escapeHTML(t('recoveryRevision'))}${escapeHTML(String(draft.expectedRevision ?? '—'))} → ${escapeHTML(String(draft.actualRevision ?? '—'))}</span>
            <div class="conflict-chip-row">
              ${draft.resolvedAt ? `<span class="settings-trust-pill">${escapeHTML(t('recoveryResolved'))}</span>` : ''}
              ${conflicts.slice(0, 6).map((item: string) => `<span class="conflict-chip">${escapeHTML(item)}</span>`).join('')}
            </div>
          </div>
          <button class="btn-secondary btn-open-conflict" type="button" data-conflict-file="${escapeHTML(draft.fileName)}">${escapeHTML(t('recoveryOpen'))}</button>
        </div>
      `;
    }).join(''));
    container.querySelectorAll('.btn-open-conflict').forEach((button: any) => {
      button.addEventListener('click', () => openConflictRecoveryModal(button.dataset.conflictFile));
    });
  } catch (error: any) {
    window.RFUI.setHTML(container, `<p class="conflict-empty">${escapeHTML(t('recoveryFailed') + (error.message || error))}</p>`);
  }
}

export async function openConflictRecoveryModal(fileName?: string): Promise<void> {
  if (!fileName || typeof window.storage?.inspectConflictDraft !== 'function') return;
  try {
    const plan = await window.storage.inspectConflictDraft(fileName);
    const items = Array.isArray(plan?.items) ? plan.items : [];
    const unresolved = items.filter((item: any) => item.conflict);
    const choices: Record<string, string> = {};
    unresolved.forEach((item: any) => { choices[item.id] = 'current'; });
    openModal('');
    const modalEl = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');

    const renderCompare = () => {
      if (!modalEl?.classList.contains('active') || !modalBody) return;
      const rows = unresolved.length ? unresolved.map((item: any, idx: number) => `
        <div class="conflict-compare-item">
          <div class="conflict-item-head">
            <strong>${escapeHTML(item.label)}</strong>
            <span>${escapeHTML(item.collection ? `${item.collection} · ${item.field || item.recordId}` : item.id)}</span>
          </div>
          <div class="conflict-choice-grid">
            ${(['current', 'local', 'base'] as const).map((source) => `
              <label class="conflict-choice-card ${choices[item.id] === source ? 'selected' : ''}">
                <input type="radio" name="conflict-choice-${idx}" data-conflict-id="${escapeHTML(item.id)}" value="${source}" ${choices[item.id] === source ? 'checked' : ''}>
                <span>${escapeHTML(t(source === 'current' ? 'recoveryCurrent' : (source === 'local' ? 'recoveryLocal' : 'recoveryBase')))}</span>
                ${renderConflictValueCell(item[`${source}Value`])}
              </label>
            `).join('')}
          </div>
        </div>
      `).join('') : `<p class="conflict-empty">${escapeHTML(t('recoveryNoConflicts'))}</p>`;

      window.RFUI.setHTML(modalBody, `
        <div class="modal-header">
          <div>
            <h2>${escapeHTML(t('recoveryCompareTitle'))}</h2>
            <p class="text-muted">${escapeHTML(fileName)} · ${escapeHTML(t('recoveryAutomatic'))}</p>
          </div>
          <button class="btn-secondary btn-icon" id="btn-close-modal" type="button" aria-label="${escapeHTML(t('cancel'))}">✕</button>
        </div>
        <div class="conflict-compare-list">${rows}</div>
        <div class="modal-footer">
          <button class="btn-secondary" id="btn-cancel-recovery" type="button">${escapeHTML(t('cancel'))}</button>
          <button class="btn-primary" id="btn-preview-recovery" type="button">${escapeHTML(t('recoveryPreview'))}</button>
        </div>
      `);
      modalBody.querySelector('#btn-close-modal')?.addEventListener('click', closeModal);
      modalBody.querySelector('#btn-cancel-recovery')?.addEventListener('click', closeModal);
      modalBody.querySelectorAll('input[data-conflict-id]').forEach((input: any) => {
        input.addEventListener('change', () => {
          choices[input.dataset.conflictId] = input.value;
          input.closest('.conflict-choice-grid')?.querySelectorAll('.conflict-choice-card')
            .forEach((card: any) => card.classList.toggle('selected', card.contains(input)));
        });
      });
      modalBody.querySelector('#btn-preview-recovery')?.addEventListener('click', () => renderPreview());
    };

    const renderPreview = async () => {
      const preview = await window.storage.inspectConflictDraft(fileName, choices);
      if (!modalEl?.classList.contains('active') || !modalBody) return;
      if (preview.currentRevision !== plan.currentRevision) {
        showGlobalToast(t('recoveryInvalidated'), 'warning');
        closeModal();
        await refreshConflictDrafts();
        return;
      }
      const changes = Array.isArray(preview?.changes) ? preview.changes : [];
      const rows = changes.length ? changes.map((change: any) => `
        <div class="conflict-preview-item">
          <strong>${escapeHTML(change.label)}</strong>
          <div class="conflict-preview-grid">
            <div><span>${escapeHTML(t('recoveryBefore'))}</span>${renderConflictValueCell(change.before)}</div>
            <div><span>${escapeHTML(t('recoveryAfter'))}</span>${renderConflictValueCell(change.after)}</div>
          </div>
        </div>
      `).join('') : `<p class="conflict-empty">${escapeHTML(t('recoveryNoChanges'))}</p>`;

      window.RFUI.setHTML(modalBody, `
        <div class="modal-header">
          <div>
            <h2>${escapeHTML(t('recoveryPreviewTitle'))}</h2>
            <p class="text-muted">${escapeHTML(fileName)} · ${escapeHTML(t('recoveryRevision'))}${escapeHTML(String(preview.currentRevision ?? '—'))}</p>
          </div>
          <button class="btn-secondary btn-icon" id="btn-close-modal" type="button" aria-label="${escapeHTML(t('cancel'))}">✕</button>
        </div>
        <div class="conflict-compare-list">${rows}</div>
        <div class="modal-footer">
          <button class="btn-secondary" id="btn-back-recovery" type="button">${escapeHTML(t('recoveryBack'))}</button>
          <button class="btn-primary" id="btn-apply-recovery" type="button" ${changes.length ? '' : 'disabled'}>${escapeHTML(t('recoveryApply'))}</button>
        </div>
      `);
      modalBody.querySelector('#btn-close-modal')?.addEventListener('click', closeModal);
      modalBody.querySelector('#btn-back-recovery')?.addEventListener('click', renderCompare);
      modalBody.querySelector('#btn-apply-recovery')?.addEventListener('click', async (event: any) => {
        if (pendingSubmissionSaves > 0 || document.querySelector('[data-submission-autosave-status][data-state="pending"], [data-submission-autosave-status][data-state="saving"]')) {
          showGlobalToast(t('recoveryPending'), 'warning');
          return;
        }
        const button = event.currentTarget as HTMLButtonElement;
        button.disabled = true;
        try {
          const result = await window.storage.applyConflictDraftResolution(
            fileName,
            choices,
            preview.currentRevision
          );
          db = await window.storage.loadAll();
          currentLanguage = resolvePreferredLanguage();
          applyThemePreference(db?.settings?.profile?.theme);
          applyLanguage();
          renderDashboard();
          renderKanban();
          renderSubmissions();
          await renderSettings();
          closeModal();
          const receiptWarning = result?.receiptError ? t('recoveryReceiptWarning') : '';
          showGlobalToast(`${t('recoverySuccess')}${result?.backupFileName || ''}${receiptWarning}`, result?.receiptError ? 'warning' : 'success');
        } catch (error: any) {
          button.disabled = false;
          showGlobalToast(t('recoveryFailed') + (error.message || error), 'error');
        }
      });
    };

    renderCompare();
  } catch (error: any) {
    showGlobalToast(t('recoveryFailed') + (error.message || error), 'error');
  }
}
