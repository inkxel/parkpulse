# Research

Findings, prior-art investigations, and reusable methods behind Chalked's data landscape — the detailed backing for what's summarized in SPEC.md and the coverage list in the README.

Notes here cross-reference each other with normal markdown links, not double-bracket wiki syntax — GitHub's standard file viewer doesn't render `[[links]]` as anything but literal text, so plain links are what actually work here.

## How this gets written

A lot of this research is AI-assisted, and at the scale this project is aiming for — eventually every city in the country — that's not optional, it's necessary. No team, however large, manually checks a thousand cities' open-data portals one at a time. Using AI for this kind of research is the only realistic way the "all 50 states, browsable" goal in the README actually gets there.

That's exactly why verification matters *more* here, not less. Treat everything in this folder as a first pass, not a verdict — "probably right, please check," not "confirmed forever." If something here is wrong, outdated, or missing, that's an expected part of how this grows, not a failure — say so on the relevant jurisdiction issue and it gets fixed the same way anything else here gets built: by someone catching it.

## Model guidance, for anyone using AI to help research

Most of what belongs in this folder is genuinely light work: does a dataset exist, what's its schema, is it fresh. That doesn't need a large or expensive model — a small, fast, even locally-run one is usually enough to check a data portal, read a page, or classify whether a document mentions parking permits. Save more capable reasoning for the parts that actually need judgment: reconciling contradictory findings, deciding what something implies for the architecture, writing the synthesis. Match the tool to the task — it's cheaper, it's faster, and it's the more honest way to spend the compute this kind of work should actually cost.

## Structure

```
research/
  cities/<city>.md     — everything found for one city: every category, prior art, decisions
  states/<state>.md     — index of that state's researched cities, plus genuinely state-level
                          findings if any turn up (statewide statutes, DMV data, etc.)
  <topic>.md            — cross-cutting methods and landscape research that isn't about any
                          one city or state (loose at the folder root — there are only a
                          handful of these and they don't proliferate the way cities/states do)
```

**Where something goes:** if a finding is about one specific city, it goes in that city's file — don't split a city across multiple files by category (sweeping vs. permits, etc.), and don't create a new file for a city that already has one. If it's a genuine state-level fact (not just "here's a list of this state's cities"), it goes in that state's file. If it applies across many cities/states — a technique, a vendor, a national standard — it's cross-cutting and belongs as its own topic file at the folder root, not folded into whichever city happened to surface it.

Every city file should be linked from its state's file, and every state file should be linked from this index below.

## Index

**States**
- [California](states/california.md) — Los Angeles, San Francisco, San Diego
- [Illinois](states/illinois.md) — Chicago
- [Washington](states/washington.md) — Seattle

**Cities**
- [Los Angeles](cities/los-angeles.md) — sweeping, permits, meters, crime, sweep.la regional context
- [San Francisco](cities/san-francisco.md) — CURB, SF's own data sources, why no Chalked adapter here
- [San Diego](cities/san-diego.md) — meters (strong), sweeping (real dataset, dashboard-trace unfinished), permits (likely gap), crime (open), no CURB-equivalent found
- [Chicago](cities/chicago.md) — sweeping, permits, crime confirmed open; meters gap re-traced (government side still closed, unverified private concessionaire API is the only known fallback)
- [Seattle](cities/seattle.md) — sweeping's "unconfirmed" status overturned (real SPU route data on Seattle's separate ArcGIS open-data portal), with a source-confirmed voluntary-enforcement caveat; permits and meters spot-checked and holding up as open

*(Chicago, NYC, DC have entries in the README's coverage table and their own jurisdiction issues, but no dedicated research file yet — they'll get one, and their state gets an index page, once someone researches them past the summary level.)*

**Methods & cross-city landscape**
- [Dashboard-tracing method](dashboard-tracing-method.md) — how to find real data hiding behind a public-facing ArcGIS dashboard
- [Municipal code hosting & unsigned rules](municipal-code-hosting.md) — the Walnut, CA case, and where to look for code-only rules
- [National vendor & standard landscape](national-vendor-landscape.md) — meter vendors, CDS (checked and closed out), Parkopedia
- [City hub-page & aggregator scan](city-hub-scan.md) — broad 29-city discovery pass: prior art (ParkUsher), confirmed vendor-by-city map, and the structural finding that street sweeping is almost universally split from meters/permits by department
- [ParkUsher investigation](parkusher.md) — direct look at the closest multi-city prior art found: not open source, no confirmed open-data pipeline (looks substantially manual/crowdsourced), meters paywalled, coverage uneven across its 7 cities (incl. Seattle and SF) — doesn't deprioritize either from Chalked's candidate list
- [National boundary layer & coverage registry](national-boundary-layer.md) — how the "national map, gray where uncovered" base layer actually works: Census TIGERweb source, the size/simplification tradeoff, canvas rendering at 19,731-feature scale, and how to add a new city to the coverage registry
