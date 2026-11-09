/**
 * Zotero PaperFlow - Inline Timeline Stage Editor & Quick Event Presets
 */
import { buildOptions } from './drawer-and-manager.js';

declare var db: any;
declare var defaultTimelineNameKeys: Record<string, string>;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function escapeHTML(value: any): string;
declare function todayString(): string;
declare function normalizeDateString(dateStr: any): string;
declare function dateInputToIso(dateStr: string): string | null;
declare function formatShortDate(dateStr: any): string;
declare function getRevisionCountdownMeta(dueDate: any): any;
declare function setPipelineViewMode(expanded: boolean): void;
declare function hasPublicationStatus(sub: any): boolean;
declare function markSubmissionRejected(sub: any, rejectionDate?: string, note?: string): void;
declare function getTimelineNodeByKey(sub: any, key: string): any;
declare function getTimelineNodeDisplayName(node: any): string;
declare function createTimelineNode(subId: string, values?: any): any;
declare function normalizeSubmissionTimeline(sub: any): boolean;
declare function syncManuscriptStatusFromSubmission(sub: any): boolean;
declare function renderDashboard(): void;
declare function renderKanban(): void;
declare function renderSubmissions(): void;
declare function showGlobalToast(message: string, type?: string): void;

export function getInlineEventPresets(): Array<{ key: string; label: string; name: string; type: string }> {
  return [
    { key: 'submit', label: t('defaultManuscriptSubmitted'), name: 'Manuscript Submitted', type: 'submission' },
    { key: 'r1_comments', label: t('defaultReviewCommentsR1'), name: 'Review Comments R1', type: 'review' },
    { key: 'r1_revised', label: t('defaultR1RevisionSubmitted'), name: 'R1 Revision Submitted', type: 'revision' },
    { key: 'r2_comments', label: t('defaultReviewCommentsR2'), name: 'Review Comments R2', type: 'review' },
    { key: 'r2_revised', label: t('defaultR2RevisionSubmitted'), name: 'R2 Revision Submitted', type: 'revision' },
    { key: 'accept', label: t('defaultAccepted'), name: 'Accepted', type: 'publication' },
    { key: 'online', label: t('defaultOnlinePublication'), name: 'Online Publication', type: 'publication' },
    { key: 'rejected', label: t('statusRejected'), name: 'Rejected', type: 'rejection' },
    { key: 'experiment_start', label: t('defaultExperimentsStarted'), name: 'Experiments Started', type: 'research' },
    { key: 'experiment_done', label: t('defaultExperimentsCompleted'), name: 'Experiments Completed', type: 'research' },
    { key: 'draft_done', label: t('defaultDraftCompleted'), name: 'Draft Completed', type: 'writing' },
    { key: 'custom', label: t('customEvent'), name: '', type: 'review' }
  ];
}

export function getInlineEventPreset(key: string): { key: string; label: string; name: string; type: string } {
  return getInlineEventPresets().find((preset) => preset.key === key) || getInlineEventPresets()[0];
}

