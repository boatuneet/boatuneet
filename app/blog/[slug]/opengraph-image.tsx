import { ImageResponse } from "next/og";
import { blogPosts, formatDate, getBlogPost, readingTime } from "@/lib/blog";
import { site } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = getBlogPost((await params).slug);
  const title = post?.title ?? site.journalName;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(145deg, #0b275d 0%, #071735 60%, #050f24 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 700 }}>
            <span>Boat</span>
            <span style={{ color: "#7dd3fc" }}>Uneet</span>
            <span style={{ color: "#8fa3bd", fontWeight: 400, marginLeft: 14 }}>Journal</span>
          </div>
          {post ? (
            <div
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                background: "rgba(125, 211, 252, 0.16)",
                color: "#7dd3fc",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {post.category}
            </div>
          ) : null}
        </div>
        <div
          style={{
            fontSize: title.length > 60 ? 58 : 68,
            fontWeight: 600,
            letterSpacing: -2.5,
            lineHeight: 1.06,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {post ? (
          <div style={{ display: "flex", gap: 28, fontSize: 24, color: "#b9c7da" }}>
            <span>{formatDate(post.publishedAt)}</span>
            <span>·</span>
            <span>{readingTime(post)} min read</span>
            <span>·</span>
            <span>boatuneet.com</span>
          </div>
        ) : null}
      </div>
    ),
    size,
  );
}
