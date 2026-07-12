# Coverage registry schema

`data/coverage_registry.json` — the hand-maintained (not generated) map of what Chalked actually has built, per jurisdiction per category. This is the file `app.js` reads to decide blue-outline-covered vs. gray-fill-uncovered on the national map (`research/national-boundary-layer.md`), and the file a new adapter contribution edits to register itself (`CONTRIBUTING.md`).

## Shape

```jsonc
{
  "0644000": {                          // key: place_id — same STATE+PLACE FIPS concatenation
                                         // TIGERweb uses, so it lines up with the national
                                         // boundary layer with no translation step
    "name": "Los Angeles",
    "state": "CA",
    "population": 3898747,              // Census-sourced, city proper — see "Why population lives here" below
    "categories": {
      "sweeping": "built",
      "meters": "built",
      "permits": "built",
      "crime": "paused"
    }
  }
}
```

Each `categories` value is one of the six statuses defined in `schema/common-schema.md` (`built` / `in_progress` / `gap` / `not_applicable` / `unconfirmed` / `paused`). A jurisdiction doesn't need an entry for a category it hasn't looked at yet — an absent key is equivalent to `unconfirmed`, so `research/city-hub-scan.md`-style discovery-pass cities (scanned but not deeply researched) don't need placeholder entries for categories nobody's touched.

## What changed from the original shape

The original registry (pre-2026-07-12) had a single top-level `status: "supported"` field plus a flat `categories: [...]` array of only the *built* categories:

```jsonc
// old shape — superseded
{ "0644000": { "name": "Los Angeles", "state": "CA", "status": "supported", "categories": ["sweeping", "meters", "permits"] } }
```

This worked for LA specifically because LA had no `gap`/`not_applicable`/`paused` categories worth distinguishing from "just not built yet" — everything not in the array was implicitly "no." It stops working the moment a jurisdiction needs to say "meters is a confirmed gap, not just unbuilt" (Chicago) or "sweeping doesn't apply here" (a Sunbelt city) — a flat list of built categories can't carry that distinction, which was SPEC.md's own open question. The top-level `status` field is also now redundant: "is this jurisdiction covered at all" is derivable (`any category === "built"`) rather than a second source of truth that could drift out of sync with the categories themselves.

## Why population lives here, not somewhere else

SPEC.md's "First adapters to build" prioritization is explicitly population × data-completeness (soft-weighted, not a hard cutoff). Population needs to be queryable per jurisdiction to support a future "sort by most-needed" contributor-facing view (SPEC.md's open questions list) — and the same Census TIGER/Line source already feeding the national boundary layer publishes place-level population estimates, so this isn't a second data source to integrate, just a field to carry through into the one hand-maintained file that's keyed by the same `place_id`.

## Jurisdiction-wide default rules live in a separate file, not here

`schema/common-schema.md`'s jurisdiction-wide default rules (the Walnut, CA case) are keyed by the same `place_id`, but intentionally **not** folded into `coverage_registry.json` — that file's whole shape is "which categories are built," and a jurisdiction-wide rule isn't a category, it's an orthogonal fact that can exist whether or not any category is built at all (a city could have zero adapters and still have a known unsigned citywide rule, if the error-reporting pipeline surfaces one before anyone's built a real adapter there). These belong in a future `data/jurisdiction_rules.json`, one entry per rule, `place_id`-keyed the same way — not built yet, since no real jurisdiction-wide rule has been sourced to code-citation depth yet (Walnut's is documented in prose in `research/municipal-code-hosting.md` but hasn't gone through the municipal-code-hosting-check `CONTRIBUTING.md` describes).

## Migration note

LA's entry was migrated to the new shape as part of this change — see the diff in `data/coverage_registry.json`. No other jurisdictions had entries yet, so there was nothing else to migrate.
