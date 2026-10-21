"use client";
import { useEffect, useState } from "react";
import type { WireCategory, WireItem } from "@/lib/wire";

// The log. One line per item: time, source, title. Everything is rendered in
// UTC so the server HTML and the client agree; the only thing worked out in
// the browser is how old the last fetch is.

const STALE_MS = 24 * 3600 * 1000;
const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
const STAMP = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
});

function ago(ms: number) {
  const h = Math.floor(ms / 3600e3);
  if (h < 1) return "under an hour ago";
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)} days ago`;
}

export function FetchStamp({ fetched }: { fetched: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  const age = now === null ? null : now - Date.parse(fetched);
  return (
    <>
      <p className="wire-stamp">
        Last fetched {STAMP.format(new Date(fetched))} UTC{age !== null && <> · {ago(age)}</>}
      </p>
      {age !== null && age > STALE_MS && (
        <p className="wire-stale" role="status">
          The collector hasn&apos;t run for {ago(age).replace(" ago", "")}. What&apos;s below is out of date.
        </p>
      )}
    </>
  );
}

export default function WireLog({
  items, categories, names, video,
}: {
  items: WireItem[];
  categories: WireCategory[];
  names: Record<string, string>;
  video: string[]; // source ids that are YouTube channels
}) {
  const [cat, setCat] = useState<string | null>(null);

  // #funding, #use-cases… so a filtered view can be linked.
  useEffect(() => {
    const read = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      setCat(categories.some((c) => c.id === h) ? h : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [categories]);

  const pick = (id: string | null) => {
    setCat(id);
    history.replaceState(null, "", id ? `#${id}` : location.pathname);
  };

  const counts = Object.fromEntries(categories.map((c) => [c.id, items.filter((i) => i.category === c.id).length]));
  const label = Object.fromEntries(categories.map((c) => [c.id, c.label]));
  const shown = cat ? items.filter((i) => i.category === cat) : items;
  const current = categories.find((c) => c.id === cat);

  const days: { day: string; rows: WireItem[] }[] = [];
  for (const it of shown) {
    const day = DAY.format(new Date(it.published));
    if (days.at(-1)?.day !== day) days.push({ day, rows: [] });
    days.at(-1)!.rows.push(it);
  }

  return (
    <>
      <div className="chips wire-chips" role="group" aria-label="Category">
        <button type="button" className="chip" aria-pressed={cat === null} onClick={() => pick(null)}>
          All <span className="chip-n">{items.length}</span>
        </button>
        {categories.filter((c) => counts[c.id] > 0).map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => pick(c.id)}>
            {c.label} <span className="chip-n">{counts[c.id]}</span>
          </button>
        ))}
      </div>
      <p className="wire-blurb" aria-live="polite">
        {current ? current.blurb : "Everything, newest first."}
      </p>

      <div className="wire-log">
        {days.map((d) => (
          <section key={d.day} className="wire-day" aria-label={d.day}>
            <h2 className="wire-day-head">{d.day}</h2>
            <ol className="wire-rows">
              {d.rows.map((it) => (
                <li key={it.url} className="wire-row">
                  <time className="wire-time" dateTime={it.published}>{TIME.format(new Date(it.published))}</time>
                  <span className="wire-src">
                    {it.outlet ?? names[it.source] ?? it.source}
                    {video.includes(it.source) && <span className="wire-vid" aria-label="video"> ▶</span>}
                  </span>
                  <span className="wire-main">
                    <a className="wire-title" href={it.url} target="_blank" rel="noopener">{it.title}</a>
                    <span className="wire-meta">
                      {!cat && <span className={`wire-cat wire-cat-${it.category}`}>{label[it.category]}</span>}
                      {it.score !== null && <span title="points / upvotes at fetch time">▲{it.score}</span>}
                      {it.also ? <span title="other outlets carrying the same story">+{it.also} more</span> : null}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
        {shown.length === 0 && <p className="wire-blurb">Nothing in this category this week.</p>}
      </div>
    </>
  );
}
