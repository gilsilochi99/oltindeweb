import type { Company, Institution, Procedure, Post, Service, Offer, JobPosting, CalendarEvent, MenuItem, Professional, Itinerary, TouristLocation, HealthFacility } from './types';

// Rule-based smart search over the directory, run client-side on the
// bundle from getSearchIndexData(). No ML: a query is parsed into
// entity-type words, a city and free-text keywords; every keyword (with its
// synonyms) must then match a document word-by-word — by stem, prefix, or a
// typo-tolerant fallback — and results are ranked by which field matched
// (name > category/services > description). If that finds nothing, the
// search is relaxed step by step and the summary says how.

export type EntityType = 'company' | 'institution' | 'procedure' | 'offer' | 'post' | 'service' | 'job' | 'event' | 'food' | 'professional' | 'itinerary' | 'place' | 'pharmacy' | 'clinic' | 'hospital';

export interface ParsedIntent {
  entityTypes: EntityType[];
  city?: string;
  category?: string; // kept for the refine chips; the parser no longer guesses categories
  keywords: string[];
  // Words that both select an entity type and describe what to look for in
  // other types, e.g. "restaurantes" → food items, plus companies that are
  // restaurants (for which the word must match their name/category).
  impliedWords?: { word: string; types: EntityType[] }[];
  onDuty?: boolean; // "farmacia de guardia"
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
  // How the search had to be relaxed to find anything (shown in the summary).
  relaxed?: 'types' | 'city' | 'partial';
}

const RESULT_KEYS = ['companies', 'institutions', 'procedures', 'offers', 'posts', 'services', 'jobs', 'events', 'foodItems', 'professionals', 'itineraries', 'places', 'pharmacies', 'clinics', 'hospitals'] as const;

export function countResults(results: RankedResults): number {
  return RESULT_KEYS.reduce((n, k) => n + results[k].length, 0);
}

// Reconstructs a plain-text query that reproduces an intent when re-parsed —
// used for "Ver todos los resultados" links on refined intents.
export function intentToQueryString(intent: ParsedIntent): string {
  const parts: string[] = [];
  if (intent.impliedWords?.length) parts.push(...intent.impliedWords.map(w => w.word));
  if (intent.onDuty) parts.push('de guardia');
  if (intent.keywords.length) parts.push(intent.keywords.join(' '));
  if (intent.category) parts.push(intent.category);
  if (intent.city) parts.push(`en ${intent.city}`);
  return parts.length > 0 ? parts.join(' ') : intent.raw;
}

// Every category in active use. No longer used to filter (categories are
// matched as text, see companyFields), but still part of the public API.
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

// ---------------------------------------------------------------- text normalization

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

function tokenize(raw: string): string[] {
  return normalize(raw)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Light Spanish stemmer: enough to make plural/gender variants meet
// (abogados/abogada → abogad, hoteles → hotel, clinicas → clinic) without
// collapsing unrelated words together.
export function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith('ces')) w = `${w.slice(0, -3)}z`;
  else if (w.length > 5 && w.endsWith('iones')) w = w.slice(0, -2);
  else if (w.length > 4 && /[^aeiou]es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s')) w = w.slice(0, -1);
  if (w.length > 4 && /[aeo]$/.test(w)) w = w.slice(0, -1);
  return w;
}

const STOPWORDS = new Set([
  'en', 'de', 'para', 'con', 'que', 'el', 'la', 'los', 'las', 'lo', 'le', 'les',
  'un', 'una', 'unos', 'unas', 'y', 'o', 'u', 'e', 'del', 'al', 'mi', 'me', 'mis', 'su', 'sus', 'tu', 'tus', 'a',
  'por', 'sobre', 'como', 'cerca', 'donde', 'hay', 'algun', 'alguna', 'alguno', 'algunos', 'algunas',
  'mejor', 'mejores', 'bueno', 'buena', 'buenos', 'buenas', 'barato', 'barata', 'baratos', 'baratas',
  'cual', 'cuales', 'quien', 'quienes', 'puedo', 'puede', 'pueden', 'se', 'es', 'son', 'esta', 'este', 'estos', 'estas',
  'necesito', 'necesita', 'quiero', 'quiere', 'busco', 'buscar', 'buscando', 'encontrar', 'encuentro', 'ver',
  'informacion', 'info', 'favor', 'hola', 'gracias', 'zona', 'ciudad', 'aqui', 'alli',
  // buying/selling verbs: they frame the request, the product is the other words
  'venta', 'ventas', 'vender', 'vendo', 'vende', 'venden', 'comprar', 'compro', 'compra', 'precio', 'precios', 'contratar',
]);

