
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


export interface Favorites {
    companies: string[];
    procedures: string[];
    institutions: string[];
    jobs: string[];
    events: string[];
    places: string[];
    itineraries: string[];
    professionals: string[];
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
    isPharmacist: boolean;
    isPremium: boolean;
    favorites: Favorites;
    addFavorite: (type: 'company' | 'procedure' | 'institution' | 'job' | 'event' | 'place' | 'itinerary' | 'professional', id: string) => Promise<void>;
    removeFavorite: (type: 'company' | 'procedure' | 'institution' | 'job' | 'event' | 'place' | 'itinerary' | 'professional', id: string) => Promise<void>;
    isFavorite: (type: 'company' | 'procedure' | 'institution' | 'job' | 'event' | 'place' | 'itinerary' | 'professional', id: string) => boolean;
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
    const [isPharmacist, setIsPharmacist] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [favorites, setFavorites] = useState<Favorites>({ companies: [], procedures: [], institutions: [], jobs: [], events: [], places: [], itineraries: [], professionals: [] });
    const [subscriptions, setSubscriptions] = useState<Subscriptions>({ companies: [], categories: [] });


     const handleUser = async (firebaseUser: User | null) => {
        if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            let userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // New user (Google Sign In or first time)
                const usersCollectionRef = collection(db, "users");
                const snapshot = await getDocs(usersCollectionRef);
                const isFirstUser = snapshot.empty;

                const newUser: AppUser = {
                    id: firebaseUser.uid,
                    uid: firebaseUser.uid,
                    email: firebaseUser.email!,
                    displayName: firebaseUser.displayName || 'Usuario',
                    role: isFirstUser ? 'admin' : 'user',
                    isPremium: false,
                    createdAt: new Date().toISOString(),
                    favorites: { companies: [], procedures: [], institutions: [], jobs: [], events: [], places: [], itineraries: [], professionals: [] },
                    subscriptions: { companies: [], categories: [] },
                    photoURL: firebaseUser.photoURL
                };
                await setDoc(userDocRef, newUser);

                // Create a welcome notification
                const newNotifRef = doc(collection(db, 'notifications'));
                 await setDoc(newNotifRef, {
                    userId: firebaseUser.uid,
                    message: `¡Bienvenido a Oltinde, ${newUser.displayName}! Estamos contentos de tenerte aquí.`,
                    link: `/profile`,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                });

                userDoc = await getDoc(userDocRef); // Re-fetch doc
            }
            
            const data = userDoc.data() as AppUser;
            // Merge field-by-field, not `data.favorites || default`: accounts
            // predating a given favorite type (e.g. jobs/events added later)
            // have a `favorites` object that exists but is missing that key,
            // which the all-or-nothing fallback wouldn't catch.
            setFavorites({
                companies: data.favorites?.companies || [],
                procedures: data.favorites?.procedures || [],
                institutions: data.favorites?.institutions || [],
                jobs: data.favorites?.jobs || [],
                events: data.favorites?.events || [],
                places: data.favorites?.places || [],
                itineraries: data.favorites?.itineraries || [],
                professionals: data.favorites?.professionals || [],
            });
             setSubscriptions({
                companies: data.subscriptions?.companies || [],
                categories: data.subscriptions?.categories || [],
            });
            setIsAdmin(data.role === 'admin');
            setIsManager(data.role === 'manager');
            setIsEditor(data.role === 'editor');
            setIsPharmacist(data.role === 'pharmacist');
            setIsPremium(data.isPremium || false);
            setUser({ ...firebaseUser, ...data });

        } else {
            // Reset state on sign out
            setFavorites({ companies: [], procedures: [], institutions: [], jobs: [], events: [], places: [], itineraries: [], professionals: [] });
            setSubscriptions({ companies: [], categories: [] });
            setIsAdmin(false);
            setIsManager(false);
            setIsEditor(false);
            setIsPharmacist(false);
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
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                await updateProfile(userCredential.user, { displayName });
                await sendEmailVerification(userCredential.user);
            }
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('El correo electrónico ya está en uso por otra cuenta.');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('El formato del correo electrónico no es válido.');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('La contraseña es demasiado débil. Debe tener al menos 6 caracteres.');
            } else {
                console.error('Error al crear la cuenta:', error);
                throw new Error('Ocurrió un error inesperado al registrarse. Por favor, inténtelo de nuevo.');
            }
        }
    };

    const signin = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const signout = async () => {
        await signOut(auth);
    };

    const getFavoritesField = (type: 'company' | 'procedure' | 'institution' | 'job' | 'event' | 'place' | 'itinerary' | 'professional'): keyof Favorites => {
        if (type === 'company') return 'companies';
        if (type === 'procedure') return 'procedures';
        if (type === 'job') return 'jobs';
        if (type === 'event') return 'events';
        if (type === 'place') return 'places';
        if (type === 'itinerary') return 'itineraries';
        if (type === 'professional') return 'professionals';
        return 'institutions';
    };

    const addFavorite = async (type: 'company' | 'procedure' | 'institution' | 'job' | 'event' | 'place' | 'itinerary' | 'professional', id: string) => {
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

    const removeFavorite = async (type: 'company' | 'procedure' | 'institution' | 'job' | 'event' | 'place' | 'itinerary' | 'professional', id: string) => {
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

    const isFavorite = useCallback((type: 'company' | 'procedure' | 'institution' | 'job' | 'event' | 'place' | 'itinerary' | 'professional', id: string) => {
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
        isPharmacist,
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
