import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function taiwanToday() {
  const shifted = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? taiwanToday();

  // 用 +08:00 明確指定台灣時區的一天邊界,不依賴伺服器本身的時區設定。
  const start = new Date(`${date}T00:00:00+08:00`);
  const end = new Date(`${date}T23:59:59.999+08:00`);

  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "日期格式不正確" }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: { receivedAt: { gte: start, lte: end } },
    orderBy: { receivedAt: "desc" },
    include: { items: { include: { selectedOptions: true } } },
  });

  const revenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  return NextResponse.json({
    date,
    orders,
    summary: { count: orders.length, revenue },
  });
}
