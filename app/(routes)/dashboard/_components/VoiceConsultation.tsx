
// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { Mic, Square, Loader2, Volume2, Stethoscope, Activity, AlertCircle } from 'lucide-react';
// import { getAuth, User } from 'firebase/auth';
// import { toast } from 'sonner';
// import axios from 'axios';
// import { useParams, useRouter } from 'next/navigation';
// import { motion, AnimatePresence } from 'framer-motion';

// interface Message {
//   role: 'user' | 'assistant' | 'system';
//   content: string;
//   timestamp: string;
//   language?: string;
//   audioBase64?: string;
// }

// interface DoctorAgent {
//   name: string;
//   specialty: string;
//   image: string;
//   greetings?: {
//     'en-NG'?: string;
//     'yo-NG'?: string;
//     'ig-NG'?: string;
//     'ha-NG'?: string;
//   };
// }

// interface FullSessionData {
//   sessionId: string;
//   conversation: Message[];
//   selectedDoctor: DoctorAgent;
//   language: string;
// }

// // 🔊 Helper: Convert base64 to audio blob
// function base64ToBlob(base64: string, mimeType: string = 'audio/wav'): Blob {
//   const byteCharacters = atob(base64);
//   const byteNumbers = new Array(byteCharacters.length);
//   for (let i = 0; i < byteCharacters.length; i++) {
//     byteNumbers[i] = byteCharacters.charCodeAt(i);
//   }
//   const byteArray = new Uint8Array(byteNumbers);
//   return new Blob([byteArray], { type: mimeType });
// }

// export default function VoiceConsultation() {
//   const params = useParams();
//   const router = useRouter();
//   const sessionIdParam = params.sessionId as string;

//   const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
//   const [sessionData, setSessionData] = useState<FullSessionData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [processingStage, setProcessingStage] = useState('');
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
//   const [hasUserSpoken, setHasUserSpoken] = useState(false);

//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const chunksRef = useRef<Blob[]>([]);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const doctorProfile = sessionData?.selectedDoctor;
//   const doctorName = doctorProfile?.name || 'AI Doctor';
//   const doctorImage = doctorProfile?.image || '/default-doctor.png';
//   const doctorSpecialty = doctorProfile?.specialty || 'Medical Assistant';
//   const sessionLanguage = sessionData?.language || 'english';

//   // 🔐 Firebase auth
//   useEffect(() => {
//     const auth = getAuth();
//     const user = auth.currentUser;
//     if (!user) {
//       router.replace('/sign-in');
//     } else {
//       setFirebaseUser(user);
//     }
//   }, [router]);

//   // 📂 Fetch session
//   useEffect(() => {
//     const fetchSession = async (user: User) => {
//       if (!sessionIdParam) return;

//       try {
//         const token = await user.getIdToken();
//         const response = await axios.get(`/api/voice-chat?sessionId=${sessionIdParam}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const data = response.data.data as FullSessionData;
//         setSessionData(data);
        
//         // ✅ FIX: Filter out system messages, only show user/assistant conversation
//         const conversationMessages = (data.conversation || []).filter(
//           msg => msg.role === 'user' || msg.role === 'assistant'
//         );
//         setMessages(conversationMessages);
        
//         // Check if user has already spoken
//         const hasSpoken = conversationMessages.some(msg => msg.role === 'user');
//         setHasUserSpoken(hasSpoken);
        
//       } catch (err) {
//         console.error('Failed to fetch session:', err);
//         toast.error('Could not load consultation');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (firebaseUser) fetchSession(firebaseUser);
//   }, [sessionIdParam, firebaseUser]);

//   // 🔄 Auto scroll
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   // 🎤 Recording functions
//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const mediaRecorder = new MediaRecorder(stream);

//       mediaRecorderRef.current = mediaRecorder;
//       chunksRef.current = [];

//       mediaRecorder.ondataavailable = (e) => {
//         if (e.data.size > 0) chunksRef.current.push(e.data);
//       };

//       mediaRecorder.onstop = async () => {
//         const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
//         await processRecording(audioBlob);
//         stream.getTracks().forEach((track) => track.stop());
//       };

//       mediaRecorder.start();
//       setIsRecording(true);
//       toast.success('Recording... Speak now!');
//     } catch (err) {
//       console.error('Microphone error:', err);
//       toast.error('Please allow microphone access');
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//     }
//   };

//   // 📝 Process recorded audio - UPDATED VERSION
// const processRecording = async (audioBlob: Blob) => {
//   if (!doctorProfile || !firebaseUser) return;

