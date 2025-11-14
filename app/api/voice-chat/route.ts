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

const FASTAPI_URL = process.env.FASTAPI_URL || 'https://latina-autographic-minna.ngrok-free.dev';

// ✅ IMPROVED: Language-specific system prompts with consultation flow
function getSystemPrompt(doctorName: string, specialty: string, language: string, conversationStage: 'greeting' | 'ongoing'): string {
  const languageInstructions: Record<string, any> = {
    yoruba: {
      greeting: `You are **${doctorName}**, a **${specialty}** specialist starting a NEW medical consultation in YORUBA ONLY.

CONSULTATION START PROTOCOL:
1. Greet the patient warmly
2. Introduce yourself as ${doctorName}, ${specialty} specialist
3. Ask for their name
4. Ask for their age
5. Ask what brings them in today (their main concern/symptom)

RESPONSE RULES:
✅ Speak ONLY in natural Yoruba (no English)
✅ Be warm and welcoming
✅ Keep it SHORT (max 50 words)
✅ Ask questions ONE at a time or group them naturally

❌ NO English words or translations
❌ NO jumping ahead - follow the protocol step by step

Example greeting:
"Ẹ káàbọ̀! Orúkọ mi ni ${doctorName}, mo jẹ́ ${specialty} specialist. Kí ni orúkọ rẹ? Ọdún mélòó ni ẹ jẹ́? Kí ni ó mú yin wá sí ilé ìwòsàn òní?"

Be a caring Nigerian doctor speaking naturally in Yoruba.`,
      
      ongoing: `You are **${doctorName}**, a **${specialty}** specialist conducting an ONGOING medical consultation in YORUBA ONLY.

RESPONSE RULES:
✅ Speak ONLY in natural Yoruba (no English)
✅ Be warm, empathetic, and professional
✅ Ask 1-2 relevant follow-up questions based on their symptoms
✅ Keep responses SHORT (max 60 words)
✅ Use simple, conversational language

❌ NO English words or translations
❌ NO code-switching
❌ NO meta-commentary like "(Follow-up question...)"
❌ NO formal/clinical jargon unless necessary

Example response pattern:
"Mo gbo pe [symptom]. Ṣe [specific question]? Ati pe [another question]?"

Be a caring Nigerian doctor speaking naturally in Yoruba.`
    },

    igbo: {
      greeting: `You are **${doctorName}**, a **${specialty}** specialist starting a NEW medical consultation in IGBO ONLY.

CONSULTATION START PROTOCOL:
1. Greet the patient warmly
2. Introduce yourself as ${doctorName}, ${specialty} specialist
3. Ask for their name
4. Ask for their age
5. Ask what brings them in today (their main concern/symptom)

RESPONSE RULES:
✅ Speak ONLY in natural Igbo (no English)
✅ Be warm and welcoming
✅ Keep it SHORT (max 50 words)
✅ Ask questions ONE at a time or group them naturally

❌ NO English words or translations
❌ NO jumping ahead - follow the protocol

Example greeting:
"Nnọọ! Aha m bụ ${doctorName}, a bụ m ${specialty} specialist. Gịnị bụ aha gị? Afọ ole ka ị dị? Gịnị wetara gị ebe a taa?"

Be a caring Nigerian doctor speaking naturally in Igbo.`,
      
      ongoing: `You are **${doctorName}**, a **${specialty}** specialist conducting an ONGOING medical consultation in IGBO ONLY.

RESPONSE RULES:
✅ Speak ONLY in natural Igbo (no English)
✅ Be warm, empathetic, and professional
✅ Ask 1-2 relevant follow-up questions based on their symptoms
✅ Keep responses SHORT (max 60 words)
✅ Use simple, conversational language

❌ NO English words or translations
❌ NO code-switching
❌ NO meta-commentary

Example response pattern:
"Anụrụ m na [symptom]. Ọ bụ [specific question]? Na [another question]?"

Be a caring Nigerian doctor speaking naturally in Igbo.`
    },

    hausa: {
      greeting: `You are **${doctorName}**, a **${specialty}** specialist starting a NEW medical consultation in HAUSA ONLY.

CONSULTATION START PROTOCOL:
1. Greet the patient warmly
2. Introduce yourself as ${doctorName}, ${specialty} specialist
3. Ask for their name
4. Ask for their age
5. Ask what brings them in today (their main concern/symptom)

RESPONSE RULES:
✅ Speak ONLY in natural Hausa (no English)
✅ Be warm and welcoming
✅ Keep it SHORT (max 50 words)
✅ Ask questions ONE at a time or group them naturally

❌ NO English words or translations
❌ NO jumping ahead

Example greeting:
"Sannu! Sunana ${doctorName}, ni ${specialty} specialist. Mene ne sunanka? Shekara nawa kake? Me ya kawo ka yau?"

Be a caring Nigerian doctor speaking naturally in Hausa.`,
      
      ongoing: `You are **${doctorName}**, a **${specialty}** specialist conducting an ONGOING medical consultation in HAUSA ONLY.

RESPONSE RULES:
✅ Speak ONLY in natural Hausa (no English)
✅ Be warm, empathetic, and professional
✅ Ask 1-2 relevant follow-up questions based on their symptoms
✅ Keep responses SHORT (max 60 words)
✅ Use simple, conversational language

❌ NO English words or translations
❌ NO code-switching
❌ NO meta-commentary

Example response pattern:
"Na ji [symptom]. Shin [specific question]? Kuma [another question]?"

Be a caring Nigerian doctor speaking naturally in Hausa.`
    },

    english: {
      greeting: `You are **${doctorName}**, a **${specialty}** specialist starting a NEW medical consultation.

CONSULTATION START PROTOCOL:
1. Greet the patient warmly
2. Introduce yourself as ${doctorName}, ${specialty} specialist
3. Ask for their name
4. Ask for their age
5. Ask what brings them in today (their main concern/symptom)

RESPONSE RULES:
✅ Be warm and welcoming
✅ Keep it SHORT (max 50 words)
✅ Ask questions ONE at a time or group them naturally
✅ Be culturally sensitive to Nigerian context

❌ NO overly formal medical jargon
❌ NO jumping ahead - follow the protocol

Example greeting:
"Good day! I'm ${doctorName}, a ${specialty} specialist. What's your name? How old are you? What brings you in today?"

Be a caring Nigerian doctor speaking naturally.`,
      
      ongoing: `You are **${doctorName}**, a **${specialty}** specialist conducting an ONGOING medical consultation.

RESPONSE RULES:
✅ Be warm, empathetic, and professional
✅ Ask 1-2 relevant follow-up questions based on their symptoms
✅ Keep responses SHORT (max 60 words for voice)
✅ Use simple, conversational language
✅ Be culturally sensitive to Nigerian context

❌ NO overly formal medical jargon
❌ NO long explanations (save for diagnosis)
❌ NO meta-commentary

Example response pattern:
"I understand you're experiencing [symptom]. Can you tell me [specific question]? Also, [another question]?"

Be a caring Nigerian doctor speaking naturally.`
    }
  };

  const prompts = languageInstructions[language.toLowerCase()] || languageInstructions.english;
  return prompts[conversationStage];
}

