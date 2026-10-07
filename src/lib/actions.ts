
'use server';

import { revalidatePath } from 'next/cache';
import { prisma, Prisma, branchRows, findCompany, findInstitutions, findHealthFacilities, toAnnouncement, toOffer, toFoodOrder, AVAILABILITY_TO_DB, type ReviewTarget } from './db';
import { getCurrentCaller, isManagerRole, isEditorRole, isPharmacistRole, isAdminRole, getAdminAuth, type Caller } from './firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import type { Branch, Company, Institution, Procedure, Service, Claim, CompanyProduct, Post, Offer, Announcement, Document, Review, PostComment, SiteSettings, Product, AppUser, LegalForm, CompanySize, CapitalOwnership, GeographicScope, CompanyPurpose, FiscalRegime, LocalBusiness, JobPosting, EmploymentType, AcademicLevel, CalendarEvent, EventOrganizerType, EventRegistrationMethod, TouristLocation, TouristLocationPriceRange, Itinerary, ItineraryStop, ItineraryStopLocationType, ItineraryVisibility, HealthFacility, HealthFacilityType, HealthFacilityOwnership, MenuItem, FoodOrder, FoodOrderItem, FoodOrderDeliveryMethod, FoodOrderPaymentMethod, FoodOrderStatus, Professional, ProfessionalService, ProfessionalAvailability } from './types';
import { sendPasswordResetEmail } from "firebase/auth";
import { createNotificationsForSubscribers, sendNotificationToUser, sendPushForUser } from './notifications';
import { auth as adminAuth } from './firebase'; // Use the initialized auth instance
import { deleteUploadByUrl } from './uploads';
import { searchPlaces, getPlaceDetails, uploadPlacePhotoToStorage, type PlaceResult } from './google-places';


interface BranchFormData {
  name: string;
  location: {
    address: string;
    city: string;
    lat?: number;
    lng?: number;
  };
  contact: {
    phone?: string;
    email?: string;
  };
  workingHours?: {
    day: string;
    hours: string;
  }[];
  servicesOffered?: string[];
}

// Rebuilds a branches array for an update, preserving each branch's existing `id`
// and lat/lng when the submitted form doesn't carry them (the branch forms don't
// expose an `id` field, and lat/lng are optional) — otherwise Firestore's array
// replace-on-update would silently wipe both on every edit. Matching is by index
// since none of the branch forms support reordering, only sequential append/remove.
function reconcileBranches(existingBranches: Branch[] | undefined, formBranches: BranchFormData[]): Branch[] {
  return formBranches.map((branch, index) => {
    const existing = existingBranches?.[index];
    return {
      id: existing?.id || uuidv4(),
      name: branch.name,
      location: {
        address: branch.location.address,
        city: branch.location.city,
        lat: branch.location.lat ?? existing?.location.lat ?? 0,
        lng: branch.location.lng ?? existing?.location.lng ?? 0,
      },
      contact: {
        phone: branch.contact.phone || '',
        email: branch.contact.email || '',
      },
      workingHours: branch.workingHours?.length ? branch.workingHours : (existing?.workingHours || []),
      servicesOffered: branch.servicesOffered || [],
    };
  });
}

// ---------------------------------------------------------------------------
// MySQL write helpers. Form data arrives in the same shapes the Firestore
// version accepted; these turn it into column values. For partial updates,
// `undefined` leaves a column untouched (as Firestore's updateDoc did).
// ---------------------------------------------------------------------------

type BranchOwner = { companyId: string } | { institutionId: string } | { healthFacilityId: string };

// Branches are rows in their own table; saving replaces the owner's whole set.
// Ids survive edits because reconcileBranches carries them over.
async function replaceBranches(tx: Prisma.TransactionClient, owner: BranchOwner, branches: Branch[]) {
  await tx.branch.deleteMany({ where: owner });
  if (branches.length) await tx.branch.createMany({ data: branchRows(owner, branches) });
}

function defaultBranch(address: string, city: string, phone: string, weekdayHours: string): Branch {
  return {
    id: uuidv4(),
    name: 'Sede Principal',
    location: { address, city, lat: 0, lng: 0 },
    contact: { phone, email: '' },
    workingHours: [
      { day: 'Lunes - Viernes', hours: weekdayHours },
      { day: 'Sábado', hours: 'Cerrado' },
      { day: 'Domingo', hours: 'Cerrado' },
    ],
    servicesOffered: [],
  };
}

const REVIEW_TARGETS = {
  companies: 'company',
  institutions: 'institution',
  procedures: 'procedure',
  itineraries: 'itinerary',
  professionals: 'professional',
} as const satisfies Record<string, ReviewTarget>;

async function isPremiumUser(uid: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { isPremium: true } });
  return !!user?.isPremium;
}

const jsonOpt = (v: unknown) => (v === undefined ? undefined : (v as Prisma.InputJsonValue));
const strOpt = (v: string | null | undefined) => (v === undefined ? undefined : v || null);
const dateOpt = (v: string | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);

function companyFields(d: Partial<CompanyFormData>) {
  return {
    name: d.name,
    logo: d.logo,
    category: d.category,
    description: d.description,
    products: jsonOpt(d.products),
    gallery: jsonOpt(d.gallery),
    ...(d.contact && {
      email: d.contact.email || null,
      website: d.contact.website || null,
      socialMedia: d.contact.socialMedia ? (d.contact.socialMedia as Prisma.InputJsonValue) : Prisma.DbNull,
    }),
    yearEstablished: d.yearEstablished === undefined ? undefined : Number(d.yearEstablished) || null,
    legalForm: d.legalForm,
    cif: d.cif,
    companySize: d.companySize,
    capitalOwnership: d.capitalOwnership,
    geographicScope: d.geographicScope,
    purpose: d.purpose,
    fiscalRegime: d.fiscalRegime,
  };
}

// Unowned listing created by an admin tool (bulk upload, Google Places import),
// to be claimed later by the real owner via ClaimButton/createClaim.
function unclaimedCompanyDefaults(name: string) {
  return {
    ownerId: null,
    name,
    legalForm: 'Empresa Individual',
    cif: 'N/A',
    logo: `https://placehold.co/100x100/CCCCCC/000000?text=${name.substring(0, 2).toUpperCase()}`,
    image: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
    products: [],
    highlights: [],
    documents: [],
    gallery: [],
    yearEstablished: new Date().getFullYear(),
  };
}

function professionalFields(data: ProfessionalFormData) {
  return {
    displayName: data.displayName,
    title: data.title,
    // photo is already a Storage URL (new upload, unchanged, or cleared to '').
    photo: data.photo || null,
    bio: data.bio,
    category: data.category,
    skills: data.skills.filter(s => s.trim()),
    services: data.services as unknown as Prisma.InputJsonValue,
    portfolio: data.portfolio || [],
    city: data.city,
    availability: AVAILABILITY_TO_DB[data.availability || 'Disponible'],
    phone: data.contact.phone || null,
    whatsapp: data.contact.whatsapp || null,
    email: data.contact.email || null,
    linkedin: data.contact.linkedin || null,
  };
}

function procedureFields(d: Partial<ProcedureFormData>) {
  return {
    name: d.name,
    category: d.category,
    description: d.description,
    institutionName: d.institution,
    institutionId: d.institutionId === undefined ? undefined : d.institutionId || null,
    requirements: jsonOpt(d.requirements),
    steps: jsonOpt(d.steps),
    cost: d.cost,
    documents: jsonOpt(d.documents),
  };
}

function jobFields(d: Partial<JobPostingFormData>) {
  return {
    title: d.title,
    description: d.description,
    sector: d.sector,
    city: d.city,
    employmentType: d.employmentType,
    salaryRange: strOpt(d.salaryRange),
    requirements: jsonOpt(d.requirements),
    responsibilities: jsonOpt(d.responsibilities),
    academicLevel: strOpt(d.academicLevel),
    experience: jsonOpt(d.experience),
    skills: jsonOpt(d.skills),
    applicationMethod: d.applicationMethod,
    applicationValue: d.applicationValue,
    applicationInstructions: strOpt(d.applicationInstructions),
    deadline: dateOpt(d.deadline),
  };
}

function healthFacilityFields(d: Partial<HealthFacilityFormData>) {
  return {
    type: d.type,
    name: d.name,
    ownership: d.ownership,
    description: d.description,
    services: jsonOpt(d.services),
    specialties: jsonOpt(d.specialties),
    emergencyServices: d.emergencyServices,
    whatsapp: d.contact === undefined ? undefined : d.contact.whatsapp || null,
    image: d.image,
  };
}

function eventFields(d: Partial<EventFormData>) {
  return {
    title: d.title,
    description: d.description,
    category: d.category,
    city: d.city,
    address: strOpt(d.address),
    startDate: d.startDate ? new Date(d.startDate) : undefined,
    endDate: dateOpt(d.endDate),
    registrationMethod: d.registrationMethod,
    registrationValue: strOpt(d.registrationValue),
  };
}

function touristLocationFields(d: Partial<TouristLocationFormData>) {
  return {
    name: d.name,
    description: d.description,
    category: d.category,
    ...(d.location && {
      address: d.location.address,
      city: d.location.city,
      lat: d.location.lat ?? null,
      lng: d.location.lng ?? null,
    }),
    image: d.image,
    gallery: jsonOpt(d.gallery),
    priceRange: strOpt(d.priceRange),
    openingHours: jsonOpt(d.openingHours),
    linkedCompanyId: d.linkedCompanyId === undefined ? undefined : d.linkedCompanyId || null,
  };
}

function newTouristLocationData(
  userId: string,
  d: TouristLocationFormData,
  status: 'pending' | 'approved',
): Prisma.TouristLocationUncheckedCreateInput {
  return {
    ...touristLocationFields(d),
    name: d.name,
    description: d.description,
    category: d.category,
    address: d.location.address,
    city: d.location.city,
    lat: d.location.lat ?? 0,
    lng: d.location.lng ?? 0,
    image: d.image || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
    gallery: d.gallery || [],
    openingHours: d.openingHours || [],
    status,
    submittedBy: userId,
  };
}

function itineraryFields(d: Partial<ItineraryFormData>) {
  return {
    title: d.title,
    description: d.description,
    coverImage: d.coverImage,
    city: d.city,
    durationDays: d.durationDays,
    theme: jsonOpt(d.theme),
    visibility: d.visibility,
  };
}

function itineraryStopRows(stops: ItineraryStopFormData[]): Prisma.ItineraryStopCreateManyItineraryInput[] {
  return stops.map(stop => ({
    id: stop.id || uuidv4(),
    locationId: stop.locationId,
    locationType: stop.locationType || 'place',
    order: stop.order,
    day: stop.day,
    suggestedTime: stop.suggestedTime || null,
    notes: stop.notes || null,
  }));
}

function institutionFields(d: InstitutionFormData) {
  return {
    name: d.name,
    description: d.description,
    category: d.category,
    responsiblePersonName: d.responsiblePerson?.name || null,
    responsiblePersonTitle: d.responsiblePerson?.title || null,
    email: d.contact.email || null,
    website: d.contact.website || null,
    whatsapp: d.contact.whatsapp || null,
  };
}

