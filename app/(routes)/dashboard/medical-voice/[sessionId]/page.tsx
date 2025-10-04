// 'use client';
// import axios from 'axios';
// import { useParams, useRouter } from 'next/navigation';
// import React, { useEffect, useState } from 'react';
// import { AiDoctorAgent } from '../../_components/AiDoctorAgentCard';
// import Image from 'next/image';
// import { Circle, Loader, PhoneCall, PhoneOff } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import Vapi from '@vapi-ai/web';
// import jsPDF from 'jspdf';
// import { motion } from 'framer-motion';
// import { toast } from 'sonner';


// type ReportType = {
//   sessionId: string
//   agent: string
//   user: string
//   timestamp: string
//   mainComplaint: string
//   symptoms: string[]
//   summary: string
//   duration: string
//   severity: string
//   medicationsMentioned: string[]
//   recommendations: string[]
// }

// export type SessionParams = {
//   id: number,
//   note: string,
//   sessionId: string,
//   selectedDoctor: AiDoctorAgent,
//   report?: ReportType,
//   createdOn: string,
//   status: string,

// };

// type messages = {
//   role: string,
//   text: string,
// };

// export default function MedicalVoice() {
//   const { sessionId } = useParams();
//   const router = useRouter();
//   const [sessionParams, setSessionParams] = useState<SessionParams[]>([]);
//   const [startCall, setStartCall] = useState(false);
//   const [vapiInstance, setVapiInstance] = useState<any>();
//   const [speaking, setSpeaking] = useState<string | null>();
//   const [transcript, setTranscript] = useState<string>();
//   const [messages, setMessages] = useState<messages[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [voiceAnimating, setVoiceAnimating] = useState(false);
//   const [listeningPaused, setListeningPaused] = useState<boolean>()


//   useEffect(() => {
//     if (sessionId) fetchSessionDetails();
//   }, [sessionId]);

//   const fetchSessionDetails = async () => {
//     const result = await axios.get(`/api/chat-session?sessionId=` + sessionId);

//     setSessionParams(result.data);
//   };
//   const selectedSession = sessionParams[0];

//   const handleCallStart = () => setStartCall(true);
//   const handleCallEnd = () => setStartCall(false);

//   const handleMessage = (message: any) => {
//     console.log("🎤 Incoming message:", message);

//     if (message.type === 'transcript') {
//       const { role, transcriptType, transcript } = message;
//       if (transcriptType === 'partial') {
//         setTranscript(transcript);
//         setSpeaking(role);
//         setVoiceAnimating(true);
//       } else if (transcriptType === 'final' && transcript?.trim()) {
//         setMessages(prev => [...prev, { role, text: transcript }]);
//         setTranscript('');
//         setSpeaking(null);
//         setVoiceAnimating(false);

//         if (role === 'assistant') {
//           setListeningPaused(true);
//           setTimeout(() => {
//             setListeningPaused(false);
//           }, 1500);
//         }
//       }
//     }
//   };
//   const StartCall = async () => {
//     setLoading(true);


//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       stream.getTracks().forEach(track => track.stop());
//     } catch (err) {
//       console.error("Microphone access denied or unavailable:", err);
//       alert("Please allow microphone access to start the call.");
//       setLoading(false);
//       return;
//     }

//     const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_API_KEY!);
//     setVapiInstance(vapi);

//     const VapiVoiceConfig = {
//       name: "AI Medical Assistant agent",
//       firstMessage:
//         "Hello, I’m your AI Medical Assistant. I’m here to listen, support, and guide you with your health concerns. What would you like to talk about today?",
//       transcriber: {
//         provider: 'assembly-ai',
//         language: 'en'
//       },
//       voice: {
//         provider: 'playht',
//         voiceId: selectedSession?.selectedDoctor?.doctorVoiceId
//       },
//       model: {
//         provider: 'groq',
//         model: 'llama3-8b-8192',
//         messages: [
//           {
//             role: 'system',
//             content: selectedSession?.selectedDoctor?.agentPrompt
//           }
//         ]
//       },
//     };

