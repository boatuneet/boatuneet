"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Anchor,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  Clock,
  DownloadSimple,
  FileText,
  Flag,
  Globe,
  Info,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  UploadSimple,
  Warning,
  X,
} from "@phosphor-icons/react";
import type {
  BoatFacts,
  Decision,
  Listing,
  Match,
  Workspace,
} from "@/lib/listing-lab/types";
import { emptyFacts } from "@/lib/listing-lab/types";
import {
  audit,
  buildMatches,
  discoveryQueries,
  isStale,
  money,
  offerLabel,
  safeUrl,
  sourceName,
  updateListing,
} from "@/lib/listing-lab/engine";
import {
  csvExport,
  extractFacts,
  MAX_IMPORT_BYTES,
  parseWorkspace,
  validateListing,
} from "@/lib/listing-lab/import";
import {
  blankWorkspace,
  researchCase,
  syntheticCase,
} from "@/lib/listing-lab/cases";
import type { SearchLead } from "@/lib/listing-lab/search";

type View =
  | "overview"
  | "advertisements"
  | "discover"
  | "history"
  | "experiment";
const STORAGE = "uneet-listing-lab-v1";
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const bandLabel = (match: Match) =>
  ({
    reference: "Reference",
    strong: match.decision === "confirm" ? "Linked by you" : "Strong link",
    review: "Needs review",
    excluded: "Excluded",
  })[match.band];

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`ll-badge ll-${tone}`}>{children}</span>;
}
function External({ url, children }: { url: string; children: ReactNode }) {
  return (
    <a
      href={safeUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="ll-external"
    >
      {children}
      <ArrowUpRight size={15} aria-hidden />
    </a>
  );
}
function download(name: string, content: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ListingLab() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([researchCase()]);
  const [activeId, setActiveId] = useState("sunseeker-research");
  const [loaded, setLoaded] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<View>("overview");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    listing?: Listing;
    url?: string;
  } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const workspace = workspaces.find((w) => w.id === activeId) ?? workspaces[0];
  const matches = useMemo(() => buildMatches(workspace), [workspace]);
  const findings = useMemo(() => audit(workspace), [workspace]);
  const reference = workspace.listings.find(
    (l) => l.id === workspace.referenceId,
  );
  const linked = matches.filter((m) =>
    ["reference", "strong"].includes(m.band),
  );
  const pending = matches.filter((m) => m.band === "review");
  const detail = matches.find((m) => m.listing.id === selected);
  const actionable = findings.filter(
    (f) => f.severity === "attention" && !workspace.resolved.includes(f.id),
  );
  const changed = workspace.listings.reduce((n, l) => n + l.history.length, 0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        if (raw.length > 4_000_000)
          throw new Error("Saved data exceeds the local limit.");
        const saved = JSON.parse(raw);
        if (
          !Array.isArray(saved.workspaces) ||
          !saved.workspaces.length ||
          saved.workspaces.length > 12
        )
          throw new Error("Invalid saved workspace.");
        const restored = saved.workspaces.map((w: unknown) =>
          parseWorkspace(JSON.stringify(w)),
        );
        setWorkspaces(restored);
        setActiveId(
          restored.some((w: Workspace) => w.id === saved.activeId)
            ? saved.activeId
            : restored[0].id,
        );
      }
    } catch {
      setStorageBlocked(true);
      setSaveError(
        "Saved reports could not be read. Existing saved data has been left intact; this session is temporary. Export your work before closing.",
      );
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded || storageBlocked) return;
    try {
      const serialized = JSON.stringify({ workspaces, activeId });
      if (serialized.length > 4_000_000)
        throw new Error("Local storage limit reached.");
      localStorage.setItem(STORAGE, serialized);
      setSaveError("");
    } catch {
      setSaveError(
        "Your browser could not save this report. Export it before closing this tab.",
      );
    }
  }, [workspaces, activeId, loaded, storageBlocked]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  useEffect(() => {
    if (
      selected &&
      view === "advertisements" &&
      window.matchMedia("(max-width: 1000px)").matches
    ) {
      const panel = document.getElementById("ll-evidence");
      panel?.scrollIntoView({ block: "start", behavior: "instant" });
      panel?.focus({ preventScroll: true });
    }
  }, [selected, view]);

  function change(next: Workspace) {
    setWorkspaces((all) => all.map((w) => (w.id === workspace.id ? next : w)));
  }
  function openCase(kind: "research" | "synthetic" | "personal") {
    const next =
      kind === "research"
        ? researchCase()
        : kind === "synthetic"
          ? syntheticCase()
          : blankWorkspace();
    if (!workspaces.some((w) => w.id === next.id))
      setWorkspaces((all) => [...all, next]);
    setActiveId(next.id);
    setView("overview");
    setSelected(null);
    setFilter("all");
  }
  function decide(id: string, decision?: Decision) {
    const decisions = { ...workspace.decisions };
    if (decision) decisions[id] = decision;
    else delete decisions[id];
    change({ ...workspace, decisions, resolved: [] });
    setNotice(
      decision === "confirm"
        ? "Advertisement linked. Findings have been recalculated."
        : decision === "reject"
          ? "Advertisement excluded. You can undo this decision."
          : "Decision undone. Evidence rules apply again.",
    );
  }
  function saveListing(listing: Listing) {
    const duplicate = workspace.listings.find(
      (l) =>
        l.id !== listing.id &&
        safeUrl(l.url).replace(/\/$/, "") ===
          safeUrl(listing.url).replace(/\/$/, ""),
    );
    if (duplicate)
      throw new Error(
        "This URL is already in the report. Edit its existing observation instead.",
      );
    if (!editor?.listing && workspace.listings.length >= 200)
      throw new Error("This report has reached the 200-observation limit.");
    let next = updateListing(workspace, listing);
    if (!workspace.referenceId)
      next = {
        ...next,
        referenceId: listing.id,
        name:
          [listing.data.make, listing.data.model].filter(Boolean).join(" ") ||
          "My boat report",
      };
    if (
      new TextEncoder().encode(JSON.stringify(next)).length > MAX_IMPORT_BYTES
    ) {
      throw new Error(
        "This report has reached the 1 MB export limit. Export it before recording more observations.",
      );
    }
    change(next);
    setEditor(null);
    setSelected(listing.id);
    setView("advertisements");
    setFilter("all");
    setNotice(
      "Observation saved. Matching and findings have been recalculated.",
    );
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES)
        throw new Error("The report exceeds the 1 MB import limit.");
      if (workspaces.length >= 12)
        throw new Error(
          "This browser already has 12 reports. Use another browser profile for additional pilot cases.",
        );
      const report = parseWorkspace(await file.text());
      // Import as a separate copy, never overwrite local work.
      const next = {
        ...report,
        id: `import-${crypto.randomUUID()}`,
        name: `${report.name.slice(0, 100)} (imported)`,
      };
      setWorkspaces((all) => [...all, next]);
      setActiveId(next.id);
      setSelected(null);
      setView("overview");
      setNotice("Report imported as a separate copy.");
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Could not import the report.",
      );
    }
    if (importRef.current) importRef.current.value = "";
  }
  function focusListing(id: string) {
    setSelected(id);
    setView("advertisements");
    setFilter("all");
  }

  return (
    <div className="ll-app">
      <a href="#lab-main" className="skip-link">
        Skip to report
      </a>
      <aside className="ll-sidebar">
        <a href="/lab" className="ll-brand" aria-label="BoatUneet Listing Lab">
          <Image
            src="/boatuneet-mark.png"
            alt=""
            width={631}
            height={240}
            className="ll-brand-mark"
          />
          <span className="brand-wordmark">
            <span className="brand-wordmark__boat">Boat</span>
            <span className="brand-wordmark__uneet">Uneet</span>
          </span>
        </a>
        <div className="ll-product">
          LISTING INTELLIGENCE <span>LAB</span>
        </div>
        <div className="ll-nav-label">WORKSPACE</div>
        <nav aria-label="Workspace">
          {(
            [
              ["overview", "Boat report", FileText],
              ["advertisements", "Advertisements", Globe],
              ["discover", "Find more listings", MagnifyingGlass],
              ["history", "Observation history", Clock],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              className={`ll-nav-item ${view === id ? "active" : ""}`}
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "advertisements" && <small>{matches.length}</small>}
            </button>
          ))}
        </nav>
        <div className="ll-nav-label">TEST CASES</div>
        <button
          className={`ll-case ${workspace.id === "sunseeker-research" ? "active" : ""}`}
          onClick={() => openCase("research")}
        >
          <span className="ll-case-dot" />
          <span>
            Sunseeker 76<small>Real research case</small>
          </span>
        </button>
        <button
          className={`ll-case ${workspace.id === "synthetic-axopar" ? "active" : ""}`}
          onClick={() => openCase("synthetic")}
        >
          <span className="ll-case-dot synthetic" />
          <span>
            Axopar 37<small>Synthetic stress test</small>
          </span>
        </button>
        <button
          className={`ll-case ${workspace.id === "personal" ? "active" : ""}`}
          onClick={() => openCase("personal")}
        >
          <Plus size={16} />
          <span>
            Your own boat<small>Start with a listing</small>
          </span>
        </button>
        {workspaces
          .filter((w) => w.id.startsWith("import-"))
          .map((w) => (
            <button
              key={w.id}
              className={`ll-case ${workspace.id === w.id ? "active" : ""}`}
              onClick={() => {
                setActiveId(w.id);
                setView("overview");
                setSelected(null);
              }}
            >
              <FileText size={16} />
              <span>{w.name}</span>
            </button>
          ))}
        <div className="ll-sidebar-bottom">
          <button
            className={`ll-nav-item ${view === "experiment" ? "active" : ""}`}
            onClick={() => setView("experiment")}
          >
            <SlidersHorizontal size={19} />
            About this experiment
          </button>
          <a href="/" className="ll-launch-link">
            Original launch page <ArrowUpRight size={16} />
          </a>
          <div className="ll-local">
            <span /> Local pilot · no account needed
          </div>
        </div>
      </aside>

      <div className="ll-main-shell">
        <header className="ll-topbar">
          <div>
            UNEET LAB <span>/</span>{" "}
            <strong>
              {view === "experiment" ? "The experiment" : "Owner workspace"}
            </strong>
          </div>
          <div className="ll-topbar-right">
            <span className="ll-save-state">
              <span className={saveError ? "ll-save-error" : ""} />
              {!loaded
                ? "Loading local reports"
                : saveError
                  ? "Not saved"
                  : "Saved in this browser"}
            </span>
            <span className="ll-avatar" aria-label="Local workspace">
              U
            </span>
          </div>
        </header>
        <main id="lab-main" className="ll-main" tabIndex={-1}>
          {saveError && (
            <div className="ll-alert" role="alert">
              <Warning size={20} />
              {saveError}
            </div>
          )}
          <div className="ll-page-head">
            <div>
              <div className="ll-eyebrow">
                {view === "experiment"
                  ? "TEST THE ASSUMPTION"
                  : "YOUR BOAT. THE FULLER PICTURE."}
              </div>
              <h1>
                {view === "experiment"
                  ? "A small test. A useful answer."
                  : reference
                    ? workspace.name
                    : "Start with a boat you know."}
              </h1>
              <p>
                {view === "experiment"
                  ? "Four directions considered. One working experiment."
                  : reference
                    ? `${reference.data.year ?? "Year unknown"} · ${reference.data.location || "Location not recorded"} · ${offerLabel(reference.data.offer)}`
                    : "Bring one reference advertisement. Build a report from evidence you can inspect."}
              </p>
            </div>
            <div className="ll-head-actions">
              <button
                className="ll-btn ll-btn-secondary"
                onClick={() => setExportOpen(true)}
                disabled={!loaded}
              >
                <DownloadSimple size={17} />
                Export
              </button>
              <button
                className="ll-btn ll-btn-primary"
                onClick={() => setEditor({})}
                disabled={!loaded}
              >
                <Plus size={18} />
                {reference ? "Add advertisement" : "Add your reference"}
              </button>
            </div>
          </div>
          {view !== "experiment" && (
            <div
              className={`ll-provenance ${workspace.kind === "synthetic" ? "is-synthetic" : ""}`}
            >
              <Info size={17} />
              <span>
                {workspace.kind === "research" ? (
                  <>
                    <strong>Real research case</strong> · Seed research from 21
                    Sep 2026; later edits are manual. Opening the report does
                    not recheck websites.
                  </>
                ) : workspace.kind === "synthetic" ? (
                  <>
                    <strong>Synthetic test case</strong> · Invented boats,
                    prices and URLs for testing matching and discrepancies.
                  </>
                ) : (
                  <>
                    <strong>Your observations</strong> · Saved locally in this
                    browser. Websites are not automatically fetched or
                    monitored.
                  </>
                )}
              </span>
            </div>
          )}

          {!reference && view !== "experiment" ? (
            <section className="ll-empty-start">
              <div className="ll-empty-icon">
                <Anchor size={36} />
              </div>
              <h2>One reference. A clearer picture.</h2>
              <p>
                Paste details from an advertisement, review the extracted
                fields, then compare other listings against it.
              </p>
              <button
                className="ll-btn ll-btn-primary"
                onClick={() => setEditor({})}
              >
                Add your reference <ArrowRight size={18} />
              </button>
              <button
                className="ll-text-button"
                onClick={() => openCase("research")}
              >
                Explore the Sunseeker example first
              </button>
              <div className="ll-start-steps">
                <span>
                  <b>01</b> Identify your boat
                </span>
                <span>
                  <b>02</b> Review advertisements
                </span>
                <span>
                  <b>03</b> Know what to clarify
                </span>
              </div>
            </section>
          ) : null}

          {reference && view === "overview" && (
            <>
              <div className="ll-stats">
                <Stat
                  label="Advertisements in this report"
                  number={matches.length}
                  detail={`${workspace.listings.length - matches.length} localized variant grouped`}
                  icon={<Globe size={20} />}
                />
                <Stat
                  label="Linked to your reference"
                  number={linked.length}
                  detail="Includes the reference · evidence-based"
                  icon={<ShieldCheck size={20} />}
                />
                <Stat
                  label="Candidates to review"
                  number={pending.length}
                  detail="Excluded from the linked-boat findings"
                  icon={<MagnifyingGlass size={20} />}
                />
              </div>
              <div className="ll-overview-grid">
                <section className="ll-panel ll-findings">
                  <div className="ll-section-heading">
                    <div>
                      <div className="ll-eyebrow">WHAT DESERVES A LOOK</div>
                      <h2>
                        {actionable.length
                          ? `${actionable.length} thing${actionable.length === 1 ? "" : "s"} to clarify`
                          : "Your report, without the guesswork"}
                      </h2>
                    </div>
                    <Badge tone="amber">
                      {findings.length} observation
                      {findings.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {findings.length ? (
                    findings.map((f) => (
                      <article
                        key={f.id}
                        className={`ll-finding ${workspace.resolved.includes(f.id) ? "reviewed" : ""}`}
                      >
                        <span className={`ll-finding-icon ${f.severity}`}>
                          {f.severity === "attention" ? (
                            <Flag size={18} />
                          ) : (
                            <Info size={18} />
                          )}
                        </span>
                        <div>
                          <h3>{f.title}</h3>
                          <p>{f.detail}</p>
                          <div className="ll-next-action">
                            <ArrowRight size={14} />
                            <span>{f.action}</span>
                          </div>
                          <div className="ll-finding-actions">
                            <button
                              className="ll-text-button"
                              onClick={() => focusListing(f.listingIds[0])}
                            >
                              Inspect evidence <ArrowUpRight size={14} />
                            </button>
                            <button
                              className="ll-review-button"
                              aria-pressed={workspace.resolved.includes(f.id)}
                              onClick={() =>
                                change({
                                  ...workspace,
                                  resolved: workspace.resolved.includes(f.id)
                                    ? workspace.resolved.filter(
                                        (x) => x !== f.id,
                                      )
                                    : [...workspace.resolved, f.id],
                                })
                              }
                            >
                              <Check size={14} />
                              {workspace.resolved.includes(f.id)
                                ? "Reviewed · undo"
                                : "Mark reviewed"}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="ll-empty">
                      <CheckCircle size={32} />
                      <h3>No differences detected yet</h3>
                      <p>
                        This is not a clean bill of health. Add more
                        observations to compare, or review the available
                        evidence.
                      </p>
                    </div>
                  )}
                </section>
                <aside className="ll-report-aside">
                  <section className="ll-reference-card">
                    <div className="ll-eyebrow">THE STARTING POINT</div>
                    <div className="ll-boat-sketch" aria-hidden>
                      <svg viewBox="0 0 300 120" fill="none">
                        <path d="M29 80h245l-27 22H70L29 80Z" />
                        <path d="m69 80 29-23h108l40 23M117 57l18-22h61l25 22M152 35V20h27l13 15" />
                        <path d="M106 65h25m8 0h25m8 0h25M138 43h22m8 0h22M38 111h221" />
                        <circle cx="76" cy="90" r="2" />
                        <circle cx="89" cy="90" r="2" />
                      </svg>
                    </div>
                    <h2>
                      {reference.data.make} {reference.data.model}
                    </h2>
                    <dl>
                      <div>
                        <dt>Reference source</dt>
                        <dd>{sourceName(reference.url)}</dd>
                      </div>
                      <div>
                        <dt>Reported HIN / CIN</dt>
                        <dd>{reference.data.hin || "Not recorded"}</dd>
                      </div>
                      <div>
                        <dt>Observed</dt>
                        <dd>{date(reference.observedAt)}</dd>
                      </div>
                      <div>
                        <dt>Offer</dt>
                        <dd>{offerLabel(reference.data.offer)}</dd>
                      </div>
                    </dl>
                    <External url={reference.url}>
                      Open reference advertisement
                    </External>
                  </section>
                  <section className="ll-scope-card">
                    <ShieldCheck size={24} />
                    <h3>Evidence, not certainty.</h3>
                    <p>
                      A strong link connects advertisements. It does not verify
                      ownership, availability or the accuracy of the seller’s
                      claims.
                    </p>
                    <button
                      className="ll-text-button"
                      onClick={() => setView("advertisements")}
                    >
                      Review all advertisements <ArrowRight size={15} />
                    </button>
                  </section>
                  <section className="ll-scope-note">
                    <span className="ll-eyebrow">COVERAGE</span>
                    <p>
                      {matches.length} advertisements on{" "}
                      {
                        new Set(matches.map((m) => sourceName(m.listing.url)))
                          .size
                      }{" "}
                      websites in this report. This is a bounded review, not an
                      exhaustive internet search.
                    </p>
                  </section>
                </aside>
              </div>
            </>
          )}

          {reference && view === "advertisements" && (
            <>
              <div className="ll-section-heading ll-list-heading">
                <div>
                  <h2>Follow the evidence.</h2>
                  <p>
                    Keep lookalikes separate until you know they are your boat.
                  </p>
                </div>
                <div className="ll-filters" aria-label="Filter advertisements">
                  {[
                    ["all", "All", matches.length],
                    ["linked", "Linked", linked.length],
                    ["review", "Review", pending.length],
                    [
                      "excluded",
                      "Excluded",
                      matches.filter((m) => m.band === "excluded").length,
                    ],
                  ].map(([key, label, count]) => (
                    <button
                      key={key}
                      aria-pressed={filter === key}
                      onClick={() => setFilter(String(key))}
                    >
                      {label} <span>{count}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={`ll-list-grid ${detail ? "has-detail" : ""}`}>
                <div className="ll-list">
                  {matches
                    .filter(
                      (m) =>
                        filter === "all" ||
                        (filter === "linked"
                          ? ["strong", "reference"].includes(m.band)
                          : m.band === filter),
                    )
                    .map((m) => (
                      <button
                        key={m.listing.id}
                        className={`ll-listing-card ${selected === m.listing.id ? "selected" : ""}`}
                        onClick={() => setSelected(m.listing.id)}
                        aria-pressed={selected === m.listing.id}
                      >
                        <div className="ll-listing-top">
                          <span className="ll-source-symbol">
                            {sourceName(m.listing.url)
                              .slice(0, 1)
                              .toUpperCase()}
                          </span>
                          <div>
                            <strong>{sourceName(m.listing.url)}</strong>
                            <span>
                              {m.listing.data.location ||
                                "Location not recorded"}
                            </span>
                          </div>
                          <Badge
                            tone={
                              m.band === "reference" || m.band === "strong"
                                ? "teal"
                                : m.band === "review"
                                  ? "amber"
                                  : "neutral"
                            }
                          >
                            {bandLabel(m)}
                          </Badge>
                        </div>
                        <div className="ll-listing-price">
                          {money(m.listing.data.price, m.listing.data.currency)}
                          <span>
                            {offerLabel(m.listing.data.offer)}
                            {m.listing.data.priceKind === "converted"
                              ? " · display conversion"
                              : ""}
                          </span>
                        </div>
                        <p>{m.reason}</p>
                        <div className="ll-listing-bottom">
                          <span>
                            {isStale(m.listing) ? "Stale · " : ""}Observed{" "}
                            {date(m.listing.observedAt)}
                            {m.aliases.length
                              ? ` · +${m.aliases.length} locale version`
                              : ""}
                          </span>
                          <ArrowRight size={18} />
                        </div>
                      </button>
                    ))}
                  {!matches.some(
                    (m) =>
                      filter === "all" ||
                      (filter === "linked"
                        ? ["strong", "reference"].includes(m.band)
                        : m.band === filter),
                  ) && (
                    <div className="ll-panel ll-empty">
                      <MagnifyingGlass size={30} />
                      <h3>No advertisements in this group</h3>
                      <p>Other groups and search coverage are unchanged.</p>
                      <button
                        className="ll-btn ll-btn-secondary"
                        onClick={() => setFilter("all")}
                      >
                        Show all advertisements
                      </button>
                    </div>
                  )}
                </div>
                {detail ? (
                  <EvidencePanel
                    match={detail}
                    onClose={() => setSelected(null)}
                    onEdit={() => setEditor({ listing: detail.listing })}
                    onDecision={(decision) =>
                      decide(detail.listing.id, decision)
                    }
                  />
                ) : (
                  <aside className="ll-evidence-placeholder">
                    <ShieldCheck size={36} />
                    <h3>Every link has a reason.</h3>
                    <p>
                      Select an advertisement to inspect its facts, identity
                      evidence and conflicts. Your decisions can always be
                      undone.
                    </p>
                  </aside>
                )}
              </div>
            </>
          )}
          {reference && view === "discover" && (
            <Discovery
              key={workspace.id}
              reference={reference}
              onAdd={(url) => setEditor({ url })}
            />
          )}
          {reference && view === "history" && (
            <section className="ll-panel">
              <div className="ll-section-heading">
                <div>
                  <div className="ll-eyebrow">A RECORD YOU CAN TRACE</div>
                  <h2>Observation history</h2>
                  <p>
                    Edits retain up to 30 prior observations per advertisement.
                    No scheduled checks are running.
                  </p>
                </div>
                <Badge>
                  {changed} saved change{changed === 1 ? "" : "s"}
                </Badge>
              </div>
              {changed === 0 ? (
                <div className="ll-empty">
                  <Clock size={36} />
                  <h3>Your first observation is the starting line.</h3>
                  <p>
                    Edit an advertisement after checking its source. Its
                    previous facts and observation date will stay here.
                  </p>
                  <button
                    className="ll-btn ll-btn-secondary"
                    onClick={() => setView("advertisements")}
                  >
                    Review advertisements <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                workspace.listings
                  .filter((l) => l.history.length)
                  .map((l) => (
                    <div key={l.id} className="ll-history-item">
                      <h3>{sourceName(l.url)}</h3>
                      {[...l.history, l].map((s, i) => (
                        <div
                          key={`${s.capturedAt}-${i}`}
                          className="ll-history-row"
                        >
                          <span className="ll-timeline-dot" />
                          <div>
                            <strong>
                              {date(s.observedAt)}{" "}
                              {i === l.history.length && (
                                <Badge tone="teal">Latest</Badge>
                              )}
                            </strong>
                            <p>
                              {money(s.data.price, s.data.currency)} ·{" "}
                              {s.data.hours ?? "Unknown"} hours · {s.status} ·{" "}
                              {s.data.location || "No location"}
                            </p>
                            <small>
                              Saved{" "}
                              {new Date(s.capturedAt).toLocaleString("en-GB")} ·{" "}
                              {s.origin} · {s.note || "No observation note"}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
              )}
            </section>
          )}
          {view === "experiment" && (
            <Experiment workspace={workspace} onChange={change} />
          )}
          <footer className="ll-footer">
            <span>
              UNEET Listing Lab <span>·</span> Proof of concept
            </span>
            <button onClick={() => importRef.current?.click()}>
              <UploadSimple size={15} />
              Import a report
            </button>
            <span>Source claims remain unverified.</span>
          </footer>
        </main>
      </div>
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="ll-hidden"
        aria-label="Import report JSON"
        onChange={(e) => importFile(e.target.files?.[0])}
      />
      <div className="ll-toast" role="status" aria-live="polite">
        {notice && <span>{notice}</span>}
      </div>
      {editor && (
        <ListingEditor
          key={editor.listing?.id ?? "new"}
          initial={editor.listing}
          initialUrl={editor.url}
          reference={!reference}
          synthetic={workspace.kind === "synthetic"}
          onClose={() => setEditor(null)}
          onSave={saveListing}
        />
      )}
      {exportOpen && (
        <Modal
          title="Take your report with you."
          onClose={() => setExportOpen(false)}
        >
          <p className="ll-muted">
            JSON includes observations, history, decisions and feedback and can
            be imported again. CSV is a flat snapshot for review.
          </p>
          <div className="ll-export-options">
            <button
              className="ll-btn ll-btn-primary"
              onClick={() => {
                download(
                  `uneet-${workspace.id}.json`,
                  JSON.stringify(workspace, null, 2),
                );
                setNotice("JSON export downloaded.");
              }}
            >
              Download full report (JSON)
              <DownloadSimple size={18} />
            </button>
            <button
              className="ll-btn ll-btn-secondary"
              onClick={() =>
                download(
                  `uneet-${workspace.id}.csv`,
                  csvExport(workspace),
                  "text/csv;charset=utf-8",
                )
              }
            >
              Download observations (CSV)
              <DownloadSimple size={18} />
            </button>
            <button
              className="ll-btn ll-btn-secondary"
              onClick={() => {
                setExportOpen(false);
                setView("overview");
                setTimeout(() => window.print(), 150);
              }}
            >
              Print report / save as PDF
              <FileText size={18} />
            </button>
          </div>
          <a className="ll-external" href="/lab/example-import.json" download>
            Download a synthetic import example <DownloadSimple size={15} />
          </a>
          <p className="ll-help">
            Exports contain the facts and notes you entered. Keep a copy if you
            clear your browser data.
          </p>
        </Modal>
      )}
    </div>
  );
}

function Stat({
  label,
  number,
  detail,
  icon,
}: {
  label: string;
  number: number;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="ll-stat">
      <div className="ll-stat-label">
        {label}
        {icon}
      </div>
      <strong>{String(number).padStart(2, "0")}</strong>
      <span>{detail}</span>
    </div>
  );
}

function EvidencePanel({
  match: m,
  onClose,
  onEdit,
  onDecision,
}: {
  match: Match;
  onClose: () => void;
  onEdit: () => void;
  onDecision: (d?: Decision) => void;
}) {
  const l = m.listing;
  return (
    <aside id="ll-evidence" tabIndex={-1} className="ll-panel ll-evidence">
      <div className="ll-section-heading">
        <div className="ll-eyebrow">ADVERTISEMENT EVIDENCE</div>
        <button
          className="ll-icon-button"
          aria-label="Close evidence"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <h2>{sourceName(l.url)}</h2>
      <Badge
        tone={m.band === "strong" || m.band === "reference" ? "teal" : "amber"}
      >
        {bandLabel(m)}
      </Badge>
      <p className="ll-evidence-reason">{m.reason}</p>
      <External url={l.url}>Open source</External>
      <div className="ll-divider" />
      <h3>Facts recorded from this source</h3>
      <dl className="ll-facts">
        {(
          [
            ["Boat", `${l.data.make || "Unknown"} ${l.data.model}`],
            ["Year", l.data.year],
            ["HIN / CIN", l.data.hin],
            ["Advertiser", l.data.seller],
            ["Price", money(l.data.price, l.data.currency)],
            [
              "Price basis",
              l.data.priceKind === "converted"
                ? "Display conversion"
                : l.data.priceKind === "unknown"
                  ? "Original currency not established"
                  : "Recorded asking price",
            ],
            ["Offer", offerLabel(l.data.offer)],
            ["Tax", l.data.tax],
            [
              "Shares (field / text)",
              `${l.data.shares ?? "—"} / ${l.data.narrativeShares ?? "—"}`,
            ],
            ["Location", l.data.location],
            ["Engine", l.data.engine],
            ["Hours", l.data.hours],
            ["Status claim", l.status],
            ["Observed", date(l.observedAt)],
            [
              "Provenance",
              l.origin === "research"
                ? "Manual research snapshot"
                : l.origin === "synthetic"
                  ? "Synthetic test data"
                  : "User-entered observation",
            ],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value === "" || value === null ? "Not recorded" : value}</dd>
          </div>
        ))}
      </dl>
      {m.evidence.length > 0 && (
        <div className="ll-evidence-section">
          <h3>Supporting signals</h3>
          <ul>
            {m.evidence.map((e) => (
              <li key={e}>
                <Check size={15} />
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}
      {m.conflicts.length > 0 && (
        <div className="ll-evidence-section">
          <h3>Differences to investigate</h3>
          <ul>
            {m.conflicts.map((e) => (
              <li key={e}>
                <Warning size={15} />
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="ll-evidence-section">
        <h3>Observation note</h3>
        <p>{l.note || "No note recorded."}</p>
      </div>
      {m.aliases.length > 0 && (
        <div className="ll-evidence-section">
          <h3>Localized versions · not extra advertisements</h3>
          {m.aliases.map((a) => (
            <div key={a.id}>
              <External url={a.url}>{new URL(a.url).hostname}</External>
              <p>
                {money(a.data.price, a.data.currency)} · {date(a.observedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="ll-evidence-actions">
        {m.band !== "reference" && (
          <>
            <button
              className="ll-btn ll-btn-primary"
              disabled={m.hardConflict || m.decision === "confirm"}
              onClick={() => onDecision("confirm")}
            >
              <Check size={17} />
              Link as the same boat
            </button>
            <button
              className="ll-btn ll-btn-secondary"
              disabled={m.decision === "reject"}
              onClick={() => onDecision("reject")}
            >
              Exclude this advertisement
            </button>
            {m.decision && (
              <button className="ll-text-button" onClick={() => onDecision()}>
                Undo my identity decision
              </button>
            )}
          </>
        )}
        <button className="ll-btn ll-btn-secondary" onClick={onEdit}>
          Edit / record a new observation
        </button>
        {m.hardConflict && (
          <p className="ll-help">
            Conflicting HINs must be corrected in the source facts before
            linking.
          </p>
        )}
      </div>
    </aside>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="ll-dialog"
      aria-labelledby="ll-dialog-title"
      onCancel={onClose}
    >
      <div className="ll-dialog-head">
        <div>
          <div className="ll-eyebrow">UNEET LISTING LAB</div>
          <h2 id="ll-dialog-title">{title}</h2>
        </div>
        <button
          type="button"
          className="ll-icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function ListingEditor({
  initial,
  initialUrl,
  reference,
  synthetic,
  onClose,
  onSave,
}: {
  initial?: Listing;
  initialUrl?: string;
  reference: boolean;
  synthetic: boolean;
  onClose: () => void;
  onSave: (l: Listing) => void;
}) {
  const [url, setUrl] = useState(initial?.url ?? initialUrl ?? "");
  const [data, setData] = useState<BoatFacts>(initial?.data ?? emptyFacts());
  const [text, setText] = useState("");
  const [note, setNote] = useState(initial?.note ?? "");
  const [observed, setObserved] = useState(
    (initial?.observedAt ?? new Date().toISOString()).slice(0, 10),
  );
  const [status, setStatus] = useState<Listing["status"]>(
    initial?.status ?? "unknown",
  );
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  function field<K extends keyof BoatFacts>(key: K, value: BoatFacts[K]) {
    setData((old) => ({ ...old, [key]: value }));
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (!data.hin && (!data.make.trim() || !data.model.trim()))
        throw new Error(
          "Add a HIN/CIN or both make and model so the advertisement can be compared.",
        );
      const now = new Date().toISOString();
      const listing = validateListing({
        id: initial?.id ?? crypto.randomUUID(),
        url,
        data,
        observedAt: `${observed}T00:00:00.000Z`,
        capturedAt: now,
        origin: synthetic ? "synthetic" : "manual",
        status,
        note,
        history: initial?.history ?? [],
      });
      onSave(listing);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Check the observation details.",
      );
    }
  }
  const textFields: [keyof BoatFacts, string][] = [
    ["make", "Make / brand"],
    ["model", "Model"],
    ["hin", "HIN / CIN"],
    ["boatName", "Boat name"],
    ["location", "Location"],
    ["seller", "Advertiser / broker"],
    ["engine", "Engine model"],
  ];
  return (
    <Modal
      title={
        initial
          ? "Record what the source says."
          : reference
            ? "Add your reference advertisement."
            : "Add an advertisement to compare."
      }
      onClose={onClose}
    >
      <form onSubmit={submit} className="ll-editor">
        <p className="ll-muted">
          The URL is a source reference. This POC does not fetch the page
          automatically. Paste or enter the facts you have observed.
        </p>
        <label className="ll-field">
          Listing URL
          <input
            autoFocus
            required
            readOnly={Boolean(initial)}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            maxLength={2000}
          />
        </label>
        <details className="ll-paste" open={!initial}>
          <summary>Paste listing details to fill a draft</summary>
          <p className="ll-help">
            Works best with labelled lines such as “Make: Sunseeker”, “Model: 76
            Yacht”, “Price: GBP 510,000”. Review every field.
          </p>
          <textarea
            aria-label="Listing text to extract"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              "Make: Sunseeker\nModel: 76 Yacht\nYear: 2021\nPrice: GBP 510,000\nOffer: fractional share"
            }
            rows={5}
            maxLength={30000}
          />
          <button
            type="button"
            className="ll-btn ll-btn-secondary"
            disabled={!text.trim()}
            onClick={() => {
              const result = extractFacts(text);
              setData(result.data);
              setWarnings(result.warnings);
            }}
          >
            Extract draft fields <ArrowRight size={15} />
          </button>
          {warnings.map((w) => (
            <p className="ll-help" key={w}>
              {w}
            </p>
          ))}
        </details>
        <div className="ll-form-grid">
          {textFields.map(([key, label]) => (
            <label className="ll-field" key={key}>
              {label}
              <input
                value={String(data[key] ?? "")}
                maxLength={300}
                onChange={(e) => field(key, e.target.value as never)}
              />
            </label>
          ))}
          <label className="ll-field">
            Year
            <input
              type="number"
              min={1800}
              max={2100}
              value={data.year ?? ""}
              onChange={(e) =>
                field("year", e.target.value ? Number(e.target.value) : null)
              }
            />
          </label>
          <label className="ll-field">
            Engine hours
            <input
              type="number"
              min={0}
              max={200000}
              step="any"
              value={data.hours ?? ""}
              onChange={(e) =>
                field("hours", e.target.value ? Number(e.target.value) : null)
              }
            />
          </label>
          <label className="ll-field">
            Asking price
            <input
              type="number"
              min={0}
              max={1_000_000_000}
              step="any"
              value={data.price ?? ""}
              onChange={(e) =>
                field("price", e.target.value ? Number(e.target.value) : null)
              }
            />
          </label>
          <label className="ll-field">
            Currency
            <select
              value={data.currency}
              onChange={(e) =>
                field("currency", e.target.value as BoatFacts["currency"])
              }
            >
              <option value="unknown">Not established</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className="ll-field">
            Price type
            <select
              value={data.priceKind}
              onChange={(e) =>
                field("priceKind", e.target.value as BoatFacts["priceKind"])
              }
            >
              <option value="unknown">Original currency not established</option>
              <option value="asking">Original asking price</option>
              <option value="converted">Converted display price</option>
            </select>
          </label>
          <label className="ll-field">
            Offer basis
            <select
              value={data.offer}
              onChange={(e) =>
                field("offer", e.target.value as BoatFacts["offer"])
              }
            >
              <option value="unknown">Not established</option>
              <option value="whole">Whole vessel</option>
              <option value="fractional">Fractional share</option>
              <option value="charter">Charter</option>
            </select>
          </label>
          <label className="ll-field">
            Tax / VAT basis
            <select
              value={data.tax}
              onChange={(e) => field("tax", e.target.value as BoatFacts["tax"])}
            >
              <option value="unknown">Not established</option>
              <option value="included">Included / paid</option>
              <option value="excluded">Excluded / unpaid</option>
            </select>
          </label>
          {data.offer === "fractional" && (
            <>
              <label className="ll-field">
                Shares in structured field
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={data.shares ?? ""}
                  onChange={(e) =>
                    field(
                      "shares",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </label>
              <label className="ll-field">
                Co-owners stated in narrative
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={data.narrativeShares ?? ""}
                  onChange={(e) =>
                    field(
                      "narrativeShares",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </label>
            </>
          )}
          <label className="ll-field">
            Observation date
            <input
              required
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={observed}
              onChange={(e) => setObserved(e.target.value)}
            />
          </label>
          <label className="ll-field">
            Status stated by source
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Listing["status"])}
            >
              <option value="unknown">Unknown / not checked</option>
              <option value="advertised">Advertised at observation</option>
              <option value="removed">Removal explicitly checked</option>
              <option value="sold">Source explicitly says sold</option>
            </select>
          </label>
        </div>
        <label className="ll-field">
          Observation note
          <textarea
            rows={3}
            value={note}
            maxLength={10000}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Where did these facts come from? What still needs checking?"
          />
        </label>
        <p className="ll-help">
          An observation date records when you saw the information. It is not
          proof that the boat is still available.
        </p>
        {error && (
          <div role="alert" className="ll-alert">
            <Warning size={18} />
            {error}
          </div>
        )}
        <div className="ll-form-actions">
          <button
            type="button"
            className="ll-btn ll-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="ll-btn ll-btn-primary" type="submit">
            {initial ? "Save new observation" : "Save advertisement"}
            <Check size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Discovery({
  reference,
  onAdd,
}: {
  reference: Listing;
  onAdd: (url: string) => void;
}) {
  const queries = discoveryQueries(reference);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [query, setQuery] = useState(queries[0]?.query ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<SearchLead[] | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/lab/search")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((r) => {
        if (active) setConnected(Boolean(r.connected));
      })
      .catch(() => {
        if (active) {
          setConnected(false);
          setError(
            "Could not check the search connection. Guided searches still work.",
          );
        }
      });
    return () => {
      active = false;
      controller.current?.abort();
    };
  }, []);
  async function search(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setLeads(null);
    controller.current = new AbortController();
    try {
      const response = await fetch("/api/lab/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.current.signal,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setLeads(body.leads);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setError(
          e instanceof Error ? e.message : "Search failed. Please try again.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ll-discovery">
      <section className="ll-panel">
        <div className="ll-section-heading">
          <div>
            <div className="ll-eyebrow">EXPAND YOUR EVIDENCE</div>
            <h2>Look beyond the first listing.</h2>
            <p>
              Open a targeted search, review the source, then add an observation
              to your report.
            </p>
          </div>
          <MagnifyingGlass size={28} />
        </div>
        <div className="ll-query-grid">
          {queries.map((q) => (
            <a
              key={q.label}
              className="ll-query-card"
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>
                {q.label}
                <ArrowUpRight size={19} />
              </strong>
              <span>{q.query}</span>
              <small>Open Google search</small>
            </a>
          ))}
        </div>
        <p className="ll-help">
          A search result is a lead, not a verified advertisement. Search
          engines can miss listings or retain pages that have changed.
        </p>
      </section>
      <section className="ll-panel">
        <div className="ll-section-heading">
          <div>
            <h2>Search inside the workspace</h2>
            <p>
              Optional indexed-web discovery via Brave Search. Results are not
              saved automatically.
            </p>
          </div>
          <Badge tone={connected ? "teal" : "neutral"}>
            {connected === null
              ? "Checking connection"
              : connected
                ? "Connected"
                : "Not connected"}
          </Badge>
        </div>
        {connected === false && (
          <div className="ll-connection-note">
            <Info size={22} />
            <div>
              <strong>No search credential is configured.</strong>
              <p>
                The guided searches above work now. A developer can enable
                in-app discovery with the server-side Brave credential described
                in the project README. This does not enable marketplace
                crawling.
              </p>
            </div>
          </div>
        )}
        <form onSubmit={search} className="ll-search-form">
          <label className="ll-field">
            Search query
            <input
              value={query}
              maxLength={400}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button
            className="ll-btn ll-btn-primary"
            disabled={!connected || busy || !query.trim()}
          >
            {busy ? "Searching…" : "Search web"}
            <MagnifyingGlass size={17} />
          </button>
        </form>
        {busy && (
          <p role="status" className="ll-muted">
            Searching the web index. Current listing availability will still
            need checking.
          </p>
        )}
        {error && (
          <p role="alert" className="ll-alert">
            {error}
          </p>
        )}
        {leads &&
          (leads.length ? (
            <div className="ll-search-results">
              {leads.map((lead) => (
                <article key={lead.url}>
                  <External url={lead.url}>{lead.title}</External>
                  <p>{lead.description}</p>
                  <button
                    className="ll-text-button"
                    onClick={() => onAdd(lead.url)}
                  >
                    Add my observation of this source <Plus size={15} />
                  </button>
                </article>
              ))}
              <p className="ll-help">
                Web results provided by Brave Search. These transient leads
                disappear when you leave this view.
              </p>
            </div>
          ) : (
            <div className="ll-empty">
              <h3>No indexed results returned</h3>
              <p>
                This does not establish that no advertisements exist. Try
                broader terms or another guided search.
              </p>
            </div>
          ))}
      </section>
    </div>
  );
}

function Experiment({
  workspace,
  onChange,
}: {
  workspace: Workspace;
  onChange: (w: Workspace) => void;
}) {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <div className="ll-concepts">
        {[
          [
            "01",
            "Find my boat",
            "Discover unknown advertisements across sources.",
            "Hardest dependency: access and coverage.",
            false,
          ],
          [
            "02",
            "Audit my listings",
            "See what disagrees, why it matters and what to clarify.",
            "Test now with inspectable source evidence.",
            true,
          ],
          [
            "03",
            "Prepare my sale",
            "Find missing details before putting a boat on the market.",
            "Next experiment with owners preparing to sell.",
            false,
          ],
          [
            "04",
            "Monitor my broker",
            "Know what changed and whether it needs attention.",
            "Needs recurring source access and repeat demand.",
            false,
          ],
        ].map(([n, title, description, note, active]) => (
          <section
            key={String(n)}
            className={`ll-concept ${active ? "chosen" : ""}`}
          >
            <div>
              <span>{n}</span>
              {active && <Badge tone="teal">Built in this POC</Badge>}
            </div>
            <h2>{title}</h2>
            <p>{description}</p>
            <small>{note}</small>
          </section>
        ))}
      </div>
      <section className="ll-panel ll-method">
        <div>
          <div className="ll-eyebrow">THE HYPOTHESIS</div>
          <h2>Owners will act on an issue they didn’t know about.</h2>
          <p>
            The report earns its place if it uncovers something worth clarifying
            or correcting. More listings and impressive confidence numbers alone
            do not establish value.
          </p>
        </div>
        <ol>
          <li>
            <strong>Bring evidence.</strong> Start with an owner-known
            advertisement and compare candidate sources.
          </li>
          <li>
            <strong>Keep uncertainty visible.</strong> Similar boats stay
            separate; identity decisions can be reversed.
          </li>
          <li>
            <strong>Watch for action.</strong> Record usefulness and what the
            owner would do next.
          </li>
        </ol>
      </section>
      <section className="ll-panel">
        <h2>Record your reaction to this report</h2>
        <p className="ll-muted">
          Feedback stays in this browser and your JSON export. Nothing is sent
          to UNEET or a broker.
        </p>
        <form
          className="ll-feedback"
          onSubmit={(e) => {
            e.preventDefault();
            const values = new FormData(e.currentTarget);
            onChange({
              ...workspace,
              feedback: {
                useful: values.get("useful") as "yes" | "no" | "unsure",
                nextAction: values.get("nextAction") as
                  | "clarify"
                  | "correct"
                  | "monitor"
                  | "none",
                note: String(values.get("note")),
                recordedAt: new Date().toISOString(),
              },
            });
            setSaved(true);
          }}
          key={workspace.id}
        >
          <div className="ll-form-grid">
            <label className="ll-field">
              Did you learn something useful?
              <select
                name="useful"
                defaultValue={workspace.feedback?.useful ?? "unsure"}
              >
                <option value="unsure">Not sure yet</option>
                <option value="yes">Yes, something useful</option>
                <option value="no">No, nothing useful</option>
              </select>
            </label>
            <label className="ll-field">
              What would you do next?
              <select
                name="nextAction"
                defaultValue={workspace.feedback?.nextAction ?? "none"}
              >
                <option value="none">No action</option>
                <option value="clarify">Ask the advertiser to clarify</option>
                <option value="correct">Request a listing correction</option>
                <option value="monitor">Check again for changes</option>
              </select>
            </label>
          </div>
          <label className="ll-field">
            What would make this worth using?
            <textarea
              name="note"
              maxLength={2000}
              rows={3}
              defaultValue={workspace.feedback?.note ?? ""}
            />
          </label>
          <button className="ll-btn ll-btn-primary">
            Save pilot feedback <Check size={17} />
          </button>
          {saved && <p role="status">Feedback recorded in this report.</p>}
        </form>
      </section>
      <div className="ll-limits">
        <h3>What this experiment does and doesn’t establish</h3>
        <p>
          Working: observations, matching rules, source evidence, reversible
          decisions, scoped findings, edit history, imports, exports and pilot
          feedback. The Sunseeker case is manually researched; the Axopar case
          is synthetic. There is no automated marketplace crawler, scheduled
          monitoring, calibrated probability, market valuation or verified
          ownership. Optional web search discovers URLs only.
        </p>
      </div>
    </>
  );
}
