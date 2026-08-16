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

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`request failed: ${res.status}`);
    return res.json();
  });

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

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M6 4.3v11.4a.8.8 0 0 0 1.22.68l9-5.7a.8.8 0 0 0 0-1.36l-9-5.7A.8.8 0 0 0 6 4.3Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M4 8h7a4 4 0 1 1 0 8h-2" />
      <path d="M7 5 4 8l3 3" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M10 7v4" />
      <path d="M10 13.5h.01" />
      <circle cx="10" cy="10" r="7.25" />
    </svg>
  );
}

export default function BoardPage() {
  const { data, error, mutate, isLoading } = useSWR<{ messages: Message[] }>(
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

  const pending = messages
    .filter((m) => !m.isDone)
    .sort(
      (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
    );
  const done = messages
    .filter((m) => m.isDone)
    .sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );

  function renderCard(m: Message) {
    const waitMinutes = minutesSince(m.receivedAt, now);
    const overdue = !m.isDone && waitMinutes >= OVERDUE_MINUTES;
    const state: "pending" | "started" | "done" = m.isDone
      ? "done"
      : m.startedAt
        ? "started"
        : "pending";
    const isNew = newIds.has(m.id);

    const cardClass = overdue
      ? "border-red-200 bg-red-50/70"
      : state === "pending"
        ? "border-amber-200 bg-white"
        : state === "started"
          ? "border-blue-200 bg-white"
          : "border-zinc-100 bg-white/70";

    return (
      <li
        key={m.id}
        className={`rounded-2xl border p-4 shadow-sm transition-all duration-300 ${cardClass} ${
          isNew ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-50" : ""
        } ${state === "done" ? "opacity-60" : ""}`}
      >
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900">{m.displayName}</span>
            {state === "started" && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                製作中
              </span>
            )}
          </div>
          <span
            className={`flex shrink-0 items-center gap-1 text-sm ${
              overdue ? "font-medium text-red-600" : "text-zinc-400"
            }`}
          >
            {overdue && <WarnIcon />}
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
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors active:bg-amber-600"
            >
              <PlayIcon />
              開始製作
            </button>
          )}
          {state !== "done" && (
            <button
              onClick={() =>
                patchMessage(m.id, { isDone: true }, { isDone: true })
              }
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors active:bg-zinc-700"
            >
              <CheckIcon />
              標記完成
            </button>
          )}
          {state === "done" && (
            <button
              onClick={() =>
                patchMessage(m.id, { isDone: false }, { isDone: false })
              }
              className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors active:bg-zinc-200"
            >
              <UndoIcon />
              標記為未完成
            </button>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="sticky top-0 z-10 border-b border-zinc-200/70 bg-zinc-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              訂單看板
            </h1>
            {pending.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-800">
                {pending.length} 筆待處理
              </span>
            )}
          </div>
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
        {error && (
          <div className="bg-red-600 px-4 py-1.5 text-center text-sm font-medium text-white sm:px-6">
            連線中斷,畫面可能不是最新資料——正在嘗試重新連線…
          </div>
        )}
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        {isLoading && <p className="text-zinc-400">載入中…</p>}
        {!isLoading && messages.length === 0 && (
          <p className="text-zinc-400">目前沒有訂單</p>
        )}

        {pending.length > 0 && (
          <ul className="flex flex-col gap-3">{pending.map(renderCard)}</ul>
        )}

        {!hideDone && done.length > 0 && (
          <div className={pending.length > 0 ? "mt-6" : ""}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              已完成
            </h2>
            <ul className="flex flex-col gap-3">{done.map(renderCard)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
