import {
  learnNodes, prereqs, getNode, groupResources, learnMethod, learnGenerated, learnEdges,
  LEVEL_LABEL, type LearnNode,
} from "@/lib/learn";

// One native <dialog> per concept, server-rendered so every explanation and
// resource link is in the HTML (indexable, readable with JS off via the hash
// links) while nothing sits below the map. LearnMap opens them with
// showModal(); Esc, the × button and a backdrop click close them.

export function ResourceList({ node }: { node: LearnNode }) {
  return (
    <div className="learn-res-groups">
      {groupResources(node.resources).map((g) => (
        <section className="learn-res-group" key={g.label}>
          <h3 className="res-group-head">{g.label}</h3>
          <ol className="learn-res">
            {g.items.map((r) => (
              <li key={r.url}>
                <span className="res-title">
                  <a className="res-link" href={r.url} target="_blank" rel="noopener">{r.title}</a>
                  {r.start && <span className="tag tag-official res-start">start here</span>}
                </span>
                <span className="res-meta">{r.type} · {r.author} · {r.length}</span>
                <p className="res-why">{r.why_this_one}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function CloseButton() {
  return (
    <form method="dialog">
      <button type="submit" className="learn-close" aria-label="Close">×</button>
    </form>
  );
}

function NodeDialog({ n }: { n: LearnNode }) {
  const needs = (prereqs.get(n.id) ?? []).map(getNode).filter((x): x is LearnNode => !!x);
  return (
    <dialog className="learn-dialog" id={`dialog-${n.id}`} aria-labelledby={`dialog-${n.id}-title`}>
      <div className="learn-dialog-inner">
        <div className="learn-dialog-head">
          <p className="eyebrow">{LEVEL_LABEL[n.level]}</p>
          <CloseButton />
        </div>
        <h2 id={`dialog-${n.id}-title`}>{n.title}</h2>
        <p className="learn-explain">{n.explain}</p>
        <p className="learn-needs">
          <span>{needs.length ? "Needs first:" : "Start here."}</span>
          {needs.map((p) => <a key={p.id} href={`#${p.id}`}>{p.title}</a>)}
        </p>
        <ResourceList node={n} />
        {n.the_catch && (
          <div className="catch-block">
            <p className="catch-label">The catch</p>
            <p>{n.the_catch}</p>
          </div>
        )}
        <p className="learn-stamp">Verified {n.resources[0].last_verified}</p>
      </div>
    </dialog>
  );
}

export default function LearnDialogs() {
  return (
    <>
      {learnNodes.map((n) => <NodeDialog n={n} key={n.id} />)}
      <dialog className="learn-dialog" id="dialog-method" aria-labelledby="dialog-method-title">
        <div className="learn-dialog-inner">
          <div className="learn-dialog-head">
            <p className="eyebrow">Learning Map</p>
            <CloseButton />
          </div>
          <h2 id="dialog-method-title">How we picked</h2>
          <dl className="meta">
            <div><dt>The method</dt><dd>{learnMethod.how}</dd></div>
            <div><dt>What we did not do</dt><dd>{learnMethod.tested_on}</dd></div>
            <div><dt>Conflicts of interest</dt><dd>{learnMethod.conflicts}</dd></div>
            <div><dt>Last checked</dt><dd>{learnGenerated} · {learnNodes.length} concepts · {learnEdges.length} prerequisite links</dd></div>
          </dl>
        </div>
      </dialog>
    </>
  );
}