export function buildInlineStageEditor(subId: string): string {
  const keyOptions = getInlineEventPresets().map((preset) => ({ value: preset.key, label: preset.label }));
  const typeOptions = [
    { value: 'research', label: t('eventTypeResearch') },
    { value: 'writing', label: t('eventTypeWriting') },
    { value: 'submission', label: t('eventTypeSubmission') },
    { value: 'review', label: t('eventTypeReview') },
    { value: 'revision', label: t('eventTypeRevision') },
    { value: 'rejection', label: t('statusRejected') },
    { value: 'publication', label: t('eventTypePublication') },
    { value: 'special', label: t('eventTypeSpecial') }
  ];

  return `
    <div class="inline-stage-editor" data-sub-id="${escapeHTML(subId)}" hidden>
      <div class="inline-stage-head">
        <span class="inline-stage-title"><span class="inline-stage-title-mark" aria-hidden="true">+</span>${t('inlineAddTimelineEvent')}</span>
        <span class="inline-stage-hint">${escapeHTML(t('inlineEventHint'))}</span>
      </div>
      <div class="inline-stage-fields" role="group" aria-label="${escapeHTML(t('inlineAddTimelineEvent'))}">
        <div class="inline-stage-section inline-stage-section-main">
          <div class="inline-stage-section-label">${escapeHTML(t('eventDetails'))}</div>
          <div class="inline-stage-main-grid">
            <label class="inline-stage-field inline-stage-field-preset"><span>${escapeHTML(t('keyEventPreset'))}</span><select class="inline-stage-key" aria-label="${escapeHTML(t('keyEventPreset'))}" title="${escapeHTML(t('keyEventPreset'))}">${buildOptions(keyOptions, 'submit')}</select></label>
            <label class="inline-stage-field inline-stage-field-name"><span>${escapeHTML(t('eventName'))}</span><input type="text" class="inline-stage-name" aria-label="${escapeHTML(t('eventName'))}" value="${escapeHTML(t('defaultManuscriptSubmitted'))}" placeholder="${escapeHTML(t('eventPlaceholder'))}" maxlength="160"></label>
            <label class="inline-stage-field inline-stage-field-type"><span>${escapeHTML(t('inlineEventType'))}</span><select class="inline-stage-type" aria-label="${escapeHTML(t('inlineEventType'))}">${buildOptions(typeOptions, 'submission')}</select></label>
          </div>
        </div>
        <div class="inline-stage-section inline-stage-section-dates">
          <div class="inline-stage-section-label">${escapeHTML(t('eventSchedule'))}</div>
          <div class="inline-stage-date-grid">
            <label class="inline-stage-field inline-stage-date-field"><span>${escapeHTML(t('eventDate'))}</span><input type="date" class="inline-stage-date" aria-label="${escapeHTML(t('eventDate'))}" value="${todayString()}"></label>
            <label class="inline-stage-field inline-stage-deadline-field"><span>${escapeHTML(t('eventDeadline'))}</span><input type="date" class="inline-stage-deadline" aria-label="${escapeHTML(t('eventDeadline'))}" title="${escapeHTML(t('eventDeadline'))}"></label>
            <label class="inline-stage-field inline-stage-decision-field"><span>${escapeHTML(t('reviewDecision'))}</span><select class="inline-stage-decision" aria-label="${escapeHTML(t('reviewDecision'))}" title="${escapeHTML(t('reviewDecision'))}">${buildOptions([
              { value: '', label: t('noReviewDecision') },
              { value: 'major', label: t('majorRevision') },
              { value: 'minor', label: t('minorRevision') }
            ], '')}</select></label>
          </div>
        </div>
        <label class="inline-stage-field inline-stage-notes-field"><span>${escapeHTML(t('eventNotesShort'))} <span class="inline-stage-optional">· ${escapeHTML(t('optional'))}</span></span><input type="text" class="inline-stage-notes" aria-label="${escapeHTML(t('eventNotesShort'))}" placeholder="${escapeHTML(t('inlineEventNotesPlaceholder'))}" maxlength="500"></label>
        <div class="inline-stage-actions"><button class="btn-secondary btn-sm btn-inline-stage-cancel" type="button">${escapeHTML(t('cancel'))}</button><button class="btn-secondary btn-sm btn-inline-stage-reset" type="button">${escapeHTML(t('reset'))}</button><button class="btn-primary btn-sm btn-inline-stage-save" type="button">${escapeHTML(t('inlineEventAdd'))}</button></div>
      </div>
      <div class="inline-stage-footer"><span class="inline-stage-status-dot" data-inline-stage-status-dot aria-hidden="true"></span><span class="inline-stage-status" data-inline-stage-status role="status" aria-live="polite"></span><span class="inline-stage-context" data-inline-stage-context></span></div>
    </div>
  `;
}

export function toggleInlineStageEditor(card: any, shouldOpen: boolean | null = null): void {
  const editor = card?.querySelector('.inline-stage-editor');
  if (!editor) return;
  if (shouldOpen !== false && typeof setPipelineViewMode === 'function') setPipelineViewMode(true);
  const nextHidden = shouldOpen === null ? !editor.hidden : !shouldOpen;
  editor.hidden = nextHidden;
  editor.classList?.toggle?.('is-open', !nextHidden);
  card?.classList?.toggle?.('has-open-stage-editor', !nextHidden);
  card?.querySelectorAll?.('.btn-inline-add-event').forEach((btn: any) => {
    btn.classList?.toggle?.('is-active', !nextHidden);
    btn.setAttribute?.('aria-expanded', !nextHidden ? 'true' : 'false');
  });
  if (!editor.hidden) {
    syncInlineStagePreset(editor);
    const nameInput = editor.querySelector('.inline-stage-name');
    if (nameInput) nameInput.focus();
  }
}

