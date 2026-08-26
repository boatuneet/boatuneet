import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      // Everything in /public without a query string...
      { pathname: "/**", search: "" },
      // ...plus the cache-busted hero listing cards.
      { pathname: "/cards/**", search: "?v=2" },
    ],
  },
  /* config options here */
};

export default nextConfig;
