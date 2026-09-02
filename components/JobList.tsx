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

export default function JobList({
  domains, reviewed, total,
}: { domains: Domain[]; reviewed: string[]; total: number }) {
  const [q, setQ] = useState("");
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
    .map((d) => ({ ...d, jobs: d.jobs.filter((j) => keep(j.id)) }))
    .filter((d) => d.jobs.length > 0);
  const shown = filtered.reduce((n, d) => n + d.jobs.length, 0);
  const href = (id: string) => `/ai-tools/${id.replace(".", "/")}/`;

  return (
    <>
      <div className="controls">
        <input
          className="search" type="search" value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What are you trying to do?" aria-label="Search jobs"
        />
        <p className="count">
          {mode === "loose" ? `closest ${shown}` : `${shown} of ${total}`}
        </p>
      </div>

      {mode === "loose" && shown > 0 && (
        <p className="search-note">
          Nothing matches all of “{q}”. Showing the closest jobs — if yours isn&apos;t here, it&apos;s one we haven&apos;t named yet.
        </p>
      )}

      <div className="grid">
        <nav className="nav" aria-label="Categories">
          {filtered.map((d) => (
            <a key={d.id} href={`#${d.id}`}><span>{d.label}</span><em>{d.jobs.length}</em></a>
          ))}
        </nav>
        <main>
          {filtered.map((d) => (
            <section className="dom" id={d.id} key={d.id}>
              <header className="dom-head">
                <h2>{d.label}</h2>
                <p className="blurb">{d.blurb}</p>
              </header>
              <ol className="jobs">
                {d.jobs.map((j) => (
                  <li className={`job${done.has(j.id) ? " is-live" : ""}`} key={j.id}>
                    <a className="job-link" href={href(j.id)}>
                      <span className="job-main">
                        <span className="label">{j.label}</span>
                        <span className="aliases">{j.aliases.join(" · ")}</span>
                      </span>
                      <span className="state">{done.has(j.id) ? "[5 picks]" : "[unreviewed]"}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          {shown === 0 && (
            <p className="blurb" style={{ marginTop: 24 }}>
              Nothing matches “{q}”. It might be a job we haven&apos;t named yet.
            </p>
          )}
        </main>
      </div>
    </>
  );
}
