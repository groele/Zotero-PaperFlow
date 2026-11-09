/**
 * Zotero PaperFlow - iCalendar (.ics) Feed Generator & Deadline Calendar Exporter
 */
import { getRevisionCountdownMeta } from './status-lifecycle.js';

declare function getSubmissionJournalName(sub: any): string;
declare function getSubmissionReviewMatrixRows(sub: any): any[];
declare function escapeLatex(value: any): string;

export function formatIcsDate(dateStr: any): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function formatIcsDateTime(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function escapeIcsText(str: any): string {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function generateSubmissionCalendarFeed(submissions: any, manuscripts: any[] = [], options: any = {}): string {
  const subs = Array.isArray(submissions) ? submissions : [submissions].filter(Boolean);
  const nowStamp = formatIcsDateTime(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zotero Flow//Zotero PaperFlow//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + escapeIcsText(options.calName || 'PaperFlow Revision Deadlines'),
    'X-WR-TIMEZONE:UTC'
  ];

  subs.forEach((sub: any) => {
    const dueDate = sub.revisionDueDate || sub.revisionDeadline;
    if (!dueDate) return;

    const startDate = formatIcsDate(dueDate);
    if (!startDate) return;

    const dueObj = new Date(dueDate);
    dueObj.setUTCDate(dueObj.getUTCDate() + 1);
    const endDate = formatIcsDate(dueObj);

    const man = manuscripts.find((m: any) => m.id === sub.manuscriptId);
    const paperTitle = man?.title || sub.title || 'Untitled Manuscript';
    const journal = typeof getSubmissionJournalName === 'function' ? getSubmissionJournalName(sub) : (sub.targetJournal || sub.journal || 'Target Journal');
    const reviewRows = typeof getSubmissionReviewMatrixRows === 'function' ? getSubmissionReviewMatrixRows(sub) : (sub.reviewMatrix || []);
    const commentsCount = reviewRows.length;
    const answeredCount = reviewRows.filter((r: any) => (r.response || '').trim()).length;

    const uid = `paperflow-${sub.id}-${startDate}@zoteroflow`;
    const summary = `[PaperFlow 修回截止] ${journal}: ${paperTitle}`;

    const desc = `手稿: ${paperTitle}\n` +
      `目标期刊: ${journal}\n` +
      `当前状态: ${sub.status || 'revision'}\n` +
      `修回截止日期: ${dueDate}\n` +
      `审稿意见进度: 已回复 ${answeredCount}/${commentsCount} 条\n\n` +
      `请在 Zotero PaperFlow 中查阅同行评审回复矩阵与手稿修订时间轴。`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(desc)}`,
      `LOCATION:${escapeIcsText(journal)}`,
      'STATUS:CONFIRMED',
      'CATEGORIES:Academic,PaperFlow,Revision',
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(`[PaperFlow] 距离 ${journal} 修回截止还剩 7 天！`)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P3D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(`[PaperFlow 紧急] 距离 ${journal} 修回截止仅剩 3 天！`)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(`[PaperFlow 紧急] 明天是 ${journal} 修回最终截止日！`)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function triggerCalendarDownload(icsContent: string, filename = 'paperflow_deadlines.ics'): void {
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const RFCalendar = {
  getRevisionCountdownMeta,
  formatIcsDate,
  formatIcsDateTime,
  escapeIcsText,
  generateSubmissionCalendarFeed,
  triggerCalendarDownload
};

export function getExportedEscapeLatex(): any {
  return typeof escapeLatex === 'function' ? escapeLatex : undefined;
}
