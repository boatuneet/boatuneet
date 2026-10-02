"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import {
  Anchor,
  ArrowRight,
  CalendarCheck,
  ChartLineUp,
  Check,
  ClipboardText,
  Coins,
  FileText,
  HandCoins,
  Handshake,
  Info,
  LockKey,
  Percent,
  Play,
  Plus,
  Question,
  RocketLaunch,
  Sailboat,
  ShieldCheck,
  UserCheck,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ValuationForm } from "./shared";
import { GL } from "./gl";

const YACHT_CARDS = [
  { title: "2015 Pershing 92", price: "$2,825,000", specs: ["92 ft", "Mega Yacht"], place: "Fort Lauderdale, Florida" },
  { title: "2024 Benetti 34M Oasis", price: "$2,350,000", specs: ["112 ft", "Mega Yacht"], place: "Fort Lauderdale, Florida" },
  { title: "2012 Sunseeker Manhattan 73", price: "$1,399,000", specs: ["74.2 ft", "Motor Yacht"], place: "La Paz, Mexico" },
  { title: "2025 Riva 130' Bellissima", price: "$24,950,000", specs: ["130 ft", "Motor Yacht"], place: "Palm Beach, Florida" },
  { title: "2026 Sunreef 80 Power", price: "$12,574,088", specs: ["80 ft", "Catamaran"], place: "Gdansk, Poland" },
  { title: "2029 ISA Gran Turismo 66", price: "$74,685,998", specs: ["217.7 ft", "Mega Yacht"], place: "Ancona, Italy" },
  { title: "2001 Jongert 42T", price: "$8,052,084", specs: ["137.8 ft", "Sail Cruiser"], place: "Vilanova i la Geltrú, Barcelona" },
// v2 busts browser + image-optimizer caches from the previous card set.
].map((listing, i) => ({ ...listing, src: `/cards/card-${i + 1}.png?v=2` }));

const PLAN_WEEKS = 13;

const PHASES = [
  {
    title: "Prepare",
    start: 1,
    end: 2,
    icon: ClipboardText,
    color: "#0ea5e9",
    description: "We turn your photos, documents and service history into a verified sale pack and market-informed price range.",
  },
  {
    title: "Launch",
    start: 2,
    end: 3,
    icon: RocketLaunch,
    color: "#1559e7",
    description: "Your listing is distributed across relevant marketplaces while every enquiry returns to one managed inbox.",
  },
  {
    title: "Qualify",
    start: 3,
    end: 8,
    icon: UserCheck,
    color: "#8b5cf6",
    description: "Buyer details are screened before you spend time on viewings, inspections or structured sea trials.",
  },
  {
    title: "Close",
    start: 9,
    end: 13,
    icon: Handshake,
    color: "#10b981",
    description: "Documents, milestones and the applicable independent settlement arrangement are coordinated through handover.",
  },
];

const FEATURES = [
  {
    icon: ChartLineUp,
    label: "Market-informed pricing",
    text: "A practical range based on comparable listings and current demand—not emotion or guesswork.",
  },
  {
    icon: FileText,
    label: "One sale record",
    text: "Activity, enquiries, documents and next actions remain visible in one place throughout the sale.",
  },
  {
    icon: ShieldCheck,
    label: "Screened enquiries",
    text: "Buyer details are checked before they reach the viewing, inspection or sea-trial stage.",
  },
  {
    icon: LockKey,
    label: "Structured closing",
    text: "The applicable settlement provider, fees and jurisdiction-specific terms are disclosed before commitment.",
  },
];

/** Illustrative owner view for the trust chapter — labelled "Example" on the page. */
const RECORD_WEEK = 5;
const RECORD_ACTIVITY = [
  { title: "Enquiry screened", detail: "Buyer details checked before the viewing stage", when: "Today", icon: ShieldCheck, color: "#8b5cf6" },
  { title: "Viewing confirmed", detail: "Saturday, 10:00 at the marina", when: "Yesterday", icon: CalendarCheck, color: "#8b5cf6" },
  { title: "Listing live", detail: "Distributed across relevant marketplaces", when: "Week 2", icon: RocketLaunch, color: "#1559e7" },
  { title: "Price range set", detail: "€1.20M–€1.35M from comparable listings", when: "Week 1", icon: ChartLineUp, color: "#0ea5e9" },
];