function menuItemFields(d: Partial<MenuItemFormData>) {
  return {
    name: d.name,
    description: d.description,
    price: d.price,
    image: strOpt(d.image),
    foodType: d.foodType,
    isMenuDelDia: d.isMenuDelDia,
    available: d.available,
    optionGroups: jsonOpt(d.optionGroups),
  };
}

// Slugs are unique in MySQL (Firestore allowed duplicates), so a repeated
// title gets a numeric suffix: "mi-post", "mi-post-2", ...
async function uniquePostSlug(title: string, excludeId?: string): Promise<string> {
  const base = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '').slice(0, 240) || 'post';
  let slug = base;
  for (let n = 2; ; n++) {
    const taken = await prisma.post.findFirst({
      where: { slug, ...(excludeId && { id: { not: excludeId } }) },
      select: { id: true },
    });
    if (!taken) return slug;
    slug = `${base}-${n}`;
  }
}

async function getSettingsCities(): Promise<string[]> {
  const row = await prisma.siteSettings.findUnique({ where: { id: 'main' }, select: { cities: true } });
  return (row?.cities as string[] | null) ?? [];
}

// Merge-writes the single settings row, creating it on first save.
async function saveSiteSettings(s: Partial<SiteSettings>) {
  const data = {
    siteName: s.siteName,
    siteSlogan: s.siteSlogan,
    logoUrl: s.logoUrl,
    cities: jsonOpt(s.cities),
    isBusinessAdvisorEnabled: s.isBusinessAdvisorEnabled,
    socialMedia: jsonOpt(s.socialMedia),
    foodDeliveryFees: jsonOpt(s.foodDeliveryFees),
  };
  await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: data,
    create: { ...data, siteName: s.siteName ?? 'Oltinde', siteSlogan: s.siteSlogan ?? '', cities: s.cities ?? [] },
  });
}

interface ProductFormData {
  id: string;
  name: string;
  description: string;
  image: string;
}

interface CompanyFormData {
  name: string;
  logo?: string; 
  category: string;
  description: string;
  products?: ProductFormData[];
  gallery?: string[];
  contact: {
    email: string;
    website?: string;
     socialMedia?: {
      linkedin?: string;
      facebook?: string;
      twitter?: string;
      instagram?: string;
      tiktok?: string;
      whatsapp?: string;
    }
  };
  yearEstablished: number;
  branches: BranchFormData[];
  legalForm: LegalForm;
  cif: string;
  companySize?: CompanySize;
  capitalOwnership?: CapitalOwnership;
  geographicScope?: GeographicScope;
  purpose?: CompanyPurpose;
  fiscalRegime?: FiscalRegime;
}

interface LocalBusinessFormData {
  name: string;
  logo?: string;
  category: string;
  description: string;
  gallery?: string[];
  contact: {
    email: string;
    website?: string;
  };
  branches: BranchFormData[];
}

interface CreateCompanyArgs {
    userId?: string | null;
    companyData: CompanyFormData;
}

interface CreateLocalBusinessArgs {
  userId?: string | null;
  businessData: LocalBusinessFormData;
}

interface UpdateCompanyArgs {
    companyId: string;
    companyData: CompanyFormData;
}

interface UpdateLocalBusinessArgs {
    businessId: string;
    businessData: LocalBusinessFormData;
}

export async function createCompany({ userId, companyData }: CreateCompanyArgs) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    let logoUrl = companyData.logo;
    if (!logoUrl) {
        logoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${companyData.name.substring(0, 2).toUpperCase()}`;
    }

    const branchesWithIds: Branch[] = companyData.branches.map(branch => ({
        ...branch,
        id: uuidv4(),
        location: { ...branch.location, lat: branch.location.lat ?? 0, lng: branch.location.lng ?? 0 },
        contact: { phone: branch.contact.phone || '', email: branch.contact.email || '' },
        workingHours: branch.workingHours || [
          { day: 'Lunes - Viernes', hours: '09:00 - 17:00' },
          { day: 'Sábado', hours: 'Cerrado' },
          { day: 'Domingo', hours: 'Cerrado' },
        ],
        servicesOffered: branch.servicesOffered || [],
    }));

    const company = await prisma.$transaction(async tx => {
      const created = await tx.company.create({
        data: {
          ...companyFields(companyData),
          name: companyData.name,
          category: companyData.category,
          description: companyData.description,
          // Only staff may create a listing for someone else (or unowned);
          // anyone else always becomes its owner.
          ownerId: isManagerRole(caller.role) ? userId || null : caller.uid,
          logo: logoUrl,
          products: (companyData.products || []) as unknown as Prisma.InputJsonValue,
          gallery: (companyData.gallery || []) as Prisma.InputJsonValue,
          highlights: [],
          documents: [],
          image: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
        },
      });
      await replaceBranches(tx, { companyId: created.id }, branchesWithIds);
      return created;
    });

    revalidatePath('/dashboard');
    revalidatePath('/admin/companies');
    revalidatePath('/companies');

    return { success: true, id: company.id };

  } catch (error) {
    console.error("Error creating company:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function createLocalBusiness({ userId, businessData }: CreateLocalBusinessArgs) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    let logoUrl = businessData.logo;
    if (!logoUrl) {
      logoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${businessData.name.substring(0, 2).toUpperCase()}`;
    }

    const branchesWithIds: Branch[] = businessData.branches.map(branch => ({
      ...branch,
      id: uuidv4(),
      location: { ...branch.location, lat: branch.location.lat ?? 0, lng: branch.location.lng ?? 0 },
      contact: { phone: branch.contact.phone || '', email: branch.contact.email || '' },
      workingHours: branch.workingHours || [],
      servicesOffered: branch.servicesOffered || [],
    }));

    // Local businesses live in the same companies table, minus the corporate fields.
    await prisma.$transaction(async tx => {
      const business = await tx.company.create({
        data: {
          ...companyFields(businessData),
          name: businessData.name,
          category: businessData.category,
          description: businessData.description,
          // Only staff may create a listing for someone else (or unowned);
          // anyone else always becomes its owner.
          ownerId: isManagerRole(caller.role) ? userId || null : caller.uid,
          logo: logoUrl,
          gallery: (businessData.gallery || []) as Prisma.InputJsonValue,
          products: [],
          highlights: [],
          documents: [],
          image: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
          legalForm: 'Empresa Individual',
          cif: 'N/A',
          yearEstablished: new Date().getFullYear(),
        },
      });
      await replaceBranches(tx, { companyId: business.id }, branchesWithIds);
    });

    revalidatePath('/dashboard');
    revalidatePath('/admin/companies');
    revalidatePath('/companies');

    return { success: true };
  } catch (error) {
    console.error("Error creating local business:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred while creating the business.' };
  }
}


export async function updateCompany({ companyId, companyData }: UpdateCompanyArgs) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const existing = await findCompany(companyId);
    if (!existing) {
      return { success: false, message: 'Empresa no encontrada.' };
    }
    if (!isManagerRole(caller.role) && existing.ownerId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para editar esta empresa.' };
    }

    const data = { ...companyFields(companyData), gallery: (companyData.gallery || []) as Prisma.InputJsonValue };

    // logo is already a Storage URL (new upload, or unchanged from initialData) —
    // only an explicitly-cleared logo needs a placeholder swap-in.
    if (companyData.logo === '') {
        data.logo = `https://placehold.co/100x100/CCCCCC/000000?text=${existing.name.substring(0, 2).toUpperCase()}`;
    }

    await prisma.$transaction(async tx => {
      await tx.company.update({ where: { id: companyId }, data });
      await replaceBranches(tx, { companyId }, reconcileBranches(existing.branches, companyData.branches));
    });

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/edit/${companyId}`);
    revalidatePath(`/companies/${companyId}`);
    revalidatePath('/companies');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error("Error updating company:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function setCompanyActive(companyId: string, isActive: boolean) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
    if (!company) {
      return { success: false, message: 'Empresa no encontrada.' };
    }

    if (!isManagerRole(caller.role) && company.ownerId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    await prisma.company.update({ where: { id: companyId }, data: { isActive } });

    revalidatePath('/dashboard');
    revalidatePath(`/companies/${companyId}`);
    revalidatePath('/companies');
    revalidatePath('/admin/companies');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error setting company active status:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

// Company-level premium (distinct from AppUser.isPremium, the account-wide
// "Cuenta Pro") — admin-only, unlike setCompanyActive which the owner can
// also flip themselves, since this is a paid upgrade the admin grants.
export async function setCompanyPremium(companyId: string, isPremium: boolean) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const { count } = await prisma.company.updateMany({ where: { id: companyId }, data: { isPremium } });
    if (count === 0) {
      return { success: false, message: 'Empresa no encontrada.' };
    }

    revalidatePath('/admin/companies');
    revalidatePath(`/companies/${companyId}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error setting company premium status:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function updateLocalBusiness({ businessId, businessData }: UpdateLocalBusinessArgs) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const existing = await findCompany(businessId);
    if (!existing) {
      return { success: false, message: 'Negocio no encontrado.' };
    }
    if (!isManagerRole(caller.role) && existing.ownerId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para editar este negocio.' };
    }

    const data = { ...companyFields(businessData), gallery: (businessData.gallery || []) as Prisma.InputJsonValue };

    // logo is already a Storage URL (new upload, or unchanged from initialData) —
    // only an explicitly-cleared logo needs a placeholder swap-in.
    if (businessData.logo === '') {
        data.logo = `https://placehold.co/100x100/CCCCCC/000000?text=${existing.name.substring(0, 2).toUpperCase()}`;
    }

    await prisma.$transaction(async tx => {
      await tx.company.update({ where: { id: businessId }, data });
      await replaceBranches(tx, { companyId: businessId }, reconcileBranches(existing.branches, businessData.branches));
    });

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/edit/${businessId}`);
    revalidatePath(`/companies/${businessId}`);
    revalidatePath('/companies');

    return { success: true };
  } catch (error) {
    console.error("Error updating business:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function addReview({
  entityId,
  entityType,
  reviewData,
  userId,
  authorName
}: {
  entityId: string;
  entityType: 'companies' | 'institutions' | 'procedures' | 'itineraries' | 'professionals';
  reviewData: { rating: number; comment: string };
  userId: string;
  authorName: string;
}) {
  if (!userId || !authorName) {
    return { success: false, message: "Debe iniciar sesión para dejar una reseña." };
  }
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: "Debe iniciar sesión para dejar una reseña." };
    }
    if (caller.uid !== userId) {
      return { success: false, message: 'No puede publicar una reseña en nombre de otro usuario.' };
    }

    await prisma.review.create({
      data: {
        targetType: REVIEW_TARGETS[entityType],
        targetId: entityId,
        author: authorName,
        authorId: userId,
        rating: Math.round(reviewData.rating),
        comment: reviewData.comment,
        date: new Date(),
      },
    });

    revalidatePath(`/${entityType}/${entityId}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding review:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

