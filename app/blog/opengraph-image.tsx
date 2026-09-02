import { ImageResponse } from "next/og";
import { blogPosts } from "@/lib/blog";
import { site } from "@/lib/seo";

export const alt = `${site.journalName}: boat selling guides`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700 }}>
          <span>Boat</span>
          <span style={{ color: "#7dd3fc", marginLeft: -14 }}>Uneet</span>
          <span style={{ color: "#8fa3bd", fontWeight: 400 }}>Journal</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -3, lineHeight: 1.02, maxWidth: 980 }}>
            Sell with a clearer view of the market.
          </div>
          <div style={{ fontSize: 30, color: "#b9c7da", maxWidth: 900, lineHeight: 1.35 }}>
            {`${blogPosts.length} plain-English guides to valuing, preparing and selling a boat.`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
