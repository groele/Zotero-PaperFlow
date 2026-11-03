/**
 * Zotero PaperFlow - Submissions & Peer Review View Module
 * Manages submission tables, peer review matrix editor, reviewer checklist, and round history.
 */
function focusSubmissionEditCenter() {
  const detailPanel = document.getElementById('submission-detail-panel');
  const editCenter = detailPanel?.querySelector('#submission-entry-editor-panel');
  const titleInput = editCenter?.querySelector('#sub-edit-title');
  if (!detailPanel || !editCenter) return;

  const panelRect = detailPanel.getBoundingClientRect();
  const editorRect = editCenter.getBoundingClientRect();
  const targetTop = Math.max(detailPanel.scrollTop + editorRect.top - panelRect.top - 12, 0);
  if (typeof detailPanel.scrollTo === 'function') {
    detailPanel.scrollTo({ top: targetTop, behavior: 'smooth' });
  } else {
    detailPanel.scrollTop = targetTop;
  }

  editCenter.classList.remove('submission-edit-center-focused');
  void editCenter.offsetWidth;
  editCenter.classList.add('submission-edit-center-focused');
  window.setTimeout(() => editCenter.classList.remove('submission-edit-center-focused'), 2400);

  if (titleInput) {
    window.requestAnimationFrame(() => {
      try {
        titleInput.focus({ preventScroll: true });
      } catch (error) {
        titleInput.focus();
      }
      titleInput.select();
    });
  }
}

function canLeaveSubmissionEditor() {
  const editor = document.getElementById('submission-entry-editor-panel');
  const state = editor?.querySelector('[data-submission-autosave-status]')?.dataset.state;
  if (!editor || !['pending', 'invalid', 'error'].includes(state)) return true;
  const plan = window.RFUI.buildSubmissionEditSyncPlan(getSubmissionEditValues('sub-edit'));
  if (plan.ok) return true;
  showGlobalToast(plan.error, 'error');
  document.getElementById('sub-edit-title')?.focus();
  return false;
}

function openSubmissionForEditing(sub, options = {}) {
  if (!canLeaveSubmissionEditor()) return;
  submissionAutoSaveCleanup?.();
  selectedSubmissionId = sub.id;
  renderSubmissions();
  renderSubmissionDetails(sub);
  if (options.focusEditCenter) {
    requestAnimationFrame(focusSubmissionEditCenter);
  }
}

function navigateToSubmissionDetails(submissionId) {
  const submission = db.submissions.find(item => item.id === submissionId);
  if (!submission) {
    showGlobalToast(t('submissionNotFound'), 'error');
    return;
  }
  const submissionView = document.getElementById('view-submissions');
  if (!submissionView.classList.contains('active')) {
    document.querySelector('.nav-item[data-view="view-submissions"]')?.click();
  }
  if (!submissionView.classList.contains('active')) return;
  openSubmissionForEditing(submission);
  document.getElementById('submission-detail-panel')?.scrollTo({ top: 0 });
}

function getDefaultSubmissionChecklistKeys() {
  return [
    { key: 'cover_letter_ready', label: 'Cover Letter drafted' },
    { key: 'title_page_ready', label: 'Title page formatted' },
    { key: 'data_availability_statement', label: 'Data Availability statement' },
    { key: 'author_contribution', label: 'CRedIT Author statements' },
    { key: 'figure_resolution_checked', label: 'High-res figures checked' },
    { key: 'conflict_of_interest', label: 'Conflict of Interest statement' }
  ];
}

function getSubmissionChecklistKeys(sub) {
  return Array.isArray(sub?.complianceChecklistKeys) && sub.complianceChecklistKeys.length > 0
    ? sub.complianceChecklistKeys
    : getDefaultSubmissionChecklistKeys();
}

function getSubmissionReviewMatrixRows(sub) {
  if (Array.isArray(sub?.reviewMatrix)) return sub.reviewMatrix;
  if (Array.isArray(sub?.rebuttalMatrix)) return sub.rebuttalMatrix;
  return [];
}

function collectSubmissionChecklistFromEditor() {
  const compliance = {};
  document.querySelectorAll('#sub-edit-compliance-checklist-container [data-checklist-key]').forEach(input => {
    compliance[input.dataset.checklistKey] = input.checked;
  });
  return compliance;
}

function collectSubmissionChecklistKeysFromEditor() {
  return Array.from(document.querySelectorAll('#sub-edit-compliance-checklist-container [data-checklist-key]')).map(input => ({
    key: input.dataset.checklistKey,
    label: input.dataset.checklistLabel || input.dataset.checklistKey
  }));
}

function collectSubmissionReviewMatrixFromEditor() {
  return Array.from(document.querySelectorAll('#sub-edit-review-matrix-container .submission-edit-review-row')).map((row, index) => {
    const response = row.querySelector('.sub-edit-review-response')?.value || '';
    const statusSelect = row.querySelector('.sub-edit-review-status');
    const status = statusSelect ? statusSelect.value : (response.trim() ? 'addressed' : 'pending');
    return {
      id: row.dataset.reviewId || `rev_${Date.now()}_${index}`,
      reviewer: row.querySelector('.sub-edit-review-reviewer')?.value?.trim() || '',
      comment: row.querySelector('.sub-edit-review-comment')?.value || '',
      response,
      changes: row.querySelector('.sub-edit-review-changes')?.value?.trim() || '',
      status,
      recordId: row.dataset.recordId || ''
    };
  });
}

function createSubmissionReviewEditorRow(row = {}, index = 0) {
  const safeId = String(row.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const rowDiv = document.createElement('div');
  rowDiv.className = 'submission-edit-review-row';
  rowDiv.dataset.reviewId = safeId;
  rowDiv.dataset.recordId = row.recordId || '';
  const reviewerVal = escapeHTML(row.reviewer || '');
  const changesVal = escapeHTML(row.changes || '');
  const statusVal = row.status || (row.response && row.response.trim() ? 'addressed' : 'pending');
  window.RFUI.setHTML(rowDiv, `
    <div class="submission-edit-review-field">
      <div class="submission-edit-review-label-row">
        <div class="submission-edit-review-label">${escapeHTML(tf('reviewerCommentLabel', { count: index + 1 }))}</div>
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="font-size:11px; color:var(--text-secondary);">${escapeHTML(t('reviewerFieldLabel') || '审稿人')}:</span>
          <input type="text" class="sub-edit-review-reviewer" value="${reviewerVal}" placeholder="Reviewer #1..." style="font-size:11px; padding:2px 8px; width:100px; border-radius:4px; border:1px solid var(--input-border); background:var(--input-bg); color:hsl(var(--text-primary));">
          <select class="sub-edit-review-status" aria-label="Status" style="font-size:11px; padding:2px 6px; border-radius:4px; border:1px solid var(--input-border); background:var(--input-bg); color:hsl(var(--text-primary));">
            <option value="addressed" ${statusVal === 'addressed' ? 'selected' : ''}>${escapeHTML(t('statusAddressed') || '已解决')}</option>
            <option value="in_progress" ${statusVal === 'in_progress' ? 'selected' : ''}>${escapeHTML(t('statusInProgress') || '处理中')}</option>
            <option value="pending" ${statusVal === 'pending' ? 'selected' : ''}>${escapeHTML(t('statusPending') || '待处理')}</option>
            <option value="clarified" ${statusVal === 'clarified' ? 'selected' : ''}>${escapeHTML(t('statusClarified') || '辩明 (无改动)')}</option>
          </select>
        </div>
      </div>
      <textarea class="sub-edit-review-comment" placeholder="${escapeHTML(t('reviewerCommentPlaceholder'))}">${escapeHTML(row.comment || '')}</textarea>
      <div class="submission-edit-review-actions" style="display:flex; align-items:center; gap:4px;">
        <button type="button" class="btn-secondary btn-icon btn-move-review-up" title="${escapeHTML(t('moveCommentUp') || '上移')}" style="padding:2px 4px; font-size:10px; height:24px; min-width:24px;">▲</button>
        <button type="button" class="btn-secondary btn-icon btn-move-review-down" title="${escapeHTML(t('moveCommentDown') || '下移')}" style="padding:2px 4px; font-size:10px; height:24px; min-width:24px;">▼</button>
        <button type="button" class="btn-secondary btn-icon btn-copy-full-item" title="${escapeHTML(t('copyFullCommentItem') || '复制完整问答条目')}" style="padding:2px 4px; font-size:10px; height:24px; min-width:24px;">📋</button>
        <button type="button" class="btn-danger btn-icon btn-delete-review-row" title="${escapeHTML(t('removeComment'))}" style="height:24px; min-width:24px;">
          <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="submission-edit-review-field">
      <div class="submission-edit-review-label-row">
        <div class="submission-edit-review-label">${escapeHTML(t('authorResponseLabel'))}</div>
        <button type="button" class="btn-secondary btn-copy-review-response">
          <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>${escapeHTML(t('copy'))}</span>
        </button>
      </div>
      <textarea class="sub-edit-review-response" placeholder="${escapeHTML(t('authorResponsePlaceholder'))}">${escapeHTML(row.response || '')}</textarea>
      <div class="sub-edit-review-changes-wrap" style="margin-top:6px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
          <span style="font-size:11px; font-weight:600; color:var(--accent-blue, #0284c7);">📝 ${escapeHTML(t('changesFieldLabel') || '手稿修订说明与位置')}</span>
        </div>
        <input type="text" class="sub-edit-review-changes" value="${changesVal}" placeholder="${escapeHTML(t('changesPlaceholder') || '例如: Page 4, Lines 120-135; 已补充表 S2')}" style="width:100%; box-sizing:border-box; font-size:12px; padding:4px 8px; border-radius:4px; border:1px solid var(--input-border); background:var(--input-bg); color:hsl(var(--text-primary));">
      </div>
    </div>
  `);
  return rowDiv;
}

function reindexSubmissionReviewEditorRows(container) {
  container.querySelectorAll('.submission-edit-review-row').forEach((row, index) => {
    const label = row.querySelector('.submission-edit-review-label');
    if (label) label.textContent = tf('reviewerCommentLabel', { count: index + 1 });
  });
}

function renderSubmissionChecklistEditor(sub, checklistKeys) {
  const checklistBox = document.getElementById('sub-edit-compliance-checklist-container');
  if (!checklistBox) return;
  const compliance = sub.complianceChecklist && typeof sub.complianceChecklist === 'object' && !Array.isArray(sub.complianceChecklist)
    ? sub.complianceChecklist
    : {};
  window.RFUI.setHTML(checklistBox, '');
  checklistKeys.forEach(chk => {
    const label = document.createElement('label');
    label.className = 'submission-edit-check-item';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = compliance[chk.key] === true;
    input.dataset.checklistKey = chk.key;
    input.dataset.checklistLabel = chk.label;

    label.appendChild(input);
    label.appendChild(document.createTextNode(chk.label));
    checklistBox.appendChild(label);
  });
}

function renderSubmissionReviewMatrixEditor(sub, manAbstract) {
  const reviewBox = document.getElementById('sub-edit-review-matrix-container');
  const addButton = document.getElementById('btn-add-review-comment');
  const batchImportBtn = document.getElementById('btn-batch-import-reviews');
  const progressBox = document.getElementById('sub-edit-rebuttal-progress-container');
  if (!reviewBox) return;

  const updateProgress = () => {
    if (progressBox) {
      const currentRows = collectSubmissionReviewMatrixFromEditor();
      window.RFUI.setHTML(progressBox, renderRebuttalProgressTracker({ reviewMatrix: currentRows }));
    }
  };

  const rows = getSubmissionReviewMatrixRows(sub);
  window.RFUI.setHTML(reviewBox, '');
  if (rows.length === 0) {
    window.RFUI.setHTML(reviewBox, `<p class="empty-state">${escapeHTML(t('emptyReviewEditor'))}</p>`);
  } else {
    rows.forEach((row, index) => {
      reviewBox.appendChild(createSubmissionReviewEditorRow(row, index));
    });
  }
  updateProgress();

  if (batchImportBtn) {
    batchImportBtn.onclick = () => {
      openBatchReviewImportModal(sub, reviewBox, updateProgress);
    };
  }

  if (addButton) {
    addButton.onclick = () => {
      const empty = reviewBox.querySelector('.empty-state');
      if (empty) window.RFUI.setHTML(reviewBox, '');
      reviewBox.appendChild(createSubmissionReviewEditorRow({ comment: '', response: '', recordId: '' }, reviewBox.querySelectorAll('.submission-edit-review-row').length));
      updateProgress();
      reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', {
        bubbles: true,
        detail: { immediate: true }
      }));
    };
  }

  reviewBox.addEventListener('click', async event => {
    const upBtn = event.target.closest('.btn-move-review-up');
    if (upBtn) {
      const row = upBtn.closest('.submission-edit-review-row');
      const prev = row?.previousElementSibling;
      if (prev && prev.classList.contains('submission-edit-review-row')) {
        reviewBox.insertBefore(row, prev);
        reindexSubmissionReviewEditorRows(reviewBox);
        updateProgress();
        reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', { bubbles: true, detail: { immediate: true } }));
      }
      return;
    }

    const downBtn = event.target.closest('.btn-move-review-down');
    if (downBtn) {
      const row = downBtn.closest('.submission-edit-review-row');
      const next = row?.nextElementSibling;
      if (next && next.classList.contains('submission-edit-review-row')) {
        reviewBox.insertBefore(next, row);
        reindexSubmissionReviewEditorRows(reviewBox);
        updateProgress();
        reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', { bubbles: true, detail: { immediate: true } }));
      }
      return;
    }

    const copyFullBtn = event.target.closest('.btn-copy-full-item');
    if (copyFullBtn) {
      const row = copyFullBtn.closest('.submission-edit-review-row');
      const reviewer = row?.querySelector('.sub-edit-review-reviewer')?.value.trim() || 'Reviewer Comment';
      const comment = row?.querySelector('.sub-edit-review-comment')?.value.trim() || '';
      const response = row?.querySelector('.sub-edit-review-response')?.value.trim() || '';
      const changes = row?.querySelector('.sub-edit-review-changes')?.value.trim() || '';
      let block = `[${reviewer}]\nComment: ${comment}\n\nResponse: ${response}`;
      if (changes) block += `\n\nManuscript Changes: ${changes}`;
      try {
        await navigator.clipboard.writeText(block);
        showGlobalToast(t('copyCodeSuccess') || 'Copied to clipboard!', 'success');
      } catch (_) {
        showGlobalToast('Copy failed', 'danger');
      }
      return;
    }

    const copyButton = event.target.closest('.btn-copy-review-response');
    if (copyButton) {
      const row = copyButton.closest('.submission-edit-review-row');
      const responseText = row?.querySelector('.sub-edit-review-response')?.value.trim() || '';
      if (!responseText) {
        showGlobalToast(t('responsePending'), 'warning');
        return;
      }
      try {
        await navigator.clipboard.writeText(responseText);
        showGlobalToast(t('copy'), 'success');
      } catch (_) {
        showGlobalToast('Copy failed', 'danger');
      }
      return;
    }

    const deleteButton = event.target.closest('.btn-delete-review-row');
    if (deleteButton) {
      const row = deleteButton.closest('.submission-edit-review-row');
      row?.remove();
      reindexSubmissionReviewEditorRows(reviewBox);
      updateProgress();
      if (reviewBox.querySelectorAll('.submission-edit-review-row').length === 0) {
        window.RFUI.setHTML(reviewBox, `<p class="empty-state">${escapeHTML(t('emptyReviewEditor'))}</p>`);
      }
      reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', {
        bubbles: true,
        detail: { immediate: true }
      }));
      return;
    }
  });

  reviewBox.addEventListener('input', () => {
    updateProgress();
  });

  reviewBox.addEventListener('change', event => {
    if (event.target.classList.contains('sub-edit-review-status')) {
      updateProgress();
      reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', {
        bubbles: true,
        detail: { immediate: true }
      }));
    }
  });
}

