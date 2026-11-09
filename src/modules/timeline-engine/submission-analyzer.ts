import {
  inferKey,
  hasPublicationStatus,
  normalizeSubmissionTimeline,
} from './normalizer-and-analyzer.js';

declare function t(key: string): string;
declare function tf(key: string, vars?: any): string;
declare function normalizeDateString(dateStr: any): string;
declare function todayString(): string;
declare function getNodeDate(node: any): string;
declare function getLatestTimelineNode(nodes: any[]): any;
declare function getDaysDiff(startDateStr: any, endDateStr: any): number | null;
declare function formatShortDate(dateStr: any): string;
declare function isDarkThemeActive(): boolean;
declare function normalizeSubmissionStatus(value: any): string;
declare function getSubmissionStatusLabel(status: any): string;

export function analyzeSubmission(sub: any): any {
  normalizeSubmissionTimeline(sub);
  const events = [...(sub.timelineNodes || [])].sort((a: any, b: any) => {
    const da = a.completeDate || a.planDate || a.dueDate || a.createdAt || '';
    const dbDate = b.completeDate || b.planDate || b.dueDate || b.createdAt || '';
    return new Date(da).getTime() - new Date(dbDate).getTime();
  });

  const getKeyEventDate = (key: string) => {
    const node = events.find((e: any) => inferKey(e) === key);
    const w = window as any;
    const nodeDate = node ? normalizeDateString(w.RFUI?.getTimelineEventDate?.(node, key)) : null;
    if (key === 'submit') return normalizeDateString(sub.submissionDate) || nodeDate;
    if (key === 'r1_comments') return normalizeDateString(sub.firstDecisionDate) || nodeDate;
    if (key === 'accept' || key === 'online') {
      return normalizeDateString(sub.decisionDate) && hasPublicationStatus(sub)
        ? normalizeDateString(sub.decisionDate)
        : nodeDate;
    }
    return nodeDate;
  };

  const datedResearchEvent = events.find((e: any) => e.type === 'research' && getNodeDate(e));
  const experimentStartDate = getKeyEventDate('experiment_start');
  const experimentDate = getKeyEventDate('experiment_done') || (datedResearchEvent ? getNodeDate(datedResearchEvent) : null);
  const submitDate = getKeyEventDate('submit');
  const submitNode = events.find((e: any) => inferKey(e) === 'submit');
  const submitDateSource = normalizeDateString(sub.submissionDate)
    ? t('dateSourceSubmission')
    : (normalizeDateString(getNodeDate(submitNode)) ? t('dateSourceTimeline') : t('dateSourceMissing'));
  const r1Date = getKeyEventDate('r1_comments');
  const acceptDate = getKeyEventDate('accept');
  const onlineDate = getKeyEventDate('online');

  const latest = getLatestTimelineNode(sub.timelineNodes || []);
  const accepted = Boolean(acceptDate) || hasPublicationStatus(sub);

  const expToSubmit = experimentDate && submitDate ? getDaysDiff(experimentDate, submitDate) : null;
  const submitToNow = submitDate && !accepted ? getDaysDiff(submitDate, todayString()) : null;
  const r1ToNow = r1Date && !accepted ? getDaysDiff(r1Date, todayString()) : null;
  const submitToAccept = submitDate && acceptDate ? getDaysDiff(submitDate, acceptDate) : null;
  const acceptToOnline = acceptDate && onlineDate ? getDaysDiff(acceptDate, onlineDate) : null;

  let display: any = {
    mode: 'prepare',
    label: t('displayPrepareLabel'),
    value: expToSubmit,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    caption: t('displayPrepareCaption'),
    pending: false,
    milestones: [
      { name: t('milestoneExperimentStart'), date: experimentStartDate, color: '#0891b2', emphasis: true, node: events.find((e: any) => inferKey(e) === 'experiment_start') },
      { name: t('milestoneExperimentDone'), date: experimentDate, color: '#2563eb', emphasis: true, node: events.find((e: any) => inferKey(e) === 'experiment_done') },
      { name: t('milestoneSubmission'), date: submitDate, color: '#f97316', emphasis: true, node: events.find((e: any) => inferKey(e) === 'submit') },
    ],
  };

  if (accepted) {
    display = {
      mode: 'accepted',
      label: t('displayAcceptedLabel'),
      value: submitToAccept,
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      caption: t('displayAcceptedCaption'),
      pending: false,
      milestones: [
        { name: t('milestoneSubmission'), date: submitDate, color: '#f97316', emphasis: true, node: events.find((e: any) => inferKey(e) === 'submit') },
        { name: t('milestoneAcceptance'), date: acceptDate, color: '#16a34a', emphasis: true, node: events.find((e: any) => inferKey(e) === 'accept') },
      ],
    };
  } else if (r1Date) {
    display = {
      mode: 'r1-active',
      label: t('displayR1Label'),
      value: r1ToNow,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      caption: t('displayR1Caption'),
      pending: true,
      milestones: [
        { name: t('milestoneSubmission'), date: submitDate, color: '#f97316', emphasis: false, node: events.find((e: any) => inferKey(e) === 'submit') },
        { name: t('milestoneR1Comments'), date: r1Date, color: '#dc2626', emphasis: true, node: events.find((e: any) => inferKey(e) === 'r1_comments') },
        { name: t('milestoneToday'), date: todayString(), color: '#dc2626', emphasis: true, today: true },
      ],
    };
  } else if (submitDate) {
    display = {
      mode: 'under-review',
      label: t('displayReviewLabel'),
      value: submitToNow,
      color: '#f97316',
      bg: '#fff7ed',
      border: '#fed7aa',
      caption: t('displayReviewCaption'),
      pending: true,
      milestones: [
        { name: t('milestoneSubmission'), date: submitDate, color: '#f97316', emphasis: true, node: events.find((e: any) => inferKey(e) === 'submit') },
        { name: t('milestoneToday'), date: todayString(), color: '#f97316', emphasis: true, today: true },
      ],
    };
  }

  const isDarkMode = isDarkThemeActive();
  if (isDarkMode) {
    if (display.mode === 'prepare') {
      display.bg = 'rgba(37,99,235,0.08)';
      display.border = 'rgba(37,99,235,0.3)';
    } else if (display.mode === 'accepted') {
      display.bg = 'rgba(22,163,74,0.08)';
      display.border = 'rgba(22,163,74,0.3)';
    } else if (display.mode === 'r1-active') {
      display.bg = 'rgba(220,38,38,0.08)';
      display.border = 'rgba(220,38,38,0.3)';
    } else if (display.mode === 'under-review') {
      display.bg = 'rgba(249,115,22,0.08)';
      display.border = 'rgba(249,115,22,0.3)';
    }
  }

  const explicitStatus = normalizeSubmissionStatus(sub.status || 'submitted');
  const statusPresentation = ({
    submitted: { label: t('stateSubmitted'), color: '#64748b' },
    under_review: { label: t('stateUnderReview'), color: '#0891b2' },
    revision: { label: getSubmissionStatusLabel('revision'), color: '#d97706' },
    accepted: { label: t('stateAccepted'), color: '#16a34a' },
    published: { label: t('stateOnline'), color: '#15803d' },
    rejected: { label: getSubmissionStatusLabel('rejected'), color: '#dc2626' },
  } as Record<string, { label: string; color: string }>)[explicitStatus] || { label: t('statePreparing'), color: '#64748b' };
  const stateLabel = statusPresentation.label;
  const stateColor = statusPresentation.color;
  let stateNote = submitDate ? tf('stateSinceSubmit', { count: submitToNow ?? '—' }) : t('stateNotSubmitted');
  if (explicitStatus === 'revision' && r1Date) stateNote = tf('stateSinceR1', { count: r1ToNow ?? '—' });
  if (explicitStatus === 'accepted' && acceptDate) stateNote = formatShortDate(acceptDate);
  if (explicitStatus === 'published' && onlineDate) stateNote = formatShortDate(onlineDate);

  return { events, experimentStartDate, experimentDate, submitDate, submitDateSource, r1Date, acceptDate, onlineDate, latest, accepted, expToSubmit, submitToNow, r1ToNow, submitToAccept, acceptToOnline, display, stateLabel, stateColor, stateNote };
}
