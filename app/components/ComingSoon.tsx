"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  CaretDown,
  ChartLineUp,
  Check,
  FileText,
  LockKey,
  Play,
  ShieldCheck,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WaitlistForm, type Status } from "./shared";

const CHAPTERS = [
  { id: "intro", label: "Intro" },
  { id: "fee", label: "The 2.5% advantage" },
  { id: "plan", label: "The 90-day plan" },
  { id: "trust", label: "Clarity & control" },
  { id: "questions", label: "Questions" },
];

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
      className="brand-link inline-flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4"
    >
      <Image
        src="/boatuneet-mark.png"
        alt=""
        aria-hidden="true"
        width={631}
        height={240}
        preload
        className="brand-mark h-6 w-auto sm:h-7"
      />
      <span className="brand-wordmark">
        <span className={`brand-wordmark__boat ${inverse ? "text-white" : "text-ink"}`}>Boat</span>
        <span className="brand-wordmark__uneet text-boat-blue">Uneet</span>
      </span>
    </a>
  );
}

function Header({ status, active }: { status: Status; active: number }) {
  const navigation = [
    { href: "#fee", label: "The fee", chapter: 1 },
    { href: "#plan", label: "The 90-day plan", chapter: 2 },
    { href: "#trust", label: "Why BoatUneet", chapter: 3 },
    { href: "#questions", label: "Questions", chapter: 4 },
  ];

  return (
    <header className={`site-header fixed inset-x-0 top-0 z-50 ${active > 0 ? "site-header--scrolled" : ""}`}>
      <div className="mx-auto flex h-[76px] w-full max-w-[1480px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Brand />

        <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => (
            <a key={item.href} className={`nav-link ${active === item.chapter ? "is-active" : ""}`} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        {status.isLive && (
          <span className="hidden items-center gap-2 text-xs font-medium text-slate-700 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
            {status.spotsLeft} early spots left
          </span>
        )}
      </div>
    </header>
  );
}

function ChapterDock({ active }: { active: number }) {
  const isLastChapter = active === CHAPTERS.length - 1;
  const nextIndex = isLastChapter ? 0 : active + 1;
  const next = CHAPTERS[nextIndex];

  return (
    <nav aria-label="Chapter navigation" className="chapter-dock hidden lg:grid">
      <a href={`#${CHAPTERS[active].id}`} className="chapter-dock__current">
        <span className="text-sm font-bold tabular-nums">{String(active + 1).padStart(2, "0")}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">{CHAPTERS[active].label}</span>
      </a>

      <div className="chapter-dock__progress" aria-label={`Chapter ${active + 1} of ${CHAPTERS.length}`}>
        {CHAPTERS.map((chapter, index) => (
          <a key={chapter.id} href={`#${chapter.id}`} aria-label={`Go to ${chapter.label}`} className="chapter-dock__track">
            <span style={{ transform: `scaleX(${index <= active ? 1 : 0})` }} />
          </a>
        ))}
      </div>

      <a
        href={`#${next.id}`}
        aria-label={isLastChapter ? "Back to top and restart the BoatUneet story" : `Continue to ${next.label}`}
        className="chapter-dock__next"
      >
        <span className="hidden xl:inline tabular-nums">{String(nextIndex + 1).padStart(2, "0")}</span>
        <span className="hidden xl:inline">{isLastChapter ? next.label : "Next"}</span>
        <span className="chapter-dock__button">
          <span className="hidden xl:inline">{isLastChapter ? "Back to top" : "Continue"}</span>
          {isLastChapter ? <ArrowUp weight="bold" aria-hidden="true" /> : <ArrowRight weight="bold" aria-hidden="true" />}
        </span>
      </a>
    </nav>
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
          <p className="chapter-kicker">02 · A clearer fee</p>
          <h2 className="chapter-title mt-4">Keep up to 7.5% more of the sale price.</h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Traditional broker commissions can reach 8–10%. BoatUneet&apos;s managed service uses a 2.5% success fee, so more of the asset&apos;s value stays with you.
          </p>
          <a href="#plan" className="chapter-link mt-8">
            See how the 90-day plan works <ArrowRight weight="bold" aria-hidden="true" />
          </a>
        </div>

        <div data-chapter-reveal className="fee-ledger" aria-label="Illustrative fee comparison">
          <div className="fee-ledger__row fee-ledger__row--primary">
            <div>
              <p>BoatUneet success fee</p>
              <span className="text-sm text-blue-700">Payable when your boat sells</span>
            </div>
            <div className="fee-ledger__number" aria-label="2.5 percent">
              <span data-count="2.5" aria-hidden="true">2.5</span>%
            </div>
          </div>
          <div className="fee-ledger__row">
            <div>
              <p>Broker benchmark</p>
              <span className="text-sm text-slate-500">Illustrative comparison</span>
            </div>
            <div className="fee-ledger__number fee-ledger__number--muted" aria-label="10 percent">
              <span data-count="10" aria-hidden="true">10</span>%
            </div>
          </div>
          <div className="fee-ledger__difference">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-sky-300">The difference you keep</p>
              <p className="mt-2 text-sm text-slate-300">On an illustrative €100,000 sale</p>
            </div>
            <strong>€7,500</strong>
          </div>
          <p className="px-6 pb-5 pt-4 text-xs leading-5 text-slate-500 sm:px-8">
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
        <div className="grid items-end gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div data-chapter-reveal>
            <p className="chapter-kicker text-sky-300">03 · The 90-day plan</p>
            <h2 className="chapter-title mt-4 text-white">A managed sale, from raw material to handover.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Five minutes of review each week keeps the sale moving. We coordinate the work around you and keep every decision visible.
            </p>
          </div>
          <div data-chapter-reveal>
            <ExplainerVideo />
          </div>
        </div>

        <ol data-chapter-reveal className="plan-steps mt-7">
          {STEPS.map((step) => (
            <li key={step.n} className="plan-step">
              <span className="plan-step__dot" aria-hidden="true" />
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-bold text-sky-300">{step.n}</span>
                <span className="text-xs text-slate-500">{step.time}</span>
              </div>
              <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-[13px] leading-5 text-slate-400">{step.description}</p>
            </li>
          ))}
        </ol>
        <p className="plan-note mt-4 text-xs leading-5 text-slate-400">
          The 90-day plan is a structured sales program, not a guaranteed sale date. Timing depends on the vessel, market, price and buyer readiness.
        </p>
      </div>
    </section>
  );
}

function TrustChapter() {
  return (
    <section id="trust" data-chapter className="chapter chapter--trust scroll-mt-0">
      <div className="chapter-inner grid items-center gap-12 lg:grid-cols-[0.74fr_1.26fr] lg:gap-20">
        <div data-chapter-reveal>
          <p className="chapter-kicker">04 · Clarity and control</p>
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
              <ArrowRight className="feature-row__arrow" size={20} aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuestionsChapter({ status }: { status: Status }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="questions" data-chapter className="chapter chapter--questions scroll-mt-0">
      <div className="chapter-inner flex min-h-full flex-col">
        <div className="grid items-start gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-20">
          <div data-chapter-reveal>
            <p className="chapter-kicker">05 · Straight answers</p>
            <h2 className="chapter-title mt-4">The details should be as transparent as the dashboard.</h2>
            <div className="mt-8 border-t border-slate-200">
              {FAQS.map(({ question, answer }, index) => {
                const isOpen = openFaq === index;
                const triggerId = `faq-trigger-${index}`;
                const panelId = `faq-panel-${index}`;

                return (
                  <div key={question} className={`faq-row ${isOpen ? "is-open" : ""}`}>
                    <button
                      id={triggerId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="faq-row__trigger"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      {question}
                      <CaretDown weight="bold" aria-hidden="true" />
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      aria-hidden={!isOpen}
                      className="faq-row__answer"
                    >
                      <div><p>{answer}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside data-chapter-reveal className="final-cta">
            <div className="final-cta__intro">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Early access</p>
              <h2 className="final-cta__title">See whether BoatUneet fits your boat.</h2>
              <p className="final-cta__copy">Join the early-access list. We&apos;ll email you at launch and when owner applications open.</p>
            </div>
            <div className="final-cta__form">
              <WaitlistForm dark status={status} />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default function ComingSoon({ status }: { status: Status }) {
  const { root, active } = useChapterMotion();

  return (
    <main ref={root} id="main-content" className="chapter-page text-ink">
      <a href="#intro" className="skip-link">Skip to main content</a>
      <Header status={status} active={active} />

      <section id="intro" data-chapter className="chapter chapter--hero scroll-mt-0">
        <Image
          data-hero-image
          src="/boatuneet-hero-marina.png"
          alt="White motor yacht moored in a Mediterranean marina"
          fill
          preload
          sizes="100vw"
          className="hero-photo object-cover"
        />
        <div className="hero-wash" aria-hidden="true" />
        <div className="chapter-inner relative z-10 flex min-h-full items-center pt-[88px]">
          <div className="hero-copy max-w-[610px] py-14 lg:py-20">
            <p data-hero-line className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 lg:hidden">01 · Intro</p>
            <h1 className="hero-heading font-semibold leading-[0.9] tracking-[-0.065em] text-ink">
              <span data-hero-line className="block">Sell your boat.</span>
              <span data-hero-line className="mt-3 block font-serif font-medium italic text-blue-600">Keep more of<br className="hidden sm:block" /> the price.</span>
            </h1>
            <p data-hero-line className="mt-7 max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
              BoatUneet prepares the listing, provides a market-informed price range, screens enquiries and coordinates the journey to closing—all in one managed 90-day sales plan, for a 2.5% success fee.
            </p>
            <ul data-hero-line className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-800" aria-label="BoatUneet highlights">
              {["No upfront service fee", "One transparent dashboard", "Support through closing"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check size={16} weight="bold" className="text-blue-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div data-hero-line className="mt-7 max-w-xl">
              <WaitlistForm compact dark={false} status={status} />
            </div>
          </div>
        </div>
      </section>

      <FeeChapter />
      <PlanChapter />
      <TrustChapter />
      <QuestionsChapter status={status} />
      <ChapterDock active={active} />
    </main>
  );
}
