import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  DEMO_ACCOUNTS,
  DEMO_ENABLED,
  DEMO_PASSWORD,
  getRole,
  isProfessionalRole,
  type Role,
} from '../lib/roles';

/** Demo emails map to their role so a demo login lands on the right interface. */
const DEMO_ROLE_BY_EMAIL = new Map<string, Role>(DEMO_ACCOUNTS.map((a) => [a.email, a.role]));

function roleForEmail(email: string | null | undefined): Role {
  return (email && DEMO_ROLE_BY_EMAIL.get(email)) || 'patient';
}

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: (role?: Role) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    role: string,
    establishmentName?: string
  ) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (newData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let cached = null;
        try {
          const cachedStr = localStorage.getItem(`dokta_profile_${user.uid}`);
          if (cachedStr) {
            cached = JSON.parse(cachedStr);
            setProfile(cached);
          }
        } catch (e) {
          console.error("Failed to parse cached profile", e);
        }

        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            setProfile(data);
            try {
              localStorage.setItem(`dokta_profile_${user.uid}`, JSON.stringify(data));
            } catch (e) {}
          } else {
            // New user registration or missing doc
            // We use a default profile if it's not present yet
            // (mostly for Google sign-in where we might not have a signUp step)
            const newProfileData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: roleForEmail(user.email),
              status: 'activated',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            try {
              await setDoc(doc(db, 'users', user.uid), newProfileData);
            } catch (setErr) {
              console.warn("Failed to write user profile to Firestore (offline fallback active):", setErr);
            }
            const localProfile = {
              ...newProfileData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setProfile(localProfile);
            try {
              localStorage.setItem(`dokta_profile_${user.uid}`, JSON.stringify(localProfile));
            } catch (e) {}
          }
        } catch (err) {
          console.error("Profile fetch error (using cache/fallback):", err);
          if (!cached) {
            const fallbackProfile = {
              uid: user.uid,
              email: user.email || 'demo@dokta.cm',
              displayName: user.displayName || user.email?.split('@')[0] || 'Utilisateur Démo',
              photoURL: user.photoURL || null,
              role: roleForEmail(user.email),
              status: 'activated',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              _offlineFallback: true
            };
            setProfile(fallbackProfile);
            try {
              localStorage.setItem(`dokta_profile_${user.uid}`, JSON.stringify(fallbackProfile));
            } catch (e) {}
          }
        }
      } else {
        setProfile(null);
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  /**
   * Signs into the shared demo account for a role, provisioning it on first
   * use. Demo accounts are activated immediately — they skip the document
   * review a real professional goes through, so the interface is browsable.
   */
  const signInAsDemo = async (role: Role = 'patient') => {
    if (!DEMO_ENABLED) {
      throw new Error("Les comptes de démonstration sont désactivés sur cet environnement.");
    }

    const account = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (!account) throw new Error(`Aucun compte de démonstration pour le rôle « ${role} ».`);

    try {
      await signInWithEmailAndPassword(auth, account.email, DEMO_PASSWORD);
    } catch (err: any) {
      const missing =
        err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential';
      if (!missing) throw err;

      await signUpWithEmail(
        account.email,
        DEMO_PASSWORD,
        account.displayName,
        role,
        account.establishmentName,
        { activated: true }
      );
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        // Standard spread triggers React update
        setUser({ ...auth.currentUser } as User);
        console.log("User reloaded, emailVerified:", auth.currentUser.emailVerified);
      } catch (err: any) {
        // If it's a network error, we don't necessarily want to crash the UI
        // especially during background checks
        if (err.code === 'auth/network-request-failed') {
          console.warn("Network request failed during user refresh. Retrying later...");
          return;
        }
        console.error("Failed to reload user:", err);
        throw err;
      }
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: string,
    establishmentName?: string,
    options?: { activated?: boolean }
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Verification email disabled for now
      /*
      try {
        await sendEmailVerification(userCredential.user);
        console.log("Verification email sent to:", email);
      } catch (emailErr) {
        console.error("Failed to send verification email:", emailErr);
      }
      */
      
      const effectiveRole = (role || 'patient') as Role;
      const definition = getRole(effectiveRole);
      // Professionals must clear document review before they can operate; the
      // demo accounts opt out so their interface is immediately browsable.
      const needsReview = definition.isProfessional && !options?.activated;

      const newProfileData: any = {
        uid: userCredential.user.uid,
        email: email,
        displayName: name,
        photoURL: null,
        role: effectiveRole,
        status: needsReview ? 'pending_technical_file' : 'activated',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (isProfessionalRole(effectiveRole) && establishmentName) {
        if (definition.establishmentField) {
          newProfileData[definition.establishmentField] = establishmentName;
        }
        newProfileData.technicalForm = { establishmentName };
      }


      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), newProfileData);
      } catch (err) {
        console.warn("Failed to write profile during signup (offline fallback active):", err);
      }
      const localProfile = {
        ...newProfileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProfile(localProfile);
      try {
        localStorage.setItem(`dokta_profile_${userCredential.user.uid}`, JSON.stringify(localProfile));
      } catch (e) {}
    } catch (error: any) {
      console.error("Auth Error (Signup):", error.code, error.message);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error("L'inscription par email n'est pas encore activée. Veuillez l'activer dans votre console Firebase (Authentication > Sign-in method > Email/Password).");
      }
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Cette adresse email est déjà utilisée par un autre compte.");
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error("Identifiants incorrects. Veuillez vérifier votre email et mot de passe.");
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error("Aucun compte n'est associé à cette adresse email.");
      }
      throw error;
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = () => signOut(auth);

  const updateUserProfile = async (newData: any) => {
    if (!auth.currentUser) throw new Error("Aucun utilisateur connecté.");
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await setDoc(userRef, { ...newData, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn("Failed to update user profile in Firestore (offline fallback active):", err);
    }
    const updated = { ...profile, ...newData, updatedAt: new Date().toISOString() };
    setProfile(updated);
    try {
      localStorage.setItem(`dokta_profile_${auth.currentUser.uid}`, JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInAsDemo, signUpWithEmail, signInWithEmail, resetPassword, logout, resendVerification, refreshUser, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
