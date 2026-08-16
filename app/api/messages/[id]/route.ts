import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lineClient } from "@/lib/line";

async function notifyCustomer(lineUserId: string, text: string) {
  try {
    await lineClient.pushMessage({
      to: lineUserId,
      messages: [{ type: "text", text }],
    });
  } catch {
    // 通知失敗(例如客人封鎖帳號)不擋住店員操作
  }
}

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
      await notifyCustomer(
        existing.lineUserId,
        `老闆已收到您的訂單:「${existing.text}」,開始製作囉!`,
      );
    }

    const message = await prisma.message.update({
      where: { id },
      data: { startedAt: existing.startedAt ?? new Date() },
    });
    return NextResponse.json({ message });
  }

  if (typeof body.isDone === "boolean") {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
    }

    if (body.isDone && !existing.isDone) {
      await notifyCustomer(
        existing.lineUserId,
        `您的餐點已經做好囉:「${existing.text}」,可以來店取餐囉!😊`,
      );
    }

    const message = await prisma.message.update({
      where: { id },
      data: { isDone: body.isDone },
    });
    return NextResponse.json({ message });
  }

  return NextResponse.json({ error: "無效的請求" }, { status: 400 });
}