function renderSubmissionReviewPreview(sub, checklistKeys) {
  const previewBox = document.getElementById('submission-review-preview');
  if (!previewBox) return;
  const compliance = sub.complianceChecklist && typeof sub.complianceChecklist === 'object' && !Array.isArray(sub.complianceChecklist)
    ? sub.complianceChecklist
    : {};
  const completedChecks = checklistKeys.filter(chk => compliance[chk.key] === true).length;
  const reviewRows = getSubmissionReviewMatrixRows(sub);
  const reviewPreview = reviewRows.length
    ? reviewRows.map((row, index) => {
        const reviewerTag = row.reviewer ? `<span class="badge badge-purple" style="font-size:10px; margin-left:6px; font-weight:normal;">${escapeHTML(row.reviewer)}</span>` : '';
        const statusVal = row.status || (row.response?.trim() ? 'addressed' : 'pending');
        let statusBadge = '';
        if (statusVal === 'addressed') statusBadge = `<span class="badge badge-success" style="font-size:10px; margin-left:4px;">${escapeHTML(t('statusAddressed') || '已解决')}</span>`;
        else if (statusVal === 'in_progress') statusBadge = `<span class="badge badge-warning" style="font-size:10px; margin-left:4px;">${escapeHTML(t('statusInProgress') || '处理中')}</span>`;
        else if (statusVal === 'clarified') statusBadge = `<span class="badge badge-info" style="font-size:10px; margin-left:4px;">${escapeHTML(t('statusClarified') || '辩明')}</span>`;
        else statusBadge = `<span class="badge badge-secondary" style="font-size:10px; margin-left:4px;">${escapeHTML(t('statusPending') || '待处理')}</span>`;

        const changesNote = row.changes ? `<div style="font-size:11px; color:var(--accent-blue, #0284c7); margin-top:3px; background:rgba(2,132,199,0.06); padding:2px 6px; border-radius:3px;">📝 ${escapeHTML(row.changes)}</div>` : '';
        return `
        <div class="submission-review-preview-row">
          <strong>${escapeHTML(tf('reviewerCommentLabel', { count: index + 1 }))}${reviewerTag}${statusBadge}</strong>
          <p>${escapeHTML(row.comment || t('noCommentText'))}</p>
          <span>${escapeHTML(row.response ? t('responseSaved') : t('responsePending'))}</span>
          ${changesNote}
        </div>
      `;
      }).join('')
    : `<p class="empty-state">${escapeHTML(t('emptyReviewPreview'))}</p>`;
  const progressHtml = renderRebuttalProgressTracker(sub);
  window.RFUI.setHTML(previewBox, `
    ${progressHtml}
    <div class="workflow-context-grid submission-review-preview-grid">
      <div class="workflow-context-item"><span>${escapeHTML(t('checklistLabel'))}</span><strong>${completedChecks}/${checklistKeys.length}</strong></div>
      <div class="workflow-context-item"><span>${escapeHTML(t('workflowReviewerCommentsLabel'))}</span><strong>${reviewRows.length}</strong></div>
      <div class="workflow-context-item"><span>${escapeHTML(t('responsesLabel'))}</span><strong>${reviewRows.filter(row => row.response).length}/${reviewRows.length}</strong></div>
    </div>
    <div class="submission-review-preview-list">${reviewPreview}</div>
  `);
}

function getSubmissionEditValues(prefix) {
  return {
    title: document.getElementById(`${prefix}-title`).value,
    firstAuthor: document.getElementById(`${prefix}-first-author`)?.value || '',
    journal: document.getElementById(`${prefix}-journal`).value,
    journalUrl: document.getElementById(`${prefix}-journal-url`).value,
    externalManuscriptId: document.getElementById(`${prefix}-external-id`)?.value?.trim() || '',
    status: document.getElementById(`${prefix}-status`).value,
    submissionDate: document.getElementById(`${prefix}-submission-date`).value,
    firstDecisionDate: document.getElementById(`${prefix}-r1-date`).value,
    revisionDueDate: document.getElementById(`${prefix}-revision-due`).value,
    decisionDate: document.getElementById(`${prefix}-decision-date`).value,
    doi: document.getElementById(`${prefix}-doi`).value,
    articleUrl: document.getElementById(`${prefix}-article-url`).value,
    complianceChecklist: collectSubmissionChecklistFromEditor(),
    complianceChecklistKeys: collectSubmissionChecklistKeysFromEditor(),
    reviewMatrix: collectSubmissionReviewMatrixFromEditor()
  };
}

function applySubmissionEditSync(sub, man, syncPlan, database = db) {
  const previousStatus = sub.status;
  if (man) {
    man.title = syncPlan.manuscriptPatch.title;
    if (window.RFCore.getCurrentSubmission(database, man.id)?.id === sub.id) {
      man.targetJournals = syncPlan.manuscriptPatch.targetJournals;
    }
    man.updatedAt = new Date().toISOString();
  } else {
    sub.title = syncPlan.detachedSubmissionTitle;
  }

  Object.assign(sub, syncPlan.submissionPatch);

  if (syncPlan.shouldMarkRejected) {
    markSubmissionRejected(sub, syncPlan.rejectionDate || todayString());
  } else {
    sub.status = syncPlan.submissionPatch.status;
  }

  if (syncPlan.submissionPatch.status === 'accepted') {
    sub.acceptedAt = sub.decisionDate || sub.acceptedAt || new Date().toISOString();
  } else if (syncPlan.submissionPatch.status === 'published') {
    sub.publishedAt = sub.publishedAt || getTimelineNodeByKey(sub, 'online')?.completeDate || sub.decisionDate || new Date().toISOString();
    sub.acceptedAt = sub.acceptedAt || sub.publishedAt;
  }
  if (previousStatus === 'published' && sub.status === 'accepted') clearOnlinePublicationCompletion(sub);

  if (syncPlan.publicationPatch) {
    const doi = normalizeDoi(syncPlan.publicationPatch.doi);
    sub.doi = doi || null;
    sub.articleUrl = syncPlan.publicationPatch.articleUrl || (doi ? `https://doi.org/${doi}` : null);
  } else if (syncPlan.shouldClearPublication) {
    clearPublicationLinkFields(sub);
    clearPublicationTimelineCompletion(sub);
  }

  sub.updatedAt = new Date().toISOString();
  normalizeSubmissionTimeline(sub);
  syncManuscriptStatusFromSubmission(sub, database);
  if (man) syncLinkedManuscriptSnapshots(man, database);
}

function refreshSubmissionStatusPresentation(sub) {
  const detailPanel = document.getElementById('submission-detail-panel');
  if (!detailPanel || detailPanel.dataset.currentSubmissionId !== sub.id) return;

  const status = normalizeSubmissionStatus(sub.status);
  const statusText = getSubmissionStatusLabel(status);
  const badgeClass = window.RFUI.getSubmissionStatusBadgeClass(status);
  detailPanel.querySelectorAll('[data-submission-status-badge]').forEach(badge => {
    badge.className = badgeClass;
    badge.textContent = badge.dataset.submissionStatusBadge === 'stage'
      ? `${t('currentStageLabel')}: ${statusText}`
      : statusText;
  });

  const summary = detailPanel.querySelector('[data-submission-status-summary]');
  if (summary) {
    const analysis = analyzeSubmission(sub);
    const submitDate = normalizeDateString(sub.submissionDate || analysis.submitDate);
    summary.textContent = `${getSubmissionJournalName(sub)} / ${statusText} / ${t('milestoneSubmission')} ${submitDate || t('noDate')}`;
  }

  const cycle = getSubmissionCycleTime(sub);
  const cycleCard = detailPanel.querySelector('[data-submission-cycle-card]');
  if (cycleCard) {
    cycleCard.classList.toggle('submission-cycle-card-complete', cycle.isCompleted);
    cycleCard.classList.toggle('submission-cycle-card-active', !cycle.isCompleted);
    const label = cycleCard.querySelector('[data-submission-cycle-label]');
    const text = cycleCard.querySelector('[data-submission-cycle-text]');
    const icon = cycleCard.querySelector('.submission-cycle-icon');
    if (label) label.textContent = t(cycle.isCompleted ? 'cycleTimeCompleted' : 'submissionCycleTracking');
    if (text) {
      text.textContent = cycle.isCompleted
        ? tf('cycleTimeCompletedText', { start: cycle.startDateStr, end: cycle.endDateStr, days: cycle.days })
        : tf('submissionCycleText', { start: cycle.startDateStr, days: cycle.days });
    }
    if (icon) {
      window.RFUI.setHTML(icon, cycle.isCompleted
        ? '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>'
        : '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>');
    }
  }
}

async function saveSubmissionEditFromValues(sub, prefix, options = {}) {
  const editValues = options.values || getSubmissionEditValues(prefix);
  const syncPlan = window.RFUI.buildSubmissionEditSyncPlan(editValues);
  if (!syncPlan.ok) {
    if (options.alertOnError !== false) alert(syncPlan.error);
    if (typeof options.onValidationError === 'function') options.onValidationError(syncPlan.error);
    return false;
  }

  const liveSub = db.submissions.find(item => item.id === sub.id);
  if (!liveSub) throw new Error(t('submissionNotFound'));
  const previousStatus = normalizeSubmissionStatus(liveSub.status);
  const workingDatabase = typeof structuredClone === 'function'
    ? structuredClone(db)
    : JSON.parse(JSON.stringify(db));
  const workingSub = workingDatabase.submissions.find(item => item.id === sub.id);
  if (!workingSub) throw new Error(t('submissionNotFound'));
  const workingMan = workingDatabase.manuscripts.find(item => item.id === workingSub.manuscriptId);

  applySubmissionEditSync(workingSub, workingMan, syncPlan, workingDatabase);
  const firstAuthor = String(editValues.firstAuthor || '').trim().slice(0, 160);
  workingSub.firstAuthor = firstAuthor || null;
  if (workingMan) workingMan.firstAuthor = firstAuthor || null;
  if (workingMan) syncLinkedManuscriptSnapshots(workingMan, workingDatabase);
  workingSub.complianceChecklist = editValues.complianceChecklist;
  workingSub.complianceChecklistKeys = editValues.complianceChecklistKeys;
  workingSub.reviewMatrix = editValues.reviewMatrix;
  const savedDatabase = await window.storage.saveAll(workingDatabase, {
    mergeOnConflict: options.mergeOnConflict === true
  });
  db = savedDatabase || workingDatabase;
  const savedSub = db.submissions.find(item => item.id === sub.id);
  if (!savedSub) throw new Error(t('submissionNotFound'));
  Object.assign(sub, savedSub);

  if (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero && workingMan?.zoteroItemKey) {
    try {
      ZoteroBridge.syncStatusTag(workingMan.zoteroItemKey, workingMan.status || savedSub.status);
      ZoteroBridge.syncNote(workingMan.zoteroItemKey);
    } catch (_) {}
  }

  const shouldCelebrate = window.RFUI.shouldCelebrateAcceptance(
    previousStatus,
    normalizeSubmissionStatus(savedSub.status)
  );
  const activeView = document.querySelector('.content-view.active')?.id;
  if (activeView === 'view-dashboard') renderDashboard();
  if (activeView === 'view-manuscripts') renderKanban();
  if (activeView === 'view-submissions') renderSubmissions({ refreshDetails: options.renderDetails !== false });
  if (options.renderDetails !== false) renderSubmissionDetails(savedSub);
  else if (selectedSubmissionId === savedSub.id) refreshSubmissionStatusPresentation(savedSub);
  if (options.notify !== false) showGlobalToast(t('submissionEditsSaved'), 'success');
  if (shouldCelebrate) showAcceptanceCelebration(savedSub);
  return true;
}

function setupSubmissionAutoSave(sub) {
  submissionAutoSaveCleanup?.();
  const editCenter = document.getElementById('submission-entry-editor-panel');
  const status = editCenter?.querySelector('[data-submission-autosave-status]');
  if (!editCenter || !status) return;

  let debounceTimer = null;
  let revision = 0;
  let saveChain = Promise.resolve();
  let lastSavedSnapshot = JSON.stringify(getSubmissionEditValues('sub-edit'));
  const debounceMs = 650;

  const setStatus = (state, message, detail = '') => {
    if (!editCenter.isConnected) return;
    status.dataset.state = state;
    status.title = detail || '';
    const label = status.querySelector('[data-submission-autosave-label]');
    if (label) label.textContent = message;
  };

  const persist = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    const requestedRevision = revision;
    const values = getSubmissionEditValues('sub-edit');
    const currentSnapshot = JSON.stringify(values);
    pendingSubmissionSaves += 1;
    setStatus('saving', t('autoSaveSaving'));

    saveChain = saveChain
      .catch(() => {})
      .then(async () => {
        // Values are captured before navigation can replace the editor.
        if (currentSnapshot === lastSavedSnapshot) {
          if (requestedRevision === revision) setStatus('saved', t('autoSaveSaved'));
          return;
        }
        let validationError = '';
        const saved = await saveSubmissionEditFromValues(sub, 'sub-edit', {
          values,
          alertOnError: false,
          renderDetails: false,
          notify: false,
          mergeOnConflict: true,
          onValidationError: error => {
            validationError = error;
          }
        });
        if (!editCenter.isConnected) return;
        if (!saved) {
          setStatus('invalid', t('autoSaveInvalid'), validationError);
          return;
        }
        lastSavedSnapshot = currentSnapshot;
        if (requestedRevision === revision) {
          setStatus('saved', t('autoSaveSaved'));
          renderSubmissionReviewPreview(sub, getSubmissionChecklistKeys(sub));
        }
      })
      .catch(error => {
        console.error('Submission auto-save failed:', error);
        setStatus('error', t('autoSaveFailed'), String(error?.message || error || ''));
        showGlobalToast(t('autoSaveFailed'), 'error');
      })
      .finally(() => { pendingSubmissionSaves -= 1; });
  };

  const requestSave = ({ immediate = false } = {}) => {
    revision += 1;
    if (debounceTimer) clearTimeout(debounceTimer);
    setStatus('pending', t('autoSavePending'));
    if (immediate) {
      persist();
    } else {
      debounceTimer = window.setTimeout(persist, debounceMs);
    }
  };

  editCenter.addEventListener('input', event => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
    if (control.type === 'checkbox' || control.type === 'radio') return;
    requestSave();
  });

  editCenter.addEventListener('change', event => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) return;
    requestSave({ immediate: true });
  });

  editCenter.addEventListener('submission-autosave-request', event => {
    requestSave({ immediate: event.detail?.immediate !== false });
  });

  const flushPendingSave = () => {
    if (debounceTimer) persist();
  };
  const flushWhenHidden = () => {
    if (document.visibilityState === 'hidden') flushPendingSave();
  };
  window.addEventListener('pagehide', flushPendingSave);
  document.addEventListener('visibilitychange', flushWhenHidden);
  submissionAutoSaveCleanup = () => {
    flushPendingSave();
    window.removeEventListener('pagehide', flushPendingSave);
    document.removeEventListener('visibilitychange', flushWhenHidden);
    submissionAutoSaveCleanup = null;
  };
}

function setupSubmissionSearch() {
  const input = document.getElementById('submission-search');
  if (!input) return;
  if (input.dataset.bound) return;
  input.dataset.bound = 'true';
  input.addEventListener('input', event => { if (!event.isComposing) applySubmissionSearch(); });
  input.addEventListener('compositionend', applySubmissionSearch);
  document.getElementById('submission-search-status')?.addEventListener('change', applySubmissionSearch);
  const clear = (all = false) => {
    input.value = '';
    const statusSelect = document.getElementById('submission-search-status');
    if (all && statusSelect) statusSelect.value = 'all';
    applySubmissionSearch(); input.focus();
  };
  document.getElementById('submission-search-clear')?.addEventListener('click', () => clear());
  document.getElementById('submission-search-reset')?.addEventListener('click', () => clear(true));
  input.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); clear(); }
    if (event.key === 'Enter') {
      event.preventDefault();
      document.querySelector('.submission-card-item:not([hidden]) .btn-edit-submission')?.click();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || (typeof modal !== 'undefined' && modal?.classList?.contains('active'))) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (document.getElementById('view-submissions')?.classList?.contains('active')) { event.preventDefault(); input.focus(); }
  });
}

function applySubmissionSearch() {
  const input = document.getElementById('submission-search');
  if (!input) return;
  const filter = document.getElementById('submission-search-status')?.value || 'all';
  const terms = window.RFUI.normalizeSearchText(input.value).split(/\s+/).filter(Boolean);
  const cards = document.querySelectorAll('#submissions-list-container .submission-card-item');
  let count = 0;
  cards.forEach(card => {
    const matches = window.RFUI.matchesSubmissionSearch(card.dataset.searchText, card.dataset.searchStatus, terms, filter);
    if (card.hidden === matches) card.hidden = !matches;
    if (matches) count += 1;
  });
  const clearBtn = document.getElementById('submission-search-clear');
  if (clearBtn) clearBtn.hidden = !input.value;
  const emptyEl = document.getElementById('submission-search-empty');
  if (emptyEl) emptyEl.hidden = count > 0 || cards.length === 0;
  const countEl = document.getElementById('submission-search-count');
  if (countEl) countEl.textContent = tf('submissionSearchCount', { count, total: cards.length });
}

