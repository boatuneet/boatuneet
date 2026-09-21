import { SearchError, searchWeb } from "@/lib/listing-lab/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
let recent: number[] = [];
function local(request: Request) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(
    new URL(request.url).hostname,
  );
}
export async function GET(request: Request) {
  return Response.json(
    {
      connected: local(request) && Boolean(process.env.BRAVE_SEARCH_API_KEY),
      provider: "Brave Search",
      scope: "Indexed web leads only; no marketplace status verification",
    },
    { headers },
  );
}
export async function POST(request: Request) {
  if (!local(request))
    return Response.json(
      { error: "Live search in this POC is available on localhost only." },
      { status: 403, headers },
    );
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403, headers },
    );
  if (Number(request.headers.get("content-length") ?? 0) > 4096)
    return Response.json(
      { error: "Request is too large." },
      { status: 413, headers },
    );
  recent = recent.filter((at) => Date.now() - at < 60000);
  if (recent.length >= 10)
    return Response.json(
      { error: "This local POC allows 10 searches per minute. Please wait." },
      { status: 429, headers },
    );
  try {
    const text = await request.text();
    if (text.length > 4096)
      return Response.json(
        { error: "Request is too large." },
        { status: 413, headers },
      );
    const body: unknown = JSON.parse(text);
    if (
      !body ||
      typeof body !== "object" ||
      !("query" in body) ||
      typeof body.query !== "string"
    )
      return Response.json(
        { error: "A text query is required." },
        { status: 400, headers },
      );
    recent.push(Date.now());
    const leads = await searchWeb(
      body.query,
      process.env.BRAVE_SEARCH_API_KEY ?? "",
    );
    return Response.json(
      {
        leads,
        searchedAt: new Date().toISOString(),
        warning:
          "Search-index leads, not verified current advertisements. Results are not saved to the report.",
      },
      { headers },
    );
  } catch (error) {
    if (error instanceof SearchError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers },
      );
    return Response.json(
      { error: "Invalid search request." },
      { status: 400, headers },
    );
  }
}
