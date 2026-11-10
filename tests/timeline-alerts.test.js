const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const i18nSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/i18n.js'), 'utf8');
const timelineSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/timeline-engine.js'), 'utf8');
const academicSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/academic-sync.js'), 'utf8');
const dashboardSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/modules/dashboard-view.js'), 'utf8');
const optionsSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/options.js'), 'utf8');

function setupTestEnvironment() {
  const elements = new Map();
  const createMockElement = (tag = 'div') => ({
    tagName: tag.toUpperCase(),
    children: [],
    childNodes: [],
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, v) { if (v === undefined) v = !this._classes.has(c); if (v) this._classes.add(c); else this._classes.delete(c); return v; }
    },
    className: '',
    textContent: '',
    title: '',
    style: {},
    dataset: {},
    addEventListener() {},
    removeEventListener() {},
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k] || ''; },
    appendChild(child) {
      this.children.push(child);
      this.childNodes.push(child);
      return child;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  });

  const getOrCreate = (id) => {
    if (!elements.has(id)) elements.set(id, createMockElement());
    return elements.get(id);
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
    db: { manuscripts: [], submissions: [], settings: { profile: { theme: 'light' } } },
    currentLanguage: 'zh',
    t: (key) => key,
    tf: (key, params) => JSON.stringify({ key, params }),
    RFUI: {
      setHTML: (el, html) => {
        el.innerHTML = html;
        el.children = [];
        el.childNodes = [];
      },
      getTimelineEventDate: (node, key) => node?.completeDate || node?.dueDate || node?.planDate || ''
    },
    RFCore: {
      getCurrentSubmission: (db, manuscriptId) => {
        return (db.submissions || []).filter(s => s.manuscriptId === manuscriptId).slice(-1)[0] || null;
      }
    }
  };
  sandbox.window = sandbox;

  const mockDoc = {
    getElementById: (id) => getOrCreate(id),
    querySelector: (sel) => sel.startsWith('#') ? getOrCreate(sel.slice(1)) : createMockElement(),
    querySelectorAll: () => [],
    createElement: (tag) => createMockElement(tag),
    addEventListener() {},
    removeEventListener() {},
    documentElement: { lang: '', dataset: {} }
  };
  sandbox.document = mockDoc;
  sandbox.location = { reload() {} };
  sandbox.addEventListener = () => {};
  sandbox.removeEventListener = () => {};
  sandbox.RFPlatform = { storage: { local: { get: async () => ({}), set: async () => {} } }, runtime: { onMessage: { addListener() {} } } };

  const context = vm.createContext(sandbox);

  vm.runInContext(i18nSource, context);
  vm.runInContext(timelineSource, context);
  vm.runInContext(academicSource, context);
  vm.runInContext(optionsSource, context);
  vm.runInContext(dashboardSource, context);
  return context;
}

test('accepted submission normalizes pre-acceptance timeline nodes to completed', () => {
  const ctx = setupTestEnvironment();

  const sub = {
    id: 'sub_1',
    manuscriptId: 'man_1',
    journal: 'Applied Physics Letters',
    status: 'accepted',
    decisionDate: '2026-03-15',
    revisionDueDate: '2026-02-28', // Prior revision deadline
    timelineNodes: [
      { id: 'n1', key: 'submit', name: 'Manuscript Submitted', type: 'submission', status: 'completed', completeDate: '2026-01-10' },
      { id: 'n2', key: 'r1_comments', name: 'Review Comments R1', type: 'review', status: 'active', dueDate: '2026-02-28' },
      { id: 'n3', key: 'r1_revised', name: 'R1 Revision Submitted', type: 'revision', status: 'pending' }
    ]
  };

  ctx.db.submissions = [sub];
  ctx.db.manuscripts = [{ id: 'man_1', title: 'Test Paper', status: 'accepted' }];

  ctx.normalizeSubmissionTimeline(sub);

  const r1Node = sub.timelineNodes.find(n => n.key === 'r1_comments');
  const r1RevisedNode = sub.timelineNodes.find(n => n.key === 'r1_revised');
  const acceptNode = sub.timelineNodes.find(n => n.key === 'accept');

  assert.equal(r1Node.status, 'completed', 'R1 comments must be marked completed for accepted paper');
  assert.equal(r1RevisedNode.status, 'completed', 'R1 revision must be marked completed for accepted paper');
  assert.ok(acceptNode, 'Accept node should exist');
  assert.equal(acceptNode.status, 'completed', 'Accept node must be marked completed');
  assert.equal(acceptNode.completeDate, '2026-03-15', 'Accept date should be preserved');
});

test('accepted submission when decisionDate is empty still marks accept and prior nodes as completed', () => {
  const ctx = setupTestEnvironment();

  const sub = {
    id: 'sub_2',
    manuscriptId: 'man_2',
    journal: 'Advanced Functional Materials',
    status: 'accepted',
    timelineNodes: [
      { id: 'n1', key: 'submit', name: 'Manuscript Submitted', type: 'submission', status: 'active' },
      { id: 'n2', key: 'r1_comments', name: 'Review Comments R1', type: 'review', status: 'active' }
    ]
  };

  ctx.db.submissions = [sub];
  ctx.db.manuscripts = [{ id: 'man_2', title: 'AFM Paper', status: 'accepted' }];

  ctx.normalizeSubmissionTimeline(sub);

  const submitNode = sub.timelineNodes.find(n => n.key === 'submit');
  const r1Node = sub.timelineNodes.find(n => n.key === 'r1_comments');
  const acceptNode = sub.timelineNodes.find(n => n.key === 'accept');

  assert.equal(submitNode.status, 'completed');
  assert.equal(r1Node.status, 'completed');
  assert.equal(acceptNode.status, 'completed');
});

