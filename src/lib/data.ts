
'use server';

import type { AppUser, Company, Procedure, Institution, CompanyService, Review, Service, SiteSettings, Claim, CompanyProduct, Post, Announcement, Offer, Product, JobPosting, CalendarEvent, TouristLocation, Itinerary, HealthFacility, HealthFacilityType, MenuItem, FoodOrder, Professional } from './types';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, arrayRemove, setDoc, orderBy, limit } from 'firebase/firestore';
// Most of this file reads publicly-readable collections (allow read: if
// true), where it doesn't matter that Server Actions run with no browser
// auth context — the plain client SDK above works fine for those. Only the
// handful of functions gated by a request.auth-dependent rule (claims,
// admin/own-author views of posts/itineraries, food orders) need the
// Admin SDK + explicit caller check below; see getClaims for why.
import {
  collection as adminCollection,
  doc as adminDoc,
  getDoc as adminGetDoc,
  getDocs as adminGetDocs,
  query as adminQuery,
  where as adminWhere,
  select as adminSelect,
} from './firestore-admin-shim';
import { getCurrentCaller, isManagerRole, isEditorRole } from './firebase-admin';
import { unstable_cache } from 'next/cache';

// Most of this file's exports are Server Actions (see the 'use server'
// directive above), invoked fresh over an RPC round-trip from every client
// component that calls them — with no caching layer, that meant a full
// Firestore collection scan on every page navigation, for data (services,
// site settings, institutions, procedures...) that barely changes minute to
// minute. Wrapping the read-only, publicly-shared collection scans below in
// unstable_cache cuts that down to one real read per revalidate window,
// shared across every request hitting this server instance in that window.
// Revalidate windows are chosen per collection's rate of change, not
// wired to per-write cache invalidation (tags exist mainly for future use) —
// a few minutes of staleness on a business directory is an acceptable
// trade for the read-volume savings.

// Helper function to recursively convert Firestore Timestamps to ISO strings
function convertTimestamps(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Handle Firestore Timestamp
    if (obj.toDate && typeof obj.toDate === 'function') {
        return obj.toDate().toISOString();
    }

    if (Array.isArray(obj)) {
        return obj.map(convertTimestamps);
    }

    if (typeof obj === 'object') {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = convertTimestamps(obj[key]);
            }
        }
        return newObj;
    }

    return obj;
}


function fromDoc<T extends { id: string }>(snapshot: any): T {
    if (!snapshot.exists()) {
        return undefined!;
    }
    const data = snapshot.data() || {};
    
    // Convert all Firestore Timestamps within the data to ISO strings
    const serializableData = convertTimestamps(data);

    // Ensure reviews is always an array
    const reviews = serializableData.reviews || [];

    return {
        ...serializableData,
        id: snapshot.id,
        reviews: reviews,
    } as T;
}


export async function getUsers(): Promise<AppUser[]> {
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    const userList = usersSnapshot.docs.map(doc => fromDoc<AppUser>(doc));
    return userList;
}

export async function getUserById(id: string): Promise<AppUser | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'users', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<AppUser>(snapshot);
}

// Set of deactivated user IDs, via a projection query — callers that need to
// cross-reference many owner/author IDs against account status (public
// professional/post listings) used to do one getUserById() per unique owner
// on every request; this replaces that N-read fan-out with a single cached
// read shared across requests. Only the isActive field is fetched, so this
// carries no more PII exposure than the existing getActiveCompanyIds().
const getInactiveUserIdsCached = unstable_cache(async (): Promise<string[]> => {
    const usersCol = adminCollection(db, 'users');
    const q = adminQuery(usersCol, adminSelect('isActive'));
    const snapshot = await adminGetDocs(q);
    return snapshot.docs.filter(doc => doc.data().isActive === false).map(doc => doc.id);
}, ['inactive-user-ids'], { revalidate: 300, tags: ['users'] });

async function getInactiveUserIds(): Promise<Set<string>> {
    return new Set(await getInactiveUserIdsCached());
}

