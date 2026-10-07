import { PrismaClient, Prisma } from '@prisma/client';
import type {
  AppUser, Branch, Review, Company, Announcement, Offer, Claim, Institution, Procedure, JobPosting,
  CalendarEvent, TouristLocation, Itinerary, HealthFacility, Professional, Post, Service, MenuItem,
  FoodOrder, SiteSettings, Notification,
} from './types';

// One PrismaClient per server process. In dev, Next's hot reload re-evaluates
// modules, so the client is parked on globalThis to avoid opening a new
// connection pool on every reload (shared hosting caps MySQL connections).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { Prisma };

// ---------------------------------------------------------------------------
// Row → app type mappers.
//
// The rest of the app was written against the Firestore document shapes in
// types.ts (a Company with embedded branches/reviews/offers, ISO date strings,
// optional fields absent rather than null...). These mappers rebuild exactly
// those shapes from the relational rows, so pages and components don't change.
// Everything returned is plain JSON-serializable data (no Date/Decimal), as
// Server Actions and unstable_cache require.
// ---------------------------------------------------------------------------

const iso = (d: Date) => d.toISOString();
const isoOpt = (d: Date | null | undefined) => (d ? d.toISOString() : undefined);
const opt = <T>(v: T | null | undefined): T | undefined => v ?? undefined;
const json = <T>(v: Prisma.JsonValue | null | undefined, fallback: T): T => (v ?? fallback) as T;
const dec = (v: Prisma.Decimal | number) => Number(v);

type BranchRow = Prisma.BranchGetPayload<{}>;
export function toBranch(b: BranchRow): Branch {
  return {
    id: b.id,
    name: b.name,
    location: { address: b.address, city: b.city, lat: b.lat ?? 0, lng: b.lng ?? 0 },
    contact: { phone: b.phone ?? '', email: b.email ?? '' },
    workingHours: json(b.workingHours, []),
    servicesOffered: json(b.servicesOffered, []),
  };
}

// Branch[] (as the forms and types.ts model it) → rows for createMany.
export function branchRows(
  owner: { companyId: string } | { institutionId: string } | { healthFacilityId: string },
  branches: Branch[] | undefined,
): Prisma.BranchCreateManyInput[] {
  return (branches ?? []).map((b, position) => ({
    ...owner,
    id: b.id || undefined,
    position,
    name: b.name ?? '',
    address: b.location?.address ?? '',
    city: b.location?.city ?? '',
    lat: b.location?.lat ?? null,
    lng: b.location?.lng ?? null,
    phone: b.contact?.phone || null,
    email: b.contact?.email || null,
    workingHours: (b.workingHours ?? []) as Prisma.InputJsonValue,
    servicesOffered: (b.servicesOffered ?? []) as Prisma.InputJsonValue,
  }));
}

type ReviewRow = Prisma.ReviewGetPayload<{}>;
export type ReviewTarget = Prisma.ReviewCreateInput['targetType'];
export function toReview(r: ReviewRow): Review {
  return {
    id: r.id,
    author: r.author,
    authorId: opt(r.authorId),
    rating: r.rating,
    comment: r.comment,
    date: iso(r.date),
    source: r.source === 'google' ? 'google' : undefined,
    reply: r.replyText ? { comment: r.replyText, date: isoOpt(r.replyDate) ?? iso(r.date) } : undefined,
  };
}

// Reviews are polymorphic (no FK), so they're fetched in one query per entity
// type and grouped, instead of being a Prisma relation include.
export async function reviewsFor(targetType: ReviewTarget, ids: string[]): Promise<Map<string, Review[]>> {
  const map = new Map<string, Review[]>();
  if (!ids.length) return map;
  const rows = await prisma.review.findMany({
    where: { targetType, targetId: { in: ids } },
    orderBy: { date: 'asc' },
  });
  for (const r of rows) {
    if (!map.has(r.targetId)) map.set(r.targetId, []);
    map.get(r.targetId)!.push(toReview(r));
  }
  return map;
}

// ---------------------------------------------------------------- users

