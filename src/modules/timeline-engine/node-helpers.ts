/**
 * Zotero PaperFlow - Timeline Node Helpers, Date Calculations & Node Factories
 */

declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function inferKey(node: any): string;

export const defaultTimelineNameKeys: Record<string, string> = {
  'Research Started': 'defaultResearchStarted',
  '研究启动': 'defaultResearchStarted',
  'Experiments Completed': 'defaultExperimentsCompleted',
  '实验完成': 'defaultExperimentsCompleted',
  'First Draft Completed': 'defaultFirstDraftCompleted',
  '初稿完成': 'defaultFirstDraftCompleted',
  'Submitted': 'defaultSubmitted',
  '已投稿': 'defaultSubmitted',
  'Review Comments R1': 'defaultReviewCommentsR1',
  '收到 R1 审稿意见': 'defaultReviewCommentsR1',
  'R1 Revision Submitted': 'defaultR1RevisionSubmitted',
  'R1 修回已提交': 'defaultR1RevisionSubmitted',
  'Review Comments R2': 'defaultReviewCommentsR2',
  '收到 R2 审稿意见': 'defaultReviewCommentsR2',
  'R2 Revision Submitted': 'defaultR2RevisionSubmitted',
  'R2 修回已提交': 'defaultR2RevisionSubmitted',
  'Accepted': 'defaultAccepted',
  '已接收': 'defaultAccepted',
  'Online Publication': 'defaultOnlinePublication',
  '上线发表': 'defaultOnlinePublication',
  'Proof': 'defaultProof',
  '校样': 'defaultProof'
};

export function getTimelineNodeDisplayName(node: any): string {
  const rawName = (node?.name || '').trim();
  if (!rawName) return t('untitledEvent');
  const defaultKey = defaultTimelineNameKeys[rawName];
  return defaultKey ? t(defaultKey) : rawName;
}

export function getDaysDiff(dateStr1: any, dateStr2: any): number | null {
  if (!dateStr1 || !dateStr2) return null;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;

  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.max(0, Math.round((utc2 - utc1) / 86400000));
}

export function getRelativeDateLabel(dateStr: any): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  const utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((utcToday - utcDate) / 86400000);

  if (diff === 0) return t('relativeToday');
  if (diff > 0) return tf('relativeDaysAgo', { count: diff });
  return tf('relativeInDays', { count: Math.abs(diff) });
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeDateString(value: any): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function dateInputToIso(value: any): string | null {
  const normalized = normalizeDateString(value);
  return normalized ? `${normalized}T12:00:00.000Z` : null;
}

export function getNodeDate(node: any): string {
  return node?.completeDate || node?.planDate || node?.dueDate || '';
}

export function isReviewTimelineNode(node: any, inferKeyFn = inferKey): boolean {
  if (!node) return false;
  const key = node.key || (typeof inferKeyFn === 'function' ? inferKeyFn(node) : '');
  return node.type === 'review' || key === 'r1_comments' || key === 'r2_comments';
}

export function getReviewDecisionLabel(decision: string): string {
  if (decision === 'major') return t('majorRevision');
  if (decision === 'minor') return t('minorRevision');
  return '';
}

export function getLatestTimelineNode(nodes: any[] = []): any | null {
  const datedNodes = nodes
    .filter(getNodeDate)
    .sort((a, b) => new Date(getNodeDate(b)).getTime() - new Date(getNodeDate(a)).getTime());

  if (datedNodes.length) return datedNodes[0];

  return [...nodes].reverse().find((node) =>
    node.status === 'active' ||
    node.status === 'completed' ||
    node.status === 'blocked' ||
    node.status === 'danger'
  ) || nodes[0] || null;
}

export function createTimelineNode(subId: string, values: any = {}): any {
  const now = new Date().toISOString();
  return {
    id: `node_${subId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: (values.name || t('untitledEvent')).trim(),
    type: values.type || 'research',
    key: values.key || 'auto',
    status: values.status || 'pending',
    planDate: values.planDate || '',
    dueDate: values.dueDate || '',
    completeDate: values.completeDate || '',
    notes: values.notes || '',
    createdAt: now,
    updatedAt: now
  };
}
