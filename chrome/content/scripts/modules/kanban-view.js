/**
 * Zotero PaperFlow - Manuscripts Kanban View Module
 * Renders manuscript stage cards, drag-and-drop columns, and manuscript edit modals.
 */
function renderKanban() {
  const columns = ['idea', 'drafting', 'submitted', 'accepted'];
  columns.forEach(col => {
    window.RFUI.setHTML(document.getElementById(`cards-${col}`), '');
  });

  // Handle pending Zotero literature link banner
  const viewSection = document.getElementById('view-manuscripts');
  let banner = document.getElementById('zotero-link-banner');
  if (window._pendingZoteroLinkItem && viewSection) {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'zotero-link-banner';
      banner.className = 'zotero-link-banner';
      const board = viewSection.querySelector('.kanban-board');
      if (board) viewSection.insertBefore(banner, board);
      else viewSection.prepend(banner);
    }
    const pItem = window._pendingZoteroLinkItem;
    window.RFUI.setHTML(banner, `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:20px;">📎</span>
        <div>
          <div style="font-weight:600; color:hsl(var(--text-primary));">正在关联 Zotero 文献：${escapeHTML(pItem.title || '无标题文献')}</div>
          <div style="font-size:11px; color:hsl(var(--text-secondary));">${escapeHTML(pItem.authors || '')} ${pItem.year ? `· ${escapeHTML(pItem.year)}` : ''} ${pItem.publication ? `· ${escapeHTML(pItem.publication)}` : ''}</div>
        </div>
      </div>
      <button class="btn-secondary" id="btn-cancel-zotero-link" style="padding:4px 10px; font-size:12px;">取消关联</button>
    `);
    document.getElementById('btn-cancel-zotero-link')?.addEventListener('click', () => {
      window._pendingZoteroLinkItem = null;
      renderKanban();
    });
  } else if (banner) {
    banner.remove();
  }

  const mCount = { idea: 0, drafting: 0, submitted: 0, accepted: 0 };
  let visibleManuscripts = db.manuscripts || [];
  if (window._activeZoteroCollectionFilter && window._activeZoteroCollectionItemKeys) {
    visibleManuscripts = visibleManuscripts.filter(m =>
      m.zoteroItemKey && window._activeZoteroCollectionItemKeys.has(m.zoteroItemKey)
    );
  }

  visibleManuscripts.forEach(m => {
    // Map granular status to simple column headers
    let col = 'idea';
    if (m.status === 'planning' || m.status === 'outline' || m.status === 'idea' || m.status === 'data_collection') col = 'idea';
    else if (m.status === 'in_progress' || m.status === 'drafting' || m.status === 'figure_preparation' || m.status === 'internal_review' || m.status === 'rejected') col = 'drafting';
    else if (m.status === 'submitted' || m.status === 'under_review' || m.status === 'revision') col = 'submitted';
    else if (m.status === 'accepted' || m.status === 'published') col = 'accepted';

    mCount[col]++;
    const linkedSubmission = window.RFCore.getCurrentSubmission(db, m.id);
    const currentJournal = linkedSubmission?.targetJournal || linkedSubmission?.journalName || m.targetJournals?.[0] || (currentLanguage === 'zh' ? '待定' : 'TBD');

    const card = document.createElement('div');
    card.className = `glass-card kanban-card kanban-status-${normalizeKanbanStatusClass(m.status)}`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', m.id);
    card.setAttribute('data-manuscript-id', m.id);

    let zoteroRowHtml = '';
    if (m.zoteroItemKey) {
      zoteroRowHtml = `
        <div class="kanban-zotero-row">
          <span class="zotero-card-badge" data-item-key="${escapeHTML(m.zoteroItemKey)}" title="在 Zotero 文献库中选中此条目">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
            Zotero
          </span>
          ${m.citekey ? `
          <span class="zotero-citekey-badge" id="badge-citekey-${m.id}" data-citekey="${escapeHTML(m.citekey)}" title="点击复制 Citation Key">
            [@${escapeHTML(m.citekey)}]
          </span>` : ''}
          ${m.pdfUri ? `
          <span class="zotero-pdf-badge" data-item-key="${escapeHTML(m.zoteroItemKey)}" title="在 Zotero PDF 阅读器中打开">
            📖 PDF
          </span>` : ''}
          ${m.annotationCount ? `
          <span class="zotero-anno-badge" title="包含 ${m.annotationCount} 条 Zotero PDF 高亮批注">
            📑 ${m.annotationCount}
          </span>` : ''}
          <span class="zotero-sync-note-badge" id="badge-sync-note-${m.id}" data-item-key="${escapeHTML(m.zoteroItemKey)}" title="同步审稿进展至 Zotero 云端笔记">
            📝 同步
          </span>
        </div>
      `;
    }

    const pendingLinkBtnHtml = window._pendingZoteroLinkItem ? `
      <button class="btn-primary" style="padding: 2px 8px; font-size:10px; height: 24px; background:#e11d48; border-color:#be123c;" id="btn-link-this-${m.id}">🔗 ${currentLanguage === 'zh' ? '关联此文献' : 'Link Item'}</button>
    ` : '';

    const targetJournalLabel = currentLanguage === 'zh' ? '目标期刊' : 'Target';
    const editLabel = currentLanguage === 'zh' ? '编辑' : 'Edit';
    const deleteLabel = currentLanguage === 'zh' ? '删除' : 'Delete';

    window.RFUI.setHTML(card, `
      <div class="kanban-card-title-row">
        <h4 title="${escapeHTML(m.title)}">${escapeHTML(m.title)}</h4>
      </div>
      <div class="kanban-card-meta-row">
        <span class="kanban-status-pill">${escapeHTML(getManuscriptStatusLabel(m.status))}</span>
        ${linkedSubmission?.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:10px; padding:1px 5px; border-radius:3px;" title="Manuscript ID: ${escapeHTML(linkedSubmission.externalManuscriptId)}">ID: ${escapeHTML(linkedSubmission.externalManuscriptId)}</span>` : ''}
        <p>${targetJournalLabel}: <strong>${escapeHTML(currentJournal)}</strong></p>
      </div>
      ${zoteroRowHtml}
      <div class="kanban-card-controls">
        <select class="kanban-card-select" id="sel-man-status-${m.id}" aria-label="${escapeHTML(t('status'))}: ${escapeHTML(m.title)}">
          <option value="planning" ${m.status === 'planning' ? 'selected' : ''}>${escapeHTML(t('statusPlanning'))}</option>
          <option value="idea" ${m.status === 'idea' ? 'selected' : ''}>${escapeHTML(t('statusIdea'))}</option>
          <option value="outline" ${m.status === 'outline' ? 'selected' : ''}>${escapeHTML(t('statusOutline'))}</option>
          <option value="in_progress" ${m.status === 'in_progress' ? 'selected' : ''}>${escapeHTML(t('statusInProgress'))}</option>
          <option value="figure_preparation" ${m.status === 'figure_preparation' ? 'selected' : ''}>${escapeHTML(t('statusFiguresPrep'))}</option>
          <option value="drafting" ${m.status === 'drafting' ? 'selected' : ''}>${escapeHTML(t('statusDrafting'))}</option>
          <option value="internal_review" ${m.status === 'internal_review' ? 'selected' : ''}>${escapeHTML(t('statusInternalReview'))}</option>
          <option value="submitted" ${m.status === 'submitted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('submitted'))}</option>
          <option value="under_review" ${m.status === 'under_review' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('under_review'))}</option>
          <option value="revision" ${m.status === 'revision' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('revision'))}</option>
          <option value="accepted" ${m.status === 'accepted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('accepted'))}</option>
          <option value="published" ${m.status === 'published' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('published'))}</option>
          <option value="rejected" ${m.status === 'rejected' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('rejected'))}</option>
        </select>
        <div class="kanban-card-actions">
          ${pendingLinkBtnHtml}
          ${linkedSubmission ? `<button type="button" class="btn-secondary btn-open-linked-submission" data-sub-id="${escapeHTML(linkedSubmission.id)}" aria-label="${escapeHTML(t('openSubmissionDetails'))}: ${escapeHTML(m.title)}">${escapeHTML(t('openSubmissionDetails'))}</button>` : ''}
          <button type="button" class="btn-secondary btn-edit-manuscript" id="btn-edit-man-${m.id}">${editLabel}</button>
          <button type="button" class="btn-secondary btn-delete-manuscript" id="btn-delete-man-${m.id}" title="${escapeHTML(deleteLabel)}">${deleteLabel}</button>
        </div>
      </div>
    `);

    // HTML5 Drag Event Listeners
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', m.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    document.getElementById(`cards-${col}`).appendChild(card);

    card.querySelector('.btn-open-linked-submission')?.addEventListener('click', event => {
      event.stopPropagation();
      navigateToSubmissionDetails(event.currentTarget.dataset.subId);
    });

    // Bind status change dropdown
    document.getElementById(`sel-man-status-${m.id}`).addEventListener('change', async (e) => {
      try {
        const result = await persistManuscriptStatusChange(m, e.target.value);
        if (m.zoteroItemKey && typeof ZoteroBridge !== 'undefined') {
          ZoteroBridge.syncStatusTag(m.zoteroItemKey, e.target.value);
          ZoteroBridge.addToPipelineCollection(m.zoteroItemKey);
        }
        renderKanban();
        renderDashboard();
        renderSubmissions();
        showGlobalToast(t('manuscriptStatusUpdated'), 'success');
        if (result.shouldCelebrate) {
          showAcceptanceCelebration({ title: result.manuscript.title, manuscriptId: result.manuscript.id });
        }
      } catch (error) {
        console.error('Manuscript status save failed:', error);
        renderKanban();
        showGlobalToast(error.message || t('autoSaveFailed'), 'error');
      }
    });

    // Bind edit button
    document.getElementById(`btn-edit-man-${m.id}`).addEventListener('click', () => {
      openManuscriptModal(m);
    });

    // Bind delete button
    document.getElementById(`btn-delete-man-${m.id}`)?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteManuscript(m.id);
    });

    // Pending link button
    const btnLinkThis = card.querySelector(`#btn-link-this-${m.id}`);
    if (btnLinkThis) {
      btnLinkThis.addEventListener('click', async (e) => {
        e.stopPropagation();
        const pItem = window._pendingZoteroLinkItem;
        if (!pItem) return;
        m.zoteroItemKey = pItem.key;
        m.zoteroUri = pItem.zoteroUri;
        m.pdfUri = pItem.pdfUri;
        if (!m.doi && pItem.doi) m.doi = pItem.doi;
        m.updatedAt = new Date().toISOString();
        await window.storage.saveAll(db);
        window._pendingZoteroLinkItem = null;
        renderKanban();
        showGlobalToast(`已将文献《${(pItem.title || '').slice(0, 18)}…》成功关联到稿件！`, 'success');
        if (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) {
          ZoteroBridge.syncNote(m.zoteroItemKey);
        }
      });
    }

    // Zotero badge clicks
    const zoteroBadge = card.querySelector('.zotero-card-badge');
    if (zoteroBadge) {
      zoteroBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof ZoteroBridge !== 'undefined') {
          ZoteroBridge.selectItemInZotero(m.zoteroItemKey);
        }
      });
    }

    const pdfBadge = card.querySelector('.zotero-pdf-badge');
    if (pdfBadge) {
      pdfBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof ZoteroBridge !== 'undefined') {
          ZoteroBridge.openPdf(m.zoteroItemKey);
        }
      });
    }

    const citeBadge = card.querySelector(`#badge-citekey-${m.id}`);
    if (citeBadge && m.citekey) {
      citeBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof ZoteroBridge !== 'undefined') {
          ZoteroBridge.copyText(`[@${m.citekey}]`, currentLanguage === 'zh' ? `已复制 Citation Key: [@${m.citekey}]` : `Copied Citation Key: [@${m.citekey}]`);
        }
      });
    }

    const syncBadge = card.querySelector(`#badge-sync-note-${m.id}`);
    if (syncBadge) {
      syncBadge.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (typeof ZoteroBridge !== 'undefined') {
          syncBadge.textContent = currentLanguage === 'zh' ? '⏳ 同步中' : '⏳ Syncing';
          const ok = await ZoteroBridge.syncNote(m.zoteroItemKey);
          if (ok) {
            syncBadge.textContent = currentLanguage === 'zh' ? '✅ 已同步' : '✅ Synced';
            showGlobalToast(currentLanguage === 'zh' ? '审稿进展已成功同步至 Zotero 云端笔记！' : 'Synced pipeline progress to Zotero child note!', 'success');
            setTimeout(() => { syncBadge.textContent = currentLanguage === 'zh' ? '📝 同步' : '📝 Sync'; }, 2000);
          } else {
            syncBadge.textContent = currentLanguage === 'zh' ? '❌ 失败' : '❌ Failed';
            setTimeout(() => { syncBadge.textContent = currentLanguage === 'zh' ? '📝 同步' : '📝 Sync'; }, 2000);
          }
        }
      });
    }
  });

  columns.forEach(col => {
    document.getElementById(`count-${col}`).textContent = mCount[col];
    document.querySelector(`.kanban-col[data-status="${col}"]`)?.classList.toggle('is-empty', mCount[col] === 0);

    // HTML5 Column Drop Event Listeners
    const colCardsContainer = document.getElementById(`cards-${col}`);
    if (mCount[col] === 0) {
      const emptyHints = {
        idea: {
          icon: '🎯',
          text: currentLanguage === 'zh' ? '暂无规划手稿' : 'No planned manuscripts',
          sub: currentLanguage === 'zh' ? '可拖拽手稿至此阶段' : 'Drag manuscripts here'
        },
        drafting: {
          icon: '⏳',
          text: currentLanguage === 'zh' ? '暂无进行中手稿' : 'No active drafts',
          sub: currentLanguage === 'zh' ? '可拖拽手稿至此阶段' : 'Drag manuscripts here'
        },
        submitted: {
          icon: '🚀',
          text: currentLanguage === 'zh' ? '暂无已投稿件' : 'No submissions',
          sub: currentLanguage === 'zh' ? '可拖拽手稿至此阶段' : 'Drag manuscripts here'
        },
        accepted: {
          icon: '🎉',
          text: currentLanguage === 'zh' ? '暂无已接收手稿' : 'No accepted papers',
          sub: currentLanguage === 'zh' ? '可拖拽手稿至此阶段' : 'Drag manuscripts here'
        }
      };
      const hint = emptyHints[col] || { icon: '📥', text: currentLanguage === 'zh' ? '暂无条目' : 'No items', sub: '' };
      window.RFUI.setHTML(colCardsContainer, `
        <div class="kanban-empty-placeholder">
          <span class="empty-icon">${hint.icon}</span>
          <span class="empty-text">${escapeHTML(hint.text)}</span>
          <span class="empty-subtext">${escapeHTML(hint.sub)}</span>
        </div>
      `);
    }

    if (!colCardsContainer.dataset.dragBound) {
      colCardsContainer.dataset.dragBound = 'true';

      colCardsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        colCardsContainer.classList.add('drag-over');
      });

      colCardsContainer.addEventListener('dragleave', () => {
        colCardsContainer.classList.remove('drag-over');
      });

      colCardsContainer.addEventListener('drop', async (e) => {
        e.preventDefault();
        colCardsContainer.classList.remove('drag-over');

        const manuscriptId = e.dataTransfer.getData('text/plain');
        const man = db.manuscripts.find(x => x.id === manuscriptId);
        if (man) {
          // Move status to the category column
          let newStatus = col;
          if (col === 'idea') newStatus = 'planning';
          else if (col === 'drafting') newStatus = 'in_progress';
          else if (col === 'submitted') newStatus = 'submitted';
          else if (col === 'accepted') newStatus = 'accepted';

          try {
            const result = await persistManuscriptStatusChange(man, newStatus);
            renderKanban();
            renderDashboard();
            renderSubmissions();
            showGlobalToast(tf('manuscriptStatusUpdatedTo', { status: getManuscriptStatusLabel(newStatus) }), 'success');
            if (result.shouldCelebrate) {
              showAcceptanceCelebration({ title: result.manuscript.title, manuscriptId: result.manuscript.id });
            }
          } catch (error) {
            console.error('Manuscript status drop save failed:', error);
            renderKanban();
            showGlobalToast(error.message || t('autoSaveFailed'), 'error');
          }
        }
      });
    }
  });
  document.querySelector('.kanban-board')?.classList.toggle('all-empty', visibleManuscripts.length === 0);
  setText('#kanban-stage-summary', tf('kanbanStageSummary', { count: columns.filter(col => mCount[col] > 0).length, total: columns.length }));
  updateKanbanEmptyColumns();
}

