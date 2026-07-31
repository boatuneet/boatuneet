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
};

export type JoinResult = {
  position: number;
  cap: number;
  refCode: string;
  alreadyRegistered: boolean;
};

/** Shown when Supabase isn't configured yet, so the page still renders. */
const FALLBACK: WaitlistStatus = { taken: 58, cap: 200, spotsLeft: 142 };

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

  return { taken: data.taken, cap: data.cap, spotsLeft: data.spots_left };
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