//   setIsProcessing(true);
//   setProcessingStage('Transcribing audio...');

//   try {
//     const token = await firebaseUser.getIdToken();
//     const formData = new FormData();
//     formData.append('audio', audioBlob, 'recording.wav');
//     formData.append('doctor_name', doctorProfile.name);
//     formData.append('doctor_specialty', doctorProfile.specialty);
//     formData.append('sessionId', sessionData?.sessionId || sessionIdParam);

//     console.log('🎤 Sending voice request...');

//     const response = await fetch('/api/voice-chat', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       body: formData,
//     });

//     setProcessingStage('Analyzing with AI...');

//     const result = await response.json();
//     console.log('✅ Response:', result);

//     if (result.success && result.data) {
//       setProcessingStage('Generating voice response...');
      
//       // ✅ FIX: Handle greeting vs normal conversation
//       const isGreeting = result.data.isNewConsultation === true;
      
//       const newMessages: Message[] = [];
      
//       // ✅ Only add user message if NOT a greeting
//       if (!isGreeting && result.data.userText) {
//         newMessages.push({
//           role: 'user',
//           content: result.data.userText,
//           timestamp: new Date().toISOString(),
//           language: result.data.language,
//         });
//       }
      
//       // ✅ Always add doctor's response
//       if (result.data.doctorResponse) {
//         newMessages.push({
//           role: 'assistant',
//           content: result.data.doctorResponse,
//           timestamp: new Date().toISOString(),
//           audioBase64: result.data.audioBase64 || undefined,
//         });
//       }

//       setMessages((prev) => [...prev, ...newMessages]);
      
//       // ✅ Mark as spoken after greeting too
//       setHasUserSpoken(true);

//       if (result.sessionId) {
//         setSessionData((prev) =>
//           prev ? { ...prev, sessionId: result.sessionId } : prev
//         );
//       }

//       toast.success(isGreeting ? 'Consultation started!' : 'Response received!');

//       // 🔊 Play assistant audio from base64
//       if (result.data.audioBase64) {
//         if (currentAudio) {
//           currentAudio.pause();
//           setCurrentAudio(null);
//         }

//         try {
//           const audioBlob = base64ToBlob(result.data.audioBase64);
//           const audioUrl = URL.createObjectURL(audioBlob);
//           const audio = new Audio(audioUrl);
          
//           setCurrentAudio(audio);

//           audio.onended = () => {
//             URL.revokeObjectURL(audioUrl);
//             setCurrentAudio(null);
//           };

//           audio.onerror = (e) => {
//             console.error('Audio play error:', e);
//             toast.error('Could not play audio response');
//             URL.revokeObjectURL(audioUrl);
//             setCurrentAudio(null);
//           };

//           await audio.play();
//           console.log('✅ Playing audio response');
//         } catch (e) {
//           console.error('Audio play failed:', e);
//           toast.error('Could not play audio response');
//         }
//       }
//     } else {
//       toast.error(result.error || 'Processing failed');
//     }
//   } catch (err: any) {
//     console.error('Processing error:', err);
//     toast.error('Failed to process voice');
//   } finally {
//     setIsProcessing(false);
//     setProcessingStage('');
//   }
// };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
//           <p className="text-gray-400 text-sm">Loading consultation...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      
//       {/* Elegant Header */}
//       <div className="relative backdrop-blur-xl bg-black/30 border-b border-white/10">
//         <div className="max-w-4xl mx-auto px-6 py-5">
//           <div className="flex items-center gap-4">
//             {/* Doctor Avatar */}
//             <div className="relative">
//               <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20">
//                 <img
//                   src={doctorImage}
//                   alt={doctorName}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
//             </div>

//             {/* Doctor Info */}
//             <div className="flex-1">
//               <h2 className="text-white font-semibold text-lg flex items-center gap-2">
//                 {doctorName}
//                 <Stethoscope className="w-4 h-4 text-indigo-400" />
//               </h2>
//               <p className="text-indigo-300 text-sm flex items-center gap-1.5">
//                 <Activity className="w-3.5 h-3.5" />
//                 {doctorSpecialty}
//               </p>
//             </div>

//             {/* Active Indicator */}
//             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
//               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
//               <span className="text-green-400 text-xs font-medium">Active</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Messages Container */}
//       <div className="flex-1 overflow-y-auto px-4 py-6">
//         <div className="max-w-3xl mx-auto space-y-4">
          
