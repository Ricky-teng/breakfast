"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

type Option = { id: string; name: string; extraPrice: number };
type OptionGroup = {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  options: Option[];
};
type MenuItem = {
  id: string;
  name: string;
  price: number;
  optionGroups: OptionGroup[];
};
type MenuCategory = { id: string; name: string; items: MenuItem[] };

type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  selectedOptions: Option[];
  quantity: number;
};

const CART_STORAGE_KEY = "breakfast-cart";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

function lineKey(menuItemId: string, optionIds: string[]) {
  return `${menuItemId}:${[...optionIds].sort().join(",")}`;
}

function unitPrice(line: CartLine) {
  return (
    line.basePrice +
    line.selectedOptions.reduce((sum, o) => sum + o.extraPrice, 0)
  );
}

function EggMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <circle cx="20" cy="20" r="19" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
      <ellipse cx="20" cy="20" rx="9" ry="8" fill="#F59E0B" />
      <ellipse cx="17" cy="17" rx="2.5" ry="2" fill="#FDE68A" opacity="0.8" />
    </svg>
  );
}

export default function MenuPage() {
  const router = useRouter();
  const { data, isLoading } = useSWR<{ categories: MenuCategory[] }>(
    "/api/menu",
    fetcher,
  );
  const categories = data?.categories ?? [];

  const [cart, setCart] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [view, setView] = useState<"browse" | "checkout">("browse");
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupChoice, setPickupChoice] = useState<"asap" | "scheduled">(
    "asap",
  );
  const [pickupTimeInput, setPickupTimeInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);
  const cartTotal = cart.reduce((sum, l) => sum + unitPrice(l) * l.quantity, 0);

  function addToCart(
    item: MenuItem,
    selectedOptions: Option[],
    quantity: number,
  ) {
    const key = lineKey(
      item.id,
      selectedOptions.map((o) => o.id),
    );
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [
        ...prev,
        {
          key,
          menuItemId: item.id,
          name: item.name,
          basePrice: item.price,
          selectedOptions,
          quantity,
        },
      ];
    });
  }

  function updateQuantity(key: string, quantity: number) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
    );
  }

  function handleItemTap(item: MenuItem) {
    if (item.optionGroups.length === 0) {
      addToCart(item, [], 1);
      return;
    }
    setActiveItem(item);
  }

  async function submitOrder() {
    setSubmitError("");
    if (!customerName.trim()) {
      setSubmitError("請填寫姓名");
      return;
    }
    if (!customerPhone.trim()) {
      setSubmitError("請填寫電話");
      return;
    }
    if (pickupChoice === "scheduled" && !pickupTimeInput) {
      setSubmitError("請選擇取餐時間");
      return;
    }

    let pickupTime: string | null = null;
    if (pickupChoice === "scheduled") {
      const [hours, minutes] = pickupTimeInput.split(":").map(Number);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      pickupTime = d.toISOString();
    }

    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerPhone,
        pickupTime,
        items: cart.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          selectedOptionIds: l.selectedOptions.map((o) => o.id),
        })),
      }),
    });

    if (res.ok) {
      const { orderId } = await res.json();
      localStorage.removeItem(CART_STORAGE_KEY);
      router.push(`/order/${orderId}`);
    } else {
      const body = await res.json();
      setSubmitError(body.error ?? "送出訂單失敗,請再試一次");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/40 to-white pb-24">
      <div className="sticky top-0 z-10 border-b-2 border-amber-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <EggMark />
            <div>
              <h1 className="text-lg font-semibold leading-tight text-amber-950">
                美上美早餐店
              </h1>
              <p className="text-xs text-amber-700/60">線上點餐</p>
            </div>
          </div>
          {view === "checkout" && (
            <button
              onClick={() => setView("browse")}
              className="text-sm text-amber-700 hover:underline"
            >
              返回菜單
            </button>
          )}
        </div>
      </div>

      {view === "browse" ? (
        <BrowseView
          categories={categories}
          isLoading={isLoading}
          onItemTap={handleItemTap}
        />
      ) : (
        <CheckoutView
          cart={cart}
          onUpdateQuantity={updateQuantity}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          pickupChoice={pickupChoice}
          setPickupChoice={setPickupChoice}
          pickupTimeInput={pickupTimeInput}
          setPickupTimeInput={setPickupTimeInput}
          submitError={submitError}
          submitting={submitting}
          onSubmit={submitOrder}
        />
      )}

      {view === "browse" && cartCount > 0 && (
        <button
          onClick={() => setView("checkout")}
          className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-xl items-center justify-between rounded-full bg-amber-950 px-5 py-3.5 text-white shadow-lg shadow-amber-950/20"
        >
          <span className="font-medium">{cartCount} 件</span>
          <span className="font-semibold">查看購物車 · ${cartTotal}</span>
        </button>
      )}

      {activeItem && (
        <ItemModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onAdd={(options, quantity) => {
            addToCart(activeItem, options, quantity);
            setActiveItem(null);
          }}
        />
      )}
    </div>
  );
}

