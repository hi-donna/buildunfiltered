import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fieldNotes, getPost, sanitiseInline, INLINE_TAGS, PAPER_TAGS,
  type Block, type TerminalBlock, type PaperBlock, type TableBlock,
  type PlateBlock, type FigureBlock, type SpecBlock, type StepsBlock,
} from "@/lib/fieldNotes";

type Params = { slug: string };

// One static HTML file per post. Every block type maps to markup here and
// nowhere else; a post that needs a block this file does not know is a
// conversation, not a commit (see docs/FIELD_NOTES_SPEC.md).
export function generateStaticParams(): Params[] {
  return fieldNotes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: `/field-notes/${p.slug}/` },
    openGraph: { type: "article", publishedTime: p.published, modifiedTime: p.verified },
  };
}

// Inline html only. The build already refused anything outside the allow-list;
// sanitising again here is the habit, not a second opinion.
const inline = (html: string) => ({ __html: sanitiseInline(html, INLINE_TAGS) });

function Corners() {
  return (
    <>
      <span className="learn-corner learn-corner-tl" aria-hidden="true" />
      <span className="learn-corner learn-corner-tr" aria-hidden="true" />
      <span className="learn-corner learn-corner-bl" aria-hidden="true" />
      <span className="learn-corner learn-corner-br" aria-hidden="true" />
    </>
  );
}

function Terminal({ b }: { b: TerminalBlock }) {
  // A cmd line after a cmd line ending in "\" is a continuation: no prompt.
  let prevCmdContinues = false;
  return (
    <figure className="fn-term">
      <figcaption className="fn-term-label">{b.label}</figcaption>
      <pre><code>
        {b.lines.map((l, i) => {
          const cont = l.kind === "cmd" && prevCmdContinues;
          prevCmdContinues = l.kind === "cmd" && l.text.trimEnd().endsWith("\\");
          return (
            <span key={i}>
              <span className={`t-${l.kind}${cont ? " t-cont" : ""}`}>{l.text}</span>
              {i < b.lines.length - 1 ? "\n" : ""}
            </span>
          );
        })}
      </code></pre>
    </figure>
  );
}

function Paper({ b }: { b: PaperBlock }) {
  // Paper html may carry <p>; if the author wrote none, it is one paragraph.
  const html = sanitiseInline(b.html, PAPER_TAGS);
  const body = /<p[\s>]/i.test(html) ? html : `<p>${html}</p>`;
  return (
    <aside className="paper fn-paper">
      <span className="learn-pin" aria-hidden="true" />
      <p className="learn-paper-eyebrow">{b.label}</p>
      <h3>{b.title}</h3>
      <div className="fn-paper-body" dangerouslySetInnerHTML={{ __html: body }} />
    </aside>
  );
}

// A row whose cells after the first are all empty is a group label inside the
// table (post 03 uses them to split free / capped / paid). Same data, one
// cell spanning the row, so the empty cells do not read as missing values.
const isGroupRow = (r: string[]) => r.length > 1 && r.slice(1).every((c) => c.trim() === "");

function Table({ b }: { b: TableBlock }) {
  return (
    <div className="fn-table" role="region" aria-label={b.head.join(" / ")} tabIndex={0}>
      <table>
        <thead><tr>{b.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>
          {b.rows.map((r, i) => isGroupRow(r) ? (
            <tr key={i} className="fn-table-group">
              <th scope="rowgroup" colSpan={b.head.length} dangerouslySetInnerHTML={inline(r[0])} />
            </tr>
          ) : (
            <tr key={i}>{r.map((c, j) => <td key={j} dangerouslySetInnerHTML={inline(c)} />)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Steps({ b }: { b: StepsBlock }) {
  return (
    <ol className="fn-steps">
      {b.steps.map((st) => (
        <li key={st.n}>
          <span className="fn-step-n" aria-hidden="true">{st.n}</span>
          <span className="fn-step-text" dangerouslySetInnerHTML={inline(st.text)} />
        </li>
      ))}
    </ol>
  );
}

function Plate({ b }: { b: PlateBlock }) {
  return (
    <figure className="fn-plate">
      <div className="fn-plate-frame">
        <Corners />
        <img src={b.src} alt={b.alt} width={b.width} height={b.height} loading="lazy" decoding="async" />
      </div>
      <figcaption>
        <span className="fn-plate-no">{b.no}</span>
        <span dangerouslySetInnerHTML={inline(b.caption)} />
      </figcaption>
    </figure>
  );
}

function Figure({ b }: { b: FigureBlock }) {
  // The svg was checked at build: no script, no event attributes, no external
  // or data: hrefs, no foreignObject. It is authored, not user input.
  return (
    <figure className="fn-figure">
      <div className="fn-figure-plate">
        <Corners />
        <div className="fn-figure-svg" dangerouslySetInnerHTML={{ __html: b.svg }} />
      </div>
      <figcaption dangerouslySetInnerHTML={inline(b.caption)} />
    </figure>
  );
}

function Spec({ b }: { b: SpecBlock }) {
  return (
    <section className="fn-spec" aria-label="Performed on">
      <div>
        <p className="eyebrow">Performed on</p>
        <dl>
          {b.rows.map((r) => <div key={r.k}><dt>{r.k}</dt><dd>{r.v}</dd></div>)}
        </dl>
      </div>
      <p className="learn-stamp" aria-label={`${b.stamp.label} ${b.stamp.date}`}>
        <span>{b.stamp.label}</span><span>{b.stamp.date}</span>
      </p>
    </section>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case "prose": return <p className="fn-prose" dangerouslySetInnerHTML={inline(b.html)} />;
    case "heading": return b.level === 2 ? <h2>{b.text}</h2> : <h3>{b.text}</h3>;
    case "terminal": return <Terminal b={b} />;
    case "paper": return <Paper b={b} />;
    case "table": return <Table b={b} />;
    case "plate": return <Plate b={b} />;
    case "figure": return <Figure b={b} />;
    case "spec": return <Spec b={b} />;
    case "steps": return <Steps b={b} />;
  }
}

export default async function FieldNotePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();

  return (
    <div className="wrap fn">
      <a className="back" href="/field-notes/">← Field notes</a>
      <article>
        <header className="fn-head">
          <div>
            <p className="learn-eyebrow">{p.kicker}</p>
            <h1 className="finder-title">{p.title}</h1>
            <p className="finder-lede fn-dek" dangerouslySetInnerHTML={inline(p.dek)} />
            <p className="fn-meta">
              <span>Published <b>{p.published}</b></span>
              <span>Verified <b>{p.verified}</b></span>
            </p>
          </div>
          {/* Annotation: handwriting is allowed here and nowhere in body text. */}
          {p.hand.length > 0 && (
            <p className="fn-note" aria-hidden="true">
              {p.hand.map((line, i) => <span className="fn-note-line" key={i}>{line}</span>)}
            </p>
          )}
        </header>

        <div className="fn-body">
          {p.blocks.map((b, i) => <BlockView b={b} key={i} />)}
        </div>

        {p.sources && p.sources.length > 0 && (
          <section className="fn-sources" aria-label="Sources">
            <p className="eyebrow">Sources</p>
            <div className="srcs">
              {p.sources.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.label}</a>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
