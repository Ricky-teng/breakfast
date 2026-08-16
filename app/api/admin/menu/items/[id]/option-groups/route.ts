import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: menuItemId } = await params;
  const { name, required, multiple } = await request.json();

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "選項群組名稱不可空白" }, { status: 400 });
  }

  const group = await prisma.optionGroup.create({
    data: {
      menuItemId,
      name: name.trim(),
      required: typeof required === "boolean" ? required : false,
      multiple: typeof multiple === "boolean" ? multiple : false,
    },
    include: { options: true },
  });

  return NextResponse.json({ optionGroup: group });
}
