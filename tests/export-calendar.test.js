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