export function syncInlineStagePreset(editor: any): void {
  const keySelect = editor.querySelector('.inline-stage-key');
  const nameInput = editor.querySelector('.inline-stage-name');
  const typeSelect = editor.querySelector('.inline-stage-type');
  const deadlineInput = editor.querySelector('.inline-stage-deadline');
  const decisionSelect = editor.querySelector('.inline-stage-decision');
  const deadlineField = editor.querySelector('.inline-stage-deadline-field');
  const decisionField = editor.querySelector('.inline-stage-decision-field');
  if (!keySelect || !nameInput || !typeSelect) return;

  const preset = getInlineEventPreset(keySelect.value);
  if (preset.key !== 'custom') {
    nameInput.value = t(defaultTimelineNameKeys[preset.name] || '') || preset.label || preset.name;
    typeSelect.value = preset.type;
  } else if (nameInput.readOnly) {
    nameInput.value = '';
  }
  nameInput.readOnly = preset.key !== 'custom';
  typeSelect.disabled = preset.key !== 'custom';
  const isReview = typeSelect.value === 'review' || preset.key === 'r1_comments' || preset.key === 'r2_comments';
  editor.classList.toggle('is-review', isReview);
  if (deadlineField) deadlineField.hidden = !isReview;
  if (decisionField) decisionField.hidden = !isReview;
  if (deadlineInput) deadlineInput.hidden = false;
  if (decisionSelect) decisionSelect.hidden = false;
  updateInlineStageDeadlineStatus(editor);
}

export function updateInlineStageDeadlineStatus(editor: any): void {
  const status = editor?.querySelector('[data-inline-stage-status]');
  const dot = editor?.querySelector('[data-inline-stage-status-dot]');
  const context = editor?.querySelector('[data-inline-stage-context]');
  const deadline = normalizeDateString(editor?.querySelector('.inline-stage-deadline')?.value || '');
  const isReview = editor?.classList.contains('is-review');
  const presetLabel = editor?.querySelector('.inline-stage-key')?.selectedOptions?.[0]?.textContent || '';
  if (context) context.textContent = presetLabel;
  if (!status) return;

  let level = 'normal';
  if (!isReview) {
    status.textContent = t('ordinaryEventStatus');
  } else if (!deadline) {
    status.textContent = t('reviewDeadlinePrompt');
    level = 'pending';
  } else {
    const meta = getRevisionCountdownMeta(deadline);
    status.textContent = meta?.text || `${t('deadlineShort')} ${formatShortDate(deadline)}`;
    level = meta?.level || 'normal';
  }
  if (dot) dot.setAttribute('data-level', level);
}

export function resetInlineStageEditor(editor: any): void {
  if (editor?.querySelector('.btn-inline-stage-save')?.disabled) return;
  const keySelect = editor?.querySelector('.inline-stage-key');
  if (!keySelect) return;
  keySelect.value = 'submit';
  const dateInput = editor.querySelector('.inline-stage-date');
  const deadlineInput = editor.querySelector('.inline-stage-deadline');
  const decisionSelect = editor.querySelector('.inline-stage-decision');
  const notesInput = editor.querySelector('.inline-stage-notes');
  if (dateInput) dateInput.value = todayString();
  if (deadlineInput) deadlineInput.value = '';
  if (decisionSelect) decisionSelect.value = '';
  if (notesInput) notesInput.value = '';
  syncInlineStagePreset(editor);
  keySelect.focus();
}

export function applyInlineEventToSubmission(sub: any, key: string, eventDate: string, note = ''): void {
  const isoDate = dateInputToIso(eventDate);
  if (key === 'submit') {
    sub.submissionDate = isoDate;
  } else if (key === 'r1_comments' || key === 'r2_comments') {
    if (key === 'r1_comments') sub.firstDecisionDate = isoDate;
    if (!hasPublicationStatus(sub) && sub.status !== 'rejected') sub.status = 'revision';
  } else if (key === 'r1_revised' || key === 'r2_revised') {
    if (!hasPublicationStatus(sub) && sub.status !== 'rejected') sub.status = 'under_review';
  } else if (key === 'accept') {
    sub.decisionDate = isoDate;
    sub.acceptedAt = isoDate;
    if (sub.status !== 'published') sub.status = 'accepted';
  } else if (key === 'online') {
    sub.decisionDate = sub.decisionDate || isoDate;
    sub.status = 'published';
    sub.publishedAt = isoDate;
    sub.acceptedAt = sub.acceptedAt || sub.decisionDate;
  } else if (key === 'rejected') {
    markSubmissionRejected(sub, eventDate, note);
  }
}

