import type { MetadataRoute } from 'next';
import {
  getCompanies,
  getInstitutions,
  getProcedures,
  getJobPostings,
  getEvents,
  getTouristLocations,
  getItineraries,
  getPublishedPosts,
  getHealthFacilitiesByType,
  getProfessionals,
} from '@/lib/data';

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
  const [companies, institutions, procedures, jobs, events, places, itineraries, posts, hospitals, clinics, pharmacies, professionals] = await Promise.all([
    getCompanies(),
    getInstitutions(),
    getProcedures(),
    getJobPostings(),
    getEvents(),
    getTouristLocations(),
    getItineraries(),
    getPublishedPosts(),
    getHealthFacilitiesByType('hospital'),
    getHealthFacilitiesByType('clinic'),
    getHealthFacilitiesByType('pharmacy'),
    getProfessionals(),
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
  ];
}
