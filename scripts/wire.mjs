#!/usr/bin/env node
// The Wire: fetch every source in data/wire-sources.json, keep the last 7
// days, sort each item into a category, and write data/wire.json.
// Runs in a GitHub Action every 6 hours (.github/workflows/wire.yml) and
// locally with `npm run wire`. No dependencies, no LLM calls: categories come
// from the source first and title keywords second, so every label can be
// explained by a rule in this file.
import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const SOURCES = new URL("data/wire-sources.json", ROOT);
const OUT = new URL("data/wire.json", ROOT);
const WINDOW_MS = 7 * 24 * 3600 * 1000;
const UA = "buildunfiltered-wire/1.0 (+https://buildunfiltered.com/tools/wire/)";

const now = new Date();
const since = now.getTime() - WINDOW_MS;

// ---- categories: keyword rules, checked in this order. First match wins.
const RULES = [
  ["funding", /\b(raises?|raised|raising|funding|funded|series [a-f]\b|seed round|pre-seed|valuation|valued at|unicorn|acquires?|acquired|acquisition|buys|ipo|investment in|invests?)\b/i],
  ["policy", /\b(regulat\w*|legislat\w*|lawsuits?|sues|sued|court|judge|copyright|ai act|senate|congress|parliament|executive order|ban(s|ned)?|antitrust|ftc|eu commission|government|policy)\b/i],
  ["use-cases", /(^show hn\b|\bi (built|made|used|automated|replaced|turned|got)\b|\bhow (i|we|to)\b|\bwe built\b|\bbuilt (a|an|my)\b|\bworkflow|\busing (claude|chatgpt|gpt|gemini|codex|cursor|ai|llms?) (to|for)\b|\btutorial\b|\bguide\b|\bstep[- ]by[- ]step\b|\btips?\b)/i],
  ["open-source", /\b(open[- ]?source[sd]?|open[- ]weights?|weights|gguf|ollama|llama\.cpp|vllm|apache[- ]2|mit licen[cs]e|local(ly)? (llm|model)s?|self[- ]host\w*)\b/i],
  ["launches", /\b(launch\w*|introduc\w*|announc\w*|unveil\w*|now available|rolls? out|its new|comes to|expands to|rolling out|releases?d?|ships?|shipping|debuts?|available (in|on|to)|new (model|feature|app|api)|beta|preview|(gpt|gemini|claude|mistral|llama|qwen|deepseek|gemma|grok|kimi|glm)[\w .-]{0,20}\d+(\.\d+)?)\b/i],
  ["research", /\b(paper|arxiv|study|studies|benchmark\w*|dataset|preprint)\b/i],
];

// Titles must mention one of these to survive an `ai_only` source.
const AI_TERMS = /\b(ai|a\.i\.|llms?|gpt[-\w]*|chatgpt|openai|anthropic|claude|gemini|deepmind|mistral|llama|qwen|deepseek|grok|xai|copilot|cursor|agents?|agentic|mcp|transformers?|diffusion|neural|machine learning|ml|inference|embeddings?|rag|fine[- ]?tun\w*|prompt\w*|hugging ?face|ollama|vllm|codex|sora|midjourney|stable diffusion|perplexity|nvidia|gpus?|tokens?)\b/i;

function categorise(src, title) {
  if (src.fixed) return src.category;
  for (const [cat, re] of RULES) if (re.test(title)) return cat;
  return src.category;
}

// ---- tiny XML reading: enough for RSS 2.0 and Atom, nothing more.
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
      e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m);
