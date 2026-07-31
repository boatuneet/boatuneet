import { join, isConfigured } from "@/lib/waitlist";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  // Honeypot: a real person never fills a hidden field. Answer 200 so bots
  // can't tell they were caught.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return Response.json({ position: 0, cap: 0, refCode: "", alreadyRegistered: true });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  if (!isConfigured()) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const referredBy =
    typeof body.ref === "string" ? body.ref.slice(0, 32) : null;
  const source =
    typeof body.source === "string" ? body.source.slice(0, 128) : null;

  try {
    return Response.json(await join(email, referredBy, source));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("invalid_email")) {
      return Response.json({ error: "invalid_email" }, { status: 400 });
    }
    console.error("waitlist_join failed:", message);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
