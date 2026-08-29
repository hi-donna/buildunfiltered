"use client";
import { useMemo, useState } from "react";
import type { Domain } from "@/lib/data";

export default function JobList({
  domains, reviewed, total,
}: { domains: Domain[]; reviewed: string[]; total: number }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const done = useMemo(() => new Set(reviewed), [reviewed]);

  const filtered = domains
    .map((d) => ({
      ...d,
      jobs: d.jobs.filter(
        (j) => !term ||
          (j.label + " " + j.aliases.join(" ") + " " + j.id).toLowerCase().includes(term)
      ),
    }))
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
        <p className="count">{shown} of {total}</p>
      </div>

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
                      <span className="state">{done.has(j.id) ? "5 picks" : "not reviewed"}</span>
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
