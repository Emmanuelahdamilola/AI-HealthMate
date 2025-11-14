// 'use client';

// import React, { useContext, useState, useEffect, useCallback } from 'react';
// import { UserDetailContext } from '@/context/UserDetailProvider';
// import { getAuth, updateProfile, updatePassword } from 'firebase/auth';
// import { toast } from 'sonner';
// import { motion } from 'framer-motion';
// import axios from 'axios';
// import { Mail, User, Lock, Clock, Activity, Loader2, KeyRound } from 'lucide-react';

// // Assuming placeholder image path
// const DEFAULT_AVATAR = '/placeholder-user.png'; 

// export default function ProfilePage() {
//   const { user, userDetail, setUserDetail } = useContext(UserDetailContext)!;

//   const [displayName, setDisplayName] = useState('');
//   // REMOVED PHOTO URL STATE: Will derive photoURL directly from component props/state
//   const [email, setEmail] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [joinDate, setJoinDate] = useState('');

//   // 1. Initialize states based on context/Firebase user
//   useEffect(() => {
//     const dName = userDetail?.name || user?.displayName || '';
    
//     setDisplayName(dName);
//     setEmail(userDetail?.email || user?.email || '');
    
//     // Set join date from Firebase metadata
//     if (user?.metadata?.creationTime) {
//         setJoinDate(new Date(user.metadata.creationTime).toLocaleDateString());
//     }
//   }, [userDetail, user]);

//   // Derive the current Photo URL from the user object for display
//   const currentPhotoURL = userDetail?.photoURL || user?.photoURL || '';


//   // 2. Profile Update Handler (Functionality is solid, but updated for modern async/await)
//   const handleProfileUpdate = useCallback(async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const auth = getAuth();
//       const currentUser = auth.currentUser;
//       if (!currentUser) throw new Error('User not signed in');
      
//       // We only update displayName in Firebase Auth now. PhotoURL remains the Firebase value.
//       await updateProfile(currentUser, { displayName, photoURL: currentPhotoURL }); 
      
//       // Update password
//       if (newPassword) {
//         await updatePassword(currentUser, newPassword);
//         toast.success('Password updated successfully');
//         setNewPassword('');
//       }

//       // Update your database (only sending the fields that changed or need synchronization)
//       const token = await currentUser.getIdToken();
//       const res = await axios.put(
//         '/api/users',
//         { name: displayName, photoURL: currentPhotoURL }, // Send the existing Firebase URL for synchronization
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       // Update context
//       setUserDetail(res.data.user); // Assuming the backend returns { user: data }
      
//       toast.success('Profile updated successfully');
//     } catch (err: any) {
//       console.error(err);
//       // For password update errors (e.g., requires recent login), provide better feedback
//       if (err.code === 'auth/requires-recent-login') {
//           toast.error('Security requires recent sign-in. Please log in again to change the password.');
//       } else {
//           toast.error(err.message || 'Failed to update profile');
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [displayName, newPassword, currentPhotoURL, setUserDetail, user]);


//   const consultationStats = {
//       lastConsult: (userDetail as any)?.lastConsult ?? new Date().toISOString(),
//       totalConsults: (userDetail as any)?.totalConsults ?? 14,
//   };


//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.6 }}
//       className="w-full max-w-6xl mx-auto p-4"
//     >
//       <h1 className="text-3xl font-extrabold text-white mb-6 tracking-wider">
//         User Settings & Profile
//       </h1>
      
//       {/* --- TWO-COLUMN LAYOUT --- */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
//         {/* LEFT COLUMN: IDENTITY & STATUS */}
//         <motion.div 
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.6, delay: 0.2 }}
//             className="lg:col-span-1 bg-gray-900/70 backdrop-blur-md rounded-2xl p-6 h-fit border border-cyan-400/20 shadow-xl"
//         >
//             <div className="flex flex-col items-center justify-center text-center">
//                 {/* Large Avatar (Uses Auth image directly) */}
//                 <div className="relative mb-4">
//                     <img
//                         src={currentPhotoURL || DEFAULT_AVATAR}
//                         alt="User Profile"
//                         className="w-32 h-32 rounded-full border-4 border-cyan-400 object-cover shadow-2xl"
//                     />
//                     {/* Online Status Indicator */}
//                     <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900" />
//                 </div>

