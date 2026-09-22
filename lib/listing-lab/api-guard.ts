import { SearchError } from "./search.ts";
export const noStore = { "Cache-Control": "no-store" };
const recent = new Map<string, number[]>();
// This bounded per-instance limiter reduces accidental repeated requests. Set a
// hard provider spending cap and a Vercel Firewall limit before a broad launch.
export async function readRequest(
  request: Request,
  limit = 4096,
): Promise<Record<string, unknown>> {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? new URL(request.url).host;
  if (
    !origin ||
    new URL(origin).host !== host ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new SearchError(
      "Open the lab on this website to use this feature.",
      403,
    );
  if (
    !(request.headers.get("content-type") ?? "").startsWith("application/json")
  )
    throw new SearchError("JSON is required.", 415);
  const now = Date.now();
  const key = request.headers.get("x-real-ip") ?? "shared";
  for (const [id, times] of recent)
    if (times.every((t) => now - t > 60000)) recent.delete(id);
  const times = (recent.get(key) ?? []).filter((t) => now - t < 60000);
  if (times.length >= 8 || recent.size >= 2000)
    throw new SearchError("Please wait a minute before trying again.", 429);
  recent.set(key, [...times, now]);
  const reader = request.body?.getReader();
  if (!reader) throw new SearchError("A request body is required.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new SearchError("Request is too large.", 413);
    }
    chunks.push(value);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body;
  } catch {
    throw new SearchError("Invalid JSON request.", 400);
  }
}
export function apiError(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof SearchError
          ? error.message
          : "The request could not be completed. Try again or enter the details manually.",
    },
    {
      status: error instanceof SearchError ? error.status : 502,
      headers: noStore,
    },
  );
}