// Lets a company/professional owner (or manager/admin) publicly reply to a
// review on their own listing — like Google Business/Yelp owner responses.
// Only companies/professionals have a single-owner concept; institutions and
// procedures are staff-managed with no owner, and itineraries' author-reply
// is a different social pattern (comment thread, not business response) —
// both are deliberately out of scope here.
export async function addReviewReply({
  entityId,
  entityType,
  reviewId,
  replyComment,
}: {
  entityId: string;
  entityType: 'companies' | 'professionals';
  reviewId: string;
  replyComment: string;
}) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para responder a una reseña.' };
    }

    const entity = entityType === 'companies'
      ? await prisma.company.findUnique({ where: { id: entityId }, select: { ownerId: true, name: true } })
      : await prisma.professional.findUnique({ where: { id: entityId }, select: { ownerId: true, displayName: true } }).then(p => p && { ownerId: p.ownerId, name: p.displayName });
    if (!entity) {
      return { success: false, message: 'No encontrado.' };
    }

    if (!isManagerRole(caller.role) && entity.ownerId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para responder a esta reseña.' };
    }

    const review = await prisma.review.findFirst({
      where: { id: reviewId, targetType: REVIEW_TARGETS[entityType], targetId: entityId },
    });
    if (!review) {
      return { success: false, message: 'Reseña no encontrada.' };
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: { replyText: replyComment, replyDate: new Date() },
    });

    // Notify the reviewer, if we know who they are — legacy reviews (and
    // ones imported from Google) predate the authorId field.
    if (review.authorId) {
      await sendNotificationToUser(review.authorId, {
        message: `${entity.name} respondió a tu reseña.`,
        link: `/${entityType}/${entityId}`,
      });
    }

    revalidatePath(`/${entityType}/${entityId}`);

    return { success: true };
  } catch (error) {
    console.error('Error replying to review:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}


export async function deleteCompany(companyId: string, companyLogoUrl: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para eliminar esta empresa.' };
    }

    // Branches, offers, announcements, claims, jobs, menu and orders go with it (FK cascade).
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { targetType: 'company', targetId: companyId } }),
      prisma.company.delete({ where: { id: companyId } }),
    ]);
    revalidatePath('/dashboard');
    revalidatePath('/companies');
    return { success: true, message: 'Empresa eliminada con éxito.' };
  } catch (error) {
    console.error("Error deleting company:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function toggleCompanyVerification(companyId: string) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isManagerRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        const company = await prisma.company.findUnique({ where: { id: companyId }, select: { isVerified: true, ownerId: true, name: true } });
        if (!company) {
            throw new Error("Company not found");
        }

        const newStatus = !company.isVerified;
        await prisma.company.update({ where: { id: companyId }, data: { isVerified: newStatus } });

        // Send notification to owner if the company is being verified
        if (newStatus && company.ownerId) {
            await sendNotificationToUser(company.ownerId, {
                message: `¡Enhorabuena! Su empresa "${company.name}" ha sido verificada y ahora es pública.`,
                link: `/companies/${companyId}`,
            });
        }

        revalidatePath('/admin/companies');
        revalidatePath(`/companies/${companyId}`);
        revalidatePath('/companies');

        return { success: true, newState: newStatus };
    } catch (error) {
        console.error("Error toggling company verification:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function toggleCompanyFeaturedStatus(companyId: string) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isManagerRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        const company = await prisma.company.findUnique({ where: { id: companyId }, select: { isFeatured: true } });
        if (!company) {
            throw new Error("Company not found");
        }

        await prisma.company.update({ where: { id: companyId }, data: { isFeatured: !company.isFeatured } });

        revalidatePath('/admin/companies');
        revalidatePath('/companies');
        revalidatePath('/');

        return { success: true, newState: !company.isFeatured };
    } catch (error) {
        console.error("Error toggling company featured status:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}


interface ProfessionalServiceFormData {
  id: string;
  name: string;
  description?: string;
  price?: string;
}

interface ProfessionalFormData {
  displayName: string;
  title: string;
  photo?: string;
  bio: string;
  category: string;
  skills: string[];
  services: ProfessionalServiceFormData[];
  portfolio?: string[];
  city: string;
  availability?: ProfessionalAvailability;
  contact: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    linkedin?: string;
  };
}

export async function createProfessionalProfile({ userId, data }: { userId: string; data: ProfessionalFormData }) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || caller.uid !== userId) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const existing = await prisma.professional.findFirst({ where: { ownerId: userId }, select: { id: true } });
    if (existing) {
      return { success: false, message: 'Ya tiene un perfil de profesional.' };
    }

    await prisma.professional.create({
      data: { ...professionalFields(data), ownerId: userId },
    });

    revalidatePath('/dashboard/professional');
    revalidatePath('/admin/professionals');
    revalidatePath('/professionals');

    return { success: true };
  } catch (error) {
    console.error("Error creating professional profile:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function updateProfessionalProfile({ professionalId, data }: { professionalId: string; data: ProfessionalFormData }) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const professional = await prisma.professional.findUnique({ where: { id: professionalId }, select: { ownerId: true } });
    if (!professional) {
      return { success: false, message: 'Perfil no encontrado.' };
    }
    if (!isManagerRole(caller.role) && professional.ownerId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para editar este perfil.' };
    }

    await prisma.professional.update({ where: { id: professionalId }, data: professionalFields(data) });

    revalidatePath('/dashboard/professional');
    revalidatePath(`/professionals/${professionalId}`);
    revalidatePath('/professionals');

    return { success: true };
  } catch (error) {
    console.error("Error updating professional profile:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteProfessionalProfile(professionalId: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const professional = await prisma.professional.findUnique({ where: { id: professionalId }, select: { ownerId: true } });
    if (professional && !isManagerRole(caller.role) && professional.ownerId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para eliminar este perfil.' };
    }

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { targetType: 'professional', targetId: professionalId } }),
      prisma.professional.deleteMany({ where: { id: professionalId } }),
    ]);
    revalidatePath('/dashboard/professional');
    revalidatePath('/professionals');
    return { success: true, message: 'Perfil eliminado con éxito.' };
  } catch (error) {
    console.error("Error deleting professional profile:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function toggleProfessionalVerification(professionalId: string) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isManagerRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        const professional = await prisma.professional.findUnique({
            where: { id: professionalId },
            select: { isVerified: true, ownerId: true, displayName: true },
        });
        if (!professional) {
            throw new Error("Professional not found");
        }

        const newStatus = !professional.isVerified;
        await prisma.professional.update({ where: { id: professionalId }, data: { isVerified: newStatus } });

        if (newStatus && professional.ownerId) {
            await sendNotificationToUser(professional.ownerId, {
                message: `¡Enhorabuena! Su perfil profesional "${professional.displayName}" ha sido verificado y ahora es público.`,
                link: `/professionals/${professionalId}`,
            });
        }

        revalidatePath('/admin/professionals');
        revalidatePath(`/professionals/${professionalId}`);
        revalidatePath('/professionals');

        return { success: true, newState: newStatus };
    } catch (error) {
        console.error("Error toggling professional verification:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'manager' | 'editor' | 'pharmacist' | 'user') {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isAdminRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        const { count } = await prisma.user.updateMany({ where: { id: userId }, data: { role: newRole } });
        if (count === 0) {
            throw new Error("User not found");
        }

        revalidatePath('/admin/users');

        return { success: true };
    } catch (error) {
        console.error("Error updating user role:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function toggleUserPremiumStatus(userId: string) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isAdminRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } });
        if (!user) {
            throw new Error("User not found");
        }

        const newStatus = !user.isPremium;
        await prisma.user.update({ where: { id: userId }, data: { isPremium: newStatus } });

        revalidatePath('/admin/users');
        revalidatePath('/dashboard');

        return { success: true, newState: newStatus };
    } catch (error) {
        console.error("Error toggling user premium status:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}

// Deactivating a user blocks them from signing in again (Firebase Auth's own
// `disabled` flag — signInWithEmailAndPassword/signInWithPopup reject a
// disabled account with auth/user-disabled) and hides their public content
// (professional profile, published posts) via the mirrored Firestore flag,
// since the client can't query Auth's disabled flag directly.
export async function setUserActive(userId: string, isActive: boolean) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isAdminRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }
        if (caller.uid === userId) {
            return { success: false, message: 'No puede desactivar su propia cuenta.' };
        }

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!user) {
            return { success: false, message: 'Usuario no encontrado.' };
        }

        await getAdminAuth().updateUser(userId, { disabled: !isActive });
        await prisma.user.update({ where: { id: userId }, data: { isActive } });

        revalidatePath('/admin/users');
        revalidatePath('/professionals');
        revalidatePath('/contribuciones');

        return { success: true };
    } catch (error) {
        console.error('Error setting user active status:', error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}


interface UserFormData {
  displayName: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'manager' | 'editor';
}

export async function createUser(userData: UserFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isAdminRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const existing = await prisma.user.findUnique({ where: { email: userData.email }, select: { id: true } });
    if (existing) {
      return { success: false, message: 'Este correo electrónico ya está en uso.' };
    }

    await prisma.user.create({
      data: {
        displayName: userData.displayName,
        email: userData.email,
        role: userData.role,
        isPremium: false,
        createdAt: new Date(),
      },
    });

    revalidatePath('/admin/users');

    return { success: true, message: 'User record created. Auth user must be created manually in Firebase Console.' };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function isFirstUser(): Promise<boolean> {
    return (await prisma.user.count()) === 0;
}

export async function signupUser(email: string, password: string, displayName: string, uid?: string) {
    const firstUser = await isFirstUser();
    const newRole = firstUser ? 'admin' : 'user';

    const userId = uid || uuidv4(); // Use provided UID or generate a new one

    // upsert rather than create: a retried sign-up must not fail on the
    // existing row, nor reset the role an admin may have given it since.
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        displayName,
        email,
        role: newRole,
        isPremium: firstUser, // First user is premium by default
        createdAt: new Date(),
        notificationSettings: {
          email: {
            newOffers: true,
            newAnnouncements: true,
            newJobs: true,
            newEvents: true,
          },
        },
      },
    });

    return { success: true, role: newRole, message: "User created" };
}

export async function updateUserProfile(userId: string, data: { displayName?: string; title?: string; socials?: { linkedin?: string; twitter?: string } }) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || (caller.uid !== userId && !isAdminRole(caller.role))) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        title: data.title || null,
        linkedin: data.socials?.linkedin || null,
        twitter: data.socials?.twitter || null,
      },
    });
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}


interface AnnouncementData {
    title: string;
    content: string;
    image?: string;
}

