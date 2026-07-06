# Los Angeles

Currently the strongest single candidate for Chalked's first real adapter — see SPEC.md → First adapters to build. Full standing: sweeping (fresh), meters (best documented anywhere), crime (open), permits (open but stale, disclosed honestly).

## Sweeping

Tucker found LA's public sweeping lookup (streets.lacity.gov) and an ArcGIS dashboard, and asked directly whether "no open API" (the initial research-pass call) was actually true. It wasn't.

Traced the dashboard (`Sweeping Routes in LA`, official LA Bureau of Street Services account, 550K+ views) using the [dashboard-tracing method](../dashboard-tracing-method.md) back to the actual backing service: **`Posted_Street_Sweeping_Routes_Update`**, a public, unauthenticated ArcGIS Feature Service:

```
https://services1.arcgis.com/PTh9WC0Sf2WS7AAq/arcgis/rest/services/Posted_Street_Sweeping_Routes_Update/FeatureServer/0
```

Confirmed live with a real query — fields: `Route`, `Posted_Day`, `Posted_Time`, `Weeks` (1&3 vs 2&4), `Odd_Even` (side of street), `Maint_District`. Polygon geometry (routes as zones, not per-block line segments like SF's). Actively edited (`last_edited_date` tracked).

**Why the earlier "fragmented" call was wrong:** LA doesn't advertise this the way Socrata-based portals (SF, Chicago, NYC) advertise their APIs directly — it's the backing service behind a citizen-facing dashboard, not a developer-facing open-data listing. The data was there the whole time; nobody had traced it yet. This finding is what prompted the [dashboard-tracing method](../dashboard-tracing-method.md) write-up.

**CDS is not an alternative path here — checked and closed out (2026-07-06).** LA's actual CDS implementation ("Code the Curb," LADOT) is a downtown-only pilot for commercial loading zones via the CurbIQ vendor platform, gated behind OAuth2 partner credentials, with no sweeping or permit data anywhere in it. Full finding in [national-vendor-landscape.md](../national-vendor-landscape.md). The ArcGIS Feature Service above remains the confirmed real source.

**Worth cross-checking:** LA's open-data portal may also publish sweeping data directly via Socrata — dataset id `krk7-ayq2`, "Posted Street Sweeping Routes," `data.lacity.org` — found incidentally during the CDS check, not yet verified against the ArcGIS Feature Service above (same underlying data exposed two ways, or a genuinely separate source — unknown until checked).

## Permits

Tucker found LA's Preferential Parking Districts (PPD) dataset: `data.lacity.org/.../LADOT-Preferential-Parking-Districts-PPD-/2ckn-xmjp`. Same pattern as the sweeping dashboard — `2ckn-xmjp` is a Socrata visualization wrapper, not the real dataset. Traced it (Socrata's version of the same tracing instinct) to the actual backing table:

```
LADOT_PPD (Socrata s3st-6nwi)
https://data.lacity.org/resource/s3st-6nwi.json
```

Real, queryable, MultiPolygon geometry, fields `PPDNUM` + `PPDNAME`, public domain (CC0).

**Adapter built and browser-verified (2026-07-06):** `scripts/fetch_la_permits.py` — 155 districts, small enough to render directly with no clustering needed. Rendered as a distinct dashed-blue outline (not the sweeping green/amber/red scale — permits are an eligibility question the app can't resolve on its own, matching SPEC.md's Visual design distinction), with the 2015 staleness surfaced directly in the click panel, not just in this doc.

**The honest catch:** `rowsUpdatedAt` is **2015-08-13** — the same as its creation date. Despite the dataset's own metadata claiming a "Committed Update Frequency: Annual," there's no evidence it's actually been refreshed once in a decade. Any preferential parking district created, resized, or retired since 2015 wouldn't show up. Different risk profile than the sweeping data (which has active edit tracking) — real and usable, but needs a "data as of 2015" disclosure if used, and probably a periodic manual check against LADOT's current signage rather than blind trust.

## Meters

`LADOT Metered Parking Inventory & Policies` — `https://data.lacity.org/resource/s49e-q6j2.json` — real, Socrata-hosted, **34,943 individual meter points** citywide (adapter: `scripts/fetch_la_meters.py`, built and browser-verified 2026-07-06).

**Honest limitation, found by actually reading the schema, not assumed:** the dataset has `spaceid`, `blockface`, `metertype`, `ratetype`, `raterange`, `timelimit`, and a lat/lng point — but **no operating-hours or day-of-week field at all**. There's no "free on weekends" signal to show either way, in either direction — not that it's missing from Chalked, it's missing from the source. Displayed honestly: rate and time-limit as a fact, with an explicit "check the posted sign for when payment is required" note, rather than implying a schedule Chalked doesn't actually have.

**Rendering note, permanently useful:** 34,943 points is far too many for plain Leaflet markers — renders but chokes interaction. Used [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) (clusters at city-wide zoom, resolves to individual circle markers past zoom 18) rather than a custom solution. This is the standard tool for exactly this problem; worth reaching for again whenever any city's per-point dataset (meters, individual signs) gets into the thousands.

## Crime

`Crime Data from 2020 to Present` — `https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/2nrs-mtv8` — open, Socrata-hosted. Not yet filtered down to vehicle-break-in-specific codes (see SPEC.md's Break-in/vehicle-crime data note) — and the crime-risk overlay itself is currently paused pending [Discussion #1](https://github.com/inkxel/chalked/discussions/1), so this is background context, not an active build target.

## Regional context: sweep.la

**[sweep.la](https://sweep.la)** ("Sweep LA") aggregates sweeping lookups for LA plus **4 neighboring cities** — Santa Monica, Glendale, West Hollywood, Pasadena — each running its own independent program. Multilingual (en/es/ko/ru/tl), PWA, "as-is, not affiliated with the City of Los Angeles." No GitHub link found — not confirmed open source, unlike [CURB](san-francisco.md).

This is real signal that crossing city boundaries already happens at solo/small-team scale in this space — but it doesn't remove the reason for a real, open Chalked adapter: sweep.la isn't confirmed open source, and the 4 neighboring cities' own data sources haven't been independently traced yet (see the coverage list in the README).

## No CURB-equivalent found for LA specifically

Worth a dedicated check before committing further — the [CURB](san-francisco.md) precedent (GPS-matched citations to infer *real* enforcement timing, not just posted schedule) is the bar to clear if LA's own citation data supports the same trick.
