// app/api/user-stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { database } from "@/config/database";
import { sessionChatTable, usersTable } from "@/config/userSchema";
// Drizzle imports: Added 'sql' for the count aggregate function
import { eq, desc, sql } from "drizzle-orm"; 
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
            .select({ id: usersTable.id }) // Select only the ID for efficiency
            .from(usersTable)
            .where(eq(usersTable.email, firebaseUser.email))
            .then((res) => res[0]);

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userId = dbUser.id;

        // 3️⃣ Consolidated Total Count (Total Consultations & History Count)
        // Use Drizzle's count aggregate for maximum efficiency
        const totalConsultationsResult = await database
            .select({ count: sql<number>`count(*)` })
            .from(sessionChatTable)
            .where(eq(sessionChatTable.userId, userId));
            
        // CRITICAL FIX: The count function returns the count as a string in some SQL dialects,
        // so we ensure it's a number.
        const totalConsultations = parseInt(totalConsultationsResult[0]?.count as unknown as string) || 0;
        const patientHistoryCount = totalConsultations; // These two metrics are the same

        // 4️⃣ Last Consultation
        // Select only the fields needed by the frontend dashboard (sessionId and date)
        const lastConsultationResult = await database
            .select({
                sessionId: sessionChatTable.sessionId,
                createdOn: sessionChatTable.createdOn,
            })
            .from(sessionChatTable)
            .where(eq(sessionChatTable.userId, userId))
            .orderBy(desc(sessionChatTable.createdOn))
            .limit(1);

        // Trimming the result to either the object or null
        const lastConsultation = lastConsultationResult[0] || null;

        // 5️⃣ Return stats
        return NextResponse.json({
            totalConsultations,
            lastConsultation,
            patientHistoryCount, // Same value, but kept for matching frontend prop
        });

    } catch (err: any) {
        console.error("❌ user-stats GET error:", err.message || err);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
};