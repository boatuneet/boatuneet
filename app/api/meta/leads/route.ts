import { createHmac, timingSafeEqual } from "node:crypto";
import { isConfigured, recordConsent, saveMetaLead } from "@/lib/waitlist";
import { POLICY_VERSION } from "@/lib/privacy";

/** Meta Lead Ads webhook (object: page, field: leadgen).
 *  Set the callback URL to https://boatuneet.com/api/meta/leads in the Meta
 *  app dashboard with META_VERIFY_TOKEN, subscribe the Page to `leadgen`, and
 *  give META_PAGE_ACCESS_TOKEN the leads_retrieval permission. */

const GRAPH = "https://graph.facebook.com/v21.0";

/** Custom form questions that carry the separate marketing opt-in. Match by
 *  the question's field name; anything else is service enquiry data only. */
const MARKETING_FIELD = /newsletter|marketing|promotional/i;
const YES = /^(yes|true|1|on|i agree|agree|accept)/i;

type FieldData = { name: string; values: string[] };

// Verification handshake.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  if (
    q.get("hub.mode") === "subscribe" &&
    process.env.META_VERIFY_TOKEN &&
    q.get("hub.verify_token") === process.env.META_VERIFY_TOKEN
  ) {
    return new Response(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

function signatureValid(raw: string, header: string | null) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const given = header.slice("sha256=".length);
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

async function fetchLead(leadgenId: string) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN missing");
  const res = await fetch(
    `${GRAPH}/${encodeURIComponent(leadgenId)}?fields=created_time,field_data,form_id,ad_id&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) throw new Error(`graph ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as {
    created_time: string;
    field_data?: FieldData[];
    form_id?: string;
    ad_id?: string;
  };
}

const pick = (fields: FieldData[], re: RegExp) =>
  fields.find((f) => re.test(f.name))?.values?.[0]?.trim() || null;

export async function POST(request: Request) {
  const raw = await request.text();
  if (!signatureValid(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("invalid signature", { status: 401 });
  }
  if (!isConfigured()) return new Response("not configured", { status: 503 });

  let payload: { entry?: { changes?: { field: string; value: Record<string, string> }[] }[] };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const changes = (payload.entry ?? []).flatMap((e) => e.changes ?? []).filter((c) => c.field === "leadgen");
  try {
    for (const { value } of changes) {
      const lead = await fetchLead(value.leadgen_id);
      const fields = lead.field_data ?? [];
      const email = pick(fields, /^email$/i)?.toLowerCase() ?? null;
      await saveMetaLead({
        leadgen_id: value.leadgen_id,
        form_id: lead.form_id ?? value.form_id ?? null,
        page_id: value.page_id ?? null,
        ad_id: lead.ad_id ?? value.ad_id ?? null,
        email,
        full_name: pick(fields, /^(full_name|name)$/i),
        phone: pick(fields, /^(phone_number|phone|whatsapp)/i),
        fields,
        submitted_at: lead.created_time ?? new Date(Number(value.created_time) * 1000).toISOString(),
        policy_version: POLICY_VERSION,
      });
      if (!email) continue;
      const source = `meta_lead_ads:${lead.form_id ?? value.form_id ?? "unknown"}`;
      await recordConsent(email, "privacy_ack", true, source, POLICY_VERSION);
      // Only an explicit opt-in question counts; a lead alone is never consent.
      const optIn = fields.find((f) => MARKETING_FIELD.test(f.name));
      if (optIn) {
        await recordConsent(email, "marketing_email", YES.test(optIn.values?.[0] ?? ""), source, POLICY_VERSION);
      }
    }
  } catch (err) {
    console.error("meta lead failed:", err instanceof Error ? err.message : err);
    // Non-200 makes Meta retry; the leadgen_id unique index keeps it idempotent.
    return new Response("retry", { status: 500 });
  }
  return new Response("ok", { status: 200 });
}
