// Directory search for the Oltinde assistant: what the search engine (the
// same one Búsqueda Inteligente used) finds for a question — as data, for the
// web and the app to show as cards, and as a Markdown list for older app
// versions that only read text. Used by src/lib/assistant.ts.
import { getPharmaciesOnDuty, getSearchIndexData } from './data';
import { executeSearch, parseQuery, deriveCategories, type ParsedIntent, type RankedResults } from './search-engine';
import { searchProducts } from './shop/storefront';
import { searchRentals } from './rentals/public';
import type { ProductListItem } from './shop/types';
import type { RentalListItem } from './rentals/types';

const PER_GROUP = 5;
const RESULT_KEYS = ['companies', 'institutions', 'procedures', 'offers', 'posts', 'services', 'jobs', 'events', 'foodItems', 'professionals', 'itineraries', 'places', 'pharmacies', 'clinics', 'hospitals'] as const;

export type DirectoryFindings = {
  text: string; // Markdown list (for text-only clients)
  strong: boolean; // the engine recognised a type of thing or a city
  results: RankedResults | null; // up to PER_GROUP per group
  products: ProductListItem[];
  rentals: RentalListItem[];
  total: number; // before the per-group cap
  query: { keywords: string; city?: string }; // what was finally searched, for "ver más"
};

const EMPTY: DirectoryFindings = { text: '', strong: false, results: null, products: [], rentals: [], total: 0, query: { keywords: '' } };

const slugService = (name: string) => name.toLowerCase().replace(/ /g, '-');
const cityOf = (branches?: { location?: { city?: string } }[]) => branches?.[0]?.location?.city;
const phoneOf = (branches?: { contact?: { phone?: string } }[]) => branches?.[0]?.contact?.phone;
const line = (parts: (string | undefined | null | false)[]) => parts.filter(Boolean).join(' · ');
const clip = (s: string | undefined, n: number) => (s && s.length > n ? `${s.slice(0, n)}…` : s ?? '');

const countResults = (r: RankedResults) => RESULT_KEYS.reduce((n, k) => n + r[k].length, 0);

function capResults(r: RankedResults): RankedResults {
  const out = { ...r };
  for (const k of RESULT_KEYS) (out as Record<string, unknown>)[k] = r[k].slice(0, PER_GROUP);
  return out;
}

function formatResults(r: RankedResults, products: ProductListItem[], rentals: RentalListItem[]): string {
  const out: string[] = [];
  const group = <T,>(title: string, items: T[], fmt: (x: T) => string) => {
    if (items.length) out.push(`${title}:\n${items.slice(0, PER_GROUP).map((x) => `- ${fmt(x)}`).join('\n')}`);
  };
  group('Empresas', r.companies, (c) => line([`[${c.name}](/companies/${c.id})`, c.category, cityOf(c.branches), phoneOf(c.branches) && `tel. ${phoneOf(c.branches)}`, c.isVerified && 'verificada']));
  group('Instituciones', r.institutions, (i) => line([`[${i.name}](/institutions/${i.id})`, i.category, cityOf(i.branches)]));
  group('Trámites', r.procedures, (p) => line([`[${p.name}](/procedures/${p.id})`, p.institution, clip(p.description, 220)]));
  group('Servicios', r.services, (s) => line([`[${s.name}](/services/${encodeURIComponent(slugService(s.name))})`, s.category]));
  group('Ofertas', r.offers, (o) => line([`[${o.title}](/offers/${o.id})`, o.companyName]));
  group('Empleos', r.jobs, (j) => line([`[${j.title}](/jobs/${j.id})`, j.companyName, j.city]));
  group('Eventos', r.events, (e) => line([`[${e.title}](/events/${e.id})`, e.city, e.startDate?.slice(0, 10)]));
  group('Comida', r.foodItems, (f) => line([`${f.name} en [${f.companyName}](/companies/${f.companyId})`, `${f.price} XAF`]));
  group('Profesionales', r.professionals, (p) => line([`[${p.displayName}](/professionals/${p.id})`, p.title, p.city]));
  group('Itinerarios', r.itineraries, (i) => line([`[${i.title}](/itineraries/${i.id})`, i.city, `${i.durationDays} días`]));
  group('Lugares turísticos', r.places, (p) => line([`[${p.name}](/places/${p.id})`, p.category, p.location?.city]));
  group('Farmacias', r.pharmacies, (f) => line([`[${f.name}](/health/pharmacies/${f.id})`, cityOf(f.branches), phoneOf(f.branches) && `tel. ${phoneOf(f.branches)}`]));
  group('Clínicas', r.clinics, (f) => line([`[${f.name}](/health/clinics/${f.id})`, cityOf(f.branches)]));
  group('Hospitales', r.hospitals, (f) => line([`[${f.name}](/health/hospitals/${f.id})`, cityOf(f.branches)]));
  group('Publicaciones', r.posts, (p) => line([`[${p.title}](/contribuciones/${p.id})`, p.category]));
  group('Productos en la Tienda', products, (p) => line([`[${p.title}](/tienda/p/${p.slug})`, `${p.minPrice} XAF`, p.companyName]));
  group('Alquileres', rentals, (l) => line([`[${l.title}](/alquiler/${l.slug})`, l.city, l.dailyPrice ? `${l.dailyPrice} XAF/día` : null, l.monthlyPrice ? `${l.monthlyPrice} XAF/mes` : null]));
  return out.join('\n\n');
}

