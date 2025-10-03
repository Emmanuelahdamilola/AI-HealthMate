
'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import MedicalReport from '../_components/MedicalReport';
import { SessionParams } from '../medical-voice/[sessionId]/page';

export default function HistoryPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<SessionParams[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/chat-session?sessionId=all');
        setHistory(res.data);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isSignedIn, router]);

  if (!isSignedIn || loading) {
    return <p className="text-center mt-10 text-gray-500">Loading your consultation history...</p>;
  }

  if (!history || history.length === 0) {
    return <p className="text-center mt-10 text-gray-500">No consultation history available.</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your Consultation History</h2>
      <MedicalReport history={history} />
    </div>
  );
}
