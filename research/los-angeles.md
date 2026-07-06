# Los Angeles

Currently the strongest single candidate for ParkPulse's first real adapter — see SPEC.md → First adapters to build. Full standing: sweeping (fresh), meters (best documented anywhere), crime (open), permits (open but stale, disclosed honestly).

## Sweeping

Tucker found LA's public sweeping lookup (streets.lacity.gov) and an ArcGIS dashboard, and asked directly whether "no open API" (the initial research-pass call) was actually true. It wasn't.

Traced the dashboard (`Sweeping Routes in LA`, official LA Bureau of Street Services account, 550K+ views) using the [dashboard-tracing method](dashboard-tracing-method.md) back to the actual backing service: **`Posted_Street_Sweeping_Routes_Update`**, a public, unauthenticated ArcGIS Feature Service:

```
https://services1.arcgis.com/PTh9WC0Sf2WS7AAq/arcgis/rest/services/Posted_Street_Sweeping_Routes_Update/FeatureServer/0
```

Confirmed live with a real query — fields: `Route`, `Posted_Day`, `Posted_Time`, `Weeks` (1&3 vs 2&4), `Odd_Even` (side of street), `Maint_District`. Polygon geometry (routes as zones, not per-block line segments like SF's). Actively edited (`last_edited_date` tracked).

**Why the earlier "fragmented" call was wrong:** LA doesn't advertise this the way Socrata-based portals (SF, Chicago, NYC) advertise their APIs directly — it's the backing service behind a citizen-facing dashboard, not a developer-facing open-data listing. The data was there the whole time; nobody had traced it yet. This finding is what prompted the [dashboard-tracing method](dashboard-tracing-method.md) write-up.

## Permits

Tucker found LA's Preferential Parking Districts (PPD) dataset: `data.lacity.org/.../LADOT-Preferential-Parking-Districts-PPD-/2ckn-xmjp`. Same pattern as the sweeping dashboard — `2ckn-xmjp` is a Socrata visualization wrapper, not the real dataset. Traced it (Socrata's version of the same tracing instinct) to the actual backing table:

```
LADOT_PPD (Socrata s3st-6nwi)
https://data.lacity.org/resource/s3st-6nwi.json
```

Real, queryable, MultiPolygon geometry, fields `PPDNUM` + `PPDNAME`, public domain (CC0).

**The honest catch:** `rowsUpdatedAt` is **2015-08-13** — the same as its creation date. Despite the dataset's own metadata claiming a "Committed Update Frequency: Annual," there's no evidence it's actually been refreshed once in a decade. Any preferential parking district created, resized, or retired since 2015 wouldn't show up. Different risk profile than the sweeping data (which has active edit tracking) — real and usable, but needs a "data as of 2015" disclosure if used, and probably a periodic manual check against LADOT's current signage rather than blind trust.

## Meters

`LADOT Metered Parking Inventory & Policies` — `https://data.lacity.org/Transportation/LADOT-Metered-Parking-Inventory-Policies/s49e-q6j2` — the best-documented meter dataset of any city checked so far. Not yet independently deep-dived beyond confirming it's real, open, and Socrata-hosted; no staleness or schema concerns surfaced yet.

## Crime

`Crime Data from 2020 to Present` — `https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/2nrs-mtv8` — open, Socrata-hosted. Not yet filtered down to vehicle-break-in-specific codes (see SPEC.md's Break-in/vehicle-crime data note) — and the crime-risk overlay itself is currently paused pending [Discussion #1](https://github.com/inkxel/parkpulse/discussions/1), so this is background context, not an active build target.

## Regional context: sweep.la

**[sweep.la](https://sweep.la)** ("Sweep LA") aggregates sweeping lookups for LA plus **4 neighboring cities** — Santa Monica, Glendale, West Hollywood, Pasadena — each running its own independent program. Multilingual (en/es/ko/ru/tl), PWA, "as-is, not affiliated with the City of Los Angeles." No GitHub link found — not confirmed open source, unlike [CURB](san-francisco.md).

This is real signal that crossing city boundaries already happens at solo/small-team scale in this space — but it doesn't remove the reason for a real, open ParkPulse adapter: sweep.la isn't confirmed open source, and the 4 neighboring cities' own data sources haven't been independently traced yet (see the coverage list in the README).

## No CURB-equivalent found for LA specifically

Worth a dedicated check before committing further — the [CURB](san-francisco.md) precedent (GPS-matched citations to infer *real* enforcement timing, not just posted schedule) is the bar to clear if LA's own citation data supports the same trick.
