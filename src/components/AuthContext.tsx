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

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: string) => Promise<void>;
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
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data());
          } else {
            // New user registration or missing doc
            // We use a default profile if it's not present yet
            // (mostly for Google sign-in where we might not have a signUp step)
            const newProfileData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: 'patient',
              status: 'activated',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', user.uid), newProfileData);
            setProfile({
              ...newProfileData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Profile fetch error:", err);
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

  const signInAsDemo = async () => {
    const demoEmail = 'demo@medimap.cm';
    const demoPass = 'Medimap123!';
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // Try to sign up if the demo user does not exist yet
        await signUpWithEmail(demoEmail, demoPass, 'Patient Démo', 'patient');
      } else {
        throw err;
      }
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

  const signUpWithEmail = async (email: string, pass: string, name: string, role: string) => {
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
      
      const newProfileData = {
        uid: userCredential.user.uid,
        email: email,
        displayName: name,
        photoURL: null,
        role: role || 'patient',
        status: (role || 'patient') === 'pharmacist' ? 'pending_technical_file' : 'activated',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), newProfileData);
      setProfile({
        ...newProfileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
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
    await setDoc(userRef, { ...newData, updatedAt: serverTimestamp() }, { merge: true });
    setProfile((prev: any) => ({ ...prev, ...newData, updatedAt: new Date().toISOString() }));
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