export async function addAnnouncement(companyId: string, announcementData: AnnouncementData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, category: true, ownerId: true } });
    if (!company) {
      throw new Error('Company not found');
    }

    if (!isManagerRole(caller.role) && company.ownerId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const newAnnouncement = toAnnouncement(await prisma.companyAnnouncement.create({
      data: {
        companyId,
        title: announcementData.title,
        content: announcementData.content,
        image: announcementData.image || null,
      },
    }));

    await createNotificationsForSubscribers(
      company,
      { title: newAnnouncement.title, link: `/announcements/${newAnnouncement.id}` },
      'announcement'
    );

    revalidatePath(`/companies/${companyId}`);
    revalidatePath(`/dashboard/${companyId}/announcements`);
    revalidatePath('/announcements');

    return { success: true, newAnnouncement };
  } catch (error) {
    console.error("Error adding announcement:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteAnnouncement(companyId: string, announcementId: string) {
    try {
        const caller = await getCurrentCaller();
        if (!caller) {
            return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
        }

        const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
        if (!company) {
            throw new Error("Company not found");
        }

        if (!isManagerRole(caller.role) && company.ownerId !== caller.uid) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        const { count } = await prisma.companyAnnouncement.deleteMany({ where: { id: announcementId, companyId } });
        if (count === 0) {
            throw new Error("Announcement not found in company list");
        }

        revalidatePath(`/companies/${companyId}`);
        revalidatePath(`/dashboard/${companyId}/announcements`);
        revalidatePath('/announcements');

        return { success: true };
    } catch (error) {
        console.error("Error deleting announcement:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function deleteOffer(companyId: string, offerId: string) {
    try {
        const caller = await getCurrentCaller();
        if (!caller) {
            return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
        }

        const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
        if (!company) {
            throw new Error("Company not found");
        }

        if (!isManagerRole(caller.role) && company.ownerId !== caller.uid) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        const { count } = await prisma.companyOffer.deleteMany({ where: { id: offerId, companyId } });
        if (count === 0) {
            throw new Error("Offer not found in company list");
        }

        revalidatePath(`/companies/${companyId}`);
        revalidatePath(`/dashboard/${companyId}/offers`);
        revalidatePath('/offers');

        return { success: true };
    } catch (error) {
        console.error("Error deleting offer:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}


interface OfferData {
    title: string;
    description: string;
    discount: string;
    validUntil: string;
    image?: string;
}

export async function addOffer(companyId: string, offerData: OfferData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, category: true, ownerId: true } });
    if (!company) {
      throw new Error('Company not found');
    }

    if (!isManagerRole(caller.role) && company.ownerId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const newOffer = toOffer(await prisma.companyOffer.create({
      data: {
        companyId,
        title: offerData.title,
        description: offerData.description,
        discount: offerData.discount,
        validUntil: offerData.validUntil ? new Date(offerData.validUntil) : null,
        image: offerData.image || null,
      },
    }));

    await createNotificationsForSubscribers(
      company,
      { title: newOffer.title, link: `/offers/${newOffer.id}` },
      'offer'
    );

    revalidatePath(`/companies/${companyId}`);
    revalidatePath(`/dashboard/${companyId}/offers`);
    revalidatePath('/offers');

    return { success: true, newOffer };
  } catch (error) {
    console.error("Error adding offer:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

type ProcedureFormData = Omit<Procedure, 'id' | 'reviews'>;

export async function createProcedure(procedureData: ProcedureFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isEditorRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    await prisma.procedure.create({
      data: {
        ...procedureFields(procedureData),
        name: procedureData.name,
        category: procedureData.category,
        description: procedureData.description,
        institutionName: procedureData.institution || '',
        cost: procedureData.cost || '',
        requirements: (procedureData.requirements || []) as Prisma.InputJsonValue,
        steps: (procedureData.steps || []) as Prisma.InputJsonValue,
        documents: (procedureData.documents || []) as Prisma.InputJsonValue,
      },
    });
    revalidatePath('/admin/procedures');
    revalidatePath('/procedures');
    return { success: true };
  } catch (error) {
    console.error("Error creating procedure:", error);
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function updateProcedure(procedureId: string, procedureData: ProcedureFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isEditorRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    await prisma.procedure.update({ where: { id: procedureId }, data: procedureFields(procedureData) });
    revalidatePath('/admin/procedures');
    revalidatePath(`/procedures/${procedureId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating procedure:", error);
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteProcedure(procedureId: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isEditorRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { targetType: 'procedure', targetId: procedureId } }),
      prisma.procedure.delete({ where: { id: procedureId } }),
    ]);
    revalidatePath('/admin/procedures');
    revalidatePath('/procedures');
    return { success: true };
  } catch (error) {
    console.error("Error deleting procedure:", error);
    return { success: false, message: 'An unknown error occurred.' };
  }
}

interface JobPostingFormData {
  title: string;
  description: string;
  sector: string;
  city: string;
  employmentType: EmploymentType;
  salaryRange?: string;
  requirements: string[];
  responsibilities?: string[];
  academicLevel?: AcademicLevel;
  experience?: string[];
  skills?: string[];
  applicationMethod: 'email' | 'link';
  applicationValue: string;
  applicationInstructions?: string;
  deadline?: string;
}

export async function createJobPosting(companyId: string, userId: string, jobData: JobPostingFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, category: true, logo: true, ownerId: true } });
    if (!company) {
      throw new Error('Company not found');
    }

    if (company.ownerId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para publicar empleos en nombre de esta empresa.' };
    }

    if (!(await isPremiumUser(caller.uid))) {
      return { success: false, message: 'Publicar empleos es una función exclusiva para cuentas premium. Actualice su cuenta para continuar.' };
    }

    const newJob = await prisma.jobPosting.create({
      data: {
        ...jobFields(jobData),
        title: jobData.title,
        description: jobData.description,
        sector: jobData.sector,
        city: jobData.city,
        employmentType: jobData.employmentType,
        applicationMethod: jobData.applicationMethod,
        applicationValue: jobData.applicationValue,
        requirements: (jobData.requirements || []) as Prisma.InputJsonValue,
        responsibilities: (jobData.responsibilities || []) as Prisma.InputJsonValue,
        experience: (jobData.experience || []) as Prisma.InputJsonValue,
        skills: (jobData.skills || []) as Prisma.InputJsonValue,
        companyId,
        companyName: company.name,
        companyLogo: company.logo,
        ownerId: company.ownerId ?? caller.uid,
        status: 'open',
      },
    });

    await createNotificationsForSubscribers(
      company,
      { title: newJob.title, link: `/jobs/${newJob.id}` },
      'job'
    );

    revalidatePath(`/dashboard/companies/${companyId}/jobs`);
    revalidatePath('/jobs');
    return { success: true, id: newJob.id };
  } catch (error) {
    console.error('Error creating job posting:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function updateJobPosting(jobId: string, userId: string, jobData: Partial<JobPostingFormData>) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const job = await prisma.jobPosting.findUnique({ where: { id: jobId }, select: { ownerId: true, companyId: true } });
    if (!job) {
      throw new Error('Job posting not found');
    }

    if (job.ownerId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para editar esta publicación.' };
    }

    await prisma.jobPosting.update({ where: { id: jobId }, data: jobFields(jobData) });
    revalidatePath(`/dashboard/companies/${job.companyId}/jobs`);
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath('/jobs');
    return { success: true };
  } catch (error) {
    console.error('Error updating job posting:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteJobPosting(jobId: string, userId: string, isAdmin = false) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const job = await prisma.jobPosting.findUnique({ where: { id: jobId }, select: { ownerId: true, companyId: true } });
    if (!job) {
      throw new Error('Job posting not found');
    }

    if (job.ownerId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para eliminar esta publicación.' };
    }

    await prisma.jobPosting.delete({ where: { id: jobId } });
    revalidatePath(`/dashboard/companies/${job.companyId}/jobs`);
    revalidatePath('/jobs');
    revalidatePath('/admin/jobs');
    return { success: true };
  } catch (error) {
    console.error('Error deleting job posting:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function toggleJobStatus(jobId: string, userId: string, isAdmin = false) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const job = await prisma.jobPosting.findUnique({ where: { id: jobId }, select: { ownerId: true, companyId: true, status: true } });
    if (!job) {
      throw new Error('Job posting not found');
    }

    if (job.ownerId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para modificar esta publicación.' };
    }

    const newStatus: 'open' | 'closed' = job.status === 'open' ? 'closed' : 'open';
    await prisma.jobPosting.update({ where: { id: jobId }, data: { status: newStatus } });

    revalidatePath(`/dashboard/companies/${job.companyId}/jobs`);
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath('/jobs');
    revalidatePath('/admin/jobs');
    return { success: true, status: newStatus };
  } catch (error) {
    console.error('Error toggling job status:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function incrementJobApplicationClicks(jobId: string) {
  try {
    await prisma.jobPosting.update({ where: { id: jobId }, data: { applicationClickCount: { increment: 1 } } });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing job application clicks:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

// HEALTH FACILITY ACTIONS

interface HealthFacilityFormData {
  type: HealthFacilityType;
  name: string;
  ownership: HealthFacilityOwnership;
  description: string;
  services: string[];
  specialties?: string[];
  emergencyServices?: boolean;
  contact?: { whatsapp?: string };
  branches: BranchFormData[];
  image?: string;
}

export async function createHealthFacility(facilityData: HealthFacilityFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isPharmacistRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const facility = await prisma.$transaction(async tx => {
      const created = await tx.healthFacility.create({
        data: {
          ...healthFacilityFields(facilityData),
          type: facilityData.type,
          name: facilityData.name,
          ownership: facilityData.ownership,
          description: facilityData.description,
          services: (facilityData.services || []) as Prisma.InputJsonValue,
          specialties: (facilityData.specialties || []) as Prisma.InputJsonValue,
          image: facilityData.image || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
        },
      });
      await replaceBranches(tx, { healthFacilityId: created.id }, reconcileBranches(undefined, facilityData.branches));
      return created;
    });

    revalidatePath('/health');
    revalidatePath('/admin/health');

    return { success: true, id: facility.id };
  } catch (error) {
    console.error('Error creating health facility:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function updateHealthFacility(facilityId: string, facilityData: Partial<HealthFacilityFormData>) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isPharmacistRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const existingBranches = facilityData.branches
      ? (await findHealthFacilities({ where: { id: facilityId } }))[0]?.branches
      : undefined;

    await prisma.$transaction(async tx => {
      await tx.healthFacility.update({ where: { id: facilityId }, data: healthFacilityFields(facilityData) });
      if (facilityData.branches) {
        await replaceBranches(tx, { healthFacilityId: facilityId }, reconcileBranches(existingBranches, facilityData.branches));
      }
    });

    revalidatePath('/health');
    revalidatePath('/admin/health');
    revalidatePath(`/health/hospitals/${facilityId}`);
    revalidatePath(`/health/clinics/${facilityId}`);
    revalidatePath(`/health/pharmacies/${facilityId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating health facility:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteHealthFacility(facilityId: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isPharmacistRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    await prisma.healthFacility.delete({ where: { id: facilityId } });

    revalidatePath('/health');
    revalidatePath('/admin/health');

    return { success: true };
  } catch (error) {
    console.error('Error deleting health facility:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function toggleHealthFacilityFeatured(facilityId: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isPharmacistRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const facility = await prisma.healthFacility.findUnique({ where: { id: facilityId }, select: { isFeatured: true } });
    if (!facility) {
      throw new Error('Health facility not found');
    }
    await prisma.healthFacility.update({ where: { id: facilityId }, data: { isFeatured: !facility.isFeatured } });

    revalidatePath('/health');
    revalidatePath('/admin/health');

    return { success: true, newState: !facility.isFeatured };
  } catch (error) {
    console.error('Error toggling health facility featured status:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

// Monthly bulk upload: each row assigns one pharmacy to on-duty ("de guardia")
// for one date. For every pharmacy touched by the upload, existing on-duty
// dates in the same calendar months as the new rows are replaced (so
// re-uploading a corrected schedule doesn't leave stale duplicate days),
// while dates in other months are left untouched.
export async function bulkSetPharmacyDuty(rows: { pharmacyName: string; date: string }[]) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isPharmacistRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    if (rows.length === 0) {
      return { success: false, message: 'El archivo no contiene filas válidas.' };
    }

    const pharmacies = await prisma.healthFacility.findMany({ where: { type: 'pharmacy' }, select: { id: true, name: true } });

    const datesByPharmacyId = new Map<string, Set<string>>();
    const unmatched = new Set<string>();

    for (const row of rows) {
      const key = row.pharmacyName.trim().toLowerCase();
      const match = pharmacies.find(p => p.name.trim().toLowerCase() === key);
      if (!match) {
        unmatched.add(row.pharmacyName);
        continue;
      }
      if (!datesByPharmacyId.has(match.id)) {
        datesByPharmacyId.set(match.id, new Set());
      }
      datesByPharmacyId.get(match.id)!.add(row.date);
    }

    if (datesByPharmacyId.size === 0) {
      return { success: false, message: `No se encontró ninguna farmacia que coincida con los nombres del archivo: ${Array.from(unmatched).join(', ')}.` };
    }

    // For each pharmacy, the months present in the upload are replaced wholesale;
    // other months are left untouched.
    await prisma.$transaction(async tx => {
      for (const [facilityId, newDatesSet] of datesByPharmacyId.entries()) {
        const newDates = Array.from(newDatesSet);
        const months = Array.from(new Set(newDates.map(d => d.slice(0, 7))));
        await tx.pharmacyDutyDate.deleteMany({
          where: {
            facilityId,
            OR: months.map(m => {
              const start = new Date(`${m}-01T00:00:00Z`);
              const end = new Date(start);
              end.setUTCMonth(end.getUTCMonth() + 1);
              return { date: { gte: start, lt: end } };
            }),
          },
        });
        await tx.pharmacyDutyDate.createMany({
          data: newDates.map(d => ({ facilityId, date: new Date(`${d}T00:00:00Z`) })),
          skipDuplicates: true,
        });
      }
    });

    revalidatePath('/health/pharmacies');
    revalidatePath('/health');
    revalidatePath('/admin/health');
    revalidatePath('/admin/health/pharmacies-on-duty');

    const updatedCount = datesByPharmacyId.size;
    const message = unmatched.size > 0
      ? `Se actualizaron ${updatedCount} farmacia${updatedCount === 1 ? '' : 's'}. No se encontraron coincidencias para: ${Array.from(unmatched).join(', ')}.`
      : `Se actualizaron ${updatedCount} farmacia${updatedCount === 1 ? '' : 's'} correctamente.`;

    return { success: true, count: updatedCount, unmatched: Array.from(unmatched), message };
  } catch (error) {
    console.error('Error bulk setting pharmacy duty:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

interface EventFormData {
  title: string;
  description: string;
  category: string;
  city: string;
  address?: string;
  startDate: string;
  endDate?: string;
  registrationMethod: EventRegistrationMethod;
  registrationValue?: string;
}

export async function createEvent(
  organizerType: EventOrganizerType,
  organizerId: string,
  userId: string | null,
  isAdmin: boolean,
  eventData: EventFormData
) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    if (organizerType === 'institution' && !isAdminRole(caller.role)) {
      return { success: false, message: 'Solo los administradores pueden crear eventos institucionales.' };
    }

    const select = { id: true, name: true, logo: true, category: true } as const;
    const organizer = organizerType === 'company'
      ? await prisma.company.findUnique({ where: { id: organizerId }, select: { ...select, ownerId: true } })
      : await prisma.institution.findUnique({ where: { id: organizerId }, select });
    if (!organizer) {
      return { success: false, message: 'No se encontró la entidad organizadora.' };
    }
    const ownerId: string | null = 'ownerId' in organizer ? (organizer.ownerId as string | null) : null;

    if (organizerType === 'company' && !isManagerRole(caller.role)) {
      if (ownerId !== caller.uid) {
        return { success: false, message: 'No tiene permiso para publicar eventos en nombre de esta empresa.' };
      }
      if (!(await isPremiumUser(caller.uid))) {
        return { success: false, message: 'Publicar eventos es una función exclusiva para cuentas premium. Actualice su cuenta para continuar.' };
      }
    }

    const newEvent = await prisma.event.create({
      data: {
        ...eventFields(eventData),
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        city: eventData.city,
        startDate: new Date(eventData.startDate),
        registrationMethod: eventData.registrationMethod,
        organizerType,
        organizerId,
        organizerName: organizer.name,
        organizerLogo: organizer.logo,
        ownerId,
        status: 'scheduled',
      },
    });

    await createNotificationsForSubscribers(
      organizer,
      { title: newEvent.title, link: `/events/${newEvent.id}` },
      'event'
    );

    revalidatePath('/events');
    if (organizerType === 'company') revalidatePath(`/dashboard/companies/${organizerId}/events`);
    revalidatePath('/admin/events');
    return { success: true, id: newEvent.id };
  } catch (error) {
    console.error('Error creating event:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function updateEvent(eventId: string, userId: string | null, isAdmin: boolean, eventData: Partial<EventFormData>) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { ownerId: true, organizerType: true, organizerId: true } });
    if (!event) {
      throw new Error('Event not found');
    }

    const canEdit = isManagerRole(caller.role) || (!!event.ownerId && event.ownerId === caller.uid);
    if (!canEdit) {
      return { success: false, message: 'No tiene permiso para editar este evento.' };
    }

    await prisma.event.update({ where: { id: eventId }, data: eventFields(eventData) });
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/events');
    if (event.organizerType === 'company') revalidatePath(`/dashboard/companies/${event.organizerId}/events`);
    revalidatePath('/admin/events');
    return { success: true };
  } catch (error) {
    console.error('Error updating event:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteEvent(eventId: string, userId: string | null, isAdmin = false) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { ownerId: true, organizerType: true, organizerId: true } });
    if (!event) {
      throw new Error('Event not found');
    }

    const canDelete = isManagerRole(caller.role) || (!!event.ownerId && event.ownerId === caller.uid);
    if (!canDelete) {
      return { success: false, message: 'No tiene permiso para eliminar este evento.' };
    }

    await prisma.event.delete({ where: { id: eventId } });
    revalidatePath('/events');
    if (event.organizerType === 'company') revalidatePath(`/dashboard/companies/${event.organizerId}/events`);
    revalidatePath('/admin/events');
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function toggleEventStatus(eventId: string, userId: string | null, isAdmin = false) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { ownerId: true, organizerType: true, organizerId: true, status: true } });
    if (!event) {
      throw new Error('Event not found');
    }

    const canToggle = isManagerRole(caller.role) || (!!event.ownerId && event.ownerId === caller.uid);
    if (!canToggle) {
      return { success: false, message: 'No tiene permiso para modificar este evento.' };
    }

    const newStatus: 'scheduled' | 'cancelled' = event.status === 'scheduled' ? 'cancelled' : 'scheduled';
    await prisma.event.update({ where: { id: eventId }, data: { status: newStatus } });

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/events');
    if (event.organizerType === 'company') revalidatePath(`/dashboard/companies/${event.organizerId}/events`);
    revalidatePath('/admin/events');
    return { success: true, status: newStatus };
  } catch (error) {
    console.error('Error toggling event status:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

// TOURIST LOCATION ACTIONS

interface TouristLocationFormData {
  name: string;
  description: string;
  category: string;
  location: {
    address: string;
    city: string;
    lat?: number;
    lng?: number;
  };
  image?: string;
  gallery?: string[];
  priceRange?: TouristLocationPriceRange;
  openingHours?: { day: string; hours: string }[];
  linkedCompanyId?: string | null;
}

export async function submitTouristLocation(userId: string, locationData: TouristLocationFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para sugerir un lugar.' };
    }

    const newLocation = await prisma.touristLocation.create({
      data: newTouristLocationData(caller.uid, locationData, 'pending'),
    });

    revalidatePath('/admin/places');

    return { success: true, id: newLocation.id };
  } catch (error) {
    console.error('Error submitting tourist location:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function createTouristLocationAsAdmin(userId: string, isAdmin: boolean, locationData: TouristLocationFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para publicar lugares directamente.' };
    }

    const newLocation = await prisma.touristLocation.create({
      data: newTouristLocationData(userId, locationData, 'approved'),
    });

    revalidatePath('/places');
    revalidatePath('/admin/places');

    return { success: true, id: newLocation.id };
  } catch (error) {
    console.error('Error creating tourist location as admin:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function reviewTouristLocation(locationId: string, userId: string, isAdmin: boolean, decision: 'approved' | 'rejected') {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para moderar lugares turísticos.' };
    }
    await prisma.touristLocation.update({ where: { id: locationId }, data: { status: decision } });

    revalidatePath('/places');
    revalidatePath('/admin/places');
    revalidatePath(`/places/${locationId}`);

    return { success: true, status: decision };
  } catch (error) {
    console.error('Error reviewing tourist location:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function updateTouristLocation(locationId: string, userId: string, isAdmin: boolean, locationData: Partial<TouristLocationFormData>) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para editar este lugar.' };
    }
    await prisma.touristLocation.update({ where: { id: locationId }, data: touristLocationFields(locationData) });

    revalidatePath('/places');
    revalidatePath(`/places/${locationId}`);
    revalidatePath('/admin/places');

    return { success: true };
  } catch (error) {
    console.error('Error updating tourist location:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteTouristLocation(locationId: string, userId: string, isAdmin: boolean) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para eliminar este lugar.' };
    }
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { targetType: 'touristLocation', targetId: locationId } }),
      prisma.touristLocation.delete({ where: { id: locationId } }),
    ]);

    revalidatePath('/places');
    revalidatePath('/admin/places');

    return { success: true };
  } catch (error) {
    console.error('Error deleting tourist location:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function toggleTouristLocationFeatured(locationId: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const location = await prisma.touristLocation.findUnique({ where: { id: locationId }, select: { isFeatured: true } });
    if (!location) {
      throw new Error('Tourist location not found');
    }
    await prisma.touristLocation.update({ where: { id: locationId }, data: { isFeatured: !location.isFeatured } });

    revalidatePath('/admin/places');
    revalidatePath('/places');

    return { success: true, newState: !location.isFeatured };
  } catch (error) {
    console.error('Error toggling tourist location featured status:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

// ITINERARY ACTIONS

interface ItineraryStopFormData {
  id?: string;
  locationId: string;
  locationType?: ItineraryStopLocationType;
  order: number;
  day: number;
  suggestedTime?: string;
  notes?: string;
}

interface ItineraryFormData {
  title: string;
  description: string;
  coverImage?: string;
  city: string;
  durationDays: number;
  theme?: string[];
  visibility: ItineraryVisibility;
  stops: ItineraryStopFormData[];
}

export async function createItinerary(userId: string, authorName: string, itineraryData: ItineraryFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para crear un itinerario.' };
    }

    const newItinerary = await prisma.itinerary.create({
      data: {
        ...itineraryFields(itineraryData),
        title: itineraryData.title,
        description: itineraryData.description,
        city: itineraryData.city,
        durationDays: itineraryData.durationDays,
        visibility: itineraryData.visibility,
        coverImage: itineraryData.coverImage || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
        theme: (itineraryData.theme || []) as Prisma.InputJsonValue,
        authorId: caller.uid,
        authorName,
        stops: { createMany: { data: itineraryStopRows(itineraryData.stops) } },
      },
    });

    revalidatePath('/itineraries');
    revalidatePath('/dashboard/itineraries');

    return { success: true, id: newItinerary.id };
  } catch (error) {
    console.error('Error creating itinerary:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function updateItinerary(itineraryId: string, userId: string, isAdmin: boolean, itineraryData: Partial<ItineraryFormData>) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const itinerary = await prisma.itinerary.findUnique({ where: { id: itineraryId }, select: { authorId: true } });
    if (!itinerary) {
      throw new Error('Itinerary not found');
    }

    if (itinerary.authorId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para editar este itinerario.' };
    }

    await prisma.$transaction(async tx => {
      await tx.itinerary.update({ where: { id: itineraryId }, data: itineraryFields(itineraryData) });
      if (itineraryData.stops) {
        await tx.itineraryStop.deleteMany({ where: { itineraryId } });
        await tx.itineraryStop.createMany({
          data: itineraryStopRows(itineraryData.stops).map(s => ({ ...s, itineraryId })),
        });
      }
    });

    revalidatePath(`/itineraries/${itineraryId}`);
    revalidatePath('/itineraries');
    revalidatePath('/dashboard/itineraries');

    return { success: true };
  } catch (error) {
    console.error('Error updating itinerary:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteItinerary(itineraryId: string, userId: string, isAdmin = false) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const itinerary = await prisma.itinerary.findUnique({ where: { id: itineraryId }, select: { authorId: true } });
    if (!itinerary) {
      throw new Error('Itinerary not found');
    }

    if (itinerary.authorId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para eliminar este itinerario.' };
    }

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { targetType: 'itinerary', targetId: itineraryId } }),
      prisma.itinerary.delete({ where: { id: itineraryId } }),
    ]);

    revalidatePath('/itineraries');
    revalidatePath('/dashboard/itineraries');
    revalidatePath('/admin/itineraries');

    return { success: true };
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function toggleItineraryFeatured(itineraryId: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const itinerary = await prisma.itinerary.findUnique({ where: { id: itineraryId }, select: { isFeatured: true } });
    if (!itinerary) {
      throw new Error('Itinerary not found');
    }
    await prisma.itinerary.update({ where: { id: itineraryId }, data: { isFeatured: !itinerary.isFeatured } });

    revalidatePath('/admin/itineraries');
    revalidatePath('/itineraries');

    return { success: true, newState: !itinerary.isFeatured };
  } catch (error) {
    console.error('Error toggling itinerary featured status:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

type ServiceFormData = Omit<Service, 'id'>;

export async function createService(serviceData: ServiceFormData) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isManagerRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        await prisma.service.create({
            data: { name: serviceData.name, description: serviceData.description, category: serviceData.category },
        });
        revalidatePath('/admin/services');
        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        console.error("Error creating service:", error);
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function updateService(serviceId: string, serviceData: ServiceFormData) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isManagerRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        await prisma.service.update({
            where: { id: serviceId },
            data: { name: serviceData.name, description: serviceData.description, category: serviceData.category },
        });
        revalidatePath('/admin/services');
        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        console.error("Error updating service:", error);
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function deleteService(serviceId: string) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isManagerRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        await prisma.service.delete({ where: { id: serviceId } });
        revalidatePath('/admin/services');
        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        console.error("Error deleting service:", error);
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function bulkCreateServices(services: ServiceFormData[]) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isManagerRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        await prisma.service.createMany({
            data: services.map(s => ({ id: uuidv4(), name: s.name, description: s.description, category: s.category })),
        });

        revalidatePath('/admin/services');
        revalidatePath('/services');
        return { success: true, count: services.length };
    } catch (error) {
        console.error("Error bulk creating services:", error);
        return { success: false, message: 'An unknown error occurred during bulk upload.' };
    }
}

interface InstitutionFormData {
  name: string;
  logo?: string;
  description: string;
  category: string;
  responsiblePerson?: { name?: string; title?: string };
  contact: { email: string; website?: string; whatsapp?: string };
  branches: BranchFormData[];
}

export async function createInstitution(institutionData: InstitutionFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isEditorRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    let logoUrl = institutionData.logo;
    if (!logoUrl) {
       logoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${institutionData.name.substring(0, 2).toUpperCase()}`;
    }

    const branchesWithIds: Branch[] = institutionData.branches.map(branch => ({
        ...branch,
        id: uuidv4(),
        location: { ...branch.location, lat: branch.location.lat ?? 0, lng: branch.location.lng ?? 0 },
        contact: { phone: branch.contact.phone || '', email: branch.contact.email || '' },
        workingHours: branch.workingHours || [],
        servicesOffered: branch.servicesOffered || [],
    }));

    await prisma.$transaction(async tx => {
      const institution = await tx.institution.create({
        data: {
          ...institutionFields(institutionData),
          name: institutionData.name,
          category: institutionData.category,
          description: institutionData.description,
          logo: logoUrl,
          image: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
        },
      });
      await replaceBranches(tx, { institutionId: institution.id }, branchesWithIds);
    });
    revalidatePath('/admin/institutions');
    revalidatePath('/institutions');
    return { success: true };
  } catch (error) {
    console.error("Error creating institution:", error);
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function updateInstitution(institutionId: string, institutionData: InstitutionFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isEditorRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const original = (await findInstitutions({ where: { id: institutionId } }))[0];
    if (!original) {
      throw new Error("Institution not found");
    }

    let newLogoUrl = original.logo;
    if (institutionData.logo === '') {
      newLogoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${institutionData.name.substring(0, 2).toUpperCase()}`;
    } else if (institutionData.logo) {
      newLogoUrl = institutionData.logo;
    }

    await prisma.$transaction(async tx => {
      await tx.institution.update({
        where: { id: institutionId },
        data: { ...institutionFields(institutionData), logo: newLogoUrl },
      });
      await replaceBranches(tx, { institutionId }, reconcileBranches(original.branches, institutionData.branches));
    });
    revalidatePath('/admin/institutions');
    revalidatePath(`/institutions/${institutionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating institution:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteInstitution(institutionId: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isEditorRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { targetType: 'institution', targetId: institutionId } }),
      prisma.institution.delete({ where: { id: institutionId } }),
    ]);
    revalidatePath('/admin/institutions');
    revalidatePath('/institutions');
    return { success: true };
  } catch (error) {
    console.error("Error deleting institution:", error);
    return { success: false, message: 'An unknown error occurred.' };
  }
}

type BulkInstitutionData = {
    name: string;
    description: string;
    category: string;
    email: string;
    website: string;
    phone: string;
    address: string;
    city: string;
    responsiblePersonName?: string;
    responsiblePersonTitle?: string;
}

export async function bulkCreateInstitutions(institutions: BulkInstitutionData[]) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isEditorRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        await prisma.$transaction(async tx => {
            for (const instData of institutions) {
                const institution = await tx.institution.create({
                    data: {
                        name: instData.name,
                        description: instData.description,
                        category: instData.category,
                        logo: `https://placehold.co/100x100/CCCCCC/000000?text=${instData.name.substring(0, 2).toUpperCase()}`,
                        image: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
                        responsiblePersonName: (instData.responsiblePersonName && instData.responsiblePersonTitle) ? instData.responsiblePersonName : null,
                        responsiblePersonTitle: (instData.responsiblePersonName && instData.responsiblePersonTitle) ? instData.responsiblePersonTitle : null,
                        email: instData.email || null,
                        website: instData.website || null,
                    },
                });
                await replaceBranches(tx, { institutionId: institution.id }, [
                    defaultBranch(instData.address, instData.city, instData.phone, '08:00 - 15:30'),
                ]);
            }
        }, { timeout: 60_000 });

        revalidatePath('/admin/institutions');
        revalidatePath('/institutions');
        return { success: true, count: institutions.length };
    } catch (error) {
        console.error("Error bulk creating institutions:", error);
        return { success: false, message: 'An unknown error occurred during bulk upload.' };
    }
}

type BulkLocalBusinessData = {
    name: string;
    description: string;
    category: string;
    email: string;
    website?: string;
    phone: string;
    address: string;
    city: string;
}

// Seeds local businesses with no owner (ownerId: null) so the real owner can
// later find and claim them via ClaimButton/createClaim — same "companies"
// collection and claim flow as regular companies, just without the
// corporate-only fields (legalForm/cif), mirroring createLocalBusiness's
// self-service defaults.
export async function bulkCreateLocalBusinesses(businesses: BulkLocalBusinessData[]) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isManagerRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        await prisma.$transaction(async tx => {
            for (const data of businesses) {
                const company = await tx.company.create({
                    data: {
                        ...unclaimedCompanyDefaults(data.name),
                        category: data.category,
                        description: data.description,
                        email: data.email || null,
                        website: data.website || null,
                    },
                });
                await replaceBranches(tx, { companyId: company.id }, [
                    defaultBranch(data.address, data.city, data.phone, '09:00 - 17:00'),
                ]);
            }
        }, { timeout: 60_000 });

        revalidatePath('/admin/companies');
        revalidatePath('/companies');
        return { success: true, count: businesses.length };
    } catch (error) {
        console.error("Error bulk creating local businesses:", error);
        return { success: false, message: 'An unknown error occurred during bulk upload.' };
    }
}

