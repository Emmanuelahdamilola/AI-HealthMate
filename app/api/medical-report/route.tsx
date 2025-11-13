
import { database } from "@/config/database";
import { sessionChatTable, usersTable } from '@/config/userSchema';
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/firebase-auth";
import { openai } from "@/config/OpenAiModel";
import { rateLimiter } from "@/lib/rateLimiter";

// --- REPORT STRUCTURE AND PROMPT ---

const REPORT_PROMPT = `
You are a medical report assistant. Generate a concise and professional report based on the user's conversation with the AI medical assistant.

Use the following fields:

1. sessionId: a unique session identifier
2. agent: the medical assistant’s name and specialty (e.g. "Dr. John Smith, Specialty: Cardiology")
3. user: name of the patient (or use "Anonymous" if not provided)
4. timestamp: current date and time in ISO format
5. mainComplaint: one-sentence summary of the user's main health concern
6. symptoms: list of symptoms mentioned by the user (use N-ATLAS keywords if provided)
7. summary: 3–4 sentence summary of the conversation and medical advice
8. duration: how long the user has experienced the symptoms (infer from conversation)
9. severity: one of ["mild", "moderate", "severe"] (use N-ATLAS severity if available)
10. medicationsMentioned: list of medications discussed or prescribed (if any)
11. recommendations: list of AI recommendations (e.g., "get rest", "consult a doctor", etc.)

Return your response **only** as a valid JSON object using this format:

{
"sessionId": "string",
"agent": "string",
"user": "string",
"timestamp": "string",
"mainComplaint": "string",
"symptoms": ["string"],
"summary": "string",
"duration": "string",
"severity": "string",
"medicationsMentioned": ["string"],
"recommendations": ["string"]
}

Only include valid JSON. Do not include explanations or extra text.

Base your answer entirely on the doctor's profile and the conversation between the user and assistant.
`;

// --- INTERFACES ---

interface ReportType {
    sessionId: string;
    agent: string;
    user: string;
    timestamp: string;
    mainComplaint: string;
    symptoms: string[];
    summary: string;
    duration: string;
    severity: string;
    medicationsMentioned: string[];
    recommendations: string[];
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  natlasData?: {
    keywords?: string[];
    severity?: string;
  };
}


// --- VALIDATION AND HELPERS ---

function validateReport(data: any): data is ReportType {
    // Basic structural validation
    return typeof data?.sessionId === 'string' &&
        typeof data?.agent === 'string' &&
        typeof data?.user === 'string' &&
        typeof data?.timestamp === 'string' &&
        typeof data?.mainComplaint === 'string' &&
        Array.isArray(data?.symptoms) &&
        typeof data?.summary === 'string' &&
        typeof data?.duration === 'string' &&
        typeof data?.severity === 'string' &&
        Array.isArray(data?.medicationsMentioned) &&
        Array.isArray(data?.recommendations);
}

/**
 * Trims the conversation history to avoid prompt overflow and extracts N-ATLAS metadata.
 */
function getSummaryData(messages: Message[], sessionParams: any, dbUserDisplayName?: string) {
    const MAX_MESSAGES = 10; 
    
    // Trim the conversation to the last 10 turns (critical for context window management)
    const conversationHistory = messages.slice(-MAX_MESSAGES);
    
    // Extract the latest N-ATLAS metadata from the last user message
    const latestUserMessage = conversationHistory.find(msg => msg.role === 'user') || conversationHistory.slice(-1)[0];
    const natlasData = latestUserMessage?.natlasData || {};
    
    // Format the conversation for the LLM
    const formattedHistory = conversationHistory.map(msg => 
        `${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n');

    return {
        // Agent and User details
        agent: `${sessionParams?.name || 'Medical AI'}, Specialty: ${sessionParams?.specialty || 'General Practice'}`,
        userName: dbUserDisplayName || 'Anonymous',
        
        // Structured N-ATLAS Metadata
        natlasSeverity: natlasData.severity || 'moderate',
        natlasKeywords: natlasData.keywords || [],

        // Context for LLM
        history: formattedHistory,
    };
}


// --- API ROUTE ---
export async function POST(req: NextRequest) {
    if (!rateLimiter(req)) return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });

    try {
        const { sessionId, sessionParams, messages } = await req.json();
        
        if (!sessionId || !Array.isArray(messages) || messages.length === 0)
            return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });

        const user = await getFirebaseUser(req);
        if (!user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        
        const dbUser = await database 
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, user.email))
            .then(res => res[0]);


        //  Prepare and Trim Data ---
                const summaryData = getSummaryData(messages as Message[], sessionParams, dbUser?.name);

        const promptUserMessage = `
**SESSION CONTEXT:**
Agent: ${summaryData.agent}
User Name: ${summaryData.userName}
Detected Symptoms (N-ATLAS): ${summaryData.natlasKeywords.join(', ') || 'N/A'}
Severity: ${summaryData.natlasSeverity}

**CONVERSATION HISTORY (Trimmed):**
${summaryData.history}

**INSTRUCTIONS:** Analyze the entire history to fill all required JSON fields accurately, focusing on the diagnosis, symptoms, duration, and recommendations. Ensure the final JSON is valid and complete.
        `;

        //  Call LLM for Structured Report ---
        const completion = await openai.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
                { role: 'system', content: REPORT_PROMPT },
                { role: 'user', content: promptUserMessage },
            ],
            // Use JSON mode if available on your platform for reliable output
            response_format: { type: "json_object" } 
        });

        // --- Step 3: Parse and Validate Output ---
        const aiRaw = completion.choices[0].message?.content?.trim() || '';
        const jsonStart = aiRaw.indexOf('{');
        const jsonEnd = aiRaw.lastIndexOf('}') + 1;
        
        if (jsonStart === -1 || jsonEnd === -1) {
             console.error("AI returned malformed JSON:", aiRaw);
             throw new Error('Invalid AI JSON output');
        }

        const aiParsed = JSON.parse(aiRaw.slice(jsonStart, jsonEnd));
        
        // --- Step 4: Finalize and Save ---
        
        // Finalize the report, ensuring essential keys are present and types are correct
        const finalReport: ReportType = {
            ...aiParsed,
            sessionId: sessionId,
            user: summaryData.userName,
            timestamp: new Date().toISOString(),
            agent: summaryData.agent,
            // Ensure array fields are arrays, even if the LLM outputted strings
            symptoms: Array.isArray(aiParsed.symptoms) ? aiParsed.symptoms : [aiParsed.symptoms].filter(Boolean),
            medicationsMentioned: Array.isArray(aiParsed.medicationsMentioned) ? aiParsed.medicationsMentioned : [aiParsed.medicationsMentioned].filter(Boolean),
            recommendations: Array.isArray(aiParsed.recommendations) ? aiParsed.recommendations : [aiParsed.recommendations].filter(Boolean),
            
            // Override severity if N-ATLAS provided a clear assessment
            severity: summaryData.natlasSeverity || aiParsed.severity,
        };

        if (!validateReport(finalReport)) return NextResponse.json({ success: false, error: 'Invalid report structure' }, { status: 400 });
        
        await database.update(sessionChatTable)
            .set({ report: finalReport, conversation: messages }) 
            // @ts-ignore
            .where(and(eq(sessionChatTable.sessionId, sessionId), eq(sessionChatTable.userId, user.id)));

        return NextResponse.json({ success: true, data: finalReport });
    } catch (error: any) {
        console.error('❌ medical-report POST error:', error.message);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

