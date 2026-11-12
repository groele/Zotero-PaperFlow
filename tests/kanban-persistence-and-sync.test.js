const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const loadScript = (rel) => fs.readFileSync(path.join(root, 'chrome/content/scripts', rel), 'utf8');

function createWorkflowContext(options = {}) {
  const saves = [];
  const toasts = [];
  const celebrations = [];
  const db = options.db || { manuscripts: [], submissions: [], settings: { profile: { theme: 'light' } } };

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
    JSON,
    Promise,
    Error,
    setTimeout,
    clearTimeout,
    db,
    currentLanguage: 'en',
    currentDashboardFilter: 'all',
    selectedSubmissionId: null,
    t: (k) => k,
    tf: (k, v) => `${k}:${JSON.stringify(v || {})}`,
    escapeHTML: (s) => String(s ?? ''),
    openModal: () => {},
    closeModal: () => {},
    showGlobalToast: (msg, type) => toasts.push({ msg, type }),
    showAcceptanceCelebration: (payload) => celebrations.push(payload),
    renderDashboard: () => {},
    renderSubmissions: () => {},
    storage: {
      saveAll: async (nextDb) => {
        if (options.failSave) throw new Error('Simulated save failure');
        saves.push(JSON.parse(JSON.stringify(nextDb)));
        return nextDb;
      }
    }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
      className: '',
      style: {},
      dataset: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute() {},
      addEventListener() {},
      appendChild() {},
      querySelector() { return null; },
      querySelectorAll() { return []; }
    })
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(loadScript('ui-utils.js'), context);
  vm.runInContext(loadScript('core/research-core.js'), context);
  vm.runInContext(loadScript('modules/i18n.js'), context);
  vm.runInContext(loadScript('modules/timeline-engine.js'), context);
  vm.runInContext(loadScript('modules/academic-sync.js'), context);

  // Capture academic-sync's setManuscriptStatus before dashboard-view loads
  const academicSetManuscriptStatus = context.RFAcademicSync.setManuscriptStatus;

  vm.runInContext(loadScript('modules/dashboard-view.js'), context);
  vm.runInContext(loadScript('modules/kanban-view.js'), context);

  return { context, saves, toasts, celebrations, academicSetManuscriptStatus };
}

test('P0: persistManuscriptStatusChange exists, updates status, saves, and triggers acceptance celebration', async () => {
  const initialDb = {
    manuscripts: [{ id: 'm1', title: 'Solar Paper', status: 'under_review' }],
    submissions: [
      { id: 's1', manuscriptId: 'm1', targetJournal: 'Nature', status: 'under_review', round: 1, updatedAt: '2026-01-01T00:00:00.000Z' }
    ]
  };
  const { context, saves } = createWorkflowContext({ db: initialDb });

  assert.equal(typeof context.persistManuscriptStatusChange, 'function', 'persistManuscriptStatusChange must be implemented');

  const result = await context.persistManuscriptStatusChange(initialDb.manuscripts[0], 'accepted');
  assert.equal(result.manuscript.status, 'accepted');
  assert.equal(result.shouldCelebrate, true);
  assert.equal(saves.length, 1);
  assert.equal(saves[0].manuscripts[0].status, 'accepted');
  assert.equal(saves[0].submissions[0].status, 'accepted');
});

test('P0: persistManuscriptStatusChange rolls back / preserves state when storage.saveAll throws', async () => {
  const initialDb = {
    manuscripts: [{ id: 'm1', title: 'Solar Paper', status: 'drafting' }],
    submissions: []
  };
  const { context } = createWorkflowContext({ db: initialDb, failSave: true });

  await assert.rejects(
    () => context.persistManuscriptStatusChange(initialDb.manuscripts[0], 'submitted'),
    /Simulated save failure/
  );
  assert.equal(initialDb.manuscripts[0].status, 'drafting');
});

