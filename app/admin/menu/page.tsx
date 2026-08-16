"use client";

import { useState } from "react";
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
  isAvailable: boolean;
  optionGroups: OptionGroup[];
};
type MenuCategory = { id: string; name: string; items: MenuItem[] };

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function optionGroupSummary(group: OptionGroup) {
  const options = group.options
    .map((o) => (o.extraPrice ? `${o.name}(+${o.extraPrice})` : o.name))
    .join("、");
  return `${group.name}:${options}`;
}

export default function AdminMenuPage() {
  const { data, mutate, isLoading } = useSWR<{ categories: MenuCategory[] }>(
    "/api/admin/menu",
    fetcher,
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemDrafts, setNewItemDrafts] = useState<
    Record<string, { name: string; price: string }>
  >({});

  const categories = data?.categories ?? [];

  async function updateItem(id: string, patch: Record<string, unknown>) {
    mutate(
      (current) =>
        current && {
          categories: current.categories.map((c) => ({
            ...c,
            items: c.items.map((i) =>
              i.id === id ? { ...i, ...patch } : i,
            ),
          })),
        },
      { revalidate: false },
    );
    await fetch(`/api/admin/menu/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function deleteItem(id: string) {
    if (!confirm("確定要刪除這個品項嗎?")) return;
    mutate(
      (current) =>
        current && {
          categories: current.categories.map((c) => ({
            ...c,
            items: c.items.filter((i) => i.id !== id),
          })),
        },
      { revalidate: false },
    );
    await fetch(`/api/admin/menu/items/${id}`, { method: "DELETE" });
  }

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/admin/menu/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    if (res.ok) {
      setNewCategoryName("");
      mutate();
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("確定要刪除這個分類嗎?(底下要沒有品項才能刪)")) return;
    const res = await fetch(`/api/admin/menu/categories/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      mutate();
    } else {
      const body = await res.json();
      alert(body.error ?? "刪除失敗");
    }
  }

  async function addItem(categoryId: string) {
    const draft = newItemDrafts[categoryId];
    if (!draft?.name?.trim()) return;
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price < 0) {
      alert("價格不正確");
      return;
    }
    const res = await fetch("/api/admin/menu/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, name: draft.name.trim(), price }),
    });
    if (res.ok) {
      setNewItemDrafts((prev) => ({
        ...prev,
        [categoryId]: { name: "", price: "" },
      }));
      mutate();
    }
  }

  async function reseedMenu() {
    if (
      !confirm(
        "確定要清空現有菜單、重新匯入預設菜單嗎?這個動作無法復原,而且如果已經有真實訂單會被拒絕執行。",
      )
    ) {
      return;
    }
    const res = await fetch("/api/admin/menu/reseed", { method: "POST" });
    if (res.ok) {
      mutate();
      alert("已重新匯入預設菜單");
    } else {
      const body = await res.json();
      alert(body.error ?? "重新匯入失敗");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/40 to-white">
      <div className="sticky top-0 z-10 border-b-2 border-amber-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
          <h1 className="text-lg font-semibold text-amber-950">菜單管理</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={reseedMenu}
              className="text-sm text-zinc-400 hover:text-red-600"
            >
              重新匯入預設菜單
            </button>
            <a href="/board" className="text-sm text-amber-700 hover:underline">
              回看板
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {isLoading && <p className="text-amber-700/50">載入中…</p>}

        <div className="mb-6 flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="新分類名稱"
            className="flex-1 rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <button
            onClick={addCategory}
            className="rounded-lg bg-amber-950 px-4 py-2 text-sm font-medium text-white"
          >
            新增分類
          </button>
        </div>

        <div className="flex flex-col gap-8">
          {categories.map((category) => (
            <section key={category.id}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-amber-950">
                  {category.name}
                </h2>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="text-xs text-zinc-400 hover:text-red-600"
                >
                  刪除分類
                </button>
              </div>

              <ul className="flex flex-col gap-2">
                {category.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-zinc-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.isAvailable}
                        onChange={(e) =>
                          updateItem(item.id, { isAvailable: e.target.checked })
                        }
                        className="h-4 w-4 accent-amber-500"
                        title="上架"
                      />
                      <input
                        key={`${item.id}-name`}
                        defaultValue={item.name}
                        onBlur={(e) => {
                          if (e.target.value.trim() !== item.name) {
                            updateItem(item.id, { name: e.target.value.trim() });
                          }
                        }}
                        className={`min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1 text-sm hover:border-zinc-200 focus:border-amber-400 focus:outline-none ${
                          !item.isAvailable ? "text-zinc-400 line-through" : ""
                        }`}
                      />
                      <span className="text-sm text-zinc-400">$</span>
                      <input
                        key={`${item.id}-price`}
                        type="number"
                        defaultValue={item.price}
                        onBlur={(e) => {
                          const price = Number(e.target.value);
                          if (Number.isFinite(price) && price !== item.price) {
                            updateItem(item.id, { price });
                          }
                        }}
                        className="w-16 rounded-lg border border-transparent px-2 py-1 text-sm hover:border-zinc-200 focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-xs text-zinc-400 hover:text-red-600"
                      >
                        刪除
                      </button>
                    </div>
                    {item.optionGroups.length > 0 && (
                      <p className="mt-1.5 pl-6 text-xs text-amber-700/60">
                        {item.optionGroups.map(optionGroupSummary).join(" ‧ ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex gap-2 pl-1">
                <input
                  value={newItemDrafts[category.id]?.name ?? ""}
                  onChange={(e) =>
                    setNewItemDrafts((prev) => ({
                      ...prev,
                      [category.id]: {
                        name: e.target.value,
                        price: prev[category.id]?.price ?? "",
                      },
                    }))
                  }
                  placeholder="新品項名稱"
                  className="flex-1 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none"
                />
                <input
                  value={newItemDrafts[category.id]?.price ?? ""}
                  onChange={(e) =>
                    setNewItemDrafts((prev) => ({
                      ...prev,
                      [category.id]: {
                        name: prev[category.id]?.name ?? "",
                        price: e.target.value,
                      },
                    }))
                  }
                  type="number"
                  placeholder="價格"
                  className="w-20 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none"
                />
                <button
                  onClick={() => addItem(category.id)}
                  className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800"
                >
                  新增
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
