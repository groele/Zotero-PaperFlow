/**
 * Zotero PaperFlow - Share Journey Preferences, Persistence & Card Data Builder
 */
declare var db: any;
declare var currentLanguage: string;
declare var sharePreferenceWrites: Promise<any>;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function showGlobalToast(message: string, type?: string): void;
declare function analyzeSubmission(sub: any): any;
declare function getSubmissionJournalName(sub: any): string;
declare function getSubmissionFirstAuthor(sub: any, man?: any): string;
declare function getSubmissionStatusLabel(status: any): string;
declare function getSubmissionCycleTime(sub: any): any;
declare function inferKey(node: any): string;
declare function getNodeDate(node: any): string;
declare function getTimelineNodeDisplayName(node: any): string;

const g: any = typeof globalThis !== 'undefined' ? globalThis : window;
if (!('sharePreferenceWrites' in g)) g.sharePreferenceWrites = Promise.resolve();
if (!('activeSharePreviewUrl' in g)) g.activeSharePreviewUrl = null;
if (!('activeSharePreviewCleanup' in g)) g.activeSharePreviewCleanup = null;

export const SHARE_THEME_DEFAULT = 'estuary';
export const SHARE_SIZE_DEFAULT = 'portrait';
export const SHARE_TIMELINE_START_DEFAULT = 'experiment';
export const SHARE_BRAND_SIZE_DEFAULT = 'balanced';
export const SHARE_RESOLUTION_DEFAULT = 'high';

export function getShareThemes(): Array<{ id: string; labelKey: string }> {
  return [
    { id: 'estuary', labelKey: 'shareEstuary' },
    { id: 'iris', labelKey: 'shareIris' },
    { id: 'amber', labelKey: 'shareAmber' },
    { id: 'journal', labelKey: 'shareJournal' },
    { id: 'conference', labelKey: 'shareConference' },
    { id: 'archive', labelKey: 'shareArchive' },
    { id: 'paper', labelKey: 'sharePaper' },
    { id: 'ink', labelKey: 'shareInk' },
    { id: 'blueprint', labelKey: 'shareBlueprint' },
    { id: 'minimal', labelKey: 'shareMinimal' },
    { id: 'cyber', labelKey: 'shareCyber' },
    { id: 'aurora', labelKey: 'shareAurora' },
    { id: 'terminal', labelKey: 'shareTerminal' }
  ];
}

export function getShareFieldControls(): Array<{ key: string; labelKey: string }> {
  return [
    { key: 'title', labelKey: 'shareFieldTitle' },
    { key: 'journal', labelKey: 'shareFieldJournal' },
    { key: 'author', labelKey: 'shareFieldAuthor' },
    { key: 'status', labelKey: 'shareFieldStatus' },
    { key: 'duration', labelKey: 'shareFieldDuration' },
    { key: 'dates', labelKey: 'shareFieldDates' },
    { key: 'footer', labelKey: 'shareFieldFooter' }
  ];
}

export function normalizeSharePreferences(raw: any = {}): any {
  const validThemes = new Set(getShareThemes().map((item) => item.id));
  const validSizes = new Set(['portrait', 'story', 'auto']);
  const validStarts = new Set(['experiment', 'submission']);
  const validBrandSizes = new Set(['compact', 'balanced', 'bold']);
  const validResolutions = new Set(['standard', 'high', 'ultra']);
  const visible = Object.fromEntries(getShareFieldControls().map(({ key }) => [
    key,
    raw?.visible && key in raw.visible ? Boolean(raw.visible[key]) : true
  ]));
  return {
    theme: validThemes.has(raw?.theme) ? raw.theme : SHARE_THEME_DEFAULT,
    size: validSizes.has(raw?.size) ? raw.size : SHARE_SIZE_DEFAULT,
    timelineStart: validStarts.has(raw?.timelineStart) ? raw.timelineStart : SHARE_TIMELINE_START_DEFAULT,
    brandSize: validBrandSizes.has(raw?.brandSize) ? raw.brandSize : SHARE_BRAND_SIZE_DEFAULT,
    resolution: validResolutions.has(raw?.resolution) ? raw.resolution : SHARE_RESOLUTION_DEFAULT,
    visible
  };
}

function getDatabase(): any {
  const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  if (g.db && typeof g.db === 'object') return g.db;
  if (typeof db !== 'undefined' && db && typeof db === 'object') return db;
  if (!g.db) g.db = {};
  return g.db;
}

export function getSharePreferences(): any {
  const database = getDatabase();
  if (!database.settings) database.settings = {};
  database.settings.shareCard = normalizeSharePreferences(database.settings.shareCard);
  return database.settings.shareCard;
}

