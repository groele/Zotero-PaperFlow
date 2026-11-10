/** Build interactive controls without passing them through chrome HTML parsing. */
declare function t(key: string): string;

export function mountPipelineActions(card: HTMLElement, submissionId: string, title: string): void {
  const actions = card.querySelector('.pipeline-actions');
  if (!actions) return;
  const doc = card.ownerDocument;
  const buttons = [
    ['open', 'openSubmissionDetails'],
    ['add', 'addEvent'],
    ['manage', 'manageEvents'],
    ['share', 'shareJourney'],
  ].map(([action, labelKey]) => {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = `btn-secondary btn-sm btn-pipeline-${action}`;
    button.dataset.subId = submissionId;
    button.textContent = t(labelKey);
    button.setAttribute('aria-label', `${t(labelKey)}: ${title}`);
    if (action === 'share') button.title = t(labelKey);
    return button;
  });
  actions.replaceChildren(...buttons);
}
