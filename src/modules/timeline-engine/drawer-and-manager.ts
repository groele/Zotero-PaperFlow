/**
 * Zotero PaperFlow - Timeline Stage Drawer, Event Manager & Node Deletion
 */
import { acquireModalScope } from '../ui-utils/lifecycle.js';

declare var db: any;
declare var modalContent: HTMLElement;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function escapeHTML(value: any): string;
declare function openModal(html: string): void;
declare function closeModal(): void;
declare function registerModalCleanup(fn: () => void): void;
declare function showGlobalToast(message: string, type?: string): void;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function renderSubmissions(): void;
declare function getTimelineNodeDisplayName(node: any): string;
declare function normalizeDateString(dateStr: any): string;
declare function dateInputToIso(dateStr: string): string | null;
declare function todayString(): string;
declare function addDays(dateStr: string, days: number): string;
declare function getNodeDate(node: any): string;
declare function formatShortDate(dateStr: any): string;
declare function computeNodeStatus(node: any): string;
declare function getNodeStatusLabel(status: string): string;
declare function autoSortNodes(nodes: any[]): any[];
declare function inferKey(node: any): string;
declare function getTimelineNodeByKey(sub: any, key: string): any;
declare function applyInlineEventToSubmission(sub: any, key: string, eventDate: string, note?: string): void;
declare function normalizeSubmissionTimeline(sub: any): boolean;
declare function syncManuscriptStatusFromSubmission(sub: any): boolean;
declare function clearPublicationLinkFields(sub: any): boolean;
declare function clearPublicationTimelineCompletion(sub: any): boolean;

const g: any = typeof globalThis !== 'undefined' ? globalThis : window;
export const typeMeta: Record<string, { labelKey: string; color: string }> = {
  research: { labelKey: 'eventTypeResearch', color: '#2563eb' },
  writing: { labelKey: 'eventTypeWriting', color: '#7c3aed' },
  submission: { labelKey: 'eventTypeSubmission', color: '#f97316' },
  review: { labelKey: 'eventTypeReview', color: '#f97316' },
  revision: { labelKey: 'eventTypeRevision', color: '#dc2626' },
  rejection: { labelKey: 'statusRejected', color: '#b91c1c' },
  publication: { labelKey: 'eventTypePublication', color: '#16a34a' },
  special: { labelKey: 'eventTypeSpecial', color: '#64748b' }
};

export function getTimelineTypeMeta(type: string): any {
  const meta = typeMeta[type] || typeMeta.special;
  return { ...meta, label: t(meta.labelKey || 'eventTypeSpecial') };
}

g.typeMeta = typeMeta;
g.getTimelineTypeMeta = getTimelineTypeMeta;

export function buildOptions(options: any[], selectedValue: any): string {
  return options.map((option) => {
    const value = typeof option === 'string' ? option : option.value;
    const label = typeof option === 'string' ? option : option.label;
    return `<option value="${escapeHTML(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHTML(label)}</option>`;
  }).join('');
}

