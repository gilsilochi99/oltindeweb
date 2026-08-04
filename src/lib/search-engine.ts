import type { Company, Institution, Procedure, Post, Service, Offer, JobPosting, CalendarEvent, MenuItem, Professional, Itinerary, TouristLocation, HealthFacility } from './types';

export type EntityType = 'company' | 'institution' | 'procedure' | 'offer' | 'post' | 'service' | 'job' | 'event' | 'food' | 'professional' | 'itinerary' | 'place' | 'pharmacy' | 'clinic' | 'hospital';

export interface ParsedIntent {
  entityTypes: EntityType[];
  city?: string;
  category?: string;
  keywords: string[];
  raw: string;
}

export interface OfferResult extends Offer {
  companyId: string;
  companyName: string;
  companyLogo: string;
  companyCategory: string;
}

export interface FoodResult extends MenuItem {
  companyLogo: string;
}

export interface SearchInputData {
  companies: Company[];
  institutions: Institution[];
  procedures: Procedure[];
  posts: Post[];
  services: Service[];
  jobs: JobPosting[];
  events: CalendarEvent[];
  menuItems: MenuItem[];
  professionals: Professional[];
  itineraries: Itinerary[];
  places: TouristLocation[];
  healthFacilities: HealthFacility[];
}

export interface RankedResults {
  companies: Company[];
  institutions: Institution[];
  procedures: Procedure[];
  offers: OfferResult[];
  posts: Post[];
  services: Service[];
  jobs: JobPosting[];
  events: CalendarEvent[];
  foodItems: FoodResult[];
  professionals: Professional[];
  itineraries: Itinerary[];
  places: TouristLocation[];
  pharmacies: HealthFacility[];
  clinics: HealthFacility[];
  hospitals: HealthFacility[];
}

export function countResults(results: RankedResults): number {
  return results.companies.length + results.institutions.length + results.procedures.length
    + results.offers.length + results.posts.length + results.services.length + results.jobs.length
    + results.events.length + results.foodItems.length + results.professionals.length
    + results.itineraries.length + results.places.length
    + results.pharmacies.length + results.clinics.length + results.hospitals.length;
}

// Reconstructs a plain-text query that reproduces an intent's filters when re-parsed
// by parseQuery — used for "Ver todos los resultados" links on intents that were
// refined via chip removal rather than typed directly, so the link doesn't just
// replay the original (now-stale) typed text.
export function intentToQueryString(intent: ParsedIntent): string {
  const parts: string[] = [];
  if (intent.category) parts.push(intent.category);
  if (intent.city) parts.push(`en ${intent.city}`);
  if (intent.keywords.length) parts.push(intent.keywords.join(' '));
  return parts.length > 0 ? parts.join(' ') : intent.raw;
}

// The category vocabulary the parser matches against — every category in active use
// across companies/institutions/procedures/services, not just services, so a category
// that only exists on e.g. a company (no matching Service record) is still recognized.
// Job postings' `sector` shares this same vocabulary rather than a parallel one — see
// executeSearch's job branch, which reuses matchesCategory(job.sector, intent.category).
export function deriveCategories(data: Pick<SearchInputData, 'companies' | 'institutions' | 'procedures' | 'services' | 'jobs' | 'events' | 'professionals' | 'places'>): string[] {
  return Array.from(new Set([
    ...data.companies.map((c) => c.category),
    ...data.institutions.map((i) => i.category),
    ...data.procedures.map((p) => p.category),
    ...data.services.map((s) => s.category),
    ...data.jobs.map((j) => j.sector),
    ...data.events.map((e) => e.category),
    ...data.professionals.map((p) => p.category),
    ...data.places.map((p) => p.category),
  ].filter(Boolean)));
}

// --- normalization ---

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function normalize(s: string): string {
  return stripAccents(s.toLowerCase()).trim();
}

