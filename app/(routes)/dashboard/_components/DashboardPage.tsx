'use client';

import { motion } from "framer-motion";
import { Cpu, Clock, BookOpen } from "lucide-react";
import UserHistory from "./UserHistory";

export type Stats = {
  totalConsultations: number;
  lastConsultation: { sessionId: string; createdOn: string } | null;
  patientHistoryCount: number;
};

interface DashboardPageProps {
  stats: Stats | null;
}

export default function DashboardPage({ stats }: DashboardPageProps) {
  const statItems = [
    {
      title: "Total AI Consultations",
      value: stats?.totalConsultations ?? 0,
      icon: Cpu,
    },
    {
      title: "Last Consultation",
      value: stats?.lastConsultation
        ? new Date(stats.lastConsultation.createdOn).toLocaleString()
        : "No consultations yet",
      icon: Clock,
    },
    {
      title: "Patient History",
      value: stats?.patientHistoryCount ?? 0,
      icon: BookOpen,
    },
  ];

  return (
    <>
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {statItems.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03 }}
              className="bg-[#0f172a]/80 border border-cyan-400/10 backdrop-blur-lg rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.15)] p-5 hover:border-cyan-400/30 transition-all duration-300 flex items-center gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.3 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <IconComponent className="text-cyan-400 w-6 h-6" />
              </motion.div>
              <div>
                <h3 className="text-cyan-300 font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-200 text-lg">{item.value}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions + AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[#0f172a]/80 border border-cyan-400/10 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4 hover:border-purple-400/30 transition-all duration-300"
        >
          <h3 className="text-cyan-300 font-semibold">Quick Actions</h3>
          <button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition py-2 px-4 rounded-xl font-medium text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            Start AI Consultation
          </button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[#0f172a]/80 border border-cyan-400/10 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4 hover:border-purple-400/30 transition-all duration-300"
        >
          <h3 className="text-cyan-300 font-semibold">AI Insights</h3>
          <p className="text-gray-300 text-sm">
            Integrate live charts or analytics here — e.g., consultation frequency, AI recommendations, etc.
          </p>
        </motion.div>
      </motion.div>

      {/* User History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <UserHistory />
      </motion.div>
    </>
  );
}
