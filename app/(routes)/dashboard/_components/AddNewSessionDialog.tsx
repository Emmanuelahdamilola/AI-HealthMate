// 'use client';

// import React, { useState, useRef } from 'react';
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from '@/components/ui/button';
// import { IconArrowRight } from '@tabler/icons-react';
// import { Textarea } from '@/components/ui/textarea';
// import axios from 'axios';
// import { AiDoctorAgent } from './AiDoctorAgentCard';
// import { RecommendedDoctorCard } from './RecommendedDoctorCard';
// import { useRouter } from 'next/navigation';
// import { motion, AnimatePresence } from 'framer-motion';

// export default function AddNewSessionDialog() {
//   const [note, setNote] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(false);
//   const [aiDoctors, setAiDoctors] = useState<AiDoctorAgent[]>();
//   const [selectedDoctor, setSelectedDoctor] = useState<AiDoctorAgent>();
//   const closeRef = useRef<HTMLButtonElement | null>(null);
//   const router = useRouter();

//   const handleNext = async () => {
//     try {
//       setLoading(true);
//       const result = await axios.post('/api/suggested-ai-doctors', { notes: note });
//       setAiDoctors(result.data);
//     } catch (error) {
//       console.error("Error fetching AI doctors:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartConsultation = async () => {
//     if (!selectedDoctor) {
//       alert("Please select a doctor to start the consultation.");
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await axios.post('/api/chat-session', {
//         notes: note,
//         selectedDoctor: selectedDoctor
//       });

//       const sessionId = response.data?.sessionId;
//       if (!sessionId) {
//         alert("Session ID not returned. Something went wrong.");
//         return;
//       }

//       closeRef.current?.click();
//       router.push(`/dashboard/medical-voice/${sessionId}`);
//     } catch (error) {
//       console.error("Error starting consultation:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//         <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-md">
//           Start Consultation <IconArrowRight className="ml-2" />
//         </Button>
//       </DialogTrigger>

//       <DialogContent className="bg-zinc-900 text-white border border-zinc-700 rounded-xl shadow-2xl max-w-2xl overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-semibold tracking-wide">
//             Add New Session
//           </DialogTitle>
//           <DialogDescription asChild>
//             <div className="mt-4">
//               {!aiDoctors ? (
//                 <motion.div
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.4 }}
//                 >
//                   <p className="text-sm text-zinc-400 mb-3">
//                     Tell us about your symptoms to match you with a virtual doctor.
//                   </p>
//                   <Textarea
//                     placeholder="Describe your symptoms..."
//                     className="h-[160px] bg-zinc-800 text-white placeholder-zinc-400 border border-zinc-700 focus:ring-purple-600"
//                     onChange={(e) => setNote(e.target.value)}
//                   />
//                 </motion.div>
//               ) : (
//                 <motion.div
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   className="max-h-[400px] overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4"
//                 >
//                   <AnimatePresence>
//                     {aiDoctors.map((doctor, index) => (
//                       <motion.div
//                         key={index}
//                         layout
//                         initial={{ opacity: 0, scale: 0.95 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         exit={{ opacity: 0 }}
//                         transition={{ duration: 0.3 }}
//                       >
//                         <RecommendedDoctorCard
//                           doctor={doctor}
//                           setSelectedDoctor={setSelectedDoctor}
//                           selectedDoctor={selectedDoctor}
//                         />
//                       </motion.div>
//                     ))}
//                   </AnimatePresence>
//                 </motion.div>
//               )}
//             </div>
//           </DialogDescription>
//         </DialogHeader>

//         <DialogFooter className="mt-6 flex justify-end space-x-3">
//           <DialogClose asChild>
//             <button ref={closeRef} className="hidden" />
//           </DialogClose>

//           <DialogClose asChild>
//             <Button variant="ghost" className="border border-zinc-700 text-zinc-300 hover:text-white">
//               Cancel
//             </Button>
//           </DialogClose>

