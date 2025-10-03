'use client';

import { Button } from '@/components/ui/button';
import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user } = useUser();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full px-4 py-4 bg-gradient-to-r from-gray-900 to-gray-800 shadow-md flex justify-between items-center border-b border-gray-700"
    >
      {/* Left side (brand/logo placeholder) */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500" />
        <h1 className="text-white text-lg font-semibold">AI Medical Assistant</h1>
      </div>

      {/* Right side (auth logic) */}
      {!user ? (
        <Link href="/sign-in">
          <button className="rounded-xl px-5 py-2 bg-white text-black font-semibold hover:bg-gray-200 transition duration-300">
            Login
          </button>
        </Link>
      ) : (
        <div className="flex items-center gap-4">
          <UserButton />
          <Link href="/dashboard">
            <Button variant="secondary" className="bg-gray-700 text-white hover:bg-gray-600 transition">
              Dashboard
            </Button>
          </Link>
        </div>
      )}
    </motion.nav>
  );
}
