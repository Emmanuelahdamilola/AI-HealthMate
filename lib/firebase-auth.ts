import { NextRequest } from "next/server";
import admin from "./firebase-admin";

export async function getFirebaseUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken; // contains uid, email, etc.
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    return null;
  }
}