export const userInclude = { favorites: true, subscriptions: true, fcmTokens: true } satisfies Prisma.UserInclude;
type UserRow = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export function toUser(u: UserRow): AppUser {
  const fav = (type: string) => u.favorites.filter(f => f.type === type).map(f => f.entityId);
  return {
    id: u.id,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
    createdAt: isoOpt(u.createdAt),
    title: opt(u.title),
    socials: { twitter: opt(u.twitter), linkedin: opt(u.linkedin) },
    favorites: {
      companies: fav('companies'),
      procedures: fav('procedures'),
      institutions: fav('institutions'),
      jobs: fav('jobs'),
      events: fav('events'),
      places: fav('places'),
      itineraries: fav('itineraries'),
      professionals: fav('professionals'),
    },
    subscriptions: {
      companies: u.subscriptions.filter(s => s.kind === 'company').map(s => s.value),
      categories: u.subscriptions.filter(s => s.kind === 'category').map(s => s.value),
    },
    role: u.role,
    isPremium: u.isPremium,
    isActive: u.isActive,
    fcmTokens: u.fcmTokens.map(t => t.token),
    notificationSettings: opt(u.notificationSettings as AppUser['notificationSettings'] | null),
  };
}

export function toNotification(n: Prisma.NotificationGetPayload<{}>): Notification {
  return { id: n.id, userId: n.userId, message: n.message, link: n.link, isRead: n.isRead, createdAt: iso(n.createdAt) };
}

// ---------------------------------------------------------------- companies

export const companyInclude = {
  branches: { orderBy: { position: 'asc' } },
  announcements: { orderBy: { createdAt: 'asc' } },
  offers: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.CompanyInclude;
type CompanyRow = Prisma.CompanyGetPayload<{ include: typeof companyInclude }>;

export function toAnnouncement(a: Prisma.CompanyAnnouncementGetPayload<{}>): Announcement {
  return { id: a.id, title: a.title, content: a.content, createdAt: iso(a.createdAt), image: opt(a.image) };
}

export function toOffer(o: Prisma.CompanyOfferGetPayload<{}>): Offer {
  return {
    id: o.id, title: o.title, description: o.description, discount: o.discount,
    // '' = no expiry date, the same value offers created from the mobile app always had.
    validUntil: isoOpt(o.validUntil) ?? '', createdAt: iso(o.createdAt), image: opt(o.image),
  };
}

export function toCompany(c: CompanyRow, reviews: Review[] = []): Company {
  return {
    id: c.id,
    ownerId: c.ownerId,
    name: c.name,
    legalForm: (c.legalForm ?? '') as Company['legalForm'],
    cif: c.cif ?? '',
    logo: c.logo ?? '',
    category: c.category,
    description: c.description,
    products: json(c.products, []),
    highlights: json(c.highlights, []),
    contact: {
      email: c.email ?? '',
      website: opt(c.website),
      socialMedia: opt(c.socialMedia as Company['contact']['socialMedia'] | null),
    },
    branches: c.branches.map(toBranch),
    image: c.image ?? '',
    reviews,
    announcements: c.announcements.map(toAnnouncement),
    offers: c.offers.map(toOffer),
    claims: [],
    documents: json(c.documents, []),
    yearEstablished: c.yearEstablished ?? 0,
    isVerified: c.isVerified,
    isFeatured: c.isFeatured,
    createdAt: iso(c.createdAt),
    companySize: opt(c.companySize) as Company['companySize'],
    capitalOwnership: opt(c.capitalOwnership) as Company['capitalOwnership'],
    geographicScope: opt(c.geographicScope) as Company['geographicScope'],
    purpose: opt(c.purpose) as Company['purpose'],
    fiscalRegime: opt(c.fiscalRegime) as Company['fiscalRegime'],
    gallery: json(c.gallery, []),
    googlePlaceId: opt(c.googlePlaceId),
    isActive: c.isActive,
    isPremium: c.isPremium,
  };
}

export async function findCompanies(args: Omit<Prisma.CompanyFindManyArgs, 'include' | 'select'> = {}): Promise<Company[]> {
  const rows = await prisma.company.findMany({ ...args, include: companyInclude });
  const reviews = await reviewsFor('company', rows.map(r => r.id));
  return rows.map(r => toCompany(r, reviews.get(r.id)));
}

export async function findCompany(id: string): Promise<Company | undefined> {
  return (await findCompanies({ where: { id } }))[0];
}

export function toClaim(c: Prisma.ClaimGetPayload<{}>): Claim {
  return {
    id: c.id, companyId: c.companyId, companyName: c.companyName, userId: c.userId,
    userName: c.userName, userEmail: c.userEmail, status: c.status, createdAt: iso(c.createdAt),
  };
}

export function toService(s: Prisma.ServiceGetPayload<{}>): Service {
  return { id: s.id, name: s.name, description: s.description, category: s.category };
}

// ---------------------------------------------------------------- institutions & procedures

export const institutionInclude = {
  branches: { orderBy: { position: 'asc' } },
  procedures: { select: { id: true, name: true } },
} satisfies Prisma.InstitutionInclude;
type InstitutionRow = Prisma.InstitutionGetPayload<{ include: typeof institutionInclude }>;

export function toInstitution(i: InstitutionRow, reviews: Review[] = []): Institution {
  return {
    id: i.id,
    name: i.name,
    logo: i.logo ?? '',
    category: i.category,
    description: i.description,
    responsiblePerson: i.responsiblePersonName
      ? { name: i.responsiblePersonName, title: i.responsiblePersonTitle ?? '' }
      : undefined,
    contact: { email: i.email ?? '', website: i.website ?? '', whatsapp: opt(i.whatsapp) },
    branches: i.branches.map(toBranch),
    procedures: i.procedures,
    image: i.image ?? '',
    reviews,
  };
}

export async function findInstitutions(args: Omit<Prisma.InstitutionFindManyArgs, 'include' | 'select'> = {}): Promise<Institution[]> {
  const rows = await prisma.institution.findMany({ ...args, include: institutionInclude });
  const reviews = await reviewsFor('institution', rows.map(r => r.id));
  return rows.map(r => toInstitution(r, reviews.get(r.id)));
}

export function toProcedure(p: Prisma.ProcedureGetPayload<{}>, reviews: Review[] = []): Procedure {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    institution: p.institutionName,
    institutionId: p.institutionId ?? '',
    requirements: json(p.requirements, []),
    steps: json(p.steps, []),
    cost: p.cost,
    reviews,
    documents: json(p.documents, []),
  };
}