export function setInlineStageBusy(editor: any, busy: boolean, message = ''): void {
  const button = editor?.querySelector('.btn-inline-stage-save');
  const resetButton = editor?.querySelector('.btn-inline-stage-reset');
  const cancelButton = editor?.querySelector('.btn-inline-stage-cancel');
  const status = editor?.querySelector('[data-inline-stage-status]');
  if (button) {
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
  }
  if (resetButton) resetButton.disabled = busy;
  if (cancelButton) cancelButton.disabled = busy;
  if (status && message) status.textContent = message;
  else if (!busy) updateInlineStageDeadlineStatus(editor);
}

export async function saveInlineStageEvent(editor: any): Promise<void> {
  const subId = editor.getAttribute('data-sub-id');
  const sub = db.submissions.find((s: any) => s.id === subId);
  if (!sub) {
    showGlobalToast(t('submissionNotFound'), 'error');
    renderDashboard();
    return;
  }

  const selectedKey = editor.querySelector('.inline-stage-key')?.value || 'custom';
  const preset = getInlineEventPreset(selectedKey);
  const name = editor.querySelector('.inline-stage-name').value.trim() || preset.name;
  const eventDate = editor.querySelector('.inline-stage-date').value || todayString();
  const deadline = normalizeDateString(editor.querySelector('.inline-stage-deadline')?.value || '');
  const reviewDecision = editor.querySelector('.inline-stage-decision')?.value || '';
  const type = editor.querySelector('.inline-stage-type').value;
  const notes = editor.querySelector('.inline-stage-notes')?.value.trim() || '';

  if (!name) {
    alert(t('eventNameRequired'));
    editor.querySelector('.inline-stage-name').focus();
    return;
  }
  const isReview = type === 'review' || selectedKey === 'r1_comments' || selectedKey === 'r2_comments';
  if (isReview && !deadline && !reviewDecision) {
    alert(t('reviewDeadlineOrDecisionRequired'));
    editor.querySelector('.inline-stage-deadline')?.focus();
    return;
  }

  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
  let node: any = null;
  const nodeKey = selectedKey === 'custom' ? 'auto' : selectedKey;

  if (selectedKey === 'rejected') {
    const existingRejected = getTimelineNodeByKey(sub, 'rejected');
    if (existingRejected && !confirm(tf('confirmUpdateEvent', { name: getTimelineNodeDisplayName(existingRejected) }))) {
      return;
    }
    markSubmissionRejected(sub, eventDate, notes);
    node = getTimelineNodeByKey(sub, 'rejected');
  } else {
    node = selectedKey === 'custom' ? null : getTimelineNodeByKey(sub, selectedKey);
    if (node && selectedKey !== 'custom' && node.completeDate) {
      const shouldUpdate = confirm(tf('confirmUpdateEvent', { name: getTimelineNodeDisplayName(node) }));
      if (!shouldUpdate) return;
    }
    const nodeValues = {
      key: nodeKey,
      name,
      type,
      status: 'completed',
      planDate: '',
      dueDate: isReview ? deadline : '',
      completeDate: eventDate,
      notes,
      reviewDecision: isReview ? reviewDecision : ''
    };

    if (node) {
      Object.assign(node, nodeValues, { updatedAt: new Date().toISOString() });
    } else {
      node = createTimelineNode(subId, nodeValues);
      sub.timelineNodes.push(node);
    }
    if (isReview) {
      sub.revisionDueDate = deadline ? dateInputToIso(deadline) : null;
      sub.reviewDecision = reviewDecision;
    }
    applyInlineEventToSubmission(sub, nodeKey, eventDate, notes);
  }

  normalizeSubmissionTimeline(sub);
  syncManuscriptStatusFromSubmission(sub);
  await window.storage.saveAll(db);
  renderDashboard();
  renderKanban();
  renderSubmissions();
  showGlobalToast(tf('eventAddedToast', { name: getTimelineNodeDisplayName(node) }), 'success');
}