function renderSubmissions({ refreshDetails = true } = {}) {
  const container = document.getElementById('submissions-list-container');
  window.RFUI.setHTML(container, '');

  if (db.submissions.length === 0) {
    window.RFUI.setHTML(container, `<p class="empty-state">${escapeHTML(t('noSubmissionsTracked'))}</p>`);
    selectedSubmissionId = null;
  } else {
    const sortedSubmissions = sortDashboardSubmissions(db.submissions);
    const manuscriptsById = new Map(db.manuscripts.map(manuscript => [manuscript.id, manuscript]));
    const cards = document.createDocumentFragment();
    if (!sortedSubmissions.some(sub => sub.id === selectedSubmissionId)) {
      selectedSubmissionId = sortedSubmissions[0].id;
    }
    const selectedSubmission = sortedSubmissions.find(sub => sub.id === selectedSubmissionId) || sortedSubmissions[0];

    sortedSubmissions.forEach((sub, index) => {
      const displayIndex = sortedSubmissions.length - index;
      const card = document.createElement('div');
      card.className = `glass-card submission-card-item ${sub.id === selectedSubmissionId ? 'selected' : ''}`;

      // Find linked manuscript
      const man = manuscriptsById.get(sub.manuscriptId);
      const manTitle = man ? man.title : (sub.title || t('untitledManuscript'));
      const journalName = getSubmissionJournalName(sub);
      const statusText = getSubmissionStatusLabel(sub.status || 'submitted');
      card.dataset.searchStatus = normalizeSubmissionStatus(sub.status);
      card.dataset.searchText = window.RFUI.normalizeSearchText([manTitle, journalName, sub.externalManuscriptId, getSubmissionFirstAuthor(sub, man), man?.authors, man?.doi, sub.doi, statusText, sub.status].filter(Boolean).join(' '));
      const transferText = sub.previousJournal
        ? `<span class="submission-card-meta">${escapeHTML(t('transferToJournal'))}: ${escapeHTML(sub.previousJournal)}</span>`
        : '';
      let cardCountdownHtml = '';
      if (sub.revisionDueDate && (sub.status === 'revision' || sub.status === 'under_review')) {
        const cd = window.RFCalendar?.getRevisionCountdownMeta ? window.RFCalendar.getRevisionCountdownMeta(sub.revisionDueDate) : null;
        if (cd) {
          cardCountdownHtml = `<span class="${escapeHTML(cd.badgeClass)}" style="font-size:10px; padding:1px 6px; border-radius:3px;" title="${escapeHTML(cd.title)}">${escapeHTML(cd.icon)} ${escapeHTML(cd.text)}</span>`;
        }
      }

      window.RFUI.setHTML(card, `
        <div class="submission-card-heading">
          <div class="submission-card-title-group">
            <span class="submission-index">${displayIndex}</span>
            <div class="submission-card-copy">
              <h4 title="${escapeHTML(journalName)}">${escapeHTML(journalName)}</h4>
              <p class="submission-card-title">${escapeHTML(manTitle)}</p>
            </div>
          </div>
          <button class="btn-secondary btn-icon submission-card-edit btn-edit-submission" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('editFields'))}">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
        </div>
        <div class="submission-card-footer">
          <span class="${window.RFUI.getSubmissionStatusBadgeClass(sub.status)}">${escapeHTML(statusText)}</span>
          ${sub.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:10px; padding:1px 6px; border-radius:3px;" title="Manuscript ID: ${escapeHTML(sub.externalManuscriptId)}">ID: ${escapeHTML(sub.externalManuscriptId)}</span>` : ''}
          ${cardCountdownHtml}
          ${transferText}
          ${man?.zoteroItemKey ? `
            <span class="zotero-card-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 文献库中选中此条目' : 'Select in Zotero library')}" style="padding:1px 6px; font-size:10px; margin-left:auto;">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
              Zotero
            </span>
          ` : ''}
        </div>
      `);

      card.addEventListener('click', () => {
        openSubmissionForEditing(sub);
      });

      const editButton = card.querySelector('.btn-edit-submission');
      editButton?.addEventListener('click', (event) => {
        event.stopPropagation();
        openSubmissionForEditing(sub, { focusEditCenter: true });
      });

      const cardZoteroBadge = card.querySelector('.zotero-card-badge');
      if (cardZoteroBadge) {
        cardZoteroBadge.addEventListener('click', (event) => {
          event.stopPropagation();
          const key = cardZoteroBadge.getAttribute('data-item-key');
          if (key && typeof ZoteroBridge !== 'undefined') {
            ZoteroBridge.selectItemInZotero(key);
          }
        });
      }

      cards.appendChild(card);
    });
    container.appendChild(cards);

    const detailPanel = document.getElementById('submission-detail-panel');
    if (refreshDetails || detailPanel?.dataset.currentSubmissionId !== selectedSubmission.id) {
      renderSubmissionDetails(selectedSubmission);
    }
  }

  // Render journal portals section
  renderJournalPortals();
  applySubmissionSearch();
}

function renderJournalPortals() {
  const portalList = document.getElementById('journal-portals-list');
  if (!portalList) return;
  window.RFUI.setHTML(portalList, '');

  if (!db.settings) db.settings = {};
  if (!db.settings.journalPortals) {
    db.settings.journalPortals = [
      { id: 'acs', name: 'ACS', url: 'https://publish.acs.org/app/login?code=1000', color: '#002C6C', isDefault: true },
      { id: 'wiley', name: 'Wiley', url: 'https://submission.wiley.com/submission/dashboard', color: '#00A4E4', isDefault: true },
      { id: 'apl', name: 'APL', url: 'https://apl.peerx-press.org/cgi-bin/main.plex', color: '#D22630', isDefault: true },
      { id: 'nature', name: 'Nature', url: 'https://mts-ncomms.nature.com/cgi-bin/main.plex', color: '#B59E50', isDefault: true }
    ];
  }

  const portals = db.settings.journalPortals;

  if (portals.length === 0) {
    window.RFUI.setHTML(portalList, `<p class="empty-state" style="padding: 12px; font-size: 11px;">${escapeHTML(t('portalEmpty'))}</p>`);
    return;
  }

  portals.forEach(portal => {
    const card = document.createElement('div');
    card.className = 'portal-item-card';
    const safeUrl = window.RFUI.isSafeWebUrl(portal.url) ? portal.url : '';

    let domain = '';
    try {
      domain = new URL(portal.url).hostname;
    } catch (e) {
      domain = portal.url;
    }

    const initial = String(portal.name || '').charAt(0).toUpperCase();
    const portalColor = /^#[0-9a-f]{6}$/i.test(portal.color || '') ? portal.color : 'var(--accent-purple)';
    card.title = `${portal.name} - ${domain}`;

    window.RFUI.setHTML(card, `
      <a class="portal-open" href="${escapeHTML(safeUrl || '#')}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(portal.name)} · ${escapeHTML(domain)}">
      <div class="portal-info">
        <div class="portal-avatar" style="background-color: ${portalColor};">
          ${escapeHTML(initial)}
        </div>
        <div class="portal-text">
          <span class="portal-name">${escapeHTML(portal.name)}</span>
          <span class="portal-domain" title="${escapeHTML(portal.url)}">${escapeHTML(domain)}</span>
        </div>
      </div>
      </a>
      <div class="portal-actions">
        <button type="button" class="btn-edit-portal" title="${currentLanguage === 'zh' ? '编辑投稿入口' : 'Edit portal'}" aria-label="${currentLanguage === 'zh' ? '编辑' : 'Edit'} ${escapeHTML(portal.name)}">✎</button>
        <button type="button" class="btn-delete-portal" title="${escapeHTML(t('portalDeleteTitle'))}" aria-label="${escapeHTML(t('portalDeleteTitle'))} ${escapeHTML(portal.name)}" data-id="${escapeHTML(portal.id)}">
          ✕
        </button>
      </div>
    `);

    card.querySelector('.portal-open')?.addEventListener('click', event => {
      if (!safeUrl) event.preventDefault();
    });
    card.querySelector('.btn-edit-portal')?.addEventListener('click', () => openJournalPortalEditor(portal));

    // Hook up delete listener
    const deleteBtn = card.querySelector('.btn-delete-portal');
    deleteBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(tf('portalDeleteConfirm', { name: portal.name }))) {
        const previous = db.settings.journalPortals;
        try {
          db.settings.journalPortals = previous.filter(p => p.id !== portal.id);
          db = await window.storage.saveAll(db) || db;
          renderJournalPortals();
          showGlobalToast(tf('portalDeletedToast', { name: portal.name }), 'success');
        } catch (error) {
          db.settings.journalPortals = previous;
          showGlobalToast(error.message || String(error), 'error');
        }
      }
    });

    portalList.appendChild(card);
  });
}

function openJournalPortalEditor(portal = null) {
  const editing = Boolean(portal);
  openModal(`
    <div class="modal-header">
      <h2>${editing ? (currentLanguage === 'zh' ? '编辑投稿入口' : 'Edit journal portal') : escapeHTML(t('addPortalTitle'))}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" aria-label="${escapeHTML(t('cancel'))}">✕</button>
    </div>
    <div class="form-group">
      <label for="portal-name">${escapeHTML(t('portalNameLabel'))}</label>
      <input type="text" id="portal-name" maxlength="60" value="${escapeHTML(portal?.name || '')}" placeholder="${escapeHTML(t('portalNamePlaceholder'))}">
    </div>
    <div class="form-group">
      <label for="portal-url">${escapeHTML(t('portalUrlLabel'))}</label>
      <input type="url" id="portal-url" value="${escapeHTML(portal?.url || '')}" placeholder="https://..." inputmode="url">
    </div>
    <div class="form-group">
      <label for="portal-color">${escapeHTML(t('portalColorLabel'))}</label>
      <div style="display: flex; gap: 12px; align-items: center;">
        <input type="color" id="portal-color" value="${/^#[0-9a-f]{6}$/i.test(portal?.color || '') ? portal.color : '#8b5cf6'}" style="width: 48px; height: 36px; border: none; padding: 0; background: transparent;">
        <span style="font-size: 12px; color: hsl(var(--text-muted));">${escapeHTML(t('portalColorHelp'))}</span>
      </div>
    </div>
    <button type="button" class="btn-primary w-full" id="btn-save-portal" style="margin-top:12px;">${editing ? (currentLanguage === 'zh' ? '保存修改' : 'Save changes') : escapeHTML(t('addPortalButton'))}</button>
  `);

  document.getElementById('btn-save-portal')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const name = document.getElementById('portal-name').value.trim();
    const url = document.getElementById('portal-url').value.trim();
    const color = document.getElementById('portal-color').value;
    if (!name || !url) { showGlobalToast(t('fillAllFields'), 'error'); return; }
    if (!window.RFUI.isSafeWebUrl(url)) { showGlobalToast(t('validUrlRequired'), 'error'); return; }

    const previous = Array.isArray(db.settings?.journalPortals) ? db.settings.journalPortals : [];
    const nextPortal = editing
      ? { ...portal, name, url, color }
      : { id: `portal_${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 11)}`, name, url, color, isDefault: false };
    const next = editing
      ? previous.map(item => item.id === portal.id ? nextPortal : item)
      : [...previous, nextPortal];
    button.disabled = true;
    try {
      db.settings.journalPortals = next;
      db = await window.storage.saveAll(db) || db;
      closeModal();
      renderJournalPortals();
      showGlobalToast(editing ? (currentLanguage === 'zh' ? '投稿入口已更新' : 'Portal updated') : tf('portalAddedToast', { name }), 'success');
    } catch (error) {
      db.settings.journalPortals = previous;
      showGlobalToast(error.message || String(error), 'error');
    } finally {
      button.disabled = false;
    }
  });
}

function setupJournalPortalListeners() {
  document.getElementById('btn-add-portal')?.addEventListener('click', () => openJournalPortalEditor());
}

function openLinkSubmissionModal(submission) {
  const manuscripts = Array.isArray(db.manuscripts) ? db.manuscripts : [];
  if (manuscripts.length === 0) {
    showGlobalToast(t('noManuscriptsToLink'), 'warning');
    return;
  }

  const manuscriptOptions = manuscripts
    .slice()
    .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
    .map(manuscript => `
      <option value="${escapeHTML(manuscript.id)}">${escapeHTML(manuscript.title || t('untitledManuscript'))}</option>
    `)
    .join('');

  openModal(`
    <div class="modal-header">
      <div>
        <h2>${escapeHTML(t('linkSubmissionTitle'))}</h2>
        <p class="text-muted">${escapeHTML(t('linkSubmissionHelp'))}</p>
      </div>
      <button class="btn-secondary btn-icon" id="btn-close-modal" aria-label="${escapeHTML(t('cancel'))}">✕</button>
    </div>
    <div class="form-group">
      <label for="submission-link-manuscript">${escapeHTML(t('workflowManuscriptLabel'))}</label>
      <select id="submission-link-manuscript">${manuscriptOptions}</select>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-cancel-link-sub">${escapeHTML(t('cancel') || '取消')}</button>
      <button type="button" class="btn-primary" id="btn-confirm-submission-link" style="min-width:130px;">
        ${escapeHTML(t('linkSubmissionConfirm'))}
      </button>
    </div>
  `);

  document.getElementById('btn-cancel-link-sub')?.addEventListener('click', closeModal);

  document.getElementById('btn-confirm-submission-link').addEventListener('click', async () => {
    const manuscriptId = document.getElementById('submission-link-manuscript').value;
    const manuscript = db.manuscripts.find(item => item.id === manuscriptId);
    if (!manuscript) return;
    const liveSubmission = db.submissions.find(item => item.id === submission.id);
    if (!liveSubmission) return;
    const previous = { manuscriptId: liveSubmission.manuscriptId, projectId: liveSubmission.projectId, updatedAt: liveSubmission.updatedAt };
    const manuscriptStates = db.manuscripts.map(item => [item, item.status, item.updatedAt]);
    try {
      liveSubmission.manuscriptId = manuscript.id;
      liveSubmission.projectId = manuscript.projectId || liveSubmission.projectId || null;
      liveSubmission.updatedAt = new Date().toISOString();
      syncManuscriptStatusesFromSubmissions(db);
      db = await window.storage.saveAll(db) || db;
      closeModal();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      const linkedSubmission = db.submissions.find(item => item.id === submission.id);
      if (linkedSubmission) renderSubmissionDetails(linkedSubmission);
      showGlobalToast(t('linkSubmissionSaved'), 'success');
    } catch (error) {
      Object.assign(liveSubmission, previous);
      manuscriptStates.forEach(([item, status, updatedAt]) => { item.status = status; item.updatedAt = updatedAt; });
      showGlobalToast(error.message || String(error), 'error');
    }
  });
}

/**
 * Academic Rebuttal Matrix & Response Letter Generator
 */
function escapeLatexText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%#_{}])/g, '\\$1')
    .replace(/\$/g, '\\$')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\r?\n\r?\n/g, '\\par\\medskip ')
    .replace(/\r?\n/g, '\\par ');
}

function safeEscapeLatex(value) {
  if (typeof escapeLatex === 'function') {
    return escapeLatex(value);
  }
  return escapeLatexText(value).replace(/\\par\s*/g, ' ');
}

async function copyRebuttalRichText(htmlContent, plainFallback) {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
    try {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([plainFallback], { type: 'text/plain' });
      const item = new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText });
      await navigator.clipboard.write([item]);
      return true;
    } catch (_) {}
  }
  if (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.copyText) {
    ZoteroBridge.copyText(plainFallback);
    return true;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(plainFallback);
    return true;
  }
  return false;
}

function generateAcademicRebuttalLetter(sub, man, format = 'latex') {
  const rows = getSubmissionReviewMatrixRows(sub);
  const paperTitle = man ? man.title : (sub.title || t('untitledManuscript'));
  const authors = (man && man.authors) ? man.authors : (getSubmissionFirstAuthor(sub, man) || 'Authors');
  const journal = getSubmissionJournalName(sub);
  const msId = sub.externalManuscriptId ? ` (ID: ${sub.externalManuscriptId})` : '';
  const dateStr = sub.revisionDueDate ? sub.revisionDueDate : todayString();

  if (format === 'latex') {
    let out = `% =========================================================================\n` +
              `% Point-by-Point Response to Reviewers\n` +
              `% Generated by Zotero PaperFlow\n` +
              `% =========================================================================\n` +
              `\\documentclass[11pt,a4paper]{article}\n` +
              `\\usepackage[margin=1in]{geometry}\n` +
              `\\usepackage{xcolor}\n` +
              `\\usepackage{tcolorbox}\n` +
              `\\tcbuselibrary{skins,breakable}\n` +
              `\\usepackage{booktabs}\n` +
              `\\usepackage{longtable}\n` +
              `\\usepackage{enumitem}\n` +
              `\\usepackage{hyperref}\n\n` +
              `% Color definitions\n` +
              `\\definecolor{revcolor}{RGB}{239, 246, 255}\n` +
              `\\definecolor{revframe}{RGB}{59, 130, 246}\n` +
              `\\definecolor{respcolor}{RGB}{240, 253, 244}\n` +
              `\\definecolor{respframe}{RGB}{34, 197, 94}\n` +
              `\\definecolor{changecolor}{RGB}{254, 243, 199}\n` +
              `\\definecolor{changeframe}{RGB}{217, 119, 6}\n\n` +
              `% Academic callout boxes\n` +
              `\\newtcolorbox{commentbox}[1][]{colback=revcolor,colframe=revframe,arc=2mm,boxrule=0.9pt,left=10pt,right=10pt,top=8pt,bottom=8pt,breakable,#1}\n` +
              `\\newtcolorbox{responsebox}[1][]{colback=respcolor,colframe=respframe,arc=2mm,boxrule=0.9pt,left=10pt,right=10pt,top=8pt,bottom=8pt,breakable,#1}\n` +
              `\\newtcolorbox{changesbox}[1][]{colback=changecolor,colframe=changeframe,arc=1.5mm,boxrule=0.7pt,left=8pt,right=8pt,top=6pt,bottom=6pt,breakable,#1}\n\n` +
              `\\begin{document}\n\n` +
              `\\begin{center}\n` +
              `  {\\LARGE \\bf Point-by-Point Response to Reviewers} \\\\[0.6em]\n` +
              `  {\\large \\textbf{Manuscript: } ${safeEscapeLatex(paperTitle)}} \\\\[0.3em]\n` +
              `  {\\normalsize \\textbf{Journal: } ${safeEscapeLatex(journal)}${safeEscapeLatex(msId)}} \\\\[0.2em]\n` +
              `  {\\normalsize \\textbf{Authors: } ${safeEscapeLatex(authors)}} \\\\[0.2em]\n` +
              `  {\\small \\textbf{Date: } ${safeEscapeLatex(dateStr)}}\n` +
              `\\end{center}\n\n` +
              `\\vspace{1em}\n` +
              `\\noindent Dear Editor and Reviewers,\\par\\medskip\n` +
              `\\noindent We sincerely thank the Editor and the Reviewers for their constructive comments and suggestions regarding our manuscript. We have carefully considered all comments and made corresponding revisions to the manuscript. Below is our detailed point-by-point response.\\par\\vspace{1.5em}\n\n` +
              `\\section*{Point-by-Point Responses}\n\n`;

    rows.forEach((r, idx) => {
      const reviewerTag = r.reviewer ? r.reviewer : `Reviewer Comment \\#${idx + 1}`;
      const escapedCmt = escapeLatexText(r.comment || '');
      const escapedResp = escapeLatexText(r.response || '');
      const escapedChanges = r.changes ? escapeLatexText(r.changes) : '';

      out += `\\noindent\\textbf{${safeEscapeLatex(reviewerTag)}} \\\\[0.3em]\n` +
             `\\begin{commentbox}\n` +
             `\\textbf{Comment:} ${escapedCmt}\n` +
             `\\end{commentbox}\n\n` +
             `\\begin{responsebox}\n` +
             `\\textbf{Response:} ${escapedResp}\n` +
             `\\end{responsebox}\n\n`;

      if (escapedChanges) {
        out += `\\begin{changesbox}\n` +
               `\\textbf{\\textit{Manuscript Changes:}} ${escapedChanges}\n` +
               `\\end{changesbox}\n\n`;
      }
      out += `\\vspace{0.8em}\n\n`;
    });

    out += `\\newpage\n` +
           `\\section*{Rebuttal Matrix Summary Table}\n\n` +
           `\\begin{longtable}{p{0.12\\textwidth} p{0.45\\textwidth} p{0.37\\textwidth}}\n` +
           `\\toprule\n` +
           `\\textbf{\\# / Reviewer} & \\textbf{Reviewer Comment} & \\textbf{Author Response \\& Changes} \\\\ \\midrule\n` +
           `\\endhead\n` +
           `\\bottomrule\n` +
           `\\endfoot\n`;

    rows.forEach((r, idx) => {
      const rev = safeEscapeLatex(r.reviewer || `Cmt #${idx + 1}`);
      const cmt = safeEscapeLatex(r.comment || '').slice(0, 150);
      const resp = safeEscapeLatex(r.response || '').slice(0, 150);
      const chg = r.changes ? ` \\textit{[Changes: ${safeEscapeLatex(r.changes)}]}` : '';
      out += `${rev} & ${cmt} & ${resp}${chg} \\\\ \\midrule\n`;
    });

    out += `\\end{longtable}\n\n` +
           `\\vspace{1.5em}\n` +
           `\\noindent We hope that the revised manuscript now meets the high standards of \\textit{${safeEscapeLatex(journal)}}.\\par\\vspace{1em}\n` +
           `\\noindent Sincerely,\\\\\n` +
           `\\noindent The Authors\n\n` +
           `\\end{document}\n`;

    return out;
  }

  if (format === 'md') {
    let out = `# Point-by-Point Response to Reviewers\n\n` +
              `- **Manuscript Title:** ${paperTitle}\n` +
              `- **Target Journal:** ${journal}${msId}\n` +
              `- **Authors:** ${authors}\n` +
              `- **Date:** ${dateStr}\n\n` +
              `---\n\n` +
              `### Dear Editor and Reviewers,\n\n` +
              `We sincerely thank the Editor and the Reviewers for their constructive comments and suggestions regarding our manuscript. We have carefully addressed each comment and revised the manuscript accordingly. A detailed point-by-point response is provided below.\n\n` +
              `---\n\n` +
              `## Summary of Revisions\n\n` +
              `| # | Reviewer | Comment Summary | Author Response & Manuscript Changes |\n` +
              `|---|---|---|---|\n`;

    rows.forEach((r, idx) => {
      const rev = (r.reviewer || `Comment #${idx + 1}`).replace(/\|/g, '\\|');
      const cmt = (r.comment || '').slice(0, 120).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
      const resp = (r.response || '').slice(0, 120).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
      const chg = r.changes ? ` *(Changes: ${r.changes.replace(/\|/g, '\\|')})*` : '';
      out += `| ${idx + 1} | ${rev} | ${cmt} | ${resp}${chg} |\n`;
    });

    out += `\n---\n\n` +
           `## Detailed Point-by-Point Responses\n\n`;

    rows.forEach((r, idx) => {
      const revTitle = r.reviewer ? `${r.reviewer} — Comment #${idx + 1}` : `Comment #${idx + 1}`;
      out += `### ${revTitle}\n\n` +
             `> **Reviewer Comment:**  \n` +
             `> ${(r.comment || '').split(/\r?\n/).join('\n> ')}\n\n` +
             `**Author Response:**  \n` +
             `${r.response || '*Response pending*'}\n\n`;

      if (r.changes) {
        out += `**Manuscript Changes:**  \n` +
               `> 📝 *${r.changes}*\n\n`;
      }
      out += `---\n\n`;
    });

    out += `We hope these revisions and clarifications address the reviewers' concerns satisfactorily.\n\n` +
           `Sincerely,  \n` +
           `The Authors\n`;
    return out;
  }

  if (format === 'word' || format === 'html') {
    let out = `<!DOCTYPE html>\n` +
              `<html>\n` +
              `<head>\n` +
              `<meta charset="utf-8">\n` +
              `<title>Response to Reviewers - ${escapeHTML(paperTitle)}</title>\n` +
              `<style>\n` +
              `  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #111827; margin: 40px auto; max-width: 820px; }\n` +
              `  h1 { font-size: 18pt; text-align: center; margin-bottom: 8px; }\n` +
              `  .meta-box { border-bottom: 1.5pt solid #333; padding-bottom: 12px; margin-bottom: 24px; font-size: 11pt; }\n` +
              `  .comment-card { background: #f0f7ff; border-left: 4pt solid #2563eb; padding: 10pt 14pt; margin: 12pt 0 6pt 0; border-radius: 4px; }\n` +
              `  .response-card { background: #f0fdf4; border-left: 4pt solid #16a34a; padding: 10pt 14pt; margin: 6pt 0 6pt 0; border-radius: 4px; }\n` +
              `  .changes-card { background: #fefce8; border-left: 3pt solid #d97706; padding: 6pt 12pt; margin: 6pt 0 16pt 0; font-size: 11pt; border-radius: 4px; }\n` +
              `  table.matrix-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10.5pt; }\n` +
              `  table.matrix-table th, table.matrix-table td { border: 1pt solid #cbd5e1; padding: 8pt 10pt; vertical-align: top; text-align: left; }\n` +
              `  table.matrix-table th { background: #f1f5f9; font-weight: bold; }\n` +
              `  .reviewer-pill { background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 3px; font-size: 10pt; font-weight: 600; display: inline-block; }\n` +
              `</style>\n` +
              `</head>\n` +
              `<body>\n` +
              `<h1>Point-by-Point Response to Reviewers</h1>\n` +
              `<div class="meta-box">\n` +
              `  <p><strong>Manuscript Title:</strong> ${escapeHTML(paperTitle)}</p>\n` +
              `  <p><strong>Target Journal:</strong> ${escapeHTML(journal)}${escapeHTML(msId)}</p>\n` +
              `  <p><strong>Authors:</strong> ${escapeHTML(authors)}</p>\n` +
              `  <p><strong>Date:</strong> ${escapeHTML(dateStr)}</p>\n` +
              `</div>\n` +
              `<p>Dear Editor and Reviewers,</p>\n` +
              `<p>We sincerely thank the Editor and the Reviewers for their constructive comments and valuable suggestions on our manuscript. We have carefully addressed each point raised and revised the manuscript accordingly. A point-by-point response is detailed below.</p>\n` +
              `<h2>Detailed Point-by-Point Responses</h2>\n`;

    rows.forEach((r, idx) => {
      const rev = r.reviewer ? escapeHTML(r.reviewer) : `Reviewer Comment #${idx + 1}`;
      const cmt = escapeHTML(r.comment || '').replace(/\r?\n/g, '<br/>');
      const resp = escapeHTML(r.response || '').replace(/\r?\n/g, '<br/>');
      const chg = r.changes ? escapeHTML(r.changes) : '';

      out += `<div style="margin-top:16pt;">\n` +
             `  <div style="font-weight:bold; font-size:12pt; margin-bottom:4pt;">` +
             `    <span class="reviewer-pill">${rev}</span> <span style="color:#64748b; font-size:11pt;">— Comment #${idx + 1}</span>` +
             `  </div>\n` +
             `  <div class="comment-card"><strong>Reviewer Comment:</strong><br/>${cmt || '<em>No comment recorded</em>'}</div>\n` +
             `  <div class="response-card"><strong>Author Response:</strong><br/>${resp || '<em>Response pending</em>'}</div>\n`;

      if (chg) {
        out += `  <div class="changes-card"><strong>📝 Manuscript Changes:</strong> ${chg}</div>\n`;
      }
      out += `</div>\n`;
    });

    out += `<h2>Summary Table</h2>\n` +
           `<table class="matrix-table">\n` +
           `  <thead><tr><th style="width:15%;">Reviewer</th><th style="width:45%;">Comment</th><th style="width:40%;">Response & Changes</th></tr></thead>\n` +
           `  <tbody>\n`;

    rows.forEach((r, idx) => {
      const rev = escapeHTML(r.reviewer || `Comment #${idx + 1}`);
      const cmt = escapeHTML(r.comment || '').replace(/\r?\n/g, '<br/>');
      const resp = escapeHTML(r.response || '').replace(/\r?\n/g, '<br/>');
      const chg = r.changes ? `<br/><small style="color:#b45309;"><strong>📝 Changes:</strong> ${escapeHTML(r.changes)}</small>` : '';
      out += `    <tr><td><strong>${rev}</strong></td><td>${cmt}</td><td>${resp}${chg}</td></tr>\n`;
    });

    out += `  </tbody>\n` +
           `</table>\n` +
           `<p style="margin-top:24pt;">We hope that these revisions satisfy the reviewers' requirements. Sincerely,<br/><strong>The Authors</strong></p>\n` +
           `</body>\n` +
           `</html>\n`;

    return out;
  }

  // format === 'table'
  let out = `| # | Reviewer | Comment | Response | Changes |\n` +
            `|---|---|---|---|---|\n`;
  rows.forEach((r, idx) => {
    const rev = (r.reviewer || '').replace(/\|/g, '\\|');
    const cmt = (r.comment || '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br/>');
    const resp = (r.response || '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br/>');
    const chg = (r.changes || '').replace(/\|/g, '\\|');
    out += `| ${idx + 1} | ${rev} | ${cmt} | ${resp} | ${chg} |\n`;
  });
  return out;
}

function parseReviewCommentsBatch(rawText = '', defaultReviewer = 'Reviewer #1') {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText.split(/\r?\n/);
  const comments = [];
  let currentReviewer = defaultReviewer || 'Reviewer #1';
  let currentBuffer = [];

  const reviewerRegex = /^(?:(?:Reviewer|Referee|审稿人|评审人|审稿专家)\s*#?\s*([0-9]+|[A-Z一二三四五六七八九十])|(?:Editor(?:-in-Chief)?|Associate\s+Editor|Guest\s+Editor|Handling\s+Editor|主编|副主编|责任编辑|编辑部?)|Comments?\s+from\s+(?:the\s+)?(?:Editor|Reviewers?)|(?:编辑|审稿人|评审人)意见)/i;
  const pointRegex = /^(?:(?:Point|Comment|Issue|Item|Q|问题|意见|建议)\s*#?\s*([0-9]+)[\s.:)-：、]|(?:Major|Minor)\s*(?:Comments?|Points?)\s*#?\s*([0-9]+)[\s.:)-：、]|([0-9]{1,2})[\s.:)-、：]\s*|(\([0-9]{1,2}\)|（[0-9]{1,2}）)\s*|([a-z]\))\s*|[-*•·]\s+)/i;
  const cnNumMap = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10' };

  function flushComment() {
    const text = currentBuffer.join('\n').trim();
    if (text) {
      comments.push({
        id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${comments.length}`,
        reviewer: currentReviewer,
        comment: text,
        response: '',
        changes: '',
        status: 'pending'
      });
    }
    currentBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentBuffer.length > 0) {
        currentBuffer.push('');
      }
      continue;
    }

    const revMatch = line.match(reviewerRegex);
    if (revMatch) {
      flushComment();
      if (/Editor|主编|编辑/i.test(line)) {
        currentReviewer = 'Editor';
      } else {
        const rawRevNum = revMatch[1] || '1';
        const revNum = cnNumMap[rawRevNum] || rawRevNum;
        currentReviewer = `Reviewer #${revNum}`;
      }
      continue;
    }

    const pointMatch = line.match(pointRegex);
    if (pointMatch) {
      flushComment();
      currentBuffer.push(line);
    } else {
      currentBuffer.push(line);
    }
  }

  flushComment();

  if (comments.length === 0 && rawText.trim()) {
    const blocks = rawText.split(/\r?\n\s*\r?\n/).map(b => b.trim()).filter(Boolean);
    blocks.forEach((block, idx) => {
      comments.push({
        id: `rev_${Date.now()}_${idx}`,
        reviewer: currentReviewer,
        comment: block,
        response: '',
        changes: '',
        status: 'pending'
      });
    });
  }

  return comments;
}

function renderRebuttalProgressTracker(sub = {}) {
  const rows = getSubmissionReviewMatrixRows(sub);
  const total = rows.length;
  if (total === 0) return '';

  const addressed = rows.filter(r => r.status === 'addressed' || (!r.status && r.response && r.response.trim().length > 0)).length;
  const clarified = rows.filter(r => r.status === 'clarified').length;
  const resolved = addressed + clarified;
  const inProgress = rows.filter(r => r.status === 'in_progress').length;
  const pending = rows.filter(r => r.status === 'pending' || (!r.status && (!r.response || !r.response.trim().length))).length;
  const withChanges = rows.filter(r => Boolean(r.changes && r.changes.trim().length > 0)).length;
  const percent = Math.round((resolved / total) * 100);

  const reviewerMap = new Map();
  rows.forEach(r => {
    const rev = r.reviewer || 'Reviewer';
    if (!reviewerMap.has(rev)) reviewerMap.set(rev, { total: 0, done: 0 });
    const stat = reviewerMap.get(rev);
    stat.total++;
    if (r.status === 'addressed' || r.status === 'clarified' || (!r.status && r.response && r.response.trim().length > 0)) {
      stat.done++;
    }
  });

  const reviewerChips = Array.from(reviewerMap.entries()).map(([rev, stat]) => {
    const isAllDone = stat.done === stat.total;
    const bg = isAllDone ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)';
    const color = isAllDone ? '#16a34a' : '#ca8a04';
    return `<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; padding:2px 8px; border-radius:12px; background:${bg}; color:${color}; font-weight:600;">` +
      `<span>${escapeHTML(rev)}:</span> <span>${stat.done}/${stat.total}</span>` +
    `</span>`;
  }).join(' ');

  return `
    <div class="rebuttal-progress-card" style="margin-bottom:14px; padding:12px 14px; background:hsl(var(--card-bg, 0 0% 100% / 0.7)); border:1px solid var(--border-color, rgba(0,0,0,0.08)); border-radius:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-weight:600; font-size:13px; color:hsl(var(--text-primary));">📊 ${escapeHTML(t('rebuttalProgressTitle') || '修回攻坚进度')}</span>
          <span class="badge ${percent === 100 ? 'badge-success' : 'badge-warning'}" style="font-size:11px;">${percent}% ${percent === 100 ? 'Completed' : 'In Progress'}</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          ${reviewerChips}
        </div>
      </div>
      <div style="width:100%; height:6px; background:rgba(0,0,0,0.08); border-radius:3px; overflow:hidden; margin-bottom:10px;">
        <div style="width:${percent}%; height:100%; background:linear-gradient(90deg, #3b82f6, #10b981); transition:width 0.3s ease;"></div>
      </div>
      <div style="display:flex; gap:16px; font-size:12px; color:var(--text-secondary); flex-wrap:wrap;">
        <span>${escapeHTML(t('rebuttalTotalComments') || '总意见')}: <strong>${total}</strong></span>
        <span style="color:#16a34a;">✔ ${escapeHTML(t('rebuttalAddressed') || '已答复')}: <strong>${addressed}</strong></span>
        ${clarified > 0 ? `<span style="color:#0d9488;">💬 ${escapeHTML(t('rebuttalClarified') || '已辩明')}: <strong>${clarified}</strong></span>` : ''}
        ${inProgress > 0 ? `<span style="color:#d97706;">⏳ ${escapeHTML(t('rebuttalInProgress') || '处理中')}: <strong>${inProgress}</strong></span>` : ''}
        <span style="color:${pending > 0 ? '#ea580c' : '#16a34a'};">⭕ ${escapeHTML(t('rebuttalPending') || '待答复')}: <strong>${pending}</strong></span>
        <span style="color:#0284c7;">📝 ${escapeHTML(t('rebuttalChangesNoted') || '已标定改动')}: <strong>${withChanges}</strong></span>
      </div>
    </div>
  `;
}

function generateRevisionCoverLetter(sub = {}, man = {}, format = 'html') {
  const paperTitle = man.title || sub.title || 'Untitled Manuscript';
  const journal = sub.targetJournal || 'the Journal';
  const authors = man.authors || getSubmissionFirstAuthor(sub, man) || 'The Authors';
  const firstAuthor = getSubmissionFirstAuthor(sub, man);
  const msId = sub.externalManuscriptId ? ` (Manuscript ID: ${sub.externalManuscriptId})` : '';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const rows = getSubmissionReviewMatrixRows(sub);
  const totalComments = rows.length;
  const reviewerSet = new Set(rows.map(r => r.reviewer || 'Reviewer').filter(Boolean));
  const reviewerCount = reviewerSet.size || 2;

  if (format === 'latex') {
    return `\\documentclass[11pt]{article}\n` +
      `\\usepackage[margin=1in]{geometry}\n` +
      `\\usepackage{charter}\n` +
      `\\usepackage{microtype}\n` +
      `\\usepackage{hyperref}\n\n` +
      `\\begin{document}\n\n` +
      `\\noindent ${safeEscapeLatex(dateStr)} \\\\[1.5em]\n` +
      `\\noindent To:\\\\ \n` +
      `The Editor-in-Chief / Handling Editor,\\\\ \n` +
      `\\textit{${safeEscapeLatex(journal)}}\\\\[1.5em]\n\n` +
      `\\noindent\\textbf{Subject: Submission of Revised Manuscript${safeEscapeLatex(msId)}}\\\\[0.5em]\n` +
      `\\textbf{Title:} \`\`${safeEscapeLatex(paperTitle)}''\\\\ \n` +
      `\\textbf{Authors:} ${safeEscapeLatex(authors)}\\\\[1.5em]\n\n` +
      `\\noindent Dear Editor,\\par\\medskip\n\n` +
      `\\noindent Thank you very much for your letter and the constructive comments from the editorial team and the ${reviewerCount} reviewers regarding our manuscript entitled \`\`\\textbf{${safeEscapeLatex(paperTitle)}}''${safeEscapeLatex(msId)}. We greatly appreciate the time and effort devoted to evaluating our work.\\par\\medskip\n\n` +
      `\\noindent We have carefully studied all comments and thoroughly revised the manuscript accordingly. In summary, the main revisions include:\\par\n` +
      `\\begin{itemize}\n` +
      `  \\item Fully addressing all ${totalComments} comments raised by the reviewers and editor, with corresponding textual and graphical updates.\n` +
      `  \\item Providing comprehensive experimental and analytical clarifications to strengthen the core arguments.\n` +
      `  \\item Highlighting all modifications in the revised manuscript and providing a detailed Point-by-Point Response document.\n` +
      `\\end{itemize}\\par\\medskip\n\n` +
      `\\noindent We confirm that all authors have approved this revised version and that the work has not been published or submitted elsewhere.\\par\\medskip\n\n` +
      `\\noindent We believe the revised manuscript has been substantially improved and now meets the high standards of \\textit{${safeEscapeLatex(journal)}}. We look forward to your favorable consideration.\\par\\vspace{2em}\n\n` +
      `\\noindent Sincerely,\\\\\n` +
      `\\noindent ${safeEscapeLatex(firstAuthor || authors)}\\\\ \n` +
      `\\noindent on behalf of all co-authors\n\n` +
      `\\end{document}\n`;
  }

  if (format === 'md') {
    return `# Cover Letter for Revised Manuscript\n\n` +
      `**Date:** ${dateStr}  \n` +
      `**To:** The Editor-in-Chief / Handling Editor, *${journal}*  \n` +
      `**Subject:** Submission of Revised Manuscript${msId}  \n` +
      `**Title:** "${paperTitle}"  \n` +
      `**Authors:** ${authors}  \n\n` +
      `---\n\n` +
      `Dear Editor,\n\n` +
      `Thank you very much for your editorial decision and the constructive feedback from the reviewers regarding our manuscript entitled **"${paperTitle}"**${msId} for publication in *${journal}*.\n\n` +
      `We have carefully considered all comments and carried out a comprehensive revision of our manuscript. Specifically:\n\n` +
      `- We have addressed all ${totalComments} comments and suggestions from the ${reviewerCount} reviewers and editor.\n` +
      `- Additional clarifications, analyses, and data have been integrated into the revised text and figures.\n` +
      `- All changes in the revised manuscript have been clearly highlighted, and our point-by-point responses are detailed in the accompanying rebuttal document.\n\n` +
      `All co-authors have reviewed and approved this revised manuscript. We confirm that this work is original and is not under consideration elsewhere.\n\n` +
      `We hope the revised manuscript is now suitable for publication in *${journal}*, and we look forward to hearing from you.\n\n` +
      `Sincerely,\n\n` +
      `**${firstAuthor || authors}**  \n` +
      `*(On behalf of all co-authors)*\n`;
  }

  // HTML format for Word / Rich Text
  return `<div style="font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5; color:#111827; max-width:760px; margin:0 auto; padding:24px;">` +
    `<p style="margin-bottom:16px;">${escapeHTML(dateStr)}</p>` +
    `<p style="margin-bottom:20px;">` +
      `To:<br>` +
      `The Editor-in-Chief / Handling Editor<br>` +
      `<em>${escapeHTML(journal)}</em>` +
    `</p>` +
    `<div style="background:#f8fafc; border-left:4px solid #0284c7; padding:12px 16px; margin-bottom:20px;">` +
      `<p style="margin:0 0 6px 0; font-weight:bold; font-size:13pt;">Subject: Submission of Revised Manuscript${escapeHTML(msId)}</p>` +
      `<p style="margin:0 0 4px 0;"><strong>Title:</strong> “${escapeHTML(paperTitle)}”</p>` +
      `<p style="margin:0;"><strong>Authors:</strong> ${escapeHTML(authors)}</p>` +
    `</div>` +
    `<p style="margin-bottom:14px;">Dear Editor,</p>` +
    `<p style="margin-bottom:14px;">` +
      `Thank you very much for your letter and the constructive comments from the reviewers regarding our manuscript entitled ` +
      `<strong>“${escapeHTML(paperTitle)}”</strong>${escapeHTML(msId)}. We are grateful to the editorial team and the ${reviewerCount} reviewers for their valuable suggestions to strengthen our work.` +
    `</p>` +
    `<p style="margin-bottom:10px;">` +
      `We have carefully evaluated all feedback and thoroughly revised our manuscript. In particular:` +
    `</p>` +
    `<ul style="margin:0 0 16px 24px; padding:0;">` +
      `<li style="margin-bottom:6px;">We have addressed all ${totalComments} comments raised by the reviewers and editor in detail.</li>` +
      `<li style="margin-bottom:6px;">We have expanded our explanations and integrated necessary additional evidence and figure updates into the manuscript.</li>` +
      `<li style="margin-bottom:6px;">All changes have been clearly highlighted in the revised manuscript, accompanied by our detailed Point-by-Point Response document.</li>` +
    `</ul>` +
    `<p style="margin-bottom:14px;">` +
      `All co-authors have approved this revised version, and we confirm that this manuscript is not under consideration elsewhere.` +
    `</p>` +
    `<p style="margin-bottom:24px;">` +
      `We hope that our revisions satisfactorily address the concerns raised and that the manuscript is now acceptable for publication in <em>${escapeHTML(journal)}</em>. We look forward to your decision.` +
    `</p>` +
    `<p style="margin:0;">Sincerely,</p>` +
    `<p style="margin:6px 0 0 0; font-weight:bold;">${escapeHTML(firstAuthor || authors)}</p>` +
    `<p style="margin:2px 0 0 0; font-style:italic; color:#4b5563;">On behalf of all co-authors</p>` +
  `</div>`;
}

function openBatchReviewImportModal(sub, reviewBox, onComplete) {
  openModal(`
    <div class="modal-header">
      <h2>✨ ${escapeHTML(t('batchImportTitle') || '智能批量解析导入审稿意见')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    <div style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">
      ${escapeHTML(t('batchImportHelp') || '将期刊审稿邮件或决定信全文直接粘贴至下方，智能解析器将自动按审稿人与编号拆分为独立意见条目。')}
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <label style="font-size:12px; font-weight:600;">${escapeHTML(currentLanguage === 'zh' ? '粘贴审稿信原始全文' : 'Raw Decision Letter / Review Text')}</label>
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:11px; color:var(--text-secondary);">${escapeHTML(currentLanguage === 'zh' ? '默认审稿人' : 'Default Reviewer')}:</span>
        <select id="batch-import-default-rev" style="font-size:11px; padding:2px 6px; border-radius:4px; border:1px solid var(--input-border); background:var(--input-bg); color:hsl(var(--text-primary));">
          <option value="Reviewer #1">Reviewer #1</option>
          <option value="Reviewer #2">Reviewer #2</option>
          <option value="Reviewer #3">Reviewer #3</option>
          <option value="Editor">Editor</option>
        </select>
      </div>
    </div>
    <textarea id="batch-import-textarea" rows="8" placeholder="${escapeHTML(t('batchImportPlaceholder') || 'Paste review comments here...')}" style="width:100%; box-sizing:border-box; font-family:inherit; font-size:12px; line-height:1.4; padding:8px; border:1px solid var(--input-border); border-radius:6px; background:var(--input-bg); color:hsl(var(--text-primary)); resize:vertical;"></textarea>
    
    <div id="batch-import-preview-container" style="margin-top:10px; max-height:160px; overflow-y:auto; border:1px solid var(--input-border); border-radius:6px; padding:10px; background:hsl(var(--card-bg, 0 0% 100% / 0.5));">
      <p style="font-size:12px; color:var(--text-secondary); margin:0;">${escapeHTML(currentLanguage === 'zh' ? '输入文本后在此实时预览解析结果...' : 'Parsed preview will appear here in real time...')}</p>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap; gap:8px;">
      <div id="batch-import-stats" style="font-size:12px; font-weight:600; color:var(--accent-blue, #0284c7);"></div>
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn-secondary" id="btn-batch-do-append">
          <span>➕ ${escapeHTML(t('batchImportAppend') || '追加导入')}</span>
        </button>
        <button type="button" class="btn-primary" id="btn-batch-do-replace">
          <span>🔄 ${escapeHTML(t('batchImportReplace') || '覆盖替换现有')}</span>
        </button>
      </div>
    </div>
  `);

  const textarea = document.getElementById('batch-import-textarea');
  const defaultRevSelect = document.getElementById('batch-import-default-rev');
  const previewContainer = document.getElementById('batch-import-preview-container');
  const statsEl = document.getElementById('batch-import-stats');

  let currentParsed = [];

  function updatePreview() {
    if (!textarea || !defaultRevSelect || !previewContainer || !statsEl) return;
    const raw = textarea.value;
    const defRev = defaultRevSelect.value;
    currentParsed = parseReviewCommentsBatch(raw, defRev);
    if (currentParsed.length === 0) {
      previewContainer.innerHTML = `<p style="font-size:12px; color:var(--text-secondary); margin:0;">${escapeHTML(currentLanguage === 'zh' ? '未解析到有效意见条目。请粘贴文本。' : 'No comments detected. Please paste text.')}</p>`;
      statsEl.textContent = '';
      return;
    }
    const revCount = new Set(currentParsed.map(p => p.reviewer)).size;
    statsEl.textContent = tf('batchImportParsedSummary', { comments: currentParsed.length, reviewers: revCount }) ||
      (currentLanguage === 'zh' ? `已识别到 ${currentParsed.length} 条意见（来自 ${revCount} 位审稿人/编辑）` : `Detected ${currentParsed.length} comments across ${revCount} reviewer(s).`);

    previewContainer.innerHTML = currentParsed.map((item, idx) => `
      <div style="margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid rgba(0,0,0,0.06); font-size:11px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
          <span class="badge badge-purple" style="font-size:10px;">${escapeHTML(item.reviewer)}</span>
          <strong>#${idx + 1}</strong>
        </div>
        <div style="color:var(--text-secondary); max-height:40px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${escapeHTML(item.comment)}
        </div>
      </div>
    `).join('');
  }

  textarea?.addEventListener('input', updatePreview);
  defaultRevSelect?.addEventListener('change', updatePreview);

  function executeImport(mode) {
    if (!currentParsed || currentParsed.length === 0) {
      showGlobalToast(t('batchImportEmptyToast') || '请先粘贴待解析的审稿文本', 'warning');
      return;
    }
    const emptyState = reviewBox.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    if (mode === 'replace') {
      window.RFUI.setHTML(reviewBox, '');
    }

    const currentCount = reviewBox.querySelectorAll('.submission-edit-review-row').length;
    currentParsed.forEach((item, index) => {
      reviewBox.appendChild(createSubmissionReviewEditorRow(item, currentCount + index));
    });

    reindexSubmissionReviewEditorRows(reviewBox);
    if (typeof onComplete === 'function') onComplete();
    reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', {
      bubbles: true,
      detail: { immediate: true }
    }));
    closeModal();
    showGlobalToast(tf('batchImportSuccessToast', { count: currentParsed.length }) || (currentLanguage === 'zh' ? `成功解析并导入 ${currentParsed.length} 条审稿意见！` : `Successfully imported ${currentParsed.length} comments.`), 'success');
  }

  document.getElementById('btn-batch-do-append')?.addEventListener('click', () => executeImport('append'));
  document.getElementById('btn-batch-do-replace')?.addEventListener('click', () => executeImport('replace'));
}

if (typeof window !== 'undefined') {
  window.RFAcademicExport = {
    generateAcademicRebuttalLetter,
    generateRevisionCoverLetter,
    parseReviewCommentsBatch,
    renderRebuttalProgressTracker,
    escapeLatexText,
    copyRebuttalRichText
  };
}

function renderSubmissionDetails(sub) {
  submissionAutoSaveCleanup?.();
  sub.status = normalizeSubmissionStatus(sub.status);
  normalizeSubmissionTimeline(sub);
  const detailPanel = document.getElementById('submission-detail-panel');
  const man = (db.manuscripts || []).find(m => m.id === sub.manuscriptId);
  const project = (db.projects || []).find(item => item.id === (sub.projectId || man?.projectId)) || null;
  const relationship = window.RFUI.buildSubmissionRelationshipSummary({
    submission: sub,
    manuscript: man,
    project,
    records: db.researchRecords || []
  });
  const manuscriptTitle = man ? man.title : (sub.title || t('untitledManuscript'));
  const manAbstract = man ? man.abstract || '' : '';
  const firstAuthor = getSubmissionFirstAuthor(sub, man);
  const journalName = getSubmissionJournalName(sub);
  const submissionJournalUrl = sub.journalUrl || sub.submissionUrl || '';
  const submissionDoi = getSubmissionDoi(sub);
  const articleUrl = getSubmissionArticleUrl(sub);
  const timelineAnalysis = analyzeSubmission(sub);
  const timelineSubmissionDate = normalizeDateString(sub.submissionDate || timelineAnalysis.submitDate);
  const timelineFirstDecisionDate = normalizeDateString(sub.firstDecisionDate || timelineAnalysis.r1Date);
  const timelineRevisionDueDate = normalizeDateString(sub.revisionDueDate);
  const timelineDecisionDate = normalizeDateString(sub.decisionDate || timelineAnalysis.acceptDate || timelineAnalysis.onlineDate);
  const statusText = getSubmissionStatusLabel(sub.status || 'submitted');
  const statusBadgeClass = window.RFUI.getSubmissionStatusBadgeClass(sub.status || 'submitted');

  // Cycle time duration calculations
  const cycle = getSubmissionCycleTime(sub);
  let cycleTimeHtml = '';

  let countdownPillHtml = '';
  if (sub.revisionDueDate) {
    const cd = window.RFCalendar?.getRevisionCountdownMeta ? window.RFCalendar.getRevisionCountdownMeta(sub.revisionDueDate) : null;
    if (cd) {
      countdownPillHtml = `
        <span class="${escapeHTML(cd.badgeClass)}" id="btn-export-submission-ics" style="display:inline-flex; align-items:center; gap:5px; font-weight:600; cursor:pointer; padding:2px 8px; border-radius:4px;" title="${escapeHTML(currentLanguage === 'zh' ? '点击导出修回截止日历提醒 (.ics)' : 'Click to export revision deadline (.ics)')}">
          <span>${escapeHTML(cd.icon)} ${escapeHTML(cd.text)}</span>
          <span style="font-size:10px; opacity:0.85; text-decoration:underline;">📅 .ics</span>
        </span>
      `;
    }
  }

  if (cycle.isCompleted) {
    cycleTimeHtml = `
      <div class="submission-cycle-card submission-cycle-card-complete" data-submission-cycle-card>
        <span class="submission-cycle-icon" aria-hidden="true">
          <svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <div class="submission-cycle-copy">
          <span class="submission-cycle-label" data-submission-cycle-label>${escapeHTML(t('cycleTimeCompleted'))}</span>
          <span data-submission-cycle-text>${tf('cycleTimeCompletedText', { start: `<strong>${escapeHTML(cycle.startDateStr)}</strong>`, end: `<strong>${escapeHTML(cycle.endDateStr)}</strong>`, days: `<strong>${cycle.days}</strong>` })}</span>
        </div>
      </div>
    `;
  } else {
    cycleTimeHtml = `
      <div class="submission-cycle-card submission-cycle-card-active" data-submission-cycle-card>
        <span class="submission-cycle-icon" aria-hidden="true">
          <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
        </span>
        <div class="submission-cycle-copy">
          <span class="submission-cycle-label" data-submission-cycle-label>${escapeHTML(t('submissionCycleTracking'))}</span>
          <span data-submission-cycle-text>${tf('submissionCycleText', { start: `<strong>${escapeHTML(cycle.startDateStr)}</strong>`, days: `<strong>${cycle.days}</strong>` })}</span>
        </div>
      </div>
    `;
  }

  window.RFUI.setHTML(detailPanel, `
    <div class="submission-detail-hero">
      <div class="submission-detail-heading">
        <span class="submission-detail-kicker">${escapeHTML(t('submissionDetailKicker'))}</span>
        <h2>${escapeHTML(journalName)}</h2>
        ${sub.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:11px; font-weight:600; width:fit-content; margin-top:3px;">ID: ${escapeHTML(sub.externalManuscriptId)}</span>` : ''}
      </div>
      <button class="btn-danger btn-icon submission-delete-button" id="btn-delete-sub" title="${escapeHTML(t('deleteSubmissionTitle'))}">
        <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>

    <!-- Timeline indicators -->
    <div class="submission-detail-meta" style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
      <span class="${statusBadgeClass}" data-submission-status-badge="stage">${escapeHTML(t('currentStageLabel'))}: ${escapeHTML(statusText)}</span>
      ${countdownPillHtml}
      <span class="recent-item-date">${escapeHTML(t('trackedSinceLabel'))}: ${sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : t('noDate')}</span>
    </div>

    <div class="glass-card workflow-context-card" data-submission-workflow-context="true">
      <div class="workflow-context-head">
        <div class="submission-work-title">
          <span class="submission-work-icon" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M5 8h14"/><path d="M5 16h14"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/></svg>
          </span>
          <div>
            <h3>${escapeHTML(t('workflowContextTitle'))}</h3>
          </div>
        </div>
        <div class="workflow-context-actions">
          ${relationship.isOrphanSubmission ? `
            <span class="badge badge-warning">${escapeHTML(t('workflowNeedsLinking'))}</span>
            <button type="button" class="btn-secondary workflow-link-button" id="btn-link-submission-manuscript">
              ${escapeHTML(t('linkManuscript'))}
            </button>
          ` : `<span class="badge badge-success">${escapeHTML(t('workflowLinkedFlow'))}</span>`}
          <button type="button" class="btn-secondary workflow-edit-summary-button" id="btn-focus-edit-center" aria-controls="submission-entry-editor-panel">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <span>${escapeHTML(t('jumpToEditor'))}</span>
          </button>
        </div>
      </div>
      <div class="workflow-context-grid">
        <div class="workflow-context-item">
          <span>${escapeHTML(t('workflowManuscriptLabel'))}</span>
          <strong>${escapeHTML(relationship.manuscriptTitle)}</strong>
        </div>
        <div class="workflow-context-item">
          <span>${escapeHTML(t('workflowTimelineLabel'))}</span>
          <strong>${relationship.completedTimelineNodeCount}/${relationship.timelineNodeCount}</strong>
        </div>
        <div class="workflow-context-item">
          <span>${escapeHTML(t('workflowReviewerCommentsLabel'))}</span>
          <strong>${relationship.reviewerCommentCount}</strong>
        </div>
      </div>
    </div>

    <div class="glass-card submission-edit-center submission-entry-editor-card" id="submission-entry-editor-panel" data-side-entry-editor="true">
      <div class="submission-edit-center-head">
        <div class="submission-edit-title-row">
          <span class="submission-edit-emblem" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="18" x2="13" y2="18"/></svg>
          </span>
          <div>
            <h3>${escapeHTML(t('submissionEntryEditorTitle'))}</h3>
            <p>${escapeHTML(t('submissionEntryEditorHelp'))}</p>
          </div>
        </div>
        <div class="submission-edit-badges">
          <span class="badge badge-purple">${escapeHTML(man ? t('linkedManuscriptBadge') : t('detachedSubmissionBadge'))}</span>
          <span class="${statusBadgeClass}" data-submission-status-badge="editor">${escapeHTML(statusText)}</span>
          ${articleUrl ? `<a class="doi-link" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${t('articlePage')}</a>` : ''}
          ${man?.zoteroItemKey ? `
            <span class="zotero-card-badge" id="sub-detail-zotero-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 文献库中选中此条目' : 'Select in Zotero library')}">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
              Zotero
            </span>
            ${man.citekey ? `<span class="zotero-citekey-badge" id="sub-detail-citekey-badge" data-citekey="${escapeHTML(man.citekey)}" title="${escapeHTML(currentLanguage === 'zh' ? '点击复制 Citation Key' : 'Click to copy Citation Key')}">[@${escapeHTML(man.citekey)}]</span>` : ''}
            ${man.pdfUri ? `<span class="zotero-pdf-badge" id="sub-detail-pdf-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 阅读器中打开 PDF' : 'Open PDF in Zotero reader')}">📖 PDF</span>` : ''}
          ` : ''}
        </div>
      </div>

      <div class="submission-edit-section">
        <div class="submission-edit-section-head">
          <span class="submission-edit-section-icon" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </span>
          <span>${escapeHTML(t('manuscriptSection'))}</span>
        </div>
        <div class="submission-edit-grid submission-edit-grid-identity">
          <div class="form-group submission-edit-title-field">
            <label>${escapeHTML(t('manuscriptTitleLabel'))}</label>
            <input type="text" id="sub-edit-title" value="${escapeHTML(manuscriptTitle)}" placeholder="${escapeHTML(t('paperTitlePlaceholder'))}">
          </div>
          <div class="form-group">
            <label>${t('targetJournalInput')}</label>
            <input type="text" id="sub-edit-journal" value="${escapeHTML(journalName)}" placeholder="${escapeHTML(t('targetJournalInput'))}">
          </div>
          <div class="form-group">
            <label>${escapeHTML(t('externalManuscriptIdLabel') || '稿件编号 (Manuscript ID)')}</label>
            <input type="text" id="sub-edit-external-id" value="${escapeHTML(sub.externalManuscriptId || '')}" placeholder="${escapeHTML(t('externalManuscriptIdPlaceholder') || '例如: AFM-2026-08123')}">
          </div>
          <div class="form-group">
            <label>${escapeHTML(t('submissionPortalUrl'))}</label>
            <input type="url" id="sub-edit-journal-url" value="${escapeHTML(submissionJournalUrl)}" placeholder="https://...">
          </div>
          <div class="form-group">
            <label>${t('status')}</label>
            <select id="sub-edit-status">
              <option value="submitted" ${sub.status === 'submitted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('submitted'))}</option>
              <option value="under_review" ${sub.status === 'under_review' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('under_review'))}</option>
              <option value="revision" ${sub.status === 'revision' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('revision'))}</option>
              <option value="accepted" ${sub.status === 'accepted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('accepted'))}</option>
              <option value="published" ${sub.status === 'published' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('published'))}</option>
              <option value="rejected" ${sub.status === 'rejected' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('rejected'))}</option>
            </select>
          </div>
        </div>
        <details class="submission-author-details">
          <summary>${escapeHTML(t('firstAuthorLabel'))}</summary>
        <div class="submission-first-author-module">
          <div class="submission-first-author-identity">
            <span class="submission-first-author-index" aria-hidden="true">1</span>
            <div>
              <label for="sub-edit-first-author">${escapeHTML(t('firstAuthorLabel'))}</label>
              <small>${escapeHTML(t('firstAuthorHelp'))}</small>
            </div>
          </div>
          <input type="text" id="sub-edit-first-author" value="${escapeHTML(firstAuthor)}" placeholder="${escapeHTML(t('firstAuthorPlaceholder'))}">
        </div>
        </details>
      </div>

      <div class="submission-edit-section">
        <div class="submission-edit-section-head">
          <span class="submission-edit-section-icon" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
          <span>${escapeHTML(t('reviewTimingSection'))}</span>
        </div>
        <div class="submission-edit-grid submission-edit-grid-dates">
          <div class="form-group">
            <label>${t('initialSubmissionDate')}</label>
            <input type="date" id="sub-edit-submission-date" value="${escapeHTML(timelineSubmissionDate)}">
          </div>
          <div class="form-group">
            <label>${t('firstDecisionDate')}</label>
            <input type="date" id="sub-edit-r1-date" value="${escapeHTML(timelineFirstDecisionDate)}">
          </div>
          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <label for="sub-edit-revision-due">${t('revisionDueDateLabel')}</label>
              ${timelineRevisionDueDate ? `<button type="button" class="btn-secondary" id="btn-editor-due-ics" style="font-size:11px; padding:1px 6px; border-radius:3px; height:20px;" title="${escapeHTML(t('exportCalendarIcs') || '导出修回日历 (.ics)')}">📅 .ics</button>` : ''}
            </div>
            <input type="date" id="sub-edit-revision-due" value="${escapeHTML(timelineRevisionDueDate)}">
          </div>
          <div class="form-group">
            <label>${t('completionDate')} / ${t('stateAccepted')}</label>
            <input type="date" id="sub-edit-decision-date" value="${escapeHTML(timelineDecisionDate)}">
          </div>
        </div>
      </div>

      <div class="submission-edit-section">
        <div class="submission-edit-section-head">
          <span class="submission-edit-section-icon" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.43"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.33-1.33"/></svg>
          </span>
          <span>${escapeHTML(t('publicationSection'))}</span>
        </div>
        <div class="submission-edit-grid submission-edit-grid-publication">
          <div class="form-group">
            <label>${t('doiLabel')}</label>
            <input type="text" id="sub-edit-doi" value="${escapeHTML(submissionDoi)}" placeholder="10.1002/adfm.202528029">
          </div>
          <div class="form-group">
            <label>${t('articleUrlLabel')}</label>
            <input type="url" id="sub-edit-article-url" value="${escapeHTML(articleUrl)}" placeholder="${t('articleUrlPlaceholder')}">
          </div>
        </div>
      </div>

      <div class="submission-edit-section submission-edit-checklist-section">
        <div class="submission-edit-section-head submission-edit-section-head-row">
          <div class="submission-edit-section-title">
            <span class="submission-edit-section-icon" aria-hidden="true">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </span>
            <span>${escapeHTML(t('submissionChecklistSection'))}</span>
          </div>
        </div>
        <div class="submission-checklist-grid submission-edit-checklist-grid" id="sub-edit-compliance-checklist-container"></div>
      </div>

      <div class="submission-edit-section submission-edit-review-section">
        <div class="submission-edit-section-head submission-edit-section-head-row">
          <div class="submission-edit-section-title">
            <span class="submission-edit-section-icon" aria-hidden="true">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>
            </span>
            <span>${escapeHTML(t('peerReviewMatrixSection'))}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="btn-secondary submission-work-button" id="btn-batch-import-reviews">
              <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
              <span>${escapeHTML(t('smartBatchImport') || '智能批量导入')}</span>
            </button>
            <button type="button" class="btn-primary submission-work-button" id="btn-add-review-comment">
              <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>${escapeHTML(t('addComment'))}</span>
            </button>
          </div>
        </div>
        <div class="submission-edit-review-help">${escapeHTML(t('reviewEditorHelp'))}</div>
        <div id="sub-edit-rebuttal-progress-container"></div>
        <div class="submission-edit-review-container" id="sub-edit-review-matrix-container"></div>
      </div>

      <div class="submission-edit-savebar">
        <p>${escapeHTML(t('timelineDateSource'))}: ${escapeHTML(timelineAnalysis.submitDateSource)}. ${escapeHTML(t('publicationLinksKept'))}</p>
        <div class="submission-autosave-status" data-submission-autosave-status data-state="saved" role="status" aria-live="polite">
          <span class="submission-autosave-dot" aria-hidden="true"></span>
          <span data-submission-autosave-label>${escapeHTML(t('autoSaveSaved'))}</span>
        </div>
      </div>
    </div>

    <div class="glass-card submission-action-card" style="margin-top: 12px;">
      <div class="submission-action-copy">
        <span class="submission-action-icon" aria-hidden="true">
          <svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 12h14"/><path d="m12 6 6 6-6 6"/><path d="M4 5v14"/></svg>
        </span>
        <div>
          <h3>${t('transferToJournal')}</h3>
          <p>${escapeHTML(t('transferRoundHelp'))}</p>
        </div>
      </div>
      <div class="submission-action-buttons">
        <button class="btn-secondary" id="btn-mark-sub-rejected">
          <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/></svg>
          <span>${t('markRejected')}</span>
        </button>
        <button class="btn-primary" id="btn-transfer-submission">
          <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11v11"/><path d="M18 7 6 19"/></svg>
          <span>${t('transferToJournal')}</span>
        </button>
        </div>
    </div>

    <!-- Cycle Time Stats Panel -->
    ${cycleTimeHtml}

    <!-- Saved review preview and exports -->
    <div class="glass-card submission-work-card submission-readonly-review-card" style="margin-top: 16px;">
      <div class="submission-work-head">
        <div class="submission-work-title">
          <span class="submission-work-icon" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>
          </span>
          <div>
            <h3>${escapeHTML(t('savedReviewPreviewTitle'))}</h3>
            <p>${escapeHTML(t('savedReviewPreviewHelp'))}</p>
          </div>
        </div>
        <div class="submission-work-actions">
          ${man?.zoteroItemKey ? `
          <button class="btn-secondary submission-work-button" id="btn-sync-submission-to-zotero" title="${escapeHTML(currentLanguage === 'zh' ? '同步审稿回复与修回矩阵至 Zotero 笔记' : 'Sync Review & Rebuttal Matrix to Zotero Note')}">
            <svg class="svg-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
            <span>${escapeHTML(currentLanguage === 'zh' ? '同步至 Zotero 笔记' : 'Sync to Zotero Note')}</span>
          </button>
          ` : ''}
          <button class="btn-secondary submission-work-button" id="btn-export-rebuttal-table">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>${escapeHTML(t('exportTable'))}</span>
          </button>
        </div>
      </div>
      <div class="submission-review-preview" id="submission-review-preview"></div>
    </div>
  `);

  const workflowContextCard = detailPanel.querySelector('[data-submission-workflow-context="true"]');
  const editCenter = detailPanel.querySelector('.submission-edit-center');
  if (workflowContextCard && editCenter && workflowContextCard.nextElementSibling !== editCenter) {
    workflowContextCard.insertAdjacentElement('afterend', editCenter);
  }
  if (workflowContextCard && !detailPanel.querySelector('.submission-edit-center')) {
    workflowContextCard.insertAdjacentHTML('afterend', `
      <div class="glass-card submission-edit-center submission-edit-center-error">
        <div class="submission-edit-center-head">
          <div class="submission-edit-title-row">
            <span class="submission-edit-emblem" aria-hidden="true">
              <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
            <div>
              <h3>${escapeHTML(t('editorRenderFailedTitle'))}</h3>
              <p>${escapeHTML(t('editorRenderFailedHelp'))}</p>
            </div>
          </div>
        </div>
      </div>
    `);
  }
  const editorMounted = Boolean(detailPanel.querySelector('#sub-edit-title') && detailPanel.querySelector('[data-submission-autosave-status]'));
  detailPanel.dataset.rfRenderVersion = RF_OPTIONS_RENDER_VERSION;
  detailPanel.dataset.rfEditorMounted = editorMounted ? 'true' : 'false';
  detailPanel.dataset.currentSubmissionId = sub.id;
  detailPanel.scrollTop = 0;

  document.getElementById('btn-link-submission-manuscript')?.addEventListener('click', () => {
    openLinkSubmissionModal(sub);
  });

  const focusEditButton = document.getElementById('btn-focus-edit-center');
  if (focusEditButton) {
    focusEditButton.addEventListener('click', (event) => {
      event.preventDefault();
      focusSubmissionEditCenter();
    });
  }

  document.getElementById('btn-mark-sub-rejected')?.addEventListener('click', async () => {
    if (!confirm(t('confirmMarkRejected'))) return;
    markSubmissionRejected(sub, todayString());
    syncManuscriptStatusFromSubmission(sub);
    await window.storage.saveAll(db);
    renderDashboard();
    renderKanban();
    renderSubmissions();
    renderSubmissionDetails(sub);
    showGlobalToast(t('rejectedToast'), 'success');
  });

  document.getElementById('btn-transfer-submission')?.addEventListener('click', () => {
    openTransferSubmissionModal(sub);
  });

  // Delete submission
  document.getElementById('btn-delete-sub')?.addEventListener('click', async () => {
    if (confirm(t('confirmDeleteSubmission'))) {
      window.storage.recordEntityDeletion(db, 'submissions', sub.id);
      syncManuscriptStatusesFromSubmissions(db);
      selectedSubmissionId = null;
      await window.storage.saveAll(db);
      renderDashboard();
      renderKanban();
      renderSubmissions();
      window.RFUI.setHTML(document.getElementById('submission-detail-panel'), `
        <div class="empty-state">
          <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <h3>${escapeHTML(t('submissionEmptyDetail'))}</h3>
        </div>
      `);
    }
  });

  const checklistKeys = getSubmissionChecklistKeys(sub);
  renderSubmissionChecklistEditor(sub, checklistKeys);
  renderSubmissionReviewMatrixEditor(sub, manAbstract);
  renderSubmissionReviewPreview(sub, checklistKeys);
  setupSubmissionAutoSave(sub);

  const btnSyncSubZotero = document.getElementById('btn-sync-submission-to-zotero');
  if (btnSyncSubZotero) {
    btnSyncSubZotero.addEventListener('click', async () => {
      if (typeof ZoteroBridge !== 'undefined' && man?.zoteroItemKey) {
        btnSyncSubZotero.disabled = true;
        try {
          const ok = await ZoteroBridge.syncNote(man.zoteroItemKey);
          if (ok) {
            showGlobalToast(currentLanguage === 'zh' ? '已成功同步审稿记录与修回矩阵至 Zotero 笔记' : 'Successfully synced review & rebuttal matrix to Zotero note', 'success');
          } else {
            showGlobalToast(currentLanguage === 'zh' ? '同步至 Zotero 笔记失败：条目可能为只读或在回收站' : 'Failed to sync to Zotero note: item may be read-only or in trash', 'error');
          }
        } catch (e) {
          showGlobalToast(String(e.message || e), 'error');
        }
        setTimeout(() => { btnSyncSubZotero.disabled = false; }, 1200);
      }
    });
  }

  const subZoteroBadge = detailPanel.querySelector('#sub-detail-zotero-badge');
  if (subZoteroBadge) {
    subZoteroBadge.addEventListener('click', () => {
      if (man?.zoteroItemKey && typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.selectItemInZotero(man.zoteroItemKey);
      }
    });
  }

  const subCitekeyBadge = detailPanel.querySelector('#sub-detail-citekey-badge');
  if (subCitekeyBadge && man?.citekey) {
    subCitekeyBadge.addEventListener('click', () => {
      if (typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.copyText(`[@${man.citekey}]`, currentLanguage === 'zh' ? `已复制 Citation Key: [@${man.citekey}]` : `Copied Citation Key: [@${man.citekey}]`);
      }
    });
  }

  const subPdfBadge = detailPanel.querySelector('#sub-detail-pdf-badge');
  if (subPdfBadge) {
    subPdfBadge.addEventListener('click', () => {
      if (man?.zoteroItemKey && typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.openPdf(man.zoteroItemKey);
      }
    });
  }

  // Action: Export Submission Revision Deadline .ics
  const triggerSubIcs = () => {
    if (!sub.revisionDueDate) {
      showGlobalToast(currentLanguage === 'zh' ? '请先设置修回截止日期' : 'Please set revision due date first', 'warning');
      return;
    }
    if (window.RFCalendar?.generateSubmissionCalendarFeed && window.RFCalendar?.triggerCalendarDownload) {
      const feed = window.RFCalendar.generateSubmissionCalendarFeed([sub], db.manuscripts, { calName: `${journalName} Revision Deadline` });
      window.RFCalendar.triggerCalendarDownload(feed, `revision_deadline_${sub.id}.ics`);
      showGlobalToast(t('calendarExportedToast') || (currentLanguage === 'zh' ? '修回截止日历 (.ics) 已导出！' : 'Revision deadline calendar (.ics) exported.'), 'success');
    }
  };
  detailPanel.querySelector('#btn-export-submission-ics')?.addEventListener('click', triggerSubIcs);
  detailPanel.querySelector('#btn-editor-due-ics')?.addEventListener('click', triggerSubIcs);

  // Action: Export Standard Academic Rebuttal Matrix & Response Letter
  document.getElementById('btn-export-rebuttal-table')?.addEventListener('click', () => {
    const savedReviewRows = getSubmissionReviewMatrixRows(sub);
    if (savedReviewRows.length === 0) {
      showGlobalToast(t('noReviewerCommentsExport'), 'warning');
      return;
    }

    const wordHtml = generateAcademicRebuttalLetter(sub, man, 'word');
    const mdCode = generateAcademicRebuttalLetter(sub, man, 'md');
    const latexCode = generateAcademicRebuttalLetter(sub, man, 'latex');
    const tableCode = generateAcademicRebuttalLetter(sub, man, 'table');
    const coverHtml = generateRevisionCoverLetter(sub, man, 'html');
    const coverMd = generateRevisionCoverLetter(sub, man, 'md');
    const coverLatex = generateRevisionCoverLetter(sub, man, 'latex');

    openModal(`
      <div class="modal-header">
        <h2>📋 ${escapeHTML(t('exportAcademicMatrixTitle') || (currentLanguage === 'zh' ? '导出标准学术审稿回复信与修回矩阵' : 'Export Response Letter & Rebuttal Matrix'))}</h2>
        <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
      </div>
      <div style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">
        ${escapeHTML(currentLanguage === 'zh' ? `共检测到 ${savedReviewRows.length} 条审稿意见与回复。支持直接复制 Word 富文本 (保留格式、排版与表格)、学术 Markdown 模版、编译版 LaTeX 答复信或配套修回投稿信。` : `Detected ${savedReviewRows.length} comments and responses. Export formatted Word text, academic Markdown, LaTeX response letter, or revision cover letter.`)}
      </div>
      <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
        <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-word" style="font-size:12px; font-weight:600; padding:5px 12px; border-color:#e11d48; color:#e11d48;">📄 ${escapeHTML(t('exportTabWord') || 'Word / 富文本 (带格式)')}</button>
        <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-md" style="font-size:12px; font-weight:600; padding:5px 12px;">📝 ${escapeHTML(t('exportTabMarkdown') || '学术 Markdown 模版')}</button>
        <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-latex" style="font-size:12px; font-weight:600; padding:5px 12px;">📑 ${escapeHTML(t('exportTabLatex') || 'LaTeX 宏包答复信 (.tex)')}</button>
        <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-table" style="font-size:12px; font-weight:600; padding:5px 12px;">📊 ${escapeHTML(t('exportTabTable') || '意见矩阵汇总表')}</button>
        <button type="button" class="btn-secondary modal-format-tab" id="modal-tab-cover" style="font-size:12px; font-weight:600; padding:5px 12px;">✉ ${escapeHTML(t('revisionCoverLetterTab') || '修回投稿自述信')}</button>
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <div id="rebuttal-word-preview-box" style="display:block; max-height:280px; overflow-y:auto; border:1px solid var(--input-border); border-radius:6px; padding:14px; background:#ffffff; color:#111827;"></div>
        <textarea id="rebuttal-export-preview" rows="12" readonly style="display:none; font-family:monospace; font-size:11px; line-height:1.5; width:100%; box-sizing:border-box; background:var(--input-bg); color:hsl(var(--text-primary)); border:1px solid var(--input-border); border-radius:6px; resize:vertical;"></textarea>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:14px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn-primary" id="btn-copy-rebuttal-word" style="font-size:12px;">
            <span>📋 ${escapeHTML(currentLanguage === 'zh' ? '复制富文本 (直接粘贴至 Word / WPS)' : 'Copy Rich Text (Paste to Word)')}</span>
          </button>
          <button type="button" class="btn-secondary" id="btn-copy-rebuttal-code" style="font-size:12px;">
            <span>📋 ${escapeHTML(currentLanguage === 'zh' ? '复制当前代码' : 'Copy Code')}</span>
          </button>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn-secondary" id="btn-download-tex" style="font-size:12px;">
            <span>💾 ${escapeHTML(t('downloadTex') || '下载 .tex 文件')}</span>
          </button>
          <button type="button" class="btn-secondary" id="btn-download-md" style="font-size:12px;">
            <span>💾 ${escapeHTML(t('downloadMd') || '下载 .md 文件')}</span>
          </button>
          <button type="button" class="btn-secondary" id="btn-download-doc" style="font-size:12px;">
            <span>💾 ${escapeHTML(t('downloadDoc') || '下载 Word 兼容文件')}</span>
          </button>
        </div>
      </div>
    `);

    let currentFormat = 'word';
    const previewArea = document.getElementById('rebuttal-export-preview');
    const wordBox = document.getElementById('rebuttal-word-preview-box');
    const tabWord = document.getElementById('modal-tab-word');
    const tabMd = document.getElementById('modal-tab-md');
    const tabLatex = document.getElementById('modal-tab-latex');
    const tabTable = document.getElementById('modal-tab-table');
    const tabCover = document.getElementById('modal-tab-cover');
    const tabs = [
      { id: 'word', el: tabWord },
      { id: 'md', el: tabMd },
      { id: 'latex', el: tabLatex },
      { id: 'table', el: tabTable },
      { id: 'cover', el: tabCover }
    ];

    const updatePreview = () => {
      tabs.forEach(tItem => {
        if (!tItem.el) return;
        if (tItem.id === currentFormat) {
          tItem.el.style.borderColor = '#e11d48';
          tItem.el.style.color = '#e11d48';
        } else {
          tItem.el.style.borderColor = 'var(--input-border)';
          tItem.el.style.color = 'hsl(var(--text-primary))';
        }
      });

      if (currentFormat === 'word') {
        if (wordBox) {
          wordBox.style.display = 'block';
          window.RFUI.setHTML(wordBox, wordHtml);
        }
        if (previewArea) previewArea.style.display = 'none';
      } else if (currentFormat === 'cover') {
        if (wordBox) {
          wordBox.style.display = 'block';
          window.RFUI.setHTML(wordBox, coverHtml);
        }
        if (previewArea) previewArea.style.display = 'none';
      } else {
        if (wordBox) wordBox.style.display = 'none';
        if (previewArea) {
          previewArea.style.display = 'block';
          if (currentFormat === 'md') previewArea.value = mdCode;
          else if (currentFormat === 'latex') previewArea.value = latexCode;
          else if (currentFormat === 'table') previewArea.value = tableCode;
        }
      }
    };
    updatePreview();

    tabWord?.addEventListener('click', () => { currentFormat = 'word'; updatePreview(); });
    tabMd?.addEventListener('click', () => { currentFormat = 'md'; updatePreview(); });
    tabLatex?.addEventListener('click', () => { currentFormat = 'latex'; updatePreview(); });
    tabTable?.addEventListener('click', () => { currentFormat = 'table'; updatePreview(); });
    tabCover?.addEventListener('click', () => { currentFormat = 'cover'; updatePreview(); });

    document.getElementById('btn-copy-rebuttal-word')?.addEventListener('click', async () => {
      const activeHtml = currentFormat === 'cover' ? coverHtml : wordHtml;
      const activeText = currentFormat === 'cover' ? coverMd : mdCode;
      await copyRebuttalRichText(activeHtml, activeText);
      showGlobalToast(t('copyWordSuccess') || (currentLanguage === 'zh' ? '已复制 Word 富文本至剪贴板！可直接粘贴至 Word / WPS。' : 'Copied rich text to clipboard! Ready to paste into Word.'), 'success');
    });

    document.getElementById('btn-copy-rebuttal-code')?.addEventListener('click', () => {
      let codeToCopy = mdCode;
      if (currentFormat === 'cover') codeToCopy = coverMd;
      else if (currentFormat === 'latex') codeToCopy = latexCode;
      else if (currentFormat === 'word') codeToCopy = wordHtml;
      else if (currentFormat === 'table') codeToCopy = tableCode;

      if (typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.copyText(codeToCopy, t('copyCodeSuccess') || (currentLanguage === 'zh' ? '已复制到剪贴板！' : 'Copied to clipboard!'));
      } else {
        navigator.clipboard?.writeText(codeToCopy);
        showGlobalToast(t('copyCodeSuccess') || (currentLanguage === 'zh' ? '已复制到剪贴板！' : 'Copied to clipboard!'), 'success');
      }
    });

    const triggerDownload = (content, filename, mimeType) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const getExportFilename = (prefix, ext) => {
      const safeId = String(sub.externalManuscriptId || sub.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${prefix}_${safeId}.${ext}`;
    };

    document.getElementById('btn-download-tex')?.addEventListener('click', () => {
      const content = currentFormat === 'cover' ? coverLatex : latexCode;
      const name = currentFormat === 'cover' ? getExportFilename('cover_letter', 'tex') : getExportFilename('rebuttal_letter', 'tex');
      triggerDownload(content, name, 'text/plain;charset=utf-8');
      showGlobalToast(t('latexDownloaded'), 'success');
    });

    document.getElementById('btn-download-md')?.addEventListener('click', () => {
      const content = currentFormat === 'cover' ? coverMd : mdCode;
      const name = currentFormat === 'cover' ? getExportFilename('cover_letter', 'md') : getExportFilename('rebuttal_letter', 'md');
      triggerDownload(content, name, 'text/markdown;charset=utf-8');
      showGlobalToast(currentLanguage === 'zh' ? '已下载学术 Markdown 模版' : 'Downloaded Markdown document', 'success');
    });

    document.getElementById('btn-download-doc')?.addEventListener('click', () => {
      const content = currentFormat === 'cover' ? coverHtml : wordHtml;
      const name = currentFormat === 'cover' ? getExportFilename('cover_letter', 'doc') : getExportFilename('rebuttal_letter', 'doc');
      triggerDownload(content, name, 'application/msword;charset=utf-8');
      showGlobalToast(currentLanguage === 'zh' ? '已下载 Word 兼容文件' : 'Downloaded Word document', 'success');
    });
  });
}

