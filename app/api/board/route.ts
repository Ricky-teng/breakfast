import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function summarizeOrder(order: {
  items: {
    itemNameSnapshot: string;
    quantity: number;
    selectedOptions: { optionNameSnapshot: string }[];
  }[];
}) {
  return order.items
    .map((item) => {
      const options = item.selectedOptions
        .map((o) => o.optionNameSnapshot)
        .join("、");
      const suffix = options ? `(${options})` : "";
      return `${item.itemNameSnapshot}${suffix} x${item.quantity}`;
    })
    .join("、");
}

export async function GET() {
  const [messages, orders] = await Promise.all([
    prisma.message.findMany({
      orderBy: { receivedAt: "desc" },
      take: 100,
    }),
    prisma.order.findMany({
      orderBy: { receivedAt: "desc" },
      take: 100,
      include: { items: { include: { selectedOptions: true } } },
    }),
  ]);

  const entries = [
    ...messages.map((m) => ({
      id: m.id,
      source: "line" as const,
      displayName: m.displayName,
      summary: m.text,
      receivedAt: m.receivedAt,
      startedAt: m.startedAt,
      isDone: m.isDone,
      totalPrice: null as number | null,
    })),
    ...orders.map((o) => ({
      id: o.id,
      source: "web" as const,
      displayName: o.customerName,
      summary: summarizeOrder(o),
      receivedAt: o.receivedAt,
      startedAt: o.startedAt,
      isDone: o.isDone,
      totalPrice: o.totalPrice,
    })),
  ];

  return NextResponse.json({ entries });
}
