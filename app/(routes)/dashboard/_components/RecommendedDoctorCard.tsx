'use client';
import { AiDoctorAgent } from './AiDoctorAgentCard';
import { motion } from 'framer-motion';

type Props = {
  doctor: AiDoctorAgent;
  setSelectedDoctor: (doctor: AiDoctorAgent) => void;
  selectedDoctor?: AiDoctorAgent;
};

export function RecommendedDoctorCard({ doctor, setSelectedDoctor, selectedDoctor }: Props) {
  const isSelected = selectedDoctor === doctor;

  return (
    <motion.div
      onClick={() => setSelectedDoctor(doctor)}
      whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,255,255,0.6)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`cursor-pointer p-2 rounded-xl transition-all duration-300 w-full max-w-[200px] sm:max-w-[220px] 
        ${isSelected
          ? 'border-2 border-cyan-400 bg-gradient-to-br from-cyan-800 to-purple-900 shadow-lg'
          : 'bg-gray-900/70 hover:bg-gray-900/90'} 
      `}
    >
      <div className="flex flex-col items-center justify-center p-4 space-y-3">
        {/* Doctor Avatar */}
        <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md
            ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2' : ''}`}>
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-full h-full object-cover"
          />
          {isSelected && (
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full animate-pulse"></div>
          )}
        </div>

        {/* Doctor Name */}
        <h3 className="text-white text-md font-semibold text-center tracking-wide truncate">
          {doctor.name}
        </h3>

        {/* Doctor Specialty */}
        <span className="text-cyan-400 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-900/40 truncate text-center">
          {doctor.specialty}
        </span>
      </div>
    </motion.div>
  );
}
