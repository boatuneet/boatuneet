import { fetchPage, publicUrl } from "./fetch-page.ts";
import { parsePage } from "./extract-page.ts";
import { providerName, providerSearch } from "./discover.ts";
import { SearchError } from "./search.ts";
import { safeUrl } from "./engine.ts";
export async function extractListing(input: string) {
  publicUrl(input);
  try {
    const page = await fetchPage(input);
    const draft = parsePage(page.html, page.url);
    if (!draft.data.make && !draft.data.model && !draft.data.hin)
      throw new SearchError(
        "No usable boat details were exposed on this page.",
        422,
      );
    return {
      ...draft,
      sourceUrl: page.url,
      source: "public page",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof SearchError && error.status === 400) throw error;
    if (!providerName()) throw error;
    // A search-index snapshot is a separate, explicitly labelled evidence source.
    // Do not fetch blocked pages through another proxy or substitute another ad.
    const canonical = (s: string) =>
      safeUrl(s).replace("://www.", "://").replace(/\/$/, "");
    const results = await providerSearch(input);
    const exact = results.find((r) => canonical(r.url) === canonical(input));
    if (!exact)
      throw new SearchError(
        "The page could not be read and no exact indexed copy was found. Paste its details to continue.",
        422,
      );
    const escape = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const draft = parsePage(
      `<h1>${escape(exact.title)}</h1><main><p>${escape(exact.description)}</p></main>`,
    );
    if (!draft.data.make || !draft.data.model)
      throw new SearchError(
        "The search index did not expose enough boat details. Enter make and model to continue.",
        422,
      );
    return {
      ...draft,
      sourceUrl: exact.url,
      source: "search index",
      fetchedAt: new Date().toISOString(),
      warnings: [
        "The source page could not be read. These are search-index snippets and may be incomplete or out of date.",
        ...draft.warnings,
      ],
      evidence: ["Exact-URL search result title and snippet"],
    };
  }
}
