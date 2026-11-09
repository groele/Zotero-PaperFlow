/**
 * Zotero PaperFlow - Timeline Normalization, Milestone Inference & Cycle Analysis
 */
import {
  todayString,
  normalizeDateString,
  dateInputToIso,
  getNodeDate,
  getLatestTimelineNode,
  getDaysDiff,
  createTimelineNode,
} from './node-helpers';

declare var db: any;
declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function formatShortDate(dateStr: any): string;
declare function isDarkThemeActive(): boolean;
declare function normalizeSubmissionStatus(value: any): string;
declare function getSubmissionStatusLabel(status: any): string;

export function inferKey(node: any): string {
  if (node.key && node.key !== 'auto') return node.key;
  const text = `${node.name || ''} ${node.notes || ''}`.toLowerCase();
  if (/reject|rejected|decline|declined|拒稿|拒绝|退稿/.test(text) || node.type === 'rejection') return 'rejected';
  if (/online|publication|published|见刊|上线/.test(text) || (node.type === 'publication' && text.includes('online'))) return 'online';
  if (/accept|accepted|接收|录用/.test(text) || (node.type === 'publication' && text.includes('accept'))) return 'accept';
  if (/r2|second/.test(text) && (/submit|revis|修回|resubmitted/.test(text) || node.type === 'revision')) return 'r2_revised';
  if (/r2|second/.test(text) && (/comment|decision|review|意见|returned/.test(text) || node.type === 'review')) return 'r2_comments';
  if (/r1|first/.test(text) && (/submit|revis|修回|resubmitted/.test(text) || node.type === 'revision')) return 'r1_revised';
  if (/r1|first|comment|decision|审稿意见|一审|returned/.test(text) || node.type === 'review' || node.type === 'revision') return 'r1_comments';
  if (/submit|submission|submitted|投稿/.test(text) || node.type === 'submission') return 'submit';
  if (/draft|manuscript|completed|finished|手稿/.test(text) || node.type === 'writing') return 'draft_done';
  if (/experiment\s*(start|started|begin|began)|start(ed)?\s*(experiment|research)|实验(开始|启动)|研究开始/.test(text)) return 'experiment_start';
  if (/experiment|data|complete|completed|实验|数据/.test(text) || node.type === 'research') return 'experiment_done';
  return 'auto';
}

export function getTimelineNodeByKey(sub: any, key: string): any | null {
  return (sub.timelineNodes || []).find((node: any) => node.key === key || inferKey(node) === key) || null;
}

export function setTimelineNodeDate(node: any, date: string, field = 'completeDate'): boolean {
  if (!node || !date) return false;
  let changed = false;
  ['planDate', 'dueDate', 'completeDate'].forEach((dateField) => {
    const next = dateField === field ? date : '';
    if ((node[dateField] || '') !== next) {
      node[dateField] = next;
      changed = true;
    }
  });
  return changed;
}

export function createCanonicalTimelineNode(subId: string, key: string, name: string, type: string, status = 'pending'): any {
  return createTimelineNode(subId, { key, name, type, status });
}

export function ensureTimelineNode(sub: any, key: string, name: string, type: string, status = 'pending'): { node: any; changed: boolean } {
  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
  let node = getTimelineNodeByKey(sub, key);
  if (!node) {
    node = createCanonicalTimelineNode(sub.id, key, name, type, status);
    sub.timelineNodes.push(node);
    return { node, changed: true };
  }

  let changed = false;
  if (node.key !== key) {
    node.key = key;
    changed = true;
  }
  if (!node.type || node.type === 'special') {
    node.type = type;
    changed = true;
  }
  return { node, changed };
}

export function hasPublicationStatus(sub: any): boolean {
  const status = normalizeSubmissionStatus(sub?.status);
  return status === 'accepted' || status === 'published';
}

