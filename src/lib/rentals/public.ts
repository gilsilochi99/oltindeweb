import { unstable_cache } from 'next/cache';
import { prisma, Prisma } from '../db';
import { getCurrentCaller, isManagerRole } from '../firebase-admin';
import { publicRentalWhere, rentalInclude, toRentalListing } from './db';
import type { RentalListing, RentalListItem, RentalQuery, RentalSearchResult, RentalSort } from './types';

// Public reads for /alquiler, called from Server Components only (not a
// 'use server' module). Filtering, sorting and pagination run in MySQL;
// results are cached briefly per query, tagged 'rentals'.

export const RENTALS_PER_PAGE = 24;
const CACHE = { revalidate: 60, tags: ['rentals'] };

const listSelect = {
  id: true, slug: true, title: true, category: true, kind: true, city: true, neighborhood: true,
  shortTermEnabled: true, dailyPrice: true, longTermEnabled: true, monthlyPrice: true,
  bedrooms: true, bathrooms: true, maxGuests: true, seats: true, transmission: true, driverOption: true,
  isFeatured: true, ratingAvg: true, ratingCount: true, companyId: true,
  company: { select: { name: true } },
  images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
} satisfies Prisma.RentalListingSelect;

type ListRow = Prisma.RentalListingGetPayload<{ select: typeof listSelect }>;
const num = (v: Prisma.Decimal | null) => (v === null ? undefined : Number(v));
const opt = <T>(v: T | null): T | undefined => v ?? undefined;

function toListItem(r: ListRow): RentalListItem {
  return {
    id: r.id, slug: r.slug, title: r.title, image: r.images[0]?.url, category: r.category, kind: r.kind,
    city: r.city, neighborhood: opt(r.neighborhood),
    shortTermEnabled: r.shortTermEnabled, dailyPrice: num(r.dailyPrice),
    longTermEnabled: r.longTermEnabled, monthlyPrice: num(r.monthlyPrice),
    bedrooms: opt(r.bedrooms), bathrooms: opt(r.bathrooms), maxGuests: opt(r.maxGuests), seats: opt(r.seats),
    transmission: opt(r.transmission), driverOption: opt(r.driverOption),
    isFeatured: r.isFeatured, ratingAvg: Number(r.ratingAvg), ratingCount: r.ratingCount,
    companyId: r.companyId, companyName: r.company.name,
  };
}

function textFilter(q: string | undefined): Prisma.RentalListingWhereInput[] {
  const words = (q ?? '').trim().split(/\s+/).filter(w => w.length > 1).slice(0, 8);
  return words.map(w => ({
    OR: [{ title: { contains: w } }, { description: { contains: w } }, { neighborhood: { contains: w } }, { brand: { contains: w } }, { model: { contains: w } }],
  }));
}

function orderFor(sort: RentalSort | undefined, term: 'short' | 'long'): Prisma.RentalListingOrderByWithRelationInput[] {
  const priceField = term === 'long' ? 'monthlyPrice' : 'dailyPrice';
  switch (sort) {
    case 'newest': return [{ publishedAt: 'desc' }];
    case 'price_asc': return [{ [priceField]: { sort: 'asc', nulls: 'last' } }, { publishedAt: 'desc' }];
    case 'price_desc': return [{ [priceField]: { sort: 'desc', nulls: 'last' } }, { publishedAt: 'desc' }];
    default: return [{ isFeatured: 'desc' }, { bookingCount: 'desc' }, { publishedAt: 'desc' }];
  }
}

async function runSearch(q: RentalQuery): Promise<RentalSearchResult> {
  const page = Math.max(1, Math.floor(q.page ?? 1));
  // A price range needs a term; default to the per-night/day price.
  const term = q.term ?? (q.minPrice !== undefined || q.maxPrice !== undefined ? 'short' : undefined);
  const priceField = term === 'long' ? 'monthlyPrice' : 'dailyPrice';

  const base: Prisma.RentalListingWhereInput[] = [
    publicRentalWhere,
    ...textFilter(q.q),
    ...(q.category ? [{ category: q.category }] : []),
    ...(q.companyId ? [{ companyId: q.companyId }] : []),
    ...(term === 'short' ? [{ shortTermEnabled: true }] : term === 'long' ? [{ longTermEnabled: true }] : []),
    ...(q.minPrice !== undefined ? [{ [priceField]: { gte: q.minPrice } }] : []),
    ...(q.maxPrice !== undefined ? [{ [priceField]: { lte: q.maxPrice } }] : []),
    ...(q.minBedrooms ? [{ bedrooms: { gte: q.minBedrooms } }] : []),
    ...(q.minGuests ? [{ OR: [{ maxGuests: { gte: q.minGuests } }, { seats: { gte: q.minGuests } }] }] : []),
    ...(q.furnished ? [{ furnished: true }] : []),
    ...(q.transmission ? [{ transmission: q.transmission }] : []),
    ...(q.withDriver ? [{ driverOption: { in: ['optional', 'required'] as ('optional' | 'required')[] } }] : []),
  ];
  const kindFilter: Prisma.RentalListingWhereInput[] = q.kinds?.length ? [{ kind: { in: q.kinds } }] : [];
  const cityFilter: Prisma.RentalListingWhereInput[] = q.city ? [{ city: q.city }] : [];
  const where = { AND: [...base, ...kindFilter, ...cityFilter] };

  const [total, rows, kindRows, cityRows] = await Promise.all([
    prisma.rentalListing.count({ where }),
    prisma.rentalListing.findMany({
      where, select: listSelect,
      orderBy: [...orderFor(q.sort, term === 'long' ? 'long' : 'short'), { id: 'asc' }],
      skip: (page - 1) * RENTALS_PER_PAGE, take: RENTALS_PER_PAGE,
    }),
    // Facets drop their own filter so every option stays visible.
    prisma.rentalListing.groupBy({ by: ['kind'], where: { AND: [...base, ...cityFilter] }, _count: { _all: true } }),
    prisma.rentalListing.groupBy({ by: ['city'], where: { AND: [...base, ...kindFilter] }, _count: { _all: true } }),
  ]);

  return {
    items: rows.map(toListItem),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / RENTALS_PER_PAGE)),
    facets: {
      kinds: kindRows.map(k => ({ kind: k.kind, count: k._count._all })).sort((a, b) => b.count - a.count),
      cities: cityRows.map(c => ({ city: c.city, count: c._count._all })).sort((a, b) => b.count - a.count),
    },
  };
}

