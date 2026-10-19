const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const optionsSource = fs.readFileSync(path.join(root, 'chrome/content/scripts/options.js'), 'utf8');

function setupTestEnvironment() {
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
      getTimelineEventDate: (node, key) => node?.completeDate || node?.dueDate || node?.planDate || ''
    },
    RFCore: {
      getCurrentSubmission: (db, manuscriptId) => {
        return (db.submissions || []).filter(s => s.manuscriptId === manuscriptId).slice(-1)[0] || null;
      }
    }
  };
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox);

  // Extract helper functions and definitions from options.js
  const neededFunctions = [
    'function normalizeDateString',
    'function dateInputToIso',
    'function formatShortDate',
    'function todayString',
    'function getDaysDiff',
    'function getNodeDate',
    'function inferKey',
    'function getTimelineNodeByKey',
    'function setTimelineNodeDate',
    'function createTimelineNode',
    'function createCanonicalTimelineNode',
    'function ensureTimelineNode',
    'function getTimelineNodeDisplayName',
    'function getSubmissionJournalName',
    'function normalizeSubmissionStatus',
    'function normalizeSyncedPublicationStatus',
    'function hasPublicationStatus',
    'function isAcceptedSubmission',
    'function computeNodeStatus',
    'function initializeSubmissionTimelineNodes',
    'function syncSubmissionFieldsFromTimeline',
    'function normalizeSubmissionTimeline',
    'function analyzeSubmission'
  ];

  // We can evaluate the whole script or targeted functions
  // Since options.js has DOM bindings in top-level code or inside functions,
  // let's create mock DOM in sandbox so options.js functions can be evaluated safely.
  const createMockElement = () => ({
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute() { return ''; },
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    appendChild() {},
    querySelector() { return createMockElement(); },
    querySelectorAll() { return []; },
    style: {},
    dataset: {}
  });

  const mockDoc = {
    getElementById: () => createMockElement(),
    querySelector: () => createMockElement(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    documentElement: { lang: '', dataset: {} },
    createElement: () => createMockElement()
  };
  sandbox.document = mockDoc;
  sandbox.location = { reload() {} };
  sandbox.addEventListener = () => {};
  sandbox.removeEventListener = () => {};
  sandbox.RFPlatform = { storage: { local: { get: async () => ({}), set: async () => {} } }, runtime: { onMessage: { addListener() {} } } };

  // Evaluate options.js inside context up to renderKanban or evaluate functions
  vm.runInContext(optionsSource, context);
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

  // Collect timelineAlerts with same logic as in renderDashboard
  const timelineAlerts = [];
  ctx.db.submissions
    .filter(s => s.status !== 'rejected')
    .forEach(sub => {
      const man = ctx.db.manuscripts.find(m => m.id === sub.manuscriptId);
      if (man) {
        const currentSub = ctx.window.RFCore?.getCurrentSubmission(ctx.db, man.id);
        if (currentSub && currentSub.id !== sub.id) return;
      }

      const isAcceptedOrPublished = ctx.hasPublicationStatus(sub) ||
        ctx.isAcceptedSubmission(sub) ||
        Boolean(man && (ctx.hasPublicationStatus(man) || man.status === 'accepted' || man.status === 'published'));
      const isPublished = sub.status === 'published' || (man && man.status === 'published');

      if (isPublished) return;

      (sub.timelineNodes || []).forEach(node => {
        const computedStatus = ctx.computeNodeStatus(node);
        const nodeKey = node.key || ctx.inferKey(node);

        if (isAcceptedOrPublished) {
          if (node.type !== 'publication' || nodeKey === 'accept') return;
        }

        if (computedStatus === 'completed') return;

        const importantType = node.type === 'review' || node.type === 'revision' || node.type === 'publication';
        const hasTimelineDate = Boolean(node.dueDate || node.planDate || node.completeDate);
        const actionable = computedStatus === 'overdue' || computedStatus === 'due_soon' || computedStatus === 'blocked' || node.status === 'active';

        if (!actionable && !hasTimelineDate) return;
        if (!importantType && !actionable) return;

        const alertDate = node.dueDate || node.planDate || (node.type === 'review' ? sub.revisionDueDate : '') || node.completeDate || '';
        if (!alertDate && computedStatus !== 'blocked') return;

        timelineAlerts.push({
          sub,
          node,
          computedStatus,
          title: `${ctx.getSubmissionJournalName(sub)}: ${ctx.getTimelineNodeDisplayName(node)}`,
          date: alertDate,
          manTitle: man ? man.title : 'Untitled'
        });
      });
    });

  // Check results: only the overdue under_review submission should be alerted
  assert.equal(timelineAlerts.length, 1, 'Only truly active urgent events should alert');
  assert.equal(timelineAlerts[0].sub.id, 'sub_rev');
  assert.equal(timelineAlerts[0].computedStatus, 'overdue');

  const hasAcceptedAlert = timelineAlerts.some(a => a.sub.id === 'sub_acc');
  const hasPublishedAlert = timelineAlerts.some(a => a.sub.id === 'sub_pub');
  assert.equal(hasAcceptedAlert, false, 'Accepted submissions must not appear in timeline alerts for review comments');
  assert.equal(hasPublishedAlert, false, 'Published submissions must not appear in timeline alerts');
});
