import type { MetadataRoute } from "next";
import { allJobs, splitId } from "@/lib/data";
import { mcpTargets } from "@/lib/mcp";
import { site } from "@/site.config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, priority: 1 },
    { url: `${site.url}/ai-tools/`, priority: 0.9 },
    ...allJobs.map((j) => {
      const { domain, slug } = splitId(j.id);
      return { url: `${site.url}/ai-tools/${domain}/${slug}/`, priority: 0.8 };
    }),
    { url: `${site.url}/tools/mcp/`, priority: 0.9 },
    ...mcpTargets.map((t) => ({ url: `${site.url}/tools/mcp/${t.id}/`, priority: 0.8 })),
    { url: `${site.url}/tools/learn/`, priority: 0.9 },
  ];
}
