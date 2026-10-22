import type { Metadata } from "next";
import WireLog, { FetchStamp } from "@/components/WireLog";
import Newsletter from "@/components/Newsletter";
import { site } from "@/site.config";
import {
  wireCategories, wireItems, wireSources, wireFetched, wireWindow, sourceGroups, notConnected,
} from "@/lib/wire";

export const metadata: Metadata = {
  title: { absolute: `The Wire · ${site.name} — ${site.tagline}` },
  description:
    "What happened in AI this week: funding, launches, open source, new use cases, research and policy. Auto-collected every 6 hours from vendor blogs, news, Reddit, Hacker News and YouTube.",
  alternates: { canonical: "/" },
};

export default function Home() {
  const names = Object.fromEntries(wireSources.map((s) => [s.id, s.name]));
  const video = wireSources.filter((s) => s.kind.startsWith("youtube")).map((s) => s.id);
  const live = wireSources.filter((s) => s.ok).length;

  return (
    <div className="wrap finder wire">
      <h1 className="finder-title">The Wire</h1>
      <p className="finder-lede">
        What happened in AI in the last {wireWindow} days. {wireItems.length} items from {wireSources.length} sources,
        collected every 6 hours.
      </p>
      <FetchStamp fetched={wireFetched} />

      <WireLog items={wireItems} categories={wireCategories} names={names} video={video} />

      <section className="sub method" id="sources">
        <h2>Where this comes from</h2>
        <p className="hint">
          Auto-collected from the sources listed here. Not curated. Not endorsed. Categories come from the source
          and from words in the title, so some will be wrong. {live} of {wireSources.length} sources answered on the
          last run.
        </p>
        <dl className="meta">
          {sourceGroups.map((g) => (
            <div key={g.label}>
              <dt>{g.label}</dt>
              <dd>
                <ul className="wire-srclist">
                  {g.sources.map((s) => (
                    <li key={s.id}>
                      <a href={s.home} target="_blank" rel="noopener">{s.name}</a>
                      {!s.ok && <span className="wire-down"> · didn&apos;t answer last run</span>}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
          <div>
            <dt>Not connected</dt>
            <dd>
              <ul className="wire-srclist">
                {notConnected.map((n) => <li key={n.name}><b>{n.name}.</b> <span>{n.why}</span></li>)}
              </ul>
            </dd>
          </div>
        </dl>
      </section>

      <Newsletter />
    </div>
  );
}
