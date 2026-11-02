import type { Metadata } from "next";
import WatchHome from "@/components/WatchHome";
import { FetchStamp } from "@/components/WireLog";
import { site } from "@/site.config";
import { channelGroups, channels, notConnected, videos, watchFetched } from "@/lib/watch";

export const metadata: Metadata = {
  title: "Watch",
  description: `The latest videos from ${channels.length} official AI channels: Anthropic, Claude, OpenAI, LangChain, Hugging Face and more. Collected every 6 hours. No sign-in.`,
  alternates: { canonical: "/watch/" },
  openGraph: { title: `Watch · ${site.name}`, url: "/watch/" },
};

export default function WatchPage() {
  const live = channels.filter((c) => c.ok).length;
  return (
    <div className="watch">
      <h1 className="sr-only">Watch</h1>
      <WatchHome
        videos={videos}
        channels={channels}
        groups={channelGroups.map((g) => ({ label: g.label, ids: g.channels.map((c) => c.id) }))}
      />

      <section className="sub method watch-method" id="sources">
        <h2>Where this comes from</h2>
        <p className="hint">
          The latest videos from {channels.length} official channels, run by the companies and teams that make the
          tools. Each channel was checked by hand; the videos aren&apos;t. Collected every 6 hours from each
          channel&apos;s public feed, which carries its last 15 uploads, so &ldquo;Most viewed&rdquo; means most viewed
          of those, not of all time. View counts are as of the last fetch. Videos play through YouTube&apos;s own
          player. {live} of {channels.length} channels answered on the last run.
        </p>
        <FetchStamp fetched={watchFetched} />
        <dl className="meta">
          {channelGroups.map((g) => (
            <div key={g.label}>
              <dt>{g.label}</dt>
              <dd>
                <ul className="wire-srclist">
                  {g.channels.map((c) => (
                    <li key={c.id}>
                      <a href={c.home} target="_blank" rel="noopener">{c.name}</a>
                      {!c.ok && <span className="wire-down"> · didn&apos;t answer last run</span>}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
          {notConnected.length > 0 && (
            <div>
              <dt>Not included</dt>
              <dd>
                <ul className="wire-srclist">
                  {notConnected.map((n) => <li key={n.name}><b>{n.name}.</b> <span>{n.why}</span></li>)}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}
