"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "axios";

interface Preferences {
  darkMode: boolean;
  emailNotifications: boolean;
  autoSave: boolean;
  preferredReportLanguage: 'english' | 'yoruba' | 'igbo' | 'hausa';
  defaultConsultLanguage: 'english' | 'yoruba' | 'igbo' | 'hausa';
}

interface UsersDetail {
  id: number;
  name: string;
  email: string;
  photoURL?: string | null;
  preferences?: Preferences;
}

interface UserDetailContextType {
  user: User | null;
  userDetail: UsersDetail | null;
  setUserDetail: React.Dispatch<React.SetStateAction<UsersDetail | null>>;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

export const UserDetailContext = createContext<UserDetailContextType | undefined>(undefined);

export const UserDetailProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDetail, setUserDetail] = useState<UsersDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.email);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await createOrFetchUser(firebaseUser);
      } else {
        setUserDetail(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createOrFetchUser = async (firebaseUser: User) => {
    try {
      console.log('📥 Fetching user details...');
      
      const token = await firebaseUser.getIdToken(true);
      
      const res = await axios.post(
        "/api/users",
        {}, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 
        }
      );

      console.log('✅ User details fetched:', res.data.email);

      setUserDetail({
        id: res.data.id,
        name: res.data.name || firebaseUser.displayName || '',
        email: res.data.email,
        photoURL: res.data.photoURL || firebaseUser.photoURL || null,
      });

    } catch (err: any) {
      console.error("❌ Failed to create/fetch user:", err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        console.error('🔴 Authentication failed - signing out');
        await auth.signOut();
      }
    }
  };


  const refreshUser = async () => {
    if (user) {
      await createOrFetchUser(user);
    }
  };

  return (
    <UserDetailContext.Provider value={{ 
      user, 
      userDetail, 
      setUserDetail, 
      loading,
      refreshUser 
    }}>
      {children}
    </UserDetailContext.Provider>
  );
};