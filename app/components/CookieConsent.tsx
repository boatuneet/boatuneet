"use client";

import { useEffect, useState } from "react";
import { onConsent, readConsent, writeConsent } from "@/lib/privacy";

/** Consent banner. Shown until a choice is stored for the current policy
 *  version; the footer's “Cookie settings” re-opens it.
 *  ponytail: shown to every visitor, not only EU/EEA. Gate on the
 *  x-vercel-ip-country header in a proxy if non-EU opt-out ever matters. */
export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    const current = readConsent();
    if (!current) setOpen(true);
    return onConsent((d) => {
      if (d !== "open") return;
      const c = readConsent();
      setAnalytics(c?.analytics ?? false);
      setAds(c?.ads ?? false);
      setManage(true);
      setOpen(true);
    });
  }, []);

  if (!open) return null;

  const choose = (choice: { analytics: boolean; ads: boolean }) => {
    writeConsent(choice);
    setOpen(false);
    setManage(false);
  };

  const btn =
    "min-h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_24px_60px_-24px_rgb(7_23_53/0.45)] sm:p-6"
    >
      <p id="consent-title" className="font-semibold">Cookies on BoatUneet</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Essential cookies keep the site working. With your permission we also use analytics to
        improve the site and advertising cookies to measure our campaigns. Details in our{" "}
        <a href="/privacy" className="font-semibold text-blue-700 underline underline-offset-4">Privacy Policy</a>.
      </p>

      {manage && (
        <fieldset className="mt-4 grid gap-2 text-sm">
          <legend className="sr-only">Cookie preferences</legend>
          <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <span><strong>Essential</strong> — always on</span>
            <input type="checkbox" checked disabled className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <span><strong>Analytics</strong> — Google Analytics</span>
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="h-4 w-4 accent-blue-700" />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <span><strong>Advertising</strong> — Meta / Google Ads measurement</span>
            <input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} className="h-4 w-4 accent-blue-700" />
          </label>
        </fieldset>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose({ analytics: true, ads: true })} className={`${btn} bg-slate-900 text-white hover:bg-slate-700`}>
          Accept all
        </button>
        <button type="button" onClick={() => choose({ analytics: false, ads: false })} className={`${btn} border border-slate-300 bg-white hover:bg-slate-50`}>
          Reject non-essential
        </button>
        {manage ? (
          <button type="button" onClick={() => choose({ analytics, ads })} className={`${btn} border border-slate-300 bg-white hover:bg-slate-50`}>
            Save preferences
          </button>
        ) : (
          <button type="button" onClick={() => setManage(true)} className={`${btn} text-blue-700 hover:bg-blue-50`}>
            Manage preferences
          </button>
        )}
      </div>
    </div>
  );
}
