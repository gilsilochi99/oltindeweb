
'use server';

import { featureAccessFor } from './premium-features';
import type { AppUser, Company, Procedure, Institution, CompanyService, Service, SiteSettings, Claim, CompanyProduct, Post, Announcement, Offer, JobPosting, CalendarEvent, TouristLocation, Itinerary, HealthFacility, HealthFacilityType, MenuItem, FoodOrder, Professional } from './types';
import {
    prisma, userInclude, toUser, findCompanies, findCompany, findInstitutions, findProcedures, findProfessionals,
    findTouristLocations, findItineraries, findHealthFacilities, toJobPosting, toEvent, toClaim, toService, toPost,
    postInclude, toMenuItem, toFoodOrder, toSiteSettings, toAnnouncement, toOffer,
} from './db';
import { getCurrentCaller, isManagerRole, isEditorRole } from './firebase-admin';
import { unstable_cache } from 'next/cache';

// Most of this file's exports are Server Actions (see the 'use server'
// directive above), invoked fresh over an RPC round-trip from every client
// component that calls them. Wrapping the read-only, publicly-shared reads
// below in unstable_cache cuts that down to one real query per revalidate
// window, shared across every request hitting this server instance — which
// matters on shared hosting, where MySQL connections are limited.
// Revalidate windows are chosen per table's rate of change, not wired to
// per-write cache invalidation (tags exist mainly for future use) — a few
// minutes of staleness on a business directory is an acceptable trade.

const byNewest = { createdAt: 'desc' } as const;

export async function getUsers(): Promise<AppUser[]> {
    const rows = await prisma.user.findMany({ include: userInclude });
    return rows.map(toUser);
}

export async function getUserById(id: string): Promise<AppUser | undefined> {
    if (!id) return undefined;
    const row = await prisma.user.findUnique({ where: { id }, include: userInclude });
    return row ? toUser(row) : undefined;
}

// Set of deactivated user IDs — callers that need to cross-reference many
// owner/author IDs against account status (public professional/post
// listings) use this single cached read instead of one lookup per owner.
const getInactiveUserIdsCached = unstable_cache(async (): Promise<string[]> => {
    const rows = await prisma.user.findMany({ where: { isActive: false }, select: { id: true } });
    return rows.map(r => r.id);
}, ['inactive-user-ids'], { revalidate: 300, tags: ['users'] });

async function getInactiveUserIds(): Promise<Set<string>> {
    return new Set(await getInactiveUserIdsCached());
}

const getSiteSettingsCached = unstable_cache(async (): Promise<SiteSettings> => {
    const row = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    if (row) return toSiteSettings(row);
    // Default settings if the row doesn't exist
    return {
        siteName: 'Oltinde',
        siteSlogan: 'Tu guía de confianza',
        logoUrl: '',
        cities: ['Malabo', 'Bata', 'Ebebiyín', 'Mongomo', 'Luba'],
        isBusinessAdvisorEnabled: false,
        foodDeliveryFees: {
            muniDineroCommissionPercent: 0,
            situkaCommissionPercent: 0,
        },
    };
}, ['site-settings'], { revalidate: 300, tags: ['site-settings'] });

export async function getSiteSettings(): Promise<SiteSettings> {
    return getSiteSettingsCached();
}

const getCompaniesCached = unstable_cache(async (): Promise<Company[]> => {
    return findCompanies();
}, ['companies-list'], { revalidate: 90, tags: ['companies'] });

export async function getCompanies(): Promise<Company[]> {
    return getCompaniesCached();
}

// Public-facing pages (listings, search, map, sitemap...) must not surface a
// deactivated company — admin/owner tooling needs the full getCompanies()
// list instead, so it can still find and reactivate them.
export async function getActiveCompanies(): Promise<Company[]> {
    const companies = await getCompanies();
    return companies.filter(c => c.isActive !== false);
}

// Company category counts for the /companies activity browser — a GROUP BY
// instead of loading every company's full row (logo, gallery, branches...).
const getCompanyCategoryCountsCached = unstable_cache(async (): Promise<CategoryUsage[]> => {
    const groups = await prisma.company.groupBy({
        by: ['category'],
        where: { isActive: true, category: { not: '' } },
        _count: { _all: true },
    });
    return groups
        .map(g => ({ name: g.category, companyCount: g._count._all, institutionCount: 0, procedureCount: 0 }))
        .sort((a, b) => b.companyCount - a.companyCount);
}, ['company-category-counts'], { revalidate: 180, tags: ['companies'] });

