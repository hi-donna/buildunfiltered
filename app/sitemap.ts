import type { MetadataRoute } from "next";
import { allJobs, splitId } from "@/lib/data";
import { site } from "@/site.config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, priority: 1 },
    ...allJobs.map((j) => {
      const { domain, slug } = splitId(j.id);
      return { url: `${site.url}/for/${domain}/${slug}/`, priority: 0.8 };
    }),
  ];
}
