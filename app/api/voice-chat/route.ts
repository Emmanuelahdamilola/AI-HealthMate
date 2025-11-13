
import { database } from '@/config/database';
import { sessionChatTable, usersTable } from '@/config/userSchema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseUser } from '@/lib/firebase-auth';
import { openai } from '@/config/OpenAiModel';
import { rateLimiter } from '@/lib/rateLimiter';
import { analyzePatientNotes } from '@/lib/natlas-service';
import { v4 as uuidv4 } from 'uuid';
import type { InferInsertModel } from 'drizzle-orm';

type SessionChatInsert = InferInsertModel<typeof sessionChatTable>;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  language?: string;
  natlasData?: any;
}

const nowISO = () => new Date().toISOString();

// 🚀 FastAPI endpoint
const FASTAPI_URL = process.env.FASTAPI_URL || 'https://latina-autographic-minna.ngrok-free.dev';


async function processVoiceWithFastAPI(
  audioFile: Blob,
  doctorName: string,
  doctorSpecialty: string
) {
  try {
    console.log(' Transcribing audio with FastAPI...');
    const transcribeFormData = new FormData();
    transcribeFormData.append('audio', audioFile);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    const transcribeRes = await fetch(`${FASTAPI_URL}/transcribe`, {
      method: 'POST',
      body: transcribeFormData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!transcribeRes.ok) {
      throw new Error(`Transcription failed: ${transcribeRes.statusText}`);
    }

    const transcribeResult = await transcribeRes.json();
    console.log(' Transcription:', transcribeResult);

    if (!transcribeResult.success) {
      throw new Error(transcribeResult.error || 'Transcription failed');
    }

    return {
      success: true,
      userText: transcribeResult.text,
      detectedLanguage: transcribeResult.language || 'en',
    };
  } catch (error: any) {
    console.error(' FastAPI voice processing error:', error);
    return {
      success: false,
      error: error.message || 'Voice processing failed',
    };
  }
}


async function generateSpeechWithFastAPI(text: string, speaker: string = 'idera') {
  try {
    console.log(' Generating speech with FastAPI...');
    

    const words = text.split(/\s+/);
    let limitedText = text;
    if (words.length > 80) {
      limitedText = words.slice(0, 80).join(' ') + '...';
      console.log(` Text truncated from ${words.length} to 80 words for faster TTS`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); 

    const synthesizeRes = await fetch(`${FASTAPI_URL}/synthesize-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: limitedText,
        speaker,
        temperature: 0.1,
        repetition_penalty: 1.1,
        max_length: 1500, 
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!synthesizeRes.ok) {
      throw new Error(`Speech synthesis failed: ${synthesizeRes.statusText}`);
    }

    const synthesizeResult = await synthesizeRes.json();
    console.log(' Speech generated');

    if (!synthesizeResult.success) {
      throw new Error(synthesizeResult.error || 'Speech synthesis failed');
    }

    return {
      success: true,
      audioBase64: synthesizeResult.audio,
    };
  } catch (error: any) {
    console.error(' FastAPI speech generation error:', error);
    return {
      success: false,
      error: error.message || 'Speech generation failed',
    };
  }
}


async function analyzeWithNATLAS(userMessage: string, language: string, maxRetries: number = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(` N-ATLAS attempt ${attempt}/${maxRetries}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const result = await Promise.race([
        analyzePatientNotes(userMessage, language),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 15000ms')), 15000)
        ),
      ]);

      clearTimeout(timeoutId);
      
      if ((result as any)?.success) {
        console.log(` N-ATLAS success on attempt ${attempt}`);
        return result;
      }
    } catch (error: any) {
      console.warn(` N-ATLAS attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in 500ms...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.warn('⚠️ N-ATLAS failed after all retries, proceeding without enhancement');
  return null;
}


export async function POST(req: NextRequest) {
  console.log(' POST /api/voice-chat received');

  if (!rateLimiter(req)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    const isVoiceRequest = contentType.includes('multipart/form-data');

    let body: any = {};
    let voiceTranscription: any = null;

    if (isVoiceRequest) {
      console.log('🎤 Voice request detected');
      const formData = await req.formData();
      const audioFile = formData.get('audio') as File;
      const doctorName = formData.get('doctor_name') as string;
      const doctorSpecialty = formData.get('doctor_specialty') as string;

      if (!audioFile || !doctorName || !doctorSpecialty) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }


      voiceTranscription = await processVoiceWithFastAPI(audioFile, doctorName, doctorSpecialty);

      if (!voiceTranscription.success) {
        return NextResponse.json({
          success: false,
          error: voiceTranscription.error || 'Voice processing failed',
        }, { status: 500 });
      }

      body = {
        sessionId: formData.get('sessionId'),
        userMessage: voiceTranscription.userText,
        language: voiceTranscription.detectedLanguage,
        doctorProfile: {
          name: doctorName,
          specialty: doctorSpecialty,
        },
      };
    } else {
      body = await req.json();
      console.log(' Text request received:', body);
    }

    const {
      sessionId: incomingSessionId,
      note,
      notes,
      selectedDoctor,
      userMessage,
      doctorProfile,
      language: userLanguageInput,
    } = body;

    const userMessageFinal = userMessage || note || notes;
    const doctorProfileFinal = doctorProfile || selectedDoctor;

    if (!userMessageFinal || !doctorProfileFinal?.name || !doctorProfileFinal?.specialty) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input: missing user message or doctor profile',
      }, { status: 400 });
    }


    console.log(' Verifying Firebase token...');
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.log(' Firebase user verified:', firebaseUser.email);

    const dbUser = await database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, firebaseUser.email))
      .then((r) => r[0]);

    if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });


    let currentSession: any;
    let finalSessionId = incomingSessionId;
    const conversationLanguageTag = userLanguageInput || 'english';

    if (incomingSessionId) {
      currentSession = await database
        .select()
        .from(sessionChatTable)
        .where(and(eq(sessionChatTable.sessionId, incomingSessionId), eq(sessionChatTable.userId, dbUser.id)))
        .then((r) => r[0]);

      if (!currentSession) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    } else {
      finalSessionId = uuidv4();
      

      const newSession: SessionChatInsert = {
        sessionId: finalSessionId,
        note: userMessageFinal,
        conversation: [], 
        selectedDoctor: doctorProfileFinal,
        language: conversationLanguageTag,
        report: {},
        status: 'active',
        userId: dbUser.id,
        createdOn: new Date(),
      };
      await database.insert(sessionChatTable).values(newSession);
      currentSession = newSession;
    }


    const existingConversation: Message[] = Array.isArray(currentSession.conversation)
      ? currentSession.conversation
      : [];

    let natlasAnalysis: any = null;
    let enhancedMessage = userMessageFinal;
    let assistantResponse = '';

    const systemPrompt = `You are **${doctorProfileFinal.name}**, a **${doctorProfileFinal.specialty}** specialist.

CRITICAL GUIDELINES:
1. You are a medical professional conducting a standard consultation
2. Ask relevant follow-up questions to understand the patient's condition better
3. Provide clear, empathetic medical advice
4. Keep responses concise (max 80 words for voice)
5. Be culturally aware and sensitive
6. If symptoms are severe, recommend immediate medical attention
7. Never diagnose definitively - suggest possible conditions and recommend proper examination

Language: ${conversationLanguageTag}
Response style: Professional, empathetic, and concise`;

    if (isVoiceRequest) {
      
      console.log('⚡ Running N-ATLAS and LLM in parallel...');
      
      const [natlasResult, llmResult] = await Promise.allSettled([
        analyzeWithNATLAS(userMessageFinal, conversationLanguageTag),
        
        (async () => {
          const completion = await openai.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              ...existingConversation.map((msg) => ({ role: msg.role, content: msg.content })),
              { role: 'user', content: userMessageFinal },
            ],
            temperature: 0.7,
            max_tokens: 250, 
          });
          return completion.choices[0].message?.content?.trim() || 'No response generated.';
        })(),
      ]);

      // Process results
      if (natlasResult.status === 'fulfilled' && natlasResult.value) {
        natlasAnalysis = natlasResult.value;
        if ((natlasAnalysis as any)?.success) {
          enhancedMessage = (natlasAnalysis as any).enhanced_notes || userMessageFinal;
        }
      }

      if (llmResult.status === 'fulfilled') {
        assistantResponse = llmResult.value;
      } else {
        assistantResponse = 'AI service temporarily unavailable.';
      }
    } else {
      // Sequential for text requests
      natlasAnalysis = await analyzeWithNATLAS(userMessageFinal, conversationLanguageTag);
      
      if (natlasAnalysis?.success) {
        enhancedMessage = natlasAnalysis.enhanced_notes || userMessageFinal;
      }

      try {
        const completion = await openai.chat.completions.create({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            ...existingConversation.map((msg) => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: enhancedMessage },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });
        assistantResponse = completion.choices[0].message?.content?.trim() || 'No response generated.';
      } catch (err) {
        assistantResponse = 'AI service temporarily unavailable.';
      }
    }

    //  Create messages
    const userMsg: Message = {
      role: 'user',
      content: userMessageFinal,
      timestamp: nowISO(),
      language: conversationLanguageTag,
      natlasData: natlasAnalysis?.success
        ? {
            translation: natlasAnalysis.translation || '',
            keywords: natlasAnalysis.medical_keywords || [],
            severity: natlasAnalysis.severity || 'moderate',
            culturalContext: natlasAnalysis.cultural_context || '',
          }
        : null,
    };

    const assistantMsg: Message = {
      role: 'assistant',
      content: assistantResponse,
      timestamp: nowISO(),
    };

    const updatedConversation = [...existingConversation, userMsg, assistantMsg];
    await database
      .update(sessionChatTable)
      .set({ conversation: updatedConversation })
      .where(eq(sessionChatTable.sessionId, finalSessionId));

    // Generate speech for voice requests
    let audioBase64 = null;
    if (isVoiceRequest) {
      const speechResult = await generateSpeechWithFastAPI(assistantResponse, 'idera');
      if (speechResult.success) {
        audioBase64 = speechResult.audioBase64;
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: finalSessionId,
      data: {
        userText: userMessageFinal,
        doctorResponse: assistantResponse,
        language: conversationLanguageTag,
        natlasEnhanced: !!natlasAnalysis?.success,
        audioBase64,
        metadata: natlasAnalysis?.success
          ? {
              keywords: natlasAnalysis.medical_keywords || [],
              severity: natlasAnalysis.severity || 'moderate',
              matchType: natlasAnalysis.match_type || 'unknown',
              cached: natlasAnalysis.cached || false,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('❌ voice-chat POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// GET Handler
export async function GET(req: NextRequest) {
  if (!rateLimiter(req)) return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const getHistory = searchParams.get('history') === 'true';

    console.log(' Verifying Firebase token...');
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.log(' Firebase user verified:', firebaseUser.email);

    const dbUser = await database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, firebaseUser.email))
      .then((r) => r[0]);

    if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const clauses = [eq(sessionChatTable.userId, dbUser.id)];
    if (sessionId) clauses.push(eq(sessionChatTable.sessionId, sessionId));
    const sessions = await database
      .select()
      .from(sessionChatTable)
      .where(and(...clauses))
      .orderBy(getHistory ? desc(sessionChatTable.createdOn) : asc(sessionChatTable.createdOn));

    if (getHistory) return NextResponse.json({ success: true, data: sessions || [] });
    if (!sessions?.length) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: sessions[0] });
  } catch (error: any) {
    console.error(' voice-chat GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}



