
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Header from './Header';

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleStartSession = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/sign-up');
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col items-center justify-start overflow-hidden">
      <Header />

      {/* Hero Section */}
      <div className="z-10 px-6 pt-24 pb-16 text-center max-w-4xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white tracking-tight">
          {"Elevate healthcare delivery using AI-driven voice technology"
            .split(" ")
            .map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="inline-block mr-2"
              >
                {word}
              </motion.span>
            ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-lg text-neutral-400"
        >
          Speak your symptoms, and receive instant recommendations based on global health standards.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <button
            onClick={handleStartSession}
            className="w-60 transform rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:opacity-90 mb-20"
          >
            Start Voice Session
          </button>
        </motion.div>
      </div>

      {/* Medical Disclaimer */}
      <footer className="absolute bottom-4 px-4 text-center text-xs text-neutral-400 max-w-md">
        <p>
          <strong>Disclaimer:</strong> AI HealthMate is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider with any questions you may have regarding a medical condition.
        </p>
      </footer>
    </div>
  );
}
