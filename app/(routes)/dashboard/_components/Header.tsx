'use client';

import Image from "next/image";
import Link from "next/link";
import React, { useState, useContext, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserDetailContext } from "@/context/UserDetailProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const context = useContext(UserDetailContext);
  const user = context?.user;
  const userDetail = context?.userDetail;

  const menu = [
    { id: 1, name: "Home", path: "/" },
    { id: 2, name: "Start Consultation", path: "/dashboard" },
    { id: 3, name: "Our Doctors", path: "/dashboard/doctors" },
    { id: 4, name: "Contact", path: "/dashboard/contact" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-md bg-[#03071e]/80 shadow-lg border-b border-cyan-900/30"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-16 py-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/logo.png" alt="logo" width={40} height={40} className="drop-shadow-md" />
          <motion.h1
            whileHover={{ scale: 1.05 }}
            className="text-xl md:text-2xl font-bold tracking-wide bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent"
          >
            AI HealthMate
          </motion.h1>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex gap-8 items-center">
          {menu.map((item) => (
            <Link key={item.id} href={item.path}>
              <span
                className={`relative text-sm md:text-base font-medium transition-colors duration-200 cursor-pointer ${
                  pathname === item.path
                    ? "text-cyan-400"
                    : "text-gray-300 hover:text-cyan-400"
                } group`}
              >
                {item.name}
                <span className="absolute left-0 bottom-[-4px] w-0 h-[2px] bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Link>
          ))}

          {/* USER SECTION */}
          {user || userDetail ? (
            <div className="flex items-center gap-3 ml-6">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border border-cyan-500/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {getDisplayName().charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-white">{getDisplayName()}</span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg hover:from-red-500 hover:to-pink-500 text-white font-medium transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-6">
              <button
                onClick={() => router.push("/sign-in")}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-500 hover:to-indigo-500 transition font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/sign-up")}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-lg hover:from-cyan-400 hover:to-indigo-400 transition font-medium"
              >
                Sign Up
              </button>
            </div>
          )}
        </nav>

        {/* MOBILE MENU TOGGLE */}
        <button
          className="md:hidden text-gray-300 hover:text-cyan-400 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Mobile Menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MOBILE NAV */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden backdrop-blur-md bg-[#03071e]/95 border-t border-cyan-900/30 shadow-inner"
          >
            <div className="flex flex-col px-6 py-5 space-y-4">
              {menu.map((item) => (
                <Link key={item.id} href={item.path}>
                  <span
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block text-sm font-medium transition-colors duration-200 ${
                      pathname === item.path
                        ? "text-cyan-400"
                        : "text-gray-300 hover:text-cyan-400"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}

              {/* MOBILE USER INFO */}
              {user || userDetail ? (
                <div className="flex items-center gap-3 pt-5 border-t border-cyan-900/30">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover border border-cyan-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-white">{getDisplayName()}</span>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg text-white font-medium hover:from-red-500 hover:to-pink-500 transition"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-5 border-t border-cyan-900/30">
                  <button
                    onClick={() => {
                      router.push("/sign-in");
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-500 hover:to-indigo-500 transition"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      router.push("/sign-up");
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-lg hover:from-cyan-400 hover:to-indigo-400 transition"
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
