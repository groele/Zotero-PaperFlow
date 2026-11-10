import { buildShareModal } from './modal-template.js';
/**
 * Zotero PaperFlow - Share Journey Modal Controller
 */
import {
  SHARE_THEME_DEFAULT,
  SHARE_SIZE_DEFAULT,
  SHARE_TIMELINE_START_DEFAULT,
  SHARE_BRAND_SIZE_DEFAULT,
  SHARE_RESOLUTION_DEFAULT,
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

  const openModalFn = (window as any).openModal || (typeof openModal === 'function' ? openModal : null);
  if (!openModalFn) {
    showGlobalToast(t('shareJourneyFailed'), 'error');
    return;
  }

  openModalFn(buildShareModal(prefs));
  modalContent.classList.add('share-preview-card');
  registerModalCleanup(() => modalContent.classList.remove('share-preview-card'));

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
  let prefsTimer: ReturnType<typeof setTimeout> | null = null;
  activeSharePreviewCleanup = () => {
    closed = true;
    if (prefsTimer !== null) {
      clearTimeout(prefsTimer);
      prefsTimer = null;
      void persistSharePreferences(prefs);
    }
  };
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
      // Fit previews use the base resolution; export quality is generated on demand.
      const cardData = buildSubmissionShareJourneyData(sub, { ...prefs, resolution: 'standard' });
      window.RFShareCard.renderSubmissionShareCard(canvas, cardData);
      const blob = await canvasToPngBlob(canvas);
      if (closed || seq !== renderSeq) return;
      if (activeSharePreviewUrl) URL.revokeObjectURL(activeSharePreviewUrl);
      activeSharePreviewUrl = URL.createObjectURL(blob);
      currentBlob = blob;
      if (preview) preview.src = activeSharePreviewUrl;
      if (dimensionsEl) {
        const layout = window.RFShareCard.getShareCardLayout(
          { ...cardData, resolution: prefs.resolution }, canvas.getContext('2d'));
        dimensionsEl.textContent = `${layout.pixelWidth} × ${layout.pixelHeight} px`;
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
  const updatePrefs = (patch: any) => {
    renderSeq += 1;
    prefs = normalizeSharePreferences({
      ...prefs,
      ...patch,
      visible: { ...prefs.visible, ...(patch.visible || {}) }
    });
    syncControlSelection();
    if (prefsTimer !== null) clearTimeout(prefsTimer);
    if (downloadBtn) downloadBtn.disabled = true;
    if (copyBtn) copyBtn.disabled = true;
    prefsTimer = setTimeout(async () => {
      prefsTimer = null;
      if (closed) return;
      await renderPreview();
      await persistSharePreferences(prefs);
    }, 140);
  };

  let exportCache: { key: string; blob: Blob } | null = null;
  let exportPending: { key: string; promise: Promise<Blob> } | null = null;
  const getExportBlob = async (): Promise<Blob> => {
    const key = JSON.stringify(prefs);
    if (exportCache?.key === key) return exportCache.blob;
    if (exportPending?.key === key) return exportPending.promise;
    const canvas = document.createElement('canvas');
    window.RFShareCard.renderSubmissionShareCard(canvas, buildSubmissionShareJourneyData(sub, prefs));
    const promise = canvasToPngBlob(canvas).then(blob => {
      if (!closed && JSON.stringify(prefs) === key) exportCache = { key, blob };
      return blob;
    }).finally(() => {
      if (exportPending?.promise === promise) exportPending = null;
    });
    exportPending = { key, promise };
    return promise;
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
      const blob = await getExportBlob();
      if (closed) return;
      const result = await savePngBlobWithPath(blob, filename);
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
      const blob = await getExportBlob();
      if (closed) return;
      const copied = await copyPngBlobToClipboard(blob);
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
