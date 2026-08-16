import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lineClient } from "@/lib/line";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  if (body.start === true) {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
    }

    if (!existing.startedAt) {
      try {
        await lineClient.pushMessage({
          to: existing.lineUserId,
          messages: [
            {
              type: "text",
              text: `老闆已收到您的訂單:「${existing.text}」,開始製作囉!`,
            },
          ],
        });
      } catch {
        // 通知失敗(例如客人封鎖帳號)不擋住店員操作,還是照樣標記開始製作
      }
    }

    const message = await prisma.message.update({
      where: { id },
      data: { startedAt: existing.startedAt ?? new Date() },
    });
    return NextResponse.json({ message });
  }

  if (typeof body.isDone === "boolean") {
    const message = await prisma.message.update({
      where: { id },
      data: { isDone: body.isDone },
    });
    return NextResponse.json({ message });
  }

  return NextResponse.json({ error: "無效的請求" }, { status: 400 });
}
