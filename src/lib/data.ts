
'use server';

import type { AppUser, Company, Procedure, Institution, CompanyService, Review, Service, SiteSettings, Claim, CompanyProduct, Post, Announcement, Offer, Product, JobPosting, CalendarEvent, TouristLocation, Itinerary, HealthFacility, HealthFacilityType } from './types';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, arrayRemove, setDoc, orderBy, limit } from 'firebase/firestore';

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

export async function getSiteSettings(): Promise<SiteSettings> {
    const settingsDocRef = doc(db, 'settings', 'main');
    const settingsSnap = await getDoc(settingsDocRef);
    if (settingsSnap.exists()) {
        const data = settingsSnap.data() as SiteSettings;
        return {
            ...data,
            isBusinessAdvisorEnabled: data.isBusinessAdvisorEnabled ?? false,
        };
    } else {
        // Default settings if the document doesn't exist
        return {
            siteName: 'Oltinde',
            siteSlogan: 'Tu guía de confianza',
            logoUrl: '',
            cities: ['Malabo', 'Bata', 'Ebebiyín', 'Mongomo', 'Luba'],
            isBusinessAdvisorEnabled: false,
        };
    }
}

export async function getCompanies(): Promise<Company[]> {
    const companiesCol = collection(db, 'companies');
    const companySnapshot = await getDocs(companiesCol);
    return companySnapshot.docs.map(doc => fromDoc<Company>(doc));
}


export async function getCompaniesByOwner(ownerId: string): Promise<Company[]> {
  if (!ownerId) return [];
  const companiesCol = collection(db, 'companies');
  const q = query(companiesCol, where("ownerId", "==", ownerId));
  const companySnapshot = await getDocs(q);
  const companyList = companySnapshot.docs.map(doc => fromDoc<Company>(doc));
  return companyList;
}

export async function getCompanyById(id: string): Promise<Company | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'companies', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<Company>(snapshot);
}


export async function getProcedures(): Promise<Procedure[]> {
  const proceduresCol = collection(db, 'procedures');
  const procedureSnapshot = await getDocs(proceduresCol);
  return procedureSnapshot.docs.map(doc => fromDoc<Procedure>(doc));
}

export async function getProcedureById(id: string): Promise<Procedure | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'procedures', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<Procedure>(snapshot);
}

export async function getJobPostings(): Promise<JobPosting[]> {
  const jobsCol = collection(db, 'jobPostings');
  const jobsSnapshot = await getDocs(jobsCol);
  return jobsSnapshot.docs.map(doc => fromDoc<JobPosting>(doc));
}

export async function getJobById(id: string): Promise<JobPosting | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'jobPostings', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<JobPosting>(snapshot);
}

export async function getUniqueJobSectors(): Promise<string[]> {
  const jobs = await getJobPostings();
  return Array.from(new Set(jobs.map(j => j.sector).filter(Boolean)));
}

export async function getEvents(): Promise<CalendarEvent[]> {
  const eventsCol = collection(db, 'events');
  const eventsSnapshot = await getDocs(eventsCol);
  return eventsSnapshot.docs.map(doc => fromDoc<CalendarEvent>(doc));
}

export async function getEventById(id: string): Promise<CalendarEvent | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'events', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<CalendarEvent>(snapshot);
}

export async function getUniqueEventCategories(): Promise<string[]> {
  const events = await getEvents();
  return Array.from(new Set(events.map(e => e.category).filter(Boolean)));
}

export async function getTouristLocations(): Promise<TouristLocation[]> {
  const locationsCol = collection(db, 'touristLocations');
  const q = query(locationsCol, where('status', '==', 'approved'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromDoc<TouristLocation>(doc));
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

export async function getTouristLocationById(id: string): Promise<TouristLocation | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'touristLocations', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<TouristLocation>(snapshot);
}

export async function getUniqueTouristLocationCategories(): Promise<string[]> {
  const locations = await getTouristLocations();
  return Array.from(new Set(locations.map(l => l.category).filter(Boolean)));
}

export async function getHealthFacilities(): Promise<HealthFacility[]> {
  const facilitiesCol = collection(db, 'healthFacilities');
  const snapshot = await getDocs(facilitiesCol);
  return snapshot.docs.map(doc => fromDoc<HealthFacility>(doc));
}

export async function getHealthFacilitiesByType(type: HealthFacilityType): Promise<HealthFacility[]> {
  const facilitiesCol = collection(db, 'healthFacilities');
  const q = query(facilitiesCol, where('type', '==', type));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromDoc<HealthFacility>(doc));
}

export async function getHealthFacilityById(id: string): Promise<HealthFacility | undefined> {
  if (!id) return undefined;
  const docRef = doc(db, 'healthFacilities', id);
  const snapshot = await getDoc(docRef);
  return fromDoc<HealthFacility>(snapshot);
}

