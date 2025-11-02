'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, PhoneOff, Loader2, Languages, Mic, Volume2 } from 'lucide-react';
import { getAuth, User } from 'firebase/auth';
import { toast } from 'sonner';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Vapi from '@vapi-ai/web';
import { motion } from 'framer-motion';

// --- INTERFACES ---
interface NatlasMetadata {
  keywords: string[];
  severity: string;
  matchType: string;
  cached: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language?: string;
  natlasData?: NatlasMetadata;
}

interface DoctorAgent {
  name: string;
  specialty: string;
  image: string;
  agentPrompt: string;
  doctorVoiceId: string;
}

interface FullSessionData {
  sessionId: string;
  conversation: Message[];
  selectedDoctor: DoctorAgent;
  language: string;
}

interface VoiceConsultationProps {
  onSessionEnd?: () => void;
}

type VapiMessage = {
  role: string;
  text: string;
  natlasData?: NatlasMetadata;
  language?: string;
};

// Language options
const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English', deepgramCode: 'en' },
  { code: 'en-NG', label: '🇳🇬 Nigerian English', deepgramCode: 'en-NG' },
  { code: 'yo', label: '🇳🇬 Yoruba', deepgramCode: 'yo' },
  { code: 'ig', label: '🇳🇬 Igbo', deepgramCode: 'ig' },
  { code: 'ha', label: '🇳🇬 Hausa', deepgramCode: 'ha' },
];

