# Field Notes spec — how every written piece on buildunfiltered.com is made

Read this before adding a post. The design record for the section is the Lucius Fox
spec of 2026-09-03; this page is the standing rulebook. It is short on purpose.

## Where things live

    data/field-notes/<slug>.json     the post. Adding a post adds no code.
    public/field-notes/<slug>/*.jpg  its plates
    lib/fieldNotes.ts                loader, types, build-time invariants
    app/field-notes/[slug]/page.tsx  the one renderer
    app/field-notes/page.tsx         the index, newest first

URL: `/field-notes/<slug>/`. Expensive to change once shared. The Learning Map stays at
`/tools/learn/`; it is a tool, not a post.

## The post

Top level: `slug` (matches the filename), `kicker` (`FIELD NOTES / 03`), `title`, `dek`,
`summary` (the index card), `published`, `verified` (both `YYYY-MM-DD`, neither in the
future), `hand` (two or three short handwritten lines), `blocks`, optional `sources`.

## Block types — the complete set

| type | fields | surface |
|---|---|---|
| `prose` | `html` | dark, `--sans`, 68ch |
| `heading` | `text`, `level` 2 or 3 | Barlow Condensed, uppercase |
| `terminal` | `label`, `lines[] {kind: cmd\|comment\|out, text}` | dark block, `--mono` |
| `paper` | `title`, `label`, `html` | bone paper, pinned |
| `table` | `head[]`, `rows[][]` | dark, scrolls inside its box |
| `plate` | `src`, `alt`, `no`, `caption` | screenshot in a corner-marked frame |
| `figure` | `svg`, `caption` | inline SVG on the blueprint ground |
| `spec` | `rows[] {k, v}`, `stamp {label, date}` | the "performed on" strip |
| `steps` | `steps[] {n, text}` | a numbered sequence, no box: the number in `--mono` and `--ox`, the text in `--sans` |

Nine types. `steps` was added for post 03 because its argument is one message
travelling through a loop, read top to bottom; a table is a mapping you look up, and
would have been the wrong shape. Do not invent a tenth. A post that needs one is a
conversation, not a commit.

A `table` row whose cells after the first are all empty renders as a group label
spanning the row (post 03 splits free / capped / paid that way). Same data, no new type.

## Which surface

Dark ground carries the machine: commands, schematics, tables, output. Paper carries the
human warning: what will bite you, what to check, what to do when it breaks. Paper is
never used for ordinary prose because it looks nice. Paper means *this one matters*.

## HTML in a post

`html` fields, captions, step text and the `dek` take inline tags only: `strong em code
a b i`. Paper `html` may also use `p`. Links keep only `href`, and only `http(s)`, site-relative or `#`. The
build refuses anything else, and the renderer strips it again anyway. That habit is the
point: a JSON file is the easiest thing to paste something into carelessly.

Figure `svg` must start with `<svg`, and may not contain `<script>`, `on*=` attributes,
`javascript:`, `<foreignObject>`, or an `href` to `http` or `data:`. Colour inside the
SVG is `var(--…)` from the tokens below, never a literal.

## No new token

Everything the section needs is in `app/globals.css`, built for the Learning Map:
`.paper` and `--paper-*` (paper is `--ink`, ink-on-paper is `--bg`, softer tones are
`color-mix()` of the two), `.learn-pin`, `.learn-corner-*`, `.learn-stamp`, `--hand`
and `--hand-mark`, `--ox` / `--ox-hi`. **No new colour token, no new font.** The only
red is oxblood. If a design need appears that the tokens cannot express, stop and record
it under "Needs the owner" in `docs/STATUS.md`. Prove it after every change:

    git diff <base>..HEAD -- app/globals.css | grep -E '^\+' | grep -iE '#[0-9a-f]{3,8}\b|font-family:\s*"'

Both greps must come back empty.

## Plates: the privacy check

Every plate is a screenshot of the owner's machine. **Before a post ships, open every
image and look at it.** Email addresses, tokens, keys, client names, file paths that
name a private repo, a toast with an account name: any of these means the image does
not ship. Record the check, image by image, in `docs/STATUS.md`. One screenshot has
already been discarded for showing an email in a toast. This is the highest-risk step
in a post and it is not optional.

## Plates: the weight budget

**200,000 bytes of images per post, hard.** JPEG, at most 1400px wide, cropped to the
part that matters. Never a data URI. The build fails on a plate over 1400px, a plate
with no file on disk, or a post over budget. Widths and heights are read from the file
at build time, so never author them.

## What the build refuses

Unknown block type. Missing required field. `plate.src` with no file on disk, or outside
`/field-notes/<slug>/`. Duplicate slug, or a slug that does not match the filename.
`verified` or `published` in the future. Disallowed HTML. Unsafe SVG. Over-budget
images. A broken post must never render as a blank page.

## Deliberately absent

No tags, search, RSS, related posts, reading time, author box, comments, or newsletter
capture on a post page. RSS becomes worth it at roughly six posts; revisit then.

## Voice

Direct, specific, British spelling, short sentences, no hype. The post is edited before
it reaches the repo; the build fixes a typo and nothing more.
