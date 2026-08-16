import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 網路訂單目前沒有綁定 LINE 帳號,沒有管道可以推播通知客人,所以這裡單純
// 更新狀態——客人自己在 /order/[id] 頁面看進度。跟 /api/messages/[id] 不同,
// 不需要 claimOnce 防重複通知,因為沒有外部副作用可以重複觸發。
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  if (body.start === true) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
    }
    const order = await prisma.order.update({
      where: { id },
      data: { startedAt: existing.startedAt ?? new Date() },
    });
    return NextResponse.json({ order });
  }

  if (typeof body.isDone === "boolean") {
    const order = await prisma.order.update({
      where: { id },
      data: { isDone: body.isDone },
    });
    return NextResponse.json({ order });
  }

  return NextResponse.json({ error: "無效的請求" }, { status: 400 });
}
