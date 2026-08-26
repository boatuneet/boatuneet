"use client";

import { useId, useState } from "react";

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

/** Free-valuation request form. Captures an email; the valuation itself is
 *  fulfilled manually by reply. */
export function ValuationForm({
  dark,
  compact = false,
  onButtonHover,
}: {
  dark: boolean;
  compact?: boolean;
  onButtonHover?: (hovering: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const emailId = useId();
  const noteId = useId();

  const t = dark
    ? {
        input:
          "bg-white/15 border-white/25 backdrop-blur-xl placeholder:text-white/60 focus:border-sky-300/70 text-white",
        btn: "cta-button",
        done: "border-sky-300/30 bg-sky-300/10 text-white",
        sub: "text-neutral-400",
        strong: "text-white",
      }
    : {
        input:
          "bg-white border-slate-300 placeholder:text-slate-400 focus:border-slate-900 text-slate-900 shadow-sm",
        btn: "bg-slate-900 text-white hover:bg-slate-700",
        done: "border-slate-300 bg-white text-slate-900 shadow-sm",
        sub: "text-slate-500",
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
      setDone(true);
      void celebrate();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className={`${compact ? "rounded-xl p-4" : "rounded-2xl p-5"} max-w-lg border ${t.done}`}>
        <div className="font-semibold">Valuation request received.</div>
        <p className={`text-sm mt-1 ${t.sub}`}>
          We&apos;ll email you a few quick questions about your boat, then send
          a market-informed price range — usually within two business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-lg">
      <label htmlFor={emailId} className={compact ? "sr-only" : `block text-xs font-semibold ${t.strong}`}>
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
          aria-describedby={compact ? undefined : noteId}
          className={`h-14 w-full rounded-xl border px-5 text-base sm:flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${t.input}`}
        />
        <button
          type="submit"
          disabled={pending}
          onMouseEnter={() => onButtonHover?.(true)}
          onMouseLeave={() => onButtonHover?.(false)}
          className={`h-14 cursor-pointer whitespace-nowrap rounded-xl px-7 text-sm font-semibold shadow-sm transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${t.btn}`}
        >
          {pending ? "Sending…" : "Get my free valuation"}
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
      ) : !compact ? (
        <p id={noteId} className={`mt-3 text-xs leading-5 ${t.sub}`}>
          Free and no obligation — we reply within two business days.
        </p>
      ) : null}
    </form>
  );
}
