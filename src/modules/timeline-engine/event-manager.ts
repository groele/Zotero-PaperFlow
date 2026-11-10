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
declare function getNodeDate(node: any): string;
declare function formatShortDate(dateStr: any): string;
declare function computeNodeStatus(node: any): string;
declare function getNodeStatusLabel(status: string): string;
declare function autoSortNodes(nodes: any[]): any[];
declare function inferKey(node: any): string;
declare function getTimelineNodeByKey(sub: any, key: string): any;
declare function syncManuscriptStatusFromSubmission(sub: any): boolean;
declare function clearPublicationLinkFields(sub: any): boolean;
declare function clearPublicationTimelineCompletion(sub: any): boolean;
declare function openStageDrawer(subId: string, nodeId: string): void;
declare function getSubmissionJournalName(sub: any): string;
declare function activateWorkspaceView(viewId: string): void;
declare function toggleInlineStageEditor(card: any, shouldOpen?: boolean | null): void;
declare var typeMeta: Record<string, { labelKey: string; color: string }>;
declare function getTimelineTypeMeta(type: string): any;

export function buildTimelineEventManager(sub: any, { inModal = false } = {}): string {
  const sortedNodes = autoSortNodes(sub.timelineNodes || []);
  if (sortedNodes.length === 0) return '';

  const completedCount = sortedNodes.filter((n: any) => computeNodeStatus(n) === 'completed').length;
  const items = sortedNodes.map((node: any) => {
    const computedStatus = computeNodeStatus(node);
    const dateStr = getNodeDate(node);
    const shortDate = dateStr ? formatShortDate(dateStr) : t('noDate');
    const dueSummary = node.dueDate ? ` · ${t('deadlineShort')} ${formatShortDate(node.dueDate)}` : '';
    const decisionSummary = node.reviewDecision
      ? ` · ${node.reviewDecision === 'major' ? t('majorRevision') : t('minorRevision')}`
      : '';
    const dateSummary = `${shortDate}${dueSummary}${decisionSummary}`;
    const statusLabel = escapeHTML(getNodeStatusLabel(computedStatus));
    const fullDateSummary = inModal ? escapeHTML(dateSummary) : `${escapeHTML(dateSummary)} · ${statusLabel}`;
    const typeClass = `type-${node.type || 'research'}`;
    const noteText = String(node.notes || '').trim();
    const displayName = getTimelineNodeDisplayName(node);
    const key = (typeof inferKey === 'function' ? inferKey(node) : '') || node.key || '';
    const keyClass = key ? ` key-${key}` : '';

    let eventColor = '#2563eb';
    if (key === 'experiment_start') {
      eventColor = '#0891b2';
    } else if (key === 'experiment_done' || key === 'data_org' || node.type === 'research') {
      eventColor = '#2563eb';
    } else if (key === 'draft_done' || node.type === 'writing') {
      eventColor = '#7c3aed';
    } else if (key === 'submit' || node.type === 'submission') {
      eventColor = '#f97316';
    } else if (key === 'r1_comments' || key === 'r2_comments' || node.type === 'review') {
      eventColor = '#d97706';
    } else if (key === 'r1_revised' || key === 'r2_revised' || node.type === 'revision') {
      eventColor = '#dc2626';
    } else if (key === 'rejected' || node.type === 'rejection') {
      eventColor = '#b91c1c';
    } else if (key === 'accept' || (node.type === 'publication' && !key.includes('online'))) {
      eventColor = '#16a34a';
    } else if (key === 'online' || (node.type === 'publication' && key.includes('online'))) {
      eventColor = '#059669';
    } else {
      const meta = (typeof getTimelineTypeMeta === 'function' ? getTimelineTypeMeta(node.type) : null)
        || (typeof typeMeta !== 'undefined' && typeMeta ? (typeMeta[node.type] || typeMeta.special) : null);
      eventColor = meta?.color || '#2563eb';
    }

    return `
      <div class="timeline-event-chip timeline-event-card status-${computedStatus} ${typeClass}${keyClass}${inModal ? ' modal-event-chip' : ''}" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}" style="--event-color:${eventColor}">
        <button class="timeline-event-main btn-event-edit" type="button" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}" title="${escapeHTML(t('clickEditEvent'))}">
          <span class="timeline-event-dot" aria-hidden="true"></span>
          <span class="timeline-event-text">
            <span class="timeline-event-title-row">
              <strong>${escapeHTML(displayName)}</strong>
              <span class="timeline-event-status-badge status-${computedStatus}">${statusLabel}</span>
            </span>
            <small>${fullDateSummary}</small>
            ${noteText ? `<span class="timeline-event-note">${escapeHTML(noteText)}</span>` : ''}
          </span>
          ${inModal ? `<span class="timeline-event-edit-pill" aria-hidden="true">${escapeHTML(t('edit'))}</span>` : ''}
        </button>
        <button class="timeline-event-delete btn-event-delete" type="button" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}" title="${escapeHTML(t('delete'))}" aria-label="${escapeHTML(t('delete'))} ${escapeHTML(displayName)}">×</button>
      </div>
    `;
  }).join('');

  return `
    <div class="timeline-event-manager ${inModal ? 'modal-event-manager' : ''}">
      <div class="timeline-event-manager-head">
        <span>${escapeHTML(tf('eventsSummary', { total: sortedNodes.length, completed: completedCount }))}</span>
        ${inModal ? `<span class="timeline-event-manager-hint">${escapeHTML(t('clickCardToEditHint'))}</span>` : ''}
      </div>
      <div class="timeline-event-list">${items}</div>
    </div>
  `;
}