const FAQS = [
  {
    question: "What does the valuation include?",
    answer: "Tell us the make, model and year — plus the hull identification number (HIN) if you have it to hand. We compare your boat against current comparable listings and email a market-informed price range. Free, with no obligation.",
  },
  {
    question: "What does the 2.5% fee cover?",
    answer: "The success fee covers BoatUneet's managed sale service and becomes payable when the boat sells. Buyer-broker, tax, legal, survey, escrow and other third-party costs are shown separately in the final terms.",
  },
  {
    question: "Is a sale guaranteed within 90 days?",
    answer: "No. The 90-day plan creates focus, weekly momentum and clear decision points. Final timing still depends on demand, pricing, vessel condition and buyer readiness.",
  },
  {
    question: "Do I pay anything upfront?",
    answer: "No. The valuation is free and there is no upfront fee. The 2.5% success fee becomes payable only when your boat sells.",
  },
  {
    question: "What do you need from me?",
    answer: "Your photos, documents and service history — we turn them into a verified sale pack. After that, about five minutes of review each week keeps the sale moving.",
  },
  {
    question: "How is settlement handled?",
    answer: "The applicable independent settlement arrangement, provider, fees and jurisdiction-specific terms are disclosed before you commit to a transaction.",
  },
];

function useChapterMotion() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    let frame = 0;

    const updateActiveChapter = () => {
      const marker = window.innerHeight * 0.46;
      let current = 0;

      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top <= marker) current = index;
      });

      const reachedPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      setActive(reachedPageEnd ? sections.length - 1 : current);
    };

    const scheduleActiveChapterUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateActiveChapter();
      });
    };

    updateActiveChapter();
    window.addEventListener("scroll", scheduleActiveChapterUpdate, { passive: true });
    window.addEventListener("resize", scheduleActiveChapterUpdate);
    window.addEventListener("hashchange", scheduleActiveChapterUpdate);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", scheduleActiveChapterUpdate);
        window.removeEventListener("resize", scheduleActiveChapterUpdate);
        window.removeEventListener("hashchange", scheduleActiveChapterUpdate);
      };
    }

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-image]", {
        opacity: 0,
        scale: 1.065,
        duration: 1.05,
        ease: "power3.out",
        clearProps: "opacity,transform",
      });

      const heroLineReveal = gsap.timeline({ paused: true }).fromTo(
        "[data-hero-line]",
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.72,
          stagger: 0.085,
          ease: "power3.out",
          clearProps: "opacity,transform",
        },
      );
      heroLineReveal.play();

      ScrollTrigger.create({
        trigger: "#intro",
        start: "top 55%",
        onEnterBack: () => heroLineReveal.restart(),
      });

      gsap.to("[data-hero-image]", {
        yPercent: 4,
        scale: 1.035,
        ease: "none",
        scrollTrigger: {
          trigger: "#intro",
          start: "top top",
          end: "bottom top",
          scrub: 0.55,
        },
      });

      sections.slice(1).forEach((section) => {
        const sectionIndex = sections.indexOf(section);
        const targets = section.querySelectorAll<HTMLElement>("[data-chapter-reveal]");
        if (!targets.length) return;

        const reveal = gsap.timeline({ paused: true }).fromTo(
          targets,
          { autoAlpha: 0, y: 46 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.78,
            stagger: 0.12,
            ease: "power3.out",
            clearProps: "opacity,visibility,transform",
          },
        );

        const reset = () => gsap.set(targets, { autoAlpha: 0, y: 46 });
        reset();

        ScrollTrigger.create({
          trigger: section,
          start: "top 88%",
          end: "bottom 12%",
          onEnter: () => reveal.restart(),
          onEnterBack: () => reveal.restart(),
          onLeave: reset,
          onLeaveBack: reset,
        });

        ScrollTrigger.create({
          trigger: section,
          start: "top 54%",
          end: "bottom 46%",
          onEnter: () => setActive(sectionIndex),
          onEnterBack: () => setActive(sectionIndex),
        });
      });

      ScrollTrigger.refresh();
    }, root);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleActiveChapterUpdate);
      window.removeEventListener("resize", scheduleActiveChapterUpdate);
      window.removeEventListener("hashchange", scheduleActiveChapterUpdate);
      ctx.revert();
    };
  }, []);

  return { root, active };
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <a
      href="#intro"
      aria-label="BoatUneet home"
      className="brand-link inline-flex min-h-11 items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4"
    >
      <Image
        src="/boatuneet-mark.png"
        alt=""
        aria-hidden="true"
        width={631}
        height={240}
        preload
        className={`brand-mark h-5 w-auto sm:h-6 ${inverse ? "brand-mark--inverse" : ""}`}
      />
      <span className="brand-wordmark">
        <span className={`brand-wordmark__boat ${inverse ? "text-white" : "text-ink"}`}>Boat</span>
        <span className={`brand-wordmark__uneet ${inverse ? "text-sky-300" : "text-boat-blue"}`}>Uneet</span>
      </span>
    </a>
  );
}