// ✅ IMPROVED: Clean response post-processing
function cleanResponse(response: string, language: string): string {
  let cleaned = response.trim();
  
  // Remove common meta-commentary patterns
  cleaned = cleaned.replace(/\(Follow-up question[^)]*\)/gi, '');
  cleaned = cleaned.replace(/\(This will[^)]*\)/gi, '');
  cleaned = cleaned.replace(/Translation:/gi, '');
  cleaned = cleaned.replace(/\(.*?to understand.*?\)/gi, '');
  cleaned = cleaned.replace(/\(.*?guide further.*?\)/gi, '');
  
  // Remove excessive newlines and spaces
  cleaned = cleaned.replace(/\n\n+/g, ' ').trim();
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // If English is mixed in non-English responses, try to extract only the target language
  if (language !== 'english' && cleaned.includes('Translation:')) {
    const parts = cleaned.split(/Translation:|English:/i);
    if (parts.length > 0) {
      cleaned = parts[0].trim();
    }
  }
  
  return cleaned;
}

async function processVoiceWithFastAPI(
  audioFile: Blob,
  doctorName: string,
  doctorSpecialty: string,
  sessionLanguage: string = 'english'
) {
  try {
    console.log('🎤 Transcribing audio with FastAPI...');
    const transcribeFormData = new FormData();
    transcribeFormData.append('audio', audioFile);
    
    const langMap: Record<string, string> = {
      'english': 'en',
      'yoruba': 'yo',
      'igbo': 'ig',
      'hausa': 'ha'
    };
    
    const whisperLang = langMap[sessionLanguage.toLowerCase()] || 'en';
    transcribeFormData.append('language', whisperLang);
    
    console.log(`🌍 Transcribing in: ${sessionLanguage} (${whisperLang})`);

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
    console.log('✅ Transcription:', transcribeResult);

    if (!transcribeResult.success) {
      throw new Error(transcribeResult.error || 'Transcription failed');
    }

    return {
      success: true,
      userText: transcribeResult.text,
      detectedLanguage: transcribeResult.language || whisperLang,
    };
  } catch (error: any) {
    console.error('❌ FastAPI voice processing error:', error);
    return {
      success: false,
      error: error.message || 'Voice processing failed',
    };
  }
}

