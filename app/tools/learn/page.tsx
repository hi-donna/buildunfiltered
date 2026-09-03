import type { Metadata } from "next";
import LearnMap from "@/components/LearnMap";
import LearnList from "@/components/LearnList";
import Newsletter from "@/components/Newsletter";
import { learnNodes, learnEdges, learnMethod, learnGenerated } from "@/lib/learn";

export const metadata: Metadata = {
  title: "Learning Map",
  description:
    "31 things to understand before you build on an LLM, as a prerequisite map from tokens to agents. Three to five verified resources each, one marked start here.",
  alternates: { canonical: "/tools/learn/" },
};

export default function LearnPage() {
  return (
    <div className="wrap finder learn">
      <h1 className="finder-title">Learning Map</h1>
      <p className="finder-lede">
        {learnNodes.length} things to understand before you build on an LLM, in the order they depend on each other.
        Three to five things worth finishing for each, and which one to open first.
      </p>

      <LearnMap />

      <LearnList />

      <section className="sub method" id="method">
        <h2>How we picked</h2>
        <dl className="meta">
          <div><dt>The method</dt><dd>{learnMethod.how}</dd></div>
          <div><dt>What we did not do</dt><dd>{learnMethod.tested_on}</dd></div>
          <div><dt>Conflicts of interest</dt><dd>{learnMethod.conflicts}</dd></div>
          <div><dt>Last checked</dt><dd>{learnGenerated} · {learnNodes.length} concepts · {learnEdges.length} prerequisite links</dd></div>
        </dl>
      </section>

      <Newsletter />
    </div>
  );
}
