const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const timelineSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/timeline-engine.js'), 'utf8');
const submissionsSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/submissions-view.js'), 'utf8');

function setupTestSandbox() {
  const elements = new Map();
  function getOrCreateElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        children: [],
        childNodes: [],
        classList: {
          _set: new Set(),
          add(c) { this._set.add(c); },
          remove(c) { this._set.delete(c); },
          contains(c) { return this._set.has(c); },
          toggle(c, v) { if (v === undefined) v = !this._set.has(c); if (v) this._set.add(c); else this._set.delete(c); return v; }
        },
        setAttribute(k, v) { this[k] = String(v); },
        getAttribute(k) { return this[k] || null; },
        removeAttribute(k) { delete this[k]; },
        style: {},
        dataset: {},
        addEventListener() {},
        removeEventListener() {},
        appendChild(child) { this.children.push(child); return child; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        closest() { return null; },
        textContent: '',
        innerHTML: ''
      });
    }
    return elements.get(id);
  }

  const mockDoc = {
    getElementById: (id) => getOrCreateElement(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => getOrCreateElement('el-' + tag + '-' + Math.random()),
    createDocumentFragment: () => getOrCreateElement('frag-' + Math.random()),
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const sandbox = {
    console,
    Date,
    Math,
    Array,
    Object,
    Boolean,
    String,
    Number,
    Set,
    Map,
    RegExp,
    currentLanguage: 'zh',
    t: (key) => key,
    tf: (key, params) => JSON.stringify({ key, params }),
    db: { manuscripts: [], submissions: [] },
    todayString: () => '2026-11-02',
    escapeHTML: (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    getSubmissionJournalName: (sub) => sub.targetJournal || 'Nature Materials',
    getSubmissionFirstAuthor: (sub, man) => man?.firstAuthor || sub.firstAuthor || 'Jane Doe',
    normalizeSubmissionStatus: (s) => s || 'submitted',
    normalizeSubmissionTimeline: () => false,
    sortDashboardSubmissions: (subs) => subs,
    RFUI: {
      setHTML: (el, html) => { if (el) el.innerHTML = html; },
      getSubmissionStatusBadgeClass: () => 'badge-info',
      buildSubmissionRelationshipSummary: () => ({})
    },
    document: mockDoc,
    window: null
  };
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox);
  vm.runInContext(timelineSource, context);
  vm.runInContext(submissionsSource, context);
  return sandbox;
}

test('getRevisionCountdownMeta computes correct levels, icons, and badges', () => {
  const sandbox = setupTestSandbox();
  const getMeta = sandbox.RFCalendar.getRevisionCountdownMeta;

  assert.equal(getMeta(null), null);
  assert.equal(getMeta('invalid-date'), null);

  const now = new Date();
  const fmt = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Overdue: 3 days ago
  const pastDate = new Date(now.getTime() - 3 * 86400000);
  const overdueMeta = getMeta(fmt(pastDate));
  assert.equal(overdueMeta.level, 'overdue');
  assert.equal(overdueMeta.badgeClass, 'badge-danger');
  assert.ok(overdueMeta.icon.includes('🚨'));
  assert.ok(overdueMeta.text.includes('逾期') || overdueMeta.text.includes('overdue'));

  // Due today
  const todayMeta = getMeta(fmt(now));
  assert.equal(todayMeta.level, 'due_today');
  assert.equal(todayMeta.badgeClass, 'badge-danger');
  assert.ok(todayMeta.icon.includes('🚨'));

  // Due soon: 4 days from now
  const soonDate = new Date(now.getTime() + 4 * 86400000);
  const soonMeta = getMeta(fmt(soonDate));
  assert.equal(soonMeta.level, 'due_soon');
  assert.equal(soonMeta.badgeClass, 'badge-warning');
  assert.ok(soonMeta.icon.includes('⚠️'));

  // Upcoming: 20 days from now
  const futureDate = new Date(now.getTime() + 20 * 86400000);
  const futureMeta = getMeta(fmt(futureDate));
  assert.equal(futureMeta.level, 'upcoming');
  assert.equal(futureMeta.badgeClass, 'badge-info');
  assert.ok(futureMeta.icon.includes('📅'));
});

test('generateSubmissionCalendarFeed produces valid RFC 5545 iCalendar stream with VALARM', () => {
  const sandbox = setupTestSandbox();
  const genFeed = sandbox.RFCalendar.generateSubmissionCalendarFeed;

  const mockSubs = [
    {
      id: 'sub_test_001',
      manuscriptId: 'man_001',
      targetJournal: 'Nature Communications',
      revisionDueDate: '2026-11-20',
      status: 'revision',
      reviewMatrix: [
        { reviewer: 'Reviewer #1', comment: 'Add defect analysis', response: 'Done in Section 3' },
        { reviewer: 'Reviewer #2', comment: 'Check grammar', response: '' }
      ]
    }
  ];

  const mockMans = [
    {
      id: 'man_001',
      title: 'High-Performance 2D Heterostructures for Neuromorphic Computing',
      authors: 'A. Smith, B. Zhang, C. Doe'
    }
  ];

  const ics = genFeed(mockSubs, mockMans, { calName: 'PaperFlow Deadlines' });

  // Basic structure
  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('VERSION:2.0'));
  assert.ok(ics.includes('PRODID:-//Zotero Flow//Zotero PaperFlow//EN'));
  assert.ok(ics.includes('X-WR-CALNAME:PaperFlow Deadlines'));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('UID:paperflow-sub_test_001-20261120@zoteroflow'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261120'));
  assert.ok(ics.includes('SUMMARY:[PaperFlow 修回截止] Nature Communications: High-Performance 2D Heterostructures for Neuromorphic Computing'));
  assert.ok(ics.includes('LOCATION:Nature Communications'));
  assert.ok(ics.includes('STATUS:CONFIRMED'));
  assert.ok(ics.includes('CATEGORIES:Academic,PaperFlow,Revision'));

  // VALARM alarms: 7d, 3d, 1d
  assert.ok(ics.includes('BEGIN:VALARM\r\nTRIGGER:-P7D'));
  assert.ok(ics.includes('BEGIN:VALARM\r\nTRIGGER:-P3D'));
  assert.ok(ics.includes('BEGIN:VALARM\r\nTRIGGER:-P1D'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
});

test('generateAcademicRebuttalLetter outputs robust LaTeX template with tcolorbox', () => {
  const sandbox = setupTestSandbox();
  const genLetter = sandbox.RFAcademicExport.generateAcademicRebuttalLetter;

  const mockSub = {
    id: 'sub_latex_01',
    externalManuscriptId: 'NMAT-2026-0912',
    targetJournal: 'Nature Materials',
    revisionDueDate: '2026-11-25',
    reviewMatrix: [
      {
        reviewer: 'Reviewer #1',
        comment: 'Please test stability under 85% RH & 85 °C condition.',
        response: 'We performed 1000h damping heat testing; retention was >95%.',
        changes: 'Page 7, Lines 210-235; Supplementary Figure S8 added.'
      },
      {
        reviewer: 'Reviewer #2',
        comment: 'Clarify why equation (3) assumes zero bandgap.',
        response: 'Equation (3) is modified to include finite bandgap corrections.',
        changes: 'Page 3, Equation 3 updated.'
      }
    ]
  };

  const mockMan = {
    id: 'man_latex_01',
    title: 'Robust 2D Semiconductors under Extreme Environments',
    authors: 'X. Wang, Y. Chen, Z. Liu'
  };

  const tex = genLetter(mockSub, mockMan, 'latex');

  // Verify LaTeX components
  assert.ok(tex.includes('\\documentclass[11pt,a4paper]{article}'));
  assert.ok(tex.includes('\\usepackage{tcolorbox}'));
  assert.ok(tex.includes('\\tcbuselibrary{skins,breakable}'));
  assert.ok(tex.includes('\\newtcolorbox{commentbox}'));
  assert.ok(tex.includes('\\newtcolorbox{responsebox}'));
  assert.ok(tex.includes('\\newtcolorbox{changesbox}'));
  assert.ok(tex.includes('Robust 2D Semiconductors under Extreme Environments'));
  assert.ok(tex.includes('NMAT-2026-0912'));
  assert.ok(tex.includes('Reviewer \\#1'));
  assert.ok(tex.includes('Please test stability under 85\\% RH'));
  assert.ok(tex.includes('Page 7, Lines 210-235; Supplementary Figure S8 added.'));
  assert.ok(tex.includes('\\begin{longtable}'));
  assert.ok(tex.includes('\\end{document}'));
});

test('generateAcademicRebuttalLetter outputs clean Academic Markdown with blockquotes & summary table', () => {
  const sandbox = setupTestSandbox();
  const genLetter = sandbox.RFAcademicExport.generateAcademicRebuttalLetter;

  const mockSub = {
    id: 'sub_md_01',
    externalManuscriptId: 'PRL-12345',
    targetJournal: 'Physical Review Letters',
    revisionDueDate: '2026-12-01',
    reviewMatrix: [
      {
        reviewer: 'Reviewer #1',
        comment: 'Is the phase transition truly first-order?',
        response: 'Yes, latent heat measurements confirm first-order behavior.',
        changes: 'Page 4, Fig. 3 caption and inset'
      }
    ]
  };

  const mockMan = {
    id: 'man_md_01',
    title: 'Topological Phase Transitions in Kitaev Chains',
    authors: 'A. Kitaev, E. Majorana'
  };

  const md = genLetter(mockSub, mockMan, 'md');

  assert.ok(md.includes('# Point-by-Point Response to Reviewers'));
  assert.ok(md.includes('Topological Phase Transitions in Kitaev Chains'));
  assert.ok(md.includes('Physical Review Letters (ID: PRL-12345)'));
  assert.ok(md.includes('## Summary of Revisions'));
  assert.ok(md.includes('| # | Reviewer | Comment Summary | Author Response & Manuscript Changes |'));
  assert.ok(md.includes('> **Reviewer Comment:**'));
  assert.ok(md.includes('Is the phase transition truly first-order?'));
  assert.ok(md.includes('**Author Response:**'));
  assert.ok(md.includes('**Manuscript Changes:**'));
  assert.ok(md.includes('Page 4, Fig. 3 caption and inset'));
});

test('generateAcademicRebuttalLetter outputs Word-compatible HTML with Times New Roman and callouts', () => {
  const sandbox = setupTestSandbox();
  const genLetter = sandbox.RFAcademicExport.generateAcademicRebuttalLetter;

  const mockSub = {
    id: 'sub_word_01',
    targetJournal: 'Advanced Materials',
    reviewMatrix: [
      {
        reviewer: 'Reviewer #1',
        comment: 'Provide XRD spectra comparison.',
        response: 'XRD profiles added to Figure S2.',
        changes: 'Supplementary Info Section S1'
      }
    ]
  };

  const mockMan = {
    id: 'man_word_01',
    title: 'Perovskite Photovoltaics with 26% Efficiency',
    authors: 'M. Green et al.'
  };

  const wordHtml = genLetter(mockSub, mockMan, 'word');

  assert.ok(wordHtml.includes("Times New Roman"));
  assert.ok(wordHtml.includes("class=\"comment-card\""));
  assert.ok(wordHtml.includes("class=\"response-card\""));
  assert.ok(wordHtml.includes("class=\"changes-card\""));
  assert.ok(wordHtml.includes("class=\"matrix-table\""));
  assert.ok(wordHtml.includes("Perovskite Photovoltaics with 26% Efficiency"));
  assert.ok(wordHtml.includes("XRD profiles added to Figure S2."));
  assert.ok(wordHtml.includes("Supplementary Info Section S1"));
});

test('parseReviewCommentsBatch extracts reviewers and individual points accurately', () => {
  const sandbox = setupTestSandbox();
  const parseBatch = sandbox.RFAcademicExport.parseReviewCommentsBatch;

  assert.equal(parseBatch('').length, 0);
  assert.equal(parseBatch('   ').length, 0);

  const rawLetter = `
Reviewer #1:
1. The authors should clarify the experimental setup in Section 2.
2. In Figure 3b, what is the meaning of the dashed curve?

Reviewer #2 (Major Comments):
Point 1: The novelty compared to Ref. [14] needs to be clearly explained.
Point 2: The statistical significance should be verified using ANOVA test.

Editor:
- Please ensure data availability statement complies with journal policy.
`;

  const parsed = parseBatch(rawLetter);
  assert.equal(parsed.length, 5);

  assert.equal(parsed[0].reviewer, 'Reviewer #1');
  assert.ok(parsed[0].comment.includes('clarify the experimental setup'));

  assert.equal(parsed[1].reviewer, 'Reviewer #1');
  assert.ok(parsed[1].comment.includes('Figure 3b'));

  assert.equal(parsed[2].reviewer, 'Reviewer #2');
  assert.ok(parsed[2].comment.includes('novelty compared to Ref. [14]'));

  assert.equal(parsed[3].reviewer, 'Reviewer #2');
  assert.ok(parsed[3].comment.includes('statistical significance'));

  assert.equal(parsed[4].reviewer, 'Editor');
  assert.ok(parsed[4].comment.includes('data availability statement'));

  // Test Chinese reviewer headers and punctuation enumeration
  const rawCn = `
审稿专家 1:
1、请进一步补充缺陷密度的测量方法。
2、图 3b 中的误差线未标明样本量 N。

审稿人二:
（1）与文献 [12] 相比，该机制的新颖性需要深入论证。
（2）建议补充表 S2。

主编意见:
1. 请提供数据可用性声明。
`;
  const parsedCn = parseBatch(rawCn);
  assert.equal(parsedCn.length, 5);
  assert.equal(parsedCn[0].reviewer, 'Reviewer #1');
  assert.ok(parsedCn[0].comment.includes('缺陷密度的测量方法'));
  assert.equal(parsedCn[1].reviewer, 'Reviewer #1');
  assert.ok(parsedCn[1].comment.includes('样本量 N'));
  assert.equal(parsedCn[2].reviewer, 'Reviewer #2');
  assert.ok(parsedCn[2].comment.includes('机制的新颖性'));
  assert.equal(parsedCn[3].reviewer, 'Reviewer #2');
  assert.ok(parsedCn[3].comment.includes('补充表 S2'));
  assert.equal(parsedCn[4].reviewer, 'Editor');
  assert.ok(parsedCn[4].comment.includes('数据可用性声明'));
});

test('generateRevisionCoverLetter generates valid LaTeX, Markdown, and Word-compatible HTML', () => {
  const sandbox = setupTestSandbox();
  const genCover = sandbox.RFAcademicExport.generateRevisionCoverLetter;

  const mockSub = {
    id: 'sub_cover_01',
    targetJournal: 'Nature Nanotechnology',
    externalManuscriptId: 'NNANO-2026-08123',
    reviewMatrix: [
      { reviewer: 'Reviewer #1', comment: 'Point 1', response: 'Done 1', changes: 'p. 2' },
      { reviewer: 'Reviewer #2', comment: 'Point 2', response: 'Done 2', changes: 'p. 5' }
    ]
  };

  const mockMan = {
    id: 'man_cover_01',
    title: 'Room-Temperature Superconductivity in Chiral Nanoribbons',
    authors: 'C. Chen, E. Fermi'
  };

  // Test LaTeX format
  const tex = genCover(mockSub, mockMan, 'latex');
  assert.ok(tex.includes('\\documentclass[11pt]{article}'));
  assert.ok(tex.includes('Nature Nanotechnology'));
  assert.ok(tex.includes('NNANO-2026-08123'));
  assert.ok(tex.includes('Room-Temperature Superconductivity in Chiral Nanoribbons'));
  assert.ok(tex.includes('\\begin{itemize}'));

  // Test Markdown format
  const md = genCover(mockSub, mockMan, 'md');
  assert.ok(md.includes('# Cover Letter for Revised Manuscript'));
  assert.ok(md.includes('Nature Nanotechnology'));
  assert.ok(md.includes('NNANO-2026-08123'));
  assert.ok(md.includes('Dear Editor,'));

  // Test Word HTML format
  const html = genCover(mockSub, mockMan, 'html');
  assert.ok(html.includes("font-family:'Times New Roman'"));
  assert.ok(html.includes("Subject: Submission of Revised Manuscript (Manuscript ID: NNANO-2026-08123)"));
  assert.ok(html.includes("Room-Temperature Superconductivity in Chiral Nanoribbons"));
});

test('renderRebuttalProgressTracker computes metrics and progress percentages correctly', () => {
  const sandbox = setupTestSandbox();
  const renderTracker = sandbox.RFAcademicExport.renderRebuttalProgressTracker;

  assert.equal(renderTracker({ reviewMatrix: [] }), '');

  const sub = {
    reviewMatrix: [
      { reviewer: 'Reviewer #1', comment: 'C1', response: 'R1', changes: 'p. 1', status: 'addressed' },
      { reviewer: 'Reviewer #1', comment: 'C2', response: 'R2', changes: 'p. 2', status: 'addressed' },
      { reviewer: 'Reviewer #2', comment: 'C3', response: 'R3', changes: '', status: 'in_progress' },
      { reviewer: 'Reviewer #2', comment: 'C4', response: '', changes: '', status: 'pending' }
    ]
  };

  const html = renderTracker(sub);
  assert.ok(html.includes('50%')); // 2 out of 4 addressed = 50%
  assert.ok(html.includes('Reviewer #1:'));
  assert.ok(html.includes('2/2'));
  assert.ok(html.includes('Reviewer #2:'));
  assert.ok(html.includes('0/2'));
  assert.ok(html.includes('<strong>4</strong>')); // total comments
  assert.ok(html.includes('rebuttalInProgress') || html.includes('处理中') || html.includes('In Progress'));
});

test('buildSubmissionEditSyncPlan preserves externalManuscriptId', () => {
  const uiUtils = require(path.join(root, 'chrome/content/scripts/ui-utils.js'));
  const plan = uiUtils.buildSubmissionEditSyncPlan({
    title: 'Quantum Hall Effects',
    journal: 'Physical Review B',
    externalManuscriptId: 'PRB-2026-9901',
    status: 'revision'
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.submissionPatch.externalManuscriptId, 'PRB-2026-9901');
  assert.equal(plan.submissionPatch.targetJournal, 'Physical Review B');
});
