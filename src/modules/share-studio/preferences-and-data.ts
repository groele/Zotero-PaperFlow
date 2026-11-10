/**
 * Zotero PaperFlow - Share Journey Preferences, Persistence & Card Data Builder
 */
declare var db: any;
declare var currentLanguage: string;
declare var sharePreferenceWrites: Promise<any>;
declare function t(key: string): string;
declare function getSubmissionJournalName(sub: any): string;
declare function getSubmissionFirstAuthor(sub: any, man?: any): string;
declare function getSubmissionStatusLabel(status: any): string;
declare function normalizeSubmissionStatus(value: any): string;
declare function analyzeSubmission(sub: any): any;
declare function autoSortNodes(nodes: any[]): any[];
declare function computeNodeStatus(node: any): string;
declare function getDaysDiff(startDateStr: any, endDateStr: any): number | null;
declare function todayString(): string;
declare function inferKey(node: any): string;
declare function getNodeDate(node: any): string;
declare function getTimelineNodeDisplayName(node: any): string;
declare function showGlobalToast(message: string, type?: string): void;

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

function normalizeResValue(rawRes: any): string {
  if (rawRes === 1 || rawRes === '1') return 'standard';
  if (rawRes === 2 || rawRes === '2') return 'high';
  if (rawRes === 3 || rawRes === '3') return 'ultra';
  return new Set(['standard', 'high', 'ultra']).has(rawRes) ? rawRes : SHARE_RESOLUTION_DEFAULT;
}

export function normalizeSharePreferences(raw: any = {}): any {
  const validThemes = new Set(getShareThemes().map((item) => item.id));
  const validSizes = new Set(['portrait', 'story', 'auto']);
  const validStarts = new Set(['experiment', 'submission']);
  const validBrandSizes = new Set(['compact', 'balanced', 'bold']);
  const visible = Object.fromEntries(getShareFieldControls().map(({ key }) => {
    if (raw?.visible && key in raw.visible) return [key, Boolean(raw.visible[key])];
    if (raw && typeof raw === 'object' && key in raw) return [key, Boolean(raw[key])];
    return [key, true];
  }));
  const rawTheme = raw?.appearance || raw?.theme;
  const theme = validThemes.has(rawTheme) ? rawTheme : SHARE_THEME_DEFAULT;
  return {
    theme,
    appearance: theme,
    size: validSizes.has(raw?.size) ? raw.size : SHARE_SIZE_DEFAULT,
    timelineStart: validStarts.has(raw?.timelineStart) ? raw.timelineStart : SHARE_TIMELINE_START_DEFAULT,
    brandSize: validBrandSizes.has(raw?.brandSize) ? raw.brandSize : SHARE_BRAND_SIZE_DEFAULT,
    resolution: normalizeResValue(raw?.resolution),
    visible
  };
}

