/**
 * Zotero PaperFlow - Theme, Status & Workflow Normalization Helpers
 */
import { EN_CORE } from './en-core.js';
import { EN_WORKFLOW } from './en-workflow.js';
import { ZH_CORE } from './zh-core.js';
import { ZH_WORKFLOW } from './zh-workflow.js';

declare var db: any;
declare var currentLanguage: string;
declare var UI_THEME_OPTIONS: Set<string>;
declare var Zotero: any;
declare function normalizeWorkflowFields(record: any): boolean;

export const I18N: Record<string, Record<string, string>> = {
  en: { ...EN_CORE, ...EN_WORKFLOW },
  zh: { ...ZH_CORE, ...ZH_WORKFLOW }
};

export function t(key: string): string {
  const lang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'en';
  return I18N[lang]?.[key] || I18N.en[key] || key;
}

export function tf(key: string, vars: Record<string, any> = {}): string {
  return t(key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

export function normalizeThemePreference(value: any): string {
  const normalized = String(value || 'system').trim().toLowerCase();
  const opts = typeof UI_THEME_OPTIONS !== 'undefined' ? UI_THEME_OPTIONS : new Set(['system', 'light', 'dark']);
  return opts.has(normalized) ? normalized : 'system';
}

export function resolvePreferredLanguage(): string {
  if (typeof db !== 'undefined' && (db?.settings?.profile?.language === 'zh' || db?.settings?.profile?.language === 'en')) {
    return db.settings.profile.language;
  }
  try {
    const zotero = (typeof Zotero !== 'undefined' ? Zotero : null) || (typeof window !== 'undefined' ? ((window as any).Zotero || (window.parent as any)?.Zotero) : null);
    if (zotero?.locale && String(zotero.locale).toLowerCase().startsWith('zh')) return 'zh';
    if (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('zh')) return 'zh';
  } catch (_) {}
  return 'en';
}

export function applyThemePreference(value: any): string {
  const theme = normalizeThemePreference(value);
  if (typeof document === 'undefined' || !document.documentElement) return theme;
  if (theme === 'system') {
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = 'light dark';
    try {
      const parentDoc = window.parent?.document?.documentElement;
      const isDarkParent =
        parentDoc?.classList?.contains('dark') ||
        parentDoc?.getAttribute('data-theme') === 'dark' ||
        parentDoc?.getAttribute('tz-theme') === 'dark' ||
        window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      if (isDarkParent) {
        document.documentElement.dataset.theme = 'dark';
        document.documentElement.style.colorScheme = 'dark';
      }
    } catch (_) {}
  } else {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }
  return theme;
}

export function isDarkThemeActive(): boolean {
  if (typeof document !== 'undefined' && document.documentElement?.dataset) {
    const explicitTheme = document.documentElement.dataset.theme;
    if (explicitTheme) return explicitTheme === 'dark';
  }
  return Boolean(typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
}

export function normalizeText(value: any): string {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeSubmissionStatus(value: any): string {
  const normalized = normalizeText(value).replace(/[\s-]+/g, '_');
  const aliases: Record<string, string> = {
    accept: 'accepted',
    accepted: 'accepted',
    online: 'published',
    publication: 'published',
    published: 'published',
    underreview: 'under_review',
    in_review: 'under_review',
    review: 'under_review',
    revise: 'revision',
    revision_required: 'revision',
    resubmit: 'revision',
    reject: 'rejected',
    rejected: 'rejected',
    submit: 'submitted'
  };
  const canonical = aliases[normalized] || normalized;
  return ['submitted', 'under_review', 'revision', 'accepted', 'published', 'rejected'].includes(canonical)
    ? canonical
    : 'submitted';
}

export function normalizeSubmissionStatuses(database: any): boolean {
  let changed = false;
  (database?.submissions || []).forEach((submission: any) => {
    if (typeof normalizeWorkflowFields === 'function') {
      changed = normalizeWorkflowFields(submission) || changed;
    }
    const canonical = normalizeSubmissionStatus(submission.status);
    if (submission.status !== canonical) {
      submission.status = canonical;
      submission.updatedAt = new Date().toISOString();
      changed = true;
    }
  });
  return changed;
}

export function normalizeDoi(value: any): string {
  return String(value || '').trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
}

export function extractDoiFromText(value: any): string {
  const match = String(value || '').match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return match ? normalizeDoi(match[0].replace(/[.,;)\]]+$/, '')) : '';
}

export function normalizeKanbanStatusClass(status: any): string {
  const normalized = normalizeText(status || 'planning').replace(/_/g, '-');
  if (['planning', 'idea', 'outline', 'data-collection'].includes(normalized)) return 'planning';
  if (['in-progress', 'figure-preparation', 'drafting', 'internal-review'].includes(normalized)) return 'drafting';
  if (['submitted', 'under-review', 'revision'].includes(normalized)) return 'submitted';
  if (['accepted', 'published'].includes(normalized)) return 'accepted';
  return 'planning';
}

export function getSubmissionStatusLabel(status: any): string {
  const canonicalStatus = normalizeSubmissionStatus(status);
  const lang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'en';
  const labels: Record<string, string> = {
    submitted: t('stateSubmitted'),
    under_review: t('stateUnderReview'),
    revision: t('eventTypeRevision'),
    accepted: t('stateAccepted'),
    published: lang === 'zh' ? '已发表' : 'Published',
    rejected: t('statusRejected')
  };
  return labels[canonicalStatus] || String(canonicalStatus || t('stateSubmitted')).replace(/_/g, ' ');
}

export function getManuscriptStatusLabel(status: any): string {
  const lang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'en';
  const labels: Record<string, string> = {
    planning: t('statusPlanning'),
    idea: t('statusIdea'),
    outline: t('statusOutline'),
    data_collection: lang === 'zh' ? '数据整理' : 'Data Collection',
    in_progress: t('statusInProgress'),
    figure_preparation: t('statusFiguresPrep'),
    drafting: t('statusDrafting'),
    internal_review: t('statusInternalReview'),
    submitted: getSubmissionStatusLabel('submitted'),
    under_review: getSubmissionStatusLabel('under_review'),
    revision: getSubmissionStatusLabel('revision'),
    accepted: getSubmissionStatusLabel('accepted'),
    published: getSubmissionStatusLabel('published'),
    rejected: getSubmissionStatusLabel('rejected')
  };
  return labels[status] || String(status || 'planning').replace(/_/g, ' ');
}
