
// src/hooks/use-auth.tsx
"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  User as FirebaseUser,
  getIdToken,
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase/firebase";
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "./use-toast";
import { type UserProfile } from "@/lib/firebase/firestore";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: (role?: 'customer' | 'barber') => void;
  loginWithEmailAndPassword: (email: string, pass: string) => void;
  registerWithEmailAndPassword: (email: string, pass: string, displayName: string, role: 'customer'|'barber') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createSession = async (firebaseUser: FirebaseUser) => {
    const idToken = await getIdToken(firebaseUser);
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      throw new Error('Failed to create session');
    }
}

const clearSession = async () => {
    const res = await fetch('/api/auth/session', {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to clear session');
    }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribeFirestore: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen for real-time updates to the user's profile
        unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            // This can happen if the user's Firestore document is deleted
            // but they still have a valid auth session.
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore snapshot error:", error);
          setUser(null);
          setLoading(false);
        });

      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);
  
  const createFirestoreUser = async (firebaseUser: FirebaseUser, role: 'customer' | 'barber' | 'admin', displayName?: string) => {
      const userRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        const newUserProfile: Omit<UserProfile, 'id'> = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: displayName || firebaseUser.displayName!,
            photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(displayName || firebaseUser.displayName)?.charAt(0)}`,
            createdAt: new Date().toISOString(),
            role: role,
        };
        await setDoc(userRef, newUserProfile);
        toast({
          title: "Registration Successful",
          description: "Welcome to ClipperConnect!",
        });
      } else {
        const userProfile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
        // If user exists, just update their role if a specific one was chosen during sign up.
        if (role && userProfile.role !== role) {
             await updateDoc(userRef, { role: role });
        }
        toast({
            title: "Login Successful",
            description: "Welcome back!",
        });
      }

      await createSession(firebaseUser);
  }

  const loginWithGoogle = async (role: 'customer' | 'barber' = 'customer') => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createFirestoreUser(result.user, role, result.user.displayName || undefined);
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      toast({
        variant: "destructive",
        title: "Sign-in Failed",
        description: error.message || "Could not sign you in with Google. Please try again.",
      });
      setLoading(false);
    } 
  };
  
  const registerWithEmailAndPassword = async (email: string, pass: string, displayName: string, role: 'customer'|'barber') => {
    setLoading(true);
    try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(result.user, { displayName });
        await createFirestoreUser(result.user, role, displayName);
    } catch (error: any) {
        console.error("Error during Email/Password registration:", error);
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.message || "Could not register your account. Please try again.",
        });
        setLoading(false);
    }
  }
  
  const loginWithEmailAndPassword = async (email: string, pass: string) => {
    setLoading(true);
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        await createSession(result.user);
    } catch (error: any) {
        console.error("Error during Email/Password sign-in:", error);
        toast({
            variant: "destructive",
            title: "Sign-in Failed",
            description: error.message || "Could not sign you in. Please check your credentials.",
        });
        setLoading(false);
    }
  }

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    await clearSession();
    // onAuthStateChanged will set user to null
    router.push("/login"); 
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    // Final loading state is handled by the auth state listener
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    loginWithEmailAndPassword,
    registerWithEmailAndPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