export function openStageDrawer(subId: string, nodeId: string): void {
  const sub = db.submissions.find((s: any) => s.id === subId);
  const node = sub?.timelineNodes?.find((n: any) => n.id === nodeId);
  if (!sub || !node) return;

  if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
    const activeChips = document.querySelectorAll(`.timeline-event-chip[data-sub-id="${subId}"][data-node-id="${nodeId}"], .dot.interactive-dot[data-sub-id="${subId}"][data-node-id="${nodeId}"]`);
    activeChips.forEach((chip: any) => chip.classList?.add?.('is-editing'));
    if (typeof registerModalCleanup === 'function') {
      registerModalCleanup(() => {
        activeChips.forEach((chip: any) => chip.classList?.remove?.('is-editing'));
      });
    }
  }

  const displayName = getTimelineNodeDisplayName(node);
  const eventDate = normalizeDateString(node.completeDate || node.planDate || (node.type !== 'review' ? node.dueDate : ''));
  const deadlineDate = normalizeDateString(node.dueDate || (inferKey(node) === 'r1_comments' ? sub.revisionDueDate : ''));
  const reviewDecision = node.reviewDecision || sub.reviewDecision || '';
  const typeOptions = [
    { value: 'research', label: t('eventTypeResearch') },
    { value: 'writing', label: t('eventTypeWriting') },
    { value: 'submission', label: t('eventTypeSubmission') },
    { value: 'review', label: t('eventTypeReview') },
    { value: 'revision', label: t('eventTypeRevision') },
    { value: 'rejection', label: t('statusRejected') },
    { value: 'publication', label: t('eventTypePublication') },
    { value: 'special', label: t('specialException') }
  ];
  const statusOptions = [
    { value: 'pending', label: t('statusPlannedNotStarted') },
    { value: 'active', label: t('statusInProgress') },
    { value: 'completed', label: t('statusCompleted') },
    { value: 'blocked', label: t('statusBlockedException') }
  ];
  const keyOptions = [
    { value: 'auto', label: t('keyAuto') },
    { value: 'experiment_start', label: t('keyExperimentsStarted') },
    { value: 'experiment_done', label: t('keyExperimentsDone') },
    { value: 'draft_done', label: t('keyDraftDone') },
    { value: 'submit', label: t('keySubmitted') },
    { value: 'r1_comments', label: t('keyR1Comments') },
    { value: 'r1_revised', label: t('keyR1Resubmitted') },
    { value: 'r2_comments', label: t('keyR2Comments') },
    { value: 'r2_revised', label: t('keyR2Resubmitted') },
    { value: 'accept', label: t('keyAccepted') },
    { value: 'online', label: t('keyOnlinePublished') },
    { value: 'rejected', label: t('statusRejected') }
  ];

  openModal(`
    <div class="modal-header">
      <h2>${t('editTimelineEvent')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="${escapeHTML(t('close'))}">✕</button>
    </div>

    <div class="form-group">
      <label>${t('eventName')}</label>
      <input type="text" id="drawer-name" value="${escapeHTML(displayName)}">
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div class="form-group">
        <label>${t('type')}</label>
        <select id="drawer-type">
          ${buildOptions(typeOptions, node.type)}
        </select>
      </div>
      <div class="form-group">
        <label>${t('status')}</label>
        <select id="drawer-status">
          ${buildOptions(statusOptions, node.status === 'danger' ? 'blocked' : node.status)}
        </select>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
      <div class="form-group">
        <label>${t('keyEventMapping')}</label>
        <select id="drawer-key">
          ${buildOptions(keyOptions, node.key || 'auto')}
        </select>
      </div>
      <div class="form-group">
        <label>${t('eventDate')}</label>
        <input type="date" id="drawer-date" value="${eventDate}">
      </div>
      <div class="form-group">
        <label>${t('eventDeadline')}</label>
        <input type="date" id="drawer-deadline" value="${deadlineDate}">
      </div>
    </div>

    <div class="form-group">
      <label>${t('reviewDecision')}</label>
      <select id="drawer-decision">
        ${buildOptions([
          { value: '', label: t('noReviewDecision') },
          { value: 'major', label: t('majorRevision') },
          { value: 'minor', label: t('minorRevision') }
        ], reviewDecision)}
      </select>
    </div>

    <div class="text-muted" style="font-size:11px; margin:-4px 0 12px;">
      ${t('eventDateHelp')}
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">
      <button class="btn-secondary btn-sm" id="quick-plan-today" type="button">${t('setToday')}</button>
      <button class="btn-secondary btn-sm" id="quick-due-14" type="button">${t('due14')}</button>
      <button class="btn-secondary btn-sm" id="quick-active" type="button">${t('markActive')}</button>
      <button class="btn-secondary btn-sm" id="quick-done-today" type="button">${t('markDoneToday')}</button>
      <button class="btn-secondary btn-sm" id="quick-clear-dates" type="button">${t('clearDate')}</button>
    </div>

    <div class="form-group">
      <label>${t('notes')}</label>
      <textarea id="drawer-notes" rows="3" placeholder="${escapeHTML(t('notesPlaceholder'))}">${escapeHTML(node.notes || '')}</textarea>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:16px;">
      <button class="btn-danger" id="btn-delete-stage" type="button" style="width:auto; padding:8px 14px;">${t('delete')}</button>
      <button class="btn-primary" id="btn-save-stage" type="button" style="flex:1; margin-top:0;">${t('saveChanges')}</button>
    </div>
  `);

  const modalScope = acquireModalScope();

  modalScope.on(document.getElementById('quick-plan-today'), 'click', () => {
    (document.getElementById('drawer-date') as HTMLInputElement).value = todayString();
  });
  modalScope.on(document.getElementById('quick-due-14'), 'click', () => {
    const base = (document.getElementById('drawer-date') as HTMLInputElement).value || todayString();
    (document.getElementById('drawer-deadline') as HTMLInputElement).value = addDays(base, 14);
    (document.getElementById('drawer-type') as HTMLSelectElement).value = 'review';
    (document.getElementById('drawer-status') as HTMLSelectElement).value = 'active';
  });
  modalScope.on(document.getElementById('quick-active'), 'click', () => {
    (document.getElementById('drawer-status') as HTMLSelectElement).value = 'active';
  });
  modalScope.on(document.getElementById('quick-done-today'), 'click', () => {
    (document.getElementById('drawer-date') as HTMLInputElement).value = todayString();
    (document.getElementById('drawer-status') as HTMLSelectElement).value = 'completed';
  });
  modalScope.on(document.getElementById('quick-clear-dates'), 'click', () => {
    (document.getElementById('drawer-date') as HTMLInputElement).value = '';
    (document.getElementById('drawer-deadline') as HTMLInputElement).value = '';
  });

  modalScope.on(document.getElementById('btn-save-stage'), 'click', async () => {
    const latestSub = db.submissions.find((s: any) => s.id === subId);
    const latestNode = latestSub?.timelineNodes?.find((n: any) => n.id === nodeId);
    if (!latestSub || !latestNode) {
      showGlobalToast(t('eventNotFound'), 'error');
      closeModal();
      renderDashboard();
      return;
    }

    const name = (document.getElementById('drawer-name') as HTMLInputElement).value.trim();
    if (!name) {
      alert(t('eventNameRequired'));
      return;
    }
    const nextType = (document.getElementById('drawer-type') as HTMLSelectElement).value;
    const nextStatus = (document.getElementById('drawer-status') as HTMLSelectElement).value;
    const nextKey = (document.getElementById('drawer-key') as HTMLSelectElement).value;
    const selectedDate = (document.getElementById('drawer-date') as HTMLInputElement).value;
    const selectedDeadline = normalizeDateString((document.getElementById('drawer-deadline') as HTMLInputElement)?.value || '');
    const selectedDecision = (document.getElementById('drawer-decision') as HTMLSelectElement)?.value || '';
    const isReview = nextType === 'review' || nextKey === 'r1_comments' || nextKey === 'r2_comments';
    if (isReview && !selectedDeadline && !selectedDecision) {
      alert(t('reviewDeadlineOrDecisionRequired'));
      document.getElementById('drawer-deadline')?.focus();
      return;
    }

    latestNode.name = name;
    latestNode.type = nextType;
    latestNode.status = nextStatus;
    latestNode.key = nextKey;
    latestNode.planDate = nextStatus === 'pending' ? selectedDate : '';
    latestNode.dueDate = isReview ? selectedDeadline : (nextStatus === 'active' || nextStatus === 'blocked' ? (selectedDeadline || selectedDate) : '');
    latestNode.completeDate = isReview ? selectedDate : (nextStatus === 'completed' ? selectedDate : '');
    latestNode.reviewDecision = isReview ? selectedDecision : '';
    latestNode.notes = (document.getElementById('drawer-notes') as HTMLTextAreaElement).value.trim();
    latestNode.updatedAt = new Date().toISOString();

    const mappedKey = inferKey(latestNode);
    if (selectedDate) {
      applyInlineEventToSubmission(latestSub, mappedKey, selectedDate, latestNode.notes);
    }
    if (isReview) {
      latestSub.revisionDueDate = selectedDeadline ? dateInputToIso(selectedDeadline) : null;
      latestSub.reviewDecision = selectedDecision;
    }

    normalizeSubmissionTimeline(latestSub);
    syncManuscriptStatusFromSubmission(latestSub);
    await window.storage.saveAll(db);
    closeModal();
    renderDashboard();
    renderKanban();
    renderSubmissions();
    showGlobalToast(tf('eventSavedToast', { name: getTimelineNodeDisplayName(latestNode) }), 'success');
  });

  modalScope.on(document.getElementById('btn-delete-stage'), 'click', async () => {
    const latestSub = db.submissions.find((s: any) => s.id === subId);
    const latestNode = latestSub?.timelineNodes?.find((n: any) => n.id === nodeId);
    if (!latestSub || !latestNode) {
      showGlobalToast(t('eventNotFound'), 'error');
      closeModal();
      renderDashboard();
      return;
    }
    if (!confirm(tf('confirmDeleteEvent', { name: getTimelineNodeDisplayName(latestNode) }))) return;
    deleteTimelineNode(latestSub, nodeId);
    syncManuscriptStatusFromSubmission(latestSub);
    await window.storage.saveAll(db);
    closeModal();
    renderDashboard();
    renderKanban();
    renderSubmissions();
    showGlobalToast(t('eventRemovedToast'), 'success');
  });
}

import {
  buildTimelineEventManager,
  openTimelineEventManager,
  deleteTimelineNode
} from './event-manager.js';

export {
  buildTimelineEventManager,
  openTimelineEventManager,
  deleteTimelineNode
};