export function openTimelineEventManager(subId: string): void {
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  const database = g.db || (typeof db !== 'undefined' ? db : null) || { submissions: [], manuscripts: [] };
  const sub = (database.submissions || []).find((s: any) => s.id === subId);
  if (!sub) {
    showGlobalToast(t('submissionNotFound'), 'error');
    return;
  }

  const openModalFn = g.openModal || (typeof openModal === 'function' ? openModal : null);
  const closeModalFn = () => {
    const fn = g.closeModal || (typeof closeModal === 'function' ? closeModal : null);
    if (fn) fn();
  };

  if (!openModalFn) {
    showGlobalToast(t('submissionNotFound'), 'error');
    return;
  }

  const man = (database.manuscripts || []).find((m: any) => m.id === sub.manuscriptId);
  const manTitle = man?.title || sub.title || t('untitledManuscript');
  const journalName = typeof getSubmissionJournalName === 'function'
    ? getSubmissionJournalName(sub)
    : (sub.targetJournal || sub.journal || '');

  openModalFn(`
    <div class="modal-header event-manager-modal-header">
      <div class="event-manager-title-block">
        ${journalName ? `<span class="event-manager-journal-badge">${escapeHTML(journalName)}</span>` : ''}
        <h2>${escapeHTML(t('timelineEvents'))}</h2>
        <p class="event-manager-subtitle" title="${escapeHTML(manTitle)}">${escapeHTML(manTitle)}</p>
      </div>
      <div class="event-manager-header-actions">
        <button type="button" class="btn-primary btn-sm" id="btn-modal-add-event">${escapeHTML(t('addTimelineEvent'))}</button>
        <button type="button" class="btn-secondary btn-icon" id="btn-close-modal" title="${escapeHTML(t('close'))}">✕</button>
      </div>
    </div>
    <div class="event-manager-modal-body">
      ${buildTimelineEventManager(sub, { inModal: true }) || `<p class="empty-state event-manager-empty">${escapeHTML(t('noEventYet'))}</p>`}
    </div>
    <div class="modal-footer event-manager-modal-footer">
      <button type="button" class="btn-secondary" id="btn-footer-close-events">${escapeHTML(t('close') || '关闭')}</button>
    </div>
  `);

  const modalEl = document.getElementById('modal-body') || (typeof modalContent !== 'undefined' ? modalContent : null);
  modalEl?.classList?.add('event-manager-modal-card');
  const regCleanup = g.registerModalCleanup || (typeof registerModalCleanup === 'function' ? registerModalCleanup : null);
  if (regCleanup) regCleanup(() => modalEl?.classList?.remove('event-manager-modal-card'));

  document.getElementById('btn-footer-close-events')?.addEventListener('click', closeModalFn);
  document.getElementById('btn-modal-add-event')?.addEventListener('click', () => {
    closeModalFn();
    const dashboardView = document.getElementById('view-dashboard');
    const activateFn = g.activateWorkspaceView || (typeof activateWorkspaceView === 'function' ? activateWorkspaceView : null);
    if (dashboardView && !dashboardView.classList.contains('active') && activateFn) {
      activateFn('view-dashboard');
    }
    const findCard = () => document.querySelector(`.inline-stage-editor[data-sub-id="${sub.id}"]`)?.closest('.pipeline-card') as HTMLElement | null;
    let card = findCard();
    if (!card && g.currentDashboardFilter && g.currentDashboardFilter !== 'all') {
      g.currentDashboardFilter = 'all';
      if (typeof renderDashboard === 'function') renderDashboard();
      else if (typeof g.renderDashboard === 'function') g.renderDashboard();
      card = findCard();
    }
    const toggleFn = g.toggleInlineStageEditor || (typeof toggleInlineStageEditor === 'function' ? toggleInlineStageEditor : null);
    if (card && toggleFn) {
      toggleFn(card, true);
      const targetEl = card.querySelector(`.inline-stage-editor[data-sub-id="${sub.id}"]`) || card;
      (targetEl as HTMLElement)?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }
  });

  modalEl?.querySelectorAll('.btn-event-edit').forEach((btn: any) => {
    btn.addEventListener('click', () => {
      closeModalFn();
      const drawerFn = g.openStageDrawer || (typeof openStageDrawer === 'function' ? openStageDrawer : null);
      if (drawerFn) drawerFn(btn.getAttribute('data-sub-id'), btn.getAttribute('data-node-id'));
    });
  });

  modalEl?.querySelectorAll('.btn-event-delete').forEach((btn: any) => {
    btn.addEventListener('click', async () => {
      const latestDb = g.db || (typeof db !== 'undefined' ? db : null) || database;
      const latestSub = (latestDb.submissions || []).find((s: any) => s.id === btn.getAttribute('data-sub-id'));
      const nodeId = btn.getAttribute('data-node-id');
      const node = latestSub?.timelineNodes?.find((n: any) => n.id === nodeId);
      if (!latestSub || !node) {
        showGlobalToast(t('eventNotFound'), 'error');
        closeModalFn();
        renderDashboard();
        return;
      }
      if (!confirm(tf('confirmDeleteEvent', { name: getTimelineNodeDisplayName(node) }))) return;
      deleteTimelineNode(latestSub, nodeId);
      syncManuscriptStatusFromSubmission(latestSub);
      await g.storage?.saveAll?.(latestDb);
      closeModalFn();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      showGlobalToast(t('eventRemovedToast'), 'success');
    });
  });
}

