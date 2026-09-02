import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/lib/seo";
import "./blog.css";

export const metadata: Metadata = {
  title: {
    default: `Boat Selling Guides | ${site.journalName}`,
    template: `%s | ${site.journalName}`,
  },
  description: site.description,
  alternates: {
    types: { "application/rss+xml": [{ url: "/blog/feed.xml", title: site.journalName }] },
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
