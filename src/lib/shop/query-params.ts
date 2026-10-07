import { PRODUCT_SORT_LABELS, type ProductCondition, type ProductQuery, type ProductSort } from './types';

// URL <-> ProductQuery. Filters live in the query string so listings are
// shareable, crawlable and work without JavaScript.

export type RawSearchParams = Record<string, string | string[] | undefined>;

const CONDITIONS: ProductCondition[] = ['new', 'used', 'refurbished'];

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function list(v: string | string[] | undefined): string[] {
  const values = Array.isArray(v) ? v : v ? [v] : [];
  return values.flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean).slice(0, 20);
}

function num(v: string | string[] | undefined): number | undefined {
  const n = Number(one(v));
  return one(v) && Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseProductQuery(sp: RawSearchParams): ProductQuery {
  const sort = one(sp.orden) as ProductSort | undefined;
  return {
    q: one(sp.q)?.slice(0, 100) || undefined,
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    brands: list(sp.marca),
    conditions: list(sp.estado).filter((c): c is ProductCondition => CONDITIONS.includes(c as ProductCondition)),
    city: one(sp.ciudad)?.slice(0, 128) || undefined,
    inStockOnly: one(sp.stock) === '1',
    onSaleOnly: one(sp.oferta) === '1',
    sort: sort && sort in PRODUCT_SORT_LABELS ? sort : undefined,
    page: num(sp.pagina) ? Math.floor(num(sp.pagina)!) : undefined,
  };
}

// Inverse of parseProductQuery for the fields that live in the URL
// (categorySlug/companyId are part of the path instead).
export function productQueryToParams(q: ProductQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set('q', q.q);
  if (q.minPrice !== undefined) p.set('min', String(q.minPrice));
  if (q.maxPrice !== undefined) p.set('max', String(q.maxPrice));
  if (q.brands?.length) p.set('marca', q.brands.join(','));
  if (q.conditions?.length) p.set('estado', q.conditions.join(','));
  if (q.city) p.set('ciudad', q.city);
  if (q.inStockOnly) p.set('stock', '1');
  if (q.onSaleOnly) p.set('oferta', '1');
  if (q.sort && q.sort !== 'relevance') p.set('orden', q.sort);
  if (q.page && q.page > 1) p.set('pagina', String(q.page));
  return p;
}

export function hrefWith(basePath: string, q: ProductQuery): string {
  const qs = productQueryToParams(q).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function activeFilterCount(q: ProductQuery): number {
  return [
    q.minPrice !== undefined || q.maxPrice !== undefined,
    !!q.brands?.length,
    !!q.conditions?.length,
    !!q.city,
    !!q.inStockOnly,
    !!q.onSaleOnly,
  ].filter(Boolean).length;
}
