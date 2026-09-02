# build.unfiltered — Roadmap

Ten tools for people building with AI. One is live. This document is the plan for
the other nine. It is the authoritative brief: read it fully before starting any tool,
and re-read it at the start of every session.

The owner is not going to be watching. Make the calls this document lets you make,
stop at the stop points it defines, and leave a clear note in `docs/STATUS.md` when
you stop — what shipped, what didn't, what needs a human.

---

## 0. Principles that do not bend

1. **Data first.** Every tool is `data/<slug>.json` plus a renderer under `app/tools/<slug>/`.
   Content never lives in markup. Someone must be able to update a tool by editing
   one JSON file and pushing.
2. **No backend.** Static export on Cloudflare Pages. Interactivity is client-side.
   Anything needing a schedule uses a GitHub Action that commits JSON to the repo.
   No databases, no API keys in the browser, no logins.
3. **Honesty is the product.** Every claim carries `last_verified` (a real date) and
   `sources` (URLs actually opened). A price that cannot be read at the vendor's own
   page is written as "check current pricing", never guessed. Where a category has
   no good answer, the page says so. An unverified entry renders as unverified;
   it is never padded to look complete.
4. **Every tool has a catch.** The section that says why you'd regret it. If a tool
   in a ranking has no honest catch, it isn't understood well enough to rank.
5. **One design system.** Use whatever `app/globals.css` defines when you start.
   Do not introduce a second palette, a second type pairing, or a component
   library. New tools extend the existing tokens.
6. **Each tool must be shareable as one Instagram post.** If a tool's core value
   can't be screenshotted into a single square, it's too diffuse — narrow it.
7. **The cave is ours. Batman is not.** Cave, amber light, bats, night, signal — use
   freely. The Batman name, logo, bat-symbol silhouette, and character are Warner
   Bros. IP and must not appear on this public site. If unsure, leave it out.
8. **Research standard.** Follow `docs/RESEARCH_SPEC.md` for any ranked or factual
   content. Never invent a tool, price, feature, licence term, or date.

## 1. Repo conventions

- Register every tool in `site.config.ts` → `tools[]` with `{slug, name, blurb,
  status: 'live' | 'building' | 'planned'}`. The homepage shelf renders from this
  list; do not hand-edit the homepage per tool.
- Route: `/tools/<slug>/`. The AI Tool Finder currently lives at `/ai-tools/`;
  leave that URL as-is (it is indexed) and add a redirect from `/tools/ai-finder/`
  to it.
- Add each tool's pages to `app/sitemap.ts`.
- Commit per tool, message `tool(<slug>): <what>`. Build (`npm run build`) must pass
  before every push. Push after every completed tool so it deploys.
- Write `docs/STATUS.md` at the end of every session: date, what shipped, what is
  half-done, what blocked you, what needs the owner.

## 2. Ship order and stop points

Build in this order. **Stop after each tool** — push it, update STATUS.md, then
continue to the next. Do not start tool N+1 with tool N unfinished.

Do not build all nine in one session even if you can. Quality per tool matters
more than count, and each tool is a separate launch on Instagram.

---

## Tool 2 — Model Picker  `/tools/models/`

**Job:** "Which model should I call for this, and what will it cost me per month?"

**Data** `data/models.json`: one entry per current model (Anthropic, OpenAI, Google,
Meta, Mistral, DeepSeek, Qwen, xAI — whatever is genuinely current on the day
you research it). Per model: provider, input/output price per 1M tokens, cached
input price if offered, context window, max output, modalities in/out, tool use,
structured output, knowledge cutoff, `last_verified`, `sources`, `the_catch`.
Prices read ONLY from the provider's own pricing page.

**UI:**
- A calculator: requests/day × avg input tokens × avg output tokens → monthly
  bill per model, live-updating, sorted cheapest first. Big tabular numbers.
- A "for this job" selector: pick a job (coding, long-document Q&A, agents with
  tools, vision, cheap bulk classification, creative writing) → three ranked
  picks with the catch, same card style as the finder.
