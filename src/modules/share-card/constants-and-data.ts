/**
 * Zotero PaperFlow - Share Card Themes, Constants & Data Builder
 */

export const CARD_WIDTH = 720;
export const BASE_HEIGHT = 960;
export const STORY_MIN_HEIGHT = 1280;
export const MAX_HEIGHT = 10000;
export const MAX_PIXEL_HEIGHT = 16384;
export const BRAND_TEXT = 'Zotero PaperFlow';
export const RESOLUTION_SCALES: Record<string, number> = { standard: 1, high: 2, ultra: 3 };
export const BRAND_SIZES = new Set(['compact', 'balanced', 'bold']);
export const VISIBLE_FIELDS = ['title', 'journal', 'author', 'status', 'duration', 'dates', 'footer'];
export const DEFAULT_VISIBLE = Object.fromEntries(VISIBLE_FIELDS.map((field) => [field, true]));
export const SIZE_PREFS = new Set(['portrait', 'story', 'auto']);

export const THEMES: Record<string, any> = {
  estuary: { id: 'estuary', mode: 'light', top: '#e0f2fe', mid: '#f8fafc', bottom: '#ecfdf5', orbA: 'rgba(14, 165, 233, 0.14)', orbB: 'rgba(16, 185, 129, 0.12)', card: 'rgba(255, 255, 255, 0.92)', panel: '#f8fafc', border: '#cbd5e1', ink: '#0f172a', body: '#334155', muted: '#64748b', accent: '#0284c7', accentSoft: '#e0f2fe', rail: '#cbd5e1' },
  iris: { id: 'iris', mode: 'light', top: '#eef2ff', mid: '#f8fafc', bottom: '#fdf2f8', orbA: 'rgba(79, 70, 229, 0.14)', orbB: 'rgba(219, 39, 119, 0.10)', card: 'rgba(255, 255, 255, 0.92)', panel: '#f8fafc', border: '#cbd5e1', ink: '#111827', body: '#334155', muted: '#64748b', accent: '#4f46e5', accentSoft: '#eef2ff', rail: '#cbd5e1' },
  amber: { id: 'amber', mode: 'light', top: '#fffbeb', mid: '#fafaf9', bottom: '#f0fdf4', orbA: 'rgba(217, 119, 6, 0.14)', orbB: 'rgba(5, 150, 105, 0.10)', card: 'rgba(255, 255, 255, 0.93)', panel: '#fafaf9', border: '#d6d3d1', ink: '#1c1917', body: '#44403c', muted: '#78716c', accent: '#b45309', accentSoft: '#fef3c7', rail: '#d6d3d1' },
  journal: { id: 'journal', mode: 'light', top: '#f8fafc', mid: '#ffffff', bottom: '#eff6ff', orbA: 'rgba(30, 64, 175, 0.10)', orbB: 'rgba(14, 116, 144, 0.08)', card: '#ffffff', panel: '#f8fafc', border: '#cbd5e1', ink: '#0f172a', body: '#1e293b', muted: '#64748b', accent: '#1d4ed8', accentSoft: '#dbeafe', rail: '#cbd5e1' },
  conference: { id: 'conference', mode: 'light', top: '#ecfeff', mid: '#f8fafc', bottom: '#f0fdfa', orbA: 'rgba(8, 145, 178, 0.16)', orbB: 'rgba(13, 148, 136, 0.14)', card: 'rgba(255, 255, 255, 0.94)', panel: '#f0fdfa', border: '#99f6e4', ink: '#083344', body: '#134e4a', muted: '#0f766e', accent: '#0f766e', accentSoft: '#ccfbf1', rail: '#99f6e4' },
  archive: { id: 'archive', mode: 'light', top: '#f5f5f4', mid: '#fafaf9', bottom: '#fefce8', orbA: 'rgba(120, 113, 108, 0.10)', orbB: 'rgba(180, 83, 9, 0.08)', card: '#fffbeb', panel: '#f5f5f4', border: '#d6d3d1', ink: '#1c1917', body: '#44403c', muted: '#78716c', accent: '#9a3412', accentSoft: '#ffedd5', rail: '#d6d3d1' },
  paper: { id: 'paper', mode: 'light', top: '#f8fafc', mid: '#ffffff', bottom: '#f1f5f9', orbA: 'rgba(15, 23, 42, 0.05)', orbB: 'rgba(37, 99, 235, 0.06)', card: '#ffffff', panel: '#f8fafc', border: '#cbd5e1', ink: '#0f172a', body: '#334155', muted: '#64748b', accent: '#0f766e', accentSoft: '#ccfbf1', rail: '#cbd5e1' },
  ink: { id: 'ink', mode: 'dark', top: '#090d16', mid: '#0f172a', bottom: '#111827', orbA: 'rgba(56, 189, 248, 0.18)', orbB: 'rgba(16, 185, 129, 0.14)', card: 'rgba(15, 23, 42, 0.92)', panel: 'rgba(30, 41, 59, 0.86)', border: '#334155', ink: '#f8fafc', body: '#e2e8f0', muted: '#94a3b8', accent: '#38bdf8', accentSoft: 'rgba(56, 189, 248, 0.16)', rail: '#334155' },
  blueprint: { id: 'blueprint', mode: 'dark', top: '#082f49', mid: '#0f172a', bottom: '#042f2e', orbA: 'rgba(56, 189, 248, 0.18)', orbB: 'rgba(45, 212, 191, 0.14)', card: 'rgba(15, 23, 42, 0.90)', panel: 'rgba(12, 74, 110, 0.44)', border: '#1e3a8a', ink: '#f0f9ff', body: '#bae6fd', muted: '#7dd3fc', accent: '#38bdf8', accentSoft: 'rgba(56, 189, 248, 0.18)', rail: '#0369a1' },
  minimal: { id: 'minimal', mode: 'light', top: '#ffffff', mid: '#ffffff', bottom: '#f8fafc', orbA: 'rgba(15, 23, 42, 0)', orbB: 'rgba(15, 23, 42, 0)', card: '#ffffff', panel: '#f8fafc', border: '#e2e8f0', ink: '#0f172a', body: '#334155', muted: '#64748b', accent: '#0f172a', accentSoft: '#f1f5f9', rail: '#cbd5e1' },
  cyber: { id: 'cyber', mode: 'dark', top: '#070b14', mid: '#0f172a', bottom: '#042f2e', orbA: 'rgba(34, 211, 238, 0.24)', orbB: 'rgba(244, 63, 94, 0.18)', card: 'rgba(9, 13, 22, 0.93)', panel: 'rgba(15, 23, 42, 0.90)', border: '#0891b2', ink: '#ecfeff', body: '#cffafe', muted: '#67e8f9', accent: '#22d3ee', accentSoft: 'rgba(34, 211, 238, 0.18)', rail: '#0891b2' },
  aurora: { id: 'aurora', mode: 'dark', top: '#052e2b', mid: '#0f172a', bottom: '#172554', orbA: 'rgba(45, 212, 191, 0.22)', orbB: 'rgba(56, 189, 248, 0.20)', card: 'rgba(15, 23, 42, 0.90)', panel: 'rgba(17, 94, 89, 0.34)', border: '#0f766e', ink: '#f0fdfa', body: '#ccfbf1', muted: '#5eead4', accent: '#2dd4bf', accentSoft: 'rgba(45, 212, 191, 0.18)', rail: '#0d9488' },
  terminal: { id: 'terminal', mode: 'dark', top: '#05080f', mid: '#0b1220', bottom: '#052e16', orbA: 'rgba(16, 185, 129, 0.16)', orbB: 'rgba(14, 165, 233, 0.12)', card: 'rgba(8, 13, 23, 0.94)', panel: 'rgba(15, 23, 42, 0.88)', border: '#14532d', ink: '#ecfdf5', body: '#bbf7d0', muted: '#4ade80', accent: '#10b981', accentSoft: 'rgba(16, 185, 129, 0.16)', rail: '#166534' }
};

