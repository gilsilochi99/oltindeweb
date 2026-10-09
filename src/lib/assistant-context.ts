// Live directory context for the Oltinde assistant: what the search engine
// finds for a question, as a Markdown list with links. Used by both the AI
// and the no-AI answerer (src/lib/assistant.ts).
import { getPharmaciesOnDuty, getSearchIndexData } from './data';
import { executeSearch, parseQuery, deriveCategories, type RankedResults } from './search-engine';
import { searchProducts } from './shop/storefront';
import { searchRentals } from './rentals/public';

const PER_GROUP = 5;


const slugService = (name: string) => name.toLowerCase().replace(/ /g, '-');
const cityOf = (branches?: { location?: { city?: string } }[]) => branches?.[0]?.location?.city;
const phoneOf = (branches?: { contact?: { phone?: string } }[]) => branches?.[0]?.contact?.phone;
const line = (parts: (string | undefined | null | false)[]) => parts.filter(Boolean).join(' · ');
const clip = (s: string | undefined, n: number) => (s && s.length > n ? `${s.slice(0, n)}…` : s ?? '');

function formatResults(r: RankedResults): string {
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
  return out.join('\n\n');
}

export async function directoryContext(question: string): Promise<string> {
  return (await directorySearch(question)).text;
}

// `strong`: the engine recognised what kind of thing or which city is meant.
export async function directorySearch(question: string): Promise<{ text: string; strong: boolean }> {
  let strong = false;
  try {
    const data = await getSearchIndexData();
    const intent = parseQuery(question, { cities: data.cities, categories: deriveCategories(data), services: data.services });
    strong = intent.entityTypes.length > 0 || !!intent.city;
    const parts: string[] = [];
    if (intent.keywords.length || intent.entityTypes.length || intent.city) {
      const found = formatResults(executeSearch(intent, data));
      if (found) parts.push(found);
    }
    if (/guardia/i.test(question)) {
      const onDuty = await getPharmaciesOnDuty();
      if (onDuty.length) parts.push(`Farmacias de guardia hoy:\n${onDuty.slice(0, 10).map((f) => `- ${line([`[${f.name}](/health/pharmacies/${f.id})`, cityOf(f.branches), phoneOf(f.branches) && `tel. ${phoneOf(f.branches)}`])}`).join('\n')}`);
    }
    const q = intent.keywords.join(' ');
    if (q) {
      const [products, rentals] = await Promise.all([
        searchProducts({ q, city: intent.city }).catch(() => null),
        searchRentals({ q, city: intent.city }).catch(() => null),
      ]);
      if (products?.items.length) parts.push(`Productos en la Tienda:\n${products.items.slice(0, PER_GROUP).map((p) => `- ${line([`[${p.title}](/tienda/p/${p.slug})`, `${p.minPrice} XAF`, p.companyName])}`).join('\n')}`);
      if (rentals?.items.length) parts.push(`Alquileres:\n${rentals.items.slice(0, PER_GROUP).map((l) => `- ${line([`[${l.title}](/alquiler/${l.slug})`, l.city, l.dailyPrice ? `${l.dailyPrice} XAF/día` : null, l.monthlyPrice ? `${l.monthlyPrice} XAF/mes` : null])}`).join('\n')}`);
    }
    return { text: parts.join('\n\n'), strong };
  } catch (error) {
    console.error('Assistant directory context failed:', error);
    return { text: '', strong: false };
  }
}

