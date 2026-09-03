# Status

## 2026-09-04 — Learning Map resources: 3–5 per node, grouped, start-here marker

**Shipped:** `data/learn.json` now carries 133 resources across 31 nodes (130
distinct URLs, up from 61), 3 to 5 per node, each node shaped where the shape
exists: the defining paper, the best video or course, and a builder-facing docs
page or post. Mix: 41 papers, 40 docs, 38 posts, 9 videos, 5 courses. Every
node has exactly one resource with `start: true`. `lib/learn.ts` enforces 3–5
and exactly-one-start at build, and exports `groupResources` (Papers, Watch,
Read, Docs; empty groups omitted). `components/LearnList.tsx` renders the
grouped list with a `start here` tag in the existing `.tag.tag-official`
style; the map panel shares the same component. `LearnMap.tsx` unchanged.
Lede and meta description updated to say three to five. All 61 existing URLs
kept.

**Verified:**
- `npm run build` green; `out/tools/learn/index.html` contains all 31 titles,
  all 130 URLs, and 31 `start here` tags in plain HTML.
- URLs: 130/130 return 200 (same curl-backed node script as before).
- Every node has 3–5 resources and exactly one start (scripted).
- Broke the start rule on `rag` (two starts): build fails with
  `data/learn.json: node "rag" has 2 resources marked start; must be exactly 1`.
  Reverted; build green.
- `/tools/learn/#agents`: panel shows Watch and Read headings, `start here`
  on Building Effective AI Agents. No console errors.
- 390px (iframe emulation): list reads cleanly, headings and tag wrap
  correctly, no horizontal scroll. `#agents` opens the list row.
- No new colour hex in the diff.

**Decisions made:**
- 69 new URLs, all opened today; author's own page or venue page only. Vendor
  pages recorded at their redirect targets (developers.openai.com,
  platform.claude.com, trychroma.com/research, modelcontextprotocol.io
  spec 2026-07-28).
- Two candidates dropped after reading them: OpenAI's evals guide (its own
  page gives a platform shutdown date of 30 November 2026) and Karpathy's
  nanoGPT (its README says it is deprecated; nanochat is used instead).
- Videos where a canonical one exists: Karpathy (State of GPT on
  post-training), Willison's embeddings talk, Anthropic's MCP workshop at
  AI Engineer. Most nodes have no single best video and were not padded.
- The Vaswani paper appears on both `attention` and `transformers`; it is the
  defining paper for both and the `why_this_one` differs.
- Two Pinecone posts on `chunking` and one on `vector-search` were kept as
  the clearest explanations; the method block says vendor pages are not
  endorsements.