function getDatabase(): any {
  const win = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  if (win.db && typeof win.db === 'object') return win.db;
  if (typeof db !== 'undefined' && db && typeof db === 'object') return db;
  if (!win.db) win.db = {};
  return win.db;
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
      const live = getDatabase();
      const liveCount = Array.isArray(live?.submissions) ? live.submissions.length : 0;
      const latestCount = Array.isArray(latest?.submissions) ? latest.submissions.length : 0;
      const target = liveCount > latestCount ? live : (latest || live);
      if (!target.settings) target.settings = {};
      target.settings.shareCard = normalized;
      const rawSaved = await window.storage.saveAll(target, { mergeOnConflict: true });
      const saved = rawSaved && typeof rawSaved === 'object' ? rawSaved : target;
      if (!saved.settings) saved.settings = {};
      saved.settings.shareCard = normalized;
      const win = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
      const currentLiveCount = Array.isArray(win.db?.submissions) ? win.db.submissions.length : 0;
      const savedCount = Array.isArray(saved?.submissions) ? saved.submissions.length : 0;
      if (savedCount >= currentLiveCount) {
        win.db = saved;
        if (typeof db !== 'undefined') db = saved;
      } else {
        win.db.settings = { ...(win.db.settings || {}), shareCard: normalized };
      }
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
  const language = typeof currentLanguage === 'string' && currentLanguage === 'zh' ? 'zh' : 'en';
  const zh = language === 'zh';
  const title = man?.title || sub.title || t('untitledManuscript');
  const journal = getSubmissionJournalName(sub);
  const firstAuthor = getSubmissionFirstAuthor(sub, man);
  const statusLabel = getSubmissionStatusLabel(sub.status || 'submitted');
  const prefs = normalizeSharePreferences({
    ...getSharePreferences(),
    ...overrides,
    visible: { ...getSharePreferences().visible, ...(overrides.visible || {}) }
  });

  const sortedNodes = typeof autoSortNodes === 'function'
    ? autoSortNodes(sub.timelineNodes || [])
    : (analysis.events || []);
  const events = sortedNodes.map((node: any) => {
    const key = inferKey(node);
    const date = window.RFUI?.getTimelineEventDate
      ? window.RFUI.getTimelineEventDate(node, key)
      : getNodeDate(node);
    const nodeStatus = typeof computeNodeStatus === 'function' ? computeNodeStatus(node) : (node.status || '');
    const completed = Boolean(node.completeDate || nodeStatus === 'completed');
    const due = !node.completeDate && !node.planDate && Boolean(node.dueDate);
    return {
      key,
      type: node.type || 'special',
      name: node.name,
      rawName: node.name,
      label: getTimelineNodeDisplayName(node),
      date,
      completed,
      due,
      status: nodeStatus,
      planDate: node.planDate || '',
      dueDate: node.dueDate || '',
      completeDate: node.completeDate || ''
    };
  });

  const datedEvents = events.filter((e: any) => e.date && !Number.isNaN(new Date(e.date).getTime()));
  const start = prefs.timelineStart === 'submission'
    ? (analysis.submitDate || datedEvents.find((e: any) => e.key === 'submit' || e.type === 'submission')?.date || '')
    : (analysis.experimentStartDate || datedEvents.find((e: any) => e.key === 'experiment_start')?.date || datedEvents.find((e: any) => e.type === 'research')?.date || datedEvents[0]?.date || '');
  const subStatus = typeof normalizeSubmissionStatus === 'function' ? normalizeSubmissionStatus(sub.status) : (sub.status || 'submitted');
  const today = typeof todayString === 'function' ? todayString() : new Date().toISOString().split('T')[0];
  const end = analysis.accepted
    ? (analysis.acceptDate || analysis.onlineDate)
    : (subStatus === 'rejected' ? (sub.rejectedAt || sub.decisionDate) : today);
  const diffDays = start && end && typeof getDaysDiff === 'function' ? getDaysDiff(start, end) : null;
  const durationDays = diffDays !== null && diffDays >= 0 ? diffDays : null;

  const startText = prefs.timelineStart === 'submission'
    ? (zh ? '投稿' : 'submission')
    : (zh ? '首个记录节点' : 'first recorded milestone');
  const endText = analysis.accepted
    ? (zh ? '接收 / 发表' : 'acceptance / publication')
    : (subStatus === 'rejected' ? (zh ? '决定日期' : 'decision') : (zh ? '今天' : 'today'));
  const durationLabel = zh ? `从${startText}至${endText}` : `From ${startText} to ${endText}`;

  return window.RFShareCard.buildSubmissionShareCardData({
    language,
    theme: prefs.theme,
    appearance: prefs.theme,
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
    durationLabel,
    events
  });
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG blob unavailable'));
      }, 'image/png', 0.96);
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
  const host = (window.Zotero || window.parent?.Zotero)?.ResearchFlow;
  const bridge = (window as any).ZoteroBridge;
  if (typeof host?.saveShareImageFile === 'function' || (bridge?.isZotero && bridge.saveShareImage)) {
    const language = typeof currentLanguage === 'string' ? currentLanguage : 'en';
    const result = typeof host?.saveShareImageFile === 'function'
      ? await host.saveShareImageFile(new Uint8Array(await blob.arrayBuffer()), filename, language)
      : await bridge.saveShareImage(blob, filename, language);
    if (result?.cancelled) return { cancelled: true, path: '' };
    if (!result?.success || !result.filePath) throw new Error(result?.error || 'PNG save was not confirmed.');
    return { cancelled: false, path: result.filePath };
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
