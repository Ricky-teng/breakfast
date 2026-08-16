import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { categoryId, name, price } = await request.json();

  if (typeof categoryId !== "string" || !categoryId) {
    return NextResponse.json({ error: "缺少分類" }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "品項名稱不可空白" }, { status: 400 });
  }
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "價格不正確" }, { status: 400 });
  }

  const maxSort = await prisma.menuItem.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });

  const item = await prisma.menuItem.create({
    data: {
      categoryId,
      name: name.trim(),
      price,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ item });
}
