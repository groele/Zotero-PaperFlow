/**
 * Zotero PaperFlow - Share Journey Modal Controller
 */
import {
  SHARE_THEME_DEFAULT,
  SHARE_SIZE_DEFAULT,
  SHARE_TIMELINE_START_DEFAULT,
  SHARE_BRAND_SIZE_DEFAULT,
  SHARE_RESOLUTION_DEFAULT,
  getShareThemes,
  getShareFieldControls,
  normalizeSharePreferences,
  getSharePreferences,
  persistSharePreferences,
  buildSubmissionShareJourneyData,
  canvasToPngBlob,
  shareCardFileName,
  savePngBlobWithPath,
  copyPngBlobToClipboard
} from './preferences-and-data.js';

declare var db: any;
declare var modalContent: HTMLElement;
declare var activeSharePreviewUrl: string | null;
declare var activeSharePreviewCleanup: (() => void) | null;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function escapeHTML(value: any): string;
declare function showGlobalToast(message: string, type?: string): void;
declare function openModal(html: string): void;
declare function registerModalCleanup(fn: () => void): void;
declare function renderDashboard(): void;

export function clearActiveSharePreview(): void {
  if (activeSharePreviewUrl) {
    URL.revokeObjectURL(activeSharePreviewUrl);
    activeSharePreviewUrl = null;
  }
  if (typeof activeSharePreviewCleanup === 'function') {
    const cleanup = activeSharePreviewCleanup;
    activeSharePreviewCleanup = null;
    cleanup();
  }
}