export interface PlaceSearchResultWithStatus extends PlaceResult {
  alreadyImported: boolean;
}


export async function searchGooglePlaces(searchQuery: string, city: string, pageToken?: string): Promise<{ success: true; results: PlaceSearchResultWithStatus[]; nextPageToken?: string } | { success: false; message: string }> {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const { results, nextPageToken } = await searchPlaces(searchQuery, city, pageToken);
    if (results.length === 0) {
      return { success: true, results: [] };
    }

    const imported = await prisma.company.findMany({
      where: { googlePlaceId: { in: results.map(r => r.placeId) } },
      select: { googlePlaceId: true },
    });
    const alreadyImportedIds = new Set(imported.map(c => c.googlePlaceId));

    return {
      success: true,
      results: results.map(r => ({ ...r, alreadyImported: alreadyImportedIds.has(r.placeId) })),
      nextPageToken,
    };
  } catch (error) {
    console.error("Error searching Google Places:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred while searching Google Places.' };
  }
}

// Same "unclaimed listing" pattern as bulkCreateLocalBusinesses — imported
// businesses land with ownerId: null so a real owner can later claim them.
// Enriches each place with a Details call (phone/website/hours/photo/
// description) — one extra live API call per business actually imported,
// not per search result. A single place's enrichment failing falls back to
// placeholder data rather than aborting the whole batch. Places whose
// businessStatus comes back as anything other than OPERATIONAL (closed
// temporarily/permanently) are skipped entirely, not imported.
export async function importPlacesAsCompanies({ places, category }: { places: PlaceResult[]; category: string }) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    // Skip places already imported (googlePlaceId is unique in the table).
    const existing = await prisma.company.findMany({
      where: { googlePlaceId: { in: places.map(p => p.placeId) } },
      select: { googlePlaceId: true },
    });
    const existingIds = new Set(existing.map(c => c.googlePlaceId));
    const toImport = places.filter(p => !existingIds.has(p.placeId));

    const enriched = await Promise.all(toImport.map(async (place) => {
      let phone = '';
      let website = '';
      let workingHours: { day: string; hours: string }[] = [];
      let logo: string | undefined;
      let description = '';
      let reviews: { author: string; rating: number; comment: string; date: string }[] = [];

      try {
        const details = await getPlaceDetails(place.placeId);
        if (details.businessStatus && details.businessStatus !== 'OPERATIONAL') {
          return null; // closed temporarily/permanently — skip
        }
        phone = details.phone || '';
        website = details.website || '';
        workingHours = details.workingHours;
        description = details.description || '';
        reviews = details.reviews;
        if (details.photoName) {
          const photoUrl = await uploadPlacePhotoToStorage(details.photoName, place.placeId);
          if (photoUrl) logo = photoUrl;
        }
      } catch (enrichError) {
        console.error(`Error enriching place ${place.placeId}, falling back to basic data:`, enrichError);
      }

      return { place, phone, website, workingHours, logo, description, reviews };
    }));

    const newCompanies = enriched.filter((c): c is NonNullable<typeof c> => c !== null);
    const skipped = places.length - newCompanies.length;

    await prisma.$transaction(async tx => {
      for (const { place, phone, website, workingHours, logo, description, reviews } of newCompanies) {
        const company = await tx.company.create({
          data: {
            ...unclaimedCompanyDefaults(place.name),
            ...(logo && { logo }),
            category,
            description,
            website: website || null,
            googlePlaceId: place.placeId,
          },
        });
        await replaceBranches(tx, { companyId: company.id }, [{
          id: uuidv4(),
          name: 'Sede Principal',
          location: { address: place.address, city: place.city, lat: place.lat, lng: place.lng },
          contact: { phone, email: '' },
          workingHours,
          servicesOffered: [],
        }]);
        if (reviews.length) {
          await tx.review.createMany({
            data: reviews.map(r => ({
              targetType: 'company' as const,
              targetId: company.id,
              author: r.author,
              rating: Math.round(r.rating),
              comment: r.comment,
              date: new Date(r.date),
              source: 'google',
            })),
          });
        }
      }
    }, { timeout: 60_000 });

    revalidatePath('/admin/companies');
    revalidatePath('/companies');
    return { success: true, count: newCompanies.length, skipped };
  } catch (error) {
    console.error("Error importing places as companies:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred while importing.' };
  }
}

