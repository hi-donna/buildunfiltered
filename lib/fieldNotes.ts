import fs from "node:fs";
import path from "node:path";

// Field Notes: written pieces. One JSON per post in data/field-notes/, one
// renderer. A post is metadata plus an ordered `blocks` array; each block has
// a `type` from the fixed set below. Adding a post adds no code. This file
// types the JSON, checks it at build time, and reads image sizes off disk.
// If a post is wrong, `npm run build` fails here rather than shipping a blank
// page. The rulebook is docs/FIELD_NOTES_SPEC.md.

// ---- block types. This is the complete set. A post that needs a ninth is a
// conversation, not a commit.
export interface ProseBlock { type: "prose"; html: string }
export interface HeadingBlock { type: "heading"; text: string; level: 2 | 3 }
export interface TerminalLine { kind: "cmd" | "comment" | "out"; text: string }
export interface TerminalBlock { type: "terminal"; label: string; lines: TerminalLine[] }
export interface PaperBlock { type: "paper"; title: string; label: string; html: string }
export interface TableBlock { type: "table"; head: string[]; rows: string[][] }
export interface PlateBlock {
  type: "plate"; src: string; alt: string; no: string; caption: string;
  width: number; height: number; // read from the file at build, not authored
}
export interface FigureBlock { type: "figure"; svg: string; caption: string }
export interface SpecBlock {
  type: "spec"; rows: { k: string; v: string }[]; stamp: { label: string; date: string };
}
export type Block =
  | ProseBlock | HeadingBlock | TerminalBlock | PaperBlock
  | TableBlock | PlateBlock | FigureBlock | SpecBlock;

export const BLOCK_TYPES: Block["type"][] =
  ["prose", "heading", "terminal", "paper", "table", "plate", "figure", "spec"];

export interface Source { label: string; url: string }
export interface Post {
  slug: string; kicker: string; title: string; dek: string; summary: string;
  published: string; verified: string; hand: string[]; blocks: Block[];
  sources?: Source[];
}

// ---- html allow-list. Post `html` fields carry inline tags only. The
// renderer sanitises against this list too (see sanitiseInline); the build
// check is so the author finds out before the reader does.
export const INLINE_TAGS = ["strong", "em", "code", "a", "b", "i"] as const;
// Paper blocks are several short paragraphs, so `p` is the one block-level
// tag allowed there and nowhere else.
export const PAPER_TAGS = [...INLINE_TAGS, "p"] as const;

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
const SAFE_HREF = /^(https?:\/\/|\/|#)/i;

function tagsIn(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(TAG_RE)) out.push(m[1].toLowerCase());
  return out;
}

/** Strip everything that is not an allowed tag. Allowed tags keep no
 *  attributes except a safe `href` on `a` (http(s), site-relative, or hash). */
export function sanitiseInline(html: string, allow: readonly string[] = INLINE_TAGS): string {
  const ok = new Set(allow);
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(TAG_RE, (m, name: string, attrs: string) => {
      const tag = name.toLowerCase();
      if (!ok.has(tag)) return "";
      if (m.startsWith("</")) return `</${tag}>`;
      if (tag !== "a") return `<${tag}>`;
      const href = /href\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? "";
      if (!SAFE_HREF.test(href)) return "<a>";
      const rel = /^https?:/i.test(href) ? ' rel="noopener"' : "";
      return `<a href="${href.replace(/"/g, "&quot;")}"${rel}>`;
    })
    // a `<` that does not start a tag we understand is text, not markup
    .replace(/<(?![a-zA-Z/])/g, "&lt;");
}

// ---- image size: read the header, not a library. JPEG and PNG only.
function imageSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length > 24 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG")
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker === 0xff) { i++; continue; }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      const sof = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf];
      if (sof.includes(marker)) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      i += 2 + len;
    }
  }
  return null;
}

// ---- invariants. Every one of these throws so the build fails loudly.
const DIR = path.join(process.cwd(), "data", "field-notes");
const PUBLIC = path.join(process.cwd(), "public");
export const IMAGE_BUDGET_BYTES = 200_000; // per post, hard
export const IMAGE_MAX_WIDTH = 1400;

