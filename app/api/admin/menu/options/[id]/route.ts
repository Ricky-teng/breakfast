import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const data: { name?: string; extraPrice?: number } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "選項名稱不可空白" }, { status: 400 });
    }
    data.name = body.name.trim();
  }
  if (body.extraPrice !== undefined) {
    if (
      typeof body.extraPrice !== "number" ||
      !Number.isFinite(body.extraPrice) ||
      body.extraPrice < 0
    ) {
      return NextResponse.json({ error: "加價金額不正確" }, { status: 400 });
    }
    data.extraPrice = body.extraPrice;
  }

  const option = await prisma.option.update({ where: { id }, data });
  return NextResponse.json({ option });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.option.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