const clean = (s) => decode(decode(s ?? "")).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const tag = (xml, name) => xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"))?.[1];
const atomLink = (xml) => {
  const links = [...xml.matchAll(/<link\b([^>]*)\/?>/gi)].map((m) => m[1]);
  const pick = links.find((a) => /rel=["']alternate["']/i.test(a)) ?? links.find((a) => !/rel=/i.test(a)) ?? links[0];
  return pick?.match(/href=["']([^"']+)["']/i)?.[1];
};

function parseFeed(xml) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  return blocks.map((b) => {
    const isAtom = /^<entry/i.test(b);
    const link = isAtom ? atomLink(b) : clean(tag(b, "link")) || atomLink(b);
    const date = tag(b, "published") ?? tag(b, "pubDate") ?? tag(b, "updated") ?? tag(b, "dc:date");
    return {
      title: clean(tag(b, "title")),
      url: link ? decode(link).trim() : "",
      published: date ? new Date(clean(date)).toISOString() : null,
      outlet: clean(tag(b, "source")) || null, // Google News names the publisher here
    };
  });
}

// ---- fetching, with retries: YouTube's feed endpoint 404s and 500s at random.
async function get(url, { json = false, headers = {} } = {}) {
  let last;
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, ...headers }, signal: AbortSignal.timeout(20000) });
      if (res.ok) return json ? res.json() : res.text();
      last = new Error(`HTTP ${res.status}`);
      if (res.status < 500 && res.status !== 404 && res.status !== 429) break;
      if (res.status === 429) { await sleep(10000 * (i + 1)); continue; }
    } catch (e) { last = e; }
    await sleep(1500 * (i + 1));
  }
  throw last;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Reddit answers parallel requests with 429s, so its sources take turns.
let redditQueue = Promise.resolve();
const queued = (fn) => (s) => {
  const run = redditQueue.then(() => fn(s));
  redditQueue = run.catch(() => {}).then(() => sleep(6000));
  return run;
};

// Reddit blocks some datacentre IPs on its public feeds. If the repo has
// REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET secrets, use the official API instead.
let redditToken;
async function reddit(src) {
  const { REDDIT_CLIENT_ID: id, REDDIT_CLIENT_SECRET: secret } = process.env;
  if (!id || !secret) return parseFeed(await get(src.url));
  redditToken ??= await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST", body: "grant_type=client_credentials",
    headers: { "user-agent": UA, authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded" },
  }).then((r) => r.json()).then((j) => j.access_token);
  const u = new URL(src.url);
  const api = `https://oauth.reddit.com${u.pathname.replace(/\/?\.rss$/, "")}${u.search}`;
  const j = await get(api, { json: true, headers: { authorization: `Bearer ${redditToken}` } });
  return j.data.children.map(({ data: d }) => ({
    title: d.title, url: `https://www.reddit.com${d.permalink}`,
    published: new Date(d.created_utc * 1000).toISOString(), score: d.score,
  }));
}

const FETCH = {
  rss: async (s) => parseFeed(await get(s.url)),
  youtube: async (s) => parseFeed(await get(s.url)),
  reddit: queued(reddit),
  hn: async (s) => {
    const j = await get(s.url.replace("{since}", Math.floor(since / 1000)), { json: true });
    return j.hits.map((h) => ({
      title: h.title, published: h.created_at, score: h.points,
      // Link the discussion: for a builder it's usually worth more than the article.
      url: `https://news.ycombinator.com/item?id=${h.objectID}`,
    }));
  },
  "hf-papers": async (s) => {
    const j = await get(s.url, { json: true });
    return j.filter((p) => (p.paper?.upvotes ?? 0) >= (s.min_score ?? 0))
      .sort((a, b) => b.paper.upvotes - a.paper.upvotes)
      .map((p) => ({
        title: p.title ?? p.paper.title, url: `https://huggingface.co/papers/${p.paper.id}`,
        published: p.publishedAt ?? p.paper.publishedAt, score: p.paper.upvotes,
      }));
  },
};

// Same story, two URLs: strip tracking and compare on host + path, and on title.
const urlKey = (u) => {
  try { const x = new URL(u); return `${x.hostname.replace(/^www\./, "")}${x.pathname.replace(/\/$/, "")}${x.hostname.includes("ycombinator") || x.hostname.includes("youtube") ? x.search : ""}`; }
  catch { return u; }
};
const titleKey = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// The same funding round arrives as five headlines worded five ways. Compare
// the distinctive words (names, figures) and fold near-matches into the first
// copy, which records how many others carried it.
const GENERIC = new Set(("a an the and or of in on at to for from by with as is are its it this that new now " +
  "ai startup startups company raises raised raise lands funding round series seed valuation valued million " +
  "billion m b bn led report says after over into up its their how why what").split(" "));
