"use client";

import { openConsent } from "@/lib/privacy";

/** Footer for the launch page and legal pages. The Journal keeps its own
 *  footer, which carries the same legal links. */
export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={openConsent} className={`cursor-pointer ${className}`}>
      Cookie settings
    </button>
  );
}

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__copy">© {new Date().getFullYear()} BoatUneet · UNEET GROUP S.R.L.</p>
        <nav aria-label="Legal" className="site-footer__links">
          <a href="/blog">Journal</a>
          <a href="/privacy">Privacy Policy</a>
          <CookieSettingsButton />
          <a href="/account/delete">Delete my data</a>
        </nav>
      </div>
    </footer>
  );
}
