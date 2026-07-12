# Seattle

SPEC.md's coverage table currently calls Seattle's sweeping status "unconfirmed," alongside meters and permits both marked "open." Applying the same trace-it-before-you-write-it-off rigor used on LA (see [dashboard-tracing-method.md](../dashboard-tracing-method.md) and [Los Angeles](los-angeles.md)): the sweeping "gap" turns out to be wrong in the same *shape* as LA's was — real, queryable data exists — but the underlying situation is different in a way that matters for how confidently Chalked should present it.

## Sweeping

**The gap was a research-pass miss, not a missing dataset — but it's a milder miss than LA's.** LA's data was hidden behind an undocumented citizen-facing dashboard that had to be traced through a Web Map to its Feature Service. Seattle's isn't hidden at all — it's just published on the city's *other* open-data portal, one a first pass checking only `data.seattle.gov` (Socrata) would miss entirely.

Seattle runs two separate open-data platforms:
- **`data.seattle.gov`** — Socrata, the one anyone would check first.
- **`data-seattlecitygis.opendata.arcgis.com`** ("Seattle GeoData") — a second, ArcGIS Hub-based portal for GIS layers, with its own dataset pages, download formats, and API resources.

Street sweeping routes live on the second one:

- **"Street Sweeping Routes"** — Seattle GeoData: `https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::street-sweeping-routes/about`
- Underlying ArcGIS Online item, owned by **Seattle Public Utilities** (not SDOT): **"SPU Street Sweeping Routes"**, item id `d6cb9de98ee840fb8b6504f0b2e234f5`, `https://seattlecitygis.maps.arcgis.com/home/item.html?id=d6cb9de98ee840fb8b6504f0b2e234f5`

That ownership detail matters: this confirms the [city-hub-scan.md](../city-hub-scan.md) finding that Seattle's sweeping program sits with **Seattle Public Utilities** (stormwater/water-quality program), not SDOT (which owns meters, RPZ permits, and general parking regs) — the same "wrong department, no cross-linking" fragmentation pattern the scan found almost everywhere else. SPU's own program page (`seattle.gov/utilities/.../street-sweeping`) states the city sweeps **90%+ of arterial streets**, **40 regular routes plus 14 protected bike-lane routes** year-round, plus **7 additional seasonal routes** added each fall for leaf cleanup — and that the underlying map layer is meant to carry route, schedule, holiday-suspension, and enforcement-note fields, i.e. exactly the shape of data a sweeping adapter would need.

**Honest limitation on this pass, stated plainly rather than glossed over:** unlike the LA research (which had live tool access to query the Feature Service directly and confirm schema/record freshness), this session's network egress is blocked for both `arcgis.com` and `data.seattle.gov`/Socrata API domains — direct `?f=json` queries against the item metadata and Feature Service (the method's steps 2-4) could not be executed this pass. Everything above is corroborated through multiple independent search hits (the dataset's own "about" page title/URL, the ArcGIS item id, and SPU's program-description page), not a live query response. **Next step for whoever picks this up with working tool access:** run the actual trace — `https://www.arcgis.com/sharing/rest/content/items/d6cb9de98ee840fb8b6504f0b2e234f5?f=json` for the Feature Service `url`, then `<url>?f=json` for schema and `<url>/query?where=1=1&outFields=*&f=json` for live records and a `last_edited_date` freshness check — before building an adapter on top of it.

**The enforcement caveat is now source-confirmed, not just noted.** [city-hub-scan.md](../city-hub-scan.md)'s methodology-gotchas section flagged, unsourced, that "Seattle currently doesn't ticket for missed sweeping days." SPU's own program page confirms this directly and explains the reasoning: *"Moving your car is voluntary... Enforcing parking rules is expensive, and many arterials already have few parked cars overnight, so sweepers have access to the curb without parking enforcement... parking enforcement fines have a greater impact on low-income communities,"* which the city cites as an equity consideration in choosing not to ticket. Multiple secondary sources (fixparkingticket.com, SpotAngels' Seattle guide) repeat the same "no tickets for missed sweeping" framing.

**One wrinkle worth flagging, not fully resolved:** a handful of low-quality, likely auto-generated ticket-fighting sites (bridgelegal.org, 19pine.ai, stateregstoday.com) list a generic "$40-60 street cleaning violation" fine as if Seattle actively tickets for it — directly contradicting SPU's own statement. These read as boilerplate content-mill pages that list the same violation categories for every city they cover, not something built from Seattle's actual citation data, so they shouldn't be trusted over the primary source. But it does leave one real open question: whether *temporary no-parking* postings (event closures, construction, utility work — governed separately under SDOT's Temporary No Parking Zone program, which explicitly *is* enforced with 24-hour-notice signage and real citations/towing per `seattle.gov/documents/departments/sdot/cams/cam2114.pdf`) ever get confused with routine SPU sweeping in ticket records or in what a driver sees posted on a sign. Someone should check a sample of actual SPD/court citation data for "street cleaning" codes before assuming zero tickets are ever issued under that literal label — SPU's voluntary-compliance program and SDOT's enforced temporary-no-parking program are two different things that could get lumped together by a careless reading of citation data.

