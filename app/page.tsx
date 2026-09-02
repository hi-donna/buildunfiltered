import type { Metadata } from "next";
import Newsletter from "@/components/Newsletter";
import { allJobs, reviewedCount, domains } from "@/lib/data";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description:
    "Free tools for people who build things. Starting with a finder that tells you which AI tool to use for the job you actually have.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <section className="hero" aria-label="A place for builders">
        {/* The cave. Light comes in from the mouth; the line stands where the light lands. */}
        <img className="hero-img" src="/hero-cave.jpg" alt="" width={1920} height={1072} fetchPriority="high" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-copy">
          <h1>A place for builders.</h1>
          <p>Small, free, no login. Things I needed that didn&apos;t exist yet, or existed badly.</p>
          <ul className="hero-meta" aria-label="At a glance">
            <li>Free</li>
            <li>No login</li>
            <li>{allJobs.length} jobs researched</li>
          </ul>
        </div>
      </section>

      <div className="wrap">
        <section className="shelf" aria-labelledby="shelf-title">
          <div className="shelf-head">
            <h2 id="shelf-title">Tools</h2>
            <span>01 of 01 · more when they earn it</span>
          </div>
          <a className="tool-card" href="/ai-tools/">
            <span className="tool-idx" aria-hidden="true">01</span>
            <div className="tool-main">
              <h3>AI Tool Finder</h3>
              <p>
                Start from the job, not the tool. {allJobs.length} jobs across {domains.length}{" "}categories,
                each with five ranked picks — what they cost, what they&apos;re good at, and the catch nobody mentions.
              </p>
            </div>
            <div className="tool-meta">
              <span className="tool-stat"><b>{reviewedCount}</b> of {allJobs.length} researched</span>
              <span className="tool-go">Open</span>
            </div>
          </a>
          <p className="shelf-note">
            One tool so far. More when they&apos;re worth shipping, not before.
          </p>
        </section>

        <Newsletter />
      </div>
    </>
  );
}
