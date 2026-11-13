/**
 * Zotero PaperFlow - Submission Compliance Checklist Helpers
 */
import { createLifecycleScope, type LifecycleScope } from '../ui-utils/lifecycle.js';

declare var submissionComplianceChecklistPresets: any[];
declare function escapeHTML(value: any): string;

let checklistEditorScope: LifecycleScope | null = null;

export function getSubmissionChecklistPreset(key: string): any | null {
  return submissionComplianceChecklistPresets.find((preset: any) => preset.key === key) || null;
}

export function getSubmissionChecklistLabel(key: string): string {
  const preset = getSubmissionChecklistPreset(key);
  return preset ? preset.label() : key;
}

export function isSubmissionChecklistDone(sub: any, key: string): boolean {
  if (!sub?.complianceChecklist || typeof sub.complianceChecklist !== 'object') return false;
  if (key in sub.complianceChecklist) return Boolean(sub.complianceChecklist[key]);
  const preset = getSubmissionChecklistPreset(key);
  return Boolean(preset?.legacyLabels?.some((label: string) => sub.complianceChecklist[label]));
}

export function setSubmissionChecklistDone(sub: any, key: string, checked: boolean): void {
  if (!sub.complianceChecklist || typeof sub.complianceChecklist !== 'object') {
    sub.complianceChecklist = {};
  }
  const preset = getSubmissionChecklistPreset(key);
  preset?.legacyLabels?.forEach((label: string) => {
    delete sub.complianceChecklist[label];
  });
  sub.complianceChecklist[key] = Boolean(checked);
}

export function getSubmissionChecklistKeys(sub: any): string[] {
  const savedKeys = Array.isArray(sub?.complianceChecklistKeys)
    ? sub.complianceChecklistKeys.map((key: any) => String(key || '').trim()).filter(Boolean)
    : [];
  if (savedKeys.length) return savedKeys;

  const customKeys = Object.keys(sub?.complianceChecklist || {}).filter((key) => (
    !submissionComplianceChecklistPresets.some((preset: any) => preset.key === key || preset.legacyLabels.includes(key))
  ));
  return [
    ...submissionComplianceChecklistPresets.map((preset: any) => preset.key),
    ...customKeys
  ];
}

export function collectSubmissionChecklistFromEditor(): Record<string, boolean> {
  const checklist: Record<string, boolean> = {};
  document.querySelectorAll('#sub-edit-compliance-checklist-container [data-checklist-item]').forEach((item: any) => {
    const key = String(item.getAttribute('data-checklist-key') || '').trim();
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (!key) return;
    checklist[key] = Boolean(checkbox?.checked);
  });
  return checklist;
}

export function collectSubmissionChecklistKeysFromEditor(): string[] {
  return Array.from(document.querySelectorAll('#sub-edit-compliance-checklist-container [data-checklist-item]'))
    .map((item: any) => String(item.getAttribute('data-checklist-key') || '').trim())
    .filter(Boolean);
}

export function renderSubmissionChecklistEditor(sub: any, checklistKeys = getSubmissionChecklistKeys(sub)): void {
  const checklistBox = document.getElementById('sub-edit-compliance-checklist-container');
  if (!checklistBox) return;
  checklistEditorScope?.abort('re-render');
  const scope = createLifecycleScope();
  checklistEditorScope = scope;

  window.RFUI.setHTML(checklistBox, checklistKeys.map((key: string) => {
    const isDone = isSubmissionChecklistDone(sub, key);
    const label = getSubmissionChecklistLabel(key);
    return `
      <div class="checklist-item submission-checklist-editor-item ${isDone ? 'done' : ''}" data-checklist-item data-checklist-key="${escapeHTML(key)}">
        <label class="submission-checklist-toggle">
          <input type="checkbox" ${isDone ? 'checked' : ''} data-key="${escapeHTML(key)}">
          <span>${escapeHTML(label)}</span>
        </label>
      </div>
    `;
  }).join(''));

  checklistBox.querySelectorAll('[data-checklist-item]').forEach((item: any) => {
    const key = item.getAttribute('data-checklist-key');
    const checkbox = item.querySelector('input[type="checkbox"]');
    scope.on(checkbox, 'change', (e: any) => {
      item.classList.toggle('done', e.target.checked);
      setSubmissionChecklistDone(sub, key, e.target.checked);
    });
  });
}
