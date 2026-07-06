# ParkPulse — Spec

## Concept
Address or pin in, full street-parking picture out: street sweeping schedule, time limits, meters (including whether they're free on weekends/evenings), and permit-parking zone status. A break-in/vehicle-crime-risk layer is **paused, not committed** — see [ETHICS.md](ETHICS.md) and [Discussion #1](https://github.com/inkxel/parkpulse/discussions/1) — the harm/bias risk of a naive crime overlay is real enough that it shouldn't ship without community input first.

**The mission is bigger than the tool.** As much as being useful day-to-day, ParkPulse exists to make the fragmentation itself visible — every correction in this spec (LA's sweeping and permit data both existing but hidden behind undocumented ArcGIS dashboards, a decade-old "annual" dataset that was never actually refreshed) is a small, concrete demonstration of why a real national curb-data standard is overdue. This isn't just a human convenience problem anymore, either: autonomous vehicles need to know where they can and can't park, and when that data is stale or wrong, the failure shows up in the real world — see "Why this project exists" in the README.

## Research finding, up front: no national standard exists
Researched before writing any of the rest of this spec, because the premise ("this info must be publicly available") needed a real answer, not an assumption.

**No consumer-facing national data format for curb/parking regulation exists.** The closest attempt, **CurbLR** (Coord/SharedStreets, ~2019), is the right idea — human-readable, linear-referenced curb regulation data — but it's stalled: last code commit July 2024, no registry of live city adoptions, only demo conversions (Portland, part of LA). **SharedStreets**, the geometry layer under it, is more stalled (last push Feb 2023). The one actively-maintained standard today, the **Open Mobility Foundation's Curb Data Specification (CDS)**, is real and current — but it's built for B2B curb management (dockless vehicles, loading-zone occupancy between cities and mobility operators), not a "can I park here" consumer lookup. There's no pipeline from CDS into a dataset this project could just query.

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

### Correction (2026-07-05): CURB (curb.guide) — SF is already excellently solved, open source
Missed in the initial research pass (created 2026-06-08, likely too recent for the search index at the time) — Tucker found it directly. **[alevizio/curb](https://github.com/alevizio/curb)**, MIT licensed, live at curb.guide, actively maintained (pushed as recently as yesterday). This isn't a toy — it's genuinely sophisticated:

- Matches ~1M real SF parking citations to exact street segments by **GPS** (not lossy address-string joins), via two SFMTA public-records requests (#26-5453 for citations, #26-5451 for actual sweeper GPS) — recovering ~815,000 of ~1M tickets with real coordinates that the public DataSF feed has dropped since ~2021.
- Surfaces **when tickets actually get written**, not just the posted schedule: median ticket lands ~20 minutes into the window, ~77% within 45 minutes — a materially more useful signal than "sweeping is 8am–10am."
- Covers sweeping, meters, RPP/permit zones, loading/color-curb zones (including unmetered white zones SFMTA doesn't publish on DataSF at all, pulled from their ArcGIS hub separately), and a beta truck-route inference layer.
- Minimal-dependency architecture: one static `index.html`, vanilla JS + Leaflet, a few Vercel serverless functions, free tiers only.

**What it doesn't do:** no crime/break-in overlay at all, and it's SF-only — no multi-city ambition, no common schema.

**This changes the plan, not just the footnote.** Building "another SF parking app" now would be pure duplication of something already excellent and current. San Francisco drops as ParkPulse's launch city — see Launch cities below. CURB's GPS-matched-citation technique for inferring *real* enforcement timing (not just posted schedule) is worth treating as the bar to clear in whichever city ParkPulse actually builds first, if that city's own citation data supports the same trick.

### Correction (2026-07-05): LA street sweeping is real and queryable — the earlier "fragmented" call was wrong
Tucker found LA's public sweeping lookup (streets.lacity.gov) and an ArcGIS dashboard, and asked directly whether "no open API" was actually true. It wasn't. Traced the dashboard (`Sweeping Routes in LA`, official LA Bureau of Street Services account, 550K+ views) back through its web map to the actual backing service: **`Posted_Street_Sweeping_Routes_Update`**, a public, unauthenticated ArcGIS Feature Service — `https://services1.arcgis.com/PTh9WC0Sf2WS7AAq/arcgis/rest/services/Posted_Street_Sweeping_Routes_Update/FeatureServer/0`. Confirmed live with a real query: fields for `Route`, `Posted_Day`, `Posted_Time`, `Weeks` (1&3 vs 2&4), `Odd_Even` (side of street), `Maint_District`; polygon geometry (routes as zones, not per-block line segments like SF); actively edited (`last_edited_date` tracked).

**Methodology lesson, worth applying to every remaining candidate city:** a lot of real city GIS data isn't listed on a clean developer-facing "open data portal" page — it's the backing service behind a public citizen-facing ArcGIS **dashboard** or web map, discoverable by pulling the dashboard's ArcGIS item ID and walking `item → web map → operationalLayers[].url`. Socrata-based portals (SF, Chicago, NYC) advertise their APIs directly; ArcGIS-based cities often don't, but the data is still there. Chicago and Seattle's "unconfirmed" sweeping gaps should be re-checked this way, not taken as confirmed absent, before finalizing a launch city.

**LA is back in as a candidate**, now 3-of-4 solid + 1 real-but-risky (sweeping ✅, meters ✅ best-documented anywhere, crime ✅, permits ⚠️ real data, stale — see next correction). No CURB-equivalent found for LA specifically — worth a dedicated check before committing, per the CURB lesson above.

### Correction (2026-07-05): LA permit-parking data exists too — but it's stale
Tucker found LA's Preferential Parking Districts (PPD) dataset next: `data.lacity.org/.../LADOT-Preferential-Parking-Districts-PPD-/2ckn-xmjp`. Same pattern as the sweeping dashboard — `2ckn-xmjp` is a Socrata visualization wrapper, not the real dataset. Traced it to the actual backing table: **`LADOT_PPD`** (Socrata `s3st-6nwi`) — real, queryable, MultiPolygon geometry, fields `PPDNUM` + `PPDNAME`, public domain (CC0).

**The honest catch:** `rowsUpdatedAt` is **2015-08-13** — the same as its creation date. Despite the dataset's own metadata claiming a "Committed Update Frequency: Annual," there's no evidence it's actually been refreshed once in a decade. Any preferential parking district created, resized, or retired since 2015 wouldn't show up. This is a different risk profile than the sweeping data (which has active `last_edited_date` tracking) — real and usable, but needs a "data as of 2015" disclosure if used, and probably a periodic manual check against LADOT's current signage rather than blind trust.

Los Angeles is now the strongest single candidate for a first adapter: sweeping (fresh), meters (best documented anywhere), crime (open), and permits (open but stale, disclosed honestly) — a real 4-category jurisdiction, just not a clean 4-for-4 the way the table's checkmarks might imply at a glance.

### sweep.la — a second real precedent, and it's already multi-city
Tucker found this too. **sweep.la** ("Sweep LA") covers not just the city of LA but **5 separate municipalities**: Los Angeles, Santa Monica, Glendale, West Hollywood, and Pasadena — each running its own independent sweeping program, aggregated into one lookup. Multilingual (en/es/ko/ru/tl), PWA, "as-is, not affiliated with the City of Los Angeles." No GitHub link found on the site — not confirmed open source, unlike CURB.

Real signal: crossing city boundaries is already happening at solo/small-team scale in this exact space. Two independent single-city-metro tools (CURB, sweep.la) both exist and both work. The gap they leave — nationwide reach, open source, and the crime-risk overlay — is still wide open.

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

## Trust, error reporting & disclaimer

Three related pieces, all Tucker's additions (2026-07-05), all load-bearing for a project that tells people where they can legally park.

### Per-category confidence, shown to the user — not just in the schema
The "data as of" timestamp (above) isn't only a backend field — it needs to surface as an actual visible confidence signal per category, e.g. "Sweeping: current" vs. "Permits: data from 2015, may be outdated." Silent staleness is worse than no data at all, because it reads as confident when it isn't. LA's permit dataset is the concrete case that forced this: real data, but a decade stale, and a user needs to see that distinction before trusting it over a posted sign.

### User-reported errors, Google-Maps-style, auto-routed to GitHub Issues
When ParkPulse shows something wrong — says a block is clear when the posted sign says otherwise — a user should be able to flag it inline, the way Google Maps lets you report a map error. The report (location, category, what they observed, ideally a photo of the sign) should auto-file as a GitHub issue on this repo, labeled by jurisdiction + category (e.g. `data-issue`, `city:los-angeles`, `category:permits` — a distinct label family from the `epic`/`ready`/`blocked` planning labels, so data-quality reports and build-planning issues don't collide in the tracker) so maintainers can triage per city. This turns user friction directly into a public, trackable data-quality record — and doubles as evidence for the "this needs a standard" argument, since a visible backlog of "wrong here" reports across cities makes the fragmentation case better than any essay would.

**Open design requirement, not yet solved:** auto-filing anonymous user input as public GitHub issues is a real spam/abuse vector. Needs at least basic rate-limiting or a lightweight moderation/staging step before reports go public — do not ship the naive "instant direct post" version without one.

### Disclaimer — heavy, upfront, non-negotiable
The site is informational only. Not responsible for citations, towing, or any consequence of relying on it. Users must always defer to posted physical signage over anything ParkPulse shows — the same posture CURB takes ("the posted sign is always the source of truth"), and necessary here for the same reason: this is inferred/aggregated public data, not a legal guarantee. Needs to be prominent (not buried in a footer link) — a first-run notice or persistent banner, not just a ToS page nobody reads.

## Beyond open data: unsigned, code-only rules (2026-07-05)

**The Walnut, CA case, and why it breaks the disclaimer's safety net.** Tucker's in-laws live in Walnut, CA — the entire city requires an overnight parking permit, citywide, with **no signage anywhere** stating it. You're expected to know the rule because you're in Walnut, full stop. This isn't a GIS/open-data gap, it's a fundamentally different category: a real, binding, ticketable rule that exists **only in municipal code**, with no physical marker a driver could ever spot and no dataset a city GIS team would think to publish (there's nothing to map — it's not tied to specific blocks, it's the whole jurisdiction by default).

This matters more than it might look like at first, because it's the one case where "always defer to the posted sign" — the disclaimer's whole safety net — doesn't help. There's no sign to defer to. If ParkPulse (or any tool) doesn't know about a rule like this, an out-of-town driver has no practical way to find out short of already knowing the city's code. Cities almost certainly vary a lot in how much they rely on "residents just know" vs. actual signage, and there's no reason to think Walnut is unique.

**Schema implication:** the common schema needs a rule type that isn't tied to a block or zone at all — a **jurisdiction-wide default rule** (e.g. "overnight parking anywhere in city limits requires a permit, no exceptions"), layered *underneath* the block-specific sweeping/meter/permit-zone data most of this spec has been about. A city can have both at once — specific signed zones *and* an invisible blanket default — and the schema needs to represent that layering, not just one or the other.

**How to actually find these, without scraping every municipal code in the country up front:**
- **Most municipal codes aren't hosted on bespoke city websites — they're consolidated onto a handful of third-party platforms**: Municode (municode.com), American Legal Publishing (amlegal.com), General Code (ecode360.com), a few others. This is the same shape as the ArcGIS-dashboard discovery from earlier: check whether a target city's code lives on one of these platforms first, since it turns "thousands of unique city websites" into "a handful of known platforms with fairly consistent structure" — a real scalability lever, not a hopeful assumption.
- **Don't process a full municipal code.** Most are organized with a clear parking/vehicles-and-traffic chapter — narrow to that section with a cheap search pass before any LLM reads anything. Full-document processing per city, per the model-routing discipline already used elsewhere (FOUNDRY's own Haiku/Sonnet/Opus split is the same idea): a mechanical "does this chapter mention permit parking" classification is cheap-tier work; extracting the actual rule (who/what/when/exceptions) from an already-narrowed section is a step up, but still bounded and cheap relative to reading the whole code.
- **Let the contribution/error-reporting model do the discovery work, rather than brute-forcing every city nationally.** Tucker knew about Walnut's rule because he has in-laws there — that's exactly the kind of local knowledge the error-reporting pipeline (above) should be able to capture: "my city has an unsigned rule like X" as its own report type, which then triggers a *targeted*, cheap, single-city code lookup — not a standing, expensive effort to scrape every municipal code in the US speculatively. Scale the code-reading effort to where a human already flagged a reason to look, the same way adapter-building itself is meant to be community-driven rather than centrally planned.
- **Cache and re-check on a cadence, not per-request.** Municipal code changes are infrequent (amendments, not daily updates) — read once, store the result, re-check occasionally, not on every lookup.

## First adapters to build (not "launch cities" — the map covers everywhere from day one)
These are the first few jurisdictions worth building real adapters for, to prove the schema and seed the coverage map with real data — not a sequential rollout plan, since every place is already visible on the national map regardless.

**San Francisco is deliberately not one of them** (2026-07-05) — CURB (curb.guide) already covers it exceptionally well, open source, actively maintained. Rebuilding it would be pure duplication; ParkPulse either shows SF as covered-by-a-linked-external-tool, or treats CURB's approach as a reference adapter rather than building one from scratch.

### Prioritization: data availability × population (soft weighting, not a hard cutoff)
Data completeness alone isn't the whole story — a jurisdiction with clean data but few residents and light enforcement delivers less real value than a bigger, more aggressively-enforced one, even with a messier data gap. Population is a reasonable proxy for both "how many people this actually helps" and "how likely enforcement is real and worth tracking" (a city under ~10K residents plausibly has parking rules on the books that rarely get enforced; a city over ~500K almost certainly has a dedicated enforcement operation). Soft signal, not a strict cutoff — small towns aren't excluded from the map, just weighted lower for *which adapter to build next*.

Convenient synergy: the same Census TIGER/Line source providing the national boundary layer also publishes population estimates for those same places — this ranking factor doesn't need a separate data source.

Ranked by combined open-data coverage among jurisdictions with no comparable *open-source* tool, each with its known gap, population noted (rounded, city proper) since it now matters to the call. **Re-check "unconfirmed" gaps via the dashboard-tracing method (above) before trusting them** — LA's sweeping and permit gaps both turned out to be wrong when actually checked.
1. **Los Angeles** (~3.9M) — the strongest combined candidate: real population *and* the most complete data. Sweeping (fresh, actively edited), meters (best-documented dataset of any city), crime (open), permits (open, real, but frozen since 2015 — disclose the staleness, don't hide it). sweep.la already covers LA + 4 neighbors but isn't confirmed open source — a real, open ParkPulse adapter for LA still has a clear reason to exist.
2. **NYC** (~8.3M) — by far the largest population of any candidate, and the richest regulation + meter data of any city — but no permit-zone model to speak of, and a genuinely different rule shape (alternate-side parking, not sweeping) that's more architectural work than a drop-in adapter. Worth weighing seriously despite the gap, given the population is more than double LA's — NYC's alternate-side enforcement is also famously aggressive (real, high-volume citation activity), which is exactly the enforcement-intensity signal population is a proxy for.
3. **Chicago** (~2.7M) — strong on sweeping/permits/crime; meters is the one real hole (private concessionaire, no open API — would need a scraper or an explicit "meters unknown here" state). No CURB/sweep.la-equivalent found — genuine open territory, but re-check before committing given the LA misses.
4. **Seattle** (~750K) — strong on meters/permits/crime; sweeping schedule not yet confirmed open — but given LA's misses, worth checking for a hidden ArcGIS dashboard before concluding it's actually absent.
5. **Washington DC** (~670K) — solid permits + crime, but an entirely different seasonal-rule regime (snow/leaf season, no sweeping program) and the smallest population of the group.

**Read:** LA is the clean pick — high population, most complete data. NYC is the real judgment call — the highest population and enforcement-intensity signal by far, worth the extra architectural work the missing permit model and different rule shape demand, rather than defaulting to whichever jurisdiction merely has the tidiest data.

## Open questions
- What does the "not covered yet" state actually look like — gray fill only, or a lighter hint of jurisdiction-level metadata (population, at least the boundary) even with zero regulation data? Zillow-style "estimate not available" implies some baseline info is still shown.
- What does the contribution guide need to teach a newcomer to build a real adapter — at minimum, the dashboard-tracing method (above), the common schema, and a worked example (the SF or LA adapter, once built).
- Should ParkPulse show SF at all, even as "covered — see CURB" with a link out, or leave it visually gray like anywhere else unsupported? Leaving it gray undersells that SF *is* solved, just by someone else.
- How partial coverage displays honestly (e.g. Chicago minus meters) without reading as broken or unreliable where data just doesn't exist yet.
- Crime-risk overlay: what aggregation (density heatmap? per-block score?) avoids the product feeling alarmist or crime-map-flavored while still being useful. This remains the one piece no prior art (CURB, sweep.la) covers.
- Whether a jurisdiction's own citation data supports the GPS-matched-to-real-enforcement-time trick CURB pulled off for SF — worth checking per adapter before committing, since it's the difference between "shows the posted schedule" and "shows when tickets actually land."
- Update cadence and monitoring for portal schema drift — Chicago's meter scraper precedent (community-maintained, unofficial) suggests this is a real, recurring maintenance cost, not a one-time build.

## Next steps
- [ ] Get the national base layer working first: Census TIGER/Line boundaries + population on a map, every jurisdiction resolvable from a pin/address, all shown as "unsupported" — this is the actual v1 milestone, before any single adapter
- [ ] Design the coverage registry schema (per-jurisdiction status + per-category granularity + population, so a contributor-facing "most-needed" view can sort by population × missing coverage)
- [ ] Write the CONTRIBUTING guide for adding a jurisdiction (dashboard-tracing method, common schema, worked example) — needed before asking anyone to help
- [ ] Re-check Chicago and Seattle's data gaps using the dashboard-tracing method before trusting either "unconfirmed"/gap call
- [ ] Build the first real adapter — LA is the clean pick (population + most complete data); weigh NYC seriously too despite its permit-model gap, given its outsized population and enforcement intensity
- [ ] Design the common schema with explicit per-category nullability and a "data as of" timestamp per category — and geometry-shape tolerance (LA's routes are polygons, SF's blocks are line segments; the schema needs to handle both, not assume one)
- [ ] ~~Prototype the crime-risk aggregation approach~~ — **paused pending [Discussion #1](https://github.com/inkxel/parkpulse/discussions/1)**, not a committed build item. See [ETHICS.md](ETHICS.md).
- [ ] Design the per-category confidence/staleness UI (not just the backend timestamp)
- [ ] Design the error-report → GitHub Issue pipeline, including the anti-spam/moderation step before anything posts publicly
- [ ] Write the disclaimer and decide its placement (first-run notice vs. persistent banner) before any public build ships
- [ ] Add jurisdiction-wide default rules as a schema-level concept (distinct from block/zone-specific data) — needed for cases like Walnut, CA's unsigned citywide overnight-permit rule
- [ ] Extend the error-report pipeline to accept "my city has an unsigned rule like X" as its own report type, feeding targeted per-city code lookups instead of blind nationwide scraping
- [ ] Check whether each first-adapter city's municipal code is hosted on Municode/American Legal/General Code before assuming a bespoke scrape is needed
