'use client';

import React from 'react';
import { UserDetailProvider } from '@/context/UserDetailProvider';


export type UsersDetail = {
  name: string;
  email: string;
};

export default function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserDetailProvider>
      {children}
    </UserDetailProvider>
  );
}
