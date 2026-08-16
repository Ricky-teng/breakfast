import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RequestedItem = {
  menuItemId: string;
  quantity: number;
  selectedOptionIds: string[];
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerName, customerPhone, pickupTime, items } = body as {
    customerName?: unknown;
    customerPhone?: unknown;
    pickupTime?: unknown;
    items?: unknown;
  };

  if (typeof customerName !== "string" || !customerName.trim()) {
    return NextResponse.json({ error: "請填寫姓名" }, { status: 400 });
  }
  if (typeof customerPhone !== "string" || !customerPhone.trim()) {
    return NextResponse.json({ error: "請填寫電話" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "購物車是空的" }, { status: 400 });
  }

  const requestedItems: RequestedItem[] = [];
  for (const raw of items as unknown[]) {
    const item = raw as Partial<RequestedItem>;
    if (
      typeof item.menuItemId !== "string" ||
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      !Array.isArray(item.selectedOptionIds) ||
      !item.selectedOptionIds.every((id) => typeof id === "string")
    ) {
      return NextResponse.json({ error: "訂單品項格式錯誤" }, { status: 400 });
    }
    requestedItems.push({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      selectedOptionIds: item.selectedOptionIds,
    });
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: requestedItems.map((i) => i.menuItemId) } },
    include: { optionGroups: { include: { options: true } } },
  });
  const menuItemById = new Map(menuItems.map((m) => [m.id, m]));

  type ValidatedLine = {
    menuItemId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    selectedOptions: { id: string; name: string; extraPrice: number }[];
  };
  const validatedLines: ValidatedLine[] = [];

  for (const requested of requestedItems) {
    const menuItem = menuItemById.get(requested.menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      return NextResponse.json(
        { error: "有品項已售完或不存在,請重新整理菜單" },
        { status: 400 },
      );
    }

    const allOptions = menuItem.optionGroups.flatMap((g) => g.options);
    const selectedOptions = allOptions.filter((o) =>
      requested.selectedOptionIds.includes(o.id),
    );
    if (selectedOptions.length !== requested.selectedOptionIds.length) {
      return NextResponse.json(
        { error: "選擇的客製化選項不正確" },
        { status: 400 },
      );
    }

    for (const group of menuItem.optionGroups) {
      const selectedInGroup = group.options.filter((o) =>
        requested.selectedOptionIds.includes(o.id),
      );
      if (group.required && selectedInGroup.length === 0) {
        return NextResponse.json(
          { error: `「${menuItem.name}」的「${group.name}」是必選項目` },
          { status: 400 },
        );
      }
      if (!group.multiple && selectedInGroup.length > 1) {
        return NextResponse.json(
          { error: `「${menuItem.name}」的「${group.name}」只能選一個` },
          { status: 400 },
        );
      }
    }

    const unitPrice =
      menuItem.price + selectedOptions.reduce((sum, o) => sum + o.extraPrice, 0);

    validatedLines.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      unitPrice,
      quantity: requested.quantity,
      lineTotal: unitPrice * requested.quantity,
      selectedOptions: selectedOptions.map((o) => ({
        id: o.id,
        name: o.name,
        extraPrice: o.extraPrice,
      })),
    });
  }

  const totalPrice = validatedLines.reduce((sum, l) => sum + l.lineTotal, 0);

  const order = await prisma.order.create({
    data: {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      pickupTime:
        typeof pickupTime === "string" && pickupTime
          ? new Date(pickupTime)
          : null,
      totalPrice,
      items: {
        create: validatedLines.map((line) => ({
          menuItemId: line.menuItemId,
          itemNameSnapshot: line.name,
          unitPriceSnapshot: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
          selectedOptions: {
            create: line.selectedOptions.map((o) => ({
              optionId: o.id,
              optionNameSnapshot: o.name,
              extraPriceSnapshot: o.extraPrice,
            })),
          },
        })),
      },
    },
  });

  return NextResponse.json({ orderId: order.id });
}
