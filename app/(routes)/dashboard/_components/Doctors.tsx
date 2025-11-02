'use client'

import { AiDoctorList } from '@/shared/doctorList'
import React, { useState } from 'react' // Import useState for the language selection state
import AiDoctorAgentCard from './AiDoctorAgentCard'
import { motion } from 'framer-motion'
import { Languages } from 'lucide-react'

// Define the core supported languages for the selector
const SUPPORTED_LANGUAGES = [
    { code: 'english', name: '🇬🇧 English' },
    { code: 'yoruba', name: '🇳🇬 Yoruba' },
    { code: 'igbo', name: '🇳🇬 Igbo' },
    { code: 'hausa', name: '🇳🇬 Hausa' },
];

export default function AIDoctors() {
    // State to hold the globally selected language for all cards
    const [selectedLanguage, setSelectedLanguage] = useState<string>('english'); 

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-10 px-4 max-w-7xl mx-auto" // Added max-width and margin for better layout
        >
            {/* 1. Language Selector Header (UI Enhancement) */}
            <div className="mb-8 p-4 bg-[#111827] rounded-xl shadow-2xl border border-purple-500/30">
                <h2 className="text-2xl font-extrabold text-white mb-3 flex items-center gap-3">
                    <Languages className="w-6 h-6 text-cyan-400" />
                    Choose Your Consultation Language
                </h2>
                
                {/* Global Language Dropdown */}
                <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="mt-2 text-lg bg-gray-700 text-white border border-gray-600 rounded-lg p-3 w-full sm:w-auto 
                                focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.name}
                        </option>
                    ))}
                </select>
                <p className="mt-2 text-sm text-gray-400 italic">
                    All doctor consultations will start in **{selectedLanguage.toUpperCase()}**.
                </p>
            </div>

            {/* 2. Doctor Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
                {AiDoctorList.map((doctor, index) => (
                    <motion.div
                        key={doctor.id || index} // Use the unique ID if available
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <AiDoctorAgentCard 
                            AiDoctorAgent={doctor} 
                            // CRITICAL FIX: Pass the state variable for the language
                            initialLanguage={selectedLanguage} 
                        />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}