function Header({ active }: { active: number }) {
  const navigation = [
    { href: "#fee", label: "The fee", chapter: 1 },
    { href: "#plan", label: "The 90-day plan", chapter: 2 },
    { href: "#trust", label: "Why BoatUneet", chapter: 3 },
    { href: "#questions", label: "Questions", chapter: 4 },
  ];

  // Transparent over the black hero, light over every chapter after it.
  const onHero = active === 0;

  return (
    <header className={`site-header fixed inset-x-0 top-0 z-50 ${onHero ? "" : "site-header--scrolled"}`}>
      <div className="mx-auto flex h-[76px] w-full max-w-[1480px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Brand inverse={onHero} />

        <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => (
            <a key={item.href} className={`nav-link ${active === item.chapter ? "is-active" : ""}`} href={item.href}>
              {item.label}
            </a>
          ))}
          <a className="nav-link" href="/blog">Journal</a>
        </nav>

        <a
          href="#valuation"
          className={`hidden items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:inline-flex ${onHero ? "bg-white text-slate-900 hover:bg-white/90" : "bg-slate-900 text-white hover:bg-slate-700"}`}
        >
          Get a free valuation
          <ArrowRight weight="bold" aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}

function ExplainerVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="video-stage relative aspect-video overflow-hidden bg-slate-950">
      {playing ? (
        <video src="/coming-soon-video.mp4" poster="/video-poster.jpg" controls autoPlay className="h-full w-full object-cover" />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Play the 90-second BoatUneet explainer"
          className="group absolute inset-0 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-300"
        >
          <Image
            src="/video-poster.jpg"
            alt="BoatUneet 90-day sales plan explainer preview"
            fill
            sizes="(max-width: 1024px) 100vw, 56vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
          />
          <span className="video-shade" />
          <span className="video-play">
            <Play weight="fill" aria-hidden="true" />
          </span>
          <span className="video-pill">Watch the 90-second explainer</span>
        </button>
      )}
    </div>
  );
}

/** "armed" while an element waits below the fold for its entrance animation,
 *  "playing" once it scrolls into view. Server HTML, elements already on
 *  screen and reduced-motion users stay "static" — the finished state. */
function useEntrance(ref: React.RefObject<HTMLElement | null>, threshold: number) {
  const [stage, setStage] = useState<"static" | "armed" | "playing">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || el.getBoundingClientRect().top < window.innerHeight) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStage("armed");
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setStage("playing");
      observer.disconnect();
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return stage;
}

const EUR = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const BOATUNEET_RATE = 0.025;
const BROKER_RATES = [0.08, 0.09, 0.1];
const RANGE_MAX_RATE = 0.12; // the market bar spans 0–12%
const PRICE_MIN = 25_000;
const PRICE_MAX = 5_000_000;
const SLIDER_STEPS = 1000;

/** Log scale, so a €40k day boat and a €4M yacht both get usable slider
 *  travel. Rounded to two significant figures to read like a real price. */
function stepToPrice(step: number) {
  const raw = PRICE_MIN * (PRICE_MAX / PRICE_MIN) ** (step / SLIDER_STEPS);
  const unit = 10 ** (Math.floor(Math.log10(raw)) - 1);
  return Math.round(raw / unit) * unit;
}

function priceToStep(price: number) {
  const step = (SLIDER_STEPS * Math.log(price / PRICE_MIN)) / Math.log(PRICE_MAX / PRICE_MIN);
  return Math.min(SLIDER_STEPS, Math.max(0, Math.round(step) || 0));
}

