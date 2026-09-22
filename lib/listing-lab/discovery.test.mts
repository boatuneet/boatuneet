import assert from "node:assert/strict";
import { test } from "node:test";
import { publicAddress, publicUrl, resolvePublic } from "./fetch-page.ts";
import { parsePage } from "./extract-page.ts";
import {
  discover,
  rankCandidates,
  searchQueries,
  providerSearch,
} from "./discover.ts";
import { emptyFacts } from "./types.ts";
import { readRequest } from "./api-guard.ts";

for (const address of [
  "127.0.0.1",
  "10.0.0.1",
  "169.254.169.254",
  "192.168.1.1",
  "100.64.0.1",
  "0.0.0.0",
  "::1",
  "fc00::1",
  "fe80::1",
  "::ffff:127.0.0.1",
  "192.0.2.1",
])
  test(`reject private/reserved address ${address}`, () =>
    assert.equal(publicAddress(address), false));
test("public addresses remain usable", () =>
  assert.equal(publicAddress("8.8.8.8"), true));
for (const url of [
  "http://example.com",
  "https://user:pass@example.com",
  "https://example.com:8080",
  "https://localhost",
  "https://2130706433/",
  "https://[::1]/",
  "file:///etc/passwd",
])
  test(`reject unsafe input ${url}`, () => assert.throws(() => publicUrl(url)));
