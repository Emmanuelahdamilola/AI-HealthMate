import React from 'react'
import Header from './_components/Header';


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header />
      <div className="py-6 px-6 md:px-20 lg:40 xl:60">
        {children}</div>
    </div>
  )
}
