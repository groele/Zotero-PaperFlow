/**
 * Zotero PaperFlow - Editorial Share Card Layout Engine
 */
import {
  CARD_WIDTH,
  BASE_HEIGHT,
  STORY_MIN_HEIGHT,
  MAX_HEIGHT,
  THEMES,
  clean
} from './constants-and-data.js';

const FONT = '"Microsoft YaHei UI", "PingFang SC", "Segoe UI", sans-serif';
export const DISPLAY = 'Georgia, "Songti SC", "Microsoft YaHei", serif';
export const BRAND_FONT = '"Segoe UI", "Microsoft YaHei UI", "PingFang SC", sans-serif';

const segmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;
const glyphs = (text: string): string[] => (
  segmenter ? Array.from(segmenter.segment(text), (item) => item.segment) : Array.from(text)
);

function fallbackMeasure(ctx: any, value: string): number {
  if (typeof ctx?.measureText === 'function') return ctx.measureText(value).width;
  return String(value || '').length * 14;
}

export function wrapText(ctx: any, value: any, width: number, maxLines = Infinity): string[] {
  const input = clean(value, 280);
  if (!input) return [];
  const lines: string[] = [];
  let line = '';
  const tokens = input.match(/[^\s\u2e80-\u9fff]+\s*|[\u2e80-\u9fff]\s*/gu) || [input];
  for (const token of tokens) {
    if (fallbackMeasure(ctx, (line + token).trimEnd()) <= width) { line += token; continue; }
    if (line.trim()) { lines.push(line.trim()); line = ''; }
    if (fallbackMeasure(ctx, token.trim()) <= width) { line = token.trimStart(); continue; }
    for (const glyph of glyphs(token.trim())) {
      if (line && fallbackMeasure(ctx, line + glyph) > width) { lines.push(line); line = ''; }
      line += glyph;
    }
  }
  if (line.trim()) lines.push(line.trim());
  if (lines.length <= maxLines) return lines;
  const result = lines.slice(0, maxLines);
  const last = glyphs(result[result.length - 1]);
  while (last.length && fallbackMeasure(ctx, `${last.join('')}…`) > width) last.pop();
  result[result.length - 1] = `${last.join('').trimEnd()}…`;
  return result;
}

export const wrapTextLines = wrapText;

