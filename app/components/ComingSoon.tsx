"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCountdown, WaitlistForm, type Status } from "./shared";
import { AuroraBackground } from "./aurora-background";

const STEPS = [
  { n: "1", t: "Add your boat", d: "Photos, a voice note or a PDF — anything works." },
  { n: "2", t: "We build the sale", d: "Verified listing, market price, every platform." },
  { n: "3", t: "You sign", d: "Screened buyers, viewings and paperwork handled." },
];

function Header({ status }: { status: Status }) {
  const { days, hours, minutes, ready } = useCountdown();
  return (
    <header className="relative flex items-center justify-between px-6 sm:px-12 py-6">
      <Image
        src="/logo.png"
        alt="Uneet"
        width={800}
        height={493}
        preload
        className="h-9 sm:h-11 w-auto"
      />
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 backdrop-blur-md text-xs text-slate-600 px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {status.taken} / {status.cap} early spots taken
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

/** Tilts the element back in 3D and flattens it as it scrolls into view.
 *  The glow element fades out in sync as the card flattens. */
function useScrollTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 1 = fully tilted (card top low in viewport), 0 = flat (card top near 30% of viewport)
      const start = vh * 0.75;
      const end = vh * 0.3;
      const p = Math.min(1, Math.max(0, (r.top - end) / (start - end)));
      el.style.transform = `rotateX(${p * 25}deg) scale(${1 - p * 0.08})`;
      if (glowRef.current) glowRef.current.style.opacity = String(p);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return { ref, glowRef };
}

function ExplainerVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-2xl shadow-slate-300/60">
      {playing ? (
        <video
          src="/coming-soon-video.mp4"
          poster="/video-poster.jpg"
          controls
          autoPlay
          className="w-full h-full object-cover"
        />
      ) : (
        <button
          onClick={() => setPlaying(true)}
          aria-label="Play explainer video"
          className="group absolute inset-0 w-full cursor-pointer"
        >
          <Image
            src="/video-poster.jpg"
            alt="Boatuneet explainer video preview"
            fill
            preload
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-slate-900/10 to-transparent transition-colors group-hover:bg-slate-900/10" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="w-9 h-9 text-blue-800 translate-x-0.5" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 text-slate-900 text-sm font-medium px-5 py-2 shadow">
            Watch how it works · 90 sec
          </span>
        </button>
      )}
    </div>
  );
}

export default function ComingSoon({ status }: { status: Status }) {
  const { ref: tiltRef, glowRef } = useScrollTilt<HTMLDivElement>();
  return (
    <main className="relative flex-1 min-h-screen overflow-x-clip text-slate-900">
      <AuroraBackground />

      <Header status={status} />

      {/* hero — centered */}
      <section className="px-6 pt-10 sm:pt-16 text-center flex flex-col items-center">
        <h1 className="flex flex-row flex-wrap items-center justify-center gap-1.5 sm:gap-4 lg:gap-6 text-[2.8rem] sm:text-6xl md:text-8xl lg:text-9xl leading-none">
          <span className="font-serif italic font-medium">Your boat.</span>
          <span className="font-sans font-extrabold tracking-tighter text-blue-800">
            Sold.
          </span>
        </h1>
        <p className="mt-6 max-w-md md:max-w-xl text-slate-600 text-sm sm:text-lg md:text-xl font-light leading-relaxed">
          Boatuneet is the selling platform for boat owners and dealers. It
          writes and verifies your listing, prices it against the market, finds
          and screens real buyers, and preps every document — you just sign.
        </p>

        <div className="mt-8 w-full max-w-lg">
          <WaitlistForm dark={false} status={status} />
        </div>
      </section>

      {/* video — large, under hero */}
      <section className="px-6 mt-8 sm:mt-10">
        <div className="relative max-w-6xl mx-auto">
          {/* full-width white glow behind the card's bottom edge; fades as the card flattens */}
          <div
            ref={glowRef}
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-90px] w-screen h-[340px]"
            style={{
              background:
                "radial-gradient(ellipse 60% 100% at 50% 55%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.75) 35%, rgba(255,255,255,0) 70%)",
              filter: "blur(12px)",
            }}
          />
          <div style={{ perspective: "1400px" }}>
            <div ref={tiltRef} style={{ willChange: "transform" }}>
              <ExplainerVideo />
            </div>
          </div>
          <p className="relative mt-4 text-sm text-slate-500 text-center">
            See a boat go from photos to a signed deal.
          </p>
        </div>
      </section>

      {/* steps */}
      <section className="px-6 mt-16 sm:mt-24 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left"
              >
                <div className="text-blue-800 text-xs font-semibold">
                  STEP {s.n}
                </div>
                <div className="font-semibold mt-1">{s.t}</div>
                <div className="text-slate-500 text-sm mt-1 leading-relaxed">
                  {s.d}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-slate-500 tracking-wide">
            <span>16 selling tools in one place</span>
            <span className="text-slate-300">·</span>
            <span>40+ marketplaces &amp; platforms covered</span>
            <span className="text-slate-300">·</span>
            <span>Every buyer KYC &amp; AML screened</span>
          </div>
        </div>
      </section>
    </main>
  );
}
