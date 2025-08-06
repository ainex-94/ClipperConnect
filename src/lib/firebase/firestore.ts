
'use server';

import { collection, getDocs, getDoc, doc, query, where, DocumentData, Timestamp, serverTimestamp, addDoc, setDoc, orderBy, limit, updateDoc, or, increment, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

// Type Definitions
export interface UserProfile {
    id: string;
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    role: 'customer' | 'barber' | 'admin';
    createdAt: string;
    specialty?: string;
    rating?: number;
    totalRatings?: number; // Keep track of how many ratings have been submitted
    phone?: string;
    bio?: string;
    availability?: {
        [key: string]: {
            start: string;
            end: string;
        } | null
    },
    coins?: number;
    walletBalance?: number;
    shopImageUrls?: string[];
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
}

export interface Message {
    id: string;
    text: string;
    senderId: string;
    receiverId: string;
    timestamp: Timestamp;
}

export interface Chat {
    id: string;
    participants: {
        id: string;
        displayName: string;
        photoURL: string;
    }[];
    participantIds: string[];
    lastMessage?: {
        text: string;
        timestamp: Timestamp;
    }
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhotoURL?: string;
  barberId: string;
  barberName: string;
  barberPhotoURL?: string;
  service: string;
  dateTime: string;
  status: 'Confirmed' | 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
  price?: number;
  paymentStatus?: 'Paid' | 'Unpaid';
  amountPaid?: number;
  barberRating?: number;
  customerRating?: number;
}

export interface WalletTransaction {
    id: string;
    amount: number;
    type: 'Top-up' | 'Payment Sent' | 'Payment Received';
    description: string;
    timestamp: string;
}


// A helper function to safely stringify and parse complex objects, converting Timestamps to ISO strings.
const safeJsonParse = (data: DocumentData) => {
    const replacer = (key: string, value: any) => {
        if (value instanceof Timestamp) {
            return value.toDate().toISOString();
        }
        return value;
    };
    return JSON.parse(JSON.stringify(data, replacer));
};

export async function getCollection(collectionName: string) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() }));
}

export async function getAllUsers(): Promise<UserProfile[]> {
    return getCollection("users");
}

export async function getUsersWithRole(role: 'customer' | 'barber' | 'admin'): Promise<UserProfile[]> {
    const q = query(collection(db, "users"), where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() }));
}

export async function getCustomers() {
    return getUsersWithRole('customer');
}

export async function getBarbers() {
    return getUsersWithRole('barber');
}


export async function getDocument(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return safeJsonParse({ id: docSnap.id, ...docSnap.data() });
    } else {
        return null;
    }
}

export async function getAppointmentsForUser(userId: string): Promise<Appointment[]> {
    const q = query(
        collection(db, "appointments"),
        or(
            where('customerId', '==', userId),
            where('barberId', '==', userId)
        )
    );
    
    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() })) as Appointment[];

    // Sort client-side to avoid composite index requirement
    appointments.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    
    return appointments;
}

export async function getAllAppointments(barberId?: string): Promise<Appointment[]> {
    let q;
    if (barberId) {
        q = query(collection(db, "appointments"), where('barberId', '==', barberId));
    } else {
        q = query(collection(db, "appointments"));
    }
    
    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() })) as Appointment[];
    
    appointments.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    
    return appointments;
}

export async function updateAppointmentPayment(appointmentId: string, paymentStatus: 'Paid' | 'Unpaid') {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);
    await updateDoc(appointmentRef, { paymentStatus });
    return { success: true };
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return { success: false, error: "Failed to update payment status." };
  }
}

// CHAT FUNCTIONS

export async function getOrCreateChat(userId1: string, userId2: string) {
    // Sort IDs to ensure consistency in chat ID
    const sortedIds = [userId1, userId2].sort();
    const chatId = sortedIds.join('_');
    
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        const user1Doc = await getDoc(doc(db, 'users', userId1));
        const user2Doc = await getDoc(doc(db, 'users', userId2));

        if (!user1Doc.exists() || !user2Doc.exists()) {
            throw new Error("One or both users not found");
        }
        
        const user1Data = user1Doc.data();
        const user2Data = user2Doc.data();

        await setDoc(chatRef, {
            participantIds: sortedIds,
            participants: [
                { id: userId1, displayName: user1Data.displayName, photoURL: user1Data.photoURL },
                { id: userId2, displayName: user2Data.displayName, photoURL: user2Data.photoURL },
            ],
            createdAt: serverTimestamp(),
        });
    }

    return chatId;
}


export async function getChats(userId: string): Promise<Chat[]> {
    const q = query(collection(db, "chats"), where('participantIds', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() }));
}


export async function sendMessage(chatId: string, senderId: string, receiverId: string, text: string) {
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesCol, {
        senderId,
        receiverId,
        text,
        timestamp: serverTimestamp(),
    });

    // Also update the last message on the chat document
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        lastMessage: {
            text,
            timestamp: serverTimestamp(),
        }
    });
}

export async function updateAverageRating(userId: string) {
    const userRef = doc(db, "users", userId);
    
    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User document does not exist!");
        }

        const userData = userDoc.data() as UserProfile;
        
        let newRatingSum = 0;
        let newTotalRatings = 0;

        // Query appointments where this user was rated
        const appointmentQuery = query(
            collection(db, "appointments"),
            userData.role === 'barber'
                ? where('barberId', '==', userId)
                : where('customerId', '==', userId)
        );

        const appointmentSnapshot = await getDocs(appointmentQuery);

        appointmentSnapshot.forEach(appointmentDoc => {
            const appointmentData = appointmentDoc.data();
            const ratingField = userData.role === 'barber' ? 'barberRating' : 'customerRating';
            if (appointmentData[ratingField]) {
                newRatingSum += appointmentData[ratingField];
                newTotalRatings++;
            }
        });
        
        const newAverageRating = newTotalRatings > 0 ? newRatingSum / newTotalRatings : 0;

        transaction.update(userRef, {
            rating: newAverageRating,
            totalRatings: newTotalRatings,
        });
    });
}
