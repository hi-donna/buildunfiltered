// Tokenised search shared by every list on the site. One place, so "postgres
// database" behaves the same in the finder and in MCP Connect.

// Words people type that carry no signal. "make reels" should find the
// reels job; "make" matches nothing and must not block it.
const STOP = new Set([
  "a","an","the","my","me","i","to","for","of","in","on","with","from","into",
  "make","create","build","get","do","want","need","help","how","can","some",
  "using","use","ai","tool","tools","best","good","free","let","and","or",
]);

export function tokens(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

// Loose stem so "reels" finds "reel", "backgrounds" finds "background".
export const stem = (t: string) => t.replace(/(ing|ers|er|es|s)$/, "");

export const index = (s: string) => tokens(s).map(stem).join(" ");

export type Mode = "all" | "strict" | "loose";

// Strict: every meaningful word matches. Loose: any word matches, and `score`
// (matched words) lets a list put the closest rows first. Returns the
// predicate and which mode it settled on, given a haystack per id.
// `title` is an optional second haystack (the row's name) — a word that hits
// the name counts twice, so "send slack message" puts Slack above Gmail.
export function matcher(q: string, hay: Map<string, string>, ids: string[], title?: Map<string, string>) {
  const terms = tokens(q).map(stem);
  const hits = (id: string) => terms.filter((t) => (hay.get(id) ?? "").includes(t)).length;
  const score = (id: string) =>
    hits(id) + (title ? terms.filter((t) => (title.get(id) ?? "").includes(t)).length : 0);
  if (!terms.length) return { mode: "all" as Mode, keep: (_id: string) => true, searching: false, score };
  const strict = (id: string) => hits(id) === terms.length;
  if (ids.some(strict)) return { mode: "strict" as Mode, keep: strict, searching: true, score };
  return { mode: "loose" as Mode, keep: (id: string) => hits(id) > 0, searching: true, score };
}

// Loose results: most matched words first, stable otherwise.
export const byScore = <T,>(rows: T[], id: (r: T) => string, score: (id: string) => number, mode: Mode) =>
  mode === "loose" ? [...rows].sort((a, b) => score(id(b)) - score(id(a))) : rows;