function BrowseView({
  categories,
  isLoading,
  onItemTap,
}: {
  categories: MenuCategory[];
  isLoading: boolean;
  onItemTap: (item: MenuItem) => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6">
      {isLoading && <p className="text-amber-700/50">載入菜單中…</p>}
      <div className="flex flex-col gap-7">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="mb-2 text-base font-semibold text-amber-950">
              {category.name}
            </h2>
            <ul className="flex flex-col gap-2">
              {category.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onItemTap(item)}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3 text-left shadow-sm active:bg-amber-50"
                  >
                    <span className="text-zinc-800">{item.name}</span>
                    <span className="shrink-0 pl-3 font-medium text-amber-700">
                      ${item.price}
                      {item.optionGroups.length > 0 ? " 起" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function ItemModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (options: Option[], quantity: number) => void;
}) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  function toggleOption(group: OptionGroup, optionId: string) {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (group.multiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [group.id]: next };
      }
      return { ...prev, [group.id]: [optionId] };
    });
  }

  const selectedOptions = useMemo(
    () =>
      item.optionGroups.flatMap((group) =>
        group.options.filter((o) => (selections[group.id] ?? []).includes(o.id)),
      ),
    [item, selections],
  );

  const missingRequired = item.optionGroups.some(
    (g) => g.required && (selections[g.id] ?? []).length === 0,
  );

  const totalPrice =
    (item.price + selectedOptions.reduce((sum, o) => sum + o.extraPrice, 0)) *
    quantity;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-xl rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-amber-950">{item.name}</h3>
          <button onClick={onClose} className="text-zinc-400">
            ✕
          </button>
        </div>

        <div className="flex max-h-[50vh] flex-col gap-5 overflow-y-auto">
          {item.optionGroups.map((group) => (
            <div key={group.id}>
              <p className="mb-2 text-sm font-medium text-zinc-700">
                {group.name}
                {group.required && (
                  <span className="ml-1.5 text-xs text-red-500">必選</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const selected = (selections[group.id] ?? []).includes(
                    option.id,
                  );
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(group, option.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                        selected
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-zinc-200 text-zinc-600"
                      }`}
                    >
                      {option.name}
                      {option.extraPrice > 0 ? ` +${option.extraPrice}` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-full bg-zinc-100 text-lg text-zinc-600"
            >
              −
            </button>
            <span className="w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="h-8 w-8 rounded-full bg-zinc-100 text-lg text-zinc-600"
            >
              +
            </button>
          </div>
          <button
            disabled={missingRequired}
            onClick={() => onAdd(selectedOptions, quantity)}
            className="rounded-full bg-amber-950 px-5 py-2.5 font-medium text-white disabled:opacity-40"
          >
            加入購物車 · ${totalPrice}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckoutView({
  cart,
  onUpdateQuantity,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  pickupChoice,
  setPickupChoice,
  pickupTimeInput,
  setPickupTimeInput,
  submitError,
  submitting,
  onSubmit,
}: {
  cart: CartLine[];
  onUpdateQuantity: (key: string, quantity: number) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  pickupChoice: "asap" | "scheduled";
  setPickupChoice: (v: "asap" | "scheduled") => void;
  pickupTimeInput: string;
  setPickupTimeInput: (v: string) => void;
  submitError: string;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const total = cart.reduce((sum, l) => sum + unitPrice(l) * l.quantity, 0);

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6">
      <h2 className="mb-3 text-base font-semibold text-amber-950">購物車</h2>
      {cart.length === 0 ? (
        <p className="text-zinc-400">購物車是空的</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-2">
          {cart.map((line) => (
            <li
              key={line.key}
              className="rounded-xl border border-zinc-100 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-zinc-800">{line.name}</p>
                  {line.selectedOptions.length > 0 && (
                    <p className="text-xs text-zinc-400">
                      {line.selectedOptions.map((o) => o.name).join("、")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-medium text-amber-700">
                  ${unitPrice(line) * line.quantity}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => onUpdateQuantity(line.key, line.quantity - 1)}
                  className="h-7 w-7 rounded-full bg-zinc-100 text-zinc-600"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm">{line.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(line.key, line.quantity + 1)}
                  className="h-7 w-7 rounded-full bg-zinc-100 text-zinc-600"
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cart.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between text-lg font-semibold text-amber-950">
            <span>總計</span>
            <span>${total}</span>
          </div>

          <div className="flex flex-col gap-3">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="姓名"
              className="rounded-xl border border-amber-200 px-4 py-2.5 focus:border-amber-400 focus:outline-none"
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="電話"
              inputMode="tel"
              className="rounded-xl border border-amber-200 px-4 py-2.5 focus:border-amber-400 focus:outline-none"
            />

            <div>
              <p className="mb-1.5 text-sm font-medium text-zinc-700">
                取餐時間
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPickupChoice("asap")}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                    pickupChoice === "asap"
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-zinc-200 text-zinc-600"
                  }`}
                >
                  越快越好
                </button>
                <button
                  onClick={() => setPickupChoice("scheduled")}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                    pickupChoice === "scheduled"
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-zinc-200 text-zinc-600"
                  }`}
                >
                  指定時間
                </button>
              </div>
              {pickupChoice === "scheduled" && (
                <input
                  type="time"
                  value={pickupTimeInput}
                  onChange={(e) => setPickupTimeInput(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-amber-200 px-4 py-2.5 focus:border-amber-400 focus:outline-none"
                />
              )}
            </div>

            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}

            <button
              onClick={onSubmit}
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-medium text-white shadow-md shadow-amber-500/30 disabled:opacity-50"
            >
              {submitting ? "送出中…" : "送出訂單(到店付現金)"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
