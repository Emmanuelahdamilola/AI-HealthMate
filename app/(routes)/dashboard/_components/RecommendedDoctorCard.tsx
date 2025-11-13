'use client';

import { AiDoctorAgent } from './AiDoctorAgentCard';
import { motion } from 'framer-motion';
import { CheckCircle, Zap } from 'lucide-react';

// --- NEW INTERFACE FOR N-ATLAS DATA ---
interface NatlasMatchReason {
  severity: string;
  keywords: string[];
}

type Props = {
  doctor: AiDoctorAgent;
  setSelectedDoctor: (doctor: AiDoctorAgent) => void;
  selectedDoctor?: AiDoctorAgent;
  //  Pass the N-ATLAS match reason data
  natlasMatchReason?: NatlasMatchReason | null; 
};

// --- Helper function to get matched keywords for display ---
const getDisplayKeywords = (keywords: string[] | undefined) => {
    if (!keywords || keywords.length === 0) return null;
    // Show the top 3 relevant keywords detected in the user's input
    return keywords.slice(0, 3);
};

export function RecommendedDoctorCard({ doctor, setSelectedDoctor, selectedDoctor, natlasMatchReason }: Props) {
    const isSelected = selectedDoctor === doctor;
    const severity = natlasMatchReason?.severity || 'moderate';
    const patientKeywords = getDisplayKeywords(natlasMatchReason?.keywords);

    const getSeverityColor = (sev: string) => {
        switch (sev.toLowerCase()) {
            case 'severe': return 'bg-red-700 text-white';
            case 'moderate': return 'bg-orange-600/70 text-white';
            default: return 'bg-green-700/50 text-white';
        }
    };

    return (
        <motion.div
            onClick={() => setSelectedDoctor(doctor)}
            whileHover={{ scale: 1.03 }}
            // Stronger hover effect to signal intelligence
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`cursor-pointer p-4 rounded-2xl transition-all duration-300 w-full min-h-[220px]
                relative overflow-hidden group border-2 hover:border-cyan-400/80
                ${isSelected
                    ? 'border-cyan-400 bg-indigo-900/90 shadow-[0_0_20px_rgba(52,211,255,0.4)]' // Strong selected state
                    : 'bg-gray-900/70 border-gray-700/50 hover:bg-gray-800/90'} 
            `}
        >
            {/*SELECTION CHECK MARK */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 text-cyan-400 bg-indigo-800/80 rounded-full p-1"
                >
                    <CheckCircle className="w-5 h-5" fill="currentColor" />
                </motion.div>
            )}

            <div className="flex gap-4">
                {/* DOCTOR AVATAR (Left-Aligned) */}
                <div className="flex-shrink-0">
                    <div className={`relative w-14 h-14 rounded-full overflow-hidden border-2 shadow-lg
                        ${isSelected ? 'border-cyan-400' : 'border-purple-400/50'}`}>
                        <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* TEXT CONTENT (Name and Specialty) */}
                <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-white text-lg font-extrabold tracking-tight truncate">
                        {doctor.name}
                    </h3>
                    <span className="text-purple-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-900/40 inline-block mt-1 uppercase">
                        {doctor.specialty}
                    </span>
                </div>
            </div>

            {/* --- N-ATLAS INTELLIGENCE BAR (NEW UI FOCUS) --- */}
            <div className="mt-4 pt-3 border-t border-gray-700/50 space-y-3">
                
                {/*  Severity Match */}
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Patient Severity:
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${getSeverityColor(severity)}`}>
                        {severity.toUpperCase()}
                    </span>
                </div>

                {/*  Matched Symptoms Display */}
                <div className="text-sm">
                    <p className="text-gray-400 mb-1 font-semibold">Detected Symptoms:</p>
                    <div className="flex flex-wrap gap-1">
                        {patientKeywords ? patientKeywords.map((kw, idx) => (
                            <span key={idx} className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md font-medium text-xs">
                                {kw}
                            </span>
                        )) : (
                            <span className="text-gray-500 italic text-xs">No specific symptoms detected.</span>
                        )}
                    </div>
                </div>
                
                {/*  Quick Description Tooltip (Optional visual flair) */}
                <div className="pt-2 text-xs text-gray-500 italic border-t border-gray-800/50">
                    {doctor.description}
                </div>

            </div>
        </motion.div>
    );
}