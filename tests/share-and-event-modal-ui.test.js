const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function loadCjsModule(relPath, extraGlobals = {}) {
  const result = buildSync({
    entryPoints: [path.join(ROOT, relPath)],
    bundle: true,
    format: 'cjs',
    write: false,
    platform: 'node'
  });
  const context = {
    module: { exports: {} },
    exports: {},
    console,
    Date,
    Math,
    Intl,
    Set,
    Map,
    JSON,
    structuredClone,
    ...extraGlobals
  };
  context.globalThis = context;
  vm.runInNewContext(result.outputFiles[0].text, context);
  return { exports: context.module.exports, context };
}

function makeFakeCanvasContext() {
  return {
    font: '14px sans-serif',
    measureText(str) {
      const size = Number((/(\d+(?:\.\d+)?)px/.exec(this.font) || [])[1] || 14);
      let width = 0;
      for (const ch of String(str || '')) {
        width += /[\u2e80-\u9fff]/.test(ch) ? size : size * 0.58;
      }
      return { width, actualBoundingBoxAscent: size * 0.8, actualBoundingBoxDescent: size * 0.2 };
    }
  };
}

test('editorial share card preserves 496px seal clearance, right alignment, stacked dates, square blueprint nodes, and zero rail overshoot', () => {
  const shareCardSrc = fs.readFileSync(path.join(ROOT, 'chrome/content/scripts/share-card.js'), 'utf8');
  const ctx = vm.createContext({ globalThis: {}, console, Math, Date, Intl, Set, Map, JSON });
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.runInContext(shareCardSrc, ctx);

  const api = ctx.RFShareCard;
  assert.ok(api && typeof api.buildLayout === 'function' && typeof api.getAppearances === 'function');
  const appearances = api.getAppearances();
  assert.equal(appearances.length, 13);
  assert.ok(appearances.find((a) => a.id === 'estuary' && Array.isArray(a.paperGradient)));
  assert.ok(appearances.find((a) => a.id === 'cyber' && a.mode === 'dark' && a.grid === true));

  const fakeCtx = makeFakeCanvasContext();
  const rawInput = {
    language: 'zh',
    appearance: 'amber',
    journal: 'Journal of the American Chemical Society',
    title: 'Vacancy-Directed Molecular Reconstruction Reverses Valley Polarization Across Twisted Bilayers',
    firstAuthor: 'Shikun Hou',
    statusLabel: '修改',
    durationDays: 63,
    events: [
      { name: 'Manuscript Submitted', type: 'submission', completeDate: '2026-09-08', status: 'completed' },
      { name: 'Review Comments R1', type: 'review', completeDate: '2026-10-20', status: 'completed' },
      { name: 'R1 Revision Submitted', type: 'revision', planDate: '2026-11-18', status: 'active' }
    ]
  };
  const sampleData = api.buildSubmissionShareCardData(rawInput);

  const layout = api.buildLayout(fakeCtx, sampleData, { appearance: 'amber', footer: true, dates: true });
  const mastheadTexts = layout.blocks.filter((b) => b.kind === 'text' && ['eyebrow', 'journal', 'title', 'author'].includes(b.role));
  assert.ok(mastheadTexts.length >= 4);
  for (const blk of mastheadTexts) {
    assert.ok(blk.x + blk.width <= 496, `masthead block ${blk.role} must clear brand column (${blk.x}+${blk.width} <= 496)`);
  }

  const timelineCount = layout.blocks.find((b) => b.role === 'timeline-count');
  const footerNote = layout.blocks.find((b) => b.role === 'footer-note');
  assert.equal(timelineCount.align, 'right');
  assert.equal(timelineCount.x, 672);
  assert.equal(footerNote.align, 'right');
  assert.equal(footerNote.x, 672);

  const eventDate = layout.blocks.find((b) => b.role === 'event-date');
  const eventYear = layout.blocks.find((b) => b.role === 'event-year');
  assert.ok(eventYear.y >= eventDate.y + eventDate.height, 'event year sits cleanly below wrapped date');

  const nodes = layout.blocks.filter((b) => b.kind === 'node');
  const rail = layout.blocks.find((b) => b.kind === 'line' && b.x === nodes[0].x && b.x2 === nodes[0].x);
  assert.equal(rail.y, nodes[0].y);
  assert.equal(rail.y2, nodes[nodes.length - 1].y);

  const bpLayout = api.getShareCardLayout({ ...rawInput, appearance: 'blueprint', theme: 'blueprint', resolution: 3 }, fakeCtx);
  assert.ok(bpLayout.blocks.filter((b) => b.kind === 'node').every((n) => n.square === true));
  assert.equal(bpLayout.scale, 3);
  assert.equal(typeof api.wrapTextLines, 'function');
});