// ---------------------------------------------------------------- synonyms

// Each group is a set of interchangeable search terms (normalized, possibly
// multi-word). A query word in a group also matches documents containing any
// other member, at a slightly lower score than the word itself.
const SYNONYM_GROUPS: string[][] = [
  ['abogado', 'bufete', 'despacho de abogados', 'juridico', 'abogacia', 'asesoria juridica', 'law'],
  ['notario', 'notaria'],
  ['hotel', 'hostal', 'alojamiento', 'apartahotel', 'hospedaje', 'hostel', 'motel', 'residencia'],
  ['restaurante', 'restaurant', 'cafeteria', 'gastronomia', 'comida'],
  ['medico', 'doctor', 'consulta medica', 'clinica'],
  ['dentista', 'odontologo', 'dental', 'odontologia'],
  ['farmacia', 'botica', 'parafarmacia', 'medicamento'],
  ['colegio', 'escuela', 'academia', 'instituto', 'guarderia', 'liceo'],
  ['universidad', 'facultad', 'universitario'],
  ['ordenador', 'computadora', 'computador', 'informatica', 'portatil', 'laptop', 'pc'],
  ['telefono', 'telefonia', 'movil', 'celular', 'smartphone'],
  ['internet', 'wifi', 'fibra', 'conectividad', 'telecomunicacion'],
  ['coche', 'auto', 'automovil', 'vehiculo', 'carro', 'automocion', 'car'],
  ['mecanico', 'mecanica', 'taller mecanico'],
  ['gasolinera', 'combustible', 'gasolina', 'carburante', 'estacion de servicio', 'gasoil'],
  ['banco', 'bancario', 'banca', 'bank', 'microbank', 'financiero', 'microfinanza'],
  ['seguro', 'aseguradora', 'poliza', 'insurance'],
  ['contable', 'contabilidad', 'contador', 'auditoria', 'fiscal'],
  ['electricidad', 'electrico', 'electricista', 'electrica'],
  ['fontaneria', 'fontanero', 'plomeria', 'plomero'],
  ['agua', 'potable', 'suministro de agua'],
  ['carpinteria', 'carpintero', 'ebanisteria', 'madera'],
  ['mueble', 'muebles', 'mobiliario'],
  ['construccion', 'constructora', 'obra', 'edificacion', 'albanil'],
  ['arquitecto', 'arquitectura'],
  ['imprenta', 'impresion', 'grafica', 'serigrafia', 'rotulacion', 'rotulo'],
  ['ropa', 'moda', 'textil', 'vestido', 'prenda', 'tienda de ropa'],
  ['zapato', 'calzado', 'zapateria'],
  ['supermercado', 'supermarket', 'hipermercado', 'alimentacion', 'comestible', 'ultramarino'],
  ['limpieza', 'limpiar', 'lavanderia', 'tintoreria'],
  ['seguridad', 'vigilancia', 'vigilante', 'escolta'],
  ['transporte', 'logistica', 'mudanza', 'mensajeria', 'paqueteria'],
  ['taxi', 'vtc'],
  ['peluqueria', 'barberia', 'peluquero', 'barbero', 'hairdresser', 'salon de belleza'],
  ['estetica', 'belleza', 'manicura', 'spa'],
  ['marketing', 'publicidad', 'publicitario', 'branding'],
  ['web', 'pagina web', 'sitio web', 'desarrollo web'],
  ['inmobiliaria', 'inmobiliario', 'vivienda', 'piso', 'apartamento', 'casa'],
  ['alquiler', 'renta', 'rental', 'arrendamiento'],
  ['dni', 'documento de identidad', 'carnet de identidad', 'documento nacional'],
  ['pasaporte', 'visado', 'visa'],
  ['viaje', 'agencia de viaje', 'billete', 'vuelo', 'turismo'],
  ['veterinario', 'veterinaria', 'mascota'],
  ['abrir', 'apertura', 'constitucion', 'registro mercantil'],
  ['traduccion', 'traductor', 'interprete'],
  ['fotografo', 'fotografia', 'foto'],
  ['evento', 'boda', 'celebracion', 'catering'],
];

