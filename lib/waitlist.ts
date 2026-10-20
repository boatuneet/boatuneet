import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side only. SUPABASE_SERVICE_ROLE_KEY deliberately has no NEXT_PUBLIC_
 * prefix, so Next never inlines it into the browser bundle. Nothing in this
 * file may be imported from a client component.
 */

export type WaitlistStatus = {
  taken: number;
  cap: number;
  spotsLeft: number;
  isLive: boolean;
};

export type JoinResult = {
  position: number;
  cap: number;
  refCode: string;
  alreadyRegistered: boolean;
};

/** Shown when Supabase isn't configured yet, so the page still renders. */
const FALLBACK: WaitlistStatus = {
  taken: 0,
  cap: 200,
  spotsLeft: 200,
  isLive: false,
};

let cached: SupabaseClient | null = null;

function client(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Modern `sb_secret_…` key preferred; legacy service_role still accepted.
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isConfigured() {
  return client() !== null;
}

export async function getStatus(): Promise<WaitlistStatus> {
  const sb = client();
  if (!sb) return FALLBACK;

  const { data, error } = await sb.rpc("waitlist_status").single<{
    taken: number;
    cap: number;
    spots_left: number;
  }>();

  // Never let a database hiccup take the landing page down.
  if (error || !data) {
    console.error("waitlist_status failed:", error?.message);
    return FALLBACK;
  }

  return {
    taken: data.taken,
    cap: data.cap,
    spotsLeft: data.spots_left,
    isLive: true,
  };
}

export async function join(
  email: string,
  referredBy?: string | null,
  source?: string | null,
): Promise<JoinResult> {
  const sb = client();
  if (!sb) throw new Error("not_configured");

  const { data, error } = await sb
    .rpc("waitlist_join", {
      p_email: email,
      p_referred_by: referredBy ?? null,
      p_source: source ?? null,
    })
    .single<{
      place: number;
      cap: number;
      ref_code: string;
      already_registered: boolean;
    }>();

  if (error) throw new Error(error.message);

  return {
    position: data.place,
    cap: data.cap,
    refCode: data.ref_code,
    alreadyRegistered: data.already_registered,
  };
}

export type Boat = {
  make: string;
  model: string;
  year: number;
  hin: string | null;
};

export async function saveBoat(email: string, boat: Boat) {
  const sb = client();
  if (!sb) throw new Error("not_configured");
  const { error } = await sb.from("valuation_requests").insert({ email, ...boat });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------- privacy --

export type ConsentKind = "privacy_ack" | "marketing_email";

export async function recordConsent(
  email: string,
  kind: ConsentKind,
  granted: boolean,
  source: string | null,
  policyVersion: string,
) {
  const sb = client();
  if (!sb) throw new Error("not_configured");
  const { error } = await sb
    .from("consents")
    .insert({ email, kind, granted, source, policy_version: policyVersion });
  if (error) throw new Error(error.message);
}

export type MetaLead = {
  leadgen_id: string;
  form_id: string | null;
  page_id: string | null;
  ad_id: string | null;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  fields: { name: string; values: string[] }[];
  submitted_at: string;
  policy_version: string;
};

/** Idempotent: a re-delivered lead is ignored, not duplicated. */
export async function saveMetaLead(lead: MetaLead) {
  const sb = client();
  if (!sb) throw new Error("not_configured");
  const { error } = await sb
    .from("meta_leads")
    .upsert(lead, { onConflict: "leadgen_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

/** Right to erasure: drop every row we hold for this email. */
export async function eraseEmail(email: string) {
  const sb = client();
  if (!sb) throw new Error("not_configured");
  for (const table of ["waitlist_signups", "valuation_requests", "meta_leads", "consents"]) {
    const { error } = await sb.from(table).delete().ilike("email", email);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}
