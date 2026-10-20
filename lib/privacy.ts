/** Shared privacy facts. Bump POLICY_VERSION whenever /privacy changes so stored
 *  consents and leads record which text the person saw. */
export const POLICY_VERSION = "2026-10-19";
export const PRIVACY_EMAIL = "boat@you-neet.com";

export type Consent = {
  /** Policy version in force when the choice was made. */
  v: string;
  analytics: boolean;
  ads: boolean;
  at: string;
};

const KEY = "bu-consent";
const EVENT = "bu:consent";

/** Client-side only. Choice lives in localStorage; the gtag consent-mode flags
 *  are the only other place it is mirrored to. */
export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consent;
    // A policy change re-asks; an older choice no longer counts.
    return c && c.v === POLICY_VERSION ? c : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: Pick<Consent, "analytics" | "ads">) {
  const c: Consent = { v: POLICY_VERSION, ...choice, at: new Date().toISOString() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* private mode: the choice still applies for this page view */
  }
  // gtag may already be on the page from an earlier choice: tell it directly.
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  const flag = (v: boolean) => (v ? "granted" : "denied");
  g?.("consent", "update", {
    analytics_storage: flag(c.analytics),
    ad_storage: flag(c.ads),
    ad_user_data: flag(c.ads),
    ad_personalization: flag(c.ads),
  });
  window.dispatchEvent(new CustomEvent(EVENT, { detail: c }));
  return c;
}

/** Re-open the banner (footer “Cookie settings”). */
export function openConsent() {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: "open" }));
}

export function onConsent(fn: (detail: Consent | "open") => void) {
  const h = (e: Event) => fn((e as CustomEvent).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}
