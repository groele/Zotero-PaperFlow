/**
 * Zotero PaperFlow - Share Card Themes, Palettes & Data Model Builder
 */

export const CARD_WIDTH = 720;
export const BASE_HEIGHT = 900;
export const STORY_MIN_HEIGHT = 1280;
export const MAX_HEIGHT = 10000;
export const MAX_PIXEL_HEIGHT = 16384;
export const MAX_PIXELS = 24000000;
export const BRAND_TEXT = 'Zotero PaperFlow';
export const RESOLUTION_SCALES: Record<string, number> = { standard: 1, high: 2, ultra: 3 };
export const BRAND_SIZES = new Set(['compact', 'balanced', 'bold']);
export const VISIBLE_FIELDS = ['title', 'journal', 'author', 'status', 'duration', 'dates', 'footer'];
export const DEFAULT_VISIBLE = Object.fromEntries(VISIBLE_FIELDS.map((field) => [field, true]));
export const SIZE_PREFS = new Set(['portrait', 'story', 'auto']);

export interface ShareThemePalette {
  id: string;
  mode: 'light' | 'dark';
  background: string;
  paper: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accent2?: string;
  wash: string;
  gradient?: [string, string];
  paperGradient?: string[];
  grid?: boolean;
}

export const THEMES: Record<string, ShareThemePalette> = {
  estuary: { id: 'estuary', mode: 'light', background: '#b3cfd5', paper: '#e4f2ef', ink: '#153d4a', muted: '#456773', line: '#9fbdc4', accent: '#186d7c', wash: '#d4e8ea', gradient: ['#8fb6cc', '#b3d2c5'], paperGradient: ['#cee0f5', '#e4f2ef', '#b8dccc'] },
  iris: { id: 'iris', mode: 'light', background: '#b7b3d2', paper: '#eee5ef', ink: '#323354', muted: '#62617a', line: '#bdb2cf', accent: '#665397', wash: '#e0daec', gradient: ['#aab8d4', '#d3b5c7'], paperGradient: ['#cfdcf5', '#eee5ef', '#dec0d0'] },
  amber: { id: 'amber', mode: 'light', background: '#d6baaa', paper: '#f8ecdc', ink: '#49352e', muted: '#786055', line: '#ccb6a2', accent: '#92512c', wash: '#efdfc9', gradient: ['#d8b298', '#b4c4b0'], paperGradient: ['#efd0b5', '#f8ecdc', '#ceddcb'] },
  journal: { id: 'journal', mode: 'light', background: '#dce5ed', paper: '#fafbfc', ink: '#18344c', muted: '#536779', line: '#cbd7e0', accent: '#27628e', wash: '#e9f0f6', gradient: ['#cbddea', '#ebe7f1'], paperGradient: ['#ffffff', '#edf3f8'] },
  conference: { id: 'conference', mode: 'light', background: '#103e48', paper: '#f4fbfa', ink: '#133d44', muted: '#486e71', line: '#b9d7d6', accent: '#087c82', wash: '#dceeed', gradient: ['#174659', '#23786c'], paperGradient: ['#ffffff', '#e0f2ee'] },
  archive: { id: 'archive', mode: 'light', background: '#ddd6c8', paper: '#fffaf0', ink: '#383c34', muted: '#666c5e', line: '#d6d6c5', accent: '#607046', wash: '#efefe1', gradient: ['#e7dfcf', '#cbd7c8'], paperGradient: ['#fffdf6', '#f0f0e3'] },
  paper: { id: 'paper', mode: 'light', background: '#e9efed', paper: '#ffffff', ink: '#193039', muted: '#60767c', line: '#dce6e2', accent: '#167660', wash: '#f0f6f3' },
  ink: { id: 'ink', mode: 'dark', background: '#07131b', paper: '#10232d', ink: '#eef6f2', muted: '#a0b7bd', line: '#304951', accent: '#8bd8bc', wash: '#192f39' },
  blueprint: { id: 'blueprint', mode: 'light', background: '#e5edf8', paper: '#f9fbff', ink: '#183b63', muted: '#556f8e', line: '#cad8e9', accent: '#235fbc', wash: '#edf3fb' },
  minimal: { id: 'minimal', mode: 'light', background: '#ffffff', paper: '#ffffff', ink: '#222222', muted: '#666666', line: '#e3e3e3', accent: '#292929', wash: '#f6f6f6' },
  cyber: { id: 'cyber', mode: 'dark', background: '#050b17', paper: '#0b1426', ink: '#e9f7ff', muted: '#8ca6bf', line: '#27415e', accent: '#4de8ff', accent2: '#b26cff', wash: '#10233a', gradient: ['#071329', '#120a25'], paperGradient: ['#0d1a31', '#0a1223'], grid: true },
  aurora: { id: 'aurora', mode: 'dark', background: '#071421', paper: '#0e2030', ink: '#e6fff7', muted: '#86b8af', line: '#28574f', accent: '#63f5c7', accent2: '#8b7cff', wash: '#11382f', gradient: ['#071b2a', '#1c1030'], paperGradient: ['#102a38', '#0c1c2b'], grid: true },
  terminal: { id: 'terminal', mode: 'dark', background: '#06110b', paper: '#0a1d12', ink: '#d9ffe4', muted: '#79ad8a', line: '#245337', accent: '#8dff6a', accent2: '#e2ff58', wash: '#102b1a', gradient: ['#07180d', '#101b08'], paperGradient: ['#0d2517', '#09190f'], grid: true }
};

