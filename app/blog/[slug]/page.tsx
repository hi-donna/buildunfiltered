import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/site.config";
import { type Block, clean, longDate, postBySlug, posts } from "@/lib/blog";

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = postBySlug((await params).slug);
  if (!p) return {};
  const video = p.blocks.find((b) => b.type === "video");
  return {
    title: p.title,
    description: p.dek,
    alternates: { canonical: `/blog/${p.slug}/` },
    openGraph: {
      type: "article",
      title: p.title,
      description: p.dek,
      url: `/blog/${p.slug}/`,
      ...(video?.poster ? { images: [{ url: video.poster }] } : {}),
    },
  };
}

const H = ({ html, as: Tag = "span" }: { html: string; as?: "span" | "p" | "li" | "td" | "figcaption" }) => (
  <Tag dangerouslySetInnerHTML={{ __html: clean(html) }} />
);

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case "prose":
      return <H as="p" html={b.html} />;
    case "heading":
      return <h2 className="post-h">{b.text}</h2>;
    case "video":
      return (
        <figure className="post-video">
          <video src={b.src} poster={b.poster} controls playsInline preload="metadata" />
          {b.caption && <H as="figcaption" html={b.caption} />}
        </figure>
      );
    case "pair":
      return (
        <div className="post-pair">
          {b.items.map((it) => (
            <figure key={it.src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt={it.alt} loading="lazy" />
              {it.caption && <H as="figcaption" html={it.caption} />}
            </figure>
          ))}
        </div>
      );
    case "table":
      return (
        <section className="post-table">
          {b.title && <h3>{b.title}</h3>}
          <table>
            <thead><tr>{b.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <H key={j} as="td" html={c} />)}</tr>
              ))}
            </tbody>
          </table>
        </section>
      );
    case "steps":
      return <ol className="post-steps">{b.items.map((s, i) => <H key={i} as="li" html={s} />)}</ol>;
    case "note":
      return (
        <aside className="post-note">
          {b.title && <p className="post-note-t">{b.title}</p>}
          <H as="p" html={b.html} />
        </aside>
      );
  }
}

export default async function PostPage({ params }: Props) {
  const p = postBySlug((await params).slug);
  if (!p) notFound();
  return (
    <article className="wrap post">
      <p className="eyebrow">{p.kicker ?? "Blog"} · {longDate(p.published)}</p>
      <h1 className="finder-title">{p.title}</h1>
      <p className="post-dek">{p.dek}</p>
      {p.instagram && (
        <p className="post-ig">
          <a href={p.instagram} target="_blank" rel="noopener">Watch it on Instagram ↗</a>
        </p>
      )}
      <div className="post-body">
        {p.blocks.map((b, i) => <BlockView key={i} b={b} />)}
      </div>
      {p.sources && p.sources.length > 0 && (
        <section className="sub post-sources">
          <h2>Sources</h2>
          <ul>
            {p.sources.map((s) => (
              <li key={s.label}>
                {s.url ? <a href={s.url} target="_blank" rel="noopener">{s.label}</a> : s.label}
                {s.date && <span> · {s.date}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="post-back"><a href="/blog/">All posts</a> · <a href={site.url}>{site.name}</a></p>
    </article>
  );
}
