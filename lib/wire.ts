import sourcesData from "@/data/wire-sources.json";
import wireData from "@/data/wire.json";

// The Wire: data/wire-sources.json is the hand-kept list of feeds;
// data/wire.json is written by scripts/wire.mjs on a schedule. This file
// only types and joins the two. Nothing here is curated.

export interface WireCategory { id: string; label: string; blurb: string }
export interface WireSource {
  id: string; name: string; group: string; kind: "rss" | "youtube" | "reddit" | "hn" | "hf-papers";
  url: string; home: string; category: string; limit?: number;
}
export interface WireItem {
  title: string; url: string; published: string; source: string;
  outlet: string | null; category: string; score: number | null; also?: number;
}
export interface SourceRun { id: string; ok: boolean; count: number; last_ok: string | null; error?: string }

export const wireCategories = sourcesData.categories as WireCategory[];
export const wireSources = sourcesData.sources as WireSource[];
export const notConnected = sourcesData.not_connected as { name: string; why: string }[];
export const wireItems = wireData.items as WireItem[];
export const wireRuns = wireData.sources as SourceRun[];
export const wireFetched = wireData.fetched as string;
export const wireWindow = wireData.window_days as number;

export const sourceById = (id: string) => wireSources.find((s) => s.id === id);

// Sources in the order they're listed, grouped for the "where this comes from" list.
export const sourceGroups: { label: string; sources: (WireSource & { run?: SourceRun })[] }[] = (() => {
  const out: { label: string; sources: (WireSource & { run?: SourceRun })[] }[] = [];
  for (const s of wireSources) {
    let g = out.find((x) => x.label === s.group);
    if (!g) { g = { label: s.group, sources: [] }; out.push(g); }
    g.sources.push({ ...s, run: wireRuns.find((r) => r.id === s.id) });
  }
  return out;
})();
