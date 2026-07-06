# ParkPulse — Spec

## Concept
Address or pin in, full street-parking picture out: street sweeping schedule, time limits, meters (including whether they're free on weekends/evenings), permit-parking zone status, and a break-in-risk overlay from public crime data.

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
| **Los Angeles** | ⚠️ fragmented | ✅ open (best-documented meter dataset anywhere) | ❌ no confirmed dataset | ✅ open | Sweeping data historically messy; own Mayor's Office/USC project called it a "consolidation" effort |
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

## Architecture (draft)
Given the "every city is its own integration" finding, the shape is a **pluggable per-city adapter behind a common schema** — CurbLR's original intent, just DIY'd rather than waiting on city-side adoption of a standard that stalled.

- **Common schema** — one normalized representation for sweeping schedule, meter rules (including free periods), permit-zone status, and crime-risk overlay, with every field nullable per category (a city missing meters data, e.g. Chicago, should degrade gracefully, not break the schema).
- **Per-city adapter** — one ingestion module per city, each mapping that city's actual open-data quirks (Socrata vs. ArcGIS, different field names, different update cadences) into the common schema. This is most of the real engineering work, and it's inherently unglamorous, ongoing maintenance — city portals change schemas without warning.
- **Crime-risk layer** — separate from the regulation data proper; filters each city's broad crime-code taxonomy down to vehicle-break-in-relevant categories, then aggregates to a density/risk signal (not raw incident pins — avoids the product feeling like a crime map).
- **Lookup** — address/pin in, geocode to the right city + block, query that city's adapter output, return the combined read.
- **No OSM dependency for regulation data** — OSM (if used at all) is a basemap layer only, per the finding above.

## Launch cities (candidates, not final)
**San Francisco removed as launch candidate** (2026-07-05) — CURB (curb.guide) already covers it exceptionally well, open source, actively maintained. Rebuilding it would be pure duplication. ParkPulse either skips SF entirely (link out to CURB for SF users) or, if included later, treats CURB's dataset/approach as a reference adapter rather than building one from scratch.

Ranked by combined open-data coverage among cities with no comparable existing tool, each with its known gap:
1. **Chicago** — strong on sweeping/permits/crime; meters is the one real hole (private concessionaire, no open API — would need a scraper or an explicit "meters unknown here" state). No CURB-equivalent found for Chicago — genuine open territory.
2. **Seattle** — strong on meters/permits/crime; sweeping schedule not confirmed open. No CURB-equivalent found.
3. **NYC** — richest regulation + meter data of any city, but no permit-zone model to speak of — different rule shape entirely (alternate-side parking, not sweeping). Worth a fresh prior-art check specifically for NYC before committing — CURB's existence for SF means other cities should be re-checked, not assumed clear.
4. **Washington DC** — solid permits + crime, but an entirely different seasonal-rule regime (snow/leaf season, no sweeping program).

## Open questions
- **Before picking a first city, re-check for a CURB-equivalent there specifically.** CURB's existence (found by Tucker directly, missed by the initial research pass since it's <1 month old) means "no prior art found" can't be trusted without a fresh, dedicated check per candidate city — search indexes lag new repos.
- Should ParkPulse cover SF at all, even as a thin adapter crediting/linking to CURB, or skip it entirely and stay out of an already-well-served city?
- How to handle the "meters unknown" / "sweeping unknown" gaps in the UI honestly, without the product reading as unreliable where data just doesn't exist yet.
- Crime-risk overlay: what aggregation (density heatmap? per-block score?) avoids the product feeling alarmist or crime-map-flavored while still being useful. This remains the one piece no prior art (including CURB) covers.
- Whether a city's own citation data supports the GPS-matched-to-real-enforcement-time trick CURB pulled off for SF (requires the city to still publish/release citation GPS, or be willing to fulfill a public-records request the way SFMTA did) — worth checking per candidate city before committing, since it's the difference between "shows the posted schedule" and "shows when tickets actually land."
- Update cadence and monitoring for city portal schema drift — Chicago's meter scraper precedent (community-maintained, unofficial) suggests this is a real, recurring maintenance cost, not a one-time build.

## Next steps
- [ ] Re-check prior art specifically for Chicago and Seattle before committing to either as launch city — don't repeat the SF miss
- [ ] Pick the first city from the remaining candidates once that check is done
- [ ] Design the common schema with explicit per-category nullability from day one
- [ ] Prototype the crime-risk aggregation approach — this is the piece no existing tool (including CURB) does
