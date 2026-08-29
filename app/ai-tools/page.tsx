import type { Metadata } from "next";
import JobList from "@/components/JobList";
import Newsletter from "@/components/Newsletter";
import { domains, allJobs, reviewedCount, isReviewed } from "@/lib/data";
import jobsData from "@/data/jobs.json";

export const metadata: Metadata = {
  title: "AI Tool Finder",
  description:
    "Pick the job you're actually trying to do and get five ranked AI tools — cost, strengths, and the catch nobody mentions. Where we haven't done the work, it says so.",
  alternates: { canonical: "/ai-tools/" },
};

export default function AiTools() {
  const reviewed = allJobs.filter((j) => isReviewed(j.id)).map((j) => j.id);
  return (
    <div className="wrap">
      <header className="mast">
        <p className="eyebrow"><a href="/" className="crumb">build.unfiltered</a> · AI Tool Finder</p>
        <h1>What are you actually trying to do?</h1>
        <p className="lede">
          Every AI tool directory lists fifty thousand tools and answers nothing. This one
          starts from the job. Pick yours and get five ranked tools, what each costs, and the
          catch nobody mentions. Where we haven&apos;t done the work yet, it says so.
        </p>
        <ul className="stats">
          <li><b>{allJobs.length}</b><span>Jobs</span></li>
          <li><b>{domains.length}</b><span>Categories</span></li>
          <li><b>{reviewedCount}</b><span>Reviewed</span></li>
        </ul>
      </header>

      <JobList domains={domains} reviewed={reviewed} total={allJobs.length} />
      <Newsletter />
    </div>
  );
}
