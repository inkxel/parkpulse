# National boundary layer & coverage registry

How Chalked's "national map from day one, gray where uncovered" pitch (SPEC.md → Architecture reframe) actually became real, 2026-07-06.

## Source: Census TIGERweb, queried the same way as any city adapter

**[TIGERweb Incorporated Places](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/28)** — an ArcGIS Feature Service, same shape as LA's own sweeping data. Fields: `STATE` (FIPS), `PLACE` (FIPS), `NAME`. Geometry type: polygon. **19,731 incorporated places, confirmed nationally**, fetched in a single query — the service's `maxRecordCount` (100,000) covers it without pagination.

Place-level granularity was the deliberate choice, not county-level, even though county boundaries are far fewer (3,143) and would've been a smaller/simpler dataset. Parking rules are set by *city* governments, and cities can be surrounded by or adjacent to other, separately-governed cities — this got directly validated during testing: clicking a point in the San Fernando Valley correctly returned "San Fernando city, CA — not covered," a real, separate incorporated city entirely inside the LA metro area, distinct from Los Angeles proper. County-level resolution would have wrongly lumped the two together.

## The size tradeoff, measured directly, not assumed

Full TIGER/Line precision is unusably large at national scale (California alone, 483 places, full detail: **17MB**). ArcGIS REST's `maxAllowableOffset` parameter simplifies server-side before the response is even sent:

| Simplification | CA (483 places) | National (19,731 places, extrapolated/actual) |
|---|---|---|
| None (full precision) | 17MB | ~690MB (extrapolated, never fetched) |
| 0.001° (~100m) | 735KB | ~30MB (extrapolated) |
| **0.005° (~500m) — chosen** | 282KB | **9.3MB raw / 14MB with properties (actual, fetched)** |
| 0.01° (~1km) | 204KB | ~8.3MB (extrapolated, risks distorting small-town shapes) |

500m struck the right balance: recognizable city shapes at a national/regional zoom (which is all this layer needs to do — city-level precision comes from each city's own adapter, e.g. LA's real sweeping/meter/permit geometry, not from this shell), while staying a reasonable one-time cached load.

## Rendering at this scale: canvas + no per-feature interactivity

19,731 individual Leaflet paths would be far too many DOM elements for the default SVG renderer, and registering 19,731 individual click listeners doesn't scale either. Fix: `renderer: L.canvas()` (one canvas element, not one per feature) plus `interactive: false` on the layer itself — interactivity is handled once, at the *map* level, via a single click handler that does a `turf.booleanPointInPolygon` search against the already-loaded national-places data. Leaflet's own path click handlers stop event propagation to the map by default, so a click that actually lands on a rendered sweeping/meters/permits zone never reaches this fallback — it only fires for clicks that no more-specific layer already handled.

## Coverage registry: hand-maintained, not generated

`data/coverage_registry.json` — unlike everything else in `data/`, this is **source, not a generated artifact** (worth remembering: it's excluded from `.gitignore`'s `data/*.geojson` pattern deliberately, on purpose, not an oversight). Keyed by `place_id` (state FIPS + place FIPS, e.g. `0644000` for Los Angeles), each entry carries a per-category status (`built`/`in_progress`/`gap`/`not_applicable`/`unconfirmed`/`paused`) and population — see [schema/coverage-registry.md](../schema/coverage-registry.md) for the full shape (this replaced an earlier flat `status` + `categories: [...]` array shape that couldn't distinguish "confirmed gap" from "not built yet"). `app.js`'s `isCovered()` derives the map's blue/gray treatment from whether *any* category is `built` — the per-category detail only matters once you're inside that jurisdiction. Adding a new city to Chalked, once its adapter exists, means adding one entry here — the map, the gray/highlighted styling, and the click-fallback logic all read from this file without any other code changes.

## Verified outcomes (2026-07-06, via Playwright)

- Click inside Los Angeles proper (no specific zone underneath) → "You're in Los Angeles city — click a colored zone above."
- Click inside San Fernando (a real, separate incorporated city) → "You're in San Fernando city, CA — not covered yet. Help us add it →" (links to the repo)
- Click in genuinely unincorporated land (rural Kansas) → "No jurisdiction found here."

All three are real, distinct, correct outcomes from the same lookup — not hardcoded per case.
