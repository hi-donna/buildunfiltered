# Status

## 2026-09-03 — MCP Connect shipped

**Shipped:** Tool 2, MCP Connect, live at `/tools/mcp/` (commit `32ebeb9`).
Index with the security preamble, tokenised search, four filter chips, and
57 targets in 8 category panels with the R/W/D access strip. One static page
per target: verdict card, access block with scope note, the catch, alternate,
avoid block where the data has one (29 of 57), sources, method. Registered in
`site.config.ts`, on the homepage shelf, all 58 URLs in the sitemap. Search
logic now lives in `lib/search.ts` and is shared with the finder.

**Verified:** `npm run build` passes, 57 pages in `out/tools/mcp/`. "postgres
database" → Postgres only; "browser" → Playwright only; "github" → GitHub;
"send slack message" → loose match, Slack first in its category. Playwright
renders catch + avoid; Zapier renders the catch (its `avoid` is null in the
data, so no block). Access strips for github, stripe, filesystem match the
data (all R/W/D).

**Half-done:** nothing.

**Needs the owner:** Cloudflare `_redirects` was added for `/tools/ai-finder/`
→ `/ai-tools/`; confirm it applies after the next deploy. The OG image still
uses the old paper/green palette and vendored fonts; worth refreshing before
the Instagram post.

**Next:** Tool 3 per `docs/ROADMAP.md`.
