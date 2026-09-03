import type { Metadata } from "next";
import JobList from "@/components/JobList";
import Newsletter from "@/components/Newsletter";
import { domains, allJobs, isReviewed } from "@/lib/data";

export const metadata: Metadata = {
  title: "AI Tool Finder",
  description:
    "Pick the job you're actually trying to do and get five ranked AI tools — cost, strengths, and the catch nobody mentions. Where we haven't done the work, it says so.",
  alternates: { canonical: "/ai-tools/" },
};

// A name, then the search box. No pitch.
export default function AiTools() {
  const reviewed = allJobs.filter((j) => isReviewed(j.id)).map((j) => j.id);
  return (
    <div className="wrap finder">
      <h1 className="finder-title">AI Tool Finder</h1>
      <JobList domains={domains} reviewed={reviewed} total={allJobs.length} />
      <Newsletter />
    </div>
  );
}
