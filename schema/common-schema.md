# Common schema

The normalized shape every per-jurisdiction adapter converts its source data into, so nothing downstream (the site, future adapters, future contributors) needs to know any one city's particular field names. This formalizes what the three real LA adapters (`scripts/fetch_la_*.py`) already do in practice — see "Prior art already in the repo" below — rather than inventing something new; SPEC.md's "Architecture (draft)" section is the narrative version of this, this file is the concrete one.

There are two independent things a common schema has to handle, and they don't collapse into each other: **per-feature data** (a specific block, zone, or point — sweeping/meters/permits/crime) and **jurisdiction-wide default rules** (a rule that isn't tied to any geometry at all — see the Walnut, CA case below). A city can have both simultaneously.

## Per-feature data: a GeoJSON Feature, plus common fields

Every category's adapter output is a GeoJSON `FeatureCollection`. Geometry is intentionally untyped at the schema level — **geometry-shape tolerance is a requirement, not an oversight**: LA's sweeping routes and permit districts are polygons, LA's meters are points, SF's blocks (per CURB, see `research/cities/san-francisco.md`) are line segments. The schema doesn't pick a geometry type per category; each adapter uses whatever shape its source data actually is, and any code consuming a category (rendering, point-in-polygon lookups) already has to branch on geometry type regardless — CurbLR made the same call (linear-referenced), and forcing every city into one shape would just relocate the fragmentation problem into the schema instead of solving it.

Every feature's `properties` carries these fields regardless of category, plus category-specific fields on top:

```jsonc
{
  "jurisdiction": "Los Angeles, CA",   // human-readable, for display/debugging
  "category": "sweeping",              // "sweeping" | "meters" | "permits" | "crime"
  "data_as_of": "2026-07-06",          // vintage of the underlying data itself (see below)
  "source": {
    "name": "LADOT Posted Street Sweeping Routes",
    "url": "https://services1.arcgis.com/.../FeatureServer/0",
    "last_synced": "2026-07-06T18:04:00Z"   // when Chalked's own adapter last successfully ran
  }
  // ...category-specific fields below
}
```

### Two timestamps, not one — they answer different questions

This is the concrete fix for the thing that forced this whole section: LA's sweeping and LA's permits are both "successfully synced today," but one is genuinely current and the other is frozen since 2015. A single "last updated" field can't tell those apart, so there are two:

