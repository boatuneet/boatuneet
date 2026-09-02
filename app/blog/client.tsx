"use client";

import { useEffect, useState } from "react";
import type { BlogPost } from "@/lib/blog";
import { PostCard } from "./components";

/** Category filter + grid. Remounting the grid on filter change replays the CSS reveal. */
export function PostExplorer({ posts, categories }: { posts: BlogPost[]; categories: string[] }) {
  const [active, setActive] = useState("All");
  const visible = active === "All" ? posts : posts.filter((post) => post.category === active);

  return (
    <>
      <div className="filter-bar" role="group" aria-label="Filter guides by topic">
        {["All", ...categories].map((category) => (
          <button
            key={category}
            type="button"
            className="filter-chip"
            aria-pressed={category === active}
            onClick={() => setActive(category)}
          >
            {category}
            <span className="filter-chip__count">
              {category === "All" ? posts.length : posts.filter((p) => p.category === category).length}
            </span>
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {visible.length} {visible.length === 1 ? "guide" : "guides"} shown
      </p>
      <div className="post-grid" key={active}>
        {visible.map((post, i) => (
          <PostCard key={post.slug} post={post} index={i} />
        ))}
      </div>
    </>
  );
}

/** Thin progress bar under the header showing how far through the article the reader is. */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const article = document.querySelector("article");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="reading-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

/** Table of contents that highlights the section currently in view. */
export function Toc({ items }: { items: { id: string; label: string }[] }) {
  const [current, setCurrent] = useState(items[0]?.id);

  useEffect(() => {
    const headings = items.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    if (!headings.length) return;
    let frame = 0;
    // Active = last heading that has scrolled past the reading line (works for jumps, not only smooth scrolls).
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.25;
      const passed = headings.filter((h) => h.getBoundingClientRect().top <= line);
      setCurrent((passed.at(-1) ?? headings[0]).id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav className="article-toc" aria-label="On this page">
      <p>On this page</p>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={current === item.id ? "location" : undefined}>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
