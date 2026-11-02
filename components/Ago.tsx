"use client";
import { useEffect, useState } from "react";

// "3 days ago", worked out in the browser. The static HTML carries the date
// (UTC) so the page is right without JS and never shows an age frozen at build.

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function ago(ms: number) {
  const m = Math.floor(ms / 60e3);
  if (m < 60) return m <= 1 ? "just now" : `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  if (d < 30) { const w = Math.floor(d / 7); return `${w} week${w === 1 ? "" : "s"} ago`; }
  if (d < 365) { const mo = Math.floor(d / 30); return `${mo} month${mo === 1 ? "" : "s"} ago`; }
  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

export default function Ago({ iso }: { iso: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  const date = new Date(iso);
  return (
    <time dateTime={iso} title={DATE.format(date)}>
      {now === null ? DATE.format(date) : ago(Math.max(0, now - date.getTime()))}
    </time>
  );
}
