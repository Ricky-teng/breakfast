import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, expectedToken, isValidPin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { pin } = await request.json();

  if (typeof pin !== "string" || !isValidPin(pin)) {
    return NextResponse.json({ error: "PIN 錯誤" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, await expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
