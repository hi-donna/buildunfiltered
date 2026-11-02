"use client";
import { usePathname } from "next/navigation";

// The two tabs. Watch owns /watch/ and every video page under it.
export default function HeadNav() {
  const path = usePathname() ?? "/";
  const watch = path.startsWith("/watch");
  return (
    <nav className="head-nav" aria-label="Sections">
      <a href="/" aria-current={!watch && path === "/" ? "page" : undefined}>Wire</a>
      <a href="/watch/" aria-current={watch ? "page" : undefined}>Watch</a>
    </nav>
  );
}
