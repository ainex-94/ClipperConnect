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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This listener handles auth state changes (login/logout)
    const unsubscribeAuthState = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in. Fetch their profile.
        // We set loading to false after the first fetch inside the onSnapshot listener.
        const userRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setUser({ id: docSnap.id, ...docSnap.data() } as UserProfile);
            } else {
                // This case should ideally be handled during registration, but as a fallback:
                createFirestoreUser(firebaseUser, 'customer', firebaseUser.displayName || 'New User');
            }
            // Set loading to false only once after we get the first user data snapshot
            if (loading) {
                setLoading(false);
            }
        });
        return () => unsubscribeFirestore(); // Cleanup Firestore listener
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuthState(); // Cleanup auth listener
  }, []); // The empty dependency array ensures this effect runs only once on mount.
  
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
         // If user exists, just update their role if it's different.
        if (role && userProfile.role !== role) {
             await updateDoc(userRef, { role: role });
        }
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
      await createFirestoreUser(result.user, role, result.user.displayName || undefined);
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      toast({
        variant: "destructive",
        title: "Sign-in Failed",
        description: error.message || "Could not sign you in with Google. Please try again.",
      });
      setLoading(false); // Ensure loading is false on error
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
        setLoading(false); // Ensure loading is false on error
    }
  }
  
  const loginWithEmailAndPassword = async (email: string, pass: string) => {
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will handle setting the user state and loading state.
    } catch (error: any) {
         console.error("Error during Email/Password sign-in:", error);
        toast({
            variant: "destructive",
            title: "Sign-in Failed",
            description: error.message || "Could not sign you in. Please check your credentials.",
        });
        setLoading(false); // Ensure loading is false on error
    }
  }


  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting user to null and loading to false
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
       setLoading(false); // Ensure loading is false on error
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
