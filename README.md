# Chalked

Drop a pin or enter an address, get the full read on street parking there: street sweeping schedule, time limits, meters (and whether they're free on weekends/evenings), and permit-parking zone status. (A break-in/vehicle-crime-risk layer is a paused, open question — see [ETHICS.md](ETHICS.md) and [Discussion #1](https://github.com/inkxel/chalked/discussions/1) — not something we're shipping without real input first.)

**Status: first working slice, LA sweeping only.** No national data standard exists for this — every city publishes (or doesn't publish) its own parking data differently. The full plan is a national map from day one (US Census boundaries), with real coverage growing jurisdiction by jurisdiction — this first slice validates the core pipeline (real source → common schema → live status) on one city and one category before building that out. See [SPEC.md](SPEC.md) for the full data landscape and architecture.

## Running the v0 slice locally

```
python3 scripts/fetch_la_sweeping.py   # re-fetch LA's sweeping data from LADOT (manual for now)
python3 -m http.server 8000            # serve the static site
```

Then open `http://localhost:8000`. Search an LA address or click a colored zone on the map — green (clear), amber (sweeping starts within 2 hours), red (restricted now). Colors are computed from the real posted schedule against the current time, not hardcoded.

**What this slice is, honestly:**
- One city (LA), one category (sweeping) — meters, permits, crime, and every other city are still just spec, not built. See SPEC.md → Next steps for what's next.
- No national boundary/coverage-registry map yet — that's still the actual v1 milestone per SPEC.md, deliberately deferred so this first slice could ship fast and prove the core mechanic (adapter → schema → live status) end to end.
- Data sync is a manual script run (`fetch_la_sweeping.py`), not yet a scheduled job — see SPEC.md's Data pipeline section for the intended automated version.
- ~7 of LA's 871 posted routes ("Downtown"-type, weekly cadence instead of biweekly) aren't parsed yet — noted in the adapter script, not silently dropped.
- The core logic (status computation, live Census address geocoding, point-in-polygon zone matching) was tested directly against real data and real external APIs — but the actual in-browser rendering (map tiles, click interactions, page layout) hasn't been visually verified yet, since no browser was available in the environment this was built in. Worth a real look before calling it done.

## Get involved

This is early — spec-stage, no app yet — which means right now the highest-leverage way to help isn't code. In order of "you can do this in the next five minutes":

- **Weigh in on the crime-risk question** — [Discussion #1](https://github.com/inkxel/chalked/discussions/1). This is a live, genuinely undecided ethical call, not a rhetorical question — opinions actually change what gets built.
- **Don't see your city below? Open an issue for it.** One issue per jurisdiction is how this gets tracked — see the five already open (Los Angeles, NYC, Chicago, Seattle, DC) for the format. If you know your city's open-data landscape, or even just that it *has* one, that's worth a comment even before anyone commits to building an adapter.
- **Know a "hidden" parking rule with no signage?** (Like Walnut, CA's citywide overnight-permit requirement — no signs anywhere, you're just expected to know.) Say so on the relevant jurisdiction issue, or open a new one. These are exactly the rules a tool like this can't find on its own — see SPEC.md → "Beyond open data."
- **Help fill in the Coverage list below** — even "I checked and City X has no open data at all" is useful, it stops the same ground getting re-covered.
- **Build an adapter** — the architecture and the per-city data landscape are in [SPEC.md](SPEC.md); a CONTRIBUTING guide with a full worked example is coming once the first real adapter (likely Los Angeles) proves the pattern. Until then, the jurisdiction issues are the place to coordinate.

## Coverage

Every state, alphabetically, with at least its biggest city listed — so you can find your state even if nobody's looked at it yet. Cities beyond the biggest one get added as they're researched or contributed.

**Status key:** ✅ confirmed & sourced · ⚠️ confirmed, with a caveat (stale/gap/different shape — see note) · 🔍 described somewhere but not independently verified yet · ❌ gap, no open source found · *(blank)* not yet researched

Most rows below say "not yet researched" — that's the honest current state, not a bug. That gap is the point (see "Get involved" above). A handful of "biggest city" calls below are genuinely close (Alabama, Missouri, South Carolina) — flagged where that's the case rather than stated as certain.

A broad discovery scan (2026-07-06, see [research/city-hub-scan.md](research/city-hub-scan.md)) found official hub pages and named meter vendors for many cities below — that's real, but shallower than the confirmed-dataset research the checkmarked cities have. Treat "hub found, vendor named" as a lead worth deep-diving, not the same as a confirmed open dataset.

---

**Alabama** — Huntsville *(largest by recent population estimates; close with Birmingham — flagging the uncertainty)* — not yet researched.

**Alaska** — Anchorage — not yet researched.

**Arizona** — Phoenix — not yet researched.

**Arkansas** — Little Rock — not yet researched.

**California** —
- **Los Angeles** — Sweeping: ✅ [LADOT Posted Street Sweeping Routes](https://services1.arcgis.com/PTh9WC0Sf2WS7AAq/arcgis/rest/services/Posted_Street_Sweeping_Routes_Update/FeatureServer/0), actively edited. Meters: ✅ [LADOT Metered Parking Inventory & Policies](https://data.lacity.org/Transportation/LADOT-Metered-Parking-Inventory-Policies/s49e-q6j2) — best-documented meter dataset of any city checked. Permits: ⚠️ [Preferential Parking Districts](https://data.lacity.org/resource/s3st-6nwi.json), real but not updated since 2015-08-13. Crime: ✅ [Crime Data 2020–Present](https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/2nrs-mtv8). → [Issue #2](https://github.com/inkxel/chalked/issues/2)
- San Francisco — Sweeping: ✅ [DataSF `yhqp-riqs`](https://data.sfgov.org/resource/yhqp-riqs.json). Meters: ✅ [DataSF `8vzz-qzz9`](https://data.sfgov.org/resource/8vzz-qzz9.json). Permits/RPP: ⚠️ [DataSF `hi6h-neyh`](https://data.sfgov.org/resource/hi6h-neyh.json) — SFMTA's own 2017 set, flagged by the city as not comprehensively updated. Crime: ✅ [DataSF `ab4h-6ztd`](https://data.sfgov.org/resource/ab4h-6ztd.json). **Already excellently covered by [CURB](https://curb.guide)** — no Chalked adapter needed.
- Glendale, Pasadena, Santa Monica, West Hollywood — Sweeping: 🔍 via [sweep.la](https://sweep.la), not independently sourced. Meters/Permits/Crime: not yet researched.
- **San Diego** *(new candidate, found via broad scan)* — Sweeping: ✅ confirmed real ArcGIS map + open dataset at [data.sandiego.gov](https://data.sandiego.gov/datasets/street-sweeping-schedule/) — best-documented open data found in that scan's West-region batch. Meters/Permits/Crime: not yet researched.

**Colorado** — Denver — hub found (denvergov.org), vendor **ParkMobile**; sweeping page discoverable, city pushes a native app (Pocketgov) for sweeping alerts. No independent aggregator. Datasets not yet independently confirmed.

**Connecticut** — Bridgeport — not yet researched.

**Delaware** — Wilmington — not yet researched.

**Florida** — Jacksonville — not yet researched.

**Georgia** — Atlanta — hub found (atldot.atlantaga.gov), vendor **ATLPlus** for meters. No sweeping mentioned anywhere on the page — possibly not a real enforcement category here. No independent aggregator. Datasets not yet independently confirmed.

**Hawaii** — Honolulu — not yet researched.

**Idaho** — Boise — not yet researched.

**Illinois** — **Chicago** — Sweeping: ✅ [Street Sweeping Schedule 2025](https://data.cityofchicago.org/Sanitation/Street-Sweeping-Schedule-2025/a2xx-z2ja). Permits: ✅ [Permit Parking Zones](https://data.cityofchicago.org/Transportation/Permit-Parking-Zones/qiag-khha). Meters: ❌ private concessionaire, no open API (unofficial scraper: [stevevance/Chicago-Parking-Meters](https://github.com/stevevance/Chicago-Parking-Meters)). Crime: ✅ [Motor Vehicle Theft](https://data.cityofchicago.org/Public-Safety/motor-vehicle-theft/7ac4-d9tk). Independent aggregator: **[We The Sweeple](https://wethesweeple.com)**, confirmed open source ([github.com/srobbin/sweeparoundus](https://github.com/srobbin/sweeparoundus)) — sweeping alerts/calendar only, not comprehensive. → [Issue #4](https://github.com/inkxel/chalked/issues/4)

**Indiana** — Indianapolis — decent hub (parkindy.info) supporting both **ParkMobile and Flowbird**. Sweeping entirely separate, not linked. No independent aggregator. Datasets not yet independently confirmed.

**Iowa** — Des Moines — not yet researched.

**Kansas** — Wichita — not yet researched.

**Kentucky** — Louisville — not yet researched.

**Louisiana** — New Orleans — decent hub at nola.gov, spread across ~4 pages, vendor **ParkMobile**. Oddly, sweeping is filed under "Trash & Recycling," not "Parking," in the city's own site structure. No independent aggregator. Datasets not yet independently confirmed.

**Maine** — Portland — not yet researched.

**Maryland** — Baltimore — Parking Authority hub found; notably meters payable via **three vendor apps simultaneously** (Flowbird, ParkMobile, PayByPhone). Sweeping owned entirely separately by the Dept of Public Works. No independent aggregator. Datasets not yet independently confirmed.

**Massachusetts** — **Boston** — Meters: ✅ [Parking Meters (BostonMaps)](https://bostonopendata-boston.opendata.arcgis.com/maps/boston::parking-meters). Sweeping/Permits/Crime: not yet independently confirmed. Independent aggregator found: **ParkUsher** (multi-city — Boston, NYC, Seattle, SF, and more) — closest analog to CURB found anywhere in the broad scan, worth investigating directly. Official hub (Boston.gov Parking Clerk page) is one of the tidiest found nationally — permits, sweeping-season dates, and the ParkBoston app all from one page.

**Michigan** — Detroit — reasonably consolidated hub (parkdetroit.us), vendor **Flowbird**. Sweeping schedule page looks stale (dated 2022) — a real documentation gap. No independent aggregator. Datasets not yet independently confirmed.

**Minnesota** — Minneapolis — best-organized official hub found in the Midwest scan, including an ArcGIS sweeping map. Vendor **Flowbird** (switched 2023). Caution: local news reported phishing scam ads mimicking the official MPLS Parking app. No independent aggregator. Datasets not yet independently confirmed.

**Mississippi** — Jackson — not yet researched.

**Missouri** — Kansas City *(largest by recent population estimates; close with St. Louis — flagging the uncertainty)* — weakest documentation found in the Midwest scan. Payment fragmented across three concurrent vendors (Park KC, ParkMobile, PayByPhone). No sweeping info surfaced on the official site at all, no independent aggregator — a strong Chalked candidate precisely because so little exists.

**Montana** — Billings — not yet researched.

**Nebraska** — Omaha — not yet researched.

**Nevada** — Las Vegas — meter vendors **Flowbird + ParkWhiz** (the only scanned city on neither ParkMobile/Passport/PayByPhone). Sweeping is a buried, unlinked PDF — and the separate municipality of North Las Vegas has its own page, a real confusion trap for scraping "Las Vegas." No independent aggregator. Datasets not yet independently confirmed.

**New Hampshire** — Manchester — not yet researched.

**New Jersey** — Newark — not yet researched.

**New Mexico** — Albuquerque — not yet researched.

**New York** — **New York City** — Regulations/time limits: ✅ [Parking Regulation Locations and Signs](https://data.cityofnewyork.us/Transportation/Parking-Regulation-Locations-and-Signs/nfid-uabd), 439K rows, daily-updated. Meters: ✅ [ParkNYC Block Faces](https://data.cityofnewyork.us/Transportation/Parking-Meters-ParkNYC-Blockfaces/s7zi-dgdx). Permits: ❌ no citywide model — alternate-side-parking instead. Crime: ✅ [NYPD Complaint Data Historic](https://data.cityofnewyork.us/Public-Safety/NYPD-Complaint-Data-Historic/qgea-i56i). → [Issue #3](https://github.com/inkxel/chalked/issues/3)

**North Carolina** — Charlotte — not yet researched.

**North Dakota** — Fargo — not yet researched.

**Ohio** — Columbus — hub found (parkcolumbus.com), vendor **ParkMobile**. Permits and sweeping live on two separate, uncross-linked sites. No independent aggregator. Datasets not yet independently confirmed.

**Oklahoma** — Oklahoma City — not yet researched.

**Oregon** — Portland — well-built official hub; meter app "Parking Kitty" is a **Passport** white label. Sweeping page exists but is actively changing — PBOT relaunches residential sweeping July 1, 2026, worth re-checking after that. No independent aggregator. *(Note: "Portland, Maine" pollutes search results for this city — a real scraping trap, see [research/city-hub-scan.md](research/city-hub-scan.md).)*

**Pennsylvania** — Philadelphia — split across two agencies: Philadelphia Parking Authority (meters via ParkMobile-powered meterUP app, permits) vs. Streets/Sanitation (sweeping, own live tracker StreetSmartPHL) — no shared hub. No independent aggregator beyond a generic SpotAngels map. Datasets not yet independently confirmed.

**Rhode Island** — Providence — not yet researched.

**South Carolina** — Columbia *(traditionally the largest; Charleston has been closing the gap — flagging the uncertainty)* — not yet researched.

**South Dakota** — Sioux Falls — not yet researched.

**Tennessee** — Nashville — an unofficial FAQ site (nashfaq.com) exists just to explain which parking app to use — a signal the official info is scattered. Real sweeping enforcement only started 2025 (citations Aug, towing Oct), run through a separate "Waste Wizard" tool, not the ParkMobile-based parking hub. No independent aggregator. Datasets not yet independently confirmed.

**Texas** — Houston — solid hub (houstontx.gov/parking), vendor **ParkMobile**. No sweeping-based restriction system found at all — Houston doesn't appear to run CA-style sweeping/towing. No independent aggregator. Datasets not yet independently confirmed. *(Dallas, Austin, San Antonio also scanned — see [research/city-hub-scan.md](research/city-hub-scan.md); similar pattern of little-to-no sweeping enforcement across Sunbelt cities generally.)*

**Utah** — Salt Lake City — not yet researched.

**Vermont** — Burlington — not yet researched.

**Virginia** — Virginia Beach — not yet researched.

**Washington** — **Seattle** — Permits/RPZ: ✅ [Restricted Parking Zones](https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::restricted-parking-zones). Crime: ✅ [SPD Crime Data 2008–Present](https://data.seattle.gov/Public-Safety/SPD-Crime-Data-2008-Present/tazs-3rd5). Meters: 🔍 described as unusually rich in research, exact link unconfirmed. Sweeping: not yet confirmed open — worth a dashboard-tracing check before assuming absent. → [Issue #5](https://github.com/inkxel/chalked/issues/5)

**West Virginia** — Charleston — not yet researched.

**Wisconsin** — Milwaukee — best independent find of the Midwest scan: **MKE CitySmart** (mkecitysmart.com), bundles parking + sweeping + trash-day alerts. Official meter app is a **ParkMobile** white label. Datasets not yet independently confirmed.

**Wyoming** — Cheyenne — not yet researched.

**District of Columbia** *(not a state, included as its own entry)* — **Washington** — Sweeping: N/A, no residential sweeping program (snow-emergency/leaf-season rules instead). Permits: ✅ [Residential Parking Permit Blocks](https://opendata.dc.gov/datasets/DCGIS::residential-parking-permit-blocks). Meters: 🔍 ParkDC referenced, exact dataset unconfirmed. Crime: 🔍 described as open, exact link unconfirmed. → [Issue #6](https://github.com/inkxel/chalked/issues/6)

## Why this project exists

I normally ride a motorcycle — parking is a non-issue. But every time I take the car out in LA, I hesitate before I even leave the house, because deciphering street parking signage here is genuinely exhausting. Sweeping days, permit zones, meter hours that change on weekends — none of it is legible in the moment you actually need it.

The sharper version of this hit closer to home. We live in new construction, and Waymo cars keep parking across our driveway — we've been blocked in more than once. My best guess is their "safe to park here" data is stale: our house used to be an empty lot, and whatever dataset they're using to decide a spot is legal probably hasn't caught up. That's the part that actually got me building this. This isn't just a human annoyance anymore — we're deploying autonomous vehicles that need to know where they can and can't park, on the same fragmented, inconsistent, often-stale municipal data humans have been squinting at for decades. If a self-driving car can get it wrong on my own street, the underlying data problem is bigger than an app can fully solve — which is kind of the point. As much as this is meant to be a genuinely useful tool, it's also meant to be a visible argument for why curb and parking data needs a real, consolidated national standard. Every fragmented, half-published, undocumented dataset this project has to work around is evidence for that case.

## Disclaimer

This is informational only. It is not responsible for citations, towing, or any consequence of relying on it. **Always defer to posted physical signage over anything this shows.** The data here is aggregated from public sources and can be incomplete, outdated, or wrong — see SPEC.md for known staleness issues in specific datasets. If you see something wrong, please report it (see SPEC.md for the planned error-reporting flow) — but don't park on the strength of an app over what the sign in front of you says.

## License
MIT (see [LICENSE](LICENSE)).
