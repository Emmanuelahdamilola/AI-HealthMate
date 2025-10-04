// import { database } from '@/config/database';
// import { SessionChatTable } from '@/config/userSchema';
// import { eq, desc, and } from 'drizzle-orm';
// import { NextRequest, NextResponse } from 'next/server';
// import { getFirebaseUser } from '@/lib/firebase-auth';
// import { v4 as uuidv4 } from 'uuid';
// import { rateLimiter } from '@/lib/rateLimiter';

// // POST -> create session
// export async function POST(req: NextRequest) {
//   if (!rateLimiter(req)) return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });

//   try {
//     const { notes, selectedDoctor } = await req.json();

//     if (!notes || !selectedDoctor) return NextResponse.json({ success: false, error: 'Notes and doctor required' }, { status: 400 });
//     if (notes.length > 1000) return NextResponse.json({ success: false, error: 'Notes too long' }, { status: 400 });

//     const user = await getFirebaseUser(req);
//     if (!user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

//     const sessionId = uuidv4();

//     await database.insert(SessionChatTable).values({
//       sessionId,
//       note: notes,
//       conversation: [],
//       selectedDoctor,
//       report: {},
//       status: 'active',
//       createdBy: user.email,
//       createdOn: new Date().toISOString(),
//     });

//     return NextResponse.json({ success: true, sessionId }, { status: 201 });
//   } catch (error: any) {
//     console.error('❌ chat-session POST error:', error.message);
//     return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
//   }
// }

// // GET -> fetch sessions
// export async function GET(req: NextRequest) {
//   if (!rateLimiter(req)) return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });

//   try {
//     const { searchParams } = new URL(req.url);
//     const sessionId = searchParams.get('sessionId');

//     const user = await getFirebaseUser(req);
//     if (!user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

//     if (sessionId === 'all') {
//       const result = await database
//         .select()
//         .from(SessionChatTable)
//         .where(eq(SessionChatTable.createdBy, user.email))
//         .orderBy(desc(SessionChatTable.id));

//       return NextResponse.json({ success: true, data: result });
//     }

//     const result = await database
//       .select()
//       .from(SessionChatTable)
//       // @ts-ignore
//       .where(and(eq(SessionChatTable.sessionId, sessionId), eq(SessionChatTable.createdBy, user.email)));

//     if (!result || result.length === 0) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });

//     return NextResponse.json({ success: true, data: result[0] });
//   } catch (error: any) {
//     console.error('❌ chat-session GET error:', error.message);
//     return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
//   }
// }

// // DELETE -> remove session
// export async function DELETE(req: NextRequest) {
//   if (!rateLimiter(req)) return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });

//   try {
//     const { searchParams } = new URL(req.url);
//     const sessionId = searchParams.get('sessionId');

//     if (!sessionId) return NextResponse.json({ success: false, error: 'SessionId required' }, { status: 400 });

//     const user = await getFirebaseUser(req);
//     if (!user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

//     const deleted = await database
//       .delete(SessionChatTable)
//       .where(and(eq(SessionChatTable.sessionId, sessionId), eq(SessionChatTable.createdBy, user.email)));

//     if (!deleted) return NextResponse.json({ success: false, error: 'Session not found or already deleted' }, { status: 404 });

//     return NextResponse.json({ success: true, message: 'Session deleted successfully' });
//   } catch (error: any) {
//     console.error('❌ chat-session DELETE error:', error.message);
//     return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
//   }
// }
// app/api/chat-session/route.ts


import { database } from '@/config/database';
import { sessionChatTable, usersTable } from '@/config/userSchema';
import { eq, desc, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseUser } from '@/lib/firebase-auth';
import { v4 as uuidv4 } from 'uuid';
import { rateLimiter } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  if (!rateLimiter(req)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { notes, selectedDoctor } = await req.json();

    if (!notes || !selectedDoctor)
      return NextResponse.json({ success: false, error: 'Notes and doctor required' }, { status: 400 });
    if (notes.length > 5000)
      return NextResponse.json({ success: false, error: 'Notes too long' }, { status: 400 });

    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // ✅ Find user id in DB
    const dbUser = await database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, firebaseUser.email))
      .then((res) => res[0]);

    if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const sessionId = uuidv4();

    await database.insert(sessionChatTable).values({
      sessionId,
      note: notes,
      conversation: [],
      selectedDoctor,
      report: {},
      status: 'active',
      userId: dbUser.id, // 🔹 use userId, not createdBy
      createdOn: new Date(),
    });


    return NextResponse.json({ success: true, sessionId }, { status: 201 });
  } catch (error: any) {
    console.error('❌ chat-session POST error:', error.message);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!rateLimiter(req)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const dbUser = await database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, firebaseUser.email))
      .then((res) => res[0]);

    if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    if (sessionId === 'all') {
      const result = await database
        .select()
        .from(sessionChatTable)
        .where(eq(sessionChatTable.userId, dbUser.id)) // 🔹 userId
        .orderBy(desc(sessionChatTable.id));

      return NextResponse.json({ success: true, data: result });
    }

    const result = await database
      .select()
      .from(sessionChatTable)
      .where(and(eq(sessionChatTable.sessionId, sessionId), eq(sessionChatTable.userId, dbUser.id)));

    if (!result || result.length === 0) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error('❌ chat-session GET error:', error.message);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!rateLimiter(req)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) return NextResponse.json({ success: false, error: 'SessionId required' }, { status: 400 });

    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const dbUser = await database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, firebaseUser.email))
      .then((res) => res[0]);

    if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const deleted = await database
      .delete(sessionChatTable)
      .where(and(eq(sessionChatTable.sessionId, sessionId), eq(sessionChatTable.userId, dbUser.id)));

    if (!deleted) return NextResponse.json({ success: false, error: 'Session not found or already deleted' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (error: any) {
    console.error('❌ chat-session DELETE error:', error.message);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
