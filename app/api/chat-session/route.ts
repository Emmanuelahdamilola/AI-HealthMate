import { database } from "@/config/database";
import { SessionChatTable } from "@/config/userSchema";
import { eq, desc, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";

// Helper: verify Firebase token
async function getFirebaseUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.split("Bearer ")[1];
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// POST -> create new session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notes, selectedDoctor } = body;

    if (!notes || !selectedDoctor) {
      return NextResponse.json(
        { error: "Notes and selected doctor are required." },
        { status: 400 }
      );
    }

    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser || !firebaseUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = uuidv4();

    await database.insert(SessionChatTable).values({
      sessionId,
      note: notes,
      conversation: [],
      selectedDoctor: JSON.stringify(selectedDoctor),
      report: {},
      status: "active",
      createdBy: firebaseUser.email,
      createdOn: new Date().toISOString(),
    });

    console.log("Sending selected doctor:", selectedDoctor);

    return NextResponse.json({ sessionId }, { status: 201 });
  } catch (error: any) {
    console.error("POST /chat-session error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET -> get sessions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser || !firebaseUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionId === "all") {
      const result = await database
        .select()
        .from(SessionChatTable)
        .where(eq(SessionChatTable.createdBy, firebaseUser.email))
        .orderBy(desc(SessionChatTable.id));

      return NextResponse.json(result);
    } else {
      const result = await database
        .select()
        .from(SessionChatTable)
        .where(
          and(
            // @ts-ignore
            eq(SessionChatTable.sessionId, sessionId),
            eq(SessionChatTable.createdBy, firebaseUser.email)
          )
        );

      if (!result || result.length === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json(result[0]);
    }
  } catch (error: any) {
    console.error("GET /chat-session error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
