
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { 
    getAuth, 
    onAuthStateChanged, 
    User, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from "firebase/firestore";
import type { AppUser } from "@/lib/types";
import { signupUser } from "@/lib/actions";


export interface Favorites {
    companies: string[];
    procedures: string[];
    institutions: string[];
}

export interface Subscriptions {
    companies: string[];
    categories: string[];
}

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    isAdmin: boolean;
    isManager: boolean;
    isEditor: boolean;
    isPremium: boolean;
    favorites: Favorites;
    addFavorite: (type: 'company' | 'procedure' | 'institution', id: string) => Promise<void>;
    removeFavorite: (type: 'company' | 'procedure' | 'institution', id: string) => Promise<void>;
    isFavorite: (type: 'company' | 'procedure' | 'institution', id: string) => boolean;
    subscriptions: Subscriptions;
    addSubscription: (type: 'company' | 'category', id: string) => Promise<void>;
    removeSubscription: (type: 'company' | 'category', id: string) => Promise<void>;
    isSubscribed: (type: 'company' | 'category', id: string) => boolean;
    signup: (email: string, password: string, displayName: string) => Promise<void>;
    signin: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [isEditor, setIsEditor] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [favorites, setFavorites] = useState<Favorites>({ companies: [], procedures: [], institutions: [] });
    const [subscriptions, setSubscriptions] = useState<Subscriptions>({ companies: [], categories: [] });


     const handleUser = async (firebaseUser: User | null) => {
        if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            let userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // This is a new user (likely from Google Sign In), create their record
                const result = await signupUser(firebaseUser.email!, 'password-not-needed', firebaseUser.displayName!, firebaseUser.uid);
                if(!result.success) {
                    console.error("Failed to create user document for Google Sign-In user.");
                    // Sign out the user if doc creation fails to prevent inconsistent state
                    await signOut(auth);
                    return;
                }

                // Create a welcome notification for new users
                const notificationsCol = collection(db, 'notifications');
                const newNotifRef = doc(notificationsCol);
                 await setDoc(newNotifRef, {
                    userId: firebaseUser.uid,
                    message: `¡Bienvenido a Oltinde, ${firebaseUser.displayName}! Estamos contentos de tenerte aquí.`,
                    link: `/profile`,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                });

                // Re-fetch the doc after creating it
                userDoc = await getDoc(userDocRef);
            }
            
            const data = userDoc.data() as AppUser;
            setFavorites({
                companies: data.favorites?.companies || [],
                procedures: data.favorites?.procedures || [],
                institutions: data.favorites?.institutions || []
            });
             setSubscriptions({
                companies: data.subscriptions?.companies || [],
                categories: data.subscriptions?.categories || [],
            });
            setIsAdmin(data.role === 'admin');
            setIsManager(data.role === 'manager');
            setIsEditor(data.role === 'editor');
            setIsPremium(data.isPremium || false);
            setUser({ ...firebaseUser, ...data });

        } else {
            setFavorites({ companies: [], procedures: [], institutions: [] });
            setSubscriptions({ companies: [], categories: [] });
            setIsAdmin(false);
            setIsManager(false);
            setIsEditor(false);
            setIsPremium(false);
            setUser(null);
        }
        setLoading(false);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, handleUser);
        return () => unsubscribe();
    }, []);

    const signup = async (email: string, password: string, displayName: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
            const result = await signupUser(email, password, displayName, userCredential.user.uid);
            if (!result.success) {
                throw new Error(result.message);
            }

            // Send email verification
            await sendEmailVerification(userCredential.user);
            
            // Manually update local state after creating doc
            setIsAdmin(result.role === 'admin');
            setIsManager(result.role === 'manager');
            setIsEditor(result.role === 'editor');
            setIsPremium(false);
            setUser({ ...userCredential.user, displayName, role: result.role } as AppUser);
        }
    };

    const signin = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged will handle the user creation/update via handleUser
    };

    const signout = async () => {
        await signOut(auth);
    };

    const getFavoritesField = (type: 'company' | 'procedure' | 'institution'): keyof Favorites => {
        if (type === 'company') return 'companies';
        if (type === 'procedure') return 'procedures';
        return 'institutions';
    };

    const addFavorite = async (type: 'company' | 'procedure' | 'institution', id: string) => {
        if (!user) return;
        const userDocRef = doc(db, "users", user.uid);
        const field = `favorites.${getFavoritesField(type)}`;
        await updateDoc(userDocRef, { [field]: arrayUnion(id) });
        const favKey = getFavoritesField(type);
        setFavorites(prev => ({
            ...prev,
            [favKey]: [...prev[favKey], id]
        }));
    };

    const removeFavorite = async (type: 'company' | 'procedure' | 'institution', id: string) => {
        if (!user) return;
        const userDocRef = doc(db, "users", user.uid);
        const field = `favorites.${getFavoritesField(type)}`;
        await updateDoc(userDocRef, { [field]: arrayRemove(id) });
        const favKey = getFavoritesField(type);
        setFavorites(prev => ({
            ...prev,
            [favKey]: prev[favKey].filter(favId => favId !== id)
        }));
    };

    const isFavorite = useCallback((type: 'company' | 'procedure' | 'institution', id: string) => {
        const favKey = getFavoritesField(type);
        return favorites[favKey].includes(id);
    }, [favorites]);

    const getSubscriptionsField = (type: 'company' | 'category'): keyof Subscriptions => {
        if (type === 'company') return 'companies';
        return 'categories';
    };

    const addSubscription = async (type: 'company' | 'category', id: string) => {
        if (!user) return;
        const userDocRef = doc(db, "users", user.uid);
        const field = `subscriptions.${getSubscriptionsField(type)}`;
        await updateDoc(userDocRef, { [field]: arrayUnion(id) });
        const subKey = getSubscriptionsField(type);
        setSubscriptions(prev => ({
            ...prev,
            [subKey]: [...prev[subKey], id]
        }));
    };

    const removeSubscription = async (type: 'company' | 'category', id: string) => {
        if (!user) return;
        const userDocRef = doc(db, "users", user.uid);
        const field = `subscriptions.${getSubscriptionsField(type)}`;
        await updateDoc(userDocRef, { [field]: arrayRemove(id) });
        const subKey = getSubscriptionsField(type);
        setSubscriptions(prev => ({
            ...prev,
            [subKey]: prev[subKey].filter(subId => subId !== id)
        }));
    };

    const isSubscribed = useCallback((type: 'company' | 'category', id: string) => {
        const subKey = getSubscriptionsField(type);
        return subscriptions[subKey].includes(id);
    }, [subscriptions]);


    const value = {
        user,
        loading,
        isAdmin,
        isManager,
        isEditor,
        isPremium,
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        subscriptions,
        addSubscription,
        removeSubscription,
        isSubscribed,
        signup,
        signin,
        signInWithGoogle,
        signout,
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
