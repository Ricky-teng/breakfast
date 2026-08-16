"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      router.push("/board");
      router.refresh();
    } else {
      setError("PIN 錯誤,請再試一次");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">
          美上美早餐店
        </h1>
        <p className="mb-6 text-sm text-zinc-500">輸入 PIN 碼查看訂單看板</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN 碼"
          className="mb-3 w-full rounded-lg border border-zinc-300 px-4 py-3 text-lg tracking-widest focus:border-zinc-500 focus:outline-none"
        />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !pin}
          className="w-full rounded-lg bg-zinc-900 py-3 text-white disabled:opacity-40"
        >
          {submitting ? "確認中…" : "進入看板"}
        </button>
      </form>
    </div>
  );
}
