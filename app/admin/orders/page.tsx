"use client";

import { useState } from "react";
import useSWR from "swr";

type OrderItemOption = { id: string; optionNameSnapshot: string };
type OrderItem = {
  id: string;
  itemNameSnapshot: string;
  quantity: number;
  lineTotal: number;
  selectedOptions: OrderItemOption[];
};
type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  receivedAt: string;
  startedAt: string | null;
  isDone: boolean;
  items: OrderItem[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shiftDate(dateStr: string, days: number) {
  // 純粹的日曆日期加減,不要經過時區轉換——用 +08:00 建構出來的瞬間,
  // 其 UTC 日期其實是前一天,直接用 setUTCDate 移動會差一天。
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function statusLabel(order: Order) {
  if (order.isDone) return { text: "已完成", className: "bg-zinc-100 text-zinc-500" };
  if (order.startedAt) return { text: "製作中", className: "bg-blue-100 text-blue-700" };
  return { text: "待處理", className: "bg-amber-100 text-amber-800" };
}

export default function AdminOrdersPage() {
  const [date, setDate] = useState("");
  const { data, isLoading } = useSWR<{
    date: string;
    orders: Order[];
    summary: { count: number; revenue: number };
  }>(`/api/admin/orders${date ? `?date=${date}` : ""}`, fetcher);

  const shownDate = date || data?.date || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/40 to-white">
      <div className="sticky top-0 z-10 border-b-2 border-amber-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5 sm:px-6">
          <h1 className="text-lg font-semibold text-amber-950">訂單紀錄</h1>
          <div className="flex items-center gap-4">
            <a href="/admin/menu" className="text-sm text-amber-700 hover:underline">
              菜單管理
            </a>
            <a href="/board" className="text-sm text-amber-700 hover:underline">
              回看板
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center justify-center gap-3">
          <button
            onClick={() => setDate(shiftDate(shownDate, -1))}
            disabled={!shownDate}
            className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm disabled:opacity-40"
          >
            ◀ 前一天
          </button>
          <input
            type="date"
            value={shownDate}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <button
            onClick={() => setDate(shiftDate(shownDate, 1))}
            disabled={!shownDate}
            className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm disabled:opacity-40"
          >
            後一天 ▶
          </button>
        </div>

        {isLoading && <p className="text-center text-amber-700/50">載入中…</p>}

        {data && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-semibold text-amber-950">
                  {data.summary.count}
                </p>
                <p className="text-sm text-zinc-400">筆訂單</p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-semibold text-amber-950">
                  ${data.summary.revenue}
                </p>
                <p className="text-sm text-zinc-400">營收</p>
              </div>
            </div>

            {data.orders.length === 0 ? (
              <p className="text-center text-zinc-400">這天沒有網路訂單</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.orders.map((order) => {
                  const status = statusLabel(order);
                  return (
                    <li
                      key={order.id}
                      className="rounded-xl border border-zinc-100 bg-white p-3 shadow-sm"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">
                            {order.customerName}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {order.customerPhone}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                          >
                            {status.text}
                          </span>
                        </div>
                        <span className="shrink-0 text-sm text-zinc-400">
                          {formatTime(order.receivedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600">
                        {order.items
                          .map((item) => {
                            const options = item.selectedOptions
                              .map((o) => o.optionNameSnapshot)
                              .join("、");
                            return `${item.itemNameSnapshot}${
                              options ? `(${options})` : ""
                            } x${item.quantity}`;
                          })
                          .join("、")}
                      </p>
                      <p className="mt-1 text-right font-medium text-amber-700">
                        ${order.totalPrice}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
