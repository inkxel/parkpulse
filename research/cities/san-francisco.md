# San Francisco

**Not a Chalked adapter target** — already excellently covered by an existing open-source tool. This file documents why, and SF's underlying data for reference.

## CURB (curb.guide)

Missed in the initial research pass (created 2026-06-08, likely too recent for the search index at the time) — Tucker found it directly. **[alevizio/curb](https://github.com/alevizio/curb)**, MIT licensed, live at [curb.guide](https://curb.guide), actively maintained. Not a toy — genuinely sophisticated:

- Matches ~1M real SF parking citations to exact street segments by GPS (not lossy address-string joins), via two SFMTA public-records requests (#26-5453 for citations, #26-5451 for actual sweeper GPS) — recovering ~815,000 of ~1M tickets with real coordinates that the public DataSF feed has dropped since ~2021.
- Surfaces when tickets actually get written, not just the posted schedule: median ticket lands ~20 minutes into the window, ~77% within 45 minutes — a materially more useful signal than "sweeping is 8am–10am."
- Covers sweeping, meters, RPP/permit zones, loading/color-curb zones (including unmetered white zones SFMTA doesn't publish on DataSF at all, pulled from their ArcGIS hub separately), and a beta truck-route inference layer.
- Minimal-dependency architecture: one static `index.html`, vanilla JS + Leaflet, a few Vercel serverless functions, free tiers only.
- Design language: `--green clear / --amber soon / --red now / --meter permit-blue` — the exact color model Chalked independently arrived at (see SPEC.md → Visual design).

**What it doesn't do:** no crime/break-in overlay, and it's SF-only — no multi-city ambition, no common schema.

**Why this changed the plan, not just a footnote:** building "another SF parking app" would be pure duplication of something already excellent and current. San Francisco is deliberately not a Chalked launch candidate (see SPEC.md → First adapters to build). CURB's GPS-matched-citation technique for inferring real enforcement timing (not just posted schedule) is worth treating as the bar to clear in whichever city Chalked actually builds first, if that city's own citation data supports the same trick.

## SF's underlying data sources

Documented in CURB's own `CLAUDE.md`, all DataSF/Socrata, CORS-open:
- Street sweeping — `yhqp-riqs`
- Parking meters — `8vzz-qzz9`
- Parking regulations / RPP — `hi6h-neyh` (SFMTA's own 2017 set, flagged by the city as not comprehensively updated)
- Parking citations — `ab4h-6ztd` (23.8M rows, daily, ~2–5 day lag; GPS restored for ~815K post-2024 rows via public-records request)

## Open question

Should Chalked show SF at all on its coverage map — as "covered, see CURB" with a link out, or leave it visually gray like anywhere else unsupported? Leaving it gray undersells that SF *is* solved, just by someone else. See SPEC.md → Open questions.
