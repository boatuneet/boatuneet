import { eraseEmail, isConfigured } from "@/lib/waitlist";
import { readRequest } from "@/lib/listing-lab/api-guard";
import { SearchError } from "@/lib/listing-lab/search";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Self-service erasure. There are no passworded accounts yet, so the email
 *  itself is the identifier.
 *  ponytail: no ownership check beyond same-origin + rate limit. The only harm
 *  a stranger can do is remove a waitlist entry; add an emailed confirmation
 *  link once we have an email provider. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await readRequest(request, 1024);
  } catch (err) {
    const e = err instanceof SearchError ? err : new SearchError("Bad request.", 400);
    // The guard's 403 copy is written for the lab; reword it for this form.
    const message = e.status === 403 ? "Please use the form on boatuneet.com." : e.message;
    return Response.json({ error: message }, { status: e.status });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return Response.json({ error: "That email doesn't look right." }, { status: 400 });
  }
  if (!isConfigured()) {
    return Response.json({ error: "Deletion is unavailable right now." }, { status: 503 });
  }
  try {
    await eraseEmail(email);
  } catch (err) {
    console.error("erasure failed:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  // Same answer whether or not we held anything: never confirm an address exists.
  return Response.json({ ok: true });
}
