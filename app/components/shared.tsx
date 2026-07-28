"use client";

import { useEffect, useState } from "react";

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

// ponytail: mock scarcity numbers — swap for real API at launch
export const SPOTS_TAKEN = 278;
export const SPOTS_TOTAL = 500;

export function refCode(email: string) {
  let h = 0;
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(36).toUpperCase().slice(0, 6);
}

export function useSubscribe() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };
  return { email, setEmail, subscribed, submit };
}

/** Waitlist form with scarcity meter and post-signup referral state. */
export function WaitlistForm({ dark }: { dark: boolean }) {
  const { email, setEmail, subscribed, submit } = useSubscribe();
  const [copied, setCopied] = useState(false);

  const t = dark
    ? {
        input:
          "bg-white/5 border-white/15 placeholder:text-neutral-400 focus:border-sky-300/60 text-white",
        btn: "bg-sky-300 text-[#050a12] hover:bg-sky-200",
        done: "border-sky-300/30 bg-sky-300/10 text-white",
        sub: "text-neutral-400",
        link: "bg-white/10 text-sky-200",
      }
    : {
        input:
          "bg-white border-slate-300 placeholder:text-slate-400 focus:border-slate-900 text-slate-900 shadow-sm",
        btn: "bg-slate-900 text-white hover:bg-slate-700",
        done: "border-slate-300 bg-white text-slate-900 shadow-sm",
        sub: "text-slate-500",
        link: "bg-slate-100 text-slate-700",
      };

  if (subscribed) {
    const link = `https://boatuneet.com/?ref=${refCode(email)}`;
    return (
      <div className={`rounded-2xl border p-5 max-w-lg ${t.done}`}>
        <div className="font-semibold">
          You&apos;re{" "}
          <span className="tabular-nums">#{SPOTS_TAKEN + 1}</span> of{" "}
          {SPOTS_TOTAL} early-access spots ⚓
        </div>
        <p className={`text-sm mt-1 ${t.sub}`}>
          Every friend who joins with your link moves you up 10 spots — the
          top 100 get free listings for a year.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code
            className={`flex-1 truncate rounded-lg px-3 py-2 text-xs ${t.link}`}
          >
            {link}
          </code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(link);
              setCopied(true);
            }}
            className={`rounded-lg text-xs font-semibold px-4 py-2 transition-colors ${t.btn}`}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-lg w-full">
      {/* scarcity meter */}
      <div>
        <div className="flex items-baseline justify-between text-xs">
          <span className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
            <span className="tabular-nums">{SPOTS_TAKEN}</span> of{" "}
            <span className="tabular-nums">{SPOTS_TOTAL}</span> early-access
            spots taken
          </span>
          <span className={t.sub}>
            {SPOTS_TOTAL - SPOTS_TAKEN} left
          </span>
        </div>
        <div
          className={`mt-1.5 h-1.5 rounded-full overflow-hidden ${
            dark ? "bg-white/10" : "bg-slate-200"
          }`}
        >
          <div
            className={`h-full rounded-full ${
              dark ? "bg-sky-300" : "bg-blue-800"
            }`}
            style={{ width: `${(SPOTS_TAKEN / SPOTS_TOTAL) * 100}%` }}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={`flex-1 rounded-xl border px-5 py-3.5 text-sm focus:outline-none ${t.input}`}
        />
        <button
          type="submit"
          className={`rounded-xl text-sm font-semibold px-7 py-3.5 transition-colors whitespace-nowrap ${t.btn}`}
        >
          Join the waitlist
        </button>
      </div>
      <p className={`mt-3 text-xs ${t.sub}`}>
        No spam — one email at launch, one when early access opens. Unsubscribe
        anytime.
      </p>
    </form>
  );
}