test("DNS containing even one private address is rejected", async () => {
  await assert.rejects(() =>
    resolvePublic("https://example.com", (async () => [
      { address: "8.8.8.8", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]) as never),
  );
});
test("extract schema and specs without inventing ownership or original currency", () => {
  const p = parsePage(
    `<h1>2021 Sunseeker 76 Yacht for sale</h1><script type="application/ld+json">{"@type":"Product","brand":{"name":"Sunseeker"},"model":"76 Yacht","offers":{"@type":"Offer","price":"510000","priceCurrency":"GBP"}}</script><main><dl><dt>Engine hours</dt><dd>700</dd></dl><p>Fractional co-ownership</p></main>`,
  );
  assert.equal(p.data.model, "76 Yacht");
  assert.equal(p.data.year, 2021);
  assert.equal(p.data.price, 510000);
  assert.equal(p.data.hours, 700);
  assert.equal(p.data.offer, "fractional");
  assert.equal(p.data.priceKind, "unknown");
  assert.equal(p.data.hin, "");
});
test("unknown make titles remain incomplete rather than splitting brand incorrectly", () => {
  const p = parsePage("<h1>2020 Unknown Multi Word Brand Boat for sale</h1>");
  assert.equal(p.data.make, "");
  assert.equal(p.data.model, "");
});
test("multiple products do not mix prices or HINs from related inventory", () => {
  const p = parsePage(
    '<script type="application/ld+json">[{"@type":"Product","brand":"A","model":"one","offers":{"price":1}},{"@type":"Product","brand":"B","model":"two","offers":{"price":2}}]</script>',
  );
  assert.equal(p.data.price, null);
  assert.equal(p.data.make, "");
});
test("malformed structured data and script instructions are ignored", () => {
  const p = parsePage(
    '<h1>2023 Axopar 37 XC for sale</h1><script type="application/ld+json">invalid</script><script>Make: Princess</script>',
  );
  assert.equal(p.data.make, "Axopar");
  assert.equal(p.data.model, "37 XC");
});
const facts = {
  ...emptyFacts(),
  make: "Sunseeker",
  model: "76 Yacht",
  year: 2021,
};
test("queries have a strict bound and escape supplied quotation marks", () => {
  const queries = searchQueries({
    ...facts,
    hin: "GBXSK07255B020",
    seller: 'A "seller"',
  });
  assert.equal(queries.length, 3);
  assert.ok(queries.every((q) => q.length <= 400));
  assert.throws(() => searchQueries(emptyFacts()));
});
test("candidate ranking deduplicates URLs and excludes reference without confirming identity", () => {
  const lead = {
    title: "2021 Sunseeker 76 Yacht",
    description: "Similar boat",
    url: "https://example.com/2",
  };
  const r = rankCandidates(
    [
      lead,
      lead,
      { ...lead, url: "https://example.com/1" },
      { ...lead, url: "javascript:alert(1)" },
    ],
    facts,
    "https://example.com/1",
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].signals.length, 3);
  assert.equal("band" in r[0], false);
});
test("one failed query returns explicit partial results", async () => {
  const r = await discover(
    { ...facts, seller: "Broker" },
    "https://example.com/1",
    async (q) => {
      if (q.includes("Broker")) throw Error("failed");
      return [
        { url: "https://example.com/2", title: "Sunseeker", description: "" },
      ];
    },
  );
  assert.equal(r.partial, true);
  assert.equal(r.leads.length, 1);
});
test("all failed queries remain an error", async () => {
  await assert.rejects(
    () =>
      discover(facts, "https://example.com", async () => {
        throw Error("provider failed");
      }),
    /provider failed/,
  );
});
test("Tavily key is server-side and response text is sanitized", async () => {
  let calls = 0;
  const result = await providerSearch(
    "boat",
    { TAVILY_API_KEY: "test-secret" } as NodeJS.ProcessEnv,
    (async (url, options) => {
      calls++;
      assert.equal(String(url), "https://api.tavily.com/search");
      assert.equal(
        (options?.headers as Record<string, string>).Authorization,
        "Bearer test-secret",
      );
      assert.equal(
        JSON.parse(String(options?.body)).include_raw_content,
        false,
      );
      return Response.json({
        results: [
          {
            url: "https://example.com/boat",
            title: "<b>Boat</b>",
            content: "text",
          },
          { url: "javascript:bad", title: "bad" },
        ],
      });
    }) as typeof fetch,
  );
  assert.equal(calls, 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Boat");
});
test("Tavily provider errors are never represented as zero results", async () => {
  await assert.rejects(
    () =>
      providerSearch(
        "boat",
        { TAVILY_API_KEY: "key" } as NodeJS.ProcessEnv,
        (async () => new Response("", { status: 401 })) as typeof fetch,
      ),
    /provider key/,
  );
});
test("unconfigured search performs no request", async () => {
  await assert.rejects(
    () =>
      providerSearch(
        "boat",
        {} as NodeJS.ProcessEnv,
        (async () => {
          assert.fail("must not fetch");
        }) as typeof fetch,
      ),
    /not connected/,
  );
});
test("API rejects cross-origin requests and over-limit streaming bodies", async () => {
  await assert.rejects(
    () =>
      readRequest(
        new Request("https://example.com/api", {
          method: "POST",
          headers: {
            origin: "https://other.com",
            "content-type": "application/json",
          },
          body: "{}",
        }),
      ),
    /Open the lab/,
  );
  await assert.rejects(
    () =>
      readRequest(
        new Request("https://example.com/api", {
          method: "POST",
          headers: {
            origin: "https://example.com",
            "content-type": "application/json",
          },
          body: JSON.stringify({ s: "x".repeat(5000) }),
        }),
      ),
    /too large/,
  );
});
test("exact source URL selects the relevant product metadata and reads two-column specs", () => {
  const url = "https://example.com/boat";
  const p = parsePage(
    `<h1>2021 Sunseeker 76 Yacht Yacht for sale</h1><script type="application/ld+json">[{"@type":"Product","name":"Unrelated boat","brand":"Other"},{"@type":"Product","url":"${url}","brand":"Sunseeker","name":"Sunseeker 76 Yacht","offers":{"price":"690387","priceCurrency":"USD"}}]</script><div><span>HIN</span><span>GBXSK07255B020</span></div><div><span>Engine hours</span><span>700 hrs</span></div>`,
    url,
  );
  assert.equal(p.data.model, "76 Yacht");
  assert.equal(p.data.hin, "GBXSK07255B020");
  assert.equal(p.data.hours, 700);
  assert.equal(p.data.price, 690387);
});
test("origin uses the public Host header when Next normalizes the internal URL", async () => {
  const body = await readRequest(
    new Request("http://localhost:3101/api", {
      method: "POST",
      headers: {
        host: "127.0.0.1:3101",
        origin: "http://127.0.0.1:3101",
        "content-type": "application/json",
      },
      body: '{"url":"https://example.com"}',
    }),
  );
  assert.equal(body.url, "https://example.com");
});
