# build.unfiltered

Static site. `next build` writes plain HTML to `out/` — no server, no database,
free to host, and every job is a real URL Google can index.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # writes out/
```

## The only two files that matter

| File | What it is |
|---|---|
| `data/jobs.json` | The 50 jobs. Changing this changes the site's structure and its URLs. |
| `data/picks.json` | The rankings. This is what you edit weekly. |

Everything in `app/` and `components/` is a renderer over those two. To add a
ranking, add one keyed entry to `picks.json` and rebuild — the job page fills in
and the homepage badge flips from "not reviewed" to "5 picks" on its own.

## URLs are permanent

A job's id (`images.text-to-image`) becomes its URL (`/for/images/text-to-image/`).
Once a page has been indexed or linked, **renaming that id breaks it.** If a job's
framing turns out wrong, add a new id and redirect the old one. Don't rename.

## Adding a ranking

Copy the shape of the existing entry in `picks.json`. Every entry needs:

- `last_verified` — a real date. It is rendered on the page. Never fake it.
- `method.conflicts` — declare affiliate links here if you ever add them, and make
  sure the ranking survives without them. Ranking by payout is how every other
  directory became worthless.
- `the_catch` on each tool — the reason someone would regret this pick. If you
  can't name one, you haven't used the tool enough to rank it.

A job with no entry renders an honest "not reviewed yet" page. That is a feature.
Leave it rather than guessing.

## Newsletter

Hidden until you set `newsletterAction` in `site.config.ts` to your provider's
form endpoint (Kit, Buttondown, whatever). A form that drops addresses is worse
than no form.

## Deploy

Cloudflare Pages or Vercel, free tier, both fine:

- Build command: `npm run build`
- Output directory: `out`
- Point `buildunfiltered.com` at it in the dashboard

Then submit `https://buildunfiltered.com/sitemap.xml` in Google Search Console.
Nothing gets indexed until you do, and indexing is the entire distribution plan.

## When tool #2 arrives

Move this tool's homepage to `/tools/ai-finder`, make `/` a hub listing both, and
add a redirect from `/` to nothing — the job pages at `/for/...` don't move, so
none of the SEO is lost.
