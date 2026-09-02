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

// The page is the search box. No pitch above it: the header already says
// where you are, and the placeholder asks the only question that matters.
export default function AiTools() {
  const reviewed = allJobs.filter((j) => isReviewed(j.id)).map((j) => j.id);
  return (
    <div className="wrap finder">
      <h1 className="sr-only">AI Tool Finder</h1>
      <JobList domains={domains} reviewed={reviewed} total={allJobs.length} />
      <Newsletter />
    </div>
  );
}
