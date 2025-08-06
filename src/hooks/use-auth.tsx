
// src/hooks/use-auth.tsx
"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  }, []);
  
  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        // No need to set loading to true here, to avoid screen flicker on minor updates
        const userProfile = await fetchUserProfile(firebaseUser);
        setUser(userProfile);
    }
  }, [fetchUserProfile]);


  useEffect(() => {
    let unsubscribeFirestore: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userProfile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
            
            // Centralized access control
            if (userProfile.role !== 'admin' && userProfile.accountStatus !== 'Approved') {
                 // Don't log them out immediately, let the MainLayout handle showing the status screen
                 setUser(userProfile);
            } else {
                setUser(userProfile);
            }

          } else {
            // This can happen briefly during registration
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore snapshot error:", error);
          setUser(null);
          setLoading(false);
        });

      } else {
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
  
  const handleAuthSuccess = async (firebaseUser: FirebaseUser, role?: UserProfile['role']) => {
      // If a role is passed (i.e. during registration), we can make an immediate decision
      if (role === 'admin') {
          router.push('/');
          return;
      }

      const userProfile = await fetchUserProfile(firebaseUser);

      // If we have a full user profile, we can check its status
      if (userProfile && userProfile.role !== 'admin' && userProfile.accountStatus !== 'Approved') {
          // Don't redirect to dashboard, MainLayout will show pending/rejected screen
          toast({
              title: "Account Status",
              description: userProfile.accountStatus === 'Pending' 
                  ? "Your account is pending approval." 
                  : "Your account has been rejected.",
              variant: userProfile.accountStatus === 'Rejected' ? 'destructive' : 'default'
          });
          // No redirect, let the layout handle it.
      } else {
          const redirectPath = sessionStorage.getItem('redirectPath') || '/';
          sessionStorage.removeItem('redirectPath');
          router.push(redirectPath);
      }
  }

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
            accountStatus: role === 'admin' ? 'Approved' : 'Pending',
            coins: 0,
            walletBalance: 0,
            rating: 0,
            totalRatings: 0,
            address: '',
            latitude: null,
            longitude: null,
        };
        await setDoc(userRef, newUserProfile);
        
        if (role !== 'admin') {
            toast({
                title: "Registration Successful",
                description: "Your account is now pending admin approval.",
            });
        }
      } else {
        const existingUser = docSnap.data() as UserProfile;
        if (existingUser.accountStatus === 'Approved') {
           toast({
                title: "Login Successful",
                description: "Welcome back!",
            });
        }
      }
      
      await handleAuthSuccess(firebaseUser, role);
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
        const userProfile = await fetchUserProfile(result.user);
        if (!userProfile) {
            // This case should ideally not happen if registration is enforced
            await createFirestoreUser(result.user, 'customer');
        } else {
            await handleAuthSuccess(result.user);
        }
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
    router.push("/login"); 
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    loginWithEmailAndPassword,
    registerWithEmailAndPassword,
    logout,
    refreshUser
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