export async function directoryContext(question: string): Promise<string> {
  return (await directorySearch(question)).text;
}

export async function directorySearch(question: string): Promise<DirectoryFindings> {
  try {
    const data = await getSearchIndexData();
    const parsed = parseQuery(question, { cities: data.cities, categories: deriveCategories(data), services: data.services });
    const strong = parsed.entityTypes.length > 0 || !!parsed.city;
    if (!parsed.keywords.length && !parsed.entityTypes.length && !parsed.city && !parsed.onDuty) return { ...EMPTY, strong };

    // Every keyword must match, so one stray word ("oye", "hermano") can hide
    // everything: if nothing comes back, try again leaving out one word.
    let intent: ParsedIntent = parsed;
    let ranked = executeSearch(intent, data);
    if (!countResults(ranked) && parsed.keywords.length > 1 && parsed.keywords.length <= 6) {
      let best: { intent: ParsedIntent; ranked: RankedResults; n: number } | null = null;
      for (const drop of parsed.keywords) {
        const candidate: ParsedIntent = { ...parsed, keywords: parsed.keywords.filter((k) => k !== drop) };
        const r = executeSearch(candidate, data);
        const n = countResults(r);
        if (n && (!best || n > best.n)) best = { intent: candidate, ranked: r, n };
      }
      if (best) ({ intent, ranked } = best);
    }

    // Pharmacies on duty today, when asked for and the engine found none.
    if (/guardia/i.test(question) && !ranked.pharmacies.length) {
      const onDuty = await getPharmaciesOnDuty();
      ranked = { ...ranked, pharmacies: intent.city ? onDuty.filter((f) => f.branches?.some((b) => b.location?.city === intent.city)) : onDuty };
    }

    const q = intent.keywords.join(' ');
    const [products, rentals] = q
      ? await Promise.all([
          searchProducts({ q, city: intent.city }).then((r) => r.items.slice(0, PER_GROUP)).catch(() => []),
          searchRentals({ q, city: intent.city }).then((r) => r.items.slice(0, PER_GROUP)).catch(() => []),
        ])
      : [[], []];

    const total = countResults(ranked);
    const results = total ? capResults(ranked) : null;
    return {
      text: formatResults(results ?? ranked, products, rentals),
      strong,
      results,
      products,
      rentals,
      total: total + products.length + rentals.length,
      query: { keywords: q, city: intent.city },
    };
  } catch (error) {
    console.error('Assistant directory search failed:', error);
    return EMPTY;
  }
}
