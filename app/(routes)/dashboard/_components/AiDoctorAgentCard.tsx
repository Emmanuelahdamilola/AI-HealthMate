'use client'

import { Button } from '@/components/ui/button'; 
import { IconArrowRight, IconLoader, IconLanguage } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useContext } from 'react'; 
import axios from 'axios';
import { motion } from 'framer-motion';
import { UserDetailContext } from '@/context/UserDetailProvider';
import { toast } from 'sonner';

export type AiDoctorAgent = {
  id: number,
  name: string,
  specialty: string,
  description: string,
  image: string,
  agentPrompt: string,
  doctorVoiceId?: string,
  specialtyKeywords?: string[]; 
}

type Props = {
  AiDoctorAgent: AiDoctorAgent;
  initialLanguage: string; 
}

export default function AiDoctorAgentCard({ AiDoctorAgent, initialLanguage }: Props) {
  const router = useRouter();
  const context = useContext(UserDetailContext);
  const [isStartingConsultation, setIsStartingConsultation] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage); 

  const handleStartConsultation = async () => {
    // ✅ FIX: Check authentication first
    if (!context?.user) {
      toast.error('Please sign in to start a consultation');
      router.push('/sign-in');
      return;
    }

    setIsStartingConsultation(true);
    
    try {
      console.log('🏥 Starting consultation with:', AiDoctorAgent.name);
      
      //  Get authentication token
      const token = await context.user.getIdToken(true);
      
      //  Send correct payload structure matching your API
      const payload = {
        notes: `I want to consult with Dr. ${AiDoctorAgent.name} about ${AiDoctorAgent.specialty}`, // Changed from 'note' to 'notes'
        selectedDoctor: {
          id: AiDoctorAgent.id,
          name: AiDoctorAgent.name,
          specialty: AiDoctorAgent.specialty,
          description: AiDoctorAgent.description,
          image: AiDoctorAgent.image,
          agentPrompt: AiDoctorAgent.agentPrompt,
          doctorVoiceId: AiDoctorAgent.doctorVoiceId,
        },
        language: selectedLanguage,

      };

      console.log('📤 Sending payload:', payload);

      const res = await axios.post('/api/voice-chat', payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Consultation started:', res.data);

      if (res.data.success && res.data.sessionId) {
        toast.success(`Consultation started with ${AiDoctorAgent.name}!`);
        router.push(`/dashboard/consultation/${res.data.sessionId}`);
      } else {
        throw new Error('Failed to get session ID');
      }

    } catch (err: any) {
      console.error('❌ Failed to start consultation:', err);
      
      // Better error messages
      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        router.push('/sign-in');
      } else if (err.response?.status === 400) {
        toast.error(`Invalid request: ${err.response.data?.error || 'Please try again'}`);
      } else if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please check your connection.');
      } else {
        toast.error(err.response?.data?.error || 'Unable to start consultation. Please try again.');
      }
    } finally {
      setIsStartingConsultation(false);
    }
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'yoruba': return '🇳🇬 Yoruba';
      case 'igbo': return '🇳🇬 Igbo';
      case 'hausa': return '🇳🇬 Hausa';
      case 'english': return '🇬🇧 English';
      default: return '🇬🇧 English';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-xs flex flex-col bg-[#111827] rounded-2xl shadow-lg overflow-hidden border border-cyan-500/20 
                 relative group transform-gpu hover:shadow-cyan-500/30 transition-all duration-300"
    >
      {/* Glowing border effect on hover */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 group-hover:inset-[-2px]"
           style={{
             background: 'linear-gradient(135deg, rgba(52,211,255,0.8), rgba(168,85,247,0.8))',
             mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
             WebkitMaskComposite: 'xor',
             maskComposite: 'exclude',
             opacity: 0,
             transition: 'opacity 0.4s ease-out, inset 0.3s ease-out',
             WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
           }}
           aria-hidden="true"
      />

      {/* Image with Gradient Overlay */}
      <div className="relative w-full h-48 flex-shrink-0 bg-black">
        <Image
          src={AiDoctorAgent.image}
          alt={AiDoctorAgent.name}
          fill
          className="object-cover object-top opacity-70 group-hover:opacity-100 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow gap-2 text-white relative z-10">
        <h3 className="text-xl font-extrabold text-cyan-300 mb-1">{AiDoctorAgent.name}</h3>
        
        {/* Specialty Tag */}
        <span className="text-xs font-semibold uppercase bg-gradient-to-r from-cyan-400 to-purple-500 px-3 py-1 rounded-full inline-block self-start shadow-md tracking-wide">
          {AiDoctorAgent.specialty}
        </span>
        
        <p className="text-sm text-gray-300 line-clamp-3 mt-3">
          {AiDoctorAgent.description}
        </p>

        {/* Specialty Keywords */}
        {AiDoctorAgent.specialtyKeywords && AiDoctorAgent.specialtyKeywords.length > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            <p className="font-semibold text-cyan-400">Focus Areas:</p>
            <ul className="flex flex-wrap gap-1 mt-1">
              {AiDoctorAgent.specialtyKeywords.map((keyword, idx) => (
                <li key={idx} className="bg-gray-700/50 px-2 py-0.5 rounded-md text-gray-200">
                  {keyword}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Language Selector */}
        <div className="mt-4 flex flex-col gap-2">
            <label htmlFor={`lang-select-${AiDoctorAgent.id}`} className="text-gray-300 text-sm flex items-center gap-2">
                <IconLanguage className="w-4 h-4 text-purple-400" />
                Consult in:
            </label>
            <select
                id={`lang-select-${AiDoctorAgent.id}`}
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-[#1e293b] text-white border border-gray-600 rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                disabled={isStartingConsultation}
            >
                <option value="english">🇬🇧 English</option>
                <option value="yoruba">🇳🇬 Yoruba</option>
                <option value="igbo">🇳🇬 Igbo</option>
                <option value="hausa">🇳🇬 Hausa</option>
            </select>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex justify-center">
          <Button
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-600 text-white 
                       px-6 py-3 rounded-xl text-base font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] 
                       transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStartConsultation}
            disabled={isStartingConsultation || !context?.user}
          >
            {isStartingConsultation ? (
              <>
                <IconLoader className="w-5 h-5 animate-spin" /> Starting...
              </>
            ) : !context?.user ? (
              <>
                Sign In to Consult
              </>
            ) : (
              <>
                Start Consultation <IconArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}