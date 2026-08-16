import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const data: { name?: string; price?: number; isAvailable?: boolean } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "品項名稱不可空白" }, { status: 400 });
    }
    data.name = body.name.trim();
  }

  if (body.price !== undefined) {
    if (
      typeof body.price !== "number" ||
      !Number.isFinite(body.price) ||
      body.price < 0
    ) {
      return NextResponse.json({ error: "價格不正確" }, { status: 400 });
    }
    data.price = body.price;
  }

  if (body.isAvailable !== undefined) {
    if (typeof body.isAvailable !== "boolean") {
      return NextResponse.json(
        { error: "isAvailable 必須是布林值" },
        { status: 400 },
      );
    }
    data.isAvailable = body.isAvailable;
  }

  const item = await prisma.menuItem.update({ where: { id }, data });
  return NextResponse.json({ item });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
