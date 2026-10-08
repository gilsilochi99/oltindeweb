// Mirrors src/hooks/use-auth.tsx in the web app: Firebase Auth for sign-in,
// and the profile, role flags, favorites and subscriptions from the web
// app's MySQL database — loaded (and created on first sign-in, with the
// welcome notification) by the same server functions the website uses,
// through /api/mobile/rpc.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth } from '../lib/firebase';
import { rpc } from '../lib/api';
import type { AppUser, Favorites, FavoriteType, Subscriptions } from '../lib/types';
import { forgetPushDevice } from './use-push-notifications';

WebBrowser.maybeCompleteAuthSession();

// From Firebase Console > Authentication > Sign-in method > Google > Web SDK
// configuration, for the oltindeapp project — the same client used by
// app.json's (now-dormant) native Google Sign-In plugin config. Must also be
// added as an authorized redirect URI in Google Cloud Console for the OAuth
// flow to complete inside Expo Go.
const GOOGLE_WEB_CLIENT_ID = '474863252478-jomr6q4ich3lgajpna5meoa0rv00498p.apps.googleusercontent.com';

const EMPTY_FAVORITES: Favorites = {
  companies: [],
  procedures: [],
  institutions: [],
  jobs: [],
  events: [],
  places: [],
  itineraries: [],
  professionals: [],
};

const EMPTY_SUBSCRIPTIONS: Subscriptions = { companies: [], categories: [] };

export type AuthUser = User & AppUser;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isEditor: boolean;
  isPharmacist: boolean;
  isPremium: boolean;
  favorites: Favorites;
  addFavorite: (type: FavoriteType, id: string) => Promise<void>;
  removeFavorite: (type: FavoriteType, id: string) => Promise<void>;
  isFavorite: (type: FavoriteType, id: string) => boolean;
  subscriptions: Subscriptions;
  addSubscription: (type: 'company' | 'category', id: string) => Promise<void>;
  removeSubscription: (type: 'company' | 'category', id: string) => Promise<void>;
  isSubscribed: (type: 'company' | 'category', id: string) => boolean;
  signup: (email: string, password: string, displayName: string) => Promise<{ verificationEmailSent: boolean }>;
  signin: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getFavoritesField(type: FavoriteType): keyof Favorites {
  if (type === 'company') return 'companies';
  if (type === 'procedure') return 'procedures';
  if (type === 'job') return 'jobs';
  if (type === 'event') return 'events';
  if (type === 'place') return 'places';
  if (type === 'itinerary') return 'itineraries';
  if (type === 'professional') return 'professionals';
  return 'institutions';
}

