import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: optionGroupId } = await params;
  const { name, extraPrice } = await request.json();

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "選項名稱不可空白" }, { status: 400 });
  }
  const price = typeof extraPrice === "number" ? extraPrice : 0;
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "加價金額不正確" }, { status: 400 });
  }

  const option = await prisma.option.create({
    data: { optionGroupId, name: name.trim(), extraPrice: price },
  });

  return NextResponse.json({ option });
}
