// src/hooks/use-auth.tsx
"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUser({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
           await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${firebaseUser.displayName?.charAt(0)}`,
            createdAt: new Date().toISOString(),
            role: 'customer', 
          });
          const newUserDoc = await getDoc(userRef);
          setUser({ id: newUserDoc.id, ...newUserDoc.data() } as UserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
        setUser({ id: firebaseUser.uid, ...newUserProfile });
         toast({
            title: "Registration Successful",
            description: "Welcome to ClipperConnect!",
        });
      } else {
        const userProfile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
         // If user exists, just update their role if it's different.
        if (role && userProfile.role !== role) {
             await updateDoc(userRef, { role: role });
             userProfile.role = role;
        }
        setUser(userProfile);
        toast({
            title: "Login Successful",
            description: "Welcome back!",
        });
      }
  }

  const loginWithGoogle = async (role: 'customer' | 'barber' = 'customer') => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createFirestoreUser(result.user, role);
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      toast({
        variant: "destructive",
        title: "Sign-in Failed",
        description: error.message || "Could not sign you in with Google. Please try again.",
      });
    } finally {
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
    } finally {
        setLoading(false);
    }
  }
  
  const loginWithEmailAndPassword = async (email: string, pass: string) => {
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will handle setting the user state
    } catch (error: any) {
         console.error("Error during Email/Password sign-in:", error);
        toast({
            variant: "destructive",
            title: "Sign-in Failed",
            description: error.message || "Could not sign you in. Please check your credentials.",
        });
    } finally {
        setLoading(false);
    }
  }


  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      router.push("/login"); 
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
       console.error("Error during logout:", error);
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Could not log you out. Please try again.",
      });
    } finally {
        setLoading(false);
    }
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