const SYNONYM_INDEX = (() => {
  const index = new Map<string, string[][]>();
  for (const group of SYNONYM_GROUPS) {
    const members = group.map(term => tokenize(term).map(stem));
    for (const m of members) {
      if (m.length !== 1) continue; // multi-word terms only act as alternatives
      const others = members.filter(o => o !== m);
      index.set(m[0], [...(index.get(m[0]) ?? []), ...others]);
    }
  }
  return index;
})();

// ---------------------------------------------------------------- entity-type words

type TypeWordMode = 'generic' | 'implied' | 'specific';
// generic:  only selects the entity type ("empresas", "trámites")
// implied:  selects the type, which already IS that thing (every pharmacy is
//           a "farmacia"), and also looks for companies matching the word
// specific: selects the type and must also match the text ("playa", "feria")
const TYPE_WORDS: { words: string[]; types: EntityType[]; mode: TypeWordMode }[] = [
  { words: ['empresa', 'negocio', 'compania', 'proveedor', 'comercio', 'tienda'], types: ['company'], mode: 'generic' },
  { words: ['institucion', 'ministerio', 'organismo', 'administracion'], types: ['institution'], mode: 'generic' },
  { words: ['tramite', 'procedimiento', 'gestion', 'papeleo', 'requisito'], types: ['procedure'], mode: 'generic' },
  { words: ['oferta', 'descuento', 'promocion', 'rebaja'], types: ['offer'], mode: 'generic' },
  { words: ['articulo', 'publicacion', 'blog', 'noticia', 'contribucion'], types: ['post'], mode: 'generic' },
  { words: ['servicio'], types: ['service'], mode: 'generic' },
  { words: ['empleo', 'trabajo', 'vacante', 'puesto'], types: ['job'], mode: 'generic' },
  { words: ['evento', 'calendario', 'actividad'], types: ['event'], mode: 'generic' },
  { words: ['profesional', 'freelancer', 'autonomo', 'experto'], types: ['professional'], mode: 'generic' },
  { words: ['itinerario', 'recorrido', 'ruta', 'tour', 'excursion'], types: ['itinerary'], mode: 'generic' },
  { words: ['lugar', 'turistico', 'turistica', 'sitio', 'atraccion', 'destino'], types: ['place'], mode: 'generic' },
  { words: ['restaurante', 'comida', 'menu', 'plato'], types: ['food', 'company'], mode: 'implied' },
  { words: ['farmacia', 'botica'], types: ['pharmacy', 'company'], mode: 'implied' },
  { words: ['clinica', 'consultorio'], types: ['clinic', 'company'], mode: 'implied' },
  { words: ['hospital'], types: ['hospital'], mode: 'implied' },
  { words: ['playa', 'monumento', 'museo', 'parque'], types: ['place'], mode: 'specific' },
  { words: ['feria', 'conferencia', 'concierto', 'festival'], types: ['event'], mode: 'specific' },
  { words: ['pizza', 'hamburguesa', 'pollo', 'pescado'], types: ['food', 'company'], mode: 'specific' },
];

const TYPE_WORD_INDEX = new Map<string, { types: EntityType[]; mode: TypeWordMode; impliedFor: EntityType[] }>();
for (const entry of TYPE_WORDS) {
  // For "implied" words, the types other than company are satisfied by definition.
  const impliedFor = entry.mode === 'implied' ? entry.types.filter(t => t !== 'company') : [];
  for (const w of entry.words) TYPE_WORD_INDEX.set(stem(w), { types: entry.types, mode: entry.mode, impliedFor });
}

// ---------------------------------------------------------------- fuzzy helpers

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

// City names: whole-string comparison with a little typo tolerance.
function cityEquals(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  return levenshtein(a, b) <= (Math.max(a.length, b.length) <= 6 ? 1 : 2);
}

// ---------------------------------------------------------------- parsing

