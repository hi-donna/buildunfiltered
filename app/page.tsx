import type { Metadata } from "next";
import Newsletter from "@/components/Newsletter";
import { allJobs, reviewedCount } from "@/lib/data";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description:
    "Free tools for people who build things. Starting with a finder that tells you which AI tool to use for the job you actually have.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="wrap">
      <header className="mast">
        <h1>Tools for people who build things.</h1>
        <p className="lede">
          Small, free, no login. Made because the thing I needed didn&apos;t exist yet, or
          existed badly. Everything here says what it knows and what it doesn&apos;t.
        </p>
      </header>

      <section className="shelf">
        <h2 className="shelf-head">Tools</h2>
        <a className="tool-card" href="/ai-tools/">
          <div className="tool-main">
            <h3>AI Tool Finder</h3>
            <p>
              Start from the job, not the tool. {allJobs.length}{" "}jobs, each with five ranked picks — what they cost, what they&apos;re good at, and the catch nobody mentions.
            </p>
          </div>
          <div className="tool-meta">
            <span className="tool-stat"><b>{reviewedCount}</b> of {allJobs.length} researched</span>
            <span className="tool-go">Open →</span>
          </div>
        </a>
        <p className="shelf-note">
          One tool so far. More when they&apos;re worth shipping, not before.
        </p>
      </section>

      <Newsletter />
    </div>
  );
}
