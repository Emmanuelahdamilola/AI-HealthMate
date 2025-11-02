// app/api/voice-chat/route.ts
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

export async function POST(req: NextRequest) {
  if (!rateLimiter(req)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    console.log("📥 /api/voice-chat received:", body);

    const {
      sessionId: incomingSessionId,
      note,
      notes, // ✅ FIX: Accept 'notes' as well
      selectedDoctor,
      userMessage,
      doctorProfile,
      language: userLanguageInput,
      vapiMode
    } = body;

    // ✅ FIX: Support 'notes', 'note', or 'userMessage'
    const userMessageFinal = userMessage || note || notes;
    const doctorProfileFinal = doctorProfile || selectedDoctor;

    // ✅ IMPROVED: Better error message
    if (!userMessageFinal || typeof userMessageFinal !== 'string') {
      console.error('❌ Missing user message:', { userMessage, note, notes });
      return NextResponse.json({
        success: false,
        error: 'Invalid input: Missing user message (expected "userMessage", "note", or "notes")',
      }, { status: 400 });
    }

    if (!doctorProfileFinal?.name || !doctorProfileFinal?.specialty) {
      console.error('❌ Missing doctor profile:', doctorProfileFinal);
      return NextResponse.json({
        success: false,
        error: 'Invalid input: Missing or malformed doctorProfile',
      }, { status: 400 });
    }

    // --- AUTHENTICATION ---
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, firebaseUser.email))
      .then(res => res[0]);

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // --- SESSION HANDLING ---
    let currentSession: SessionChatInsert | { conversation: Message[] };
    let finalSessionId = incomingSessionId;
    const conversationLanguageTag = userLanguageInput || 'english';

    if (incomingSessionId) {
      currentSession = await database
        .select()
        .from(sessionChatTable)
        .where(and(
          eq(sessionChatTable.sessionId, incomingSessionId),
          eq(sessionChatTable.userId, dbUser.id)
        ))
        .then(res => res[0]);

      if (!currentSession) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }
    } else {
      finalSessionId = uuidv4();
      currentSession = { conversation: [] };

      const initialMessage: Message = {
        role: 'system',
        content: `Consultation started with Dr. **${doctorProfileFinal.name}** in ${conversationLanguageTag}.`,
        timestamp: nowISO(),
      };

      const newSession: SessionChatInsert = {
        sessionId: finalSessionId,
        note: userMessageFinal,
        conversation: [initialMessage],
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

    // --- N-ATLAS ANALYSIS (with graceful fallback) ---
    let natlasAnalysis: any = null;
    let enhancedMessage = userMessageFinal;

    try {
      console.log('🔍 Attempting N-ATLAS analysis...');
      natlasAnalysis = await analyzePatientNotes(userMessageFinal, conversationLanguageTag);

      if (natlasAnalysis?.success) {
        enhancedMessage = natlasAnalysis.enhanced_notes || userMessageFinal;
        console.log(`✅ N-ATLAS enhanced message (${conversationLanguageTag})`);
      } else {
        console.warn('⚠️ N-ATLAS returned unsuccessful response');
      }
    } catch (err: any) {
      console.warn('⚠️ N-ATLAS analysis failed, using original message:', err.message);
      // Continue without N-ATLAS enhancement
    }

    // --- VAPI MODE ONLY ---
    if (vapiMode) {
      console.log('🎤 VAPI MODE: Returning N-ATLAS analysis only');

      const existingConversation: Message[] = Array.isArray(currentSession.conversation)
        ? currentSession.conversation
        : [];

      const userMsg: Message = {
        role: 'user',
        content: userMessageFinal,
        timestamp: nowISO(),
        language: conversationLanguageTag,
        natlasData: natlasAnalysis ? {
          translation: natlasAnalysis.translation || '',
          keywords: natlasAnalysis.medical_keywords || [],
          severity: natlasAnalysis.severity || 'moderate',
          culturalContext: natlasAnalysis.cultural_context || ''
        } : null
      };

      const updatedConversation = [...existingConversation, userMsg];

      await database
        .update(sessionChatTable)
        .set({ conversation: updatedConversation })
        .where(eq(sessionChatTable.sessionId, finalSessionId));

      return NextResponse.json({
        success: true,
        sessionId: finalSessionId,
        data: {
          language: conversationLanguageTag,
          natlasEnhanced: !!natlasAnalysis?.success,
          metadata: natlasAnalysis?.success ? {
            keywords: natlasAnalysis.medical_keywords || [],
            severity: natlasAnalysis.severity || 'moderate',
            matchType: natlasAnalysis.match_type || 'unknown',
            cached: natlasAnalysis.cached || false,
            enhancedNotes: enhancedMessage
          } : null
        }
      });
    }

    // --- REGULAR MODE: LLM ---
    const existingConversation: Message[] = Array.isArray(currentSession.conversation)
      ? currentSession.conversation
      : [];

    const userMsg: Message = {
      role: 'user',
      content: userMessageFinal,
      timestamp: nowISO(),
      language: conversationLanguageTag,
      natlasData: natlasAnalysis?.success ? {
        translation: natlasAnalysis.translation || '',
        keywords: natlasAnalysis.medical_keywords || [],
        severity: natlasAnalysis.severity || 'moderate',
        culturalContext: natlasAnalysis.cultural_context || ''
      } : null
    };

    const systemPrompt = `You are **${doctorProfileFinal.name}**, a **${doctorProfileFinal.specialty}** specialist in Nigeria.

Your role:
- Provide empathetic, culturally-sensitive medical guidance
- Ask relevant follow-up questions to understand symptoms better
- Recommend appropriate specialists when necessary
- Be aware of Nigerian healthcare context and common health challenges
- Communicate clearly in ${conversationLanguageTag}

${natlasAnalysis?.success ? `
Patient Context:
- Detected symptoms: ${natlasAnalysis.medical_keywords?.join(', ') || 'N/A'}
- Severity: ${natlasAnalysis.severity || 'moderate'}
- Cultural context: ${natlasAnalysis.cultural_context || 'N/A'}
` : ''}

Guidelines:
- Keep responses concise (2-3 paragraphs max)
- Use simple, clear language
- Show empathy and professionalism
- If symptoms are severe, recommend immediate medical attention
- Always end with a relevant follow-up question`;

    let assistantResponse = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          ...existingConversation.map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: enhancedMessage }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      assistantResponse = completion.choices[0].message?.content?.trim() || 'I apologize, but I couldn\'t generate a response.';
    } catch (err: any) {
      console.error('⚠️ LLM failed:', err.message);
      assistantResponse = 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
    }

    const assistantMsg: Message = {
      role: 'assistant',
      content: assistantResponse,
      timestamp: nowISO()
    };

    const updatedConversation = [...existingConversation, userMsg, assistantMsg];

    await database
      .update(sessionChatTable)
      .set({ conversation: updatedConversation })
      .where(eq(sessionChatTable.sessionId, finalSessionId));

    return NextResponse.json({
      success: true,
      sessionId: finalSessionId,
      data: {
        message: assistantResponse,
        language: conversationLanguageTag,
        natlasEnhanced: !!natlasAnalysis?.success,
        metadata: natlasAnalysis?.success ? {
          keywords: natlasAnalysis.medical_keywords || [],
          severity: natlasAnalysis.severity || 'moderate',
          matchType: natlasAnalysis.match_type || 'unknown',
          cached: natlasAnalysis.cached || false
        } : null
      }
    });

  } catch (error: any) {
    console.error('❌ voice-chat POST error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!rateLimiter(req)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const getHistory = searchParams.get('history') === 'true';

    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, firebaseUser.email))
      .then(res => res[0]);

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!getHistory && !sessionId) {
      return NextResponse.json({
        success: false,
        error: 'sessionId required for single session retrieval.'
      }, { status: 400 });
    }

    const clauses = [eq(sessionChatTable.userId, dbUser.id)];
    if (sessionId) clauses.push(eq(sessionChatTable.sessionId, sessionId));
    const whereCondition = and(...clauses);

    const sessions = await database
      .select()
      .from(sessionChatTable)
      .where(whereCondition)
      .orderBy(getHistory ? desc(sessionChatTable.createdOn) : asc(sessionChatTable.createdOn));

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No sessions found for this query.'
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: getHistory ? sessions : sessions[0] });

  } catch (error: any) {
    console.error('❌ voice-chat GET error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}