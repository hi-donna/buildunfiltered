import fs from "node:fs";
import path from "node:path";

// The blog: one JSON file per post in data/blog/. Most posts carry a reel from
// the Instagram page, played from our own copy (public/blog/<slug>/), so the
// page works without Instagram's embed script. Adding a post is one JSON file
// plus its media folder; no code.

export type Block =
  | { type: "prose"; html: string }
  | { type: "heading"; text: string }
  | { type: "video"; src: string; poster?: string; caption?: string }
  | { type: "pair"; items: { src: string; alt: string; caption?: string }[] }
  | { type: "table"; title?: string; head: string[]; rows: string[][] }
  | { type: "steps"; items: string[] }
  | { type: "note"; title?: string; html: string };

export interface Post {
  slug: string;
  kicker?: string;
  title: string;
  dek: string;
  published: string;          // YYYY-MM-DD
  instagram?: string | null;  // the reel on Instagram, when there is one
  blocks: Block[];
  sources?: { label: string; date?: string; url?: string }[];
}

const DIR = path.join(process.cwd(), "data", "blog");

export const posts: Post[] = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Post)
  .sort((a, b) => b.published.localeCompare(a.published));

export const postBySlug = (slug: string) => posts.find((p) => p.slug === slug);

// Post HTML is ours, but keep it to inline tags anyway: anything else is escaped.
const ALLOWED = new Set(["b", "strong", "em", "i", "code", "small", "a", "br"]);
export function clean(html: string): string {
  return html.replace(/<\/?([a-z]+)([^>]*)>/gi, (tag, name: string, attrs: string) => {
    const n = name.toLowerCase();
    if (!ALLOWED.has(n)) return tag.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (tag.startsWith("</")) return `</${n}>`;
    if (n === "a") {
      const href = attrs.match(/href="(https?:\/\/[^"]+|\/[^"]*)"/)?.[1];
      return href ? `<a href="${href}"${href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>` : "<a>";
    }
    return `<${n}>`;
  });
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const longDate = (d: string) => DATE.format(new Date(`${d}T00:00:00Z`));
