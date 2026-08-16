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

// 用 updateMany + where 條件當作「原子搶旗標」:只有真的把 null 改成非 null
// 的那個請求才算搶到、才發通知。就算店員快速連點兩下同一顆按鈕,兩個請求
// 同時抵達,DB 也只會讓其中一個成功配對到條件,不會發出兩則通知。
async function claimOnce(id: string, field: "startedAt" | "doneNotifiedAt") {
  const result = await prisma.message.updateMany({
    where: { id, [field]: null },
    data: { [field]: new Date() },
  });
  return result.count === 1;
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

    if (await claimOnce(id, "startedAt")) {
      await notifyCustomer(
        existing.lineUserId,
        `老闆已收到您的訂單:「${existing.text}」,開始製作囉!`,
      );
    }

    const message = await prisma.message.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ message });
  }

  if (typeof body.isDone === "boolean") {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
    }

    const message = await prisma.message.update({
      where: { id },
      data: { isDone: body.isDone },
    });

    // doneNotifiedAt 是永久旗標,跟 isDone 分開:就算之後「標記為未完成」
    // 再重新標記完成,同一筆訂單的完成通知一輩子只會發一次。
    if (body.isDone && (await claimOnce(id, "doneNotifiedAt"))) {
      await notifyCustomer(
        existing.lineUserId,
        `您的餐點已經做好囉:「${existing.text}」,可以來店取餐囉!😊`,
      );
    }

    return NextResponse.json({ message });
  }

  return NextResponse.json({ error: "無效的請求" }, { status: 400 });
}
