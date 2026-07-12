# City hub-page & aggregator scan (2026-07-06)

A broad, high-level discovery pass across 29 US cities — 6-8 per region, 4 regions — looking for existing independent aggregator sites (CURB/sweep.la-style) and each city's own official "how to park here" hub page. Breadth over depth: quick checks per city, not full research. Tracked as issues [#7](https://github.com/inkxel/chalked/issues/7) (Northeast), [#8](https://github.com/inkxel/chalked/issues/8) (South), [#9](https://github.com/inkxel/chalked/issues/9) (Midwest), [#10](https://github.com/inkxel/chalked/issues/10) (West) — full per-city findings are in those issue threads; this file is the cross-city synthesis.

## Headline finding: the gap is real and it's everywhere

Outside LA (sweep.la) and SF (CURB), **not one of the 29 cities scanned has a comprehensive, city-specific, independent aggregator.** Every "aggregator" hit that isn't a real local tool is one of a small set of generic multi-city commercial products (below) that treat a given city as one of dozens — shallow, not deep. This is a genuine, confirmed validation of Chalked's core niche, not an assumption.

## The closest real prior art found: ParkUsher

**[ParkUsher](https://www.parkusher.app/)** — real-time map of permit zones, meter limits, and street cleaning, covering Boston, NYC, Montreal, Toronto, Vancouver, Seattle, and SF. This is the single closest analog to CURB/sweep.la found anywhere in the scan — multi-city, seems genuinely deep per city rather than generic. Not confirmed open source. **Worth a dedicated look**, the same way CURB and sweep.la got one — see Next steps.

## Other independent/community tools found (single-purpose, not comprehensive)

- **[We The Sweeple](https://wethesweeple.com)** (Chicago, formerly Sweep Around Us) — sweeping-only alerts + calendar. **Confirmed open source**: [github.com/srobbin/sweeparoundus](https://github.com/srobbin/sweeparoundus).
- **[MKE CitySmart](https://mkecitysmart.com)** (Milwaukee) — bundles parking + sweeping + trash-day alerts. Built by an independent developer, not confirmed open source.
- **AltSide NYC** — dedicated alternate-side-parking tracker app for NYC. Not confirmed open source.
- **[nashfaq.com](https://www.nashfaq.com/what-parking-apps-work-in-nashville/)** — an unofficial FAQ site that exists purely to explain "what parking app do I even use here" for Nashville. Its existence is itself a signal: official info was scattered enough that someone felt the need to build a explainer site just for app selection.

## Generic multi-city commercial products (closed, shallow-per-city — not comps to build against, but worth knowing)

- **SpotAngels** and **Xtreet** — the two names that showed up constantly across almost every region, blanketing most mid-size US cities with generic (ad-supported, non-open) sweeping/parking guides.
- **[aSpot](https://aspot.app/)** (REYCO Innovations) — a newer, actively-expanding pre-launch startup (iOS imminent per its own site) covering a dozen+ metros with crowd-sourced availability plus sign/sweeping/permit guides. Not open source. Worth tracking as a competitive comp since it's actively growing into this exact space right now — not a blocker, but good to know who else is circling it.
- Parknav, Parkopedia, ParkWhiz, Parksy — background noise, mostly garage/lot booking or generic multi-city apps, not real competitors to a rules-aggregator.

## Meter vendor landscape, now confirmed city-by-city (not just at the vendor-business level)

Complements [national-vendor-landscape.md](national-vendor-landscape.md), which assessed vendors abstractly — this is which vendor actually serves which specific city, confirmed by checking each city's own page:

- **ParkMobile** — the single most common vendor found: Houston, Dallas, Columbus, Nashville, New Orleans, San Antonio (one of several), Philadelphia, Pittsburgh, DC, Denver, Phoenix, one of Baltimore's three, one of Kansas City's three. Milwaukee's "MKE Park" app is a ParkMobile white label.
- **Flowbird** — second most common: Detroit, Minneapolis (switched 2023), NYC (as ParkNYC), one of Baltimore's three, one of Las Vegas's two.
- **Passport** — Chicago (ParkChicago), Austin (Park ATX), Portland ("Parking Kitty" white label).
- **PayByPhone** — Seattle, Miami (jointly with ParkMobile), one of Baltimore's three, one of Kansas City's three.
- **ParkWhiz** — Las Vegas (with Flowbird) — the only city found running on neither ParkMobile, Passport, nor PayByPhone as any option.
- **Multi-vendor cities** (more than one official option simultaneously): Indianapolis (ParkMobile + Flowbird), Baltimore (all three: Flowbird, ParkMobile, PayByPhone), Kansas City (three concurrent: native Park KC + ParkMobile + PayByPhone).

## The real structural finding: street sweeping is the universally orphaned category

In the large majority of cities scanned — **regardless of region** — street sweeping/cleaning information lives on a completely separate department website from meters and permits, with no cross-linking:

- Philadelphia (Parking Authority vs. Streets/Sanitation, each with its own live tracker)
- Baltimore (Parking Authority vs. Dept of Public Works)
- Pittsburgh (Parking Authority vs. seasonal press releases)
- Columbus, Indianapolis, Detroit (parking hub vs. separate city.gov sweeping page)
- Seattle (Transportation vs. Seattle Public Utilities — a different department entirely)
- Phoenix, San Antonio, Atlanta, Miami (sweeping absent from the parking hub or on a wholly separate site)
- New Orleans (sweeping filed under "Trash & Recycling," not "Parking," in the city's own site structure)
- Las Vegas (sweeping is a buried, unlinked PDF)

Only DC (ParkDC) and Boston (Parking Clerk page) present a genuinely unified hub. NYC and San Diego needed dedicated secondary tools (SweepNYC; San Diego's own ArcGIS map) to make their own sweeping data usable at all.

**This is a strong, confirmed reinforcement of Chalked's whole thesis** — the fragmentation isn't just "every city does it differently," it's "most city governments can't even put their own department's parking data on one page." Directly supports the standardization-advocacy framing already in the README.

## Regional structural difference worth building into prioritization

Sunbelt cities (Houston, Austin, Atlanta, Miami, San Antonio) show **little to no sweeping-based enforcement** at all — the opposite of coastal/older cities where sweeping is the dominant pain point. Nashville is the sharp exception: real sweeping enforcement only started in 2025 (citations Aug 2025, towing Oct 2025). This means "sweeping" may not be the universal primary category everywhere — a Sunbelt adapter might need meters/permits as its lead categories, not sweeping, rather than assuming the LA/SF shape applies nationally.

## New candidate city surfaced: San Diego

Not on the original 5-city list, but the scan found **a real, confirmed open dataset**: an ArcGIS sweeping map plus an actual queryable dataset on [data.sandiego.gov](https://data.sandiego.gov/datasets/street-sweeping-schedule/) — described as the best-documented open data found in the whole West-region batch. Worth adding to the candidate set for a future adapter (see SPEC.md → First adapters to build).

## Methodology gotchas worth remembering for future scraping/research

- **Naming collisions**: "Portland, Maine" pollutes "Portland, Oregon" searches; "Las Vegas" searches can surface the separate municipality of North Las Vegas by mistake.
- **Vendor-switch staleness traps**: Phoenix switched Pango → ParkMobile in Dec 2017; Minneapolis switched to Flowbird in 2023 — old vendor names persist in search results and old docs long after the switch.
- **Scam risk**: Minneapolis has documented phishing ads mimicking the official MPLS Parking app. Any future feature that recommends a specific payment app to users should source the vendor from the city's own official page, never from generic search results.
- **Enforcement isn't always real even when a rule is posted**: Seattle currently doesn't ticket for missed sweeping days — enforcement is effectively voluntary there. A "restricted" status shouldn't be presented with the same confidence in a city where the rule is real but unenforced as one where it's actively ticketed.
- **Watch for pending changes**: Portland (OR) is relaunching residential sweeping July 1, 2026, with new schedules — a dataset worth re-checking after that date specifically, not treating current info as settled.

## Next steps this scan points to

- [x] ~~Investigate ParkUsher directly (architecture, open-source status, data sourcing) — the same treatment CURB and sweep.la got.~~ — done, see [parkusher.md](parkusher.md): not open source, no confirmed open-data pipeline, meters paywalled, coverage uneven across its 7 cities (incl. Seattle and SF) — doesn't change Chalked's prioritization.
- [x] ~~Consider San Diego as an addition to the first-adapter candidate set, given its confirmed real open dataset.~~ — done, see [cities/san-diego.md](cities/san-diego.md): added to SPEC.md's ranked candidate list (~4th, provisionally) — strong meters, unfinished sweeping trace, likely-gapped permits.
- [x] ~~When building the common schema, don't assume sweeping is always the primary category...~~ — done, see [schema/common-schema.md](../schema/common-schema.md): `not_applicable` and `unconfirmed` are two of its six explicit per-category statuses, specifically for this distinction.
- A vendor-adapter layer (matching a city to its meter payment vendor) could cover most scanned cities with only a handful of vendor integrations — worth weighing against building purely per-city adapters.
