
'use server';

import { collection, getDocs, getDoc, doc, query, where, DocumentData, Timestamp, serverTimestamp, addDoc, setDoc, orderBy, limit, updateDoc, or, increment, runTransaction, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

// Type Definitions
export interface UserProfile {
    id: string;
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    role: 'customer' | 'barber' | 'admin';
    accountStatus: 'Pending' | 'Approved' | 'Rejected';
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
        }
    },
    coins?: number;
    walletBalance?: number;
    shopImageUrls?: string[];
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    presence?: {
        status: 'online' | 'offline';
        lastSeen: string;
    },
    shopOwnerId?: string; // ID of the barber who owns the shop
}

export interface Message {
    id: string;
    text: string;
    senderId: string;
    receiverId: string;
    timestamp: Timestamp;
    status: 'sent' | 'read';
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
    },
    typing?: {
        [key: string]: boolean;
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
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'InProgress';
  price?: number;
  paymentStatus?: 'Paid' | 'Unpaid';
  amountPaid?: number;
  barberRating?: number;
  customerRating?: number;
  reviewText?: string;
  paymentMethod?: 'Cash' | 'Wallet' | 'JazzCash' | 'EasyPaisa';
}

export interface WalletTransaction {
    id: string;
    amount: number;
    type: 'Top-up' | 'Payment Sent' | 'Payment Received';
    description: string;
    timestamp: string;
}

export interface Notification {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    read: boolean;
    href?: string;
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
    const usersCollection = await getCollection("users");
    return usersCollection.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    // Fetches all users with the 'barber' role, including shop owners and workers.
    return getUsersWithRole('barber');
}

export async function getWorkersForBarber(shopOwnerId: string): Promise<UserProfile[]> {
    const q = query(collection(db, "users"), where("role", "==", "barber"), where("shopOwnerId", "==", shopOwnerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() }));
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

export async function getCompletedAppointmentsForBarber(barberId: string): Promise<Appointment[]> {
    const q = query(
        collection(db, "appointments"),
        where('barberId', '==', barberId),
        where('status', '==', 'Completed')
    );
    
    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() })) as Appointment[];

    // Sort by most recent first
    appointments.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    
    return appointments;
}

export async function getCompletedAppointmentsForCustomer(customerId: string): Promise<Appointment[]> {
    const q = query(
        collection(db, "appointments"),
        where('customerId', '==', customerId),
        where('status', '==', 'Completed')
    );
    
    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() })) as Appointment[];

    // Sort by most recent first
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

export async function getRecentAppointments(barberId?: string): Promise<Appointment[]> {
    let q;
    if (barberId) {
        q = query(
            collection(db, "appointments"), 
            where('barberId', '==', barberId),
        );
    } else {
        q = query(
            collection(db, "appointments"), 
        );
    }
    
    const querySnapshot = await getDocs(q);
    let appointments = querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() })) as Appointment[];
    
    appointments = appointments
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
        .slice(0, 5);

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
        
        const user1Data = user1Doc.data() as UserProfile;
        const user2Data = user2Doc.data() as UserProfile;

        await setDoc(chatRef, {
            participantIds: sortedIds,
            participants: [
                { id: userId1, displayName: user1Data.displayName, photoURL: user1Data.photoURL },
                { id: userId2, displayName: user2Data.displayName, photoURL: user2Data.photoURL },
            ],
            typing: { [userId1]: false, [userId2]: false },
            createdAt: serverTimestamp(),
        });
        
        await createNotificationInFirestore(userId2, {
            title: `New Chat with ${user1Data.displayName}`,
            description: "You can now send messages to each other.",
            href: `/chat?chatId=${chatId}`
        });

    }

    return chatId;
}


export async function getChats(userId: string): Promise<Chat[]> {
    const q = query(collection(db, "chats"), where('participantIds', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    const chats = querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() }));
    // Sort by last message timestamp, descending
    chats.sort((a,b) => {
        const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return timeB - timeA;
    });
    return chats;
}


export async function sendMessage(chatId: string, senderId: string, receiverId: string, text: string) {
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    const timestamp = serverTimestamp();
    
    await addDoc(messagesCol, {
        senderId,
        receiverId,
        text,
        timestamp,
        status: 'sent'
    });

    // Also update the last message on the chat document
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        lastMessage: {
            text,
            timestamp,
        }
    });

    // Send notification to the receiver
    const senderDoc = await getDoc(doc(db, 'users', senderId));
    if (senderDoc.exists()) {
        const senderName = senderDoc.data().displayName;
        await createNotificationInFirestore(receiverId, {
            title: `New message from ${senderName}`,
            description: text,
            href: `/chat?chatId=${chatId}`
        });
    }
}

export async function updateAverageRating(userId: string) {
    const userRef = doc(db, "users", userId);
    
    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User document does not exist!");
        }

        const userData = userDoc.data() as UserProfile;
        const ratingField = userData.role === 'barber' ? 'barberRating' : 'customerRating';
        const userIdentifierField = userData.role === 'barber' ? 'barberId' : 'customerId';
        
        let newRatingSum = 0;
        let newTotalRatings = 0;

        // Query appointments where this user was rated
        const appointmentQuery = query(
            collection(db, "appointments"),
            where(userIdentifierField, '==', userId),
            where(ratingField, '>', 0) // Ensure we only get rated appointments
        );

        const appointmentSnapshot = await getDocs(appointmentQuery);

        appointmentSnapshot.forEach(appointmentDoc => {
            const appointmentData = appointmentDoc.data();
            newRatingSum += appointmentData[ratingField];
            newTotalRatings++;
        });
        
        const newAverageRating = newTotalRatings > 0 ? newRatingSum / newTotalRatings : 0;

        transaction.update(userRef, {
            rating: newAverageRating,
            totalRatings: newTotalRatings,
        });
    });
}

// NOTIFICATION FUNCTIONS

export async function createNotificationInFirestore(
  userId: string,
  notificationData: Omit<Notification, "id" | "read" | "timestamp">
) {
  const notificationsColRef = collection(db, "users", userId, "notifications");
  await addDoc(notificationsColRef, {
    ...notificationData,
    read: false,
    timestamp: serverTimestamp(),
  });
}

// WORKER MANAGEMENT FUNCTIONS

export async function removeWorker(workerId: string) {
  try {
    const workerRef = doc(db, "users", workerId);
    // Instead of deleting, we can disassociate them or mark as inactive.
    // For simplicity, this example will delete the user record.
    // In a real app, consider implications on appointments etc.
    await deleteDoc(workerRef);
    return { success: "Worker removed successfully." };
  } catch (error: any) {
    console.error("Error removing worker:", error);
    return { error: error.message || "Failed to remove worker." };
  }
}
