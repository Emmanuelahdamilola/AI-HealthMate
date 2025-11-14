// app/(routes)/dashboard/layout.tsx
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { UserDetailProvider } from '@/context/UserDetailProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserDetailProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <main className="container">
            {children}
          </main>
        </div>
      </ProtectedRoute>
    </UserDetailProvider>
  );
}