test('Share Studio 9 modal markup renders 13 Aa preset tiles, single checkboxes, and no hardcoded UI leaks', () => {
  const dict = {
    shareJourneySubtitle: '仅本地生成', shareVisibilityHeading: '显示内容', shareVisibilityNote: '自动保存',
    shareAppearanceLabel: '卡片风格', shareBrowseStyles: '浏览风格',
    shareFieldTitle: '题目', shareFieldJournal: '期刊', shareFieldAuthor: '第一作者',
    shareFieldStatus: '当前状态', shareFieldDuration: '历程天数', shareFieldDates: '节点日期',
    shareFieldFooter: 'Zotero PaperFlow 品牌标识',
    shareThemeEstuaryName: '江湾', shareThemeEstuaryNote: '雾蓝青玉渐变',
    shareSizeLabel: '图片尺寸', shareSizePortrait: '竖版', shareSizeStory: '长图', shareSizeAuto: '自适应',
    shareResolutionLabel: '清晰度', shareResolutionStandard: '标清', shareResolutionHigh: '高清', shareResolutionUltra: '超清',
    shareTimelineStartLabel: '时间线起点', shareTimelineStartExperiment: '从首个记录节点开始', shareTimelineStartSubmission: '从投稿开始',
    shareBrandSizeLabel: '品牌视觉大小', shareBrandSizeCompact: '紧凑', shareBrandSizeBalanced: '均衡', shareBrandSizeBold: '醒目',
    shareResetDesign: '重置设计', shareResetDesignNote: '已隐藏信息保持隐藏',
    shareRendering: '正在生成分享图…', sharePreviewFailed: '生成失败', shareRetry: '重试',
    sharePreviewAlt: '分享图', shareToggleZoom: '放大预览', shareSavePng: '另存为 PNG…',
    shareCopyImage: '复制图片', shareSavePathHint: '提示', close: '关闭'
  };
  const { exports } = loadCjsModule('src/modules/share-studio/modal-template.ts', {
    escapeHTML: (s) => String(s ?? '').replace(/[<>&"]/g, ''),
    t: (k) => dict[k] || k,
    window: { RFShareCard: { getAppearances: () => [] } }
  });
  const html = exports.buildShareModal({
    appearance: 'estuary', theme: 'estuary', size: 'portrait', resolution: 'high',
    timelineStart: 'experiment', brandSize: 'balanced',
    visible: { title: true, journal: true, author: true, status: true, duration: true, dates: true, footer: true }
  });

  const tileMatches = html.match(/class="share-style-tile(?:\s+active)?"/g) || [];
  const sampleMatches = html.match(/class="share-style-sample"/g) || [];
  assert.equal(tileMatches.length, 13);
  assert.equal(sampleMatches.length, 13);
  assert.ok(!html.includes('share-visibility-mark'), 'visibility chips must not duplicate ✓ glyphs beside checkbox');
  assert.ok(html.includes('share-visibility-chip-wide'));
  assert.ok(html.includes('id="share-appearance"'));
  assert.ok(html.includes('name="share-timeline-start"'));
  assert.ok(html.includes('class="share-preview-actions"'));
  assert.ok(!html.includes('class="modal-footer share-preview-actions"'));
});

test('persistSharePreferences merges without overwriting live in-memory db.submissions', async () => {
  const liveDb = {
    version: 3,
    manuscripts: [{ id: 'm1', title: 'Live Paper' }, { id: 'm2', title: 'Second Paper' }],
    submissions: [
      { id: 'sub-1', manuscriptId: 'm1', journal: 'Nano Letters', timelineNodes: [{ id: 'n1', type: 'submission', completeDate: '2026-09-08' }] },
      { id: 'sub-2', manuscriptId: 'm2', journal: 'JACS', timelineNodes: [] }
    ],
    settings: { profile: { language: 'zh' } }
  };
  let savedPayload = null;
  const mockStorage = {
    async loadAll() { return { version: 3, manuscripts: [], submissions: [], settings: { profile: { language: 'en' } } }; },
    async saveAll(nextDb) { savedPayload = JSON.parse(JSON.stringify(nextDb)); return true; }
  };
  const win = { db: liveDb, storage: mockStorage };
  const { exports } = loadCjsModule('src/modules/share-studio/preferences-and-data.ts', {
    window: win, db: liveDb, currentLanguage: 'zh',
    t: (k) => k, tf: (k) => k, cleanString: (v) => String(v ?? '').trim(),
    showGlobalToast: () => {},
    getSubmissionJournalName: (s) => s.journal || '',
    getTimelineNodeDisplayName: (n) => n.name || ''
  });

  await exports.persistSharePreferences({ theme: 'amber', timelineStart: 'submission', resolution: 2, visible: { title: false } });
  assert.ok(savedPayload, 'saveAll must be called');
  assert.equal(savedPayload.submissions.length, 2, 'must preserve live submissions rather than stale loadAll snapshot');
  assert.equal(savedPayload.manuscripts.length, 2);
  assert.equal(savedPayload.settings.shareCard.appearance, 'amber');
  assert.equal(savedPayload.settings.shareCard.timelineStart, 'submission');
  assert.equal(savedPayload.settings.shareCard.resolution, 'high');
});

test('share-studio.css & event-editor.css enforce layout specificity, single chevron select, hidden guard, and status tokens', () => {
  const shareCss = fs.readFileSync(path.join(ROOT, 'chrome/content/styles/share-studio.css'), 'utf8');
  assert.match(shareCss, /#modal-body\.share-preview-card/);
  assert.match(shareCss, /#modal-body\.share-preview-card \.share-size-control select[\s\S]*background-color:\s*var\(--input-bg\)/);
  assert.match(shareCss, /#modal-body\.share-preview-card \.share-size-control select[\s\S]*background-repeat:\s*no-repeat/);
  assert.match(shareCss, /#modal-body \[hidden\][^{]*\{\s*display:\s*none !important;/);

  const eventCss = fs.readFileSync(path.join(ROOT, 'chrome/content/styles/event-editor.css'), 'utf8');
  assert.match(eventCss, /--event-color:\s*#059669/);
  assert.match(eventCss, /--event-color:\s*#d97706/);
  assert.match(eventCss, /#modal-body\.event-manager-modal-card/);

  const bootstrap = fs.readFileSync(path.join(ROOT, 'bootstrap.js'), 'utf8');
  assert.match(bootstrap, /startupcache-invalidate/);
});

test('Timeline Event Manager localizes node labels and wires add-event transition cleanly', () => {
  const i18nJs = fs.readFileSync(path.join(ROOT, 'chrome/content/scripts/modules/i18n.js'), 'utf8');
  const coreJs = fs.readFileSync(path.join(ROOT, 'chrome/content/scripts/core/research-core.js'), 'utf8');
  const tlJs = fs.readFileSync(path.join(ROOT, 'chrome/content/scripts/modules/timeline-engine.js'), 'utf8');

  const elements = new Map();
  let openedHtml = '';
  let closed = false;
  const fakeEditor = {
    hidden: true,
    classList: { toggle() {} },
    querySelector: () => null,
    scrollIntoView() {}
  };
  const fakeCard = {
    classList: { toggle() {} },
    querySelector: (sel) => (sel === '.inline-stage-editor' ? fakeEditor : null),
    querySelectorAll: () => []
  };
  const sub = {
    id: 'sub-1', manuscriptId: 'man-1', journal: 'Nano Letters', status: 'revision',
    timelineNodes: [
      { id: 'n1', name: 'Research Started', type: 'research', key: 'experiment_start', status: 'completed', completeDate: '2026-07-02' },
      { id: 'n2', name: 'Manuscript Submitted', type: 'submission', key: 'submit', status: 'completed', completeDate: '2026-09-08' }
    ]
  };
  const fakeDoc = {
    getElementById(id) { return elements.get(id) || null; },
    querySelector(sel) {
      if (sel.includes('.inline-stage-editor')) return { closest: () => fakeCard };
      return null;
    }
  };
  const ctx = vm.createContext({
    console, Date, Math, Set, Map, JSON,
    document: fakeDoc,
    currentLanguage: 'zh',
    escapeHTML: (s) => String(s ?? '').replace(/[<>&"]/g, ''),
    openModal(html) {
      openedHtml = html;
      elements.set('btn-modal-add-event', { addEventListener: (_, fn) => { elements.get('btn-modal-add-event')._click = fn; } });
      elements.set('modal-body', { classList: { add() {}, remove() {} }, querySelectorAll: () => [] });
    },
    closeModal() { closed = true; },
    registerModalCleanup() {},
    showGlobalToast() {},
    renderDashboard() {},
    renderKanban() {},
    renderSubmissions() {},
    getSubmissionJournalName: (s) => s.journal || '',
    db: { manuscripts: [{ id: 'man-1', title: 'Test Paper' }], submissions: [sub], settings: { profile: { language: 'zh' } } }
  });
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.runInContext(i18nJs, ctx);
  vm.runInContext(coreJs, ctx);
  vm.runInContext(tlJs, ctx);

  ctx.openTimelineEventManager('sub-1');
  assert.ok(openedHtml.includes('Nano Letters'));
  assert.ok(openedHtml.includes('id="btn-modal-add-event"'));
  assert.ok(openedHtml.includes('研究启动'), 'research node should be localized cleanly');
  assert.ok(openedHtml.includes('已投稿') || openedHtml.includes('手稿已投稿'), 'submission node should be localized cleanly');
  assert.ok(!openedHtml.includes('defaultResearchStarted') && !openedHtml.includes('defaultSubmitted'), 'must never leak i18n keys');
  assert.ok(openedHtml.includes('timeline-event-status-badge'));

  elements.get('btn-modal-add-event')._click();
  assert.equal(closed, true);
  assert.equal(fakeEditor.hidden, false);
});
