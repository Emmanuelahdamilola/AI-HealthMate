'use client';

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Vapi from '@vapi-ai/web';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, PhoneCall, PhoneOff, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { getAuth } from 'firebase/auth';

type ReportType = {
  sessionId: string;
  agent: string;
  user: string;
  timestamp: string;
  mainComplaint: string;
  symptoms: string[];
  summary: string;
  duration: string;
  severity: string;
  medicationsMentioned: string[];
  recommendations: string[];
};

export type SessionParams = {
  id: number;
  note: string;
  sessionId: string;
  selectedDoctor?: any;
  report?: ReportType;
  createdOn: string;
  status: string;
};

type Message = {
  role: string;
  text: string;
};

export default function MedicalVoice() {
  const { sessionId } = useParams();
  const vapiRef = useRef<any>(null);
  const startingRef = useRef(false); // prevent concurrent starts

  const [sessionParams, setSessionParams] = useState<SessionParams | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isActive, setIsActive] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  // -- Fetch session data
  useEffect(() => {
    if (sessionId) fetchSessionDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const user = getAuth().currentUser;
      if (!user) {
        toast.error('Please sign in again.');
        return;
      }
      const token = await user.getIdToken();
      const result = await axios.get(`/api/chat-session?sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!result.data?.success) {
        toast.error(result.data?.error || 'Failed to fetch session.');
        return;
      }
      setSessionParams(result.data?.data);
    } catch (err) {
      console.error('❌ Fetch session failed:', err);
      toast.error('Failed to fetch session.');
    } finally {
      setLoading(false);
    }
  };

  // -- Incoming messages handler
  const handleMessage = (message: any) => {
    if (!message) return;
    if (message.type === 'transcript') {
      const { role, transcriptType, transcript } = message;
      if (transcriptType === 'partial') {
        setTranscript(transcript);
        setSpeaking(role);
      } else if (transcriptType === 'final' && transcript?.trim()) {
        setMessages((prev) => [...prev, { role, text: transcript }]);
        setTranscript('');
        setSpeaking(null);
      }
    } else if (message.type === 'assistant' && message?.content) {
      // some SDKs deliver assistant messages in a different shape
      setMessages((prev) => [...prev, { role: 'assistant', text: message.content }]);
    }
  };

  // -- Utility to safely stop and destroy current vapi
  const destroyVapi = async () => {
    if (!vapiRef.current) return;
    try {
      // call stop if available
      if (typeof vapiRef.current.stop === 'function') {
        await vapiRef.current.stop();
      }
    } catch (err) {
      console.warn('Error while stopping Vapi:', err);
    }
    try {
      // If the SDK exposes destroy / cleanup, call it (safe guard)
      if (typeof vapiRef.current.destroy === 'function') {
        vapiRef.current.destroy();
      }
    } catch (err) {
      // ignore
    }
    vapiRef.current = null;
    setIsActive(false);
  };

  // -- Start conversation with retry/backoff on "no-room"
  const startConversation = async (opts?: { retry?: boolean; attempt?: number }) => {
    if (isActive || !sessionParams || startingRef.current) return;
    startingRef.current = true;
    const attempt = opts?.attempt ?? 0;
    const maxAttempts = 3;

    try {
      setLoading(true);

      // Ensure mic permission available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        toast.error('Please allow microphone access.');
        return;
      }

      // Destroy any previous instance to avoid "reusing ended room"
      if (vapiRef.current) {
        await destroyVapi();
      }

      // Create new Vapi instance
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_API_KEY!);
      vapiRef.current = vapi;

      const VapiVoiceConfig = {
        name: 'AI Medical Assistant',
        firstMessage: 'Hello, I’m your AI Medical Assistant. How can I help you today?',
        transcriber: { provider: 'assembly-ai', language: 'en' },
        voice: { provider: 'openai', voiceId: 'nova' },
        model: {
          provider: 'groq',
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content:
                sessionParams?.selectedDoctor?.agentPrompt ||
                'You are an AI medical assistant. Be helpful, empathetic, and concise.',
            },
          ],
        },
      };

      // Bind events
      vapi.on('message', handleMessage);
      vapi.on('call-start', () => {
        setIsActive(true);
        toast.success('Consultation started');
      });
      vapi.on('call-end', () => {
        setIsActive(false);
        toast.success('Consultation ended');
        // ensure we drop reference to expired session
        vapiRef.current = null;
      });
      vapi.on('error', async (error: any) => {
        console.error('❗ Vapi Error:', JSON.stringify(error, null, 2));
        // handle no-room / meeting ended — attempt to recreate a new session
        if (error?.error?.type === 'no-room' || error?.errorMsg?.includes?.('Meeting has ended')) {
          toast.error('Session expired. Attempting to reconnect...');
          // destroy current instance immediately
          try {
            await destroyVapi();
          } catch {}
          // retry with exponential backoff up to maxAttempts
          if (attempt < maxAttempts) {
            const nextAttempt = attempt + 1;
            const backoffMs = Math.pow(2, nextAttempt) * 500; 
            setTimeout(() => {
              startConversation({ retry: true, attempt: nextAttempt });
            }, backoffMs);
          } else {
            toast.error('Unable to reconnect. Please start a new consultation.');
          }
        } else {
          toast.error('Voice assistant error occurred.');
        }
      });

      // Attempt start
      try {
        // @ts-ignore
        await vapi.start(VapiVoiceConfig);
      } catch (err: any) {
        console.error('Vapi.start failed:', err);
        // if start itself errors with no-room, try reconnect logic too
        const isNoRoom = (err?.error?.type === 'no-room') || (err?.message && err.message.includes('no-room'));
        if (isNoRoom && attempt < maxAttempts) {
          await destroyVapi();
          const backoffMs = Math.pow(2, attempt + 1) * 500;
          setTimeout(() => {
            startConversation({ retry: true, attempt: attempt + 1 });
          }, backoffMs);
        } else {
          toast.error('Failed to start consultation.');
          await destroyVapi();
        }
      }
    } finally {
      startingRef.current = false;
      setLoading(false);
    }
  };

  // -- Stop conversation
  const stopConversation = async () => {
    if (!vapiRef.current) {
      setIsActive(false);
      return;
    }
    try {
      await vapiRef.current.stop();
    } catch (err) {
      console.warn('Error stopping Vapi:', err);
    } finally {
      vapiRef.current = null;
      setIsActive(false);
      toast.success('Consultation stopped.');
    }
  };

  // -- Auto cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch {}
        vapiRef.current = null;
      }
    };
  }, []);

  // -- Export transcript to PDF
  const exportTranscriptAsPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text('Consultation Transcript', 10, 10);
    messages.forEach((msg, index) => {
      // keep lines shorter to avoid overflow
      const text = `${msg.role.toUpperCase()}: ${msg.text}`;
      const split = pdf.splitTextToSize(text, 180);
      pdf.text(split, 10, 20 + index * 8);
    });
    pdf.save('consultation_transcript.pdf');
  };

  // -- UI
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-white">
        <Loader className="animate-spin mr-2" /> Loading...
      </div>
    );

  if (!sessionParams)
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        No session data found.
      </div>
    );

  const doctor = sessionParams?.selectedDoctor;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-br from-purple-300 to-blue-300 bg-clip-text text-transparent">
        🩺 Voice Consultation with {doctor?.name || 'Your AI Doctor'}
      </h2>

      <div className="flex flex-col md:flex-row gap-10 w-full max-w-5xl">
        {/* Doctor Info */}
        <motion.div
          className="bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center"
          whileHover={{ scale: 1.02 }}
        >
          {doctor?.image && (
            <Image
              src={doctor.image}
              alt={doctor?.name || 'Doctor'}
              width={100}
              height={100}
              className="rounded-full border-4 border-blue-400 shadow-lg"
            />
          )}
          <h3 className="text-xl font-semibold mt-4 text-center">{doctor?.name}</h3>
          <p className="text-sm text-gray-400">{doctor?.specialty}</p>
          <div className="flex items-center gap-2 mt-2">
            <Circle className={`w-3 h-3 ${isActive ? 'text-green-400' : 'text-red-400'}`} />
            {isActive ? 'Online' : 'Offline'}
          </div>
        </motion.div>

        {/* Chat Section */}
        <motion.div className="bg-gray-800 rounded-2xl shadow-xl p-6 flex-1 flex flex-col">
          <h4 className="text-lg font-semibold mb-4">Conversation</h4>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] p-2">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-xl text-sm w-fit max-w-[80%] ${
                    msg.role === 'assistant' ? 'bg-blue-600 self-start' : 'bg-purple-500 self-end ml-auto'
                  }`}
                >
                  {msg.text}
                </motion.div>
              ))}
            </AnimatePresence>

            {transcript && (
              <div className="text-blue-300 italic">
                {speaking}: {transcript}
              </div>
            )}
          </div>

          {isActive && (
            <div className="flex justify-center my-4">
              <div className="w-6 h-6 bg-blue-400 rounded-full animate-ping" />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            {!isActive ? (
              <Button onClick={() => startConversation()} disabled={loading}>
                <PhoneCall className="mr-2" /> Start Consultation
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopConversation}>
                <PhoneOff className="mr-2" /> End Consultation
              </Button>
            )}
            <Button variant="outline" onClick={exportTranscriptAsPDF}>
              Export as PDF
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
