import { join, isConfigured, saveBoat, recordConsent, type Boat } from "@/lib/waitlist";
import { POLICY_VERSION } from "@/lib/privacy";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Mirrors the valuation_requests check constraints, so bad input gets a 400
 *  instead of a silent failed insert. */
function parseBoat(raw: unknown): Boat | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const make = str(b.make);
  const model = str(b.model);
  const year = Number(b.year);
  // Owners copy HINs with spaces and dashes; store the bare code.
  const hin = str(b.hin).replace(/[\s-]/g, "").toUpperCase();

  if (!make || make.length > 80 || !model || model.length > 80) return null;
  // +2: new builds are sold by model year, which runs ahead of the calendar.
  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 2) return null;
  if (hin && !/^[A-Z0-9]{6,20}$/.test(hin)) return null;
  return { make, model, year, hin: hin || null };
}

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

  // ponytail: optional so an already-open old tab can still submit email-only.
  const boat = body.boat === undefined ? null : parseBoat(body.boat);
  if (body.boat !== undefined && !boat) {
    return Response.json({ error: "invalid_boat" }, { status: 400 });
  }

  if (!isConfigured()) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const referredBy =
    typeof body.ref === "string" ? body.ref.slice(0, 32) : null;
  const source =
    typeof body.source === "string" ? body.source.slice(0, 128) : null;

  try {
    const result = await join(email, referredBy, source);
    // The email is the lead; a failed boat insert is logged, not shown, since
    // we can still ask for the details by reply.
    if (boat) {
      await saveBoat(email, boat).catch((err: Error) =>
        console.error("valuation_requests insert failed:", err.message),
      );
    }
    // Consent is recorded as its own rows: the enquiry itself is never read
    // as newsletter consent. Logged, not surfaced: the lead is already saved.
    const log = (err: Error) => console.error("consents insert failed:", err.message);
    await recordConsent(email, "privacy_ack", true, "website:valuation", POLICY_VERSION).catch(log);
    if (body.marketing === true) {
      await recordConsent(email, "marketing_email", true, "website:valuation", POLICY_VERSION).catch(log);
    }
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("invalid_email")) {
      return Response.json({ error: "invalid_email" }, { status: 400 });
    }
    console.error("waitlist_join failed:", message);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
