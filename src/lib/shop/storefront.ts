import { unstable_cache } from 'next/cache';
import { getCurrentCaller, isManagerRole } from '../firebase-admin';
import { prisma, Prisma } from '../db';
import { productInclude, productListSelect, publicProductWhere, toProduct, toProductCategory, toProductListItem } from './db';
import type { Product, ProductCategory, ProductListItem, ProductQuery, ProductSearchResult, ProductSort } from './types';

// Public storefront reads, called from Server Components only (this is not a
// 'use server' module, so none of it is exposed as a Server Action endpoint).
// Filtering, sorting and pagination all happen in MySQL so the catalogue can
// grow without the pages loading it whole. Results are cached briefly per
// distinct query, tagged 'shop-products' (seller writes revalidate the tag).

export const PRODUCTS_PER_PAGE = 24;
const RAIL_SIZE = 12;
const CACHE = { revalidate: 60, tags: ['shop-products'] };

const getCategoriesCached = unstable_cache(async (): Promise<ProductCategory[]> => {
  const rows = await prisma.productCategory.findMany({ where: { isActive: true }, orderBy: [{ position: 'asc' }, { name: 'asc' }] });
  return rows.map(toProductCategory);
}, ['shop-active-categories'], { revalidate: 300, tags: ['product-categories'] });

// Active categories only; a hidden parent hides its whole subtree.
export async function getActiveCategories(): Promise<ProductCategory[]> {
  const rows = await getCategoriesCached();
  const ids = new Set(rows.map(c => c.id));
  const visible = (c: ProductCategory): boolean => !c.parentId || (ids.has(c.parentId) && visible(rows.find(p => p.id === c.parentId)!));
  return rows.filter(visible);
}

function subtreeIds(categories: ProductCategory[], rootId: string): string[] {
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) {
    for (const c of categories) if (c.parentId === ids[i]) ids.push(c.id);
  }
  return ids;
}

const SORT_ORDER: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  relevance: [{ isFeatured: 'desc' }, { salesCount: 'desc' }, { publishedAt: 'desc' }],
  newest: [{ publishedAt: 'desc' }],
  price_asc: [{ minPrice: 'asc' }, { publishedAt: 'desc' }],
  price_desc: [{ minPrice: 'desc' }, { publishedAt: 'desc' }],
  best_selling: [{ salesCount: 'desc' }, { publishedAt: 'desc' }],
  rating: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
};

// Every word must appear in the title, brand or descriptions. The tables use
// a case- and accent-insensitive collation, so "telefono" finds "Teléfono".
function textFilter(q: string | undefined): Prisma.ProductWhereInput[] {
  const words = (q ?? '').trim().split(/\s+/).filter(w => w.length > 1).slice(0, 8);
  return words.map(w => ({
    OR: [
      { title: { contains: w } },
      { brand: { contains: w } },
      { shortDescription: { contains: w } },
      { description: { contains: w } },
    ],
  }));
}

async function runSearch(query: ProductQuery): Promise<ProductSearchResult> {
  const categories = await getActiveCategories();
  const category = query.categorySlug ? categories.find(c => c.slug === query.categorySlug) : undefined;
  const page = Math.max(1, Math.floor(query.page ?? 1));

  // Filters every facet shares; each facet then drops its own filter so the
  // seller sees e.g. all brands available within the current category/price.
  const base: Prisma.ProductWhereInput[] = [
    publicProductWhere,
    ...textFilter(query.q),
    ...(query.companyId ? [{ companyId: query.companyId }] : []),
    ...(query.conditions?.length ? [{ condition: { in: query.conditions } }] : []),
    ...(query.city ? [{ company: { branches: { some: { city: query.city } } } }] : []),
    ...(query.inStockOnly ? [{ inStock: true }] : []),
    ...(query.onSaleOnly ? [{ isOnSale: true }] : []),
  ];
  const categoryFilter: Prisma.ProductWhereInput[] = query.categorySlug
    ? [{ categoryId: { in: category ? subtreeIds(categories, category.id) : [] } }]
    : [];
  const priceFilter: Prisma.ProductWhereInput[] = [
    ...(query.minPrice !== undefined ? [{ minPrice: { gte: query.minPrice } }] : []),
    ...(query.maxPrice !== undefined ? [{ minPrice: { lte: query.maxPrice } }] : []),
  ];
  const brandFilter: Prisma.ProductWhereInput[] = query.brands?.length ? [{ brand: { in: query.brands } }] : [];

  const where = { AND: [...base, ...categoryFilter, ...priceFilter, ...brandFilter] };

  const [total, rows, brandRows, categoryRows, priceAgg] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: productListSelect,
      orderBy: [...SORT_ORDER[query.sort ?? 'relevance'], { id: 'asc' }],
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
    }),
    prisma.product.groupBy({
      by: ['brand'],
      where: { AND: [...base, ...categoryFilter, ...priceFilter, { brand: { not: null } }] },
      _count: { _all: true },
      orderBy: { _count: { brand: 'desc' } },
      take: 30,
    }),
    prisma.product.groupBy({
      by: ['categoryId'],
      where: { AND: [...base, ...priceFilter, ...brandFilter, { categoryId: { not: null } }] },
      _count: { _all: true },
    }),
    prisma.product.aggregate({
      where: { AND: [...base, ...categoryFilter, ...brandFilter] },
      _min: { minPrice: true },
      _max: { minPrice: true },
    }),
  ]);

  return {
    items: rows.map(toProductListItem),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
    facets: {
      brands: brandRows.filter(b => b.brand).map(b => ({ name: b.brand as string, count: b._count._all })),
      categories: categoryRows.map(c => ({ id: c.categoryId as string, count: c._count._all })),
      price: { min: Number(priceAgg._min.minPrice ?? 0), max: Number(priceAgg._max.minPrice ?? 0) },
    },
  };
}