//     console.log("Starting Vapi with config:", VapiVoiceConfig);

//     // @ts-ignore
//     vapi.start(VapiVoiceConfig);

//     vapi.on('call-start', () => {
//       console.log(' Call started');
//       handleCallStart();
//       toast.success("Call has started!")
//     });

//     vapi.on('call-end', () => {
//       console.log(' Call ended');
//       handleCallEnd();
//     });

//     vapi.on('message', (message) => {
//       console.log("📨 Vapi Message:", JSON.stringify(message, null, 2));
//       handleMessage(message);
//     });

//     vapi.on('speech-start', () => {
//       console.log(' Speech started');
//       setSpeaking('Assistant');
//     });

//     vapi.on('speech-end', () => {
//       console.log(' Speech ended');
//       setSpeaking('user');
//     });

//     vapi.on('error', (error: any) => {
//       console.error("❗ Vapi Error:", JSON.stringify(error, null, 2));
//     });

//     setLoading(false);
//   };


//   const endCall = async () => {
//     setLoading(true)

//     if (!vapiInstance) return;
//     vapiInstance.stop();
//     vapiInstance.off('call-start', handleCallStart);
//     vapiInstance.off('call-end', handleCallEnd);
//     vapiInstance.off('message', handleMessage);
//     setStartCall(false);
//     setVapiInstance(null);
//     const result = await MedicalReport();
//     setLoading(false)

//     toast.success("Your report generated successfully!")
//     router.replace('/dashboard/history')
//   };

//   const exportTranscriptAsPDF = () => {
//     const pdf = new jsPDF();
//     pdf.setFontSize(14);
//     pdf.text('Consultation Transcript', 10, 10);
//     messages.forEach((msg, index) => {
//       pdf.text(`${msg.role.toUpperCase()}: ${msg.text}`, 10, 20 + index * 10);
//     });
//     pdf.save('consultation_transcript.pdf');
//   };

//   const MedicalReport = async () => {
//     const result = await axios.post('/api/medical-report', {
//       messages,
//       sessionParams,
//       sessionId,
//     });
//     console.log("report:", result.data)
//     return result.data;

//   };

//   return (
//     <motion.div
//       className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex flex-col items-center"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.6 }}
//     >
//       <motion.h2
//         className="text-3xl font-bold mb-8 text-center bg-gradient-to-br from-purple-100 to-blue-200 bg-clip-text text-transparent"
//         initial={{ y: -30, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ duration: 0.5 }}
//       >
//         Voice Consultation Session
//       </motion.h2>

//       {sessionParams && (
//         <motion.div
//           className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.3 }}
//         >
//           <motion.div
//             className="bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center"
//             whileHover={{ scale: 1.02 }}
//           >
//             {selectedSession?.selectedDoctor?.image && (
//               <Image
//                 src={selectedSession.selectedDoctor.image}
//                 alt={selectedSession.selectedDoctor.name}
//                 width={90}
//                 height={90}
//                 className="rounded-full border-4 border-blue-400 shadow-lg"
//               />
//             )}
//             <h3 className="text-xl font-semibold mt-4 text-center">
//               {selectedSession?.selectedDoctor.name}
//             </h3>
//             <p className="text-sm text-gray-400">Specialty: {selectedSession?.selectedDoctor.specialty}</p>
//             <div className="flex items-center gap-3 mt-3">
//               <span className="text-gray-400 text-sm">
//                 Created: {new Date(selectedSession?.createdOn).toLocaleDateString()}
//               </span>
//               <span className="flex items-center gap-1 text-sm">
//                 <Circle className={`w-3 h-3 ${startCall ? 'text-green-400' : 'text-red-400'}`} />
//                 {startCall ? 'Online' : 'Offline'}
//               </span>
//             </div>

//           </motion.div>

