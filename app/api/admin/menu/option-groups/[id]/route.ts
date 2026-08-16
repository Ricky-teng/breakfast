import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const data: { name?: string; required?: boolean; multiple?: boolean } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "選項群組名稱不可空白" },
        { status: 400 },
      );
    }
    data.name = body.name.trim();
  }
  if (typeof body.required === "boolean") data.required = body.required;
  if (typeof body.multiple === "boolean") data.multiple = body.multiple;

  const group = await prisma.optionGroup.update({ where: { id }, data });
  return NextResponse.json({ optionGroup: group });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.optionGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