export async function getCompanyCategoryCounts(): Promise<CategoryUsage[]> {
    return getCompanyCategoryCountsCached();
}

// Set of active company IDs — for cross-referencing which jobs/menu items
// belong to an active company without loading full company rows.
const getActiveCompanyIdsCached = unstable_cache(async (): Promise<string[]> => {
    const rows = await prisma.company.findMany({ where: { isActive: true }, select: { id: true } });
    return rows.map(r => r.id);
}, ['active-company-ids'], { revalidate: 90, tags: ['companies'] });

async function getActiveCompanyIds(): Promise<Set<string>> {
    return new Set(await getActiveCompanyIdsCached());
}

// Known Guinea Ecuatorial cities and their real coordinates, matched
// case-insensitively against Company.branches[].location.city. Business
// location data has years of free-text entry noise (misspellings, plus
// codes, address fragments typed into the city field) — anchoring to this
// curated list is what keeps the density map from plotting garbage.
const GNQ_CITIES: { name: string; lat: number; lng: number }[] = [
    { name: 'Malabo', lat: 3.75, lng: 8.78 },
    { name: 'Bata', lat: 1.85, lng: 9.77 },
    { name: 'Ebebiyin', lat: 2.15, lng: 11.33 },
    { name: 'Mongomo', lat: 1.63, lng: 11.33 },
    { name: 'Luba', lat: 3.45, lng: 8.55 },
    { name: 'Moka', lat: 3.35, lng: 8.66 },
    { name: 'La Paz', lat: 3.76, lng: 8.79 },
];

// La Paz is a neighborhood on the edge of Malabo, ~100m away at this list's
// precision — plotted as its own marker it just sits on top of Malabo's.
// Folded into Malabo for the MAP only; city filtering/dropdowns elsewhere
// still treat them as distinct since that data is separate from this list.
const MAP_CITY_ALIASES: Record<string, string> = { 'La Paz': 'Malabo' };

export type CityDensity = { city: string; lat: number; lng: number; count: number };

// Business density per city for the homepage hero globe — reads only the
// branch city column, never logos/galleries.
const getCityBusinessDensityCached = unstable_cache(async (): Promise<CityDensity[]> => {
    const branches = await prisma.branch.findMany({
        where: { company: { isActive: true } },
        select: { companyId: true, city: true },
    });

    const citiesByCompany = new Map<string, Set<string>>();
    branches.forEach(b => {
        if (!b.companyId || !b.city) return;
        if (!citiesByCompany.has(b.companyId)) citiesByCompany.set(b.companyId, new Set());
        citiesByCompany.get(b.companyId)!.add(b.city);
    });

    const counts = new Map<string, number>();
    citiesByCompany.forEach(cities => {
        cities.forEach(city => {
            const match = GNQ_CITIES.find(c => c.name.toLowerCase() === String(city).trim().toLowerCase());
            if (!match) return;
            const bucket = MAP_CITY_ALIASES[match.name] || match.name;
            counts.set(bucket, (counts.get(bucket) || 0) + 1);
        });
    });

    return GNQ_CITIES
        .filter(c => !MAP_CITY_ALIASES[c.name])
        .map(c => ({ city: c.name, lat: c.lat, lng: c.lng, count: counts.get(c.name) || 0 }))
        .filter(c => c.count > 0)
        .sort((a, b) => b.count - a.count);
}, ['city-business-density'], { revalidate: 180, tags: ['companies'] });

export async function getCityBusinessDensity(): Promise<CityDensity[]> {
    return getCityBusinessDensityCached();
}


export async function getCompaniesByOwner(ownerId: string): Promise<Company[]> {
  if (!ownerId) return [];
  const [companies, settings] = await Promise.all([findCompanies({ where: { ownerId } }), getSiteSettings()]);
  return companies.map(c => withPremiumFeatures(c, settings.premiumFeatureRules));
}

// Which premium features the company's category allows (admin rules).
function withPremiumFeatures(company: Company, rules: SiteSettings['premiumFeatureRules']): Company {
  return { ...company, premiumFeatures: featureAccessFor(rules, company.category) };
}