export function initializeSubmissionTimelineNodes(sub: any): void {
  const submitDate = normalizeDateString(sub.submissionDate);
  const firstDecisionDate = normalizeDateString(sub.firstDecisionDate);
  const revisionDueDate = normalizeDateString(sub.revisionDueDate);
  const decisionDate = normalizeDateString(sub.decisionDate);
  const linkedMan = db?.manuscripts?.find((m: any) => m.id === sub?.manuscriptId);
  const isAcceptedOrPublished = hasPublicationStatus(sub) ||
    Boolean(linkedMan && (hasPublicationStatus(linkedMan) || linkedMan.status === 'accepted' || linkedMan.status === 'published'));
  const isPublished = sub?.status === 'published' || Boolean(linkedMan && linkedMan.status === 'published');

  sub.timelineNodes = [
    createTimelineNode(sub.id, { key: 'experiment_start', name: 'Experiments Started', type: 'research', status: 'completed' }),
    createTimelineNode(sub.id, { key: 'experiment_done', name: 'Experiments Completed', type: 'research', status: 'completed' }),
    createTimelineNode(sub.id, { key: 'draft_done', name: 'Draft Completed', type: 'writing', status: (submitDate || isAcceptedOrPublished) ? 'completed' : 'pending' }),
    createTimelineNode(sub.id, {
      key: 'submit',
      name: 'Manuscript Submitted',
      type: 'submission',
      status: (submitDate || isAcceptedOrPublished) ? 'completed' : 'pending',
      completeDate: submitDate
    }),
    createTimelineNode(sub.id, {
      key: 'r1_comments',
      name: 'Review Comments R1',
      type: 'review',
      status: (firstDecisionDate || isAcceptedOrPublished) ? 'completed' : (revisionDueDate ? 'active' : 'pending'),
      completeDate: firstDecisionDate,
      dueDate: (firstDecisionDate || isAcceptedOrPublished) ? '' : revisionDueDate
    }),
    createTimelineNode(sub.id, { key: 'r1_revised', name: 'R1 Revision Submitted', type: 'revision', status: isAcceptedOrPublished ? 'completed' : 'pending' }),
    createTimelineNode(sub.id, {
      key: 'accept',
      name: 'Accepted',
      type: 'publication',
      status: isAcceptedOrPublished ? 'completed' : 'pending',
      completeDate: decisionDate && isAcceptedOrPublished ? decisionDate : (isAcceptedOrPublished ? (sub.acceptedAt || '') : '')
    }),
    createTimelineNode(sub.id, {
      key: 'online',
      name: 'Online Publication',
      type: 'publication',
      status: isPublished ? 'completed' : 'pending',
      completeDate: isPublished ? (sub.publishedAt || decisionDate || '') : ''
    })
  ];
}

export function syncSubmissionFieldsFromTimeline(sub: any): boolean {
  if (!sub || !Array.isArray(sub.timelineNodes)) return false;
  let changed = false;
  const submitNode = getTimelineNodeByKey(sub, 'submit');
  const submitNodeDate = normalizeDateString(getNodeDate(submitNode));
  if (submitNodeDate && normalizeDateString(sub.submissionDate) !== submitNodeDate) {
    sub.submissionDate = dateInputToIso(submitNodeDate);
    changed = true;
  }

  const r1Node = getTimelineNodeByKey(sub, 'r1_comments');
  const r1Date = normalizeDateString(r1Node?.completeDate || '');
  if (r1Date && normalizeDateString(sub.firstDecisionDate) !== r1Date) {
    sub.firstDecisionDate = dateInputToIso(r1Date);
    changed = true;
  }

  const acceptNode = getTimelineNodeByKey(sub, 'accept') || getTimelineNodeByKey(sub, 'online');
  const acceptDate = normalizeDateString(acceptNode?.completeDate || '');
  if (acceptDate && normalizeDateString(sub.decisionDate) !== acceptDate) {
    sub.decisionDate = dateInputToIso(acceptDate);
    changed = true;
  }

  return changed;
}

