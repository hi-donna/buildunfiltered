import watchData from "@/data/watch.json";

// Watch: data/watch.json is written by Scout's `watch` project, the same way
// data/wire.json is: every 6 hours it reads the RSS feed of each channel on a
// fixed, hand-checked list (docs/WATCH_CHANNELS.md) and commits the last ~120
// days here. Nothing is picked video by video. This file types and joins it.

export interface Channel {
  id: string; name: string; group: string; home: string; about?: string;
  ok: boolean; count: number; last_ok: string | null;
}
export interface Video {
  id: string;          // YouTube video id
  title: string;
  url: string;         // the video on youtube.com
  published: string;
  channel: string;     // Channel.id
  views: number | null; // as of `fetched`
  short: boolean;
}

interface RawItem { title: string; url: string; published: string; source: string; score: number | null }

const idOf = (url: string) => url.match(/(?:[?&]v=|\/shorts\/|youtu\.be\/)([\w-]{11})/)?.[1] ?? null;

export const watchFetched = watchData.fetched as string;
export const channels = watchData.sources as Channel[];
export const notConnected = watchData.not_connected as { name: string; why: string }[];

export const videos: Video[] = (() => {
  const seen = new Set<string>();
  const out: Video[] = [];
  for (const it of watchData.items as RawItem[]) {
    const id = idOf(it.url);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id, title: it.title, url: it.url, published: it.published, channel: it.source,
      views: it.score, short: it.url.includes("/shorts/"),
    });
  }
  return out.sort((a, b) => b.published.localeCompare(a.published));
})();

export const channelById = (id: string) => channels.find((c) => c.id === id);
export const videoById = (id: string) => videos.find((v) => v.id === id);

// Channel groups in the order Scout lists them.
export const channelGroups: { label: string; channels: Channel[] }[] = (() => {
  const out: { label: string; channels: Channel[] }[] = [];
  for (const c of channels) {
    let g = out.find((x) => x.label === c.group);
    if (!g) { g = { label: c.group, channels: [] }; out.push(g); }
    g.channels.push(c);
  }
  return out;
})();

// Up next: more from the same channel first, then the newest from everyone else.
// Shorts follow shorts; long videos follow long videos.
export function upNext(v: Video, n = 20): Video[] {
  const pool = videos.filter((x) => x.id !== v.id && x.short === v.short);
  const same = pool.filter((x) => x.channel === v.channel).slice(0, 6);
  const rest = pool.filter((x) => x.channel !== v.channel);
  return [...same, ...rest].slice(0, n);
}

export const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const COMPACT = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
export const viewsLabel = (n: number | null) =>
  n === null ? "views unknown" : `${COMPACT.format(n)} view${n === 1 ? "" : "s"}`;

// Two letters for the channel's mark: the logos are the channels', not ours.
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
