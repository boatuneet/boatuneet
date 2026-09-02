import type { BlogPost } from "./blog";
import { blogPosts, postWordCount, readingTime } from "./blog";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://boatuneet.com";

export const site = {
  name: "BoatUneet",
  journalName: "BoatUneet Journal",
  description:
    "Practical, plain-English guides to valuing, preparing and selling a boat, written by the BoatUneet team.",
  /** Shown under the byline on every guide. */
  byline: "Written by the team that helps owners sell for a 2.5% success fee.",
  logo: `${siteUrl}/boatuneet-mark.png`,
  language: "en",
};

export const absoluteUrl = (path: string) => new URL(path, siteUrl).toString();
export const postUrl = (post: BlogPost) => absoluteUrl(`/blog/${post.slug}`);

/** Guides are published under the brand, so the Organization is both author and publisher. */
const organization = {
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: site.name,
  url: siteUrl,
  logo: { "@type": "ImageObject", url: site.logo },
};

const breadcrumb = (items: { name: string; url: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});

/** BlogPosting + BreadcrumbList + FAQPage graph for a single article. */
export function articleJsonLd(post: BlogPost) {
  const url = postUrl(post);
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: post.title,
        description: post.description,
        abstract: post.quickAnswer,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt ?? post.publishedAt,
        author: { "@id": organization["@id"] },
        publisher: { "@id": organization["@id"] },
        mainEntityOfPage: url,
        url,
        image: absoluteUrl(post.image),
        articleSection: post.category,
        keywords: post.keywords.join(", "),
        wordCount: postWordCount(post),
        timeRequired: `PT${readingTime(post)}M`,
        inLanguage: site.language,
        isPartOf: { "@id": `${siteUrl}/blog#blog` },
        isAccessibleForFree: true,
      },
      breadcrumb([
        { name: "Home", url: siteUrl },
        { name: "Journal", url: absoluteUrl("/blog") },
        { name: post.title, url },
      ]),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: post.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}

/** Blog + BreadcrumbList graph for the journal index. */
export function blogJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "Blog",
        "@id": `${siteUrl}/blog#blog`,
        name: site.journalName,
        description: site.description,
        url: absoluteUrl("/blog"),
        inLanguage: site.language,
        publisher: { "@id": organization["@id"] },
        blogPost: blogPosts.map((post) => ({
          "@type": "BlogPosting",
          "@id": `${postUrl(post)}#article`,
          headline: post.title,
          url: postUrl(post),
          datePublished: post.publishedAt,
          author: { "@id": organization["@id"] },
        })),
      },
      breadcrumb([
        { name: "Home", url: siteUrl },
        { name: "Journal", url: absoluteUrl("/blog") },
      ]),
    ],
  };
}

/** Renders a JSON-LD script tag; `<` is escaped so content can't break out of the script. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
