import { blogPosts } from "@/lib/blog";
import { absoluteUrl, postUrl, site, siteUrl } from "@/lib/seo";

/** llms.txt: a plain-text index for AI crawlers and answer engines (https://llmstxt.org). */
export function GET() {
  const posts = blogPosts
    .map((post) => `- [${post.title}](${postUrl(post)}): ${post.quickAnswer}`)
    .join("\n");

  const body = `# ${site.name}

> BoatUneet helps boat owners sell their boat through a managed 90-day plan with screened buyers and support through closing, for a 2.5% success fee. Owners start with a free, market-informed valuation.

## Journal

${site.description}

${posts}

## Site

- [Home](${siteUrl}): What BoatUneet does, how the managed sale works and the free valuation form.
- [Journal](${absoluteUrl("/blog")}): All boat selling guides.
- [RSS feed](${absoluteUrl("/blog/feed.xml")})
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
