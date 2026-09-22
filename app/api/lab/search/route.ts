import { SearchError } from "@/lib/listing-lab/search";
import {
  providerName,
  providerSearch,
  discover,
} from "@/lib/listing-lab/discover";
import { validateFacts } from "@/lib/listing-lab/import";
import { readRequest, noStore, apiError } from "@/lib/listing-lab/api-guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;
export async function GET() {
  const provider = providerName();
  return Response.json(
    {
      connected: Boolean(provider),
      provider,
      scope:
        "Search-index candidates; identity and availability are unverified",
    },
    { headers: noStore },
  );
}
export async function POST(request: Request) {
  try {
    const body = await readRequest(request, 10000);
    if (!providerName())
      throw new SearchError(
        "Automatic search is not connected yet. The site owner must configure a search provider. Your saved report is unaffected.",
        503,
      );
    if (body.facts) {
      let facts;
      try {
        facts = validateFacts(body.facts);
      } catch {
        throw new SearchError("Check the boat details before searching.", 400);
      }
      if (
        typeof body.referenceUrl !== "string" ||
        body.referenceUrl.length > 2000
      )
        throw new SearchError("A reference URL is required.", 400);
      return Response.json(
        {
          ...(await discover(facts, body.referenceUrl)),
          provider: providerName(),
        },
        { headers: noStore },
      );
    }
    if (
      typeof body.query !== "string" ||
      !body.query.trim() ||
      body.query.length > 400
    )
      throw new SearchError(
        "Enter a search query between 1 and 400 characters.",
        400,
      );
    return Response.json(
      {
        leads: await providerSearch(body.query),
        provider: providerName(),
        searchedAt: new Date().toISOString(),
      },
      { headers: noStore },
    );
  } catch (error) {
    return apiError(error);
  }
}
