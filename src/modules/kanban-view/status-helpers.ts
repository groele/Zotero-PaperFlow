declare var db: any;
declare const currentLanguage: string;
declare var selectedSubmissionId: any;
declare function escapeHTML(str: any): string;
declare function t(key: string): string;
declare function tf(key: string, vars?: Record<string, any>): string;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;
declare function validateLinkedManuscriptStatus(manuscript: any, status: any): void;
declare function setManuscriptStatus(manuscript: any, status: any, options?: any): boolean;

export async function persistManuscriptStatusChange(manuscript: any, nextStatus: string): Promise<any> {
  if (!manuscript) throw new Error('Manuscript not found');
  const win = (typeof window !== 'undefined' ? window : globalThis) as any;
  const liveDb = (typeof db !== 'undefined' && db) ? db : win.db;
  const manuscriptsList = liveDb?.manuscripts || [];
  const liveManuscript = manuscriptsList.find((m: any) => m.id === manuscript.id) || manuscript;

  const validateFn = typeof validateLinkedManuscriptStatus === 'function'
    ? validateLinkedManuscriptStatus
    : win.RFAcademicSync?.validateLinkedManuscriptStatus;
  if (typeof validateFn === 'function') {
    validateFn(liveManuscript, nextStatus);
  }

  const previousStatus = liveManuscript.status;
  const cloneDb = (source: any) => (typeof structuredClone === 'function' ? structuredClone(source) : JSON.parse(JSON.stringify(source)));
  const applyStatus = (targetMan: any, targetDb: any) => {
    const setStatusFn = typeof setManuscriptStatus === 'function'
      ? setManuscriptStatus
      : win.RFAcademicSync?.setManuscriptStatus;
    if (typeof setStatusFn === 'function') {
      return setStatusFn(targetMan, nextStatus, { database: targetDb });
    }
    const prev = targetMan.status;
    targetMan.status = nextStatus;
    targetMan.updatedAt = new Date().toISOString();
    return prev !== nextStatus;
  };

  let changed = false;
  if (liveDb && typeof win.storage?.saveAll === 'function') {
    const workingDb = cloneDb(liveDb);
    const workingMan = (workingDb.manuscripts || []).find((m: any) => m.id === liveManuscript.id) || cloneDb(liveManuscript);
    changed = applyStatus(workingMan, workingDb);
    const savedDb = await win.storage.saveAll(workingDb);
    const finalDb = savedDb || workingDb;
    Object.keys(liveDb).forEach((k) => { if (!Object.hasOwn(finalDb, k)) delete liveDb[k]; });
    Object.assign(liveDb, finalDb);
    win.db = liveDb;
    const savedMan = (liveDb.manuscripts || []).find((m: any) => m.id === liveManuscript.id);
    if (savedMan && savedMan !== liveManuscript) Object.assign(liveManuscript, savedMan);
    if (savedMan && manuscript !== savedMan) Object.assign(manuscript, savedMan);
  } else {
    changed = applyStatus(liveManuscript, liveDb);
    if (manuscript !== liveManuscript) Object.assign(manuscript, liveManuscript);
  }

  const celebrateFn = win.RFUI?.shouldCelebrateAcceptance;
  const shouldCelebrate = typeof celebrateFn === 'function'
    ? Boolean(celebrateFn(previousStatus, liveManuscript.status))
    : ((liveManuscript.status === 'accepted' || liveManuscript.status === 'published')
      && previousStatus !== 'accepted' && previousStatus !== 'published');

  return {
    manuscript: liveManuscript,
    previousStatus,
    nextStatus: liveManuscript.status,
    changed,
    shouldCelebrate,
  };
}

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

declare var RFPlatform: any;

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

export function initializeKanbanEmptyColumnsMode(): void {
  const button = document.getElementById('btn-toggle-empty-kanban');
  if (button && !button.dataset.bound) {
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const g = window as any;
      g.showEmptyKanbanColumns = !g.showEmptyKanbanColumns;
      updateKanbanEmptyColumns();
      const rf = typeof (window as any).RFPlatform !== 'undefined'
        ? (window as any).RFPlatform
        : (typeof RFPlatform !== 'undefined' ? RFPlatform : null);
      rf?.storage?.local?.set?.({ researchflow_kanban_show_empty: g.showEmptyKanbanColumns });
    });
  }
  const rf = typeof (window as any).RFPlatform !== 'undefined'
    ? (window as any).RFPlatform
    : (typeof RFPlatform !== 'undefined' ? RFPlatform : null);
  rf?.storage?.local?.get?.(['researchflow_kanban_show_empty'], (result: any) => {
    (window as any).showEmptyKanbanColumns = result?.researchflow_kanban_show_empty !== false;
    updateKanbanEmptyColumns();
  });
}
