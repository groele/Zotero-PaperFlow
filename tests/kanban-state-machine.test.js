const test = require('node:test');
const assert = require('node:assert/strict');

function normalizeKanbanStatusClass(status) {
  const normalized = String(status || 'planning').toLowerCase().trim().replace(/_/g, '-');
  if (['planning', 'idea', 'outline', 'data-collection'].includes(normalized)) return 'planning';
  if (['in-progress', 'figure-preparation', 'drafting', 'internal-review'].includes(normalized)) return 'drafting';
  if (['submitted', 'under-review', 'revision'].includes(normalized)) return 'submitted';
  if (['accepted', 'published'].includes(normalized)) return 'accepted';
  return 'planning';
}

function mapStatusToKanbanColumn(status) {
  if (['planning', 'outline', 'idea', 'data_collection'].includes(status)) return 'idea';
  if (['in_progress', 'drafting', 'figure_preparation', 'internal_review', 'rejected'].includes(status)) return 'drafting';
  if (['submitted', 'under_review', 'revision'].includes(status)) return 'submitted';
  if (['accepted', 'published'].includes(status)) return 'accepted';
  return 'idea';
}

function computeKanbanCounts(manuscripts) {
  const mCount = { idea: 0, drafting: 0, submitted: 0, accepted: 0 };
  for (const m of manuscripts) {
    const col = mapStatusToKanbanColumn(m.status);
    mCount[col] = (mCount[col] || 0) + 1;
  }
  return mCount;
}

test('Kanban state machine maps granular status to 4 major columns', () => {
  assert.equal(mapStatusToKanbanColumn('idea'), 'idea');
  assert.equal(mapStatusToKanbanColumn('planning'), 'idea');
  assert.equal(mapStatusToKanbanColumn('outline'), 'idea');
  assert.equal(mapStatusToKanbanColumn('data_collection'), 'idea');

  assert.equal(mapStatusToKanbanColumn('drafting'), 'drafting');
  assert.equal(mapStatusToKanbanColumn('in_progress'), 'drafting');
  assert.equal(mapStatusToKanbanColumn('figure_preparation'), 'drafting');
  assert.equal(mapStatusToKanbanColumn('internal_review'), 'drafting');
  assert.equal(mapStatusToKanbanColumn('rejected'), 'drafting');

  assert.equal(mapStatusToKanbanColumn('submitted'), 'submitted');
  assert.equal(mapStatusToKanbanColumn('under_review'), 'submitted');
  assert.equal(mapStatusToKanbanColumn('revision'), 'submitted');

  assert.equal(mapStatusToKanbanColumn('accepted'), 'accepted');
  assert.equal(mapStatusToKanbanColumn('published'), 'accepted');
});

test('normalizeKanbanStatusClass normalizes status names to CSS classes', () => {
  assert.equal(normalizeKanbanStatusClass('in_progress'), 'drafting');
  assert.equal(normalizeKanbanStatusClass('under_review'), 'submitted');
  assert.equal(normalizeKanbanStatusClass('published'), 'accepted');
  assert.equal(normalizeKanbanStatusClass('data_collection'), 'planning');
  assert.equal(normalizeKanbanStatusClass('unknown_custom_status'), 'planning');
});

test('computeKanbanCounts accurately tallies manuscripts by stage column', () => {
  const sample = [
    { id: '1', status: 'planning' },
    { id: '2', status: 'drafting' },
    { id: '3', status: 'in_progress' },
    { id: '4', status: 'submitted' },
    { id: '5', status: 'under_review' },
    { id: '6', status: 'revision' },
    { id: '7', status: 'accepted' },
    { id: '8', status: 'published' }
  ];

  const counts = computeKanbanCounts(sample);
  assert.equal(counts.idea, 1);
  assert.equal(counts.drafting, 2);
  assert.equal(counts.submitted, 3);
  assert.equal(counts.accepted, 2);
});

test('Kanban stage progression preserves manuscript metadata', () => {
  const manuscript = {
    id: 'm-101',
    title: 'Self-healing perovskite solar cells',
    status: 'drafting',
    zoteroItemKey: 'ITEM_KEY_1',
    targetJournals: ['Nature Energy']
  };

  // Move from drafting to submitted
  const targetCol = 'submitted';
  let nextStatus = targetCol;
  if (targetCol === 'submitted') nextStatus = 'submitted';
  manuscript.status = nextStatus;

  assert.equal(mapStatusToKanbanColumn(manuscript.status), 'submitted');
  assert.equal(manuscript.title, 'Self-healing perovskite solar cells');
  assert.equal(manuscript.zoteroItemKey, 'ITEM_KEY_1');
});