interface CreateClaimArgs {
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export async function createClaim(args: CreateClaimArgs) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || caller.uid !== args.userId) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const company = await prisma.company.findUnique({ where: { id: args.companyId }, select: { ownerId: true } });
    if (!company) {
      return { success: false, message: 'La empresa no existe.' };
    }

    if (company.ownerId) {
       return { success: false, message: 'Esta empresa ya ha sido reclamada.' };
    }

    // Only a still-pending claim blocks resubmission — a prior rejection
    // shouldn't permanently lock the user out of ever claiming this company.
    const existingClaim = await prisma.claim.findFirst({
      where: { userId: args.userId, companyId: args.companyId, status: 'pending' },
      select: { id: true },
    });

    if (existingClaim) {
        return { success: false, message: 'Ya tiene una reclamación pendiente para esta empresa.' };
    }

    await prisma.claim.create({
      data: { ...args, status: 'pending' },
    });

    revalidatePath(`/companies/${args.companyId}`);
    revalidatePath('/admin/claims');

    return { success: true, message: 'Su reclamación ha sido enviada para revisión.' };
  } catch (error) {
    console.error("Error creating claim:", error);
    return { success: false, message: 'An unknown error occurred while creating the claim.' };
  }
}

export async function processClaim({ claimId, companyId, userId, approve }: { claimId: string; companyId: string; userId: string; approve: boolean; }) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new Error("Claim not found");

    const newStatus = approve ? 'approved' : 'rejected';

    // In-app notifications are written in the same transaction as the claim/
    // company updates (so a failed write can't orphan a notification with no
    // corresponding status change); push doesn't need that guarantee, so it's
    // collected here and fired after the transaction commits.
    const pushRecipients: { userId: string; message: string; link: string }[] = [];

    await prisma.$transaction(async tx => {
      await tx.claim.update({ where: { id: claimId }, data: { status: newStatus } });

      if (approve) {
        await tx.company.update({ where: { id: companyId }, data: { ownerId: userId } });

        pushRecipients.push({
          userId,
          message: `Su reclamación para la empresa "${claim.companyName}" ha sido aprobada.`,
          link: `/dashboard`,
        });

        // Any other still-pending claims on this company are now moot — reject
        // them too, so a stale duplicate can't later overwrite the new owner.
        const otherPending = await tx.claim.findMany({
          where: { companyId, status: 'pending', id: { not: claimId } },
        });
        if (otherPending.length) {
          await tx.claim.updateMany({ where: { id: { in: otherPending.map(c => c.id) } }, data: { status: 'rejected' } });
        }
        for (const other of otherPending) {
          pushRecipients.push({
            userId: other.userId,
            message: `Su reclamación para la empresa "${other.companyName}" ha sido rechazada porque otra reclamación fue aprobada.`,
            link: `/companies/${companyId}`,
          });
        }
      } else {
        pushRecipients.push({
          userId: claim.userId,
          message: `Su reclamación para la empresa "${claim.companyName}" ha sido rechazada.`,
          link: `/companies/${companyId}`,
        });
      }

      await tx.notification.createMany({ data: pushRecipients });
    });

    await Promise.all(pushRecipients.map(r => sendPushForUser(r.userId, r)));

    revalidatePath('/admin/claims');
    revalidatePath(`/companies/${companyId}`);

    return { success: true, message: `Claim ${newStatus}.` };
  } catch (error) {
    console.error("Error processing claim:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred while processing the claim.' };
  }
}