//           {/* ✅ FIX: Welcome message ONLY if user hasn't spoken yet */}
//           {!hasUserSpoken && messages.length === 0 && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="flex justify-center"
//             >
//               <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-indigo-500/10 backdrop-blur-xl border border-indigo-500/30">
//                 <div className="flex items-start gap-3">
//                   <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <p className="text-white text-sm font-medium mb-2">
//                       Welcome to your consultation with {doctorName}
//                     </p>
//                     <p className="text-gray-300 text-sm">
//                       Tap the microphone button below to start describing your symptoms. 
//                       Speak clearly and provide as much detail as possible about your condition.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           <AnimatePresence>
//             {messages.map((msg, idx) => (
//               <motion.div
//                 key={idx}
//                 initial={{ opacity: 0, y: 20, scale: 0.95 }}
//                 animate={{ opacity: 1, y: 0, scale: 1 }}
//                 exit={{ opacity: 0, scale: 0.95 }}
//                 transition={{ duration: 0.3 }}
//                 className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div
//                   className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-lg ${
//                     msg.role === 'user'
//                       ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
//                       : 'bg-white/5 backdrop-blur-xl text-white border border-white/10'
//                   }`}
//                 >
//                   <p className="text-sm leading-relaxed">{msg.content}</p>
                  
//                   <div className="flex items-center gap-2 mt-2 text-xs opacity-60">
//                     {msg.language && (
//                       <span className="px-2 py-0.5 rounded-full bg-white/10">
//                         {msg.language}
//                       </span>
//                     )}
//                     <span>
//                       {new Date(msg.timestamp).toLocaleTimeString('en-US', {
//                         hour: '2-digit',
//                         minute: '2-digit',
//                       })}
//                     </span>
//                   </div>
//                 </div>
//               </motion.div>
//             ))}
//           </AnimatePresence>
//           <div ref={messagesEndRef} />
//         </div>
//       </div>

//       {/* Elegant Controls */}
//       <div className="relative backdrop-blur-xl bg-black/30 border-t border-white/10">
//         <div className="max-w-4xl mx-auto px-6 py-6">
          
