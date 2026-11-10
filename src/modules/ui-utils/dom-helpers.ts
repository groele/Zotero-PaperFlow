/**
 * Zotero PaperFlow - DOM Sanitization, Search, Lazy View & FLIP Micro-animation Helpers
 */
import { cleanText } from './data-helpers.js';

export function normalizeSearchText(value: any): string {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function matchesSubmissionSearch(text: any, status: any, terms: string[] = [], statusFilter = 'all'): boolean {
  const normalizedStatus = cleanText(status || 'submitted', 40).toLowerCase().replace(/[\s-]+/g, '_');
  const filter = cleanText(statusFilter || 'all', 40).toLowerCase();
  const statusMatches = filter === 'all'
    || (filter === 'active' && ['submitted', 'under_review', 'revision'].includes(normalizedStatus))
    || (filter === 'accepted' && ['accepted', 'published'].includes(normalizedStatus))
    || normalizedStatus === filter;
  if (!statusMatches) return false;
  const activeTerms = Array.isArray(terms) ? terms.filter(Boolean) : [];
  if (!activeTerms.length) return true;
  const haystack = normalizeSearchText(text);
  return activeTerms.every((term) => haystack.includes(term));
}

function getSafeDomDocument(target?: any): Document | null {
  if (target?.ownerDocument) return target.ownerDocument;
  if (typeof document !== 'undefined') return document;
  return null;
}

function sanitizeDomTree(root: any): void {
  const blockedTags = new Set(['script', 'iframe', 'object', 'embed', 'meta', 'base',
    'link', 'style', 'template', 'foreignobject', 'animate', 'animatetransform', 'set']);
  const urlAttrs = new Set(['href', 'src', 'xlink:href', 'formaction', 'action', 'poster']);
  const walk = (node: any) => {
    for (const child of Array.from(node.childNodes || []) as any[]) {
      if (child.nodeType !== 1) continue;
      const tag = String(child.tagName || '').toLowerCase();
      if (blockedTags.has(tag)) {
        child.remove();
        continue;
      }
      for (const attr of Array.from(child.attributes || []) as any[]) {
        const name = String(attr.name || '').toLowerCase();
        const value = String(attr.value || '').trim();
        const compactValue = value.replace(/[\u0000-\u0020\u007f]/g, '');
        if (name.startsWith('on') || name === 'srcdoc' || name === 'srcset'
          || (name === 'style' && /url\s*\(|expression\s*\(|-moz-binding|@import/i.test(value))) {
          child.removeAttribute(attr.name);
        } else if (urlAttrs.has(name) && /^(?:javascript:|vbscript:|data:(?!image\/(?:png|jpeg|gif|webp);))/i.test(compactValue)) {
          child.removeAttribute(attr.name);
        }
      }
      walk(child);
    }
  };
  walk(root);
}

export function createFragment(doc: any, html: any): DocumentFragment {
  const ownerDocument = doc?.createRange ? doc : getSafeDomDocument(doc);
  const Parser = ownerDocument?.defaultView?.DOMParser
    || (typeof DOMParser !== 'undefined' ? DOMParser : null);
  if (Parser && ownerDocument?.createDocumentFragment && ownerDocument?.importNode) {
    // DOMParser uses an inert document. Chrome Range parsing drops form controls.
    const parsed = new Parser().parseFromString(String(html ?? ''), 'text/html');
    sanitizeDomTree(parsed.body);
    const fragment = ownerDocument.createDocumentFragment();
    for (const child of Array.from(parsed.body.childNodes)) {
      fragment.appendChild(ownerDocument.importNode(child, true));
    }
    return fragment;
  }
  if (!ownerDocument?.createRange) {
    throw new Error('Document range parser unavailable');
  }
  const range = ownerDocument.createRange();
  range.selectNode(ownerDocument.body || ownerDocument.documentElement);
  const fragment = range.createContextualFragment(String(html ?? ''));
  sanitizeDomTree(fragment);
  return fragment;
}

export function setHTML(element: any, html: any): void {
  if (!element) return;
  const text = String(html ?? '');
  const ownerDocument = getSafeDomDocument(element);
  if (typeof element.replaceChildren === 'function' && ownerDocument?.createRange) {
    if (!text) {
      element.replaceChildren();
      return;
    }
    element.replaceChildren(createFragment(ownerDocument, text));
    return;
  }
  if ('innerHTML' in element) {
    element.innerHTML = text;
  }
}

export function getDirtyViewsSet(): Set<string> {
  const g: any = typeof window !== 'undefined' ? window : globalThis;
  if (!(g._dirtyViews instanceof Set)) {
    g._dirtyViews = new Set<string>();
  }
  return g._dirtyViews;
}

/**
 * Checks whether a workspace view is currently inactive in a multi-view layout
 * so background renders can be deferred until the user switches to that tab.
 * Returns false in unit test harnesses where `.content-view` is absent.
 */
export function isViewDeferred(viewId: string): boolean {
  if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return false;
  const viewEl = document.getElementById(viewId);
  if (!viewEl || !viewEl.classList || typeof viewEl.classList.contains !== 'function') return false;
  if (!viewEl.classList.contains('content-view')) return false;
  if (viewEl.classList.contains('active')) {
    getDirtyViewsSet().delete(viewId);
    return false;
  }
  getDirtyViewsSet().add(viewId);
  return true;
}

export function prefersReducedMotion(): boolean {
  // Workspace motion is intentionally restrained, independently of OS settings.
  if (typeof document !== 'undefined' && document.documentElement?.dataset?.motion !== 'full') return true;
  try {
    return Boolean(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  } catch (_) {
    return false;
  }
}

export function animateMetricValue(el: any, nextValue: any): void {
  if (!el) return;
  const nextText = String(nextValue ?? '');
  const prevText = String(el.textContent ?? '');
  el.textContent = nextText;
  if (prevText && prevText !== nextText && !prefersReducedMotion() && el.classList?.add) {
    el.classList.remove('stat-value-updated');
    void el.offsetWidth;
    el.classList.add('stat-value-updated');
  }
}

export function captureElementRects(container: any, selector: string, keyAttr: string): Map<string, any> {
  const rects = new Map<string, any>();
  if (!container || prefersReducedMotion() || typeof container.querySelectorAll !== 'function') return rects;
  try {
    container.querySelectorAll(selector).forEach((el: any) => {
      const key = el.getAttribute?.(keyAttr) || el.dataset?.[keyAttr] || el.id;
      if (key && typeof el.getBoundingClientRect === 'function') {
        const r = el.getBoundingClientRect();
        if (r && (r.width > 0 || r.height > 0)) {
          rects.set(String(key), r);
        }
      }
    });
  } catch (_) {}
  return rects;
}

export function playFlipAnimation(
  container: any,
  selector: string,
  keyAttr: string,
  prevRects: Map<string, any>,
  highlightClass = ''
): void {
  if (!container || !prevRects || prevRects.size === 0 || prefersReducedMotion()) return;
  if (typeof container.querySelectorAll !== 'function') return;
  try {
    container.querySelectorAll(selector).forEach((el: any) => {
      const key = el.getAttribute?.(keyAttr) || el.dataset?.[keyAttr] || el.id;
      if (!key || !prevRects.has(String(key)) || typeof el.getBoundingClientRect !== 'function') return;
      const first = prevRects.get(String(key));
      const last = el.getBoundingClientRect();
      const dx = (first.left || 0) - (last.left || 0);
      const dy = (first.top || 0) - (last.top || 0);
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      if (el.style) {
        el.style.transition = 'none';
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        void el.offsetWidth;
        el.style.transition = 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = 'translate(0, 0)';
        setTimeout(() => {
          if (el.style) {
            el.style.transition = '';
            el.style.transform = '';
          }
        }, 260);
      }
      if (highlightClass && el.classList?.add) {
        el.classList.remove(highlightClass);
        void el.offsetWidth;
        el.classList.add(highlightClass);
        setTimeout(() => el.classList?.remove?.(highlightClass), 700);
      }
    });
  } catch (_) {}
}
