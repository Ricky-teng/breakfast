import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "分類名稱不可空白" }, { status: 400 });
  }

  const maxSort = await prisma.menuCategory.aggregate({
    _max: { sortOrder: true },
  });

  const category = await prisma.menuCategory.create({
    data: { name: name.trim(), sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
  });
  return NextResponse.json({ category });
}
