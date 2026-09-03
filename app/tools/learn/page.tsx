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

// Field notes, plate 01. The map takes two thirds; selecting a node opens its
// <dialog> inside the bone-paper drawer on the right (a full-screen sheet on
// phones). Every concept's text is in the HTML; nothing sits below the map.
export default function LearnPage() {
  return (
    <div className="wrap learn">
      <header className="learn-head">
        <div className="learn-head-copy">
          <p className="learn-eyebrow">Field notes / 01</p>
          <h1 className="finder-title">Learning Map</h1>
          <p className="finder-lede">
            {learnNodes.length} things to understand before you build on an LLM, in the order they depend on each other.
            Open a node for what it is and what to finish.
            <a className="learn-method-link" href="#method">How we picked</a>
          </p>
        </div>
        {/* Annotation: handwriting is allowed here and nowhere in body text. */}
        <div className="learn-note" aria-hidden="true">
          <svg className="learn-note-arrow" viewBox="0 0 120 60" width="120" height="60">
            <path d="M112 8 C 90 12, 60 22, 14 44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 46 L 12 45 L 22 33" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="learn-note-text">Start with the foundations.<br />Build your way out.</span>
        </div>
      </header>

      <div className="learn-stage">
        <LearnMap />
        <aside className="learn-drawer" aria-label="Learning drawer">
          <div className="learn-drawer-empty paper">
            <span className="learn-pin" aria-hidden="true" />
            <p className="learn-paper-eyebrow">Field notes</p>
            <h2>Pick a node</h2>
            <p>
              Hover a node to light everything it depends on, back to tokens. Click it and its notes open here:
              what it is, what it needs first, and three to five things worth finishing, one marked start here.
            </p>
            <p className="learn-paper-meta">{learnNodes.length} nodes · prerequisite order · every link opened</p>
          </div>
          <LearnDialogs />
        </aside>
      </div>

      <Newsletter />
    </div>
  );
}
