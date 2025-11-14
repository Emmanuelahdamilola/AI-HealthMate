// app/api/voice-chat/greeting/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseUser } from '@/lib/firebase-auth';
import { rateLimiter } from '@/lib/rateLimiter';

const FASTAPI_URL = process.env.FASTAPI_URL || 'https://latina-autographic-minna.ngrok-free.dev';

export async function POST(req: NextRequest) {
  console.log('POST /api/voice-chat/greeting received');

  if (!rateLimiter(req)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    // Authenticate
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { text, sessionId, doctorName, doctorSpecialty } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Missing greeting text' }, { status: 400 });
    }

    console.log(`🎤 Generating greeting: "${text.substring(0, 50)}..."`);

    // Generate greeting audio
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const synthesizeRes = await fetch(`${FASTAPI_URL}/synthesize-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        speaker: 'idera',
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
    console.log('✅ Greeting audio generated');

    if (!synthesizeResult.success) {
      throw new Error(synthesizeResult.error || 'Speech synthesis failed');
    }

    return NextResponse.json({
      success: true,
      audioBase64: synthesizeResult.audio,
      text,
      sessionId,
    });

  } catch (error: any) {
    console.error('❌ Greeting generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}