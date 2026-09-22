import { extractListing } from "@/lib/listing-lab/extract-listing";
import { readRequest, noStore, apiError } from "@/lib/listing-lab/api-guard";
import { SearchError } from "@/lib/listing-lab/search";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    const body = await readRequest(request);
    if (typeof body.url !== "string")
      throw new SearchError("A listing URL is required.", 400);
    return Response.json(await extractListing(body.url), { headers: noStore });
  } catch (error) {
    return apiError(error);
  }
}
