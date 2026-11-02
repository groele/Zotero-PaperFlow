/**
 * Zotero PaperFlow - Submission Share Studio Module
 * Renders submission timeline milestone share cards and exports PNG canvases.
 */
function buildDefaultSubmissionTimeline(submission) {
  const stamp = Date.now();
  const linkedMan = db?.manuscripts?.find(m => m.id === submission?.manuscriptId);
  const isAcceptedOrPublished = hasPublicationStatus(submission) ||
    Boolean(linkedMan && (hasPublicationStatus(linkedMan) || linkedMan.status === 'accepted' || linkedMan.status === 'published'));
  const isPublished = submission?.status === 'published' || Boolean(linkedMan && linkedMan.status === 'published');

  const definitions = [
    ['Experiments Started', 'research', 'completed'],
    ['Experiments Completed', 'research', 'completed'],
    ['Data Organization', 'research', 'completed'],
    ['Draft Completed', 'writing', 'completed'],
    ['Manuscript Submitted', 'submission', isAcceptedOrPublished ? 'completed' : 'active'],
    ['Review Comments R1', 'review', isAcceptedOrPublished ? 'completed' : 'pending'],
    ['R1 Revision Submitted', 'revision', isAcceptedOrPublished ? 'completed' : 'pending'],
    ['Accepted', 'publication', isAcceptedOrPublished ? 'completed' : 'pending'],
    ['Online Publication', 'publication', isPublished ? 'completed' : 'pending']
  ];
  return definitions.map(([name, type, status], index) => ({
    id: `node_${index + 1}_${submission.id}_${stamp}`,
    name,
    type,
    planDate: '',
    completeDate: '',
    dueDate: '',
    status,
    notes: ''
  }));
}

function getSubmissionShareEvents(submission, startMode = 'experiment') {
  const events = autoSortNodes(submission.timelineNodes || [])
    .map(node => ({
      name: getTimelineNodeDisplayName(node),
      date: getNodeDate(node),
      type: node.type || 'special',
      status: computeNodeStatus(node),
      completed: Boolean(node.completeDate),
      due: !node.completeDate && !node.planDate && Boolean(node.dueDate),
      key: inferKey(node)
    }))
    .filter(event => event.date && Number.isFinite(new Date(event.date).getTime()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  if (!events.length) return events;
  const analysis = analyzeSubmission(submission);
  const submissionStart = analysis.submitDate;
  const experimentStart = analysis.experimentStartDate
    || events.find(event => event.key === 'experiment_start')?.date
    || events.find(event => event.type === 'research')?.date
    || events[0].date;
  const anchor = startMode === 'submission' ? (submissionStart || events[0].date) : experimentStart;
  return events.filter(event => new Date(event.date) >= new Date(anchor));
}

function normalizeShareVisibility(value = {}) {
  value = value && typeof value === 'object' ? value : {};
  const size = ['portrait', 'story', 'auto'].includes(value.size) ? value.size : 'portrait';
  const timelineStart = value.timelineStart === 'submission' ? 'submission' : 'experiment';
  return {
    title: value.title !== false,
    journal: value.journal !== false,
    author: value.author !== false,
    status: value.status !== false,
    duration: value.duration !== false,
    dates: value.dates !== false,
    footer: value.footer !== false,
    brandSize: ['compact', 'balanced', 'bold'].includes(value.brandSize) ? value.brandSize : 'balanced',
    resolution: [1, 2, 3].includes(Number(value.resolution)) ? Number(value.resolution) : 2,
    appearance: ['paper', 'ink', 'blueprint', 'minimal', 'cyber', 'aurora', 'terminal', 'journal', 'conference', 'archive', 'estuary', 'iris', 'amber'].includes(value.appearance) ? value.appearance : 'paper',
    size,
    timelineStart
  };
}

function createSubmissionShareCanvas(submission, visibility = {}) {
  const visible = normalizeShareVisibility(visibility);
  const snapshot = structuredClone(submission);
  const manuscript = db?.manuscripts?.find(item => item.id === submission.manuscriptId);
  const title = manuscript?.title || submission.title || t('untitledManuscript');
  const analysis = analyzeSubmission(snapshot);
  const events = getSubmissionShareEvents(snapshot, visible.timelineStart);
  const zh = currentLanguage === 'zh';
  const start = visible.timelineStart === 'submission'
    ? analysis.submitDate
    : analysis.experimentStartDate || events.find(event => event.type === 'research')?.date || events[0]?.date;
  const status = normalizeSubmissionStatus(submission.status);
  const end = analysis.accepted ? analysis.acceptDate || analysis.onlineDate
    : status === 'rejected' ? submission.rejectedAt || submission.decisionDate : todayString();
  const duration = start && end && new Date(start) <= new Date(end) ? getDaysDiff(start, end) : null;
  const startLabel = visible.timelineStart === 'submission' ? (zh ? '投稿' : 'submission') : (zh ? '首个记录节点' : 'first recorded milestone');
  const endLabel = analysis.accepted ? (zh ? '接收 / 发表' : 'acceptance / publication') : status === 'rejected' ? (zh ? '决定日期' : 'decision') : (zh ? '今天' : 'today');
  const typeLabels = zh
    ? { research: '研究', writing: '写作', submission: '投稿', review: '审稿', revision: '修回', publication: '出版', special: '节点' }
    : { research: 'Research', writing: 'Writing', submission: 'Submission', review: 'Review', revision: 'Revision', publication: 'Publication', special: 'Milestone' };
  const model = {
    language: currentLanguage,
    title,
    journal: getSubmissionJournalName(submission),
    author: getSubmissionFirstAuthor(submission, manuscript),
    status: getSubmissionStatusLabel(submission.status),
    duration,
    durationLabel: zh ? `从${startLabel}至${endLabel}` : `From ${startLabel} to ${endLabel}`,
    events: events.map(event => {
      const parsed = new Date(event.date);
      return {
        name: event.name,
        completed: event.completed,
        typeLabel: typeLabels[event.type] || typeLabels.special,
        dateKindLabel: event.completed ? (zh ? '已记录' : 'Recorded') : event.due ? (zh ? '截止日期' : 'Due date') : (zh ? '计划日期' : 'Planned'),
        dateLabel: new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' }).format(parsed),
        yearLabel: String(parsed.getUTCFullYear())
      };
    })
  };
  const result = window.RFShareCard.render(model, visible);
  // Hidden manuscript titles must not leak through filenames or native share text.
  return { ...result, title: visible.title ? title : (zh ? '投稿历程' : 'Submission journey') };
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png', 0.96);
  });
}