const todayLocal = (() => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

function check(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(`data/field-notes: ${msg}`);
}
const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

function checkHtml(where: string, html: unknown, allow: readonly string[]): asserts html is string {
  check(isStr(html), `${where}: html is missing or empty`);
  const bad = tagsIn(html).filter((t) => !allow.includes(t));
  check(bad.length === 0, `${where}: uses <${bad[0]}>; allowed tags are ${allow.join(" ")}`);
  check(!/javascript:/i.test(html), `${where}: contains a javascript: URL`);
}

function checkSvg(where: string, svg: unknown): asserts svg is string {
  check(isStr(svg), `${where}: svg is missing or empty`);
  check(/^\s*<svg[\s>]/.test(svg), `${where}: svg must start with <svg`);
  check(!/<script/i.test(svg), `${where}: svg contains <script>`);
  check(!/\son[a-z]+\s*=/i.test(svg), `${where}: svg has an on* event attribute`);
  check(!/javascript:/i.test(svg), `${where}: svg contains a javascript: URL`);
  check(!/<foreignObject/i.test(svg), `${where}: svg contains <foreignObject>`);
  check(!/href\s*=\s*['"]?\s*(https?:|data:)/i.test(svg), `${where}: svg loads an external or data: resource`);
}

function validateBlock(slug: string, raw: unknown, i: number, imagesSeen: { bytes: number }): Block {
  const where = `${slug}: block ${i}`;
  check(typeof raw === "object" && raw !== null, `${where} is not an object`);
  const b = raw as Record<string, unknown>;
  const type = b.type;
  check(typeof type === "string" && (BLOCK_TYPES as string[]).includes(type),
    `${where} has unknown type "${String(type)}"; known types are ${BLOCK_TYPES.join(" ")}`);

  switch (type as Block["type"]) {
    case "prose":
      checkHtml(`${where} (prose)`, b.html, INLINE_TAGS);
      return { type: "prose", html: b.html };
    case "heading":
      check(isStr(b.text), `${where} (heading): text is missing`);
      check(b.level === 2 || b.level === 3, `${where} (heading): level must be 2 or 3`);
      return { type: "heading", text: b.text, level: b.level };
    case "terminal": {
      check(isStr(b.label), `${where} (terminal): label is missing`);
      check(Array.isArray(b.lines) && b.lines.length > 0, `${where} (terminal): lines is missing or empty`);
      const lines = (b.lines as unknown[]).map((l, j) => {
        check(typeof l === "object" && l !== null, `${where} (terminal): line ${j} is not an object`);
        const { kind, text } = l as Record<string, unknown>;
        check(kind === "cmd" || kind === "comment" || kind === "out",
          `${where} (terminal): line ${j} kind must be cmd, comment or out`);
        check(typeof text === "string", `${where} (terminal): line ${j} has no text`);
        return { kind, text } as TerminalLine;
      });
      return { type: "terminal", label: b.label, lines };
    }
    case "paper":
      check(isStr(b.title), `${where} (paper): title is missing`);
      check(isStr(b.label), `${where} (paper): label is missing`);
      checkHtml(`${where} (paper)`, b.html, PAPER_TAGS);
      return { type: "paper", title: b.title, label: b.label, html: b.html };
    case "table": {
      check(Array.isArray(b.head) && b.head.length > 0 && b.head.every(isStr), `${where} (table): head must be a non-empty list of strings`);
      check(Array.isArray(b.rows) && b.rows.length > 0, `${where} (table): rows is missing or empty`);
      const head = b.head as string[];
      const rows = (b.rows as unknown[]).map((r, j) => {
        check(Array.isArray(r) && r.length === head.length,
          `${where} (table): row ${j} has ${Array.isArray(r) ? r.length : 0} cells, head has ${head.length}`);
        r.forEach((cell, k) => checkHtml(`${where} (table): row ${j} cell ${k}`, cell, INLINE_TAGS));
        return r as string[];
      });
      return { type: "table", head, rows };
    }
    case "plate": {
      check(isStr(b.src), `${where} (plate): src is missing`);
      check(isStr(b.alt), `${where} (plate): alt is missing`);
      check(isStr(b.no), `${where} (plate): no is missing`);
      checkHtml(`${where} (plate)`, b.caption, INLINE_TAGS);
      check(b.src.startsWith(`/field-notes/${slug}/`), `${where} (plate): src must live under /field-notes/${slug}/`);
      check(!b.src.includes(".."), `${where} (plate): src must not contain ..`);
      const file = path.join(PUBLIC, b.src);
      check(fs.existsSync(file), `${where} (plate): no file on disk at public${b.src}`);
      const buf = fs.readFileSync(file);
      const size = imageSize(buf);
      check(size !== null, `${where} (plate): ${b.src} is not a JPEG or PNG`);
      check(size.width <= IMAGE_MAX_WIDTH, `${where} (plate): ${b.src} is ${size.width}px wide; max ${IMAGE_MAX_WIDTH}`);
      imagesSeen.bytes += buf.length;
      return { type: "plate", src: b.src, alt: b.alt, no: b.no, caption: b.caption, ...size };
    }
    case "figure":
      checkSvg(`${where} (figure)`, b.svg);
      checkHtml(`${where} (figure)`, b.caption, INLINE_TAGS);
      return { type: "figure", svg: b.svg, caption: b.caption };
    case "spec": {
      check(Array.isArray(b.rows) && b.rows.length > 0, `${where} (spec): rows is missing or empty`);
      const rows = (b.rows as unknown[]).map((r, j) => {
        check(typeof r === "object" && r !== null, `${where} (spec): row ${j} is not an object`);
        const { k, v } = r as Record<string, unknown>;
        check(isStr(k) && isStr(v), `${where} (spec): row ${j} needs k and v`);
        return { k, v };
      });
      const stamp = b.stamp as Record<string, unknown> | undefined;
      check(typeof stamp === "object" && stamp !== null, `${where} (spec): stamp is missing`);
      check(isStr(stamp.label), `${where} (spec): stamp.label is missing`);
      check(isDate(stamp.date), `${where} (spec): stamp.date "${String(stamp.date)}" is not YYYY-MM-DD`);
      return { type: "spec", rows, stamp: { label: stamp.label, date: stamp.date } };
    }
  }
}

function validatePost(file: string, raw: unknown): Post {
  const name = path.basename(file, ".json");
  check(typeof raw === "object" && raw !== null, `${file} is not a JSON object`);
  const p = raw as Record<string, unknown>;
  check(isStr(p.slug), `${file}: slug is missing`);
  check(/^[a-z0-9-]+$/.test(p.slug), `${file}: slug "${p.slug}" is not lowercase kebab`);
  check(p.slug === name, `${file}: slug "${p.slug}" does not match the filename`);
  const slug = p.slug;
  for (const f of ["kicker", "title", "dek", "summary"] as const)
    check(isStr(p[f]), `${slug}: ${f} is missing`);
  check(isDate(p.published), `${slug}: published "${String(p.published)}" is not YYYY-MM-DD`);
  check(isDate(p.verified), `${slug}: verified "${String(p.verified)}" is not YYYY-MM-DD`);
  check(p.verified <= todayLocal, `${slug}: verified ${p.verified} is in the future (today is ${todayLocal})`);
  check(p.published <= todayLocal, `${slug}: published ${p.published} is in the future (today is ${todayLocal})`);
  check(Array.isArray(p.hand) && p.hand.every(isStr), `${slug}: hand must be a list of strings`);
  check(Array.isArray(p.blocks) && p.blocks.length > 0, `${slug}: blocks is missing or empty`);

  const images = { bytes: 0 };
  const blocks = (p.blocks as unknown[]).map((b, i) => validateBlock(slug, b, i, images));
  check(images.bytes <= IMAGE_BUDGET_BYTES,
    `${slug}: plates weigh ${images.bytes} bytes; budget is ${IMAGE_BUDGET_BYTES}`);

  let sources: Source[] | undefined;
  if (p.sources !== undefined) {
    check(Array.isArray(p.sources), `${slug}: sources must be a list`);
    sources = (p.sources as unknown[]).map((s, i) => {
      check(typeof s === "object" && s !== null, `${slug}: source ${i} is not an object`);
      const { label, url } = s as Record<string, unknown>;
      check(isStr(label) && isStr(url) && /^https?:\/\//.test(url), `${slug}: source ${i} needs label and an http(s) url`);
      return { label, url };
    });
  }

  return {
    slug, kicker: p.kicker as string, title: p.title as string, dek: p.dek as string,
    summary: p.summary as string, published: p.published, verified: p.verified,
    hand: p.hand as string[], blocks, sources,
  };
}

function load(): Post[] {
  check(fs.existsSync(DIR), `directory ${DIR} does not exist`);
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
  const posts: Post[] = [];
  const slugs = new Set<string>();
  for (const f of files) {
    let raw: unknown;
    try { raw = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")); }
    catch (e) { throw new Error(`data/field-notes/${f}: not valid JSON (${(e as Error).message})`); }
    const post = validatePost(f, raw);
    check(!slugs.has(post.slug), `duplicate slug "${post.slug}"`);
    slugs.add(post.slug);
    posts.push(post);
  }
  // newest first; ties broken by slug so the order is stable
  return posts.sort((a, b) => (a.published === b.published ? a.slug.localeCompare(b.slug) : b.published.localeCompare(a.published)));
}

// ---- exports
export const fieldNotes: Post[] = load();
export const getPost = (slug: string) => fieldNotes.find((p) => p.slug === slug) ?? null;

/** The number in the kicker ("FIELD NOTES / 02" → "02"), for the index card. */
export const kickerNo = (p: Post) => /(\d+)\s*$/.exec(p.kicker)?.[1] ?? "";