export async function findProcedures(args: Omit<Prisma.ProcedureFindManyArgs, 'include' | 'select'> = {}): Promise<Procedure[]> {
  const rows = await prisma.procedure.findMany(args);
  const reviews = await reviewsFor('procedure', rows.map(r => r.id));
  return rows.map(r => toProcedure(r, reviews.get(r.id)));
}

// ---------------------------------------------------------------- jobs & events

export function toJobPosting(j: Prisma.JobPostingGetPayload<{}>): JobPosting {
  return {
    id: j.id,
    companyId: j.companyId,
    companyName: j.companyName,
    companyLogo: j.companyLogo ?? '',
    ownerId: j.ownerId,
    title: j.title,
    description: j.description,
    sector: j.sector,
    city: j.city,
    employmentType: j.employmentType as JobPosting['employmentType'],
    salaryRange: opt(j.salaryRange),
    requirements: json(j.requirements, []),
    responsibilities: json(j.responsibilities, []),
    academicLevel: opt(j.academicLevel) as JobPosting['academicLevel'],
    experience: json(j.experience, []),
    skills: json(j.skills, []),
    applicationMethod: j.applicationMethod,
    applicationValue: j.applicationValue,
    applicationInstructions: opt(j.applicationInstructions),
    status: j.status,
    deadline: isoOpt(j.deadline),
    createdAt: iso(j.createdAt),
    applicationClickCount: j.applicationClickCount,
  };
}

export function toEvent(e: Prisma.EventGetPayload<{}>): CalendarEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    city: e.city,
    address: opt(e.address),
    startDate: iso(e.startDate),
    endDate: isoOpt(e.endDate),
    organizerType: e.organizerType,
    organizerId: e.organizerId,
    organizerName: e.organizerName,
    organizerLogo: e.organizerLogo ?? '',
    ownerId: e.ownerId,
    registrationMethod: e.registrationMethod,
    registrationValue: opt(e.registrationValue),
    status: e.status,
    createdAt: iso(e.createdAt),
  };
}

