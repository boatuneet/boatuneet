import { safeUrl } from "./engine.ts";

export interface SearchLead {
  title: string;
  url: string;
  description: string;
}
export class SearchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export async function searchWeb(
  query: string,
  key: string,
  fetcher: typeof fetch = fetch,
): Promise<SearchLead[]> {
  if (!key)
    throw new SearchError(
      "Live search is not connected. Use the guided searches below, then add observations from the sources you review.",
      503,
    );
  if (!query.trim() || query.length > 400)
    throw new SearchError(
      "Enter a search query between 1 and 400 characters.",
      400,
    );
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "10");
  url.searchParams.set("text_decorations", "false");
  let response: Response;
  try {
    response = await fetcher(url, {
      headers: { Accept: "application/json", "X-Subscription-Token": key },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
  } catch {
    throw new SearchError(
      "Search did not respond in time. Try again or use a guided search.",
      504,
    );
  }
  if (response.status === 429)
    throw new SearchError(
      "The search provider's rate limit was reached. Wait a minute before retrying.",
      429,
    );
  if (!response.ok)
    throw new SearchError(
      "The search provider could not complete the request. Check the server credential and subscription.",
      502,
    );
  let body: { web?: { results?: unknown[] } };
  try {
    body = await response.json();
  } catch {
    throw new SearchError(
      "The search provider returned an unreadable response.",
      502,
    );
  }
  const results = body?.web?.results;
  if (results !== undefined && !Array.isArray(results))
    throw new SearchError(
      "The search provider returned an unexpected response.",
      502,
    );
  const seen = new Set<string>();
  return (results ?? []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const r = item as Record<string, unknown>;
    const url = typeof r.url === "string" ? safeUrl(r.url) : "";
    if (!url || seen.has(url)) return [];
    seen.add(url);
    const plain = (v: unknown, max: number) =>
      typeof v === "string" ? v.replace(/<[^>]*>/g, "").slice(0, max) : "";
    return [
      {
        url,
        title: plain(r.title, 250) || new URL(url).hostname,
        description: plain(r.description, 700),
      },
    ];
  });
}