**No defining paper (stated in the method block):** evals (LLM-as-judge covers
model grading only), guardrails (Greshake defines the threat, not the
defence), agents (ReAct is its own node; Weng's post is the reference), MCP
(a spec), prompt caching (vendor prefix caching has no paper; the academic
"Prompt Cache" paper was considered and left out as not what vendors ship).

**Half-done:** nothing.

**Needs the owner:**
- Still: confirm 41 edges (spec said 45).
- Two YouTube resources sit on third-party channels that are the venue
  (Microsoft Developer for State of GPT, AI Engineer for the MCP workshop).
  Fine by the rule; flagging in case you want author channels only.
- Instagram square: unchanged advice; the map itself did not change.

**Next:** Tool 3 per `docs/ROADMAP.md`.

## 2026-09-04 — Learning Map shipped

**Shipped:** Tool 5, Learning Map, at `/tools/learn/`. `data/learn.json`: 31 nodes,
41 edges, 61 distinct resource URLs, every one opened on 2026-09-04 and confirmed
to be what its entry says. `lib/learn.ts`: types, §7 invariants (throw at build),
ancestor sets, ring positions. `components/LearnList.tsx`: server-rendered list
grouped by level, one `<details>` per concept, always in the DOM. `components/
LearnMap.tsx`: SVG constellation at ≥900px with hover lighting (node + transitive
prereqs in `--ox-hi` / `--ox`, rest dimmed to 40%), click → sticky side panel,
hash sync (`#rag` opens RAG), Esc / empty-ground click closes, wheel zoom about
cursor (0.5×–3×), drag pan, double-click and button reset. Registered in
`site.config.ts` (live, on the shelf), `/tools/learn/` in the sitemap. CSS under
`/* ---- learn: the constellation ---- */` using existing tokens only. No library,
no Canvas, no storage, no per-node pages.

**Verified (spec §11):**
- `npm run build` green; `out/tools/learn/index.html` contains all 31 node titles
  and all 61 resource URLs in plain HTML (grepped).
- Resource URLs: 61/61 return 200 (node script shelling to curl, HEAD then GET;
  node's own fetch ignores the sandbox proxy).
- Invariants: edge to `embeddingz` → build fails with
  `data/learn.json: edge tokens → embeddingz: "embeddingz" is not a live node`; reverted, build green.
- Ancestor test: hovering `agents` lights exactly attention, context-windows,
  embeddings, next-token-prediction, prompting, structured-output, tokens, tool-use,
  transformers (+ agents); 12 edges lit; 21 nodes dimmed.
- `/tools/learn/#rag` fresh: panel open on RAG, node marked selected.
- 800px and 390px (iframe emulation; the Chrome window would not resize): map
  hidden, list visible, no horizontal scroll (scrollWidth == viewport). At 800px
  with `#rag`, the RAG list row opens.
- Keyboard: Tab reaches nodes (reset button → tokens → next-token-prediction),
  Enter selects and sets the hash, Esc closes and clears it.
- Pan/zoom: wheel changes the viewBox around the cursor, drag pans, double-click
  (dispatched dblclick) and the reset button restore `-40 -40 1080 1080`.
  The Chrome automation tool's own double-click did not fire `dblclick`; the
  handler works when the event fires.
- Lighthouse desktop: accessibility 100, best-practices 100. One advisory
  (label-content-name-mismatch) because node `aria-label`s add the level after
  the visible title; the visible text is contained, score unaffected.
- No console errors. No new colour hex in the diff.

**Decisions made (spec lets me):**
- Edge count is 41, not 45: the spec's §5 prerequisite table yields 41 and no
  edges were invented. Phase 1 commit message says 41 for that reason.
- Two leads replaced with primary sources: OpenAI's hallucination post →
  arXiv 2509.04664 (same authors; openai.com blocks automated reads). OpenAI
  fine-tuning guide → Hugging Face TRL SFT Trainer docs (OpenAI's docs say its
  fine-tuning platform is winding down and closed to new users; recorded as the
  catch on `fine-tuning`). Vendor docs stored at their redirect targets.
- Labels on the two outer rings sit above/below the dot rather than radially,
  so long titles stay inside the 1000-unit canvas. Label size 17 SVG units
  (≈11px at the rendered 690px map), not 13, so they are legible.
- Angles hand-tuned once (≈20 min): agents cluster lower-left, RAG cluster top,
  cost cluster right, training cluster left. A few edges still cross the centre
  (post-training → reasoning-models, agents → memory); acceptable.
- 3rd `tokens` resource is Anthropic's token-counting page (spec allows 2–3).
- List row ids are `list-<id>` so the bare `#<id>` hash belongs to the map;
  on narrow viewports the map component opens the matching list row instead.

**Half-done:** nothing.

**Needs the owner:**
- Confirm 41 edges is right (spec said 45). Adding edges means editing §5.
- The Instagram square: screenshot of the map with `agents` hovered — the lit
  path from `tokens` to `agents` is the post. A capture from this session is at
  `/tmp/claude-501/learn/agents-hover.jpg` (temporary); retake at 1080×1080 from
  the live page, zoomed one notch so the lower-left cluster fills the square.
- OG image still uses the old palette (carried over from the MCP note).

**Next:** Tool 3 per `docs/ROADMAP.md` (Tool 2 Model Picker and Tool 4 Licence
Checker are also unbuilt; the roadmap order after the finder was 2, 3, 4 — 5 was
done first on the owner's instruction).

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
