import { getShareThemes, getShareFieldControls } from './preferences-and-data.js';

declare function t(key: string): string;
declare function escapeHTML(value: any): string;

function findAppearancePalette(id: string, palettes: any[]): any {
  const match = palettes.find((item) => item?.id === id);
  return match || { id, paper: '#e4f2ef', ink: '#153d4a', accent: '#186d7c' };
}

export function buildShareModal(prefs: any): string {
  const themes = getShareThemes();
  const palettes = typeof window !== 'undefined' && (window as any).RFShareCard?.getAppearances
    ? (window as any).RFShareCard.getAppearances()
    : [];

  const appearanceOptions = themes.map((theme) => (
    `<option value="${escapeHTML(theme.id)}" ${prefs.theme === theme.id ? 'selected' : ''}>${escapeHTML(t(theme.labelKey))}</option>`
  )).join('');

  const styleGallery = themes.map((theme) => {
    const palette = findAppearancePalette(theme.id, palettes);
    const fullName = t(theme.labelKey);
    const shortName = fullName.split(' · ')[0];
    const background = palette.paperGradient
      ? `linear-gradient(135deg, ${palette.paperGradient.join(', ')})`
      : palette.paper;
    const isPressed = prefs.theme === theme.id ? 'true' : 'false';
    return `
      <button type="button" class="share-style-tile${prefs.theme === theme.id ? ' active' : ''}" data-share-theme="${escapeHTML(theme.id)}" aria-pressed="${isPressed}" title="${escapeHTML(fullName)}">
        <span class="share-style-sample" aria-hidden="true" style="--sample-bg:${escapeHTML(background)};--sample-ink:${escapeHTML(palette.ink)};--sample-accent:${escapeHTML(palette.accent)}">
          <i></i><b>Aa</b><em></em>
        </span>
        <span>${escapeHTML(shortName)}</span>
      </button>
    `;
  }).join('');

  const visibilityControls = getShareFieldControls().map((field) => `
    <label class="share-visibility-chip${field.key === 'footer' ? ' share-visibility-chip-wide' : ''}">
      <input type="checkbox" data-share-visible="${escapeHTML(field.key)}" ${prefs.visible[field.key] ? 'checked' : ''}>
      <span>${escapeHTML(t(field.labelKey))}</span>
    </label>
  `).join('');

  const brandSizeOptions = ['compact', 'balanced', 'bold'].map((key) => {
    const labelKey = `shareBrand${key[0].toUpperCase()}${key.slice(1)}`;
    return `<option value="${key}" ${prefs.brandSize === key ? 'selected' : ''}>${escapeHTML(t(labelKey))}</option>`;
  }).join('');

  return `
    <div class="share-preview-shell">
      <div class="share-preview-header">
        <div>
          <span class="share-preview-kicker">Zotero PaperFlow / Share Studio</span>
          <h2>${escapeHTML(t('shareJourneyTitle'))}</h2>
          <p>${escapeHTML(t('shareJourneyHelp'))}</p>
        </div>
        <button class="btn-icon share-preview-close" id="btn-close-modal" type="button" aria-label="${escapeHTML(t('close'))}" title="${escapeHTML(t('close'))}">×</button>
      </div>
      <div class="share-preview-workbench">
        <aside class="share-visibility-panel" aria-label="${escapeHTML(t('shareVisibilityTitle'))}">
          <div class="share-visibility-heading">
            <strong>${escapeHTML(t('shareVisibilityTitle'))}</strong>
            <small>${escapeHTML(t('shareVisibilityHelp'))}</small>
          </div>
          <label class="share-size-control" for="share-appearance">
            <span>${escapeHTML(t('shareAppearance'))}</span>
            <select id="share-appearance">${appearanceOptions}</select>
          </label>
          <details class="share-style-browser" open>
            <summary>${escapeHTML(t('shareGallery'))}</summary>
            <div class="share-style-gallery" role="group" aria-label="${escapeHTML(t('shareAppearance'))}">${styleGallery}</div>
          </details>
          <div class="share-visibility-list">${visibilityControls}</div>
          <label class="share-size-control" for="share-brand-size">
            <span>${escapeHTML(t('shareBrandSize'))}</span>
            <select id="share-brand-size"${prefs.visible.footer ? '' : ' disabled'}>${brandSizeOptions}</select>
          </label>
          <div class="share-timeline-start-control">
            <span>${escapeHTML(t('shareTimelineStart'))}</span>
            <div class="share-timeline-start-options" role="group" aria-label="${escapeHTML(t('shareTimelineStart'))}">
              <label><input type="radio" name="share-timeline-start" value="experiment" ${prefs.timelineStart === 'experiment' ? 'checked' : ''}><span>${escapeHTML(t('shareTimelineStartExperiment'))}</span></label>
              <label><input type="radio" name="share-timeline-start" value="submission" ${prefs.timelineStart === 'submission' ? 'checked' : ''}><span>${escapeHTML(t('shareTimelineStartSubmission'))}</span></label>
            </div>
          </div>
          <label class="share-size-control" for="share-card-size">
            <span>${escapeHTML(t('shareSizeTitle'))}</span>
            <select id="share-card-size">
              <option value="portrait" ${prefs.size === 'portrait' ? 'selected' : ''}>${escapeHTML(t('shareSizePortrait'))}</option>
              <option value="story" ${prefs.size === 'story' ? 'selected' : ''}>${escapeHTML(t('shareSizeStory'))}</option>
              <option value="auto" ${prefs.size === 'auto' ? 'selected' : ''}>${escapeHTML(t('shareSizeAuto'))}</option>
            </select>
          </label>
          <label class="share-size-control" for="share-card-resolution">
            <span>${escapeHTML(t('shareResolution'))}</span>
            <select id="share-card-resolution">
              <option value="standard" ${prefs.resolution === 'standard' ? 'selected' : ''}>${escapeHTML(t('shareResolutionStandard'))}</option>
              <option value="high" ${prefs.resolution === 'high' ? 'selected' : ''}>${escapeHTML(t('shareResolutionHigh'))}</option>
              <option value="ultra" ${prefs.resolution === 'ultra' ? 'selected' : ''}>${escapeHTML(t('shareResolutionUltra'))}</option>
            </select>
          </label>
          <button type="button" class="btn-secondary share-design-reset" id="btn-reset-share-style" title="${escapeHTML(t('shareStyleResetHelp'))}">${escapeHTML(t('shareStyleReset'))}</button>
          <small class="share-reset-help">${escapeHTML(t('shareStyleResetHelp'))}</small>
        </aside>
        <div class="share-preview-frame" id="share-journey-preview-wrap" data-render-state="idle" aria-live="polite">
          <div class="share-preview-loading" id="share-preview-loading" hidden>${escapeHTML(t('shareRendering'))}</div>
          <div class="share-preview-error" id="share-preview-error" hidden role="alert">
            <p>${escapeHTML(t('sharePreviewError'))}</p>
            <button type="button" class="btn-secondary" id="btn-retry-share-preview">${escapeHTML(t('shareRetry'))}</button>
          </div>
          <img id="share-journey-preview" alt="${escapeHTML(t('shareJourneyTitle'))}">
        </div>
      </div>
      <div class="share-preview-actions">
        <span class="share-local-note" id="share-preview-dimensions" role="status">${escapeHTML(t('shareRendering'))}</span>
        <button type="button" class="btn-secondary" id="btn-toggle-share-zoom" aria-pressed="false">${escapeHTML(t('shareZoom'))}</button>
        <button type="button" class="btn-primary" id="btn-download-share-image" aria-describedby="share-journey-save-status">${escapeHTML(t('shareJourneyDownload'))}</button>
        <button type="button" class="btn-secondary" id="btn-copy-share-image">${escapeHTML(t('shareJourneyCopy'))}</button>
        <span class="share-save-status" id="share-journey-save-status" role="status" aria-live="polite">${escapeHTML(t('shareJourneySaveHelp'))}</span>
      </div>
    </div>
  `;
}