export const TONE_COLORS: Record<string, any> = {
  light: {
    blue: { fg: '#1d4ed8', bg: '#dbeafe', dot: '#2563eb' },
    teal: { fg: '#0f766e', bg: '#ccfbf1', dot: '#0d9488' },
    amber: { fg: '#b45309', bg: '#fef3c7', dot: '#d97706' },
    green: { fg: '#15803d', bg: '#dcfce7', dot: '#16a34a' },
    red: { fg: '#b91c1c', bg: '#fee2e2', dot: '#dc2626' },
    slate: { fg: '#334155', bg: '#e2e8f0', dot: '#64748b' }
  },
  dark: {
    blue: { fg: '#7dd3fc', bg: 'rgba(37, 99, 235, 0.24)', dot: '#38bdf8' },
    teal: { fg: '#5eead4', bg: 'rgba(13, 148, 136, 0.24)', dot: '#2dd4bf' },
    amber: { fg: '#fcd34d', bg: 'rgba(217, 119, 6, 0.24)', dot: '#f59e0b' },
    green: { fg: '#86efac', bg: 'rgba(22, 163, 74, 0.24)', dot: '#4ade80' },
    red: { fg: '#fca5a5', bg: 'rgba(220, 38, 38, 0.24)', dot: '#f87171' },
    slate: { fg: '#cbd5e1', bg: 'rgba(100, 116, 139, 0.24)', dot: '#94a3b8' }
  }
};

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