**What this means for how Chalked should show it:** the underlying schedule data is real and traceable, but Seattle is a genuinely different confidence tier from LA/SF. A city where sweeping is real *and* actively ticketed (LA, SF) supports the map's normal green/amber/red restricted-parking confidence. Seattle's rule is real but the city itself says compliance is voluntary — showing it with the same visual urgency as an actively-enforced city would overstate the actual risk to a driver. This is exactly the SPEC's "restricted status shouldn't be presented with the same confidence in an unenforced city" principle the city-hub-scan flagged in the abstract; Seattle is the concrete case it was written for.

## Permits (RPZ)

Confirmed open, on **both** Seattle platforms, and fresher than LA's PPD data:

- `data.seattle.gov` (Socrata): **"Restricted Parking Zones"**, dataset id `netm-8y6z` — `https://data.seattle.gov/dataset/Restricted-Parking-Zones/netm-8y6z`
- Seattle GeoData (ArcGIS): `https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::restricted-parking-zones`

Search-result summaries of the dataset describe multiple constituent layers — signed RPZ blocks, permit-eligible blockfaces, and separate layers for Husky-game-day zones (Area A/B, near the UW stadium) vs. standard zones — on a **daily refresh cycle**. That refresh cadence, if it holds up under a live check, is a meaningfully stronger freshness story than LA's PPD data (stuck at a 2015 snapshot despite claiming annual updates). Not independently queried live this pass, same tooling caveat as above — worth a live schema/freshness check before an adapter is built, but nothing here contradicts SPEC's existing "permits: open" call.

## Meters

Spot-check only, not a full redo — SPEC's existing "meters: open (rich historical paid-occupancy data since 2012)" call holds up and is, if anything, undersold. `data.seattle.gov` hosts a genuinely deep set of paid-parking datasets:

- **Paid Parking Occupancy (Last 30 Days)** — `data.seattle.gov/Transportation/Paid-Parking-Occupancy-Last-30-Days-/rke9-rsvs`
- Year-by-year historical occupancy datasets back to 2012 (e.g. `2020-Paid-Parking-Occupancy/wtpb-jp8d`, `2021-Paid-Parking-Occupancy/jb6y-98nr`, and so on through the current year)
- **Paid Parking Transaction Data** — `data.seattle.gov/Transportation/Paid-Parking-Transaction-Data/gg89-k5p6`
- A blockface-level parking inventory (peak-hour restrictions, rate, hours, RPZ number, curbspace type per blockface)

SDOT's own description: occupancy data estimates **payment rate on each blockface by minute**. A third-party GitHub project (`github.com/yogitasn/seattlepaidparking`) already built something on top of this data, which is decent independent corroboration that it's real and usable, not just advertised. Vendor is **PayByPhone** per [city-hub-scan.md](../city-hub-scan.md)'s vendor-by-city map — not re-verified this pass, no reason to doubt it.

## Crime

Spot-check only. SPEC's "crime: open" call holds up: **`SPD Crime Data: 2008-Present`** — `data.seattle.gov/Public-Safety/SPD-Crime-Data-2008-Present/tazs-3rd5`, Socrata-hosted, updated daily (only UCR-finalized reports, so same-day entries lag). Not filtered to vehicle-break-in-specific codes, same caveat as LA — and same paused status: the crime-risk overlay is on hold pending [Discussion #1](https://github.com/inkxel/chalked/discussions/1), so this is background context, not an active build target.

## "Find It, Fix It" — checked, not a lead

The task asked specifically whether Seattle's citizen-facing **"Find It, Fix It"** app/map hides a backing Feature Service worth tracing, the way LA's sweeping dashboard did. It doesn't: it's a general service-request reporting tool (photo + location + description, routed to the relevant department — including "report a problem" for things like abandoned vehicles), not a schedule lookup, and it has no sweeping-specific data behind it. The actual citizen-facing sweeping lookup is SPU's own **Street Sweeping Route Map** (an ArcGIS web app for finding your route/schedule by address), which sits directly on top of the same `SPU Street Sweeping Routes` item traced above — there's no separate hidden layer behind it beyond that one.

## Bottom line

Seattle's "sweeping: unconfirmed" status is **overturned in the same direction as LA's** — real, structured route/schedule data exists, maintained and owned by SPU, published on Seattle's ArcGIS-based GIS open-data portal (not the Socrata one most people would check first). Unlike LA, this didn't require the full dashboard→Web Map→Feature Service trace; it just required checking Seattle's *second* open-data portal, which the original "unconfirmed" pass evidently didn't. The live-query confirmation LA got (schema, `last_edited_date`, record count) still needs to happen here — this session's tooling couldn't reach `arcgis.com` or Socrata APIs directly, so this is corroborated-by-search, not confirmed-by-query.

The bigger finding, though, is the enforcement caveat, now sourced directly from SPU rather than just carried over unsourced from the city-hub-scan: **Seattle openly states compliance is voluntary and it does not ticket for missed sweeping.** So even once the dataset is live-verified, it shouldn't be status-coded the same way as LA/SF's actively-ticketed sweeping data — the honest Chalked treatment is "real schedule, low real-world stakes," not "restricted parking" at full confidence. Permits (RPZ) and meters both hold up as open and, if their claimed daily/by-minute refresh rates are real, are better-documented than LA's equivalents on both counts. Crime is open and unchanged in relevance (build paused pending Discussion #1).
