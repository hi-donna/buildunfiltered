import type { Metadata } from "next";
import LearnMap from "@/components/LearnMap";
import LearnDialogs from "@/components/LearnDialogs";
import Newsletter from "@/components/Newsletter";
import { learnNodes } from "@/lib/learn";

export const metadata: Metadata = {
  title: "Learning Map",
  description:
    "31 things to understand before you build on an LLM, as a prerequisite map from tokens to agents. Three to five verified resources each, one marked start here.",
  alternates: { canonical: "/tools/learn/" },
};

// The map is the page. Every concept's explanation and resources are in the
// HTML as a <dialog> (see LearnDialogs); nothing sits below the map.
export default function LearnPage() {
  return (
    <div className="wrap finder learn">
      <h1 className="finder-title">Learning Map</h1>
      <p className="finder-lede">
        {learnNodes.length} things to understand before you build on an LLM, in the order they depend on each other.
        Open a node for what it is and what to finish.
        <a className="learn-method-link" href="#method">How we picked</a>
      </p>

      <LearnMap />
      <LearnDialogs />

      <Newsletter />
    </div>
  );
}
