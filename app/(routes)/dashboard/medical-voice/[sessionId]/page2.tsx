// import React, { useState, useEffect, useRef } from 'react';
// import { Mic, MicOff, Volume2, VolumeX, Loader2, Languages } from 'lucide-react';
// // Assuming interfaces and types are imported correctly from the previous step

// // NOTE: Interfaces are omitted here for brevity; assume they are defined above.

// interface NatlasMetadata {
//     keywords: string[];
//     severity: string;
//     matchType: string;
//     cached: boolean;
//   }
  
// interface Message {
//     role: 'user' | 'assistant';
//     content: string;
//     timestamp: string;
//     language?: string;
//     natlasData?: NatlasMetadata; 
// }
  
// interface VoiceConsultationProps {
//     sessionId: string;
//     doctorProfile: {
//         name: string;
//         specialty: string;
//         avatar: string;
//     };
//     onSessionEnd?: () => void;
// }

// export default function VoiceConsultation({ sessionId, doctorProfile, onSessionEnd }: VoiceConsultationProps) {
//     const [isListening, setIsListening] = useState(false);
//     const [isSpeaking, setIsSpeaking] = useState(false);
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [messages, setMessages] = useState<Message[]>([]);
//     const [currentTranscript, setCurrentTranscript] = useState('');
//     const [currentConversationLanguage, setCurrentConversationLanguage] = useState<string>('english');
//     const [error, setError] = useState<string | null>(null);

//     const recognitionRef = useRef<any>(null);
//     const synthRef = useRef<SpeechSynthesis | null>(null);
//     const messagesEndRef = useRef<HTMLDivElement>(null);


//     // --- (Keep all useEffect and Voice/Speech Handler functions here) ---
//     // (Omitted for brevity, but they are carried over unchanged from the previous code)

//     // Scroll to bottom whenever messages update
//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);
    
//     // Placeholder functions for the demonstration (must be defined in the final code)
//     const startListening = () => {}; 
//     const stopListening = () => {};
//     const speak = (text: string) => {};
//     const stopSpeaking = () => {};
//     const handleSendMessage = async (text: string) => {};

//     const getLanguageFlag = (lang: string) => {
//         const flags: Record<string, string> = {
//             yoruba: '🇳🇬 Yoruba',
//             igbo: '🇳🇬 Igbo',
//             hausa: '🇳🇬 Hausa',
//             english: '🇬🇧 English',
//         };
//         return flags[lang] || '🌍 ' + lang;
//     };


//     return (
//         <div className="flex flex-col h-screen overflow-hidden relative">
            
//             {/* 1. DOCTOR IMAGE BACKGROUND (The "Video") */}
//             <div 
//                 className="absolute inset-0 bg-cover bg-center transition-opacity duration-700" 
//                 style={{ backgroundImage: `url(${doctorProfile.avatar})`, filter: 'brightness(0.4) blur(1px)' }}
//             ></div>
            
//             {/* 2. HEADER OVERLAY */}
//             <div className="relative z-10 bg-black/40 p-4 flex items-center justify-between text-white shadow-lg">
//                 <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-full border-2 border-white/70">
//                         <img 
//                             src={doctorProfile.avatar} 
//                             alt={doctorProfile.name}
//                             className="w-full h-full rounded-full object-cover"
//                         />
//                     </div>
//                     <div>
//                         <h2 className="font-semibold text-lg">{doctorProfile.name}</h2>
//                         <p className="text-sm text-gray-300">{doctorProfile.specialty}</p>
//                     </div>
//                 </div>
//                 <div className="flex items-center gap-2 text-sm">
//                     <Languages className="w-4 h-4 text-green-300" />
//                     <span className="text-gray-200">{getLanguageFlag(currentConversationLanguage)}</span>
//                 </div>
//             </div>

//             {/* 3. SCROLLING MESSAGE OVERLAY (Mimics Subtitles/Captions) */}
//             <div className="relative z-10 flex-1 overflow-y-auto p-4 flex flex-col justify-end">
//                 <div className="space-y-3">
//                     {messages.map((msg, idx) => (
//                         <div
//                             key={idx}
//                             className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
//                         >
//                             <div
//                                 className={`max-w-[85%] rounded-lg px-4 py-3 text-sm font-medium transition-transform transform ${
//                                     msg.role === 'user'
//                                         ? 'bg-indigo-600/90 text-white shadow-xl translate-x-0'
//                                         : 'bg-black/60 text-white shadow-lg -translate-x-0'
//                                 }`}
//                             >
//                                 <p className="leading-snug">{msg.content}</p>
                                
//                                 {/* N-ATLAS ENHANCEMENT INDICATOR (on User Message) */}
//                                 {msg.role === 'user' && msg.natlasData && (
//                                     <div className="mt-1 pt-1 border-t border-white/30 text-xs opacity-90">
//                                         <div className="flex items-center gap-1">
//                                             <span className="font-bold text-yellow-300">N-ATLAS:</span>
//                                             <span>{msg.natlasData.severity} ({msg.natlasData.matchType})</span>
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     ))}
                    
//                     {/* Processing State */}
//                     {isProcessing && (
//                         <div className="flex justify-start">
//                             <Loader2 className="w-5 h-5 animate-spin text-white/80" />
//                         </div>
//                     )}
                    
//                     {/* Scroll End Marker */}
//                     <div ref={messagesEndRef} />
//                 </div>
//             </div>
            
//             {/* 4. TRANSCRIPT / ERROR / CONTROLS FOOTER */}
//             <div className="relative z-10 bg-black/70 p-4 border-t border-white/10">
//                 {error && (
//                     <div className="bg-red-800/80 text-white px-4 py-2 text-sm mb-3 rounded">
//                         {error}
//                     </div>
//                 )}
                
//                 {/* Current Transcript */}
//                 {currentTranscript && (
//                     <div className="mb-3 text-white/90 text-sm">
//                         <p className="font-medium">You're saying:</p>
//                         <p className="italic text-white/70">{currentTranscript}</p>
//                     </div>
//                 )}

//                 {/* Controls */}
//                 <div className="flex items-center justify-center gap-4">
//                     {/* Microphone Button (Main Action) */}
//                     <button
//                         onClick={isListening ? stopListening : startListening}
//                         disabled={isProcessing || isSpeaking}
//                         className={`w-18 h-18 p-4 rounded-full flex items-center justify-center transition-all duration-300 ${
//                             isListening
//                                 ? 'bg-red-500 ring-4 ring-red-300/50 animate-pulse'
//                                 : 'bg-indigo-600 hover:bg-indigo-500'
//                         } ${isProcessing || isSpeaking ? 'opacity-50 cursor-not-allowed' : ''} text-white shadow-2xl`}
//                     >
//                         {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
//                     </button>

//                     {/* Speaker/Mute Button */}
//                     <button
//                         onClick={isSpeaking ? stopSpeaking : undefined}
//                         disabled={!isSpeaking}
//                         className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
//                             isSpeaking
//                                 ? 'bg-green-500/80 hover:bg-green-400'
//                                 : 'bg-gray-700/50'
//                         } text-white`}
//                     >
//                         {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
//                     </button>
//                 </div>

//                 <p className="text-center text-xs text-gray-400 mt-4">
//                     {isListening
//                         ? 'LISTENING... Speak your complaint now.'
//                         : isSpeaking
//                         ? 'DOCTOR SPEAKING...'
//                         : isProcessing
//                         ? 'PROCESSING N-ATLAS ANALYSIS...'
//                         : 'Tap the microphone to begin consultation'}
//                 </p>
//             </div>
//         </div>
//     );
// }