const getSiteSettingsCached = unstable_cache(async (): Promise<SiteSettings> => {
    const settingsDocRef = doc(db, 'settings', 'main');
    const settingsSnap = await getDoc(settingsDocRef);
    if (settingsSnap.exists()) {
        const data = settingsSnap.data() as SiteSettings;
        return {
            ...data,
            isBusinessAdvisorEnabled: data.isBusinessAdvisorEnabled ?? false,
            foodDeliveryFees: {
                muniDineroCommissionPercent: data.foodDeliveryFees?.muniDineroCommissionPercent ?? 0,
                situkaCommissionPercent: data.foodDeliveryFees?.situkaCommissionPercent ?? 0,
            },
        };
    } else {
        // Default settings if the document doesn't exist
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
    }
}, ['site-settings'], { revalidate: 300, tags: ['site-settings'] });

export async function getSiteSettings(): Promise<SiteSettings> {
    return getSiteSettingsCached();
}

// Used to be too large to cache (embedded base64 images pushed the
// serialized collection past unstable_cache's 2MB per-entry cap) — now that
// images live in Firebase Storage instead of inline in the doc (see
// scripts/migrate-images-to-storage.ts), the whole collection is under 1MB
// and safely cacheable.
const getCompaniesCached = unstable_cache(async (): Promise<Company[]> => {
    const companiesCol = collection(db, 'companies');
    const companySnapshot = await getDocs(companiesCol);
    return companySnapshot.docs.map(doc => fromDoc<Company>(doc));
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

// Company category counts for the /companies activity browser — uses a
// projection query (Admin SDK .select, not available on the client SDK) so
// it only downloads the `category`/`isActive` fields instead of every
// company's full document (logo, gallery, branches...), which is what made
// that page slow to even show its first screen.
const getCompanyCategoryCountsCached = unstable_cache(async (): Promise<CategoryUsage[]> => {
    const companiesCol = adminCollection(db, 'companies');
    const q = adminQuery(companiesCol, adminSelect('category', 'isActive'));
    const snapshot = await adminGetDocs(q);

    const counts = new Map<string, number>();
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isActive === false) return;
        if (!data.category) return;
        counts.set(data.category, (counts.get(data.category) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([name, companyCount]) => ({ name, companyCount, institutionCount: 0, procedureCount: 0 }))
        .sort((a, b) => b.companyCount - a.companyCount);
}, ['company-category-counts'], { revalidate: 180, tags: ['companies'] });

export async function getCompanyCategoryCounts(): Promise<CategoryUsage[]> {
    return getCompanyCategoryCountsCached();
}

// Set of active company IDs via a projection query — for cross-referencing
// which jobs/menu items belong to an active company, callers only need the
// id + isActive fields, not full company docs (logo, gallery, branches...).
const getActiveCompanyIdsCached = unstable_cache(async (): Promise<string[]> => {
    const companiesCol = adminCollection(db, 'companies');
    const q = adminQuery(companiesCol, adminSelect('isActive'));
    const snapshot = await adminGetDocs(q);
    return snapshot.docs.filter(doc => doc.data().isActive !== false).map(doc => doc.id);
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

// Business density per city for the homepage hero globe — same lightweight
// projection-query approach as getCompanyCategoryCounts, so this never
// downloads logos/galleries just to plot dots on a map.
const getCityBusinessDensityCached = unstable_cache(async (): Promise<CityDensity[]> => {
    const companiesCol = adminCollection(db, 'companies');
    const q = adminQuery(companiesCol, adminSelect('branches', 'isActive'));
    const snapshot = await adminGetDocs(q);

    const counts = new Map<string, number>();
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isActive === false) return;
        const cities = new Set<string>((data.branches || []).map((b: any) => b?.location?.city).filter(Boolean));
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
  const companiesCol = collection(db, 'companies');
  const q = query(companiesCol, where("ownerId", "==", ownerId));
  const companySnapshot = await getDocs(q);
  const companyList = companySnapshot.docs.map(doc => fromDoc<Company>(doc));
  return companyList;
}

// Public detail-page reads (companies rules: allow read: if true — no
// caller-dependent visibility, safe to share one cached result across every
// viewer). Kept short (60s) since an owner may view their own edit right
// after saving it and expects to see the change, not a stale cached one.
const getCompanyByIdCached = unstable_cache(async (id: string): Promise<Company | undefined> => {
    const docRef = doc(db, 'companies', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<Company>(snapshot);
}, ['company-by-id'], { revalidate: 60, tags: ['companies'] });

export async function getCompanyById(id: string): Promise<Company | undefined> {
    if (!id) return undefined;
    return getCompanyByIdCached(id);
}


const getProfessionalsCached = unstable_cache(async (): Promise<Professional[]> => {
    const professionalsCol = collection(db, 'professionals');
    const snapshot = await getDocs(professionalsCol);
    return snapshot.docs.map(doc => fromDoc<Professional>(doc));
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
    const docRef = doc(db, 'professionals', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<Professional>(snapshot);
}, ['professional-by-id'], { revalidate: 60, tags: ['professionals'] });

export async function getProfessionalById(id: string): Promise<Professional | undefined> {
    if (!id) return undefined;
    return getProfessionalByIdCached(id);
}

export async function getProfessionalByOwnerId(ownerId: string): Promise<Professional | undefined> {
    if (!ownerId) return undefined;
    const professionalsCol = collection(db, 'professionals');
    const q = query(professionalsCol, where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    return fromDoc<Professional>(snapshot.docs[0]);
}


const getProceduresCached = unstable_cache(async (): Promise<Procedure[]> => {
  const proceduresCol = collection(db, 'procedures');
  const procedureSnapshot = await getDocs(proceduresCol);
  return procedureSnapshot.docs.map(doc => fromDoc<Procedure>(doc));
}, ['procedures-list'], { revalidate: 300, tags: ['procedures'] });

export async function getProcedures(): Promise<Procedure[]> {
  return getProceduresCached();
}

const getProcedureByIdCached = unstable_cache(async (id: string): Promise<Procedure | undefined> => {
    const docRef = doc(db, 'procedures', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<Procedure>(snapshot);
}, ['procedure-by-id'], { revalidate: 60, tags: ['procedures'] });

export async function getProcedureById(id: string): Promise<Procedure | undefined> {
    if (!id) return undefined;
    return getProcedureByIdCached(id);
}

const getJobPostingsCached = unstable_cache(async (): Promise<JobPosting[]> => {
  const jobsCol = collection(db, 'jobPostings');
  const jobsSnapshot = await getDocs(jobsCol);
  return jobsSnapshot.docs.map(doc => fromDoc<JobPosting>(doc));
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
    const docRef = doc(db, 'jobPostings', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<JobPosting>(snapshot);
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
  const eventsCol = collection(db, 'events');
  const eventsSnapshot = await getDocs(eventsCol);
  return eventsSnapshot.docs.map(doc => fromDoc<CalendarEvent>(doc));
}, ['events-list'], { revalidate: 180, tags: ['events'] });

export async function getEvents(): Promise<CalendarEvent[]> {
  return getEventsCached();
}

const getEventByIdCached = unstable_cache(async (id: string): Promise<CalendarEvent | undefined> => {
    const docRef = doc(db, 'events', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<CalendarEvent>(snapshot);
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
  const locationsCol = collection(db, 'touristLocations');
  const q = query(locationsCol, where('status', '==', 'approved'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromDoc<TouristLocation>(doc));
}, ['tourist-locations-list'], { revalidate: 300, tags: ['places'] });

export async function getTouristLocations(): Promise<TouristLocation[]> {
  return getTouristLocationsCached();
}

export async function getPendingTouristLocations(): Promise<TouristLocation[]> {
  const locationsCol = collection(db, 'touristLocations');
  const q = query(locationsCol, where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  const locations = snapshot.docs.map(doc => fromDoc<TouristLocation>(doc));
  return locations.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function getAllTouristLocationsForAdmin(): Promise<TouristLocation[]> {
  const locationsCol = collection(db, 'touristLocations');
  const snapshot = await getDocs(locationsCol);
  const locations = snapshot.docs.map(doc => fromDoc<TouristLocation>(doc));
  return locations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const getTouristLocationByIdCached = unstable_cache(async (id: string): Promise<TouristLocation | undefined> => {
    const docRef = doc(db, 'touristLocations', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<TouristLocation>(snapshot);
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
  const facilitiesCol = collection(db, 'healthFacilities');
  const snapshot = await getDocs(facilitiesCol);
  return snapshot.docs.map(doc => fromDoc<HealthFacility>(doc));
}, ['health-facilities-list'], { revalidate: 300, tags: ['health-facilities'] });

export async function getHealthFacilities(): Promise<HealthFacility[]> {
  return getHealthFacilitiesCached();
}

export async function getHealthFacilitiesByType(type: HealthFacilityType): Promise<HealthFacility[]> {
  const facilitiesCol = collection(db, 'healthFacilities');
  const q = query(facilitiesCol, where('type', '==', type));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromDoc<HealthFacility>(doc));
}

const getHealthFacilityByIdCached = unstable_cache(async (id: string): Promise<HealthFacility | undefined> => {
  const docRef = doc(db, 'healthFacilities', id);
  const snapshot = await getDoc(docRef);
  return fromDoc<HealthFacility>(snapshot);
}, ['health-facility-by-id'], { revalidate: 60, tags: ['health-facilities'] });

export async function getHealthFacilityById(id: string): Promise<HealthFacility | undefined> {
  if (!id) return undefined;
  return getHealthFacilityByIdCached(id);
}

export async function getPharmaciesOnDuty(): Promise<HealthFacility[]> {
  const today = new Date().toISOString().slice(0, 10);
  const facilitiesCol = collection(db, 'healthFacilities');
  const q = query(facilitiesCol, where('type', '==', 'pharmacy'), where('onDutyDates', 'array-contains', today));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromDoc<HealthFacility>(doc));
}

const getItinerariesCached = unstable_cache(async (): Promise<Itinerary[]> => {
  const itinerariesCol = collection(db, 'itineraries');
  const q = query(itinerariesCol, where('visibility', '==', 'public'));
  const snapshot = await getDocs(q);
  const itineraries = snapshot.docs.map(doc => fromDoc<Itinerary>(doc));
  return itineraries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}, ['itineraries-list'], { revalidate: 180, tags: ['itineraries'] });

export async function getItineraries(): Promise<Itinerary[]> {
  return getItinerariesCached();
}

export async function getItineraryById(id: string): Promise<Itinerary | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'itineraries', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<Itinerary>(snapshot);
}

export async function getAllItinerariesForAdmin(): Promise<Itinerary[]> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return [];
  const itinerariesCol = adminCollection(db, 'itineraries');
  const snapshot = await adminGetDocs(itinerariesCol);
  const itineraries = snapshot.docs.map(doc => fromDoc<Itinerary>(doc));
  return itineraries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getItinerariesByAuthor(authorId: string): Promise<Itinerary[]> {
  if (!authorId) return [];
  const caller = await getCurrentCaller();
  if (!caller || (caller.uid !== authorId && !isManagerRole(caller.role))) return [];
  const itinerariesCol = adminCollection(db, 'itineraries');
  const q = adminQuery(itinerariesCol, adminWhere('authorId', '==', authorId));
  const snapshot = await adminGetDocs(q);
  const itineraries = snapshot.docs.map(doc => fromDoc<Itinerary>(doc));
  return itineraries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const getInstitutionsCached = unstable_cache(async (): Promise<Institution[]> => {
    const institutionsCol = collection(db, 'institutions');
    const institutionSnapshot = await getDocs(institutionsCol);
    const institutions = institutionSnapshot.docs.map(doc => fromDoc<Institution>(doc));

    const procedures = await getProcedures();
    const institutionMap = new Map<string, Institution>(institutions.map(inst => [inst.id, { ...inst, procedures: [] }]));

    procedures.forEach(proc => {
        if (proc.institutionId && institutionMap.has(proc.institutionId)) {
            const institution = institutionMap.get(proc.institutionId);
            if (institution) {
                institution.procedures.push({ id: proc.id, name: proc.name });
            }
        }
    });

    return Array.from(institutionMap.values());
}, ['institutions-list'], { revalidate: 300, tags: ['institutions'] });

export async function getInstitutions(): Promise<Institution[]> {
    return getInstitutionsCached();
}


const getInstitutionByIdCached = unstable_cache(async (id: string): Promise<Institution | undefined> => {
    const docRef = doc(db, 'institutions', id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return undefined;

    const institution = fromDoc<Institution>(snapshot);
    if (!institution) {
        return undefined;
    }

    const proceduresCol = collection(db, 'procedures');
    const procQuery = query(proceduresCol, where("institutionId", "==", institution.id));
    const procedureSnapshot = await getDocs(procQuery);
    institution.procedures = procedureSnapshot.docs.map(doc => {
        const procData = doc.data();
        return { id: doc.id, name: procData.name };
    });

    return institution;
}, ['institution-by-id'], { revalidate: 60, tags: ['institutions'] });

export async function getInstitutionById(id: string): Promise<Institution | undefined> {
    if (!id) return undefined;
    return getInstitutionByIdCached(id);
}


const getServicesCached = unstable_cache(async (): Promise<Service[]> => {
    const servicesCol = collection(db, 'services');
    const serviceSnapshot = await getDocs(servicesCol);
    return serviceSnapshot.docs.map(doc => fromDoc<Service>(doc));
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

// Uses the already-projected getCompanyCategoryCounts() instead of full
// getActiveCompanies() docs — this function only ever needed the category
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
    const servicesCol = collection(db, 'services');
    const serviceSnapshot = await getDocs(servicesCol);
    const serviceList = serviceSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
    return serviceList.sort((a, b) => a.name.localeCompare(b.name));
}

// Admin-only, matching firestore.rules' claims read rule (isManager() or the
// claim's own userId — this function only ever serves the "all claims" admin
// view, never a single user's own). This file runs as a Server Action (see
// 'use server' above) with no browser auth context, so it must verify the
// caller itself via the session cookie rather than relying on Firestore
// rules the way a direct client-side read would.
export async function getClaims(): Promise<Claim[]> {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) return [];
    const claimsCol = adminCollection(db, 'claims');
    const claimsSnapshot = await adminGetDocs(claimsCol);
    return claimsSnapshot.docs.map(doc => fromDoc<Claim>(doc));
}

// Used by ClaimButton to show a "pending" state instead of letting the user
// resubmit — returns the most recent claim this user has filed for this
// company (any status), or undefined if they've never claimed it.
export async function getUserClaimForCompany(companyId: string, userId: string): Promise<Claim | undefined> {
    if (!companyId || !userId) return undefined;
    const caller = await getCurrentCaller();
    if (!caller || (caller.uid !== userId && !isManagerRole(caller.role))) return undefined;
    const claimsCol = adminCollection(db, 'claims');
    const q = adminQuery(claimsCol, adminWhere('companyId', '==', companyId), adminWhere('userId', '==', userId));
    const snapshot = await adminGetDocs(q);
    const claims = snapshot.docs.map(doc => fromDoc<Claim>(doc));
    claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return claims[0];
}


// Admin-only (all posts regardless of status) — see getClaims for why this
// file needs its own caller check instead of relying on Firestore rules.
export async function getPosts(): Promise<Post[]> {
  const caller = await getCurrentCaller();
  if (!caller || !isEditorRole(caller.role)) return [];
  const postsCol = adminCollection(db, 'posts');
  const postSnapshot = await adminGetDocs(postsCol);
  const posts = postSnapshot.docs.map(doc => fromDoc<Post>(doc));
  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const getPublishedPostsCached = unstable_cache(async (): Promise<Post[]> => {
    // Filters via `where` (not just in JS) because Firestore rules reject an
    // unfiltered list query on posts for unauthenticated/non-editor callers —
    // the query itself must prove every possible result is published.
    const postsCol = collection(db, 'posts');
    const q = query(postsCol, where('status', '==', 'published'));
    const postSnapshot = await getDocs(q);
    const posts = postSnapshot.docs.map(doc => fromDoc<Post>(doc));
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  const postsCol = adminCollection(db, 'posts');
  const q = adminQuery(postsCol, adminWhere("authorId", "==", authorId));
  const postSnapshot = await adminGetDocs(q);
  const posts = postSnapshot.docs.map(doc => fromDoc<Post>(doc));
  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


// Single-doc read: published posts are public, but a draft/pending post
// (e.g. viewed from its own edit page) additionally needs the caller to be
// its author or an editor — matching firestore.rules' posts read rule.
export async function getPostById(id: string): Promise<Post | undefined> {
    if (!id) return undefined;
    const postDocRef = adminDoc(db, 'posts', id);
    const postSnap = await adminGetDoc(postDocRef);
    if (!postSnap.exists()) return undefined;

    const post = fromDoc<Post>(postSnap);

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
  const companies = await getCompanies();
  for (const company of companies) {
    if (company.announcements) {
      const announcement = company.announcements.find(ann => ann.id === announcementId);
      if (announcement) {
        const { announcements, ...companyData } = company;
        return { announcement, company: companyData as Company };
      }
    }
  }
  return undefined;
}

export async function getOfferById(offerId: string): Promise<{ offer: Offer; company: Company } | undefined> {
  const companies = await getCompanies();
  for (const company of companies) {
    if (company.offers) {
      const offer = company.offers.find(o => o.id === offerId);
      if (offer) {
        const { offers, ...companyData } = company;
        return { offer, company: companyData as Company };
      }
    }
  }
  return undefined;
}

export async function findCompaniesByName(nameQuery: string) {
    const companiesCol = collection(db, 'companies');
    const q = query(companiesCol, where('name', '>=', nameQuery), where('name', '<=', nameQuery + '\uf8ff'));
    const companySnapshot = await getDocs(q);
    return companySnapshot.docs.map(doc => fromDoc<Company>(doc));
}

export async function findProceduresByName(nameQuery: string) {
    const proceduresCol = collection(db, 'procedures');
    const q = query(proceduresCol, where('name', '>=', nameQuery), where('name', '<=', nameQuery + '\uf8ff'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromDoc<Procedure>(doc));
}

// FOOD ORDERING DATA

export async function getMenuItemsByCompany(companyId: string): Promise<MenuItem[]> {
    const menuItemsCol = collection(db, 'menuItems');
    const q = query(menuItemsCol, where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromDoc<MenuItem>(doc));
}

const getAllMenuItemsCached = unstable_cache(async (): Promise<MenuItem[]> => {
    const menuItemsCol = collection(db, 'menuItems');
    const snapshot = await getDocs(menuItemsCol);
    return snapshot.docs.map(doc => fromDoc<MenuItem>(doc));
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
    const docRef = doc(db, 'menuItems', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<MenuItem>(snapshot);
}, ['menu-item-by-id'], { revalidate: 60, tags: ['menu-items'] });

export async function getMenuItemById(id: string): Promise<MenuItem | undefined> {
    if (!id) return undefined;
    return getMenuItemByIdCached(id);
}

export async function getAllFoodOrders(): Promise<FoodOrder[]> {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) return [];
    const ordersCol = adminCollection(db, 'foodOrders');
    const snapshot = await adminGetDocs(ordersCol);
    const orders = snapshot.docs.map(doc => fromDoc<FoodOrder>(doc));
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Restaurant-owner access needs a cross-lookup at the company doc, matching
// firestore.rules' foodOrders read rule.
export async function getFoodOrdersByCompany(companyId: string): Promise<FoodOrder[]> {
    const caller = await getCurrentCaller();
    if (!caller) return [];
    if (!isManagerRole(caller.role)) {
        const companySnap = await adminGetDoc(adminDoc(db, 'companies', companyId));
        const ownerId = companySnap.exists() ? companySnap.data().ownerId : undefined;
        if (ownerId !== caller.uid) return [];
    }
    const ordersCol = adminCollection(db, 'foodOrders');
    const q = adminQuery(ordersCol, adminWhere('companyId', '==', companyId));
    const snapshot = await adminGetDocs(q);
    const orders = snapshot.docs.map(doc => fromDoc<FoodOrder>(doc));
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getFoodOrderById(id: string): Promise<FoodOrder | undefined> {
    if (!id) return undefined;
    const docRef = adminDoc(db, 'foodOrders', id);
    const snapshot = await adminGetDoc(docRef);
    const order = fromDoc<FoodOrder>(snapshot);
    if (!order) return undefined;

    const caller = await getCurrentCaller();
    if (!caller) return undefined;
    if (isManagerRole(caller.role) || order.customerId === caller.uid) return order;
    const companySnap = await adminGetDoc(adminDoc(db, 'companies', order.companyId));
    const ownerId = companySnap.exists() ? companySnap.data().ownerId : undefined;
    return ownerId === caller.uid ? order : undefined;
}

// Bundles every collection the rule-based search engine needs (see
// src/lib/search-engine.ts) into one Server Action round-trip. Previously
// useSearchData() fired 13 separate Server Action calls in parallel on every
// mount — each one already cheap thanks to the unstable_cache wrapping
// above, but still 13 separate client-server network round-trips per user
// who opens search. This collapses that to one round-trip; the underlying
// reads are unchanged (still served from the same per-collection caches).
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
    const ordersCol = adminCollection(db, 'foodOrders');
    const q = adminQuery(ordersCol, adminWhere('customerId', '==', customerId));
    const snapshot = await adminGetDocs(q);
    const orders = snapshot.docs.map(doc => fromDoc<FoodOrder>(doc));
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
