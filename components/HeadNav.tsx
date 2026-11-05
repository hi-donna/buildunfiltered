"use client";
import { usePathname } from "next/navigation";

// The tabs. Watch owns /watch/ and every video page under it; Blog owns /blog/.
export default function HeadNav() {
  const path = usePathname() ?? "/";
  const watch = path.startsWith("/watch");
  const blog = path.startsWith("/blog");
  return (
    <nav className="head-nav" aria-label="Sections">
      <a href="/" aria-current={path === "/" ? "page" : undefined}>Wire</a>
      <a href="/watch/" aria-current={watch ? "page" : undefined}>Watch</a>
      <a href="/blog/" aria-current={blog ? "page" : undefined}>Blog</a>
    </nav>
  );
}
