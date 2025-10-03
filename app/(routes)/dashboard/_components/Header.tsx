'use client';

import Image from "next/image";
import Link from "next/link";
import React, { useState, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserDetailContext } from "@/context/UserDetailProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const context = useContext(UserDetailContext);
  const user = context?.user;
  const userDetail = context?.userDetail;

  const menu = [
    { id: 1, name: "Start Consultation", path: "/dashboard" },
    { id: 2, name: "My History", path: "/dashboard/history" },
    { id: 3, name: "Our Doctors", path: "/dashboard/doctors" },
    { id: 4, name: "Contact", path: "/dashboard/contact" },
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const getDisplayName = () => {
    if (userDetail?.name) return userDetail.name.split(" ")[0];
    if (user?.displayName) return user.displayName.split(" ")[0];
    return "User";
  };

  const avatarSrc = user?.photoURL || userDetail?.photoURL || "";

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
          {menu.map((item) => (
            <Link key={item.id} href={item.path}>
              <span
                className={`text-sm md:text-base font-medium transition-colors duration-200 cursor-pointer ${
                  pathname === item.path ? "text-purple-400" : "text-zinc-300 hover:text-purple-400"
                }`}
              >
                {item.name}
              </span>
            </Link>
          ))}

          {/* Desktop User Info */}
          {user || userDetail ? (
            <div className="flex items-center gap-3 ml-4">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  {getDisplayName().charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold">{getDisplayName()}</span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 bg-red-600 rounded-lg hover:bg-red-500 transition text-white"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => router.push("/sign-in")}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/sign-up")}
                className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition"
              >
                Sign Up
              </button>
            </>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-zinc-300 hover:text-purple-400 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Mobile Menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:hidden bg-zinc-900 border-t border-zinc-800 overflow-hidden"
          >
            <div className="flex flex-col px-6 py-4 space-y-4">
              {menu.map((item) => (
                <Link key={item.id} href={item.path}>
                  <span
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      pathname === item.path ? "text-purple-400" : "text-zinc-300 hover:text-purple-400"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}

              {/* Mobile User Info */}
              {user || userDetail ? (
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold">{getDisplayName()}</span>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-1 bg-red-600 rounded-lg hover:bg-red-500 transition text-white"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      router.push("/sign-in");
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      router.push("/sign-up");
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