export async function getPharmaciesOnDuty(): Promise<HealthFacility[]> {
  const today = new Date().toISOString().slice(0, 10);
  const facilitiesCol = collection(db, 'healthFacilities');
  const q = query(facilitiesCol, where('type', '==', 'pharmacy'), where('onDutyDates', 'array-contains', today));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromDoc<HealthFacility>(doc));
}

export async function getUniqueHealthServices(type: HealthFacilityType): Promise<string[]> {
  const facilities = await getHealthFacilitiesByType(type);
  return Array.from(new Set(facilities.flatMap(f => f.services || [])));
}

export async function getItineraries(): Promise<Itinerary[]> {
  const itinerariesCol = collection(db, 'itineraries');
  const q = query(itinerariesCol, where('visibility', '==', 'public'));
  const snapshot = await getDocs(q);
  const itineraries = snapshot.docs.map(doc => fromDoc<Itinerary>(doc));
  return itineraries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getItineraryById(id: string): Promise<Itinerary | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'itineraries', id);
    const snapshot = await getDoc(docRef);
    return fromDoc<Itinerary>(snapshot);
}

export async function getAllItinerariesForAdmin(): Promise<Itinerary[]> {
  const itinerariesCol = collection(db, 'itineraries');
  const snapshot = await getDocs(itinerariesCol);
  const itineraries = snapshot.docs.map(doc => fromDoc<Itinerary>(doc));
  return itineraries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getItinerariesByAuthor(authorId: string): Promise<Itinerary[]> {
  if (!authorId) return [];
  const itinerariesCol = collection(db, 'itineraries');
  const q = query(itinerariesCol, where('authorId', '==', authorId));
  const snapshot = await getDocs(q);
  const itineraries = snapshot.docs.map(doc => fromDoc<Itinerary>(doc));
  return itineraries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getInstitutions(): Promise<Institution[]> {
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
}


export async function getInstitutionById(id: string): Promise<Institution | undefined> {
    if (!id) return undefined;
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
}


export async function getServices(): Promise<Service[]> {
    const servicesCol = collection(db, 'services');
    const serviceSnapshot = await getDocs(servicesCol);
    return serviceSnapshot.docs.map(doc => fromDoc<Service>(doc));
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

export async function getUniqueCategories(): Promise<CategoryUsage[]> {
    const companies = await getCompanies();
    const institutions = await getInstitutions();
    const procedures = await getProcedures();

    const categoryMap: Map<string, { companyCount: number; institutionCount: number; procedureCount: number; }> = new Map();

    const allCategories = new Set<string>();
    companies.forEach(c => c.category && allCategories.add(c.category));
    institutions.forEach(i => i.category && allCategories.add(i.category));
    procedures.forEach(p => p.category && allCategories.add(p.category));

    allCategories.forEach(cat => {
        categoryMap.set(cat, { companyCount: 0, institutionCount: 0, procedureCount: 0 });
    });

    companies.forEach(company => {
        if (company.category) {
            const cat = categoryMap.get(company.category);
            if (cat) cat.companyCount++;
        }
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

export async function getClaims(): Promise<Claim[]> {
    const claimsCol = collection(db, 'claims');
    const claimsSnapshot = await getDocs(claimsCol);
    return claimsSnapshot.docs.map(doc => fromDoc<Claim>(doc));
}

// Used by ClaimButton to show a "pending" state instead of letting the user
// resubmit — returns the most recent claim this user has filed for this
// company (any status), or undefined if they've never claimed it.
export async function getUserClaimForCompany(companyId: string, userId: string): Promise<Claim | undefined> {
    if (!companyId || !userId) return undefined;
    const claimsCol = collection(db, 'claims');
    const q = query(claimsCol, where('companyId', '==', companyId), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const claims = snapshot.docs.map(doc => fromDoc<Claim>(doc));
    claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return claims[0];
}


export async function getPosts(): Promise<Post[]> {
  const postsCol = collection(db, 'posts');
  const postSnapshot = await getDocs(postsCol);
  const posts = postSnapshot.docs.map(doc => fromDoc<Post>(doc));
  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPublishedPosts(): Promise<Post[]> {
    const allPosts = await getPosts();
    return allPosts
        .filter(post => post.status === 'published')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  const postsCol = collection(db, 'posts');
  const q = query(postsCol, where("authorId", "==", authorId));
  const postSnapshot = await getDocs(q);
  const posts = postSnapshot.docs.map(doc => fromDoc<Post>(doc));
  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


export async function getPostById(id: string): Promise<Post | undefined> {
    if (!id) return undefined;
    const postDocRef = doc(db, 'posts', id);
    const postSnap = await getDoc(postDocRef);
    if (!postSnap.exists()) return undefined;
    
    const post = fromDoc<Post>(postSnap);
    
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
