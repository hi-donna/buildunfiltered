import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Ago from "@/components/Ago";
import VideoCard, { ChannelMark } from "@/components/VideoCard";
import { site } from "@/site.config";
import { channelById, thumb, upNext, videoById, videos, viewsLabel } from "@/lib/watch";

// One page per video, built at deploy time. The player is YouTube's own
// embed (the privacy-enhanced youtube-nocookie domain); the page around it is ours.

export const dynamicParams = false;

export function generateStaticParams() {
  return videos.map((v) => ({ id: v.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = videoById((await params).id);
  if (!v) return {};
  const ch = channelById(v.channel);
  return {
    title: v.title,
    description: `${v.title}, from ${ch?.name ?? "YouTube"}. Watch it on ${site.name}, no sign-in.`,
    alternates: { canonical: `/watch/${v.id}/` },
    openGraph: { type: "video.other", title: v.title, url: `/watch/${v.id}/`, images: [{ url: thumb(v.id), width: 480, height: 360 }] },
  };
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function VideoPage({ params }: Props) {
  const v = videoById((await params).id);
  if (!v) notFound();
  const ch = channelById(v.channel);
  const next = upNext(v);

  return (
    <div className={v.short ? "watch watch-one is-short" : "watch watch-one"}>
      <div className="yt-play">
        <div className="yt-player">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1`}
            title={v.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <h1 className="yt-title">{v.title}</h1>

        <div className="yt-owner">
          {ch && (
            <a className="yt-owner-ch" href={`/watch/#${ch.id.replace(/^yt-/, "")}`}>
              <ChannelMark name={ch.name} />
              <span>{ch.name}</span>
            </a>
          )}
          <a className="yt-owner-out" href={v.url} target="_blank" rel="noopener">Open on YouTube ↗</a>
        </div>

        <div className="yt-desc">
          <p className="yt-desc-meta">
            {viewsLabel(v.views)} · <Ago iso={v.published} /> <span className="yt-desc-date">· {DATE.format(new Date(v.published))}</span>
          </p>
          {ch?.about && <p>{ch.about}</p>}
          <p className="yt-desc-note">
            Plays in YouTube&apos;s player. Views as of the last fetch. Description, comments and likes are on{" "}
            <a href={v.url} target="_blank" rel="noopener">YouTube</a>.
          </p>
        </div>
      </div>

      <aside className="yt-next" aria-label="Up next">
        <h2 className="yt-shelf-head">Up next</h2>
        {next.map((x) => <VideoCard key={x.id} v={x} ch={channelById(x.channel)} row />)}
        <a className="yt-next-all" href="/watch/">All videos</a>
      </aside>
    </div>
  );
}
