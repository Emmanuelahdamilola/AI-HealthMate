
'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, onIdTokenChanged, getAuth } from 'firebase/auth';

interface UseFirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  getIdToken: () => Promise<string | null>;
  refreshToken: () => Promise<string | null>;
}


export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  
  const auth = getAuth();

  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('⚠️ No user logged in');
        return null;
      }

 
      const token = await currentUser.getIdToken(false);
      console.log('✅ Got ID token');
      return token;

    } catch (err: any) {
      console.error('❌ Error getting ID token:', err.message);
      setError(err);
      return null;
    }
  }, [auth]);


  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('⚠️ No user logged in');
        return null;
      }

      console.log('🔄 Force refreshing token...');
      const token = await currentUser.getIdToken(true); 
      return token;

    } catch (err: any) {
      console.error('❌ Error refreshing token:', err.message);
      setError(err);
      return null;
    }
  }, [auth]);

  useEffect(() => {

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      try {
        if (user) {
          console.log('✅ User authenticated:', user.email);
          setUser(user);
          setError(null);
        } else {
          console.log('❌ User logged out');
          setUser(null);
        }
      } catch (err: any) {
        console.error('❌ Auth state change error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // Force token refresh every 10 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      console.log('🔄 Auto-refreshing token (10min interval)...');
      await refreshToken();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  return {
    user,
    loading,
    error,
    getIdToken,
    refreshToken,
  };
}