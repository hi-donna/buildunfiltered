import Ago from "@/components/Ago";
import { initials, thumb, viewsLabel, type Channel, type Video } from "@/lib/watch";

// One video, the way YouTube lays it out: thumbnail, the channel's mark,
// title, channel, views and age. `row` is the compact up-next variant.

export function ChannelMark({ name, size = "s" }: { name: string; size?: "s" | "l" }) {
  return <span className={`yt-mark yt-mark-${size}`} aria-hidden="true">{initials(name)}</span>;
}

export default function VideoCard({ v, ch, row = false }: { v: Video; ch?: Channel; row?: boolean }) {
  const name = ch?.name ?? "";
  return (
    <a className={row ? "yt-card yt-card-row" : "yt-card"} href={`/watch/${v.id}/`}>
      <span className="yt-thumb">
        <img src={thumb(v.id)} alt="" loading="lazy" decoding="async" />
      </span>
      <span className="yt-card-body">
        {!row && <ChannelMark name={name} />}
        <span className="yt-card-text">
          <span className="yt-card-title">{v.title}</span>
          <span className="yt-card-meta">{name}</span>
          <span className="yt-card-meta">{viewsLabel(v.views)} · <Ago iso={v.published} /></span>
        </span>
      </span>
    </a>
  );
}

export function ShortCard({ v, ch }: { v: Video; ch?: Channel }) {
  return (
    <a className="yt-short" href={`/watch/${v.id}/`}>
      <span className="yt-short-thumb">
        <img src={thumb(v.id)} alt="" loading="lazy" decoding="async" />
      </span>
      <span className="yt-card-title">{v.title}</span>
      <span className="yt-card-meta">{ch?.name} · {viewsLabel(v.views)}</span>
    </a>
  );
}
