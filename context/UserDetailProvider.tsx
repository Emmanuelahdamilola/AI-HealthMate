// 'use client';

// import React, { createContext, useState, useEffect } from "react";
// import { onAuthStateChanged, User } from "firebase/auth";
// import { auth } from "@/lib/firebase";   
// import axios from "axios";

// export const UserDetailContext = createContext<any>(undefined);

// export const UserDetailProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [userDetail, setUserDetail] = useState<any>(null);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
//       setUser(firebaseUser);
//       if (firebaseUser) {
//         createNewUser(firebaseUser);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   const createNewUser = async (firebaseUser: User) => {
//     try {
//       const token = await firebaseUser.getIdToken();
//       const res = await axios.post(
//         "/api/users",
//         {},
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setUserDetail(res.data);
//     } catch (err) {
//       console.error("Failed to create user:", err);
//     }
//   };

//   return (
//     <UserDetailContext.Provider value={{ user, userDetail, setUserDetail }}>
//       {children}
//     </UserDetailContext.Provider>
//   );
// };


"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "axios";

// Define the type for your context
interface UsersDetail {
  name: string;
  email: string;
  photoURL?: string | null;
}

interface UserDetailContextType {
  user: User | null;
  userDetail: UsersDetail | null;
  setUserDetail: React.Dispatch<React.SetStateAction<UsersDetail | null>>;
}

export const UserDetailContext = createContext<UserDetailContextType | undefined>(undefined);

export const UserDetailProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDetail, setUserDetail] = useState<UsersDetail | null>(null);

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        createOrFetchUser(firebaseUser);
      } else {
        setUserDetail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Create or fetch user from your database
  const createOrFetchUser = async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await axios.post(
        "/api/users",
        {}, // empty body since server reads token
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
       setUserDetail({
      name: res.data.name,
      email: res.data.email,
      photoURL: res.data.photoURL || null,
    });
    } catch (err) {
      console.error("Failed to create/fetch user:", err);
    }
  };

  return (
    <UserDetailContext.Provider value={{ user, userDetail, setUserDetail }}>
      {children}
    </UserDetailContext.Provider>
  );
};
