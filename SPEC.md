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
- **No credible open-source competitor.** The only close GitHub hit is a dead 2017 toy (3 stars, untouched since).
- **Commercial space is split by function, not overlapping this idea directly:** ParkMobile/PayByPhone = meter payment only. SpotHero/ParkWhiz/BestParking = garage/lot booking, not street parking.
- **SpotAngels is the real closest analog** — sweeping + meters + permit zones + crowdsourced rules across ~200 cities — but proprietary, closed-data, and doesn't do break-in risk at all.
- **The actual gap:** nobody combines regulation data with a crime-risk overlay, and nothing in this space is open source.

## Architecture (draft)
Given the "every city is its own integration" finding, the shape is a **pluggable per-city adapter behind a common schema** — CurbLR's original intent, just DIY'd rather than waiting on city-side adoption of a standard that stalled.

- **Common schema** — one normalized representation for sweeping schedule, meter rules (including free periods), permit-zone status, and crime-risk overlay, with every field nullable per category (a city missing meters data, e.g. Chicago, should degrade gracefully, not break the schema).
- **Per-city adapter** — one ingestion module per city, each mapping that city's actual open-data quirks (Socrata vs. ArcGIS, different field names, different update cadences) into the common schema. This is most of the real engineering work, and it's inherently unglamorous, ongoing maintenance — city portals change schemas without warning.
- **Crime-risk layer** — separate from the regulation data proper; filters each city's broad crime-code taxonomy down to vehicle-break-in-relevant categories, then aggregates to a density/risk signal (not raw incident pins — avoids the product feeling like a crime map).
- **Lookup** — address/pin in, geocode to the right city + block, query that city's adapter output, return the combined read.
- **No OSM dependency for regulation data** — OSM (if used at all) is a basemap layer only, per the finding above.

## Launch cities (candidates, not final)
Ranked by combined open-data coverage, each with its known gap:
1. **San Francisco** — the only 4-for-4 city; obvious first build target.
2. **Chicago** — strong on sweeping/permits/crime; meters is the one hole (would need a scraper or an explicit "meters unknown here" state).
3. **Seattle** — strong on meters/permits/crime; sweeping schedule not confirmed open.
4. **NYC** — richest regulation + meter data of any city, but no permit-zone model to speak of — different rule shape entirely (alternate-side parking, not sweeping).
5. **Washington DC** — solid permits + crime, but an entirely different seasonal-rule regime (snow/leaf season, no sweeping program).

## Open questions
- Is a 4-city (or fewer) v1 the right scope, or does even San Francisco alone make a better single-city proof of concept first?
- How to handle the "meters unknown" / "sweeping unknown" gaps in the UI honestly, without the product reading as unreliable where data just doesn't exist yet.
- Crime-risk overlay: what aggregation (density heatmap? per-block score?) avoids the product feeling alarmist or crime-map-flavored while still being useful.
- Update cadence and monitoring for city portal schema drift — Chicago's meter scraper precedent (community-maintained, unofficial) suggests this is a real, recurring maintenance cost, not a one-time build.

## Next steps
- [ ] Build the San Francisco adapter first (only confirmed 4-for-4 city) — proves the common schema against real data before adding a second city
- [ ] Design the common schema with explicit per-category nullability from day one
- [ ] Prototype the crime-risk aggregation approach on SF's vehicle-theft data
- [ ] Decide the second launch city once SF is working, informed by what the SF build actually revealed about the schema's rough edges
