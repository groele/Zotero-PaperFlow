/**
 * Zotero PaperFlow - Share Card Canvas Layout & Renderer
 */
import {
  CARD_WIDTH,
  BASE_HEIGHT,
  STORY_MIN_HEIGHT,
  MAX_HEIGHT,
  MAX_PIXEL_HEIGHT,
  RESOLUTION_SCALES,
  THEMES,
  TONE_COLORS,
  clean,
  buildSubmissionShareCardData
} from './constants-and-data.js';

export function wrapTextLines(ctx: any, text: any, maxWidth: number, maxLines = 3): string[] {
  const content = clean(text, 260);
  if (!content) return [''];
  const tokens = content.includes(' ') ? content.split(/\s+/) : Array.from(content);
  const joiner = content.includes(' ') ? ' ' : '';
  const lines: string[] = [];
  let current = '';

  const measure = (candidate: string) => (
    typeof ctx?.measureText === 'function' ? ctx.measureText(candidate).width : candidate.length * 14
  );

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const next = current ? `${current}${joiner}${token}` : token;
    if (current && measure(next) > maxWidth) {
      lines.push(current);
      current = token;
      if (lines.length === maxLines - 1) {
        const rest = tokens.slice(i + 1).join(joiner);
        let tail = rest ? `${current}${joiner}${rest}` : current;
        if (measure(tail) > maxWidth) {
          while (tail.length > 1 && measure(`${tail}…`) > maxWidth) {
            tail = tail.slice(0, -1).trimEnd();
          }
          tail = `${tail}…`;
        }
        lines.push(tail);
        return lines;
      }
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

export function drawRoundedRect(ctx: any, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function getShareCardLayout(cardInput: any, ctx: any = null): any {
  const data = cardInput?.events ? cardInput : buildSubmissionShareCardData(cardInput);
  const font = '"Inter", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  if (ctx) ctx.font = `700 30px ${font}`;
  const titleLines = data.title ? wrapTextLines(ctx, data.title, CARD_WIDTH - 168, 4) : [];
  if (ctx) ctx.font = `650 18px ${font}`;
  const journalLines = data.journal ? wrapTextLines(ctx, data.journal, CARD_WIDTH - 280, 2) : [];
  const hasJournalRow = Boolean(data.journal || data.firstAuthor);
  const hasStatsRow = Boolean(data.statusLabel || data.durationValue);
  const rowPitch = data.events.length > 8 ? 50 : 54;
  const rows = Math.max(1, data.events.length);
  const timelineBoxHeight = Math.max(180, rows * rowPitch + (data.omittedLabel ? 50 : 22));
  const titleBlockHeight = titleLines.length ? titleLines.length * 38 + 20 : 0;
  const journalBlockHeight = hasJournalRow ? Math.max(76, journalLines.length * 24 + 42) + 18 : 0;
  const statsBlockHeight = hasStatsRow ? 108 : 0;
  const footerHeight = data.footer ? 52 : 24;
  const contentHeight = 148 + titleBlockHeight + journalBlockHeight + statsBlockHeight + 48 + timelineBoxHeight + footerHeight;
  const minHeight = data.size === 'story' ? STORY_MIN_HEIGHT : (data.size === 'auto' ? 700 : BASE_HEIGHT);
  const height = Math.min(MAX_HEIGHT, Math.max(minHeight, contentHeight));
  const requestedScale = RESOLUTION_SCALES[data.resolution] || 2;
  const scale = Math.max(1, Math.min(requestedScale, Math.floor(MAX_PIXEL_HEIGHT / height)));
  return {
    width: CARD_WIDTH,
    height,
    scale,
    pixelWidth: CARD_WIDTH * scale,
    pixelHeight: height * scale,
    resolutionLimited: scale < requestedScale,
    rowPitch,
    timelineBoxHeight,
    titleLines,
    journalLines,
    hasJournalRow,
    hasStatsRow
  };
}

export function renderSubmissionShareCard(canvas: any, cardInput: any): any {
  const data = cardInput?.events ? cardInput : buildSubmissionShareCardData(cardInput);
  const ctx = canvas.getContext('2d');
  const layout = getShareCardLayout(data, ctx);
  const { width, height, scale, rowPitch, timelineBoxHeight, titleLines, journalLines, hasJournalRow, hasStatsRow } = layout;
  const theme = THEMES[data.theme] || THEMES.estuary;
  const tones = TONE_COLORS[theme.mode] || TONE_COLORS.light;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.save();
  ctx.scale(scale, scale);

  const font = '"Inter", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, theme.top);
  bg.addColorStop(0.55, theme.mid);
  bg.addColorStop(1, theme.bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = theme.orbA;
  ctx.beginPath(); ctx.arc(width - 90, 110, 150, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = theme.orbB;
  ctx.beginPath(); ctx.arc(96, height - 110, 170, 0, Math.PI * 2); ctx.fill();

  drawRoundedRect(ctx, 42, 42, width - 84, height - 84, 28);
  ctx.fillStyle = theme.card;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = theme.border;
  ctx.stroke();

  const brandBox = { compact: { h: 28, font: 11, pad: 13 }, balanced: { h: 32, font: 12, pad: 15 }, bold: { h: 36, font: 13.5, pad: 17 } }[data.brandSize as 'compact' | 'balanced' | 'bold'] || { h: 32, font: 12, pad: 15 };
  ctx.font = `700 ${brandBox.font}px ${font}`;
  const brandWidth = Math.max(146, (ctx.measureText?.(data.brandText)?.width || 110) + brandBox.pad * 2);
  drawRoundedRect(ctx, width - 84 - brandWidth, 72, brandWidth, brandBox.h, brandBox.h / 2);
  ctx.fillStyle = theme.accentSoft;
  ctx.fill();
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'center';
  ctx.fillText(data.brandText, width - 84 - brandWidth / 2, 72 + brandBox.h * 0.64);
  ctx.textAlign = 'left';

  ctx.fillStyle = theme.accent;
  ctx.font = `700 13px ${font}`;
  ctx.fillText(data.eyebrow, 84, 92);

  let y = 142;
  if (titleLines.length) {
    ctx.fillStyle = theme.ink;
    ctx.font = `700 30px ${font}`;
    titleLines.forEach((line: string) => {
      ctx.fillText(line, 84, y);
      y += 38;
    });
    y += 8;
  }

  if (hasJournalRow) {
    const boxHeight = Math.max(76, journalLines.length * 24 + 42);
    drawRoundedRect(ctx, 84, y, width - 168, boxHeight, 18);
    ctx.fillStyle = theme.panel;
    ctx.fill();
    ctx.strokeStyle = theme.border;
    ctx.stroke();

    if (data.journal) {
      ctx.fillStyle = theme.muted;
      ctx.font = `600 12px ${font}`;
      ctx.fillText(data.journalLabel, 106, y + 26);
      ctx.fillStyle = theme.ink;
      ctx.font = `650 18px ${font}`;
      journalLines.forEach((line: string, index: number) => {
        ctx.fillText(line, 106, y + 52 + index * 23);
      });
    }

    if (data.firstAuthor) {
      const authorX = data.journal ? width - 250 : 106;
      ctx.fillStyle = theme.muted;
      ctx.font = `600 12px ${font}`;
      ctx.fillText(data.firstAuthorLabel, authorX, y + 26);
      ctx.fillStyle = theme.body;
      ctx.font = `600 16px ${font}`;
      ctx.fillText(wrapTextLines(ctx, data.firstAuthor, 150, 1)[0], authorX, y + 52);
    }
    y += boxHeight + 18;
  }

  if (hasStatsRow) {
    const tone = tones[data.statusTone] || tones.blue;
    const singleStat = !(data.statusLabel && data.durationValue);
    const statWidth = singleStat ? width - 168 : 268;
    if (data.statusLabel) {
      drawRoundedRect(ctx, 84, y, statWidth, 88, 18);
      ctx.fillStyle = tone.bg;
      ctx.fill();
      ctx.fillStyle = tone.fg;
      ctx.font = `600 12px ${font}`;
      ctx.fillText(data.statusTitle, 106, y + 28);
      ctx.font = `700 22px ${font}`;
      ctx.fillText(wrapTextLines(ctx, data.statusLabel, statWidth - 44, 1)[0], 106, y + 61);
    }
    if (data.durationValue) {
      const x = data.statusLabel ? 370 : 84;
      const boxW = data.statusLabel ? width - 454 : statWidth;
      drawRoundedRect(ctx, x, y, boxW, 88, 18);
      ctx.fillStyle = theme.panel;
      ctx.fill();
      ctx.strokeStyle = theme.border;
      ctx.stroke();
      ctx.fillStyle = theme.muted;
      ctx.font = `600 12px ${font}`;
      ctx.fillText(data.durationLabel, x + 22, y + 28);
      ctx.fillStyle = theme.ink;
      ctx.font = `700 26px ${font}`;
      const valueText = data.durationUnit ? `${data.durationValue} ${data.durationUnit}` : data.durationValue;
      ctx.fillText(valueText, x + 22, y + 62);
    }
    y += 116;
  }

  ctx.fillStyle = theme.muted;
  ctx.font = `700 13px ${font}`;
  ctx.fillText(data.timelineTitle, 84, y);
  y += 18;

  drawRoundedRect(ctx, 84, y, width - 168, timelineBoxHeight, 20);
  ctx.fillStyle = theme.panel;
  ctx.fill();
  ctx.strokeStyle = theme.border;
  ctx.stroke();

  if (!data.events.length) {
    ctx.fillStyle = theme.muted;
    ctx.font = `500 16px ${font}`;
    ctx.fillText(data.emptyEventsText, 114, y + 64);
  } else {
    const startY = y + 36;
    const endY = startY + (data.events.length - 1) * rowPitch;
    if (data.events.length > 1) {
      ctx.strokeStyle = theme.rail;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(122, startY);
      ctx.lineTo(122, endY);
      ctx.stroke();
    }
    data.events.forEach((event: any, index: number) => {
      const rowY = startY + index * rowPitch;
      const eventColor = tones[event.tone] || tones.slate;
      ctx.fillStyle = eventColor.dot;
      ctx.beginPath();
      ctx.arc(122, rowY - 5, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme.ink;
      ctx.font = `600 16px ${font}`;
      const labelWidth = event.displayDate ? 340 : 450;
      ctx.fillText(wrapTextLines(ctx, event.name, labelWidth, 1)[0], 144, rowY);

      if (event.displayDate) {
        ctx.fillStyle = theme.muted;
        ctx.font = `600 14px ${font}`;
        ctx.textAlign = 'right';
        ctx.fillText(event.displayDate, width - 112, rowY);
        ctx.textAlign = 'left';
      }
    });
    if (data.omittedLabel) {
      ctx.fillStyle = theme.muted;
      ctx.font = `500 13px ${font}`;
      ctx.fillText(data.omittedLabel, 144, y + timelineBoxHeight - 18);
    }
  }

  if (data.footer) {
    ctx.fillStyle = theme.muted;
    ctx.font = `500 13px ${font}`;
    ctx.fillText(data.footer, 84, height - 66);
    ctx.textAlign = 'right';
    ctx.font = `700 13px ${font}`;
    ctx.fillStyle = theme.accent;
    ctx.fillText(data.brandText, width - 84, height - 66);
    ctx.textAlign = 'left';
  }
  ctx.restore();
  return { ...data, ...layout };
}