// BLOG ACTIONS

type UnsavedPost = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'authorName' | 'slug' | 'author'>;

export async function createPost(postData: Partial<UnsavedPost> & { authorId: string }) {
  try {
    const caller = await getCurrentCaller();
    if (!caller || (caller.uid !== postData.authorId && !isEditorRole(caller.role))) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    if (!postData.authorId || !postData.title || !postData.content || !postData.excerpt) {
        throw new Error("Missing required post data.");
    }
    const author = await prisma.user.findUnique({ where: { id: postData.authorId }, select: { displayName: true } });
    if (!author) {
      throw new Error('User not found');
    }

    let imageUrl = postData.featuredImage;
    if (!imageUrl || imageUrl.trim() === '') {
      imageUrl = `https://placehold.co/1200x630/459650/FFFFFF?text=${encodeURIComponent(postData.title)}`;
    }

    const post = await prisma.post.create({
      data: {
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        status: postData.status || 'pending',
        featuredImage: imageUrl,
        imageDescription: postData.imageDescription || null,
        authorId: postData.authorId,
        authorName: author.displayName,
        category: postData.category || null,
        slug: await uniquePostSlug(postData.title),
      },
    });

    revalidatePath('/admin/contribuciones');
    revalidatePath('/contribuciones');
    revalidatePath('/dashboard');

    return { success: true, postId: post.id };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, message: 'Failed to create post' };
  }
}

export async function updatePost(postId: string, postData: Partial<UnsavedPost>, currentImageUrl: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const originalPost = await prisma.post.findUnique({ where: { id: postId } });
    if (!originalPost) throw new Error("Post not found");

    if (!isEditorRole(caller.role) && originalPost.authorId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para editar esta publicación.' };
    }

    const data: Prisma.PostUncheckedUpdateInput = {
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt,
      status: postData.status,
      featuredImage: postData.featuredImage,
      imageDescription: postData.imageDescription,
      category: postData.category,
    };

    if (postData.authorId && originalPost.authorId !== postData.authorId) {
        const author = await prisma.user.findUnique({ where: { id: postData.authorId }, select: { displayName: true } });
        if (author) {
            data.authorId = postData.authorId;
            data.authorName = author.displayName;
        }
    }

    let slug = originalPost.slug;
    if (postData.title && postData.title !== originalPost.title) {
        slug = await uniquePostSlug(postData.title, postId);
        data.slug = slug;
    }

    // featuredImage is already a Storage URL (new upload, or unchanged) —
    // only an explicitly-cleared image needs a placeholder swap-in.
    if (postData.featuredImage === '') {
      data.featuredImage = `https://placehold.co/1200x630/459650/FFFFFF?text=${encodeURIComponent(postData.title || originalPost.title)}`;
    }

    await prisma.post.update({ where: { id: postId }, data });

    revalidatePath('/admin/contribuciones');
    revalidatePath('/dashboard');
    revalidatePath(`/contribuciones/${postId}`);
    revalidatePath(`/contribuciones/${slug}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating post:', error);
    return { success: false, message: 'Failed to update post' };
  }
}

export async function deletePost(postId: string) {
    try {
        const caller = await getCurrentCaller();
        if (!caller) {
            return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
        }

        const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });

        if (!isEditorRole(caller.role) && post && post.authorId !== caller.uid) {
            return { success: false, message: 'No tiene permiso para eliminar esta publicación.' };
        }

        await prisma.post.deleteMany({ where: { id: postId } });
        revalidatePath('/admin/contribuciones');
        revalidatePath('/dashboard');
        revalidatePath('/contribuciones');
        return { success: true };
    } catch (error) {
        console.error("Error deleting post:", error);
        return { success: false, message: 'Failed to delete post' };
    }
}

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
}) {
  if (!userId || !authorName) {
    return { success: false, message: "Debe iniciar sesión para comentar." };
  }
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: "Debe iniciar sesión para comentar." };
    }
    if (caller.uid !== userId) {
      return { success: false, message: 'No puede comentar en nombre de otro usuario.' };
    }

    await prisma.postComment.create({
      data: { postId, userId, authorName, comment },
    });

    revalidatePath(`/contribuciones/${postId}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding post comment:", error);
    return { success: false, message: "No se pudo añadir el comentario." };
  }
}


// DOCUMENT ACTIONS
// DOCUMENT ACTIONS

export async function addDocument(companyId: string, documentData: { name: string; url: string; size: number; }) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    if (!documentData.url) {
        throw new Error("No file URL provided.");
    }
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true, documents: true } });
    if (!company) {
      throw new Error('Company not found');
    }

    if (!isManagerRole(caller.role) && company.ownerId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    }

    const newDocument = {
      id: uuidv4(),
      name: documentData.name,
      url: documentData.url,
      size: documentData.size,
      createdAt: new Date().toISOString(),
    };

    const documents = [...((company.documents as Document[] | null) ?? []), newDocument];
    await prisma.company.update({ where: { id: companyId }, data: { documents: documents as Prisma.InputJsonValue } });

    revalidatePath(`/dashboard/companies/${companyId}/documents`);

    return { success: true, newDocument };
  } catch (error: any) {
    console.error("Error adding document:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteDocument(companyId: string, documentId: string) {
    try {
        const caller = await getCurrentCaller();
        if (!caller) {
            return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
        }

        const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true, documents: true } });
        if (!company) {
            throw new Error("Company not found");
        }

        if (!isManagerRole(caller.role) && company.ownerId !== caller.uid) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }
        const documents = (company.documents as Document[] | null) ?? [];
        const documentToDelete = documents.find(d => d.id === documentId);

        if (!documentToDelete) {
            throw new Error("Document not found in company list");
        }

        if (documentToDelete.url) {
            await deleteUploadByUrl(documentToDelete.url);
        }

        await prisma.company.update({
            where: { id: companyId },
            data: { documents: documents.filter(d => d.id !== documentId) as Prisma.InputJsonValue },
        });

        revalidatePath(`/dashboard/companies/${companyId}/documents`);

        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}

// SETTINGS ACTIONS

export async function addCity(city: string): Promise<{success: boolean, message?: string}> {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isManagerRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        const cities = await getSettingsCities();
        if (!cities.includes(city)) {
            await saveSiteSettings({ cities: [...cities, city] });
        }

        revalidatePath('/admin/locations');
        return { success: true };
    } catch (e: any) {
        console.error("Error adding city: ", e);
        return { success: false, message: e.message };
    }
}

