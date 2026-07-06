# Research

Findings, prior-art investigations, and reusable methods behind ParkPulse's data landscape — the detailed backing for what's summarized in SPEC.md and the coverage list in the README.

Notes here cross-reference each other with normal markdown links, not double-bracket wiki syntax — GitHub's standard file viewer doesn't render `[[links]]` as anything but literal text, so plain links are what actually work here.

## How this gets written

A lot of this research is AI-assisted, and at the scale this project is aiming for — eventually every city in the country — that's not optional, it's necessary. No team, however large, manually checks a thousand cities' open-data portals one at a time. Using AI for this kind of research is the only realistic way the "all 50 states, browsable" goal in the README actually gets there.

That's exactly why verification matters *more* here, not less. Treat everything in this folder as a first pass, not a verdict — "probably right, please check," not "confirmed forever." If something here is wrong, outdated, or missing, that's an expected part of how this grows, not a failure — say so on the relevant jurisdiction issue and it gets fixed the same way anything else here gets built: by someone catching it.

## Model guidance, for anyone using AI to help research

Most of what belongs in this folder is genuinely light work: does a dataset exist, what's its schema, is it fresh. That doesn't need a large or expensive model — a small, fast, even locally-run one is usually enough to check a data portal, read a page, or classify whether a document mentions parking permits. Save more capable reasoning for the parts that actually need judgment: reconciling contradictory findings, deciding what something implies for the architecture, writing the synthesis. Match the tool to the task — it's cheaper, it's faster, and it's the more honest way to spend the compute this kind of work should actually cost.

## Index

One file per city, covering everything found for that city (all categories, prior art, decisions). A separate small set of files for findings that genuinely aren't about one city — methods and cross-city landscape research — kept apart rather than force-fit into a jurisdiction that doesn't own them.

**Cities**
- [Los Angeles](los-angeles.md) — sweeping, permits, meters, crime, sweep.la regional context
- [San Francisco](san-francisco.md) — CURB, SF's own data sources, why no ParkPulse adapter here

*(Chicago, NYC, Seattle, DC have entries in the README's coverage table and their own jurisdiction issues, but no dedicated research file yet — they'll get one once someone researches them past the summary level.)*

**Methods & cross-city landscape**
- [Dashboard-tracing method](dashboard-tracing-method.md) — how to find real data hiding behind a public-facing ArcGIS dashboard
- [Municipal code hosting & unsigned rules](municipal-code-hosting.md) — the Walnut, CA case, and where to look for code-only rules
- [National vendor & standard landscape](national-vendor-landscape.md) — meter vendors, CDS, Parkopedia, and why none of them are a free shortcut (except maybe one)
