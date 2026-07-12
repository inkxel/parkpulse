# ParkUsher — prior-art investigation

Flagged by [city-hub-scan.md](city-hub-scan.md) as "the single closest analog to CURB/sweep.la found anywhere in the scan" — live in 7 cities including two of Chalked's own candidates (Seattle, SF). This file gives it the same direct, dedicated look CURB got in [cities/san-francisco.md](cities/san-francisco.md).

**Site access note:** `www.parkusher.app` returned HTTP 403 to every fetch attempt during this investigation (homepage, `/about`, `/contact`, `/locations/boston`, blog posts, both via WebFetch and via a direct `curl` through the sandboxed egress proxy) — consistent with Cloudflare/bot-blocking rather than a policy denial (the proxy's own status log shows the CONNECT being rejected upstream, not by org policy). No direct "view source" or network-request inspection was possible. Everything below is reconstructed from search-engine snippets, app store listings, press coverage, and third-party writeups — treat specifics (exact UI copy, exact city list on any given page) as slightly lower-confidence than a direct fetch would give.

## Is it open source?

**No.** No GitHub repo, org, or any open-source release found under "ParkUsher" or `parkusher` — checked directly, and it doesn't surface in any "open source parking app" search either. It's a closed commercial product: native iOS ([App Store](https://apps.apple.com/us/app/parkusher-find-parking-easily/id6454831202)) and Android ([Google Play](https://play.google.com/store/apps/details?id=app.parkusher)) apps plus a marketing/blog website, no public API, no data downloads.

No tech-stack details are independently confirmed (see access note above — no view-source, no network tab). No engineering blog, no public job postings naming a stack. Nothing to build on technically; this is a black box from outside.

## Data sourcing — not open-data-pipeline, looks substantially manual/crowdsourced

This is the most consequential finding. There's no public claim of ingesting official open-data portals (no mention of DataSF, NYC Open Data, Seattle's GIS feeds, etc., anywhere in ParkUsher's own material or in coverage of it). What evidence exists points the other way:

- App Store reviews (per search-engine summaries of the review page) report **streets not filled in and inaccurate data**, specifically called out for NYC's Upper East Side.
- Co-founder "Ali" [Alireza Ziarizi]'s own response to that feedback: the team has an in-app report button, and **the co-founders are personally walking NYC streets to test the map against reality**, with two "big updates" planned including better search.

That's the signature of a small team doing manual mapping + user-reported corrections, not a pipeline built on top of city open-data feeds the way CURB is built on DataSF/Socrata. It may blend in official sources for the underlying rules (their per-city blog posts, e.g. the [SF street parking guide](https://www.parkusher.app/blog-posts/san-francisco-street-parking-guide), read like they're summarizing SFMTA's own published rules — RPP zones, the 72-hour rule, curb colors, $1–$13/hr meter range), but nothing found confirms an automated, continuously-refreshed feed from any city's official dataset. Freshness and coverage-completeness are asserted ("continuously updated") but not evidenced.

## Category coverage — real, but gated and city-by-city uneven

Per the marketing site and store listings, the live map shows:
- **Free tier:** street cleaning/sweeping times, permit zones (RPP/RPZ), general time-restricted areas, plus an AI camera sign-scanner (free, unlimited scans) that reads a posted sign and gives a plain-language yes/no.
- **ParkUsher Pro (paid subscription):** metered/paid-parking layer (the "blue lines" showing priced and live meters), plus the ability to check rules *in advance* rather than only "can I park here right now."

So sweeping and permits are the free/core product; **meters are a paywalled upsell**, and the free map is explicitly framed as "right now" status rather than a browsable schedule — a materially different product shape than Chalked's "look up any day/time, any city" ambition.

Coverage is confirmed **uneven across the 7 cities**, not uniform depth:
- Boston, Toronto, NYC have broad-sounding coverage cited by neighborhood (Boston: Beacon Hill, Fenway, Back Bay, etc.; NYC: all 5 boroughs plus named neighborhoods).
- **Vancouver — the newest city — is explicitly partial**: currently limited to downtown/BC Place (per [Vancouver Is Awesome's coverage](https://www.vancouverisawesome.com/local-news/oh-great-another-parking-app-parkusher-says-its-fixing-what-others-miss-12338962), tied to 2026 FIFA World Cup matches at BC Place), with Kitsilano cited as the next neighborhood to be added on the way to eventual full Metro Vancouver coverage.
- No per-city breakdown found of which of sweeping/meters/permits is actually populated where — the NYC review complaint above suggests even a launched city can have real gaps ("streets not filled in").

7 cities total, as of 2026: Montreal, New York, Seattle, Boston, Toronto, San Francisco, Vancouver.

## Company / team — tiny, pre-seed, student-founded

- Founded 2023 in Montreal by **Alireza Ziarizi** (CEO), a Concordia University software-engineering student, with co-founders **Rayan Moarkech** (CTO), **Lujain Khalaf** (Co-CEO), and **Sevag Eordkian**.
- Launched publicly at **Web Summit Lisbon, Nov 13–16, 2023** ([press release](https://webdev-media-library.s3-accelerate.amazonaws.com/websummit/2323/11/ParkUsher-Press-Release-WebSummit-2023.pdf)).
- Funding: one **pre-seed round** (per [Crunchbase](https://www.crunchbase.com/organization/parkusher)), reported total raised **~$22,400** — effectively unfunded by startup standards, not venture-backed in any real sense. (Tracxn separately shows no funding rounds at all, i.e. even the modest number above isn't universally confirmed.)
- Team size: **3–6 people** across sources (LinkedIn/RocketReach/ZoomInfo disagree slightly), including at least one software-engineering intern. This is a very small team covering 7 cities.
- No evidence of acquisition, shutdown, or major new funding since the 2023 launch; Vancouver (2026) is the most recent city add, suggesting it's still actively expanding, just slowly and thinly.

## Bottom line: doesn't change the plan — confirms the gap is still real

ParkUsher is real prior art and genuinely the closest thing to CURB/sweep.la found at multi-city scale — it's the only tool in the whole 29-city scan attempting sweeping + permits (+ paywalled meters) as a real-time layered map across more than one city. But on direct inspection it doesn't function as a reason to deprioritize Seattle or SF the way CURB deprioritized SF on its own:

- **Not open source, no API, no data to build on or around** — unlike CURB, there's nothing here for Chalked to point users to as "already solved, go use this instead," and nothing to adopt technique-wise (no equivalent of CURB's GPS-matched-citation trick is claimed or evidenced).
- **Closed/paywalled by design** — meters sit behind a subscription; the free product is a live "yes/no right now" status map, not a browsable schedule. That's a different product than what Chalked is building (an open, browsable, linkable rules map), even in cities where ParkUsher is present.
- **Small, thin team; data quality self-reported as shaky** — a 3–6-person pre-seed team manually walking streets to fix bad data is not "solved," it's "attempted, imperfectly, by hand." That's the opposite signal from CURB's ~1M-citation, GPS-matched, publicly-documented dataset.
- **Coverage is visibly uneven even within its own 7 cities** (Vancouver's partial rollout, NYC's reported gaps) — this is evidence *for* Chalked's thesis (comprehensive city-specific coverage is hard and rare) more than evidence the niche is filled.

Net effect on prioritization: Seattle and SF both stay viable Chalked candidates. SF still has CURB as the actual reason to deprioritize it (per san-francisco.md) — ParkUsher doesn't add a second reason, since it's shallower and closed. Seattle has no CURB-equivalent; ParkUsher's presence there is a data point worth knowing (a commercial competitor exists) but not a blocker — a comprehensive, open, schedule-browsable, citation-backed Chalked adapter for Seattle would still be a strictly better artifact than what ParkUsher currently offers there.
