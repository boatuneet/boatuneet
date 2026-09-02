import { blogPosts } from "@/lib/blog";
import { absoluteUrl, postUrl, site, siteUrl } from "@/lib/seo";

const escape = (text: string) =>
  text.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export function GET() {
  const items = blogPosts
    .map(
      (post) => `
    <item>
      <title>${escape(post.title)}</title>
      <link>${postUrl(post)}</link>
      <guid isPermaLink="true">${postUrl(post)}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <category>${escape(post.category)}</category>
      <description>${escape(post.description)}</description>
      <content:encoded><![CDATA[<p>${post.quickAnswer}</p><p><a href="${postUrl(post)}">Read the full guide</a></p>]]></content:encoded>
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escape(site.journalName)}</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>${escape(site.description)}</description>
    <language>${site.language}</language>
    <lastBuildDate>${new Date(blogPosts[0].publishedAt).toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl("/blog/feed.xml")}" rel="self" type="application/rss+xml" />
    <image><url>${site.logo}</url><title>${escape(site.name)}</title><link>${siteUrl}</link></image>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
