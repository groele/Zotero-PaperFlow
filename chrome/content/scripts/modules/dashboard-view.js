/**
 * Zotero PaperFlow - Dashboard View Module
 * Renders the dashboard overview, interactive stat filters, pipeline charts, and stage drawer.
 */
function initializePipelineViewMode() {
  RFPlatform.storage.local.get(['researchflow_pipeline_expanded'], (result) => {
    setPipelineViewMode(Boolean(result.researchflow_pipeline_expanded), { persist: false });
  });
}

function updateKanbanEmptyColumns() {
  const board = document.querySelector('.kanban-board');
  const button = document.getElementById('btn-toggle-empty-kanban');
  board?.classList.toggle('show-empty-columns', showEmptyKanbanColumns);
  if (button) {
    button.setAttribute('aria-pressed', String(showEmptyKanbanColumns));
    button.textContent = t(showEmptyKanbanColumns ? 'kanbanHideEmpty' : 'kanbanShowEmpty');
  }
}

function initializeKanbanEmptyColumnsMode() {
  const button = document.getElementById('btn-toggle-empty-kanban');
  button?.addEventListener('click', () => {
    showEmptyKanbanColumns = !showEmptyKanbanColumns;
    updateKanbanEmptyColumns();
    RFPlatform.storage.local.set({ researchflow_kanban_show_empty: showEmptyKanbanColumns });
  });
  RFPlatform.storage.local.get(['researchflow_kanban_show_empty'], result => {
    showEmptyKanbanColumns = result?.researchflow_kanban_show_empty !== false;
    updateKanbanEmptyColumns();
  });
}

function setPipelineViewMode(expanded, options = {}) {
  isPipelineExpanded = Boolean(expanded);
  const container = document.getElementById('dashboard-gantt');
  if (container) container.classList.toggle('expanded', isPipelineExpanded);
  updatePipelineViewToggle();
  if (options.persist !== false) {
    RFPlatform.storage.local.set({ researchflow_pipeline_expanded: isPipelineExpanded });
  }
}

function updatePipelineViewToggle() {
  const container = document.getElementById('dashboard-gantt');
  if (container) container.classList.toggle('expanded', isPipelineExpanded);

  const label = document.getElementById('pipeline-view-label');
  if (label) label.textContent = isPipelineExpanded ? t('expanded') : t('compact');

  const icon = document.getElementById('pipeline-view-icon');
  if (icon) icon.textContent = isPipelineExpanded ? '▦' : '▤';

  const button = document.getElementById('btn-pipeline-view-toggle');
  if (button) {
    button.classList.toggle('active', isPipelineExpanded);
    button.setAttribute('aria-pressed', String(isPipelineExpanded));
  }
}


function setupDashboardFilterListeners() {
  const cardAccepted = document.getElementById('card-filter-accepted');
  const cardActive = document.getElementById('card-filter-active');
  const cardAll = document.getElementById('card-filter-all');

  if (!cardAccepted || !cardActive || !cardAll) return;

  const clearActiveClasses = () => {
    [cardAccepted, cardActive, cardAll].forEach(card => {
      card.classList.remove('active');
      card.setAttribute('aria-pressed', 'false');
    });
  };

  cardAccepted.addEventListener('click', () => {
    currentDashboardFilter = 'accepted';
    clearActiveClasses();
    cardAccepted.classList.add('active');
    cardAccepted.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });

  cardActive.addEventListener('click', () => {
    currentDashboardFilter = 'active';
    clearActiveClasses();
    cardActive.classList.add('active');
    cardActive.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });

  cardAll.addEventListener('click', () => {
    currentDashboardFilter = 'all';
    clearActiveClasses();
    cardAll.classList.add('active');
    cardAll.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });
}


// A failed local write still needs a visible error after removing the unused
// sidebar sync card.
function setupSaveErrorListener() {
  window.addEventListener('researchflow-save-state', event => {
    const { state, error } = event.detail || {};
    if (state === 'error') showGlobalToast(error || (currentLanguage === 'zh' ? '保存失败，请重试' : 'Save failed, please retry'), 'error');
    if (state === 'pending') showGlobalToast(t('saveNewEditsPending'), 'info');
  });
}

