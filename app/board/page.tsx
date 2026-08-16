"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

type Message = {
  id: string;
  displayName: string;
  text: string;
  receivedAt: string;
  startedAt: string | null;
  isDone: boolean;
};

const POLL_INTERVAL_MS = 4000;
const OVERDUE_MINUTES = 5;
const NEW_ORDER_HIGHLIGHT_MS = 4000;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function minutesSince(iso: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
}

function playNewOrderChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const beep = (freq: number, startOffset: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      const t = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.32);
    };
    beep(880, 0);
    beep(1175, 0.18);
    setTimeout(() => ctx.close(), 700);
  } catch {
    // 瀏覽器不支援或播放被擋下時安靜失敗,不影響看板功能
  }
}

export default function BoardPage() {
  const { data, mutate, isLoading } = useSWR<{ messages: Message[] }>(
    "/api/messages",
    fetcher,
    { refreshInterval: POLL_INTERVAL_MS },
  );
  const [hideDone, setHideDone] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const knownIds = useRef<Set<string> | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const messages = data?.messages ?? [];

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!data) return;
    const currentIds = new Set(data.messages.map((m) => m.id));

    if (knownIds.current === null) {
      knownIds.current = currentIds;
      return;
    }

    const arrived = [...currentIds].filter((id) => !knownIds.current!.has(id));
    if (arrived.length > 0) {
      playNewOrderChime();
      setNewIds(new Set(arrived));
      setTimeout(() => setNewIds(new Set()), NEW_ORDER_HIGHLIGHT_MS);
    }
    knownIds.current = currentIds;
  }, [data]);

  async function patchMessage(
    id: string,
    requestBody: Record<string, unknown>,
    optimisticPatch: Partial<Message>,
  ) {
    mutate(
      (current) =>
        current && {
          messages: current.messages.map((m) =>
            m.id === id ? { ...m, ...optimisticPatch } : m,
          ),
        },
      { revalidate: false },
    );
    await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    mutate();
  }

  const visibleMessages = hideDone
    ? messages.filter((m) => !m.isDone)
    : messages;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">訂單看板</h1>
          <label className="flex items-center gap-2 text-sm text-zinc-500">
            <input
              type="checkbox"
              checked={hideDone}
              onChange={(e) => setHideDone(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            只顯示未完成
          </label>
        </div>

        {isLoading && <p className="text-zinc-400">載入中…</p>}
        {!isLoading && visibleMessages.length === 0 && (
          <p className="text-zinc-400">目前沒有訂單</p>
        )}

        <ul className="flex flex-col gap-3">
          {visibleMessages.map((m) => {
            const waitMinutes = minutesSince(m.receivedAt, now);
            const overdue = !m.isDone && waitMinutes >= OVERDUE_MINUTES;
            const state: "pending" | "started" | "done" = m.isDone
              ? "done"
              : m.startedAt
                ? "started"
                : "pending";
            const isNew = newIds.has(m.id);

            const cardClass = overdue
              ? "border-red-300 bg-red-50"
              : state === "pending"
                ? "border-amber-200 bg-white"
                : state === "started"
                  ? "border-blue-200 bg-white"
                  : "border-zinc-100 bg-white opacity-50";

            return (
              <li
                key={m.id}
                className={`rounded-2xl border p-4 shadow-sm transition-all ${cardClass} ${
                  isNew ? "ring-2 ring-amber-400" : ""
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900">
                      {m.displayName}
                    </span>
                    {state === "started" && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        製作中
                      </span>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-sm ${
                      overdue ? "font-medium text-red-600" : "text-zinc-400"
                    }`}
                  >
                    {m.isDone ? formatTime(m.receivedAt) : `${waitMinutes} 分鐘前`}
                  </span>
                </div>

                <p
                  className={`mb-3 whitespace-pre-wrap text-lg text-zinc-800 ${
                    state === "done" ? "line-through" : ""
                  }`}
                >
                  {m.text}
                </p>

                <div className="flex gap-2">
                  {state === "pending" && (
                    <button
                      onClick={() =>
                        patchMessage(
                          m.id,
                          { start: true },
                          { startedAt: new Date().toISOString() },
                        )
                      }
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white active:bg-amber-600"
                    >
                      開始製作
                    </button>
                  )}
                  {state !== "done" && (
                    <button
                      onClick={() =>
                        patchMessage(m.id, { isDone: true }, { isDone: true })
                      }
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white active:bg-zinc-700"
                    >
                      標記完成
                    </button>
                  )}
                  {state === "done" && (
                    <button
                      onClick={() =>
                        patchMessage(m.id, { isDone: false }, { isDone: false })
                      }
                      className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-600"
                    >
                      標記為未完成
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
