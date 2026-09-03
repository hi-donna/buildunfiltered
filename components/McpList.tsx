"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Target } from "@/lib/mcp";
import { index, matcher, byScore } from "@/lib/search";

// The index lists the facts the page exists for: who maintains the server and
// what it can touch. Everything a row shows is read straight from the data.

type Facet = "official" | "readonly" | "nokey" | "remote";
const FACETS: { key: Facet; label: string }[] = [
  { key: "official", label: "official only" },
  { key: "readonly", label: "read-only available" },
  { key: "nokey", label: "no API key needed" },
  { key: "remote", label: "remote" },
];

export function AccessStrip({ a, big }: { a: Target["pick"]["access"]; big?: boolean }) {
  const cells: [string, boolean, string][] = [
    ["R", a.read, "read"], ["W", a.write, "write"], ["D", a.delete, "delete"],
  ];
  const text = cells.map(([k, on, w]) => `${w}: ${on ? "yes" : "no"}`).join(", ");
  return (
    <span className={`access${big ? " access-big" : ""}`} role="img" aria-label={text}>
      {cells.map(([k, on, w]) => (
        <span key={k} className={`cell cell-${w}${on ? " on" : ""}`} aria-hidden="true">{k}</span>
      ))}
    </span>
  );
}

export default function McpList({
  groups, facets,
}: {
  groups: { label: string; targets: Target[] }[];
  // Precomputed on the server so the client never re-derives a fact.
  facets: Record<string, Record<Facet, boolean>>;
}) {
  const [q, setQ] = useState("");
  const [on, setOn] = useState<Set<Facet>>(() => new Set());
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const box = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.matchMedia("(min-width: 861px)").matches) box.current?.focus();
  }, []);

  const all = useMemo(() => groups.flatMap((g) => g.targets), [groups]);
  const total = all.length;
  const [hay, title] = useMemo(() => {
    const m = new Map<string, string>(), n = new Map<string, string>();
    for (const t of all) {
      const alt = t.alternate ? `${t.alternate.name} ${t.alternate.maintainer}` : "";
      m.set(t.id, index(`${t.target} ${t.id.replace(/-/g, " ")} ${t.category} ${t.question} ${t.pick.name} ${t.pick.maintainer} ${alt}`));
      n.set(t.id, index(`${t.target} ${t.id.replace(/-/g, " ")} ${t.pick.name}`));
    }
    return [m, n];
  }, [all]);

  const { mode, keep, searching, score } = matcher(q, hay, all.map((t) => t.id), title);
  const passes = (t: Target) => keep(t.id) && [...on].every((f) => facets[t.id][f]);

  const shown = groups
    .map((g, i) => ({ ...g, index: i + 1, targets: byScore(g.targets.filter(passes), (t) => t.id, score, mode) }))
    .filter((g) => g.targets.length > 0);
  const count = shown.reduce((n, g) => n + g.targets.length, 0);

  const filtering = searching || on.size > 0;
  const isOpen = (id: string) => filtering || opened.has(id);
  const toggle = (id: string) =>
    setOpened((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const flip = (f: Facet) =>
    setOn((s) => { const n = new Set(s); n.has(f) ? n.delete(f) : n.add(f); return n; });

  return (
    <>
      <div className="controls" role="search">
        <div className="search-wrap">
          <input
            ref={box} className="search" type="search" value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What do you want your AI to reach?" aria-label="Search targets"
            autoComplete="off" spellCheck={false}
          />
        </div>
        <p className="count" aria-live="polite">
          {mode === "loose" ? `closest ${count}` : `${count} of ${total}`}
        </p>
      </div>

      <div className="chips" role="group" aria-label="Filters">
        {FACETS.map((f) => (
          <button
            key={f.key} type="button" className="chip" aria-pressed={on.has(f.key)}
            onClick={() => flip(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {mode === "loose" && count > 0 && (
        <p className="search-note">
          Nothing matches all of “{q}”. Showing the closest targets — if yours isn&apos;t here, it&apos;s one we haven&apos;t covered yet.
        </p>
      )}

      <div className="panels">
        {shown.map((g) => {
          const gid = g.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return (
            <section
              className={`panel${isOpen(gid) ? " is-open" : ""}`}
              id={gid} key={gid} aria-labelledby={`${gid}-title`}
            >
              <header className="panel-head">
                <span className="panel-idx" aria-hidden="true">{String(g.index).padStart(2, "0")}</span>
                <div className="panel-title">
                  <h2 id={`${gid}-title`}>{g.label}</h2>
                </div>
                <span className="panel-count">{g.targets.length} {g.targets.length === 1 ? "target" : "targets"}</span>
                <button
                  type="button" className="panel-toggle"
                  aria-expanded={isOpen(gid)} aria-controls={`${gid}-rows`}
                  onClick={() => toggle(gid)} disabled={filtering}
                >
                  {g.targets.length}
                </button>
              </header>
              <ol className="jobs" id={`${gid}-rows`}>
                {g.targets.map((t) => (
                  <li className="job mcp-row" key={t.id}>
                    <a className="job-link" href={`/tools/mcp/${t.id}/`}>
                      <span className={`tag${t.pick.official ? " tag-official" : ""}`}>
                        {t.pick.official ? "Official" : "Community"}
                      </span>
                      <span className="job-main">
                        <span className="label">{t.target}</span>
                        <span className="aliases">{t.pick.name} · {t.pick.maintainer}</span>
                      </span>
                      <AccessStrip a={t.pick.access} />
                      <span className="state">
                        <span>{t.pick.transport === "both" ? "remote + local" : t.pick.transport}</span>
                        <span className={`kept kept-${t.pick.maintained}`}>{t.pick.maintained}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
      {count === 0 && (
        <div className="empty">
          <h2>No match</h2>
          <p>Nothing matches “{q}”{on.size ? " with those filters" : ""}. It might be something we haven&apos;t covered yet.</p>
        </div>
      )}
    </>
  );
}
