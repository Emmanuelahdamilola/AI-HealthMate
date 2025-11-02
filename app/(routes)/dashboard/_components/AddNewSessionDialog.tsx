'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconArrowRight } from '@tabler/icons-react';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { AiDoctorAgent } from './AiDoctorAgentCard';
import { RecommendedDoctorCard } from './RecommendedDoctorCard';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from "@/lib/firebase";
import { toast } from 'sonner';

export default function AddNewSession() {
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [aiDoctors, setAiDoctors] = useState<AiDoctorAgent[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<AiDoctorAgent>();
  const router = useRouter();

  // Fetch AI doctor suggestions
  const handleNext = async () => {
    if (!note.trim()) return;

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        toast("You must be signed in to get AI doctor suggestions.");
        return;
      }
      const token = await user.getIdToken(true);

      const result = await axios.post(
        '/api/suggested-ai-doctors-enhanced',
        { notes: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAiDoctors(result.data.success ? result.data.data : []);
    } catch (error) {
      console.error("Error fetching AI doctors:", error);
      setAiDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Start consultation with selected doctor
  const handleStartConsultation = async () => {
    if (!selectedDoctor) {
      toast("Please select a doctor to start the consultation.");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        toast("You must be signed in to start a consultation.");
        return;
      }
      const token = await user.getIdToken(true);

      const response = await axios.post(
        '/api/voice-chat',
        { notes: note, selectedDoctor },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sessionId = response.data?.sessionId;
      if (!sessionId) {
        toast("Session ID not returned. Something went wrong.");
        return;
      }

      router.push(`/dashboard/medical-voice/${sessionId}`);
    } catch (error: any) {
      console.error("Error starting consultation:", error);
      toast("Failed to start consultation. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl w-full mx-auto mt-10 p-6 bg-gray-900/80 border border-cyan-600 rounded-3xl shadow-2xl backdrop-blur-md"
    >
      <h2 className="text-3xl font-bold text-cyan-400 mb-4">
        Start New Consultation
      </h2>

      {/* Step 1: Symptom Input */}
      {aiDoctors.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4"
        >
          <p className="text-cyan-200">
            Describe your symptoms so we can match you with a virtual doctor.
          </p>
          <Textarea
            placeholder="Type your symptoms here..."
            className="h-[160px] bg-gray-800/70 text-white placeholder-cyan-300 border border-cyan-600 focus:ring-2 focus:ring-cyan-400 focus:border-transparent rounded-lg shadow-sm"
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            onClick={handleNext}
            disabled={!note || loading}
            className="w-fit bg-gradient-to-r from-cyan-400 to-purple-700 text-white font-semibold shadow-lg hover:scale-105 transform transition duration-300"
          >
            {loading ? 'Processing...' : <>Next <IconArrowRight className="ml-2" /></>}
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Step 2: Doctor Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {aiDoctors.map((doctor, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-[220px] mx-auto hover:scale-105 hover:shadow-[0_0_15px_rgba(0,255,255,0.6)] transition-transform duration-300"
                >
                  <RecommendedDoctorCard
                    doctor={doctor}
                    setSelectedDoctor={setSelectedDoctor}
                    selectedDoctor={selectedDoctor}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Start Consultation Button */}
          {selectedDoctor && (
            <div className="mt-4 flex justify-center sm:justify-end">
              <Button
                onClick={handleStartConsultation}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-cyan-400 text-white font-semibold shadow-lg hover:scale-105 transform transition duration-300"
              >
                {loading ? 'Processing...' : <>Start Consultation <IconArrowRight className="ml-2" /></>}
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}