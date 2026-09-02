# Research spec — how every factual entry on buildunfiltered.com is made

Check today's date before you start. Your training data is stale. Verify EVERYTHING by
web search — especially prices — at the vendor's own page.

This was written for the AI Tool Finder (five ranked tools per job). The shape below is that tool's; other tools define their own shape in the roadmap. The **hard rules** and **voice** sections apply to every tool on the site without exception.

## Output

Write the raw JSON object to the data file the roadmap names for the tool you are building.
No markdown fence, no commentary in the file.
Then move on. No summary needed.

## Shape

```json
{"status":"verified","last_verified":"<today, YYYY-MM-DD>",
 "question":"<sharp question in the reader's voice, ~20 words>",
 "method":{
   "how":"<what actually drove the ranking order. 2-4 sentences, specific to this job.>",
   "tested_on":"<what you did NOT do. Blunt. e.g. 'Not independently tested. Prices read from vendors' own pages on 2026-08-29.'>",
   "conflicts":"None. No affiliate links, no paid placements, no relationship with any tool listed.",
   "blind_note":"<name any independent benchmark you used. If none exists for this category, say so plainly and warn that search results here are dominated by vendors ranking themselves.>"},
 "ranked":[{"rank":1,"name":"","maker":"","url":"",
   "one_liner":"<max 12 words, opinionated>",
   "use_it_when":"<the specific situation this is the right answer for>",
   "cost":"<ONE line. e.g. 'Free tier. Paid $12-$76/mo.'>",
   "pricing_detail":"<full tier breakdown — only if there is genuinely more to say>",
   "good_at":"<what it genuinely beats the others at>",
   "the_catch":"<why someone regrets this pick on day three. MANDATORY. Must be real and specific.>",
   "wrong_for":"<who should skip it, and which of the others to use instead>"}],
 "also_considered":[{"name":"","why_not":"<one line>"}],
 "watch_list":["<what would reorder this list>"],
 "sources":[{"label":"","url":"<a URL you actually opened>"}]}
```

Exactly 5 in `ranked`. 3-6 in `also_considered`. 2-6 in `watch_list`.

## Hard rules

1. **Never invent** a tool, price, feature or limit. If you cannot read a price at
   source, write "check current pricing" and say so in `the_catch`. Refusing to
   quote an unreadable number is the whole point of this site.
2. **Exclude anything being discontinued** and say so in `also_considered`.
3. **`the_catch` is mandatory and must be real.** If you can't name a genuine
   drawback, you don't know the tool well enough — research more or drop it.
4. **Hunt the traps a buyer only finds later**: quotas billed annually but shown
   monthly, credits that don't roll over, the advertised feature gated one tier
   above the advertised price, licences that forbid commercial use, regional
   restrictions, per-seat pricing presented as per-account, free tiers that only
   demo.
5. **Attribute every performance claim.** "Vendor claims X" is honest; stating X
   as fact is not.
6. **If the honest answer is that nothing in this category works well yet, say
   that** in `method.how` and rank what exists anyway, with the weakness stated.
7. Where relevant, cover the spread: at least one genuinely free option and, where
   it exists, one self-hostable/open option for people whose data can't leave
   their infrastructure. Check open licences — free to download is not free to use
   commercially.

## Voice

Direct, specific, British-leaning spelling. Short sentences. No marketing
language, no hedging, no "in today's fast-paced world". Assume the reader is a
competent builder in a hurry who will resent being sold to.
