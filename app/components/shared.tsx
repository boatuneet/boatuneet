"use client";

import { useEffect, useId, useState } from "react";

export const LAUNCH = new Date("2026-09-01T12:00:00Z").getTime();

export function useCountdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, LAUNCH - (now ?? LAUNCH));
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    ready: now !== null,
  };
}

export type Status = {
  taken: number;
  cap: number;
  spotsLeft: number;
  isLive: boolean;
};

/** Confetti burst on a successful signup. Loaded on demand so the library
 *  never ships in the initial bundle for a page most visitors only read. */
async function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#1e40af", "#3b82f6", "#93c5fd", "#10b981", "#ffffff"];
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors });
  // Two angled follow-ups make the burst feel like it fills the width.
  setTimeout(
    () =>
      confetti({
        particleCount: 45,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.75 },
        colors,
      }),
    140,
  );
  setTimeout(
    () =>
      confetti({
        particleCount: 45,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.75 },
        colors,
      }),
    140,
  );
}

type Joined = { position: number; cap: number; refCode: string };

/** Waitlist form with scarcity meter and post-signup referral state. */
export function WaitlistForm({
  dark,
  status,
  compact = false,
}: {
  dark: boolean;
  status: Status;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<Joined | null>(null);
  const emailId = useId();
  const noteId = useId();

  const t = dark
    ? {
        input:
          "bg-white/5 border-white/15 placeholder:text-neutral-400 focus:border-sky-300/60 text-white",
        btn: "bg-sky-300 text-[#050a12] hover:bg-sky-200",
        done: "border-sky-300/30 bg-sky-300/10 text-white",
        sub: "text-neutral-400",
        link: "bg-white/10 text-sky-200",
        bar: "bg-white/10",
        fill: "bg-sky-300",
        strong: "text-white",
      }
    : {
        input:
          "bg-white border-slate-300 placeholder:text-slate-400 focus:border-slate-900 text-slate-900 shadow-sm",
        btn: "bg-slate-900 text-white hover:bg-slate-700",
        done: "border-slate-300 bg-white text-slate-900 shadow-sm",
        sub: "text-slate-500",
        link: "bg-slate-100 text-slate-700",
        bar: "bg-slate-200",
        fill: "bg-blue-800",
        strong: "text-slate-900",
      };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const params = new URLSearchParams(window.location.search);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          company,
          ref: params.get("ref"),
          source: params.get("utm_source"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "invalid_email"
            ? "That email doesn't look right."
            : "Something went wrong. Please try again.",
        );
        return;
      }
      setJoined(data);
      void celebrate();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (joined) {
    return (
      <div className={`${compact ? "rounded-xl p-4" : "rounded-2xl p-5"} max-w-lg border ${t.done}`}>
        <div className="font-semibold">
          You&apos;re <span className="tabular-nums">#{joined.position}</span> of{" "}
          {joined.cap} early-access spots.
        </div>
        <p className={`text-sm mt-1 ${t.sub}`}>
          We&apos;ll email you the moment your spot opens. Until then, nothing
          else lands in your inbox.
        </p>
      </div>
    );
  }

  const pct = Math.min(100, (status.taken / status.cap) * 100);

  return (
    <form onSubmit={submit} className="w-full max-w-lg">
      {!compact && status.isLive ? (
        <div>
          <div className="flex items-baseline justify-between text-xs">
            <span className={`font-semibold ${t.strong}`}>
              <span className="tabular-nums">{status.taken}</span> of{" "}
              <span className="tabular-nums">{status.cap}</span> early-access
              spots taken
            </span>
            <span className={t.sub}>{status.spotsLeft} left</span>
          </div>
          <div
            role="progressbar"
            aria-label="Early-access spots taken"
            aria-valuemin={0}
            aria-valuemax={status.cap}
            aria-valuenow={status.taken}
            className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${t.bar}`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${t.fill}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : !compact ? (
        <p className={`text-xs font-semibold ${t.strong}`}>
          Early-access applications are open.
        </p>
      ) : null}

      <label htmlFor={emailId} className={compact ? "sr-only" : `mt-4 block text-xs font-semibold ${t.strong}`}>
        Email address
      </label>
      <div className={`${compact ? "" : "mt-2"} flex flex-col items-stretch gap-3 sm:flex-row sm:items-center`}>
        <input
          id={emailId}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          aria-describedby={noteId}
          className={`min-h-12 flex-1 rounded-xl border px-5 py-3.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${t.input}`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`min-h-12 cursor-pointer whitespace-nowrap rounded-xl px-7 py-3.5 text-sm font-semibold shadow-sm transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none ${t.btn}`}
        >
          {pending ? "Joining…" : "Join early access"}
        </button>
      </div>

      {/* honeypot — hidden from people, catnip for bots */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="absolute left-[-9999px] w-px h-px opacity-0"
      />

      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-500">
          {error}
        </p>
      ) : (
        <p id={noteId} className={`${compact ? "mt-2.5" : "mt-3"} text-xs leading-5 ${t.sub}`}>
          Launch and early-access updates only. Unsubscribe anytime.
        </p>
      )}
    </form>
  );
}
