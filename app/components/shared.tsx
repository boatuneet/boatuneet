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

/** Suggestions only — any make can be typed. Keeps common spellings consistent. */
const MAKES = [
  "Absolute", "Azimut", "Bavaria", "Beneteau", "Benetti", "Boston Whaler",
  "Cranchi", "Dufour", "Fairline", "Ferretti", "Fountaine Pajot", "Galeon",
  "Grand Banks", "Hallberg-Rassy", "Hanse", "Jeanneau", "Lagoon", "Monte Carlo",
  "Nautor's Swan", "Pershing", "Princess", "Prestige", "Riva", "Sanlorenzo",
  "Sea Ray", "Sunreef", "Sunseeker", "Wellcraft",
];

const MAX_YEAR = new Date().getFullYear() + 2;

type BoatDraft = { make: string; model: string; year: string; hin: string };

const THEMES = {
  dark: {
    field: "bg-white/15 border-white/25 backdrop-blur-xl focus-within:border-sky-300/70 text-white",
    input: "placeholder:text-white/45",
    label: "text-white/60",
    btn: "cta-button",
    done: "border-sky-300/30 bg-sky-300/10 text-white",
    sub: "text-neutral-400",
    link: "text-sky-300 hover:text-white",
  },
  light: {
    field: "bg-white border-slate-300 focus-within:border-slate-900 text-slate-900 shadow-sm",
    input: "placeholder:text-slate-400",
    label: "text-slate-500",
    btn: "bg-slate-900 text-white hover:bg-slate-700",
    done: "border-slate-300 bg-white text-slate-900 shadow-sm",
    sub: "text-slate-500",
    link: "text-blue-700 hover:text-slate-900",
  },
};

type Theme = (typeof THEMES)["dark"];

/** Label sits inside the box, so four fields stay as compact as one. */
function Field({
  label,
  theme,
  className = "",
  ...input
}: { label: string; theme: Theme; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={`flex h-14 min-w-0 flex-col justify-center rounded-xl border px-4 text-left focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 ${theme.field} ${className}`}
    >
      <span className={`text-[10px] font-bold uppercase leading-4 tracking-[0.1em] ${theme.label}`}>{label}</span>
      <input
        {...input}
        className={`w-full min-w-0 bg-transparent text-base leading-6 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${theme.input}`}
      />
    </label>
  );
}

/** Free-valuation request form: boat details first, then the email to send
 *  the range to. The valuation itself is fulfilled manually by reply. */
export function ValuationForm({
  dark,
  compact = false,
  onButtonHover,
}: {
  dark: boolean;
  compact?: boolean;
  onButtonHover?: (hovering: boolean) => void;
}) {
  const [step, setStep] = useState<"boat" | "email" | "done">("boat");
  const [boat, setBoat] = useState<BoatDraft>({ make: "", model: "", year: "", hin: "" });
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  const t = THEMES[dark ? "dark" : "light"];

  const boatName = `${boat.year} ${boat.make} ${boat.model}`.replace(/\s+/g, " ").trim();
  const set = (key: keyof BoatDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBoat((b) => ({ ...b, [key]: e.target.value }));

  const button = `h-14 cursor-pointer whitespace-nowrap rounded-xl px-7 text-sm font-semibold shadow-sm transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${t.btn}`;
  const hover = {
    onMouseEnter: () => onButtonHover?.(true),
    onMouseLeave: () => onButtonHover?.(false),
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
          boat,
          ref: params.get("ref"),
          source: params.get("utm_source"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "invalid_email"
            ? "That email doesn't look right."
            : data.error === "invalid_boat"
              ? "Please check your boat details — use Edit above to fix them."
              : "Something went wrong. Please try again.",
        );
        return;
      }
      setStep("done");
      void celebrate();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (step === "done") {
    return (
      <div role="status" className={`${compact ? "rounded-xl p-4" : "rounded-2xl p-5"} mx-auto w-full max-w-lg border text-left ${t.done}`}>
        <div className="font-semibold">Valuation request received for your {boatName}.</div>
        <p className={`text-sm mt-1 ${t.sub}`}>
          We&apos;ll compare it against current listings and email a
          market-informed price range to {email} — usually within two business
          days.
        </p>
      </div>
    );
  }

  if (step === "boat") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStep("email");
        }}
        className="@container mx-auto w-full max-w-lg"
        aria-label="Your boat"
      >
        <div className="grid grid-cols-2 gap-3 @md:grid-cols-[1fr_1fr_0.72fr]">
          <Field
            theme={t}
            label="Make"
            required
            maxLength={80}
            list={`${id}-makes`}
            autoComplete="off"
            placeholder="Sunseeker"
            value={boat.make}
            onChange={set("make")}
            autoFocus={editing}
          />
          <Field theme={t} label="Model" required maxLength={80} autoComplete="off" placeholder="Manhattan 73" value={boat.model} onChange={set("model")} />
          <Field
            theme={t}
            label="Year built"
            type="number"
            inputMode="numeric"
            required
            min={1900}
            max={MAX_YEAR}
            placeholder="2012"
            value={boat.year}
            onChange={set("year")}
          />
          <Field
            theme={t}
            label="HIN · optional"
            className="@md:col-span-2"
            maxLength={24}
            pattern="[A-Za-z0-9 \-]{6,24}"
            title="Letters and numbers, usually 12 characters"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="XSK12345D404"
            aria-describedby={`${id}-hin`}
            value={boat.hin}
            onChange={set("hin")}
          />
          <button type="submit" className={`${button} col-span-2 @md:col-span-1`} {...hover}>
            Continue
          </button>
        </div>
        <datalist id={`${id}-makes`}>
          {MAKES.map((make) => (
            <option key={make} value={make} />
          ))}
        </datalist>
        <p id={`${id}-hin`} className={`mt-3 min-h-10 text-left text-xs leading-5 ${t.sub}`}>
          The HIN is the 12-character hull number on your transom or registration papers.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="@container mx-auto w-full max-w-lg" aria-label="Where to send your valuation">
      {/* h-14 + mb-3 matches a field row, so both steps are the same height and
          the centred hero doesn't shift when switching. */}
      <div className={`mb-3 flex h-14 items-center justify-between gap-3 rounded-xl border px-4 text-left text-sm ${t.field}`}>
        <span className="min-w-0 truncate">
          <span className={`mr-2 text-[10px] font-bold uppercase tracking-[0.1em] ${t.label}`}>Your boat</span>
          <span className="font-semibold">{boatName}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setStep("boat");
          }}
          className={`shrink-0 cursor-pointer text-xs font-semibold underline-offset-4 hover:underline ${t.link}`}
        >
          Edit
        </button>
      </div>

      <div className="flex flex-col items-stretch gap-3 @md:flex-row @md:items-center">
        <Field
          theme={t}
          label="Email for your valuation"
          className="@md:flex-1"
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={pending} className={button} {...hover}>
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
        <p role="alert" className="mt-3 min-h-10 text-left text-xs leading-5 text-red-500">
          {error}
        </p>
      ) : (
        // ponytail: min-h-10 reserves two lines; copy longer than that brings the jump back.
        <p className={`mt-3 min-h-10 text-left text-xs leading-5 ${t.sub}`}>
          Free and no obligation — we reply within two business days.
        </p>
      )}
    </form>
  );
}