//           {/* Processing Stage Indicator */}
//           <AnimatePresence>
//             {processingStage && (
//               <motion.div
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: 10 }}
//                 className="mb-5 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
//               >
//                 <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
//                 <span className="text-indigo-400 text-sm font-medium">
//                   {processingStage}
//                 </span>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Audio Playing Indicator */}
//           <AnimatePresence>
//             {currentAudio && (
//               <motion.div
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: 10 }}
//                 className="mb-5 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20"
//               >
//                 <Volume2 className="w-5 h-5 text-green-400 animate-pulse" />
//                 <span className="text-green-400 text-sm font-medium">
//                   Playing doctor's response...
//                 </span>
//                 <div className="flex gap-1">
//                   {[...Array(3)].map((_, i) => (
//                     <div
//                       key={i}
//                       className="w-1 h-3 bg-green-400 rounded-full animate-pulse"
//                       style={{ animationDelay: `${i * 0.15}s` }}
//                     />
//                   ))}
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Recording Button */}
//           <div className="flex flex-col items-center gap-4">
//             <motion.button
//               onClick={isRecording ? stopRecording : startRecording}
//               disabled={isProcessing}
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed ${
//                 isRecording
//                   ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/50 animate-pulse'
//                   : 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/50 hover:shadow-green-500/70'
//               }`}
//             >
//               {/* Pulse Ring for Recording */}
//               {isRecording && (
//                 <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
//               )}
              
//               {isProcessing ? (
//                 <Loader2 className="w-9 h-9 text-white animate-spin" />
//               ) : isRecording ? (
//                 <Square className="w-8 h-8 text-white" />
//               ) : (
//                 <Mic className="w-8 h-8 text-white" />
//               )}
//             </motion.button>

//             {/* Status Text */}
//             <p className="text-center text-sm text-gray-400">
//               {isProcessing ? (
//                 <span className="flex items-center gap-2">
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   {processingStage || 'Processing...'}
//                 </span>
//               ) : isRecording ? (
//                 <span className="text-red-400 font-medium">
//                   🔴 Recording... Tap to stop
//                 </span>
//               ) : (
//                 <span>
//                   {hasUserSpoken ? 'Tap to ask another question' : 'Tap the microphone to describe your symptoms'}
//                 </span>
//               )}
//             </p>
//           </div>

//           {/* Quick Tips - Only show before first message */}
//           {!hasUserSpoken && messages.length === 0 && !isRecording && !isProcessing && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
//             >
//               <p className="text-indigo-300 text-xs text-center">
//                 💡 <strong>Tip:</strong> Speak clearly and describe your symptoms in detail. Mention how long you've had them and their severity.
//               </p>
//             </motion.div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }



'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, Volume2, Phone, PhoneOff, ArrowLeft, AlertCircle } from 'lucide-react';
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
        
        // Only show actual conversation messages (no system messages)
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

  // Start call - AI greets first
  const startCall = async () => {
    if (!doctorProfile || !firebaseUser) return;

    setCallActive(true);
    setProcessingStage('Connecting to doctor...');
    setIsProcessing(true);

    try {
      const token = await firebaseUser.getIdToken();
      
      // Get AI greeting based on language
      const greetings: Record<string, string> = {
        'english': `Hello! I'm ${doctorName}, your ${doctorSpecialty} specialist. How can I help you today?`,
        'yoruba': `Ẹ káàárọ̀! Èmi ni ${doctorName}, dókítà ${doctorSpecialty}. Báwo ni mo ṣe lè ràn ọ́ lọ́wọ́ lónìí?`,
        'igbo': `Nnọọ! Abụ m ${doctorName}, dọkịta ${doctorSpecialty}. Kedụ ka m ga-esi nyere gị aka taa?`,
        'hausa': `Sannu! Ni ne ${doctorName}, likitan ${doctorSpecialty}. Ta yaya zan iya taimaka muku yau?`,
      };

      const greetingText = greetings[sessionLanguage.toLowerCase()] || greetings['english'];

      // Generate greeting audio
      const response = await fetch('/api/greeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: greetingText,
          sessionId: sessionData?.sessionId || sessionIdParam,
          doctorName: doctorProfile.name,
          doctorSpecialty: doctorProfile.specialty,
        }),
      });

      const result = await response.json();

      if (result.success && result.audioBase64) {
        // Add greeting to messages
        const greetingMessage: Message = {
          role: 'assistant',
          content: greetingText,
          timestamp: new Date().toISOString(),
          audioBase64: result.audioBase64,
        };

        setMessages([greetingMessage]);

        // Play greeting audio
        const audioBlob = base64ToBlob(result.audioBase64);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        setCurrentAudio(audio);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
          setGreetingPlayed(true);
          setIsProcessing(false);
          setProcessingStage('');
          // Auto-start recording after greeting
          setTimeout(() => startRecording(), 500);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
          setGreetingPlayed(true);
          setIsProcessing(false);
          setProcessingStage('');
          toast.error('Could not play greeting');
        };

        await audio.play();
      } else {
        throw new Error('Failed to generate greeting');
      }
    } catch (err: any) {
      console.error('Call start error:', err);
      toast.error('Failed to start consultation');
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
    if (!callActive || !greetingPlayed) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await processRecording(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      toast.error('Please allow microphone access');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process recording
  const processRecording = async (audioBlob: Blob) => {
    if (!doctorProfile || !firebaseUser) return;

    setIsProcessing(true);
    setProcessingStage('Listening...');

    try {
      const token = await firebaseUser.getIdToken();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('doctor_name', doctorProfile.name);
      formData.append('doctor_specialty', doctorProfile.specialty);
      formData.append('sessionId', sessionData?.sessionId || sessionIdParam);

      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      setProcessingStage('Doctor is responding...');

      const result = await response.json();

      if (result.success && result.data) {
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

        // Play response audio
        if (result.data.audioBase64) {
          if (currentAudio) {
            currentAudio.pause();
            setCurrentAudio(null);
          }

          const audioBlob = base64ToBlob(result.data.audioBase64);
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          setCurrentAudio(audio);

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setCurrentAudio(null);
            setIsProcessing(false);
            setProcessingStage('');
            // Auto-start next recording
            setTimeout(() => startRecording(), 500);
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            setCurrentAudio(null);
            setIsProcessing(false);
            setProcessingStage('');
            toast.error('Could not play response');
          };

          await audio.play();
        } else {
          setIsProcessing(false);
          setProcessingStage('');
          setTimeout(() => startRecording(), 500);
        }
      } else {
        toast.error(result.error || 'Processing failed');
        setIsProcessing(false);
        setProcessingStage('');
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      toast.error('Failed to process voice');
      setIsProcessing(false);
      setProcessingStage('');
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
                  <PhoneOff className="w-6 h-6 text-red-400" />
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
                <Phone className="w-10 h-10 text-white" />
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
              {(currentAudio || isProcessing) && (
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
                      <span className="text-red-400 font-medium">Listening to you...</span>
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
                <Phone className="w-4 h-4" />
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

            {/* End Call Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-2xl shadow-red-500/50 flex items-center justify-center transition-all"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}