export async function persistSharePreferences(nextPrefs: any): Promise<any> {
  const database = getDatabase();
  if (!database.settings) database.settings = {};
  const normalized = normalizeSharePreferences(nextPrefs);
  database.settings.shareCard = normalized;
  sharePreferenceWrites = (sharePreferenceWrites || Promise.resolve())
    .catch(() => {})
    .then(async () => {
      if (!window.storage?.saveAll) return;
      const latest = await window.storage.loadAll();
      if (!latest.settings) latest.settings = {};
      latest.settings.shareCard = normalized;
      const saved = await window.storage.saveAll(latest, { mergeOnConflict: true }) || latest;
      const g = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
      g.db = saved;
      db = saved;
    })
    .catch((error: any) => {
      console.warn('Could not persist share card preferences:', error);
      showGlobalToast(t('sharePrefsFailed'), 'warning');
    });
  return sharePreferenceWrites;
}

export function buildSubmissionShareJourneyData(sub: any, overrides: any = {}): any {
  const database = getDatabase();
  const man = (database.manuscripts || []).find((item: any) => item.id === sub.manuscriptId) || null;
  const analysis = analyzeSubmission(sub);
  const title = man?.title || sub.title || t('untitledManuscript');
  const journal = getSubmissionJournalName(sub);
  const firstAuthor = getSubmissionFirstAuthor(sub, man);
  const statusLabel = getSubmissionStatusLabel(sub.status || 'submitted');
  const durationDays = analysis.accepted
    ? (analysis.submitToAccept ?? getSubmissionCycleTime(sub).days)
    : (analysis.submitToNow ?? getSubmissionCycleTime(sub).days);
  const events = (analysis.events || []).map((node: any) => {
    const key = inferKey(node);
    const date = window.RFUI?.getTimelineEventDate
      ? window.RFUI.getTimelineEventDate(node, key)
      : getNodeDate(node);
    return {
      key,
      type: node.type,
      name: node.name,
      rawName: node.name,
      label: getTimelineNodeDisplayName(node),
      date
    };
  });
  const prefs = normalizeSharePreferences({
    ...getSharePreferences(),
    ...overrides,
    visible: { ...getSharePreferences().visible, ...(overrides.visible || {}) }
  });
  const omittedCount = Math.max(0, events.filter((event: any) => Boolean(event.date)).length - 40);

  return window.RFShareCard.buildSubmissionShareCardData({
    language: currentLanguage,
    theme: prefs.theme,
    size: prefs.size,
    timelineStart: prefs.timelineStart,
    brandSize: prefs.brandSize,
    resolution: prefs.resolution,
    visible: prefs.visible,
    title,
    journal,
    firstAuthor,
    status: sub.status || 'submitted',
    statusLabel,
    durationDays,
    events,
    labels: {
      eyebrow: t('shareJourneyEyebrow'),
      journalLabel: t('shareJournalLabel'),
      firstAuthorLabel: t('firstAuthorLabel'),
      statusTitle: t('shareJourneyStatus'),
      durationLabel: t('shareJourneyDuration'),
      daysUnit: t('days'),
      timelineTitle: t('shareJourneyTimeline'),
      emptyEventsText: t('shareJourneyNoEvents'),
      footer: t('shareJourneyFooter'),
      omittedLabel: omittedCount ? tf('shareOmitted', { count: omittedCount }) : ''
    }
  });
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG blob unavailable'));
      }, 'image/png');
      return;
    }
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1] || '';
      const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
      resolve(new Blob([bytes], { type: 'image/png' }));
    } catch (error) {
      reject(error);
    }
  });
}

export function shareCardFileName(sub: any): string {
  const journal = String(getSubmissionJournalName(sub) || 'submission')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36) || 'submission';
  return `zotero-paperflow-${journal}-${new Date().toISOString().split('T')[0]}.png`;
}

export async function savePngBlobWithPath(blob: Blob, filename: string): Promise<any> {
  const hostSave = window.parent?.Zotero?.ResearchFlow?.saveSharePngWithPicker;
  if (typeof hostSave === 'function') {
    const buffer = await blob.arrayBuffer();
    const result = await hostSave(new Uint8Array(buffer), filename);
    if (result?.cancelled) return { cancelled: true, path: '' };
    return { cancelled: false, path: result?.path || filename };
  }

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return { cancelled: false, path: filename };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function copyPngBlobToClipboard(blob: Blob): Promise<boolean> {
  const hostCopy = window.parent?.Zotero?.ResearchFlow?.copySharePngToClipboard;
  if (typeof hostCopy === 'function') {
    const buffer = await blob.arrayBuffer();
    return Boolean(await hostCopy(new Uint8Array(buffer)));
  }
  if (navigator.clipboard?.write && typeof ClipboardItem === 'function') {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  }
  return false;
}