function tokenize(raw: string): string[] {
  return normalize(raw)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const STOPWORDS = new Set([
  'en', 'de', 'para', 'con', 'que', 'el', 'la', 'los', 'las',
  'un', 'una', 'unos', 'unas', 'y', 'o', 'del', 'al', 'mi', 'me',
  // common request-framing verbs that never carry search-relevant meaning
  'necesito', 'necesita', 'quiero', 'quiere', 'busco', 'buscar', 'buscando',
]);

// --- fuzzy matching (dependency-free Levenshtein distance) ---

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

function fuzzyEquals(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 3 || b.length < 3) return false;
  const threshold = Math.max(a.length, b.length) <= 6 ? 1 : 2;
  return levenshtein(a, b) <= threshold;
}

function fuzzyIncludes(haystack: string, needleToken: string): boolean {
  const hn = normalize(haystack);
  if (hn.includes(needleToken)) return true;
  return hn.split(/\s+/).some((tok) => fuzzyEquals(tok, needleToken));
}

// --- entity-type intent keywords (already-normalized forms) ---

const ENTITY_KEYWORDS: Record<EntityType, string[]> = {
  company: ['empresa', 'empresas', 'negocio', 'negocios', 'compania', 'companias', 'proveedor', 'proveedores', 'tienda', 'tiendas', 'comercio', 'comercios'],
  institution: ['institucion', 'instituciones', 'oficina', 'oficinas', 'ministerio', 'ministerios', 'organismo', 'organismos'],
  procedure: ['tramite', 'tramites', 'procedimiento', 'procedimientos', 'gestion', 'gestiones', 'papeleo', 'documento', 'documentos'],
  offer: ['oferta', 'ofertas', 'descuento', 'descuentos', 'promocion', 'promociones', 'rebaja', 'rebajas'],
  post: ['articulo', 'articulos', 'publicacion', 'publicaciones', 'blog', 'noticia', 'noticias', 'contribucion', 'contribuciones'],
  service: ['servicio', 'servicios'],
  job: ['empleo', 'empleos', 'trabajo', 'trabajos', 'vacante', 'vacantes', 'oferta de trabajo'],
  event: ['evento', 'eventos', 'calendario', 'feria', 'ferias', 'conferencia', 'conferencias', 'actividad', 'actividades'],
  food: ['comida', 'restaurante', 'restaurantes', 'plato', 'platos', 'menu', 'menus', 'pedido', 'pedidos', 'pizza', 'pizzas'],
  professional: ['profesional', 'profesionales', 'freelancer', 'autonomo', 'autonomos', 'artesano', 'artesanos', 'tecnico', 'tecnicos', 'experto', 'expertos'],
  itinerary: ['itinerario', 'itinerarios', 'recorrido', 'recorridos', 'ruta', 'rutas', 'viaje', 'viajes', 'tour', 'tours', 'excursion', 'excursiones'],
  place: ['lugar', 'lugares', 'turistico', 'turisticos', 'turistica', 'turisticas', 'sitio', 'sitios', 'atraccion', 'atracciones', 'destino', 'destinos', 'playa', 'playas', 'monumento', 'monumentos', 'museo', 'museos'],
  pharmacy: ['farmacia', 'farmacias', 'botica', 'boticas', 'medicamento', 'medicamentos', 'medicina', 'medicinas'],
  clinic: ['clinica', 'clinicas', 'consultorio', 'consultorios'],
  hospital: ['hospital', 'hospitales'],
};

// --- span-based matching helpers ---

interface Span {
  text: string;
  indices: number[];
}

function generateSpans(tokens: string[], consumed: Set<number>, maxSpan: number): Span[] {
  const spans: Span[] = [];
  for (let span = maxSpan; span >= 1; span--) {
    for (let i = 0; i + span <= tokens.length; i++) {
      const indices = Array.from({ length: span }, (_, k) => i + k);
      if (indices.some((idx) => consumed.has(idx))) continue;
      spans.push({ text: tokens.slice(i, i + span).join(' '), indices });
    }
  }
  return spans;
}

function findBestMatch(spans: Span[], candidates: { original: string; norm: string }[]): { original: string; indices: number[] } | undefined {
  for (const span of spans) {
    const match = candidates.find((c) => fuzzyEquals(c.norm, span.text));
    if (match) return { original: match.original, indices: span.indices };
  }
  return undefined;
}

