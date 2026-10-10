
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
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import type { AppUser } from "@/lib/types";
import { establishSession, clearSession } from "@/lib/session-actions";
import { ensureMyProfile, setFavorite, setSubscription } from "@/lib/account-actions";


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

// handleUser() below builds the exposed `user` as `{ ...firebaseUser, ...data }`
// — the Firebase Auth User merged with the Firestore AppUser profile, with
// AppUser's fields winning on overlap (displayName, email, photoURL...).
// AppUser alone (used as the type for years) doesn't declare `uid` — only
// Firebase's User does — which is why every consumer of `user.uid` needed a
// type-error workaround. This type describes what's actually there.
export type AuthUser = Omit<User, keyof AppUser> & AppUser;

interface AuthContextType {
    user: AuthUser | null;
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
    signup: (email: string, password: string, displayName: string) => Promise<{ verificationEmailSent: boolean }>;
    signin: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
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
            // Server Actions (actions.ts) run server-side and never see this
            // browser session directly — establish a session cookie so they
            // can identify the caller. Force-refresh the ID token since
            // createSessionCookie requires one issued within the last 5 min.
            // If that fails, drop whatever cookie is there: it may belong to a
            // different account that signed in earlier in this browser.
            try {
                const idToken = await firebaseUser.getIdToken(true);
                const { success } = await establishSession(idToken);
                if (!success) await clearSession();
            } catch (error) {
                console.error('Error establishing server session:', error);
                await clearSession().catch(() => {});
            }

            // Everything below used to run with no error handling at all: a
            // transient database hiccup on any of these calls threw an
            // unhandled rejection AND skipped setLoading(false) below, which
            // left the whole app stuck on "Cargando..." forever with no
            // visible error — indistinguishable from signup silently failing.
            // Wrapped so a failure here still unblocks the UI with a minimal
            // fallback profile instead of hanging.
            try {
                // Loads the profile, creating it (plus a welcome notification)
                // on first sign-in — server-side, from the session just set.
                const data: AppUser | null = await ensureMyProfile();
                if (!data) throw new Error('No server session');
                // Never show (or act with the role of) another account's profile.
                if (data.id !== firebaseUser.uid) throw new Error('Server session belongs to a different user');
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
            } catch (error) {
                console.error('Error loading/creating user profile:', error);
                // Fall back to a minimal profile derived from the Auth user
                // alone, so the UI can proceed (as a regular, non-premium
                // user) instead of hanging indefinitely.
                setUser({
                    ...firebaseUser,
                    id: firebaseUser.uid,
                    displayName: firebaseUser.displayName || 'Usuario',
                    email: firebaseUser.email || '',
                    favorites: { companies: [], procedures: [], institutions: [], jobs: [], events: [], places: [], itineraries: [], professionals: [] },
                    subscriptions: { companies: [], categories: [] },
                });
            }

        } else {
            // Firebase says nobody is signed in here, so drop any server
            // session cookie too. Otherwise a cookie that outlived the
            // browser's Firebase state (site data cleared, signed out
            // elsewhere, or — in dev — a cookie from another localhost port,
            // since cookies ignore ports) keeps the server acting as that
            // user while the UI shows "Iniciar Sesión".
            clearSession().catch(error => console.error('Error clearing server session:', error));
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

    const signup = async (email: string, password: string, displayName: string): Promise<{ verificationEmailSent: boolean }> => {
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
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

        // The account itself now exists — updateProfile/sendEmailVerification are
        // best-effort from here on. Firebase's verification-email quota is easy to
        // hit, and a failure here previously made a successful signup look like it
        // had failed outright (then "email already in use" on retry).
        try {
            await updateProfile(userCredential.user, { displayName });
        } catch (error) {
            console.error('Error setting display name on signup:', error);
        }
        let verificationEmailSent = true;
        try {
            await sendEmailVerification(userCredential.user);
        } catch (error) {
            console.error('Error sending verification email on signup:', error);
            verificationEmailSent = false;
        }
        return { verificationEmailSent };
    };

    const signin = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    // The server cookie is cleared first and regardless of Firebase: if
    // signOut() threw after the cookie was kept, the server would go on
    // treating this browser as signed in.
    const signout = async () => {
        try {
            await clearSession();
        } finally {
            await signOut(auth);
        }
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
        await setFavorite(type, id, true);
        const favKey = getFavoritesField(type);
        setFavorites(prev => ({
            ...prev,
            [favKey]: [...prev[favKey], id]
        }));
    };

    const removeFavorite = async (type: 'company' | 'procedure' | 'institution' | 'job' | 'event' | 'place' | 'itinerary' | 'professional', id: string) => {
        if (!user) return;
        await setFavorite(type, id, false);
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
        await setSubscription(type, id, true);
        const subKey = getSubscriptionsField(type);
        setSubscriptions(prev => ({
            ...prev,
            [subKey]: [...prev[subKey], id]
        }));
    };

    const removeSubscription = async (type: 'company' | 'category', id: string) => {
        if (!user) return;
        await setSubscription(type, id, false);
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

    // Account areas wait for Firebase so their pages never see a signed-out
    // flash. Public pages render straight away (also on the server), so search
    // engines and link previews get the full HTML instead of an empty body.
    const pathname = usePathname() ?? '/';
    const waitForAuth = PRIVATE_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));

    return <AuthContext.Provider value={value}>{(!loading || !waitForAuth) && children}</AuthContext.Provider>;
}

const PRIVATE_PREFIXES = [
    '/dashboard', '/admin', '/profile', '/favorites', '/notifications', '/checkout',
    '/tienda/checkout', '/tienda/deseos', '/places/suggest',
    '/signin', '/signup', '/reset-password',
];

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
