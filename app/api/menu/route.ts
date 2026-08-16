import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.menuCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        include: {
          optionGroups: {
            orderBy: { sortOrder: "asc" },
            include: { options: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });

  // 分類底下如果沒有任何上架品項就不用顯示這個分類
  const nonEmptyCategories = categories.filter((c) => c.items.length > 0);
  return NextResponse.json({ categories: nonEmptyCategories });
}