//           <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
//             <h4 className="text-lg font-semibold mb-3">Consultation Transcript</h4>
//             <div className="space-y-2 max-h-60 overflow-y-auto">
//               {messages.slice(-6).map((msg, idx) => (
//                 <motion.p
//                   key={idx}
//                   className="text-gray-300 text-sm"
//                   initial={{ x: -20, opacity: 0 }}
//                   animate={{ x: 0, opacity: 1 }}
//                   transition={{ delay: idx * 0.1 }}
//                 >
//                   <strong>{msg.role}:</strong> {msg.text}
//                 </motion.p>
//               ))}
//               {transcript && (
//                 <motion.p className="text-blue-400 font-medium">
//                   {speaking}: {transcript}
//                 </motion.p>
//               )}
//             </div>

//             {voiceAnimating && (
//               <div className="w-8 h-8 rounded-full border-4 border-blue-400 animate-ping mx-auto my-4"></div>
//             )}

//             <div className="mt-6 flex flex-col gap-3">
//               {!startCall ? (
//                 <Button onClick={StartCall} disabled={loading}>
//                   {loading ? <Loader className="animate-spin" /> : <PhoneCall />} Start Consultation
//                 </Button>
//               ) : (
//                 <Button variant="destructive" onClick={endCall} disabled={loading}>
//                   {loading ? <Loader className="animate-spin" /> : <PhoneOff />} End Consultation
//                 </Button>
//               )}

//               <Button variant="outline" onClick={exportTranscriptAsPDF} className="mt-2 text-gray-600">
//                 Export as PDF
//               </Button>
//             </div>
//           </div>
//         </motion.div>
//       )}
//     </motion.div>
//   );
// }




