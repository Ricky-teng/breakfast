"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function EggMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-14 w-14">
      <circle cx="20" cy="20" r="19" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
      <ellipse cx="20" cy="20" rx="9" ry="8" fill="#F59E0B" />
      <ellipse cx="17" cy="17" rx="2.5" ry="2" fill="#FDE68A" opacity="0.8" />
    </svg>
  );
}

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl shadow-amber-900/5"
      >
        <div className="mb-5 flex justify-center">
          <EggMark />
        </div>
        <h1 className="mb-1 text-center text-xl font-semibold text-amber-950">
          美上美早餐店
        </h1>
        <p className="mb-6 text-center text-sm text-amber-700/70">
          輸入 PIN 碼查看訂單看板
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN 碼"
          className="mb-3 w-full rounded-xl border border-amber-200 px-4 py-3 text-center text-lg tracking-[0.3em] text-amber-950 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
        />
        {error && (
          <p className="mb-3 text-center text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting || !pin}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-medium text-white shadow-md shadow-amber-500/30 transition-opacity disabled:opacity-40"
        >
          {submitting ? "確認中…" : "進入看板"}
        </button>
      </form>
    </div>
  );
}
