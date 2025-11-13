
import { NextRequest, NextResponse } from "next/server";
import { database } from "@/config/database";
import { sessionChatTable, usersTable } from "@/config/userSchema";
import { eq, desc, sql } from "drizzle-orm";
import { getFirebaseUser } from "@/lib/firebase-auth";
import { rateLimiter } from "@/lib/rateLimiter";

export async function GET(req: NextRequest) {
  if (!rateLimiter(req)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Too many requests' 
    }, { status: 429 });
  }

  try {
    // Authenticate user
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) {
      return NextResponse.json({ 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // Get user from database
    const dbUser = await database
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, firebaseUser.email))
      .then((res) => res[0]);

    if (!dbUser) {
      return NextResponse.json({ 
        error: "User not found" 
      }, { status: 404 });
    }

    const userId = dbUser.id;

    // Get total consultations count
    const totalConsultationsResult = await database
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(sessionChatTable)
      .where(eq(sessionChatTable.userId, userId));
    
    const totalConsultations = totalConsultationsResult[0]?.count || 0;

    //Get last consultation
    const lastConsultationResult = await database
      .select({
        sessionId: sessionChatTable.sessionId,
        createdOn: sessionChatTable.createdOn,
        selectedDoctor: sessionChatTable.selectedDoctor,
        note: sessionChatTable.note,
      })
      .from(sessionChatTable)
      .where(eq(sessionChatTable.userId, userId))
      .orderBy(desc(sessionChatTable.createdOn))
      .limit(1);

    const lastConsultation = lastConsultationResult[0] || null;

    // Get completed consultations (with reports)
    const completedResult = await database
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(sessionChatTable)
      .where(eq(sessionChatTable.userId, userId));

    // Return stats matching the Stats interface (gracefully handle new users with 0 consultations)
    return NextResponse.json({
      totalConsultations: totalConsultations,
      lastConsultation: lastConsultation,
      patientHistoryCount: totalConsultations,
    });

  } catch (err: any) {
    console.error("❌ user-stats GET error:", err.message || err);
    return NextResponse.json({ 
      error: "Failed to fetch stats",
      details: err.message 
    }, { status: 500 });
  }
}