export function parseQuery(raw: string, opts: { cities: string[]; categories?: string[]; services?: Service[] }): ParsedIntent {
  const tokens = tokenize(raw);
  const consumed = new Set<number>();

  // 1. city — 1-2 word spans, longest first
  let city: string | undefined;
  const cities = opts.cities.map(c => ({ original: c, norm: normalize(c) }));
  for (const span of [2, 1]) {
    for (let i = 0; !city && i + span <= tokens.length; i++) {
      const text = tokens.slice(i, i + span).join(' ');
      const match = cities.find(c => cityEquals(c.norm, text));
      if (match) {
        city = match.original;
        for (let k = i; k < i + span; k++) consumed.add(k);
      }
    }
  }

  // 2. "de guardia" (pharmacies on duty today)
  let onDuty = false;
  tokens.forEach((t, i) => {
    if (!consumed.has(i) && t === 'guardia') {
      onDuty = true;
      consumed.add(i);
    }
  });

  // 3. entity-type words
  const entityTypes = new Set<EntityType>();
  const impliedWords: { word: string; types: EntityType[] }[] = [];
  const keywords: string[] = [];
  tokens.forEach((t, i) => {
    if (consumed.has(i)) return;
    const typeWord = TYPE_WORD_INDEX.get(stem(t));
    if (!typeWord) return;
    typeWord.types.forEach(type => entityTypes.add(type));
    consumed.add(i);
    if (typeWord.mode === 'implied') impliedWords.push({ word: t, types: typeWord.impliedFor });
    if (typeWord.mode === 'specific') keywords.push(t);
  });
  // Duty rosters only exist for pharmacies: companies can't be "de guardia".
  if (onDuty) {
    entityTypes.clear();
    entityTypes.add('pharmacy');
    for (const w of impliedWords) w.types = w.types.filter(t => t === 'pharmacy');
  }

  // 4. everything else is a free-text keyword
  tokens.forEach((t, i) => {
    if (consumed.has(i) || STOPWORDS.has(t)) return;
    if (t.length > 1 || /\d/.test(t)) keywords.push(t);
  });

  return {
    entityTypes: Array.from(entityTypes),
    city,
    keywords: Array.from(new Set(keywords)),
    impliedWords: impliedWords.length ? impliedWords : undefined,
    onDuty: onDuty || undefined,
    raw,
  };
}

// A follow-up like "¿y en Malabo?" refines the previous turn when it carries
// nothing but a city (no type word, no keyword of its own).
export function mergeFollowUpIntent(newIntent: ParsedIntent, previous?: ParsedIntent): ParsedIntent {
  const isPureFilterTweak = newIntent.entityTypes.length === 0 && newIntent.keywords.length === 0
    && !newIntent.impliedWords?.length && (!!newIntent.city || !!newIntent.category);
  if (!previous || !isPureFilterTweak) return newIntent;
  return {
    ...newIntent,
    entityTypes: previous.entityTypes,
    impliedWords: previous.impliedWords,
    onDuty: previous.onDuty,
    category: newIntent.category ?? previous.category,
    city: newIntent.city ?? previous.city,
    keywords: previous.keywords,
  };
}

// ---------------------------------------------------------------- documents & matching

type Field = { words: string[]; weight: number };
type Doc = Field[];

const WEIGHT = { name: 3, strong: 2.5, related: 2, text: 0.8 } as const;

function field(text: string | undefined | null, weight: number): Field {
  return { words: text ? tokenize(text).map(stem) : [], weight };
}

// A search term: a single word, or a multi-word alternative from the synonym table.
type Term = string[];

type KeywordGroup = {
  original: string;
  alternatives: { term: Term; quality: number }[];
  satisfiedFor: EntityType[]; // types for which this group always matches (implied words)
  fuzzy: boolean; // decided per query: only when the word has no exact hit anywhere
};

function buildGroups(intent: ParsedIntent): KeywordGroup[] {
  const make = (word: string, satisfiedFor: EntityType[]): KeywordGroup => {
    const s = stem(word);
    const synonyms = SYNONYM_INDEX.get(s) ?? [];
    return {
      original: word,
      alternatives: [{ term: [s], quality: 1 }, ...synonyms.map(term => ({ term, quality: 0.8 }))],
      satisfiedFor,
      fuzzy: false,
    };
  };
  const groups = [
    ...(intent.impliedWords ?? []).map(w => make(w.word, w.types)),
    ...intent.keywords.map(k => make(k, [])),
  ];
  // Two query words that are synonyms of each other ("telefonía móvil") must
  // each match as written — otherwise one doc word ("móvil") satisfies both.
  for (const g of groups) {
    const own = g.alternatives[0].term[0];
    const overlaps = groups.some(o => o !== g && o.alternatives.some(a => a.term.length === 1 && a.term[0] === own));
    if (overlaps) g.alternatives = [g.alternatives[0]];
  }
  return groups;
}

