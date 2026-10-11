import { unstable_cache } from 'next/cache';
import { prisma } from './db';
import { publicRentalWhere } from './rentals/db';

// Live figures for the "Para ti" / "Para empresas" pages: one cached round of
// COUNTs per hour instead of loading full rows.
export type PublicStats = {
  companies: number;
  verifiedCompanies: number;
  cities: number;
  products: number;
  rentals: number;
  professionals: number;
  itineraries: number;
};

export const getPublicStats = unstable_cache(async (): Promise<PublicStats> => {
  const now = new Date();
  const [companies, verifiedCompanies, cities, products, rentals, professionals, itineraries] = await Promise.all([
    prisma.company.count({ where: { isActive: true } }),
    prisma.company.count({ where: { isActive: true, isVerified: true, OR: [{ verifiedUntil: null }, { verifiedUntil: { gt: now } }] } }),
    prisma.branch.groupBy({ by: ['city'], where: { company: { isActive: true }, city: { not: '' } } }).then(g => g.length),
    prisma.product.count({ where: { status: 'active', company: { isActive: true } } }),
    prisma.rentalListing.count({ where: publicRentalWhere }),
    prisma.professional.count(),
    prisma.itinerary.count({ where: { visibility: 'public' } }),
  ]);
  return { companies, verifiedCompanies, cities, products, rentals, professionals, itineraries };
}, ['public-stats'], { revalidate: 3600 });

export type ShowcaseCompany = { id: string; name: string; logo: string | null; category: string; isVerified: boolean };

// A few real companies to show on "Para empresas": featured first, then verified.
export const getShowcaseCompanies = unstable_cache(async (): Promise<ShowcaseCompany[]> => {
  return prisma.company.findMany({
    where: { isActive: true, OR: [{ isFeatured: true }, { isVerified: true }] },
    orderBy: [{ isFeatured: 'desc' }, { isPremium: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, name: true, logo: true, category: true, isVerified: true },
    take: 8,
  });
}, ['showcase-companies'], { revalidate: 3600 });
