
'use server';

import { revalidatePath } from 'next/cache';
import { db } from './firebase';
import { collection, addDoc, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc, getDocs, writeBatch, query, where, setDoc, orderBy, limit } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { Branch, Company, Institution, Procedure, Service, Claim, CompanyProduct, Post, Offer, Announcement, Document, Review, PostComment, SiteSettings, Product, AppUser, LegalForm, CompanySize, CapitalOwnership, GeographicScope, CompanyPurpose, FiscalRegime, LocalBusiness } from './types';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { createNotificationsForSubscribers } from './notifications';
import { auth as adminAuth } from './firebase'; // Use the initialized auth instance

interface BranchFormData {
  name: string;
  location: {
    address: string;
    city: string;
  };
  contact: {
    phone: string;
    email?: string;
  };
  workingHours: {
    day: string;
    hours: string;
  }[];
  servicesOffered?: string[];
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
        location: { ...branch.location, lat: 0, lng: 0 }, 
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
      location: { ...branch.location, lat: 0, lng: 0 },
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
    
    // Construct the final gallery array
    const finalGallery = companyData.gallery || [];

    const updatePayload = {
      ...companyData,
      gallery: finalGallery,
    };

    // Handle logo update separately to avoid overwriting with empty/placeholder value
    if (companyData.logo && companyData.logo.startsWith('data:image')) {
        updatePayload.logo = companyData.logo;
    } else if (companyData.logo === '') {
        const companySnap = await getDoc(companyRef);
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
    
    const finalGallery = businessData.gallery || [];
    
    const updatePayload: any = { ...businessData, gallery: finalGallery };
    
    // Handle logo update
    if (businessData.logo && businessData.logo.startsWith('data:image')) {
      updatePayload.logo = businessData.logo;
    } else if (businessData.logo === '') {
        const businessSnap = await getDoc(businessRef);
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
  entityType: 'companies' | 'institutions' | 'procedures';
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
        favorites: { companies: [], procedures: [], institutions: [] },
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
        favorites: { companies: [], procedures: [], institutions: [] },
        subscriptions: { companies: [], categories: [] },
        notificationSettings: {
            email: {
                newOffers: true,
                newAnnouncements: true,
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

type InstitutionFormData = Omit<Institution, 'id' | 'reviews' | 'procedures' | 'image' | 'logo'> & { logo?: string };


export async function createInstitution(institutionData: InstitutionFormData) {
  try {
    const institutionsCol = collection(db, 'institutions');
    let logoUrl = institutionData.logo;
    if (!logoUrl || !logoUrl.startsWith('data:image')) {
       logoUrl = `https://placehold.co/100x100/CCCCCC/000000?text=${institutionData.name.substring(0, 2).toUpperCase()}`;
    }
    
    const newInstitution: Omit<Institution, 'id'> = { 
        ...institutionData,
        logo: logoUrl,
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

    const updateData = {...institutionData, logo: newLogoUrl};

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

    const existingClaimQuery = query(claimsCol, where('userId', '==', args.userId), where('companyId', '==', args.companyId));
    const existingClaims = await getDocs(existingClaimQuery);

    if (!existingClaims.empty) {
        return { success: false, message: 'Ya ha enviado una reclamación para esta empresa.' };
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
    
    const newStatus = approve ? 'approved' : 'rejected';

    const batch = writeBatch(db);

    batch.update(claimRef, { status: newStatus });
    
    if (approve) {
      batch.update(companyRef, { ownerId: userId });

      // Notify the user of approval
      const notificationsCol = collection(db, 'notifications');
      const newNotifRef = doc(notificationsCol);
      batch.set(newNotifRef, {
          userId: userId,
          message: `Su reclamación para la empresa "${claimSnap.data().companyName}" ha sido aprobada.`,
          link: `/dashboard`,
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

export async function addDocument(companyId: string, documentData: { name: string; url: string }) {
  try {
    if (!documentData.url || !documentData.url.startsWith('data:')) {
        throw new Error("No file data provided or invalid format.");
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
      createdAt: new Date().toISOString(),
    };

    await updateDoc(companyRef, {
      documents: arrayUnion(newDocument)
    });

    revalidatePath(`/companies/${companyId}`);
    revalidatePath(`/dashboard/${companyId}/documents`);

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
        
        await updateDoc(companyRef, {
            documents: arrayRemove(documentToDelete)
        });

        revalidatePath(`/companies/${companyId}`);
        revalidatePath(`/dashboard/${companyId}/documents`);

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
