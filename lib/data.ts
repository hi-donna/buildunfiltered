import jobsData from "@/data/jobs.json";
import picksData from "@/data/picks.json";

export interface Job {
  id: string;          // "images.text-to-image" — permanent, becomes the URL
  label: string;
  aliases: string[];
}
export interface Domain { id: string; label: string; blurb: string; jobs: Job[] }
export interface Pick {
  rank: number; name: string; maker: string; url: string;
  one_liner: string; use_it_when: string; cost: string;
  good_at: string; the_catch: string; wrong_for: string; blind?: string;
}
export interface Entry {
  status: string; last_verified: string; question: string;
  method: { how: string; tested_on: string; conflicts: string; blind_note: string };
  ranked: Pick[];
  also_considered?: { name: string; why_not: string }[];
  watch_list?: string[];
  sources?: { label: string; url: string }[];
}

export const domains = jobsData.domains as Domain[];
const picks = picksData.picks as Record<string, Entry>;

export const allJobs = domains.flatMap((d) =>
  d.jobs.map((j) => ({ ...j, domain: d.id, domainLabel: d.label }))
);

// A job id is "<domain>.<slug>" and the URL is /for/<domain>/<slug>/.
// The id is the source of truth; never derive one from a label.
export const splitId = (id: string) => {
  const i = id.indexOf(".");
  return { domain: id.slice(0, i), slug: id.slice(i + 1) };
};

export const getEntry = (id: string): Entry | null => picks[id] ?? null;
export const isReviewed = (id: string) => id in picks;
export const reviewedCount = Object.keys(picks).length;

export function getJob(domain: string, slug: string) {
  const id = `${domain}.${slug}`;
  return allJobs.find((j) => j.id === id) ?? null;
}