// Public detail-page reads — no caller-dependent visibility, safe to share
// one cached result across every viewer. Kept short (60s) since an owner may
// view their own edit right after saving it and expects to see the change.
const getCompanyByIdCached = unstable_cache(async (id: string): Promise<Company | undefined> => {
    return findCompany(id);
}, ['company-by-id'], { revalidate: 60, tags: ['companies'] });

export async function getCompanyById(id: string): Promise<Company | undefined> {
    if (!id) return undefined;
    const [company, settings] = await Promise.all([getCompanyByIdCached(id), getSiteSettings()]);
    return company && withPremiumFeatures(company, settings.premiumFeatureRules);
}


const getProfessionalsCached = unstable_cache(async (): Promise<Professional[]> => {
    return findProfessionals();
}, ['professionals-list'], { revalidate: 180, tags: ['professionals'] });

export async function getProfessionals(): Promise<Professional[]> {
    return getProfessionalsCached();
}

// Public professional listings must exclude profiles owned by a deactivated account.
export async function getActiveProfessionals(): Promise<Professional[]> {
    const [professionals, inactiveUserIds] = await Promise.all([getProfessionals(), getInactiveUserIds()]);
    return professionals.filter(p => !inactiveUserIds.has(p.ownerId));
}

const getProfessionalByIdCached = unstable_cache(async (id: string): Promise<Professional | undefined> => {
    return (await findProfessionals({ where: { id } }))[0];
}, ['professional-by-id'], { revalidate: 60, tags: ['professionals'] });

export async function getProfessionalById(id: string): Promise<Professional | undefined> {
    if (!id) return undefined;
    return getProfessionalByIdCached(id);
}

export async function getProfessionalByOwnerId(ownerId: string): Promise<Professional | undefined> {
    if (!ownerId) return undefined;
    return (await findProfessionals({ where: { ownerId }, take: 1 }))[0];
}


const getProceduresCached = unstable_cache(async (): Promise<Procedure[]> => {
  return findProcedures();
}, ['procedures-list'], { revalidate: 300, tags: ['procedures'] });

export async function getProcedures(): Promise<Procedure[]> {
  return getProceduresCached();
}

const getProcedureByIdCached = unstable_cache(async (id: string): Promise<Procedure | undefined> => {
    return (await findProcedures({ where: { id } }))[0];
}, ['procedure-by-id'], { revalidate: 60, tags: ['procedures'] });

export async function getProcedureById(id: string): Promise<Procedure | undefined> {
    if (!id) return undefined;
    return getProcedureByIdCached(id);
}

const getJobPostingsCached = unstable_cache(async (): Promise<JobPosting[]> => {
  const rows = await prisma.jobPosting.findMany();
  return rows.map(toJobPosting);
}, ['job-postings-list'], { revalidate: 120, tags: ['jobs'] });

export async function getJobPostings(): Promise<JobPosting[]> {
  return getJobPostingsCached();
}

// Public job listings must exclude postings from a deactivated company —
// admin/owner tooling keeps using getJobPostings() directly.
export async function getActiveJobPostings(): Promise<JobPosting[]> {
  const [jobs, activeCompanyIds] = await Promise.all([getJobPostings(), getActiveCompanyIds()]);
  return jobs.filter(j => activeCompanyIds.has(j.companyId));
}

const getJobByIdCached = unstable_cache(async (id: string): Promise<JobPosting | undefined> => {
    const row = await prisma.jobPosting.findUnique({ where: { id } });
    return row ? toJobPosting(row) : undefined;
}, ['job-by-id'], { revalidate: 60, tags: ['jobs'] });

export async function getJobById(id: string): Promise<JobPosting | undefined> {
    if (!id) return undefined;
    return getJobByIdCached(id);
}

export async function getUniqueJobSectors(): Promise<string[]> {
  const jobs = await getJobPostings();
  return Array.from(new Set(jobs.map(j => j.sector).filter(Boolean)));
}

const getEventsCached = unstable_cache(async (): Promise<CalendarEvent[]> => {
  const rows = await prisma.event.findMany();
  return rows.map(toEvent);
}, ['events-list'], { revalidate: 180, tags: ['events'] });

export async function getEvents(): Promise<CalendarEvent[]> {
  return getEventsCached();
}

const getEventByIdCached = unstable_cache(async (id: string): Promise<CalendarEvent | undefined> => {
    const row = await prisma.event.findUnique({ where: { id } });
    return row ? toEvent(row) : undefined;
}, ['event-by-id'], { revalidate: 60, tags: ['events'] });