const words = (t) => new Set(t.toLowerCase().replace(/\$?(\d+)(?:\.\d+)?\s?(m|mn|b|bn|million|billion)\b/g, "$1")
  .replace(/[^a-z0-9]+/g, " ").split(" ").map((w) => w.replace(/(ed|es|s)$/, "")).filter((w) => w.length > 1 && !GENERIC.has(w)));
function sameStory(a, b) {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared >= 3 && shared / Math.min(a.size, b.size) >= 0.5;
}

async function main() {
  const cfg = JSON.parse(await readFile(SOURCES, "utf8"));
  const prev = await readFile(OUT, "utf8").then(JSON.parse).catch(() => ({ items: [], sources: [] }));

  const results = await Promise.all(cfg.sources.map(async (src) => {
    try {
      const raw = await FETCH[src.kind](src);
      const items = raw
        .filter((r) => r.title && r.url && r.published && !Number.isNaN(Date.parse(r.published)))
        .filter((r) => Date.parse(r.published) >= since && Date.parse(r.published) <= now.getTime() + 3600e3)
        .filter((r) => !src.ai_only || AI_TERMS.test(r.title))
        .map((r) => {
          // Google News appends " - Publisher" to every title; the tag carries it instead.
          const title = r.outlet ? r.title.replace(new RegExp(`\\s+[-–]\\s+${r.outlet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "") : r.title;
          return {
            title, url: r.url, published: r.published, source: src.id,
            outlet: r.outlet ?? null, category: categorise(src, title), score: r.score ?? null,
          };
        })
        .sort((a, b) => (src.kind === "hf-papers" ? 0 : b.published.localeCompare(a.published)))
        .slice(0, src.limit ?? 20);
      return { src, ok: true, items, count: items.length };
    } catch (e) {
      // Keep what we had from this source so one bad fetch doesn't empty a category.
      const kept = prev.items.filter((i) => i.source === src.id && Date.parse(i.published) >= since);
      const was = prev.sources.find((p) => p.id === src.id);
      return { src, ok: false, error: String(e.message ?? e), items: kept, count: kept.length, last_ok: was?.last_ok ?? null };
    }
  }));

  const seenUrl = new Set(), seenTitle = new Set(), items = [], bags = [];
  for (const it of results.flatMap((r) => r.items)) {
    const u = urlKey(it.url), t = titleKey(it.title), w = words(it.title);
    if (seenUrl.has(u) || seenTitle.has(t)) continue;
    seenUrl.add(u); seenTitle.add(t);
    const twin = bags.findIndex((b) => sameStory(w, b));
    if (twin >= 0) { items[twin].also = (items[twin].also ?? 0) + 1; continue; }
    bags.push(w); items.push(it);
  }
  items.sort((a, b) => b.published.localeCompare(a.published));

  const out = {
    fetched: now.toISOString(),
    window_days: 7,
    sources: results.map((r) => ({
      id: r.src.id, ok: r.ok, count: r.count,
      last_ok: r.ok ? now.toISOString() : r.last_ok ?? null,
      ...(r.ok ? {} : { error: r.error }),
    })),
    items,
  };
  await writeFile(OUT, JSON.stringify(out, null, 1) + "\n");

  const bad = results.filter((r) => !r.ok);
  console.log(`wire: ${items.length} items from ${results.length - bad.length}/${results.length} sources`);
  for (const r of bad) console.log(`  failed ${r.src.id}: ${r.error}`);
  // Fail the run only if most sources are down: that's the network, not a feed.
  if (bad.length > results.length / 2) process.exit(1);
}

main();
