/**
 * Zotero PaperFlow - Publication Links, Node Status, Revision Countdown & Lifecycle
 */
import { inferKey, analyzeSubmission, hasPublicationStatus } from './normalizer-and-analyzer.js';

declare var currentLanguage: string;
declare function t(key: string): string;
declare function normalizeDateString(dateStr: any): string;

export function isAcceptedSubmission(sub: any): boolean {
  return Boolean(sub && analyzeSubmission(sub).accepted);
}

export function canHavePublicationLink(sub: any): boolean {
  if (!sub) return false;
  if (hasPublicationStatus(sub)) return true;
  if (normalizeDateString(sub.acceptedAt || sub.publishedAt)) return true;
  return isAcceptedSubmission(sub);
}

export function clearPublicationLinkFields(sub: any): boolean {
  if (!sub) return false;
  let changed = false;
  ['doi', 'DOI', 'articleDoi', 'articleUrl', 'publicationUrl', 'journalArticleUrl'].forEach((field) => {
    if (sub[field]) {
      sub[field] = null;
      changed = true;
    }
  });
  return changed;
}

export function clearPublicationTimelineCompletion(sub: any): boolean {
  if (!sub || !Array.isArray(sub.timelineNodes)) return false;
  let changed = false;
  sub.timelineNodes.forEach((node: any) => {
    if (inferKey(node) !== 'accept' && inferKey(node) !== 'online') return;
    if (node.completeDate) {
      node.completeDate = '';
      changed = true;
    }
    if (node.status === 'completed') {
      node.status = 'pending';
      changed = true;
    }
  });
  return changed;
}

export function clearUnacceptedPublicationLinks(database: any): boolean {
  if (!database || !Array.isArray(database.submissions)) return false;
  let changed = false;
  database.submissions.forEach((sub: any) => {
    if (!canHavePublicationLink(sub)) {
      changed = clearPublicationLinkFields(sub) || changed;
    }
  });
  return changed;
}

export function getSubmissionCycleTime(sub: any): { days: number; isCompleted: boolean; startDateStr: string; endDateStr: string } {
  const start = sub.submissionDate ? new Date(sub.submissionDate) : (sub.createdAt ? new Date(sub.createdAt) : new Date());
  const isCompleted = sub.status === 'accepted' || sub.status === 'published';
  let end = new Date();

  if (isCompleted) {
    if (sub.decisionDate) {
      end = new Date(sub.decisionDate);
    } else {
      const completionNode = sub.timelineNodes?.find((n: any) => {
        if (!n.name || !n.completeDate) return false;
        const nodeName = n.name.toLowerCase();
        return n.name.includes('接收') || nodeName.includes('accept') || nodeName.includes('online');
      });
      if (completionNode) {
        end = new Date(completionNode.completeDate);
      } else if (sub.updatedAt) {
        end = new Date(sub.updatedAt);
      }
    }
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    days: diffDays,
    isCompleted,
    startDateStr: start.toLocaleDateString(),
    endDateStr: end.toLocaleDateString()
  };
}

export function computeNodeStatus(node: any): string {
  if (node.completeDate || node.status === 'completed') return 'completed';
  if (node.status === 'danger' || node.status === 'blocked') return 'blocked';

  if (node.dueDate) {
    const dueTime = new Date(node.dueDate).getTime();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'due_soon';
  }

  if (node.status === 'active') return 'in_progress';
  if (node.status === 'pending') return 'not_started';
  return 'upcoming';
}

export function getNodeStatusLabel(status: string): string {
  const keyMap: Record<string, string> = {
    completed: 'statusCompleted',
    blocked: 'statusBlocked',
    overdue: 'statusOverdue',
    due_soon: 'statusDueSoon',
    in_progress: 'statusInProgress',
    not_started: 'statusPlannedNotStarted',
    upcoming: 'statusUpcoming'
  };
  return t(keyMap[status] || 'statusUpcoming');
}

export function autoSortNodes(nodes: any[]): any[] {
  return [...nodes].sort((a: any, b: any) => {
    const getDate = (n: any) => n.completeDate || n.planDate || n.dueDate || n.createdAt || '';
    const da = getDate(a);
    const dbDate = getDate(b);
    if (!da && !dbDate) return 0;
    if (!da) return 1;
    if (!dbDate) return -1;
    return new Date(da).getTime() - new Date(dbDate).getTime();
  });
}

export function getCapsuleIcon(status: string, _type?: string): string {
  if (status === 'completed') return '✓';
  if (status === 'blocked') return '✕';
  if (status === 'overdue') return '🔴';
  if (status === 'due_soon') return '⚠';
  if (status === 'in_progress') return '●';
  if (status === 'not_started' || status === 'upcoming') return '◯';
  if (status === 'milestone') return '⭐';
  return '◯';
}

export function formatShortDate(dateStr: any): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const locale = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
    return d.toLocaleDateString(locale, currentLanguage === 'zh'
      ? { month: 'numeric', day: 'numeric' }
      : { month: 'short', day: 'numeric' });
  } catch (_) {
    return '';
  }
}

export function getRevisionCountdownMeta(dueDate: any): any | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return null;
  const now = new Date();
  const utcDue = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((utcDue - utcNow) / 86400000);
  const isZh = typeof currentLanguage !== 'undefined' ? currentLanguage === 'zh' : true;

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      days: diffDays,
      level: 'overdue',
      badgeClass: 'badge-danger',
      icon: '🚨',
      text: isZh ? `已逾期 ${overdueDays} 天` : `${overdueDays}d overdue`,
      title: isZh
        ? `该稿件修回已超出截止日期 ${overdueDays} 天，建议尽快提交或联系编辑申请延期`
        : `Revision is ${overdueDays} days past due. Submit ASAP or request an extension.`
    };
  }
  if (diffDays === 0) {
    return {
      days: 0,
      level: 'due_today',
      badgeClass: 'badge-danger',
      icon: '🚨',
      text: isZh ? '今天截止' : 'Due today',
      title: isZh
        ? '今天是修回最后截止日！请确认修订稿与回复信已准备就绪'
        : 'Revision deadline is TODAY! Ensure revisions and rebuttals are ready.'
    };
  }
  if (diffDays <= 7) {
    return {
      days: diffDays,
      level: 'due_soon',
      badgeClass: 'badge-warning',
      icon: '⚠️',
      text: isZh ? `仅剩 ${diffDays} 天` : `${diffDays}d left`,
      title: isZh
        ? `距离修回截止仅剩 ${diffDays} 天，请抓紧完善审稿回复与修改`
        : `${diffDays} days left until revision deadline. Finalize responses promptly.`
    };
  }
  return {
    days: diffDays,
    level: 'upcoming',
    badgeClass: 'badge-info',
    icon: '📅',
    text: isZh ? `剩 ${diffDays} 天` : `${diffDays}d left`,
    title: isZh
      ? `修回截止日期：${dueDate}（还剩 ${diffDays} 天）`
      : `Revision due date: ${dueDate} (${diffDays} days remaining)`
  };
}
