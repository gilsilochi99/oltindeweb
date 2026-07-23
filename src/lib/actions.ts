
'use server';

import { revalidatePath } from 'next/cache';
import { db } from './firebase';
import { collection, addDoc, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc, getDocs, writeBatch, query, where, setDoc, orderBy, limit, increment } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { Branch, Company, Institution, Procedure, Service, Claim, CompanyProduct, Post, Offer, Announcement, Document, Review, PostComment, SiteSettings, Product, AppUser, LegalForm, CompanySize, CapitalOwnership, GeographicScope, CompanyPurpose, FiscalRegime, LocalBusiness, JobPosting, EmploymentType, AcademicLevel, CalendarEvent, EventOrganizerType, EventRegistrationMethod, TouristLocation, TouristLocationPriceRange, Itinerary, ItineraryStop, ItineraryVisibility, HealthFacility, HealthFacilityType, HealthFacilityOwnership } from './types';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { createNotificationsForSubscribers } from './notifications';
import { auth as adminAuth } from './firebase'; // Use the initialized auth instance
import { storage } from './firebase';
import { ref, deleteObject } from 'firebase/storage';


interface BranchFormData {
  name: string;
  location: {
    address: string;
    city: string;
    lat?: number;
    lng?: number;
  };
  contact: {
    phone: string;
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
        phone: branch.contact.phone,
        email: branch.contact.email || '',
      },
      workingHours: branch.workingHours?.length ? branch.workingHours : (existing?.workingHours || []),
      servicesOffered: branch.servicesOffered || [],
    };
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
    let logoUrl = companyData.logo;
    if (!logoUrl) {
        logoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${companyData.name.substring(0, 2).toUpperCase()}`;
    }
    
    const companiesCol = collection(db, 'companies');
    
    const branchesWithIds: Branch[] = companyData.branches.map(branch => ({
        ...branch,
        id: uuidv4(),
        location: { ...branch.location, lat: branch.location.lat ?? 0, lng: branch.location.lng ?? 0 },
        contact: { phone: branch.contact.phone, email: branch.contact.email || '' },
        workingHours: branch.workingHours || [
          { day: 'Lunes - Viernes', hours: '09:00 - 17:00' },
          { day: 'Sábado', hours: 'Cerrado' },
          { day: 'Domingo', hours: 'Cerrado' },
        ],
        servicesOffered: branch.servicesOffered || [],
    }));

    const updatePayload: Omit<Company, 'id' | 'products' | 'reviews' | 'announcements' | 'offers' | 'claims' | 'documents'> = {
      ...companyData,
      ownerId: userId || null,
      logo: logoUrl,
      branches: branchesWithIds,
      products: companyData.products || [],
      gallery: companyData.gallery || [],
      isVerified: false,
      isFeatured: false,
      highlights: [],
      image: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
      createdAt: new Date().toISOString(),
    };


    await addDoc(companiesCol, updatePayload);

    revalidatePath('/dashboard');
    revalidatePath('/admin/companies');
    revalidatePath('/companies');
    
    return { success: true };

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
    let logoUrl = businessData.logo;
    if (!logoUrl) {
      logoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${businessData.name.substring(0, 2).toUpperCase()}`;
    }

    const businessesCol = collection(db, 'companies'); // Storing in 'companies' for now

    const branchesWithIds: Branch[] = businessData.branches.map(branch => ({
      ...branch,
      id: uuidv4(),
      location: { ...branch.location, lat: branch.location.lat ?? 0, lng: branch.location.lng ?? 0 },
      contact: { phone: branch.contact.phone, email: branch.contact.email || '' },
      workingHours: branch.workingHours || [],
      servicesOffered: branch.servicesOffered || [],
    }));

    const newBusiness: Omit<Company, 'id' | 'legalForm' | 'cif' | 'yearEstablished'> = {
      ...businessData,
      ownerId: userId || null,
      logo: logoUrl,
      branches: branchesWithIds,
      gallery: businessData.gallery || [],
      isVerified: false,
      isFeatured: false,
      reviews: [],
      products: [],
      highlights: [],
      announcements: [],
      offers: [],
      claims: [],
      documents: [],
      image: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
      createdAt: new Date().toISOString(),
      // Omitting corporate fields
      legalForm: 'Empresa Individual', // Default or omit
      cif: 'N/A', // Default or omit
      yearEstablished: new Date().getFullYear(), // Default or omit
    };

    await addDoc(businessesCol, newBusiness);
    
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
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    const existingBranches = companySnap.exists() ? (companySnap.data() as Company).branches : undefined;

    // Construct the final gallery array
    const finalGallery = companyData.gallery || [];

    const updatePayload = {
      ...companyData,
      branches: reconcileBranches(existingBranches, companyData.branches),
      gallery: finalGallery,
    };

    // Handle logo update separately to avoid overwriting with empty/placeholder value
    if (companyData.logo && companyData.logo.startsWith('data:image')) {
        updatePayload.logo = companyData.logo;
    } else if (companyData.logo === '') {
        const originalName = companySnap.exists() ? companySnap.data().name : '...';
        updatePayload.logo = `https://placehold.co/100x100/CCCCCC/000000?text=${originalName.substring(0, 2).toUpperCase()}`;
    } else {
        // If logo is a URL (not a data URI and not empty), it means it hasn't changed.
        // We delete it from payload to avoid overwriting with the same URL.
        delete updatePayload.logo;
    }

    await updateDoc(companyRef, updatePayload);

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

