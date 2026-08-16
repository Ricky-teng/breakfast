import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedMenu } from "@/lib/seed-menu";

// 一次性/緊急用的「重新匯入預設菜單」端點。只要資料庫裡已經有真實訂單就直接
// 拒絕執行,避免不小心把上線後的訂單資料清空——這支 API 本質上是全部重來,
// 不是給日常編輯用的,日常改價/上下架請用 /admin/menu 頁面。
export async function POST() {
  const orderCount = await prisma.order.count();
  if (orderCount > 0) {
    return NextResponse.json(
      { error: "已經有真實訂單,為安全起見拒絕重新匯入預設菜單" },
      { status: 400 },
    );
  }

  const itemCount = await seedMenu(prisma);
  return NextResponse.json({ ok: true, itemCount });
}
