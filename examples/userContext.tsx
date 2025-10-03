// 'use client';

// import React, { createContext, useState, useEffect } from 'react';
// import { useUser } from '@clerk/nextjs';
// import axios from 'axios';

// export const UserDetailContext = createContext<any>(undefined);

// export const UserDetailProvider = ({ children }: { children: React.ReactNode }) => {
//   const { user } = useUser();
//   const [userDetail, setUserDetail] = useState<any>(null);

//   useEffect(() => {
//     if (user) {
//       createNewUser();
//     }
//   }, [user]);

//   const createNewUser = async () => {
//     try {
//       const res = await axios.post('/api/users');
//       console.log(res.data);
//       setUserDetail(res.data);
//     } catch (err) {
//       console.error('Failed to create user:', err);
//     }
//   };

//   return (
//     <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
//       {children}
//     </UserDetailContext.Provider>
//   );
// };
