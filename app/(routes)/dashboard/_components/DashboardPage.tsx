'use client';

import { motion } from "framer-motion";
import { 
  Cpu, Clock, BookOpen, Languages, Zap, 
  TrendingUp, AlertTriangle, Brain, Heart,
  Pill, Activity, BarChart3, Calendar,
  Loader2, FileText, ChevronRight
} from "lucide-react";
import UserHistory from "./UserHistory";
import { useState, useEffect, useContext } from "react";
import { UserDetailContext } from '@/context/UserDetailProvider';
import axios from 'axios';

export type Stats = {
  totalConsultations: number;
  lastConsultation: { sessionId: string; createdOn: string } | null;
  patientHistoryCount: number;
};

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
  language: string;
  conversation: Array<{
    role: string;
    content: string;
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
  lastConsultDate: string;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface DashboardPageProps {
  stats: Stats | null;
  onStartConsultation: (lang: string) => void; 
}

export default function DashboardPage({ stats, onStartConsultation }: DashboardPageProps) {
  const { user } = useContext(UserDetailContext)!;
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [medicalInsights, setMedicalInsights] = useState<MedicalInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);


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


  const analyzeSessions = (sessions: ConsultationSession[]): MedicalInsights => {
    if (sessions.length === 0) {
      return {
        lastSeverity: 'none',
        topKeywords: [],
        recentSymptoms: [],
        severityTrend: [],
        consultationsByDoctor: [],
        totalConsultations: 0,
        avgSeverity: 'none',
        lastConsultDate: 'Never',
        healthScore: 100,
        riskLevel: 'low',
        recommendations: ['Start your first consultation to get personalized health insights']
      };
    }

    const keywordMap = new Map<string, number>();
    const symptomsSet = new Set<string>();
    const severityMap = new Map<string, number>();
    const doctorMap = new Map<string, number>();
    let lastSeverity = 'moderate';
    let lastConsultDate = sessions[0]?.createdOn || new Date().toISOString();

    sessions.forEach((session) => {
      const doctorName = session.selectedDoctor?.name || 'Unknown';
      doctorMap.set(doctorName, (doctorMap.get(doctorName) || 0) + 1);

      session.conversation?.forEach((msg) => {
        if (msg.role === 'user' && msg.natlasData) {
          const { severity, medical_keywords } = msg.natlasData;

          if (severity) {
            severityMap.set(severity, (severityMap.get(severity) || 0) + 1);
            lastSeverity = severity;
          }

          if (medical_keywords && Array.isArray(medical_keywords)) {
            medical_keywords.forEach((keyword) => {
              keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
              symptomsSet.add(keyword);
            });
          }
        }
      });
    });

    const topKeywords = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }));

    const recentSymptoms = Array.from(symptomsSet).slice(0, 10);

    const severityTrend = Array.from(severityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([severity, count]) => ({ severity, count }));

    const consultationsByDoctor = Array.from(doctorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([doctor, count]) => ({ doctor, count }));

   
    const severityValues = { mild: 1, moderate: 2, severe: 3, none: 0 };
    const avgSeverityScore = severityTrend.length > 0
      ? severityTrend.reduce((sum, { severity, count }) => {
          const value = severityValues[severity as keyof typeof severityValues] || 2;
          return sum + value * count;
        }, 0) / sessions.length
      : 0;
    
    const avgSeverity =
      avgSeverityScore <= 1 ? 'mild' : avgSeverityScore <= 2 ? 'moderate' : 'severe';

    
    const healthScore = Math.max(0, 100 - (avgSeverityScore * 20) - (recentSymptoms.length * 2));
    
    
    const riskLevel: 'low' | 'medium' | 'high' = 
      lastSeverity === 'severe' || healthScore < 50 ? 'high' :
      lastSeverity === 'moderate' || healthScore < 75 ? 'medium' : 'low';

    
    const recommendations = generateRecommendations(lastSeverity, recentSymptoms, severityTrend);

    return {
      lastSeverity,
      topKeywords,
      recentSymptoms,
      severityTrend,
      consultationsByDoctor,
      totalConsultations: sessions.length,
      avgSeverity,
      lastConsultDate,
      healthScore,
      riskLevel,
      recommendations
    };
  };

  // Generate AI recommendations
  const generateRecommendations = (
    lastSeverity: string, 
    symptoms: string[], 
    trend: { severity: string; count: number }[]
  ): string[] => {
    const recs: string[] = [];

    if (lastSeverity === 'severe') {
      recs.push(' Your last consultation showed severe symptoms. Please follow up with a healthcare provider immediately.');
    }

    if (symptoms.length > 5) {
      recs.push('You have multiple symptoms tracked. Consider scheduling a comprehensive health check-up.');
    }

    const severeCount = trend.find(t => t.severity === 'severe')?.count || 0;
    if (severeCount > 2) {
      recs.push('Multiple severe consultations detected. Ongoing monitoring recommended.');
    }

    if (symptoms.includes('fever') && symptoms.includes('cough')) {
      recs.push('Respiratory symptoms detected. Ensure proper rest and hydration.');
    }

    if (recs.length === 0) {
      recs.push('Your health metrics look stable. Continue regular check-ins for optimal health monitoring.');
    }

    return recs;
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'yo': return 'Yoruba';
      case 'ig': return 'Igbo';
      case 'ha': return 'Hausa';
      case 'en': return 'English';
      default: return 'English';
    }
  };

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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

