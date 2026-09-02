"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const box = useRef<HTMLInputElement>(null);

  // The page is the search box. Put the cursor in it — but not on phones,
  // where a keyboard jumping up over the list is the wrong first impression.
  useEffect(() => {
    if (window.matchMedia("(min-width: 861px)").matches) box.current?.focus();
  }, []);

  // One flat list. The domain still feeds the search index so "video"
  // finds the video jobs, it just isn't a heading anyone has to scan past.
  const jobs = useMemo(
    () => domains.flatMap((d) => d.jobs.map((j) => ({ ...j, domain: d.label }))),
    [domains]
  );
  const hay = useMemo(() => {
    const m = new Map<string, string>();
    for (const j of jobs)
      m.set(j.id, tokens(`${j.label} ${j.aliases.join(" ")} ${j.id.replace(/[.-]/g," ")} ${j.domain}`).map(stem).join(" "));
    return m;
  }, [jobs]);

  const terms = tokens(q).map(stem);
  const hits = (id: string) => terms.filter((t) => hay.get(id)!.includes(t)).length;

  // Strict: every meaningful word matches. Loose: any word matches.
  let mode: "all" | "strict" | "loose" = "all";
  let keep = (id: string) => true;
  if (terms.length) {
    const strict = (id: string) => hits(id) === terms.length;
    if (jobs.some((j) => strict(j.id))) { mode = "strict"; keep = strict; }
    else { mode = "loose"; keep = (id) => hits(id) > 0; }
  }

  const shown = jobs.filter((j) => keep(j.id));
  const href = (id: string) => `/ai-tools/${id.replace(".", "/")}/`;

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

      <ol className="jobs">
        {shown.map((j) => (
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
      {shown.length === 0 && (
        <div className="empty">
          <h2>No match</h2>
          <p>Nothing matches “{q}”. It might be a job we haven&apos;t named yet.</p>
        </div>
      )}
    </>
  );
}
