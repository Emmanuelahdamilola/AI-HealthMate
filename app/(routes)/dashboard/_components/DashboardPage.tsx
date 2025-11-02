'use client';

import { motion } from "framer-motion";
import { Cpu, Clock, BookOpen, Languages, Zap } from "lucide-react";
import UserHistory from "./UserHistory";
import { useState } from "react";

export type Stats = {
  totalConsultations: number;
  lastConsultation: { sessionId: string; createdOn: string } | null;
  patientHistoryCount: number;
};

interface DashboardPageProps {
  stats: Stats | null;
  // Assuming you pass a function to handle the consultation start
  onStartConsultation: (lang: string) => void; 
}

// --- Component Start ---
export default function DashboardPage({ stats, onStartConsultation }: DashboardPageProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');

  const statItems = [
    {
      title: "Total AI Consultations",
      value: stats?.totalConsultations ?? 0,
      icon: Cpu,
    },
    {
      title: "Last Consultation",
      // Format the date more cleanly or use a relative time stamp
      value: stats?.lastConsultation
        ? new Date(stats.lastConsultation.createdOn).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        : "No consultations yet",
      icon: Clock,
    },
    {
      title: "History Records",
      value: stats?.patientHistoryCount ?? 0,
      icon: BookOpen,
    },
  ];

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'yo': return 'Yoruba';
      case 'ig': return 'Igbo';
      case 'ha': return 'Hausa';
      case 'en': return 'English';
      default: return 'English';
    }
  };

  return (
    <div className="space-y-8 p-4"> {/* Add padding and vertical spacing */}
      
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {statItems.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={i}
              // Increased scale for better hover impact
              whileHover={{ scale: 1.05 }} 
              className="bg-[#0f172a] border border-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 transition-all duration-500 relative overflow-hidden group"
            >
              {/* Subtle gradient pulse effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/0 to-purple-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-center gap-5 relative z-10">
                {/* Icon with subtle background */}
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/30 group-hover:border-purple-400/50 transition duration-300">
                  <IconComponent className="text-cyan-400 w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-cyan-300/80 font-medium text-sm tracking-wider uppercase mb-1">
                    {item.title}
                  </h3>
                  {/* Stronger, clearer value typography */}
                  <p className="text-white text-3xl font-extrabold">
                    {item.value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* --- Section Divider --- */}
      <hr className="border-gray-700/50 my-6" />

      {/* Quick Actions (Consultation Start) + AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Quick Actions Card (Now includes Language Selection) */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="lg:col-span-1 bg-[#0f172a] border border-cyan-400/10 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4 hover:border-purple-400/30 transition-all duration-300"
        >
          <h3 className="text-cyan-300 font-semibold mb-2">Start New Consultation</h3>
          
          {/* Language Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-sm flex items-center gap-2">
                <Languages className="w-4 h-4 text-purple-400" />
                Select Consultation Language:
            </label>
            <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-[#1e293b] text-white border border-gray-600 rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
            >
                <option value="english">🇬🇧 English (Default)</option>
                <option value="yoruba">🇳🇬 Yoruba</option>
                <option value="igbo">🇳🇬 Igbo</option>
                <option value="hausa">🇳🇬 Hausa</option>
            </select>
          </div>
          
          {/* Action Button */}
          <button 
            onClick={() => onStartConsultation(selectedLanguage)}
            className="mt-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition py-3 px-4 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]"
          >
            Start {getLanguageName(selectedLanguage)} Voice Chat
          </button>
        </motion.div>

        {/* AI Insights & Summary Card (Placeholder for Charts/N-ATLAS Data) */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="lg:col-span-2 bg-[#0f172a] border border-cyan-400/10 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4 hover:border-purple-400/30 transition-all duration-300"
        >
          <h3 className="text-cyan-300 font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" /> 
            N-ATLAS Consult Summary
          </h3>
          <p className="text-gray-300 text-sm">
            **Feature Placeholder:** This area is perfect for integrating N-ATLAS specific data:
          </p>
          <ul className="text-gray-400 text-sm list-disc list-inside space-y-1">
              <li>**Last Consult Severity:** *Fetch last session's `severity`.*</li>
              <li>**Top 3 Keywords:** *Fetch most frequent `medical_keywords` across history.*</li>
              <li>**Recent Symptoms:** *Show a list of the last detected symptoms.*</li>
          </ul>
        </motion.div>
      </motion.div>

      {/* --- Section Divider --- */}
      <hr className="border-gray-700/50 my-6" />

      {/* User History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <UserHistory />
      </motion.div>
    </div>
  );
}