export function deleteTimelineNode(sub: any, nodeId: string): any | null {
  if (!sub || !Array.isArray(sub.timelineNodes)) return null;
  const node = sub.timelineNodes.find((n: any) => n.id === nodeId);
  if (!node) return null;
  const key = inferKey(node);

  sub.timelineNodes = sub.timelineNodes.filter((n: any) => n.id !== nodeId);

  if (key === 'submit') {
    sub.submissionDate = null;
    if (sub.status === 'submitted') sub.status = 'under_review';
  } else if (key === 'r1_comments') {
    sub.firstDecisionDate = null;
    sub.revisionDueDate = null;
    if (sub.status === 'revision') sub.status = 'under_review';
  } else if (key === 'accept' || key === 'online') {
    sub.decisionDate = null;
    sub.acceptedAt = null;
    sub.publishedAt = null;
    if (sub.status === 'accepted' || sub.status === 'published') {
      sub.status = getTimelineNodeByKey(sub, 'r1_comments') ? 'revision' : 'under_review';
    }
    clearPublicationLinkFields(sub);
    clearPublicationTimelineCompletion(sub);
  } else if (key === 'rejected') {
    sub.rejectedAt = null;
    sub.rejectionNote = '';
    if (sub.status === 'rejected') {
      sub.status = getTimelineNodeByKey(sub, 'r1_comments') ? 'revision' : 'under_review';
    }
  }

  sub.updatedAt = new Date().toISOString();
  return node;
}
