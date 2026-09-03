"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Domain } from "@/lib/data";

import { index, matcher, byScore } from "@/lib/search";

export default function JobList({
  domains, reviewed, total,
}: { domains: Domain[]; reviewed: string[]; total: number }) {
  const [q, setQ] = useState("");
  // Panels a reader has opened by hand. Only matters on phones — CSS ignores
  // the collapsed state on wider screens, so the server render (all
  // collapsed) is right everywhere and nothing jumps after hydration.
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const done = useMemo(() => new Set(reviewed), [reviewed]);
  const box = useRef<HTMLInputElement>(null);

  // The page is the search box. Put the cursor in it — but not on phones,
  // where a keyboard jumping up over the list is the wrong first impression.
  useEffect(() => {
    if (window.matchMedia("(min-width: 861px)").matches) box.current?.focus();
  }, []);

  // The domain feeds the search index too, so "video" finds the video jobs.
  const jobs = useMemo(
    () => domains.flatMap((d) => d.jobs.map((j) => ({ ...j, domain: d.label }))),
    [domains]
  );
  const [hay, title] = useMemo(() => {
    const m = new Map<string, string>(), n = new Map<string, string>();
    for (const j of jobs) {
      m.set(j.id, index(`${j.label} ${j.aliases.join(" ")} ${j.id.replace(/[.-]/g," ")} ${j.domain}`));
      n.set(j.id, index(j.label));
    }
    return [m, n];
  }, [jobs]);

  const { mode, keep, searching, score } = matcher(q, hay, jobs.map((j) => j.id), title);

  const groups = domains
    .map((d, i) => ({ ...d, index: i + 1, jobs: byScore(d.jobs.filter((j) => keep(j.id)), (j) => j.id, score, mode) }))
    .filter((d) => d.jobs.length > 0);
  const shown = groups.flatMap((d) => d.jobs);
  const href = (id: string) => `/ai-tools/${id.replace(".", "/")}/`;
  const pad = (n: number) => String(n).padStart(2, "0");

  // A search opens everything: hiding matches behind a tap defeats the search.
  const isOpen = (id: string) => searching || opened.has(id);
  const toggle = (id: string) =>
    setOpened((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <>
      <div className="controls" role="search">
        <div className="search-wrap">
          <input
            ref={box}
            className="search" type="search" value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What are you trying to do?" aria-label="Search jobs"
            autoComplete="off" spellCheck={false}
          />
        </div>
        <p className="count" aria-live="polite">
          {mode === "loose" ? `closest ${shown.length}` : `${shown.length} of ${total}`}
        </p>
      </div>

      {mode === "loose" && shown.length > 0 && (
        <p className="search-note">
          Nothing matches all of “{q}”. Showing the closest jobs — if yours isn&apos;t here, it&apos;s one we haven&apos;t named yet.
        </p>
      )}

      <div className="panels">
        {groups.map((d) => (
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
      </div>
      {shown.length === 0 && (
        <div className="empty">
          <h2>No match</h2>
          <p>Nothing matches “{q}”. It might be a job we haven&apos;t named yet.</p>
        </div>
      )}
    </>
  );
}