test('accepted and published submissions never generate review/revision timeline alerts on dashboard', () => {
  const ctx = setupTestEnvironment();

  // Create an accepted submission that previously had an active R1 node
  const subAccepted = {
    id: 'sub_acc',
    manuscriptId: 'man_acc',
    journal: 'Small',
    status: 'accepted',
    timelineNodes: [
      { id: 'n1', key: 'r1_comments', name: 'Review Comments R1', type: 'review', status: 'active' }
    ]
  };

  // Create a published submission
  const subPublished = {
    id: 'sub_pub',
    manuscriptId: 'man_pub',
    journal: 'Nature',
    status: 'published',
    timelineNodes: [
      { id: 'np1', key: 'r1_comments', name: 'Review Comments R1', type: 'review', status: 'completed' },
      { id: 'np2', key: 'accept', name: 'Accepted', type: 'publication', status: 'completed' },
      { id: 'np3', key: 'online', name: 'Online Publication', type: 'publication', status: 'completed' }
    ]
  };

  // Create an active submission with an overdue revision
  const subUnderReview = {
    id: 'sub_rev',
    manuscriptId: 'man_rev',
    journal: 'Nano Letters',
    status: 'under_review',
    timelineNodes: [
      { id: 'nr1', key: 'r1_comments', name: 'Review Comments R1', type: 'review', status: 'active', dueDate: '2020-01-01' }
    ]
  };

  ctx.db.submissions = [subAccepted, subPublished, subUnderReview];
  ctx.db.manuscripts = [
    { id: 'man_acc', title: 'Accepted Paper', status: 'accepted' },
    { id: 'man_pub', title: 'Published Paper', status: 'published' },
    { id: 'man_rev', title: 'Revising Paper', status: 'under_review' }
  ];

  // Run normalization
  ctx.db.submissions.forEach(s => ctx.normalizeSubmissionTimeline(s));

  // Directly call the real renderTimelineAlerts
  ctx.renderTimelineAlerts();

  const milestones = ctx.document.getElementById('dashboard-pending-milestones');
  assert.equal(milestones.children.length, 1, 'Only truly active urgent events should alert');
  assert.match(milestones.children[0].children[0].textContent, /Nano Letters/);

  // Assert accepted/published submissions generated zero alerts
  const allTitles = milestones.children.map(c => c.children[0].textContent).join(' ');
  assert.equal(allTitles.includes('Small'), false, 'Accepted submissions must not appear in timeline alerts');
  assert.equal(allTitles.includes('Nature'), false, 'Published submissions must not appear in timeline alerts');
});

test('active revision submission with revisionDueDate displays deadline countdown and calendar export', () => {
  const ctx = setupTestEnvironment();

  // Create future deadline 18 days from now
  const future = new Date();
  future.setDate(future.getDate() + 18);
  const futureStr = future.toISOString().slice(0, 10);

  const sub = {
    id: 'sub_active_rev',
    manuscriptId: 'man_mos2',
    journal: 'Nano Letters',
    status: 'revision',
    revisionDueDate: futureStr,
    timelineNodes: [
      { id: 'n1', key: 'submit', name: 'Manuscript Submitted', type: 'submission', status: 'completed', completeDate: '2026-09-08' },
      { id: 'n2', key: 'r1_comments', name: 'Review Comments R1', type: 'review', status: 'completed', completeDate: '2026-10-20' },
      { id: 'n3', key: 'r1_revised', name: 'R1 Revision Submitted', type: 'revision', status: 'pending' }
    ]
  };

  ctx.db.submissions = [sub];
  ctx.db.manuscripts = [{ id: 'man_mos2', title: 'Vacancy-Directed Molecular Reconstruction', status: 'revision' }];

  ctx.renderTimelineAlerts();

  const milestones = ctx.document.getElementById('dashboard-pending-milestones');
  assert.equal(milestones.children.length, 1, 'Active revision submission must generate an alert in timeline alerts');

  const alertItem = milestones.children[0];
  const titleSpan = alertItem.children[0];
  const badgeSpan = alertItem.children[1];
  const dateSpan = alertItem.children[2];
  const icsBtn = alertItem.children[3];

  assert.match(titleSpan.textContent, /Nano Letters/);
  assert.match(titleSpan.textContent, /修回/);
  assert.match(badgeSpan.textContent, /剩\s*18\s*天/);
  assert.match(badgeSpan.className, /badge-info/);
  assert.match(dateSpan.textContent, /截止/);
  assert.ok(icsBtn, 'Calendar .ics export button must be attached');
  assert.equal(icsBtn.textContent, '📅');
});

test('overdue revision displays danger badge with overdue days', () => {
  const ctx = setupTestEnvironment();

  const past = new Date();
  past.setDate(past.getDate() - 3);
  const pastStr = past.toISOString().slice(0, 10);

  const sub = {
    id: 'sub_overdue',
    manuscriptId: 'man_overdue',
    journal: 'Advanced Materials',
    status: 'revision',
    revisionDueDate: pastStr,
    timelineNodes: []
  };

  ctx.db.submissions = [sub];
  ctx.db.manuscripts = [{ id: 'man_overdue', title: 'Overdue Paper', status: 'revision' }];

  ctx.renderTimelineAlerts();

  const milestones = ctx.document.getElementById('dashboard-pending-milestones');
  assert.equal(milestones.children.length, 1);
  const badgeSpan = milestones.children[0].children[1];
  assert.match(badgeSpan.textContent, /已逾期\s*3\s*天/);
  assert.match(badgeSpan.className, /badge-danger/);
});
