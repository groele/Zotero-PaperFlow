/**
 * Zotero PaperFlow - Editorial Share Card Canvas Renderer
 */
import {
  MAX_PIXEL_HEIGHT,
  MAX_PIXELS,
  RESOLUTION_SCALES,
  buildSubmissionShareCardData
} from './constants-and-data.js';
import {
  BRAND_FONT,
  buildLayout,
  wrapText,
  wrapTextLines
} from './layout-builder.js';

export { wrapText, wrapTextLines, buildLayout };

function roundedRectPath(ctx: any, x: number, y: number, w: number, h: number, r: number): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawBrandSeal(ctx: any, block: any): void {
  ctx.save();
  ctx.translate(block.x, block.y);
  ctx.scale(block.scale || 1, block.scale || 1);
  ctx.strokeStyle = block.color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i += 1) {
    const a = (i * Math.PI) / 6;
    const inner = i % 3 === 0 ? 32 : 34;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * 36, Math.sin(a) * 36);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.7;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-52, -52, 104, 104);
  ctx.rect(-20, -15, 40, 30);
  ctx.clip('evenodd');
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 17, -Math.PI / 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = block.secondary;
  ctx.beginPath();
  ctx.arc(0, 0, 28, -Math.PI / 2, Math.PI * 0.8);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = block.color;
  for (const a of [-Math.PI / 2, Math.PI / 6, Math.PI * 0.8]) {
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 28, Math.sin(a) * 28, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 23px ${BRAND_FONT}`;
  const mark = typeof ctx.measureText === 'function'
    ? ctx.measureText('RF')
    : { actualBoundingBoxAscent: 16, actualBoundingBoxDescent: 0 };
  ctx.fillText('RF', 0, ((mark.actualBoundingBoxAscent ?? 16) - (mark.actualBoundingBoxDescent ?? 0)) / 2);
  ctx.restore();
}

function drawTechGrid(ctx: any, block: any, layout: any): void {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = block.color;
  ctx.lineWidth = 0.5;
  for (let gx = 48; gx <= layout.width - 48; gx += 32) {
    ctx.beginPath(); ctx.moveTo(gx, 48); ctx.lineTo(gx, layout.height - 48); ctx.stroke();
  }
  for (let gy = 48; gy <= layout.height - 48; gy += 32) {
    ctx.beginPath(); ctx.moveTo(48, gy); ctx.lineTo(layout.width - 48, gy); ctx.stroke();
  }
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = block.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, 48); ctx.lineTo(82, 48);
  ctx.moveTo(48, 48); ctx.lineTo(48, 82);
  ctx.stroke();
  ctx.restore();
}

function drawToCanvas(canvas: HTMLCanvasElement, model: any, preferences: any = {}): any {
  const probeCtx = canvas.getContext('2d');
  if (!probeCtx) throw new Error('Canvas is unavailable');
  const layout = buildLayout(probeCtx, model, preferences);
  const rawRes = preferences.resolution ?? model?.resolution ?? 'high';
  const requestedScale = RESOLUTION_SCALES[rawRes] || ([1, 2, 3].includes(Number(rawRes)) ? Number(rawRes) : 2);
  const renderScale = Math.min(requestedScale, Math.sqrt(MAX_PIXELS / (layout.width * layout.height)), MAX_PIXEL_HEIGHT / layout.height);

  canvas.width = Math.floor(layout.width * renderScale);
  canvas.height = Math.floor(layout.height * renderScale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  ctx.save();
  ctx.scale(renderScale, renderScale);

  if (layout.palette.gradient && typeof ctx.createLinearGradient === 'function') {
    const gradient = ctx.createLinearGradient(0, 0, layout.width, layout.height);
    layout.palette.gradient.forEach((color: string, i: number, colors: string[]) => gradient.addColorStop(i / (colors.length - 1), color));
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = layout.palette.background;
  }
  ctx.fillRect(0, 0, layout.width, layout.height);

  const sheetRadius = layout.appearance === 'minimal' ? 0 : 16;
  roundedRectPath(ctx, 16, 16, layout.width - 32, layout.height - 32, sheetRadius);
  if (layout.palette.paperGradient && typeof ctx.createLinearGradient === 'function') {
    const paperGradient = ctx.createLinearGradient(0, 16, layout.width, layout.height);
    layout.palette.paperGradient.forEach((color: string, i: number, colors: string[]) => paperGradient.addColorStop(i / (colors.length - 1), color));
    ctx.fillStyle = paperGradient;
  } else {
    ctx.fillStyle = layout.palette.paper;
  }
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.textBaseline = 'top';

  for (const block of layout.blocks) {
    ctx.fillStyle = block.color;
    ctx.strokeStyle = block.color;
    ctx.lineWidth = 1;
    if (block.kind === 'brand-seal') {
      drawBrandSeal(ctx, block);
    } else if (block.kind === 'grid') {
      drawTechGrid(ctx, block, layout);
    } else if (block.kind === 'text') {
      ctx.font = block.font;
      ctx.textAlign = block.align || 'left';
      ctx.fillText(block.text, block.x, block.y);
      ctx.textAlign = 'left';
    } else if (block.kind === 'line') {
      ctx.beginPath(); ctx.moveTo(block.x, block.y); ctx.lineTo(block.x2, block.y2); ctx.stroke();
    } else if (block.kind === 'rect') {
      roundedRectPath(ctx, block.x, block.y, block.width, block.height, block.radius || 0);
      ctx.fill();
    } else if (block.kind === 'node') {
      ctx.beginPath();
      if (block.square) ctx.rect(block.x - 5, block.y - 5, 10, 10);
      else ctx.arc(block.x, block.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = block.completed ? block.color : block.background;
      ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    }
  }
  ctx.restore();
  ctx.restore();

  return {
    layout: {
      ...layout,
      scale: renderScale,
      pixelWidth: canvas.width,
      pixelHeight: canvas.height,
      resolutionLimited: renderScale < requestedScale,
      omittedCount: layout.omitted
    },
    resolutionLimited: renderScale < requestedScale
  };
}

export function getShareCardLayout(cardInput: any, ctx: any = null): any {
  const data = cardInput?.events && cardInput?.visible ? cardInput : buildSubmissionShareCardData(cardInput);
  const layout = buildLayout(ctx, data);
  const requestedScale = RESOLUTION_SCALES[data.resolution] || ([1, 2, 3].includes(Number(data.resolution)) ? Number(data.resolution) : 2);
  const scale = Math.min(requestedScale, Math.sqrt(MAX_PIXELS / (layout.width * layout.height)), MAX_PIXEL_HEIGHT / layout.height);
  return {
    ...layout,
    scale,
    pixelWidth: Math.floor(layout.width * scale),
    pixelHeight: Math.floor(layout.height * scale),
    resolutionLimited: scale < requestedScale,
    omittedCount: layout.omitted
  };
}

export function renderSubmissionShareCard(canvas: HTMLCanvasElement, cardInput: any): any {
  const data = cardInput?.events && cardInput?.visible ? cardInput : buildSubmissionShareCardData(cardInput);
  const { layout } = drawToCanvas(canvas, data);
  return { ...data, ...layout };
}

export function render(model: any, preferences: any = {}): any {
  const canvas = document.createElement('canvas');
  const { layout, resolutionLimited } = drawToCanvas(canvas, model, preferences);
  return { canvas, layout, resolutionLimited };
}
