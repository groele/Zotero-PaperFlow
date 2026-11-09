const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const timelineSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/timeline-engine.js'), 'utf8');
const academicExporterSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/academic-exporter.js'), 'utf8');
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
  vm.runInContext(academicExporterSource, context);
  vm.runInContext(submissionsSource, context);
  return sandbox;
}


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

  // Verify that clarified comments count toward completion percentage and reviewer chips
  const clarifiedSub = {
    reviewMatrix: [
      { reviewer: 'Reviewer #1', comment: 'C1', response: 'R1', changes: 'p. 1', status: 'addressed' },
      { reviewer: 'Reviewer #2', comment: 'C2', response: 'Clarified in response', changes: '', status: 'clarified' }
    ]
  };
  const clarifiedHtml = renderTracker(clarifiedSub);
  assert.ok(clarifiedHtml.includes('100% Completed'));
  assert.ok(clarifiedHtml.includes('Reviewer #1:'));
  assert.ok(clarifiedHtml.includes('Reviewer #2:'));
  assert.ok(clarifiedHtml.includes('1/1'));
  assert.ok(clarifiedHtml.includes('rebuttalClarified') || clarifiedHtml.includes('已辩明') || clarifiedHtml.includes('Clarified'));
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
