"use client";
import { useMemo, useState } from "react";
import type { Domain } from "@/lib/data";

// Words people type that carry no signal. "make reels" should find the
// reels job; "make" matches nothing and must not block it.
const STOP = new Set([
  "a","an","the","my","me","i","to","for","of","in","on","with","from","into",
  "make","create","build","get","do","want","need","help","how","can","some",
  "using","use","ai","tool","tools","best","good","free",
]);

function tokens(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

// Loose stem so "reels" finds "reel", "backgrounds" finds "background".
const stem = (t: string) => t.replace(/(ing|ers|er|es|s)$/,"");

const pad = (n: number) => String(n).padStart(2, "0");

export default function JobList({
  domains, reviewed, total,
}: { domains: Domain[]; reviewed: string[]; total: number }) {
  const [q, setQ] = useState("");
  // Panels a reader has opened by hand. Only matters under 860px — the CSS
  // ignores the collapsed state on wider screens, so the server render (all
  // collapsed) is correct everywhere and nothing jumps after hydration.
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const done = useMemo(() => new Set(reviewed), [reviewed]);

  const hay = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of domains) for (const j of d.jobs)
      m.set(j.id, tokens(`${j.label} ${j.aliases.join(" ")} ${j.id.replace(/[.-]/g," ")} ${d.label}`).map(stem).join(" "));
    return m;
  }, [domains]);

  const terms = tokens(q).map(stem);
  const hits = (id: string) => terms.filter((t) => hay.get(id)!.includes(t)).length;

  // Strict: every meaningful word matches. Loose: any word matches.
  let mode: "all" | "strict" | "loose" = "all";
  let keep = (id: string) => true;
  if (terms.length) {
    const strict = (id: string) => hits(id) === terms.length;
    const anyStrict = domains.some((d) => d.jobs.some((j) => strict(j.id)));
    if (anyStrict) { mode = "strict"; keep = strict; }
    else { mode = "loose"; keep = (id) => hits(id) > 0; }
  }

  const filtered = domains
    .map((d, i) => ({ ...d, index: i + 1, jobs: d.jobs.filter((j) => keep(j.id)) }))
    .filter((d) => d.jobs.length > 0);
  const shown = filtered.reduce((n, d) => n + d.jobs.length, 0);
  const href = (id: string) => `/ai-tools/${id.replace(".", "/")}/`;

  // A search opens everything: hiding matches behind a tap defeats the search.
  const searching = terms.length > 0;
  const isOpen = (id: string) => searching || opened.has(id);
  const toggle = (id: string) =>
    setOpened((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const open = (id: string) =>
    setOpened((s) => (s.has(id) ? s : new Set(s).add(id)));

  return (
    <>
      <div className="controls" role="search">
        <div className="search-wrap">
          <input
            className="search" type="search" value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What are you trying to do?" aria-label="Search jobs"
            autoComplete="off" spellCheck={false}
          />
        </div>
        <p className="count" aria-live="polite">
          {mode === "loose" ? `closest ${shown}` : `${shown} of ${total}`}
        </p>
      </div>

      {mode === "loose" && shown > 0 && (
        <p className="search-note">
          Nothing matches all of “{q}”. Showing the closest jobs — if yours isn&apos;t here, it&apos;s one we haven&apos;t named yet.
        </p>
      )}

      <div className="grid">
        <aside className="rail">
          <p className="rail-head">Categories</p>
          <nav className="nav" aria-label="Categories">
            {filtered.map((d) => (
              <a key={d.id} href={`#${d.id}`} onClick={() => open(d.id)}>
                <span>{d.label}</span><em>{d.jobs.length}</em>
              </a>
            ))}
          </nav>
        </aside>
        <div>
          {filtered.map((d) => (
            <section
              className={`panel${isOpen(d.id) ? " is-open" : ""}`}
              id={d.id} key={d.id} aria-labelledby={`${d.id}-title`}
            >
              <header className="panel-head">
                <span className="panel-idx" aria-hidden="true">{pad(d.index)}</span>
                <div className="panel-title">
                  <h2 id={`${d.id}-title`}>{d.label}</h2>
                  <p className="blurb">{d.blurb}</p>
                </div>
                <span className="panel-count">{d.jobs.length} {d.jobs.length === 1 ? "job" : "jobs"}</span>
                <button
                  type="button" className="panel-toggle"
                  aria-expanded={isOpen(d.id)} aria-controls={`${d.id}-jobs`}
                  onClick={() => toggle(d.id)} disabled={searching}
                >
                  {d.jobs.length}
                </button>
              </header>
              <ol className="jobs" id={`${d.id}-jobs`}>
                {d.jobs.map((j) => (
                  <li className={`job${done.has(j.id) ? " is-live" : ""}`} key={j.id}>
                    <a className="job-link" href={href(j.id)}>
                      <span className="job-mark" aria-hidden="true" />
                      <span className="job-main">
                        <span className="label">{j.label}</span>
                        <span className="aliases">{j.aliases.join(" · ")}</span>
                      </span>
                      <span className="state">{done.has(j.id) ? "5 picks" : "unreviewed"}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          {shown === 0 && (
            <div className="empty">
              <h2>No match</h2>
              <p>Nothing matches “{q}”. It might be a job we haven&apos;t named yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
