
import { NextRequest } from 'next/server';
import admin from 'firebase-admin';


if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

interface FirebaseUser {
  uid: string;
  email: string | null;
  email_verified: boolean;
  name?: string;
  picture?: string;
}


export async function getFirebaseUser(req: NextRequest): Promise<FirebaseUser | null> {
  try {

    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.warn('⚠️ No Authorization header found');
      return null;
    }


    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token || token.trim() === '') {
      console.warn('⚠️ Empty token in Authorization header');
      return null;
    }

    console.log('🔐 Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(token, true); // checkRevoked = true


    const firebaseUser: FirebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      email_verified: decodedToken.email_verified || false,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    console.log(`✅ Firebase user verified: ${firebaseUser.email}`);
    return firebaseUser;

  } catch (error: any) {

    console.error('❌ Firebase auth error:', {
      code: error.code,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    if (error.code === 'auth/id-token-expired') {
      console.error('🔴 Token expired - client needs to refresh');
    } else if (error.code === 'auth/argument-error') {
      console.error('🔴 Invalid token format');
    } else if (error.code === 'auth/invalid-id-token') {
      console.error('🔴 Invalid token signature');
    }

    return null;
  }
}

export async function getFirebaseUserFromCookie(req: NextRequest): Promise<FirebaseUser | null> {
  try {
    const token = req.cookies.get('firebaseToken')?.value;

    if (!token) {
      console.warn('⚠️ No Firebase token cookie found');
      return null;
    }

    const decodedToken = await admin.auth().verifyIdToken(token, true);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      email_verified: decodedToken.email_verified || false,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

  } catch (error: any) {
    console.error('❌ Firebase cookie auth error:', error.message);
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<FirebaseUser> {
  const user = await getFirebaseUser(req);

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!user.email_verified) {
    throw new Error('Email not verified');
  }

  return user;
}