# Phone sign-in — setup

The site stays a static export. Sign-in runs entirely in the browser against a
Supabase project: phone number in, six-digit SMS code back, no password. New
numbers become accounts and get the next codename from `data/codenames.json`;
first time in, the account is asked for an email. Nothing on the site is gated.

## One-time setup (owner, about ten minutes)

1. Create a Supabase project (free tier is fine).
2. Authentication → Providers → **Phone**: enable it and pick an SMS provider
   (Twilio, MessageBird, Textlocal or Vonage). Paste that provider's keys into
   Supabase, never into this repo. The provider bills per SMS; check its
   pricing for India before switching on.
3. Authentication → Rate limits: keep the defaults (they cap OTP sends per
   number and per IP).
4. SQL editor → New query → paste `supabase/schema.sql` → Run. It creates
   `profiles`, `codenames`, the trigger that hands out names, and the
   row-level security that keeps one account from reading another.
5. Project settings → API: copy the **Project URL** and the **anon public**
   key into:
   - `.env.local` for local builds (copy `.env.example`), and
   - Cloudflare Pages → Settings → Environment variables (production and
     preview). Then redeploy. The values are inlined at build time.
6. Authentication → URL configuration: set the Site URL to
   `https://buildunfiltered.com`.

## What is stored

| Where | What | Who can read it |
|---|---|---|
| `auth.users` (Supabase) | phone, session tokens | Supabase only |
| `public.profiles` | codename, phone, email | the owner of the row |
| `public.codenames` | the ordered list and who claimed each | nobody from the browser |

The anon key is public by design; it only lets a browser do what row-level
security allows. There is no service key anywhere in this repo.

## Regenerating the codename block

`supabase/schema.sql` embeds `data/codenames.json`. After editing the JSON,
regenerate the file (the block is the last statement) and re-run it in the
SQL editor; it upserts by position, so claimed names keep their owners.

## Not done yet

- No way to change a codename, and no display of codenames anywhere public.
- Email is stored on the profile only; it is not verified.
- No account deletion from the site; do it from the Supabase dashboard.
