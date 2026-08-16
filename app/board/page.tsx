"use client";

import { useState } from "react";
import useSWR from "swr";

type Message = {
  id: string;
  displayName: string;
  text: string;
  receivedAt: string;
  isDone: boolean;
};

const POLL_INTERVAL_MS = 4000;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BoardPage() {
  const { data, mutate, isLoading } = useSWR<{ messages: Message[] }>(
    "/api/messages",
    fetcher,
    { refreshInterval: POLL_INTERVAL_MS },
  );
  const [hideDone, setHideDone] = useState(false);

  const messages = data?.messages ?? [];

  async function toggleDone(id: string, isDone: boolean) {
    mutate(
      (current) =>
        current && {
          messages: current.messages.map((m) =>
            m.id === id ? { ...m, isDone } : m,
          ),
        },
      { revalidate: false },
    );
    await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone }),
    });
    mutate();
  }

  const visibleMessages = hideDone
    ? messages.filter((m) => !m.isDone)
    : messages;

  return (
    <div className="min-h-screen bg-zinc-100 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">訂單看板</h1>
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={hideDone}
              onChange={(e) => setHideDone(e.target.checked)}
              className="h-4 w-4"
            />
            只顯示未完成
          </label>
        </div>

        {isLoading && <p className="text-zinc-500">載入中…</p>}
        {!isLoading && visibleMessages.length === 0 && (
          <p className="text-zinc-500">目前沒有訊息</p>
        )}

        <ul className="flex flex-col gap-3">
          {visibleMessages.map((m) => (
            <li
              key={m.id}
              className={`rounded-2xl bg-white p-4 shadow-sm transition-opacity ${
                m.isDone ? "opacity-50" : ""
              }`}
            >
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="font-medium text-zinc-900">
                  {m.displayName}
                </span>
                <span className="shrink-0 text-sm text-zinc-400">
                  {formatTime(m.receivedAt)}
                </span>
              </div>
              <p
                className={`mb-3 whitespace-pre-wrap text-lg text-zinc-800 ${
                  m.isDone ? "line-through" : ""
                }`}
              >
                {m.text}
              </p>
              <button
                onClick={() => toggleDone(m.id, !m.isDone)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  m.isDone
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-zinc-900 text-white"
                }`}
              >
                {m.isDone ? "標記為未完成" : "標記完成"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