// --- main parsing ---

export function parseQuery(raw: string, opts: { cities: string[]; categories: string[]; services: Service[] }): ParsedIntent {
  const tokens = tokenize(raw);
  const consumed = new Set<number>();

  // 1. entity type detection — single-token keyword lookup
  const entityTypes = new Set<EntityType>();
  tokens.forEach((tok, i) => {
    (Object.entries(ENTITY_KEYWORDS) as [EntityType, string[]][]).forEach(([type, keywords]) => {
      if (keywords.includes(tok)) {
        entityTypes.add(type);
        consumed.add(i);
      }
    });
  });

  // 2. city detection — fuzzy match against known cities (1-2 word spans)
  const cityCandidates = opts.cities.map((c) => ({ original: c, norm: normalize(c) }));
  const cityMatch = findBestMatch(generateSpans(tokens, consumed, 2), cityCandidates);
  const city = cityMatch?.original;
  cityMatch?.indices.forEach((i) => consumed.add(i));

  // 3. category detection — fuzzy match against known categories (1-3 word spans)
  const categoryCandidates = opts.categories.map((c) => ({ original: c, norm: normalize(c) }));
  const categoryMatch = findBestMatch(generateSpans(tokens, consumed, 3), categoryCandidates);
  let category = categoryMatch?.original;
  categoryMatch?.indices.forEach((i) => consumed.add(i));

  // 4. adaptive knowledge base: infer category from service names/descriptions
  //    when no literal category word was used (e.g. "instalar electricidad" -> "Electricidad").
  //    The token(s) that triggered the inference are consumed too, so they aren't also
  //    required to literally appear in the target entity's own text later.
  if (!category) {
    const leftoverIndices = tokens
      .map((t, i) => ({ t, i }))
      .filter(({ t, i }) => !consumed.has(i) && t.length >= 3 && !STOPWORDS.has(t));
    let bestService: Service | undefined;
    let bestScore = 0;
    let bestIndex = -1;
    for (const svc of opts.services) {
      const svcName = normalize(svc.name);
      const svcDesc = normalize(svc.description || '');
      for (const { t: tok, i } of leftoverIndices) {
        let score = 0;
        if (svcName.includes(tok) || fuzzyIncludes(svcName, tok)) score = tok.length;
        else if (svcDesc.includes(tok)) score = tok.length * 0.5;
        if (score > bestScore) {
          bestScore = score;
          bestService = svc;
          bestIndex = i;
        }
      }
    }
    if (bestService && bestScore >= 4) {
      category = bestService.category;
      if (bestIndex >= 0) consumed.add(bestIndex);
    }
  }

  // 5. remaining tokens become free-text keywords
  const keywords = tokens
    .filter((_, i) => !consumed.has(i))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));

  return { entityTypes: Array.from(entityTypes), city, category, keywords, raw };
}

// A follow-up like "¿y en Malabo?" or "solo trámites" should refine the previous
// turn, not start over. Only treat it as a refinement when it's UNAMBIGUOUSLY just
// a city/category tweak — no entity-type keyword and no leftover free-text keyword
// of its own — otherwise a genuinely new, unrelated query (which always carries its
// own entity types and/or keywords) would incorrectly inherit stale filters.
export function mergeFollowUpIntent(newIntent: ParsedIntent, previous?: ParsedIntent): ParsedIntent {
  const isPureFilterTweak = newIntent.entityTypes.length === 0 && newIntent.keywords.length === 0
    && (!!newIntent.city || !!newIntent.category);
  if (!previous || !isPureFilterTweak) return newIntent;
  return {
    ...newIntent,
    entityTypes: previous.entityTypes,
    category: newIntent.category ?? previous.category,
    city: newIntent.city ?? previous.city,
    keywords: previous.keywords,
  };
}

// --- scoring + filtering ---

