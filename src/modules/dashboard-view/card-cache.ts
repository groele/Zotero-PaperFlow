interface CardRecord {
  key: string;
  signature: string;
  create: () => HTMLElement;
}

const caches = new WeakMap<HTMLElement, Map<string, { signature: string; card: HTMLElement }>>();

export function reconcilePipelineCards(container: HTMLElement, records: CardRecord[]): void {
  const previous = caches.get(container);
  const next = new Map<string, { signature: string; card: HTMLElement }>();
  const keptCards = new Set<HTMLElement>();
  const cards = records.map(record => {
    const cached = previous?.get(record.key);
    const entry = cached?.signature === record.signature
      ? cached : { signature: record.signature, card: record.create() };
    next.set(record.key, entry);
    keptCards.add(entry.card);
    return entry.card;
  });
  if (previous) {
    const disposeCard = typeof globalThis !== 'undefined'
      ? (globalThis as any).disposePipelineCardInteractions
      : null;
    if (typeof disposeCard === 'function') {
      for (const oldEntry of previous.values()) {
        if (!keptCards.has(oldEntry.card)) {
          disposeCard(oldEntry.card);
        }
      }
    }
  }
  const existing = Array.from(container.children);
  if (existing.length !== cards.length || existing.some((card, index) => card !== cards[index])) {
    container.replaceChildren(...cards);
  }
  caches.set(container, next);
}
