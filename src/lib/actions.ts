'''
'use server';

import { revalidatePath } from 'next/cache';
import { db, storage } from './firebase';
import { collection, addDoc, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc, getDocs, writeBatch, query, where, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { Announcement, Company, Institution } from './types';
import { createNotificationsForSubscribers } from './notifications';
import { ref, deleteObject } from "firebase/storage";

// ANNOUNCEMENT ACTIONS
interface AnnouncementData {
    title: string;
    content: string;
    image?: string;
}

async function addGenericAnnouncement(entityId: string, entityType: 'companies' | 'institutions', announcementData: AnnouncementData) {
    try {
        const entityRef = doc(db, entityType, entityId);
        const entitySnap = await getDoc(entityRef);
        if (!entitySnap.exists()) {
            throw new Error(`${entityType === 'companies' ? 'Company' : 'Institution'} not found`);
        }
        const entity = { id: entitySnap.id, ...entitySnap.data() } as Company | Institution;

        const newAnnouncement: Announcement = {
            id: uuidv4(),
            title: announcementData.title,
            content: announcementData.content,
            createdAt: new Date().toISOString(),
            image: announcementData.image || '',
        };

        await updateDoc(entityRef, {
            announcements: arrayUnion(newAnnouncement)
        });

        // Notifications are primarily for companies, but could be extended
        if (entityType === 'companies') {
            await createNotificationsForSubscribers(
                entity as Company, // Type assertion
                { title: newAnnouncement.title, link: `/announcements/${newAnnouncement.id}?entityId=${entityId}&entityType=companies` },
                'announcement'
            );
        }

        revalidatePath(`/${entityType}/${entityId}`);
        revalidatePath(`/dashboard/${entityType.slice(0, -1)}/${entityId}/announcements`);
        revalidatePath('/announcements');

        return { success: true, newAnnouncement };
    } catch (error) {
        console.error(`Error adding announcement to ${entityType}:`, error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function addCompanyAnnouncement(companyId: string, announcementData: AnnouncementData) {
    return addGenericAnnouncement(companyId, 'companies', announcementData);
}

export async function addInstitutionAnnouncement(institutionId: string, announcementData: AnnouncementData) {
    return addGenericAnnouncement(institutionId, 'institutions', announcementData);
}

export async function deleteAnnouncement(entityId: string, announcementId: string, entityType: 'companies' | 'institutions') {
    try {
        const entityRef = doc(db, entityType, entityId);
        const entitySnap = await getDoc(entityRef);
        if (!entitySnap.exists()) {
            throw new Error(`${entityType === 'companies' ? 'Company' : 'Institution'} not found`);
        }
        
        const entityData = entitySnap.data() as Company | Institution;
        const announcementToDelete = entityData.announcements?.find(a => a.id === announcementId);
        
        if (!announcementToDelete) {
            throw new Error("Announcement not found in list");
        }

        // Delete image from storage if it exists
        if (announcementToDelete.image && announcementToDelete.image.includes('firebasestorage')) {
            const imageRef = ref(storage, announcementToDelete.image);
            try {
                await deleteObject(imageRef);
            } catch (storageError: any) {
                // If file doesn't exist, log it but don't block deletion of DB entry
                if (storageError.code !== 'storage/object-not-found') {
                    console.error("Error deleting announcement image from storage:", storageError);
                    // Decide if you should re-throw or just log. For now, we just log.
                }
            }
        }
        
        await updateDoc(entityRef, {
            announcements: arrayRemove(announcementToDelete)
        });

        revalidatePath(`/${entityType}/${entityId}`);
        revalidatePath(`/dashboard/${entityType.slice(0, -1)}/${entityId}/announcements`);
        revalidatePath('/announcements');

        return { success: true };
    } catch (error) {
        console.error(`Error deleting announcement from ${entityType}:`, error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function updateUserProfile(uid: string, data: { displayName: string, title?: string, socials?: { linkedin?: string, twitter?: string }}) {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            displayName: data.displayName,
            title: data.title,
            socials: data.socials
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

export async function updateUserNotificationSettings(uid: string, settings: { email: { newOffers: boolean, newAnnouncements: boolean } }) {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            notificationSettings: settings
        });
        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        console.error("Error updating user notification settings:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}
''