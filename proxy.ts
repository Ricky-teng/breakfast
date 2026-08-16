import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, expectedToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const authorized = !!cookie && cookie === (await expectedToken());

  if (authorized) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/board",
    "/api/messages/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
