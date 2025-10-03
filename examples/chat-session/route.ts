import { database } from '@/config/database';
import { SessionChatTable } from '@/config/userSchema';
import { currentUser } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notes, selectedDoctor } = body;

    if (!notes || !selectedDoctor) {
      return NextResponse.json(
        { error: 'Notes and selected doctor are required.' },
        { status: 400 }
      );
    }

    const user = await currentUser();

    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = uuidv4();
    // @ts-ignore
    await database.insert(SessionChatTable).values({
      sessionId,
      note: notes,
      conversation: [],
      selectedDoctor: JSON.stringify(selectedDoctor),
      report: {},
      status: 'active',
      createdBy: user.primaryEmailAddress.emailAddress,
      createdOn: new Date().toISOString(),
    });
    console.log("Sending selected doctor:", selectedDoctor);

    return NextResponse.json({ sessionId }, { status: 201 });

  } catch (error: any) {
    console.error('POST /chat-session error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    const user = await currentUser();

    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionId === 'all') {
      const result = await database
        .select()
        .from(SessionChatTable)
        // @ts-ignore
        .where(eq(SessionChatTable.createdBy, user.primaryEmailAddress.emailAddress))
        // @ts-ignore
        .orderBy(desc(SessionChatTable.id));
      console.log("sessionId param:", sessionId);
      console.log("current user:", user?.primaryEmailAddress?.emailAddress);

      return NextResponse.json(result);
    } else {
      const result = await database
        .select()
        .from(SessionChatTable)
        // @ts-ignore
        .where(eq(SessionChatTable.sessionId, sessionId));

      if (!result || result.length === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json(result);
    }


  } catch (error: any) {
    console.error("GET /chat-session error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}