const statItems = [
    {
      title: "Total Consultations",
      value: stats?.totalConsultations ?? 0,
      icon: Cpu,
      color: "cyan"
    },
    {
      title: "Health Score",
      value: insightsLoading ? "..." : `${Math.round(medicalInsights?.healthScore || 100)}%`,
      icon: Activity,
      color: "purple"
    },
    {
      title: "Active Symptoms",
      value: insightsLoading ? "..." : medicalInsights?.recentSymptoms.length || 0,
      icon: Heart,
      color: "indigo"
    },
  ];

  return (
    <div className="space-y-8 p-4">
      
      {/* Enhanced Stats Cards with Health Score */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {statItems.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="bg-[#0f172a] border border-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 transition-all duration-500 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/0 to-purple-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-center gap-5 relative z-10">
                <div className={`p-3 rounded-xl bg-${item.color}-500/10 border border-${item.color}-400/30 group-hover:border-purple-400/50 transition duration-300`}>
                  <IconComponent className={`text-${item.color}-400 w-6 h-6`} />
                </div>
                <div>
                  <h3 className="text-cyan-300/70 font-medium text-xs tracking-wider uppercase mb-1">
                    {item.title}
                  </h3>
                  <p className="text-white text-2xl font-bold">
                    {item.value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <hr className="border-gray-700/50 my-6" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        
        {/* Last Consultation Severity */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-indigo-500/30 shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Last Severity</p>
              <h3 className="text-xl font-bold text-white capitalize">
                {insightsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  medicalInsights?.lastSeverity || 'N/A'
                )}
              </h3>
            </div>
            <AlertTriangle className={`w-8 h-8 ${
              medicalInsights?.lastSeverity === 'severe' ? 'text-red-400' :
              medicalInsights?.lastSeverity === 'moderate' ? 'text-yellow-400' :
              'text-green-400'
            }`} />
          </div>
          
          {!insightsLoading && medicalInsights && medicalInsights.lastSeverity !== 'none' && (
            <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium inline-block ${getSeverityColor(medicalInsights.lastSeverity)}`}>
              Current Status
            </div>
          )}
        </motion.div>

        {/* Risk Level */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-purple-500/30 shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Risk Assessment</p>
              <h3 className={`text-xl font-bold capitalize ${getRiskColor(medicalInsights?.riskLevel || 'low')}`}>
                {insightsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  `${medicalInsights?.riskLevel || 'Low'} Risk`
                )}
              </h3>
            </div>
            <Brain className={`w-8 h-8 ${getRiskColor(medicalInsights?.riskLevel || 'low')}`} />
          </div>
          
          {!insightsLoading && medicalInsights && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Health Score: {medicalInsights.healthScore}%</span>
            </div>
          )}
        </motion.div>

        {/* Tracked Symptoms Count */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-cyan-500/30 shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Symptoms Tracked</p>
              <h3 className="text-xl font-bold text-white">
                {insightsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  medicalInsights?.recentSymptoms.length || 0
                )}
              </h3>
            </div>
            <Heart className="w-8 h-8 text-red-400" />
          </div>
          

        </motion.div>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        
        {/* Start Consultation (with Language) */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="lg:col-span-1 bg-[#0f172a] border border-cyan-400/10 backdrop-blur-md rounded-2xl p-6 flex flex-col gap-4 hover:border-purple-400/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <h3 className="text-cyan-300 font-semibold text-base">New Consultation</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            <label className="text-gray-300 text-sm flex items-center gap-2">
              <Languages className="w-4 h-4 text-purple-400" />
              Select Language:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-[#1e293b] text-white border border-gray-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="english">🇬🇧 English</option>
              <option value="yoruba">🇳🇬 Yoruba</option>
              <option value="igbo">🇳🇬 Igbo</option>
              <option value="hausa">🇳🇬 Hausa</option>
            </select>
          </div>
          
          <button 
            onClick={() => onStartConsultation(selectedLanguage)}
            className="mt-auto bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition py-3 px-4 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2"
          >
            Start {getLanguageName(selectedLanguage)} Chat
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="lg:col-span-2 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 backdrop-blur-md rounded-2xl p-6 border border-indigo-500/30 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Medical Summary</h3>
          </div>

          {insightsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            </div>
          ) : medicalInsights && medicalInsights.totalConsultations > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-2 font-semibold">
                  <Pill className="w-4 h-4 text-pink-400" />
                  Top Symptoms Detected
                </p>
                <div className="space-y-2">
                  {medicalInsights.topKeywords.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-indigo-500/20">
                      <span className="text-white font-medium">{item.keyword}</span>
                      <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                        {item.count}x
                      </span>
                    </div>
                  ))}
                  {medicalInsights.topKeywords.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No symptoms tracked yet</p>
                  )}
                </div>
              </div>

              {/* Severity Breakdown */}
              <div>
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-2 font-semibold">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Severity Distribution
                </p>
                <div className="space-y-2">
                  {medicalInsights.severityTrend.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-cyan-500/20">
                      <div className={`w-3 h-3 rounded-full ${
                        item.severity === 'severe' ? 'bg-red-400' :
                        item.severity === 'moderate' ? 'bg-yellow-400' :
                        'bg-green-400'
                      }`} />
                      <span className="text-white font-medium capitalize flex-1">{item.severity}</span>
                      <span className="text-gray-400 text-sm">{item.count} times</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No consultation data available yet</p>
              <p className="text-gray-500 text-sm">Start your first consultation to see AI-powered insights</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* AI Recommendations */}
      {!insightsLoading && medicalInsights && medicalInsights.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">AI Health Recommendations</h3>
          </div>
          
          <div className="space-y-3">
            {medicalInsights.recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl border border-purple-500/20"
              >
                <ChevronRight className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm leading-relaxed">{rec}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <hr className="border-gray-700/50 my-6" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-[#0f172a] border border-cyan-400/10 rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Consultation History
          </h3>
        </div>
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-gray-800/50">
          <UserHistory />
        </div>
      </motion.div>
    </div>
  );
}