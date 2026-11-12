/**
 * Zotero PaperFlow - Timeline Node Helpers, Date Calculations & Node Factories
 */

declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function inferKey(node: any): string;

export const defaultTimelineNameKeys: Record<string, string> = {
  'Experiments Started': 'defaultExperimentsStarted',
  '实验开始': 'defaultExperimentsStarted',
  'Research Started': 'defaultResearchStarted',
  '研究启动': 'defaultResearchStarted',
  'Experiments Completed': 'defaultExperimentsCompleted',
  '实验完成': 'defaultExperimentsCompleted',
  'Data Organization': 'defaultDataOrganization',
  '数据整理': 'defaultDataOrganization',
  'Draft Completed': 'defaultDraftCompleted',
  'First Draft Completed': 'defaultFirstDraftCompleted',
  '初稿完成': 'defaultDraftCompleted',
  'Manuscript Submitted': 'defaultManuscriptSubmitted',
  '手稿已投稿': 'defaultManuscriptSubmitted',
  'Submitted': 'defaultSubmitted',
  '已投稿': 'defaultSubmitted',
  'Review Comments R1': 'defaultReviewCommentsR1',
  'R1 审稿意见': 'defaultReviewCommentsR1',
  '收到 R1 审稿意见': 'defaultReviewCommentsR1',
  'R1 Revision Submitted': 'defaultR1RevisionSubmitted',
  'R1 修改稿已提交': 'defaultR1RevisionSubmitted',
  'R1 修回已提交': 'defaultR1RevisionSubmitted',
  'Review Comments R2': 'defaultReviewCommentsR2',
  'R2 审稿意见': 'defaultReviewCommentsR2',
  '收到 R2 审稿意见': 'defaultReviewCommentsR2',
  'R2 Revision Submitted': 'defaultR2RevisionSubmitted',
  'R2 修改稿已提交': 'defaultR2RevisionSubmitted',
  'R2 修回已提交': 'defaultR2RevisionSubmitted',
  'Accepted': 'defaultAccepted',
  '已接收': 'defaultAccepted',
  'Online Publication': 'defaultOnlinePublication',
  '网络见刊': 'defaultOnlinePublication',
  '上线发表': 'defaultOnlinePublication',
  'Online': 'defaultOnlinePublication',
  'Rejected': 'statusRejected',
  '已拒稿': 'statusRejected',
  'Proof': 'defaultProof',
  '校样': 'defaultProof'
};

export function getTimelineNodeDisplayName(node: any): string {
  const rawName = (node?.name || '').trim();
  if (!rawName) return t('untitledEvent');
  const defaultKey = defaultTimelineNameKeys[rawName];
  return defaultKey ? t(defaultKey) : rawName;
}

export function formatLocalDateParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseCalendarDateParts(value: any): { year: number; month: number; day: number } | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.000)?Z$)/);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]);
      const day = Number(dateOnlyMatch[3]);
      const check = new Date(Date.UTC(year, month - 1, day));
      if (check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day) {
        return { year, month, day };
      }
      return null;
    }
  }
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function diffCalendarDays(startValue: any, endValue: any): number | null {
  const start = parseCalendarDateParts(startValue);
  const end = parseCalendarDateParts(endValue);
  if (!start || !end) return null;
  const utcStart = Date.UTC(start.year, start.month - 1, start.day);
  const utcEnd = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((utcEnd - utcStart) / 86400000);
}

export function getDaysDiff(dateStr1: any, dateStr2: any): number | null {
  const diff = diffCalendarDays(dateStr1, dateStr2);
  return diff === null ? null : Math.max(0, diff);
}

export function getRelativeDateLabel(dateStr: any): string {
  const diff = diffCalendarDays(dateStr, todayString());
  if (diff === null) return '';

  if (diff === 0) return t('relativeToday');
  if (diff > 0) return tf('relativeDaysAgo', { count: diff });
  return tf('relativeInDays', { count: Math.abs(diff) });
}

export function todayString(): string {
  const parts = parseCalendarDateParts(new Date())!;
  return formatLocalDateParts(parts.year, parts.month, parts.day);
}

export function normalizeDateString(value: any): string {
  const parts = parseCalendarDateParts(value);
  return parts ? formatLocalDateParts(parts.year, parts.month, parts.day) : '';
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
