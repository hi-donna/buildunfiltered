import type { MetadataRoute } from "next";
import { site } from "@/site.config";
import { videos } from "@/lib/watch";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${site.url}/watch/`, changeFrequency: "hourly", priority: 0.8 },
    ...videos.map((v) => ({ url: `${site.url}/watch/${v.id}/`, lastModified: v.published, priority: 0.4 })),
  ];
}
