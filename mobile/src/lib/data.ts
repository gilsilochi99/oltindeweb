// The mobile app's data layer. Every function calls the web app's
// /api/mobile/rpc endpoint (see ./api.ts), which runs the SAME function the
// website uses against its MySQL database — so filtering rules (isActive,
// status, visibility...), permission checks and notifications are shared,
// not reimplemented here. Signatures are unchanged from the Firestore
// version, so screens and use-queries.ts didn't need to change; where the
// mobile forms collect data in a flatter shape than the web forms, the
// small adapters below convert it.
//
// No caching layer here: TanStack Query (src/hooks/use-queries.ts) caches
// on the client.
import { rpc, rpcAction } from './api';
import type {
  Company,
  Branch,
  Professional,
  Procedure,
  Institution,
  HealthFacility,
  HealthFacilityType,
  TouristLocation,
  JobPosting,
  CalendarEvent,
  Itinerary,
  Post,
  Service,
  SiteSettings,
  Offer,
  Announcement,
  MenuItem,
  MenuItemOptionGroup,
  FoodOrder,
  FoodOrderItem,
  FoodOrderStatus,
  FoodOrderDeliveryMethod,
  FoodOrderPaymentMethod,
  LegalForm,
  AppUser,
  Claim,
} from './types';

type WithId = { success: boolean; message?: string; id?: string };
const byNewest = (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime();

// The mobile forms edit one "main" branch as flat fields; the web actions take
// the full branch list. Other branches are passed back untouched, and
// omitting lat/lng lets the server keep the existing coordinates.
function branchesFromForm(
  input: { branchName: string; address: string; city: string; phone: string; branchEmail?: string; workingHours: { day: string; hours: string }[] },
  existing: Branch[] | undefined,
  defaultName: string,
) {
  const main = {
    name: input.branchName || defaultName,
    location: { address: input.address, city: input.city },
    contact: { phone: input.phone, email: input.branchEmail || '' },
    workingHours: input.workingHours,
    servicesOffered: existing?.[0]?.servicesOffered ?? [],
  };
  return [main, ...(existing?.slice(1) ?? [])];
}

// ---------- companies ----------

export async function getActiveCompanies(): Promise<Company[]> {
  return rpc('getActiveCompanies');
}

export async function getCompanyById(id: string): Promise<Company | undefined> {
  if (!id) return undefined;
  return (await rpc<Company | null>('getCompanyById', id)) ?? undefined;
}

// ---------- professionals ----------

export async function getActiveProfessionals(): Promise<Professional[]> {
  return rpc('getActiveProfessionals');
}

export async function getProfessionalById(id: string): Promise<Professional | undefined> {
  if (!id) return undefined;
  return (await rpc<Professional | null>('getProfessionalById', id)) ?? undefined;
}

// ---------- procedures ----------

export async function getProcedures(): Promise<Procedure[]> {
  return rpc('getProcedures');
}

export async function getProcedureById(id: string): Promise<Procedure | undefined> {
  if (!id) return undefined;
  return (await rpc<Procedure | null>('getProcedureById', id)) ?? undefined;
}

export type ProcedureFormInput = Omit<Procedure, 'id' | 'reviews'>;

export async function createProcedure(input: ProcedureFormInput): Promise<string> {
  return (await rpcAction<WithId>('createProcedure', input)).id ?? '';
}

export async function updateProcedure(id: string, input: ProcedureFormInput): Promise<void> {
  await rpcAction('updateProcedure', id, input);
}

export async function deleteProcedure(id: string): Promise<void> {
  await rpcAction('deleteProcedure', id);
}

// ---------- institutions ----------

export async function getInstitutions(): Promise<Institution[]> {
  return rpc('getInstitutions');
}

export async function getInstitutionById(id: string): Promise<Institution | undefined> {
  if (!id) return undefined;
  return (await rpc<Institution | null>('getInstitutionById', id)) ?? undefined;
}

export interface InstitutionFormInput {
  name: string;
  logo?: string;
  description: string;
  category: string;
  responsibleName?: string;
  responsibleTitle?: string;
  email: string;
  website?: string;
  whatsapp?: string;
  branchName: string;
  address: string;
  city: string;
  phone: string;
  branchEmail?: string;
  workingHours: { day: string; hours: string }[];
}

function institutionForm(input: InstitutionFormInput, existing?: Institution) {
  return {
    name: input.name,
    logo: input.logo || existing?.logo,
    description: input.description,
    category: input.category,
    responsiblePerson: input.responsibleName ? { name: input.responsibleName, title: input.responsibleTitle || '' } : undefined,
    contact: { email: input.email, website: input.website || '', whatsapp: input.whatsapp || '' },
    branches: branchesFromForm(input, existing?.branches, 'Sede Principal'),
  };
}

export async function createInstitution(input: InstitutionFormInput): Promise<string> {
  return (await rpcAction<WithId>('createInstitution', institutionForm(input))).id ?? '';
}

export async function updateInstitution(institution: Institution, input: InstitutionFormInput): Promise<void> {
  await rpcAction('updateInstitution', institution.id, institutionForm(input, institution));
}

export async function deleteInstitution(id: string): Promise<void> {
  await rpcAction('deleteInstitution', id);
}

// ---------- health facilities ----------

export async function getHealthFacilities(): Promise<HealthFacility[]> {
  return rpc('getHealthFacilities');
}

export async function getHealthFacilitiesByType(type: HealthFacilityType): Promise<HealthFacility[]> {
  return rpc('getHealthFacilitiesByType', type);
}

export async function getHealthFacilityById(id: string): Promise<HealthFacility | undefined> {
  if (!id) return undefined;
  return (await rpc<HealthFacility | null>('getHealthFacilityById', id)) ?? undefined;
}

export interface HealthFacilityFormInput {
  type: HealthFacilityType;
  name: string;
  ownership: 'public' | 'private';
  description: string;
  services: string[];
  specialties: string[];
  emergencyServices: boolean;
  whatsapp?: string;
  image?: string;
  branchName: string;
  address: string;
  city: string;
  phone: string;
  branchEmail: string;
  workingHours: { day: string; hours: string }[];
}

function healthFacilityForm(input: HealthFacilityFormInput, existing?: HealthFacility) {
  return {
    type: input.type,
    name: input.name,
    ownership: input.ownership,
    description: input.description,
    services: input.services,
    specialties: input.specialties,
    emergencyServices: input.emergencyServices,
    contact: { whatsapp: input.whatsapp || '' },
    image: input.image || existing?.image,
    branches: branchesFromForm(input, existing?.branches, 'Sede Principal'),
  };
}

export async function createHealthFacility(input: HealthFacilityFormInput): Promise<string> {
  return (await rpcAction<WithId>('createHealthFacility', healthFacilityForm(input))).id ?? '';
}

export async function updateHealthFacility(facility: HealthFacility, input: HealthFacilityFormInput): Promise<void> {
  await rpcAction('updateHealthFacility', facility.id, healthFacilityForm(input, facility));
}

export async function deleteHealthFacility(id: string): Promise<void> {
  await rpcAction('deleteHealthFacility', id);
}

export async function getPharmaciesOnDuty(): Promise<HealthFacility[]> {
  return rpc('getPharmaciesOnDuty');
}

// ---------- places (tourist locations) ----------

export async function getTouristLocations(): Promise<TouristLocation[]> {
  return rpc('getTouristLocations');
}

export async function getTouristLocationById(id: string): Promise<TouristLocation | undefined> {
  if (!id) return undefined;
  return (await rpc<TouristLocation | null>('getTouristLocationById', id)) ?? undefined;
}

// ---------- jobs ----------

export async function getActiveJobPostings(): Promise<JobPosting[]> {
  return rpc('getActiveJobPostings');
}

export async function getJobById(id: string): Promise<JobPosting | undefined> {
  if (!id) return undefined;
  return (await rpc<JobPosting | null>('getJobById', id)) ?? undefined;
}

// ---------- events ----------

export async function getEvents(): Promise<CalendarEvent[]> {
  return rpc('getEvents');
}

export async function getEventById(id: string): Promise<CalendarEvent | undefined> {
  if (!id) return undefined;
  return (await rpc<CalendarEvent | null>('getEventById', id)) ?? undefined;
}

// ---------- itineraries ----------

export async function getItineraries(): Promise<Itinerary[]> {
  return rpc('getItineraries');
}

export async function getItineraryById(id: string): Promise<Itinerary | undefined> {
  if (!id) return undefined;
  return (await rpc<Itinerary | null>('getItineraryById', id)) ?? undefined;
}

// ---------- posts (contribuciones) ----------

export async function getPublishedPosts(): Promise<Post[]> {
  return rpc('getActivePublishedPosts');
}

export async function getPostById(id: string): Promise<Post | undefined> {
  if (!id) return undefined;
  return (await rpc<Post | null>('getPostById', id)) ?? undefined;
}

// ---------- offers / announcements ----------

export async function getOfferById(offerId: string): Promise<{ offer: Offer; company: Company } | undefined> {
  return (await rpc<{ offer: Offer; company: Company } | null>('getOfferById', offerId)) ?? undefined;
}

export async function getAnnouncementById(
  announcementId: string,
): Promise<{ announcement: Announcement; company: Company } | undefined> {
  return (await rpc<{ announcement: Announcement; company: Company } | null>('getAnnouncementById', announcementId)) ?? undefined;
}

export async function getAllOffers(): Promise<{ offer: Offer; company: Company }[]> {
  const companies = await getActiveCompanies();
  return companies
    .flatMap((company) => (company.offers || []).map((offer) => ({ offer, company })))
    .sort((a, b) => byNewest(a.offer.createdAt, b.offer.createdAt));
}

export async function getAllAnnouncements(): Promise<{ announcement: Announcement; company: Company }[]> {
  const companies = await getActiveCompanies();
  return companies
    .flatMap((company) => (company.announcements || []).map((announcement) => ({ announcement, company })))
    .sort((a, b) => byNewest(a.announcement.createdAt, b.announcement.createdAt));
}

// ---------- food ordering ----------

export async function getMenuItemsByCompany(companyId: string): Promise<MenuItem[]> {
  return rpc('getMenuItemsByCompany', companyId);
}

// Mirrors web home page's "Menús del Día" section (src/app/page.tsx).
export async function getMenuDelDiaItems(): Promise<MenuItem[]> {
  const items = await getActiveMenuItems();
  return items.filter((i) => i.isMenuDelDia && i.available);
}

export async function createFoodOrder(input: {
  companyId: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  items: FoodOrderItem[];
  deliveryMethod: FoodOrderDeliveryMethod;
  deliveryAddress?: string;
  paymentMethod: FoodOrderPaymentMethod;
  notes?: string;
}): Promise<string> {
  return (await rpcAction<WithId>('createFoodOrder', { ...input, customerId: input.customerId ?? undefined })).id ?? '';
}

// ---------- services / settings ----------

export async function getServices(): Promise<Service[]> {
  return rpc('getServices');
}

export type ServiceFormInput = Omit<Service, 'id'>;

export async function createService(input: ServiceFormInput): Promise<string> {
  return (await rpcAction<WithId>('createService', input)).id ?? '';
}

export async function updateService(id: string, input: ServiceFormInput): Promise<void> {
  await rpcAction('updateService', id, input);
}

export async function deleteService(id: string): Promise<void> {
  await rpcAction('deleteService', id);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return rpc('getSiteSettings');
}

export async function getUniqueCities(): Promise<string[]> {
  return rpc('getUniqueCities');
}

// ---------- search index (mirrors web's getSearchIndexData) ----------

export async function getActiveMenuItems(): Promise<MenuItem[]> {
  return rpc('getActiveMenuItems');
}

export async function getSearchIndexData(): Promise<{
  companies: Company[]; institutions: Institution[]; procedures: Procedure[]; posts: Post[];
  services: Service[]; cities: string[]; jobs: JobPosting[]; events: CalendarEvent[];
  menuItems: MenuItem[]; professionals: Professional[]; itineraries: Itinerary[];
  places: TouristLocation[]; healthFacilities: HealthFacility[];
}> {
  return rpc('getSearchIndexData');
}

// ---------- reviews ----------

export type ReviewableEntityType = 'companies' | 'institutions' | 'procedures' | 'itineraries' | 'professionals';

export async function addReview({
  entityId,
  entityType,
  rating,
  comment,
  userId,
  authorName,
}: {
  entityId: string;
  entityType: ReviewableEntityType;
  rating: number;
  comment: string;
  userId: string;
  authorName: string;
}): Promise<void> {
  await rpcAction('addReview', { entityId, entityType, reviewData: { rating, comment }, userId, authorName });
}

// ---------- claims ----------

export async function createClaim(args: {
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  userEmail: string;
}): Promise<{ success: boolean; message: string }> {
  const result = await rpc<{ success: boolean; message?: string }>('createClaim', args);
  return { success: result.success, message: result.message ?? '' };
}

// ---------- post comments ----------

export async function addPostComment({
  postId,
  comment,
  userId,
  authorName,
}: {
  postId: string;
  comment: string;
  userId: string;
  authorName: string;
}): Promise<void> {
  await rpcAction('addPostComment', { postId, comment, userId, authorName });
}

// ---------- place suggestion ----------

// Creates an unapproved place for staff to review (the server records the
// signed-in user as the submitter).
export async function suggestTouristLocation(input: {
  name: string;
  description: string;
  category: string;
  city: string;
  address: string;
  userId: string;
}): Promise<string> {
  const result = await rpcAction<WithId>('submitTouristLocation', input.userId, {
    name: input.name,
    description: input.description,
    category: input.category,
    location: { address: input.address, city: input.city },
  });
  return result.id ?? '';
}

// ---------- owner dashboard: companies ----------

export async function getCompaniesByOwner(ownerId: string): Promise<Company[]> {
  return rpc('getCompaniesByOwner', ownerId);
}

export interface CompanyFormInput {
  name: string;
  category: string;
  description: string;
  logo?: string;
  email: string;
  website?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  branchName: string;
  address: string;
  city: string;
  phone: string;
  branchEmail?: string;
  workingHours: { day: string; hours: string }[];
  legalForm?: LegalForm;
  cif?: string;
  yearEstablished?: number;
}

// Fields this simplified form doesn't edit (products, gallery, extra
// branches...) are passed back from the existing company so an update
// never wipes them.
function companyForm(input: CompanyFormInput, existing?: Company) {
  return {
    name: input.name,
    category: input.category,
    description: input.description,
    logo: input.logo || existing?.logo,
    products: existing?.products ?? [],
    gallery: existing?.gallery ?? [],
    contact: {
      email: input.email,
      website: input.website || '',
      socialMedia: {
        whatsapp: input.whatsapp || '',
        facebook: input.facebook || '',
        instagram: input.instagram || '',
        twitter: input.twitter || '',
        linkedin: input.linkedin || '',
        tiktok: input.tiktok || '',
      },
    },
    yearEstablished: input.yearEstablished || existing?.yearEstablished || new Date().getFullYear(),
    legalForm: input.legalForm || existing?.legalForm || 'Empresa Individual',
    cif: input.cif || existing?.cif || 'N/A',
    branches: branchesFromForm(input, existing?.branches, 'Sucursal Principal'),
  };
}

export async function createCompany(input: CompanyFormInput, ownerId: string): Promise<string> {
  return (await rpcAction<WithId>('createCompany', { userId: ownerId, companyData: companyForm(input) })).id ?? '';
}

export async function updateCompany(company: Company, input: CompanyFormInput): Promise<void> {
  await rpcAction('updateCompany', { companyId: company.id, companyData: companyForm(input, company) });
}

export async function setCompanyActive(companyId: string, isActive: boolean): Promise<void> {
  await rpcAction('setCompanyActive', companyId, isActive);
}

// ---------- owner dashboard: professional profile ----------

export async function getProfessionalByOwner(ownerId: string): Promise<Professional | undefined> {
  return (await rpc<Professional | null>('getProfessionalByOwnerId', ownerId)) ?? undefined;
}

// ---------- owner dashboard: menu items ----------
// (The server identifies the caller itself; the web actions' userId argument is unused.)

export interface MenuItemFormInput {
  name: string;
  description: string;
  price: number;
  image?: string;
  foodType: string;
  isMenuDelDia?: boolean;
  available: boolean;
  optionGroups: MenuItemOptionGroup[];
}

export async function createMenuItem(company: Company, ownerId: string, input: MenuItemFormInput): Promise<string> {
  return (await rpcAction<WithId>('createMenuItem', company.id, ownerId, input)).id ?? '';
}

export async function updateMenuItem(itemId: string, input: MenuItemFormInput): Promise<void> {
  await rpcAction('updateMenuItem', itemId, '', { ...input, image: input.image || '' });
}

export async function deleteMenuItem(itemId: string): Promise<void> {
  await rpcAction('deleteMenuItem', itemId, '');
}

export async function toggleMenuItemAvailable(itemId: string, available: boolean): Promise<void> {
  await rpcAction('updateMenuItem', itemId, '', { available });
}

// ---------- owner dashboard: food orders ----------

export async function getFoodOrdersByCompany(companyId: string): Promise<FoodOrder[]> {
  return rpc('getFoodOrdersByCompany', companyId);
}

export async function updateFoodOrderStatus(order: FoodOrder, status: FoodOrderStatus): Promise<void> {
  await rpcAction('updateFoodOrderStatus', order.id, '', status);
}

// ---------- owner dashboard: job postings ----------

export async function getJobPostingsByCompany(companyId: string): Promise<JobPosting[]> {
  return rpc('getJobPostingsByCompany', companyId);
}

export interface JobPostingFormInput {
  title: string;
  description: string;
  sector: string;
  city: string;
  employmentType: JobPosting['employmentType'];
  academicLevel?: JobPosting['academicLevel'];
  salaryRange?: string;
  requirements: string[];
  responsibilities: string[];
  experience: string[];
  skills: string[];
  applicationMethod: 'email' | 'link';
  applicationValue: string;
  applicationInstructions?: string;
  deadline?: string;
}

// The server enforces the premium-account requirement, as on the web.
export async function createJobPosting(company: Company, ownerId: string, input: JobPostingFormInput): Promise<string> {
  return (await rpcAction<WithId>('createJobPosting', company.id, ownerId, input)).id ?? '';
}

export async function updateJobPosting(jobId: string, input: JobPostingFormInput): Promise<void> {
  await rpcAction('updateJobPosting', jobId, '', input);
}

export async function deleteJobPosting(jobId: string): Promise<void> {
  await rpcAction('deleteJobPosting', jobId, '');
}

export async function toggleJobStatus(jobId: string, _status: JobPosting['status']): Promise<void> {
  await rpcAction('toggleJobStatus', jobId, '');
}

// ---------- owner dashboard: events ----------

export async function getEventsByCompany(companyId: string): Promise<CalendarEvent[]> {
  const events = await getEvents();
  return events
    .filter((e) => e.organizerType === 'company' && e.organizerId === companyId)
    .sort((a, b) => byNewest(a.startDate, b.startDate));
}

export interface EventFormInput {
  title: string;
  description: string;
  category: string;
  city: string;
  address?: string;
  startDate: string;
  endDate?: string;
  registrationMethod: CalendarEvent['registrationMethod'];
  registrationValue?: string;
}

export async function createEvent(company: Company, input: EventFormInput): Promise<string> {
  return (await rpcAction<WithId>('createEvent', 'company', company.id, null, false, input)).id ?? '';
}

export async function deleteEvent(eventId: string): Promise<void> {
  await rpcAction('deleteEvent', eventId, null);
}

export async function toggleEventStatus(eventId: string, _status: CalendarEvent['status']): Promise<void> {
  await rpcAction('toggleEventStatus', eventId, null);
}

// ---------- owner dashboard: offers & announcements ----------

export async function addOffer(company: Company, input: { title: string; discount: string; validUntil?: string; description?: string }): Promise<void> {
  await rpcAction('addOffer', company.id, {
    title: input.title,
    discount: input.discount,
    validUntil: input.validUntil || '',
    description: input.description || '',
  });
}

export async function deleteOffer(company: Company, offer: Offer): Promise<void> {
  await rpcAction('deleteOffer', company.id, offer.id);
}

export async function addAnnouncement(company: Company, input: { title: string; content: string; image?: string }): Promise<void> {
  await rpcAction('addAnnouncement', company.id, input);
}

export async function deleteAnnouncement(company: Company, announcement: Announcement): Promise<void> {
  await rpcAction('deleteAnnouncement', company.id, announcement.id);
}

// ---------- admin: claims moderation ----------

export async function getPendingClaims(): Promise<Claim[]> {
  const claims = await rpc<Claim[]>('getClaims');
  return claims
    .filter((c) => c.status === 'pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function processClaim(claim: Claim, approve: boolean): Promise<void> {
  await rpcAction('processClaim', { claimId: claim.id, companyId: claim.companyId, userId: claim.userId, approve });
}

// ---------- admin: places moderation ----------

export async function getPendingPlaces(): Promise<TouristLocation[]> {
  return rpc('getPendingTouristLocations');
}

export async function reviewTouristLocation(locationId: string, decision: 'approved' | 'rejected'): Promise<void> {
  await rpcAction('reviewTouristLocation', locationId, '', true, decision);
}

// ---------- admin: users & roles ----------

export async function getAllUsers(): Promise<AppUser[]> {
  return rpc('getAllUsers');
}

export async function updateUserRole(userId: string, role: NonNullable<AppUser['role']>): Promise<void> {
  await rpcAction('updateUserRole', userId, role);
}

export async function toggleUserPremium(userId: string, _currentStatus: boolean): Promise<void> {
  await rpcAction('toggleUserPremiumStatus', userId);
}