function normalizeKanbanStatusClass(status) {
  const normalized = normalizeText(status || 'planning').replace(/_/g, '-');
  if (['planning', 'idea', 'outline', 'data-collection'].includes(normalized)) return 'planning';
  if (['in-progress', 'figure-preparation', 'drafting', 'internal-review'].includes(normalized)) return 'drafting';
  if (['submitted', 'under-review', 'revision'].includes(normalized)) return 'submitted';
  if (['accepted', 'published'].includes(normalized)) return 'accepted';
  return 'planning';
}

function getManuscriptStatusLabel(status) {
  const labels = {
    planning: t('statusPlanning'),
    idea: t('statusIdea'),
    outline: t('statusOutline'),
    data_collection: currentLanguage === 'zh' ? '数据整理' : 'Data Collection',
    in_progress: t('statusInProgress'),
    figure_preparation: t('statusFiguresPrep'),
    drafting: t('statusDrafting'),
    internal_review: t('statusInternalReview'),
    submitted: getSubmissionStatusLabel('submitted'),
    under_review: getSubmissionStatusLabel('under_review'),
    revision: getSubmissionStatusLabel('revision'),
    accepted: getSubmissionStatusLabel('accepted'),
    published: getSubmissionStatusLabel('published'),
    rejected: getSubmissionStatusLabel('rejected')
  };
  return labels[status] || String(status || 'planning').replace(/_/g, ' ');
}

