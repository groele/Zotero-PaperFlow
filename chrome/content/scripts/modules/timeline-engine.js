/**
 * Zotero PaperFlow - Timeline Engine & Date Utilities Module
 * Manages timeline nodes, date diffs, cycle time analysis, and stage normalization.
 */
function getTimelineTypeMeta(type) {
  const meta = typeMeta[type] || typeMeta.special;
  return { ...meta, label: t(meta.labelKey || 'eventTypeSpecial') };
}

const defaultTimelineNameKeys = {
  'Experiments Started': 'defaultExperimentsStarted',
  '实验开始': 'defaultExperimentsStarted',
  'Experiments Completed': 'defaultExperimentsCompleted',
  '实验完成': 'defaultExperimentsCompleted',
  'Data Organization': 'defaultDataOrganization',
  '数据整理': 'defaultDataOrganization',
  'Draft Completed': 'defaultDraftCompleted',
  '初稿完成': 'defaultDraftCompleted',
  'Manuscript Submitted': 'defaultManuscriptSubmitted',
  '手稿已投稿': 'defaultManuscriptSubmitted',
  'Review Comments R1': 'defaultReviewCommentsR1',
  '收到 R1 审稿意见': 'defaultReviewCommentsR1',
  'R1 Revision Submitted': 'defaultR1RevisionSubmitted',
  'R1 修回已提交': 'defaultR1RevisionSubmitted',
  'Review Comments R2': 'defaultReviewCommentsR2',
  '收到 R2 审稿意见': 'defaultReviewCommentsR2',
  'R2 Revision Submitted': 'defaultR2RevisionSubmitted',
  'R2 修回已提交': 'defaultR2RevisionSubmitted',
  'Accepted': 'defaultAccepted',
  '已接收': 'defaultAccepted',
  'Online Publication': 'defaultOnlinePublication',
  '上线发表': 'defaultOnlinePublication',
  'Proof': 'defaultProof',
  '校样': 'defaultProof'
};

function getTimelineNodeDisplayName(node) {
  const rawName = (node?.name || '').trim();
  if (!rawName) return t('untitledEvent');
  const defaultKey = defaultTimelineNameKeys[rawName];
  return defaultKey ? t(defaultKey) : rawName;
}

function getDaysDiff(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return null;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  if (isNaN(d1) || isNaN(d2)) return null;

  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.max(0, Math.round((utc2 - utc1) / 86400000));
}

function getRelativeDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const today = new Date();
  const utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((utcToday - utcDate) / 86400000);

  if (diff === 0) return t('relativeToday');
  if (diff > 0) return tf('relativeDaysAgo', { count: diff });
  return tf('relativeInDays', { count: Math.abs(diff) });
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateString(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function dateInputToIso(value) {
  const normalized = normalizeDateString(value);
  return normalized ? `${normalized}T12:00:00.000Z` : null;
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeLatex(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%#_{}])/g, '\\$1')
    .replace(/\$/g, '\\$')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\n/g, '\\\\ ');
}

function getNodeDate(node) {
  return node?.completeDate || node?.planDate || node?.dueDate || '';
}

function getLatestTimelineNode(nodes = []) {
  const datedNodes = nodes
    .filter(getNodeDate)
    .sort((a, b) => new Date(getNodeDate(b)) - new Date(getNodeDate(a)));

  if (datedNodes.length) return datedNodes[0];

  return [...nodes].reverse().find(node =>
    node.status === 'active' ||
    node.status === 'completed' ||
    node.status === 'blocked' ||
    node.status === 'danger'
  ) || nodes[0] || null;
}

function createTimelineNode(subId, values = {}) {
  const now = new Date().toISOString();
  return {
    id: `node_${subId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: (values.name || t('untitledEvent')).trim(),
    type: values.type || 'research',
    key: values.key || 'auto',
    status: values.status || 'pending',
    planDate: values.planDate || '',
    dueDate: values.dueDate || '',
    completeDate: values.completeDate || '',
    notes: values.notes || '',
    createdAt: now,
    updatedAt: now
  };
}

function buildTimelineEventManager(sub, options = {}) {
  const nodes = autoSortNodes(sub.timelineNodes || []);
  if (!nodes.length) return '';
  const inModal = options.inModal === true;

  const items = nodes.map(node => {
    const computedStatus = computeNodeStatus(node);
    const meta = getTimelineTypeMeta(node.type);
    const date = getNodeDate(node);
    return `
      <div class="timeline-event-chip ${inModal ? 'modal-event-chip' : ''}" data-node-id="${escapeHTML(node.id)}" style="--event-color:${meta.color}">
        <button class="timeline-event-main btn-event-edit" type="button" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}" title="${escapeHTML(t('clickEditEvent'))}">
          <span class="timeline-event-dot"></span>
          <span class="timeline-event-text">
            <strong>${escapeHTML(getTimelineNodeDisplayName(node))}</strong>
            <small>${date ? escapeHTML(formatShortDate(date)) : t('noDate')} · ${escapeHTML(getNodeStatusLabel(computedStatus))}</small>
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

function openTimelineEventManager(subId) {
  const sub = db.submissions.find(s => s.id === subId);
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

  modalContent.querySelectorAll('.btn-event-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal();
      openStageDrawer(btn.getAttribute('data-sub-id'), btn.getAttribute('data-node-id'));
    });
  });

  modalContent.querySelectorAll('.btn-event-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const latestSub = db.submissions.find(s => s.id === btn.getAttribute('data-sub-id'));
      const nodeId = btn.getAttribute('data-node-id');
      const node = latestSub?.timelineNodes?.find(n => n.id === nodeId);
      if (!latestSub || !node) {
        showGlobalToast(t('eventNotFound'), 'error');
        closeModal();
        renderDashboard();
        return;
      }
      if (!confirm(tf('confirmDeleteEvent', { name: getTimelineNodeDisplayName(node) }))) return;
      deleteTimelineNode(latestSub, nodeId);
      syncManuscriptStatusFromSubmission(latestSub);
      await window.storage.saveAll(db);
      closeModal();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      showGlobalToast(t('eventRemovedToast'), 'success');
    });
  });
}