const pct = (rate: number) => `${+(rate * 100).toFixed(1)}%`;
const onRange = (rate: number) => `${(rate / RANGE_MAX_RATE) * 100}%`;

/** Rolls a displayed number towards `target` instead of jumping. */
function useRolling(target: number) {
  const [value, setValue] = useState(target);
  const box = useRef({ v: target });

  useEffect(() => {
    const tween = gsap.to(box.current, {
      v: target,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.6,
      ease: "power3.out",
      onUpdate: () => setValue(box.current.v),
    });
    return () => {
      tween.kill();
    };
  }, [target]);

  return value;
}

function FeeChapter() {
  const [price, setPrice] = useState(250_000);
  const [brokerRate, setBrokerRate] = useState(0.1);
  const results = useRef<HTMLDivElement>(null);
  // Fees sit at zero while the section waits below the fold, then count up.
  const counted = useEntrance(results, 0.35) !== "armed";
  const priceId = useId();
  const rateId = useId();

  const brokerFee = useRolling(counted ? price * brokerRate : 0);
  const ourFee = useRolling(counted ? price * BOATUNEET_RATE : 0);
  const step = priceToStep(price);

  return (
    <section id="fee" data-chapter className="chapter chapter--fee scroll-mt-0">
      <div className="chapter-inner fee-layout">
        <div data-chapter-reveal className="panel panel--inputs">
          <div className="fee-tiles" aria-hidden="true">
            <span className="fee-tile fee-tile--a"><Sailboat size={26} weight="fill" /></span>
            <span className="fee-tile fee-tile--b"><Percent size={24} weight="bold" /></span>
            <span className="fee-tile fee-tile--c"><Anchor size={24} weight="bold" /></span>
          </div>

          <h2 className="ui-title">
            <span className="ui-title__soft">Keep up to 7.5%</span>
            <span className="block">more of the sale price.</span>
          </h2>
          <p className="ui-sub">Typical brokers take 8–10%. See what a 2.5% success fee leaves you with.</p>

          <div className="fee-group">
            <h3 className="fee-group__title">Your boat</h3>
            <label htmlFor={priceId} className="fee-label">Expected sale price</label>
            <div className="fee-input">
              <span aria-hidden="true">€</span>
              <input
                id={priceId}
                inputMode="numeric"
                autoComplete="off"
                value={price ? price.toLocaleString("en-IE") : ""}
                onChange={(e) => setPrice(Math.min(Number(e.target.value.replace(/\D/g, "")), 99_000_000))}
                onBlur={() => setPrice((p) => Math.max(p, 1_000))}
              />
            </div>
            <input
              type="range"
              min={0}
              max={SLIDER_STEPS}
              value={step}
              onChange={(e) => setPrice(stepToPrice(Number(e.target.value)))}
              aria-label="Expected sale price"
              aria-valuetext={EUR.format(price)}
              className="fee-slider"
              style={{ "--p": `${(step / SLIDER_STEPS) * 100}%` } as React.CSSProperties}
            />
            <div className="fee-scale" aria-hidden="true">
              <span>{EUR.format(PRICE_MIN)}</span>
              <span>{EUR.format(PRICE_MAX)}</span>
            </div>
          </div>

          <div className="fee-group">
            <h3 className="fee-group__title">Compare with</h3>
            <p id={rateId} className="fee-label">Typical broker commission</p>
            <div
              className="fee-segment"
              role="group"
              aria-labelledby={rateId}
              style={{ "--i": BROKER_RATES.indexOf(brokerRate), "--n": BROKER_RATES.length } as React.CSSProperties}
            >
              {BROKER_RATES.map((rate) => (
                <button key={rate} type="button" aria-pressed={brokerRate === rate} onClick={() => setBrokerRate(rate)}>
                  {pct(rate)}
                </button>
              ))}
            </div>
          </div>

          <p className="panel-note">
            <Info size={16} weight="bold" aria-hidden="true" />
            <span>
              Illustrative comparison. Actual broker rates vary. Buyer-broker, tax, legal, survey, escrow and other third-party costs may apply. Final terms are disclosed before you commit.
            </span>
          </p>
        </div>

        <div ref={results} data-chapter-reveal className="fee-results">
          <div className="fee-hero-card">
            <p className="panel-head">
              <span className="panel-badge panel-badge--light"><HandCoins size={18} weight="bold" aria-hidden="true" /></span>
              More in your pocket
            </p>
            <p className="fee-hero-card__value">{EUR.format(brokerFee - ourFee)}</p>
            <p className="fee-hero-card__sub">
              kept on a {EUR.format(price)} sale, compared with a {pct(brokerRate)} broker
            </p>
            <ChartLineUp className="fee-hero-card__art" weight="bold" aria-hidden="true" />
          </div>

          <div className="panel panel--results">
            <p className="panel-head">
              <span className="panel-badge"><Coins size={18} weight="bold" aria-hidden="true" /></span>
              Your sale proceeds
            </p>
            <div className="fee-stats">
              <div>
                <strong>{EUR.format(ourFee)}</strong>
                <span>BoatUneet fee</span>
              </div>
              <div>
                <strong className="is-muted">{EUR.format(brokerFee)}</strong>
                <span>Broker commission</span>
              </div>
              <div>
                <strong>€0</strong>
                <span>Paid upfront</span>
              </div>
            </div>
            <dl className="fee-rows">
              <div>
                <dt>You receive with BoatUneet</dt>
                <dd className="is-good">{EUR.format(price - ourFee)}</dd>
              </div>
              <div>
                <dt>You receive with a {pct(brokerRate)} broker</dt>
                <dd>{EUR.format(price - brokerFee)}</dd>
              </div>
            </dl>
          </div>

          <div className="fee-range">
            <div className="fee-range__meta">
              <div>
                <span>How 2.5% compares</span>
                <strong className="is-good">Well below market</strong>
              </div>
              <div>
                <span>Typical brokerage</span>
                <strong>8–10%</strong>
              </div>
              <div>
                <span>BoatUneet</span>
                <strong>2.5%</strong>
              </div>
            </div>
            <div className="fee-range__track" aria-hidden="true">
              <span className="fee-range__band" style={{ left: onRange(0.08), width: onRange(0.02) }} />
              <span className="fee-range__broker" style={{ left: onRange(brokerRate) }} />
              <span className="fee-range__you" style={{ left: counted ? onRange(BOATUNEET_RATE) : "0%" }}>
                <span>You</span>
              </span>
            </div>
            <div className="fee-range__ticks" aria-hidden="true">
              {[0, 0.05, 0.1].map((rate) => (
                <span key={rate} style={{ left: onRange(rate) }}>{pct(rate)}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlanChapter() {
  const board = useRef<HTMLDivElement>(null);
  const entrance = useEntrance(board, 0.4);

  return (
    <section id="plan" data-chapter className="chapter chapter--plan scroll-mt-0">
      <div className="chapter-inner plan-layout">
        <div data-chapter-reveal className="plan-intro">
          <h2 className="ui-title">
            <span className="ui-title__soft">A managed sale,</span>
            <span className="block">from raw material to handover.</span>
          </h2>
          <p className="ui-sub">
            Five minutes of review each week keeps the sale moving. We coordinate the work around you and keep every decision visible.
          </p>
          <dl className="plan-stats">
            <div>
              <dt>Weeks, start to handover</dt>
              <dd>13</dd>
            </div>
            <div>
              <dt>Managed phases</dt>
              <dd>4</dd>
            </div>
            <div>
              <dt>Of your time each week</dt>
              <dd>5 min</dd>
            </div>
          </dl>
          <ExplainerVideo />
        </div>

        <div
          ref={board}
          data-chapter-reveal
          className={`panel plan-board is-${entrance}`}
          style={{ "--weeks": PLAN_WEEKS } as React.CSSProperties}
        >
          <div className="plan-board__head">
            <p className="panel-head">
              <span className="panel-badge"><CalendarCheck size={18} weight="bold" aria-hidden="true" /></span>
              Your sale timeline
            </p>
            <span className="plan-board__chip">Weeks 1–{PLAN_WEEKS}</span>
          </div>

          <div className="plan-board__body">
            <div className="plan-board__chart" aria-hidden="true">
              <span className="plan-board__playhead" />
            </div>
            <div className="plan-ruler" aria-hidden="true">
              <span>Week</span>
              <div>
                {Array.from({ length: PLAN_WEEKS }, (_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
            </div>
            <ol className="plan-rows">
              {PHASES.map(({ title, start, end, icon: Icon, color, description }) => (
                <li
                  key={title}
                  className="plan-row"
                  style={{ "--start": start - 1, "--len": end - start + 1, "--c": color } as React.CSSProperties}
                >
                  <div className="plan-row__text">
                    <div className="plan-row__head">
                      <span className="plan-row__icon"><Icon size={16} weight="bold" aria-hidden="true" /></span>
                      <h3>{title}</h3>
                      <span className="plan-row__weeks">Weeks {start}–{end}</span>
                    </div>
                    <p>{description}</p>
                  </div>
                  <div className="plan-row__track" aria-hidden="true">
                    <span className="plan-row__bar" />
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="panel-note">
            <Info size={16} weight="bold" aria-hidden="true" />
            <span>
              The 90-day plan is a structured sales program, not a guaranteed sale date. Timing depends on the vessel, market, price and buyer readiness.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustChapter() {
  const record = useRef<HTMLElement>(null);
  const entrance = useEntrance(record, 0.35);

  return (
    <section id="trust" data-chapter className="chapter chapter--trust scroll-mt-0">
      <div className="chapter-inner split-layout">
        <div data-chapter-reveal>
          <h2 className="ui-title">
            <span className="ui-title__soft">Know what is happening,</span>
            <span className="block">what comes next and what it costs.</span>
          </h2>
          <p className="ui-sub">
            A premium process should reduce uncertainty—not ask you to surrender control. BoatUneet gives the owner one clear record from valuation to settlement.
          </p>
          <ul className="trust-features">
            {FEATURES.map(({ icon: Icon, label, text }) => (
              <li key={label}>
                <span className="trust-features__icon"><Icon size={18} weight="bold" aria-hidden="true" /></span>
                <h3>{label}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <figure ref={record} data-chapter-reveal className={`panel record is-${entrance}`} aria-label="Example sale record">
          <div className="record__head">
            <p className="panel-head">
              <span className="panel-badge"><FileText size={18} weight="bold" aria-hidden="true" /></span>
              Sale record
            </p>
            <span className="record__chip">Example</span>
          </div>

          <div className="record__boat">
            <span>2012 Sunseeker Manhattan 73</span>
            <span>Week {RECORD_WEEK} of {PLAN_WEEKS}</span>
          </div>
          <div className="record__progress" aria-hidden="true">
            {PHASES.map(({ title, start, end, color }, i) => (
              <span
                key={title}
                style={{
                  "--len": end - start + 1,
                  "--c": color,
                  "--i": i,
                  "--fill": Math.min(1, Math.max(0, (RECORD_WEEK - start + 1) / (end - start + 1))),
                } as React.CSSProperties}
              >
                <span />
              </span>
            ))}
          </div>
          <div className="record__phases">
            {PHASES.map(({ title, start, end }) => (
              <span
                key={title}
                style={{ "--len": end - start + 1 } as React.CSSProperties}
                className={RECORD_WEEK >= start && RECORD_WEEK <= end ? "is-current" : undefined}
              >
                {title}
              </span>
            ))}
          </div>

          <ul className="record__feed">
            {RECORD_ACTIVITY.map(({ title, detail, when, icon: Icon, color }, i) => (
              <li key={title} style={{ "--c": color, "--i": i } as React.CSSProperties}>
                <span className="record__icon"><Icon size={16} weight="bold" aria-hidden="true" /></span>
                <span>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </span>
                <time>{when}</time>
              </li>
            ))}
          </ul>

          <div className="record__next">
            <span>
              <span className="record__next-label">Next up</span>
              Approve the sea-trial request
            </span>
            <span className="record__next-action" aria-hidden="true">Review</span>
          </div>

          <dl className="record__cost">
            <div>
              <dt>Fee on completion</dt>
              <dd>2.5%</dd>
            </div>
            <div>
              <dt>Paid so far</dt>
              <dd>€0</dd>
            </div>
          </dl>
        </figure>
      </div>
    </section>
  );
}

function QuestionsChapter() {
  return (
    <section id="questions" data-chapter className="chapter chapter--questions scroll-mt-0">
      <div className="chapter-inner questions-layout">
        <div data-chapter-reveal className="questions-intro">
          <h2 className="ui-title">
            <span className="ui-title__soft">Straight answers,</span>
            <span className="block">as transparent as the dashboard.</span>
          </h2>
          <p className="ui-sub">What owners usually ask before they list.</p>
        </div>

        <div data-chapter-reveal className="panel faq-panel">
          <p className="panel-head">
            <span className="panel-badge"><Question size={18} weight="bold" aria-hidden="true" /></span>
            Common questions
          </p>
          <div className="faq-list">
            {FAQS.map(({ question, answer }, i) => (
              <details key={question} name="faq" open={i === 0} className="faq-item">
                <summary>
                  <span>{question}</span>
                  <span className="faq-item__icon"><Plus size={14} weight="bold" aria-hidden="true" /></span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
          <a href="/blog" className="faq-panel__link">
            More answers in the Journal <ArrowRight weight="bold" aria-hidden="true" />
          </a>
        </div>

        <aside id="valuation" data-chapter-reveal className="cta-card scroll-mt-24">
          <p className="panel-head">
            <span className="panel-badge panel-badge--light"><Sailboat size={18} weight="fill" aria-hidden="true" /></span>
            Free valuation
          </p>
          <h2 className="cta-card__title">Find out what your boat is worth today.</h2>
          <p className="cta-card__copy">
            Tell us about your boat and where to send the result. We&apos;ll reply with a market-informed price range based on comparable listings — free, no obligation.
          </p>
          <div className="cta-card__form">
            <ValuationForm compact dark />
          </div>
        </aside>
      </div>
    </section>
  );
}

export default function ComingSoon() {
  const { root, active } = useChapterMotion();
  const [ctaHovering, setCtaHovering] = useState(false);

  return (
    <main ref={root} id="main-content" className="chapter-page text-ink">
      <a href="#intro" className="skip-link">Skip to main content</a>
      <Header active={active} />

      <section id="intro" data-chapter className="chapter chapter--hero scroll-mt-0">
        <div data-hero-image className="absolute inset-0" aria-hidden="true">
          <GL hovering={ctaHovering} />
        </div>
        <div className="hero-cards" aria-hidden="true">
          <div data-hero-line className="hero-cards__row">
            {YACHT_CARDS.map(({ src, title, price, specs, place }) => (
              <article key={src} className="hero-card">
                <div className="hero-card__media">
                  <Image src={src} alt="" fill sizes="240px" />
                  <span className="hero-card__badge">For sale</span>
                </div>
                <div className="hero-card__body">
                  <h3 className="hero-card__title">{title}</h3>
                  <p className="hero-card__price">{price}</p>
                  <ul className="hero-card__specs">
                    {specs.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                  <p className="hero-card__place">{place}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="chapter-inner pointer-events-none relative z-10 flex min-h-full items-center justify-center pt-[88px] pb-32 lg:pb-40">
          <div className="hero-copy pointer-events-auto mx-auto max-w-[840px] py-10 text-center lg:py-14">
            <p data-hero-line className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-sky-300 lg:hidden">— Intro</p>
            <h1 className="hero-heading text-white">
              <span data-hero-line className="hero-heading__strong block drop-shadow-2xl">Sell your boat.</span>
              <span data-hero-line className="hero-heading__light hero-gradient-text mt-2 block sm:whitespace-nowrap">Keep more of the price.</span>
            </h1>
            <p data-hero-line className="mx-auto mt-6 max-w-[800px] text-base font-light leading-7 text-white/70 sm:text-lg">
              A managed 90-day sale — market-informed pricing, screened buyers and coordinated closing — for a 2.5% success fee instead of the typical 8–10% brokerage. Start with a free valuation.
            </p>
            <ul data-hero-line className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-white/80" aria-label="BoatUneet highlights">
              {["Free valuation range", "No upfront fee", "Pay 2.5% only when it sells"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check size={16} weight="bold" className="text-sky-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div data-hero-line className="mx-auto mt-8 max-w-xl">
              <ValuationForm compact dark onButtonHover={setCtaHovering} />
            </div>
          </div>
        </div>
      </section>

      <FeeChapter />
      <PlanChapter />
      <TrustChapter />
      <QuestionsChapter />
    </main>
  );
}