function wordMatch(docWord: string, queryWord: string, fuzzy: boolean): number {
  if (docWord === queryWord) return 1;
  // Prefix only for short extensions (abogad → abogacia), not different words (segur → seguridad).
  if (queryWord.length >= 4 && docWord.length - queryWord.length <= 3 && docWord.startsWith(queryWord)) return 0.85;
  if (fuzzy && queryWord.length >= 5 && Math.abs(docWord.length - queryWord.length) <= 2) {
    const d = levenshtein(docWord, queryWord);
    if (d <= (queryWord.length >= 8 ? 2 : 1)) return 0.6;
  }
  return 0;
}

// A multi-word term matches if each of its words appears in the field.
function termMatch(f: Field, term: Term, fuzzy: boolean): number {
  if (term.length === 1) {
    let best = 0;
    for (const dw of f.words) {
      const m = wordMatch(dw, term[0], fuzzy);
      if (m > best) best = m;
      if (best === 1) break;
    }
    return best;
  }
  // Multi-word terms ('estación de servicio') must appear as a phrase, in order.
  for (let start = 0; start + term.length <= f.words.length; start++) {
    let quality = 1;
    for (let k = 0; k < term.length && quality > 0; k++) {
      quality = Math.min(quality, wordMatch(f.words[start + k], term[k], false));
    }
    if (quality > 0) return quality;
  }
  return 0;
}

function groupScore(doc: Doc, group: KeywordGroup): number {
  let best = 0;
  for (const f of doc) {
    const isDescription = f.weight < WEIGHT.related;
    for (const alt of group.alternatives) {
      // In long free text only the word itself counts: a synonym or a typo
      // match buried in a description is too weak a signal.
      if (isDescription && alt.quality < 1) continue;
      const m = termMatch(f, alt.term, group.fuzzy && !isDescription);
      if (m > 0) best = Math.max(best, m * alt.quality * f.weight);
    }
  }
  return best;
}

// Score of a document for the whole query, or -1 if it doesn't qualify.
// minGroups lets the "partial" fallback accept docs missing some words.
function scoreDoc(doc: Doc, groups: KeywordGroup[], type: EntityType, minGroups: number): number {
  let total = 0;
  let matched = 0;
  for (const g of groups) {
    if (g.satisfiedFor.includes(type)) {
      // e.g. every pharmacy IS a "farmacia": count it as a name match.
      matched++;
      total += WEIGHT.name;
      continue;
    }
    const s = groupScore(doc, g);
    if (s > 0) {
      matched++;
      total += s;
    }
  }
  return matched >= minGroups ? total : -1;
}

// ---------------------------------------------------------------- per-type document builders

type DocCache = WeakMap<object, Doc>;

function cached<T extends object>(cache: DocCache, item: T, build: (item: T) => Doc): Doc {
  let doc = cache.get(item);
  if (!doc) {
    doc = build(item);
    cache.set(item, doc);
  }
  return doc;
}

// Documents are rebuilt only when the underlying objects change (new data load).
const docCache: DocCache = new WeakMap();

function matchesCity(branches: { location: { city: string } }[] | undefined, city?: string): boolean {
  if (!city) return true;
  return !!branches?.some((b) => normalize(b.location.city) === normalize(city));
}

function matchesCityString(entityCity: string | undefined, city?: string): boolean {
  if (!city) return true;
  return !!entityCity && normalize(entityCity) === normalize(city);
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MAX_PER_TYPE = 8;
// Within a type, drop matches far weaker than the best one (e.g. a word
// buried in a description when others have it in their name).
const RELATIVE_CUTOFF = 0.35;
// Across types: drop results far weaker than the best result overall (a
// lone job that mentions "hotel" in passing, when hotels match by name).
const GLOBAL_CUTOFF = 0.3;

// Scores of the items returned by rank() in the current search, for the global cutoff.
let lastScores = new Map<unknown, number>();

function rank<T>(items: T[], docOf: (item: T) => Doc, groups: KeywordGroup[], type: EntityType, minGroups: number): T[] {
  if (groups.length === 0) return items.slice(0, MAX_PER_TYPE);
  const scored = items
    .map(item => ({ item, score: scoreDoc(docOf(item), groups, type, minGroups) }))
    .filter(r => r.score >= 0);
  if (scored.length === 0) return [];
  const top = Math.max(...scored.map(r => r.score));
  return scored
    .filter(r => top === 0 || r.score >= top * RELATIVE_CUTOFF)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PER_TYPE)
    .map(r => {
      lastScores.set(r.item, r.score);
      return r.item;
    });
}

