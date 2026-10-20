"use client";

import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { onConsent, readConsent } from "@/lib/privacy";

const GA_ID = "G-3JRLWHZT3G";
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const subscribe = (cb: () => void) => onConsent(cb);
const snapshot = () => {
  const c = readConsent();
  // Stable primitive, so React only re-renders on an actual change.
  return c ? `${c.analytics ? 1 : 0}${c.ads ? 1 : 0}` : "00";
};

export default function SiteAnalytics() {
  const pathname = usePathname();
  const flags = useSyncExternalStore(subscribe, snapshot, () => "00");
  if (pathname === "/lab" || pathname.startsWith("/lab/")) return null;
  const analytics = flags[0] === "1";
  const ads = flags[1] === "1";
  return (
    <>
      {/* Vercel Analytics is cookieless and stores no identifier: essential. */}
      <Analytics />
      {analytics && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {analytics_storage: 'granted', ad_storage: '${ads ? "granted" : "denied"}', ad_user_data: '${ads ? "granted" : "denied"}', ad_personalization: '${ads ? "granted" : "denied"}'});
gtag('js', new Date());
gtag('config', '${GA_ID}');`}</Script>
        </>
      )}
      {ads && PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}</Script>
      )}
    </>
  );
}
