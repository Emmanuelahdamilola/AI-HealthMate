'use client';

import { UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const menu = [
    { id: 1, name: 'Start Consultation', path: '/dashboard' },
    { id: 2, name: 'My History', path: '/dashboard/history' },
    { id: 3, name: 'Our Doctors', path: '/dashboard/doctors' },
    { id: 4, name: 'Contact', path: '/dashboard/contact' },
  ];



  return (
    <header className="sticky top-0 z-50 w-full bg-zinc-900 text-white shadow-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-16 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <Image src="/logo.png" alt="logo" width={40} height={40} />
          <h1 className="text-lg md:text-2xl font-bold tracking-wide">AI HealthMate</h1>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 items-center">
          {menu.map((item, index) => (
            <motion.div
              key={item.id}
              custom={index}
              initial="hidden"
              animate="visible"

            >
              <Link href={item.path}>
                <span
                  className={`text-sm md:text-base font-medium transition-colors duration-200 cursor-pointer
          ${pathname === item.path ? 'text-purple-400' : 'text-zinc-300 hover:text-purple-400'}`}
                >
                  {item.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </nav>
       
        {/* User + Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          <UserButton afterSignOutUrl="/" />
          <button
            className="md:hidden text-zinc-300 hover:text-purple-400 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="md:hidden bg-zinc-900 border-t border-zinc-800 overflow-hidden"
          >
            <div className="flex flex-col px-6 py-4 space-y-4">
              {menu.map((item) => (
                <Link key={item.id} href={item.path}>
                  <span
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block text-sm font-medium transition-colors duration-200 cursor-pointer ${pathname === item.path
                      ? 'text-purple-400'
                      : 'text-zinc-300 hover:text-purple-400'
                      }`}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
