// app/api/user-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { database } from "@/config/database";
import { sessionChatTable, usersTable } from "@/config/userSchema";
import { eq, desc } from "drizzle-orm";
import { getFirebaseUser } from "@/lib/firebase-auth";

export const GET = async (req: NextRequest) => {
  try {
    // 1️⃣ Authenticate user
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Get user from DB
    const dbUser = await database
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, firebaseUser.email))
      .then((res) => res[0]);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = dbUser.id;

    // 3️⃣ Total AI Consultations
    const totalConsultationsResult = await database
      .select({ count: sessionChatTable.id })
      .from(sessionChatTable)
      .where(eq(sessionChatTable.userId, userId));

    const totalConsultations = totalConsultationsResult[0]?.count || 0;

    // 4️⃣ Last Consultation
    const lastConsultationResult = await database
      .select()
      .from(sessionChatTable)
      .where(eq(sessionChatTable.userId, userId))
      .orderBy(desc(sessionChatTable.createdOn))
      .limit(1);

    const lastConsultation = lastConsultationResult[0] || null;

    // 5️⃣ Patient History Count (if you want, could be same as totalConsultations or customized)
    const patientHistoryCountResult = await database
      .select({ count: sessionChatTable.id })
      .from(sessionChatTable)
      .where(eq(sessionChatTable.userId, userId));

    const patientHistoryCount = patientHistoryCountResult[0]?.count || 0;

    // 6️⃣ Return stats
    return NextResponse.json({
      totalConsultations,
      lastConsultation,
      patientHistoryCount,
    });
  } catch (err: any) {
    console.error("❌ user-stats GET error:", err.message || err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
};