function renderDashboard() {
  const manuscriptsById = new Map(db.manuscripts.map(manuscript => [manuscript.id, manuscript]));
  // Calculate interactive stats counts
  const allSubmissions = db.submissions;
  const visibleSubmissions = allSubmissions.filter(s => s.status !== 'rejected');
  let timelineChanged = false;
  visibleSubmissions.forEach(sub => {
    if (!Array.isArray(sub.timelineNodes) || sub.timelineNodes.length === 0) {
      sub.timelineNodes = buildDefaultSubmissionTimeline(sub);
      timelineChanged = true;
    }
    timelineChanged = normalizeSubmissionTimeline(sub) || timelineChanged;
  });
  // Rendering is read-only with respect to persistence; user actions own commits.
  const acceptedCount = visibleSubmissions.filter(isAcceptedSubmission).length;
  const activeCount = visibleSubmissions.filter(s => !isAcceptedSubmission(s)).length;
  const totalCount = allSubmissions.length;

  document.getElementById('stat-accepted-submissions').textContent = acceptedCount;
  document.getElementById('stat-active-submissions').textContent = activeCount;
  document.getElementById('stat-total-submissions').textContent = totalCount;
  const filterLabel = document.getElementById('dashboard-filter-label');
  if (filterLabel) filterLabel.textContent = getDashboardFilterLabel();

  // Calculate top summary metrics per manuscript (各个稿件的平均值)
  const manuscriptPipelines = [];
  const processedSubIds = new Set();

  (db.manuscripts || []).forEach(man => {
    const sub = window.RFCore.getCurrentSubmission(db, man.id);
    if (sub && sub.status !== 'rejected') {
      manuscriptPipelines.push({ manuscript: man, submission: sub });
      processedSubIds.add(sub.id);
    }
  });

  (db.submissions || []).forEach(sub => {
    if (sub.status !== 'rejected' && !processedSubIds.has(sub.id)) {
      if (!sub.manuscriptId || !manuscriptsById.has(sub.manuscriptId)) {
        manuscriptPipelines.push({ manuscript: null, submission: sub });
        processedSubIds.add(sub.id);
      }
    }
  });

  const analyses = manuscriptPipelines.map(p => analyzeSubmission(p.submission));
  const expSubmit = analyses.map(a => a.expToSubmit).filter(v => v !== null && !isNaN(v) && v >= 0);
  const submitNow = analyses.filter(a => !a.accepted).map(a => a.submitToNow).filter(v => v !== null && !isNaN(v) && v >= 0);
  const r1Now = analyses.filter(a => !a.accepted).map(a => a.r1ToNow).filter(v => v !== null && !isNaN(v) && v >= 0);
  const submitAccept = analyses.filter(a => a.accepted).map(a => a.submitToAccept).filter(v => v !== null && !isNaN(v) && v >= 0);

  applyLanguage();
  const avgText = (arr) => arr.length ? `${Math.round(arr.reduce((s, n) => s + n, 0) / arr.length)}${t('dayUnitShort')}` : "—";

  const elExpSubmit = document.getElementById("mExpSubmit");
  if (elExpSubmit) {
    elExpSubmit.textContent = avgText(expSubmit);
    elExpSubmit.parentElement?.setAttribute('title', currentLanguage === 'zh'
      ? `各个稿件平均值：基于 ${expSubmit.length} 篇有实验记录的稿件`
      : `Average across manuscripts: based on ${expSubmit.length} manuscripts with experiment records`);
  }
  const elSubmitNow = document.getElementById("mSubmitNow");
  if (elSubmitNow) {
    elSubmitNow.textContent = avgText(submitNow);
    elSubmitNow.parentElement?.setAttribute('title', currentLanguage === 'zh'
      ? `各个稿件平均值：基于 ${submitNow.length} 篇在审稿件`
      : `Average across manuscripts: based on ${submitNow.length} manuscripts in review`);
  }
  const elR1Now = document.getElementById("mR1Now");
  if (elR1Now) {
    elR1Now.textContent = avgText(r1Now);
    elR1Now.parentElement?.setAttribute('title', currentLanguage === 'zh'
      ? `各个稿件平均值：基于 ${r1Now.length} 篇一审修回中的稿件`
      : `Average across manuscripts: based on ${r1Now.length} manuscripts awaiting post-R1 decisions`);
  }
  const elSubmitAccept = document.getElementById("mSubmitAccept");
  if (elSubmitAccept) {
    elSubmitAccept.textContent = avgText(submitAccept);
    elSubmitAccept.parentElement?.setAttribute('title', currentLanguage === 'zh'
      ? `各个稿件平均值：基于 ${submitAccept.length} 篇已接收/发表的稿件`
      : `Average across manuscripts: based on ${submitAccept.length} accepted manuscripts`);
  }

  // 1. Pipeline Timeline Cards
  const ganttBox = document.getElementById('dashboard-gantt');
  window.RFUI.setHTML(ganttBox, '');

  // Apply active filter state
  let submissionsList = visibleSubmissions;
  if (currentDashboardFilter === 'accepted') {
    submissionsList = submissionsList.filter(isAcceptedSubmission);
  } else if (currentDashboardFilter === 'active') {
    submissionsList = submissionsList.filter(s => !isAcceptedSubmission(s));
  }
  submissionsList = sortDashboardSubmissions(submissionsList);

  if (submissionsList.length === 0) {
    window.RFUI.setHTML(ganttBox, `<p class="empty-state">${t('noPipelines')}</p>`);
  } else {
    submissionsList.forEach((sub, index) => {
      const displayIndex = submissionsList.length - index;
      const man = manuscriptsById.get(sub.manuscriptId);
      const manTitle = man ? man.title : t('untitledManuscript');
      const journalName = getSubmissionJournalName(sub);
      const firstAuthor = getSubmissionFirstAuthor(sub, man);

      // Analyze submission via the unified helper
      const a = analyzeSubmission(sub);

      // Determine visual stage category borders
      let stageClass = 'stage-active';
      if (a.accepted || sub.status === 'accepted' || sub.status === 'published') {
        stageClass = 'stage-accepted';
      } else if ((sub.status || '').includes('revision')) {
        stageClass = 'stage-revision';
      } else {
        const sortedNodes = autoSortNodes(sub.timelineNodes);
        const hasOverdue = sortedNodes.some(n => { const s = computeNodeStatus(n); return s === 'overdue' || s === 'blocked'; });
        if (hasOverdue) stageClass = 'stage-exception';
      }

      // Build premium 4-column event rail card matching the reference design
      const card = document.createElement('div');
      card.className = `pipeline-card ${stageClass}`;

      const latestMeta = a.latest ? getTimelineTypeMeta(a.latest.type) : { color: "#64748b", label: t('typeNoEvent') };
      const latestDate = a.latest ? getNodeDate(a.latest) : '';
      const latestRelative = latestDate ? getRelativeDateLabel(latestDate) : '';
      const reviewNode = [...(sub.timelineNodes || [])]
        .filter(node => isReviewTimelineNode(node) && node.dueDate)
        .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))[0];
      const reviewDeadlineHtml = reviewNode
        ? `<div class="latest-deadline ${computeNodeStatus(reviewNode) === 'overdue' ? 'is-overdue' : ''}">${escapeHTML(t('eventDeadline'))}：${escapeHTML(formatShortDate(reviewNode.dueDate))}${reviewNode.reviewDecision ? ` · ${escapeHTML(getReviewDecisionLabel(reviewNode.reviewDecision))}` : ''}</div>`
        : '';
      const submissionDoi = getSubmissionDoi(sub);
      const articleUrl = getSubmissionArticleUrl(sub);
      const doiHtml = submissionDoi
        ? `<a class="doi-link" href="${escapeHTML(articleUrl || `https://doi.org/${submissionDoi}`)}" target="_blank" rel="noopener noreferrer">${t('doiLabel')}: ${escapeHTML(submissionDoi)}</a>`
        : (articleUrl
          ? `<a class="doi-link" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${t('articlePage')}</a>`
          : `<span class="doi-missing">${t('doiNotSet')}</span>`);

      // Col 2 Event Rail details
      const milestones = a.display.milestones.filter(m => m.name && m.date !== undefined);
      const count = Math.max(2, milestones.length);
      const timelineIsActive = a.display.pending &&
        ['submitted', 'under_review', 'revision'].includes(normalizeSubmissionStatus(sub.status));

      let railHtml = `
        <div class="event-rail ${timelineIsActive ? 'is-tracking' : ''}" style="--count:${count}">
          <div class="rail-track ${a.display.pending ? "pending" : ""}"></div>
      `;

      milestones.forEach(m => {
        const isInteractive = m.node ? true : false;
        railHtml += `
          <div class="milestone">
            <div class="dot-wrap">
              <div class="dot ${m.emphasis ? "emphasis" : ""} ${m.today ? "today" : ""} ${isInteractive ? "interactive-dot" : ""}"
                   style="--dot-color:${m.color || a.display.color}; ${isInteractive ? 'cursor: pointer;' : ''}"
                   ${isInteractive ? `data-node-id="${escapeHTML(m.node.id)}" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('clickEditEvent'))}: ${escapeHTML(m.name)}"` : ''}></div>
            </div>
            <div class="milestone-name">${escapeHTML(m.name)}</div>
            <div class="milestone-date">${m.date ? formatShortDate(m.date) : "—"}</div>
          </div>
        `;
      });

      railHtml += `
        </div>
        <div class="rail-caption">
          <span>${t('keyEventRail')}</span>
          <span class="caption-highlight">${a.display.pending ? t('countingNow') : t('completedInterval')}</span>
        </div>
      `;

      window.RFUI.setHTML(card, `
        <!-- Col 1: Manuscript Info -->
        <div class="project-info">
          <div class="project-heading-row">
            <span class="submission-index">${displayIndex}</span>
            <div class="journal" title="${escapeHTML(journalName)}">${escapeHTML(journalName)}</div>
            ${sub.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:10px; padding:1px 6px; border-radius:3px;" title="Manuscript ID: ${escapeHTML(sub.externalManuscriptId)}">ID: ${escapeHTML(sub.externalManuscriptId)}</span>` : ''}
            <span class="pipeline-compact-status" style="--state-color:${a.stateColor}">${escapeHTML(a.stateLabel)}</span>
          </div>
          <h3 class="project-title" title="${escapeHTML(manTitle)}">${escapeHTML(manTitle)}</h3>
          <div class="project-meta">
            <span>${tf('nodesSaved', { count: sub.timelineNodes.length })}</span>
            <span>${t('timelineSortedBySubmissionDate')}: ${a.submitDate ? escapeHTML(formatShortDate(a.submitDate)) : t('noDate')}</span>
            <span>${t('expSubmitShort')} ${a.expToSubmit === null ? "—" : a.expToSubmit + t('dayUnitShort')}</span>
            <span>${t('timelineDateSource')}: ${escapeHTML(a.submitDateSource)}</span>
            <span class="pipeline-first-author ${firstAuthor ? '' : 'is-empty'}" title="${escapeHTML(t('firstAuthorLabel'))}: ${escapeHTML(firstAuthor || t('firstAuthorNotSet'))}">
              <span class="pipeline-first-author-label">${escapeHTML(t('firstAuthorLabel'))}:</span>
              <strong>${escapeHTML(firstAuthor || t('firstAuthorNotSet'))}</strong>
            </span>
          </div>
          <div class="pipeline-link-row">
            ${doiHtml}
            ${man?.zoteroItemKey ? `
              <span class="zotero-card-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" data-library-id="${escapeHTML(man.zoteroLibraryID || '')}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 文献库中选中此条目' : 'Select in Zotero library')}" style="margin-left: 6px;">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
                Zotero
              </span>
              ${man.citekey ? `<span class="zotero-citekey-badge" data-citekey="${escapeHTML(man.citekey)}" title="${escapeHTML(currentLanguage === 'zh' ? '点击复制 Citation Key' : 'Click to copy Citation Key')}">[@${escapeHTML(man.citekey)}]</span>` : ''}
              ${man.pdfUri ? `<span class="zotero-pdf-badge" data-item-key="${escapeHTML(man.zoteroItemKey)}" data-library-id="${escapeHTML(man.zoteroLibraryID || '')}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 阅读器中打开 PDF' : 'Open PDF in Zotero reader')}">📖 PDF</span>` : ''}
            ` : ''}
          </div>
          <div class="pipeline-actions" style="margin-top: 12px; display: flex; gap: 8px;">
            <button type="button" class="btn-secondary btn-sm btn-pipeline-open" data-sub-id="${escapeHTML(sub.id)}" aria-label="${escapeHTML(t('openSubmissionDetails'))}: ${escapeHTML(manTitle)}">${escapeHTML(t('openSubmissionDetails'))}</button>
            <button class="btn-secondary btn-sm btn-pipeline-add" data-sub-id="${escapeHTML(sub.id)}">${t('addEvent')}</button>
            <button class="btn-secondary btn-sm btn-pipeline-manage" data-sub-id="${escapeHTML(sub.id)}">${t('manageEvents')}</button>
            <button class="btn-secondary btn-sm btn-pipeline-share" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('shareJourney'))}" aria-label="${escapeHTML(t('shareJourney'))}: ${escapeHTML(manTitle)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>
              <span>${escapeHTML(t('shareJourney'))}</span>
            </button>
          </div>
        </div>

        <!-- Col 2: Middle Core Panel -->
        <div class="core-panel" style="--panel-color:${a.display.color}; --panel-bg:${a.display.bg}; --panel-border:${a.display.border}">
          <div class="core-head">
            <div>
              <div class="core-label">${escapeHTML(a.display.label)}</div>
              <div class="core-sub">${escapeHTML(a.display.caption)}</div>
            </div>
            <div class="core-value"><strong>${a.display.value === null ? "—" : a.display.value}</strong><span>${t('days')}</span></div>
          </div>
          ${railHtml}
        </div>

        <!-- Col 3: Latest Node Window -->
        <div class="latest-window" data-sub-id="${escapeHTML(sub.id)}" data-latest-id="${a.latest ? escapeHTML(a.latest.id) : ''}">
          <div class="latest-head">
            <span>${t('latestEvent')}</span>
            <span class="node-type" style="--node-color:${latestMeta.color}">${escapeHTML(latestMeta.label)}</span>
          </div>
          <div class="latest-title">${a.latest ? escapeHTML(getTimelineNodeDisplayName(a.latest)) : t('noEventYet')}</div>
          <div class="latest-date">${a.latest ? `${latestDate ? escapeHTML(formatShortDate(latestDate)) : t('noDate')}${latestRelative ? ` · ${escapeHTML(latestRelative)}` : ''}` : t('addEventStart')}</div>
          ${reviewDeadlineHtml}
          <div class="latest-note">${a.latest ? escapeHTML(a.latest.notes || t('clickEditEvent')) : t('clickAddEvent')}</div>
        </div>

        <!-- Col 4: State Box -->
        <div class="state-box">
          <span class="state-pill" style="--state-color:${a.stateColor}">${escapeHTML(a.stateLabel)}</span>
          <div class="state-note">${escapeHTML(a.stateNote)}</div>
        </div>
        ${buildInlineStageEditor(sub.id)}
      `);

      // Setup click listeners for interactive dots in Col 2
      card.querySelectorAll('.dot.interactive-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          const nodeId = dot.getAttribute('data-node-id');
          const subId = dot.getAttribute('data-sub-id');
          openStageDrawer(subId, nodeId);
        });
      });

      // Setup click listener for latest-window in Col 3
      const latestWindow = card.querySelector('.latest-window');
      if (latestWindow) {
        latestWindow.addEventListener('click', (e) => {
          e.stopPropagation();
          const latestId = latestWindow.getAttribute('data-latest-id');
          const subId = latestWindow.getAttribute('data-sub-id');
          if (latestId) {
            openStageDrawer(subId, latestId);
          } else {
            toggleInlineStageEditor(card, true);
          }
        });
      }

      ganttBox.appendChild(card);
    });

    // Delegate inline event creation.
    ganttBox.querySelectorAll('.btn-pipeline-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleInlineStageEditor(btn.closest('.pipeline-card'), true);
      });
    });

    ganttBox.querySelectorAll('.btn-pipeline-open').forEach(btn => {
      btn.addEventListener('click', () => navigateToSubmissionDetails(btn.getAttribute('data-sub-id')));
    });

    ganttBox.querySelectorAll('.btn-inline-stage-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.disabled) return;
        const card = btn.closest('.pipeline-card');
        toggleInlineStageEditor(card, false);
        card?.querySelector('.btn-pipeline-add')?.focus();
      });
    });

    ganttBox.querySelectorAll('.btn-pipeline-manage').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTimelineEventManager(btn.getAttribute('data-sub-id'));
      });
    });

    ganttBox.querySelectorAll('.btn-pipeline-share').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        openSubmissionSharePreview(btn.getAttribute('data-sub-id'), btn);
      });
    });

    ganttBox.querySelectorAll('.zotero-card-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = badge.getAttribute('data-item-key');
        const rawLib = badge.getAttribute('data-library-id');
        const libId = rawLib ? (Number(rawLib) || rawLib) : null;
        if (key && typeof ZoteroBridge !== 'undefined') {
          ZoteroBridge.selectItemInZotero(key, libId);
        }
      });
    });

    ganttBox.querySelectorAll('.zotero-citekey-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const ck = badge.getAttribute('data-citekey');
        if (ck && typeof ZoteroBridge !== 'undefined') {
          ZoteroBridge.copyText(`[@${ck}]`, currentLanguage === 'zh' ? `已复制 Citation Key: [@${ck}]` : `Copied Citation Key: [@${ck}]`);
        }
      });
    });

    ganttBox.querySelectorAll('.zotero-pdf-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = badge.getAttribute('data-item-key');
        const rawLib = badge.getAttribute('data-library-id');
        const libId = rawLib ? (Number(rawLib) || rawLib) : null;
        if (key && typeof ZoteroBridge !== 'undefined') {
          ZoteroBridge.openPdf(key, null, libId);
        }
      });
    });

    ganttBox.querySelectorAll('.inline-stage-key').forEach(select => {
      select.addEventListener('change', () => {
        syncInlineStagePreset(select.closest('.inline-stage-editor'));
      });
    });

    ganttBox.querySelectorAll('.inline-stage-type').forEach(select => {
      select.addEventListener('change', () => {
        syncInlineStagePreset(select.closest('.inline-stage-editor'));
      });
    });

    ganttBox.querySelectorAll('.inline-stage-deadline').forEach(input => {
      input.addEventListener('input', () => {
        updateInlineStageDeadlineStatus(input.closest('.inline-stage-editor'));
      });
    });

    ganttBox.querySelectorAll('.btn-inline-stage-reset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetInlineStageEditor(btn.closest('.inline-stage-editor'));
      });
    });

    ganttBox.querySelectorAll('.btn-inline-stage-save').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const editor = btn.closest('.inline-stage-editor');
        if (!editor || btn.disabled) return;
        setInlineStageBusy(editor, true);
        let errorMessage = '';
        try {
          await saveInlineStageEvent(editor);
        } catch (error) {
          errorMessage = error?.message || t('autoSaveFailed');
          showGlobalToast(errorMessage, 'error');
        } finally {
          if (editor.isConnected) setInlineStageBusy(editor, false, errorMessage);
        }
      });
    });

    ganttBox.querySelectorAll('.inline-stage-editor').forEach(editor => {
      editor.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || editor.querySelector('.btn-inline-stage-save')?.disabled) return;
        event.preventDefault();
        event.stopPropagation();
        toggleInlineStageEditor(editor.closest('.pipeline-card'), false);
        editor.closest('.pipeline-card')?.querySelector('.btn-pipeline-add')?.focus();
      });
    });

    ganttBox.querySelectorAll('.inline-stage-fields input').forEach(input => {
      input.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.isComposing) return;
        event.preventDefault();
        input.closest('.inline-stage-editor')?.querySelector('.btn-inline-stage-save')?.click();
      });
    });
  }


  // 2. Recent Research Logs (Removed)

  // 3. Timeline alerts and review milestones
  const reviewMilestones = document.getElementById('dashboard-pending-milestones');
  window.RFUI.setHTML(reviewMilestones, '');

  const timelineAlerts = [];
  db.submissions
    .filter(s => s.status !== 'rejected')
    .forEach(sub => {
      const man = db.manuscripts.find(m => m.id === sub.manuscriptId);
      if (man) {
        const currentSub = window.RFCore?.getCurrentSubmission(db, man.id);
        if (currentSub && currentSub.id !== sub.id) return;
      }

      const isAcceptedOrPublished = hasPublicationStatus(sub) ||
        isAcceptedSubmission(sub) ||
        Boolean(man && (hasPublicationStatus(man) || man.status === 'accepted' || man.status === 'published'));
      const isPublished = sub.status === 'published' || (man && man.status === 'published');

      // If the paper is published, all publication milestones are complete. Skip.
      if (isPublished) return;

      (sub.timelineNodes || []).forEach(node => {
        const computedStatus = computeNodeStatus(node);
        const nodeKey = node.key || inferKey(node);

        // For accepted submissions: NEVER alert on pre-acceptance milestones or the acceptance node
        if (isAcceptedOrPublished) {
          if (node.type !== 'publication' || nodeKey === 'accept') return;
        }

        if (computedStatus === 'completed') return;

        const importantType = node.type === 'review' || node.type === 'revision' || node.type === 'publication';
        const hasTimelineDate = Boolean(node.dueDate || node.planDate || node.completeDate);
        const actionable = computedStatus === 'overdue' || computedStatus === 'due_soon' || computedStatus === 'blocked' || node.status === 'active';

        if (!actionable && !hasTimelineDate) return;
        if (!importantType && !actionable) return;

        // Timeline alerts must have an explicit date or be blocked; do not spam alerts with "无日期"
        const alertDate = node.dueDate || node.planDate || (node.type === 'review' ? sub.revisionDueDate : '') || node.completeDate || '';
        if (!alertDate && computedStatus !== 'blocked') return;

        timelineAlerts.push({
          sub,
          node,
          computedStatus,
          title: `${getSubmissionJournalName(sub)}: ${getTimelineNodeDisplayName(node)}`,
          date: alertDate,
          manTitle: man ? man.title : t('untitledManuscript')
        });
      });
    });

  const statusRank = { overdue: 0, blocked: 1, due_soon: 2, in_progress: 3, not_started: 4, upcoming: 5 };
  timelineAlerts.sort((a, b) => {
    const ra = statusRank[a.computedStatus] ?? 9;
    const rb = statusRank[b.computedStatus] ?? 9;
    if (ra !== rb) return ra - rb;
    return new Date(a.date || '2999-12-31') - new Date(b.date || '2999-12-31');
  });

  // Setup All Deadlines Calendar Export button
  const btnExportAllIcs = document.getElementById('btn-dashboard-export-all-ics');
  if (btnExportAllIcs && !btnExportAllIcs.dataset.listenerAttached) {
    btnExportAllIcs.dataset.listenerAttached = 'true';
    btnExportAllIcs.addEventListener('click', () => {
      const activeSubs = (db.submissions || []).filter(s => s.revisionDueDate && s.status !== 'accepted' && s.status !== 'published');
      if (activeSubs.length === 0) {
        showGlobalToast(t('noDeadlinesToExport') || (currentLanguage === 'zh' ? '当前未发现已设置修回截止日期的活跃稿件。' : 'No active submissions with revision due dates found.'), 'warning');
        return;
      }
      if (window.RFCalendar?.generateSubmissionCalendarFeed && window.RFCalendar?.triggerCalendarDownload) {
        const feed = window.RFCalendar.generateSubmissionCalendarFeed(activeSubs, db.manuscripts, { calName: 'PaperFlow All Revision Deadlines' });
        window.RFCalendar.triggerCalendarDownload(feed, 'paperflow_all_deadlines.ics');
        showGlobalToast(t('calendarExportedToast') || (currentLanguage === 'zh' ? '修回截止日历 (.ics) 已导出！' : 'Revision deadline calendar (.ics) exported.'), 'success');
      }
    });
  }

  if (timelineAlerts.length === 0) {
    window.RFUI.setHTML(reviewMilestones, `<p class="empty-state">${t('noUrgentEvents')}</p>`);
  } else {
    timelineAlerts.slice(0, 5).forEach(alert => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.title = alert.manTitle;

      const title = document.createElement('span');
      title.className = 'recent-item-title';
      title.textContent = alert.title;

      const badge = document.createElement('span');
      const badgeClass = alert.computedStatus === 'overdue' || alert.computedStatus === 'blocked'
        ? 'danger'
        : alert.computedStatus === 'due_soon'
          ? 'warning'
          : 'info';
      badge.className = `badge badge-${badgeClass}`;
      badge.textContent = getNodeStatusLabel(alert.computedStatus);

      const date = document.createElement('span');
      date.className = 'recent-item-date';
      date.textContent = alert.date ? formatShortDate(alert.date) : t('noDate');

      item.appendChild(title);
      item.appendChild(badge);
      item.appendChild(date);

      if (alert.sub?.revisionDueDate) {
        const icsBtn = document.createElement('button');
        icsBtn.type = 'button';
        icsBtn.className = 'btn-secondary btn-icon';
        icsBtn.style.cssText = 'font-size:11px; padding:2px 6px; border-radius:3px; margin-left:4px; height:22px;';
        icsBtn.title = t('exportCalendarIcs') || '导出修回日历 (.ics)';
        icsBtn.textContent = '📅';
        icsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.RFCalendar?.generateSubmissionCalendarFeed && window.RFCalendar?.triggerCalendarDownload) {
            const feed = window.RFCalendar.generateSubmissionCalendarFeed([alert.sub], db.manuscripts, { calName: `${getSubmissionJournalName(alert.sub)} Revision Deadline` });
            window.RFCalendar.triggerCalendarDownload(feed, `revision_deadline_${alert.sub.id}.ics`);
            showGlobalToast(t('calendarExportedToast') || '修回截止日历 (.ics) 已导出！', 'success');
          }
        });
        item.appendChild(icsBtn);
      }

      reviewMilestones.appendChild(item);
    });
  }
}

// --- PIPELINE TIMELINE HELPERS ---

function openStageDrawer(subId, nodeId) {
  const sub = db.submissions.find(s => s.id === subId);
  if (!sub) return;
  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];

  const node = sub.timelineNodes.find(n => n.id === nodeId);
  if (!node) {
    showGlobalToast(t('eventNotFound'), 'error');
    renderDashboard();
    return;
  }

  const typeOptions = [
    { value: 'research', label: t('eventTypeResearch') },
    { value: 'writing', label: t('eventTypeWriting') },
    { value: 'submission', label: t('eventTypeSubmission') },
    { value: 'review', label: t('eventTypeReview') },
    { value: 'revision', label: t('eventTypeRevision') },
    { value: 'publication', label: t('eventTypePublication') },
    { value: 'special', label: t('specialException') }
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
    { value: 'online', label: t('keyOnlinePublished') }
  ];
  const eventDateValue = normalizeDateString(node.completeDate || node.planDate || node.dueDate || '');
  const eventDeadlineValue = normalizeDateString(node.dueDate || '');
  const reviewDecisionValue = node.reviewDecision || node.decisionType || '';

  openModal(`
    <div class="modal-header">
      <h2>${t('editTimelineEvent')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="${escapeHTML(t('close'))}">×</button>
    </div>

    <div class="stage-editor">
      <div class="form-group">
        <label>${t('eventName')}</label>
        <input type="text" id="drawer-node-name" value="${escapeHTML(node.name || '')}" placeholder="${escapeHTML(t('eventPlaceholder'))}">
      </div>

      <div class="stage-editor-grid">
        <div class="form-group">
          <label>${t('type')}</label>
          <select id="drawer-node-type">${buildOptions(typeOptions, node.type || 'research')}</select>
        </div>
        <div class="form-group">
          <label>${t('keyEventMapping')}</label>
          <select id="drawer-node-key">${buildOptions(keyOptions, node.key || 'auto')}</select>
        </div>
        <div class="form-group">
          <label>${t('eventDate')}</label>
          <input type="date" id="drawer-node-date" value="${escapeHTML(eventDateValue)}">
        </div>
        <div class="form-group">
          <label>${t('eventDeadline')}</label>
          <input type="date" id="drawer-node-deadline" value="${escapeHTML(eventDeadlineValue)}">
        </div>
        <div class="form-group">
          <label>${t('reviewDecision')}</label>
          <select id="drawer-node-decision">${buildOptions([
            { value: '', label: t('noReviewDecision') },
            { value: 'major', label: t('majorRevision') },
            { value: 'minor', label: t('minorRevision') }
          ], reviewDecisionValue)}</select>
        </div>
      </div>

      <div class="stage-quick-row">
        <button class="btn-secondary btn-sm" id="drawer-btn-date-today">${t('setToday')}</button>
        <button class="btn-secondary btn-sm" id="drawer-btn-clear-date">${t('clearDate')}</button>
      </div>
      <p class="text-muted" style="font-size:11px; line-height:1.5; margin-top:8px;">${t('eventDateHelp')}</p>

      <div class="form-group">
        <label>${t('notes')}</label>
        <textarea id="drawer-node-notes" placeholder="${escapeHTML(t('notesPlaceholder'))}">${escapeHTML(node.notes || '')}</textarea>
      </div>
    </div>

    <div class="stage-modal-actions">
      <button class="btn-danger" id="drawer-btn-delete">${t('delete')}</button>
      <button class="btn-primary" id="drawer-btn-save">${t('saveChanges')}</button>
    </div>
  `);

  const setDate = (inputId, offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    document.getElementById(inputId).value = d.toISOString().slice(0, 10);
  };

  document.getElementById('drawer-btn-date-today').onclick = () => setDate('drawer-node-date');
  document.getElementById('drawer-btn-clear-date').onclick = () => {
    document.getElementById('drawer-node-date').value = '';
  };

  document.getElementById('drawer-btn-save').onclick = async () => {
    const nextName = document.getElementById('drawer-node-name').value.trim();
    if (!nextName) {
      alert(t('eventNameRequired'));
      return;
    }

    node.name = nextName;
    node.type = document.getElementById('drawer-node-type').value;
    node.key = document.getElementById('drawer-node-key').value;
    const eventDate = normalizeDateString(document.getElementById('drawer-node-date').value);
    node.status = eventDate ? 'completed' : 'pending';
    node.planDate = '';
    node.dueDate = normalizeDateString(document.getElementById('drawer-node-deadline').value);
    node.completeDate = eventDate;
    node.reviewDecision = document.getElementById('drawer-node-decision').value;
    node.notes = document.getElementById('drawer-node-notes').value.trim();
    node.updatedAt = new Date().toISOString();

    const nodeKey = inferKey(node);
    const isReview = isReviewTimelineNode(node);
    if (isReview && !node.dueDate && !node.reviewDecision) {
      alert(t('reviewDeadlineOrDecisionRequired'));
      return;
    }
    if (nodeKey === 'submit') {
      sub.submissionDate = eventDate ? dateInputToIso(eventDate) : null;
    } else if (nodeKey === 'r1_comments') {
      sub.firstDecisionDate = eventDate ? dateInputToIso(eventDate) : null;
      sub.revisionDueDate = node.dueDate ? dateInputToIso(node.dueDate) : null;
      sub.reviewDecision = node.reviewDecision || '';
    } else if (nodeKey === 'r2_comments') {
      sub.revisionDueDate = node.dueDate ? dateInputToIso(node.dueDate) : null;
      sub.reviewDecision = node.reviewDecision || '';
    } else if (nodeKey === 'accept' || nodeKey === 'online') {
      if (eventDate) applyInlineEventToSubmission(sub, nodeKey, eventDate);
      else if (nodeKey === 'online') {
        sub.publishedAt = null;
        if (sub.status === 'published') sub.status = 'accepted';
      } else {
        sub.decisionDate = null;
        sub.acceptedAt = null;
      }
    }
    normalizeSubmissionTimeline(sub);
    syncManuscriptStatusFromSubmission(sub);

    await window.storage.saveAll(db);
    closeModal();
    renderDashboard();
    showGlobalToast(tf('eventSavedToast', { name: node.name }), 'success');
  };

  document.getElementById('drawer-btn-delete').onclick = async () => {
    if (confirm(tf('confirmDeleteEvent', { name: node.name }))) {
      deleteTimelineNode(sub, nodeId);
      syncManuscriptStatusFromSubmission(sub);
      await window.storage.saveAll(db);
      closeModal();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      showGlobalToast(t('eventRemovedToast'), 'success');
    }
  };
}


// --- VIEW 4: MANUSCRIPTS KANBAN BOARD ---

