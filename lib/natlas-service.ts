// lib/natlas-service.ts
// Service to interact with your N-ATLAS API - TIMEOUT FIXED VERSION

const NATLAS_API_URL = process.env.NEXT_PUBLIC_NATLAS_API_URL || 'https://natlas-api.onrender.com';

// ✅ INCREASED TIMEOUT: 30s for Render cold starts (was 10s)
const FETCH_TIMEOUT = 30000; 

// ============================================================================
// TYPE INTERFACES
// ============================================================================

export interface NatlasAnalysisResponse {
  success: boolean;
  input: string;
  language: string;
  translation: string;
  cultural_context: string;
  medical_keywords: string[];
  severity: string;
  nigerian_context: string;
  recommended_specialties: string[];
  enhanced_notes: string;
  match_type: string;
  similarity_score: number;
  cached: boolean;
}

export interface NatlasQuickSymptomsResponse {
  success: boolean;
  symptoms: string[];
  language: string;
  cached: boolean;
  match_type: string;
}

// ============================================================================
// HELPER: Fetch with timeout and retry
// ============================================================================

/**
 * Fetch with AbortController timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

/**
 * Analyze patient notes using N-ATLAS API.
 * ✅ NOW WITH: Timeout handling, retry logic, better error messages
 */
export async function analyzePatientNotes(
  text: string,
  language?: string
): Promise<NatlasAnalysisResponse> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 N-ATLAS attempt ${attempt}/${maxRetries}...`);
      
      const response = await fetchWithTimeout(
        `${NATLAS_API_URL}/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language }),
        },
        FETCH_TIMEOUT
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`N-ATLAS API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ N-ATLAS success on attempt ${attempt}`);
      return data;

    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ N-ATLAS attempt ${attempt} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.message.includes('404') || error.message.includes('401')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  console.error('❌ N-ATLAS all retries failed');
  throw lastError || new Error('N-ATLAS analysis failed after retries');
}

/**
 * Quick symptom extraction for faster processing.
 */
export async function extractSymptoms(
  text: string,
  language?: string
): Promise<NatlasQuickSymptomsResponse> {
  try {
    const response = await fetchWithTimeout(
      `${NATLAS_API_URL}/quick-symptoms`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      },
      FETCH_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`N-ATLAS API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ N-ATLAS quick-symptoms error:', error);
    throw error;
  }
}

/**
 * Enhanced analysis specifically for doctor suggestion.
 */
export async function analyzeForDoctorSuggestion(
  text: string,
  language?: string
): Promise<NatlasAnalysisResponse> {
  return analyzePatientNotes(text, language); // Reuse with retry logic
}

/**
 * Check if N-ATLAS API is healthy.
 * ✅ Now with timeout
 */
export async function checkNatlasHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `${NATLAS_API_URL}/health`,
      { method: 'GET' },
      5000 // Short timeout for health check
    );
    
    const data = await response.json();
    return data.status === 'healthy' && data.cache_loaded;
  } catch (error: any) {
    console.error('❌ N-ATLAS health check failed:', error.message);
    return false;
  }
}