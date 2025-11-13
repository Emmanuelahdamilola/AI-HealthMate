'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { X, Calendar, Zap, Activity, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface ReportFields {
    severity: string;
    summary: string;
    symptoms: string[];
    duration: string;
    medicationsMentioned: string[];
    recommendations: string[];
    user: string;
    mainComplaint: string;
}

interface DoctorFields {
    name: string;
    specialty: string;
}

interface SessionParams {
    sessionId: string;
    createdOn: string;
    selectedDoctor: DoctorFields;
    note: string;
    report?: ReportFields;
    conversation?: any[];
    id?: number;
}

type Props = {
  history: SessionParams[]
}

export default function UserHistory({ history }: Props) {
  const [historyData, setHistoryData] = useState<SessionParams[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionParams | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  //  Better error handling and empty state management
  useEffect(() => {
    const fetchHistory = async (user: any, token: string) => {
      try {
        console.log(' Fetching user history...');
        
        const result = await axios.get('/api/voice-chat?history=true', { 
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log(' History fetched:', result.data);

        // Handle both success response formats
        if (result.data.success) {
          const data: SessionParams[] = Array.isArray(result.data.data) 
            ? result.data.data 
            : [];
          
          // Sort by date, newest first
          data.sort((a, b) => 
            new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
          );

          setHistoryData(data);
          
          if (data.length === 0) {
            console.log('No consultation history found for user');
          }
        } else {
          throw new Error(result.data.error || 'Failed to fetch history');
        }

      } catch (err: any) {
        console.error(' Error fetching session history:', err);
        
        // Don't show error toast for empty history or auth issues
        if (err.response?.status === 404) {
          console.log(' No history found (404) - treating as empty');
          setHistoryData([]);
        } else if (err.response?.status === 401) {
          console.log(' Unauthorized - will be handled by auth check');
          setHistoryData([]);
        } else {
          // Only show error for actual server/network issues
          console.error('Server error:', err.response?.status);
          toast.error('Unable to load consultation history. Please refresh the page.');
          setHistoryData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        user.getIdToken().then(token => fetchHistory(user, token));
      } else {
        setLoading(false);
        toast.error('You must be signed in to view your medical history.', { 
          duration: 3500 
        });
      }
    });

    return () => unsubscribe();
  }, []);
  
  // --- Helpers ---
  const getSeverityStyle = (severity: string | undefined) => {
    switch (severity?.toLowerCase()) {
      case 'severe': return 'bg-red-700 text-white';
      case 'moderate': return 'bg-orange-600 text-white';
      case 'mild': return 'bg-green-600 text-white';
      default: return 'bg-gray-700 text-gray-400';
    }
  }

  const getSeverity = (session: SessionParams) => {
    return session.report?.severity || 'N/A'; 
  }
  
  // --- PDF Generation Logic ---
  const handleDownloadReport = async (report: SessionParams) => {
    if (!report.report) {
      toast.error('No final report available for download.');
      return;
    }

    setIsDownloading(report.sessionId || 'temp');

    try {
      const doc = new jsPDF()
      let y = 10
      const pageWidth = 190;
      const margin = 10;
      let lineSpacing = 7;
      
      const reportData = report.report;
      
      // 1. Title and Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('N-ATLAS AI Consultation Report', margin, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Assistant: ${report.selectedDoctor?.name || 'N/A'} (${report.selectedDoctor?.specialty || 'N/A'})`, margin, y);
      y += 5;
      doc.text(`Patient: ${reportData.user || 'N/A'}`, margin, y);
      y += 5;
      doc.text(`Date: ${new Date(report.createdOn).toLocaleString()}`, margin, y);
      y += lineSpacing;
      
      // 2. Main Summary and Complaint
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('I. Summary & Complaint', margin, y);
      y += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const complaintText = `Complaint: ${reportData.mainComplaint || report.note || 'N/A'}`;
      doc.text(complaintText, margin, y);
      y += lineSpacing;
      
      const summaryText = reportData.summary || 'No summary generated by the AI.';
      const summaryLines = doc.splitTextToSize(`Summary: ${summaryText}`, pageWidth);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 4.5; 
      y += lineSpacing;

      // 3. Structured Data
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('II. Key Findings', margin, y);
      y += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      doc.text(`Severity: ${reportData.severity || 'N/A'}`, margin, y); y += 5;
      doc.text(`Duration: ${reportData.duration || 'N/A'}`, margin, y); y += 5;
      doc.text(`Symptoms: ${reportData.symptoms?.join(', ') || 'N/A'}`, margin, y); y += 5;
      doc.text(`Medications Mentioned: ${reportData.medicationsMentioned?.join(', ') || 'None'}`, margin, y); y += lineSpacing;
      
      // 4. Recommendations
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('III. Recommendations', margin, y);
      y += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const recommendationsText = reportData.recommendations?.join('; ') || 'No specific recommendations provided.';
      const recommendationsLines = doc.splitTextToSize(recommendationsText, pageWidth);
      doc.text(recommendationsLines, margin, y);
      
      // Final Save
      doc.save(`medical_report_${report.sessionId || Date.now()}.pdf`);
      toast.success('Report downloaded successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report.');
    } finally {
      setIsDownloading(null);
    }
  }

  // --- Render Loading State ---
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 text-gray-300"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full mb-4"
        />
        <p className="text-lg">Loading your medical history...</p>
      </motion.div>
    );
  }

  // --- Render Empty State ---
  if (historyData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto px-8 py-16 flex flex-col items-center justify-center text-center 
          bg-gradient-to-b from-gray-900/40 to-gray-900/80 rounded-2xl shadow-lg border border-purple-500/20"
      >
        {/* Icon instead of image */}
        <div className="w-20 h-20 rounded-full bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center mb-6">
          <Activity className="w-10 h-10 text-purple-400" />
        </div>
        
        <h2 className="text-3xl font-bold text-cyan-400 mb-3">
          No Consultation History Yet
        </h2>
        
        <p className="text-gray-400 text-lg mb-6 max-w-md">
          Your medical consultation history will appear here once you complete your first session.
        </p>
        
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          <p className="flex items-center gap-2 justify-center">
            <Zap className="w-4 h-4 text-cyan-400" />
            Consultations are saved automatically
          </p>
          <p className="flex items-center gap-2 justify-center">
            <Download className="w-4 h-4 text-cyan-400" />
            Download reports as PDF anytime
          </p>
        </div>
      </motion.div>
    );
  }

  // --- Render History Table ---
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl mx-auto overflow-x-auto"
      >
        <motion.table
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="min-w-full border-collapse text-left bg-gray-900/80 
            backdrop-blur-md border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden"
        >
          <thead className="bg-gradient-to-r from-purple-700/60 to-cyan-700/60 text-white uppercase text-sm">
            <tr>
              <th className="py-4 px-6">Date</th>
              <th className="py-4 px-6">AI Assistant</th>
              <th className="py-4 px-6 text-center">Severity</th>
              <th className="py-4 px-6">Initial Complaint</th>
              <th className="py-4 px-6 text-center">Report Status</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((session, i) => (
              <motion.tr
                key={session.sessionId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-gray-700/50 hover:bg-cyan-500/10 transition-all duration-300"
              >
                <td className="py-4 px-6 text-gray-400 text-sm">
                  <Calendar className="w-4 h-4 inline mr-2 text-purple-400" />
                  {new Date(session.createdOn).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-gray-200 font-medium">
                  {session.selectedDoctor?.name || '—'}
                  <p className="text-xs text-cyan-400 mt-0.5">
                    {session.selectedDoctor?.specialty || '—'}
                  </p>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityStyle(getSeverity(session))}`}>
                    {getSeverity(session).toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-300 max-w-xs truncate">
                  {session.note || 'No notes available'}
                </td>
                <td className="py-4 px-6 text-center text-sm">
                  {session.report ? (
                    <span className="text-green-400 flex items-center justify-center gap-1">
                      <Zap className="w-4 h-4"/> Finalized
                    </span>
                  ) : (
                    <span className="text-yellow-400">Pending</span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => handleDownloadReport(session)}
                    disabled={!session.report || isDownloading === session.sessionId}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 ml-auto"
                  >
                    {isDownloading === session.sessionId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isDownloading === session.sessionId ? 'Generating...' : 'Download'}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
      </motion.div>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gray-900 text-gray-100 rounded-2xl shadow-2xl w-full max-w-4xl p-8 overflow-y-auto max-h-[90vh] border border-cyan-400/50"
            >
              <button
                onClick={() => setSelectedSession(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition z-10"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>

              <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-b border-gray-700 pb-2">
                Consultation Summary
              </h2>
              
              {/* Display Key Report Data */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="font-medium text-purple-400">Assistant:</p>
                  <p>{selectedSession.selectedDoctor?.name} ({selectedSession.selectedDoctor?.specialty})</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="font-medium text-purple-400">Date:</p>
                  <p>{new Date(selectedSession.createdOn).toLocaleString()}</p>
                </div>
                <div className={`${getSeverityStyle(selectedSession.report?.severity)} p-3 rounded-lg font-bold flex items-center justify-between`}>
                  <p>Severity:</p>
                  <p className="text-lg">{selectedSession.report?.severity?.toUpperCase() || 'N/A'}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="font-medium text-purple-400">Main Complaint:</p>
                  <p>{selectedSession.note}</p>
                </div>
              </div>
              
              {/* Report Section */}
              {selectedSession.report && (
                <div className="mt-4">
                  <h3 className="font-semibold text-xl text-purple-400 mb-2">AI Generated Report</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    {selectedSession.report.summary}
                  </p>

                  <div className="space-y-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-cyan-400 font-medium">Keywords:</p>
                    <p className="text-gray-300">{selectedSession.report.symptoms?.join(', ') || '—'}</p>
                    
                    <p className="text-cyan-400 font-medium pt-2 border-t border-gray-700">Recommendations:</p>
                    <ul className="list-disc list-inside text-gray-300">
                      {selectedSession.report.recommendations?.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Conversation History */}
              <div className="mt-8">
                <h3 className="font-semibold text-xl text-cyan-400 mb-3 border-b border-gray-700 pb-2">Full Chat Transcript</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto p-3 bg-gray-900 rounded-lg">
                  {selectedSession.conversation?.map((msg: any, i: number) => (
                    <div key={i} className={`text-xs ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <span className={`font-bold ${msg.role === 'user' ? 'text-indigo-400' : 'text-cyan-400'}`}>
                        {msg.role === 'user' ? 'Patient' : selectedSession.selectedDoctor?.name}:
                      </span>
                      <p className="text-gray-300 break-words">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}