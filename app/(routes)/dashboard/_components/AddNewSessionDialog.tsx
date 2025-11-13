
'use client';

import { useState, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { UserDetailContext } from '@/context/UserDetailProvider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { IconLoader, IconLanguage, IconAlertCircle } from '@tabler/icons-react';
import { RecommendedDoctorCard } from './RecommendedDoctorCard';
import { AiDoctorAgent } from './AiDoctorAgentCard';

interface NatlasMatchReason {
  severity: string;
  keywords: string[];
}

export default function AddNewSessionDialog() {
  const router = useRouter();
  const context = useContext(UserDetailContext);
  
  const [note, setNote] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [step, setStep] = useState<'input' | 'recommendations'>('input');
  const [recommendedDoctors, setRecommendedDoctors] = useState<AiDoctorAgent[]>([]);
  const [natlasData, setNatlasData] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<AiDoctorAgent | null>(null);
  const [analyzingSymptoms, setAnalyzingSymptoms] = useState(false);
  const [startingConsultation, setStartingConsultation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Analyze symptoms with retry logic and better error handling
   */
  const handleAnalyzeSymptoms = async () => {
    try {
      setAnalyzingSymptoms(true);
      setError(null);

      // Validation
      if (!note.trim()) {
        setError('Please describe your symptoms or concerns');
        setAnalyzingSymptoms(false);
        return;
      }

      // Check auth
      if (!context?.user) {
        toast.error('Please sign in to continue');
        router.push('/sign-in');
        setAnalyzingSymptoms(false);
        return;
      }

      console.log('🔍 Analyzing symptoms:', note.substring(0, 50) + '...');

      // Get token
      const token = await context.user.getIdToken(true);
      if (!token) {
        throw new Error('Unable to authenticate. Please sign in again.');
      }

  
      const response = await axios.post(
        '/api/suggested-ai-doctors-enhanced',
        {
          notes: note,
          language: selectedLanguage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 seconds
        }
      );

      console.log(' Doctor recommendations received:', response.data);

      if (response.data.success) {
        const doctors = response.data.data || [];
        
        // If no doctors returned, show error
        if (doctors.length === 0) {
          setError('No doctors found for your symptoms. Please try describing them differently.');
          setRecommendedDoctors([]);
        } else {
          setRecommendedDoctors(doctors);
          setNatlasData(response.data.natlasEnhancement || null);
          setStep('recommendations');
          
          if (response.data.fallbackUsed) {
            toast.info('Using alternative matching method');
          }
        }
      } else {
        throw new Error('Failed to get doctor recommendations');
      }

    } catch (err: any) {
      console.error('❌ Symptom analysis error:', err);

      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        router.push('/sign-in');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (err.response?.status === 504 || err.code === 'ECONNABORTED') {
        
        if (retryCount < 2) {
          setError(`Request timeout. Retrying... (${retryCount + 1}/2)`);
          setRetryCount(retryCount + 1);
          
          // Auto-retry after 2 seconds
          setTimeout(() => {
            handleAnalyzeSymptoms();
          }, 2000);
          return;
        } else {
          setError('The analysis is taking too long. Please try with simpler symptoms or try again later.');
        }
      } else if (err.response?.status === 400) {
        setError(`Invalid request: ${err.response.data?.error || 'Please try again'}`);
      } else {
        setError(err.response?.data?.error || 'Unable to analyze symptoms. Please try again.');
      }
      
      setRetryCount(0); // Reset retry count
    } finally {
      setAnalyzingSymptoms(false);
    }
  };

  /**
   * Start consultation with selected doctor
   */
  const handleStartConsultation = async () => {
    try {
      setStartingConsultation(true);
      setError(null);

      if (!selectedDoctor) {
        setError('Please select a doctor to continue');
        setStartingConsultation(false);
        return;
      }

      if (!context?.user) {
        toast.error('Please sign in to start a consultation');
        router.push('/sign-in');
        setStartingConsultation(false);
        return;
      }

      console.log('🏥 Starting consultation with:', selectedDoctor.name);

      const token = await context.user.getIdToken(true);
      if (!token) {
        throw new Error('Unable to authenticate. Please sign in again.');
      }

      const payload = {
        notes: note,
        selectedDoctor: {
          id: selectedDoctor.id,
          name: selectedDoctor.name,
          specialty: selectedDoctor.specialty,
          description: selectedDoctor.description,
          image: selectedDoctor.image,
          agentPrompt: selectedDoctor.agentPrompt,
          doctorVoiceId: selectedDoctor.doctorVoiceId,
        },
        language: selectedLanguage,
      };

      console.log('📤 Creating session with payload:', JSON.stringify(payload, null, 2));
      console.log('🌐 API URL:', `${window.location.origin}/api/voice-chat`);

      const response = await axios.post(
        '/api/voice-chat',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('✅ API Response:', response.data);

      if (response.data.success && response.data.sessionId) {
        toast.success(`Consultation started with ${selectedDoctor.name}!`);
        router.push(`/dashboard/medical-voice/${response.data.sessionId}`);
      } else {
        throw new Error(response.data.error || 'Failed to start consultation');
      }

    } catch (err: any) {
      console.error('❌ Start consultation error:', err);

      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        router.push('/sign-in');
      } else if (err.response?.status === 400) {
        setError(`Invalid request: ${err.response.data?.error || 'Please try again'}`);
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection.');
      } else {
        toast.error(err.response?.data?.error || 'Unable to start consultation.');
      }
    } finally {
      setStartingConsultation(false);
    }
  };

  
  const handleGoBack = () => {
    setStep('input');
    setSelectedDoctor(null);
    setRecommendedDoctors([]);
    setNatlasData(null);
    setError(null);
    setRetryCount(0);
  };

  return (
    <div className="p-6 bg-[#111827] rounded-2xl shadow-xl border border-cyan-500/20 max-w-3xl mx-auto">
      
      {/* STEP 1: SYMPTOM INPUT */}
      {step === 'input' && (
        <>
          <h2 className="text-2xl font-bold mb-6 text-cyan-300">Describe Your Symptoms</h2>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400 rounded-lg flex items-start gap-2">
              <IconAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Auth Loading State */}
          {context?.loading && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-400 rounded-lg">
              <p className="text-blue-200 text-sm">Checking authentication...</p>
            </div>
          )}

          {/* Symptom Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              What symptoms are you experiencing?
            </label>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError(null);
              }}
              placeholder="e.g., I have a headache and fever for 2 days, feeling weak..."
              className="w-full p-4 border border-gray-600 rounded-lg min-h-[150px] bg-[#1e293b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              disabled={analyzingSymptoms || context?.loading}
            />
            <p className="text-xs text-gray-400 mt-2">
              Be as detailed as possible. Mention duration, severity, and any other relevant information.
            </p>
          </div>

          {/* Language Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <IconLanguage className="w-4 h-4 text-purple-400" />
              Preferred Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-3 border border-gray-600 rounded-lg bg-[#1e293b] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={analyzingSymptoms || context?.loading}
            >
              <option value="english">🇬🇧 English</option>
              <option value="yoruba">🇳🇬 Yoruba</option>
              <option value="igbo">🇳🇬 Igbo</option>
              <option value="hausa">🇳🇬 Hausa</option>
            </select>
          </div>

          {/* Next Button */}
          <Button
            onClick={handleAnalyzeSymptoms}
            disabled={analyzingSymptoms || context?.loading || !note.trim() || !context?.user}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzingSymptoms ? (
              <span className="flex items-center justify-center gap-2">
                <IconLoader className="w-5 h-5 animate-spin" />
                {retryCount > 0 ? `Retrying (${retryCount}/2)...` : 'Analyzing symptoms...'}
              </span>
            ) : context?.loading ? (
              'Checking authentication...'
            ) : !context?.user ? (
              'Sign in to continue'
            ) : (
              'Next: Find Recommended Doctors'
            )}
          </Button>
        </>
      )}

      {/*  DOCTOR RECOMMENDATIONS */}
      {step === 'recommendations' && (
        <>
          <div className="mb-6">
            <button
              onClick={handleGoBack}
              className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 mb-4"
            >
              ← Back to symptoms
            </button>
            <h2 className="text-2xl font-bold text-cyan-300">Recommended Doctors</h2>
            <p className="text-gray-400 text-sm mt-2">
              Based on your symptoms, we recommend these specialists:
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400 rounded-lg flex items-start gap-2">
              <IconAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* N-ATLAS Analysis Summary */}
          {natlasData && (
            <div className="mb-6 p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-lg">
              <h3 className="text-sm font-semibold text-indigo-300 mb-2">Analysis Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Severity:</span>
                  <span className="ml-2 font-semibold text-white">{natlasData.severity || 'Moderate'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Keywords:</span>
                  <span className="ml-2 font-semibold text-white">
                    {natlasData.detectedSymptoms?.slice(0, 3).join(', ') || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Doctor Cards */}
          <div className="mb-6 space-y-4">
            {recommendedDoctors.length > 0 ? (
              recommendedDoctors.map((doctor) => (
                <RecommendedDoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  setSelectedDoctor={setSelectedDoctor}
                  selectedDoctor={selectedDoctor || undefined}
                  natlasMatchReason={{
                    severity: natlasData?.severity || 'moderate',
                    keywords: natlasData?.detectedSymptoms || [],
                  }}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">
                  No doctors found. Please try describing your symptoms differently.
                </p>
                <Button
                  onClick={handleGoBack}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Start Consultation Button */}
          <Button
            onClick={handleStartConsultation}
            disabled={startingConsultation || !selectedDoctor}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {startingConsultation ? (
              <span className="flex items-center justify-center gap-2">
                <IconLoader className="w-5 h-5 animate-spin" />
                Starting consultation...
              </span>
            ) : !selectedDoctor ? (
              'Select a doctor to continue'
            ) : (
              `Start Consultation with ${selectedDoctor.name}`
            )}
          </Button>
        </>
      )}
    </div>
  );
}