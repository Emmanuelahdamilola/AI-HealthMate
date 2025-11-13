
'use client';

import Image from "next/image";
import Link from "next/link";
import React, { useState, useContext, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Home as HomeIcon, Zap, Stethoscope, Settings, LogOut, User, Users } from "lucide-react"; 
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

  // --- LOGIC PRESERVED ---
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

  // Scroll effect to darken header on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // --- END LOGIC PRESERVED ---

  // --- ENHANCED MENU STRUCTURE ---
  const menu = [
    { id: 1, name: "Home", path: "/", icon: HomeIcon },
    { id: 2, name: "Dashboard", path: "/dashboard", icon: Zap },
    { id: 3, name: "Doctors", path: "/dashboard/doctors", icon: Stethoscope },
    { id: 4, name: "Profile", path: "/dashboard/profile", icon: User },
    // Removed generic 'Contact' and kept core app navigation
  ];

  // --- User/Auth Specific Menu ---
  const loggedInMenu = [
    ...menu,
    { id: 5, name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];
  
  const currentMenu = user || userDetail ? loggedInMenu : menu;


  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          // Enhanced scrolled state: Darker, Cyan border glow
          ? "backdrop-blur-lg bg-[#03071e]/90 shadow-2xl border-b border-cyan-700/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8 py-4">
        
        {/* LOGO (AI HealthMate) */}
        <Link href="/" className="flex items-center gap-2 group">
          {/* Using a placeholder for a new, cleaner icon look */}
          <Zap className="w-8 h-8 text-cyan-400 drop-shadow-md" strokeWidth={1.5} />
          <motion.h1
            whileHover={{ scale: 1.05 }}
            className="text-xl md:text-2xl font-bold tracking-wide bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent"
          >
            AI HealthMate
          </motion.h1>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex gap-8 items-center">
          {currentMenu.map((item) => (
            <Link key={item.id} href={item.path}>
              <span
                className={`relative text-sm md:text-base font-medium transition-colors duration-200 cursor-pointer ${
                  pathname === item.path
                    ? "text-cyan-400 font-bold" // Highlight active page
                    : "text-gray-300 hover:text-cyan-400"
                } group`}
              >
                {item.name}
                {/* Active/Hover Underline Glow Effect */}
                <span className={`absolute left-0 bottom-[-4px] w-0 h-[2px] bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300 group-hover:w-full ${pathname === item.path ? 'w-full !h-[3px] shadow-lg' : ''}`}></span>
              </span>
            </Link>
          ))}

          {/* USER SECTION / AUTH BUTTONS */}
          {user || userDetail ? (
            <div className="flex items-center gap-3 ml-6">
              <Link href="/dashboard/profile">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-400 transition-transform hover:scale-110"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              
              <button
                onClick={handleSignOut} // LOGIC PRESERVED
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg hover:from-red-500 hover:to-pink-500 text-white font-medium transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-6">
              <button
                onClick={() => router.push("/sign-in")}
                className="px-4 py-2 border border-blue-600 text-blue-400 rounded-lg hover:bg-blue-600/10 transition font-medium"
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
            className="md:hidden backdrop-blur-lg bg-[#03071e]/95 border-t border-cyan-900/30 shadow-inner"
          >
            <div className="flex flex-col px-6 py-5 space-y-4">
              {currentMenu.map((item) => (
                <Link key={item.id} href={item.path}>
                  <span
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-2 text-md font-medium transition-colors duration-200 flex items-center gap-3 ${
                      pathname === item.path
                        ? "text-cyan-400 bg-cyan-900/20 rounded-lg px-2"
                        : "text-gray-300 hover:text-cyan-400"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </span>
                </Link>
              ))}

              {/* MOBILE USER INFO / AUTH BUTTONS */}
              {user || userDetail ? (
                <div className="flex flex-col gap-3 pt-5 border-t border-gray-700">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarSrc || '/placeholder-user.png'}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-purple-400"
                    />
                    <span className="font-semibold text-white">{getDisplayName()}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut(); // LOGIC PRESERVED
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-red-600 rounded-lg text-white font-medium hover:bg-red-500 transition"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-5 border-t border-gray-700">
                  <button
                    onClick={() => {
                      router.push("/sign-in");
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-blue-600 rounded-lg text-white transition font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      router.push("/sign-up");
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-cyan-500 rounded-lg text-white transition font-medium"
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