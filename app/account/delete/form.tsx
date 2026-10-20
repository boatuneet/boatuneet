"use client";

import { useState } from "react";

export default function DeleteForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "pending") return;
    setState("pending");
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm">
        Done. Everything we held for <strong>{email}</strong> has been deleted.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row" aria-label="Delete my data">
      <label className="flex h-14 flex-1 flex-col justify-center rounded-xl border border-slate-300 bg-white px-4 text-left shadow-sm focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2">
        <span className="text-[10px] font-bold uppercase leading-4 tracking-[0.1em] text-slate-500">Your email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent text-base leading-6 outline-none placeholder:text-slate-400"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={state === "pending"}
        className="h-14 cursor-pointer rounded-xl bg-red-700 px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {state === "pending" ? "Deleting…" : "Delete everything"}
      </button>
      {error && <p role="alert" className="text-sm text-red-600 sm:basis-full">{error}</p>}
    </form>
  );
}
