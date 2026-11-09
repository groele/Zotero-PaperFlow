declare var db: any;
declare var modalContent: HTMLElement;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function escapeHTML(value: any): string;
declare function openModal(html: string): void;
declare function closeModal(): void;
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

export function buildTimelineEventManager(sub: any, { inModal = false } = {}): string {
  const sortedNodes = autoSortNodes(sub.timelineNodes || []);
  if (sortedNodes.length === 0) return '';

  const items = sortedNodes.map((node: any) => {
    const computedStatus = computeNodeStatus(node);
    const dateStr = getNodeDate(node);
    const shortDate = dateStr ? formatShortDate(dateStr) : t('noDate');
    const dueSummary = node.dueDate ? ` · ${t('deadlineShort')} ${formatShortDate(node.dueDate)}` : '';
    const decisionSummary = node.reviewDecision
      ? ` · ${node.reviewDecision === 'major' ? t('majorRevision') : t('minorRevision')}`
      : '';
    const dateSummary = `${shortDate}${dueSummary}${decisionSummary}`;
    const typeClass = `type-${node.type || 'research'}`;

    return `
      <div class="timeline-event-chip status-${computedStatus} ${typeClass}" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}">
        <button class="timeline-event-main btn-event-edit" type="button" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}" title="${escapeHTML(t('clickEditEvent'))}">
          <span class="timeline-event-dot"></span>
          <span class="timeline-event-text">
            <strong>${escapeHTML(getTimelineNodeDisplayName(node))}</strong>
            <small>${escapeHTML(dateSummary)} · ${escapeHTML(getNodeStatusLabel(computedStatus))}</small>
          </span>
        </button>
        <button class="timeline-event-delete btn-event-delete" type="button" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}" title="${escapeHTML(t('delete'))}">×</button>
      </div>
    `;
  }).join('');

  return `
    <div class="timeline-event-manager ${inModal ? 'modal-event-manager' : ''}">
      <div class="timeline-event-manager-head">${t('timelineEvents')}</div>
      <div class="timeline-event-list">${items}</div>
    </div>
  `;
}

export function openTimelineEventManager(subId: string): void {
  const sub = db.submissions.find((s: any) => s.id === subId);
  if (!sub) {
    showGlobalToast(t('submissionNotFound'), 'error');
    return;
  }

  openModal(`
    <div class="modal-header">
      <h2>${t('timelineEvents')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="${escapeHTML(t('close'))}">✕</button>
    </div>
    ${buildTimelineEventManager(sub, { inModal: true }) || `<p class="empty-state">${t('noEventYet')}</p>`}
    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-footer-close-events">${escapeHTML(t('close') || '关闭')}</button>
    </div>
  `);

  document.getElementById('btn-footer-close-events')?.addEventListener('click', closeModal);

  modalContent.querySelectorAll('.btn-event-edit').forEach((btn: any) => {
    btn.addEventListener('click', () => {
      closeModal();
      openStageDrawer(btn.getAttribute('data-sub-id'), btn.getAttribute('data-node-id'));
    });
  });

  modalContent.querySelectorAll('.btn-event-delete').forEach((btn: any) => {
    btn.addEventListener('click', async () => {
      const latestSub = db.submissions.find((s: any) => s.id === btn.getAttribute('data-sub-id'));
      const nodeId = btn.getAttribute('data-node-id');
      const node = latestSub?.timelineNodes?.find((n: any) => n.id === nodeId);
      if (!latestSub || !node) {
        showGlobalToast(t('eventNotFound'), 'error');
        closeModal();
        renderDashboard();
        return;
      }
      if (!confirm(tf('confirmDeleteEvent', { name: getTimelineNodeDisplayName(node) }))) return;
      deleteTimelineNode(latestSub, nodeId);
      syncManuscriptStatusFromSubmission(latestSub);
      const w = window as any;
      await w.storage.saveAll(db);
      closeModal();
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