function emptyResults(): RankedResults {
  return {
    companies: [], institutions: [], procedures: [], offers: [], posts: [], services: [], jobs: [], events: [],
    foodItems: [], professionals: [], itineraries: [], places: [], pharmacies: [], clinics: [], hospitals: [],
  };
}

function runSearch(intent: ParsedIntent, data: SearchInputData, groups: KeywordGroup[], opts: { types: EntityType[]; city?: string; minGroups: number }): RankedResults {
  const wantsAll = opts.types.length === 0;
  const wants = (t: EntityType) => wantsAll || opts.types.includes(t);
  const { city, minGroups } = opts;
  lastScores = new Map();
  const results = emptyResults();
  const serviceName = new Map(data.services.map(s => [s.id, s.name]));
  const serviceNames = (ids: (string | undefined)[]) => ids.map(id => (id ? serviceName.get(id) : undefined)).filter(Boolean).join(' ');

  // A query made only of words that select types ("farmacias", "empleos")
  // lists that type; otherwise documents must match every keyword group.
  const companyDoc = (c: Company): Doc => cached(docCache, c, () => [
    field(c.name, WEIGHT.name),
    field(c.category, WEIGHT.strong),
    field(serviceNames((c.branches || []).flatMap(b => b.servicesOffered || [])), WEIGHT.related),
    field(c.description, WEIGHT.text),
  ]);

  if (wants('company')) {
    const eligible = data.companies.filter(c => matchesCity(c.branches, city));
    // Companies only show up for type words that apply to them (implied ones need the word to match).
    results.companies = rank(eligible, companyDoc, groups, 'company', minGroups);
  }

  if (wants('institution')) {
    const eligible = data.institutions.filter(i => matchesCity(i.branches, city));
    results.institutions = rank(eligible, i => cached(docCache, i, () => [
      field(i.name, WEIGHT.name), field(i.category, WEIGHT.strong), field(i.description, WEIGHT.text),
    ]), groups, 'institution', minGroups);
  }

  if (wants('procedure')) {
    results.procedures = rank(data.procedures, p => cached(docCache, p, () => [
      field(p.name, WEIGHT.name), field(p.category, WEIGHT.strong), field(p.institution, WEIGHT.related), field(p.description, WEIGHT.text),
    ]), groups, 'procedure', minGroups);
  }

  if (wants('offer')) {
    const companiesById = new Map(data.companies.map(c => [c.id, c]));
    const allOffers: OfferResult[] = data.companies.flatMap(c =>
      (c.offers || []).map(o => ({ ...o, companyId: c.id, companyName: c.name, companyLogo: c.logo, companyCategory: c.category })),
    );
    const eligible = allOffers.filter(o => matchesCity(companiesById.get(o.companyId)?.branches, city));
    // Offers are rebuilt each search (spread copies), so they aren't cached.
    results.offers = rank(eligible, o => [
      field(o.title, WEIGHT.name), field(o.companyName, WEIGHT.related), field(o.companyCategory, WEIGHT.related), field(o.description, WEIGHT.text),
    ], groups, 'offer', minGroups);
  }

  if (wants('post')) {
    results.posts = rank(data.posts, p => cached(docCache, p, () => [
      field(p.title, WEIGHT.name), field(p.category, WEIGHT.strong), field(p.excerpt, WEIGHT.text),
    ]), groups, 'post', minGroups);
  }

  if (wants('service')) {
    results.services = rank(data.services, s => cached(docCache, s, () => [
      field(s.name, WEIGHT.name), field(s.category, WEIGHT.related), field(s.description, WEIGHT.text),
    ]), groups, 'service', minGroups);
  }

  if (wants('job')) {
    const eligible = data.jobs.filter(j => j.status === 'open' && matchesCityString(j.city, city));
    results.jobs = rank(eligible, j => cached(docCache, j, () => [
      field(j.title, WEIGHT.name), field(j.sector, WEIGHT.strong), field(j.companyName, WEIGHT.related), field(j.description, WEIGHT.text),
    ]), groups, 'job', minGroups);
  }

  if (wants('event')) {
    const eligible = data.events.filter(e => e.status === 'scheduled' && matchesCityString(e.city, city));
    results.events = rank(eligible, e => cached(docCache, e, () => [
      field(e.title, WEIGHT.name), field(e.category, WEIGHT.strong), field(e.organizerName, WEIGHT.related), field(e.description, WEIGHT.text),
    ]), groups, 'event', minGroups);
  }

  if (wants('food')) {
    const companiesById = new Map(data.companies.map(c => [c.id, c]));
    const eligible: FoodResult[] = data.menuItems
      .filter(m => m.available && matchesCity(companiesById.get(m.companyId)?.branches, city))
      .map(m => ({ ...m, companyLogo: companiesById.get(m.companyId)?.logo || '' }));
    results.foodItems = rank(eligible, m => [
      field(m.name, WEIGHT.name), field(m.foodType, WEIGHT.strong), field(m.companyName, WEIGHT.related), field(m.description, WEIGHT.text),
    ], groups, 'food', minGroups);
  }

  if (wants('professional')) {
    const eligible = data.professionals.filter(p => matchesCityString(p.city, city));
    results.professionals = rank(eligible, p => cached(docCache, p, () => [
      field(p.title, WEIGHT.name), field(p.displayName, WEIGHT.name), field(p.category, WEIGHT.strong),
      field((p.skills || []).join(' '), WEIGHT.related), field((p.services || []).map(s => s.name).join(' '), WEIGHT.related),
      field(p.bio, WEIGHT.text),
    ]), groups, 'professional', minGroups);
  }

  if (wants('itinerary')) {
    const eligible = data.itineraries.filter(it => it.visibility === 'public' && matchesCityString(it.city, city));
    results.itineraries = rank(eligible, it => cached(docCache, it, () => [
      field(it.title, WEIGHT.name), field((it.theme || []).join(' '), WEIGHT.strong), field(it.description, WEIGHT.text),
    ]), groups, 'itinerary', minGroups);
  }

  if (wants('place')) {
    const eligible = data.places.filter(p => p.status === 'approved' && (!city || (!!p.location && normalize(p.location.city) === normalize(city))));
    results.places = rank(eligible, p => cached(docCache, p, () => [
      field(p.name, WEIGHT.name), field(p.category, WEIGHT.strong), field(p.description, WEIGHT.text),
    ]), groups, 'place', minGroups);
  }

  const facilityDoc = (f: HealthFacility): Doc => cached(docCache, f, () => [
    field(f.name, WEIGHT.name), field((f.specialties || []).join(' '), WEIGHT.strong),
    field(serviceNames(f.services || []), WEIGHT.related), field(f.description, WEIGHT.text),
  ]);
  const today = todayIso();
  if (wants('pharmacy')) {
    const eligible = data.healthFacilities.filter(f => f.type === 'pharmacy' && matchesCity(f.branches, city)
      && (!intent.onDuty || (f.onDutyDates || []).includes(today)));
    results.pharmacies = rank(eligible, facilityDoc, groups, 'pharmacy', minGroups);
  }
  if (wants('clinic')) {
    const eligible = data.healthFacilities.filter(f => f.type === 'clinic' && matchesCity(f.branches, city));
    results.clinics = rank(eligible, facilityDoc, groups, 'clinic', minGroups);
  }
  if (wants('hospital')) {
    const eligible = data.healthFacilities.filter(f => f.type === 'hospital' && matchesCity(f.branches, city));
    results.hospitals = rank(eligible, facilityDoc, groups, 'hospital', minGroups);
  }

  if (lastScores.size > 0) {
    const best = Math.max(...lastScores.values());
    for (const key of RESULT_KEYS) {
      (results[key] as unknown[]) = (results[key] as unknown[]).filter(item => (lastScores.get(item) ?? best) >= best * GLOBAL_CUTOFF);
    }
  }
  return results;
}

