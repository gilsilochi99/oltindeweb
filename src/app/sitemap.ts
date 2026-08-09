import type { MetadataRoute } from 'next';
import {
  getActiveCompanies,
  getCompanyCategoryCounts,
  getInstitutions,
  getProcedures,
  getActiveJobPostings,
  getUniqueJobSectors,
  getEvents,
  getUniqueEventCategories,
  getTouristLocations,
  getUniqueTouristLocationCategories,
  getItineraries,
  getActivePublishedPosts,
  getHealthFacilitiesByType,
  getActiveProfessionals,
  getServices,
  getActiveMenuItems,
  getServicesByCompany,
  getUniqueCategories,
} from '@/lib/data';
import { buildAnnouncementsData } from './announcements/data';
import { buildOffersData } from './offers/data';
import { slugify } from '@/lib/slug';
import type { Service } from '@/lib/types';

const SITE_URL = 'https://oltinde.com';

const staticRoutes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/companies', changeFrequency: 'daily', priority: 0.9 },
  { path: '/institutions', changeFrequency: 'daily', priority: 0.8 },
  { path: '/procedures', changeFrequency: 'daily', priority: 0.8 },
  { path: '/jobs', changeFrequency: 'daily', priority: 0.9 },
  { path: '/events', changeFrequency: 'daily', priority: 0.8 },
  { path: '/places', changeFrequency: 'daily', priority: 0.8 },
  { path: '/health', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/health/hospitals', changeFrequency: 'daily', priority: 0.8 },
  { path: '/health/clinics', changeFrequency: 'daily', priority: 0.8 },
  { path: '/health/pharmacies', changeFrequency: 'daily', priority: 0.8 },
  { path: '/food', changeFrequency: 'daily', priority: 0.8 },
  { path: '/professionals', changeFrequency: 'daily', priority: 0.8 },
  { path: '/itineraries', changeFrequency: 'daily', priority: 0.8 },
  { path: '/offers', changeFrequency: 'daily', priority: 0.7 },
  { path: '/announcements', changeFrequency: 'daily', priority: 0.7 },
  { path: '/contribuciones', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/para-empresas', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/guia-de-usuario', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/map', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/list-your-company', changeFrequency: 'monthly', priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    companies, institutions, procedures, jobs, events, places, itineraries, posts,
    hospitals, clinics, pharmacies, professionals,
    companyCategories, uniqueCategories, jobSectors, eventCategories, placeCategories,
    services, menuItems, servicesByCompany, announcementsData, offersData,
  ] = await Promise.all([
    getActiveCompanies(),
    getInstitutions(),
    getProcedures(),
    getActiveJobPostings(),
    getEvents(),
    getTouristLocations(),
    getItineraries(),
    getActivePublishedPosts(),
    getHealthFacilitiesByType('hospital'),
    getHealthFacilitiesByType('clinic'),
    getHealthFacilitiesByType('pharmacy'),
    getActiveProfessionals(),
    getCompanyCategoryCounts(),
    getUniqueCategories(),
    getUniqueJobSectors(),
    getUniqueEventCategories(),
    getUniqueTouristLocationCategories(),
    getServices(),
    getActiveMenuItems(),
    getServicesByCompany(),
    buildAnnouncementsData(),
    buildOffersData(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // Institution and Procedure don't carry a createdAt field, unlike the
  // other entity types — fall back to "now" for those two.
  const entityEntries = (
    entities: { id: string; createdAt?: string }[],
    basePath: string,
    priority: number
  ): MetadataRoute.Sitemap =>
    entities.map((entity) => ({
      url: `${SITE_URL}${basePath}/${entity.id}`,
      lastModified: entity.createdAt ? new Date(entity.createdAt) : new Date(),
      changeFrequency: 'weekly',
      priority,
    }));

  // Category-landing entries mirror each collection's `generateStaticParams`
  // exactly, so every sitemap URL corresponds to a real prerendered page.
  const categoryEntries = (
    values: string[],
    basePath: string,
    priority: number
  ): MetadataRoute.Sitemap =>
    Array.from(new Set(values)).map((value) => ({
      url: `${SITE_URL}${basePath}/${slugify(value)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority,
    }));

  const institutionCategories = new Set(institutions.map((i) => i.category));
  const procedureCategoryNames = new Set(procedures.map((p) => p.category));

  return [
    ...staticEntries,
    ...entityEntries(companies, '/companies', 0.8),
    ...entityEntries(institutions, '/institutions', 0.6),
    ...entityEntries(procedures, '/procedures', 0.6),
    ...entityEntries(jobs, '/jobs', 0.7),
    ...entityEntries(events, '/events', 0.6),
    ...entityEntries(places, '/places', 0.7),
    ...entityEntries(itineraries, '/itineraries', 0.7),
    ...entityEntries(posts, '/contribuciones', 0.6),
    ...entityEntries(hospitals, '/health/hospitals', 0.7),
    ...entityEntries(clinics, '/health/clinics', 0.7),
    ...entityEntries(pharmacies, '/health/pharmacies', 0.7),
    ...entityEntries(professionals, '/professionals', 0.7),
    ...categoryEntries(companyCategories.map((c) => c.name), '/companies/category', 0.6),
    ...categoryEntries(services.map((s: Service) => s.category), '/professionals/category', 0.5),
    ...categoryEntries(uniqueCategories.filter((c) => institutionCategories.has(c.name)).map((c) => c.name), '/institutions/category', 0.5),
    ...categoryEntries(jobSectors, '/jobs/sector', 0.6),
    ...categoryEntries(eventCategories, '/events/category', 0.5),
    ...categoryEntries(menuItems.map((i) => i.foodType).filter(Boolean), '/food/type', 0.5),
    ...categoryEntries(placeCategories, '/places/category', 0.5),
    ...categoryEntries(uniqueCategories.filter((c) => procedureCategoryNames.has(c.name)).map((c) => c.name), '/procedures/category', 0.5),
    ...categoryEntries(servicesByCompany.map((s) => s.category).filter(Boolean), '/services/category', 0.5),
    ...categoryEntries(posts.map((p) => p.category).filter(Boolean) as string[], '/contribuciones/category', 0.5),
    ...categoryEntries(announcementsData.categoryList, '/announcements/category', 0.4),
    ...categoryEntries(offersData.categoryList, '/offers/category', 0.4),
  ];
}
