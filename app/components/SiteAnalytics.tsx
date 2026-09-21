"use client";

import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { usePathname } from "next/navigation";

export default function SiteAnalytics() {
  const pathname = usePathname();
  if (pathname === "/lab" || pathname.startsWith("/lab/")) return null;
  return (
    <>
      <Analytics />
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-3JRLWHZT3G"
        strategy="afterInteractive"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
      >{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-3JRLWHZT3G');`}</Script>
    </>
  );
}