const searchCached = unstable_cache(
  async (key: string) => runSearch(JSON.parse(key) as ProductQuery),
  ['shop-search'],
  CACHE,
);

export async function searchProducts(query: ProductQuery): Promise<ProductSearchResult> {
  // Normalised key so equivalent queries share one cache entry.
  const key = JSON.stringify({
    q: query.q?.trim().toLowerCase() || undefined,
    categorySlug: query.categorySlug || undefined,
    companyId: query.companyId || undefined,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    brands: query.brands?.length ? [...query.brands].sort() : undefined,
    conditions: query.conditions?.length ? [...query.conditions].sort() : undefined,
    city: query.city || undefined,
    inStockOnly: query.inStockOnly || undefined,
    onSaleOnly: query.onSaleOnly || undefined,
    sort: query.sort && query.sort !== 'relevance' ? query.sort : undefined,
    page: query.page && query.page > 1 ? query.page : undefined,
  });
  return searchCached(key);
}

async function rail(where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput[]): Promise<ProductListItem[]> {
  const rows = await prisma.product.findMany({
    where: { AND: [publicProductWhere, where] },
    select: productListSelect,
    orderBy,
    take: RAIL_SIZE,
  });
  return rows.map(toProductListItem);
}

export const getStorefrontHome = unstable_cache(async () => {
  const [featured, deals, newest, bestSellers, categoryCounts, totalProducts] = await Promise.all([
    rail({ isFeatured: true }, [{ publishedAt: 'desc' }]),
    rail({ isOnSale: true, inStock: true }, [{ salesCount: 'desc' }, { publishedAt: 'desc' }]),
    rail({}, [{ publishedAt: 'desc' }]),
    rail({ salesCount: { gt: 0 } }, [{ salesCount: 'desc' }]),
    prisma.product.groupBy({ by: ['categoryId'], where: { ...publicProductWhere, categoryId: { not: null } }, _count: { _all: true } }),
    prisma.product.count({ where: publicProductWhere }),
  ]);
  return {
    featured,
    deals,
    newest,
    bestSellers,
    categoryCounts: Object.fromEntries(categoryCounts.map(c => [c.categoryId as string, c._count._all])) as Record<string, number>,
    totalProducts,
  };
}, ['shop-home'], CACHE);

const getPublicProductCached = unstable_cache(async (slug: string): Promise<Product | null> => {
  const row = await prisma.product.findFirst({ where: { slug, ...publicProductWhere }, include: productInclude });
  return row ? toProduct(row) : null;
}, ['shop-product-by-slug'], CACHE);

// Published product, or — for its seller or a manager — any status, so they
// can preview a draft before publishing (`isPreview` true).
export async function getProductBySlug(slug: string): Promise<{ product: Product; isPreview: boolean } | undefined> {
  const product = await getPublicProductCached(slug);
  if (product) return { product, isPreview: false };

  const row = await prisma.product.findUnique({ where: { slug }, include: { ...productInclude, company: { select: { name: true, ownerId: true } } } });
  if (!row) return undefined;
  const caller = await getCurrentCaller();
  if (!caller || (!isManagerRole(caller.role) && row.company.ownerId !== caller.uid)) return undefined;
  return { product: toProduct(row), isPreview: true };
}

export const getRelatedProducts = unstable_cache(async (productId: string, categoryId: string | null, companyId: string): Promise<{ related: ProductListItem[]; fromSeller: ProductListItem[] }> => {
  const [related, fromSeller] = await Promise.all([
    categoryId ? rail({ categoryId, id: { not: productId } }, [{ salesCount: 'desc' }, { publishedAt: 'desc' }]) : Promise.resolve([]),
    rail({ companyId, id: { not: productId } }, [{ salesCount: 'desc' }, { publishedAt: 'desc' }]),
  ]);
  return { related, fromSeller };
}, ['shop-related'], CACHE);

export const getCompanyProductCount = unstable_cache(async (companyId: string): Promise<number> => {
  return prisma.product.count({ where: { companyId, ...publicProductWhere } });
}, ['shop-company-count'], CACHE);

export const getProductSitemapEntries = unstable_cache(async () => {
  const rows = await prisma.product.findMany({ where: publicProductWhere, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: 'desc' }, take: 45000 });
  return rows.map(r => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() }));
}, ['shop-sitemap'], { revalidate: 3600, tags: ['shop-products'] });
