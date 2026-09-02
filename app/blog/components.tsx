import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Rss } from "@phosphor-icons/react/dist/ssr";
import { type Block, type BlogPost, formatDate, readingTime } from "@/lib/blog";

export function BlogBrand() {
  return (
    <Link
      href="/"
      aria-label="BoatUneet home"
      className="blog-brand brand-link inline-flex min-h-11 items-center gap-1.5 rounded-lg"
    >
      <Image
        src="/boatuneet-mark.png"
        alt=""
        aria-hidden="true"
        width={631}
        height={240}
        className="brand-mark h-5 w-auto sm:h-6"
      />
      <span className="brand-wordmark" aria-hidden="true">
        <span className="brand-wordmark__boat text-ink">Boat</span>
        <span className="brand-wordmark__uneet text-boat-blue">Uneet</span>
      </span>
    </Link>
  );
}

export function BlogHeader() {
  return (
    <header className="blog-header">
      <div className="blog-shell flex h-[72px] items-center justify-between gap-5">
        <div className="flex items-center gap-4 sm:gap-6">
          <BlogBrand />
          <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <Link href="/blog" className="blog-journal-link">
            Journal
          </Link>
        </div>
        <nav aria-label="Blog navigation" className="flex items-center gap-2 sm:gap-5">
          <Link href="/#plan" className="blog-nav-link hidden sm:inline-flex">
            How it works
          </Link>
          <Link href="/#valuation" className="blog-header-cta">
            Free valuation
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PostMeta({ post, inverse = false }: { post: BlogPost; inverse?: boolean }) {
  return (
    <div className={`post-meta ${inverse ? "post-meta--inverse" : ""}`}>
      <span>{post.category}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1.5">
        <Clock size={15} aria-hidden="true" />
        {readingTime(post)} min read
      </span>
    </div>
  );
}

export function PostCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  const href = `/blog/${post.slug}`;
  return (
    <article className="post-card reveal" style={{ "--i": index } as React.CSSProperties}>
      <Link href={href} className="post-card__image" tabIndex={-1} aria-hidden="true">
        <Image
          src={post.image}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 600px"
          className="object-cover"
        />
        <span className="post-card__category">{post.category}</span>
      </Link>
      <div className="post-card__body">
        <h3 className="post-card__title">
          <Link href={href} className="focus-ring">
            {post.title}
          </Link>
        </h3>
        <p className="post-card__description">{post.description}</p>
        <div className="post-card__footer">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span>{readingTime(post)} min read</span>
          <ArrowRight size={18} weight="bold" aria-hidden="true" className="post-card__arrow" />
        </div>
      </div>
    </article>
  );
}

/** Renders a section's content blocks with semantic HTML answer engines can parse. */
export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "p":
            return <p key={i}>{block.text}</p>;
          case "list":
            return (
              <ul key={i}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "steps":
            return (
              <ol key={i} className="steps">
                {block.items.map((step) => (
                  <li key={step.title}>
                    <strong>{step.title}</strong>
                    <span>{step.text}</span>
                  </li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={i} className="table-wrap">
                <table>
                  <caption>{block.caption}</caption>
                  <thead>
                    <tr>
                      {block.head.map((cell) => (
                        <th key={cell} scope="col">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (c === 0 ? <th key={c} scope="row">{cell}</th> : <td key={c}>{cell}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "quote":
            return (
              <blockquote key={i}>
                <p>{block.text}</p>
                {block.cite ? <cite>{block.cite}</cite> : null}
              </blockquote>
            );
          case "note":
            return (
              <aside key={i} className="note" aria-label={block.title}>
                <strong>{block.title}</strong>
                <p>{block.text}</p>
              </aside>
            );
        }
      })}
    </>
  );
}

export function BlogFooter() {
  return (
    <footer className="blog-footer">
      <div className="blog-shell blog-footer__inner">
        <div>
          <BlogBrand />
          <p>Clear, practical guidance for boat owners preparing to sell.</p>
        </div>
        <nav aria-label="Footer" className="blog-footer__links">
          <Link href="/blog">Journal</Link>
          <Link href="/#plan">How it works</Link>
          <Link href="/#valuation">Free valuation</Link>
          <a href="/blog/feed.xml" className="inline-flex items-center gap-1.5">
            <Rss size={14} weight="bold" aria-hidden="true" /> RSS
          </a>
        </nav>
        <p className="blog-footer__copy">© {new Date().getFullYear()} BoatUneet</p>
      </div>
    </footer>
  );
}
