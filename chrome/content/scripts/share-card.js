/**
 * ----------------------------------------------------------------------------------
 * ⚡ AUTO-GENERATED BUNDLE BY ESBUILD - DO NOT EDIT DIRECTLY
 * ----------------------------------------------------------------------------------
 * Source authority: `src/` TypeScript modules (100% strictly <= 360 lines).
 * Target runtime: Gecko 153+ / Firefox 140+ (minify: false for Error Console audit)
 * ----------------------------------------------------------------------------------
 */
"use strict";
(() => {
  // src/modules/share-card/constants-and-data.ts
  var CARD_WIDTH = 720;
  var BASE_HEIGHT = 900;
  var STORY_MIN_HEIGHT = 1280;
  var MAX_HEIGHT = 1e4;
  var MAX_PIXEL_HEIGHT = 16384;
  var MAX_PIXELS = 24e6;
  var RESOLUTION_SCALES = { standard: 1, high: 2, ultra: 3 };
  var BRAND_SIZES = /* @__PURE__ */ new Set(["compact", "balanced", "bold"]);
  var VISIBLE_FIELDS = ["title", "journal", "author", "status", "duration", "dates", "footer"];
  var DEFAULT_VISIBLE = Object.fromEntries(VISIBLE_FIELDS.map((field) => [field, true]));
  var SIZE_PREFS = /* @__PURE__ */ new Set(["portrait", "story", "auto"]);
  var THEMES = {
    estuary: { id: "estuary", mode: "light", background: "#b3cfd5", paper: "#e4f2ef", ink: "#153d4a", muted: "#456773", line: "#9fbdc4", accent: "#186d7c", wash: "#d4e8ea", gradient: ["#8fb6cc", "#b3d2c5"], paperGradient: ["#cee0f5", "#e4f2ef", "#b8dccc"] },
    iris: { id: "iris", mode: "light", background: "#b7b3d2", paper: "#eee5ef", ink: "#323354", muted: "#62617a", line: "#bdb2cf", accent: "#665397", wash: "#e0daec", gradient: ["#aab8d4", "#d3b5c7"], paperGradient: ["#cfdcf5", "#eee5ef", "#dec0d0"] },
    amber: { id: "amber", mode: "light", background: "#d6baaa", paper: "#f8ecdc", ink: "#49352e", muted: "#786055", line: "#ccb6a2", accent: "#92512c", wash: "#efdfc9", gradient: ["#d8b298", "#b4c4b0"], paperGradient: ["#efd0b5", "#f8ecdc", "#ceddcb"] },
    journal: { id: "journal", mode: "light", background: "#dce5ed", paper: "#fafbfc", ink: "#18344c", muted: "#536779", line: "#cbd7e0", accent: "#27628e", wash: "#e9f0f6", gradient: ["#cbddea", "#ebe7f1"], paperGradient: ["#ffffff", "#edf3f8"] },
    conference: { id: "conference", mode: "light", background: "#103e48", paper: "#f4fbfa", ink: "#133d44", muted: "#486e71", line: "#b9d7d6", accent: "#087c82", wash: "#dceeed", gradient: ["#174659", "#23786c"], paperGradient: ["#ffffff", "#e0f2ee"] },
    archive: { id: "archive", mode: "light", background: "#ddd6c8", paper: "#fffaf0", ink: "#383c34", muted: "#666c5e", line: "#d6d6c5", accent: "#607046", wash: "#efefe1", gradient: ["#e7dfcf", "#cbd7c8"], paperGradient: ["#fffdf6", "#f0f0e3"] },
    paper: { id: "paper", mode: "light", background: "#e9efed", paper: "#ffffff", ink: "#193039", muted: "#60767c", line: "#dce6e2", accent: "#167660", wash: "#f0f6f3" },
    ink: { id: "ink", mode: "dark", background: "#07131b", paper: "#10232d", ink: "#eef6f2", muted: "#a0b7bd", line: "#304951", accent: "#8bd8bc", wash: "#192f39" },
    blueprint: { id: "blueprint", mode: "light", background: "#e5edf8", paper: "#f9fbff", ink: "#183b63", muted: "#556f8e", line: "#cad8e9", accent: "#235fbc", wash: "#edf3fb" },
    minimal: { id: "minimal", mode: "light", background: "#ffffff", paper: "#ffffff", ink: "#222222", muted: "#666666", line: "#e3e3e3", accent: "#292929", wash: "#f6f6f6" },
    cyber: { id: "cyber", mode: "dark", background: "#050b17", paper: "#0b1426", ink: "#e9f7ff", muted: "#8ca6bf", line: "#27415e", accent: "#4de8ff", accent2: "#b26cff", wash: "#10233a", gradient: ["#071329", "#120a25"], paperGradient: ["#0d1a31", "#0a1223"], grid: true },
    aurora: { id: "aurora", mode: "dark", background: "#071421", paper: "#0e2030", ink: "#e6fff7", muted: "#86b8af", line: "#28574f", accent: "#63f5c7", accent2: "#8b7cff", wash: "#11382f", gradient: ["#071b2a", "#1c1030"], paperGradient: ["#102a38", "#0c1c2b"], grid: true },
    terminal: { id: "terminal", mode: "dark", background: "#06110b", paper: "#0a1d12", ink: "#d9ffe4", muted: "#79ad8a", line: "#245337", accent: "#8dff6a", accent2: "#e2ff58", wash: "#102b1a", gradient: ["#07180d", "#101b08"], paperGradient: ["#0d2517", "#09190f"], grid: true }
  };
  function getAppearances() {
    return Object.values(THEMES).map((palette) => ({ ...palette }));
  }
  function clean(value, maxLength = 240) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  }
  function normalizeDate(value) {
    const raw = clean(value, 40);
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  }
  function formatMilestoneDateParts(value, language = "en") {
    const dateText = normalizeDate(value);
    if (!dateText) return { dateLabel: "", yearLabel: "" };
    const [year, month, day] = dateText.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));
    const dateLabel = language === "zh" ? new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", timeZone: "UTC" }).format(parsed) : new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }).format(parsed);
    return { dateLabel, yearLabel: String(year) };
  }
  function normalizeVisibleFields(visible = {}) {
    const result = { ...DEFAULT_VISIBLE };
    if (visible && typeof visible === "object") {
      VISIBLE_FIELDS.forEach((field) => {
        if (field in visible) result[field] = Boolean(visible[field]);
      });
    }
    return result;
  }
  function normalizeTimelineStart(value) {
    return clean(value, 30).toLowerCase() === "submission" ? "submission" : "experiment";
  }
  function isPreSubmissionEvent(event = {}) {
    const type = clean(event.type, 40).toLowerCase();
    const key = clean(event.key, 40).toLowerCase();
    const name = clean(event.name || event.rawName, 120).toLowerCase();
    return type === "research" || type === "writing" || key === "experiment_start" || key === "experiment_done" || key === "draft_done" || /experiment|research|draft|data organization|实验|研究|初稿|数据整理/.test(name);
  }
  function normalizeBrandSize(value) {
    const size = clean(value || "balanced", 20).toLowerCase();
    return BRAND_SIZES.has(size) ? size : "balanced";
  }
  function normalizeResolution(value) {
    if (value === 1 || value === "1") return "standard";
    if (value === 2 || value === "2") return "high";
    if (value === 3 || value === "3") return "ultra";
    const resolution = clean(value || "high", 20).toLowerCase();
    return resolution in RESOLUTION_SCALES ? resolution : "high";
  }
  function normalizeAppearance(value) {
    const key = clean(value || "estuary", 30).toLowerCase();
    return THEMES[key] ? key : "estuary";
  }
  var TYPE_LABELS_ZH = {
    research: "研究",
    writing: "写作",
    submission: "投稿",
    review: "审稿",
    revision: "修回",
    rejection: "拒稿",
    publication: "出版",
    special: "节点"
  };
  var TYPE_LABELS_EN = {
    research: "Research",
    writing: "Writing",
    submission: "Submission",
    review: "Review",
    revision: "Revision",
    rejection: "Decision",
    publication: "Publication",
    special: "Milestone"
  };
  function buildSubmissionShareCardData(input = {}) {
    const language = input.language === "zh" ? "zh" : "en";
    const zh = language === "zh";
    const visible = normalizeVisibleFields(input.visible);
    const appearance = normalizeAppearance(input.appearance || input.theme);
    const size = SIZE_PREFS.has(input.size) ? input.size : "portrait";
    const timelineStart = normalizeTimelineStart(input.timelineStart);
    const brandSize = normalizeBrandSize(input.brandSize);
    const resolution = normalizeResolution(input.resolution);
    const typeMap = zh ? TYPE_LABELS_ZH : TYPE_LABELS_EN;
    const rawEvents = (Array.isArray(input.events) ? input.events : []).map((event, index) => {
      const dateStr = normalizeDate(event.date || event.completeDate || event.dueDate || event.planDate);
      const { dateLabel, yearLabel } = formatMilestoneDateParts(dateStr, language);
      const completed = typeof event.completed === "boolean" ? event.completed : Boolean(event.completeDate || event.status === "completed");
      const due = typeof event.due === "boolean" ? event.due : !completed && !event.planDate && Boolean(event.dueDate);
      const typeKey = clean(event.type || "special", 30).toLowerCase();
      return {
        index,
        key: clean(event.key, 40),
        type: typeKey,
        rawName: clean(event.rawName || event.name, 120),
        name: clean(event.label || event.name, 90) || (zh ? "时间节点" : "Milestone"),
        date: dateStr,
        completed,
        due,
        typeLabel: clean(event.typeLabel, 30) || typeMap[typeKey] || typeMap.special,
        dateKindLabel: clean(event.dateKindLabel, 30) || (completed ? zh ? "已记录" : "Recorded" : due ? zh ? "截止日期" : "Due date" : zh ? "计划日期" : "Planned"),
        dateLabel,
        yearLabel
      };
    }).filter((event) => Boolean(event.date)).filter((event) => timelineStart !== "submission" || !isPreSubmissionEvent(event)).sort((a, b) => a.date.localeCompare(b.date) || a.index - b.index);
    const rawDuration = input.durationDays ?? input.duration;
    const duration = Number.isFinite(Number(rawDuration)) && Number(rawDuration) >= 0 ? Math.round(Number(rawDuration)) : null;
    const durationCaption = clean(input.durationLabel, 80) || (timelineStart === "submission" ? zh ? "从投稿至今天" : "From submission to today" : zh ? "从首个记录节点至今天" : "From first recorded milestone to today");
    return {
      language,
      theme: appearance,
      appearance,
      size,
      timelineStart,
      brandSize,
      resolution,
      visible,
      title: clean(input.title, 260) || (zh ? "未命名手稿" : "Untitled Manuscript"),
      journal: clean(input.journal, 120) || (zh ? "目标期刊" : "Target Journal"),
      author: clean(input.firstAuthor ?? input.author, 90),
      status: clean(input.statusLabel || input.status, 60) || (zh ? "已投稿" : "Submitted"),
      duration,
      durationLabel: durationCaption,
      events: rawEvents
    };
  }

  // src/modules/share-card/layout-builder.ts
  var FONT = '"Microsoft YaHei UI", "PingFang SC", "Segoe UI", sans-serif';
  var DISPLAY = 'Georgia, "Songti SC", "Microsoft YaHei", serif';
  var BRAND_FONT = '"Segoe UI", "Microsoft YaHei UI", "PingFang SC", sans-serif';
  var segmenter = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function" ? new Intl.Segmenter(void 0, { granularity: "grapheme" }) : null;
  var glyphs = (text) => segmenter ? Array.from(segmenter.segment(text), (item) => item.segment) : Array.from(text);
  function fallbackMeasure(ctx, value) {
    if (typeof ctx?.measureText === "function") return ctx.measureText(value).width;
    return String(value || "").length * 14;
  }
  function wrapText(ctx, value, width, maxLines = Infinity) {
    const input = clean(value, 280);
    if (!input) return [];
    const lines = [];
    let line = "";
    const tokens = input.match(/[^\s\u2e80-\u9fff]+\s*|[\u2e80-\u9fff]\s*/gu) || [input];
    for (const token of tokens) {
      if (fallbackMeasure(ctx, (line + token).trimEnd()) <= width) {
        line += token;
        continue;
      }
      if (line.trim()) {
        lines.push(line.trim());
        line = "";
      }
      if (fallbackMeasure(ctx, token.trim()) <= width) {
        line = token.trimStart();
        continue;
      }
      for (const glyph of glyphs(token.trim())) {
        if (line && fallbackMeasure(ctx, line + glyph) > width) {
          lines.push(line);
          line = "";
        }
        line += glyph;
      }
    }
    if (line.trim()) lines.push(line.trim());
    if (lines.length <= maxLines) return lines;
    const result = lines.slice(0, maxLines);
    const last = glyphs(result[result.length - 1]);
    while (last.length && fallbackMeasure(ctx, `${last.join("")}…`) > width) last.pop();
    result[result.length - 1] = `${last.join("").trimEnd()}…`;
    return result;
  }
  var wrapTextLines = wrapText;
  function buildLayout(ctx, model, preferences = {}) {
    const modelVisible = model?.visible && typeof model.visible === "object" ? model.visible : {};
    const v = {
      title: true,
      journal: true,
      author: true,
      status: true,
      duration: true,
      dates: true,
      footer: true,
      ...modelVisible,
      ...preferences
    };
    v.appearance = preferences.appearance ?? preferences.theme ?? model?.appearance ?? model?.theme ?? "estuary";
    v.size = preferences.size ?? model?.size ?? "portrait";
    v.brandSize = preferences.brandSize ?? model?.brandSize ?? "balanced";
    const palette = THEMES[v.appearance] || THEMES.paper;
    const zh = model?.language === "zh";
    const minimal = ["minimal", "journal", "conference"].includes(v.appearance);
    const blueprint = ["blueprint", "conference", "archive"].includes(v.appearance);
    const cover = v.appearance === "journal";
    const archive = v.appearance === "archive";
    const tech = ["cyber", "aurora", "terminal"].includes(v.appearance);
    const width = CARD_WIDTH;
    const brandMap = {
      compact: { scale: 0.84, name: 13, motto: 9.5 },
      balanced: { scale: 1.06, name: 15, motto: 10.5 },
      bold: { scale: 1.26, name: 17, motto: 11.5 }
    };
    const brand = brandMap[v.brandSize] || brandMap.balanced;
    const left = 48;
    const right = 672;
    const blocks = [];
    let masthead = true;
    if (cover) blocks.push({ kind: "rect", x: 16, y: 16, width: 688, height: 12, color: palette.accent });
    if (v.appearance === "conference") blocks.push({ kind: "rect", x: 24, y: 40, width: 6, height: 190, color: palette.accent });
    if (tech) blocks.push({ kind: "grid", color: palette.line, accent: palette.accent2 || palette.accent });
    const text = (role, value, x, y2, maxWidth, size, weight = 400, color = palette.ink, maxLines = 1, display = false, align = "left") => {
      const resolvedWidth = v.footer && masthead ? Math.min(maxWidth, 496 - x) : maxWidth;
      const font = `${weight} ${size}px ${display ? DISPLAY : FONT}`;
      if (ctx) ctx.font = font;
      const lines = wrapText(ctx, value, resolvedWidth, maxLines);
      const lineHeight = Math.ceil(size * 1.36);
      lines.forEach((line, index) => {
        blocks.push({ kind: "text", role, text: line, x, y: y2 + index * lineHeight, width: resolvedWidth, height: lineHeight, font, color, align });
      });
      return lines.length * lineHeight;
    };
    const rule = (y2) => blocks.push({ kind: "line", x: left, y: y2, x2: right, y2, color: palette.line });
    if (v.footer) {
      const center = 592;
      blocks.push({ kind: "brand-seal", role: "brand-seal", x: center, y: 86, scale: brand.scale, color: palette.accent, secondary: palette.accent2 || palette.muted });
      const brandText = (role, value, top, size, weight, color) => {
        let currentSize = size;
        let font = `${weight} ${currentSize}px ${BRAND_FONT}`;
        if (ctx) ctx.font = font;
        while (fallbackMeasure(ctx, value) > 144 && currentSize > 7) {
          currentSize -= 0.25;
          font = `${weight} ${currentSize}px ${BRAND_FONT}`;
          if (ctx) ctx.font = font;
        }
        const w = fallbackMeasure(ctx, value);
        blocks.push({ kind: "text", role, text: value, x: center - w / 2, y: top, width: w, height: Math.ceil(currentSize * 1.4), font, color, align: "left" });
      };
      const wordmarkY = 86 + 36 * brand.scale + 10;
      brandText("brand-wordmark", "Zotero PaperFlow", wordmarkY, brand.name, 600, palette.ink);
      brandText("brand-motto", zh ? "探索 · 求证 · 记录" : "Explore · Verify · Record", wordmarkY + Math.ceil(brand.name * 1.4) + 5, zh ? brand.motto : brand.motto - 0.5, 400, palette.muted);
    }
    const allEvents = Array.isArray(model?.events) ? model.events : [];
    const events = allEvents.length > 64 ? [allEvents[0], ...allEvents.slice(-63)] : allEvents;
    const omitted = allEvents.length - events.length;
    let y = 48;
    blocks.push({ kind: "rect", x: left, y: y + 2, width: 28, height: 4, color: palette.accent });
    text("eyebrow", zh ? "科研手记 / 投稿历程" : "FIELD NOTES / SUBMISSION JOURNEY", left + 40, y - 5, 580, 13, 600, palette.muted);
    y += 47;
    if (minimal && v.title && model?.title) {
      y += text("title", model.title, left, y, 624, cover ? 36 : 32, cover ? 400 : 600, palette.ink, 6, cover && !zh) + 24;
    }
    if (v.journal && model?.journal) {
      const latinJournal = !/[\u2e80-\u9fff]/u.test(model.journal);
      const shortJournal = glyphs(String(model.journal).trim()).length <= 18;
      const journalSize = minimal && v.title && model?.title ? 28 : shortJournal ? 48 : 34;
      blocks.push({ kind: "rect", role: "journal-mark", x: left, y: y + 2, width: 3, height: 12, color: palette.accent });
      text("journal-label", zh ? "投稿期刊" : "THE JOURNAL", left + 12, y, 600, 10, 600, palette.muted);
      y += 22;
      y += text("journal", model.journal, left, y, 624, journalSize, latinJournal ? 400 : 600, palette.ink, 3, latinJournal && !tech) + 10;
      blocks.push({ kind: "rect", role: "journal-underline", x: left, y, width: shortJournal ? 64 : 96, height: 2, color: palette.accent });
      y += 20;
    }
    if (!minimal && v.title && model?.title) {
      y += text("title", model.title, left, y, 624, 27, 600, palette.ink, 6) + 20;
    }
    if (v.author && model?.author) {
      y += text("author", `${zh ? "第一作者" : "First author"}  /  ${model.author}`, left, y, 624, 15, 400, palette.muted, 2) + 16;
    }
    const brandBlocks = blocks.filter((b) => ["brand-seal", "brand-wordmark", "brand-motto"].includes(b.role));
    const brandTop = 86 - 36 * brand.scale;
    const brandBottom = v.footer && brandBlocks.length ? brandBlocks[brandBlocks.length - 1].y + brandBlocks[brandBlocks.length - 1].height : 0;
    const brandHeight = brandBottom - brandTop;
    const headerBottom = Math.max(y + 8, v.footer ? 72 + brandHeight + 24 : 0);
    if (v.footer && brandBlocks.length) {
      const headline = blocks.find((b) => b.role === "journal" || b.role === "title");
      const target = headline ? headline.y + headline.height / 2 - 8 : 132;
      const top = Math.max(72, Math.min(target - brandHeight / 2, 112, headerBottom - 24 - brandHeight));
      brandBlocks.forEach((b) => {
        b.y += top - brandTop;
      });
    }
    masthead = false;
    rule(headerBottom);
    y = headerBottom + 26;
    if (v.duration || v.status) {
      const both = Boolean(v.duration && v.status);
      const columnWidth = both ? 294 : 624;
      let metricHeight = 0;
      const metricBackground = blueprint ? { kind: "rect", x: left - 16, y: y - 12, width: 656, height: 156, color: palette.wash, radius: 8 } : null;
      if (metricBackground) blocks.push(metricBackground);
      if (v.duration) {
        text("duration-label", zh ? "历程天数" : "DAYS IN THIS JOURNEY", left, y, columnWidth, 12, 600, palette.muted);
        const valid = Number.isFinite(model?.duration) && model.duration >= 0;
        const number = valid ? String(model.duration) : "—";
        text("duration", number, left - 2, y + 22, columnWidth - 50, 60, 400, palette.accent, 1, true);
        if (ctx) ctx.font = `400 60px ${DISPLAY}`;
        if (valid) {
          const unitX = Math.min(left + fallbackMeasure(ctx, number) + 12, left + columnWidth - 48);
          text("duration-unit", zh ? "天" : "days", unitX, y + 63, 48, 14, 500, palette.muted);
        }
        metricHeight = 108 + text("duration-caption", model?.durationLabel || "", left, y + 108, columnWidth, 13, 400, palette.muted, 2);
      }
      if (v.status) {
        const x = both ? 378 : left;
        if (both) blocks.push({ kind: "line", x: 350, y: y + 2, x2: 350, y2: y + 122, color: palette.line });
        text("status-label", zh ? "当前进展" : "CURRENT CHAPTER", x, y, columnWidth, 12, 600, palette.muted);
        const statusHeight = text("status", model?.status || "—", x, y + 37, columnWidth, 26, 600, palette.ink, 2);
        metricHeight = Math.max(metricHeight, 37 + statusHeight + 24);
      }
      if (metricBackground) metricBackground.height = metricHeight + 26;
      y += metricHeight + 26;
      rule(y);
      y += 32;
    }
    text("timeline-label", zh ? "一步一步，记录科研历程" : "The journey, step by step.", left, y, 456, 21, 600, palette.ink);
    text("timeline-count", `${events.length} ${zh ? "个节点" : "milestones"}`, right, y + 5, 148, 13, 500, palette.muted, 1, false, "right");
    y += 52;
    const timelineStart = y;
    if (!events.length) {
      blocks.push({ kind: "rect", x: left, y, width: 624, height: 108, color: palette.wash, radius: 12 });
      text("empty", zh ? "故事刚刚开始" : "Every journey begins somewhere.", left + 24, y + 22, 576, 21, 600, palette.ink);
      text("empty-help", zh ? "添加带日期的节点后，即可生成时间线。" : "Add a dated milestone to begin your timeline.", left + 24, y + 62, 576, 15, 400, palette.muted);
      y += 128;
    }
    const railX = v.dates ? 186 : 62;
    const contentX = railX + 30;
    const rowCenters = [];
    events.forEach((event, index) => {
      const rowBg = archive ? { kind: "rect", x: left - 12, y: y - 8, width: 648, height: 76, color: index % 2 === 0 ? palette.wash : palette.paper, radius: 4 } : null;
      if (rowBg) blocks.push(rowBg);
      if (omitted && index === 1) {
        text("omitted", zh ? `另有 ${omitted} 个节点未展示` : `${omitted} earlier milestones not shown`, contentX, y, right - contentX, 13, 500, palette.muted, 2);
        y += 48;
      }
      const nameHeight = text("event-name", event.name || (zh ? "未命名节点" : "Untitled milestone"), contentX, y, right - contentX, minimal ? 18 : 20, 600, palette.ink, 2);
      const meta = [event.typeLabel, event.dateKindLabel].filter(Boolean).join(" · ");
      const metaHeight = text("event-meta", meta, contentX, y + nameHeight + 6, right - contentX, 12, 500, palette.muted, 2);
      let dateHeight = 0;
      if (v.dates) {
        dateHeight = text("event-date", event.dateLabel || "—", left, y + 1, 122, 17, 600, palette.ink, 2);
        text("event-year", event.yearLabel || "", left, y + dateHeight + 4, 122, 12, 400, palette.muted);
      }
      const rowHeight = Math.max(minimal ? 64 : 76, nameHeight + metaHeight + (minimal ? 20 : 28), v.dates ? dateHeight + 36 : 0);
      if (rowBg) rowBg.height = rowHeight - 8;
      rowCenters.push(y + 12);
      blocks.push({ kind: "node", x: railX, y: y + 12, completed: Boolean(event.completed), square: blueprint, color: palette.accent, background: palette.paper });
      y += rowHeight;
    });
    if (rowCenters.length > 1) {
      blocks.unshift({ kind: "line", x: railX, y: rowCenters[0], x2: railX, y2: rowCenters[rowCenters.length - 1], color: palette.line });
    }
    const timelineBottom = y;
    let height = Math.ceil(y + (v.footer ? 90 : 40));
    const minHeight = v.size === "story" ? STORY_MIN_HEIGHT : v.size === "auto" ? 0 : BASE_HEIGHT;
    height = Math.min(MAX_HEIGHT, Math.max(minHeight, height));
    if (v.footer) {
      rule(height - 84);
      text("footer-brand", "ZOTERO PAPERFLOW", left, height - 61, 260, 13, 700, palette.ink);
      text("footer-note", zh ? "每一步，都值得记录。" : "Every step is worth recording.", right, height - 61, 317, 13, 400, palette.muted, 1, false, "right");
    }
    return { width, height, palette, appearance: v.appearance, blocks, headerBottom, timelineStart, timelineBottom, omitted, eventCount: events.length };
  }

  // src/modules/share-card/canvas-renderer.ts
  function roundedRectPath(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === "function") {
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
  function drawBrandSeal(ctx, block) {
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
      const a = i * Math.PI / 6;
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
    ctx.clip("evenodd");
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
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 23px ${BRAND_FONT}`;
    const mark = typeof ctx.measureText === "function" ? ctx.measureText("RF") : { actualBoundingBoxAscent: 16, actualBoundingBoxDescent: 0 };
    ctx.fillText("RF", 0, ((mark.actualBoundingBoxAscent ?? 16) - (mark.actualBoundingBoxDescent ?? 0)) / 2);
    ctx.restore();
  }
  function drawTechGrid(ctx, block, layout) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = block.color;
    ctx.lineWidth = 0.5;
    for (let gx = 48; gx <= layout.width - 48; gx += 32) {
      ctx.beginPath();
      ctx.moveTo(gx, 48);
      ctx.lineTo(gx, layout.height - 48);
      ctx.stroke();
    }
    for (let gy = 48; gy <= layout.height - 48; gy += 32) {
      ctx.beginPath();
      ctx.moveTo(48, gy);
      ctx.lineTo(layout.width - 48, gy);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = block.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 48);
    ctx.lineTo(82, 48);
    ctx.moveTo(48, 48);
    ctx.lineTo(48, 82);
    ctx.stroke();
    ctx.restore();
  }
  function drawToCanvas(canvas, model, preferences = {}) {
    const probeCtx = canvas.getContext("2d");
    if (!probeCtx) throw new Error("Canvas is unavailable");
    const layout = buildLayout(probeCtx, model, preferences);
    const rawRes = preferences.resolution ?? model?.resolution ?? "high";
    const requestedScale = RESOLUTION_SCALES[rawRes] || ([1, 2, 3].includes(Number(rawRes)) ? Number(rawRes) : 2);
    const renderScale = Math.min(requestedScale, Math.sqrt(MAX_PIXELS / (layout.width * layout.height)), MAX_PIXEL_HEIGHT / layout.height);
    canvas.width = Math.floor(layout.width * renderScale);
    canvas.height = Math.floor(layout.height * renderScale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable");
    ctx.save();
    ctx.scale(renderScale, renderScale);
    if (layout.palette.gradient && typeof ctx.createLinearGradient === "function") {
      const gradient = ctx.createLinearGradient(0, 0, layout.width, layout.height);
      layout.palette.gradient.forEach((color, i, colors) => gradient.addColorStop(i / (colors.length - 1), color));
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = layout.palette.background;
    }
    ctx.fillRect(0, 0, layout.width, layout.height);
    const sheetRadius = layout.appearance === "minimal" ? 0 : 16;
    roundedRectPath(ctx, 16, 16, layout.width - 32, layout.height - 32, sheetRadius);
    if (layout.palette.paperGradient && typeof ctx.createLinearGradient === "function") {
      const paperGradient = ctx.createLinearGradient(0, 16, layout.width, layout.height);
      layout.palette.paperGradient.forEach((color, i, colors) => paperGradient.addColorStop(i / (colors.length - 1), color));
      ctx.fillStyle = paperGradient;
    } else {
      ctx.fillStyle = layout.palette.paper;
    }
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.textBaseline = "top";
    for (const block of layout.blocks) {
      ctx.fillStyle = block.color;
      ctx.strokeStyle = block.color;
      ctx.lineWidth = 1;
      if (block.kind === "brand-seal") {
        drawBrandSeal(ctx, block);
      } else if (block.kind === "grid") {
        drawTechGrid(ctx, block, layout);
      } else if (block.kind === "text") {
        ctx.font = block.font;
        ctx.textAlign = block.align || "left";
        ctx.fillText(block.text, block.x, block.y);
        ctx.textAlign = "left";
      } else if (block.kind === "line") {
        ctx.beginPath();
        ctx.moveTo(block.x, block.y);
        ctx.lineTo(block.x2, block.y2);
        ctx.stroke();
      } else if (block.kind === "rect") {
        roundedRectPath(ctx, block.x, block.y, block.width, block.height, block.radius || 0);
        ctx.fill();
      } else if (block.kind === "node") {
        ctx.beginPath();
        if (block.square) ctx.rect(block.x - 5, block.y - 5, 10, 10);
        else ctx.arc(block.x, block.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = block.completed ? block.color : block.background;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
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
  function getShareCardLayout(cardInput, ctx = null) {
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
  function renderSubmissionShareCard(canvas, cardInput) {
    const data = cardInput?.events && cardInput?.visible ? cardInput : buildSubmissionShareCardData(cardInput);
    const { layout } = drawToCanvas(canvas, data);
    return { ...data, ...layout };
  }
  function render(model, preferences = {}) {
    const canvas = document.createElement("canvas");
    const { layout, resolutionLimited } = drawToCanvas(canvas, model, preferences);
    return { canvas, layout, resolutionLimited };
  }

  // src/modules/share-card.ts
  var RFShareCard = {
    CARD_WIDTH,
    BASE_HEIGHT,
    STORY_MIN_HEIGHT,
    MAX_HEIGHT,
    MAX_PIXEL_HEIGHT,
    RESOLUTION_SCALES,
    BRAND_SIZES: Array.from(BRAND_SIZES),
    THEMES: Object.keys(THEMES),
    VISIBLE_FIELDS,
    getAppearances,
    buildSubmissionShareCardData,
    wrapText,
    wrapTextLines,
    buildLayout,
    getShareCardLayout,
    render,
    renderSubmissionShareCard
  };
  if (typeof globalThis !== "undefined") {
    globalThis.RFShareCard = RFShareCard;
  }
  if (typeof window !== "undefined") {
    window.RFShareCard = RFShareCard;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = RFShareCard;
  }
})();