// All documents, for deciding per keyword whether typo tolerance is needed.
function allDocs(data: SearchInputData): Doc[] {
  const serviceName = new Map(data.services.map(s => [s.id, s.name]));
  const names = (ids: string[]) => ids.map(id => serviceName.get(id)).filter(Boolean).join(' ');
  return [
    ...data.companies.map(c => cached(docCache, c, () => [
      field(c.name, WEIGHT.name), field(c.category, WEIGHT.strong),
      field(names((c.branches || []).flatMap(b => b.servicesOffered || [])), WEIGHT.related), field(c.description, WEIGHT.text),
    ])),
    ...data.services.map(s => [field(s.name, 1), field(s.category, 1)]),
    ...data.procedures.map(p => [field(p.name, 1), field(p.description, 1)]),
    ...data.institutions.map(i => [field(i.name, 1), field(i.description, 1)]),
    ...data.places.map(p => [field(p.name, 1), field(p.description, 1)]),
    ...data.jobs.map(j => [field(j.title, 1), field(j.sector, 1)]),
    ...data.professionals.map(p => [field(p.title, 1), field((p.skills || []).join(' '), 1)]),
    ...data.healthFacilities.map(f => [field(f.name, 1), field(f.description, 1)]),
  ];
}

export function executeSearch(intent: ParsedIntent, data: SearchInputData): RankedResults {
  const groups = buildGroups(intent);

  // Typo tolerance only for words that match nothing as typed — so "blanco"
  // never turns into "banco" when "blanco" itself exists somewhere.
  if (groups.length) {
    const docs = allDocs(data);
    for (const g of groups) {
      const exact = docs.some(doc => doc.some(f => g.alternatives.some(a => termMatch(f, a.term, false) > 0)));
      g.fuzzy = !exact;
    }
  }

  // Nothing searchable at all (e.g. only stopwords): no results rather than everything.
  if (groups.length === 0 && intent.entityTypes.length === 0 && !intent.city) return emptyResults();

  const all = groups.length;
  const attempt = (types: EntityType[], city: string | undefined, minGroups: number) =>
    runSearch(intent, data, groups, { types, city, minGroups });

  let results = attempt(intent.entityTypes, intent.city, all);
  if (countResults(results) > 0) return results;

  // 1. A type word may have been too narrow ("abrir un negocio" → trámites).
  // Only when there are real keywords to search for elsewhere: "hospital en
  // Bata" or "farmacia de guardia" must stay hospitals/pharmacies.
  const canDropTypes = intent.entityTypes.length > 0 && intent.keywords.length > 0 && !intent.onDuty;
  if (canDropTypes) {
    results = attempt([], intent.city, all);
    if (countResults(results) > 0) return { ...results, relaxed: 'types' };
  }
  // 2. Nothing in that city: show other cities.
  if (intent.city) {
    results = attempt(intent.entityTypes, undefined, all);
    if (countResults(results) > 0) return { ...results, relaxed: 'city' };
  }
  // 3. Long queries (3+ words): accept documents matching most of them. Not
  // for two words, where matching just one ("privada") is mostly noise.
  if (all >= 3) {
    results = attempt(intent.entityTypes, intent.city, Math.ceil(all / 2));
    if (countResults(results) > 0) return { ...results, relaxed: 'partial' };
  }
  return emptyResults();
}