function openTransferSubmissionModal(sourceSub) {
  const sourceJournal = getSubmissionJournalName(sourceSub);
  const today = todayString();
  openModal(`
    <div class="modal-header">
      <h2>${t('transferSubmissionTitle')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>

    <div class="glass-card" style="margin-bottom:12px;">
      <p style="font-size:12px; margin:0;">${escapeHTML(t('currentJournalLabel'))}: <strong>${escapeHTML(sourceJournal)}</strong></p>
      <p class="text-muted" style="font-size:11px; margin-top:4px;">${escapeHTML(t('transferModalHelp'))}</p>
    </div>

    <div class="grid-cols-2" style="gap:10px;">
      <div class="form-group">
        <label>${t('rejectionDate')}</label>
        <input type="date" id="transfer-rejection-date" value="${today}">
      </div>
      <div class="form-group">
        <label>${t('milestoneSubmission')}</label>
        <input type="date" id="transfer-submission-date" value="${today}">
      </div>
    </div>

    <div class="form-group">
      <label>${t('newTargetJournal')}</label>
      <input type="text" id="transfer-target-journal" placeholder="${escapeHTML(t('targetJournalPlaceholder'))}">
    </div>

    <div class="form-group">
      <label>${escapeHTML(t('submissionPortalUrl'))}</label>
      <input type="url" id="transfer-journal-url" placeholder="https://...">
    </div>

    <div class="form-group">
      <label>${t('rejectionNote')}</label>
      <textarea id="transfer-rejection-note" rows="3" placeholder="${escapeHTML(t('rejectionNotePlaceholder'))}"></textarea>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-cancel-transfer">${escapeHTML(t('cancel') || '取消')}</button>
      <button type="button" class="btn-primary" id="btn-create-transfer-sub" style="min-width:130px;">${t('transferButton')}</button>
    </div>
  `);

  document.getElementById('btn-cancel-transfer')?.addEventListener('click', closeModal);

  document.getElementById('btn-create-transfer-sub').addEventListener('click', async () => {
    const targetJournal = document.getElementById('transfer-target-journal').value.trim();
    const rejectionDate = document.getElementById('transfer-rejection-date').value || today;
    const submissionDate = document.getElementById('transfer-submission-date').value || today;
    const journalUrl = document.getElementById('transfer-journal-url').value.trim();
    const rejectionNote = document.getElementById('transfer-rejection-note').value.trim();

    if (!targetJournal) {
      alert(t('manuscriptJournalRequired'));
      return;
    }

    if (journalUrl) {
      try {
        new URL(journalUrl);
      } catch (e) {
        alert(t('validPortalUrlOrBlank'));
        return;
      }
    }

    markSubmissionRejected(sourceSub, rejectionDate, rejectionNote);
    const newSub = createTransferredSubmission(sourceSub, targetJournal, submissionDate, journalUrl);
    db.submissions.push(newSub);
    syncManuscriptStatusFromSubmission(newSub);
    selectedSubmissionId = newSub.id;

    await window.storage.saveAll(db);
    closeModal();
    renderDashboard();
    renderKanban();
    renderSubmissions();
    renderSubmissionDetails(newSub);
    showGlobalToast(t('transferToast'), 'success');
  });
}


