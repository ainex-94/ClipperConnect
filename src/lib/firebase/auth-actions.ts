
// src/lib/firebase/auth-actions.ts
'use server';
import 'server-only';

import { cookies } from 'next/headers';
import { initializeApp, getApps, getApp, type App, type ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { UserProfile } from './firestore';

const serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
}

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
}

const app = getAdminApp();
const auth = getAuth(app);
const db = getFirestore(app);

export async function getCurrentUser(): Promise<UserProfile | null> {
  const sessionCookie = (await cookies()).get('__session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    const userDoc = await db.collection('users').doc(decodedIdToken.uid).get();

    if (!userDoc.exists) {
      return null;
    }
    
    return { id: userDoc.id, ...userDoc.data() } as UserProfile;

  } catch (error) {
    console.error('Error verifying session cookie:', error);
    // Clear the invalid cookie
    cookies().delete('__session');
    return null;
  }
}

export async function createSessionCookie(idToken: string) {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    cookies().set('__session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
}

export async function clearSessionCookie() {
    cookies().delete('__session');
}