- A paste-your-prompt token estimator: client-side, use a tokenizer that runs in
  the browser (e.g. a WASM tiktoken build) — approximate is fine if labelled
  approximate.

**Done when:** every listed price has a vendor URL; the calculator is correct for
a hand-checked example; the page states its verification date at the top.

---

## Tool 3 — Free Tier Tracker  `/tools/free/`

**Job:** "What can I actually get for free, and where's the trap?"

**Data** `data/free.json`: per product (APIs and apps — LLM APIs, image, video,
TTS, transcription, vector DBs, hosting, automation): the exact free allowance
(numbers and units, e.g. "1,000 chars/mo", "125 one-time credits"), whether it
resets, whether commercial use is allowed on the free tier, whether a card is
required, what the first paid tier costs, `the_trap` (one sentence — the thing
you find out after signing up), `last_verified`, `sources`.

**UI:** a dense spec-sheet table, mono, sortable by category. The trap column is
visually distinct (use the existing warn token). Filter chips: "no card required",
"commercial OK", "resets monthly". A prominent "last checked" line per row.

**Done when:** ≥40 products, every row dated and sourced, no row with a guessed
number.

---

## Tool 4 — Licence Checker  `/tools/licences/`

**Job:** "This model says open. Can I ship it in a product I charge for?"

**Data** `data/licences.json`: per open-weights model family (Llama, Qwen, Mistral,
DeepSeek, Gemma, FLUX, Stable Diffusion, Whisper, Chatterbox, BRIA, Fish Audio,
Breeze — extend as found): licence name, commercial use (yes / no / conditional),
the conditions in plain English (user caps, attribution, region locks, separate
agreement needed), whether the *code* and *weights* licences differ (they often
do — say so), a link to the actual licence text, `last_verified`.

**UI:** search a model name → a single verdict card: big YES / NO / CONDITIONS
in the accent, then the conditions as a short list, then the licence link. The
verdict must be readable in two seconds. Below: the full table.

**Done when:** ≥30 model families; every verdict links to the licence text
itself, not a blog about it.

---

## Tool 5 — Learning Map  `/tools/learn/`

**Job:** "I want to actually understand LLMs / agents / RAG / fine-tuning. Where do I
start and what order?"

**Data** `data/learn.json`: nodes and edges. Node: id, title, one-paragraph
builder's explanation (what it is and why you'd care), `level` (foundations /
core / applied / frontier), `resources`: 2–3 max, each {title, url, type
(video/paper/course/post), author, length, why_this_one}. Edge: from → to
(prerequisite). Start with ~30 nodes: tokens, embeddings, attention, transformers,
pretraining, fine-tuning, RLHF, prompting, context windows, RAG, vector search,
tool use / function calling, agents, ReAct, evals, guardrails, MCP, inference
cost, quantisation, local models, and so on. Resources must be things a builder
would actually finish: Karpathy's Zero to Hero and "Let's build GPT", 3Blue1Brown's
transformer videos, the Attention paper, the ReAct paper, the RAG paper, Anthropic
and OpenAI cookbooks — verify every URL.

**UI — this is the one that must not be a list:** a constellation. Dark ground,
nodes as points of amber light, prerequisite edges as thin lines. Pan and zoom
(Canvas or SVG — no heavy graph library). Hover a node: its prerequisites light
up back to the roots. Click: a side panel with the explanation and the 2–3
resources. A "start here" node is visually marked. Levels are rings or bands
from centre outward. Must degrade on mobile to a scrollable list grouped by
level — the constellation is desktop-first.

**Done when:** every resource URL resolves; the graph has no orphan nodes; the
mobile fallback works.

---

## Tool 6 — Deprecation Watch  `/tools/deprecations/`

**Job:** "What's being shut down, repriced, or removed that I might be building on?"

**Data** `data/deprecations.json`: per event: product/model, vendor, what is
happening (shutdown / price increase / API removal / rename / free tier cut),
effective date, announced date, what to use instead, source URL, `last_verified`.
Seed from the finder's research (Sora 2 and the Videos API, 24 Sept 2026, is one)
and from vendor deprecation pages.

