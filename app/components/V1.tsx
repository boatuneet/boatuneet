"use client";

import Image from "next/image";
import { useCountdown, WaitlistForm, SPOTS_TAKEN, SPOTS_TOTAL } from "./shared";

export const STEPS = [
  { n: "1", t: "Add your boat", d: "Photos, a voice note or a PDF — anything works." },
  { n: "2", t: "We build the sale", d: "Verified listing, market price, every platform." },
  { n: "3", t: "You sign", d: "Screened buyers, viewings and paperwork handled." },
];

export function Header() {
  const { days, hours, minutes, ready } = useCountdown();
  return (
    <header className="relative flex items-center justify-between px-6 sm:px-12 py-6">
      <span className="font-[family-name:var(--font-script)] text-2xl text-blue-800">
        Boatuneet
      </span>
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 backdrop-blur-md text-xs text-slate-600 px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {SPOTS_TAKEN} / {SPOTS_TOTAL} early spots taken
        </span>
        <div
          className="text-xs text-blue-800/80 tabular-nums tracking-wider"
          style={{ visibility: ready ? "visible" : "hidden" }}
        >
          {days}d : {String(hours).padStart(2, "0")}h :{" "}
          {String(minutes).padStart(2, "0")}m
        </div>
      </div>
    </header>
  );
}

export function StepCards() {
  return (
    <div className="mt-10 grid sm:grid-cols-3 gap-3 max-w-2xl">
      {STEPS.map((s) => (
        <div
          key={s.n}
          className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md p-4 shadow-sm"
        >
          <div className="text-blue-800 text-xs font-semibold">STEP {s.n}</div>
          <div className="font-semibold mt-1 text-sm">{s.t}</div>
          <div className="text-slate-500 text-xs mt-1 leading-relaxed">
            {s.d}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProofStrip() {
  return (
    <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-500 tracking-wide">
      <span>16 selling tools in one place</span>
      <span className="text-slate-300">·</span>
      <span>40+ marketplaces &amp; platforms covered</span>
      <span className="text-slate-300">·</span>
      <span>Every buyer KYC &amp; AML screened</span>
    </div>
  );
}

export default function V1() {
  return (
    <main className="flex-1 min-h-screen relative overflow-hidden bg-[#f4f6f8] text-slate-900">
      {/* sunny backdrop */}
      <Image
        src="/v7-yacht.png"
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover object-[75%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#f4f6f8] via-[#f4f6f8]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#f4f6f8]/90 via-transparent to-transparent" />

      <Header />

      <section className="relative px-6 sm:px-12 pt-8 sm:pt-16 pb-16 max-w-6xl">
        <h1 className="text-6xl sm:text-8xl font-semibold tracking-tight leading-[0.95]">
          Your boat.
          <br />
          <span className="text-blue-800">Sold.</span>
        </h1>
        <p className="mt-6 max-w-lg text-slate-600 text-base sm:text-lg leading-relaxed">
          Boatuneet is the selling platform for boat owners and dealers. It
          writes and verifies your listing, prices it against the market, finds
          and screens real buyers, and preps every document — you just sign.
        </p>

        <StepCards />

        <div className="mt-10">
          <WaitlistForm dark={false} />
        </div>

        <ProofStrip />
      </section>

      {/* floating product-preview chips over the yacht */}
      <div className="pointer-events-none absolute right-[6%] top-[24%] hidden lg:flex flex-col gap-4">
        <div className="floaty rounded-2xl border border-slate-200 bg-white/85 backdrop-blur-lg px-5 py-3 text-sm shadow-lg" style={{ "--tilt": "-2deg" } as React.CSSProperties}>
          <span className="text-emerald-600">✓</span> HIN verified · Beneteau
          Oceanis 46.1
        </div>
        <div className="floaty rounded-2xl border border-slate-200 bg-white/85 backdrop-blur-lg px-5 py-3 text-sm shadow-lg ml-10" style={{ "--tilt": "2deg", animationDelay: "1.4s" } as React.CSSProperties}>
          Market price <span className="text-blue-800 font-semibold">€318,000</span>
        </div>
        <div className="floaty rounded-2xl border border-slate-200 bg-white/85 backdrop-blur-lg px-5 py-3 text-sm shadow-lg" style={{ "--tilt": "-1deg", animationDelay: "2.6s" } as React.CSSProperties}>
          <span className="text-blue-800 font-semibold">7</span> screened buyers
          waiting
        </div>
      </div>
    </main>
  );
}
