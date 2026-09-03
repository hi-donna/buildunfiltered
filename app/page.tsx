import type { Metadata } from "next";
import Newsletter from "@/components/Newsletter";
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
        </div>
      </section>

      <div className="wrap">
        <section className="shelf" aria-labelledby="shelf-title">
          <div className="shelf-head">
            <h2 id="shelf-title">Tools</h2>
          </div>
          {site.tools.filter((t) => t.status === "live").map((t, i) => (
            <a className="tool-card" href={t.href} key={t.id}>
              <span className="tool-idx" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div className="tool-main">
                <h3>{t.name}</h3>
                <p>{t.blurb}</p>
              </div>
            </a>
          ))}
        </section>

        <Newsletter />
      </div>
    </>
  );
}
