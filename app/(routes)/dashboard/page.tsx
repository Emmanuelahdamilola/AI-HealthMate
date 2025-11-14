'use client';

import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserDetailContext } from "@/context/UserDetailProvider";
import { Menu, X, LogOut } from "lucide-react";
import axios from "axios";
import { getAuth, signOut } from "firebase/auth";

import AddNewSessionDialog from "./_components/AddNewSessionDialog";
import DoctorsPage from "./_components/Doctors";
import ProfilePage from "./_components/ProfilePage";
import SettingsPage from "./_components/SettingsPage";
import UserHistory from "./_components/UserHistory";
import DashboardPage, { Stats } from "./_components/DashboardPage";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeMenu, setActiveMenu] = useState<string>("dashboard");

  const context = useContext(UserDetailContext);
  const fullName = context?.userDetail?.name || context?.user?.displayName || "User";
  const firstName = fullName.split(" ")[0];
  const userPhoto = context?.userDetail?.photoURL || context?.user?.photoURL;

  const menuItems = [
    { name: "Dashboard", key: "dashboard" },
    { name: "Start Session", key: "sessions" },
    { name: "Doctors", key: "doctors" },
    { name: "My History", key: "history" },
    { name: "Profile", key: "profile" },
    { name: "Settings", key: "settings" },
  ];

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Proper stats fetching
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) {
          console.log('ℹNo user logged in');
          return;
        }

        console.log(' Fetching user stats...');
        
        const token = await user.getIdToken();
        const res = await axios.get("/api/user-stats", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log(' Stats fetched:', res.data);
        setStats(res.data);
        
      } catch (err: any) {
        console.error("❌ Failed to fetch stats:", err);
        
        // Handle errors gracefully without showing toasts for new users
        if (err.response?.status === 404 || err.response?.status === 401) {
          console.log('ℹ️ No stats available (new user or auth issue) - using defaults');
          setStats({
            totalConsultations: 0,
            lastConsultation: null,
            patientHistoryCount: 0,
          });
        } else {
          console.error('Server error:', err.response?.status);
          setStats({
            totalConsultations: 0,
            lastConsultation: null,
            patientHistoryCount: 0,
          });
        }
      }
    };

    if (context?.user) {
      fetchStats();
    }
  }, [context?.user]);

  //  Handler for starting consultation from dashboard
  const handleStartConsultation = () => {
    setActiveMenu('sessions');
  };

  // Render content with proper props
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <DashboardPage stats={stats} onStartConsultation={handleStartConsultation} />;
      case "sessions":
        return <AddNewSessionDialog />;
      case "doctors":
        return <DoctorsPage />;
      case "history":
        return <UserHistory history={[]} />; {/* History is fetched inside component */}
      case "profile":
        return <ProfilePage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage stats={stats} onStartConsultation={handleStartConsultation} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#020617] text-white relative overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex md:flex-col justify-between w-64 bg-[#0b1121]/90 backdrop-blur-md border-r border-cyan-500/20 p-6 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
        <div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-500 bg-clip-text text-transparent tracking-wide drop-shadow-md">
            AI HealthMate
          </h2>
          <nav className="flex flex-col gap-2 mt-4">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                className={`text-left px-3 py-2 rounded-lg transition duration-300 ${activeMenu === item.key
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30"
                    : "hover:bg-gradient-to-r from-cyan-500/10 to-purple-500/10 hover:text-cyan-300"
                  }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mt-4 text-left px-3 py-2 rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 text-red-400 transition duration-300"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* Sidebar (Mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-30 flex"
          >
            <div className="w-64 bg-[#0b1121]/95 backdrop-blur-xl border-r border-cyan-400/20 p-6 space-y-6 h-full flex flex-col justify-between">
              <div>
                <button onClick={() => setSidebarOpen(false)} className="mb-4 text-cyan-300">
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  AI HealthMate
                </h2>
                <nav className="flex flex-col gap-2 mt-4">
                  {menuItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActiveMenu(item.key);
                        setSidebarOpen(false);
                      }}
                      className={`text-left px-3 py-2 rounded-lg transition duration-300 ${activeMenu === item.key
                          ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30"
                          : "hover:bg-gradient-to-r from-cyan-500/10 to-purple-500/10 hover:text-cyan-300"
                        }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </nav>
              </div>

              <button
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-2 mt-4 text-left px-3 py-2 rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 text-red-400 transition duration-300"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>

            <div onClick={() => setSidebarOpen(false)} className="flex-1 bg-black/50"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between bg-[#0b1121]/80 backdrop-blur-md border-b border-cyan-400/10 px-6 py-4 shadow-md">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-cyan-300" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400"
            >
              Welcome, {firstName}
            </motion.h1>
          </div>

          {/* User Avatar */}
          <div className="relative">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={firstName}
                className="h-10 w-10 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              />
            ) : (
              <div className="h-10 w-10 flex items-center justify-center bg-gray-700 rounded-full text-white font-bold border-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                {firstName[0].toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">{renderContent()}</main>
      </div>
    </div>
  );
}