import type { BoatFacts } from "./types.ts";
import { safeUrl } from "./engine.ts";
import { searchWeb, SearchError } from "./search.ts";
import type { SearchLead } from "./search.ts";
export type Candidate = SearchLead & { signals: string[]; rank: number };
const quoted = (s: string) => `"${s.replace(/["\\\n\r]/g, " ").trim()}"`;
export function searchQueries(facts: BoatFacts) {
  if (!facts.hin && (!facts.make || !facts.model))
    throw new SearchError(
      "Add a HIN/CIN or make and model before searching.",
      400,
    );
  const model = [facts.year, quoted(facts.make), quoted(facts.model)]
    .filter(Boolean)
    .join(" ");
  return [
    ...new Set([
      ...(facts.hin ? [quoted(facts.hin) + " boat"] : []),
      model + " boat yacht for sale",
      ...(facts.boatName
        ? [model + " " + quoted(facts.boatName)]
        : facts.seller
          ? [model + " " + quoted(facts.seller)]
          : []),
    ]),
  ]
    .slice(0, 3)
    .map((q) => q.slice(0, 400));
}
export function rankCandidates(
  leads: SearchLead[],
  facts: BoatFacts,
  referenceUrl: string,
): Candidate[] {
  const seen = new Set([safeUrl(referenceUrl).replace(/\/$/, "")]);
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return leads
    .flatMap((lead) => {
      const url = safeUrl(lead.url);
      const key = url.replace(/\/$/, "");
      if (!url || seen.has(key)) return [];
      seen.add(key);
      const text = norm(lead.title + " " + lead.description);
      const signals: string[] = [];
      if (facts.hin && text.includes(norm(facts.hin)))
        signals.push("Reported HIN appears in search result");
      if (facts.make && text.includes(norm(facts.make)))
        signals.push("Make mentioned");
      if (facts.model && text.includes(norm(facts.model)))
        signals.push("Model mentioned");
      if (facts.year && text.includes(String(facts.year)))
        signals.push("Year mentioned");
      if (facts.boatName && text.includes(norm(facts.boatName)))
        signals.push("Boat name mentioned");
      if (facts.seller && text.includes(norm(facts.seller)))
        signals.push("Advertiser mentioned");
      return [
        {
          ...lead,
          url,
          signals,
          rank:
            signals.length + (signals[0]?.startsWith("Reported HIN") ? 10 : 0),
        },
      ];
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 20);
}
export function providerName(env = process.env) {
  return env.TAVILY_API_KEY
    ? "Tavily"
    : env.BRAVE_SEARCH_API_KEY
      ? "Brave Search"
      : null;
}
export async function providerSearch(
  query: string,
  env = process.env,
  fetcher: typeof fetch = fetch,
): Promise<SearchLead[]> {
  if (!env.TAVILY_API_KEY)
    return searchWeb(query, env.BRAVE_SEARCH_API_KEY ?? "", fetcher);
  let response: Response;
  try {
    response = await fetcher("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: 10,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
        auto_parameters: false,
      }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
  } catch {
    throw new SearchError(
      "The search provider took too long. Please try again.",
      504,
    );
  }
  if (!response.ok)
    throw new SearchError(
      response.status === 429
        ? "The search provider rate limit was reached."
        : "Search is unavailable. The site owner needs to check the provider key and usage limit.",
      response.status === 429 ? 429 : 502,
    );
  const body = await response.json();
  if (!Array.isArray(body.results))
    throw new SearchError(
      "The search provider returned an unreadable response.",
      502,
    );
  return body.results.slice(0, 10).flatMap((r: Record<string, unknown>) => {
    if (!r || typeof r !== "object") return [];
    const url = typeof r.url === "string" ? safeUrl(r.url) : "";
    const plain = (v: unknown, max: number) =>
      typeof v === "string" ? v.replace(/<[^>]*>/g, "").slice(0, max) : "";
    return url
      ? [
          {
            url,
            title: plain(r.title, 250),
            description: plain(r.content, 700),
          },
        ]
      : [];
  });
}
export async function discover(
  facts: BoatFacts,
  referenceUrl: string,
  searcher = providerSearch,
) {
  const queries = searchQueries(facts);
  const results = await Promise.allSettled(queries.map((q) => searcher(q)));
  const successful = results.filter((r) => r.status === "fulfilled");
  if (!successful.length) throw (results[0] as PromiseRejectedResult).reason;
  return {
    leads: rankCandidates(
      successful.flatMap((r) => r.value),
      facts,
      referenceUrl,
    ),
    queries,
    searchedAt: new Date().toISOString(),
    partial: successful.length < queries.length,
  };
}