function scoreText(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  let score = 0;
  for (const kw of keywords) {
    if (normalize(text).includes(kw)) score += kw.length;
    else if (fuzzyIncludes(text, kw)) score += kw.length * 0.5;
  }
  return score;
}

function matchesCategory(entityCategory: string | undefined, category?: string): boolean {
  if (!category) return true;
  if (!entityCategory) return false;
  return normalize(entityCategory) === normalize(category);
}

function matchesCity(branches: { location: { city: string } }[] | undefined, city?: string): boolean {
  if (!city) return true;
  if (!branches) return false;
  return branches.some((b) => normalize(b.location.city) === normalize(city));
}

// Job postings store a plain `city: string` rather than a `branches[]` array.
function matchesCityString(entityCity: string | undefined, city?: string): boolean {
  if (!city) return true;
  if (!entityCity) return false;
  return normalize(entityCity) === normalize(city);
}

// Tourist locations store a single `location: {city}` rather than `branches[]`.
function matchesSingleLocation(location: { city: string } | undefined, city?: string): boolean {
  if (!city) return true;
  if (!location) return false;
  return normalize(location.city) === normalize(city);
}

function rankAndFilter<T>(items: T[], textOf: (item: T) => string, keywords: string[], requireMatch: boolean, cap = 8): T[] {
  return items
    .map((item) => ({ item, score: scoreText(textOf(item), keywords) }))
    .filter((r) => keywords.length === 0 || !requireMatch || r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, cap)
    .map((r) => r.item);
}

