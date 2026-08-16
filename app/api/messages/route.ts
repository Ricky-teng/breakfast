import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const messages = await prisma.message.findMany({
    orderBy: { receivedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ messages });
}