function safeShareFileName(title) {
  const base = String(title || 'submission-journey')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 72);
  return `${base || 'submission'}${/journey$/i.test(base) ? '' : '-journey'}.png`;
}

async function downloadShareBlob(blob, fileName) {
  if (typeof ZoteroBridge === 'undefined' || !ZoteroBridge.isZotero || !ZoteroBridge.saveShareImage) {
    throw new Error(currentLanguage === 'zh' ? '请在 Zotero 中打开 Zotero PaperFlow 后保存图片。' : 'Open Zotero PaperFlow in Zotero to save the image.');
  }
  const result = await ZoteroBridge.saveShareImage(blob, fileName, currentLanguage);
  if (result?.cancelled) return result;
  if (!result?.success || !result.filePath) {
    throw new Error(result?.error || (currentLanguage === 'zh' ? 'Zotero 未确认文件保存。' : 'Zotero did not confirm the file was saved.'));
  }
  return result;
}

async function openSubmissionSharePreview(submissionId, triggerButton) {
  const submission = db.submissions.find(item => item.id === submissionId);
  if (!submission) return;
  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.setAttribute('aria-busy', 'true');
  }

  try {
    await sharePreferenceWrites.catch(() => {});
    const stored = await RFPlatform.storage.local.get([SHARE_PREFS_STORAGE_KEY]);
    let visibility = normalizeShareVisibility(stored?.[SHARE_PREFS_STORAGE_KEY]);
    let currentBlob = null;
    let currentFileName = '';
    let savePending = false;
    let previewRenderId = 0;
    const fields = [
      ['title', 'shareFieldTitle'],
      ['journal', 'shareFieldJournal'],
      ['author', 'shareFieldAuthor'],
      ['status', 'shareFieldStatus'],
      ['duration', 'shareFieldDuration'],
      ['dates', 'shareFieldDates'],
      ['footer', 'shareFieldFooter']
    ];
    const visibilityControls = fields.map(([key, labelKey]) => `
      <label class="share-visibility-chip">
        <input type="checkbox" data-share-field="${key}" ${visibility[key] ? 'checked' : ''}>
        <span class="share-visibility-check" aria-hidden="true">✓</span>
        <span>${escapeHTML(t(labelKey))}</span>
      </label>
    `).join('');
    const styleGallery = window.RFShareCard.getAppearances().map(style => {
      const name = t(`share${style.id[0].toUpperCase()}${style.id.slice(1)}`);
      const background = style.paperGradient ? `linear-gradient(135deg, ${style.paperGradient.join(', ')})` : style.paper;
      return `<button type="button" class="share-style-tile" data-share-style="${style.id}" aria-pressed="${visibility.appearance === style.id}" title="${escapeHTML(name)}"><span class="share-style-sample" aria-hidden="true" style="--sample-bg:${background};--sample-ink:${style.ink};--sample-accent:${style.accent}"><i></i><b>Aa</b><em></em></span><span>${escapeHTML(name.split(' · ')[0])}</span></button>`;
    }).join('');

    openModal(`
      <div class="share-preview-shell">
        <div class="share-preview-header">
          <div>
            <span class="share-preview-kicker">Zotero PaperFlow / Share Studio</span>
            <h2>${escapeHTML(t('shareJourneyTitle'))}</h2>
            <p>${escapeHTML(t('shareJourneyHelp'))}</p>
          </div>
          <button class="btn-icon share-preview-close" id="btn-close-modal" type="button" aria-label="${escapeHTML(t('close'))}">×</button>
        </div>
        <div class="share-preview-workbench">
          <aside class="share-visibility-panel" aria-label="${escapeHTML(t('shareVisibilityTitle'))}">
            <div class="share-visibility-heading">
              <strong>${escapeHTML(t('shareVisibilityTitle'))}</strong>
              <small>${escapeHTML(t('shareVisibilityHelp'))}</small>
            </div>
            <label class="share-size-control" for="share-appearance"><span>${escapeHTML(t('shareAppearance'))}</span><select id="share-appearance"><option value="paper" ${visibility.appearance === 'paper' ? 'selected' : ''}>${escapeHTML(t('sharePaper'))}</option><option value="ink" ${visibility.appearance === 'ink' ? 'selected' : ''}>${escapeHTML(t('shareInk'))}</option><option value="blueprint" ${visibility.appearance === 'blueprint' ? 'selected' : ''}>${escapeHTML(t('shareBlueprint'))}</option><option value="minimal" ${visibility.appearance === 'minimal' ? 'selected' : ''}>${escapeHTML(t('shareMinimal'))}</option><option value="cyber" ${visibility.appearance === 'cyber' ? 'selected' : ''}>${escapeHTML(t('shareCyber'))}</option><option value="aurora" ${visibility.appearance === 'aurora' ? 'selected' : ''}>${escapeHTML(t('shareAurora'))}</option><option value="terminal" ${visibility.appearance === 'terminal' ? 'selected' : ''}>${escapeHTML(t('shareTerminal'))}</option><option value="journal" ${visibility.appearance === 'journal' ? 'selected' : ''}>${escapeHTML(t('shareJournal'))}</option><option value="conference" ${visibility.appearance === 'conference' ? 'selected' : ''}>${escapeHTML(t('shareConference'))}</option><option value="archive" ${visibility.appearance === 'archive' ? 'selected' : ''}>${escapeHTML(t('shareArchive'))}</option><option value="estuary" ${visibility.appearance === 'estuary' ? 'selected' : ''}>${escapeHTML(t('shareEstuary'))}</option><option value="iris" ${visibility.appearance === 'iris' ? 'selected' : ''}>${escapeHTML(t('shareIris'))}</option><option value="amber" ${visibility.appearance === 'amber' ? 'selected' : ''}>${escapeHTML(t('shareAmber'))}</option></select></label>
            <details class="share-style-browser" open><summary>${escapeHTML(t('shareGallery'))}</summary><div class="share-style-gallery" role="group" aria-label="${escapeHTML(t('shareAppearance'))}">${styleGallery}</div></details>
            <div class="share-visibility-list">${visibilityControls}</div>
            <label class="share-size-control" for="share-brand-size"><span>${escapeHTML(t('shareBrandSize'))}</span><select id="share-brand-size" ${visibility.footer ? '' : 'disabled'}>${['compact','balanced','bold'].map(key => `<option value="${key}" ${visibility.brandSize === key ? 'selected' : ''}>${escapeHTML(t(`shareBrand${key[0].toUpperCase()}${key.slice(1)}`))}</option>`).join('')}</select></label>
            <div class="share-timeline-start-control">
              <span>${escapeHTML(t('shareTimelineStart'))}</span>
              <div class="share-timeline-start-options" role="group" aria-label="${escapeHTML(t('shareTimelineStart'))}">
                <label><input type="radio" name="share-timeline-start" value="experiment" ${visibility.timelineStart === 'experiment' ? 'checked' : ''}><span>${escapeHTML(t('shareTimelineStartExperiment'))}</span></label>
                <label><input type="radio" name="share-timeline-start" value="submission" ${visibility.timelineStart === 'submission' ? 'checked' : ''}><span>${escapeHTML(t('shareTimelineStartSubmission'))}</span></label>
              </div>
            </div>
            <label class="share-size-control" for="share-image-size">
              <span>${escapeHTML(t('shareSizeTitle'))}</span>
              <select id="share-image-size">
                <option value="portrait" ${visibility.size === 'portrait' ? 'selected' : ''}>${escapeHTML(t('shareSizePortrait'))}</option>
                <option value="story" ${visibility.size === 'story' ? 'selected' : ''}>${escapeHTML(t('shareSizeStory'))}</option>
                <option value="auto" ${visibility.size === 'auto' ? 'selected' : ''}>${escapeHTML(t('shareSizeAuto'))}</option>
              </select>
            </label>
            <label class="share-size-control" for="share-resolution"><span>${escapeHTML(t('shareResolution'))}</span><select id="share-resolution">${[[1,'shareResolutionStandard'],[2,'shareResolutionHigh'],[3,'shareResolutionUltra']].map(([value,key]) => `<option value="${value}" ${visibility.resolution === value ? 'selected' : ''}>${escapeHTML(t(key))}</option>`).join('')}</select></label>
            <button type="button" class="btn-secondary share-design-reset" id="btn-share-reset" title="${escapeHTML(t('shareStyleResetHelp'))}">${escapeHTML(t('shareStyleReset'))}</button>
            <small class="share-reset-help">${escapeHTML(t('shareStyleResetHelp'))}</small>
          </aside>
          <div class="share-preview-frame" data-render-state="idle" aria-live="polite">
            <div class="share-preview-loading" data-share-loading>${escapeHTML(t('shareRendering'))}</div>
            <div class="share-preview-error" data-share-error hidden role="alert"><p>${escapeHTML(t('sharePreviewError'))}</p><button type="button" class="btn-secondary" id="btn-share-retry">${escapeHTML(t('shareRetry'))}</button></div>
            <img alt="${escapeHTML(t('shareJourneyTitle'))}">
          </div>
        </div>
        <div class="share-preview-actions">
          <span class="share-local-note" id="share-output-details" role="status">${escapeHTML(t('shareJourneyHelp'))}</span>
          <button class="btn-secondary" id="btn-share-zoom" type="button" aria-pressed="false">${escapeHTML(t('shareZoom'))}</button>
          <button class="btn-primary" id="btn-share-download" type="button" aria-describedby="share-save-status">${escapeHTML(t('shareJourneyDownload'))}</button>
          <button class="btn-secondary" id="btn-share-copy" type="button">${escapeHTML(t('shareJourneyCopy'))}</button>
          <span class="share-save-status" id="share-save-status" role="status" aria-live="polite">${escapeHTML(t('shareJourneySaveHelp'))}</span>
        </div>
      </div>
    `);

    const image = modalContent.querySelector('.share-preview-frame img');
    const previewFrame = modalContent.querySelector('.share-preview-frame');
    const loading = modalContent.querySelector('[data-share-loading]');
    const errorPanel = modalContent.querySelector('[data-share-error]');
    document.getElementById('btn-share-zoom').addEventListener('click', event => {
      const zoomed = previewFrame.classList.toggle('is-zoomed');
      event.currentTarget.setAttribute('aria-pressed', String(zoomed));
      event.currentTarget.textContent = t(zoomed ? 'shareFit' : 'shareZoom');
      previewFrame.scrollTo({ top: 0, left: 0 });
    });
    let closed = false;
    let renderTimer = null;
    const pendingUrls = new Set();
    const actionButtons = modalContent.querySelectorAll('#btn-share-download, #btn-share-copy');
    const setBusy = () => {
      currentBlob = null;
      actionButtons.forEach(button => { button.disabled = true; });
      previewFrame.dataset.renderState = 'rendering';
      previewFrame.setAttribute('aria-busy', 'true');
      loading.hidden = false;
      document.getElementById('share-output-details').textContent = t('shareRendering');
      errorPanel.hidden = true;
      image.hidden = true;
      image.classList.add('is-rendering');
    };
    activeSharePreviewCleanup = () => {
      closed = true;
      previewRenderId += 1;
      clearTimeout(renderTimer);
      currentBlob = null;
      pendingUrls.forEach(url => URL.revokeObjectURL(url));
      pendingUrls.clear();
      activeSharePreviewCleanup = null;
    };
    const renderPreviewSafe = async (renderId) => {
      let nextUrl = '';
      try {
        if (closed || renderId !== previewRenderId) return;
        const chosen = { ...visibility };
        const { canvas, title, layout, resolutionLimited } = createSubmissionShareCanvas(submission, chosen);
        const exportWidth = canvas.width, exportHeight = canvas.height;
        let blob;
        try { blob = await canvasToPngBlob(canvas); }
        finally { canvas.width = canvas.height = 1; }
        if (closed || renderId !== previewRenderId) return;
        nextUrl = URL.createObjectURL(blob);
        pendingUrls.add(nextUrl);
        const decoded = new Image();
        decoded.src = nextUrl;
        await decoded.decode();
        if (closed || renderId !== previewRenderId) return;
        const previousUrl = activeSharePreviewUrl;
        image.src = nextUrl;
        await image.decode();
        if (closed || renderId !== previewRenderId) return;
        activeSharePreviewUrl = nextUrl;
        pendingUrls.delete(nextUrl);
        currentBlob = blob;
        currentFileName = safeShareFileName(title);
        previewFrame.dataset.shareSize = chosen.size;
        previewFrame.dataset.appearance = chosen.appearance;
        previewFrame.dataset.renderState = 'ready';
        previewFrame.setAttribute('aria-busy', 'false');
        image.classList.remove('is-rendering');
        image.hidden = false;
        loading.hidden = true;
        actionButtons.forEach(button => { button.disabled = savePending; });
        document.getElementById('share-output-details').textContent = `${exportWidth} × ${exportHeight} · PNG · ${Math.ceil(blob.size / 1024)} KB${resolutionLimited ? ` · ${t('shareResolutionLimited')}` : ''}${layout.omitted ? ` · ${t('shareOmitted').replace('{count}', layout.omitted)}` : ''}`;
        if (previousUrl) URL.revokeObjectURL(previousUrl);
      } catch (error) {
        if (closed || renderId !== previewRenderId) return;
        loading.hidden = true;
        errorPanel.hidden = false;
        image.hidden = true;
        image.classList.remove('is-rendering');
        previewFrame.dataset.renderState = 'error';
        previewFrame.setAttribute('aria-busy', 'false');
        document.getElementById('share-output-details').textContent = t('shareJourneyFailed');
      } finally {
        if (nextUrl && pendingUrls.has(nextUrl)) {
          URL.revokeObjectURL(nextUrl);
          pendingUrls.delete(nextUrl);
        }
      }
    };
    const updatePreview = patch => {
      visibility = normalizeShareVisibility({ ...visibility, ...patch });
      const snapshot = { ...visibility };
      sharePreferenceWrites = sharePreferenceWrites.catch(() => {}).then(() => RFPlatform.storage.local.set({ [SHARE_PREFS_STORAGE_KEY]: snapshot }));
      sharePreferenceWrites.catch(() => { if (!closed) showGlobalToast(t('sharePrefsFailed'), 'warning'); });
      modalContent.querySelectorAll('[data-share-style]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shareStyle === visibility.appearance)));
      document.getElementById('share-appearance').value = visibility.appearance;
      document.getElementById('share-brand-size').value = visibility.brandSize;
      document.getElementById('share-brand-size').disabled = !visibility.footer;
      document.getElementById('share-resolution').value = String(visibility.resolution);
      document.getElementById('share-image-size').value = visibility.size;
      // Invalidate the downloadable image synchronously before the first async yield.
      const renderId = ++previewRenderId;
      setBusy();
      clearTimeout(renderTimer);
      renderTimer = setTimeout(() => renderPreviewSafe(renderId), 80);
    };
    modalContent.querySelectorAll('[data-share-field]').forEach(control => {
      control.addEventListener('change', () => updatePreview({ [control.dataset.shareField]: control.checked }));
    });
    modalContent.querySelectorAll('input[name="share-timeline-start"]').forEach(control => {
      control.addEventListener('change', () => updatePreview({ timelineStart: control.value }));
    });
    document.getElementById('share-image-size')?.addEventListener('change', event => updatePreview({ size: event.target.value }));
    document.getElementById('share-appearance')?.addEventListener('change', event => updatePreview({ appearance: event.target.value }));
    modalContent.querySelectorAll('[data-share-style]').forEach(button => button.addEventListener('click', () => updatePreview({ appearance: button.dataset.shareStyle })));
    document.getElementById('share-brand-size').addEventListener('change', event => updatePreview({ brandSize: event.target.value }));
    document.getElementById('share-resolution').addEventListener('change', event => updatePreview({ resolution: event.target.value }));
    document.getElementById('btn-share-reset').addEventListener('click', () => updatePreview({ appearance: 'paper', size: 'portrait', brandSize: 'balanced', resolution: 2 }));
    document.getElementById('btn-share-retry').addEventListener('click', () => { setBusy(); renderPreviewSafe(++previewRenderId); });
    setBusy();
    await renderPreviewSafe(++previewRenderId);
    if (closed) return;

    const saveButton = document.getElementById('btn-share-download');
    const saveStatus = document.getElementById('share-save-status');
    saveButton?.addEventListener('click', async () => {
      if (!currentBlob || savePending) return;
      // Capture the displayed image before awaiting the native dialog.
      const blob = currentBlob, fileName = currentFileName;
      savePending = true;
      saveButton.setAttribute('aria-busy', 'true');
      actionButtons.forEach(button => { button.disabled = true; });
      saveStatus.textContent = t('shareJourneySaving');
      try {
        const result = await downloadShareBlob(blob, fileName);
        if (closed) return;
        saveStatus.textContent = result.cancelled ? t('shareJourneySaveCancelled') : t('shareJourneySaved').replace('{path}', result.filePath);
        if (result.success) showGlobalToast(saveStatus.textContent, 'success');
      } catch (error) {
        if (closed) return;
        saveStatus.textContent = t('shareJourneySaveFailed').replace('{error}', String(error?.message || error));
        showGlobalToast(saveStatus.textContent, 'error');
      } finally {
        savePending = false;
        if (!closed) {
          saveButton.removeAttribute('aria-busy');
          actionButtons.forEach(button => { button.disabled = !currentBlob; });
        }
      }
    });
    const copyButton = document.getElementById('btn-share-copy');
    const canCopyImage = Boolean(window.ClipboardItem && navigator.clipboard?.write);
    if (!canCopyImage) copyButton.hidden = true;
    copyButton?.addEventListener('click', async () => {
      if (!currentBlob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': currentBlob })]);
        showGlobalToast(t('shareJourneyCopied'), 'success');
      } catch {
        showGlobalToast(t('shareJourneyCopyFailed'), 'warning');
      }
    });
  } catch (error) {
    console.error(error);
    showGlobalToast(t('shareJourneyFailed'), 'error');
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.removeAttribute('aria-busy');
    }
  }
}