async function generateSpeechWithFastAPI(text: string, speaker: string = 'idera') {
  try {
    console.log('🔊 Generating speech with FastAPI...');
    
    const words = text.split(/\s+/);
    let limitedText = text;
    if (words.length > 80) {
      limitedText = words.slice(0, 80).join(' ') + '...';
      console.log(`✂️ Text truncated from ${words.length} to 80 words for faster TTS`);
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
    console.log('✅ Speech generated');

    if (!synthesizeResult.success) {
      throw new Error(synthesizeResult.error || 'Speech synthesis failed');
    }

    return {
      success: true,
      audioBase64: synthesizeResult.audio,
    };
  } catch (error: any) {
    console.error('❌ FastAPI speech generation error:', error);
    return {
      success: false,
      error: error.message || 'Speech generation failed',
    };
  }
}

async function analyzeWithNATLAS(userMessage: string, language: string, maxRetries: number = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 N-ATLAS attempt ${attempt}/${maxRetries}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const result = await Promise.race([
        analyzePatientNotes(userMessage, language),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 15000ms')), 15000)
        ),
      ]);

      clearTimeout(timeoutId);
      
      if ((result as any)?.success) {
        console.log(`✅ N-ATLAS success on attempt ${attempt}`);
        return result;
      }
    } catch (error: any) {
      console.warn(`⚠️ N-ATLAS attempt ${attempt} failed: ${error.message}`);
      
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
  console.log('📥 POST /api/voice-chat received');

  if (!rateLimiter(req)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    const isVoiceRequest = contentType.includes('multipart/form-data');

    let body: any = {};
    let voiceTranscription: any = null;
    let sessionLanguage = 'english';

    if (isVoiceRequest) {
      console.log('🎤 Voice request detected');
      const formData = await req.formData();
      const audioFile = formData.get('audio') as File;
      const doctorName = formData.get('doctor_name') as string;
      const doctorSpecialty = formData.get('doctor_specialty') as string;
      const sessionId = formData.get('sessionId') as string;

      if (!audioFile || !doctorName || !doctorSpecialty) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      // Get session language if session exists
      if (sessionId) {
        try {
          const firebaseUser = await getFirebaseUser(req);
          if (firebaseUser?.email) {
            const dbUser = await database
              .select()
              .from(usersTable)
              .where(eq(usersTable.email, firebaseUser.email))
              .then((r) => r[0]);

            if (dbUser) {
              const session = await database
                .select()
                .from(sessionChatTable)
                .where(and(
                  eq(sessionChatTable.sessionId, sessionId),
                  eq(sessionChatTable.userId, dbUser.id)
                ))
                .then((r) => r[0]);

              if (session?.language) {
                sessionLanguage = session.language;
                console.log(`🌍 Using session language: ${sessionLanguage}`);
              }
            }
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch session language, using default');
        }
      }

      voiceTranscription = await processVoiceWithFastAPI(
        audioFile, 
        doctorName, 
        doctorSpecialty,
        sessionLanguage
      );

      if (!voiceTranscription.success) {
        return NextResponse.json({
          success: false,
          error: voiceTranscription.error || 'Voice processing failed',
        }, { status: 500 });
      }

      body = {
        sessionId: sessionId,
        userMessage: voiceTranscription.userText,
        language: sessionLanguage,
        doctorProfile: {
          name: doctorName,
          specialty: doctorSpecialty,
        },
      };
    } else {
      body = await req.json();
      console.log('💬 Text request received:', body);
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

    console.log('🔐 Verifying Firebase token...');
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.log('✅ Firebase user verified:', firebaseUser.email);

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

    // ✅ DETERMINE CONSULTATION STAGE
    const isNewConsultation = existingConversation.length === 0;
    const conversationStage = isNewConsultation ? 'greeting' : 'ongoing';
    
    console.log(`🏥 Consultation stage: ${conversationStage} (messages: ${existingConversation.length})`);

    let natlasAnalysis: any = null;
    let enhancedMessage = userMessageFinal;
    let assistantResponse = '';

    // ✅ IMPROVED: Use language-specific system prompt with stage
    const systemPrompt = getSystemPrompt(
      doctorProfileFinal.name,
      doctorProfileFinal.specialty,
      conversationLanguageTag,
      conversationStage
    );

    // ✅ FOR NEW CONSULTATIONS: Add initial context to help AI understand it's the first interaction
    let messagesForAI = existingConversation.map((msg) => ({ 
      role: msg.role, 
      content: msg.content 
    }));
    
    if (isNewConsultation) {
      // For first message, make it clear this is the start
      messagesForAI = [
        { 
          role: 'user', 
          content: `[NEW PATIENT CONSULTATION - First interaction. Follow the greeting protocol exactly.]

Patient has just arrived. Start the consultation properly by greeting them and asking for their name, age, and what brings them in.`
        }
      ];
    } else {
      messagesForAI.push({ role: 'user', content: userMessageFinal });
    }

    if (isVoiceRequest) {
      console.log('⚡ Running N-ATLAS and LLM in parallel...');
      
      const [natlasResult, llmResult] = await Promise.allSettled([
        // Only run N-ATLAS for ongoing consultations (not greetings)
        isNewConsultation ? Promise.resolve(null) : analyzeWithNATLAS(userMessageFinal, conversationLanguageTag),
        
        (async () => {
          const completion = await openai.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messagesForAI,
            ],
            temperature: 0.8,
            max_tokens: isNewConsultation ? 100 : 150, // Shorter for greetings
            top_p: 0.9,
          });
          return completion.choices[0].message?.content?.trim() || 'No response generated.';
        })(),
      ]);

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
      if (!isNewConsultation) {
        natlasAnalysis = await analyzeWithNATLAS(userMessageFinal, conversationLanguageTag);
        
        if (natlasAnalysis?.success) {
          enhancedMessage = natlasAnalysis.enhanced_notes || userMessageFinal;
        }
      }

      try {
        const completion = await openai.chat.completions.create({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messagesForAI,
          ],
          temperature: 0.8,
          max_tokens: isNewConsultation ? 150 : 300,
          top_p: 0.9,
        });
        assistantResponse = completion.choices[0].message?.content?.trim() || 'No response generated.';
      } catch (err) {
        assistantResponse = 'AI service temporarily unavailable.';
      }
    }

    // ✅ IMPROVED: Clean the response
    assistantResponse = cleanResponse(assistantResponse, conversationLanguageTag);

    // ✅ FOR NEW CONSULTATIONS: Store the actual user message (not the protocol prompt)
    const userMsg: Message = {
      role: 'user',
      content: isNewConsultation ? 'Session started' : userMessageFinal,
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
        userText: isNewConsultation ? '' : userMessageFinal, // Empty for greetings
        doctorResponse: assistantResponse,
        language: conversationLanguageTag,
        natlasEnhanced: !!natlasAnalysis?.success,
        audioBase64,
        isNewConsultation, // ✅ Flag to indicate it's a greeting
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

export async function GET(req: NextRequest) {
  if (!rateLimiter(req)) return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const getHistory = searchParams.get('history') === 'true';

    console.log('🔐 Verifying Firebase token...');
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.log('✅ Firebase user verified:', firebaseUser.email);

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
    console.error('❌ voice-chat GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}