**UI:** a timeline, newest effective date first. Past events greyed. Each entry
is one line plus a "what to do" line. Upcoming-within-30-days entries get the
warn token. Dry tone; no jokes on top of the facts — the facts are the joke.

**Done when:** ≥25 dated events with primary sources.

---

## Tool 7 — The Wire  `/tools/wire/`

**Job:** "What happened in AI this week that matters to someone building?"

**Mechanism:** `.github/workflows/wire.yml` runs on a schedule (every 6 hours).
A Node script fetches a fixed list of RSS/Atom feeds (vendor blogs: Anthropic,
OpenAI, Google DeepMind, Meta AI, Mistral, Hugging Face; research: arXiv cs.AI
and cs.CL; industry: a small set of reputable outlets — choose ones with proper
feeds), normalises to `{title, url, source, published, category}`, keeps the
last 7 days, writes `data/wire.json`, and commits if changed. Cloudflare rebuilds
on the commit. Categories: `research`, `tools`, `business`, `policy` — assign
by source first, keyword rules second. No LLM calls in the action.

**UI:** a log. Mono, one line per item, timestamp left, source tag, title as the
link. Category filter chips. A "last fetched" stamp at the top that is the real
time of the last successful run. If the action has not run in >24h, show a plain
line saying so — do not let a stale page look current.

**Honesty line on the page:** "Auto-collected from the sources listed here. Not
curated. Not endorsed." List the sources.

**Done when:** the action has run green twice on schedule and the page reflects it.

---

## Tool 8 — Will It Run?  `/tools/local/`

**Job:** "Can my machine run this model locally?"

**Data** `data/local.json`: per open model and quantisation: parameter count,
RAM/VRAM needed at Q4 / Q8 / FP16, minimum practical hardware, link to a
canonical download (Hugging Face / Ollama), `last_verified`.

**UI:** the user sets RAM, GPU VRAM (or "Apple silicon, unified memory"), and
whether they want speed or quality. The page shows models as blocks sized by
memory, placed against a bar representing their hardware — what fits sits inside
the bar, what doesn't spills past it. Simple, visual, immediately legible.
Client-side only.

**Done when:** memory figures are sourced (model cards or Ollama library), and the
fit logic is checked against three real machines' worth of numbers.

---

## Tool 9 — Agent Stack Picker  `/tools/agents/`

**Job:** "I'm building an agent that does X. What stack, and what will bite me?"

**Data** `data/agents.json`: a decision tree. Root question: what kind of agent
(chat assistant with tools / browser automation / coding agent / data pipeline /
voice agent / multi-agent workflow). Per leaf: recommended framework (or "no
framework" — often the honest answer), model tier, memory approach, tool-calling
approach, evals, hosting, and the three things that will bite you. Each
recommendation has a source or a stated reason.

**UI:** a guided walk — one question per screen, large choices, a breadcrumb of
what you've picked, ending on a single stack card you can screenshot. Also a
"show me the whole tree" view.

**Done when:** every leaf has a full stack card and at least one named trade-off.

---

## Tool 10 — Prompting: what still works  `/tools/prompting/`

**Job:** "Which prompting techniques still matter with current models, and which
are 2023 folklore?"

**Data** `data/prompting.json`: per technique: what it is, `verdict` (still works /
mostly obsolete / situational), why, which model families it matters for, a
copy-paste example, a source (vendor docs or a paper, not a thread).

**UI:** three columns by verdict. The "obsolete" column is the interesting one —
lead with it. Copy button on every example.

**Done when:** ≥15 techniques, each with a verdict and a primary source.

---

## 3. Homepage after the tools land

The homepage shelf lists tools from `site.config.ts`. Live tools get a card;
building/planned tools get a single dim line each ("Coming: Free Tier Tracker").
Do not show empty promise cards with fake screenshots.

## 4. What the owner does

Nothing during the build. When a tool is pushed, they post it. The `STATUS.md`
note at the end of each session is how they know what happened. Keep it short:
five lines, what shipped, what's next, anything that needs them.
