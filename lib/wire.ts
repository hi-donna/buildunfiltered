import wireData from "@/data/wire.json";

// The Wire: data/wire.json is written by Scout (github.com/hi-donna/scout), the
// private collector, which commits it here after every run (every 6 hours).
// The file carries everything the page needs: categories, sources with their
// last-run health, the not-connected list and the items. This file only types
// and joins it. Nothing here is curated.

export interface WireCategory { id: string; label: string; blurb?: string }
export interface WireSource {
  id: string; name: string; group: string; kind: string; home: string;
  ok: boolean; count: number; last_ok: string | null; error?: string;
}
export interface WireItem {
  title: string; url: string; published: string; source: string;
  outlet: string | null; category: string; score: number | null; also?: number;
}

export const wireCategories = wireData.categories as WireCategory[];
export const wireSources = wireData.sources as WireSource[];
export const notConnected = wireData.not_connected as { name: string; why: string }[];
export const wireItems = wireData.items as WireItem[];
export const wireFetched = wireData.fetched as string;
export const wireWindow = wireData.window_days as number;

export const sourceById = (id: string) => wireSources.find((s) => s.id === id);

// Sources in the order they're listed, grouped for the "where this comes from" list.
export const sourceGroups: { label: string; sources: WireSource[] }[] = (() => {
  const out: { label: string; sources: WireSource[] }[] = [];
  for (const s of wireSources) {
    let g = out.find((x) => x.label === s.group);
    if (!g) { g = { label: s.group, sources: [] }; out.push(g); }
    g.sources.push(s);
  }
  return out;
})();
