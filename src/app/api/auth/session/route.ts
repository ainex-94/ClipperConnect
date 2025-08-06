
// src/app/api/auth/session/route.ts
import { NextResponse } from "next/server";

// This API route is no longer used for session management since firebase-admin
// has been removed. The client-side Firebase SDK will now handle auth state persistence.
// These handlers return success to prevent errors from old client-side calls.

export async function POST(request: Request) {
  return NextResponse.json({ success: true, message: "Session management is now client-side." });
}

export async function DELETE() {
  return NextResponse.json({ success: true, message: "Session management is now client-side." });
}
