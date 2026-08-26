"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChartLineUp,
  Check,
  FileText,
  LockKey,
  Play,
  ShieldCheck,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ValuationForm } from "./shared";
import { GL } from "./gl";

const YACHT_CARDS = Array.from({ length: 7 }, (_, i) => `/cards/card-${i + 1}.png`);

const STEPS = [
  {
    n: "01",
    title: "Prepare",
    time: "Weeks 1–2",
    description: "We turn your photos, documents and service history into a verified sale pack and market-informed price range.",
  },
  {
    n: "02",
    title: "Launch",
    time: "Weeks 2–3",
    description: "Your listing is distributed across relevant marketplaces while every enquiry returns to one managed inbox.",
  },
  {
    n: "03",
    title: "Qualify",
    time: "Weeks 3–8",
    description: "Buyer details are screened before you spend time on viewings, inspections or structured sea trials.",
  },
  {
    n: "04",
    title: "Close",
    time: "Weeks 9–13",
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

const FAQS = [
  {
    question: "What does the valuation include?",
    answer: "We ask a few quick questions about your boat — make, model, year, condition and location — then reply with a market-informed price range based on comparable listings. Free, with no obligation.",
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

      const feeSection = document.querySelector<HTMLElement>("#fee");
      const counters = document.querySelectorAll<HTMLElement>("[data-count]");
      if (feeSection && counters.length) {
        const runCounters = () => {
          gsap.fromTo(
            "[data-fee-fill]",
            { scaleX: 0 },
            { scaleX: 1, duration: 0.9, ease: "power3.out", transformOrigin: "left center" },
          );
          counters.forEach((counter) => {
            const target = Number(counter.dataset.count ?? 0);
            const value = { current: 0 };
            counter.textContent = target % 1 ? "0.0" : "0";
            gsap.to(value, {
              current: target,
              duration: 0.8,
              ease: "power2.out",
              onUpdate: () => {
                counter.textContent = target % 1 ? value.current.toFixed(1) : Math.round(value.current).toString();
              },
            });
          });
        };

        ScrollTrigger.create({
          trigger: feeSection,
          start: "top 80%",
          onEnter: runCounters,
          onEnterBack: runCounters,
        });
      }

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

  const onHero = active === 0;
  // Chapters 1 (fee) and 2 (plan) are dark; the header matches their background.
  const onDark = active === 1 || active === 2;

  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-50 ${onHero ? "" : onDark ? "site-header--dark" : "site-header--scrolled"}`}
    >
      <div className="mx-auto flex h-[76px] w-full max-w-[1480px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Brand inverse={onHero || onDark} />

        <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => (
            <a key={item.href} className={`nav-link ${active === item.chapter ? "is-active" : ""}`} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#valuation"
          className={`hidden items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:inline-flex ${onHero || onDark ? "bg-white text-slate-900 hover:bg-white/90" : "bg-slate-900 text-white hover:bg-slate-700"}`}
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
          <span className="absolute inset-0 bg-slate-950/25 transition-colors duration-300 group-hover:bg-slate-950/15" />
          <span className="video-play">
            <Play weight="fill" aria-hidden="true" />
          </span>
          <span className="absolute bottom-5 left-5 text-left text-white sm:bottom-7 sm:left-7">
            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-sky-200">The 90-day plan</span>
            <span className="mt-1 block text-lg font-semibold">Watch the journey · 90 sec</span>
          </span>
        </button>
      )}
    </div>
  );
}

function FeeChapter() {
  return (
    <section id="fee" data-chapter className="chapter chapter--fee scroll-mt-0">
      <div className="chapter-inner grid items-center gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div data-chapter-reveal>
          <p className="chapter-kicker text-sky-300">— A clearer fee</p>
          <h2 className="chapter-title mt-4 text-white">Keep up to 7.5% more of the sale price.</h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Traditional broker commissions can reach 8–10%. BoatUneet&apos;s managed service uses a 2.5% success fee, so more of the asset&apos;s value stays with you.
          </p>
          <a href="#plan" className="chapter-link mt-8">
            See how the 90-day plan works <ArrowRight weight="bold" aria-hidden="true" />
          </a>
        </div>

        <div data-chapter-reveal className="fee-compare" aria-label="Illustrative fee comparison">
          <div className="fee-compare__row">
            <div>
              <p className="fee-compare__label">BoatUneet success fee</p>
              <span className="fee-compare__note text-sky-300">Payable only when your boat sells</span>
            </div>
            <div className="fee-compare__number" aria-label="2.5 percent">
              <span data-count="2.5" aria-hidden="true">2.5</span>%
            </div>
          </div>
          <div className="fee-compare__bar" aria-hidden="true">
            <span data-fee-fill className="fee-compare__fill fee-compare__fill--blue" style={{ width: "25%" }} />
          </div>

          <div className="fee-compare__row">
            <div>
              <p className="fee-compare__label">Typical brokerage</p>
              <span className="fee-compare__note">Illustrative 8–10% benchmark</span>
            </div>
            <div className="fee-compare__number fee-compare__number--muted" aria-label="10 percent">
              <span data-count="10" aria-hidden="true">10</span>%
            </div>
          </div>
          <div className="fee-compare__bar" aria-hidden="true">
            <span data-fee-fill className="fee-compare__fill fee-compare__fill--muted" style={{ width: "100%" }} />
          </div>

          <p className="fee-compare__callout">
            On a €100,000 sale, <strong>€7,500</strong> stays with you.
          </p>
          <p className="mt-5 text-xs leading-5 text-slate-400">
            Comparison uses a 10% brokerage benchmark. Actual rates vary. Buyer-broker, tax, legal, survey, escrow and other third-party costs may apply. Final terms are disclosed before you commit.
          </p>
        </div>
      </div>
    </section>
  );
}

function PlanChapter() {
  return (
    <section id="plan" data-chapter className="chapter chapter--plan scroll-mt-0 text-white">
      <div className="chapter-inner flex flex-col justify-center">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div data-chapter-reveal>
            <p className="chapter-kicker text-sky-300">— The 90-day plan</p>
            <h2 className="chapter-title mt-5 text-white">A managed sale, from raw material to handover.</h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              Five minutes of review each week keeps the sale moving. We coordinate the work around you and keep every decision visible.
            </p>
          </div>
          <div data-chapter-reveal>
            <ExplainerVideo />
          </div>
        </div>

        <ol data-chapter-reveal className="plan-steps mt-16">
          {STEPS.map((step) => (
            <li key={step.n} className="plan-step">
              <span className="plan-step__dot" aria-hidden="true" />
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-bold text-sky-300">{step.n}</span>
                <span className="text-xs text-slate-500">{step.time}</span>
              </div>
              <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
            </li>
          ))}
        </ol>
        <p className="plan-note mt-8 text-xs leading-5 text-slate-400">
          The 90-day plan is a structured sales program, not a guaranteed sale date. Timing depends on the vessel, market, price and buyer readiness.
        </p>
      </div>
    </section>
  );
}

function TrustChapter() {
  return (
    <section id="trust" data-chapter className="chapter chapter--trust scroll-mt-0">
      <div className="chapter-inner grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div data-chapter-reveal>
          <p className="chapter-kicker">— Clarity and control</p>
          <h2 className="chapter-title mt-4">Know what is happening, what comes next and what it costs.</h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            A premium process should reduce uncertainty—not ask you to surrender control. BoatUneet gives the owner one clear record from valuation to settlement.
          </p>
          <div className="mt-8 border-l-2 border-blue-600 pl-5">
            <p className="font-serif text-2xl font-medium italic leading-snug text-blue-800">One plan. One fee. More of the price remains yours.</p>
          </div>
        </div>

        <div data-chapter-reveal className="feature-list">
          {FEATURES.map(({ icon: Icon, label, text }) => (
            <article key={label} className="feature-row">
              <span className="feature-row__icon"><Icon size={24} weight="regular" aria-hidden="true" /></span>
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{label}</h3>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">{text}</p>
              </div>
              <Check className="feature-row__arrow" size={20} weight="bold" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuestionsChapter() {
  return (
    <section id="questions" data-chapter className="chapter chapter--questions scroll-mt-0">
      <div className="chapter-inner flex min-h-full flex-col justify-center">
        <div data-chapter-reveal className="mx-auto max-w-4xl text-center">
          <p className="chapter-kicker">— Straight answers</p>
          <h2 className="chapter-title mx-auto mt-4">The details should be as transparent as the dashboard.</h2>
        </div>

        <div data-chapter-reveal className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {FAQS.map(({ question, answer }) => (
            <article key={question} className="faq-card text-left">
              <h3 className="text-base font-semibold leading-6 text-slate-950">{question}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
            </article>
          ))}
        </div>

        <aside id="valuation" data-chapter-reveal className="final-cta mt-10 grid w-full scroll-mt-24 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Free valuation</p>
            <h2 className="final-cta__title">Find out what your boat is worth today.</h2>
            <p className="final-cta__copy">Leave your email and we&apos;ll reply with a few quick questions, then a market-informed price range for your boat — free, no obligation.</p>
          </div>
          <div className="final-cta__form">
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
            {YACHT_CARDS.map((src) => (
              <div key={src} className="hero-card">
                <Image src={src} alt="" fill sizes="200px" />
              </div>
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