export default function VoiceConsultation({ onSessionEnd }: VoiceConsultationProps) {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // --- STATE ---
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [sessionData, setSessionData] = useState<FullSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-NG');
  const [showLanguageSelector, setShowLanguageSelector] = useState(true);
  const [startCall, setStartCall] = useState(false);
  const [vapiInstance, setVapiInstance] = useState<any>(null);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [callLoading, setCallLoading] = useState(false);
  const [voiceAnimating, setVoiceAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const doctorProfile: DoctorAgent | undefined = sessionData?.selectedDoctor;
  const doctorName = doctorProfile?.name || 'AI Doctor';
  const doctorImage = doctorProfile?.image || '/default-doctor.png';
  const doctorSpecialty = doctorProfile?.specialty || 'Medical Assistant';

  // --- GET CURRENT USER ---
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setError('User not authenticated. Please log in.');
      setLoading(false);
      router.replace('/sign-in'); // redirect to login
    } else {
      setFirebaseUser(user);
    }
  }, [router]);

  // --- FETCH SESSION DATA ---
  useEffect(() => {
    const fetchSessionDetails = async (user: User) => {
      if (!sessionId) return;

      setLoading(true);

      try {
        const token = await user.getIdToken(true);

        const response = await axios.get(`/api/voice-chat?sessionId=${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = response.data.data as FullSessionData;

        setSessionData(data);
        setMessages(
          data.conversation?.map(msg => ({
            role: msg.role,
            text: msg.content
          })) || []
        );

        // Set initial language from session
        if (data.language) {
          const langMap: Record<string, string> = {
            'yoruba': 'yo',
            'igbo': 'ig',
            'hausa': 'ha',
            'english': 'en',
            'en-NG': 'en-NG',
          };
          setSelectedLanguage(langMap[data.language] || 'en-NG');
        }

        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch session details:", err.response?.status, err.message);
        if (err.response?.status === 401) {
          setError("Session access unauthorized. Please log in again.");
          router.replace('/sign-in'); // redirect to login
        } else {
          setError("Could not load consultation history.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (firebaseUser) {
      fetchSessionDetails(firebaseUser);
    }
  }, [sessionId, firebaseUser, router]);

  // --- AUTO SCROLL ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- VAPI MESSAGE HANDLER ---
  const handleVapiMessage = async (message: any) => {
    if (message.type === 'transcript') {
      const { role, transcriptType, transcript } = message;

      if (transcriptType === 'partial') {
        setCurrentTranscript(transcript);
        setSpeaking(role);
        setVoiceAnimating(true);
      } else if (transcriptType === 'final' && transcript?.trim()) {
        setMessages(prev => [...prev, { role, text: transcript }]);
        setCurrentTranscript('');
        setSpeaking(null);
        setVoiceAnimating(false);
      }
    }

    if (message.languageDetected && message.languageDetected !== selectedLanguage) {
      setDetectedLanguage(message.languageDetected);
      toast.info(`Language switched to ${message.languageDetected}`);
    }
  };

  // --- START VAPI CALL ---
  const handleStartCall = async () => {
    if (!doctorProfile) {
      toast.error('Doctor profile not loaded');
      return;
    }

    setCallLoading(true);
    setShowLanguageSelector(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast.error("Please allow microphone access to start the call.");
      setCallLoading(false);
      setShowLanguageSelector(true);
      return;
    }

    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_API_KEY!);
    setVapiInstance(vapi);

    const selectedLangConfig = LANGUAGES.find(l => l.code === selectedLanguage);
    const deepgramLang = selectedLangConfig?.deepgramCode || 'en-NG';

    const VapiConfig = {
      name: `AI Medical Assistant - ${doctorName}`,
      firstMessage: `Hello, I'm ${doctorName}, your ${doctorSpecialty}. I'm here to listen and help with your health concerns. What would you like to discuss today?`,
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: deepgramLang,
        smartFormat: true,
        languageDetection: true,
      },
      voice: {
        provider: 'playht',
        voiceId: doctorProfile.doctorVoiceId,
      },
      model: {
        provider: 'groq',
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: doctorProfile.agentPrompt + `\n\nIMPORTANT: You are conversing in ${selectedLangConfig?.label}. Respond naturally in this language.`,
          }
        ],
      },
    };
    // @ts-ignore
    vapi.start(VapiConfig);

    vapi.on('call-start', () => {
      setStartCall(true);
      setCallLoading(false);
      toast.success("Call connected! You can start speaking now.");
    });

    vapi.on('call-end', () => handleCallEnd());
    vapi.on('message', handleVapiMessage);
    vapi.on('speech-start', () => { setSpeaking('assistant'); setVoiceAnimating(true); });
    vapi.on('speech-end', () => { setSpeaking('user'); setVoiceAnimating(false); });
    vapi.on('error', (error: any) => {
      console.error("❗ VAPI Error:", error);
      toast.error('Call error: ' + (error.message || 'Unknown error'));
      setCallLoading(false);
    });
  };

  // --- END VAPI CALL ---
  const handleCallEnd = async () => {
    setCallLoading(true);

    if (vapiInstance) {
      vapiInstance.stop();
      vapiInstance.removeAllListeners();
      setVapiInstance(null);
    }

    setStartCall(false);
    setSpeaking(null);
    setVoiceAnimating(false);

    try {
      await generateMedicalReport();
      toast.success("Consultation ended. Report generated!");
      router.push('/dashboard/history');
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error('Failed to generate report');
    } finally {
      setCallLoading(false);
    }
  };

  const generateMedicalReport = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    await axios.post('/api/medical-report', {
      messages,
      sessionParams: sessionData,
      sessionId,
    }, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  };

  const getLanguageFlag = (code: string) => {
    const lang = LANGUAGES.find(l => l.code === code);
    return lang?.label || code;
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white bg-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="mt-4">Loading consultation...</p>
      </div>
    );
  }

  if (error && !doctorProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white bg-gray-900">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <p className="text-gray-400">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white bg-gray-900">
        <p className="text-yellow-500 text-lg mb-4">Doctor profile missing.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-screen overflow-hidden relative">

      {/* DOCTOR BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: `url(${doctorImage})`, filter: 'brightness(0.3) blur(2px)' }}
      />

      {/* LANGUAGE SELECTOR OVERLAY (Before Call) */}
      {showLanguageSelector && !startCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-gray-900/90 p-8 rounded-2xl border border-white/20 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Select Consultation Language</h2>
            <p className="text-gray-400 text-sm mb-6 text-center">Choose your preferred language for the consultation</p>

            <div className="space-y-3 mb-6">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${selectedLanguage === lang.code
                    ? 'border-indigo-500 bg-indigo-500/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    } text-white font-medium`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleStartCall}
              disabled={callLoading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {callLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <PhoneCall className="w-5 h-5" />
                  Start Consultation
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* HEADER */}
      <div className="relative z-10 bg-black/50 p-4 flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-white/70 overflow-hidden">
            <img
              src={doctorImage}
              alt={doctorName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{doctorName}</h2>
            <p className="text-sm text-gray-300">{doctorSpecialty}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm bg-black/30 px-3 py-1.5 rounded-full">
            <Languages className="w-4 h-4 text-green-400" />
            <span className="text-gray-200">{getLanguageFlag(detectedLanguage || selectedLanguage)}</span>
          </div>
          {startCall && (
            <div className="flex items-center gap-1 text-xs bg-red-600/80 px-3 py-1.5 rounded-full animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full" />
              LIVE
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 flex flex-col justify-end">
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                  ? 'bg-indigo-600/90 text-white'
                  : 'bg-black/70 text-white border border-white/10'
                  }`}
              >
                <p className="leading-relaxed">{msg.text}</p>

                {/* 🎯 N-ATLAS METADATA DISPLAY */}
                {msg.role === 'user' && msg.natlasData && (
                  <div className="mt-2 pt-2 border-t border-white/20 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-bold text-yellow-300">N-ATLAS:</span>
                      <span className={`px-2 py-0.5 rounded ${msg.natlasData.severity === 'critical' ? 'bg-red-600/80' :
                        msg.natlasData.severity === 'high' ? 'bg-orange-600/80' :
                          msg.natlasData.severity === 'moderate' ? 'bg-yellow-600/80' :
                            'bg-green-600/80'
                        }`}>
                        {msg.natlasData.severity.toUpperCase()}
                      </span>
                      <span className="text-white/70">({msg.natlasData.matchType})</span>
                    </div>
                    {msg.natlasData.keywords && msg.natlasData.keywords.length > 0 && (
                      <p className="text-white/60 text-[10px]">
                        Keywords: {msg.natlasData.keywords.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Current Transcript (Partial) */}
          {currentTranscript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex ${speaking === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-gray-700/50 text-gray-300 italic border border-gray-600">
                <p className="leading-relaxed">{currentTranscript}</p>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* CALL CONTROLS */}
      <div className="relative z-10 bg-black/70 p-6 border-t border-white/10">

        {/* Voice Animation Indicator */}
        {startCall && (
          <div className="mb-4 flex items-center justify-center gap-3">
            {speaking === 'assistant' && voiceAnimating && (
              <div className="flex items-center gap-2 text-green-400">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">Doctor speaking...</span>
              </div>
            )}
            {speaking === 'user' && !voiceAnimating && (
              <div className="flex items-center gap-2 text-blue-400">
                <Mic className="w-5 h-5" />
                <span className="text-sm font-medium">Listening to you...</span>
              </div>
            )}
          </div>
        )}

        {/* Call Button */}
        <div className="flex items-center justify-center">
          {!startCall ? (
            <button
              onClick={() => setShowLanguageSelector(true)}
              disabled={callLoading}
              className="w-20 h-20 rounded-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-2xl transition-all"
            >
              {callLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <PhoneCall className="w-8 h-8" />
              )}
            </button>
          ) : (
            <button
              onClick={handleCallEnd}
              disabled={callLoading}
              className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-2xl transition-all animate-pulse"
            >
              {callLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <PhoneOff className="w-8 h-8" />
              )}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          {callLoading
            ? 'Please wait...'
            : startCall
              ? 'Tap to end consultation'
              : 'Select language to start consultation'}
        </p>
      </div>
    </div>
  );
}