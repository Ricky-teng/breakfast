import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { isDone } = await request.json();

  if (typeof isDone !== "boolean") {
    return NextResponse.json(
      { error: "isDone 必須是布林值" },
      { status: 400 },
    );
  }

  const message = await prisma.message.update({
    where: { id },
    data: { isDone },
  });

  return NextResponse.json({ message });
}
