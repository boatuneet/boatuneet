import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ValuationForm } from "@/app/components/shared";
import { blogPosts, categories, readingTime } from "@/lib/blog";
import { blogJsonLd, JsonLd, site } from "@/lib/seo";
import { GL } from "@/app/components/gl";
import { PostExplorer } from "./client";
import { BlogFooter, BlogHeader, PostMeta } from "./components";

export const metadata: Metadata = {
  title: "Boat Selling Guides",
  description: site.description,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    siteName: site.name,
    title: `Boat Selling Guides | ${site.journalName}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
};

export default function BlogPage() {
  const featured = blogPosts.find((post) => post.featured) ?? blogPosts[0];

  return (
    <div className="blog-page">
      <a href="#blog-content" className="skip-link">
        Skip to main content
      </a>
      <BlogHeader />

      <main id="blog-content">
        <section className="journal-hero">
          <div className="absolute inset-0" aria-hidden="true">
            <GL hovering={false} />
          </div>
          <div className="blog-shell journal-hero__inner">
            <div className="journal-hero__copy">
              <p className="blog-eyebrow reveal">{site.journalName}</p>
              <h1 className="hero-heading reveal" style={{ "--i": 1 } as React.CSSProperties}>
                <span className="hero-heading__strong block">Sell with a clearer</span>
                <span className="hero-heading__light journal-hero__accent mt-2 block">view of the market.</span>
              </h1>
              <p className="journal-hero__dek reveal" style={{ "--i": 2 } as React.CSSProperties}>
                Plain-English answers to the questions boat owners ask before they sell: what the boat is worth, what it
                costs, what paperwork to gather and how long it takes.
              </p>
              <ul className="journal-hero__topics reveal" style={{ "--i": 3 } as React.CSSProperties} aria-label="Topics">
                {categories.map((category) => (
                  <li key={category}>{category}</li>
                ))}
              </ul>
            </div>

            <article className="featured-card reveal" style={{ "--i": 2 } as React.CSSProperties} aria-labelledby="featured-title">
              <Link href={`/blog/${featured.slug}`} className="featured-card__image" tabIndex={-1} aria-hidden="true">
                <Image
                  src={featured.image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 440px"
                  className="object-cover"
                />
                <span className="featured-card__label">Latest guide</span>
              </Link>
              <div className="featured-card__body">
                <PostMeta post={featured} />
                <h2 id="featured-title">
                  <Link href={`/blog/${featured.slug}`} className="focus-ring">
                    {featured.title}
                  </Link>
                </h2>
                <p>{featured.description}</p>
                <Link href={`/blog/${featured.slug}`} className="featured-card__link focus-ring">
                  Read the guide <ArrowRight size={17} weight="bold" aria-hidden="true" />
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section id="guides" className="journal-section" aria-labelledby="guides-title">
          <div className="blog-shell">
            <div className="blog-section-heading">
              <div>
                <p className="blog-eyebrow">For boat owners</p>
                <h2 id="guides-title">All guides</h2>
              </div>
              <p>Every guide opens with a short, direct answer, then the detail behind it.</p>
            </div>
            <PostExplorer posts={blogPosts} categories={categories} />
          </div>
        </section>

        <section className="journal-section journal-answers" aria-labelledby="answers-title">
          <div className="blog-shell">
            <div className="blog-section-heading">
              <div>
                <p className="blog-eyebrow">Quick answers</p>
                <h2 id="answers-title">The questions we hear most</h2>
              </div>
              <p>Short answers you can act on today. Each links to the full guide.</p>
            </div>
            <div className="qa-grid">
              {blogPosts.map((post, i) => (
                <article key={post.slug} className="qa-card reveal" style={{ "--i": i } as React.CSSProperties}>
                  <p className="qa-card__eyebrow">
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {post.category}
                  </p>
                  <div className="qa-card__body">
                    <h3>
                      <Link href={`/blog/${post.slug}`} className="focus-ring">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="qa-card__answer">{post.quickAnswer}</p>
                  </div>
                  <div className="qa-card__footer">
                    <Link href={`/blog/${post.slug}`} className="qa-card__link focus-ring" tabIndex={-1}>
                      Full guide <ArrowRight size={16} weight="bold" aria-hidden="true" />
                    </Link>
                    <span>{readingTime(post)} min read</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="blog-cta-wrap" aria-labelledby="blog-cta-title">
          <div className="blog-shell">
            <div className="blog-cta">
              <div>
                <p className="blog-eyebrow text-sky-300">A useful first step</p>
                <h2 id="blog-cta-title">Find out what your boat could be worth.</h2>
                <p>
                  Share your email and we&apos;ll ask a few quick questions, then send a market-informed price range,
                  free and with no obligation.
                </p>
              </div>
              <ValuationForm compact dark />
            </div>
          </div>
        </section>
      </main>

      <BlogFooter />
      <JsonLd data={blogJsonLd()} />
    </div>
  );
}
