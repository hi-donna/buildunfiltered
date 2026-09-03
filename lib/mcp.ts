import mcpData from "@/data/mcp.json";

// MCP Connect: 57 things a builder might connect, one pick each. The data is
// researched by hand (see docs/RESEARCH_SPEC.md); this file only types and
// indexes it. Never derive a fact here that isn't in the JSON.

export interface Access { read: boolean; write: boolean; delete: boolean; scope_note: string }
export interface Server {
  name: string; maintainer: string; official: boolean; url: string;
  transport: "remote" | "local" | "both"; auth: string; access: Access;
  clients: string[]; last_release: string; maintained: string; cost: string; the_catch: string;
}
export interface Target {
  id: string; target: string; category: string; question: string;
  official_exists: boolean; pick: Server; alternate: Server | null; avoid: string | null;
  last_verified: string; sources: { label: string; url: string }[];
}
export interface Preamble { title: string; points: string[]; sources: { label: string; url: string }[] }
export interface McpMethod { how: string; tested_on: string; conflicts: string }

export const mcpTargets = mcpData.targets as Target[];
export const mcpPreamble = mcpData.preamble as Preamble;
export const mcpMethod = mcpData.method as McpMethod;
export const mcpGenerated = mcpData.generated as string;

// Categories in the order they first appear in the data.
export const mcpCategories: { label: string; targets: Target[] }[] = (() => {
  const out: { label: string; targets: Target[] }[] = [];
  for (const t of mcpTargets) {
    let c = out.find((x) => x.label === t.category);
    if (!c) { c = { label: t.category, targets: [] }; out.push(c); }
    c.targets.push(t);
  }
  return out;
})();

export const getTarget = (id: string) => mcpTargets.find((t) => t.id === id) ?? null;

// ---- facets for the index filters. Each is read from the data, not guessed.
const isReadOnly = (a: Access) => a.read && !a.write && !a.delete;
const mentionsReadOnly = (a: Access) => /read[- ]?only/i.test(a.scope_note);

// A read-only surface exists: the pick or alternate is R-only, or its scope
// note documents a read-only mode/flag.
export const readOnlyAvailable = (t: Target) =>
  [t.pick, t.alternate].some((s) => s && (isReadOnly(s.access) || mentionsReadOnly(s.access)));

// You can connect without pasting a key: no auth, or OAuth is on offer.
export const noKeyNeeded = (t: Target) =>
  [t.pick, t.alternate].some((s) => s && (/\bnone\b/i.test(s.auth) || /^OAuth/i.test(s.auth)));

export const isRemote = (t: Target) => t.pick.transport === "remote" || t.pick.transport === "both";

export const transportLabel = (x: Server["transport"]) =>
  x === "both" ? "remote + local" : x;