//                 <h3 className="text-2xl font-bold text-white">{displayName || 'Anonymous User'}</h3>
//                 <p className="text-sm text-cyan-300 flex items-center gap-1 mt-1">
//                     <Mail className="w-3 h-3" />
//                     {email}
//                 </p>

//                 {/* Account Status Card */}
//                 <div className="mt-6 w-full p-4 bg-gray-800 rounded-xl space-y-2 border border-gray-700">
//                     <p className="text-xs text-gray-400 flex items-center gap-2">
//                         <User className="w-4 h-4 text-purple-400" />
//                         Account Created: <span className="font-semibold text-white">{joinDate}</span>
//                     </p>
//                     <p className="text-xs text-gray-400 flex items-center gap-2">
//                         <Activity className="w-4 h-4 text-cyan-400" />
//                         Total Consults: <span className="font-semibold text-white">{consultationStats.totalConsults}</span>
//                     </p>
//                     <p className="text-xs text-gray-400 flex items-center gap-2">
//                         <Clock className="w-4 h-4 text-gray-300" />
//                         Last Consult: <span className="font-semibold text-white">{new Date(consultationStats.lastConsult).toLocaleDateString()}</span>
//                     </p>
//                 </div>
//             </div>
//         </motion.div>

//         {/* RIGHT COLUMN: PROFILE FORM & SECURITY */}
//         <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, delay: 0.3 }}
//             className="lg:col-span-2 bg-gray-900/70 backdrop-blur-md rounded-2xl p-8 border border-purple-400/20 shadow-xl"
//         >
//             <h2 className="text-2xl font-bold text-cyan-300 mb-6 border-b border-gray-700 pb-3">
//                 Update Information
//             </h2>
            
//             <form onSubmit={handleProfileUpdate} className="flex flex-col gap-8">
                
//                 {/* --- SECTION: PERSONAL INFO --- */}
//                 <fieldset className="flex flex-col gap-5 border-b border-gray-700 pb-6">
//                     <legend className="text-lg font-semibold text-purple-300 mb-3">Personal Details</legend>
                    
//                     {/* Full Name */}
//                     <div className="flex flex-col">
//                         <label className="text-gray-300 mb-2 flex items-center gap-2">
//                             <User className="w-4 h-4 text-cyan-400" /> Full Name
//                         </label>
//                         <input
//                             type="text"
//                             placeholder="Your name"
//                             value={displayName}
//                             onChange={(e) => setDisplayName(e.target.value)}
//                             className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
//                         />
//                     </div>
                    
//                     {/* Email (readonly) */}
//                     <div className="flex flex-col">
//                         <label className="text-gray-300 mb-2 flex items-center gap-2">
//                             <Mail className="w-4 h-4 text-purple-400" /> Email (Primary Identifier)
//                         </label>
//                         <input
//                             type="email"
//                             value={email}
//                             readOnly
//                             className="p-3 rounded-lg bg-gray-700 text-gray-400 border border-gray-700 cursor-not-allowed"
//                         />
//                     </div>
//                 </fieldset>

//                 {/* --- SECTION: SECURITY --- */}
//                 <fieldset className="flex flex-col gap-5">
//                     <legend className="text-lg font-semibold text-purple-300 mb-3">Security & Access</legend>

//                     {/* New Password */}
//                     <div className="flex flex-col">
//                         <label className="text-gray-300 mb-2 flex items-center gap-2">
//                             <Lock className="w-4 h-4 text-cyan-400" /> Change Password
//                         </label>
//                         <input
//                             type="password"
//                             placeholder="Enter new password (leave empty to keep current)"
//                             value={newPassword}
//                             onChange={(e) => setNewPassword(e.target.value)}
//                             className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
//                         />
//                     </div>
                    
