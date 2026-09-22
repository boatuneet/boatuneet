import { load } from "cheerio";
import { emptyFacts } from "./types.ts";
import type { BoatFacts } from "./types.ts";
import { extractFacts } from "./import.ts";

export interface ExtractedPage {
  data: BoatFacts;
  title: string;
  warnings: string[];
  evidence: string[];
}
const clean = (v: unknown): string =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 300) : "";
const named = (v: unknown): string =>
  typeof v === "object" && v
    ? clean((v as Record<string, unknown>).name)
    : clean(v);
const numeric = (v: unknown, max: number): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
};
export function parsePage(html: string, sourceUrl = ""): ExtractedPage {
  const $ = load(html);
  const title = clean(
    $("h1").first().text() ||
      $('meta[property="og:title"]').attr("content") ||
      $("title").text(),
  );
  const evidence: string[] = [];
  const warnings = [
    "Extracted draft: review every field. Reading a page does not verify identity, ownership or availability.",
  ];
  let data = emptyFacts();
  data.priceKind = "unknown";
  const products: Record<string, unknown>[] = [];
  function visit(v: unknown, depth = 0) {
    if (depth > 8 || !v || typeof v !== "object") return;
    if (Array.isArray(v)) {
      v.slice(0, 100).forEach((x) => visit(x, depth + 1));
      return;
    }
    const o = v as Record<string, unknown>;
    const types = Array.isArray(o["@type"]) ? o["@type"] : [o["@type"]];
    if (types.some((t) => ["Product", "Vehicle", "Boat"].includes(String(t))))
      products.push(o);
    if (o["@graph"]) visit(o["@graph"], depth + 1);
    if (o.mainEntity) visit(o.mainEntity, depth + 1);
  }
  $('script[type="application/ld+json"]')
    .slice(0, 20)
    .each((_, el) => {
      try {
        visit(JSON.parse($(el).text()));
      } catch {
        /* malformed metadata is not evidence */
      }
    });
  // Multiple products can be related inventory: do not silently choose one.
  const exact = sourceUrl ? products.filter((p) => p.url === sourceUrl) : [];
  const selected = exact.length === 1 ? exact : products;
  if (selected.length === 1) {
    const p = selected[0];
    data.make = named(p.brand) || named(p.manufacturer);
    data.model = named(p.model);
    if (
      !data.model &&
      data.make &&
      named(p.name)
        .toLowerCase()
        .startsWith(data.make.toLowerCase() + " ")
    )
      data.model = named(p.name).slice(data.make.length).trim();
    data.year = numeric(p.vehicleModelDate ?? p.productionDate, 2100);
    if (data.year && data.year < 1800) data.year = null;
    // vehicleIdentificationNumber can be a car VIN; require plausible vessel length.
    const hin = clean(p.vehicleIdentificationNumber).replace(/[^a-z0-9]/gi, "");
    if ([12, 14].includes(hin.length)) data.hin = hin.toUpperCase();
    const offer =
      !Array.isArray(p.offers) && typeof p.offers === "object" && p.offers
        ? (p.offers as Record<string, unknown>)
        : null;
    if (offer && offer["@type"] !== "AggregateOffer") {
      data.price = numeric(offer.price, 1e9);
      const currency = clean(offer.priceCurrency).toUpperCase();
      if (["EUR", "GBP", "USD"].includes(currency))
        data.currency = currency as BoatFacts["currency"];
      data.seller = named(offer.seller);
    }
    evidence.push("Structured listing metadata");
  } else if (products.length > 1)
    warnings.push(
      "Multiple products were found; their structured facts were not merged.",
    );
  const lines: string[] = [];
  $("tr")
    .slice(0, 150)
    .each((_, el) => {
      const cells = $(el).find("th,td");
      if (cells.length === 2)
        lines.push(
          `${clean(cells.eq(0).text())}: ${clean(cells.eq(1).text())}`,
        );
    });
  $("dt")
    .slice(0, 100)
    .each((_, el) => {
      lines.push(`${clean($(el).text())}: ${clean($(el).next("dd").text())}`);
    });
  $("div,li")
    .slice(0, 2000)
    .each((_, el) => {
      const children = $(el).children();
      if (
        children.length !== 2 ||
        children.eq(0).children().length ||
        children.eq(1).children().length
      )
        return;
      const label = clean(children.eq(0).text()).replace(/:$/, "");
      if (
        /^(make|brand|manufacturer|model|year|model year|hin|cin|boat name|vessel name|location|seller|broker|advertiser|engine model|engine hours|price|asking price|currency|fractional shares|vat|tax status)$/i.test(
          label,
        )
      )
        lines.push(`${label}: ${clean(children.eq(1).text())}`);
    });
  // Exclude navigation, related articles and scripts from prose extraction.
  $("script,style,nav,header,footer,aside,noscript").remove();
  $("br").replaceWith("\n");
  $("p,li,div").append("\n");
  const prose = ($("main").text() || $("body").text()).slice(0, 30000);
  const labelled = extractFacts(lines.join("\n"));
  for (const [key, value] of Object.entries(labelled.data)) {
    if (
      value !== "" &&
      value !== null &&
      value !== "unknown" &&
      key !== "priceKind"
    )
      (data as unknown as Record<string, unknown>)[key] = value;
  }
  if (lines.length) evidence.push("Labelled specification fields");
  // Title is a fallback for identity only; no engine/price numbers inferred here.
  const identity = title.match(
    /\b((?:19|20)\d{2})\s+(.+?)(?:\s+for sale\b|\s*[|–]\s*|$)/i,
  );
  if (identity) {
    data.year ??= Number(identity[1]);
    const name = identity[2].replace(/\s+-\s+.*$/, "").trim();
    if (
      data.make &&
      !data.model &&
      name.toLowerCase().startsWith(data.make.toLowerCase() + " ")
    )
      data.model = name.slice(data.make.length).trim();
    if (!data.make && !data.model) {
      const known = name.match(
        /^(Boston Whaler|Grand Banks|Sea Ray|Van der Valk|Sunseeker|Princess|Azimut|Fairline|Ferretti|Beneteau|Bénéteau|Jeanneau|Bavaria|Axopar|Galeon|Prestige|Lagoon|Sealine|Riva|Sanlorenzo|Pershing|Absolute|Nimbus|Fountaine Pajot)\s+(.+)$/i,
      );
      if (known) {
        data.make = known[1];
        data.model = known[2];
      }
    }
    evidence.push("Page title (identity draft)");
  }
  if (/fractional|co-ownership|co-owners|equity share/i.test(prose)) {
    data.offer = "fractional";
    data.narrativeShares = extractFacts(prose).data.narrativeShares;
  } else if (/\bcharter\s+(?:rate|price)|per week|per day/i.test(prose))
    data.offer = "charter";
  // Never assume the displayed currency is the original asking currency.
  data.priceKind = "unknown";
  if (!data.make || !data.model)
    warnings.push(
      "Make/model could not be established completely. Fill the missing fields before searching.",
    );
  if (!data.hin)
    warnings.push(
      "No reliable HIN/CIN was extracted. Similar boats will remain candidates until reviewed.",
    );
  return { data, title, warnings, evidence };
}