export function formatDisplayDate(value: any, language = 'en'): string {
  const dateText = normalizeDate(value);
  if (!dateText) return '';
  const [year, month, day] = dateText.split('-').map(Number);
  if (language === 'zh') return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[(month || 1) - 1] || month} ${day}, ${year}`;
}

export function statusTone(status: any): string {
  const normalized = clean(status, 40).toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'accepted' || normalized === 'published') return 'green';
  if (normalized === 'revision') return 'amber';
  if (normalized === 'under_review') return 'teal';
  if (normalized === 'rejected') return 'red';
  return 'blue';
}

export function eventTone(node: any = {}): string {
  const type = clean(node.type, 40).toLowerCase();
  const key = clean(node.key, 40).toLowerCase();
  if (type === 'publication' || key === 'accept' || key === 'online') return 'green';
  if (type === 'rejection' || key === 'rejected') return 'red';
  if (type === 'review' || type === 'revision' || key.startsWith('r1') || key.startsWith('r2')) return 'amber';
  if (type === 'submission' || key === 'submit') return 'blue';
  if (type === 'research' || type === 'writing') return 'teal';
  return 'slate';
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
    || /experiment|draft|data organization|实验|初稿|数据整理/.test(name);
}

export function normalizeBrandSize(value: any): string {
  const size = clean(value || 'balanced', 20).toLowerCase();
  return BRAND_SIZES.has(size) ? size : 'balanced';
}

export function normalizeResolution(value: any): string {
  const resolution = clean(value || 'high', 20).toLowerCase();
  return resolution in RESOLUTION_SCALES ? resolution : 'high';
}

export function buildSubmissionShareCardData(input: any = {}): any {
  const language = input.language === 'zh' ? 'zh' : 'en';
  const labels = input.labels || {};
  const visible = normalizeVisibleFields(input.visible);
  const theme = THEMES[input.theme]?.id || 'estuary';
  const size = SIZE_PREFS.has(input.size) ? input.size : 'portrait';
  const timelineStart = normalizeTimelineStart(input.timelineStart);
  const brandSize = normalizeBrandSize(input.brandSize);
  const resolution = normalizeResolution(input.resolution);
  const datedEvents = (Array.isArray(input.events) ? input.events : [])
    .map((event: any, index: number) => ({
      index,
      key: clean(event.key, 40),
      type: clean(event.type, 40),
      rawName: clean(event.rawName || event.name, 120),
      name: clean(event.label || event.name, 90) || (language === 'zh' ? '时间节点' : 'Milestone'),
      date: normalizeDate(event.date || event.completeDate || event.dueDate || event.planDate),
      displayDate: visible.dates
        ? formatDisplayDate(event.date || event.completeDate || event.dueDate || event.planDate, language)
        : '',
      tone: eventTone(event)
    }))
    .filter((event: any) => Boolean(event.date))
    .filter((event: any) => timelineStart !== 'submission' || !isPreSubmissionEvent(event))
    .sort((a: any, b: any) => a.date.localeCompare(b.date) || a.index - b.index);

  const maxEvents = 40;
  const omittedCount = Math.max(0, datedEvents.length - maxEvents);
  const events = omittedCount ? datedEvents.slice(-maxEvents) : datedEvents;
  const durationDays = Number.isFinite(Number(input.durationDays)) ? Math.max(0, Math.round(Number(input.durationDays))) : null;

  return {
    language,
    theme,
    size,
    timelineStart,
    brandSize,
    resolution,
    visible,
    eyebrow: clean(labels.eyebrow, 80) || (language === 'zh' ? 'ZOTERO PAPERFLOW · 投稿历程' : 'ZOTERO PAPERFLOW · SUBMISSION JOURNEY'),
    title: visible.title ? (clean(input.title, 260) || (language === 'zh' ? '未命名手稿' : 'Untitled Manuscript')) : '',
    journalLabel: clean(labels.journalLabel, 40) || (language === 'zh' ? '目标期刊' : 'TARGET JOURNAL'),
    journal: visible.journal ? (clean(input.journal, 120) || (language === 'zh' ? '目标期刊' : 'Target Journal')) : '',
    firstAuthorLabel: clean(labels.firstAuthorLabel, 40) || (language === 'zh' ? '第一作者' : 'FIRST AUTHOR'),
    firstAuthor: visible.author ? clean(input.firstAuthor, 90) : '',
    statusTitle: clean(labels.statusTitle, 40) || (language === 'zh' ? '当前状态' : 'CURRENT STATUS'),
    statusLabel: visible.status ? (clean(input.statusLabel, 60) || (language === 'zh' ? '已投稿' : 'Submitted')) : '',
    statusTone: statusTone(input.status || 'submitted'),
    durationLabel: clean(labels.durationLabel, 50) || (language === 'zh' ? '历程天数' : 'DAYS IN THIS JOURNEY'),
    durationValue: visible.duration ? (durationDays === null ? '—' : String(durationDays)) : '',
    durationUnit: visible.duration && durationDays === null ? '' : (clean(labels.daysUnit, 20) || (language === 'zh' ? '天' : 'days')),
    timelineTitle: clean(labels.timelineTitle, 60) || (language === 'zh' ? '关键节点' : 'JOURNEY MILESTONES'),
    emptyEventsText: clean(labels.emptyEventsText, 90) || (language === 'zh' ? '暂无已记录日期的节点' : 'No dated milestones yet'),
    footer: visible.footer ? (clean(labels.footer, 120) || (language === 'zh' ? '由 Zotero PaperFlow 在本地生成' : 'Created locally with Zotero PaperFlow')) : '',
    brandText: BRAND_TEXT,
    events,
    omittedCount,
    omittedLabel: omittedCount
      ? (clean(labels.omittedLabel, 80) || (language === 'zh' ? `另有 ${omittedCount} 个较早节点未展开` : `${omittedCount} earlier milestones omitted`))
      : ''
  };
}