//                     {/* API Key Placeholder (Readonly) */}
//                     <div className="flex flex-col">
//                         <label className="text-gray-300 mb-2 flex items-center gap-2">
//                             <KeyRound className="w-4 h-4 text-purple-400" /> N-ATLAS API Key
//                         </label>
//                         <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-sm">
//                             **************************** (Placeholder for future key)
//                         </div>
//                     </div>
//                 </fieldset>

//                 {/* Submit Button */}
//                 <button
//                     type="submit"
//                     disabled={loading}
//                     className="mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-600 
//                                 text-white py-3 px-4 rounded-xl font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] 
//                                 transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                     {loading ? (
//                         <>
//                             <Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...
//                         </>
//                     ) : (
//                         'Update Profile & Security'
//                     )}
//                 </button>
//             </form>
//         </motion.div>
        
//       </div>
//     </motion.div>
//   );
// }


'use client';

import React, { useContext, useState, useEffect, useCallback } from 'react';
import { UserDetailContext } from '@/context/UserDetailProvider';
import { getAuth, updateProfile, updatePassword } from 'firebase/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Mail, User, Lock, Clock, Activity, Loader2, KeyRound,
  TrendingUp, AlertTriangle, Heart, Pill, Calendar,
  FileText, BarChart3, Brain
} from 'lucide-react';

const DEFAULT_AVATAR = '/placeholder-user.png';

interface NatlasData {
  severity?: string;
  medical_keywords?: string[];
  cultural_context?: string;
  match_type?: string;
}

interface ConsultationSession {
  sessionId: string;
  createdOn: string;
  status: string;
  selectedDoctor: {
    name: string;
    specialty: string;
  };
  conversation: Array<{
    role: string;
    natlasData?: NatlasData;
  }>;
}

interface MedicalInsights {
  lastSeverity: string;
  topKeywords: { keyword: string; count: number }[];
  recentSymptoms: string[];
  severityTrend: { severity: string; count: number }[];
  consultationsByDoctor: { doctor: string; count: number }[];
  totalConsultations: number;
  avgSeverity: string;
}