test('P1: setManuscriptStatus in academic-sync updates only current round, not older non-rejected rounds', () => {
  const initialDb = {
    manuscripts: [{ id: 'm1', title: 'Multi-round Paper', status: 'submitted' }],
    submissions: [
      {
        id: 'sub_old',
        manuscriptId: 'm1',
        targetJournal: 'Journal A',
        status: 'under_review',
        round: 1,
        submissionDate: '2026-01-10T12:00:00.000Z',
        createdAt: '2026-01-10T12:00:00.000Z'
      },
      {
        id: 'sub_curr',
        manuscriptId: 'm1',
        targetJournal: 'Journal B',
        status: 'submitted',
        round: 2,
        previousSubmissionId: 'sub_old',
        submissionDate: '2026-06-15T12:00:00.000Z',
        createdAt: '2026-06-15T12:00:00.000Z'
      }
    ]
  };
  const { academicSetManuscriptStatus } = createWorkflowContext({ db: initialDb });

  academicSetManuscriptStatus(initialDb.manuscripts[0], 'revision', { database: initialDb });
  assert.equal(initialDb.submissions[1].status, 'revision', 'current round should move to revision');
  assert.equal(initialDb.submissions[0].status, 'under_review', 'historical round must NOT be overwritten');
});

test('P1: validateLinkedManuscriptStatus accepts planning and in_progress', () => {
  const { context } = createWorkflowContext();
  const m = { id: 'm1', status: 'drafting' };

  assert.doesNotThrow(() => context.RFAcademicSync.validateLinkedManuscriptStatus(m, 'planning'));
  assert.doesNotThrow(() => context.RFAcademicSync.validateLinkedManuscriptStatus(m, 'in_progress'));
  assert.throws(() => context.RFAcademicSync.validateLinkedManuscriptStatus(m, 'nonexistent_stage'), /Invalid manuscript status/);
});

test('P1: RFCore.getCurrentSubmission ranks newer active round ahead of older accepted round', () => {
  const { context } = createWorkflowContext();
  const sampleDb = {
    manuscripts: [{ id: 'm1', title: 'Follow-up Round Paper' }],
    submissions: [
      {
        id: 'sub_r1_acc',
        manuscriptId: 'm1',
        status: 'accepted',
        round: 1,
        submissionDate: '2025-01-01T12:00:00.000Z',
        acceptedAt: '2025-03-01T12:00:00.000Z',
        updatedAt: '2025-03-01T12:00:00.000Z'
      },
      {
        id: 'sub_r2_active',
        manuscriptId: 'm1',
        status: 'under_review',
        round: 2,
        previousSubmissionId: 'sub_r1_acc',
        submissionDate: '2026-10-01T12:00:00.000Z',
        updatedAt: '2026-10-05T12:00:00.000Z'
      }
    ]
  };

  const current = context.RFCore.getCurrentSubmission(sampleDb, 'm1');
  assert.equal(current?.id, 'sub_r2_active');
});

test('P2: normalizeSubmissionTimeline preserves planDate and dueDate on submit and accept nodes', () => {
  const initialDb = {
    manuscripts: [{ id: 'm1', title: 'Timeline Paper', status: 'submitted' }],
    submissions: [
      {
        id: 'sub1',
        manuscriptId: 'm1',
        status: 'submitted',
        submissionDate: '2026-10-15T12:00:00.000Z',
        timelineNodes: [
          {
            id: 'tn1',
            key: 'submit',
            name: 'Manuscript Submitted',
            type: 'submission',
            status: 'completed',
            planDate: '2026-10-01',
            dueDate: '2026-10-10',
            completeDate: '2026-10-15'
          }
        ]
      }
    ]
  };
  const { context } = createWorkflowContext({ db: initialDb });
  context.normalizeSubmissionTimeline(initialDb.submissions[0]);

  const submitNode = initialDb.submissions[0].timelineNodes.find((n) => n.key === 'submit');
  assert.equal(submitNode.completeDate, '2026-10-15');
  assert.equal(submitNode.planDate, '2026-10-01', 'planDate must not be cleared');
  assert.equal(submitNode.dueDate, '2026-10-10', 'dueDate must not be cleared');
});
