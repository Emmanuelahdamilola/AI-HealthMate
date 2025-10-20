'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { SessionParams } from '../medical-voice/[sessionId]/page';
import { X } from 'lucide-react';

export default function UserHistory() {
  const [history, setHistory] = useState<SessionParams[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionParams | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        toast.error('You must be signed in to view your medical history.', { duration: 3500 });
        return;
      }

      try {
        const token = await user.getIdToken();
        const result = await axios.get('/api/chat-session?sessionId=all', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data: SessionParams[] = Array.isArray(result.data.data)
          ? result.data.data
          : [];
        setHistory(data);
      } catch (err) {
        console.error('Error fetching session history:', err);
        toast.error('Failed to fetch your medical history. Please try again.');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 text-gray-300"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full mb-4"
        />
        <p>Loading your medical history...</p>
      </motion.div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto px-6 py-10 flex flex-col items-center justify-center text-center 
        bg-gradient-to-b from-gray-900/40 to-gray-900/80 rounded-2xl shadow-lg"
      >
        <Image
          src="/assistant-doctors.png"
          width={180}
          height={180}
          alt="No History"
          className="mb-6 opacity-90"
        />
        <h2 className="text-2xl font-semibold text-cyan-400 mb-2">
          No Medical History Yet
        </h2>
        <p className="text-gray-400">
          You haven’t had any consultations yet. Your records will appear here once you do.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl mx-auto px-6 py-10 overflow-x-auto"
      >
        <motion.table
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="min-w-full border-collapse text-left bg-gray-900/60 
          backdrop-blur-md border border-cyan-500/20 rounded-2xl shadow-md overflow-hidden"
        >
          <thead className="bg-gradient-to-r from-purple-700/60 to-cyan-700/60 text-white uppercase text-sm">
            <tr>
              <th className="py-4 px-6">Doctor</th>
              <th className="py-4 px-6">Specialty</th>
              <th className="py-4 px-6">Date</th>
              <th className="py-4 px-6 text-center">View</th>
            </tr>
          </thead>
          <tbody>
            {history.map((session, i) => (
              <motion.tr
                key={session.sessionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-cyan-500/10 hover:bg-cyan-500/10 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedSession(session)}
              >
                <td className="py-3 px-6 text-gray-200 font-medium">
                  {session.selectedDoctor?.name || '—'}
                </td>
                <td className="py-3 px-6 text-gray-400">
                  {session.selectedDoctor?.specialty || '—'}
                </td>
                <td className="py-3 px-6 text-gray-400">
                  {new Date(session.createdOn).toLocaleDateString()}
                </td>
                <td className="py-3 px-6 text-center">
                  <span className="text-cyan-400 hover:underline">Open</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
      </motion.div>

      {/* 🔹 Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gray-900 text-gray-100 rounded-2xl shadow-2xl w-full max-w-3xl p-8 overflow-y-auto max-h-[80vh]"
            >
              <button
                onClick={() => setSelectedSession(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>

              <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
                {selectedSession.selectedDoctor?.name || 'Consultation Details'}
              </h2>

              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-medium text-purple-400 mb-1">Doctor Specialty:</h3>
                  <p className="text-gray-300">
                    {selectedSession.selectedDoctor?.specialty || '—'}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-purple-400 mb-1">Notes:</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {selectedSession.note || 'No notes provided.'}
                  </p>
                </div>

                {selectedSession.report && Object.keys(selectedSession.report).length > 0 && (
                  <div>
                    <h3 className="font-medium text-purple-400 mb-1">AI Report:</h3>
                    <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto text-gray-200 text-xs">
                      {JSON.stringify(selectedSession.report, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
