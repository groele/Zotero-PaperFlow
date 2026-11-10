/**
 * Zotero PaperFlow - Submissions View Shared State
 */
const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);

export let selectedSubmissionId: string | null = g.selectedSubmissionId || null;
export let submissionAutoSaveCleanup: (() => void) | null = g.submissionAutoSaveCleanup || null;
export let pendingSubmissionSaves: number = g.pendingSubmissionSaves || 0;

export function setSelectedSubmissionId(id: string | null): void {
  selectedSubmissionId = id;
  if (typeof window !== 'undefined') (window as any).selectedSubmissionId = id;
  if (typeof globalThis !== 'undefined') (globalThis as any).selectedSubmissionId = id;
}

export function getSelectedSubmissionId(): string | null {
  const win = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  return win.selectedSubmissionId || selectedSubmissionId || null;
}

export function setSubmissionAutoSaveCleanup(fn: (() => void) | null): void {
  submissionAutoSaveCleanup = fn;
  if (typeof window !== 'undefined') (window as any).submissionAutoSaveCleanup = fn;
  if (typeof globalThis !== 'undefined') (globalThis as any).submissionAutoSaveCleanup = fn;
}

export function clearSubmissionAutoSave(): void {
  const win = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  try {
    if (typeof win.submissionAutoSaveCleanup === 'function') win.submissionAutoSaveCleanup();
    else if (typeof submissionAutoSaveCleanup === 'function') submissionAutoSaveCleanup();
  } catch (_) {}
  setSubmissionAutoSaveCleanup(null);
}

export function incrementPendingSubmissionSaves(): number {
  pendingSubmissionSaves += 1;
  const win = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  win.pendingSubmissionSaves = pendingSubmissionSaves;
  return pendingSubmissionSaves;
}

export function decrementPendingSubmissionSaves(): number {
  pendingSubmissionSaves = Math.max(0, pendingSubmissionSaves - 1);
  const win = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  win.pendingSubmissionSaves = pendingSubmissionSaves;
  return pendingSubmissionSaves;
}
