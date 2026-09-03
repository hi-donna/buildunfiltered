# Tool 2 — MCP Connect  `/tools/mcp/`

**Job:** "I want my AI to reach X. Which MCP server, and what does it get access to?"

**Data:** `data/mcp.json` — done, 57 targets across 8 categories. Do not re-research;
build the renderer over it. Shape per target: `pick` (the server), optional
`alternate`, optional `avoid` (a widely-recommended server to steer clear of),
`last_verified`, `sources`. `preamble` holds the security block for the top of
the page; `method` holds the how-we-ranked block for the bottom.

## Why this isn't a directory

Glama indexes 81,000+ servers. This page has 57 targets, one pick each, and the
thing no directory shows: whether it's the vendor's own server, what it can
touch, and what to avoid. Keep it that way. No "submit a server" form.

## UI

Same design system as the rest of the site — extend `app/globals.css` tokens,
don't invent new ones.

**Index `/tools/mcp/`:**
- H1 in the site's voice. One line under it. The `preamble` block directly below —
  five short points and their three sources — styled as a warning strip, not a
  wall. Collapsible on mobile.
- Search box (reuse the tokenised search from `components/JobList.tsx` — same
  stop-word and stemming logic; "postgres database" must find Postgres).
- Targets grouped by category, one row each: target name · OFFICIAL / COMMUNITY
  tag · an **access strip** (three small cells R / W / D, filled or hollow) ·
  transport · maintained state. The access strip is the point of the page —
  it must be readable without clicking.
- Filter chips: "official only", "read-only available", "no API key needed",
  "remote".

**Target page `/tools/mcp/<id>/`:**
- H1 = target name. The `question` under it.
- **Verdict card** for the pick: name, maintainer, OFFICIAL/COMMUNITY badge,
  transport, auth, clients as small tags, last release, maintained state.
- **Access block:** the R/W/D strip large, then `scope_note` in full.
- **The catch** — same warn-token treatment as the finder. This is the retention
  moment; give it room.
- Alternate (if any) as a smaller card.
- **Avoid** (if any) as its own labelled block — name the server, say why.
- Sources, last verified, method block at the bottom (same pattern as finder pages).
- Static generation: `generateStaticParams` over all 57 ids. Add all to sitemap.

**Homepage:** register in `site.config.ts` tools list so the shelf shows it.
Status `live` once built.

## Done when

- All 57 target pages build and render, every access strip matches the data.
- Search finds "github", "postgres database", "send slack message", "browser".
- The preamble sources are real links at the top of the index.
- `npm run build` passes; pushed; STATUS.md updated.
