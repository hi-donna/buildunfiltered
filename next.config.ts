import type { NextConfig } from "next";

// Static export: `next build` writes plain HTML to out/. Every job becomes a
// real file that Google can index and a CDN can serve for free. Nothing here
// needs a server, so don't add one — the moment this needs Node, it stops
// being free and starts being something you maintain.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