// Track New Submission trigger
document.getElementById('btn-add-submission')?.addEventListener('click', () => {
  let manOpts = db.manuscripts.map(m => `
    <option value="${escapeHTML(m.id)}">${escapeHTML(m.title || t('untitledManuscript'))}</option>
  `).join('');
  manOpts += `<option value="__new__">${escapeHTML(t('createNewManuscriptOption'))}</option>`;
  const defaultManuscriptMode = db.manuscripts.length === 0 ? '__new__' : (db.manuscripts[0]?.id || '__new__');
  manOpts = manOpts.replace(`value="${escapeHTML(defaultManuscriptMode)}"`, `value="${escapeHTML(defaultManuscriptMode)}" selected`);
  openModal(`
    <div class="modal-header">
      <h2>${t('trackSubmissionTitle')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>


    <div id="sub-zotero-active-item-banner" class="zotero-active-item-banner" style="display:none; align-items:center; justify-content:space-between; gap:10px; padding:10px 14px; background:rgba(204,0,0,0.06); border:1px solid rgba(204,0,0,0.22); border-radius:8px; margin-bottom:12px;">
      <span id="sub-zotero-active-item-text" style="font-size:12px; color:hsl(var(--text-primary)); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:75%;"></span>
      <button type="button" class="btn-secondary" id="btn-sub-zotero-quick-bind-active" style="padding:4px 10px; font-size:11px; white-space:nowrap; border-color:rgba(204,0,0,0.3); color:#cc0000; font-weight:600; cursor:pointer;">⚡ 一键载入</button>
    </div>

    <div class="form-group">
      <label for="sub-man-select">${t('manuscriptPaper')}</label>
      <select id="sub-man-select">${manOpts}</select>
    </div>

    <div class="quick-new-manuscript-panel" id="sub-new-manuscript-panel" ${defaultManuscriptMode === '__new__' ? '' : 'hidden'}>
      <div class="form-group" style="margin-bottom:0;">
        <label for="sub-new-man-title" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${escapeHTML(t('newManuscriptTitleLabel'))}</span>
          <span style="font-size:10px; font-weight:normal; text-transform:none; color:hsl(var(--text-muted));">${escapeHTML(currentLanguage === 'zh' ? '将同步创建稿件条目' : 'Will create manuscript entry')}</span>
        </label>
        <input type="text" id="sub-new-man-title" placeholder="${escapeHTML(currentLanguage === 'zh' ? '输入论文稿件标题 (如: Deep Learning for Genomic Effect...)' : t('paperTitlePlaceholder'))}">
      </div>
    </div>

    <div class="grid-cols-2">
      <div class="form-group">
        <label for="sub-first-author">${escapeHTML(t('firstAuthorLabel'))}</label>
        <input type="text" id="sub-first-author" value="" placeholder="${escapeHTML(currentLanguage === 'zh' ? '例如: Zhang San' : t('firstAuthorPlaceholder'))}">
      </div>
      <div class="form-group">
        <label for="sub-journal">${t('targetJournalInput')}</label>
        <input type="text" id="sub-journal" placeholder="${escapeHTML(currentLanguage === 'zh' ? '例如: Nature / IEEE TPAMI' : t('targetJournalPlaceholder'))}">
      </div>
    </div>

    <div class="grid-cols-2">
      <div class="form-group">
        <label for="sub-journal-url">${escapeHTML(t('submissionPortalUrl'))}</label>
        <input type="url" id="sub-journal-url" placeholder="https://...">
      </div>
      <div class="form-group">
        <label for="sub-date">${t('initialSubmissionDate')}</label>
        <input type="date" id="sub-date" value="${new Date().toISOString().split('T')[0]}">
      </div>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn-secondary" id="btn-cancel-sub">${escapeHTML(t('cancel') || '取消')}</button>
      <button type="button" class="btn-primary" id="btn-submit-sub" style="min-width:140px;">${t('trackSubmissionButton')}</button>
    </div>
  `);

  document.getElementById('btn-cancel-sub')?.addEventListener('click', closeModal);

  const manuscriptSelect = document.getElementById('sub-man-select');
  const newManuscriptPanel = document.getElementById('sub-new-manuscript-panel');

  const autoFillFromManuscript = (mId) => {
    if (mId && mId !== '__new__') {
      const selectedMan = (db.manuscripts || []).find(m => m.id === mId);
      if (selectedMan) {
        const authorInput = document.getElementById('sub-first-author');
        const journalInput = document.getElementById('sub-journal');
        const urlInput = document.getElementById('sub-journal-url');
        if (authorInput && !authorInput.value.trim() && selectedMan.authors) {
          authorInput.value = firstAuthorFromList(selectedMan.authors) || selectedMan.authors;
        }
        if (journalInput && !journalInput.value.trim() && (selectedMan.journal || selectedMan.publication)) {
          journalInput.value = selectedMan.journal || selectedMan.publication;
        }
        if (urlInput && !urlInput.value.trim() && (selectedMan.articleUrl || selectedMan.doi)) {
          urlInput.value = selectedMan.articleUrl || (selectedMan.doi ? `https://doi.org/${selectedMan.doi}` : '');
        }
      }
    }
  };

  manuscriptSelect.addEventListener('change', () => {
    const isNew = manuscriptSelect.value === '__new__';
    newManuscriptPanel.hidden = !isNew;
    if (isNew) {
      document.getElementById('sub-new-man-title')?.focus();
    } else {
      autoFillFromManuscript(manuscriptSelect.value);
    }
  });

  if (defaultManuscriptMode !== '__new__') {
    autoFillFromManuscript(defaultManuscriptMode);
  }

  // Active item detection in Zotero
  setTimeout(async () => {
    try {
      if (typeof ZoteroBridge !== 'undefined') {
        const activeItem = await ZoteroBridge.getActiveItem();
        const banner = document.getElementById('sub-zotero-active-item-banner');
        const textEl = document.getElementById('sub-zotero-active-item-text');
        const quickBindBtn = document.getElementById('btn-sub-zotero-quick-bind-active');
        if (activeItem && activeItem.title && banner && textEl) {
          window.RFUI.setHTML(textEl, `📌 <strong>${escapeHTML(currentLanguage === 'zh' ? '检测到 Zotero 选中文献：' : 'Active Zotero item: ')}</strong>《${escapeHTML(activeItem.title)}》`);
          banner.style.display = 'flex';
          quickBindBtn?.addEventListener('click', () => {
            const match = (db.manuscripts || []).find(m =>
              (m.zoteroItemKey && m.zoteroItemKey === activeItem.key) ||
              (m.title && m.title.trim().toLowerCase() === activeItem.title.trim().toLowerCase())
            );
            if (match) {
              manuscriptSelect.value = match.id;
              newManuscriptPanel.hidden = true;
            } else {
              manuscriptSelect.value = '__new__';
              newManuscriptPanel.hidden = false;
              const titleInput = document.getElementById('sub-new-man-title');
              if (titleInput) titleInput.value = activeItem.title;
            }
            const authorInput = document.getElementById('sub-first-author');
            const journalInput = document.getElementById('sub-journal');
            const urlInput = document.getElementById('sub-journal-url');
            if (authorInput && activeItem.authors) {
              authorInput.value = firstAuthorFromList(activeItem.authors) || activeItem.authors;
            }
            if (journalInput && activeItem.publication) {
              journalInput.value = activeItem.publication;
            }
            if (urlInput) {
              urlInput.value = activeItem.url || (activeItem.doi ? `https://doi.org/${activeItem.doi}` : '');
            }
            banner.style.display = 'none';
            showGlobalToast(currentLanguage === 'zh' ? '已从 Zotero 选中文献载入投稿信息' : 'Loaded submission metadata from active Zotero item', 'success');
          });
        }
      }
    } catch (_) {}
  }, 60);


  document.getElementById('btn-submit-sub').addEventListener('click', async () => {
    const createMode = window.RFUI.buildSubmissionCreateMode({
      selectedManuscriptId: manuscriptSelect.value,
      newManuscriptTitle: document.getElementById('sub-new-man-title')?.value || '',
      targetJournal: document.getElementById('sub-journal').value
    });
    const subDate = document.getElementById('sub-date').value;
    const journalUrl = document.getElementById('sub-journal-url').value.trim();
    const firstAuthor = document.getElementById('sub-first-author').value.trim().slice(0, 160);

    if (!createMode.ok) {
      alert(createMode.error);
      return;
    }

    if (journalUrl) {
      try {
        const parsedPortalUrl = new URL(journalUrl);
        if (!/^https?:$/.test(parsedPortalUrl.protocol)) throw new Error('unsupported protocol');
      } catch (_) {
        alert(t('validPortalUrlOrBlank'));
        return;
      }
    }


    let manuscriptId = createMode.manuscriptId;


    if (createMode.mode === 'new') {
      const newMan = {
        id: 'man_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        projectId: null,
        title: createMode.title,
        shortTitle: null,
        manuscriptType: 'article',
        status: 'submitted',
        abstract: '',
        keywords: [],
        authors: firstAuthor ? [firstAuthor] : [],
        firstAuthor: firstAuthor || null,
        correspondingAuthors: [],
        targetJournals: [createMode.targetJournal],
        currentVersion: '1.0',
        plannedFigures: [],
        notes: 'Created inline while tracking a new submission',
        externalManuscriptId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.manuscripts.push(newMan);
      manuscriptId = newMan.id;
    }
    const linkedManuscript = db.manuscripts.find(m => m.id === manuscriptId);
    if (linkedManuscript && firstAuthor) {
      linkedManuscript.firstAuthor = firstAuthor;
      linkedManuscript.updatedAt = new Date().toISOString();
    }

    const newSub = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      userId: 'user',
      manuscriptId,
      projectId: db.manuscripts.find(m => m.id === manuscriptId)?.projectId || null,
      targetJournal: createMode.targetJournal,
      journalUrl: journalUrl || null,
      doi: null,
      articleUrl: null,
      status: 'submitted',
      submissionDate: dateInputToIso(subDate),
      decisionDate: null,
      revisionDueDate: null,
      firstDecisionDate: null,
      complianceChecklist: {},
      reviewMatrix: [],
      timelineNodes: [],
      externalManuscriptId: null,
      firstAuthor: firstAuthor || null,
      captureProvenance: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    normalizeSubmissionTimeline(newSub);
    db.submissions.push(newSub);
    syncManuscriptStatusFromSubmission(newSub);
    selectedSubmissionId = newSub.id;
    await window.storage.saveAll(db);

    closeModal();
    renderDashboard();
    renderKanban();
    renderSubmissions();
    showGlobalToast(t('submissionAddedToast'), 'success');
  });
});

// --- VIEW 6: MULTI-CLOUD SETTINGS ---

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...(module.exports || {}),
    generateAcademicRebuttalLetter,
    generateRevisionCoverLetter,
    parseReviewCommentsBatch,
    renderRebuttalProgressTracker,
    escapeLatexText,
    copyRebuttalRichText,
    getSubmissionReviewMatrixRows
  };
}
