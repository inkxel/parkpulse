# Contributing to Chalked

Chalked's core engineering work is one adapter per jurisdiction per category — the national map shell, the coverage registry, and the common schema all already exist precisely so a new adapter is the *only* thing a contribution needs to add. This guide is what SPEC.md's Next Steps has been pointing at since the national-shell reframe: "the per-city adapter work becomes the first contributions, proving out the adapter interface... rather than 'the v1 launch.'"

If you're looking for what to work on, start with SPEC.md's "First adapters to build" ranking, or sort `data/coverage_registry.json` by population × missing categories yourself — see "What to build next" below.

## Before you write any code: find the data

Most cities' open-data portals don't advertise everything they actually have. **Read [research/dashboard-tracing-method.md](research/dashboard-tracing-method.md) first** — it's the technique that overturned two of LA's own "this doesn't exist" calls (sweeping and permits both turned out to be real, queryable ArcGIS Feature Services hiding behind citizen-facing dashboards nobody had traced back to source). The short version:

1. Find the citizen-facing dashboard/map for the category you're after (search `<city> street sweeping map`, `<city> parking permit map`, etc.).
2. If it's ArcGIS-based, get the dashboard's item ID from its URL, query `https://www.arcgis.com/sharing/rest/content/items/<id>?f=json` for its Web Map item id, then that Web Map's `/data?f=json` for `operationalLayers[]` — each has a real Feature Service `url` you can query directly.
3. If it's Socrata-based (common for Chicago/NYC/SF-style portals), the API is usually advertised directly on the dataset's own page — check there first.

**Don't conclude "gap" from a search-engine-level check alone.** Mark it `unconfirmed` in the registry (see below) instead, and leave the dashboard-tracing pass for whoever picks it up next — see `schema/common-schema.md`'s status enum for why `gap` and `unconfirmed` are deliberately different things.

If what you're after is a rule with **no dataset and no signage at all** (the Walnut, CA case — see [research/municipal-code-hosting.md](research/municipal-code-hosting.md)), that's a different search: check whether the city's municipal code is hosted on Municode, American Legal Publishing, or General Code before assuming you need a bespoke scrape.

## The common schema

**Read [schema/common-schema.md](schema/common-schema.md)** before writing an adapter — it's short and defines exactly what your adapter needs to output: a GeoJSON `FeatureCollection`, common fields (`jurisdiction`, `category`, `data_as_of`, `source.{name,url,last_synced}`) on every feature, plus category-specific fields (documented per category in that file, matching what the existing LA adapters already produce). Geometry type is untyped on purpose — use whatever shape your source data actually is (polygon, line, point); don't force it into a different shape to match another city's adapter.

The two timestamps matter and aren't interchangeable: `source.last_synced` is when *your adapter* last ran; `data_as_of` is how current the *underlying data* actually is, per the source's own claim. For a live-edited source they're the same. For a source like LA's permit data (frozen since 2015 despite a claimed annual refresh), they diverge — and that divergence is exactly the honest signal the UI's confidence badge (`confidenceBadge()` in `app.js`) surfaces to users. Set both correctly; don't just copy `last_synced` into `data_as_of` without checking whether the source is actually current.

## Worked example: the LA adapters

`scripts/fetch_la_sweeping.py`, `fetch_la_meters.py`, and `fetch_la_permits.py` are the three real adapters in the repo — read whichever is closest to your target category before writing your own. Shape they all follow:

1. **Fetch** — pull raw records from the source (ArcGIS `/query` endpoint or Socrata's REST API), no transformation yet.
2. **Transform** — map the source's field names into the common schema's field names (e.g. LA's `Posted_Day` → Chalked's `day_of_week`). Skip and count (don't silently drop) any record missing a field your transform genuinely needs — see `fetch_la_sweeping.py`'s `skipped` counter for the pattern. Set `data_as_of` deliberately, not by default.
3. **Write** — dump the resulting `FeatureCollection` to `data/<city>-<category>.geojson`. This file is generated, not committed (see `.gitignore` and `data/README.md`) — anyone running the site locally regenerates it by re-running your script.

A contribution PR includes the script (`scripts/fetch_<city>_<category>.py`), not the generated `.geojson` output.

**Before opening the PR, validate your adapter's output against the schema:**

```
python3 scripts/fetch_<city>_<category>.py
python3 scripts/validate_schema.py geojson data/<city>-<category>.geojson
```

This checks structurally what a reviewer would otherwise have to check by eye — every feature has the common fields (`jurisdiction`, `category`, `data_as_of`, `source.{name,url,last_synced}`), a valid `category` value, parseable timestamps, and the category-specific keys documented in `schema/common-schema.md` (present, even if the value is legitimately `null`). It doesn't and can't check that your field *mappings* are correct — that still needs a human read of your transform function against the source's real schema.

## Registering your adapter

Once your adapter works, add or update an entry in `data/coverage_registry.json` — **the one hand-maintained file in `data/`**, and the only registration step needed; the map, its blue/gray styling, and the click-fallback logic all read from this file with no other code changes required. See [schema/coverage-registry.md](schema/coverage-registry.md) for the full shape. Minimally:

```jsonc
{
  "0603526": {                          // place_id: state FIPS + place FIPS (same as TIGERweb)
    "name": "Berkeley",
    "state": "CA",
    "population": 124321,
    "categories": {
      "sweeping": "built",              // what you just built
      "meters": "unconfirmed",          // honest default for anything you didn't check
      "permits": "unconfirmed",
      "crime": "paused"                 // see ETHICS.md -- don't build this without reading it first
    }
  }
}
```

If you're actively working on a category but haven't merged yet, set it to `in_progress` in a draft PR — this is what that status exists for, so two people don't duplicate the same adapter without knowing it.

## If you're touching the crime/break-in category

Don't, yet — it's deliberately paused pending community input, not an oversight. Read `ETHICS.md` and weigh in at [Discussion #1](https://github.com/inkxel/chalked/discussions/1) before writing any code here.

## If a user reports something wrong before you fix it

Reports come in through GitHub Issues via `.github/ISSUE_TEMPLATE/data-issue.yml` (a specific data point is wrong) or `unsigned-rule.yml` (a rule exists with no posted sign — see `schema/error-report-pipeline.md` for the full design). If you're triaging one, add `city:<jurisdiction>` and `category:<category>` labels during review — the templates deliberately don't auto-apply those, since one template covers every jurisdiction.

## What to build next

SPEC.md's "First adapters to build" section ranks candidates by population × data completeness, softly weighted (a bigger city with a messier gap can still be worth more than a smaller city with clean data). It's deliberately not a strict queue — anyone can pick up any jurisdiction. If you want to sort for yourself: every entry in `data/coverage_registry.json` carries `population`, and every category not yet `built` is fair game.

Two research findings worth knowing before you start:
- LA's own "gap" calls for sweeping and permits were both wrong — always dashboard-trace before writing off a category as unavailable.
- Sweeping isn't a universal primary category — Sunbelt cities show little to no sweeping enforcement (see `research/city-hub-scan.md`), so a Sunbelt adapter's natural lead category may be meters or permits instead. Mark sweeping `not_applicable` there, not `gap` — see `schema/common-schema.md`'s status enum for why that distinction matters.

## CI

`.github/workflows/lint.yml` runs on every PR: Python syntax on `scripts/*.py`, the registry validator above against `data/coverage_registry.json`, YAML validity on the issue templates/workflows, and a syntax check on `app.js`. It can't validate your adapter's actual output (that's gitignored, see `data/README.md`) — run `validate_schema.py geojson` yourself before pushing, per above.

If you're filing a data-issue or unsigned-rule report through the GitHub issue templates, `.github/workflows/label-data-issues.yml` automatically applies `city:*`/`category:*` labels by parsing the Jurisdiction/Category fields you filled in — no manual triage step needed for that part anymore.

## Style

This repo's markdown files write in direct, confident sentences backed by real sources (URLs, dataset IDs, citations) — not hedged filler. Match that. Code comments explain *why*, not *what* — see any existing file in `scripts/` or `app.js` for the tone.
