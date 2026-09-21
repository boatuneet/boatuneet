import { emptyFacts } from "./types.ts";
import type { BoatFacts, Listing, Snapshot, Workspace } from "./types.ts";
import { safeUrl } from "./engine.ts";

export const MAX_IMPORT_BYTES = 1_000_000;
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object.");
  return value as Record<string, unknown>;
};
function str(value: unknown, name: string, max = 300): string {
  if (typeof value !== "string" || value.length > max)
    throw new Error(`${name} must be text, at most ${max} characters.`);
  return value.trim();
}
function num(
  value: unknown,
  name: string,
  min = 0,
  max = 1_000_000_000,
  integer = false,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  )
    throw new Error(
      `${name} must be a valid number between ${min} and ${max}.`,
    );
  return value;
}
function choice<T extends string>(
  value: unknown,
  allowed: readonly T[],
  name: string,
): T {
  if (!allowed.includes(value as T)) throw new Error(`Invalid ${name}.`);
  return value as T;
}
function date(value: unknown): string {
  const s = str(value, "Observation date", 40);
  if (
    !/^\d{4}-\d{2}-\d{2}T/.test(s) ||
    !Number.isFinite(Date.parse(s)) ||
    Date.parse(s) > Date.now() + 86400000
  )
    throw new Error("Use a valid observation date, not a future date.");
  return new Date(s).toISOString();
}
function id(value: unknown): string {
  const s = str(value, "ID", 80);
  if (
    !/^[a-zA-Z0-9_-]+$/.test(s) ||
    ["__proto__", "constructor", "prototype"].includes(s)
  )
    throw new Error("Invalid ID.");
  return s;
}
export function validateFacts(value: unknown): BoatFacts {
  const o = record(value);
  const defaults = emptyFacts();
  return {
    ...defaults,
    ...Object.fromEntries(
      ["make", "model", "hin", "boatName", "location", "seller", "engine"].map(
        (k) => [k, str(o[k] ?? "", k)],
      ),
    ),
    year: num(o.year, "Year", 1800, 2100, true),
    hours: num(o.hours, "Hours", 0, 200000),
    price: num(o.price, "Price"),
    shares: num(o.shares, "Shares", 1, 1000, true),
    narrativeShares: num(o.narrativeShares, "Narrative shares", 1, 1000, true),
    currency: choice(
      o.currency ?? "unknown",
      ["EUR", "GBP", "USD", "unknown"],
      "currency",
    ),
    priceKind: choice(
      o.priceKind ?? "asking",
      ["asking", "converted", "unknown"],
      "price type",
    ),
    tax: choice(
      o.tax ?? "unknown",
      ["included", "excluded", "unknown"],
      "tax basis",
    ),
    offer: choice(
      o.offer ?? "unknown",
      ["whole", "fractional", "charter", "unknown"],
      "offer basis",
    ),
  };
}
function snapshot(value: unknown): Snapshot {
  const o = record(value);
  return {
    origin: choice(
      o.origin ?? "manual",
      ["research", "manual", "synthetic"],
      "source origin",
    ),
    capturedAt: date(o.capturedAt),
    observedAt: date(o.observedAt),
    data: validateFacts(o.data),
    status: choice(
      o.status,
      ["advertised", "unknown", "removed", "sold"],
      "listing status",
    ),
    note: str(o.note ?? "", "Note", 10000),
  };
}
export function validateListing(value: unknown): Listing {
  const o = record(value);
  const url = safeUrl(str(o.url, "URL", 2000));
  if (!url)
    throw new Error(
      "Use a complete http or https listing URL without credentials.",
    );
  const history = o.history ?? [];
  if (!Array.isArray(history) || history.length > 30)
    throw new Error("History must contain at most 30 observations.");
  return {
    ...snapshot(o),
    id: id(o.id),
    url,
    origin: choice(
      o.origin,
      ["research", "manual", "synthetic"],
      "source origin",
    ),
    history: history.map(snapshot),
  };
}
export function parseWorkspace(text: string): Workspace {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES)
    throw new Error("File is too large. Maximum size is 1 MB.");
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    throw new Error(
      "This is not valid JSON. Use a UNEET report export or the provided template.",
    );
  }
  const o = record(input);
  if (o.version !== 1)
    throw new Error("Unsupported report version. Expected version 1.");
  if (!Array.isArray(o.listings) || o.listings.length > 200)
    throw new Error("A report can contain up to 200 observations.");
  const listings = o.listings.map(validateListing);
  if (new Set(listings.map((l) => l.id)).size !== listings.length)
    throw new Error("Listing IDs must be unique.");
  if (new Set(listings.map((l) => l.url)).size !== listings.length)
    throw new Error(
      "Duplicate listing URLs. Edit the existing observation instead.",
    );
  const referenceId = str(o.referenceId, "Reference ID", 80);
  if (listings.length && !listings.some((l) => l.id === referenceId))
    throw new Error("The reference listing is missing.");
  if (!listings.length && referenceId)
    throw new Error("An empty report cannot have a reference listing.");
  const decisions: Workspace["decisions"] = {};
  for (const [k, v] of Object.entries(record(o.decisions ?? {}))) {
    if (!listings.some((l) => l.id === k) || k === referenceId) continue;
    decisions[id(k)] = choice(v, ["confirm", "reject"], "identity decision");
  }
  const resolved = o.resolved ?? [];
  if (!Array.isArray(resolved) || resolved.length > 500)
    throw new Error("Invalid reviewed findings.");
  const f = o.feedback ? record(o.feedback) : null;
  return {
    version: 1,
    id: id(o.id),
    name: str(o.name, "Report name", 120),
    kind: choice(o.kind, ["research", "synthetic", "personal"], "report type"),
    referenceId,
    listings,
    decisions,
    resolved: resolved.map((v) => str(v, "Finding ID", 100)),
    feedback: f
      ? {
          useful: choice(f.useful, ["yes", "no", "unsure"], "usefulness"),
          nextAction: choice(
            f.nextAction,
            ["clarify", "correct", "monitor", "none"],
            "next action",
          ),
          note: str(f.note, "Feedback", 2000),
          recordedAt: date(f.recordedAt),
        }
      : null,
  };
}