// ---------------------------------------------------------------- natural-language summary

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

// Deterministic pseudo-random pick, so the same query always reads the same way.
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
  const locationSuffix = intent.city && results.relaxed !== 'city' ? ` en ${intent.city}` : '';
  const dutySuffix = intent.onDuty ? ' de guardia hoy' : '';
  const seed = hashString(intent.raw) + total;

  if (total === 0) {
    if (intent.onDuty) {
      return `No hay farmacias de guardia registradas para hoy${intent.city ? ` en ${intent.city}` : ''}. Consulte el listado completo de farmacias o llame antes de ir.`;
    }
    const opener = pickVariant(ZERO_RESULT_OPENERS, seed);
    const hint = intent.city ? 'buscar en otra ciudad o usar otras palabras' : 'usar otras palabras o ser más específico';
    return `${opener}${dutySuffix}${intent.city ? ` en ${intent.city}` : ''}. Puede intentar ${hint}.`;
  }

  const activeTypes = counts.filter(([, n]) => n > 0);
  const parts = activeTypes.map(([type, n]) => `${n} ${n === 1 ? ENTITY_LABELS[type].singular : ENTITY_LABELS[type].plural}`);
  const partsText = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
  const opener = pickVariant(OPENERS, seed);

  let mention = '';
  if (activeTypes.length === 1 && activeTypes[0][1] >= 2 && activeTypes[0][1] <= 6) {
    const topName = getTopResultName(results);
    if (topName) mention = `, ${pickVariant(MENTION_CONNECTORS, seed + 1)} ${topName}`;
  }

  if (results.relaxed === 'city') return `No encontré nada en ${intent.city}. En otras ciudades hay ${partsText}${dutySuffix}.`;
  if (results.relaxed === 'partial') return `Ningún resultado tiene todas las palabras; estos coinciden en parte: ${partsText}${locationSuffix}.`;
  return `${opener} ${partsText}${dutySuffix}${locationSuffix}${mention}.`;
}