function getSubmissionStatusLabel(status) {
  const canonicalStatus = normalizeSubmissionStatus(status);
  const labels = {
    submitted: t('stateSubmitted'),
    under_review: t('stateUnderReview'),
    revision: t('eventTypeRevision'),
    accepted: t('stateAccepted'),
    published: currentLanguage === 'zh' ? '已发表' : 'Published',
    rejected: t('statusRejected')
  };
  return labels[canonicalStatus] || String(canonicalStatus || t('stateSubmitted')).replace(/_/g, ' ');
}

async function deleteManuscript(manuscriptId) {
  if (!manuscriptId) return false;
  const man = (db.manuscripts || []).find(item => item.id === manuscriptId);
  if (!man) return false;

  const title = man.title || (currentLanguage === 'zh' ? '该稿件' : 'this manuscript');
  const linkedSubmissions = (db.submissions || []).filter(sub => sub.manuscriptId === manuscriptId);

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
    // 1. 级联记录关联 submissions 的删除墓碑并从内存数组中剔除
    for (const sub of linkedSubmissions) {
      if (typeof window.storage?.recordEntityDeletion === 'function') {
        window.storage.recordEntityDeletion(db, 'submissions', sub.id);
      } else {
        db.submissions = (db.submissions || []).filter(s => s.id !== sub.id);
      }
      if (typeof selectedSubmissionId !== 'undefined' && selectedSubmissionId === sub.id) {
        selectedSubmissionId = null;
      }
    }

    // 2. 记录 manuscript 的删除墓碑并从内存数组中剔除
    if (typeof window.storage?.recordEntityDeletion === 'function') {
      window.storage.recordEntityDeletion(db, 'manuscripts', manuscriptId);
    } else {
      db.manuscripts = (db.manuscripts || []).filter(m => m.id !== manuscriptId);
    }

    // 3. 持久化数据
    if (typeof window.storage?.saveAll === 'function') {
      await window.storage.saveAll(db);
    }

    // 4. 刷新各个视图
    if (typeof renderKanban === 'function') renderKanban();
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderSubmissions === 'function') renderSubmissions();

    // 5. 若投稿详情面板展示的是已被级联删除的投稿，重置详情面板为 empty-state
    const subDetailPanel = document.getElementById('submission-detail-panel');
    if (subDetailPanel && (!selectedSubmissionId || linkedSubmissions.some(s => s.id === selectedSubmissionId))) {
      window.RFUI?.setHTML?.(subDetailPanel, `
        <div class="empty-state">
          <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <h3>${escapeHTML(t('submissionEmptyDetail') || (currentLanguage === 'zh' ? '请选择一个投稿记录查看详情' : 'Select a submission to view details'))}</h3>
        </div>
      `);
    }

    // 6. 弹出全局 Toast 提示
    const toastMsg = t('manuscriptDeletedToast') || (currentLanguage === 'zh' ? '稿件已成功删除。' : 'Manuscript deleted successfully.');
    if (typeof showGlobalToast === 'function') {
      showGlobalToast(toastMsg, 'success');
    }
    return true;
  } catch (error) {
    console.error('Delete manuscript failed:', error);
    if (typeof showGlobalToast === 'function') {
      showGlobalToast(error.message || (currentLanguage === 'zh' ? '删除稿件失败' : 'Failed to delete manuscript'), 'error');
    }
    return false;
  }
}

// Add/Edit Manuscript Modal
document.getElementById('btn-add-manuscript')?.addEventListener('click', () => {
  openManuscriptModal(null);
});