export function getAppearances(): ShareThemePalette[] {
  return Object.values(THEMES).map((palette) => ({ ...palette }));
}

export function clean(value: any, maxLength = 240): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function normalizeDate(value: any): string {
  const raw = clean(value, 40);
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
}

export function formatMilestoneDateParts(value: any, language = 'en'): { dateLabel: string; yearLabel: string } {
  const dateText = normalizeDate(value);
  if (!dateText) return { dateLabel: '', yearLabel: '' };
  const [year, month, day] = dateText.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));
  const dateLabel = language === 'zh'
    ? new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(parsed)
    : new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' }).format(parsed);
  return { dateLabel, yearLabel: String(year) };
}

export function normalizeVisibleFields(visible: any = {}): Record<string, boolean> {
  const result: Record<string, boolean> = { ...DEFAULT_VISIBLE };
  if (visible && typeof visible === 'object') {
    VISIBLE_FIELDS.forEach((field) => {
      if (field in visible) result[field] = Boolean(visible[field]);
    });
  }
  return result;
}

export function normalizeTimelineStart(value: any): string {
  return clean(value, 30).toLowerCase() === 'submission' ? 'submission' : 'experiment';
}

export function isPreSubmissionEvent(event: any = {}): boolean {
  const type = clean(event.type, 40).toLowerCase();
  const key = clean(event.key, 40).toLowerCase();
  const name = clean(event.name || event.rawName, 120).toLowerCase();
  return type === 'research'
    || type === 'writing'
    || key === 'experiment_start'
    || key === 'experiment_done'
    || key === 'draft_done'
    || /experiment|research|draft|data organization|实验|研究|初稿|数据整理/.test(name);
}

export function normalizeBrandSize(value: any): string {
  const size = clean(value || 'balanced', 20).toLowerCase();
  return BRAND_SIZES.has(size) ? size : 'balanced';
}

export function normalizeResolution(value: any): string {
  if (value === 1 || value === '1') return 'standard';
  if (value === 2 || value === '2') return 'high';
  if (value === 3 || value === '3') return 'ultra';
  const resolution = clean(value || 'high', 20).toLowerCase();
  return resolution in RESOLUTION_SCALES ? resolution : 'high';
}