function deleteTimelineNode(sub, nodeId) {
  if (!sub || !Array.isArray(sub.timelineNodes)) return null;
  const node = sub.timelineNodes.find(n => n.id === nodeId);
  if (!node) return null;
  const key = inferKey(node);

  sub.timelineNodes = sub.timelineNodes.filter(n => n.id !== nodeId);

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

function buildOptions(options, selectedValue) {
  return options.map(option => {
    const value = typeof option === 'string' ? option : option.value;
    const label = typeof option === 'string' ? option : option.label;
    return `<option value="${escapeHTML(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHTML(label)}</option>`;
  }).join('');
}

function getInlineEventPresets() {
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

function getInlineEventPreset(key) {
  return getInlineEventPresets().find(preset => preset.key === key) || getInlineEventPresets()[0];
}

function buildInlineStageEditor(subId) {
  const keyOptions = getInlineEventPresets().map(preset => ({ value: preset.key, label: preset.label }));
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
        <button class="btn-secondary btn-sm btn-inline-stage-cancel" type="button">${t('cancel')}</button>
      </div>
      <div class="inline-stage-fields" role="group" aria-label="${escapeHTML(t('inlineAddTimelineEvent'))}">
        <select class="inline-stage-key" aria-label="${escapeHTML(t('keyEventPreset'))}" title="${escapeHTML(t('keyEventPreset'))}">${buildOptions(keyOptions, 'submit')}</select>
        <input type="text" class="inline-stage-name" aria-label="${escapeHTML(t('eventName'))}" value="${escapeHTML(t('defaultManuscriptSubmitted'))}" placeholder="${escapeHTML(t('eventPlaceholder'))}" maxlength="160">
        <input type="date" class="inline-stage-date" aria-label="${escapeHTML(t('eventDate'))}" value="${todayString()}">
        <select class="inline-stage-type" aria-label="${escapeHTML(t('eventTypeSpecial'))}">${buildOptions(typeOptions, 'submission')}</select>
        <input type="text" class="inline-stage-notes" aria-label="${escapeHTML(t('eventNotesShort'))}" placeholder="${escapeHTML(t('eventNotesShort'))}" maxlength="500">
        <button class="btn-primary btn-sm btn-inline-stage-save" type="button">${t('addEvent').replace('+ ', '')}</button><span class="inline-stage-status" data-inline-stage-status role="status" aria-live="polite"></span>
      </div>
    </div>
  `;
}

function toggleInlineStageEditor(card, shouldOpen = null) {
  const editor = card?.querySelector('.inline-stage-editor');
  if (!editor) return;
  if (shouldOpen !== false) setPipelineViewMode(true);
  editor.hidden = shouldOpen === null ? !editor.hidden : !shouldOpen;
  if (!editor.hidden) {
    syncInlineStagePreset(editor);
    const nameInput = editor.querySelector('.inline-stage-name');
    if (nameInput) nameInput.focus();
  }
}

function syncInlineStagePreset(editor) {
  const keySelect = editor.querySelector('.inline-stage-key');
  const nameInput = editor.querySelector('.inline-stage-name');
  const typeSelect = editor.querySelector('.inline-stage-type');
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
}

function applyInlineEventToSubmission(sub, key, eventDate, note = '') {
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

function setInlineStageBusy(editor, busy, message = '') {
  const button = editor?.querySelector('.btn-inline-stage-save');
  const status = editor?.querySelector('[data-inline-stage-status]');
  if (button) {
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
  }
  if (status) status.textContent = message;
}

async function saveInlineStageEvent(editor) {
  const subId = editor.getAttribute('data-sub-id');
  const sub = db.submissions.find(s => s.id === subId);
  if (!sub) {
    showGlobalToast(t('submissionNotFound'), 'error');
    renderDashboard();
    return;
  }

  const selectedKey = editor.querySelector('.inline-stage-key')?.value || 'custom';
  const preset = getInlineEventPreset(selectedKey);
  const name = editor.querySelector('.inline-stage-name').value.trim() || preset.name;
  const eventDate = editor.querySelector('.inline-stage-date').value || todayString();
  const type = editor.querySelector('.inline-stage-type').value;
  const notes = editor.querySelector('.inline-stage-notes')?.value.trim() || '';

  if (!name) {
    alert(t('eventNameRequired'));
    editor.querySelector('.inline-stage-name').focus();
    return;
  }

  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
  let node = null;
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
      dueDate: '',
      completeDate: eventDate,
      notes
    };

    if (node) {
      Object.assign(node, nodeValues, { updatedAt: new Date().toISOString() });
    } else {
      node = createTimelineNode(subId, nodeValues);
      sub.timelineNodes.push(node);
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

function inferKey(node) {
  if (node.key && node.key !== 'auto') return node.key;
  const t = `${node.name || ''} ${node.notes || ''}`.toLowerCase();
  if (/reject|rejected|decline|declined|拒稿|拒绝|退稿/.test(t) || node.type === 'rejection') return 'rejected';
  if (/online|publication|published|见刊|上线/.test(t) || node.type === 'publication' && t.includes('online')) return 'online';
  if (/accept|accepted|接收|录用/.test(t) || node.type === 'publication' && t.includes('accept')) return 'accept';
  if (/r2|second/.test(t) && (/submit|revis|修回|resubmitted/.test(t) || node.type === 'revision')) return 'r2_revised';
  if (/r2|second/.test(t) && (/comment|decision|review|意见|returned/.test(t) || node.type === 'review')) return 'r2_comments';
  if (/r1|first/.test(t) && (/submit|revis|修回|resubmitted/.test(t) || node.type === 'revision')) return 'r1_revised';
  if (/r1|first|comment|decision|审稿意见|一审|returned/.test(t) || node.type === 'review' || node.type === 'revision') return 'r1_comments';
  if (/submit|submission|submitted|投稿/.test(t) || node.type === 'submission') return 'submit';
  if (/draft|manuscript|completed|finished|手稿/.test(t) || node.type === 'writing') return 'draft_done';
  if (/experiment\s*(start|started|begin|began)|start(ed)?\s*(experiment|research)|实验(开始|启动)|研究开始/.test(t)) return 'experiment_start';
  if (/experiment|data|complete|completed|实验|数据/.test(t) || node.type === 'research') return 'experiment_done';
  return 'auto';
}

function getTimelineNodeByKey(sub, key) {
  return (sub.timelineNodes || []).find(node => node.key === key || inferKey(node) === key) || null;
}

function setTimelineNodeDate(node, date, field = 'completeDate') {
  if (!node || !date) return false;
  let changed = false;
  ['planDate', 'dueDate', 'completeDate'].forEach(dateField => {
    const next = dateField === field ? date : '';
    if ((node[dateField] || '') !== next) {
      node[dateField] = next;
      changed = true;
    }
  });
  return changed;
}

function createCanonicalTimelineNode(subId, key, name, type, status = 'pending') {
  return createTimelineNode(subId, { key, name, type, status });
}

function ensureTimelineNode(sub, key, name, type, status = 'pending') {
  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
  let node = getTimelineNodeByKey(sub, key);
  if (!node) {
    node = createCanonicalTimelineNode(sub.id, key, name, type, status);
    sub.timelineNodes.push(node);
    return { node, changed: true };
  }

  let changed = false;
  if (node.key !== key) {
    node.key = key;
    changed = true;
  }
  if (!node.type || node.type === 'special') {
    node.type = type;
    changed = true;
  }
  return { node, changed };
}

function initializeSubmissionTimelineNodes(sub) {
  const submitDate = normalizeDateString(sub.submissionDate);
  const firstDecisionDate = normalizeDateString(sub.firstDecisionDate);
  const revisionDueDate = normalizeDateString(sub.revisionDueDate);
  const decisionDate = normalizeDateString(sub.decisionDate);
  const linkedMan = db?.manuscripts?.find(m => m.id === sub?.manuscriptId);
  const isAcceptedOrPublished = hasPublicationStatus(sub) ||
    Boolean(linkedMan && (hasPublicationStatus(linkedMan) || linkedMan.status === 'accepted' || linkedMan.status === 'published'));
  const isPublished = sub?.status === 'published' || Boolean(linkedMan && linkedMan.status === 'published');

  sub.timelineNodes = [
    createTimelineNode(sub.id, { key: 'experiment_start', name: 'Experiments Started', type: 'research', status: 'completed' }),
    createTimelineNode(sub.id, { key: 'experiment_done', name: 'Experiments Completed', type: 'research', status: 'completed' }),
    createTimelineNode(sub.id, { key: 'draft_done', name: 'Draft Completed', type: 'writing', status: (submitDate || isAcceptedOrPublished) ? 'completed' : 'pending' }),
    createTimelineNode(sub.id, {
      key: 'submit',
      name: 'Manuscript Submitted',
      type: 'submission',
      status: (submitDate || isAcceptedOrPublished) ? 'completed' : 'pending',
      completeDate: submitDate
    }),
    createTimelineNode(sub.id, {
      key: 'r1_comments',
      name: 'Review Comments R1',
      type: 'review',
      status: (firstDecisionDate || isAcceptedOrPublished) ? 'completed' : (revisionDueDate ? 'active' : 'pending'),
      completeDate: firstDecisionDate,
      dueDate: (firstDecisionDate || isAcceptedOrPublished) ? '' : revisionDueDate
    }),
    createTimelineNode(sub.id, { key: 'r1_revised', name: 'R1 Revision Submitted', type: 'revision', status: isAcceptedOrPublished ? 'completed' : 'pending' }),
    createTimelineNode(sub.id, {
      key: 'accept',
      name: 'Accepted',
      type: 'publication',
      status: isAcceptedOrPublished ? 'completed' : 'pending',
      completeDate: decisionDate && isAcceptedOrPublished ? decisionDate : (isAcceptedOrPublished ? (sub.acceptedAt || '') : '')
    }),
    createTimelineNode(sub.id, {
      key: 'online',
      name: 'Online Publication',
      type: 'publication',
      status: isPublished ? 'completed' : 'pending',
      completeDate: isPublished ? (sub.publishedAt || decisionDate || '') : ''
    })
  ];
}

function syncSubmissionFieldsFromTimeline(sub) {
  if (!sub || !Array.isArray(sub.timelineNodes)) return false;
  let changed = false;
  const submitNode = getTimelineNodeByKey(sub, 'submit');
  const submitNodeDate = normalizeDateString(getNodeDate(submitNode));
  if (submitNodeDate && normalizeDateString(sub.submissionDate) !== submitNodeDate) {
    sub.submissionDate = dateInputToIso(submitNodeDate);
    changed = true;
  }

  const r1Node = getTimelineNodeByKey(sub, 'r1_comments');
  const r1Date = normalizeDateString(r1Node?.completeDate || '');
  if (r1Date && normalizeDateString(sub.firstDecisionDate) !== r1Date) {
    sub.firstDecisionDate = dateInputToIso(r1Date);
    changed = true;
  }

  const acceptNode = getTimelineNodeByKey(sub, 'accept') || getTimelineNodeByKey(sub, 'online');
  const acceptDate = normalizeDateString(acceptNode?.completeDate || '');
  if (acceptDate && normalizeDateString(sub.decisionDate) !== acceptDate) {
    sub.decisionDate = dateInputToIso(acceptDate);
    changed = true;
  }

  return changed;
}

function normalizeSubmissionTimeline(sub) {
  if (!sub) return false;
  let changed = false;
  if (!Array.isArray(sub.timelineNodes) || sub.timelineNodes.length === 0) {
    initializeSubmissionTimelineNodes(sub);
    changed = true;
  }

  const linkedMan = db?.manuscripts?.find(m => m.id === sub.manuscriptId);
  const isAcceptedOrPublished = hasPublicationStatus(sub) ||
    Boolean(normalizeDateString(sub.decisionDate || sub.acceptedAt)) ||
    Boolean(getTimelineNodeByKey(sub, 'accept')?.completeDate) ||
    Boolean(linkedMan && (hasPublicationStatus(linkedMan) || linkedMan.status === 'accepted' || linkedMan.status === 'published'));
  const isPublished = sub.status === 'published' || Boolean(linkedMan && linkedMan.status === 'published');

  // If the linked manuscript is accepted or published, keep current submission status in sync
  if (linkedMan && (linkedMan.status === 'accepted' || linkedMan.status === 'published') && sub.status !== linkedMan.status) {
    const currentForMan = window.RFCore?.getCurrentSubmission(db, linkedMan.id);
    if (!currentForMan || currentForMan.id === sub.id) {
      sub.status = linkedMan.status;
      changed = true;
    }
  }

  const submitDate = normalizeDateString(sub.submissionDate);
  if (submitDate) {
    const result = ensureTimelineNode(sub, 'submit', 'Manuscript Submitted', 'submission', 'completed');
    changed = result.changed || changed;
    changed = setTimelineNodeDate(result.node, submitDate, 'completeDate') || changed;
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }
  } else {
    changed = syncSubmissionFieldsFromTimeline(sub) || changed;
  }

  const firstDecisionDate = normalizeDateString(sub.firstDecisionDate);
  if (firstDecisionDate) {
    const result = ensureTimelineNode(sub, 'r1_comments', 'Review Comments R1', 'review', 'completed');
    changed = result.changed || changed;
    changed = setTimelineNodeDate(result.node, firstDecisionDate, 'completeDate') || changed;
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }
  }

  const revisionDueDate = normalizeDateString(sub.revisionDueDate);
  if (revisionDueDate && !firstDecisionDate && !isAcceptedOrPublished) {
    const result = ensureTimelineNode(sub, 'r1_comments', 'Review Comments R1', 'review', 'active');
    changed = result.changed || changed;
    if ((result.node.dueDate || '') !== revisionDueDate) {
      result.node.dueDate = revisionDueDate;
      changed = true;
    }
    if (result.node.status === 'pending') {
      result.node.status = 'active';
      changed = true;
    }
  }

  const decisionDate = normalizeDateString(sub.decisionDate || sub.acceptedAt);
  if (isAcceptedOrPublished) {
    // 1. Ensure accept node exists and is completed
    const result = ensureTimelineNode(sub, 'accept', 'Accepted', 'publication', 'completed');
    changed = result.changed || changed;
    if (decisionDate) {
      changed = setTimelineNodeDate(result.node, decisionDate, 'completeDate') || changed;
    }
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }

    // 2. Mark ALL pre-acceptance timeline nodes as completed
    (sub.timelineNodes || []).forEach(node => {
      const key = node.key || inferKey(node);
      const isPreAcceptance = node.type === 'research' ||
        node.type === 'writing' ||
        node.type === 'submission' ||
        node.type === 'review' ||
        node.type === 'revision' ||
        key === 'submit' ||
        key === 'r1_comments' ||
        key === 'r1_revised' ||
        key === 'r2_comments' ||
        key === 'r2_revised' ||
        key === 'draft_done' ||
        key === 'experiment_done' ||
        key === 'experiment_start';

      if (isPreAcceptance && node.status !== 'completed') {
        node.status = 'completed';
        changed = true;
      }
    });
  }

  if (isPublished) {
    const onlineDate = normalizeDateString(sub.publishedAt || getTimelineNodeByKey(sub, 'online')?.completeDate || sub.decisionDate);
    const result = ensureTimelineNode(sub, 'online', 'Online Publication', 'publication', 'completed');
    changed = result.changed || changed;
    if (onlineDate) {
      changed = setTimelineNodeDate(result.node, onlineDate, 'completeDate') || changed;
    }
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }
  }

  if (changed) sub.updatedAt = new Date().toISOString();
  return changed;
}

function analyzeSubmission(sub) {
  normalizeSubmissionTimeline(sub);
  const events = [...(sub.timelineNodes || [])].sort((a, b) => {
    const da = a.completeDate || a.planDate || a.dueDate || a.createdAt || '';
    const db = b.completeDate || b.planDate || b.dueDate || b.createdAt || '';
    return new Date(da) - new Date(db);
  });

  const getKeyEventDate = (key) => {
    const node = events.find(e => inferKey(e) === key);
    const nodeDate = node ? normalizeDateString(window.RFUI.getTimelineEventDate(node, key)) : null;
    if (key === 'submit') return normalizeDateString(sub.submissionDate) || nodeDate;
    if (key === 'r1_comments') return normalizeDateString(sub.firstDecisionDate) || nodeDate;
    if (key === 'accept' || key === 'online') {
      return normalizeDateString(sub.decisionDate) && hasPublicationStatus(sub)
        ? normalizeDateString(sub.decisionDate)
        : nodeDate;
    }
    return nodeDate;
  };

  const datedResearchEvent = events.find(e => e.type === 'research' && getNodeDate(e));
  const experimentStartDate = getKeyEventDate('experiment_start');
  const experimentDate = getKeyEventDate('experiment_done') || (datedResearchEvent ? getNodeDate(datedResearchEvent) : null);
  const submitDate = getKeyEventDate('submit');
  const submitNode = events.find(e => inferKey(e) === 'submit');
  const submitDateSource = normalizeDateString(sub.submissionDate)
    ? t('dateSourceSubmission')
    : (normalizeDateString(getNodeDate(submitNode)) ? t('dateSourceTimeline') : t('dateSourceMissing'));
  const r1Date = getKeyEventDate('r1_comments');
  const acceptDate = getKeyEventDate('accept');
  const onlineDate = getKeyEventDate('online');

  const latest = getLatestTimelineNode(sub.timelineNodes || []);
  const accepted = Boolean(acceptDate) || hasPublicationStatus(sub);

  const expToSubmit = experimentDate && submitDate ? getDaysDiff(experimentDate, submitDate) : null;
  const submitToNow = submitDate && !accepted ? getDaysDiff(submitDate, todayString()) : null;
  const r1ToNow = r1Date && !accepted ? getDaysDiff(r1Date, todayString()) : null;
  const submitToAccept = submitDate && acceptDate ? getDaysDiff(submitDate, acceptDate) : null;
  const acceptToOnline = acceptDate && onlineDate ? getDaysDiff(acceptDate, onlineDate) : null;

  let display = {
    mode: "prepare",
    label: t('displayPrepareLabel'),
    value: expToSubmit,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    caption: t('displayPrepareCaption'),
    pending: false,
    milestones: [
      { name: t('milestoneExperimentStart'), date: experimentStartDate, color: '#0891b2', emphasis: true, node: events.find(e => inferKey(e) === 'experiment_start') },
      { name: t('milestoneExperimentDone'), date: experimentDate, color: "#2563eb", emphasis: true, node: events.find(e => inferKey(e) === 'experiment_done') },
      { name: t('milestoneSubmission'), date: submitDate, color: "#f97316", emphasis: true, node: events.find(e => inferKey(e) === 'submit') }
    ]
  };

  if (accepted) {
    display = {
      mode: "accepted",
      label: t('displayAcceptedLabel'),
      value: submitToAccept,
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      caption: t('displayAcceptedCaption'),
      pending: false,
      milestones: [
        { name: t('milestoneSubmission'), date: submitDate, color: "#f97316", emphasis: true, node: events.find(e => inferKey(e) === 'submit') },
        { name: t('milestoneAcceptance'), date: acceptDate, color: "#16a34a", emphasis: true, node: events.find(e => inferKey(e) === 'accept') }
      ]
    };
  } else if (r1Date) {
    display = {
      mode: "r1-active",
      label: t('displayR1Label'),
      value: r1ToNow,
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
      caption: t('displayR1Caption'),
      pending: true,
      milestones: [
        { name: t('milestoneSubmission'), date: submitDate, color: "#f97316", emphasis: false, node: events.find(e => inferKey(e) === 'submit') },
        { name: t('milestoneR1Comments'), date: r1Date, color: "#dc2626", emphasis: true, node: events.find(e => inferKey(e) === 'r1_comments') },
        { name: t('milestoneToday'), date: todayString(), color: "#dc2626", emphasis: true, today: true }
      ]
    };
  } else if (submitDate) {
    display = {
      mode: "under-review",
      label: t('displayReviewLabel'),
      value: submitToNow,
      color: "#f97316",
      bg: "#fff7ed",
      border: "#fed7aa",
      caption: t('displayReviewCaption'),
      pending: true,
      milestones: [
        { name: t('milestoneSubmission'), date: submitDate, color: "#f97316", emphasis: true, node: events.find(e => inferKey(e) === 'submit') },
        { name: t('milestoneToday'), date: todayString(), color: "#f97316", emphasis: true, today: true }
      ]
    };
  }

  // Adjust display theme variables based on prefers-color-scheme dynamically
  const isDarkMode = isDarkThemeActive();
  if (isDarkMode) {
    if (display.mode === 'prepare') {
      display.bg = 'rgba(37,99,235,0.08)';
      display.border = 'rgba(37,99,235,0.3)';
    } else if (display.mode === 'accepted') {
      display.bg = 'rgba(22,163,74,0.08)';
      display.border = 'rgba(22,163,74,0.3)';
    } else if (display.mode === 'r1-active') {
      display.bg = 'rgba(220,38,38,0.08)';
      display.border = 'rgba(220,38,38,0.3)';
    } else if (display.mode === 'under-review') {
      display.bg = 'rgba(249,115,22,0.08)';
      display.border = 'rgba(249,115,22,0.3)';
    }
  }

  // The editable submission status is the source of truth. Timeline dates add
  // context, but must never promote a submitted record to "under review".
  const explicitStatus = normalizeSubmissionStatus(sub.status || 'submitted');
  const statusPresentation = {
    submitted: { label: t('stateSubmitted'), color: '#64748b' },
    under_review: { label: t('stateUnderReview'), color: '#0891b2' },
    revision: { label: getSubmissionStatusLabel('revision'), color: '#d97706' },
    accepted: { label: t('stateAccepted'), color: '#16a34a' },
    published: { label: t('stateOnline'), color: '#15803d' },
    rejected: { label: getSubmissionStatusLabel('rejected'), color: '#dc2626' }
  }[explicitStatus] || { label: t('statePreparing'), color: '#64748b' };
  let stateLabel = statusPresentation.label;
  let stateColor = statusPresentation.color;
  let stateNote = submitDate ? tf('stateSinceSubmit', { count: submitToNow ?? "—" }) : t('stateNotSubmitted');
  if (explicitStatus === 'revision' && r1Date) stateNote = tf('stateSinceR1', { count: r1ToNow ?? "—" });
  if (explicitStatus === 'accepted' && acceptDate) stateNote = formatShortDate(acceptDate);
  if (explicitStatus === 'published' && onlineDate) stateNote = formatShortDate(onlineDate);

  return { events, experimentStartDate, experimentDate, submitDate, submitDateSource, r1Date, acceptDate, onlineDate, latest, accepted, expToSubmit, submitToNow, r1ToNow, submitToAccept, acceptToOnline, display, stateLabel, stateColor, stateNote };
}

function isAcceptedSubmission(sub) {
  return Boolean(sub && analyzeSubmission(sub).accepted);
}

function hasPublicationStatus(sub) {
  const status = normalizeSubmissionStatus(sub?.status);
  return status === 'accepted' || status === 'published';
}

function canHavePublicationLink(sub) {
  if (!sub) return false;
  if (hasPublicationStatus(sub)) return true;
  if (normalizeDateString(sub.acceptedAt || sub.publishedAt)) return true;
  return isAcceptedSubmission(sub);
}

function clearPublicationLinkFields(sub) {
  if (!sub) return false;
  let changed = false;
  ['doi', 'DOI', 'articleDoi', 'articleUrl', 'publicationUrl', 'journalArticleUrl'].forEach(field => {
    if (sub[field]) {
      sub[field] = null;
      changed = true;
    }
  });
  return changed;
}

function clearPublicationTimelineCompletion(sub) {
  if (!sub || !Array.isArray(sub.timelineNodes)) return false;
  let changed = false;
  sub.timelineNodes.forEach(node => {
    if (inferKey(node) !== 'accept' && inferKey(node) !== 'online') return;
    if (node.completeDate) {
      node.completeDate = '';
      changed = true;
    }
    if (node.status === 'completed') {
      node.status = 'pending';
      changed = true;
    }
  });
  return changed;
}

function clearUnacceptedPublicationLinks(database) {
  if (!database || !Array.isArray(database.submissions)) return false;
  let changed = false;
  database.submissions.forEach(sub => {
    if (!canHavePublicationLink(sub)) {
      changed = clearPublicationLinkFields(sub) || changed;
    }
  });
  return changed;
}


function getSubmissionCycleTime(sub) {
  const start = sub.submissionDate ? new Date(sub.submissionDate) : (sub.createdAt ? new Date(sub.createdAt) : new Date());

  const isCompleted = sub.status === 'accepted' || sub.status === 'published';
  let end = new Date();

  if (isCompleted) {
    if (sub.decisionDate) {
      end = new Date(sub.decisionDate);
    } else {
      // Fallback: look for completed milestone nodes like '接收', 'Online'
      const completionNode = sub.timelineNodes?.find(n => {
        if (!n.name || !n.completeDate) return false;
        const nodeName = n.name.toLowerCase();
        return n.name.includes('接收') || nodeName.includes('accept') || nodeName.includes('online');
      });
      if (completionNode) {
        end = new Date(completionNode.completeDate);
      } else if (sub.updatedAt) {
        end = new Date(sub.updatedAt);
      }
    }
  }

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    days: diffDays,
    isCompleted: isCompleted,
    startDateStr: start.toLocaleDateString(),
    endDateStr: end.toLocaleDateString()
  };
}

function computeNodeStatus(node) {
  if (node.completeDate || node.status === 'completed') return 'completed';
  if (node.status === 'danger' || node.status === 'blocked') return 'blocked';

  if (node.dueDate) {
    const dueTime = new Date(node.dueDate).getTime();
    const now = new Date(); now.setHours(0,0,0,0);
    const diffDays = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'due_soon';
  }

  if (node.status === 'active') return 'in_progress';
  if (node.status === 'pending') return 'not_started';
  return 'upcoming';
}

function getNodeStatusLabel(status) {
  const keyMap = {
    completed: 'statusCompleted',
    blocked: 'statusBlocked',
    overdue: 'statusOverdue',
    due_soon: 'statusDueSoon',
    in_progress: 'statusInProgress',
    not_started: 'statusPlannedNotStarted',
    upcoming: 'statusUpcoming'
  };
  return t(keyMap[status] || 'statusUpcoming');
}

function autoSortNodes(nodes) {
  return [...nodes].sort((a, b) => {
    const getDate = (n) => n.completeDate || n.planDate || n.dueDate || n.createdAt || '';
    const da = getDate(a);
    const db = getDate(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return new Date(da) - new Date(db);
  });
}

function getCapsuleIcon(status, type) {
  if (status === 'completed') return '✓';
  if (status === 'blocked') return '✕';
  if (status === 'overdue') return '🔴';
  if (status === 'due_soon') return '⚠';
  if (status === 'in_progress') return '●';
  if (status === 'not_started' || status === 'upcoming') return '◯';
  if (status === 'milestone') return '⭐';
  return '◯';
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const locale = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
    return d.toLocaleDateString(locale, currentLanguage === 'zh'
      ? { month: 'numeric', day: 'numeric' }
      : { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}


