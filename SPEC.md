# Chalked — Spec

## Concept
Address or pin in, full street-parking picture out: street sweeping schedule, time limits, meters (including whether they're free on weekends/evenings), and permit-parking zone status. A break-in/vehicle-crime-risk layer is **paused, not committed** — see [ETHICS.md](ETHICS.md) and [Discussion #1](https://github.com/inkxel/chalked/discussions/1) — the harm/bias risk of a naive crime overlay is real enough that it shouldn't ship without community input first.

**The mission is bigger than the tool.** As much as being useful day-to-day, Chalked exists to make the fragmentation itself visible — every correction in this spec (LA's sweeping and permit data both existing but hidden behind undocumented ArcGIS dashboards, a decade-old "annual" dataset that was never actually refreshed) is a small, concrete demonstration of why a real national curb-data standard is overdue. This isn't just a human convenience problem anymore, either: autonomous vehicles need to know where they can and can't park, and when that data is stale or wrong, the failure shows up in the real world — see "Why this project exists" in the README.

## Research finding, up front: no national standard exists
Researched before writing any of the rest of this spec, because the premise ("this info must be publicly available") needed a real answer, not an assumption.

**No consumer-facing national data format for curb/parking regulation exists.** The closest attempt, **CurbLR** (Coord/SharedStreets, ~2019), is the right idea — human-readable, linear-referenced curb regulation data — but it's stalled: last code commit July 2024, no registry of live city adoptions, only demo conversions (Portland, part of LA). **SharedStreets**, the geometry layer under it, is more stalled (last push Feb 2023). The one actively-maintained standard today, the **Open Mobility Foundation's Curb Data Specification (CDS)**, is real and current, built for B2B curb management (dockless vehicles, loading-zone occupancy between cities and mobility operators). **Checked directly and closed out (2026-07-06):** confirmed scoped to small downtown loading-zone/micromobility pilots in every city checked (LA, Seattle, DC) — no sweeping or permit data, no open public feed. See "National vendor/standard landscape" below.

**Conclusion: every city is its own integration.** No shortcut around that.

## The real city-by-city data landscape
All confirmed via each city's own open-data portal (Socrata or ArcGIS Open Data — structured, queryable, no PDFs needed where marked open). Every city has at least one gap — the schema needs to tolerate missing categories per city, not assume parity.

| City | Sweeping | Meters | Permit zones | Crime data | Notes |
|---|---|---|---|---|---|
| **San Francisco** | ✅ open | ✅ open (+ rate schedules) | ✅ open (RPP eligibility parcels) | ✅ open | Only city confirmed 4-for-4 — the obvious first launch city |
| **Chicago** | ✅ open | ❌ gap | ✅ open | ✅ open | Meters run by a private concessionaire (Chicago Parking Meters LLC), no open API — historically scraped |
| **NYC** | Folded into regs | ✅ open (richest reg + meter data of any city) | ❌ no real permit-zone model | ✅ open | Uses alternate-side-parking instead of a sweeping program; no citywide RPP like SF/DC/Chicago |
| **Los Angeles** | ✅ open — corrected 2026-07-05 | ✅ open (best-documented meter dataset anywhere) | ⚠️ open but stale — corrected 2026-07-05 | ✅ open | Sweeping: real, unauthenticated ArcGIS Feature Service, official LA Bureau of Street Services, actively edited — see correction below. Permits: real dataset (`LADOT_PPD`, Socrata `s3st-6nwi`), polygon geometry + district number/name — but **not updated since 2015-08-13** despite a claimed "annual" refresh commitment. Real data, real staleness risk — see correction below. |
| **Seattle** | ❌ unconfirmed | ✅ open (unusually rich — historical paid-occupancy by block-minute since 2012) | ✅ open (RPZ) | ✅ open | |
| **Washington DC** | N/A — different regime | ⚠️ unconfirmed | ✅ open | ✅ open | No sweeping program at all — snow-emergency/leaf-season rules instead |
| **Boston** | ⚠️ unconfirmed | ✅ open | ⚠️ unconfirmed | — | |

**No aggregator exists today that indexes multiple cities' open parking data in one place.** That gap — not any single data source — is the actual new value here.

### Break-in / vehicle-crime data
Real and geocoded in every major city checked (SF, LA, NYC, Chicago all publish it via Socrata), but "break-in" isn't a clean category anywhere — it's folded into broader theft-from-vehicle/larceny/burglary codes. Building the risk overlay means filtering broad crime-code taxonomies per city, not reading a purpose-built flag.

### OpenStreetMap as a baseline layer — considered and rejected as primary source
OSM has real tagging conventions (`parking:lane=*`, `parking:condition=*`), but coverage for on-street parking specifically is thin and inconsistent. Telling data point: **SpotAngels** (a funded commercial competitor) tried building on city open data + OSM and found both insufficient — they pivoted to a Waze-style crowdsourced model layered on an OSM basemap. If a resourced company concluded OSM tagging alone isn't reliable enough, that's a real ceiling for this project too, not a niche complaint. OSM can be a basemap, not a regulation source.

## Prior art
- **Commercial space is split by function, not overlapping this idea directly:** ParkMobile/PayByPhone = meter payment only. SpotHero/ParkWhiz/BestParking = garage/lot booking, not street parking.
- **SpotAngels is the real closest multi-city analog** — sweeping + meters + permit zones + crowdsourced rules across ~200 cities — but proprietary, closed-data, and doesn't do break-in risk at all.
- **The actual gap:** nobody combines regulation data with a crime-risk overlay, and no multi-city aggregator is open source.
- **[San Francisco](research/cities/san-francisco.md)** — already excellently solved by CURB (curb.guide), open source. Deliberately not a Chalked launch candidate as a result — see First adapters to build.
- **[Los Angeles](research/cities/los-angeles.md)** — sweeping and permits both real and queryable, found via the **[dashboard-tracing method](research/dashboard-tracing-method.md)** (worth applying to Chicago/Seattle's remaining gaps before trusting them); permits carries a real staleness caveat (not updated since 2015). Includes sweep.la regional context (LA + 4 neighboring cities, aggregated, not confirmed open source).

Full findings, sources, and the reusable method live in `research/` — this section is the summary.

## National vendor/standard landscape: is there a shortcut at the vendor layer?

Short answer: no free shortcut exists — every major meter/permit/citation vendor gates its data behind a commercial relationship, not a self-serve API, and real-time spot occupancy doesn't meaningfully exist nationally (the SFpark sensor era never really returned at scale). **The one lead worth chasing (CDS) has been checked directly and closed out (2026-07-06):** confirmed scoped to small downtown loading-zone/micromobility pilots in LA, Seattle, and DC — no shortcut for sweeping or permit data anywhere. The per-city adapter approach already in use is confirmed as the right path. Full research, vendor-by-vendor, in **[research/national-vendor-landscape.md](research/national-vendor-landscape.md)**.

A broader 29-city discovery scan (2026-07-06, see **[research/city-hub-scan.md](research/city-hub-scan.md)**) confirmed the core niche is real: no city outside LA/SF has a comprehensive independent aggregator, meter vendors cluster into a handful of players (ParkMobile and Flowbird dominant), and — the sharpest finding — street sweeping is almost universally split from meters/permits by department, regardless of region, which is itself strong evidence for the standardization-advocacy framing in the README. One closest-analog prior-art tool surfaced (ParkUsher, multi-city) worth investigating directly, and one strong new adapter candidate (San Diego, confirmed real open sweeping dataset).

## Architecture reframe (2026-07-05): national map shell from day one, not sequential launch cities

Tucker's proposal, and it holds up: instead of picking cities to launch in sequence, build a **full national map on day one**, with per-region coverage status shown honestly — the way Zillow/Redfin show a nationwide map with "estimate not available" or grayed states for low-data areas rather than only showing markets they've fully built out. Unsupported regions get a visible "not covered yet — help us add this" link to the repo's contribution guide.

**Why this is buildable, not just a nice idea:** the hard, patchy part is the parking-*regulation* data — but the part needed to show a national map at all (knowing what jurisdiction any point falls in, and drawing city/county boundaries) is a **solved, complete, free, uniform national dataset already**: US Census **TIGER/Line** (or Cartographic Boundary) files cover every incorporated place and county in the country, no fragmentation, no per-city integration needed. The shell doesn't wait on data coverage — only the content *inside* each jurisdiction does.

**What this changes:**
- **No more "pick a launch city" debate.** Every place is on the map from day one with an honest status. Which jurisdiction gets a real adapter next becomes community-driven — whoever cares enough to contribute one — not something Tucker has to rank and decide alone.
- **Coverage becomes the primary growth loop, not a launch strategy.** Someone searches their own address, sees "not supported yet," and gets routed straight to "here's how to add it" — the highest-intent moment to recruit a contributor, the same pattern OpenStreetMap and Wikipedia both lean on.
- **A coverage registry is now a first-class data structure**, not an afterthought: per jurisdiction, a status (`supported` / `unsupported`, maybe `in-progress`), and which categories (sweeping/meters/permits/crime) that jurisdiction actually has built, since partial coverage (e.g. Chicago minus meters) is the normal case, not an edge case.
- **The per-city adapter work (LA, Chicago, etc. — see below) becomes the first contributions**, proving out the adapter interface and the CONTRIBUTING guide, rather than "the v1 launch." Tucker building the first one or two is what makes the "help us add yours" ask credible.

## Architecture (draft)
Given the "every city is its own integration" finding plus the national-shell reframe above, the shape is: **a national map + coverage registry that exists independent of data, with pluggable per-jurisdiction adapters behind a common schema** — CurbLR's original intent, DIY'd, wrapped in a Zillow/Redfin-style coverage map instead of waiting on city-side adoption of a standard that stalled.

- **National base layer** — US Census TIGER/Line (or Cartographic Boundary) files for every incorporated place + county. Solved, uniform, complete, no per-city work required. This is what makes the map itself national on day one.
- **Coverage registry** — per jurisdiction: `supported` / `unsupported` (/ `in-progress`), plus which categories (sweeping/meters/permits/crime) are actually built for it. Partial coverage is the normal case, not an edge case — the registry needs to represent "Chicago minus meters," not just a binary yes/no.
- **Common schema** — one normalized representation for sweeping schedule, meter rules (including free periods), permit-zone status, and crime-risk overlay, with every field nullable per category, plus a **"data as of" timestamp per category** (not just per adapter) — LA's permit data is real but frozen since 2015, and the schema needs to carry that honestly rather than presenting stale data with the same confidence as fresh data.
- **Per-jurisdiction adapter** — one ingestion module per city/county, each mapping that place's actual open-data quirks (Socrata vs. ArcGIS, different field names, different update cadences — including tracing hidden ArcGIS dashboards back to their feature services, per the LA finding) into the common schema. This is most of the real engineering work, ongoing maintenance — portals change schemas without warning — and, going forward, the thing community contributors do.
- **Crime-risk layer** — separate from the regulation data proper; filters each jurisdiction's broad crime-code taxonomy down to vehicle-break-in-relevant categories, then aggregates to a density/risk signal (not raw incident pins — avoids the product feeling like a crime map).
- **Lookup** — address/pin in, resolve jurisdiction via the national base layer, check the coverage registry, either return the combined read (supported) or show the honest "not yet covered — help us add it" state linking to the contribution guide (unsupported).
- **No OSM dependency for regulation data** — OSM (if used at all) is a basemap layer only, per the earlier finding.

## Platform sequencing (2026-07-05)

**Web app first, deliberately — mobile is a later-phase goal, not a v1 target.** Matches CURB's own proven sequencing (PWA first, a native iOS wrapper added later once the core product was solid, not built alongside it). No reason to take on native-app complexity before the web version has proven the data model and found real users.

## Visual design: color-coded parking status (2026-07-05)

Visual inspiration: **onX Offroad** — color-coded trails by difficulty, plus BLM-land-based camping legality, both at a glance on a map you're actively navigating in the physical world. Same interaction shape as this project: "what's my status here, right now, without having to read anything."

**One primary color axis, not one color scale for everything.** Sweeping, meters, and permits are different *kinds* of questions, not different values on the same scale, and shouldn't share one color key:

- **Sweeping — the primary temporal axis.** 🟢 clear now (and not imminent) / 🟡 clear now, but a restriction starts soon / 🔴 restricted right now. This is the one with a genuine ticking clock, closest to onX's single-glance read. **Already proven, not a new idea** — this is CURB's own design language verbatim (`--green clear / --amber soon / --red now`), independently arrived at here too.
- **Meters — a cost question, not a restriction.** Paying for a spot you haven't paid for isn't illegal, so folding it into red/green would state something false. Needs its own visual treatment (icon/badge), not a slot on the sweeping color scale.
- **Permits — an eligibility gate, not a timing question.** The app usually can't know whether *this specific user* holds the right permit for *this specific zone*, so it's a flag ("permit zone — do you have one?"), not a temporal color. CURB reaches the same conclusion architecturally with a distinct `--meter permit-blue`, separate from its green/amber/red.
- **Gray is already reserved** (coverage registry, above) for "this jurisdiction isn't covered at all." A block in a *covered* jurisdiction where one specific field is stale or uncertain needs a different treatment — a hatch pattern or a lighter shade of the relevant category's color, not solid gray — so "no data" and "data exists, treat with some skepticism" don't visually collapse into the same thing.
- **Amber/yellow threshold is a tunable parameter, not a hardcoded constant.** ~2 hours is a reasonable starting point for sweeping, but different rule types may warrant different lead times — don't bake in one number everywhere.

## Trust, error reporting & disclaimer

Three related pieces, all Tucker's additions (2026-07-05), all load-bearing for a project that tells people where they can legally park.

### Per-category confidence, shown to the user — not just in the schema
The "data as of" timestamp (above) isn't only a backend field — it needs to surface as an actual visible confidence signal per category, e.g. "Sweeping: current" vs. "Permits: data from 2015, may be outdated." Silent staleness is worse than no data at all, because it reads as confident when it isn't. LA's permit dataset is the concrete case that forced this: real data, but a decade stale, and a user needs to see that distinction before trusting it over a posted sign.

### User-reported errors, Google-Maps-style, auto-routed to GitHub Issues
When Chalked shows something wrong — says a block is clear when the posted sign says otherwise — a user should be able to flag it inline, the way Google Maps lets you report a map error. The report (location, category, what they observed, ideally a photo of the sign) should auto-file as a GitHub issue on this repo, labeled by jurisdiction + category (e.g. `data-issue`, `city:los-angeles`, `category:permits` — a distinct label family from the `epic`/`ready`/`blocked` planning labels, so data-quality reports and build-planning issues don't collide in the tracker) so maintainers can triage per city. This turns user friction directly into a public, trackable data-quality record — and doubles as evidence for the "this needs a standard" argument, since a visible backlog of "wrong here" reports across cities makes the fragmentation case better than any essay would.

**Open design requirement, not yet solved:** auto-filing anonymous user input as public GitHub issues is a real spam/abuse vector. Needs at least basic rate-limiting or a lightweight moderation/staging step before reports go public — do not ship the naive "instant direct post" version without one.

### Disclaimer — heavy, upfront, non-negotiable
The site is informational only. Not responsible for citations, towing, or any consequence of relying on it. Users must always defer to posted physical signage over anything Chalked shows — the same posture CURB takes ("the posted sign is always the source of truth"), and necessary here for the same reason: this is inferred/aggregated public data, not a legal guarantee. Needs to be prominent (not buried in a footer link) — a first-run notice or persistent banner, not just a ToS page nobody reads.

## Beyond open data: unsigned, code-only rules

The Walnut, CA case — a citywide overnight-permit rule with **no signage anywhere** — showed that "always defer to the posted sign" doesn't cover every real rule. Full write-up, including how to actually find these without scraping every municipal code in the country up front, in **[research/municipal-code-hosting.md](research/municipal-code-hosting.md)**.

**Schema implication:** the common schema needs a rule type that isn't tied to a block or zone at all — a **jurisdiction-wide default rule** (e.g. "overnight parking anywhere in city limits requires a permit, no exceptions"), layered *underneath* the block-specific sweeping/meter/permit-zone data most of this spec has been about. A city can have both at once — specific signed zones *and* an invisible blanket default.

## First adapters to build (not "launch cities" — the map covers everywhere from day one)
These are the first few jurisdictions worth building real adapters for, to prove the schema and seed the coverage map with real data — not a sequential rollout plan, since every place is already visible on the national map regardless.

**San Francisco is deliberately not one of them** (2026-07-05) — CURB (curb.guide) already covers it exceptionally well, open source, actively maintained. Rebuilding it would be pure duplication; Chalked either shows SF as covered-by-a-linked-external-tool, or treats CURB's approach as a reference adapter rather than building one from scratch.

### Prioritization: data availability × population (soft weighting, not a hard cutoff)
Data completeness alone isn't the whole story — a jurisdiction with clean data but few residents and light enforcement delivers less real value than a bigger, more aggressively-enforced one, even with a messier data gap. Population is a reasonable proxy for both "how many people this actually helps" and "how likely enforcement is real and worth tracking" (a city under ~10K residents plausibly has parking rules on the books that rarely get enforced; a city over ~500K almost certainly has a dedicated enforcement operation). Soft signal, not a strict cutoff — small towns aren't excluded from the map, just weighted lower for *which adapter to build next*.

Convenient synergy: the same Census TIGER/Line source providing the national boundary layer also publishes population estimates for those same places — this ranking factor doesn't need a separate data source.

Ranked by combined open-data coverage among jurisdictions with no comparable *open-source* tool, each with its known gap, population noted (rounded, city proper) since it now matters to the call. **Re-check "unconfirmed" gaps via the [dashboard-tracing method](research/dashboard-tracing-method.md) before trusting them** — LA's sweeping and permit gaps both turned out to be wrong when actually checked.
1. **Los Angeles** (~3.9M) — the strongest combined candidate: real population *and* the most complete data. Sweeping (fresh, actively edited), meters (best-documented dataset of any city), crime (open), permits (open, real, but frozen since 2015 — disclose the staleness, don't hide it). sweep.la already covers LA + 4 neighbors but isn't confirmed open source — a real, open Chalked adapter for LA still has a clear reason to exist.
2. **NYC** (~8.3M) — by far the largest population of any candidate, and the richest regulation + meter data of any city — but no permit-zone model to speak of, and a genuinely different rule shape (alternate-side parking, not sweeping) that's more architectural work than a drop-in adapter. Worth weighing seriously despite the gap, given the population is more than double LA's — NYC's alternate-side enforcement is also famously aggressive (real, high-volume citation activity), which is exactly the enforcement-intensity signal population is a proxy for.
3. **Chicago** (~2.7M) — strong on sweeping/permits/crime; meters is the one real hole (private concessionaire, no open API — would need a scraper or an explicit "meters unknown here" state). No CURB/sweep.la-equivalent found — genuine open territory, but re-check before committing given the LA misses.
4. **Seattle** (~750K) — strong on meters/permits/crime; sweeping schedule not yet confirmed open — but given LA's misses, worth checking for a hidden ArcGIS dashboard before concluding it's actually absent.
5. **Washington DC** (~670K) — solid permits + crime, but an entirely different seasonal-rule regime (snow/leaf season, no sweeping program) and the smallest population of the group.

**Read:** LA is the clean pick — high population, most complete data. NYC is the real judgment call — the highest population and enforcement-intensity signal by far, worth the extra architectural work the missing permit model and different rule shape demand, rather than defaulting to whichever jurisdiction merely has the tidiest data.

## Data pipeline: from research to a live, self-updating site

Plain-English version of how everything in `research/` actually becomes something the site shows, and stays current without turning into another stale dataset itself.

- **Adapter** — one small translator per city per category. Its only job: fetch that city's data from wherever it actually lives (an ArcGIS Feature Service, a Socrata API, whatever the research found), and convert it into Chalked's own common schema. LA's fields (`Posted_Day`, `Posted_Time`, `Odd_Even`) become Chalked's own generic fields — nothing downstream needs to know any one city's particular naming.
- **Sync job** — a scheduled re-run of each adapter (daily/weekly) that refreshes Chalked's own stored copy. This is the real mechanism behind "keep it up to date where an API exists" — but it's only as fresh as the *source* allows, and LA's own two categories show the honest range: sweeping is a live, actively-edited service, so the sync job keeps it genuinely current with zero human involvement; permits is a real dataset frozen since 2015, so the sync job just keeps faithfully confirming "still 2015" — automation can't manufacture freshness the source doesn't have, only report the lack of it honestly (this is what the per-category confidence/staleness badge, above, is actually for). Jurisdiction-wide unsigned rules (the Walnut case) have no API to sync at all — those only get re-checked when the error-reporting pipeline surfaces a reason to look.
- **Database** — Chalked's own single normalized store of everything every adapter has produced, each record stamped with its last successful sync time. The live site never queries a city's own servers directly (too slow, too many shapes) — only this one common store.
- **Site** — address/pin in → resolve jurisdiction via the Census boundary layer → check the coverage registry → if supported, read that spot's already-synced record and render the color/status logic (above) → if not, show the honest "not covered yet, help us add it" state.

**Sequencing implication:** this pipeline doesn't need to exist for all four categories or all five candidate cities before it's useful. A thin vertical slice — national boundary layer, coverage registry showing one real city, one real adapter (LA sweeping), basic lookup, sweeping's green/amber/red status only — validates the whole shape end to end. Meters, permits, crime, more cities, and the error-report pipeline all layer on afterward, once something real exists to build against.

## Open questions
- What does the "not covered yet" state actually look like — gray fill only, or a lighter hint of jurisdiction-level metadata (population, at least the boundary) even with zero regulation data? Zillow-style "estimate not available" implies some baseline info is still shown.
- What does the contribution guide need to teach a newcomer to build a real adapter — at minimum, the [dashboard-tracing method](research/dashboard-tracing-method.md), the common schema, and a worked example (the SF or LA adapter, once built).
- Should Chalked show SF at all, even as "covered — see CURB" with a link out, or leave it visually gray like anywhere else unsupported? Leaving it gray undersells that SF *is* solved, just by someone else.
- How partial coverage displays honestly (e.g. Chicago minus meters) without reading as broken or unreliable where data just doesn't exist yet.
- Crime-risk overlay: what aggregation (density heatmap? per-block score?) avoids the product feeling alarmist or crime-map-flavored while still being useful. This remains the one piece no prior art (CURB, sweep.la) covers.
- Whether a jurisdiction's own citation data supports the GPS-matched-to-real-enforcement-time trick CURB pulled off for SF — worth checking per adapter before committing, since it's the difference between "shows the posted schedule" and "shows when tickets actually land."
- Update cadence and monitoring for portal schema drift — Chicago's meter scraper precedent (community-maintained, unofficial) suggests this is a real, recurring maintenance cost, not a one-time build.

## Next steps

**Immediate:**
1. [x] ~~Check whether LA's actual CDS feed covers sweeping/permit data~~ — **done (2026-07-06): confirmed no.** CDS is scoped to downtown loading-zone pilots in LA/Seattle/DC, no open public feed either way. The ArcGIS approach already found is the confirmed path. See [research/national-vendor-landscape.md](research/national-vendor-landscape.md).
2. [x] ~~Cross-check LA's possible second sweeping source (Socrata `krk7-ayq2`)~~ — **done (2026-07-06): genuinely different, less complete.** Has route number/council district/time window/text boundary description, but no day-of-week field and no polygon geometry — can't drive the map or the day/week recurrence logic on its own. The ArcGIS Feature Service remains the primary source; this one isn't worth merging in for now.
3. [x] ~~Build the thin vertical slice~~ — **done (2026-07-06), partially.** Built: real LA sweeping adapter (`scripts/fetch_la_sweeping.py`, LADOT ArcGIS → common schema), address/pin lookup (Census Geocoder + turf.js point-in-polygon), sweeping's green/amber/red status computed live against real posted schedules. Core logic (status computation, geocoding, polygon matching) verified against real data outside a browser — actual visual rendering not yet confirmed, no browser available in the build environment. **Not yet built:** the national boundary/coverage-registry layer (still just LA on the map, not "LA supported, everywhere else gray") — deferred deliberately to ship the core mechanic first; see README → "Running the v0 slice locally" for the full honest scope.

**From the 29-city broad scan (2026-07-06, see [research/city-hub-scan.md](research/city-hub-scan.md)):**
- [ ] Investigate ParkUsher directly (architecture, open-source status, data sourcing) — the closest prior-art analog to CURB/sweep.la found anywhere, covering Boston/NYC/Seattle/SF and others
- [ ] Consider San Diego as an addition to the first-adapter candidate set — confirmed real, open sweeping dataset, not on the original 5-city list
- [ ] When designing the common schema (below), make sure "this category doesn't meaningfully apply here" (e.g. sweeping in most Sunbelt cities) is representable distinctly from "no data yet"

**After the slice exists, roughly in this order:**
- [x] ~~Verify the v0 slice actually renders and works in a real browser~~ — **done (2026-07-06), via Playwright.** Map, zone coloring, click interactions, and address search all confirmed working against the real page. Found and fixed one real bug in the process: the Census Geocoder doesn't support CORS, so browser-based address search failed outright — swapped to Nominatim, confirmed working.
- [ ] Build the national boundary/coverage-registry layer — the one piece of the original thin-slice plan deferred to ship the core mechanic faster; make LA visibly "supported" against a real gray national map, not just the only thing on it
- [ ] Design the coverage registry schema (per-jurisdiction status + per-category granularity + population, so a contributor-facing "most-needed" view can sort by population × missing coverage)
- [ ] Design the common schema with explicit per-category nullability and a "data as of" timestamp per category — and geometry-shape tolerance (LA's routes are polygons, SF's blocks are line segments; the schema needs to handle both, not assume one)
- [ ] Design the per-category confidence/staleness UI (not just the backend timestamp)
- [x] ~~Extend to LA's meters~~ — **done (2026-07-06).** `scripts/fetch_la_meters.py`, 34,943 points, clustered rendering (Leaflet.markercluster — the right tool any time a per-point dataset gets into the thousands), browser-verified. Found the dataset has no operating-hours field at all — shown honestly as a rate/limit fact, not implied as a schedule. See [research/cities/los-angeles.md](research/cities/los-angeles.md).
- [ ] Extend to LA's permits, then weigh NYC seriously despite its permit-model gap, given its outsized population and enforcement intensity
- [ ] Re-check Chicago and Seattle's data gaps using the dashboard-tracing method before trusting either "unconfirmed"/gap call
- [ ] Write the CONTRIBUTING guide for adding a jurisdiction (dashboard-tracing method, common schema, worked example) — needed before asking anyone to help
- [ ] Design the error-report → GitHub Issue pipeline, including the anti-spam/moderation step before anything posts publicly
- [ ] Extend the error-report pipeline to accept "my city has an unsigned rule like X" as its own report type, feeding targeted per-city code lookups instead of blind nationwide scraping
- [ ] Check whether each first-adapter city's municipal code is hosted on Municode/American Legal/General Code before assuming a bespoke scrape is needed
- [ ] Write the disclaimer and decide its placement (first-run notice vs. persistent banner) before any public build ships
- [ ] Add jurisdiction-wide default rules as a schema-level concept (distinct from block/zone-specific data) — needed for cases like Walnut, CA's unsigned citywide overnight-permit rule
- [ ] ~~Prototype the crime-risk aggregation approach~~ — **paused pending [Discussion #1](https://github.com/inkxel/chalked/discussions/1)**, not a committed build item. See [ETHICS.md](ETHICS.md).
