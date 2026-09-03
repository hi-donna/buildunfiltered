import { nodesByLevel, prereqs, getNode, learnStart, type LearnNode } from "@/lib/learn";

// The list is the content. It is server-rendered, always in the DOM, and
// carries every explanation and resource link, so it indexes, reads aloud,
// and works with JS off. The constellation (LearnMap) is a view of this.

export function ResourceList({ node }: { node: LearnNode }) {
  return (
    <ol className="learn-res">
      {node.resources.map((r) => (
        <li key={r.url}>
          <a className="res-link" href={r.url} target="_blank" rel="noopener">{r.title}</a>
          <span className="res-meta">{r.type} · {r.author} · {r.length}</span>
          <p className="res-why">{r.why_this_one}</p>
        </li>
      ))}
    </ol>
  );
}

function NeedsFirst({ id }: { id: string }) {
  const needs = (prereqs.get(id) ?? []).map(getNode).filter((n): n is LearnNode => !!n);
  if (needs.length === 0) return <p className="learn-needs"><span>Start here.</span></p>;
  return (
    <p className="learn-needs">
      <span>Needs first:</span>
      {needs.map((n) => <a key={n.id} href={`#list-${n.id}`}>{n.title}</a>)}
    </p>
  );
}

export default function LearnList() {
  return (
    <div className="learn-list">
      {nodesByLevel.map((g, gi) => (
        <section className="learn-level" key={g.level} id={`level-${g.level}`} aria-labelledby={`level-${g.level}-title`}>
          <header className="learn-level-head">
            <span className="panel-idx" aria-hidden="true">{String(gi).padStart(2, "0")}</span>
            <h2 id={`level-${g.level}-title`}>{g.label}</h2>
            <span className="panel-count">{g.nodes.length} concepts</span>
          </header>
          {g.nodes.map((n) => (
            <details className="learn-row" id={`list-${n.id}`} key={n.id}>
              <summary>
                <span className="learn-row-title">{n.title}</span>
                <span className="learn-row-meta">
                  {n.id === learnStart ? "start here" : `${(prereqs.get(n.id) ?? []).length} before it`} · {n.resources.length} to read
                </span>
              </summary>
              <div className="learn-row-body">
                <p className="learn-explain">{n.explain}</p>
                <NeedsFirst id={n.id} />
                <ResourceList node={n} />
                {n.the_catch && (
                  <div className="catch-block">
                    <p className="catch-label">The catch</p>
                    <p>{n.the_catch}</p>
                  </div>
                )}
                <p className="learn-stamp">Verified {n.resources[0].last_verified}</p>
              </div>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}