function openManuscriptModal(man = null, prefill = null) {
  const isEdit = !!man;
  const initialTitle = isEdit ? man.title : prefill?.title;
  const initialJournal = isEdit ? man.targetJournals?.[0] : prefill?.publication;
  const initialAbstract = isEdit ? man.abstract : prefill?.abstract;
  const initialAuthors = isEdit
    ? (Array.isArray(man.authors) ? man.authors.join('; ') : man.authors)
    : (Array.isArray(prefill?.authorList) && prefill.authorList.length
      ? prefill.authorList.join('; ')
      : prefill?.authors);
  const initialDoi = isEdit ? man.doi : prefill?.doi;
  const initialArticleUrl = isEdit ? man.articleUrl : (prefill?.articleUrl || prefill?.pdfUrl);
  const initialStatus = isEdit
    ? man.status
    : (prefill?.status || (prefill?.isCapturedPublication ? 'published' : 'idea'));

  let currentZoteroItemKey = isEdit ? (man.zoteroItemKey || null) : (prefill?.zoteroItemKey || null);
  let currentZoteroUri = isEdit ? (man.zoteroUri || null) : (prefill?.zoteroUri || null);
  let currentPdfUri = isEdit ? (man.pdfUri || null) : (prefill?.pdfUri || null);
  let currentCiteKey = isEdit ? (man.citekey || '') : (prefill?.citekey || '');
  let currentBibtex = isEdit ? (man.bibtex || '') : (prefill?.bibtex || '');
  let currentCitationApa = isEdit ? (man.citationApa || '') : (prefill?.citationApa || '');
  let currentRelatedItems = isEdit ? (man.relatedItems || []) : (prefill?.relatedItems || []);

  const isZoteroEnv = Boolean(
    (typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) ||
    (typeof window !== 'undefined' && (window.Zotero || window.parent?.Zotero))
  );

  const zoteroActionBarHtml = isZoteroEnv ? `
    <div class="zotero-modal-action-bar" id="zotero-modal-hub" style="background:var(--material-background, rgba(0,0,0,0.02)); border:1px solid var(--border-color); border-radius:8px; padding:10px 14px; margin-bottom:14px; display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
        <div id="zotero-bind-status" style="font-size:12px; display:flex; align-items:center; gap:8px; cursor:pointer;" title="点击检索或关联 Zotero 文献库">
          ${currentZoteroItemKey
            ? `<span style="color:#059669; font-weight:600; display:inline-flex; align-items:center; gap:5px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                已关联 Zotero 文献条目
              </span>`
            : `<span style="color:#64748b; font-weight:500; display:inline-flex; align-items:center; gap:6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                ${escapeHTML(currentLanguage === 'zh' ? '未绑定 Zotero 文献条目 (点击可搜索关联)' : 'No Zotero item linked (Click to search)')}
              </span>`}
          <span id="zotero-modal-citekey" class="zotero-citekey-badge" style="${currentCiteKey ? '' : 'display:none;'}" title="点击复制 Citation Key">[@${escapeHTML(currentCiteKey)}]</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <button type="button" class="btn-secondary" id="btn-zotero-fetch-active" style="padding:4px 9px; font-size:11px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;" title="读取 Zotero 当前选中的文献条目并自动填充各字段">
            📥 从当前选中导入
          </button>
          <button type="button" class="btn-secondary" id="btn-zotero-toggle-search" style="padding:4px 9px; font-size:11px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;" title="在 Zotero 文献库中按关键词检索文献">
            🔍 检索文献库
          </button>
          <button type="button" class="btn-secondary" id="btn-zotero-copy-bib" style="padding:4px 8px; font-size:11px; color:#475569; ${currentBibtex ? '' : 'display:none;'}" title="复制 BibTeX 引用条目">
            📋 BibTeX
          </button>
          <button type="button" class="btn-secondary" id="btn-zotero-copy-apa" style="padding:4px 8px; font-size:11px; color:#475569; ${currentCitationApa ? '' : 'display:none;'}" title="复制标准引用 (APA)">
            📋 引用
          </button>
          <button type="button" class="btn-secondary" id="btn-zotero-toggle-annos" style="padding:4px 8px; font-size:11px; color:#d97706; ${currentZoteroItemKey ? '' : 'display:none;'}" title="查看并引用 Zotero 研读资产库：PDF划线批注、独立文献笔记、知识库分类与标签">
            📑 研读资产
          </button>
          <button type="button" class="btn-secondary" id="btn-zotero-open-pdf" style="padding:4px 8px; font-size:11px; color:#059669; ${currentZoteroItemKey ? '' : 'display:none;'}" title="在 Zotero 阅读器中打开 PDF">
            📖 原文 PDF
          </button>
          <button type="button" class="btn-secondary" id="btn-zotero-sync-note" style="padding:4px 8px; font-size:11px; color:#e11d48; border-color:rgba(225,29,72,0.3); font-weight:500; ${currentZoteroItemKey ? '' : 'display:none;'}" title="同步稿件进展至 Zotero 云笔记">
            📝 同步笔记
          </button>
          <button type="button" class="btn-secondary" id="btn-zotero-locate" style="padding:4px 8px; font-size:11px; ${currentZoteroItemKey ? '' : 'display:none;'}" title="${escapeHTML(currentLanguage === 'zh' ? '在 Zotero 文献库中定位该条目' : 'Locate item in Zotero library')}">
            🔗 ${escapeHTML(currentLanguage === 'zh' ? '定位' : 'Locate')}
          </button>
          <button type="button" class="btn-secondary" id="btn-zotero-unlink" style="padding:4px 8px; font-size:11px; color:#ef4444; ${currentZoteroItemKey ? '' : 'display:none;'}" title="${escapeHTML(currentLanguage === 'zh' ? '解除与 Zotero 文献的绑定' : 'Unlink from Zotero item')}">
            ✕ ${escapeHTML(currentLanguage === 'zh' ? '解绑' : 'Unlink')}
          </button>
        </div>
      </div>

      <!-- Quick Active Item Prompt Banner -->
      <div id="zotero-active-item-banner" style="display:none; background:rgba(37, 99, 235, 0.08); border:1px solid rgba(37, 99, 235, 0.25); border-radius:6px; padding:7px 10px; font-size:11.5px; color:#1d4ed8; justify-content:space-between; align-items:center;">
        <span id="zotero-active-item-text" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:78%;"></span>
        <button type="button" class="btn-primary" id="btn-zotero-quick-bind-active" style="padding:3px 9px; font-size:11px; cursor:pointer; flex-shrink:0;">⚡ 一键关联填入</button>
      </div>

      <!-- Live Search Box with Dropdown -->
      <div id="zotero-search-container" style="position:relative; width:100%; display:${currentZoteroItemKey ? 'none' : 'block'};">
        <input type="text" id="ipt-zotero-live-search" placeholder="${escapeHTML(currentLanguage === 'zh' ? '🔍 检索 Zotero 10 文献库 (输入标题/作者/DOI/年份) 快速关联并填充...' : '🔍 Search Zotero 10 library (title/author/DOI/year) to link...')}" style="font-size:12px; padding:7px 10px; width:100%; box-sizing:border-box; background:var(--input-bg); color:hsl(var(--text-primary)); border:1px solid var(--input-border); border-radius:6px; outline:none;">
        <div id="zotero-search-results-dropdown" class="zotero-search-dropdown" style="display:none;"></div>
      </div>

      <div id="man-zotero-annotations-panel" class="zotero-annotations-panel" style="display:none;"></div>
      <div id="man-zotero-related-panel" style="display:none; font-size:11px; color:hsl(var(--text-secondary));">
        <strong>🔗 Zotero 关联文献网络：</strong>
        <div id="man-zotero-related-chips" class="zotero-related-chips"></div>
      </div>
    </div>
  ` : '';

  openModal(`
    <div class="modal-header">
      <h2>${escapeHTML(isEdit ? t('editManuscriptMetadata') : t('addNewManuscriptTitle'))}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="关闭">✕</button>
    </div>

    ${buildAcademicCaptureSummary(prefill)}
    ${zoteroActionBarHtml}

    <div class="form-group">
      <label>${escapeHTML(t('manuscriptTitleLabel'))}</label>
      <input type="text" id="man-title" value="${escapeHTML(initialTitle || '')}" placeholder="${escapeHTML(t('paperTitlePlaceholder'))}">
    </div>

    <div class="grid-cols-2">
      <div class="form-group">
        <label>${escapeHTML(t('writingStatus'))}</label>
        <select id="man-status">
          <option value="planning" ${initialStatus === 'planning' ? 'selected' : ''}>${escapeHTML(t('statusPlanning'))}</option>
          <option value="idea" ${initialStatus === 'idea' ? 'selected' : ''}>${escapeHTML(t('statusIdea'))}</option>
          <option value="outline" ${initialStatus === 'outline' ? 'selected' : ''}>${escapeHTML(t('statusOutline'))}</option>
          <option value="in_progress" ${initialStatus === 'in_progress' ? 'selected' : ''}>${escapeHTML(t('statusInProgress'))}</option>
          <option value="figure_preparation" ${initialStatus === 'figure_preparation' ? 'selected' : ''}>${escapeHTML(t('statusFiguresPrep'))}</option>
          <option value="drafting" ${initialStatus === 'drafting' ? 'selected' : ''}>${escapeHTML(t('statusDrafting'))}</option>
          <option value="internal_review" ${initialStatus === 'internal_review' ? 'selected' : ''}>${escapeHTML(t('statusInternalReview'))}</option>
          <option value="submitted" ${initialStatus === 'submitted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('submitted'))}</option>
          <option value="under_review" ${initialStatus === 'under_review' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('under_review'))}</option>
          <option value="revision" ${initialStatus === 'revision' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('revision'))}</option>
          <option value="accepted" ${initialStatus === 'accepted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('accepted'))}</option>
          <option value="published" ${initialStatus === 'published' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('published'))}</option>
          <option value="rejected" ${initialStatus === 'rejected' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('rejected'))}</option>
        </select>
      </div>
      <div class="form-group">
        <label>${escapeHTML(t('targetJournalInput'))}</label>
        <input type="text" id="man-journal" value="${escapeHTML(initialJournal || '')}" placeholder="${escapeHTML(t('targetJournalPlaceholder'))}">
      </div>
    </div>

    <div class="form-group">
      <label>${escapeHTML(t('authorsLabel'))}</label>
      <input type="text" id="man-authors" value="${escapeHTML(initialAuthors || '')}" placeholder="A. Researcher; B. Scientist">
    </div>

    <div class="grid-cols-2">
      <div class="form-group">
        <label>${escapeHTML(t('doiLabel'))}</label>
        <input type="text" id="man-doi" value="${escapeHTML(initialDoi || '')}" placeholder="10.xxxx/xxxxx">
      </div>
      <div class="form-group">
        <label>${escapeHTML(t('scholarSourcePage'))}</label>
        <input type="url" id="man-article-url" value="${escapeHTML(initialArticleUrl || '')}" placeholder="https://…">
      </div>
    </div>

    <div class="form-group">
      <label>${escapeHTML(t('abstractDraft'))}</label>
      <textarea id="man-abstract" placeholder="${escapeHTML(t('abstractPlaceholder'))}">${escapeHTML(initialAbstract || '')}</textarea>
    </div>

    <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        ${isEdit ? `<button type="button" class="btn-danger" id="btn-modal-delete-man" style="cursor:pointer; padding:6px 14px;">${escapeHTML(t('deleteManuscript') || (currentLanguage === 'zh' ? '删除稿件' : 'Delete Manuscript'))}</button>` : ''}
      </div>
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn-secondary" id="btn-cancel-man">${escapeHTML(t('cancel') || '取消')}</button>
        <button type="button" class="btn-primary" id="btn-submit-man" style="min-width:120px;">${escapeHTML(isEdit ? t('saveChanges') : t('createManuscript'))}</button>
      </div>
    </div>
  `);

  document.getElementById('btn-cancel-man')?.addEventListener('click', closeModal);
  document.getElementById('btn-modal-delete-man')?.addEventListener('click', () => {
    closeModal();
    deleteManuscript(man.id);
  });

  if (isZoteroEnv) {
    const applyItemToForm = (item) => {
      if (!item) return;
      if (item.title) document.getElementById('man-title').value = item.title;
      if (item.publication) document.getElementById('man-journal').value = item.publication;
      if (item.authors) document.getElementById('man-authors').value = item.authors;
      if (item.doi) document.getElementById('man-doi').value = item.doi;
      if (item.url) document.getElementById('man-article-url').value = item.url;
      if (item.abstract) document.getElementById('man-abstract').value = item.abstract;
      updateZoteroBindUI(item);
      const searchContainer = document.getElementById('zotero-search-container');
      if (searchContainer) searchContainer.style.display = 'none';
      showGlobalToast(`已关联并填充文献《${(item.title || '').slice(0, 18)}…》元数据`, 'success');
      if (typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.showNativeToast('文献已关联', item.title, 'success');
      }
    };

    const updateZoteroBindUI = (item) => {
      const statusEl = document.getElementById('zotero-bind-status');
      const pdfBtn = document.getElementById('btn-zotero-open-pdf');
      const syncBtn = document.getElementById('btn-zotero-sync-note');
      const locateBtn = document.getElementById('btn-zotero-locate');
      const unlinkBtn = document.getElementById('btn-zotero-unlink');
      const bibBtn = document.getElementById('btn-zotero-copy-bib');
      const apaBtn = document.getElementById('btn-zotero-copy-apa');
      const annoBtn = document.getElementById('btn-zotero-toggle-annos');
      const searchContainer = document.getElementById('zotero-search-container');

      if (item && item.key) {
        currentZoteroItemKey = item.key;
        currentZoteroUri = item.zoteroUri;
        currentPdfUri = item.pdfUri;
        currentCiteKey = item.citekey || '';
        currentBibtex = item.bibtex || '';
        currentCitationApa = item.citationApa || '';
        currentRelatedItems = item.relatedItems || [];

        if (statusEl) {
          window.RFUI.setHTML(statusEl, `<span style="color:#059669; font-weight:600; display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>已关联: ${escapeHTML((item.title || '').slice(0, 22))}…</span>`);
          if (currentCiteKey) {
            const citeEl = document.createElement('span');
            citeEl.className = 'zotero-citekey-badge';
            citeEl.textContent = `[@${currentCiteKey}]`;
            citeEl.title = '点击复制 Citation Key';
            citeEl.addEventListener('click', (e) => {
              e.stopPropagation();
              if (typeof ZoteroBridge !== 'undefined') {
                ZoteroBridge.copyText(`[@${currentCiteKey}]`, `已复制 Citation Key: [@${currentCiteKey}]`);
              }
            });
            statusEl.appendChild(citeEl);
          }
        }
        if (pdfBtn) pdfBtn.style.display = item.pdfUri ? '' : 'none';
        if (syncBtn) syncBtn.style.display = '';
        if (locateBtn) locateBtn.style.display = '';
        if (unlinkBtn) unlinkBtn.style.display = '';
        if (bibBtn) bibBtn.style.display = currentBibtex ? '' : 'none';
        if (apaBtn) apaBtn.style.display = currentCitationApa ? '' : 'none';
        if (annoBtn) annoBtn.style.display = '';
        if (searchContainer) searchContainer.style.display = 'none';

        // Render related items if present
        const relPanel = document.getElementById('man-zotero-related-panel');
        const relChips = document.getElementById('man-zotero-related-chips');
        if (relPanel && relChips && Array.isArray(item.relatedItems) && item.relatedItems.length > 0) {
          window.RFUI.setHTML(relChips, '');
          item.relatedItems.forEach(r => {
            const chip = document.createElement('span');
            chip.className = 'zotero-related-chip';
            chip.textContent = `${(r.title || '').slice(0, 16)}… (${r.year || ''})`;
            chip.title = `${r.title} - ${r.authors} (点击在文献库定位)`;
            chip.addEventListener('click', () => {
              if (typeof ZoteroBridge !== 'undefined') {
                ZoteroBridge.selectItemInZotero(r.key);
              }
            });
            relChips.appendChild(chip);
          });
          relPanel.style.display = 'block';
        } else if (relPanel) {
          relPanel.style.display = 'none';
        }
      } else {
        currentZoteroItemKey = null;
        currentZoteroUri = null;
        currentPdfUri = null;
        currentCiteKey = '';
        currentBibtex = '';
        currentCitationApa = '';
        currentRelatedItems = [];
        if (statusEl) {
          window.RFUI.setHTML(statusEl, `<span style="color:#64748b; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>${escapeHTML(currentLanguage === 'zh' ? '未绑定 Zotero 文献条目 (点击可搜索关联)' : 'No Zotero item linked (Click to search)')}</span>`);
        }
        if (pdfBtn) pdfBtn.style.display = 'none';
        if (syncBtn) syncBtn.style.display = 'none';
        if (locateBtn) locateBtn.style.display = 'none';
        if (unlinkBtn) unlinkBtn.style.display = 'none';
        if (bibBtn) bibBtn.style.display = 'none';
        if (apaBtn) apaBtn.style.display = 'none';
        if (annoBtn) annoBtn.style.display = 'none';
        if (searchContainer) searchContainer.style.display = 'block';
        const relPanel = document.getElementById('man-zotero-related-panel');
        if (relPanel) relPanel.style.display = 'none';
        const annoPanel = document.getElementById('man-zotero-annotations-panel');
        if (annoPanel) annoPanel.style.display = 'none';
      }
    };

    // Auto-detect currently active item in Zotero asynchronously
    setTimeout(async () => {
      try {
        if (typeof ZoteroBridge !== 'undefined' && !currentZoteroItemKey) {
          const activeItem = await ZoteroBridge.getActiveItem();
          const banner = document.getElementById('zotero-active-item-banner');
          const textEl = document.getElementById('zotero-active-item-text');
          const quickBindBtn = document.getElementById('btn-zotero-quick-bind-active');
          if (activeItem && activeItem.title && banner && textEl) {
            window.RFUI.setHTML(textEl, `📌 <strong>检测到 Zotero 选中文献：</strong>《${escapeHTML(activeItem.title)}》`);
            banner.style.display = 'flex';
            quickBindBtn?.addEventListener('click', () => {
              applyItemToForm(activeItem);
              banner.style.display = 'none';
            });
          }
        }
      } catch (_) {}
    }, 60);

    // Clicking bind status card focuses / opens search
    document.getElementById('zotero-bind-status')?.addEventListener('click', () => {
      const searchContainer = document.getElementById('zotero-search-container');
      const searchInput = document.getElementById('ipt-zotero-live-search');
      if (searchContainer) {
        searchContainer.style.display = 'block';
        searchInput?.focus();
      }
    });

    document.getElementById('btn-zotero-toggle-search')?.addEventListener('click', () => {
      const searchContainer = document.getElementById('zotero-search-container');
      const searchInput = document.getElementById('ipt-zotero-live-search');
      if (searchContainer) {
        searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
        if (searchContainer.style.display === 'block') searchInput?.focus();
      }
    });

    // Citekey, BibTeX, and APA buttons
    document.getElementById('zotero-modal-citekey')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentCiteKey && typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.copyText(`[@${currentCiteKey}]`, `已复制 Citation Key: [@${currentCiteKey}]`);
      }
    });

    document.getElementById('btn-zotero-copy-bib')?.addEventListener('click', () => {
      if (currentBibtex && typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.copyText(currentBibtex, '已复制 BibTeX 引用条目');
      }
    });

    document.getElementById('btn-zotero-copy-apa')?.addEventListener('click', () => {
      if (currentCitationApa && typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.copyText(currentCitationApa, '已复制标准引用 (APA)');
      }
    });

    // Annotations panel toggle & load
    document.getElementById('btn-zotero-toggle-annos')?.addEventListener('click', async () => {
      const panel = document.getElementById('man-zotero-annotations-panel');
      if (!panel || !currentZoteroItemKey || typeof ZoteroBridge === 'undefined') return;
      if (panel.style.display !== 'none') {
        panel.style.display = 'none';
        return;
      }
      panel.style.display = 'flex';
      window.RFUI.setHTML(panel, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">⏳ 正在读取 Zotero 研读资产库 (PDF划线、独立笔记、分类标签)...</div>');

      const assets = typeof ZoteroBridge.getReadingAssets === 'function'
        ? await ZoteroBridge.getReadingAssets(currentZoteroItemKey)
        : { annotations: await ZoteroBridge.getAnnotations(currentZoteroItemKey), notes: [], collections: [], tags: [] };

      const annos = assets.annotations || [];
      const notes = assets.notes || [];
      const collections = assets.collections || [];
      const tags = assets.tags || [];

      window.RFUI.setHTML(panel, `
        <div class="zotero-drawer-tabs">
          <button type="button" class="zotero-drawer-tab active" data-tab="annos">
            🖍️ PDF 批注 <span class="zotero-drawer-badge">${annos.length}</span>
          </button>
          <button type="button" class="zotero-drawer-tab" data-tab="notes">
            📝 独立笔记 <span class="zotero-drawer-badge">${notes.length}</span>
          </button>
          <button type="button" class="zotero-drawer-tab" data-tab="meta">
            📁 分类与标签 <span class="zotero-drawer-badge">${collections.length + tags.length}</span>
          </button>
        </div>
        <div id="zotero-tab-content-annos" class="zotero-drawer-section"></div>
        <div id="zotero-tab-content-notes" class="zotero-drawer-section" style="display:none;"></div>
        <div id="zotero-tab-content-meta" class="zotero-drawer-section" style="display:none;"></div>
      `);

      // Tab switching
      panel.querySelectorAll('.zotero-drawer-tab').forEach(tabBtn => {
        tabBtn.addEventListener('click', (e) => {
          e.preventDefault();
          panel.querySelectorAll('.zotero-drawer-tab').forEach(b => b.classList.remove('active'));
          tabBtn.classList.add('active');
          const targetTab = tabBtn.dataset.tab;
          const secAnnos = panel.querySelector('#zotero-tab-content-annos');
          const secNotes = panel.querySelector('#zotero-tab-content-notes');
          const secMeta = panel.querySelector('#zotero-tab-content-meta');
          if (secAnnos) secAnnos.style.display = targetTab === 'annos' ? 'flex' : 'none';
          if (secNotes) secNotes.style.display = targetTab === 'notes' ? 'flex' : 'none';
          if (secMeta) secMeta.style.display = targetTab === 'meta' ? 'flex' : 'none';
        });
      });

      // 1. Populate Annotations
      const annosContainer = panel.querySelector('#zotero-tab-content-annos');
      if (annos.length === 0) {
        window.RFUI.setHTML(annosContainer, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">该文献 PDF 暂无高亮划线。您可在 Zotero 阅读器中选中文字添加高亮与批注。</div>');
      } else {
        if (annos.length > 1) {
          const batchBar = document.createElement('div');
          batchBar.className = 'zotero-batch-toolbar';
          window.RFUI.setHTML(batchBar, `
            <span>共检测到 <strong>${annos.length}</strong> 条 PDF 批注划线</span>
            <button type="button" class="btn-secondary" id="btn-batch-insert-annos" style="font-size:10px; padding:2px 8px; color:var(--text-accent, #e11d48); font-weight:600; cursor:pointer;">
              ➕ 全部汇入研读草稿
            </button>
          `);
          batchBar.querySelector('#btn-batch-insert-annos')?.addEventListener('click', () => {
            const absBox = document.getElementById('man-abstract');
            if (absBox) {
              const allQuotes = annos
                .filter(a => a.text || a.comment)
                .map(a => `> "${a.text || a.comment}" (第 ${a.page} 页)`)
                .join('\n\n');
              absBox.value = (absBox.value + '\n\n【Zotero PDF 研读摘录汇编】\n' + allQuotes).trim();
              showGlobalToast(`已将全部 ${annos.length} 条批注汇入草稿！`, 'success');
            }
          });
          annosContainer.appendChild(batchBar);
        }

        annos.forEach(a => {
          const itemEl = document.createElement('div');
          itemEl.className = 'zotero-annotation-item';
          window.RFUI.setHTML(itemEl, `
            <div class="zotero-annotation-head">
              <span style="font-weight:600; color:${a.color || '#e11d48'};">● 第 ${a.page} 页 ${a.type === 'note' ? '独立批注' : '高亮划线'}</span>
              <span>${a.date ? new Date(a.date).toLocaleDateString() : ''}</span>
            </div>
            ${a.text ? `<div class="zotero-annotation-body" style="border-left-color:${a.color || '#ffd400'};">${escapeHTML(a.text)}</div>` : ''}
            ${a.comment ? `<div class="zotero-annotation-comment">💡 批注：${escapeHTML(a.comment)}</div>` : ''}
            <div class="zotero-annotation-actions">
              <button type="button" class="btn-secondary btn-quote-insert" style="font-size:10px; padding:2px 6px;">➕ 插入草稿</button>
              <button type="button" class="btn-secondary btn-quote-jump" style="font-size:10px; padding:2px 6px;">📖 原文第 ${a.page} 页</button>
            </div>
          `);
          itemEl.querySelector('.btn-quote-insert')?.addEventListener('click', () => {
            const absBox = document.getElementById('man-abstract');
            if (absBox) {
              const quoteContent = `\n\n> "${a.text || a.comment}" (第 ${a.page} 页)`;
              absBox.value = (absBox.value + quoteContent).trim();
              showGlobalToast('已将划线批注插入到研读草稿中', 'success');
            }
          });
          itemEl.querySelector('.btn-quote-jump')?.addEventListener('click', () => {
            if (currentZoteroItemKey && typeof ZoteroBridge !== 'undefined') {
              ZoteroBridge.openPdf(currentZoteroItemKey, a.pageIndex + 1);
            }
          });
          annosContainer.appendChild(itemEl);
        });
      }

      // 2. Populate Notes
      const notesContainer = panel.querySelector('#zotero-tab-content-notes');
      if (notes.length === 0) {
        window.RFUI.setHTML(notesContainer, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">该文献在 Zotero 中暂无独立文献笔记。您可在 Zotero 中为该条目添加子笔记记录研读心得。</div>');
      } else {
        notes.forEach(n => {
          const noteEl = document.createElement('div');
          noteEl.className = 'zotero-note-item';
          window.RFUI.setHTML(noteEl, `
            <div class="zotero-note-head">
              <span>📝 ${escapeHTML(n.title || 'Zotero 笔记')}</span>
              <span style="font-size:10px; color:#64748b; font-weight:normal;">${n.date ? new Date(n.date).toLocaleDateString() : ''}</span>
            </div>
            <div class="zotero-note-body">${escapeHTML(n.snippet || '')}</div>
            <div class="zotero-note-actions">
              <button type="button" class="btn-secondary btn-insert-note" style="font-size:10px; padding:2px 6px;">➕ 插入草稿</button>
              <button type="button" class="btn-secondary btn-locate-note" style="font-size:10px; padding:2px 6px;">🔗 定位笔记</button>
            </div>
          `);
          noteEl.querySelector('.btn-insert-note')?.addEventListener('click', () => {
            const absBox = document.getElementById('man-abstract');
            if (absBox) {
              const noteContent = `\n\n【Zotero 研读笔记摘记】\n${n.snippet || ''}`;
              absBox.value = (absBox.value + noteContent).trim();
              showGlobalToast('已将文献笔记插入到研读草稿中', 'success');
            }
          });
          noteEl.querySelector('.btn-locate-note')?.addEventListener('click', () => {
            if (typeof ZoteroBridge !== 'undefined') {
              ZoteroBridge.selectItemInZotero(n.key);
            }
          });
          notesContainer.appendChild(noteEl);
        });
      }

      // 3. Populate Collections & Tags
      const metaContainer = panel.querySelector('#zotero-tab-content-meta');
      window.RFUI.setHTML(metaContainer, '');
      if (collections.length > 0) {
        const colSection = document.createElement('div');
        window.RFUI.setHTML(colSection, `<strong style="font-size:11px; color:hsl(var(--text-secondary)); display:block; margin-bottom:4px;">📁 所属 Zotero 知识库分类：</strong>`);
        const pillsWrap = document.createElement('div');
        pillsWrap.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px;';
        collections.forEach(col => {
          const pill = document.createElement('span');
          pill.className = 'zotero-collection-pill';
          pill.textContent = `📁 ${col.path || col.name}`;
          pillsWrap.appendChild(pill);
        });
        colSection.appendChild(pillsWrap);
        metaContainer.appendChild(colSection);
      }

      if (tags.length > 0) {
        const tagSection = document.createElement('div');
        tagSection.style.marginTop = '6px';
        window.RFUI.setHTML(tagSection, `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="font-size:11px; color:hsl(var(--text-secondary));">🏷️ Zotero 文献标签：</strong>
            <button type="button" class="btn-secondary" id="btn-extract-tags-to-notes" style="font-size:10px; padding:2px 6px;">➕ 提取为主题标签</button>
          </div>
        `);
        const tagsWrap = document.createElement('div');
        tagsWrap.style.cssText = 'display:flex; flex-wrap:wrap; gap:4px;';
        tags.forEach(tg => {
          const tagPill = document.createElement('span');
          tagPill.className = 'zotero-tag-pill';
          tagPill.textContent = `#${tg}`;
          tagsWrap.appendChild(tagPill);
        });
        tagSection.appendChild(tagsWrap);

        tagSection.querySelector('#btn-extract-tags-to-notes')?.addEventListener('click', () => {
          const absBox = document.getElementById('man-abstract');
          if (absBox) {
            const tagsText = `\n\n【主题关键词】：${tags.join(', ')}`;
            absBox.value = (absBox.value + tagsText).trim();
            showGlobalToast(`已将 ${tags.length} 个标签添加至研读草稿！`, 'success');
          }
        });
        metaContainer.appendChild(tagSection);
      }

      if (collections.length === 0 && tags.length === 0) {
        window.RFUI.setHTML(metaContainer, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">该文献暂未分配分类目录与标签。</div>');
      }
    });

    // Live search in Zotero library
    const searchInput = document.getElementById('ipt-zotero-live-search');
    const dropdown = document.getElementById('zotero-search-results-dropdown');
    let searchTimer = null;

    if (searchInput && dropdown) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimer);
        if (query.length < 2) {
          dropdown.style.display = 'none';
          window.RFUI.setHTML(dropdown, '');
          return;
        }
        searchTimer = setTimeout(async () => {
          window.RFUI.setHTML(dropdown, `<div class="zotero-search-empty">🔍 ${escapeHTML(currentLanguage === 'zh' ? '检索中...' : 'Searching...')}</div>`);
          dropdown.style.display = 'block';
          const results = typeof ZoteroBridge !== 'undefined'
            ? await ZoteroBridge.searchLibrary(query, 10)
            : [];
          if (!results || results.length === 0) {
            window.RFUI.setHTML(dropdown, `<div class="zotero-search-empty">${escapeHTML(currentLanguage === 'zh' ? '未找到匹配的 Zotero 文献' : 'No matching Zotero items found')}</div>`);
            return;
          }
          window.RFUI.setHTML(dropdown, '');
          results.forEach(res => {
            const itemEl = document.createElement('div');
            itemEl.className = 'zotero-search-result-item';
            window.RFUI.setHTML(itemEl, `
              <div class="zotero-search-result-title">${escapeHTML(res.title || '无标题文献')}</div>
              <div class="zotero-search-result-meta">${escapeHTML(res.authors || '')} ${res.year ? `· ${escapeHTML(res.year)}` : ''} ${res.publication ? `· ${escapeHTML(res.publication)}` : ''}</div>
            `);
            itemEl.addEventListener('click', () => {
              applyItemToForm(res);
              dropdown.style.display = 'none';
              searchInput.value = '';
            });
            dropdown.appendChild(itemEl);
          });
        }, 220);
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }

    document.getElementById('btn-zotero-fetch-active')?.addEventListener('click', async () => {
      const activeItem = typeof ZoteroBridge !== 'undefined'
        ? await ZoteroBridge.getActiveItem()
        : null;
      if (activeItem) {
        applyItemToForm(activeItem);
      } else {
        showGlobalToast('未在 Zotero 中检测到选中条目，请在文献库中单击选中目标论文。', 'warning');
      }
    });

    document.getElementById('btn-zotero-open-pdf')?.addEventListener('click', () => {
      if (currentZoteroItemKey && typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.openPdf(currentZoteroItemKey);
      }
    });

    document.getElementById('btn-zotero-sync-note')?.addEventListener('click', async () => {
      if (currentZoteroItemKey && typeof ZoteroBridge !== 'undefined') {
        const ok = await ZoteroBridge.syncNote(currentZoteroItemKey);
        if (ok) {
          showGlobalToast('已同步审稿进展至 Zotero 云端笔记！', 'success');
        } else {
          showGlobalToast('同步失败，请检查条目是否存在', 'error');
        }
      }
    });

    document.getElementById('btn-zotero-locate')?.addEventListener('click', () => {
      if (currentZoteroItemKey && typeof ZoteroBridge !== 'undefined') {
        ZoteroBridge.selectItemInZotero(currentZoteroItemKey);
      }
    });

    document.getElementById('btn-zotero-unlink')?.addEventListener('click', () => {
      updateZoteroBindUI(null);
      const searchContainer = document.getElementById('zotero-search-container');
      if (searchContainer) searchContainer.style.display = 'block';
      showGlobalToast('已解除 Zotero 文献绑定', 'info');
    });
  }

  document.getElementById('btn-submit-man').addEventListener('click', async () => {
    const title = document.getElementById('man-title').value.trim();
    const status = document.getElementById('man-status').value;
    const journal = document.getElementById('man-journal').value.trim();
    const authors = splitAcademicAuthors(document.getElementById('man-authors').value);
    const doi = normalizeDoi(document.getElementById('man-doi').value);
    const articleUrl = document.getElementById('man-article-url').value.trim();
    const abstract = document.getElementById('man-abstract').value.trim();

    if (!title) {
      alert(t('manuscriptTitleRequired'));
      return;
    }

    const duplicate = !isEdit && prefill
      ? findAcademicManuscriptMatch({ title, doi, articleUrl })
      : null;
    if (duplicate && !confirm(t('academicDuplicateConfirm'))) return;

    const targetManuscript = isEdit ? man : duplicate;
    if (targetManuscript) {
      try { validateLinkedManuscriptStatus(targetManuscript, status); }
      catch (error) { showGlobalToast(error.message, 'error'); return; }
      // The manuscript editor no longer exposes project context. Preserve a
      // legacy relationship on edits so existing records remain intact, while
      // new manuscripts stay independent of the retired project framework.
      targetManuscript.title = title;
      setManuscriptStatus(targetManuscript, status);
      targetManuscript.targetJournals = journal ? [journal] : [];
      targetManuscript.abstract = abstract;
      targetManuscript.authors = authors;
      targetManuscript.firstAuthor = authors[0] || targetManuscript.firstAuthor || null;
      targetManuscript.doi = doi || null;
      targetManuscript.articleUrl = articleUrl || null;
      if (currentZoteroItemKey !== undefined) {
        targetManuscript.zoteroItemKey = currentZoteroItemKey;
        targetManuscript.zoteroUri = currentZoteroUri;
        targetManuscript.pdfUri = currentPdfUri;
        targetManuscript.citekey = currentCiteKey || targetManuscript.citekey || null;
        targetManuscript.bibtex = currentBibtex || targetManuscript.bibtex || null;
        targetManuscript.citationApa = currentCitationApa || targetManuscript.citationApa || null;
      }
      if (prefill) targetManuscript.academicCaptureProvenance = academicCaptureProvenance(prefill);
      targetManuscript.updatedAt = new Date().toISOString();
      syncLinkedSubmissionsFromManuscript(targetManuscript);
    } else {
      const newMan = {
        id: 'man_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        title,
        shortTitle: null,
        manuscriptType: 'article',
        status,
        abstract,
        keywords: [],
        authors,
        firstAuthor: authors[0] || null,
        correspondingAuthors: [],
        targetJournals: journal ? [journal] : [],
        doi: doi || null,
        articleUrl: articleUrl || null,
        zoteroItemKey: currentZoteroItemKey || null,
        zoteroUri: currentZoteroUri || null,
        pdfUri: currentPdfUri || null,
        citekey: currentCiteKey || null,
        bibtex: currentBibtex || null,
        citationApa: currentCitationApa || null,
        academicCaptureProvenance: academicCaptureProvenance(prefill),
        currentVersion: '1.0',
        plannedFigures: [],
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.manuscripts.push(newMan);
    }

    await window.storage.saveAll(db);
    if (currentZoteroItemKey && typeof ZoteroBridge !== 'undefined' && ZoteroBridge.isZotero) {
      ZoteroBridge.syncStatusTag(currentZoteroItemKey, status);
      ZoteroBridge.addToPipelineCollection(currentZoteroItemKey);
      ZoteroBridge.syncNote(currentZoteroItemKey);
    }
    closeModal();
    renderKanban();
    renderDashboard();
    renderSubmissions();
    showGlobalToast(
      duplicate
        ? t('academicDuplicateUpdated')
        : (prefill ? t('academicCaptureSaved') : 'Manuscripts updated!'),
      'success'
    );
  });
}

if (typeof window !== 'undefined') {
  window.deleteManuscript = deleteManuscript;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...(module.exports || {}),
    deleteManuscript
  };
}

