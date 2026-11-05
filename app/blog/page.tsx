import type { Metadata } from "next";
import { site } from "@/site.config";
import { longDate, posts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "The long version of each build.unfiltered reel: what it showed, what was tested, and the list behind it.",
  alternates: { canonical: "/blog/" },
  openGraph: { title: `Blog · ${site.name}`, url: "/blog/" },
};

export default function BlogPage() {
  return (
    <div className="wrap finder post-list">
      <p className="eyebrow">Blog</p>
      <h1 className="finder-title">The long version</h1>
      <p className="finder-lede">Each reel on the page, written out: what it showed, what I tested, and the full list behind it.</p>
      <ul>
        {posts.map((p) => {
          const video = p.blocks.find((b) => b.type === "video");
          return (
            <li key={p.slug}>
              <a href={`/blog/${p.slug}/`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {video?.poster && <img src={video.poster} alt="" loading="lazy" />}
                <span>
                  <span className="post-list-date">{longDate(p.published)}</span>
                  <span className="post-list-title">{p.title}</span>
                  <span className="post-list-dek">{p.dek}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
