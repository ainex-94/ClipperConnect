
'use server';

import { collection, getDocs, getDoc, doc, query, where, DocumentData, Timestamp, serverTimestamp, addDoc, setDoc, orderBy, limit, updateDoc, or } from 'firebase/firestore';
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
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
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

export async function getUsersWithRole(role: 'customer' | 'barber') {
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

export async function getAppointmentsForUser(userId: string, userRole: UserProfile['role']): Promise<Appointment[]> {
    let q;
    if (userRole === 'admin') {
        q = query(collection(db, "appointments"), orderBy('dateTime', 'desc'));
    } else if (userRole === 'barber') {
        q = query(collection(db, "appointments"), where('barberId', '==', userId), orderBy('dateTime', 'desc'));
    } else { // customer
        q = query(collection(db, "appointments"), where('customerId', '==', userId), orderBy('dateTime', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => safeJsonParse({ id: doc.id, ...doc.data() }));
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
