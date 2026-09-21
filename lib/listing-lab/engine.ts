import type { BoatFacts, Finding, Listing, Match, Workspace } from "./types";

export const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export const normalizeHin = (value: string) =>
  value.toUpperCase().replace(/[\s-]/g, "");
export const plausibleHin = (value: string) =>
  /^[A-Z0-9]{12}$|^[A-Z0-9]{14}$/.test(normalizeHin(value));

export function safeUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      !url.hostname.includes(".")
    )
      return "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()])
      if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    return url.toString();
  } catch {
    return "";
  }
}
export function sourceName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (/^yachtworld\.(com|co\.uk)$/.test(host)) return "YachtWorld";
    if (/^(?:[a-z]{2}\.)?boats\.com$/.test(host)) return "boats.com";
    if (host === "ngyachting.com") return "Next Generation Yachting";
    if (host === "machinio.com") return "Machinio";
    if (host === "boat24.com") return "Boat24";
    return host;
  } catch {
    return "Unknown source";
  }
}
/** Advertisement IDs are only comparable inside a known namespace. Not vessel IDs. */
export function advertisementKey(
  url: string,
): { namespace: string; id: string; platform: string } | null {
  try {
    const u = new URL(url);
    const platform = sourceName(url);
    if (!["YachtWorld", "boats.com"].includes(platform)) return null;
    const id = u.pathname.match(/-(\d{6,10})\/*$/)?.[1];
    return id ? { namespace: "boats-group", id, platform } : null;
  } catch {
    return null;
  }
}

export function matchListing(
  reference: Listing,
  listing: Listing,
  decision?: "confirm" | "reject",
): Match {
  const base: Match = {
    listing,
    band: "review",
    reason: "Not enough evidence to identify this boat",
    evidence: [],
    conflicts: [],
    hardConflict: false,
    aliases: [],
    decision,
  };
  if (reference.id === listing.id)
    return {
      ...base,
      band: "reference",
      reason: "Your chosen reference advertisement",
    };
  const a = reference.data,
    b = listing.data;
  const fields: [keyof BoatFacts, string][] = [
    ["make", "Make"],
    ["model", "Model"],
    ["boatName", "Boat name"],
    ["engine", "Engine"],
    ["location", "Location"],
    ["seller", "Advertiser"],
  ];
  for (const [key, label] of fields) {
    const av = a[key],
      bv = b[key];
    if (typeof av === "string" && typeof bv === "string" && av && bv) {
      if (normalize(av) === normalize(bv))
        base.evidence.push(`${label} agrees: ${bv}`);
      else base.conflicts.push(`${label} differs: ${av} / ${bv}`);
    }
  }
  if (a.year && b.year)
    (a.year === b.year ? base.evidence : base.conflicts).push(
      a.year === b.year
        ? `Year agrees: ${b.year}`
        : `Year differs: ${a.year} / ${b.year}`,
    );
  if (a.hours !== null && b.hours !== null)
    (a.hours === b.hours ? base.evidence : base.conflicts).push(
      a.hours === b.hours
        ? `Engine hours agree: ${b.hours}`
        : `Engine hours differ: ${a.hours} / ${b.hours}`,
    );
  const hinConflict =
    plausibleHin(a.hin) &&
    plausibleHin(b.hin) &&
    normalizeHin(a.hin) !== normalizeHin(b.hin);
  if (hinConflict) {
    base.hardConflict = true;
    base.conflicts.unshift(
      "Different HIN/CIN values. Correct the source facts before linking.",
    );
  }
  if (decision === "reject")
    return { ...base, band: "excluded", reason: "Excluded by you" };
  if (hinConflict)
    return {
      ...base,
      band: "excluded",
      reason: "Conflicting vessel identifiers",
    };
  if (decision === "confirm")
    return {
      ...base,
      band: "strong",
      reason: "Linked by you; source claims remain unverified",
    };
  const makeConflict =
    a.make && b.make && normalize(a.make) !== normalize(b.make);
  if (makeConflict)
    return {
      ...base,
      band: "excluded",
      reason: "Different manufacturer; review the source facts",
    };
  if (
    plausibleHin(a.hin) &&
    plausibleHin(b.hin) &&
    normalizeHin(a.hin) === normalizeHin(b.hin)
  ) {
    return {
      ...base,
      band: "strong",
      reason: "Matching reported HIN/CIN",
      evidence: [`HIN/CIN agrees: ${normalizeHin(b.hin)}`, ...base.evidence],
    };
  }
  const ak = advertisementKey(reference.url),
    bk = advertisementKey(listing.url);
  if (ak && bk && ak.namespace === bk.namespace && ak.id === bk.id) {
    return {
      ...base,
      band: "strong",
      reason: "Same advertisement ID in the Boats Group network",
      evidence: [
        `Shared advertisement ID: ${ak.id}. This links ads, not verified ownership.`,
        ...base.evidence,
      ],
    };
  }
  return {
    ...base,
    reason: base.evidence.length
      ? "Similar details; vessel identity still needs your review"
      : base.reason,
  };
}

export function buildMatches(workspace: Workspace): Match[] {
  const reference = workspace.listings.find(
    (l) => l.id === workspace.referenceId,
  );
  if (!reference) return [];
  const groups = new Map<string, Listing[]>();
  for (const listing of workspace.listings) {
    const ad = advertisementKey(listing.url);
    // Only localized versions on the same platform collapse. Never collapse different marketplaces.
    const key = ad
      ? `${ad.platform}:${ad.namespace}:${ad.id}`
      : safeUrl(listing.url).replace(/\/$/, "");
    groups.set(key, [...(groups.get(key) ?? []), listing]);
  }
  return [...groups.values()]
    .map((group) => {
      const primary =
        group.find((l) => l.id === workspace.referenceId) ?? group[0];
      return {
        ...matchListing(reference, primary, workspace.decisions[primary.id]),
        aliases: group.filter((l) => l.id !== primary.id),
      };
    })
    .sort(
      (a, b) =>
        ({ reference: 0, strong: 1, review: 2, excluded: 3 })[a.band] -
        { reference: 0, strong: 1, review: 2, excluded: 3 }[b.band],
    );
}

export function money(
  price: number | null,
  currency: BoatFacts["currency"],
): string {
  if (price === null) return "Price not recorded";
  if (currency === "unknown")
    return `${price.toLocaleString("en-GB")} · currency unknown`;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
export function offerLabel(offer: BoatFacts["offer"]) {
  return {
    whole: "Whole vessel",
    fractional: "Fractional share",
    charter: "Charter",
    unknown: "Offer basis unknown",
  }[offer];
}
export const isStale = (listing: Listing, now = Date.now()) =>
  now - Date.parse(listing.observedAt) > 14 * 86400000;

export function audit(workspace: Workspace, now = Date.now()): Finding[] {
  const matches = buildMatches(workspace);
  const linked = matches
    .filter((m) => m.band === "reference" || m.band === "strong")
    .map((m) => m.listing);
  if (!linked.length) return [];
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);
  const fractional = linked.filter((l) => l.data.offer === "fractional");
  if (fractional.length)
    add({
      id: "fractional",
      severity: "attention",
      title: "The asking price is for a share",
      detail:
        "These advertisements describe fractional ownership. Their prices must not be compared with whole-vessel asking prices or multiplied into a valuation.",
      action:
        "Confirm the share, annual usage and ongoing costs with the advertiser.",
      listingIds: fractional.map((l) => l.id),
    });
  const termsConflict = linked.filter(
    (l) =>
      l.data.shares &&
      l.data.narrativeShares &&
      l.data.shares !== l.data.narrativeShares,
  );
  if (termsConflict.length)
    add({
      id: "share-terms",
      severity: "attention",
      title: "The share structure needs clarification",
      detail: termsConflict
        .map(
          (l) =>
            `${sourceName(l.url)} records ${l.data.shares} shares, while the narrative describes ${l.data.narrativeShares} co-owners. Shares and owner counts are not necessarily equivalent.`,
        )
        .join(" "),
      action:
        "Ask which ownership structure applies. Do not infer a percentage until clarified.",
      listingIds: termsConflict.map((l) => l.id),
    });
  const converted = linked.filter((l) => l.data.priceKind === "converted");
  if (converted.length)
    add({
      id: "currency",
      severity: "context",
      title: "Display currencies can explain a price difference",
      detail:
        "Converted display prices are excluded from price-gap calculations. Exchange rates and observation dates can differ between websites.",
      action: "Use the original asking currency and matching offer terms.",
      listingIds: converted.map((l) => l.id),
    });
  const buckets = new Map<string, Listing[]>();
  linked.forEach((l) => {
    const d = l.data;
    if (
      d.price === null ||
      d.currency === "unknown" ||
      d.tax === "unknown" ||
      d.offer === "unknown" ||
      d.priceKind !== "asking" ||
      l.status !== "advertised" ||
      isStale(l, now)
    )
      return;
    if (d.offer === "fractional") return; // Share count alone does not establish equal usage/cost rights.
    if (d.offer === "charter") return; // Charter period is outside this POC schema.
    const key = [d.currency, d.offer, d.tax].join(":");
    buckets.set(key, [...(buckets.get(key) ?? []), l]);
  });
  for (const [key, group] of buckets) {
    const prices = group.map((l) => l.data.price!);
    const gap = Math.max(...prices) - Math.min(...prices);
    if (group.length > 1 && gap > 0)
      add({
        id: `price-${key}`,
        severity: "attention",
        title: `${money(gap, group[0].data.currency)} difference in recorded asking prices`,
        detail: `${money(Math.min(...prices), group[0].data.currency)} to ${money(Math.max(...prices), group[0].data.currency)} across ${group.length} linked advertisements with the same recorded currency, offer and tax basis. These are observations, not verified current prices.`,
        action:
          "Confirm the intended asking price and update outdated advertisements.",
        listingIds: group.map((l) => l.id),
      });
  }
  for (const [key, label] of [
    ["hours", "Engine hours"],
    ["location", "Location"],
    ["seller", "Advertiser"],
    ["year", "Model year"],
    ["tax", "Tax basis"],
  ] as const) {
    const known = linked.filter(
      (l) =>
        l.data[key] !== "" && l.data[key] !== null && l.data[key] !== "unknown",
    );
    const values = new Set(known.map((l) => normalize(String(l.data[key]))));
    if (values.size > 1)
      add({
        id: `different-${key}`,
        severity: key === "seller" ? "context" : "attention",
        title: `${label} differs between linked advertisements`,
        detail: known
          .map((l) => `${sourceName(l.url)}: ${l.data[key]}`)
          .join(" · "),
        action:
          key === "seller"
            ? "Check who is presenting the advertisement; this does not prove unauthorized brokerage."
            : "Check observation dates and confirm the correct detail before requesting a correction.",
        listingIds: known.map((l) => l.id),
      });
  }
  const stale = linked.filter((l) => isStale(l, now));
  if (stale.length)
    add({
      id: "stale",
      severity: "attention",
      title: "Some observations are over 14 days old",
      detail:
        "Old observations cannot establish current availability. They are excluded from price-gap calculations.",
      action:
        "Open each source and record a new observation when you have checked it.",
      listingIds: stale.map((l) => l.id),
    });
  const review = matches.filter((m) => m.band === "review");
  if (review.length)
    add({
      id: "unresolved",
      severity: "context",
      title: `${review.length} candidate${review.length === 1 ? " needs" : "s need"} an identity check`,
      detail:
        "These advertisements are excluded from the linked-boat findings. Similar model, year, price or location does not prove the same physical boat.",
      action: "Review the evidence, then link or exclude each candidate.",
      listingIds: review.map((m) => m.listing.id),
    });
  const missing = linked.filter(
    (l) => l.data.tax === "unknown" || l.data.offer === "unknown",
  );
  if (missing.length)
    add({
      id: "missing-basis",
      severity: "context",
      title: "Some price terms are not recorded",
      detail:
        "Tax status or the offer basis is unknown. No like-for-like price gap is calculated for those observations.",
      action: "Record the missing terms from the source or ask the advertiser.",
      listingIds: missing.map((l) => l.id),
    });
  return findings;
}

export function updateListing(
  workspace: Workspace,
  next: Listing,
  at = new Date().toISOString(),
): Workspace {
  const old = workspace.listings.find((l) => l.id === next.id);
  if (!old)
    return {
      ...workspace,
      listings: [...workspace.listings, next],
      resolved: [],
    };
  if (safeUrl(old.url) !== safeUrl(next.url))
    throw new Error(
      "An existing source URL cannot be changed. Add a separate advertisement for a different source.",
    );
  const history = [
    ...old.history,
    {
      origin: old.origin,
      capturedAt: old.capturedAt,
      observedAt: old.observedAt,
      data: old.data,
      status: old.status,
      note: old.note,
    },
  ].slice(-30);
  // Evidence changes invalidate the human identity decision and reviewed findings.
  const decisions =
    next.id === workspace.referenceId ? {} : { ...workspace.decisions };
  delete decisions[next.id];
  return {
    ...workspace,
    decisions,
    resolved: [],
    listings: workspace.listings.map((l) =>
      l.id === next.id ? { ...next, capturedAt: at, history } : l,
    ),
  };
}

export function discoveryQueries(
  listing: Listing,
): { label: string; query: string; url: string }[] {
  const d = listing.data;
  const quoted = (s: string) => `"${s.replace(/["\\]/g, " ").trim()}"`;
  const model = [quoted(d.make), quoted(d.model), d.year]
    .filter(Boolean)
    .join(" ");
  const queries = [
    {
      label: "Model + advertiser",
      query: `${model} ${d.seller ? quoted(d.seller) : "for sale"}`,
    },
    {
      label: "Across marketplaces",
      query: `${model} (site:yachtworld.com OR site:boats.com OR site:boat24.com)`,
    },
    ...(d.hin
      ? [{ label: "Exact HIN / CIN", query: quoted(normalizeHin(d.hin)) }]
      : []),
    ...(advertisementKey(listing.url)
      ? [
          {
            label: "Advertisement ID",
            query: `${quoted(advertisementKey(listing.url)!.id)} ${quoted(d.make)}`,
          },
        ]
      : []),
  ];
  return queries.map((q) => ({
    ...q,
    url: `https://www.google.com/search?q=${encodeURIComponent(q.query)}`,
  }));
}
