'use client';

import { useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserDetailContext } from '@/context/UserDetailProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const context = useContext(UserDetailContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!context) return;

    const { user, loading } = context;


    if (loading) return;


    if (!user && !loading) {
      console.log('🚫 No user found, redirecting to sign-in');

      sessionStorage.setItem('redirectAfterLogin', pathname);
      
      router.push('/sign-in');
    }
  }, [context, router, pathname]);


  if (!context || context.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }


  if (context.user) {
    return <>{children}</>;
  }


  return null;
}