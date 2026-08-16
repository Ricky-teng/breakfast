"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";

type OrderItemOption = { id: string; optionNameSnapshot: string };
type OrderItem = {
  id: string;
  itemNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
  selectedOptions: OrderItemOption[];
};
type Order = {
  id: string;
  customerName: string;
  totalPrice: number;
  pickupTime: string | null;
  receivedAt: string;
  startedAt: string | null;
  isDone: boolean;
  items: OrderItem[];
};

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "載入失敗");
    }
    return res.json();
  });

function EggMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <circle cx="20" cy="20" r="19" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
      <ellipse cx="20" cy="20" rx="9" ry="8" fill="#F59E0B" />
      <ellipse cx="17" cy="17" rx="2.5" ry="2" fill="#FDE68A" opacity="0.8" />
    </svg>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusInfo(order: Order) {
  if (order.isDone) {
    return { label: "已完成,可以來店取餐囉", color: "bg-green-100 text-green-700" };
  }
  if (order.startedAt) {
    return { label: "製作中", color: "bg-blue-100 text-blue-700" };
  }
  return { label: "已送出,等待店家開始製作", color: "bg-amber-100 text-amber-800" };
}

export default function OrderStatusPage() {
  const params = useParams<{ id: string }>();
  const { data, error, isLoading } = useSWR<{ order: Order }>(
    `/api/orders/${params.id}`,
    fetcher,
    { refreshInterval: 5000 },
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/40 to-white">
      <div className="border-b-2 border-amber-200 bg-white/90">
        <div className="mx-auto flex max-w-xl items-center gap-2.5 px-4 py-3.5 sm:px-6">
          <EggMark />
          <div>
            <h1 className="text-lg font-semibold leading-tight text-amber-950">
              美上美早餐店
            </h1>
            <p className="text-xs text-amber-700/60">訂單查詢</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        {isLoading && <p className="text-amber-700/50">載入中…</p>}
        {error && (
          <p className="text-red-600">{(error as Error).message}</p>
        )}

        {data?.order && (
          <>
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-center font-medium ${
                statusInfo(data.order).color
              }`}
            >
              {statusInfo(data.order).label}
            </div>

            <div className="mb-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm text-zinc-400">
                {data.order.customerName} · 送出時間 {formatTime(data.order.receivedAt)}
                {data.order.pickupTime && (
                  <> · 取餐時間 {formatTime(data.order.pickupTime)}</>
                )}
              </p>
              <ul className="flex flex-col gap-2.5">
                {data.order.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-zinc-800">
                        {item.itemNameSnapshot} × {item.quantity}
                      </p>
                      {item.selectedOptions.length > 0 && (
                        <p className="text-xs text-zinc-400">
                          {item.selectedOptions
                            .map((o) => o.optionNameSnapshot)
                            .join("、")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-zinc-600">
                      ${item.lineTotal}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 font-semibold text-amber-950">
                <span>總計</span>
                <span>${data.order.totalPrice}</span>
              </div>
            </div>

            <p className="text-center text-sm text-zinc-400">
              請到店付現金取餐
            </p>
          </>
        )}
      </div>
    </div>
  );
}