export default function ProfilePage() {
  const { user, userDetail, setUserDetail } = useContext(UserDetailContext)!;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [joinDate, setJoinDate] = useState('');
  const [medicalInsights, setMedicalInsights] = useState<MedicalInsights | null>(null);

  const currentPhotoURL = userDetail?.photoURL || user?.photoURL || '';

  // Initialize states
  useEffect(() => {
    const dName = userDetail?.name || user?.displayName || '';
    setDisplayName(dName);
    setEmail(userDetail?.email || user?.email || '');
    
    if (user?.metadata?.creationTime) {
      setJoinDate(new Date(user.metadata.creationTime).toLocaleDateString());
    }
  }, [userDetail, user]);

  // Fetch medical insights from consultation history
  useEffect(() => {
    const fetchMedicalInsights = async () => {
      if (!user) return;

      setInsightsLoading(true);
      try {
        const token = await user.getIdToken();
        const response = await axios.get('/api/voice-chat?history=true', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sessions: ConsultationSession[] = response.data.data || [];
        const insights = analyzeSessions(sessions);
        setMedicalInsights(insights);

      } catch (err) {
        console.error('Failed to fetch medical insights:', err);
      } finally {
        setInsightsLoading(false);
      }
    };

    fetchMedicalInsights();
  }, [user]);

  // Analyze sessions to extract medical insights
  const analyzeSessions = (sessions: ConsultationSession[]): MedicalInsights => {
    const keywordMap = new Map<string, number>();
    const symptomsSet = new Set<string>();
    const severityMap = new Map<string, number>();
    const doctorMap = new Map<string, number>();
    let lastSeverity = 'moderate';

    sessions.forEach((session) => {
      // Track doctor consultations
      const doctorName = session.selectedDoctor?.name || 'Unknown';
      doctorMap.set(doctorName, (doctorMap.get(doctorName) || 0) + 1);

      session.conversation?.forEach((msg) => {
        if (msg.role === 'user' && msg.natlasData) {
          const { severity, medical_keywords } = msg.natlasData;

          // Track severity
          if (severity) {
            severityMap.set(severity, (severityMap.get(severity) || 0) + 1);
            lastSeverity = severity;
          }

          // Track keywords/symptoms
          if (medical_keywords && Array.isArray(medical_keywords)) {
            medical_keywords.forEach((keyword) => {
              keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
              symptomsSet.add(keyword);
            });
          }
        }
      });
    });

    // Get top 5 keywords
    const topKeywords = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }));

    // Get recent symptoms (last 10 unique)
    const recentSymptoms = Array.from(symptomsSet).slice(0, 10);

    // Severity trend
    const severityTrend = Array.from(severityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([severity, count]) => ({ severity, count }));

    // Consultations by doctor
    const consultationsByDoctor = Array.from(doctorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([doctor, count]) => ({ doctor, count }));

    // Calculate average severity
    const severityValues = { mild: 1, moderate: 2, severe: 3 };
    const avgSeverityScore =
      severityTrend.reduce((sum, { severity, count }) => {
        const value = severityValues[severity as keyof typeof severityValues] || 2;
        return sum + value * count;
      }, 0) / sessions.length;
    
    const avgSeverity =
      avgSeverityScore <= 1.5 ? 'mild' : avgSeverityScore <= 2.5 ? 'moderate' : 'severe';

    return {
      lastSeverity,
      topKeywords,
      recentSymptoms,
      severityTrend,
      consultationsByDoctor,
      totalConsultations: sessions.length,
      avgSeverity,
    };
  };

  // Profile update handler
  const handleProfileUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not signed in');
      
      await updateProfile(currentUser, { displayName, photoURL: currentPhotoURL });
      
      if (newPassword) {
        await updatePassword(currentUser, newPassword);
        toast.success('Password updated successfully');
        setNewPassword('');
      }

      const token = await currentUser.getIdToken();
      const res = await axios.put(
        '/api/users',
        { name: displayName, photoURL: currentPhotoURL },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserDetail(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        toast.error('Security requires recent sign-in. Please log in again to change the password.');
      } else {
        toast.error(err.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  }, [displayName, newPassword, currentPhotoURL, setUserDetail, user]);

  // Severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'mild':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'moderate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'severe':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-7xl mx-auto p-4 space-y-6"
    >
      <h1 className="text-3xl font-extrabold text-white mb-6 tracking-wider">
        Medical Dashboard & Profile
      </h1>
      
      {/* Medical Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Last Consultation Severity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-indigo-500/30 shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Last Consultation</p>
              <h3 className="text-2xl font-bold text-white">
                {insightsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  medicalInsights?.lastSeverity || 'N/A'
                )}
              </h3>
            </div>
            <AlertTriangle className={`w-10 h-10 ${
              medicalInsights?.lastSeverity === 'severe' ? 'text-red-400' :
              medicalInsights?.lastSeverity === 'moderate' ? 'text-yellow-400' :
              'text-green-400'
            }`} />
          </div>
          
          {!insightsLoading && medicalInsights && (
            <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium inline-block ${getSeverityColor(medicalInsights.lastSeverity)}`}>
              Severity Level
            </div>
          )}
        </motion.div>

        {/* Total Consultations */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-cyan-500/30 shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Consultations</p>
              <h3 className="text-2xl font-bold text-white">
                {insightsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  medicalInsights?.totalConsultations || 0
                )}
              </h3>
            </div>
            <Activity className="w-10 h-10 text-cyan-400" />
          </div>
          
          {!insightsLoading && medicalInsights && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>Avg: {medicalInsights.avgSeverity}</span>
            </div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-purple-500/30 shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Health Tracking</p>
              <h3 className="text-2xl font-bold text-white">
                {insightsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  `${medicalInsights?.recentSymptoms.length || 0} Symptoms`
                )}
              </h3>
            </div>
            <Brain className="w-10 h-10 text-purple-400" />
          </div>
          
          {!insightsLoading && medicalInsights && (
            <div className="text-sm text-gray-400">
              Monitored by N-ATLAS
            </div>
          )}
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: User Profile */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Profile Card */}
          <div className="bg-gray-900/70 backdrop-blur-md rounded-2xl p-6 border border-cyan-400/20 shadow-xl">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <img
                  src={currentPhotoURL || DEFAULT_AVATAR}
                  alt="User Profile"
                  className="w-32 h-32 rounded-full border-4 border-cyan-400 object-cover shadow-2xl"
                />
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900" />
              </div>

              <h3 className="text-2xl font-bold text-white">{displayName || 'Anonymous User'}</h3>
              <p className="text-sm text-cyan-300 flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                {email}
              </p>

              <div className="mt-6 w-full p-4 bg-gray-800 rounded-xl space-y-2 border border-gray-700">
                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Joined: <span className="font-semibold text-white">{joinDate}</span>
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Member for: <span className="font-semibold text-white">
                    {user?.metadata?.creationTime
                      ? Math.floor((Date.now() - new Date(user.metadata.creationTime).getTime()) / (1000 * 60 * 60 * 24))
                      : 0} days
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* N-ATLAS Insights Card */}
          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-md rounded-2xl p-6 border border-indigo-500/30 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">N-ATLAS Insights</h3>
            </div>

            {insightsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              </div>
            ) : medicalInsights ? (
              <div className="space-y-4">
                {/* Top Keywords */}
                <div>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Pill className="w-3 h-3" />
                    Top Symptoms Tracked
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {medicalInsights.topKeywords.slice(0, 3).map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30"
                      >
                        {item.keyword} ({item.count})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Severity Distribution */}
                <div>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Severity Breakdown
                  </p>
                  <div className="space-y-1.5">
                    {medicalInsights.severityTrend.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          item.severity === 'severe' ? 'bg-red-400' :
                          item.severity === 'moderate' ? 'bg-yellow-400' :
                          'bg-green-400'
                        }`} />
                        <span className="text-xs text-gray-300 capitalize">{item.severity}</span>
                        <span className="text-xs text-gray-500 ml-auto">{item.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No consultation data available yet
              </p>
            )}
          </div>
        </motion.div>

        {/* RIGHT: Settings & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Settings Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gray-900/70 backdrop-blur-md rounded-2xl p-8 border border-purple-400/20 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-cyan-300 mb-6 border-b border-gray-700 pb-3">
              Update Information
            </h2>
            
            <form onSubmit={handleProfileUpdate} className="flex flex-col gap-8">
              
              <fieldset className="flex flex-col gap-5 border-b border-gray-700 pb-6">
                <legend className="text-lg font-semibold text-purple-300 mb-3">Personal Details</legend>
                
                <div className="flex flex-col">
                  <label className="text-gray-300 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-gray-300 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-400" /> Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="p-3 rounded-lg bg-gray-700 text-gray-400 border border-gray-700 cursor-not-allowed"
                  />
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-5">
                <legend className="text-lg font-semibold text-purple-300 mb-3">Security</legend>

                <div className="flex flex-col">
                  <label className="text-gray-300 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" /> Change Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (optional)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                  />
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-600 
                          text-white py-3 px-4 rounded-xl font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] 
                          transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>
            </form>
          </motion.div>

          {/* Recent Symptoms & Doctors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/70 backdrop-blur-md rounded-2xl p-6 border border-cyan-400/20 shadow-xl"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Recent Medical Activity
            </h3>

            {insightsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            ) : medicalInsights ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Symptoms */}
                <div>
                  <p className="text-sm text-gray-400 mb-3 font-semibold">Tracked Symptoms</p>
                  <div className="space-y-2">
                    {medicalInsights.recentSymptoms.slice(0, 5).map((symptom, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-gray-300">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consultations by Doctor */}
                <div>
                  <p className="text-sm text-gray-400 mb-3 font-semibold">Frequent Doctors</p>
                  <div className="space-y-2">
                    {medicalInsights.consultationsByDoctor.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-300">{item.doctor}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">
                          {item.count} visits
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">No recent activity</p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}