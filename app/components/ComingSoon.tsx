"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

/** Two-stage scroll, driven by GSAP ScrollTrigger.
 *
 *  Stage 1 (rest): hero crisp, video tilted back below it.
 *  Stage 2 (scrolled): video risen up flat over a blurred hero, steps visible.
 *
 *  scrub keeps the timeline tied to scroll position; snap makes any scroll
 *  inside the range glide to one stage or the other, so there is no lingering
 *  half-blurred in-between state. Progress is 0 at scrollY 0, which also
 *  guarantees the hero is perfectly crisp on landing. */
function useScrollStages<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const riseRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const followRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No tilt is ever applied, so the page simply renders flat and static.
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.set(ref.current, { rotateX: 25, scale: 0.92 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          start: 0,
          // Clamp to what the page can actually scroll, otherwise the snap
          // aims past max scroll and stalls just short of stage 2.
          end: () => Math.min(650, ScrollTrigger.maxScroll(window)),
          invalidateOnRefresh: true,
          scrub: 0.4,
          snap: {
            snapTo: [0, 1],
            duration: { min: 0.35, max: 0.8 },
            delay: 0.05,
            ease: "power2.inOut",
          },
        },
      });
      tl.to(ref.current, { rotateX: 0, scale: 1 }, 0)
        .to(riseRef.current, { y: -140 }, 0)
        .to(followRef.current, { y: -140 }, 0)
        .to(heroRef.current, { filter: "blur(9px)", opacity: 0.6 }, 0)
        .to(glowRef.current, { opacity: 0 }, 0);
    });
    return () => ctx.revert();
  }, []);
  return { ref, glowRef, riseRef, heroRef, followRef };
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
  const { ref: tiltRef, glowRef, riseRef, heroRef, followRef } =
    useScrollStages<HTMLDivElement>();
  return (
    <main className="relative flex-1 min-h-screen overflow-x-clip text-slate-900">
      <AuroraBackground />

      <Header status={status} />

      {/* hero — centered; blurs away as the video rides up over it */}
      <section
        ref={heroRef}
        className="px-6 pt-10 sm:pt-16 text-center flex flex-col items-center"
        style={{ willChange: "filter, opacity" }}
      >
        <h1 className="flex flex-row flex-wrap items-center justify-center gap-1.5 sm:gap-4 lg:gap-6 text-[2.8rem] sm:text-6xl md:text-8xl lg:text-9xl leading-none">
          <span className="font-serif italic font-medium">Your boat.</span>
          <span className="font-sans font-extrabold tracking-tighter text-blue-800">
            Sold.
          </span>
        </h1>
        <p className="mt-6 max-w-xl md:max-w-3xl text-slate-600 text-sm sm:text-lg md:text-xl font-light leading-relaxed">
          Boatuneet is the selling platform for boat owners and dealers. It
          writes and verifies your listing, prices it against the market, finds
          and screens real buyers, and preps every document — you just sign.
        </p>

        <div className="mt-8 w-full max-w-lg">
          <WaitlistForm dark={false} status={status} />
        </div>
      </section>

      {/* video — large, under hero; rises over the blurring hero on scroll */}
      <section className="relative z-10 px-6 mt-8 sm:mt-10">
        <div
          ref={riseRef}
          className="relative max-w-6xl mx-auto"
          style={{ willChange: "transform" }}
        >
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

      {/* steps — compact full-width strip; follows the video's rise */}
      <section
        ref={followRef}
        className="mt-10 sm:mt-12 pb-20"
        style={{ willChange: "transform" }}
      >
        <div className="w-full border-y border-slate-200/80 bg-white/60 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-baseline gap-3 px-6 py-5">
                <span className="text-blue-800 text-xs font-semibold whitespace-nowrap">
                  STEP {s.n}
                </span>
                <div className="text-left">
                  <div className="font-semibold text-sm">{s.t}</div>
                  <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                    {s.d}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 px-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-slate-500 tracking-wide">
          <span>16 selling tools in one place</span>
          <span className="text-slate-300">·</span>
          <span>40+ marketplaces &amp; platforms covered</span>
          <span className="text-slate-300">·</span>
          <span>Every buyer KYC &amp; AML screened</span>
        </div>
      </section>
    </main>
  );
}
