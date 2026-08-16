import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { selectedOptions: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "找不到這筆訂單" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
