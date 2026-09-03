import learnData from "@/data/learn.json";

// Learning Map: 31 concepts as a prerequisite graph. The JSON is content only;
// this file types it, checks it at build time, and derives the layout. Nothing
// here invents a fact that isn't in the JSON. If the data is wrong, `npm run
// build` fails here rather than shipping a half-drawn map.

export type Level = "foundations" | "core" | "applied" | "frontier";
export type ResourceType = "video" | "paper" | "course" | "post" | "docs";

export interface Resource {
  title: string; url: string; type: ResourceType; author: string; length: string;
  why_this_one: string; last_verified: string;
}
export interface LearnNode {
  id: string; title: string; level: Level; angle?: number; explain: string;
  resources: Resource[]; the_catch?: string; retired?: boolean;
}
export interface Edge { from: string; to: string }
export interface LearnMethod { how: string; tested_on: string; conflicts: string }
export interface LearnData {
  version: number; generated: string; start: string;
  nodes: LearnNode[]; edges: Edge[]; method: LearnMethod;
}

export const LEVELS: Level[] = ["foundations", "core", "applied", "frontier"];
export const LEVEL_LABEL: Record<Level, string> = {
  foundations: "Foundations", core: "Core", applied: "Applied", frontier: "Frontier",
};

// ---- geometry. Canvas 1000×1000, centre (500,500). Ring radii per level.
export const SIZE = 1000;
export const CENTRE = SIZE / 2;
export const RING_RADII: Record<Level, number> = { foundations: 110, core: 220, applied: 330, frontier: 440 };

const data = learnData as LearnData;

// ---- invariants. Every one of these throws so the build fails loudly.
function check(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(`data/learn.json: ${msg}`);
}

function validate(d: LearnData) {
  const ids = new Set<string>();
  for (const n of d.nodes) {
    check(/^[a-z0-9-]+$/.test(n.id), `id "${n.id}" is not lowercase kebab`);
    check(!ids.has(n.id), `duplicate id "${n.id}"`);
    ids.add(n.id);
    check(LEVELS.includes(n.level), `node "${n.id}" has unknown level "${n.level}"`);
    check(n.resources.length >= 2 && n.resources.length <= 3,
      `node "${n.id}" has ${n.resources.length} resources; must be 2 or 3`);
    for (const r of n.resources) {
      check(typeof r.url === "string" && r.url.length > 0, `node "${n.id}": resource with empty url`);
      check(typeof r.why_this_one === "string" && r.why_this_one.length > 0,
        `node "${n.id}": resource "${r.title}" has empty why_this_one`);
      check(/^\d{4}-\d{2}-\d{2}$/.test(r.last_verified),
        `node "${n.id}": resource "${r.title}" last_verified "${r.last_verified}" is not YYYY-MM-DD`);
    }
  }

  const live = new Map(d.nodes.filter((n) => !n.retired).map((n) => [n.id, n]));
  const start = live.get(d.start);
  check(!!start, `start "${d.start}" is not a live node id`);
  check(start.level === "foundations", `start "${d.start}" must be level foundations`);

  const incoming = new Map<string, number>();
  for (const e of d.edges) {
    check(live.has(e.from), `edge ${e.from} → ${e.to}: "${e.from}" is not a live node`);
    check(live.has(e.to), `edge ${e.from} → ${e.to}: "${e.to}" is not a live node`);
    check(e.from !== e.to, `edge ${e.from} → ${e.to} is a self-loop`);
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  }
  for (const id of live.keys()) {
    if (id === d.start) continue;
    check((incoming.get(id) ?? 0) > 0, `node "${id}" has no prerequisites (orphan)`);
  }

  // Acyclic: DFS with white/grey/black marks.
  const out = new Map<string, string[]>();
  for (const e of d.edges) out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  const mark = new Map<string, 1 | 2>(); // 1 = grey, 2 = black
  const visit = (id: string, path: string[]) => {
    const m = mark.get(id);
    if (m === 2) return;
    check(m !== 1, `cycle: ${[...path, id].join(" → ")}`);
    mark.set(id, 1);
    for (const next of out.get(id) ?? []) visit(next, [...path, id]);
    mark.set(id, 2);
  };
  for (const id of live.keys()) visit(id, []);
}

validate(data);

// ---- exports
export const learnNodes: LearnNode[] = data.nodes.filter((n) => !n.retired);
export const learnEdges: Edge[] = data.edges;
export const learnStart: string = data.start;
export const learnMethod: LearnMethod = data.method;
export const learnGenerated: string = data.generated;

export const getNode = (id: string) => learnNodes.find((n) => n.id === id) ?? null;

export const nodesByLevel: { level: Level; label: string; nodes: LearnNode[] }[] =
  LEVELS.map((level) => ({ level, label: LEVEL_LABEL[level], nodes: learnNodes.filter((n) => n.level === level) }));

// Direct prerequisites, in edge order.
export const prereqs: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>();
  for (const n of learnNodes) m.set(n.id, []);
  for (const e of learnEdges) m.get(e.to)!.push(e.from);
  return m;
})();

// Transitive prerequisites back to the roots, precomputed once so hover does no
// graph walking.
export const ancestors: Map<string, Set<string>> = (() => {
  const memo = new Map<string, Set<string>>();
  const walk = (id: string): Set<string> => {
    const hit = memo.get(id);
    if (hit) return hit;
    const s = new Set<string>();
    for (const p of prereqs.get(id) ?? []) { s.add(p); for (const a of walk(p)) s.add(a); }
    memo.set(id, s);
    return s;
  };
  for (const n of learnNodes) walk(n.id);
  return memo;
})();

// pos(node) = centre + r[level] · (cos θ, sin θ). θ from `angle` (degrees,
// 0 = east, clockwise on screen) or evenly spaced by index within the level.
export const positions: Map<string, { x: number; y: number }> = (() => {
  const m = new Map<string, { x: number; y: number }>();
  for (const { level, nodes } of nodesByLevel) {
    nodes.forEach((n, i) => {
      const deg = n.angle ?? (i * 360) / nodes.length - 90;
      const t = (deg * Math.PI) / 180;
      const r = RING_RADII[level];
      m.set(n.id, { x: Math.round(CENTRE + r * Math.cos(t)), y: Math.round(CENTRE + r * Math.sin(t)) });
    });
  }
  return m;
})();
