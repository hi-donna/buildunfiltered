import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Newsletter from "@/components/Newsletter";
import { AccessStrip } from "@/components/McpList";
import { mcpTargets, getTarget, mcpMethod, transportLabel, type Server } from "@/lib/mcp";

type Params = { id: string };

// One static HTML file per target. Same strategy as the finder: real URLs,
// not one page behind a search box.
export function generateStaticParams(): Params[] {
  return mcpTargets.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const t = getTarget(id);
  if (!t) return {};
  const a = t.pick.access;
  const scope = [a.read && "read", a.write && "write", a.delete && "delete"].filter(Boolean).join(", ");
  return {
    title: `${t.target} MCP server`,
    description: `${t.pick.name} by ${t.pick.maintainer} — ${t.pick.official ? "official" : "community"}, ${transportLabel(t.pick.transport)}, ${scope || "no"} access. The catch, and what to avoid. Last checked ${t.last_verified}.`,
    alternates: { canonical: `/tools/mcp/${id}/` },
  };
}

function ServerCard({ s, small }: { s: Server; small?: boolean }) {
  return (
    <section className={`server${small ? " server-small" : ""}`}>
      <div className="pick-head">
        <h2>{s.name}</h2>
        <span className="maker">{s.maintainer}</span>
        <span className={`tag${s.official ? " tag-official" : ""}`}>{s.official ? "Official" : "Community"}</span>
      </div>
      <dl className="facts">
        <div><dt>Transport</dt><dd>{transportLabel(s.transport)}</dd></div>
        <div><dt>Auth</dt><dd>{s.auth}</dd></div>
        <div><dt>Maintained</dt><dd><span className={`kept kept-${s.maintained}`}>{s.maintained}</span>{s.last_release !== "unknown" && <span className="detail">last release {s.last_release}</span>}</dd></div>
        <div><dt>Cost</dt><dd>{s.cost}</dd></div>
        <div className="span-all"><dt>Clients</dt><dd className="clients">{s.clients.map((c) => <span key={c}>{c}</span>)}</dd></div>
      </dl>
      <div className="access-block">
        <AccessStrip a={s.access} big />
        <p className="scope">{s.access.scope_note}</p>
      </div>
      <div className="catch-block">
        <p className="catch-label">The catch</p>
        <p>{s.the_catch}</p>
      </div>
      <a className="visit" href={s.url} target="_blank" rel="noopener nofollow">Open {s.name}</a>
    </section>
  );
}

export default async function TargetPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const t = getTarget(id);
  if (!t) notFound();

  return (
    <div className="wrap">
      <a className="back" href="/tools/mcp/">← All targets</a>
      <article className="detail">
        <p className="eyebrow" style={{ marginTop: 20 }}>{t.category} · MCP Connect</p>
        <h1>{t.target}</h1>
        <p className="question">{t.question}</p>
        <p className="stampline">
          Last checked <span className="stamp mono">{t.last_verified}</span>
          {!t.official_exists && <span>No vendor-maintained server exists for this target</span>}
          <a href="#method">How we picked ↓</a>
        </p>

        <p className="eyebrow" style={{ marginTop: 32 }}>The pick</p>
        <ServerCard s={t.pick} />

        {t.alternate && (
          <>
            <p className="eyebrow" style={{ marginTop: 40 }}>Alternate</p>
            <ServerCard s={t.alternate} small />
          </>
        )}

        {t.avoid && (
          <section className="avoid" aria-labelledby="avoid-title">
            <h2 id="avoid-title">Avoid</h2>
            <p>{t.avoid}</p>
          </section>
        )}

        <section className="sub method" id="method">
          <h2>How we picked</h2>
          <dl className="meta">
            <div><dt>The method</dt><dd>{mcpMethod.how}</dd></div>
            <div><dt>What we did not do</dt><dd>{mcpMethod.tested_on}</dd></div>
            <div><dt>Conflicts of interest</dt><dd>{mcpMethod.conflicts}</dd></div>
          </dl>
        </section>

        {t.sources.length > 0 && (
          <section className="sub">
            <h2>Sources</h2>
            <div className="srcs">
              {t.sources.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.label}</a>
              ))}
            </div>
          </section>
        )}
      </article>
      <Newsletter />
    </div>
  );
}
