# build.unfiltered — context

Read this first in any new thread. It says what this thing is, where it lives, and what the
plan is. Owner: Yash Raj (nameisyash@gmail.com). Last updated 2026-10-23.

## Links

| What | Where | Status |
|---|---|---|
| Website | https://buildunfiltered.com | Static site, Cloudflare Pages (build `npm run build`, output `out/`). Confirm the MCP pages are live after the latest deploy. |
| Repo | https://github.com/hi-donna/buildunfiltered | `master`, pushed and in sync as of 2026-09-03. |
| Local checkout | `~/Documents/Codebases/buildunfiltered` | This is the copy Claude Code builds in. |
| Instagram | https://www.instagram.com/build.unfiltered/ | Handle inferred from the folder name — **confirm and correct this line**. |
| Instagram working folder | `~/Documents/Social Media /Personal /Instagram - build.unfiltered` | Reel scripts, cue sheets, audio, rough cuts. |

## What it is

build.unfiltered is a distribution channel for things Yash builds, and a place to teach.
Two halves of one idea:

- **The site** gives builders small, free, no-login tools — the things Yash needed that
  didn't exist, or existed badly. Aimed mostly at people building with AI.
- **The Instagram page** is how those tools reach people, and where Yash shares how he
  understands things. He likes teaching; the page is the excuse to do it in public.

Tone everywhere: direct, specific, British-leaning spelling, short sentences. No hype,
no "in today's fast-paced world", no selling. Assume the reader is a competent builder
in a hurry who will resent being sold to. The brand's honesty *is* the product — every
claim on the site carries a real date and a source, and where we haven't done the work
the page says so instead of padding.

Visual identity: the cave. Amber light, bats, night, signal. The cave is ours; Batman
is not — the name, logo, bat-symbol silhouette and character are Warner Bros. IP and
never appear on the public site or the page.

## The plan for Instagram

The page is the distribution layer, not a separate product. The plan is:

1. **Every tool on the site is one launch.** Each tool must be screenshot-able as a
   single square post — if its core value can't fit one image, the tool is too diffuse
   and gets narrowed (this is a hard rule in the roadmap). Post the tool, link the
   site.
2. **Explainer reels for the concepts underneath the tools.** A series that teaches
   AI to builders, one idea per reel, 60–90s, 9:16. Yash on camera for the hook and
   outro, motion graphics for the middle, burned-in captions because most people
   watch muted. Reel #1 is "What is an LLM?" — script, visual brief, cue sheet and a
   test-take rough cut are in the Instagram folder (`stan-llm-reel-01/`). It's a test
   iteration: the take ran 81s against a 60s target, hook/outro footage isn't shot yet,
   and the decision on trimming vs. accepting ~85s is still open.
3. **Findings from the research are posts.** The research behind each tool throws up
   things worth saying on their own. From MCP Connect: Anthropic's own reference
   Postgres and Puppeteer servers are archived and still rank as top tutorial results;
   the default install of most MCP servers is read-write-delete, not read-only.
4. **Cadence follows shipping.** No content calendar disconnected from the work. A
   tool ships → it gets posted. Rankings move → that's a post. The newsletter (not yet
   wired up — `site.newsletterAction` is null) will carry the same changes.

## The site, as it stands

**Since 2026-10-23 the site is one thing: The Wire, the AI news feed, on the homepage
(`/`).** AI Tool Finder, MCP Connect, the Learning Map and Field Notes were removed that
day (Yash's call: an AI assistant now does what those pages did). Their old URLs, and
the Wire's old `/tools/wire/`, 301 to `/` (`public/_redirects`). The code is in git
history before that date if anything needs to come back. The tool roadmap in
`docs/ROADMAP.md` is retired.

- **The Wire** — `/`. What happened in AI in the last week: funding, launches, open
  source, use cases, research, policy. Collected every 6 hours by Scout
  (`github.com/hi-donna/scout`, private), which commits `data/wire.json` here; that
  push rebuilds the site. Sources are changed in Scout, not here. Page: `app/page.tsx`,
  `components/WireLog.tsx`, `lib/wire.ts`.
- **Account** — `/account/`. Phone sign-in via Supabase. Nothing is gated behind it.

**Principles that don't bend:** data first (every tool is one JSON file plus a
renderer); no backend, static export only; honesty is the product; every tool has a
catch; one design system (`app/globals.css`, don't add a second palette); one tool =
one Instagram square; research to `docs/RESEARCH_SPEC.md`, never invent a price,
feature, licence or date.

## How the work gets done

- **Cowork (this)** does the research: writes the per-entry JSON to spec
  (`SPEC.md` for the finder, `MCP_SPEC.md` for MCP), verifies every price and claim at
  the vendor's own page, and drafts the build prompt.
- **Claude Code** builds in the local checkout, commits per tool (`tool(<slug>): ...`),
  runs `npm run build` before every push, and writes `docs/STATUS.md` at the end of a
  session: what shipped, what's half-done, what needs Yash.
- **Yash** does nothing during a build. When a tool is pushed, he posts it.

## Open items needing Yash (from `docs/STATUS.md`)

- Confirm the Cloudflare `_redirects` for `/tools/ai-finder/` → `/ai-tools/` applies
  after deploy.
- The OG image still uses the old paper/green palette and vendored fonts; refresh
  before the MCP Connect Instagram post.
- Confirm the Instagram handle in the links table above.
- Record the final take for reel #1 (hook and outro on camera, same setting), then
  regenerate the cue-sheet timings — don't reuse the test-take timestamps.