function getSubscriptionsField(type: 'company' | 'category'): keyof Subscriptions {
  return type === 'company' ? 'companies' : 'categories';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isPharmacist, setIsPharmacist] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [favorites, setFavorites] = useState<Favorites>(EMPTY_FAVORITES);
  const [subscriptions, setSubscriptions] = useState<Subscriptions>(EMPTY_SUBSCRIPTIONS);

  // Browser-based OAuth flow (Expo Go / any client): request.promptAsync()
  // opens a system browser tab for Google's consent screen and redirects
  // back into the app; the resulting id_token is exchanged for a Firebase
  // credential in the effect below. Replaces the native
  // @react-native-google-signin popup used when running a custom dev client.
  // expo-auth-session throws synchronously at hook-init time (crashing the
  // whole app, not just Google sign-in) if the client ID for the *current*
  // native platform isn't set — webClientId alone isn't enough on Android or
  // iOS, even inside Expo Go. We don't have separate platform-specific OAuth
  // clients yet, so reuse the web client ID everywhere as a stopgap: this
  // keeps the app from crashing on mount, and Google sign-in itself (a
  // secondary auth path — email/password already works standalone) can be
  // revisited with real per-platform client IDs before Phase 2's native build.
  const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params.id_token) {
      const credential = GoogleAuthProvider.credential(googleResponse.params.id_token);
      signInWithCredential(auth, credential).catch((error) => {
        console.error('Error completing Google sign-in:', error);
      });
    }
  }, [googleResponse]);

  const handleUser = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      try {
        const data = await rpc<AppUser | null>('ensureMyProfile');
        if (!data) throw new Error('No se pudo verificar la sesión.');
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
        // Hierarchical, matching the web app's isManagerRole/isEditorRole/isPharmacistRole
        // helpers exactly: each higher role also satisfies the lower-role checks.
        setIsAdmin(data.role === 'admin');
        setIsManager(data.role === 'admin' || data.role === 'manager');
        setIsEditor(data.role === 'admin' || data.role === 'manager' || data.role === 'editor');
        setIsPharmacist(data.role === 'admin' || data.role === 'manager' || data.role === 'pharmacist');
        setIsPremium(data.isPremium || false);
        setUser({ ...firebaseUser, ...data } as AuthUser);
      } catch (error) {
        console.error('Error loading/creating user profile:', error);
        setUser({
          ...firebaseUser,
          id: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Usuario',
          email: firebaseUser.email || '',
          favorites: EMPTY_FAVORITES,
          subscriptions: EMPTY_SUBSCRIPTIONS,
        } as AuthUser);
      }
    } else {
      setFavorites(EMPTY_FAVORITES);
      setSubscriptions(EMPTY_SUBSCRIPTIONS);
      setIsAdmin(false);
      setIsManager(false);
      setIsEditor(false);
      setIsPharmacist(false);
      setIsPremium(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return unsubscribe;
  }, [handleUser]);

  const signup = async (email: string, password: string, displayName: string) => {
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
      }
      console.error('Error al crear la cuenta:', error);
      throw new Error('Ocurrió un error inesperado al registrarse. Por favor, inténtelo de nuevo.');
    }

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

  // Opens a system browser tab for Google's consent screen; completion is
  // handled by the useEffect above once googleResponse resolves, so this
  // just needs to trigger the prompt (and surface the "user closed it"
  // case as an error the caller's try/catch can show).
  const signInWithGoogle = async () => {
    if (!googleRequest) {
      throw new Error('El inicio de sesión con Google todavía se está preparando. Inténtalo de nuevo en un momento.');
    }
    const result = await promptGoogleSignIn();
    if (result.type !== 'success') {
      throw new Error('Inicio de sesión con Google cancelado.');
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signout = async () => {
    await forgetPushDevice(); // stop this phone receiving the account's notifications
    await signOut(auth);
  };

  const addFavorite = async (type: FavoriteType, id: string) => {
    if (!user) return;
    await rpc('setFavorite', type, id, true);
    const favKey = getFavoritesField(type);
    setFavorites((prev) => ({ ...prev, [favKey]: [...prev[favKey], id] }));
  };

  const removeFavorite = async (type: FavoriteType, id: string) => {
    if (!user) return;
    await rpc('setFavorite', type, id, false);
    const favKey = getFavoritesField(type);
    setFavorites((prev) => ({ ...prev, [favKey]: prev[favKey].filter((favId) => favId !== id) }));
  };

  const isFavorite = useCallback(
    (type: FavoriteType, id: string) => favorites[getFavoritesField(type)].includes(id),
    [favorites],
  );

  const addSubscription = async (type: 'company' | 'category', id: string) => {
    if (!user) return;
    await rpc('setSubscription', type, id, true);
    const subKey = getSubscriptionsField(type);
    setSubscriptions((prev) => ({ ...prev, [subKey]: [...prev[subKey], id] }));
  };

  const removeSubscription = async (type: 'company' | 'category', id: string) => {
    if (!user) return;
    await rpc('setSubscription', type, id, false);
    const subKey = getSubscriptionsField(type);
    setSubscriptions((prev) => ({ ...prev, [subKey]: prev[subKey].filter((subId) => subId !== id) }));
  };

  const isSubscribed = useCallback(
    (type: 'company' | 'category', id: string) => subscriptions[getSubscriptionsField(type)].includes(id),
    [subscriptions],
  );

  const value: AuthContextType = {
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
    resetPassword,
    signout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
