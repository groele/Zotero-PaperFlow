declare const db: any;
declare const currentLanguage: string;
declare var selectedSubmissionId: any;
declare function escapeHTML(str: any): string;
declare function t(key: string): string;
declare function tf(key: string, vars?: Record<string, any>): string;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;

export async function deleteManuscript(manuscriptId: string): Promise<boolean> {
  if (!manuscriptId) return false;
  const man = (db.manuscripts || []).find((item: any) => item.id === manuscriptId);
  if (!man) return false;

  const title = man.title || (currentLanguage === 'zh' ? '该稿件' : 'this manuscript');
  const linkedSubmissions = (db.submissions || []).filter((sub: any) => sub.manuscriptId === manuscriptId);

  let confirmMessage = (typeof tf === 'function' ? tf('confirmDeleteManuscript') : null) ||
    t('confirmDeleteManuscript') ||
    (currentLanguage === 'zh'
      ? `确定要删除稿件《${title}》吗？`
      : `Are you sure you want to delete manuscript "${title}"?`);

  if (linkedSubmissions.length > 0) {
    const subNotice = currentLanguage === 'zh'
      ? `\n\n注意：此操作将同步删除关联的 ${linkedSubmissions.length} 个投稿跟踪记录。`
      : `\n\nNote: This will also remove ${linkedSubmissions.length} associated submission tracking record(s).`;
    confirmMessage += subNotice;
  }

  if (typeof confirm === 'function' && !confirm(confirmMessage)) return false;

  try {
    const win = (typeof window !== 'undefined' ? window : globalThis) as any;
    for (const sub of linkedSubmissions) {
      if (typeof win.storage?.recordEntityDeletion === 'function') {
        win.storage.recordEntityDeletion(db, 'submissions', sub.id);
      } else {
        db.submissions = (db.submissions || []).filter((s: any) => s.id !== sub.id);
      }
      if (typeof selectedSubmissionId !== 'undefined' && selectedSubmissionId === sub.id) {
        selectedSubmissionId = null;
      }
      if (win.selectedSubmissionId === sub.id) {
        win.selectedSubmissionId = null;
      }
    }

    if (typeof win.storage?.recordEntityDeletion === 'function') {
      win.storage.recordEntityDeletion(db, 'manuscripts', manuscriptId);
    } else {
      db.manuscripts = (db.manuscripts || []).filter((m: any) => m.id !== manuscriptId);
    }

    if (typeof win.storage?.saveAll === 'function') {
      await win.storage.saveAll(db);
    }

    if (typeof win.renderKanban === 'function') win.renderKanban();
    if (typeof win.renderDashboard === 'function') win.renderDashboard();
    if (typeof win.renderSubmissions === 'function') win.renderSubmissions();

    const subDetailPanel = document.getElementById('submission-detail-panel');
    const activeSel = typeof selectedSubmissionId !== 'undefined' ? selectedSubmissionId : win.selectedSubmissionId;
    if (subDetailPanel && (!activeSel || linkedSubmissions.some((s: any) => s.id === activeSel))) {
      win.RFUI?.setHTML?.(subDetailPanel, `
        <div class="empty-state">
          <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <h3>${escapeHTML(t('submissionEmptyDetail') || (currentLanguage === 'zh' ? '请选择一个投稿记录查看详情' : 'Select a submission to view details'))}</h3>
        </div>
      `);
    }

    const toastMsg = t('manuscriptDeletedToast') || (currentLanguage === 'zh' ? '稿件已成功删除。' : 'Manuscript deleted successfully.');
    if (typeof showGlobalToast === 'function') {
      showGlobalToast(toastMsg, 'success');
    }
    return true;
  } catch (error: any) {
    console.error('Delete manuscript failed:', error);
    if (typeof showGlobalToast === 'function') {
      showGlobalToast(error.message || (currentLanguage === 'zh' ? '删除稿件失败' : 'Failed to delete manuscript'), 'error');
    }
    return false;
  }
}

export function updateKanbanEmptyColumns(): void {
  const board = document.querySelector('.kanban-board');
  const button = document.getElementById('btn-toggle-empty-kanban');
  const showEmpty = Boolean((window as any).showEmptyKanbanColumns);
  board?.classList.toggle('show-empty-columns', showEmpty);
  if (button) {
    button.setAttribute('aria-pressed', String(showEmpty));
    button.textContent = t(showEmpty ? 'kanbanHideEmpty' : 'kanbanShowEmpty');
  }
}
