
import React from 'react'


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <div className="w-full min-h-screen">
  {children}
</div>

    </div>
  )
}