export function executeSearch(intent: ParsedIntent, data: SearchInputData): RankedResults {
  const wantsAll = intent.entityTypes.length === 0;
  const wants = (t: EntityType) => wantsAll || intent.entityTypes.includes(t);
  // When a category or city was already detected, that's a strong structural signal on
  // its own — don't let a leftover word that fails to fuzzy-match anything (e.g. a generic
  // verb the stopword list didn't catch) veto an otherwise-correct match. Keywords still
  // rank matches higher, they just aren't a hard requirement in that case. Pure free-text
  // queries (no category/city detected) still require at least one keyword hit, otherwise
  // every single entity would show up for any unrecognized query.
  const requireKeywordMatch = !intent.category && !intent.city;

  const results: RankedResults = {
    companies: [], institutions: [], procedures: [], offers: [], posts: [], services: [], jobs: [], events: [],
    foodItems: [], professionals: [], itineraries: [], places: [], pharmacies: [], clinics: [], hospitals: [],
  };

  if (wants('company')) {
    const eligible = data.companies.filter((c) => matchesCategory(c.category, intent.category) && matchesCity(c.branches, intent.city));
    results.companies = rankAndFilter(eligible, (c) => `${c.name} ${c.description}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('institution')) {
    const eligible = data.institutions.filter((i) => matchesCategory(i.category, intent.category) && matchesCity(i.branches, intent.city));
    results.institutions = rankAndFilter(eligible, (i) => `${i.name} ${i.description}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('procedure')) {
    const eligible = data.procedures.filter((p) => matchesCategory(p.category, intent.category));
    results.procedures = rankAndFilter(eligible, (p) => `${p.name} ${p.description}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('offer')) {
    const allOffers: OfferResult[] = data.companies.flatMap((c) =>
      (c.offers || []).map((o) => ({ ...o, companyId: c.id, companyName: c.name, companyLogo: c.logo, companyCategory: c.category }))
    );
    const eligible = allOffers.filter((o) => {
      const parentCompany = data.companies.find((c) => c.id === o.companyId);
      return matchesCategory(o.companyCategory, intent.category) && matchesCity(parentCompany?.branches, intent.city);
    });
    results.offers = rankAndFilter(eligible, (o) => `${o.title} ${o.description}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('post')) {
    const eligible = data.posts.filter((p) => matchesCategory(p.category, intent.category));
    results.posts = rankAndFilter(eligible, (p) => `${p.title} ${p.excerpt}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('service')) {
    const eligible = data.services.filter((s) => matchesCategory(s.category, intent.category));
    results.services = rankAndFilter(eligible, (s) => `${s.name} ${s.description}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('job')) {
    const eligible = data.jobs.filter((j) => j.status === 'open' && matchesCategory(j.sector, intent.category) && matchesCityString(j.city, intent.city));
    results.jobs = rankAndFilter(eligible, (j) => `${j.title} ${j.description}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('event')) {
    const eligible = data.events.filter((e) => e.status === 'scheduled' && matchesCategory(e.category, intent.category) && matchesCityString(e.city, intent.city));
    results.events = rankAndFilter(eligible, (e) => `${e.title} ${e.description}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('food')) {
    const eligible: FoodResult[] = data.menuItems
      .filter((m) => m.available)
      .filter((m) => {
        const parentCompany = data.companies.find((c) => c.id === m.companyId);
        return matchesCity(parentCompany?.branches, intent.city);
      })
      .map((m) => {
        const parentCompany = data.companies.find((c) => c.id === m.companyId);
        return { ...m, companyLogo: parentCompany?.logo || '' };
      });
    results.foodItems = rankAndFilter(eligible, (m) => `${m.name} ${m.description} ${m.foodType}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('professional')) {
    const eligible = data.professionals.filter((p) => matchesCategory(p.category, intent.category) && matchesCityString(p.city, intent.city));
    results.professionals = rankAndFilter(eligible, (p) => `${p.displayName} ${p.title} ${p.bio} ${p.skills.join(' ')}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('itinerary')) {
    const eligible = data.itineraries.filter((it) => it.visibility === 'public' && matchesCityString(it.city, intent.city));
    results.itineraries = rankAndFilter(eligible, (it) => `${it.title} ${it.description} ${(it.theme || []).join(' ')}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('place')) {
    const eligible = data.places.filter((p) => p.status === 'approved' && matchesCategory(p.category, intent.category) && matchesSingleLocation(p.location, intent.city));
    results.places = rankAndFilter(eligible, (p) => `${p.name} ${p.description}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('pharmacy')) {
    const eligible = data.healthFacilities.filter((f) => f.type === 'pharmacy' && matchesCity(f.branches, intent.city));
    results.pharmacies = rankAndFilter(eligible, (f) => `${f.name} ${f.description}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('clinic')) {
    const eligible = data.healthFacilities.filter((f) => f.type === 'clinic' && matchesCity(f.branches, intent.city));
    results.clinics = rankAndFilter(eligible, (f) => `${f.name} ${f.description}`, intent.keywords, requireKeywordMatch);
  }

  if (wants('hospital')) {
    const eligible = data.healthFacilities.filter((f) => f.type === 'hospital' && matchesCity(f.branches, intent.city));
    results.hospitals = rankAndFilter(eligible, (f) => `${f.name} ${f.description}`, intent.keywords, requireKeywordMatch);
  }

  return results;
}

// --- natural-language summary (templated, not ML) ---

const ENTITY_LABELS: Record<EntityType, { singular: string; plural: string }> = {
  company: { singular: 'empresa', plural: 'empresas' },
  institution: { singular: 'institución', plural: 'instituciones' },
  procedure: { singular: 'trámite', plural: 'trámites' },
  offer: { singular: 'oferta', plural: 'ofertas' },
  post: { singular: 'publicación', plural: 'publicaciones' },
  service: { singular: 'servicio', plural: 'servicios' },
  job: { singular: 'empleo', plural: 'empleos' },
  event: { singular: 'evento', plural: 'eventos' },
  food: { singular: 'plato', plural: 'platos' },
  professional: { singular: 'profesional', plural: 'profesionales' },
  itinerary: { singular: 'itinerario', plural: 'itinerarios' },
  place: { singular: 'lugar turístico', plural: 'lugares turísticos' },
  pharmacy: { singular: 'farmacia', plural: 'farmacias' },
  clinic: { singular: 'clínica', plural: 'clínicas' },
  hospital: { singular: 'hospital', plural: 'hospitales' },
};

const OPENERS = ['Encontré', 'Aquí tiene', 'Esto es lo que encontré:', 'Le muestro'];
const ZERO_RESULT_OPENERS = ['No encontré resultados', 'No hay coincidencias', 'Lamentablemente no encontré nada'];
const MENTION_CONNECTORS = ['incluyendo', 'como', 'entre ellas'];

// Deterministic pseudo-random pick (same query always reads the same way, but
// different queries land on different phrasing) — avoids literal Math.random()
// so results stay reproducible, while still not sounding like the same template
// on every search.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickVariant<T>(options: T[], seed: number): T {
  return options[seed % options.length];
}

function getTopResultName(results: RankedResults): string | undefined {
  if (results.companies.length > 0) return results.companies[0].name;
  if (results.institutions.length > 0) return results.institutions[0].name;
  if (results.procedures.length > 0) return results.procedures[0].name;
  if (results.services.length > 0) return results.services[0].name;
  if (results.offers.length > 0) return results.offers[0].title;
  if (results.posts.length > 0) return results.posts[0].title;
  if (results.jobs.length > 0) return results.jobs[0].title;
  if (results.events.length > 0) return results.events[0].title;
  if (results.foodItems.length > 0) return results.foodItems[0].name;
  if (results.professionals.length > 0) return results.professionals[0].displayName;
  if (results.itineraries.length > 0) return results.itineraries[0].title;
  if (results.places.length > 0) return results.places[0].name;
  if (results.pharmacies.length > 0) return results.pharmacies[0].name;
  if (results.clinics.length > 0) return results.clinics[0].name;
  if (results.hospitals.length > 0) return results.hospitals[0].name;
  return undefined;
}

export function summarize(intent: ParsedIntent, results: RankedResults): string {
  const counts: [EntityType, number][] = [
    ['company', results.companies.length],
    ['institution', results.institutions.length],
    ['procedure', results.procedures.length],
    ['offer', results.offers.length],
    ['post', results.posts.length],
    ['service', results.services.length],
    ['job', results.jobs.length],
    ['event', results.events.length],
    ['food', results.foodItems.length],
    ['professional', results.professionals.length],
    ['itinerary', results.itineraries.length],
    ['place', results.places.length],
    ['pharmacy', results.pharmacies.length],
    ['clinic', results.clinics.length],
    ['hospital', results.hospitals.length],
  ];
  const total = counts.reduce((sum, [, n]) => sum + n, 0);
  const categorySuffix = intent.category ? ` de ${intent.category}` : '';
  const locationSuffix = intent.city ? ` en ${intent.city}` : '';
  const seed = hashString(intent.raw) + total;

  if (total === 0) {
    const opener = pickVariant(ZERO_RESULT_OPENERS, seed);
    const hints: string[] = [];
    if (intent.category) hints.push(`quitar el filtro de categoría "${intent.category}"`);
    if (intent.city) hints.push('buscar en otra ciudad');
    if (hints.length === 0) hints.push('usar otros términos o ser más específico');
    const hintText = hints.length > 1 ? `${hints[0]} o ${hints[1]}` : hints[0];
    return `${opener}${categorySuffix}${locationSuffix}. Puede intentar ${hintText}.`;
  }

  const activeTypes = counts.filter(([, n]) => n > 0);
  const parts = activeTypes.map(([type, n]) => `${n} ${n === 1 ? ENTITY_LABELS[type].singular : ENTITY_LABELS[type].plural}`);
  const partsText = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
  const opener = pickVariant(OPENERS, seed);

  // A little personal touch: name a standout result, but only when it's
  // unambiguous (a single matched type) and genuinely a "top pick" (a small
  // handful of results, not one — which is already visible right below — and
  // not a big list, where naming just one feels arbitrary).
  let mention = '';
  if (activeTypes.length === 1 && activeTypes[0][1] >= 2 && activeTypes[0][1] <= 6) {
    const topName = getTopResultName(results);
    if (topName) mention = `, ${pickVariant(MENTION_CONNECTORS, seed + 1)} ${topName}`;
  }

  return `${opener} ${partsText}${categorySuffix}${locationSuffix}${mention}.`;
}
