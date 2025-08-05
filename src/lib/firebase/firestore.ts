'use server';

import { collection, getDocs, getDoc, doc, query, where, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { User } from 'firebase/auth';

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

export async function getDocument(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return safeJsonParse({ id: docSnap.id, ...docSnap.data() });
    } else {
        return null;
    }
}
