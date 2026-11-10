import { getShareThemes, getShareFieldControls } from './preferences-and-data.js';

declare function t(key: string): string;
declare function escapeHTML(value: any): string;

export function buildShareModal(prefs: any): string {
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

  return `
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
  `;
}
