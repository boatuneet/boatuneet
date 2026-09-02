import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ValuationForm } from "@/app/components/shared";
import { blogPosts, formatDate, getBlogPost, readingTime, relatedPosts, slugify } from "@/lib/blog";
import { articleJsonLd, JsonLd, site, siteUrl } from "@/lib/seo";
import { ReadingProgress, Toc } from "../client";
import { Blocks, BlogFooter, BlogHeader, PostCard } from "../components";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPost((await params).slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: site.name, url: siteUrl }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: site.name,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [siteUrl],
      section: post.category,
      tags: post.keywords,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = getBlogPost((await params).slug);
  if (!post) notFound();

  const toc = [
    ...post.sections.map((section) => ({ id: slugify(section.heading), label: section.heading })),
    { id: "faq", label: "Frequently asked questions" },
  ];

  return (
    <div className="blog-page article-page">
      <a href="#article-content" className="skip-link">
        Skip to article
      </a>
      <BlogHeader />
      <ReadingProgress />

      <main id="article-content">
        <article>
          <header className="article-hero">
            <div className="article-shell">
              <nav aria-label="Breadcrumb" className="article-breadcrumb">
                <Link href="/blog" className="article-back focus-ring">
                  <ArrowLeft size={16} weight="bold" aria-hidden="true" />
                  All guides
                </Link>
              </nav>
              <p className="post-meta">
                <span>{post.category}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                <span aria-hidden="true">·</span>
                <span>{readingTime(post)} min read</span>
              </p>
              <h1>{post.title}</h1>
              <p className="article-dek">{post.description}</p>
              <div className="article-byline">
                <span className="article-byline__avatar" aria-hidden="true">
                  <Image src="/boatuneet-mark.png" alt="" width={631} height={240} className="brand-mark--inverse" />
                </span>
                <div>
                  <strong>{site.name}</strong>
                  <span>
                    {site.byline}
                    {post.updatedAt ? (
                      <>
                        {" · Updated "}
                        <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                      </>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>
            <figure className="article-shell article-figure">
              <Image
                src={post.image}
                alt={post.imageAlt}
                width={1440}
                height={810}
                priority
                sizes="(max-width: 767px) 100vw, 760px"
              />
            </figure>
          </header>

          <div className="article-layout">
            <aside className="article-sidebar">
              <Toc items={toc} />
            </aside>

            <div className="article-body">
              <div className="quick-answer">
                <p className="quick-answer__label">In short</p>
                <p className="quick-answer__text">{post.quickAnswer}</p>
              </div>

              <section className="quick-take" aria-labelledby="quick-take-title">
                <h2 id="quick-take-title">Quick take</h2>
                <ul>
                  {post.quickTake.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </section>

              {post.sections.map((section) => (
                <section key={section.heading}>
                  <h2 id={slugify(section.heading)}>{section.heading}</h2>
                  <Blocks blocks={section.blocks} />
                </section>
              ))}

              <section className="article-faq" aria-labelledby="faq">
                <h2 id="faq">Frequently asked questions</h2>
                {post.faqs.map((faq) => (
                  <div key={faq.question} className="faq-item">
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </div>
                ))}
              </section>

              <aside className="article-cta" aria-labelledby="article-cta-title">
                <p className="blog-eyebrow text-sky-300">Free valuation</p>
                <h2 id="article-cta-title">Turn your research into a realistic starting range.</h2>
                <p>
                  Tell us where to reach you. We&apos;ll ask about your boat and send a market-informed valuation range,
                  usually within two business days.
                </p>
                <ValuationForm compact dark />
              </aside>
            </div>
          </div>
        </article>

        <section className="related-posts" aria-labelledby="related-title">
          <div className="blog-shell">
            <div className="blog-section-heading">
              <div>
                <p className="blog-eyebrow">Keep reading</p>
                <h2 id="related-title">Related guides</h2>
              </div>
              <Link href="/blog" className="blog-text-link focus-ring">
                View all guides <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
            </div>
            <div className="post-grid">
              {relatedPosts(post).map((related, i) => (
                <PostCard key={related.slug} post={related} index={i} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <BlogFooter />
      <JsonLd data={articleJsonLd(post)} />
    </div>
  );
}