// ---------------------------------------------------------------- tourism

export function toTouristLocation(t: Prisma.TouristLocationGetPayload<{}>, reviews: Review[] = []): TouristLocation {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    location: { address: t.address, city: t.city, lat: t.lat ?? 0, lng: t.lng ?? 0 },
    image: t.image ?? '',
    gallery: json(t.gallery, []),
    priceRange: opt(t.priceRange) as TouristLocation['priceRange'],
    openingHours: json(t.openingHours, []),
    linkedCompanyId: t.linkedCompanyId,
    reviews,
    status: t.status,
    submittedBy: t.submittedBy,
    isFeatured: t.isFeatured,
    createdAt: iso(t.createdAt),
  };
}

export async function findTouristLocations(args: Omit<Prisma.TouristLocationFindManyArgs, 'include' | 'select'> = {}): Promise<TouristLocation[]> {
  const rows = await prisma.touristLocation.findMany(args);
  const reviews = await reviewsFor('touristLocation', rows.map(r => r.id));
  return rows.map(r => toTouristLocation(r, reviews.get(r.id)));
}

export const itineraryInclude = { stops: { orderBy: [{ day: 'asc' }, { order: 'asc' }] } } satisfies Prisma.ItineraryInclude;
type ItineraryRow = Prisma.ItineraryGetPayload<{ include: typeof itineraryInclude }>;

export function toItinerary(i: ItineraryRow, reviews: Review[] = []): Itinerary {
  return {
    id: i.id,
    title: i.title,
    description: i.description,
    coverImage: i.coverImage ?? '',
    authorId: i.authorId,
    authorName: i.authorName,
    city: i.city,
    durationDays: i.durationDays,
    theme: json(i.theme, []),
    visibility: i.visibility,
    stops: i.stops.map(s => ({
      id: s.id,
      locationId: s.locationId,
      locationType: s.locationType,
      order: s.order,
      day: s.day,
      suggestedTime: opt(s.suggestedTime),
      notes: opt(s.notes),
    })),
    reviews,
    isFeatured: i.isFeatured,
    createdAt: iso(i.createdAt),
  };
}

export async function findItineraries(args: Omit<Prisma.ItineraryFindManyArgs, 'include' | 'select'> = {}): Promise<Itinerary[]> {
  const rows = await prisma.itinerary.findMany({ ...args, include: itineraryInclude });
  const reviews = await reviewsFor('itinerary', rows.map(r => r.id));
  return rows.map(r => toItinerary(r, reviews.get(r.id)));
}

// ---------------------------------------------------------------- health

export const healthFacilityInclude = {
  branches: { orderBy: { position: 'asc' } },
  onDutyDates: { orderBy: { date: 'asc' } },
} satisfies Prisma.HealthFacilityInclude;
type HealthFacilityRow = Prisma.HealthFacilityGetPayload<{ include: typeof healthFacilityInclude }>;

export function toHealthFacility(h: HealthFacilityRow): HealthFacility {
  return {
    id: h.id,
    type: h.type,
    name: h.name,
    ownership: h.ownership,
    description: h.description,
    services: json(h.services, []),
    specialties: json(h.specialties, []),
    emergencyServices: h.emergencyServices,
    contact: h.whatsapp ? { whatsapp: h.whatsapp } : undefined,
    branches: h.branches.map(toBranch),
    onDutyDates: h.onDutyDates.map(d => d.date.toISOString().slice(0, 10)),
    image: opt(h.image),
    isVerified: h.isVerified,
    isFeatured: h.isFeatured,
    createdAt: iso(h.createdAt),
  };
}

export async function findHealthFacilities(args: Omit<Prisma.HealthFacilityFindManyArgs, 'include' | 'select'> = {}): Promise<HealthFacility[]> {
  const rows = await prisma.healthFacility.findMany({ ...args, include: healthFacilityInclude });
  return rows.map(toHealthFacility);
}

// ---------------------------------------------------------------- professionals