export function normalizeAppearance(value: any): string {
  const key = clean(value || 'estuary', 30).toLowerCase();
  return THEMES[key] ? key : 'estuary';
}

const TYPE_LABELS_ZH: Record<string, string> = {
  research: '研究',
  writing: '写作',
  submission: '投稿',
  review: '审稿',
  revision: '修回',
  rejection: '拒稿',
  publication: '出版',
  special: '节点'
};

const TYPE_LABELS_EN: Record<string, string> = {
  research: 'Research',
  writing: 'Writing',
  submission: 'Submission',
  review: 'Review',
  revision: 'Revision',
  rejection: 'Decision',
  publication: 'Publication',
  special: 'Milestone'
};

export function buildSubmissionShareCardData(input: any = {}): any {
  const language = input.language === 'zh' ? 'zh' : 'en';
  const zh = language === 'zh';
  const visible = normalizeVisibleFields(input.visible);
  const appearance = normalizeAppearance(input.appearance || input.theme);
  const size = SIZE_PREFS.has(input.size) ? input.size : 'portrait';
  const timelineStart = normalizeTimelineStart(input.timelineStart);
  const brandSize = normalizeBrandSize(input.brandSize);
  const resolution = normalizeResolution(input.resolution);
  const typeMap = zh ? TYPE_LABELS_ZH : TYPE_LABELS_EN;

  const rawEvents = (Array.isArray(input.events) ? input.events : [])
    .map((event: any, index: number) => {
      const dateStr = normalizeDate(event.date || event.completeDate || event.dueDate || event.planDate);
      const { dateLabel, yearLabel } = formatMilestoneDateParts(dateStr, language);
      const completed = typeof event.completed === 'boolean'
        ? event.completed
        : Boolean(event.completeDate || event.status === 'completed');
      const due = typeof event.due === 'boolean'
        ? event.due
        : (!completed && !event.planDate && Boolean(event.dueDate));
      const typeKey = clean(event.type || 'special', 30).toLowerCase();
      return {
        index,
        key: clean(event.key, 40),
        type: typeKey,
        rawName: clean(event.rawName || event.name, 120),
        name: clean(event.label || event.name, 90) || (zh ? '时间节点' : 'Milestone'),
        date: dateStr,
        completed,
        due,
        typeLabel: clean(event.typeLabel, 30) || typeMap[typeKey] || typeMap.special,
        dateKindLabel: clean(event.dateKindLabel, 30) || (
          completed ? (zh ? '已记录' : 'Recorded')
            : due ? (zh ? '截止日期' : 'Due date')
              : (zh ? '计划日期' : 'Planned')
        ),
        dateLabel,
        yearLabel
      };
    })
    .filter((event: any) => Boolean(event.date))
    .filter((event: any) => timelineStart !== 'submission' || !isPreSubmissionEvent(event))
    .sort((a: any, b: any) => a.date.localeCompare(b.date) || a.index - b.index);

  const rawDuration = input.durationDays ?? input.duration;
  const duration = Number.isFinite(Number(rawDuration)) && Number(rawDuration) >= 0
    ? Math.round(Number(rawDuration))
    : null;
  const durationCaption = clean(input.durationLabel, 80) || (
    timelineStart === 'submission'
      ? (zh ? '从投稿至今天' : 'From submission to today')
      : (zh ? '从首个记录节点至今天' : 'From first recorded milestone to today')
  );

  return {
    language,
    theme: appearance,
    appearance,
    size,
    timelineStart,
    brandSize,
    resolution,
    visible,
    title: clean(input.title, 260) || (zh ? '未命名手稿' : 'Untitled Manuscript'),
    journal: clean(input.journal, 120) || (zh ? '目标期刊' : 'Target Journal'),
    author: clean(input.firstAuthor ?? input.author, 90),
    status: clean(input.statusLabel || input.status, 60) || (zh ? '已投稿' : 'Submitted'),
    duration,
    durationLabel: durationCaption,
    events: rawEvents
  };
}
