// 'use client';

// import { useRouter } from 'next/navigation';
// import { useContext, useEffect, useState } from 'react';
// import axios from 'axios';
// import MedicalReport from '../_components/MedicalReport';
// import { UserDetailContext } from '@/context/UserDetailProvider';

// type SessionParams = {
//   sessionId: string;
//   createdOn?: string;
//   [key: string]: any;
// };


// export default function HistoryPage() {
//   const router = useRouter();
//   const context = useContext(UserDetailContext);
//   const user = context?.user;

//   const [history, setHistory] = useState<SessionParams[] | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!user) {
//       router.push('/sign-in');
//       return;
//     }

//     const fetchHistory = async () => {
//       try {
//         const token = await user.getIdToken();
//         const res = await axios.get('/api/chat-session?sessionId=all', {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setHistory(res.data);
//       } catch (err) {
//         console.error('Error fetching history:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchHistory();
//   }, [user, router]);

//   if (!user || loading) {
//     return <p className="text-center mt-10 text-gray-500">Loading your consultation history...</p>;
//   }

//   if (!history || history.length === 0) {
//     return <p className="text-center mt-10 text-gray-500">No consultation history available.</p>;
//   }

//   return (
//     <div>
//       <h2 className="text-xl font-semibold mb-4">Your Consultation History</h2>
//       <MedicalReport history={history} />
//     </div>
//   );
// }
