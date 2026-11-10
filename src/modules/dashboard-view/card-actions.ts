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
    button.setAttribute('aria-label', `${t(labelKey)}: ${title}`);
    if (action === 'share') {
      button.title = t(labelKey);
      if (typeof (doc as any).createElementNS === 'function') {
        const svg = (doc as any).createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('width', '13');
        svg.setAttribute('height', '13');
        const c1 = (doc as any).createElementNS('http://www.w3.org/2000/svg', 'circle');
        c1.setAttribute('cx', '18'); c1.setAttribute('cy', '5'); c1.setAttribute('r', '3');
        const c2 = (doc as any).createElementNS('http://www.w3.org/2000/svg', 'circle');
        c2.setAttribute('cx', '6'); c2.setAttribute('cy', '12'); c2.setAttribute('r', '3');
        const c3 = (doc as any).createElementNS('http://www.w3.org/2000/svg', 'circle');
        c3.setAttribute('cx', '18'); c3.setAttribute('cy', '19'); c3.setAttribute('r', '3');
        const p = (doc as any).createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', 'm8.6 10.5 6.8-4M8.6 13.5l6.8 4');
        svg.append(c1, c2, c3, p);
        const span = doc.createElement('span');
        span.textContent = t(labelKey);
        if (typeof (button as any).replaceChildren === 'function') {
          (button as any).replaceChildren(svg, span);
        } else {
          button.append(svg, span);
        }
      } else {
        button.textContent = t(labelKey);
      }
    } else {
      button.textContent = t(labelKey);
    }
    return button;
  });
  actions.replaceChildren(...buttons);
}