const AVAILABILITY_FROM_DB = { Disponible: 'Disponible', Ocupado: 'Ocupado', A_demanda: 'A demanda' } as const;
export const AVAILABILITY_TO_DB = { Disponible: 'Disponible', Ocupado: 'Ocupado', 'A demanda': 'A_demanda' } as const;

export function toProfessional(p: Prisma.ProfessionalGetPayload<{}>, reviews: Review[] = []): Professional {
  return {
    id: p.id,
    ownerId: p.ownerId,
    displayName: p.displayName,
    title: p.title,
    photo: opt(p.photo),
    bio: p.bio,
    category: p.category,
    skills: json(p.skills, []),
    services: json(p.services, []),
    portfolio: json(p.portfolio, []),
    city: p.city,
    availability: p.availability ? AVAILABILITY_FROM_DB[p.availability] : undefined,
    contact: { phone: opt(p.phone), whatsapp: opt(p.whatsapp), email: opt(p.email), linkedin: opt(p.linkedin) },
    reviews,
    isVerified: p.isVerified,
    createdAt: iso(p.createdAt),
  };
}

export async function findProfessionals(args: Omit<Prisma.ProfessionalFindManyArgs, 'include' | 'select'> = {}): Promise<Professional[]> {
  const rows = await prisma.professional.findMany(args);
  const reviews = await reviewsFor('professional', rows.map(r => r.id));
  return rows.map(r => toProfessional(r, reviews.get(r.id)));
}

// ---------------------------------------------------------------- blog

export const postInclude = { comments: { orderBy: { createdAt: 'asc' } } } satisfies Prisma.PostInclude;
type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export function toPost(p: PostRow): Post {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    content: p.content,
    featuredImage: p.featuredImage ?? '',
    imageDescription: opt(p.imageDescription),
    authorId: p.authorId,
    authorName: p.authorName,
    category: opt(p.category),
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
    status: p.status,
    excerpt: p.excerpt,
    comments: p.comments.map(c => ({
      id: c.id, authorName: c.authorName, userId: c.userId, comment: c.comment, createdAt: iso(c.createdAt),
    })),
  };
}

// ---------------------------------------------------------------- food

export function toMenuItem(m: Prisma.MenuItemGetPayload<{}>): MenuItem {
  return {
    id: m.id,
    companyId: m.companyId,
    companyName: m.companyName,
    ownerId: m.ownerId,
    name: m.name,
    description: m.description,
    price: dec(m.price),
    image: opt(m.image),
    foodType: m.foodType,
    isMenuDelDia: m.isMenuDelDia,
    available: m.available,
    optionGroups: json(m.optionGroups, []),
    createdAt: iso(m.createdAt),
  };
}

export function toFoodOrder(o: Prisma.FoodOrderGetPayload<{}>): FoodOrder {
  return {
    id: o.id,
    companyId: o.companyId,
    companyName: o.companyName,
    customerId: o.customerId,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    items: json(o.items, []),
    subtotal: dec(o.subtotal),
    deliveryMethod: o.deliveryMethod,
    deliveryAddress: opt(o.deliveryAddress),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    commissionPercent: dec(o.commissionPercent),
    commissionAmount: dec(o.commissionAmount),
    status: o.status,
    notes: opt(o.notes),
    createdAt: iso(o.createdAt),
  };
}

// ---------------------------------------------------------------- settings

export function toSiteSettings(s: Prisma.SiteSettingsGetPayload<{}>): SiteSettings {
  const fees = s.foodDeliveryFees as SiteSettings['foodDeliveryFees'] | null;
  return {
    siteName: s.siteName,
    siteSlogan: s.siteSlogan,
    logoUrl: s.logoUrl ?? '',
    cities: json(s.cities, []),
    isBusinessAdvisorEnabled: s.isBusinessAdvisorEnabled,
    socialMedia: opt(s.socialMedia as SiteSettings['socialMedia'] | null),
    foodDeliveryFees: {
      muniDineroCommissionPercent: fees?.muniDineroCommissionPercent ?? 0,
      situkaCommissionPercent: fees?.situkaCommissionPercent ?? 0,
    },
  };
}