export function buildLayout(ctx: any, model: any, preferences: any = {}): any {
  const modelVisible = model?.visible && typeof model.visible === 'object' ? model.visible : {};
  const v: any = {
    title: true, journal: true, author: true, status: true, duration: true, dates: true, footer: true,
    ...modelVisible,
    ...preferences
  };
  v.appearance = preferences.appearance ?? preferences.theme ?? model?.appearance ?? model?.theme ?? 'estuary';
  v.size = preferences.size ?? model?.size ?? 'portrait';
  v.brandSize = preferences.brandSize ?? model?.brandSize ?? 'balanced';

  const palette = THEMES[v.appearance] || THEMES.paper;
  const zh = model?.language === 'zh';
  const minimal = ['minimal', 'journal', 'conference'].includes(v.appearance);
  const blueprint = ['blueprint', 'conference', 'archive'].includes(v.appearance);
  const cover = v.appearance === 'journal';
  const archive = v.appearance === 'archive';
  const tech = ['cyber', 'aurora', 'terminal'].includes(v.appearance);
  const width = CARD_WIDTH;
  const brandMap: Record<string, { scale: number; name: number; motto: number }> = {
    compact: { scale: 0.84, name: 13, motto: 9.5 },
    balanced: { scale: 1.06, name: 15, motto: 10.5 },
    bold: { scale: 1.26, name: 17, motto: 11.5 }
  };
  const brand = brandMap[v.brandSize] || brandMap.balanced;
  const left = 48;
  const right = 672;
  const blocks: any[] = [];
  let masthead = true;

  if (cover) blocks.push({ kind: 'rect', x: 16, y: 16, width: 688, height: 12, color: palette.accent });
  if (v.appearance === 'conference') blocks.push({ kind: 'rect', x: 24, y: 40, width: 6, height: 190, color: palette.accent });
  if (tech) blocks.push({ kind: 'grid', color: palette.line, accent: palette.accent2 || palette.accent });

  const text = (
    role: string,
    value: any,
    x: number,
    y: number,
    maxWidth: number,
    size: number,
    weight = 400,
    color = palette.ink,
    maxLines = 1,
    display = false,
    align: 'left' | 'right' = 'left'
  ): number => {
    const resolvedWidth = (v.footer && masthead) ? Math.min(maxWidth, 496 - x) : maxWidth;
    const font = `${weight} ${size}px ${display ? DISPLAY : FONT}`;
    if (ctx) ctx.font = font;
    const lines = wrapText(ctx, value, resolvedWidth, maxLines);
    const lineHeight = Math.ceil(size * 1.36);
    lines.forEach((line, index) => {
      blocks.push({ kind: 'text', role, text: line, x, y: y + index * lineHeight, width: resolvedWidth, height: lineHeight, font, color, align });
    });
    return lines.length * lineHeight;
  };
  const rule = (y: number) => blocks.push({ kind: 'line', x: left, y, x2: right, y2: y, color: palette.line });

  if (v.footer) {
    const center = 592;
    blocks.push({ kind: 'brand-seal', role: 'brand-seal', x: center, y: 86, scale: brand.scale, color: palette.accent, secondary: palette.accent2 || palette.muted });
    const brandText = (role: string, value: string, top: number, size: number, weight: number, color: string) => {
      let currentSize = size;
      let font = `${weight} ${currentSize}px ${BRAND_FONT}`;
      if (ctx) ctx.font = font;
      while (fallbackMeasure(ctx, value) > 144 && currentSize > 7) {
        currentSize -= 0.25;
        font = `${weight} ${currentSize}px ${BRAND_FONT}`;
        if (ctx) ctx.font = font;
      }
      const w = fallbackMeasure(ctx, value);
      blocks.push({ kind: 'text', role, text: value, x: center - w / 2, y: top, width: w, height: Math.ceil(currentSize * 1.4), font, color, align: 'left' });
    };
    const wordmarkY = 86 + 36 * brand.scale + 10;
    brandText('brand-wordmark', 'Zotero PaperFlow', wordmarkY, brand.name, 600, palette.ink);
    brandText('brand-motto', zh ? '探索 · 求证 · 记录' : 'Explore · Verify · Record', wordmarkY + Math.ceil(brand.name * 1.4) + 5, zh ? brand.motto : brand.motto - 0.5, 400, palette.muted);
  }

  const allEvents = Array.isArray(model?.events) ? model.events : [];
  const events = allEvents.length > 64 ? [allEvents[0], ...allEvents.slice(-63)] : allEvents;
  const omitted = allEvents.length - events.length;

  let y = 48;
  blocks.push({ kind: 'rect', x: left, y: y + 2, width: 28, height: 4, color: palette.accent });
  text('eyebrow', zh ? '科研手记 / 投稿历程' : 'FIELD NOTES / SUBMISSION JOURNEY', left + 40, y - 5, 580, 13, 600, palette.muted);
  y += 47;

  if (minimal && v.title && model?.title) {
    y += text('title', model.title, left, y, 624, cover ? 36 : 32, cover ? 400 : 600, palette.ink, 6, cover && !zh) + 24;
  }
  if (v.journal && model?.journal) {
    const latinJournal = !/[\u2e80-\u9fff]/u.test(model.journal);
    const shortJournal = glyphs(String(model.journal).trim()).length <= 18;
    const journalSize = minimal && v.title && model?.title ? 28 : (shortJournal ? 48 : 34);
    blocks.push({ kind: 'rect', role: 'journal-mark', x: left, y: y + 2, width: 3, height: 12, color: palette.accent });
    text('journal-label', zh ? '投稿期刊' : 'THE JOURNAL', left + 12, y, 600, 10, 600, palette.muted);
    y += 22;
    y += text('journal', model.journal, left, y, 624, journalSize, latinJournal ? 400 : 600, palette.ink, 3, latinJournal && !tech) + 10;
    blocks.push({ kind: 'rect', role: 'journal-underline', x: left, y, width: shortJournal ? 64 : 96, height: 2, color: palette.accent });
    y += 20;
  }
  if (!minimal && v.title && model?.title) {
    y += text('title', model.title, left, y, 624, 27, 600, palette.ink, 6) + 20;
  }
  if (v.author && model?.author) {
    y += text('author', `${zh ? '第一作者' : 'First author'}  /  ${model.author}`, left, y, 624, 15, 400, palette.muted, 2) + 16;
  }

  const brandBlocks = blocks.filter((b) => ['brand-seal', 'brand-wordmark', 'brand-motto'].includes(b.role));
  const brandTop = 86 - 36 * brand.scale;
  const brandBottom = v.footer && brandBlocks.length ? brandBlocks[brandBlocks.length - 1].y + brandBlocks[brandBlocks.length - 1].height : 0;
  const brandHeight = brandBottom - brandTop;
  const headerBottom = Math.max(y + 8, v.footer ? 72 + brandHeight + 24 : 0);
  if (v.footer && brandBlocks.length) {
    const headline = blocks.find((b) => b.role === 'journal' || b.role === 'title');
    const target = headline ? headline.y + headline.height / 2 - 8 : 132;
    const top = Math.max(72, Math.min(target - brandHeight / 2, 112, headerBottom - 24 - brandHeight));
    brandBlocks.forEach((b) => { b.y += top - brandTop; });
  }

  masthead = false;
  rule(headerBottom);
  y = headerBottom + 26;

  if (v.duration || v.status) {
    const both = Boolean(v.duration && v.status);
    const columnWidth = both ? 294 : 624;
    let metricHeight = 0;
    const metricBackground = blueprint ? { kind: 'rect', x: left - 16, y: y - 12, width: 656, height: 156, color: palette.wash, radius: 8 } : null;
    if (metricBackground) blocks.push(metricBackground);
    if (v.duration) {
      text('duration-label', zh ? '历程天数' : 'DAYS IN THIS JOURNEY', left, y, columnWidth, 12, 600, palette.muted);
      const valid = Number.isFinite(model?.duration) && model.duration >= 0;
      const number = valid ? String(model.duration) : '—';
      text('duration', number, left - 2, y + 22, columnWidth - 50, 60, 400, palette.accent, 1, true);
      if (ctx) ctx.font = `400 60px ${DISPLAY}`;
      if (valid) {
        const unitX = Math.min(left + fallbackMeasure(ctx, number) + 12, left + columnWidth - 48);
        text('duration-unit', zh ? '天' : 'days', unitX, y + 63, 48, 14, 500, palette.muted);
      }
      metricHeight = 108 + text('duration-caption', model?.durationLabel || '', left, y + 108, columnWidth, 13, 400, palette.muted, 2);
    }
    if (v.status) {
      const x = both ? 378 : left;
      if (both) blocks.push({ kind: 'line', x: 350, y: y + 2, x2: 350, y2: y + 122, color: palette.line });
      text('status-label', zh ? '当前进展' : 'CURRENT CHAPTER', x, y, columnWidth, 12, 600, palette.muted);
      const statusHeight = text('status', model?.status || '—', x, y + 37, columnWidth, 26, 600, palette.ink, 2);
      metricHeight = Math.max(metricHeight, 37 + statusHeight + 24);
    }
    if (metricBackground) metricBackground.height = metricHeight + 26;
    y += metricHeight + 26;
    rule(y);
    y += 32;
  }

  text('timeline-label', zh ? '一步一步，记录科研历程' : 'The journey, step by step.', left, y, 456, 21, 600, palette.ink);
  text('timeline-count', `${events.length} ${zh ? '个节点' : 'milestones'}`, right, y + 5, 148, 13, 500, palette.muted, 1, false, 'right');
  y += 52;
  const timelineStart = y;

  if (!events.length) {
    blocks.push({ kind: 'rect', x: left, y, width: 624, height: 108, color: palette.wash, radius: 12 });
    text('empty', zh ? '故事刚刚开始' : 'Every journey begins somewhere.', left + 24, y + 22, 576, 21, 600, palette.ink);
    text('empty-help', zh ? '添加带日期的节点后，即可生成时间线。' : 'Add a dated milestone to begin your timeline.', left + 24, y + 62, 576, 15, 400, palette.muted);
    y += 128;
  }

  const railX = v.dates ? 186 : 62;
  const contentX = railX + 30;
  const rowCenters: number[] = [];

  events.forEach((event: any, index: number) => {
    const rowBg = archive ? { kind: 'rect', x: left - 12, y: y - 8, width: 648, height: 76, color: index % 2 === 0 ? palette.wash : palette.paper, radius: 4 } : null;
    if (rowBg) blocks.push(rowBg);
    if (omitted && index === 1) {
      text('omitted', zh ? `另有 ${omitted} 个节点未展示` : `${omitted} earlier milestones not shown`, contentX, y, right - contentX, 13, 500, palette.muted, 2);
      y += 48;
    }
    const nameHeight = text('event-name', event.name || (zh ? '未命名节点' : 'Untitled milestone'), contentX, y, right - contentX, minimal ? 18 : 20, 600, palette.ink, 2);
    const meta = [event.typeLabel, event.dateKindLabel].filter(Boolean).join(' · ');
    const metaHeight = text('event-meta', meta, contentX, y + nameHeight + 6, right - contentX, 12, 500, palette.muted, 2);
    let dateHeight = 0;
    if (v.dates) {
      dateHeight = text('event-date', event.dateLabel || '—', left, y + 1, 122, 17, 600, palette.ink, 2);
      text('event-year', event.yearLabel || '', left, y + dateHeight + 4, 122, 12, 400, palette.muted);
    }
    const rowHeight = Math.max(minimal ? 64 : 76, nameHeight + metaHeight + (minimal ? 20 : 28), v.dates ? dateHeight + 36 : 0);
    if (rowBg) rowBg.height = rowHeight - 8;
    rowCenters.push(y + 12);
    blocks.push({ kind: 'node', x: railX, y: y + 12, completed: Boolean(event.completed), square: blueprint, color: palette.accent, background: palette.paper });
    y += rowHeight;
  });

  if (rowCenters.length > 1) {
    blocks.unshift({ kind: 'line', x: railX, y: rowCenters[0], x2: railX, y2: rowCenters[rowCenters.length - 1], color: palette.line });
  }

  const timelineBottom = y;
  let height = Math.ceil(y + (v.footer ? 90 : 40));
  const minHeight = v.size === 'story' ? STORY_MIN_HEIGHT : (v.size === 'auto' ? 0 : BASE_HEIGHT);
  height = Math.min(MAX_HEIGHT, Math.max(minHeight, height));

  if (v.footer) {
    rule(height - 84);
    text('footer-brand', 'ZOTERO PAPERFLOW', left, height - 61, 260, 13, 700, palette.ink);
    text('footer-note', zh ? '每一步，都值得记录。' : 'Every step is worth recording.', right, height - 61, 317, 13, 400, palette.muted, 1, false, 'right');
  }

  return { width, height, palette, appearance: v.appearance, blocks, headerBottom, timelineStart, timelineBottom, omitted, eventCount: events.length };
}