export async function deleteCity(city: string): Promise<{success: boolean, message?: string}> {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isManagerRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        const cities = await getSettingsCities();
        await saveSiteSettings({ cities: cities.filter(c => c !== city) });
        revalidatePath('/admin/locations');
        return { success: true };
    } catch (e: any) {
        console.error("Error deleting city: ", e);
        return { success: false, message: e.message };
    }
}


export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<{success: boolean, message?: string}> {
    try {
        const caller = await getCurrentCaller();
        if (!caller || !isAdminRole(caller.role)) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        await saveSiteSettings(settings);

        revalidatePath('/admin/settings');
        // Revalidate paths that use this data, e.g., the root layout for footer
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error("Error updating site settings: ", e);
        return { success: false, message: e.message };
    }
}

export async function updateUserNotificationSettings(userId: string, settings: AppUser['notificationSettings']) {
    try {
        const caller = await getCurrentCaller();
        if (!caller || (caller.uid !== userId && !isAdminRole(caller.role))) {
            return { success: false, message: 'No tiene permiso para realizar esta acción.' };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { notificationSettings: settings ? (settings as Prisma.InputJsonValue) : Prisma.DbNull },
        });
        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        console.error("Error updating notification settings:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function resetPasswordForEmail(email: string) {
  try {
    await sendPasswordResetEmail(adminAuth, email);
    return { success: true, message: 'Se ha enviado un correo para restablecer la contraseña.' };
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    if (error.code === 'auth/user-not-found') {
      return { success: false, message: 'No se encontró ningún usuario con este correo electrónico.' };
    }
    return { success: false, message: 'Ocurrió un error. Por favor, inténtelo de nuevo.' };
  }
}


// AI Actions

export async function findCompanies({ query: searchQuery, limit: queryLimit }: { query: string; limit?: number }) {
  const allCompanies = await prisma.company.findMany({
    orderBy: { name: 'asc' },
    take: queryLimit || 10,
    select: { id: true, name: true, category: true, description: true },
  });

  const lowerCaseQuery = searchQuery.toLowerCase();

  return allCompanies.filter(company =>
    company.name.toLowerCase().includes(lowerCaseQuery) ||
    company.category.toLowerCase().includes(lowerCaseQuery) ||
    company.description.toLowerCase().includes(lowerCaseQuery)
  );
}

// FOOD ORDERING ACTIONS

interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  image?: string;
  foodType: string;
  isMenuDelDia?: boolean;
  available?: boolean;
  optionGroups?: MenuItem['optionGroups'];
}

export async function createMenuItem(companyId: string, userId: string, itemData: MenuItemFormData) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true, ownerId: true } });
    if (!company) {
      throw new Error('Company not found');
    }

    if (company.ownerId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para gestionar el menú de esta empresa.' };
    }

    const newItem = await prisma.menuItem.create({
      data: {
        ...menuItemFields(itemData),
        name: itemData.name,
        description: itemData.description,
        price: itemData.price,
        foodType: itemData.foodType,
        optionGroups: (itemData.optionGroups || []) as Prisma.InputJsonValue,
        companyId,
        companyName: company.name,
        ownerId: company.ownerId ?? caller.uid,
      },
    });

    revalidatePath(`/dashboard/companies/${companyId}/menu`);
    revalidatePath(`/companies/${companyId}`);

    return { success: true, id: newItem.id };
  } catch (error) {
    console.error('Error creating menu item:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function updateMenuItem(itemId: string, userId: string, itemData: Partial<MenuItemFormData>) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const item = await prisma.menuItem.findUnique({ where: { id: itemId }, select: { ownerId: true, companyId: true } });
    if (!item) {
      throw new Error('Menu item not found');
    }
    if (item.ownerId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para editar este producto.' };
    }

    await prisma.menuItem.update({ where: { id: itemId }, data: menuItemFields(itemData) });

    revalidatePath(`/dashboard/companies/${item.companyId}/menu`);
    revalidatePath(`/companies/${item.companyId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating menu item:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function deleteMenuItem(itemId: string, userId: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const item = await prisma.menuItem.findUnique({ where: { id: itemId }, select: { ownerId: true, companyId: true } });
    if (!item) {
      throw new Error('Menu item not found');
    }
    if (item.ownerId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para eliminar este producto.' };
    }

    await prisma.menuItem.delete({ where: { id: itemId } });

    revalidatePath(`/dashboard/companies/${item.companyId}/menu`);
    revalidatePath(`/companies/${item.companyId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting menu item:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function toggleMenuItemAvailable(itemId: string, userId: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const item = await prisma.menuItem.findUnique({ where: { id: itemId }, select: { ownerId: true, companyId: true, available: true } });
    if (!item) {
      throw new Error('Menu item not found');
    }
    if (item.ownerId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para modificar este producto.' };
    }

    const newAvailable = !item.available;
    await prisma.menuItem.update({ where: { id: itemId }, data: { available: newAvailable } });

    revalidatePath(`/dashboard/companies/${item.companyId}/menu`);
    revalidatePath(`/companies/${item.companyId}`);

    return { success: true, available: newAvailable };
  } catch (error) {
    console.error('Error toggling menu item availability:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

interface CreateFoodOrderInput {
  companyId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  items: FoodOrderItem[];
  deliveryMethod: FoodOrderDeliveryMethod;
  deliveryAddress?: string;
  paymentMethod: FoodOrderPaymentMethod;
  notes?: string;
}

// Commission is a platform cut deducted from what the restaurant nets — it
// never changes what the customer pays. Both fees can apply to the same
// order (e.g. Situka delivery paid with Muni Dinero), in which case they add.
export async function createFoodOrder(input: CreateFoodOrderInput) {
  try {
    const caller = await getCurrentCaller();
    const company = await prisma.company.findUnique({ where: { id: input.companyId }, select: { name: true, ownerId: true } });
    if (!company) {
      throw new Error('Company not found');
    }

    if (input.items.length === 0) {
      return { success: false, message: 'El pedido no contiene productos.' };
    }

    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' }, select: { foodDeliveryFees: true } });
    const fees = settings?.foodDeliveryFees as SiteSettings['foodDeliveryFees'] | null | undefined;

    let commissionPercent = 0;
    if (input.paymentMethod === 'muni_dinero') {
      commissionPercent += fees?.muniDineroCommissionPercent ?? 0;
    }
    if (input.deliveryMethod === 'situka') {
      commissionPercent += fees?.situkaCommissionPercent ?? 0;
    }
    const commissionAmount = Math.round(subtotal * commissionPercent / 100);

    const order = toFoodOrder(await prisma.foodOrder.create({
      data: {
        companyId: input.companyId,
        companyName: company.name,
        // Guests may order; an order is only linked to an account that is the caller's own.
        customerId: caller && input.customerId === caller.uid ? caller.uid : null,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        items: input.items.map(item => ({ ...item, selectedOptions: item.selectedOptions || [] })) as Prisma.InputJsonValue,
        subtotal,
        deliveryMethod: input.deliveryMethod,
        deliveryAddress: input.deliveryAddress || null,
        paymentMethod: input.paymentMethod,
        // No live payment gateway yet: Muni Dinero orders are settled outside
        // the system for now (marked pending), same as cash/pickup orders.
        paymentStatus: input.paymentMethod === 'muni_dinero' ? 'pending' : 'not_applicable',
        commissionPercent,
        commissionAmount,
        status: 'placed',
        notes: input.notes || null,
      },
    }));

    if (company.ownerId) {
      await sendNotificationToUser(company.ownerId, {
        message: `Nuevo pedido de ${order.customerName} en ${company.name} (${subtotal.toLocaleString('es-ES')} XAF).`,
        link: `/dashboard/companies/${input.companyId}/orders`,
      });
    }

    revalidatePath(`/dashboard/companies/${input.companyId}/orders`);

    return { success: true, id: order.id, order };
  } catch (error) {
    console.error('Error creating food order:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

const FOOD_ORDER_STATUS_LABELS: Record<FoodOrderStatus, string> = {
  placed: 'recibido',
  confirmed: 'confirmado',
  preparing: 'en preparación',
  ready: 'listo',
  completed: 'completado',
  cancelled: 'cancelado',
};

export async function updateFoodOrderStatus(orderId: string, userId: string, status: FoodOrderStatus, isAdmin = false) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const order = await prisma.foodOrder.findUnique({
      where: { id: orderId },
      select: { companyId: true, companyName: true, customerId: true, company: { select: { ownerId: true } } },
    });
    if (!order) {
      throw new Error('Order not found');
    }

    if (!isManagerRole(caller.role) && order.company.ownerId !== caller.uid) {
      return { success: false, message: 'No tiene permiso para gestionar los pedidos de esta empresa.' };
    }

    await prisma.foodOrder.update({ where: { id: orderId }, data: { status } });

    if (order.customerId) {
      await sendNotificationToUser(order.customerId, {
        message: `Su pedido en ${order.companyName} está ${FOOD_ORDER_STATUS_LABELS[status]}.`,
        link: `/dashboard/orders`,
      });
    }

    revalidatePath(`/dashboard/companies/${order.companyId}/orders`);
    revalidatePath('/dashboard/orders');

    return { success: true };
  } catch (error) {
    console.error('Error updating food order status:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function cancelFoodOrder(orderId: string, userId: string) {
  try {
    const caller = await getCurrentCaller();
    if (!caller) {
      return { success: false, message: 'Debe iniciar sesión para realizar esta acción.' };
    }

    const order = await prisma.foodOrder.findUnique({
      where: { id: orderId },
      select: { companyId: true, customerId: true, customerName: true, status: true, company: { select: { ownerId: true, name: true } } },
    });
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.customerId !== caller.uid && !isManagerRole(caller.role)) {
      return { success: false, message: 'No tiene permiso para cancelar este pedido.' };
    }
    if (order.status !== 'placed' && order.status !== 'confirmed') {
      return { success: false, message: 'Este pedido ya no se puede cancelar.' };
    }

    await prisma.foodOrder.update({ where: { id: orderId }, data: { status: 'cancelled' } });

    if (order.company.ownerId) {
      await sendNotificationToUser(order.company.ownerId, {
        message: `${order.customerName} canceló su pedido en ${order.company.name}.`,
        link: `/dashboard/companies/${order.companyId}/orders`,
      });
    }

    revalidatePath(`/dashboard/companies/${order.companyId}/orders`);
    revalidatePath('/dashboard/orders');

    return { success: true };
  } catch (error) {
    console.error('Error cancelling food order:', error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function findProcedures({ query: searchQuery, limit: queryLimit }: { query: string; limit?: number }) {
  const allProcedures = await prisma.procedure.findMany({
    orderBy: { name: 'asc' },
    take: queryLimit || 10,
    select: { id: true, name: true, category: true, description: true, institutionName: true },
  });

  const lowerCaseQuery = searchQuery.toLowerCase();

  return allProcedures
    .filter(proc =>
      proc.name.toLowerCase().includes(lowerCaseQuery) ||
      proc.category.toLowerCase().includes(lowerCaseQuery) ||
      proc.description.toLowerCase().includes(lowerCaseQuery)
    )
    .map(({ institutionName, ...rest }) => ({ ...rest, institution: institutionName }));
}
