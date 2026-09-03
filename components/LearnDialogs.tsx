import {
  learnNodes, prereqs, getNode, groupResources, learnMethod, learnGenerated, learnEdges,
  LEVEL_LABEL, type LearnNode, type Resource,
} from "@/lib/learn";

// One native <dialog> per concept, server-rendered so every explanation and
// resource link is in the HTML. On wide screens LearnMap opens them with
// show() inside the drawer (bone paper, pinned right); on phones with
// showModal() as a full-screen sheet. Esc, the × button and a backdrop click
// close them.

function ResourceItem({ r }: { r: Resource }) {
  return (
    <li>
      <span className="res-title">
        <a className="res-link" href={r.url} target="_blank" rel="noopener">{r.title}</a>
      </span>
      <span className="res-meta">{r.type} · {r.author} · {r.length}</span>
      <p className="res-why">{r.why_this_one}</p>
    </li>
  );
}

// "Start here" is pulled out on top; the rest are grouped Papers / Watch /
// Read / Docs in the order of the JSON. Empty groups are omitted.
export function ResourceList({ node }: { node: LearnNode }) {
  const start = node.resources.find((r) => r.start);
  const rest = node.resources.filter((r) => !r.start);
  return (
    <div className="learn-res-groups">
      {start && (
        <section className="learn-res-group learn-res-start">
          <h3 className="res-group-head">Start here</h3>
          <ol className="learn-res"><ResourceItem r={start} /></ol>
        </section>
      )}
      {groupResources(rest).map((g) => (
        <section className="learn-res-group" key={g.label}>
          <h3 className="res-group-head">{g.label}</h3>
          <ol className="learn-res">
            {g.items.map((r) => <ResourceItem r={r} key={r.url} />)}
          </ol>
        </section>
      ))}
    </div>
  );
}

function DialogHead({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="learn-dialog-head">
      <span className="learn-pin" aria-hidden="true" />
      <p className="learn-paper-eyebrow">{eyebrow}</p>
      <form method="dialog">
        <button type="submit" className="learn-close" aria-label="Close">×</button>
      </form>
    </div>
  );
}

function NodeDialog({ n }: { n: LearnNode }) {
  const needs = (prereqs.get(n.id) ?? []).map(getNode).filter((x): x is LearnNode => !!x);
  return (
    <dialog className="learn-dialog paper" id={`dialog-${n.id}`} aria-labelledby={`dialog-${n.id}-title`}>
      <div className="learn-dialog-inner">
        <DialogHead eyebrow="Field notes" />
        <h2 id={`dialog-${n.id}-title`}>{n.title}</h2>
        <p className="learn-level">{LEVEL_LABEL[n.level]}</p>
        <p className="learn-explain">{n.explain}</p>
        {needs.length > 0 && (
          <p className="learn-needs">
            <span>Needs first:</span>
            {needs.map((p) => <a key={p.id} href={`#${p.id}`}>{p.title}</a>)}
          </p>
        )}
        <ResourceList node={n} />
        {n.the_catch && (
          <div className="learn-catch">
            <p className="catch-label">The catch</p>
            <p>{n.the_catch}</p>
          </div>
        )}
        <p className="learn-stamp" aria-label={`Verified ${n.resources[0].last_verified}`}>
          <span>Verified</span><span>{n.resources[0].last_verified}</span>
        </p>
      </div>
    </dialog>
  );
}

export default function LearnDialogs() {
  return (
    <>
      {learnNodes.map((n) => <NodeDialog n={n} key={n.id} />)}
      <dialog className="learn-dialog paper" id="dialog-method" aria-labelledby="dialog-method-title">
        <div className="learn-dialog-inner">
          <DialogHead eyebrow="Field notes / method" />
          <h2 id="dialog-method-title">How we picked</h2>
          <dl className="meta learn-meta">
            <div><dt>The method</dt><dd>{learnMethod.how}</dd></div>
            <div><dt>What we did not do</dt><dd>{learnMethod.tested_on}</dd></div>
            <div><dt>Conflicts of interest</dt><dd>{learnMethod.conflicts}</dd></div>
            <div><dt>Last checked</dt><dd>{learnGenerated} · {learnNodes.length} concepts · {learnEdges.length} prerequisite links</dd></div>
          </dl>
          <p className="learn-stamp"><span>Verified</span><span>{learnGenerated}</span></p>
        </div>
      </dialog>
    </>
  );
}