const searchCached = unstable_cache(async (key: string) => runSearch(JSON.parse(key) as RentalQuery), ['rentals-search'], CACHE);

export async function searchRentals(q: RentalQuery): Promise<RentalSearchResult> {
  const key = JSON.stringify({
    ...q,
    q: q.q?.trim().toLowerCase() || undefined,
    kinds: q.kinds?.length ? [...q.kinds].sort() : undefined,
    sort: q.sort && q.sort !== 'relevance' ? q.sort : undefined,
    page: q.page && q.page > 1 ? q.page : undefined,
  });
  return searchCached(key);
}

async function rail(where: Prisma.RentalListingWhereInput, take = 12): Promise<RentalListItem[]> {
  const rows = await prisma.rentalListing.findMany({
    where: { AND: [publicRentalWhere, where] }, select: listSelect,
    orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }], take,
  });
  return rows.map(toListItem);
}

export const getRentalsHome = unstable_cache(async () => {
  const [featured, properties, vehicles, kindCounts, cityCounts, total] = await Promise.all([
    rail({ isFeatured: true }),
    rail({ category: 'property' }),
    rail({ category: 'vehicle' }),
    prisma.rentalListing.groupBy({ by: ['category', 'kind'], where: publicRentalWhere, _count: { _all: true } }),
    prisma.rentalListing.groupBy({ by: ['city'], where: publicRentalWhere, _count: { _all: true } }),
    prisma.rentalListing.count({ where: publicRentalWhere }),
  ]);
  return {
    featured, properties, vehicles, total,
    kindCounts: kindCounts.map(k => ({ category: k.category, kind: k.kind, count: k._count._all })),
    cityCounts: cityCounts.map(c => ({ city: c.city, count: c._count._all })).sort((a, b) => b.count - a.count),
  };
}, ['rentals-home'], CACHE);

const getPublicRentalCached = unstable_cache(async (slug: string): Promise<RentalListing | null> => {
  const row = await prisma.rentalListing.findFirst({ where: { slug, ...publicRentalWhere }, include: rentalInclude });
  return row ? toRentalListing(row) : null;
}, ['rental-by-slug'], CACHE);

// Published listing, or (for its advertiser or a manager) any status, as a preview.
export async function getRentalBySlug(slug: string): Promise<{ listing: RentalListing; isPreview: boolean } | undefined> {
  const listing = await getPublicRentalCached(slug);
  if (listing) return { listing, isPreview: false };
  const row = await prisma.rentalListing.findUnique({ where: { slug }, include: { ...rentalInclude, company: { select: { name: true, ownerId: true } } } });
  if (!row) return undefined;
  const caller = await getCurrentCaller();
  if (!caller || (!isManagerRole(caller.role) && row.company.ownerId !== caller.uid)) return undefined;
  return { listing: toRentalListing(row), isPreview: true };
}

export const getSimilarRentals = unstable_cache(async (id: string, category: 'property' | 'vehicle', city: string, companyId: string) => {
  const [similar, fromCompany] = await Promise.all([
    rail({ category, city, id: { not: id } }, 8),
    rail({ companyId, id: { not: id } }, 8),
  ]);
  return { similar, fromCompany };
}, ['rentals-similar'], CACHE);

export const getRentalSitemapEntries = unstable_cache(async () => {
  const rows = await prisma.rentalListing.findMany({ where: publicRentalWhere, select: { slug: true, updatedAt: true }, take: 45000 });
  return rows.map(r => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() }));
}, ['rentals-sitemap'], { revalidate: 3600, tags: ['rentals'] });

export const getCompanyRentalCount = unstable_cache(async (companyId: string) =>
  prisma.rentalListing.count({ where: { companyId, ...publicRentalWhere } }), ['rentals-company-count'], CACHE);
