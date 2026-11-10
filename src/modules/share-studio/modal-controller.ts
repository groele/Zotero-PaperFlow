import { buildShareModal } from './modal-template.js';
/**
 * Zotero PaperFlow - Share Journey Modal Controller
 */
import {
  SHARE_THEME_DEFAULT, SHARE_SIZE_DEFAULT, SHARE_TIMELINE_START_DEFAULT, SHARE_BRAND_SIZE_DEFAULT, SHARE_RESOLUTION_DEFAULT,
  normalizeSharePreferences, getSharePreferences, persistSharePreferences, buildSubmissionShareJourneyData,
  canvasToPngBlob, shareCardFileName, savePngBlobWithPath, copyPngBlobToClipboard
} from './preferences-and-data.js';

declare var db: any;
declare var modalContent: HTMLElement;
declare var activeSharePreviewUrl: string | null;
declare var activeSharePreviewCleanup: (() => void) | null;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
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

export async function openSubmissionShareModal(subId: string, triggerButton?: HTMLButtonElement | null): Promise<void> {
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  const database = g.db || (typeof db !== 'undefined' ? db : null) || {};
  const sub = (database.submissions || []).find((item: any) => item.id === subId);
  if (!sub) {
    showGlobalToast(t('submissionNotFound'), 'error');
    if (typeof renderDashboard === 'function') renderDashboard();
    return;
  }
  if (!window.RFShareCard?.renderSubmissionShareCard) {
    showGlobalToast(t('shareJourneyFailed'), 'error');
    return;
  }
  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.setAttribute('aria-busy', 'true');
  }

  try {
    clearActiveSharePreview();
    let prefs = getSharePreferences();
    const openModalFn = g.openModal || (typeof openModal === 'function' ? openModal : null);
    if (!openModalFn) {
      showGlobalToast(t('shareJourneyFailed'), 'error');
      return;
    }

    openModalFn(buildShareModal(prefs));
    const modalEl = document.getElementById('modal-body') || (typeof modalContent !== 'undefined' ? modalContent : null);
    modalEl?.classList?.add('share-preview-card');
    const regCleanup = g.registerModalCleanup || (typeof registerModalCleanup === 'function' ? registerModalCleanup : null);
    if (regCleanup) regCleanup(() => modalEl?.classList?.remove('share-preview-card'));

    const preview = document.getElementById('share-journey-preview') as HTMLImageElement | null;
    const previewWrap = document.getElementById('share-journey-preview-wrap');
    const loadingEl = document.getElementById('share-preview-loading');
    const errorEl = document.getElementById('share-preview-error');
    const dimensionsEl = document.getElementById('share-preview-dimensions');
    const zoomBtn = document.getElementById('btn-toggle-share-zoom') as HTMLButtonElement | null;
    const retryBtn = document.getElementById('btn-retry-share-preview') as HTMLButtonElement | null;
    const statusEl = document.getElementById('share-journey-save-status');
    const downloadBtn = document.getElementById('btn-download-share-image') as HTMLButtonElement | null;
    const copyBtn = document.getElementById('btn-copy-share-image') as HTMLButtonElement | null;
    const filename = shareCardFileName(sub);

    let currentBlob: Blob | null = null;
    let currentKey = '';
    let renderSeq = 0;
    let closed = false;
    let prefsTimer: ReturnType<typeof setTimeout> | null = null;
    const pendingUrls = new Set<string>();

    activeSharePreviewCleanup = () => {
      closed = true;
      renderSeq += 1;
      if (prefsTimer !== null) {
        clearTimeout(prefsTimer);
        prefsTimer = null;
        void persistSharePreferences(prefs);
      }
      pendingUrls.forEach((url) => URL.revokeObjectURL(url));
      pendingUrls.clear();
    };
    if (regCleanup) regCleanup(clearActiveSharePreview);

    const setSaveStatus = (message: string, state = 'neutral') => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.dataset.state = state;
    };

    const setBusy = () => {
      currentBlob = null;
      currentKey = '';
      if (downloadBtn) downloadBtn.disabled = true;
      if (copyBtn) copyBtn.disabled = true;
      if (previewWrap) {
        previewWrap.dataset.renderState = 'rendering';
        previewWrap.setAttribute('aria-busy', 'true');
      }
      if (loadingEl) loadingEl.hidden = false;
      if (errorEl) errorEl.hidden = true;
      if (preview) preview.classList.add('is-rendering');
      if (dimensionsEl) dimensionsEl.textContent = t('shareRendering');
    };

    const syncControlSelection = () => {
      modalEl?.querySelectorAll('[data-share-theme]').forEach((btn: any) => {
        const active = btn.getAttribute('data-share-theme') === prefs.theme;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      modalEl?.querySelectorAll('[data-share-visible]').forEach((input: any) => {
        input.checked = Boolean(prefs.visible[input.getAttribute('data-share-visible')]);
      });
      modalEl?.querySelectorAll('input[name="share-timeline-start"]').forEach((radio: any) => {
        radio.checked = radio.value === prefs.timelineStart;
      });
      const appearanceSelect = document.getElementById('share-appearance') as HTMLSelectElement | null;
      const sizeSelect = document.getElementById('share-card-size') as HTMLSelectElement | null;
      const brandSelect = document.getElementById('share-brand-size') as HTMLSelectElement | null;
      const resolutionSelect = document.getElementById('share-card-resolution') as HTMLSelectElement | null;
      if (appearanceSelect) appearanceSelect.value = prefs.theme;
      if (sizeSelect) sizeSelect.value = prefs.size;
      if (brandSelect) {
        brandSelect.value = prefs.brandSize;
        brandSelect.disabled = !prefs.visible.footer;
      }
      if (resolutionSelect) resolutionSelect.value = prefs.resolution;
    };

    const renderPreview = async () => {
      const seq = ++renderSeq;
      const snapshot = { ...prefs, visible: { ...prefs.visible } };
      const snapshotKey = JSON.stringify(snapshot);
      let nextUrl = '';
      setBusy();
      try {
        const canvas = document.createElement('canvas');
        const cardData = buildSubmissionShareJourneyData(sub, snapshot);
        const result = window.RFShareCard.renderSubmissionShareCard(canvas, cardData);
        const blob = await canvasToPngBlob(canvas);
        const pixelWidth = canvas.width;
        const pixelHeight = canvas.height;
        canvas.width = canvas.height = 1;
        if (closed || seq !== renderSeq) return;

        nextUrl = URL.createObjectURL(blob);
        pendingUrls.add(nextUrl);
        if (preview) {
          preview.src = nextUrl;
          if (typeof preview.decode === 'function') await preview.decode().catch(() => {});
        }
        if (closed || seq !== renderSeq) return;
        const prevUrl = activeSharePreviewUrl;
        activeSharePreviewUrl = nextUrl;
        pendingUrls.delete(nextUrl);
        if (prevUrl) URL.revokeObjectURL(prevUrl);

        currentBlob = blob;
        currentKey = snapshotKey;
        if (preview) { preview.hidden = false; preview.classList.remove('is-rendering'); }
        if (loadingEl) loadingEl.hidden = true;
        if (errorEl) errorEl.hidden = true;
        if (previewWrap) {
          previewWrap.dataset.shareSize = snapshot.size;
          previewWrap.dataset.appearance = snapshot.theme;
          previewWrap.dataset.renderState = 'ready';
          previewWrap.setAttribute('aria-busy', 'false');
        }
        if (dimensionsEl) {
          const kb = Math.max(1, Math.ceil(blob.size / 1024));
          const limitedText = result?.resolutionLimited ? ` · ${t('shareResolutionLimited')}` : '';
          const omittedText = result?.omitted ? ` · ${tf('shareOmitted', { count: result.omitted })}` : '';
          dimensionsEl.textContent = `${pixelWidth} × ${pixelHeight} · PNG · ${kb} KB${limitedText}${omittedText}`;
        }
      } catch (error) {
        if (closed || seq !== renderSeq) return;
        console.error('Share card generation failed:', error);
        currentBlob = null;
        currentKey = '';
        if (loadingEl) loadingEl.hidden = true;
        if (errorEl) errorEl.hidden = false;
        if (preview) { preview.hidden = true; preview.classList.remove('is-rendering'); }
        if (previewWrap) {
          previewWrap.dataset.renderState = 'error';
          previewWrap.setAttribute('aria-busy', 'false');
        }
        if (dimensionsEl) dimensionsEl.textContent = t('shareJourneyFailed');
        setSaveStatus(t('sharePreviewError'), 'error');
        showGlobalToast(t('shareJourneyFailed'), 'error');
      } finally {
        if (nextUrl && pendingUrls.has(nextUrl)) {
          URL.revokeObjectURL(nextUrl);
          pendingUrls.delete(nextUrl);
        }
        if (!closed && seq === renderSeq) {
          const ready = Boolean(currentBlob);
          if (downloadBtn) downloadBtn.disabled = !ready;
          if (copyBtn) copyBtn.disabled = !ready;
        }
      }
    };

    const updatePrefs = (patch: any) => {
      renderSeq += 1;
      prefs = normalizeSharePreferences({ ...prefs, ...patch, visible: { ...prefs.visible, ...(patch.visible || {}) } });
      syncControlSelection();
      setBusy();
      if (prefsTimer !== null) clearTimeout(prefsTimer);
      prefsTimer = setTimeout(async () => {
        prefsTimer = null;
        if (closed) return;
        await renderPreview();
        await persistSharePreferences(prefs);
      }, 90);
    };

    const getExportBlob = async (): Promise<Blob> => {
      const key = JSON.stringify({ ...prefs, visible: { ...prefs.visible } });
      if (currentBlob && currentKey === key) return currentBlob;
      const canvas = document.createElement('canvas');
      window.RFShareCard.renderSubmissionShareCard(canvas, buildSubmissionShareJourneyData(sub, prefs));
      const blob = await canvasToPngBlob(canvas);
      canvas.width = canvas.height = 1;
      return blob;
    };

    document.getElementById('share-appearance')?.addEventListener('change', (e: any) => updatePrefs({ theme: e.target.value, appearance: e.target.value }));
    modalEl?.querySelectorAll('[data-share-theme]').forEach((btn: any) => {
      btn.addEventListener('click', () => { const id = btn.getAttribute('data-share-theme'); updatePrefs({ theme: id, appearance: id }); });
    });
    modalEl?.querySelectorAll('[data-share-visible]').forEach((input: any) => {
      input.addEventListener('change', () => updatePrefs({ visible: { [input.getAttribute('data-share-visible')]: input.checked } }));
    });
    modalEl?.querySelectorAll('input[name="share-timeline-start"]').forEach((input: any) => {
      input.addEventListener('change', () => { if (input.checked) updatePrefs({ timelineStart: input.value }); });
    });
    document.getElementById('share-card-size')?.addEventListener('change', (e: any) => updatePrefs({ size: e.target.value }));
    document.getElementById('share-brand-size')?.addEventListener('change', (e: any) => updatePrefs({ brandSize: e.target.value }));
    document.getElementById('share-card-resolution')?.addEventListener('change', (e: any) => updatePrefs({ resolution: e.target.value }));
    document.getElementById('btn-reset-share-style')?.addEventListener('click', () => {
      updatePrefs({ theme: SHARE_THEME_DEFAULT, appearance: SHARE_THEME_DEFAULT, size: SHARE_SIZE_DEFAULT, timelineStart: SHARE_TIMELINE_START_DEFAULT, brandSize: SHARE_BRAND_SIZE_DEFAULT, resolution: SHARE_RESOLUTION_DEFAULT });
    });

    const toggleZoom = () => {
      if (!previewWrap || !zoomBtn) return;
      const zoomed = previewWrap.classList.toggle('is-zoomed');
      zoomBtn.setAttribute('aria-pressed', zoomed ? 'true' : 'false');
      zoomBtn.textContent = t(zoomed ? 'shareFit' : 'shareZoom');
      previewWrap.scrollTo?.({ top: 0, left: 0 });
    };
    zoomBtn?.addEventListener('click', toggleZoom);
    preview?.addEventListener('click', toggleZoom);
    retryBtn?.addEventListener('click', () => { void renderPreview(); });

    downloadBtn?.addEventListener('click', async () => {
      if (!currentBlob) return;
      downloadBtn.disabled = true;
      try {
        setSaveStatus(t('shareJourneySaving'), 'pending');
        const blob = await getExportBlob();
        if (closed) return;
        const result = await savePngBlobWithPath(blob, filename);
        if (result.cancelled) { setSaveStatus(t('shareJourneySaveCancelled'), 'warning'); return; }
        const savedMessage = tf('shareJourneySaved', { path: result.path || filename });
        setSaveStatus(savedMessage, 'success');
        showGlobalToast(savedMessage, 'success');
      } catch (error: any) {
        const failedMessage = tf('shareJourneySaveFailed', { error: error?.message || String(error) });
        setSaveStatus(failedMessage, 'error');
        showGlobalToast(failedMessage, 'error');
      } finally {
        if (!closed) downloadBtn.disabled = !currentBlob;
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
      } catch {
        setSaveStatus(t('shareJourneyCopyFailed'), 'warning');
        showGlobalToast(t('shareJourneyCopyFailed'), 'warning');
      } finally {
        if (!closed) copyBtn.disabled = !currentBlob;
      }
    });

    await renderPreview();
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.removeAttribute('aria-busy');
    }
  }
}