export function parseNumber(text: string): number | null {
  if (/-\s*\d/.test(text)) return null;
  let n = text.replace(/[^0-9.,]/g, "");
  if (!n) return null;
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(n)) n = n.replace(/[.,]/g, "");
  else if (n.includes(",") && n.includes(".")) {
    const decimal = n.lastIndexOf(",") > n.lastIndexOf(".") ? "," : ".";
    n =
      decimal === ","
        ? n.replace(/\./g, "").replace(",", ".")
        : n.replace(/,/g, "");
  } else n = n.replace(",", ".");
  const value = Number(n);
  return Number.isFinite(value) ? value : null;
}

/** Conservative label-based extraction. Users must review fields before saving. No LLM, no inferred identity. */
export function extractFacts(text: string): {
  data: BoatFacts;
  warnings: string[];
} {
  const data = emptyFacts();
  const warnings = [
    "Review extracted fields before saving. Unlabelled or ambiguous details may be missing.",
  ];
  const clean = text.slice(0, 30000).replace(/\r/g, "");
  const lines = clean
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  function label(names: string[]) {
    for (let i = 0; i < lines.length; i++) {
      for (const name of names) {
        const re = new RegExp(`^${name}\\s*(?::|\\||\\t)\\s*(.+)$`, "i");
        const match = lines[i].match(re);
        if (match) return match[1];
        if (lines[i].toLowerCase() === name.toLowerCase())
          return lines[i + 1] ?? "";
      }
    }
    return "";
  }
  data.make = label(["make", "brand", "manufacturer"]);
  data.model = label(["model"]);
  data.hin = label(["hin", "cin", "hin/cin", "hull identification number"]);
  data.boatName = label(["boat name", "vessel name"]);
  data.location = label(["location"]);
  data.seller = label(["seller", "broker", "advertiser"]);
  data.engine = label(["engine model", "engine"]);
  data.year = parseNumber(label(["year", "model year"]));
  data.hours = parseNumber(
    label(["engine hours", "hours", "engine usage \\(hours\\)"]),
  );
  const price = label(["price", "asking price", "original asking price"]);
  data.price = parseNumber(price);
  if (/GBP|£/i.test(price)) data.currency = "GBP";
  else if (/EUR|€/i.test(price)) data.currency = "EUR";
  else if (/USD|US\$/i.test(price)) data.currency = "USD";
  else if (data.price !== null)
    warnings.push(
      "Price currency is ambiguous. A dollar symbol alone does not establish USD.",
    );
  const currency = label(["currency"]).toUpperCase();
  if (["GBP", "EUR", "USD"].includes(currency))
    data.currency = currency as BoatFacts["currency"];
  const offer = label(["offer", "offer basis", "sale type"]);
  if (/fractional|equity share|co-ownership|co-own(?:er|ing)/i.test(clean))
    data.offer = "fractional";
  else if (/whole|full ownership/i.test(offer)) data.offer = "whole";
  else if (/charter/i.test(offer)) data.offer = "charter";
  data.shares = parseNumber(label(["fractional shares", "shares"]));
  const words: Record<string, number> = {
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  const count = clean
    .match(
      /(?:one of (?:just )?)?(\d+|four|five|six|seven|eight|nine|ten)\s+co-owners/i,
    )?.[1]
    ?.toLowerCase();
  if (count) data.narrativeShares = words[count] ?? Number(count);
  const tax = label(["vat", "tax", "vat status", "tax status"]);
  if (/not paid|unpaid|excl|not included/i.test(tax)) data.tax = "excluded";
  else if (/paid|incl/i.test(tax)) data.tax = "included";
  return { data, warnings };
}

export function csvExport(workspace: Workspace): string {
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // Spreadsheet formula injection protection.
    return `"${s.replace(/"/g, '""')}"`;
  };
  const rows: unknown[][] = [
    [
      "URL",
      "Origin",
      "Observed at",
      "Status claim",
      "Make",
      "Model",
      "Year",
      "HIN/CIN",
      "Price",
      "Currency",
      "Price kind",
      "Offer basis",
      "Tax basis",
      "Location",
      "Seller",
      "Hours",
      "Decision",
      "Note",
    ],
  ];
  workspace.listings.forEach((l) =>
    rows.push([
      l.url,
      l.origin,
      l.observedAt,
      l.status,
      l.data.make,
      l.data.model,
      l.data.year,
      l.data.hin,
      l.data.price,
      l.data.currency,
      l.data.priceKind,
      l.data.offer,
      l.data.tax,
      l.data.location,
      l.data.seller,
      l.data.hours,
      workspace.decisions[l.id] ??
        (l.id === workspace.referenceId ? "reference" : "undecided"),
      l.note,
    ]),
  );
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
