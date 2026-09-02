import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";
import { absoluteUrl, postUrl, siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const newest = blogPosts
    .map((post) => post.updatedAt ?? post.publishedAt)
    .sort()
    .at(-1)!;

  return [
    { url: siteUrl, lastModified: new Date("2026-09-02"), priority: 1 },
    { url: absoluteUrl("/blog"), lastModified: new Date(newest), changeFrequency: "weekly", priority: 0.9 },
    ...blogPosts.map((post) => ({
      url: postUrl(post),
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: [absoluteUrl(post.image)],
    })),
  ];
}