export async function openSubmissionShareModal(subId: string): Promise<void> {
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  const database = g.db || (typeof db !== 'undefined' ? db : null) || {};
  const sub = (database.submissions || []).find((item: any) => item.id === subId);
  if (!sub) {
    showGlobalToast(t('submissionNotFound'), 'error');
    renderDashboard();
    return;
  }
  if (!window.RFShareCard?.renderSubmissionShareCard) {
    showGlobalToast(t('shareJourneyFailed'), 'error');
    return;
  }

  clearActiveSharePreview();
  let prefs = getSharePreferences();
  const themeChoices = getShareThemes().map((theme) => `
    <button type="button" class="share-theme-pill ${prefs.theme === theme.id ? 'active' : ''}" data-share-theme="${escapeHTML(theme.id)}" aria-pressed="${prefs.theme === theme.id ? 'true' : 'false'}">
      <span class="share-theme-swatch share-theme-${escapeHTML(theme.id)}" aria-hidden="true"></span>
      <span>${escapeHTML(t(theme.labelKey))}</span>
    </button>
  `).join('');
  const fieldToggles = getShareFieldControls().map((field) => `
    <label class="share-toggle-chip">
      <input type="checkbox" data-share-visible="${escapeHTML(field.key)}" ${prefs.visible[field.key] ? 'checked' : ''}>
      <span>${escapeHTML(t(field.labelKey))}</span>
    </label>
  `).join('');

  const openModalFn = (window as any).openModal || (typeof openModal === 'function' ? openModal : null);
  if (!openModalFn) {
    showGlobalToast(t('shareJourneyFailed'), 'error');
    return;
  }

  openModalFn(`
    <div class="modal-header">
      <div>
        <h2>${escapeHTML(t('shareJourneyTitle'))}</h2>
        <p class="text-muted" style="font-size:12px; margin-top:4px;">${escapeHTML(t('shareJourneyHelp'))}</p>
      </div>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="${escapeHTML(t('close'))}">✕</button>
    </div>
    <div class="share-journey-studio">
      <div class="share-journey-controls" aria-label="${escapeHTML(t('shareAppearance'))}">
        <div class="share-control-group">
          <div class="share-control-head">
            <span>${escapeHTML(t('shareAppearance'))}</span>
            <span class="share-control-caption">${escapeHTML(t('shareGallery'))}</span>
          </div>
          <div class="share-theme-grid" role="group" aria-label="${escapeHTML(t('shareAppearance'))}">${themeChoices}</div>
        </div>
        <div class="share-control-group">
          <div class="share-control-head">
            <span>${escapeHTML(t('shareVisibilityTitle'))}</span>
            <small>${escapeHTML(t('shareVisibilityHelp'))}</small>
          </div>
          <div class="share-toggle-grid">${fieldToggles}</div>
        </div>
        <div class="share-control-group share-select-grid">
          <label class="share-select-field">
            <span>${escapeHTML(t('shareTimelineStart'))}</span>
            <select id="share-timeline-start">
              <option value="experiment" ${prefs.timelineStart === 'experiment' ? 'selected' : ''}>${escapeHTML(t('shareTimelineStartExperiment'))}</option>
              <option value="submission" ${prefs.timelineStart === 'submission' ? 'selected' : ''}>${escapeHTML(t('shareTimelineStartSubmission'))}</option>
            </select>
          </label>
          <label class="share-select-field">
            <span>${escapeHTML(t('shareSizeTitle'))}</span>
            <select id="share-card-size">
              <option value="portrait" ${prefs.size === 'portrait' ? 'selected' : ''}>${escapeHTML(t('shareSizePortrait'))}</option>
              <option value="story" ${prefs.size === 'story' ? 'selected' : ''}>${escapeHTML(t('shareSizeStory'))}</option>
              <option value="auto" ${prefs.size === 'auto' ? 'selected' : ''}>${escapeHTML(t('shareSizeAuto'))}</option>
            </select>
          </label>
          <label class="share-select-field">
            <span>${escapeHTML(t('shareBrandSize'))}</span>
            <select id="share-brand-size">
              <option value="compact" ${prefs.brandSize === 'compact' ? 'selected' : ''}>${escapeHTML(t('shareBrandCompact'))}</option>
              <option value="balanced" ${prefs.brandSize === 'balanced' ? 'selected' : ''}>${escapeHTML(t('shareBrandBalanced'))}</option>
              <option value="bold" ${prefs.brandSize === 'bold' ? 'selected' : ''}>${escapeHTML(t('shareBrandBold'))}</option>
            </select>
          </label>
          <label class="share-select-field">
            <span>${escapeHTML(t('shareResolution'))}</span>
            <select id="share-card-resolution">
              <option value="standard" ${prefs.resolution === 'standard' ? 'selected' : ''}>${escapeHTML(t('shareResolutionStandard'))}</option>
              <option value="high" ${prefs.resolution === 'high' ? 'selected' : ''}>${escapeHTML(t('shareResolutionHigh'))}</option>
              <option value="ultra" ${prefs.resolution === 'ultra' ? 'selected' : ''}>${escapeHTML(t('shareResolutionUltra'))}</option>
            </select>
          </label>
        </div>
        <div class="share-control-reset-row">
          <button type="button" class="btn-secondary btn-sm" id="btn-reset-share-style">${escapeHTML(t('shareStyleReset'))}</button>
          <span>${escapeHTML(t('shareStyleResetHelp'))}</span>
        </div>
      </div>
      <div class="share-journey-preview-column">
        <div class="share-preview-toolbar">
          <span class="share-preview-dimensions" id="share-preview-dimensions">720 × 960 px</span>
          <div class="share-preview-toolbar-actions">
            <button type="button" class="btn-secondary btn-sm" id="btn-retry-share-preview" hidden>${escapeHTML(t('shareRetry'))}</button>
            <button type="button" class="btn-secondary btn-sm" id="btn-toggle-share-zoom" aria-pressed="false">${escapeHTML(t('shareZoom'))}</button>
          </div>
        </div>
        <div class="share-journey-preview-wrap" id="share-journey-preview-wrap">
          <img id="share-journey-preview" alt="${escapeHTML(t('shareJourneyTitle'))}">
        </div>
      </div>
    </div>
    <div class="share-journey-save-status" id="share-journey-save-status" role="status" aria-live="polite">
      ${escapeHTML(t('shareJourneySaveHelp'))}
    </div>
    <div class="modal-footer share-journey-actions">
      <button type="button" class="btn-secondary" id="btn-copy-share-image">${escapeHTML(t('shareJourneyCopy'))}</button>
      <button type="button" class="btn-primary" id="btn-download-share-image">${escapeHTML(t('shareJourneyDownload'))}</button>
    </div>
  `);

  const preview = document.getElementById('share-journey-preview') as HTMLImageElement | null;
  const previewWrap = document.getElementById('share-journey-preview-wrap');
  const dimensionsEl = document.getElementById('share-preview-dimensions');
  const zoomBtn = document.getElementById('btn-toggle-share-zoom') as HTMLButtonElement | null;
  const retryBtn = document.getElementById('btn-retry-share-preview') as HTMLButtonElement | null;
  const statusEl = document.getElementById('share-journey-save-status');
  const downloadBtn = document.getElementById('btn-download-share-image') as HTMLButtonElement | null;
  const copyBtn = document.getElementById('btn-copy-share-image') as HTMLButtonElement | null;
  const filename = shareCardFileName(sub);
  let currentBlob: Blob | null = null;
  let renderSeq = 0;
  let closed = false;
  activeSharePreviewCleanup = () => { closed = true; };
  registerModalCleanup(clearActiveSharePreview);

  const setSaveStatus = (message: string, state = 'neutral') => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.state = state;
  };
  const syncControlSelection = () => {
    modalContent.querySelectorAll('[data-share-theme]').forEach((btn: any) => {
      const active = btn.getAttribute('data-share-theme') === prefs.theme;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    modalContent.querySelectorAll('[data-share-visible]').forEach((input: any) => {
      const key = input.getAttribute('data-share-visible');
      input.checked = Boolean(prefs.visible[key]);
    });
    const sizeSelect = document.getElementById('share-card-size') as HTMLSelectElement | null;
    const startSelect = document.getElementById('share-timeline-start') as HTMLSelectElement | null;
    const brandSelect = document.getElementById('share-brand-size') as HTMLSelectElement | null;
    const resolutionSelect = document.getElementById('share-card-resolution') as HTMLSelectElement | null;
    if (sizeSelect) sizeSelect.value = prefs.size;
    if (startSelect) startSelect.value = prefs.timelineStart;
    if (brandSelect) brandSelect.value = prefs.brandSize;
    if (resolutionSelect) resolutionSelect.value = prefs.resolution;
  };
  const renderPreview = async () => {
    const seq = ++renderSeq;
    try {
      setSaveStatus(t('shareRendering'), 'pending');
      if (retryBtn) retryBtn.hidden = true;
      if (downloadBtn) downloadBtn.disabled = true;
      if (copyBtn) copyBtn.disabled = true;
      const canvas = document.createElement('canvas');
      const cardData = buildSubmissionShareJourneyData(sub, prefs);
      const rendered = window.RFShareCard.renderSubmissionShareCard(canvas, cardData);
      const blob = await canvasToPngBlob(canvas);
      if (closed || seq !== renderSeq) return;
      if (activeSharePreviewUrl) URL.revokeObjectURL(activeSharePreviewUrl);
      activeSharePreviewUrl = URL.createObjectURL(blob);
      currentBlob = blob;
      if (preview) preview.src = activeSharePreviewUrl;
      if (dimensionsEl) {
        const pixelInfo = `${rendered.pixelWidth || rendered.width} × ${rendered.pixelHeight || rendered.height} px`;
        dimensionsEl.textContent = rendered.resolutionLimited
          ? `${pixelInfo} · ${t('shareResolutionLimited')}`
          : pixelInfo;
      }
      setSaveStatus(t('shareJourneySaveHelp'), 'neutral');
    } catch (error) {
      if (closed || seq !== renderSeq) return;
      console.error('Share card generation failed:', error);
      currentBlob = null;
      if (retryBtn) retryBtn.hidden = false;
      setSaveStatus(t('sharePreviewError'), 'error');
      showGlobalToast(t('shareJourneyFailed'), 'error');
    } finally {
      if (!closed && seq === renderSeq) {
        const ready = Boolean(currentBlob);
        if (downloadBtn) downloadBtn.disabled = !ready;
        if (copyBtn) copyBtn.disabled = !ready;
      }
    }
  };
  const updatePrefs = async (patch: any) => {
    prefs = normalizeSharePreferences({
      ...prefs,
      ...patch,
      visible: { ...prefs.visible, ...(patch.visible || {}) }
    });
    syncControlSelection();
    await renderPreview();
    await persistSharePreferences(prefs);
  };

  modalContent.querySelectorAll('[data-share-theme]').forEach((btn: any) => {
    btn.addEventListener('click', () => updatePrefs({ theme: btn.getAttribute('data-share-theme') }));
  });
  modalContent.querySelectorAll('[data-share-visible]').forEach((input: any) => {
    input.addEventListener('change', () => updatePrefs({
      visible: { [input.getAttribute('data-share-visible')]: input.checked }
    }));
  });
  document.getElementById('share-timeline-start')?.addEventListener('change', (event: any) => {
    updatePrefs({ timelineStart: event.target.value });
  });
  document.getElementById('share-card-size')?.addEventListener('change', (event: any) => {
    updatePrefs({ size: event.target.value });
  });
  document.getElementById('share-brand-size')?.addEventListener('change', (event: any) => {
    updatePrefs({ brandSize: event.target.value });
  });
  document.getElementById('share-card-resolution')?.addEventListener('change', (event: any) => {
    updatePrefs({ resolution: event.target.value });
  });
  document.getElementById('btn-reset-share-style')?.addEventListener('click', () => {
    updatePrefs({
      theme: SHARE_THEME_DEFAULT,
      size: SHARE_SIZE_DEFAULT,
      timelineStart: SHARE_TIMELINE_START_DEFAULT,
      brandSize: SHARE_BRAND_SIZE_DEFAULT,
      resolution: SHARE_RESOLUTION_DEFAULT
    });
  });
  const toggleZoom = () => {
    if (!previewWrap || !zoomBtn) return;
    const zoomed = previewWrap.classList.toggle('is-zoomed');
    zoomBtn.setAttribute('aria-pressed', zoomed ? 'true' : 'false');
    zoomBtn.textContent = t(zoomed ? 'shareFit' : 'shareZoom');
  };
  zoomBtn?.addEventListener('click', toggleZoom);
  preview?.addEventListener('click', toggleZoom);
  retryBtn?.addEventListener('click', () => renderPreview());

  downloadBtn?.addEventListener('click', async () => {
    if (!currentBlob) return;
    downloadBtn.disabled = true;
    try {
      setSaveStatus(t('shareJourneySaving'), 'pending');
      const result = await savePngBlobWithPath(currentBlob, filename);
      if (result.cancelled) {
        setSaveStatus(t('shareJourneySaveCancelled'), 'warning');
        return;
      }
      const savedMessage = tf('shareJourneySaved', { path: result.path || filename });
      setSaveStatus(savedMessage, 'success');
      showGlobalToast(savedMessage, 'success');
    } catch (error: any) {
      const failedMessage = tf('shareJourneySaveFailed', { error: error?.message || String(error) });
      setSaveStatus(failedMessage, 'error');
      showGlobalToast(failedMessage, 'error');
    } finally {
      downloadBtn.disabled = false;
    }
  });
  copyBtn?.addEventListener('click', async () => {
    if (!currentBlob) return;
    copyBtn.disabled = true;
    try {
      const copied = await copyPngBlobToClipboard(currentBlob);
      if (!copied) throw new Error('Clipboard image unsupported');
      setSaveStatus(t('shareJourneyCopied'), 'success');
      showGlobalToast(t('shareJourneyCopied'), 'success');
    } catch (error) {
      setSaveStatus(t('shareJourneyCopyFailed'), 'warning');
      showGlobalToast(t('shareJourneyCopyFailed'), 'warning');
    } finally {
      copyBtn.disabled = false;
    }
  });

  await renderPreview();
}
