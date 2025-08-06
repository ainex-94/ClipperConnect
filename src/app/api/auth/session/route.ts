// src/app/api/auth/session/route.ts
import { createSessionCookie, clearSessionCookie } from "@/lib/firebase/auth-actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { idToken } = await request.json();
  try {
    await createSessionCookie(idToken);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create session cookie:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear session cookie:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
