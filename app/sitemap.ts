import type { MetadataRoute } from "next";
import { site } from "@/site.config";
import { videos } from "@/lib/watch";
import { posts } from "@/lib/blog";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${site.url}/watch/`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${site.url}/blog/`, changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((p) => ({ url: `${site.url}/blog/${p.slug}/`, lastModified: p.published, priority: 0.6 })),
    ...videos.map((v) => ({ url: `${site.url}/watch/${v.id}/`, lastModified: v.published, priority: 0.4 })),
  ];
}
