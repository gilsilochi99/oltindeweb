// Which premium features each company category can use. Being Premium is
// still required; these rules narrow a feature to some categories (e.g.
// Alquileres only for real-estate agencies and car-rental companies).
// Plain module: used by server actions, the dashboard and the admin page.

export const PREMIUM_FEATURES = {
  shop: 'Tienda online',
  rentals: 'Alquileres',
  offers: 'Ofertas',
  announcements: 'Anuncios',
  documents: 'Documentos',
  jobs: 'Empleos',
  events: 'Eventos',
  menu: 'Menú de restaurante',
} as const;

export type PremiumFeature = keyof typeof PREMIUM_FEATURES;
export const PREMIUM_FEATURE_KEYS = Object.keys(PREMIUM_FEATURES) as PremiumFeature[];

/** 'all': every Premium company. 'categories': only Premium companies in these categories. */
export type PremiumFeatureRule = { mode: 'all' } | { mode: 'categories'; categories: string[] };
export type PremiumFeatureRules = Partial<Record<PremiumFeature, PremiumFeatureRule>>;

export type CompanyFeatureAccess = Record<PremiumFeature, boolean>;

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

// Before any rule is saved the menu keeps its original behaviour: restaurants only.
const isRestaurant = (category: string) => norm(category).includes('restaurant');

/** Whether a company in this category may use the feature (Premium aside). */
export function categoryAllowsFeature(rules: PremiumFeatureRules | undefined, feature: PremiumFeature, category: string | undefined): boolean {
  const rule = rules?.[feature];
  if (!rule) return feature === 'menu' ? isRestaurant(category ?? '') : true;
  if (rule.mode === 'all') return true;
  const c = norm(category ?? '');
  return !!c && rule.categories.some(x => norm(x) === c);
}

export function featureAccessFor(rules: PremiumFeatureRules | undefined, category: string | undefined): CompanyFeatureAccess {
  return Object.fromEntries(PREMIUM_FEATURE_KEYS.map(f => [f, categoryAllowsFeature(rules, f, category)])) as CompanyFeatureAccess;
}

/** Validates rules read from storage or sent by the admin page. */
export function parsePremiumFeatureRules(raw: unknown): PremiumFeatureRules {
  const out: PremiumFeatureRules = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const f of PREMIUM_FEATURE_KEYS) {
    const r = (raw as Record<string, unknown>)[f] as { mode?: unknown; categories?: unknown } | undefined;
    if (!r || typeof r !== 'object') continue;
    if (r.mode === 'all') out[f] = { mode: 'all' };
    else if (r.mode === 'categories' && Array.isArray(r.categories)) {
      const cats = [...new Set(r.categories.filter((c): c is string => typeof c === 'string' && c.trim().length > 0).map(c => c.trim().slice(0, 255)))].slice(0, 500);
      out[f] = { mode: 'categories', categories: cats };
    }
  }
  return out;
}

/**
 * The check pages and actions use: Premium, and the category allows it.
 * `premiumFeatures` is filled in when the company is loaded for its owner;
 * if it is missing (older callers) only Premium is required.
 */
export function companyHasFeature(company: { isPremium?: boolean; premiumFeatures?: Partial<CompanyFeatureAccess> }, feature: PremiumFeature): boolean {
  return !!company.isPremium && company.premiumFeatures?.[feature] !== false;
}