export async function updateLocalBusiness({ businessId, businessData }: UpdateLocalBusinessArgs) {
  try {
    const businessRef = doc(db, 'companies', businessId); // Also using 'companies'
    const businessSnap = await getDoc(businessRef);
    const existingBranches = businessSnap.exists() ? (businessSnap.data() as Company).branches : undefined;

    const finalGallery = businessData.gallery || [];

    const updatePayload: any = {
      ...businessData,
      branches: reconcileBranches(existingBranches, businessData.branches),
      gallery: finalGallery,
    };

    // Handle logo update
    if (businessData.logo && businessData.logo.startsWith('data:image')) {
      updatePayload.logo = businessData.logo;
    } else if (businessData.logo === '') {
        const originalName = businessSnap.exists() ? businessSnap.data().name : '...';
        updatePayload.logo = `https://placehold.co/100x100/CCCCCC/000000?text=${originalName.substring(0, 2).toUpperCase()}`;
    } else {
      delete updatePayload.logo;
    }
    
    await updateDoc(businessRef, updatePayload);
    
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
  entityType: 'companies' | 'institutions' | 'procedures' | 'itineraries';
  reviewData: { rating: number; comment: string };
  userId: string;
  authorName: string;
}) {
  if (!userId || !authorName) {
    return { success: false, message: "Debe iniciar sesión para dejar una reseña." };
  }
  try {
    const entityRef = doc(db, entityType, entityId);

    const newReview: Review = {
      id: uuidv4(),
      author: authorName,
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: new Date().toISOString(),
    };

    await updateDoc(entityRef, {
      reviews: arrayUnion(newReview)
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


export async function deleteCompany(companyId: string, companyLogoUrl: string) {
  try {
    await deleteDoc(doc(db, "companies", companyId));
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
        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
            throw new Error("Company not found");
        }
        
        const company = companySnap.data() as Company;
        const currentStatus = company.isVerified || false;
        const newStatus = !currentStatus;

        await updateDoc(companyRef, {
            isVerified: newStatus
        });

        // Send notification to owner if the company is being verified
        if (newStatus && company.ownerId) {
            const notificationsCol = collection(db, 'notifications');
            const newNotifRef = doc(notificationsCol);
            await setDoc(newNotifRef, {
                userId: company.ownerId,
                message: `¡Enhorabuena! Su empresa "${company.name}" ha sido verificada y ahora es pública.`,
                link: `/companies/${companyId}`,
                isRead: false,
                createdAt: new Date().toISOString(),
            });
        }


        revalidatePath('/admin/companies');
        revalidatePath(`/companies/${companyId}`);
        revalidatePath('/companies');
        
        return { success: true, newState: !currentStatus };
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
        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
            throw new Error("Company not found");
        }

        const currentStatus = companySnap.data().isFeatured || false;
        await updateDoc(companyRef, {
            isFeatured: !currentStatus
        });

        revalidatePath('/admin/companies');
        revalidatePath('/companies');
        revalidatePath('/');
        
        return { success: true, newState: !currentStatus };
    } catch (error) {
        console.error("Error toggling company featured status:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}


export async function updateUserRole(userId: string, newRole: 'admin' | 'manager' | 'editor' | 'user') {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error("User not found");
        }

        await updateDoc(userRef, {
            role: newRole
        });

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
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error("User not found");
        }

        const currentStatus = userSnap.data().isPremium || false;
        const newStatus = !currentStatus;

        await updateDoc(userRef, {
            isPremium: newStatus
        });

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


interface UserFormData {
  displayName: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'manager' | 'editor';
}

export async function createUser(userData: UserFormData) {
  try {
    const auth = getAuth(); 
    
    const userDocRef = doc(collection(db, "users")); 
    
    await writeBatch(db)
      .set(userDocRef, {
        displayName: userData.displayName,
        email: userData.email,
        role: userData.role,
        isPremium: false,
        favorites: { companies: [], procedures: [], institutions: [], jobs: [], events: [], places: [], itineraries: [] },
      })
      .commit();

    revalidatePath('/admin/users');

    return { success: true, message: 'User document created in Firestore. Auth user must be created manually in Firebase Console.' };
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error) {
        let message = 'An unknown error occurred.';
        if (error.message.includes('auth/email-already-in-use')) {
            message = 'Este correo electrónico ya está en uso.';
        }
        return { success: false, message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}

export async function isFirstUser(): Promise<boolean> {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    return snapshot.empty;
}

export async function signupUser(email: string, password: string, displayName: string, uid?: string) {
    const firstUser = await isFirstUser();
    const newRole = firstUser ? 'admin' : 'user';

    const userId = uid || uuidv4(); // Use provided UID or generate a new one
    const userDocRef = doc(db, "users", userId);
    
    await setDoc(userDocRef, { 
        displayName: displayName,
        email: email,
        role: newRole,
        isPremium: firstUser, // First user is premium by default
        favorites: { companies: [], procedures: [], institutions: [], jobs: [], events: [], places: [], itineraries: [] },
        subscriptions: { companies: [], categories: [] },
        notificationSettings: {
            email: {
                newOffers: true,
                newAnnouncements: true,
                newJobs: true,
                newEvents: true,
            }
        }
    });

    return { success: true, role: newRole, message: "User created" };
}

export async function updateUserProfile(userId: string, data: { displayName?: string; title?: string; socials?: { linkedin?: string; twitter?: string } }) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        displayName: data.displayName,
        title: data.title || '',
        socials: {
          linkedin: data.socials?.linkedin || '',
          twitter: data.socials?.twitter || '',
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
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    if (!companySnap.exists()) {
      throw new Error('Company not found');
    }
    const company = { id: companySnap.id, ...companySnap.data() } as Company;
    
    const newAnnouncement: Announcement = {
      id: uuidv4(),
      title: announcementData.title,
      content: announcementData.content,
      createdAt: new Date().toISOString(),
      image: announcementData.image || '',
    };

    await updateDoc(companyRef, {
      announcements: arrayUnion(newAnnouncement)
    });
    
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
        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);
        if (!companySnap.exists()) {
            throw new Error("Company not found");
        }
        
        const companyData = companySnap.data() as Company;
        const announcementToDelete = companyData.announcements?.find(a => a.id === announcementId);
        
        if (!announcementToDelete) {
            throw new Error("Announcement not found in company list");
        }
        
        // Ensure the object to remove is an exact match
        const preciseAnnouncementToRemove = {
            id: announcementToDelete.id,
            title: announcementToDelete.title,
            content: announcementToDelete.content,
            createdAt: announcementToDelete.createdAt,
            image: announcementToDelete.image || '',
        };

        await updateDoc(companyRef, {
            announcements: arrayRemove(preciseAnnouncementToRemove)
        });

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


interface OfferData {
    title: string;
    description: string;
    discount: string;
    validUntil: string;
    image?: string;
}

export async function addOffer(companyId: string, offerData: OfferData) {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    if (!companySnap.exists()) {
      throw new Error('Company not found');
    }
    const company = { id: companySnap.id, ...companySnap.data() } as Company;
    
    const newOffer: Offer = {
      id: uuidv4(),
      ...offerData,
      image: offerData.image || '',
      createdAt: new Date().toISOString(),
    };

    await updateDoc(companyRef, {
      offers: arrayUnion(newOffer)
    });
    
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
    const proceduresCol = collection(db, 'procedures');
    const newProcedure = { ...procedureData, reviews: [], documents: procedureData.documents || [] };
    await addDoc(proceduresCol, newProcedure);
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
    const procedureRef = doc(db, 'procedures', procedureId);
    await updateDoc(procedureRef, procedureData as any);
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
    const procedureRef = doc(db, 'procedures', procedureId);
    await deleteDoc(procedureRef);
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
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    if (!companySnap.exists()) {
      throw new Error('Company not found');
    }
    const company = { id: companySnap.id, ...companySnap.data() } as Company;

    if (company.ownerId !== userId) {
      return { success: false, message: 'No tiene permiso para publicar empleos en nombre de esta empresa.' };
    }

    const userSnap = await getDoc(doc(db, 'users', userId));
    const isPremium = userSnap.exists() && (userSnap.data() as AppUser).isPremium;
    if (!isPremium) {
      return { success: false, message: 'Publicar empleos es una función exclusiva para cuentas premium. Actualice su cuenta para continuar.' };
    }

    const jobsCol = collection(db, 'jobPostings');
    const newJob: Omit<JobPosting, 'id'> = {
      ...jobData,
      requirements: jobData.requirements || [],
      responsibilities: jobData.responsibilities || [],
      experience: jobData.experience || [],
      skills: jobData.skills || [],
      applicationInstructions: jobData.applicationInstructions || '',
      salaryRange: jobData.salaryRange || '',
      deadline: jobData.deadline || '',
      companyId,
      companyName: company.name,
      companyLogo: company.logo,
      ownerId: userId,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const newDocRef = await addDoc(jobsCol, newJob);

    await createNotificationsForSubscribers(
      company,
      { title: newJob.title, link: `/jobs/${newDocRef.id}` },
      'job'
    );

    revalidatePath(`/dashboard/companies/${companyId}/jobs`);
    revalidatePath('/jobs');
    return { success: true, id: newDocRef.id };
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
    const jobRef = doc(db, 'jobPostings', jobId);
    const jobSnap = await getDoc(jobRef);
    if (!jobSnap.exists()) {
      throw new Error('Job posting not found');
    }
    const job = jobSnap.data() as JobPosting;

    if (job.ownerId !== userId) {
      return { success: false, message: 'No tiene permiso para editar esta publicación.' };
    }

    await updateDoc(jobRef, jobData as any);
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
    const jobRef = doc(db, 'jobPostings', jobId);
    const jobSnap = await getDoc(jobRef);
    if (!jobSnap.exists()) {
      throw new Error('Job posting not found');
    }
    const job = jobSnap.data() as JobPosting;

    if (job.ownerId !== userId && !isAdmin) {
      return { success: false, message: 'No tiene permiso para eliminar esta publicación.' };
    }

    await deleteDoc(jobRef);
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
    const jobRef = doc(db, 'jobPostings', jobId);
    const jobSnap = await getDoc(jobRef);
    if (!jobSnap.exists()) {
      throw new Error('Job posting not found');
    }
    const job = jobSnap.data() as JobPosting;

    if (job.ownerId !== userId && !isAdmin) {
      return { success: false, message: 'No tiene permiso para modificar esta publicación.' };
    }

    const newStatus: 'open' | 'closed' = job.status === 'open' ? 'closed' : 'open';
    await updateDoc(jobRef, { status: newStatus });

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
    const jobRef = doc(db, 'jobPostings', jobId);
    await updateDoc(jobRef, { applicationClickCount: increment(1) });
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
  location: {
    address: string;
    city: string;
    lat?: number;
    lng?: number;
  };
  contact: {
    phone: string;
    email?: string;
    whatsapp?: string;
  };
  openingHours?: { day: string; hours: string }[];
  image?: string;
}

export async function createHealthFacility(facilityData: HealthFacilityFormData) {
  try {
    const facilitiesCol = collection(db, 'healthFacilities');
    const newFacility: Omit<HealthFacility, 'id'> = {
      ...facilityData,
      location: {
        address: facilityData.location.address,
        city: facilityData.location.city,
        lat: facilityData.location.lat ?? 0,
        lng: facilityData.location.lng ?? 0,
      },
      image: facilityData.image || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
      isVerified: false,
      isFeatured: false,
      createdAt: new Date().toISOString(),
    };

    const newDocRef = await addDoc(facilitiesCol, newFacility);

    revalidatePath('/health');
    revalidatePath('/admin/health');

    return { success: true, id: newDocRef.id };
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
    const facilityRef = doc(db, 'healthFacilities', facilityId);
    await updateDoc(facilityRef, facilityData as any);

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
    await deleteDoc(doc(db, 'healthFacilities', facilityId));

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
    const facilityRef = doc(db, 'healthFacilities', facilityId);
    const facilitySnap = await getDoc(facilityRef);
    if (!facilitySnap.exists()) {
      throw new Error('Health facility not found');
    }
    const currentStatus = facilitySnap.data().isFeatured || false;
    await updateDoc(facilityRef, { isFeatured: !currentStatus });

    revalidatePath('/health');
    revalidatePath('/admin/health');

    return { success: true, newState: !currentStatus };
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
    if (rows.length === 0) {
      return { success: false, message: 'El archivo no contiene filas válidas.' };
    }

    const facilitiesCol = collection(db, 'healthFacilities');
    const q = query(facilitiesCol, where('type', '==', 'pharmacy'));
    const snapshot = await getDocs(q);
    const pharmacies = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<HealthFacility, 'id'>) }));

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

    const batch = writeBatch(db);
    for (const [pharmacyId, newDatesSet] of datesByPharmacyId.entries()) {
      const pharmacy = pharmacies.find(p => p.id === pharmacyId)!;
      const newDates = Array.from(newDatesSet);
      const monthsBeingReplaced = new Set(newDates.map(d => d.slice(0, 7)));
      const keptDates = (pharmacy.onDutyDates || []).filter(d => !monthsBeingReplaced.has(d.slice(0, 7)));
      const mergedDates = Array.from(new Set([...keptDates, ...newDates])).sort();
      batch.update(doc(db, 'healthFacilities', pharmacyId), { onDutyDates: mergedDates });
    }

    await batch.commit();

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
    if (organizerType === 'institution' && !isAdmin) {
      return { success: false, message: 'Solo los administradores pueden crear eventos institucionales.' };
    }

    const orgCollection = organizerType === 'company' ? 'companies' : 'institutions';
    const orgRef = doc(db, orgCollection, organizerId);
    const orgSnap = await getDoc(orgRef);
    if (!orgSnap.exists()) {
      return { success: false, message: 'No se encontró la entidad organizadora.' };
    }
    const organizer = { id: orgSnap.id, ...orgSnap.data() } as Company | Institution;

    if (organizerType === 'company' && !isAdmin) {
      const company = organizer as Company;
      if (company.ownerId !== userId) {
        return { success: false, message: 'No tiene permiso para publicar eventos en nombre de esta empresa.' };
      }
      const userSnap = userId ? await getDoc(doc(db, 'users', userId)) : null;
      const isPremium = userSnap?.exists() && (userSnap.data() as AppUser).isPremium;
      if (!isPremium) {
        return { success: false, message: 'Publicar eventos es una función exclusiva para cuentas premium. Actualice su cuenta para continuar.' };
      }
    }

    const eventsCol = collection(db, 'events');
    const newEvent: Omit<CalendarEvent, 'id'> = {
      ...eventData,
      address: eventData.address || '',
      endDate: eventData.endDate || '',
      registrationValue: eventData.registrationValue || '',
      organizerType,
      organizerId,
      organizerName: organizer.name,
      organizerLogo: organizer.logo,
      ownerId: organizerType === 'company' ? (organizer as Company).ownerId ?? null : null,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    const newDocRef = await addDoc(eventsCol, newEvent);

    await createNotificationsForSubscribers(
      organizer,
      { title: newEvent.title, link: `/events/${newDocRef.id}` },
      'event'
    );

    revalidatePath('/events');
    if (organizerType === 'company') revalidatePath(`/dashboard/companies/${organizerId}/events`);
    revalidatePath('/admin/events');
    return { success: true, id: newDocRef.id };
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
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      throw new Error('Event not found');
    }
    const event = eventSnap.data() as CalendarEvent;

    const canEdit = isAdmin || (!!event.ownerId && event.ownerId === userId);
    if (!canEdit) {
      return { success: false, message: 'No tiene permiso para editar este evento.' };
    }

    await updateDoc(eventRef, eventData as any);
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
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      throw new Error('Event not found');
    }
    const event = eventSnap.data() as CalendarEvent;

    const canDelete = isAdmin || (!!event.ownerId && event.ownerId === userId);
    if (!canDelete) {
      return { success: false, message: 'No tiene permiso para eliminar este evento.' };
    }

    await deleteDoc(eventRef);
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
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      throw new Error('Event not found');
    }
    const event = eventSnap.data() as CalendarEvent;

    const canToggle = isAdmin || (!!event.ownerId && event.ownerId === userId);
    if (!canToggle) {
      return { success: false, message: 'No tiene permiso para modificar este evento.' };
    }

    const newStatus: 'scheduled' | 'cancelled' = event.status === 'scheduled' ? 'cancelled' : 'scheduled';
    await updateDoc(eventRef, { status: newStatus });

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
    if (!userId) {
      return { success: false, message: 'Debe iniciar sesión para sugerir un lugar.' };
    }

    const locationsCol = collection(db, 'touristLocations');
    const newLocation: Omit<TouristLocation, 'id'> = {
      ...locationData,
      location: {
        address: locationData.location.address,
        city: locationData.location.city,
        lat: locationData.location.lat ?? 0,
        lng: locationData.location.lng ?? 0,
      },
      image: locationData.image || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
      gallery: locationData.gallery || [],
      openingHours: locationData.openingHours || [],
      linkedCompanyId: locationData.linkedCompanyId || null,
      reviews: [],
      status: 'pending',
      submittedBy: userId,
      isFeatured: false,
      createdAt: new Date().toISOString(),
    };

    const newDocRef = await addDoc(locationsCol, newLocation);

    revalidatePath('/admin/places');

    return { success: true, id: newDocRef.id };
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
    if (!isAdmin) {
      return { success: false, message: 'No tiene permiso para publicar lugares directamente.' };
    }

    const locationsCol = collection(db, 'touristLocations');
    const newLocation: Omit<TouristLocation, 'id'> = {
      ...locationData,
      location: {
        address: locationData.location.address,
        city: locationData.location.city,
        lat: locationData.location.lat ?? 0,
        lng: locationData.location.lng ?? 0,
      },
      image: locationData.image || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
      gallery: locationData.gallery || [],
      openingHours: locationData.openingHours || [],
      linkedCompanyId: locationData.linkedCompanyId || null,
      reviews: [],
      status: 'approved',
      submittedBy: userId,
      isFeatured: false,
      createdAt: new Date().toISOString(),
    };

    const newDocRef = await addDoc(locationsCol, newLocation);

    revalidatePath('/places');
    revalidatePath('/admin/places');

    return { success: true, id: newDocRef.id };
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
    if (!isAdmin) {
      return { success: false, message: 'No tiene permiso para moderar lugares turísticos.' };
    }
    const locationRef = doc(db, 'touristLocations', locationId);
    await updateDoc(locationRef, { status: decision });

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
    if (!isAdmin) {
      return { success: false, message: 'No tiene permiso para editar este lugar.' };
    }
    const locationRef = doc(db, 'touristLocations', locationId);
    await updateDoc(locationRef, locationData as any);

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
    if (!isAdmin) {
      return { success: false, message: 'No tiene permiso para eliminar este lugar.' };
    }
    await deleteDoc(doc(db, 'touristLocations', locationId));

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
    const locationRef = doc(db, 'touristLocations', locationId);
    const locationSnap = await getDoc(locationRef);
    if (!locationSnap.exists()) {
      throw new Error('Tourist location not found');
    }
    const currentStatus = locationSnap.data().isFeatured || false;
    await updateDoc(locationRef, { isFeatured: !currentStatus });

    revalidatePath('/admin/places');
    revalidatePath('/places');

    return { success: true, newState: !currentStatus };
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
    if (!userId) {
      return { success: false, message: 'Debe iniciar sesión para crear un itinerario.' };
    }

    const itinerariesCol = collection(db, 'itineraries');
    const stopsWithIds: ItineraryStop[] = itineraryData.stops.map(stop => ({
      id: stop.id || uuidv4(),
      locationId: stop.locationId,
      order: stop.order,
      day: stop.day,
      suggestedTime: stop.suggestedTime || '',
      notes: stop.notes || '',
    }));

    const newItinerary: Omit<Itinerary, 'id'> = {
      ...itineraryData,
      coverImage: itineraryData.coverImage || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
      theme: itineraryData.theme || [],
      stops: stopsWithIds,
      authorId: userId,
      authorName,
      reviews: [],
      isFeatured: false,
      createdAt: new Date().toISOString(),
    };

    const newDocRef = await addDoc(itinerariesCol, newItinerary);

    revalidatePath('/itineraries');
    revalidatePath('/dashboard/itineraries');

    return { success: true, id: newDocRef.id };
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
    const itineraryRef = doc(db, 'itineraries', itineraryId);
    const itinerarySnap = await getDoc(itineraryRef);
    if (!itinerarySnap.exists()) {
      throw new Error('Itinerary not found');
    }
    const itinerary = itinerarySnap.data() as Itinerary;

    if (itinerary.authorId !== userId && !isAdmin) {
      return { success: false, message: 'No tiene permiso para editar este itinerario.' };
    }

    const updatePayload: any = { ...itineraryData };
    if (itineraryData.stops) {
      updatePayload.stops = itineraryData.stops.map(stop => ({
        id: stop.id || uuidv4(),
        locationId: stop.locationId,
        order: stop.order,
        day: stop.day,
        suggestedTime: stop.suggestedTime || '',
        notes: stop.notes || '',
      }));
    }

    await updateDoc(itineraryRef, updatePayload);

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
    const itineraryRef = doc(db, 'itineraries', itineraryId);
    const itinerarySnap = await getDoc(itineraryRef);
    if (!itinerarySnap.exists()) {
      throw new Error('Itinerary not found');
    }
    const itinerary = itinerarySnap.data() as Itinerary;

    if (itinerary.authorId !== userId && !isAdmin) {
      return { success: false, message: 'No tiene permiso para eliminar este itinerario.' };
    }

    await deleteDoc(itineraryRef);

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
    const itineraryRef = doc(db, 'itineraries', itineraryId);
    const itinerarySnap = await getDoc(itineraryRef);
    if (!itinerarySnap.exists()) {
      throw new Error('Itinerary not found');
    }
    const currentStatus = itinerarySnap.data().isFeatured || false;
    await updateDoc(itineraryRef, { isFeatured: !currentStatus });

    revalidatePath('/admin/itineraries');
    revalidatePath('/itineraries');

    return { success: true, newState: !currentStatus };
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
        const servicesCol = collection(db, 'services');
        await addDoc(servicesCol, serviceData);
        revalidatePath('/admin/services');
        revalidatePath('/services');
        return { success: true };
    } catch (error) {
        console.error("Error creating service:", error);
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function bulkCreateServices(services: ServiceFormData[]) {
    try {
        const servicesCol = collection(db, 'services');
        const batch = writeBatch(db);
        
        services.forEach(serviceData => {
            const docRef = doc(servicesCol);
            batch.set(docRef, serviceData);
        });
        
        await batch.commit();

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
    const institutionsCol = collection(db, 'institutions');
    let logoUrl = institutionData.logo;
    if (!logoUrl || !logoUrl.startsWith('data:image')) {
       logoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${institutionData.name.substring(0, 2).toUpperCase()}`;
    }

    const branchesWithIds: Branch[] = institutionData.branches.map(branch => ({
        ...branch,
        id: uuidv4(),
        location: { ...branch.location, lat: branch.location.lat ?? 0, lng: branch.location.lng ?? 0 },
        contact: { phone: branch.contact.phone, email: branch.contact.email || '' },
        workingHours: branch.workingHours || [],
        servicesOffered: branch.servicesOffered || [],
    }));

    const newInstitution: Omit<Institution, 'id'> = {
        ...institutionData,
        contact: { ...institutionData.contact, website: institutionData.contact.website || '' },
        responsiblePerson: institutionData.responsiblePerson
          ? { name: institutionData.responsiblePerson.name || '', title: institutionData.responsiblePerson.title || '' }
          : undefined,
        logo: logoUrl,
        branches: branchesWithIds,
        image: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
        reviews: [],
        procedures: [],
    };
    await addDoc(institutionsCol, newInstitution);
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
    const institutionRef = doc(db, 'institutions', institutionId);
    const institutionSnap = await getDoc(institutionRef);
    if (!institutionSnap.exists()) {
      throw new Error("Institution not found");
    }
    const originalData = institutionSnap.data() as Institution;

    let newLogoUrl = originalData.logo;
    if (institutionData.logo && institutionData.logo.startsWith('data:image')) {
      newLogoUrl = institutionData.logo;
    } else if (institutionData.logo === '') {
      newLogoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${institutionData.name.substring(0, 2).toUpperCase()}`;
    }

    const updateData = {
      ...institutionData,
      logo: newLogoUrl,
      branches: reconcileBranches(originalData.branches, institutionData.branches),
    };

    await updateDoc(institutionRef, updateData as any);
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
    const institutionRef = doc(db, 'institutions', institutionId);
    await deleteDoc(institutionRef);
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
        const institutionsCol = collection(db, 'institutions');
        const batch = writeBatch(db);
        
        institutions.forEach(instData => {
            const docRef = doc(institutionsCol);
            const logoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${instData.name.substring(0, 2).toUpperCase()}`;
            
            const newInstitution: Omit<Institution, 'id'> = {
                name: instData.name,
                description: instData.description,
                category: instData.category,
                logo: logoUrl,
                image: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
                responsiblePerson: (instData.responsiblePersonName && instData.responsiblePersonTitle) 
                    ? { name: instData.responsiblePersonName, title: instData.responsiblePersonTitle }
                    : undefined,
                contact: {
                    email: instData.email,
                    website: instData.website,
                },
                branches: [{
                    id: uuidv4(),
                    name: 'Sede Principal',
                    location: {
                        address: instData.address,
                        city: instData.city,
                        lat: 0,
                        lng: 0,
                    },
                    contact: {
                        phone: instData.phone,
                        email: ''
                    },
                     workingHours: [
                        { day: 'Lunes - Viernes', hours: '08:00 - 15:30' },
                        { day: 'Sábado', hours: 'Cerrado' },
                        { day: 'Domingo', hours: 'Cerrado' },
                    ],
                    servicesOffered: [],
                }],
                procedures: [],
                reviews: [],
            };
            batch.set(docRef, newInstitution);
        });
        
        await batch.commit();

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
        const companiesCol = collection(db, 'companies');
        const batch = writeBatch(db);

        businesses.forEach(data => {
            const docRef = doc(companiesCol);
            const logoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${data.name.substring(0, 2).toUpperCase()}`;

            const newBusiness: Omit<Company, 'id'> = {
                ownerId: null,
                name: data.name,
                legalForm: 'Empresa Individual',
                cif: 'N/A',
                logo: logoUrl,
                category: data.category,
                description: data.description,
                products: [],
                contact: {
                    email: data.email,
                    website: data.website || '',
                },
                branches: [{
                    id: uuidv4(),
                    name: 'Sede Principal',
                    location: {
                        address: data.address,
                        city: data.city,
                        lat: 0,
                        lng: 0,
                    },
                    contact: {
                        phone: data.phone,
                        email: '',
                    },
                    workingHours: [
                        { day: 'Lunes - Viernes', hours: '09:00 - 17:00' },
                        { day: 'Sábado', hours: 'Cerrado' },
                        { day: 'Domingo', hours: 'Cerrado' },
                    ],
                    servicesOffered: [],
                }],
                image: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
                reviews: [],
                announcements: [],
                offers: [],
                claims: [],
                documents: [],
                yearEstablished: new Date().getFullYear(),
                isVerified: false,
                isFeatured: false,
                createdAt: new Date().toISOString(),
                gallery: [],
            };
            batch.set(docRef, newBusiness);
        });

        await batch.commit();

        revalidatePath('/admin/companies');
        revalidatePath('/companies');
        return { success: true, count: businesses.length };
    } catch (error) {
        console.error("Error bulk creating local businesses:", error);
        return { success: false, message: 'An unknown error occurred during bulk upload.' };
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
    const claimsCol = collection(db, 'claims');
    const companyDoc = await getDoc(doc(db, 'companies', args.companyId));
    if (!companyDoc.exists()) {
      return { success: false, message: 'La empresa no existe.' };
    }
    const companyData = companyDoc.data() as Company;

    if (companyData.ownerId) {
       return { success: false, message: 'Esta empresa ya ha sido reclamada.' };
    }

    // Only a still-pending claim blocks resubmission — a prior rejection
    // shouldn't permanently lock the user out of ever claiming this company.
    const existingClaimQuery = query(claimsCol, where('userId', '==', args.userId), where('companyId', '==', args.companyId), where('status', '==', 'pending'));
    const existingClaims = await getDocs(existingClaimQuery);

    if (!existingClaims.empty) {
        return { success: false, message: 'Ya tiene una reclamación pendiente para esta empresa.' };
    }
    
    const newClaim: Omit<Claim, 'id'> = {
      ...args,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const claimDoc = await addDoc(claimsCol, newClaim);

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
    const claimRef = doc(db, 'claims', claimId);
    const companyRef = doc(db, 'companies', companyId);
    const claimSnap = await getDoc(claimRef);
    if (!claimSnap.exists()) throw new Error("Claim not found");
    const claimData = claimSnap.data() as Claim;

    const newStatus = approve ? 'approved' : 'rejected';

    const batch = writeBatch(db);
    const notificationsCol = collection(db, 'notifications');

    batch.update(claimRef, { status: newStatus });

    if (approve) {
      batch.update(companyRef, { ownerId: userId });

      batch.set(doc(notificationsCol), {
          userId: userId,
          message: `Su reclamación para la empresa "${claimData.companyName}" ha sido aprobada.`,
          link: `/dashboard`,
          isRead: false,
          createdAt: new Date().toISOString(),
      });

      // Any other still-pending claims on this company are now moot — reject
      // them too, so a stale duplicate can't later overwrite the new owner.
      const otherPendingQuery = query(
        collection(db, 'claims'),
        where('companyId', '==', companyId),
        where('status', '==', 'pending')
      );
      const otherPendingSnap = await getDocs(otherPendingQuery);
      otherPendingSnap.docs.forEach(otherDoc => {
        if (otherDoc.id === claimId) return;
        const otherClaim = otherDoc.data() as Claim;
        batch.update(otherDoc.ref, { status: 'rejected' });
        batch.set(doc(notificationsCol), {
            userId: otherClaim.userId,
            message: `Su reclamación para la empresa "${otherClaim.companyName}" ha sido rechazada porque otra reclamación fue aprobada.`,
            link: `/companies/${companyId}`,
            isRead: false,
            createdAt: new Date().toISOString(),
        });
      });
    } else {
      batch.set(doc(notificationsCol), {
          userId: claimData.userId,
          message: `Su reclamación para la empresa "${claimData.companyName}" ha sido rechazada.`,
          link: `/companies/${companyId}`,
          isRead: false,
          createdAt: new Date().toISOString(),
      });
    }

    await batch.commit();

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
    if (!postData.authorId || !postData.title || !postData.content || !postData.excerpt) {
        throw new Error("Missing required post data.");
    }
    const userDoc = await getDoc(doc(db, 'users', postData.authorId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const authorData = userDoc.data();
    const authorName = authorData.displayName;


    let imageUrl = postData.featuredImage;
    if (!imageUrl || imageUrl.trim() === '') {
      imageUrl = `https://placehold.co/1200x630/459650/FFFFFF?text=${encodeURIComponent(postData.title)}`;
    }
    
    const now = new Date().toISOString();
    const newPost: Omit<Post, 'id' | 'author'> = {
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt,
      status: postData.status || 'pending',
      featuredImage: imageUrl,
      imageDescription: postData.imageDescription || '',
      authorId: postData.authorId,
      authorName,
      category: postData.category || '',
      createdAt: now,
      updatedAt: now,
      slug: postData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
      comments: [],
    };

    const postRef = await addDoc(collection(db, 'posts'), newPost);
    
    revalidatePath('/admin/contribuciones');
    revalidatePath('/contribuciones');
    revalidatePath('/dashboard');

    return { success: true, postId: postRef.id };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, message: 'Failed to create post' };
  }
}

export async function updatePost(postId: string, postData: Partial<UnsavedPost>, currentImageUrl: string) {
  try {
    const postRef = doc(db, 'posts', postId);
    const originalPostSnap = await getDoc(postRef);
    if (!originalPostSnap.exists()) throw new Error("Post not found");
    const originalPost = originalPostSnap.data() as Post;

    const updatePayload: any = { ...postData, updatedAt: new Date().toISOString() };
    
    if (postData.authorId && originalPost.authorId !== postData.authorId) {
        const userDoc = await getDoc(doc(db, 'users', postData.authorId));
        if (userDoc.exists()) {
            updatePayload.authorName = userDoc.data().displayName;
        }
    }


    if (postData.title && postData.title !== originalPost.title) {
        updatePayload.title = postData.title;
        updatePayload.slug = postData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    if (postData.featuredImage && postData.featuredImage.startsWith('data:image')) {
      updatePayload.featuredImage = postData.featuredImage;
    } else if (postData.featuredImage === '') { // Image was removed
      updatePayload.featuredImage = `https://placehold.co/1200x630/459650/FFFFFF?text=${encodeURIComponent(updatePayload.title || originalPost.title)}`;
    } else {
      // Keep the existing image if no new one is provided
      delete updatePayload.featuredImage;
    }


    await updateDoc(postRef, updatePayload);

    revalidatePath('/admin/contribuciones');
    revalidatePath('/dashboard');
    revalidatePath(`/contribuciones/${postId}`);
    revalidatePath(`/contribuciones/${updatePayload.slug || originalPost.slug}`);


    return { success: true };
  } catch (error) {
    console.error('Error updating post:', error);
    return { success: false, message: 'Failed to update post' };
  }
}

export async function deletePost(postId: string) {
    try {
        const postRef = doc(db, 'posts', postId);
        await deleteDoc(postRef);
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
    const postRef = doc(db, "posts", postId);
    const newComment: PostComment = {
      id: uuidv4(),
      userId,
      authorName,
      comment,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
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
    // VALIDATION REMOVED: The incorrect check for 'data:' has been removed.
    if (!documentData.url) {
        throw new Error("No file URL provided.");
    }
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    if (!companySnap.exists()) {
      throw new Error('Company not found');
    }
    
    const newDocument: Document = {
      id: uuidv4(),
      name: documentData.name,
      url: documentData.url,
      // The 'size' is now correctly included
      size: documentData.size, 
      createdAt: new Date().toISOString(),
    };

    await updateDoc(companyRef, {
      documents: arrayUnion(newDocument)
    });

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
        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);
        if (!companySnap.exists()) {
            throw new Error("Company not found");
        }
        
        const companyData = companySnap.data() as Company;
        const documentToDelete = companyData.documents?.find(d => d.id === documentId);
        
        if (!documentToDelete) {
            throw new Error("Document not found in company list");
        }

        // FIX: Delete file from Firebase Storage
        if (documentToDelete.url) {
            const fileRef = ref(storage, documentToDelete.url);
            await deleteObject(fileRef);
        }
        
        await updateDoc(companyRef, {
            documents: arrayRemove(documentToDelete)
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
        const settingsRef = doc(db, 'settings', 'main');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
             await updateDoc(settingsRef, {
                cities: arrayUnion(city)
            });
        } else {
            await setDoc(settingsRef, { cities: [city] });
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
        const settingsRef = doc(db, 'settings', 'main');
        await updateDoc(settingsRef, {
            cities: arrayRemove(city)
        });
        revalidatePath('/admin/locations');
        return { success: true };
    } catch (e: any) {
        console.error("Error deleting city: ", e);
        return { success: false, message: e.message };
    }
}


export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<{success: boolean, message?: string}> {
    try {
        const settingsRef = doc(db, 'settings', 'main');
        await setDoc(settingsRef, settings, { merge: true });

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
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            notificationSettings: settings
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
  const companiesCol = collection(db, 'companies');
  const q = query(companiesCol, orderBy('name'), limit(queryLimit || 10));
  const snapshot = await getDocs(q);
  const allCompanies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));

  const lowerCaseQuery = searchQuery.toLowerCase();
  
  return allCompanies
    .filter(company => 
      company.name.toLowerCase().includes(lowerCaseQuery) ||
      company.category.toLowerCase().includes(lowerCaseQuery) ||
      company.description.toLowerCase().includes(lowerCaseQuery)
    )
    .map(({ id, name, category, description }) => ({ id, name, category, description }));
}

export async function findProcedures({ query: searchQuery, limit: queryLimit }: { query: string; limit?: number }) {
  const proceduresCol = collection(db, 'procedures');
  const q = query(proceduresCol, orderBy('name'), limit(queryLimit || 10));
  const snapshot = await getDocs(q);
  const allProcedures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Procedure));
  
  const lowerCaseQuery = searchQuery.toLowerCase();
  
  return allProcedures
    .filter(proc =>
      proc.name.toLowerCase().includes(lowerCaseQuery) ||
      proc.category.toLowerCase().includes(lowerCaseQuery) ||
      proc.description.toLowerCase().includes(lowerCaseQuery)
    )
    .map(({ id, name, category, description, institution }) => ({ id, name, category, description, institution }));
}
