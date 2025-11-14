'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, Volume2, MicOff, ArrowLeft } from 'lucide-react';
import { getAuth, User } from 'firebase/auth';
import { toast } from 'sonner';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language?: string;
  audioBase64?: string;
}

interface DoctorAgent {
  name: string;
  specialty: string;
  image: string;
}

interface FullSessionData {
  sessionId: string;
  conversation: Message[];
  selectedDoctor: DoctorAgent;
  language: string;
}

function base64ToBlob(base64: string, mimeType: string = 'audio/wav'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export default function VoiceConsultation() {
  const params = useParams();
  const router = useRouter();
  const sessionIdParam = params.sessionId as string;

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [sessionData, setSessionData] = useState<FullSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [greetingPlayed, setGreetingPlayed] = useState(false);
  const [canRecord, setCanRecord] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const doctorProfile = sessionData?.selectedDoctor;
  const doctorName = doctorProfile?.name || 'AI Doctor';
  const doctorImage = doctorProfile?.image || '/default-doctor.png';
  const doctorSpecialty = doctorProfile?.specialty || 'Medical Assistant';
  const sessionLanguage = sessionData?.language || 'english';

  // Firebase auth
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      router.replace('/sign-in');
    } else {
      setFirebaseUser(user);
    }
  }, [router]);

  // Fetch session
  useEffect(() => {
    const fetchSession = async (user: User) => {
      if (!sessionIdParam) return;

      try {
        const token = await user.getIdToken();
        const response = await axios.get(`/api/voice-chat?sessionId=${sessionIdParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data.data as FullSessionData;
        setSessionData(data);

        const conversationMessages = (data.conversation || []).filter(
          msg => msg.role === 'user' || msg.role === 'assistant'
        );
        setMessages(conversationMessages);

      } catch (err) {
        console.error('Failed to fetch session:', err);
        toast.error('Could not load consultation');
      } finally {
        setLoading(false);
      }
    };

    if (firebaseUser) fetchSession(firebaseUser);
  }, [sessionIdParam, firebaseUser]);

  // Generate greeting and start call
  const startCall = async () => {
    if (!doctorProfile || !firebaseUser) return;

    setCallActive(true);
    setProcessingStage('Connecting to doctor...');
    setIsProcessing(true);

    try {
      const token = await firebaseUser.getIdToken();
      // Use a simple text request to trigger the greeting
      const greetingPrompt = "start consultation";

      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: sessionData?.sessionId || sessionIdParam,
          userMessage: greetingPrompt,
          language: sessionLanguage,
          doctorProfile: {
            name: doctorProfile.name,
            specialty: doctorProfile.specialty,
          },
        }),
      });

      const result = await response.json();
      console.log('✅ Greeting response:', result);

      if (result.success && result.data) {
        const greetingMessage: Message = {
          role: 'assistant',
          content: result.data.doctorResponse,
          timestamp: new Date().toISOString(),
          audioBase64: result.data.audioBase64,
        };

        setMessages([greetingMessage]);
        setProcessingStage('Doctor is speaking...');

        // Play greeting audio
        if (result.data.audioBase64) {
          const audioBlob = base64ToBlob(result.data.audioBase64);
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          setCurrentAudio(audio);

          audio.onloadeddata = () => {
            console.log('✅ Audio loaded, duration:', audio.duration);
          };

          audio.onended = () => {
            console.log('✅ Greeting finished');
            URL.revokeObjectURL(audioUrl);
            setCurrentAudio(null);
            setGreetingPlayed(true);
            setIsProcessing(false);
            setProcessingStage('');
            setCanRecord(true); // Enable recording controls
            toast.success('Your turn to speak!');
          };

          audio.onerror = (e) => {
            console.error('❌ Audio error:', e);
            URL.revokeObjectURL(audioUrl);
            setCurrentAudio(null);
            setGreetingPlayed(true);
            setIsProcessing(false);
            setProcessingStage('');
            setCanRecord(true);
            toast.error('Audio playback failed, but you can start speaking');
          };

          // Add play promise handling
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => console.log('✅ Audio playing'))
              .catch((e) => {
                console.error('❌ Play failed:', e);
                audio.dispatchEvent(new Event('ended'));
              });
          }
        } else {
          // No audio, enable recording immediately
          setGreetingPlayed(true);
          setIsProcessing(false);
          setProcessingStage('');
          setCanRecord(true);
        }
      } else {
        throw new Error(result.error || 'Failed to start consultation');
      }
    } catch (err: any) {
      console.error('❌ Call start error:', err);
      toast.error('Failed to start consultation: ' + err.message);
      setCallActive(false);
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // End call
  const endCall = () => {
    if (messages.length > 1) {
      setShowExitConfirm(true);
    } else {
      confirmEndCall();
    }
  };

  const confirmEndCall = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    router.push('/dashboard');
  };

  const cancelEndCall = () => {
    setShowExitConfirm(false);
  };

  // Recording functions
  const startRecording = async () => {
    if (!callActive || !canRecord) {
      toast.error('Please wait for doctor to finish speaking');
      return;
    }

    if (isProcessing || currentAudio) {
      toast.error('Please wait...');
      return;
    }

    try {
      console.log('🎤 Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log('📦 Chunk received:', e.data.size);
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Recording stopped, chunks:', chunksRef.current.length);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('📦 Audio blob size:', audioBlob.size);

        // Always stop the stream tracks immediately on stop
        stream.getTracks().forEach((track) => track.stop());
        
        // Setting isRecording to false here finalizes the recording UI state 
        // before processing begins.
        setIsRecording(false); 
        
        if (audioBlob.size > 0) {
          await processRecording(audioBlob);
        } else {
          toast.error('No audio recorded');
          // Re-enable recording if no audio was recorded
          setCanRecord(true); 
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCanRecord(false); // Disable button while recording
      toast.success('Recording... Speak now!');
      console.log('✅ Recording started');
    } catch (err: any) {
      console.error('❌ Microphone error:', err);
      toast.error('Microphone access denied');
      setIsRecording(false);
      setCanRecord(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️ Stopping recording...');
      mediaRecorderRef.current.stop();
      // We rely on the mediaRecorder.onstop event to call setIsRecording(false)
      // and then process the blob.
    }
  };

  // Process recording
  const processRecording = async (audioBlob: Blob) => {
    if (!doctorProfile || !firebaseUser) return;

    setIsProcessing(true);
    setProcessingStage('Transcribing...');

    try {
      const token = await firebaseUser.getIdToken();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('doctor_name', doctorProfile.name);
      formData.append('doctor_specialty', doctorProfile.specialty);
      formData.append('sessionId', sessionData?.sessionId || sessionIdParam);

      console.log('📤 Sending audio to API...');

      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      setProcessingStage('Analyzing...');

      const result = await response.json();
      console.log('✅ API response:', result);

      if (result.success && result.data) {
        setProcessingStage('Generating response...');

        const newMessages: Message[] = [];

        // Add user message
        if (result.data.userText) {
          newMessages.push({
            role: 'user',
            content: result.data.userText,
            timestamp: new Date().toISOString(),
            language: result.data.language,
          });
        }

        // Add doctor response
        if (result.data.doctorResponse) {
          newMessages.push({
            role: 'assistant',
            content: result.data.doctorResponse,
            timestamp: new Date().toISOString(),
            audioBase64: result.data.audioBase64,
          });
        }

        setMessages((prev) => [...prev, ...newMessages]);
        toast.success('Response received!');

        // Play response audio
        if (result.data.audioBase64) {
          if (currentAudio) {
            currentAudio.pause();
            setCurrentAudio(null);
          }

          setProcessingStage('Playing response...');

          const audioBlob = base64ToBlob(result.data.audioBase64);
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          setCurrentAudio(audio);

          audio.onended = () => {
            console.log('✅ Response audio finished');
            URL.revokeObjectURL(audioUrl);
            setCurrentAudio(null);
            setIsProcessing(false);
            setProcessingStage('');
            setCanRecord(true); // Re-enable recording
            toast.success('Your turn to speak!');
          };

          audio.onerror = (e) => {
            console.error('❌ Response audio error:', e);
            URL.revokeObjectURL(audioUrl);
            setCurrentAudio(null);
            setIsProcessing(false);
            setProcessingStage('');
            setCanRecord(true);
            toast.error('Audio playback failed');
          };

          await audio.play();
        } else {
          setIsProcessing(false);
          setProcessingStage('');
          setCanRecord(true);
        }
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (err: any) {
      console.error('❌ Processing error:', err);
      toast.error('Failed: ' + err.message);
      setIsProcessing(false);
      setProcessingStage('');
      setCanRecord(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading consultation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={cancelEndCall}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <MicOff className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    End Consultation?
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Are you sure you want to end the call? Your consultation will be saved.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelEndCall}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-700 text-white font-medium transition-all"
                >
                  Continue Call
                </button>
                <button
                  onClick={confirmEndCall}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all"
                >
                  End Call
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={endCall}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20">
                <img src={doctorImage} alt={doctorName} className="w-full h-full object-cover" />
              </div>
              {callActive && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-white font-semibold text-lg">{doctorName}</h2>
              <p className="text-indigo-300 text-sm">{doctorSpecialty}</p>
            </div>

            {callActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-medium">On Call</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">

        {!callActive ? (
          // Pre-call screen
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-indigo-500/30 shadow-2xl">
              <img src={doctorImage} alt={doctorName} className="w-full h-full object-cover" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">{doctorName}</h2>
            <p className="text-indigo-300 mb-8">{doctorSpecialty}</p>

            <button
              onClick={startCall}
              disabled={isProcessing}
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 shadow-2xl shadow-green-500/50 flex items-center justify-center transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </button>

            <p className="text-gray-400 text-sm mt-4">
              {isProcessing ? processingStage : 'Tap to start voice consultation'}
            </p>
          </motion.div>
        ) : (
          // In-call screen
          <div className="w-full max-w-2xl">

            {/* Status Indicator */}
            <AnimatePresence>
              {(currentAudio || isProcessing || isRecording) && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-8 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30"
                >
                  {currentAudio ? (
                    <>
                      <Volume2 className="w-6 h-6 text-green-400 animate-pulse" />
                      <span className="text-green-400 font-medium">Doctor is speaking...</span>
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-4 bg-green-400 rounded-full animate-pulse"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </>
                  ) : isRecording ? (
                    <>
                      <Mic className="w-6 h-6 text-red-400 animate-pulse" />
                      <span className="text-red-400 font-medium">🔴 Listening to you...</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                      <span className="text-indigo-400 font-medium">{processingStage}</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transcript */}
            <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-h-96 overflow-y-auto">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Live Transcript
              </h3>

              {messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Conversation will appear here...
                </p>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center justify-center gap-4">
              {/* Recording Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isRecording && (!canRecord || isProcessing || !!currentAudio)}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording
                    ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/50 animate-pulse'
                    : 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/50 hover:shadow-indigo-500/70'
                }`}
              >
                {isRecording ? (
                  <Square className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-2xl shadow-red-500/50 flex items-center justify-center transition-all"
              >
                <MicOff className="w-7 h-7 text-white" />
              </button>
            </div>

            {/* Status Text */}
            <p className="text-center text-sm text-gray-400 mt-4">
              {!canRecord && !isRecording && !isProcessing ? (
                'Please wait for doctor to finish...'
              ) : isRecording ? (
                'Tap square to stop recording'
              ) : canRecord ? (
                'Tap microphone to speak'
              ) : (
                'Processing...'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}