'use client';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { AiDoctorAgent } from '../../_components/AiDoctorAgentCard';
import Image from 'next/image';
import { Circle, Loader, PhoneCall, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Vapi from '@vapi-ai/web';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { getAuth } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // ✅ make sure path matches your setup

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
  selectedDoctor?: AiDoctorAgent;
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
  const router = useRouter();

  const [sessionParams, setSessionParams] = useState<SessionParams | null>(null);
  const [startCall, setStartCall] = useState(false);
  const [vapiInstance, setVapiInstance] = useState<any>(null);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [voiceAnimating, setVoiceAnimating] = useState(false);
  const [listeningPaused, setListeningPaused] = useState<boolean>(false);

  // ✅ Fetch session securely
  useEffect(() => {
    if (sessionId) fetchSessionDetails();
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // ✅ Handle all response cases
    if (!result.data?.success) {
      toast.error(result.data?.error || 'Failed to fetch session.');
      return;
    }

    const sessionData = result.data?.data;

    if (!sessionData) {
      toast.error('No session data found.');
      return;
    }

    // ✅ Set session details
    setSessionParams(sessionData);
  } catch (err: any) {
    console.error('❌ Fetch session failed:', err);
    toast.error('Failed to fetch session.');
  } finally {
    setLoading(false);
  }
};

  const handleCallStart = () => setStartCall(true);
  const handleCallEnd = () => setStartCall(false);

  const handleMessage = (message: any) => {
    if (message.type === 'transcript') {
      const { role, transcriptType, transcript } = message;
      if (transcriptType === 'partial') {
        setTranscript(transcript);
        setSpeaking(role);
        setVoiceAnimating(true);
      } else if (transcriptType === 'final' && transcript?.trim()) {
        setMessages((prev) => [...prev, { role, text: transcript }]);
        setTranscript('');
        setSpeaking(null);
        setVoiceAnimating(false);

        if (role === 'assistant') {
          setListeningPaused(true);
          setTimeout(() => setListeningPaused(false), 1500);
        }
      }
    }
  };

  const StartCall = async () => {
    if (!sessionParams) {
      toast.error('Session data not ready.');
      return;
    }

    setLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      toast.error('Please allow microphone access.');
      setLoading(false);
      return;
    }

    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_API_KEY!);
    setVapiInstance(vapi);

    const voiceId =
      sessionParams?.selectedDoctor?.doctorVoiceId ||
      's3://default-voice'; // fallback voice

    const VapiVoiceConfig = {
      name: 'AI Medical Assistant',
      firstMessage:
        'Hello, I’m your AI Medical Assistant. How can I help you today?',
      transcriber: {
        provider: 'assembly-ai',
        language: 'en',
      },
      voice: {
        provider: 'openai',
        voiceId,
      },
      model: {
        provider: 'groq',
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content:
              sessionParams?.selectedDoctor?.agentPrompt ||
              'You are an AI medical assistant. Be helpful and empathetic.',
          },
        ],
      },
    };

    console.log('Starting Vapi with:', VapiVoiceConfig);

    try {
      // @ts-ignore
      vapi.start(VapiVoiceConfig);
    } catch (error: any) {
      toast.error(`Vapi start failed: ${error.message}`);
      setLoading(false);
      return;
    }

    vapi.on('call-start', () => {
      handleCallStart();
      toast.success('Consultation started');
    });

    vapi.on('call-end', () => {
      handleCallEnd();
    });

    vapi.on('message', (msg) => handleMessage(msg));

    vapi.on('error', (error: any) => {
      console.error('❗ Vapi Error:', error);
      toast.error('Voice assistant error.');
    });

    setLoading(false);
  };

  const endCall = async () => {
    if (!vapiInstance) return;
    vapiInstance.stop();
    setStartCall(false);
    setVapiInstance(null);
    toast.success('Consultation ended.');
  };

  const exportTranscriptAsPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text('Consultation Transcript', 10, 10);
    messages.forEach((msg, index) => {
      pdf.text(`${msg.role.toUpperCase()}: ${msg.text}`, 10, 20 + index * 10);
    });
    pdf.save('consultation_transcript.pdf');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        <Loader className="animate-spin mr-2" /> Loading session...
      </div>
    );
  }

  if (!sessionParams) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        No session data found.
      </div>
    );
  }

  const doctor = sessionParams?.selectedDoctor;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className="text-3xl font-bold mb-8 text-center bg-gradient-to-br from-purple-100 to-blue-200 bg-clip-text text-transparent"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Voice Consultation Session
      </motion.h2>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center"
          whileHover={{ scale: 1.02 }}
        >
          {doctor?.image && (
            <Image
              src={doctor.image}
              alt={doctor?.name || 'Doctor'}
              width={90}
              height={90}
              className="rounded-full border-4 border-blue-400 shadow-lg"
            />
          )}
          <h3 className="text-xl font-semibold mt-4 text-center">
            {doctor?.name || 'Unknown Doctor'}
          </h3>
          <p className="text-sm text-gray-400">
            Specialty: {doctor?.specialty || 'N/A'}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-gray-400 text-sm">
              Created: {new Date(sessionParams?.createdOn).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1 text-sm">
              <Circle
                className={`w-3 h-3 ${
                  startCall ? 'text-green-400' : 'text-red-400'
                }`}
              />
              {startCall ? 'Online' : 'Offline'}
            </span>
          </div>
        </motion.div>

        <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
          <h4 className="text-lg font-semibold mb-3">Consultation Transcript</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {messages.slice(-6).map((msg, idx) => (
              <motion.p
                key={idx}
                className="text-gray-300 text-sm"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <strong>{msg.role}:</strong> {msg.text}
              </motion.p>
            ))}
            {transcript && (
              <motion.p className="text-blue-400 font-medium">
                {speaking}: {transcript}
              </motion.p>
            )}
          </div>

          {voiceAnimating && (
            <div className="w-8 h-8 rounded-full border-4 border-blue-400 animate-ping mx-auto my-4"></div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {!startCall ? (
              <Button onClick={StartCall} disabled={loading}>
                {loading ? <Loader className="animate-spin" /> : <PhoneCall />} Start Consultation
              </Button>
            ) : (
              <Button variant="destructive" onClick={endCall} disabled={loading}>
                {loading ? <Loader className="animate-spin" /> : <PhoneOff />} End Consultation
              </Button>
            )}

            <Button
              variant="outline"
              onClick={exportTranscriptAsPDF}
              className="mt-2 text-gray-600"
            >
              Export as PDF
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
