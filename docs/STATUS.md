# Status

## 2026-09-04 — Phone sign-in (OTP, no password) with codenames

**Shipped (code; not switched on until the owner adds keys):**
- `/account/`: one flow for sign-in and sign-up. Phone number → six-digit SMS
  code → in. A number not seen before becomes an account on its first good
  code; first time in it is asked for an email. After that, phone + code only.
  Resend with a 30s cooldown, "wrong number" back-step, masked phone,
  sign out, session resumes on return. Page is `noindex`.
- Header: "Sign in" link, which becomes the codename once signed in.
- `data/codenames.json`: 100 assignable Batman-universe names in order
  (Robin, Nightwing, Batgirl, Oracle, Red Hood, …, Gotham Girl) plus the four
  reserved ones (Bruce Wayne, Bruce, Batman, Alfred) flagged
  `reserved: true` so they are never handed out. `lib/codenames.ts` checks
  the list at build time (positions in order, no duplicates, reserved names
  present and flagged, at least 100 assignable).
- `supabase/schema.sql` (generated from the JSON): `profiles` and
  `codenames` tables, row-level security (a user reads only their own
  profile and can change only its email; nobody can read `codenames` from
  the browser), and a trigger on new auth users that claims the next free,
  unreserved name with a row lock, falling back to "Gothamite N" when the
  100 run out. `supabase/README.md` has the ten-minute setup.
- `lib/supabase.ts`: browser client from `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`; with them absent the page says
  "Not switched on". `.env.example` added; `.env*.local` ignored.
- Dependency added: `@supabase/supabase-js` 2.115.0. The site stays a static
  export; there is no server of ours and no secret in the repo.

**Verified:** build green with and without keys; `/account/` renders at 390
and 1920 with no console errors; with placeholder keys the phone form
validates E.164, sends, and shows a readable error when the service cannot
be reached; the clean build contains no placeholder URL. The OTP round trip
itself cannot be tested without a project and an SMS provider.

**Two rules this bends, on the owner's instruction (roadmap §0):**
- §0.2 "no logins": there is now a login, on a third-party backend
  (Supabase) rather than one of ours. Content is not gated.
- §0.7 "Batman characters must not appear on the public site": the
  codenames are Batman characters. Today they appear only to their owner
  on `/account/`; nothing public shows them. If codenames are ever shown
  publicly, that rule needs a decision.

**Needs the owner:**
1. Create the Supabase project, enable Phone auth with an SMS provider
   (Twilio or similar; per-SMS cost), run `supabase/schema.sql`, put the two
   public keys in `.env.local` and Cloudflare Pages, redeploy. Steps in
   `supabase/README.md`. I cannot create accounts or handle keys.
2. Decide whether codenames may appear publicly (see the IP note above).
3. Email is stored but not verified; say if you want a confirmation mail.

**Next:** Tool 3 per `docs/ROADMAP.md`, or wiring the keys above.

## 2026-09-04 — QA pass, phone and laptop, all tools

**Checked (static export served locally, Chrome 152):** home, AI Tool Finder
index, a finder job page (`/ai-tools/audio/tts/`), MCP Connect index, an MCP
target page (`/tools/mcp/airtable/`), Learning Map.
- Phone 390px (iframe emulation), and incidentally 303px when six frames
  shared the window: no horizontal overflow on any page
  (`scrollWidth == viewport`), no element wider than the viewport outside
  the map's SVG. Finder search ("transcribe audio" → 1 of 50, right row
  first), MCP filter chip (official only → 50 of 57), MCP category toggle
  opens rows, Learning Map plate and controls bar all work.
- Laptop 1920: every page renders as designed; home shelf lists the three
  live tools; no console errors across the pass.
- One change: the Learning Map's phone start zoom eased from 1.6× to 1.4× so
  more of the plate is on screen before panning (labels stay 25 units,
  legible at 390px).

**Half-done:** nothing. **Needs the owner:** unchanged from previous notes.

## 2026-09-04 — Learning Map: legibility, no-jump open, sticky notes, workshop handwriting

**Shipped (targeted; no content, data, link or interaction changes):**
- Inactive labels: 17 → 19.5 SVG units (25 on phones), fill `--ink-2` → `--ink`.
  Every concept reads without hovering.
- Opening a node no longer moves the page. `show()` focuses the close button
  and the browser scrolled it into view, pushing "Learning Map" under the
  sticky header; the scroll position is now restored in the same task
  (before any paint) and focus is moved with `preventScroll`. Deep links
  (`#rag`, prerequisite chips) unchanged.
