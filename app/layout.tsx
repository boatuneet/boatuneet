import type { Metadata } from "next";
import {
  Geist,
  Montserrat,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const brandSans = Montserrat({
  variable: "--font-brand-sans",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BoatUneet — Sell your boat. Keep more of the price.",
  description:
    "A managed 90-day boat sales plan with market-informed pricing, screened enquiries and support through closing for a 2.5% success fee. Join BoatUneet early access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} ${brandSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