export function normalizeSubmissionTimeline(sub: any): boolean {
  if (!sub) return false;
  let changed = false;
  if (!Array.isArray(sub.timelineNodes) || sub.timelineNodes.length === 0) {
    initializeSubmissionTimelineNodes(sub);
    changed = true;
  }

  const linkedMan = db?.manuscripts?.find((m: any) => m.id === sub.manuscriptId);
  const isAcceptedOrPublished = hasPublicationStatus(sub) ||
    Boolean(normalizeDateString(sub.decisionDate || sub.acceptedAt)) ||
    Boolean(getTimelineNodeByKey(sub, 'accept')?.completeDate) ||
    Boolean(linkedMan && (hasPublicationStatus(linkedMan) || linkedMan.status === 'accepted' || linkedMan.status === 'published'));
  const isPublished = sub.status === 'published' || Boolean(linkedMan && linkedMan.status === 'published');

  if (linkedMan && (linkedMan.status === 'accepted' || linkedMan.status === 'published') && sub.status !== linkedMan.status) {
    const currentForMan = window.RFCore?.getCurrentSubmission(db, linkedMan.id);
    if (!currentForMan || currentForMan.id === sub.id) {
      sub.status = linkedMan.status;
      changed = true;
    }
  }

  const submitDate = normalizeDateString(sub.submissionDate);
  if (submitDate) {
    const result = ensureTimelineNode(sub, 'submit', 'Manuscript Submitted', 'submission', 'completed');
    changed = result.changed || changed;
    changed = setTimelineNodeDate(result.node, submitDate, 'completeDate') || changed;
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }
  } else {
    changed = syncSubmissionFieldsFromTimeline(sub) || changed;
  }

  const firstDecisionDate = normalizeDateString(sub.firstDecisionDate);
  if (firstDecisionDate) {
    const result = ensureTimelineNode(sub, 'r1_comments', 'Review Comments R1', 'review', 'completed');
    changed = result.changed || changed;
    if ((result.node.completeDate || '') !== firstDecisionDate) {
      result.node.completeDate = firstDecisionDate;
      changed = true;
    }
    const normalizedDueDate = normalizeDateString(sub.revisionDueDate);
    if ((result.node.dueDate || '') !== normalizedDueDate) {
      result.node.dueDate = normalizedDueDate;
      changed = true;
    }
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }
  }

  const revisionDueDate = normalizeDateString(sub.revisionDueDate);
  if (revisionDueDate && !isAcceptedOrPublished) {
    const result = ensureTimelineNode(sub, 'r1_comments', 'Review Comments R1', 'review', 'active');
    changed = result.changed || changed;
    if ((result.node.dueDate || '') !== revisionDueDate) {
      result.node.dueDate = revisionDueDate;
      changed = true;
    }
    if (result.node.status === 'pending') {
      result.node.status = 'active';
      changed = true;
    }
  }

  const decisionDate = normalizeDateString(sub.decisionDate || sub.acceptedAt);
  if (isAcceptedOrPublished) {
    const result = ensureTimelineNode(sub, 'accept', 'Accepted', 'publication', 'completed');
    changed = result.changed || changed;
    if (decisionDate) {
      changed = setTimelineNodeDate(result.node, decisionDate, 'completeDate') || changed;
    }
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }

    (sub.timelineNodes || []).forEach((node: any) => {
      const key = node.key || inferKey(node);
      const isPreAcceptance = node.type === 'research' ||
        node.type === 'writing' ||
        node.type === 'submission' ||
        node.type === 'review' ||
        node.type === 'revision' ||
        key === 'submit' ||
        key === 'r1_comments' ||
        key === 'r1_revised' ||
        key === 'r2_comments' ||
        key === 'r2_revised' ||
        key === 'draft_done' ||
        key === 'experiment_done' ||
        key === 'experiment_start';

      if (isPreAcceptance && node.status !== 'completed') {
        node.status = 'completed';
        changed = true;
      }
    });
  }

  if (isPublished) {
    const onlineDate = normalizeDateString(sub.publishedAt || getTimelineNodeByKey(sub, 'online')?.completeDate || sub.decisionDate);
    const result = ensureTimelineNode(sub, 'online', 'Online Publication', 'publication', 'completed');
    changed = result.changed || changed;
    if (onlineDate) {
      changed = setTimelineNodeDate(result.node, onlineDate, 'completeDate') || changed;
    }
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }
  }

  if (changed) sub.updatedAt = new Date().toISOString();
  return changed;
}

import { analyzeSubmission } from './submission-analyzer.js';
export { analyzeSubmission };