- Drawer: `position:sticky; top:80px; max-height:calc(100vh - 100px);
  overflow-y:auto; overscroll-behavior:contain`. Notes scroll inside the
  paper; the page stays where it is.
- Lit paths: `--ox-hi` at 3px (was `--ox` at 2.2px); lit nodes filled
  `--ox`. Unrelated edges dim to .22 and nodes to .28 (were .35).
- Plate height: on ≥900px the viewBox is 1080×1210 (aspect 1/1.12) with the
  same map scale, so the plate gains 84px at the 1120px wrap (698 → 780px),
  and `max-height` is `calc(100vh - 120px)` instead of 80vh. Wheel and pinch
  keep the box's aspect.
- Handwriting: Caveat replaced by Kalam (the header aside) and Caveat Brush
  (ring names, "Start here"). Per-mark tilt (−7° to +4°), tracking and
  opacity vary; an SVG "chalk" filter roughens edges and knocks grain out of
  the fill; the header arrow is two overlaid irregular strokes through a
  displacement filter; the notes title underline is a drawn two-stroke SVG
  rather than a ruled box. Headings, node names, hints and resource text
  keep their fonts.
- Paper texture, pin, "Pick a node" card, stamp, colours: untouched.

**Verified:**
- `npm run build` green. Lighthouse desktop: accessibility 100,
  best-practices 100. No console errors.
- Desktop 1920×929: scrolled to 140px, click RAG → scrollY still 140, drawer
  top at 80px, drawer height 829px (= 100vh − 100), notes scroll internally.
  Keyboard: Tab reaches nodes, Enter opens with focus on the close button
  (oxblood focus ring on paper, bone ring on the map), Esc closes and clears
  the hash. `#tokens`, `#rag`, `#embeddings` on load open the right notes.
- Hover: lit path 3px `--ox-hi`, unrelated nodes at .28.
- 820px (iframe): map full width, notes as a centred modal sheet.
- 390px (iframe): no horizontal scroll, labels 25 units, Caveat Brush ring
  names, controls bar above the plate, sheet full screen on tap.
- Reduced motion: the global rule kills every transition; the learn block
  also removes the decorative tilts under it.
- Fonts: Kalam and Caveat Brush load from the existing Google Fonts link.

**Note:** the drawn underline is a CSS data-URI SVG, which cannot read
`var(--ox)`, so it carries the oxblood value `#7A2229` literally (the same
value as the token). No new colour.

**Half-done:** nothing.

**Needs the owner:** unchanged from the previous note (41 edges; text-list
fallback; phone inner-ring label overlap at the starting zoom).

**Next:** Tool 3 per `docs/ROADMAP.md`.

## 2026-09-04 — Learning Map restyled: Batcave builder's field notes

**Shipped:** `/tools/learn/` rebuilt to the field-notes mockup, on the same
data, map, dialogs and behaviour. Eyebrow "FIELD NOTES / 01" above the title;
a handwritten aside ("Start with the foundations. Build your way out.") with a
drawn arrow; the map as a blueprint plate (subtle grid, paper-grain noise,
corner marks, graphite ring guides with a pencil wobble filter, handwritten
ring names placed in a gap of each ring, a handwritten "Start here" arrow to
tokens, hollow graphite nodes, oxblood lit paths, a title-block stamp bottom
right and the zoom/pan controls bottom left). Desktop: map two thirds, and a
bone-paper drawer on the right (pinned, sticky) that shows an empty
"Pick a node" card until a node is selected, then that node's `<dialog>`
opened non-modally with `show()`. Phone/tablet (<900px): the same `<dialog>`
opens with `showModal()` as a sheet (full screen under 640px). Caveat added to
the font link for handwriting; used only for the aside, ring names and the
start arrow. Paper colours are the existing tokens (`--ink` paper, `--bg`
ink) plus `color-mix()` of the two; no new colour token, no new hex.

**Verified:**
- `npm run build` green. Lighthouse desktop: accessibility 100,
  best-practices 100. No console errors. No new hex in the diff.
- Desktop 1920: `#tokens` on load opens the drawer (non-modal), the empty
  card hides; × closes and clears the hash; Esc closes the drawer (own
  keydown handler, since non-modal dialogs do not close on Esc natively).
- Keyboard: Tab from "How we picked" reaches the nodes in order; the focused
  node shows a bone ring and an underlined label; Enter opens its drawer and
  focus moves into the dialog (close button first); Esc closes.
