import { RENTAL_SORT_LABELS, type RentalCategory, type RentalQuery, type RentalSort } from './types';

// URL <-> RentalQuery, with Spanish parameter names (shareable, crawlable,
// work without JavaScript).

export type RawSearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean).slice(0, 20);
const num = (v: string | string[] | undefined) => {
  const s = one(v);
  const n = Number(s);
  return s && Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function parseRentalQuery(sp: RawSearchParams): RentalQuery {
  const cat = one(sp.cat);
  const term = one(sp.modalidad);
  const sort = one(sp.orden) as RentalSort | undefined;
  return {
    category: cat === 'inmuebles' ? 'property' : cat === 'vehiculos' ? 'vehicle' : undefined,
    kinds: list(sp.tipo),
    city: one(sp.ciudad)?.slice(0, 128) || undefined,
    term: term === 'meses' ? 'long' : term === 'dias' ? 'short' : undefined,
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    minBedrooms: num(sp.hab),
    minGuests: num(sp.personas),
    furnished: one(sp.amueblado) === '1' || undefined,
    transmission: ['manual', 'automatico'].includes(one(sp.cambio) ?? '') ? one(sp.cambio) : undefined,
    withDriver: one(sp.conductor) === '1' || undefined,
    q: one(sp.q)?.slice(0, 100) || undefined,
    sort: sort && sort in RENTAL_SORT_LABELS ? sort : undefined,
    page: num(sp.pagina) ? Math.floor(num(sp.pagina)!) : undefined,
  };
}

export function categorySlug(c: RentalCategory): string {
  return c === 'property' ? 'inmuebles' : 'vehiculos';
}

export function rentalQueryToParams(q: RentalQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set('q', q.q);
  if (q.category) p.set('cat', categorySlug(q.category));
  if (q.kinds?.length) p.set('tipo', q.kinds.join(','));
  if (q.city) p.set('ciudad', q.city);
  if (q.term) p.set('modalidad', q.term === 'long' ? 'meses' : 'dias');
  if (q.minPrice !== undefined) p.set('min', String(q.minPrice));
  if (q.maxPrice !== undefined) p.set('max', String(q.maxPrice));
  if (q.minBedrooms) p.set('hab', String(q.minBedrooms));
  if (q.minGuests) p.set('personas', String(q.minGuests));
  if (q.furnished) p.set('amueblado', '1');
  if (q.transmission) p.set('cambio', q.transmission);
  if (q.withDriver) p.set('conductor', '1');
  if (q.sort && q.sort !== 'relevance') p.set('orden', q.sort);
  if (q.page && q.page > 1) p.set('pagina', String(q.page));
  return p;
}

export function rentalHref(q: RentalQuery, base = '/alquiler/buscar'): string {
  const qs = rentalQueryToParams(q).toString();
  return qs ? `${base}?${qs}` : base;
}

export function activeRentalFilters(q: RentalQuery): number {
  return [q.kinds?.length, q.city, q.term, q.minPrice !== undefined || q.maxPrice !== undefined, q.minBedrooms, q.minGuests, q.furnished, q.transmission, q.withDriver]
    .filter(Boolean).length;
}
