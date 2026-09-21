import assert from "node:assert/strict";
import { test } from "node:test";
import {
  advertisementKey,
  audit,
  buildMatches,
  discoveryQueries,
  matchListing,
  normalizeHin,
  safeUrl,
  updateListing,
} from "./engine.ts";
import { blankWorkspace, researchCase, syntheticCase } from "./cases.ts";
import {
  csvExport,
  extractFacts,
  parseNumber,
  parseWorkspace,
  validateListing,
} from "./import.ts";
import { SearchError, searchWeb } from "./search.ts";

const now = Date.parse("2026-09-21T18:00:00Z");
test("real case groups the locale, links only a namespaced advertisement, leaves four candidates", () => {
  const matches = buildMatches(researchCase());
  assert.equal(matches.length, 6);
  assert.equal(
    matches.filter((m) => ["reference", "strong"].includes(m.band)).length,
    2,
  );
  assert.equal(matches.filter((m) => m.band === "review").length, 4);
  assert.equal(matches[0].aliases.length, 1);
  assert.equal(
    matches.find((m) => m.listing.id === "sun-machinio")?.band,
    "review",
  );
});
test("same make/model/year/seller without unique identity remains a candidate", () => {
  const w = syntheticCase();
  assert.equal(matchListing(w.listings[0], w.listings[3]).band, "review");
});
test("normalized HIN links the synthetic same boat", () => {
  const w = syntheticCase();
  assert.equal(normalizeHin("FI-AXO7C123A323"), "FIAXO7C123A323");
  assert.equal(matchListing(w.listings[0], w.listings[1]).band, "strong");
});
test("conflicting HIN cannot be overridden by a confirm decision", () => {
  const w = syntheticCase();
  const match = matchListing(w.listings[0], w.listings[2], "confirm");
  assert.equal(match.band, "excluded");
  assert.equal(match.hardConflict, true);
});
test("short arbitrary HIN equality is not proof", () => {
  const w = syntheticCase();
  w.listings[0].data.hin = "123";
  w.listings[3].data.hin = "123";
  assert.equal(matchListing(w.listings[0], w.listings[3]).band, "review");
});
test("a shared numeric ID is namespaced, not globally unique", () => {
  assert.equal(
    advertisementKey("https://unknown.example.com/yacht/foo-10027876/"),
    null,
  );
  assert.equal(
    advertisementKey("https://yachtworld.com.evil.test/yacht/foo-10027876/"),
    null,
  );
});
test("owner decisions are reversible and do not change source evidence", () => {
  const w = researchCase(),
    l = w.listings[3],
    ref = w.listings[0];
  assert.equal(matchListing(ref, l, "confirm").band, "strong");
  assert.equal(matchListing(ref, l, "reject").band, "excluded");
  assert.equal(matchListing(ref, l).band, "review");
  assert.equal(ref.data.hin, "");
});
test("candidate HIN never becomes transitive reference truth", () => {
  const w = researchCase();
  w.decisions["sun-ng"] = "confirm";
  w.listings[4].data.hin = w.listings[3].data.hin;
  assert.equal(
    buildMatches(w).find((m) => m.listing.id === "sun-machinio")?.band,
    "review",
  );
});
test("real case flags share basis and contradicting terms, not a fake price gap", () => {
  const findings = audit(researchCase(), now);
  assert.ok(findings.some((f) => f.id === "fractional"));
  assert.ok(findings.some((f) => f.id === "share-terms"));
  assert.ok(findings.some((f) => f.id === "currency"));
  assert.ok(!findings.some((f) => f.id.startsWith("price-")));
});
test("known like-for-like whole-boat prices expose the meaningful gap", () => {
  assert.match(
    audit(syntheticCase(), now).find((f) => f.id.startsWith("price-"))!.title,
    /16,000/,
  );
});
for (const invalid of [
  "currency",
  "tax",
  "offer",
  "priceKind",
  "status",
  "stale",
] as const) {
  test(`price gaps exclude incompatible ${invalid}`, () => {
    const w = syntheticCase();
    const l = w.listings[1];
    if (invalid === "currency") l.data.currency = "USD";
    if (invalid === "tax") l.data.tax = "unknown";
    if (invalid === "offer") l.data.offer = "fractional";
    if (invalid === "priceKind") l.data.priceKind = "converted";
    if (invalid === "status") l.status = "unknown";
    if (invalid === "stale") l.observedAt = "2026-01-01T00:00:00Z";
    assert.ok(!audit(w, now).some((f) => f.id.startsWith("price-")));
  });
}
test("fractional share counts alone never establish equivalent offer rights", () => {
  const w = syntheticCase();
  w.listings.forEach((l) => {
    l.data.offer = "fractional";
    l.data.shares = 8;
  });
  assert.ok(!audit(w, now).some((f) => f.id.startsWith("price-")));
});
test("empty report returns no invented findings or matches", () => {
  assert.deepEqual(buildMatches(blankWorkspace()), []);
  assert.deepEqual(audit(blankWorkspace()), []);
});
test("saving edits retains old facts and old observation time", () => {
  const w = syntheticCase();
  w.decisions["demo-linked"] = "confirm";
  w.resolved = ["some-finding"];
  const old = w.listings[1];
  const next = updateListing(
    w,
    { ...old, data: { ...old.data, price: 289000 } },
    "2026-09-21T18:00:00Z",
  );
  assert.equal(next.listings[1].history[0].data.price, 305000);
  assert.equal(next.listings[1].history[0].observedAt, old.observedAt);
  assert.equal(next.listings[1].capturedAt, "2026-09-21T18:00:00Z");
  assert.equal(next.decisions[old.id], undefined);
  assert.deepEqual(next.resolved, []);
});
test("changing the reference invalidates all existing human identity decisions", () => {
  const w = researchCase();
  w.decisions["sun-ng"] = "confirm";
  const next = updateListing(w, {
    ...w.listings[0],
    data: { ...w.listings[0].data, make: "Azimut" },
  });
  assert.deepEqual(next.decisions, {});
});
test("existing source URLs are immutable and history preserves provenance", () => {
  const w = syntheticCase();
  assert.throws(
    () =>
      updateListing(w, {
        ...w.listings[0],
        url: "https://another.example.com/boat",
      }),
    /cannot be changed/,
  );
  const next = updateListing(w, { ...w.listings[0], origin: "manual" });
  assert.equal(next.listings[0].history[0].origin, "synthetic");
});
test("unknown original currency cannot create a price gap", () => {
  const w = syntheticCase();
  w.listings[1].data.priceKind = "unknown";
  assert.ok(!audit(w, now).some((f) => f.id.startsWith("price-")));
});
test("report JSON is a lossless round trip, including observations", () => {
  const w = researchCase();
  assert.deepEqual(parseWorkspace(JSON.stringify(w)), w);
});
test("import rejects unsafe links, duplicate records and missing reference", () => {
  const w = researchCase();
  w.listings[0].url = "javascript:alert(1)";
  assert.throws(() => parseWorkspace(JSON.stringify(w)), /http/);
  const d = researchCase();
  d.listings.push(d.listings[0]);
  assert.throws(() => parseWorkspace(JSON.stringify(d)), /unique/);
  const r = researchCase();
  r.referenceId = "not-found";
  assert.throws(() => parseWorkspace(JSON.stringify(r)), /missing/);
});
test("malformed, oversize and unsupported reports have understandable errors", () => {
  assert.throws(() => parseWorkspace("oops"), /valid JSON/);
  assert.throws(() => parseWorkspace("x".repeat(1_000_001)), /too large/);
  assert.throws(() => parseWorkspace('{"version":2}'), /version/);
});
test("import rejects extreme or non-finite numeric data and prototype keys", () => {
  const l = syntheticCase().listings[0];
  assert.throws(
    () => validateListing({ ...l, data: { ...l.data, year: 9000 } }),
    /Year/,
  );
  assert.throws(
    () => validateListing({ ...l, data: { ...l.data, hours: Infinity } }),
    /Hours/,
  );
  assert.throws(() => validateListing({ ...l, id: "__proto__" }), /Invalid ID/);
});
test("URLs discard tracking but retain meaningful listing query IDs", () => {
  assert.equal(
    safeUrl("https://boat.example.com/listing?id=42&utm_source=test#photos"),
    "https://boat.example.com/listing?id=42",
  );
  assert.equal(safeUrl("https://secret:password@example.com"), "");
  assert.equal(safeUrl("file:///etc/passwd"), "");
});
test("labelled extraction understands European prices and fractional contradictions", () => {
  const { data } = extractFacts(
    "Make: Sunseeker\nModel: 76 Yacht\nYear: 2021\nPrice: EUR 510.000,50\nEngine hours: 700\nFractional Shares: 8\nOne of just six co-owners\nVAT: not paid",
  );
  assert.equal(data.price, 510000.5);
  assert.equal(data.currency, "EUR");
  assert.equal(data.year, 2021);
  assert.equal(data.offer, "fractional");
  assert.equal(data.shares, 8);
  assert.equal(data.narrativeShares, 6);
  assert.equal(data.tax, "excluded");
});
test("bare dollar currency and unknown offer basis are never guessed", () => {
  const { data, warnings } = extractFacts(
    "Price: $300,000\nMake: Axopar\nModel: 37",
  );
  assert.equal(data.currency, "unknown");
  assert.equal(data.offer, "unknown");
  assert.ok(warnings.some((w) => w.includes("ambiguous")));
});
test("prices support grouping separators and reject negatives", () => {
  assert.equal(parseNumber("£510,000"), 510000);
  assert.equal(parseNumber("€510.000"), 510000);
  assert.equal(parseNumber("EUR 1 200 000"), 1200000);
  assert.equal(parseNumber("-100"), null);
});
test("CSV values cannot become spreadsheet formulas", () => {
  const w = syntheticCase();
  w.listings[0].note = '=HYPERLINK("https://example.com")';
  assert.ok(csvExport(w).includes("\"'=HYPERLINK("));
});
test("guided search escapes identifiers and produces external search links", () => {
  const q = discoveryQueries(researchCase().listings[0]);
  assert.ok(q.some((q) => q.query.includes('"10027876"')));
  assert.ok(q.every((q) => new URL(q.url).hostname === "www.google.com"));
});
test("no search key produces an explicit disconnected state without a network request", async () => {
  let called = false;
  await assert.rejects(
    () =>
      searchWeb("test", "", (() => {
        called = true;
      }) as unknown as typeof fetch),
    (e: unknown) => e instanceof SearchError && e.status === 503,
  );
  assert.equal(called, false);
});
test("search response sanitizes links and text and deduplicates exact URLs", async () => {
  const fetcher = (async (url: URL, options: RequestInit) => {
    assert.equal(url.hostname, "api.search.brave.com");
    assert.equal(options.cache, "no-store");
    return Response.json({
      web: {
        results: [
          {
            title: "<b>Sunseeker</b>",
            url: "https://example.com/listing",
            description: "Boat",
          },
          { url: "javascript:alert(1)" },
          { url: "https://example.com/listing" },
        ],
      },
    });
  }) as typeof fetch;
  const result = await searchWeb("Sunseeker", "test-key", fetcher);
  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Sunseeker");
});
for (const status of [401, 429, 500])
  test(`search provider failure ${status} is explicit, never fabricated results`, async () => {
    await assert.rejects(
      () =>
        searchWeb(
          "test",
          "key",
          (async () => new Response("", { status })) as typeof fetch,
        ),
      (e: unknown) =>
        e instanceof SearchError && e.status === (status === 429 ? 429 : 502),
    );
  });
test("search empty results remain empty and timeouts are recoverable", async () => {
  assert.deepEqual(
    await searchWeb("test", "key", (async () =>
      Response.json({})) as typeof fetch),
    [],
  );
  await assert.rejects(
    () =>
      searchWeb("test", "key", (async () => {
        throw new Error("timeout");
      }) as typeof fetch),
    (e: unknown) => e instanceof SearchError && e.status === 504,
  );
});