- Hover on Agents lights the path back to tokens in oxblood; the rest dims.
- 1280 (iframe): two-thirds / one-third grid, sticky drawer.
- 820 (iframe): map full width, `#rag` opens as a centred modal sheet.
- 390 (iframe): map edge to edge, controls bar above the plate, labels 22
  units, no horizontal scroll (`scrollWidth == 390`). An earlier full-bleed
  texture pseudo-element caused overflow; the texture now sits on `body`
  while the page is open.
- Reduced motion: the global `prefers-reduced-motion` rule already disables
  every transition; the learn block additionally removes the decorative
  rotations (aside, title underline, stamp) under it. Nothing animates
  otherwise.

**Decisions made:**
- Header kept exactly as it is (the mockup's TOOLS / ABOUT nav links have no
  pages behind them; not added).
- The lede is Archivo, not mono as drawn: the brief says mono is for
  metadata only.
- Resource type icons from the mockup are not drawn; the mono `type ·
  author · length` line carries the same information.
- "Start here" is pulled out as its own section at the top of the notes,
  above Papers / Watch / Read / Docs, matching the mockup.

**Half-done:** nothing.

**Needs the owner:**
- The mockup's mockup-only bits (the curled page corner, distressed title
  texture) were left out on purpose; say if you want them.
- Inner-ring labels still overlap a little on phones at the starting zoom.
- Still: confirm 41 edges (spec said 45); the text-list fallback question
  from the previous note stands.

**Next:** Tool 3 per `docs/ROADMAP.md`.

## 2026-09-04 — Learning Map: the map is the page, pop-ups instead of a list

**Shipped:** On the owner's instruction, nothing sits below the map any more.
Clicking a node opens a pop-up with that concept's explanation, prerequisites,
resources (grouped, start-here tag) and the catch. The pop-ups are native
`<dialog>` elements, one per concept plus one for "How we picked", rendered
server-side by `components/LearnDialogs.tsx`, so all 133 resource links and
every explanation are still in the static HTML. `components/LearnList.tsx` is
deleted. `LearnMap.tsx` now opens dialogs with `showModal()`, mirrors the open
dialog in the URL hash (`#rag` opens RAG on load; prerequisite links inside a
pop-up are plain `#id` links that switch pop-ups), closes on Esc, the × button
or a backdrop click, and clears the hash when closed. The map is full `.wrap`
width on desktop.

**Phone:** the map is shown at every width now (the spec's list fallback is
gone). Under 640px: the map bleeds edge to edge, starts zoomed 1.6× on the
centre, labels are 22 SVG units and dots r=7 so they read at 390px, the
hint/reset controls sit in a bar above the map instead of over it, one finger
pans, two fingers pinch-zoom about the midpoint, tap opens, and the pop-up is
a full-screen sheet with a 36px close button. `touch-action:none` on the SVG
so the page does not scroll while panning the map.

**Verified:**
- `npm run build` green; 32 `<dialog>` elements and 133 resource links in
  `out/tools/learn/index.html`; no list markup left.
- Desktop (1920): click on `agents` → `dialog-agents` open, hash `#agents`.
  Fresh load of `#rag` → RAG open. Clicking "Vector search" inside the RAG
  pop-up closes it and opens Vector search, hash follows. × button and backdrop
  click close and clear the hash and the selected node. No console errors.
- Phone (390px iframe): map visible, no horizontal scroll, labels 22px units,
  dots r=7, controls bar static above the map, tap on Agents opens a
  390×844 sheet, × closes and clears.
- No new colour hex in the diff.

**Two things found and fixed on the way:**
- `setPointerCapture` on pointerdown retargeted pointerup to the SVG, so a
  mouse click never reached the node link (the old panel version had the same
  bug; it was only ever tested with the keyboard). Capture now starts only once
  a drag exceeds 3px.
- The dialog `close` event was not observed reliably in Chrome 152 via the
  automation, so selection clearing watches the `open` attribute with a
  MutationObserver instead. Esc closing is native dialog behaviour; the
  automation tool's synthetic Esc was inconsistent and is not counted as
  verified either way.

**Half-done:** nothing.

**Needs the owner:**
- The spec's "list is the content" fallback is gone by request. The content
  is still server-rendered inside closed dialogs, which Google indexes but
  weighs less than visible text. If organic search matters for this page, say
  so and I will add a plain "all 31 as text" page at `/tools/learn/list/`.
- Inner-ring labels overlap a little on phones at the starting zoom (Embeddings /
  Attention / Fine-tuning). Pinch fixes it; a phone-specific angle set would
  fix it properly. Not done.
- Still: confirm 41 edges (spec said 45).

**Next:** Tool 3 per `docs/ROADMAP.md`.

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