//           {!aiDoctors ? (
//             <Button
//               onClick={handleNext}
//               disabled={!note || loading}
//               className="bg-purple-600 hover:bg-purple-700 text-white"
//             >
//               {loading ? 'Processing...' : <>Next <IconArrowRight className="ml-2" /></>}
//             </Button>
//           ) : (
//             <Button
//               onClick={handleStartConsultation}
//               disabled={loading}
//               className="bg-green-600 hover:bg-green-700 text-white"
//             >
//               {loading ? 'Processing...' : <>Start Consultation <IconArrowRight className="ml-2" /></>}
//             </Button>
//           )}
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
'use client';
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { IconArrowRight } from '@tabler/icons-react';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { AiDoctorAgent } from './AiDoctorAgentCard';
import { RecommendedDoctorCard } from './RecommendedDoctorCard';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from "@/lib/firebase";

export default function AddNewSessionDialog() {
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [aiDoctors, setAiDoctors] = useState<AiDoctorAgent[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<AiDoctorAgent>();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();

  // Step 1: Get AI doctor suggestions
  const handleNext = async () => {
    if (!note.trim()) return;

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in to get AI doctor suggestions.");
        return;
      }
      const token = await user.getIdToken(true);

      const result = await axios.post(
        '/api/suggested-ai-doctors',
        { notes: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (result.data.success) {
        setAiDoctors(result.data.data);
      } else {
        console.error('AI doctors API error:', result.data.error);
        setAiDoctors([]);
      }
    } catch (error) {
      console.error("Error fetching AI doctors:", error);
      setAiDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Start the consultation (create session)
  const handleStartConsultation = async () => {
    if (!selectedDoctor) {
      alert("Please select a doctor to start the consultation.");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in to start a consultation.");
        return;
      }
      const token = await user.getIdToken(true);

      const response = await axios.post(
        '/api/chat-session',
        { notes: note, selectedDoctor }, // must match API body
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sessionId = response.data?.sessionId;
      if (!sessionId) {
        alert("Session ID not returned. Something went wrong.");
        return;
      }

      // Close dialog and navigate
      closeRef.current?.click();
      router.push(`/dashboard/medical-voice/${sessionId}`);
    } catch (error: any) {
      console.error("Error starting consultation:", error);
      alert("Failed to start consultation. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-md">
          Start Consultation <IconArrowRight className="ml-2" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 text-white border border-zinc-700 rounded-xl shadow-2xl max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-wide">
            Add New Session
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-4">
              {aiDoctors.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-sm text-zinc-400 mb-3">
                    Tell us about your symptoms to match you with a virtual doctor.
                  </p>
                  <Textarea
                    placeholder="Describe your symptoms..."
                    className="h-[160px] bg-zinc-800 text-white placeholder-zinc-400 border border-zinc-700 focus:ring-purple-600"
                    onChange={(e) => setNote(e.target.value)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="max-h-[400px] overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <AnimatePresence>
                    {aiDoctors.map((doctor, index) => (
                      <motion.div
                        key={index}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <RecommendedDoctorCard
                          doctor={doctor}
                          setSelectedDoctor={setSelectedDoctor}
                          selectedDoctor={selectedDoctor}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex justify-end space-x-3">
          <DialogClose asChild>
            <button ref={closeRef} className="hidden" />
          </DialogClose>

          <DialogClose asChild>
            <Button variant="ghost" className="border border-zinc-700 text-zinc-300 hover:text-white">
              Cancel
            </Button>
          </DialogClose>

          {aiDoctors.length === 0 ? (
            <Button
              onClick={handleNext}
              disabled={!note || loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? 'Processing...' : <>Next <IconArrowRight className="ml-2" /></>}
            </Button>
          ) : (
            <Button
              onClick={handleStartConsultation}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Processing...' : <>Start Consultation <IconArrowRight className="ml-2" /></>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