export async function getEventById(id: string): Promise<CalendarEvent | undefined> {
    if (!id) return undefined;
    return getEventByIdCached(id);
}

export async function getUniqueEventCategories(): Promise<string[]> {
  const events = await getEvents();
  return Array.from(new Set(events.map(e => e.category).filter(Boolean)));
}

const getTouristLocationsCached = unstable_cache(async (): Promise<TouristLocation[]> => {
  return findTouristLocations({ where: { status: 'approved' } });
}, ['tourist-locations-list'], { revalidate: 300, tags: ['places'] });

export async function getTouristLocations(): Promise<TouristLocation[]> {
  return getTouristLocationsCached();
}

export async function getPendingTouristLocations(): Promise<TouristLocation[]> {
  return findTouristLocations({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' } });
}

export async function getAllTouristLocationsForAdmin(): Promise<TouristLocation[]> {
  return findTouristLocations({ orderBy: byNewest });
}

const getTouristLocationByIdCached = unstable_cache(async (id: string): Promise<TouristLocation | undefined> => {
    return (await findTouristLocations({ where: { id } }))[0];
}, ['tourist-location-by-id'], { revalidate: 60, tags: ['places'] });

export async function getTouristLocationById(id: string): Promise<TouristLocation | undefined> {
    if (!id) return undefined;
    return getTouristLocationByIdCached(id);
}

export async function getUniqueTouristLocationCategories(): Promise<string[]> {
  const locations = await getTouristLocations();
  return Array.from(new Set(locations.map(l => l.category).filter(Boolean)));
}

const getHealthFacilitiesCached = unstable_cache(async (): Promise<HealthFacility[]> => {
  return findHealthFacilities();
}, ['health-facilities-list'], { revalidate: 300, tags: ['health-facilities'] });

export async function getHealthFacilities(): Promise<HealthFacility[]> {
  return getHealthFacilitiesCached();
}

export async function getHealthFacilitiesByType(type: HealthFacilityType): Promise<HealthFacility[]> {
  return findHealthFacilities({ where: { type } });
}

const getHealthFacilityByIdCached = unstable_cache(async (id: string): Promise<HealthFacility | undefined> => {
  return (await findHealthFacilities({ where: { id } }))[0];
}, ['health-facility-by-id'], { revalidate: 60, tags: ['health-facilities'] });

export async function getHealthFacilityById(id: string): Promise<HealthFacility | undefined> {
  if (!id) return undefined;
  return getHealthFacilityByIdCached(id);
}

export async function getPharmaciesOnDuty(): Promise<HealthFacility[]> {
  const today = new Date(new Date().toISOString().slice(0, 10));
  return findHealthFacilities({ where: { type: 'pharmacy', onDutyDates: { some: { date: today } } } });
}

const getItinerariesCached = unstable_cache(async (): Promise<Itinerary[]> => {
  return findItineraries({ where: { visibility: 'public' }, orderBy: byNewest });
}, ['itineraries-list'], { revalidate: 180, tags: ['itineraries'] });

export async function getItineraries(): Promise<Itinerary[]> {
  return getItinerariesCached();
}

export async function getItineraryById(id: string): Promise<Itinerary | undefined> {
    if (!id) return undefined;
    return (await findItineraries({ where: { id } }))[0];
}

export async function getAllItinerariesForAdmin(): Promise<Itinerary[]> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return [];
  return findItineraries({ orderBy: byNewest });
}

export async function getItinerariesByAuthor(authorId: string): Promise<Itinerary[]> {
  if (!authorId) return [];
  const caller = await getCurrentCaller();
  if (!caller || (caller.uid !== authorId && !isManagerRole(caller.role))) return [];
  return findItineraries({ where: { authorId }, orderBy: byNewest });
}

const getInstitutionsCached = unstable_cache(async (): Promise<Institution[]> => {
    return findInstitutions();
}, ['institutions-list'], { revalidate: 300, tags: ['institutions'] });

export async function getInstitutions(): Promise<Institution[]> {
    return getInstitutionsCached();
}


const getInstitutionByIdCached = unstable_cache(async (id: string): Promise<Institution | undefined> => {
    return (await findInstitutions({ where: { id } }))[0];
}, ['institution-by-id'], { revalidate: 60, tags: ['institutions'] });

export async function getInstitutionById(id: string): Promise<Institution | undefined> {
    if (!id) return undefined;
    return getInstitutionByIdCached(id);
}


const getServicesCached = unstable_cache(async (): Promise<Service[]> => {
    const rows = await prisma.service.findMany();
    return rows.map(toService);
}, ['services-list'], { revalidate: 300, tags: ['services'] });

export async function getServices(): Promise<Service[]> {
    return getServicesCached();
}

export async function getServicesByCompany(): Promise<CompanyService[]> {
    const companies = await getCompanies();
    const services = await getServices();
    const serviceMap = new Map<string, { service: Service, companies: Company[] }>();

    services.forEach(service => {
        serviceMap.set(service.id, { service, companies: [] });
    });

    companies.forEach(company => {
        if (company.branches) {
            company.branches.forEach(branch => {
                if (branch.servicesOffered) {
                    branch.servicesOffered.forEach(serviceId => {
                        if (serviceMap.has(serviceId)) {
                            if (!serviceMap.get(serviceId)!.companies.some(c => c.id === company.id)) {
                                serviceMap.get(serviceId)!.companies.push(company);
                            }
                        }
                    });
                }
            });
        }
    });

    return Array.from(serviceMap.values()).map(item => ({
        name: item.service.name,
        category: item.service.category,
        companies: item.companies,
        service: item.service,
    }));
}


export async function getProductsByCompany(): Promise<CompanyProduct[]> {
    const companies = await getCompanies();
    const productMap = new Map<string, { description: string, image: string, companies: Company[] }>();

    companies.forEach(company => {
        if (company.products) {
            company.products.forEach(product => {
                if (!productMap.has(product.name)) {
                    productMap.set(product.name, { description: product.description, image: product.image, companies: [] });
                }
                productMap.get(product.name)!.companies.push(company);
            });
        }
    });

    return Array.from(productMap.entries()).map(([name, data]) => ({
        name,
        description: data.description,
        image: data.image,
        companies: data.companies,
    }));
}


export async function getUniqueCities(): Promise<string[]> {
    const settings = await getSiteSettings();
    return settings.cities?.sort() || [];
}


export type CategoryUsage = {
    name: string;
    companyCount: number;
    institutionCount: number;
    procedureCount: number;
};

// Uses the already-grouped getCompanyCategoryCounts() instead of full
// getActiveCompanies() rows — this function only ever needed the category
// name and a count, not each company's logo/gallery/branches payload.
export async function getUniqueCategories(): Promise<CategoryUsage[]> {
    const companyCategories = await getCompanyCategoryCounts();
    const institutions = await getInstitutions();
    const procedures = await getProcedures();

    const categoryMap: Map<string, { companyCount: number; institutionCount: number; procedureCount: number; }> = new Map();

    const allCategories = new Set<string>();
    companyCategories.forEach(c => allCategories.add(c.name));
    institutions.forEach(i => i.category && allCategories.add(i.category));
    procedures.forEach(p => p.category && allCategories.add(p.category));

    allCategories.forEach(cat => {
        categoryMap.set(cat, { companyCount: 0, institutionCount: 0, procedureCount: 0 });
    });

    companyCategories.forEach(c => {
        const cat = categoryMap.get(c.name);
        if (cat) cat.companyCount = c.companyCount;
    });

    institutions.forEach(inst => {
        if (inst.category) {
            const cat = categoryMap.get(inst.category);
            if (cat) cat.institutionCount++;
        }
    });

    procedures.forEach(proc => {
        if (proc.category) {
            const cat = categoryMap.get(proc.category);
            if (cat) cat.procedureCount++;
        }
    });

    return Array.from(categoryMap.entries())
        .map(([name, counts]) => ({ name, ...counts }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUniqueServices(): Promise<{ id: string; name: string }[]> {
    const rows = await prisma.service.findMany({ select: { id: true, name: true } });
    return rows.sort((a, b) => a.name.localeCompare(b.name));
}

// Admin-only — this function only ever serves the "all claims" admin view,
// never a single user's own. This file runs as a Server Action, so it must
// verify the caller itself via the session cookie.
export async function getClaims(): Promise<Claim[]> {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) return [];
    const rows = await prisma.claim.findMany();
    return rows.map(toClaim);
}

// Used by ClaimButton to show a "pending" state instead of letting the user
// resubmit — returns the most recent claim this user has filed for this
// company (any status), or undefined if they've never claimed it.
export async function getUserClaimForCompany(companyId: string, userId: string): Promise<Claim | undefined> {
    if (!companyId || !userId) return undefined;
    const caller = await getCurrentCaller();
    if (!caller || (caller.uid !== userId && !isManagerRole(caller.role))) return undefined;
    const row = await prisma.claim.findFirst({ where: { companyId, userId }, orderBy: byNewest });
    return row ? toClaim(row) : undefined;
}


// Admin-only (all posts regardless of status) — see getClaims for why this
// file needs its own caller check.
export async function getPosts(): Promise<Post[]> {
  const caller = await getCurrentCaller();
  if (!caller || !isEditorRole(caller.role)) return [];
  const rows = await prisma.post.findMany({ include: postInclude, orderBy: byNewest });
  return rows.map(toPost);
}

const getPublishedPostsCached = unstable_cache(async (): Promise<Post[]> => {
    const rows = await prisma.post.findMany({ where: { status: 'published' }, include: postInclude, orderBy: byNewest });
    return rows.map(toPost);
}, ['published-posts-list'], { revalidate: 180, tags: ['posts'] });

export async function getPublishedPosts(): Promise<Post[]> {
    return getPublishedPostsCached();
}

// Public post listings must exclude posts by a deactivated author.
export async function getActivePublishedPosts(): Promise<Post[]> {
    const [posts, inactiveUserIds] = await Promise.all([getPublishedPosts(), getInactiveUserIds()]);
    return posts.filter(p => !inactiveUserIds.has(p.authorId));
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  const caller = await getCurrentCaller();
  if (!caller || (caller.uid !== authorId && !isEditorRole(caller.role))) return [];
  const rows = await prisma.post.findMany({ where: { authorId }, include: postInclude, orderBy: byNewest });
  return rows.map(toPost);
}


// Single-row read: published posts are public, but a draft/pending post
// (e.g. viewed from its own edit page) additionally needs the caller to be
// its author or an editor.
export async function getPostById(id: string): Promise<Post | undefined> {
    if (!id) return undefined;
    const row = await prisma.post.findUnique({ where: { id }, include: postInclude });
    if (!row) return undefined;

    const post = toPost(row);

    if (post.status !== 'published') {
        const caller = await getCurrentCaller();
        if (!caller || (caller.uid !== post.authorId && !isEditorRole(caller.role))) return undefined;
    }

    if (post.authorId) {
        const author = await getUserById(post.authorId);
        if (author) {
            post.author = author;
        }
    }

    return post;
}

export async function getServiceBySlug(slug: string): Promise<CompanyService | undefined> {
    const services = await getServicesByCompany();
    const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');
    return services.find(s => createSlug(s.name) === slug);
}


export async function getProductBySlug(slug: string): Promise<CompanyProduct | undefined> {
    const products = await getProductsByCompany();
    const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');
    return products.find(p => createSlug(p.name) === slug);
}


export async function getAnnouncementById(announcementId: string): Promise<{ announcement: Announcement; company: Company } | undefined> {
  const row = await prisma.companyAnnouncement.findUnique({ where: { id: announcementId } });
  if (!row) return undefined;
  const company = await getCompanyById(row.companyId);
  if (!company) return undefined;
  const { announcements, ...companyData } = company;
  return { announcement: toAnnouncement(row), company: companyData as Company };
}

export async function getOfferById(offerId: string): Promise<{ offer: Offer; company: Company } | undefined> {
  const row = await prisma.companyOffer.findUnique({ where: { id: offerId } });
  if (!row) return undefined;
  const company = await getCompanyById(row.companyId);
  if (!company) return undefined;
  const { offers, ...companyData } = company;
  return { offer: toOffer(row), company: companyData as Company };
}

// Prefix search. Unlike Firestore's range trick, MySQL's collation makes this
// case- and accent-insensitive.
export async function findCompaniesByName(nameQuery: string) {
    return findCompanies({ where: { name: { startsWith: nameQuery } } });
}

export async function findProceduresByName(nameQuery: string) {
    return findProcedures({ where: { name: { startsWith: nameQuery } } });
}

// FOOD ORDERING DATA

export async function getMenuItemsByCompany(companyId: string): Promise<MenuItem[]> {
    const rows = await prisma.menuItem.findMany({ where: { companyId } });
    return rows.map(toMenuItem);
}

const getAllMenuItemsCached = unstable_cache(async (): Promise<MenuItem[]> => {
    const rows = await prisma.menuItem.findMany();
    return rows.map(toMenuItem);
}, ['menu-items-list'], { revalidate: 120, tags: ['menu-items'] });

export async function getAllMenuItems(): Promise<MenuItem[]> {
    return getAllMenuItemsCached();
}

// Public food browsing must exclude items from a deactivated restaurant —
// admin/owner tooling keeps using getAllMenuItems()/getMenuItemsByCompany() directly.
export async function getActiveMenuItems(): Promise<MenuItem[]> {
    const [items, activeCompanyIds] = await Promise.all([getAllMenuItems(), getActiveCompanyIds()]);
    return items.filter(i => activeCompanyIds.has(i.companyId));
}

const getMenuItemByIdCached = unstable_cache(async (id: string): Promise<MenuItem | undefined> => {
    const row = await prisma.menuItem.findUnique({ where: { id } });
    return row ? toMenuItem(row) : undefined;
}, ['menu-item-by-id'], { revalidate: 60, tags: ['menu-items'] });

export async function getMenuItemById(id: string): Promise<MenuItem | undefined> {
    if (!id) return undefined;
    return getMenuItemByIdCached(id);
}

export async function getAllFoodOrders(): Promise<FoodOrder[]> {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) return [];
    const rows = await prisma.foodOrder.findMany({ orderBy: byNewest });
    return rows.map(toFoodOrder);
}

// Restaurant owners may read their own restaurant's orders; managers all.
async function callerOwnsCompany(uid: string, companyId: string): Promise<boolean> {
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
    return company?.ownerId === uid;
}

export async function getFoodOrdersByCompany(companyId: string): Promise<FoodOrder[]> {
    const caller = await getCurrentCaller();
    if (!caller) return [];
    if (!isManagerRole(caller.role) && !(await callerOwnsCompany(caller.uid, companyId))) return [];
    const rows = await prisma.foodOrder.findMany({ where: { companyId }, orderBy: byNewest });
    return rows.map(toFoodOrder);
}

export async function getFoodOrderById(id: string): Promise<FoodOrder | undefined> {
    if (!id) return undefined;
    const row = await prisma.foodOrder.findUnique({ where: { id } });
    if (!row) return undefined;
    const order = toFoodOrder(row);

    const caller = await getCurrentCaller();
    if (!caller) return undefined;
    if (isManagerRole(caller.role) || order.customerId === caller.uid) return order;
    return (await callerOwnsCompany(caller.uid, order.companyId)) ? order : undefined;
}

// Bundles every collection the rule-based search engine needs (see
// src/lib/search-engine.ts) into one Server Action round-trip instead of 13.
// The underlying reads are still served from the per-table caches above.
export async function getSearchIndexData(): Promise<{
    companies: Company[]; institutions: Institution[]; procedures: Procedure[]; posts: Post[];
    services: Service[]; cities: string[]; jobs: JobPosting[]; events: CalendarEvent[];
    menuItems: MenuItem[]; professionals: Professional[]; itineraries: Itinerary[];
    places: TouristLocation[]; healthFacilities: HealthFacility[];
}> {
    const [companies, institutions, procedures, posts, services, cities, jobs, events, menuItems, professionals, itineraries, places, healthFacilities] = await Promise.all([
        getActiveCompanies(),
        getInstitutions(),
        getProcedures(),
        getActivePublishedPosts(),
        getServices(),
        getUniqueCities(),
        getActiveJobPostings(),
        getEvents(),
        getActiveMenuItems(),
        getActiveProfessionals(),
        getItineraries(),
        getTouristLocations(),
        getHealthFacilities(),
    ]);
    return { companies, institutions, procedures, posts, services, cities, jobs, events, menuItems, professionals, itineraries, places, healthFacilities };
}

export async function getFoodOrdersByCustomer(customerId: string): Promise<FoodOrder[]> {
    if (!customerId) return [];
    const caller = await getCurrentCaller();
    if (!caller || (caller.uid !== customerId && !isManagerRole(caller.role))) return [];
    const rows = await prisma.foodOrder.findMany({ where: { customerId }, orderBy: byNewest });
    return rows.map(toFoodOrder);
}
