import type { Metadata } from "next";
import Newsletter from "@/components/Newsletter";
import { fieldNotes, kickerNo } from "@/lib/fieldNotes";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: site.fieldNotes.name,
  description: site.fieldNotes.blurb,
  alternates: { canonical: site.fieldNotes.href },
};

// The index: one card per post, newest first, in the tools-shelf idiom.
// No tags, no search, no feed. At one post all of that is decoration.
export default function FieldNotesIndex() {
  return (
    <div className="wrap finder fn-index">
      <h1 className="finder-title">{site.fieldNotes.name}</h1>
      <p className="finder-lede">
        Written pieces on things actually built and run. Each one carries the plates from the machine it was done on,
        and a strip at the bottom saying what versions, and when.
      </p>

      <section className="shelf fn-shelf" aria-label="All field notes">
        <div className="shelf-head">
          <h2>All notes</h2>
          <span>{fieldNotes.length} {fieldNotes.length === 1 ? "post" : "posts"}</span>
        </div>
        {fieldNotes.map((p) => (
          <a className="tool-card" href={`/field-notes/${p.slug}/`} key={p.slug}>
            <span className="tool-idx" aria-hidden="true">{kickerNo(p)}</span>
            <div className="tool-main">
              <h3>{p.title}</h3>
              <p>{p.summary}</p>
              <p className="fn-card-meta">
                <span>Published <b>{p.published}</b></span>
                <span>Verified <b>{p.verified}</b></span>
              </p>
            </div>
          </a>
        ))}
      </section>

      <Newsletter />
    </div>
  );
}
