"use client";
import { useEffect, useMemo, useState } from "react";
import VideoCard, { ChannelMark, ShortCard } from "@/components/VideoCard";
import type { Channel, Video } from "@/lib/watch";

// The home grid. Everything is already on the page; search, chips and the
// channel list only filter it. The chosen channel lives in the hash
// (#langchain) so a filtered view can be linked.

type Sort = "mix" | "latest" | "views";
const slug = (id: string) => id.replace(/^yt-/, "");
const FIRST_ROW = 8; // long videos before the Shorts shelf, like YouTube's home

export default function WatchHome({
  videos, channels, groups,
}: {
  videos: Video[];
  channels: Channel[];
  groups: { label: string; ids: string[] }[];
}) {
  const [channel, setChannel] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("mix");
  const [q, setQ] = useState("");

  const byId = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels]);

  useEffect(() => {
    const read = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      const c = channels.find((x) => slug(x.id) === h);
      setChannel(c ? c.id : null);
      if (c) setGroup(null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [channels]);

  const pickChannel = (id: string | null) => {
    setChannel(id);
    setGroup(null);
    history.replaceState(null, "", id ? `#${slug(id)}` : location.pathname);
    window.scrollTo({ top: 0 });
  };

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const inGroup = group ? new Set(groups.find((g) => g.label === group)?.ids) : null;
    const out = videos.filter((v) =>
      (!channel || v.channel === channel) &&
      (!inGroup || inGroup.has(v.channel)) &&
      words.every((w) => v.title.toLowerCase().includes(w) || (byId.get(v.channel)?.name.toLowerCase().includes(w) ?? false)));
    if (sort === "views") return [...out].sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
    if (sort === "latest" || channel) return out;
    // Mix: each channel's two newest, newest first, then the next two, and so
    // on, so one channel that posts daily can't fill the page.
    const turn = new Map<string, number>(), rank = new Map<string, number>();
    for (const v of out) {
      const n = turn.get(v.channel) ?? 0;
      turn.set(v.channel, n + 1);
      rank.set(v.id, Math.floor(n / 2));
    }
    return [...out].sort((a, b) => rank.get(a.id)! - rank.get(b.id)! || b.published.localeCompare(a.published));
  }, [videos, channel, group, groups, sort, q, byId]);

  const long = shown.filter((v) => !v.short);
  const shorts = shown.filter((v) => v.short);
  const ch = channel ? byId.get(channel) : undefined;

  return (
    <div className="yt">
      <nav className="yt-side" aria-label="Channels">
        <button type="button" className="yt-side-item" aria-pressed={!channel} onClick={() => pickChannel(null)}>
          <span className="yt-side-icon" aria-hidden="true">⌂</span><span>Home</span>
        </button>
        {groups.map((g) => (
          <div key={g.label} className="yt-side-group">
            <p className="yt-side-label">{g.label}</p>
            {g.ids.map((id) => {
              const c = byId.get(id)!;
              return (
                <button key={id} type="button" className="yt-side-item" aria-pressed={channel === id} onClick={() => pickChannel(id)}>
                  <ChannelMark name={c.name} /><span className="yt-side-name">{c.name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="yt-main">
        <div className="yt-top">
          <label className="yt-search">
            <span className="sr-only">Search videos</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={ch ? `Search ${ch.name}` : "Search videos"} autoComplete="off" />
            <span className="yt-search-icon" aria-hidden="true">⌕</span>
          </label>
        </div>

        {ch && (
          <header className="yt-channel">
            <ChannelMark name={ch.name} size="l" />
            <div>
              <h2 className="yt-channel-name">{ch.name}</h2>
              {ch.about && <p className="yt-channel-about">{ch.about}</p>}
              <p className="yt-channel-links">
                <a href={ch.home} target="_blank" rel="noopener">Channel on YouTube ↗</a>
                {!ch.ok && <span className="wire-down"> · didn&apos;t answer last run</span>}
              </p>
            </div>
          </header>
        )}

        <div className="yt-chips" role="group" aria-label="Filter">
          {!ch && (
            <>
              <button type="button" className="yt-chip" aria-pressed={!group} onClick={() => setGroup(null)}>All</button>
              {groups.map((g) => (
                <button key={g.label} type="button" className="yt-chip" aria-pressed={group === g.label}
                  onClick={() => setGroup(group === g.label ? null : g.label)}>{g.label}</button>
              ))}
              <span className="yt-chip-gap" aria-hidden="true" />
            </>
          )}
          {!ch && (
            <button type="button" className="yt-chip" aria-pressed={sort === "mix"} onClick={() => setSort("mix")}
              title="Each channel's newest, taken in turns">Mix</button>
          )}
          <button type="button" className="yt-chip" aria-pressed={sort === "latest" || (!!ch && sort === "mix")} onClick={() => setSort("latest")}>Latest</button>
          <button type="button" className="yt-chip" aria-pressed={sort === "views"} onClick={() => setSort("views")}
            title="Most viewed among the recent videos collected here, not all time">Most viewed</button>
        </div>

        {shown.length === 0 ? (
          <div className="empty">
            <h2>Nothing matches</h2>
            <p>No video title or channel here has {q ? <>&ldquo;{q}&rdquo;</> : "that"} in it. Try fewer words.</p>
          </div>
        ) : (
          <>
            <div className="yt-grid">
              {long.slice(0, FIRST_ROW).map((v) => <VideoCard key={v.id} v={v} ch={byId.get(v.channel)} />)}
            </div>
            {shorts.length > 0 && (
              <section className="yt-shelf" id="shorts" aria-label="Shorts">
                <h2 className="yt-shelf-head">Shorts</h2>
                <div className="yt-shelf-row">
                  {shorts.slice(0, 24).map((v) => <ShortCard key={v.id} v={v} ch={byId.get(v.channel)} />)}
                </div>
              </section>
            )}
            {long.length > FIRST_ROW && (
              <div className="yt-grid">
                {long.slice(FIRST_ROW).map((v) => <VideoCard key={v.id} v={v} ch={byId.get(v.channel)} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
