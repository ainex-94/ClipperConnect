// src/lib/firebase/auth-actions.ts
'use server';

import { cookies } from 'next/headers';
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { UserProfile } from './firestore';

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    }
    // This will be automatically initialized by the environment
    return initializeApp();
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
    (await
      // Clear the invalid cookie
      cookies()).delete('__session');
    return null;
  }
}

export async function createSessionCookie(idToken: string) {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    (await cookies()).set('__session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
}

export async function clearSessionCookie() {
    (await cookies()).delete('__session');
}