- **`source.last_synced`** — when Chalked's *own adapter* last ran successfully. Answers "is Chalked's copy stale relative to its own source." This is always fresh for a working sync job, even against a source that never changes.
- **`data_as_of`** — the vintage of the *underlying data itself*, as the source claims it. Answers "how current is this fact, really." For a live-edited source (LA sweeping), this tracks `last_synced` closely. For a frozen source (LA permits, `rowsUpdatedAt` stuck at 2015-08-13 despite a claimed annual refresh), this stays put even though `last_synced` updates every sync run — which is the honest behavior: automation can't manufacture freshness the source doesn't have, only report the lack of it (SPEC.md's "Data pipeline" section makes the same point in prose).

**Both are required per feature, not just per adapter** — a future city might have per-block heterogeneous freshness (some zones added last month, some from a decade-old base layer merged in), and collapsing to one timestamp per adapter run would hide that.

### Category-specific fields (per existing adapters — `scripts/fetch_la_*.py`)

| Category | Fields (beyond the common ones above) | Nullable? |
|---|---|---|
| **sweeping** | `route_id`, `day_of_week`, `start_time`, `end_time`, `weeks_of_month[]`, `side_of_street`, `maintenance_district`, `maintenance_district_name`, `route_type` | Every field independently nullable — LA's own adapter already skips routes with unparseable day/time/week fields rather than guessing (see `fetch_la_sweeping.py`'s `skipped` counter); a city with a partial schedule (e.g. day known, hours not) should carry the nulls through, not drop the feature. |
| **meters** | `space_id`, `blockface`, `meter_type`, `rate_type`, `rate`, `time_limit`, `schedule` | `schedule` is `null` for LA specifically — the source has no operating-hours field at all, not an adapter gap. A city whose meter data *does* include hours populates it; the field exists in the schema either way so the UI can ask "is this null because the city doesn't publish it, or because nobody's wired it up yet" (see status enum below, which answers that at the *category* level; a null field is the *feature*-level version of the same honesty). |
| **permits** | `district_number`, `district_name` | `data_as_of` (common field, above) is what actually carries the 2015 staleness today — see `renderPermitPanel` in `app.js`. |
| **crime** | Not yet defined — **paused**, see `ETHICS.md` and [Discussion #1](https://github.com/inkxel/chalked/discussions/1). Deliberately not speced here; whatever categories/aggregation get decided should come out of that discussion, not be pre-empted by a schema written before it. |

## Category status: six states, not a binary

The coverage registry (`data/coverage_registry.json`, see `schema/coverage-registry.md`) needs to say more than "built or not" per category per jurisdiction — SPEC.md's open question ("this category doesn't meaningfully apply here" vs. "no data yet") needed an actual answer, not just a note that it needed one. Six states:

| Status | Meaning | Example |
|---|---|---|
| `built` | A real adapter exists, features are live in the database. | LA sweeping/meters/permits |
| `in_progress` | A contributor has claimed this category and is actively building it — not yet merged, but not open for someone else to duplicate either. Exists mainly to serve the contribution workflow (`CONTRIBUTING.md`): claim by opening this status via PR, avoid two people building the same adapter unknowingly. | (none yet — the first real use of this status will be whoever picks up the next adapter) |
| `gap` | Checked directly, no open data exists for this category in this jurisdiction — confirmed absence, not an assumption. | Chicago meters (private concessionaire, no open API) — pending the municipal-code-hosting-style re-check other research in this repo is doing |
| `not_applicable` | The category doesn't meaningfully exist as a concept here — there's nothing to build, not a data gap. | Street sweeping in most Sunbelt cities (`research/city-hub-scan.md`); NYC's permit-zone model (NYC uses alternate-side parking, not RPP) |
| `unconfirmed` | Nobody has actually checked yet — the honest default, not "gap." Distinct from `gap` specifically because LA's own two "gap" calls both turned out to be `unconfirmed`-that-was-actually-`built`, once someone applied `research/dashboard-tracing-method.md`. Don't call something a `gap` on a search-engine-level check alone. | Seattle sweeping, before this round of research |
| `paused` | A deliberate, documented decision not to build this category yet, for reasons other than data availability. | Crime/break-in risk, everywhere — see `ETHICS.md` |

A jurisdiction's overall map treatment (blue outline vs. gray fill in `app.js`) is derived, not stored: **covered** if any category is `built`, gray otherwise. This means "Chicago minus meters" (`built`, `built`, `gap`, `built`) renders exactly like a fully-`built` jurisdiction at the national-map zoom level — the per-category granularity only becomes visible once you're in that jurisdiction, which is intentional (SPEC.md's open question about not making partial coverage read as broken).

## Jurisdiction-wide default rules — not tied to any geometry

The Walnut, CA case (`research/municipal-code-hosting.md`): a citywide overnight-permit-parking rule with **no signage anywhere**, existing only in municipal code, applying to the whole jurisdiction by default rather than to any specific block or zone. This can't be represented as a Feature at all — there's no geometry to attach it to, and forcing one (e.g. "the jurisdiction's own boundary polygon") would wrongly imply it's block-specific like everything else in the schema.

```jsonc
{
  "place_id": "0683668",              // same key as coverage_registry.json, ties it to a jurisdiction
  "rule_id": "walnut-overnight-permit",
  "description": "Overnight parking anywhere in city limits requires a residential permit — no exceptions, no signage.",
  "signed": false,                     // the load-bearing field: false means "always defer to the posted sign" doesn't apply here, because there IS no sign
  "source": {
    "name": "Walnut Municipal Code",
    "citation": "WMC §10.20.040",      // code citation, not a URL -- see schema/coverage-registry.md's municipal-code-hosting note
    "url": null
  },
  "data_as_of": "2026-07-12"
}
```

`signed: false` is the field that actually matters here, not a cosmetic detail — it's the flag that tells the UI this rule needs to be surfaced proactively (can't rely on "check the posted sign," SPEC.md's whole disclaimer safety net, because there's nothing posted). A jurisdiction can have zero, one, or many of these, stored separately from its per-category Feature data — see `schema/coverage-registry.md` for where these live on disk.

## Prior art already in the repo

The three real LA adapters (`scripts/fetch_la_sweeping.py`, `fetch_la_meters.py`, `fetch_la_permits.py`) already produce something very close to this shape — `jurisdiction`, `category`, `source.{name,url,last_synced}` are already there verbatim. What this doc adds/formalizes on top of that existing practice:
- `data_as_of` as a **required common field**, not something only the permits adapter happens to set (sweeping/meters' adapters can set it equal to `last_synced` at sync time, since both sources are live)
- The five-state category-status enum, replacing the implicit "gap"/"unconfirmed"/"open" language used loosely across SPEC.md and `research/`
- Jurisdiction-wide default rules as a wholly new, separate concept — nothing in the repo builds this yet, this is the first spec for it
