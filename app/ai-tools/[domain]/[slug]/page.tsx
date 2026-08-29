import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allJobs, getJob, getEntry, splitId } from "@/lib/data";
import Newsletter from "@/components/Newsletter";

type Params = { domain: string; slug: string };

// One static HTML file per job. This is the whole SEO strategy: 50 real pages
// on real URLs, not one page behind a search box.
export function generateStaticParams(): Params[] {
  return allJobs.map((j) => splitId(j.id));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { domain, slug } = await params;
  const job = getJob(domain, slug);
  if (!job) return {};
  const entry = getEntry(job.id);
  return {
    title: job.label,
    description: entry
      ? `${entry.ranked.length} ranked picks for “${job.label.toLowerCase()}” — cost, strengths and the catch for each. Last checked ${entry.last_verified}.`
      : `We haven't reviewed the tools for “${job.label.toLowerCase()}” yet — and we'd rather say so than guess.`,
    alternates: { canonical: `/ai-tools/${domain}/${slug}/` },
  };
}

export default async function JobPage({ params }: { params: Promise<Params> }) {
  const { domain, slug } = await params;
  const job = getJob(domain, slug);
  if (!job) notFound();
  const entry = getEntry(job.id);

  return (
    <div className="wrap">
      <a className="back" href="/ai-tools/">← All jobs</a>
      <article className="detail">
        <p className="eyebrow" style={{ marginTop: 20 }}>{job.domainLabel}</p>
        <h1>{job.label}</h1>

        {!entry ? (
          <div className="empty">
            <h2>Not reviewed yet</h2>
            <p>We haven&apos;t tested the tools for this job, so there is nothing here.</p>
            <p>
              The alternative would be to list five plausible names and let you assume we
              checked. That is what every other directory does, and it is why none of them
              are worth reading.
            </p>
            <p>This job is on the list. When it&apos;s done, this page fills in — with a date on it.</p>
          </div>
        ) : (
          <>
            <p className="question">{entry.question}</p>
            <p className="stampline">
              Last checked <span className="stamp mono">{entry.last_verified}</span>
              <a href="#method">How we ranked this ↓</a>
            </p>

            {entry.ranked.map((p) => (
              <section className="pick" key={p.rank}>
                <div className="rank">{p.rank}</div>
                <div className="pick-head">
                  <h2>{p.name}</h2>
                  <span className="maker">{p.maker}</span>
                  {p.blind && <span className="badge">{p.blind}</span>}
                </div>
                <p className="oneliner">{p.one_liner}</p>
                <dl className="facts">
                  <div><dt>Use it when</dt><dd>{p.use_it_when}</dd></div>
                  <div><dt>Cost</dt><dd>{p.cost}{p.pricing_detail && <span className="detail">{p.pricing_detail}</span>}</dd></div>
                  <div><dt>Good at</dt><dd>{p.good_at}</dd></div>
                  <div className="catch"><dt>The catch</dt><dd>{p.the_catch}</dd></div>
                  <div><dt>Wrong for</dt><dd>{p.wrong_for}</dd></div>
                </dl>
                <a className="visit" href={p.url} target="_blank" rel="noopener nofollow">
                  Open {p.name} →
                </a>
              </section>
            ))}

            {entry.also_considered?.length ? (
              <section className="sub">
                <h2>Also considered</h2>
                <p className="hint">
                  What we left out, and why. A list is only trustworthy if you can see what it rejected.
                </p>
                <ul>
                  {entry.also_considered.map((a) => (
                    <li key={a.name}><b>{a.name}</b> — <span>{a.why_not}</span></li>
                  ))}
                </ul>
              </section>
            ) : null}

            {entry.watch_list?.length ? (
              <section className="sub">
                <h2>What would change this list</h2>
                <ul>{entry.watch_list.map((w) => <li key={w}><span>{w}</span></li>)}</ul>
              </section>
            ) : null}

            <section className="sub method" id="method">
              <h2>How we ranked this</h2>
              <dl className="meta">
                <div><dt>The method</dt><dd>{entry.method.how}</dd></div>
                <div><dt>What we did not do</dt><dd>{entry.method.tested_on}</dd></div>
                <div><dt>Conflicts of interest</dt><dd>{entry.method.conflicts}</dd></div>
                <div><dt>What &ldquo;blind tests&rdquo; means</dt><dd>{entry.method.blind_note}</dd></div>
              </dl>
            </section>

            {entry.sources?.length ? (
              <section className="sub">
                <h2>Sources</h2>
                <div className="srcs">
                  {entry.sources.map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.label}</a>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </article>
      <Newsletter />
    </div>
  );
}
