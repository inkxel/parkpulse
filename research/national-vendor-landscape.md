# National vendor & standard landscape

Tucker's question, researched properly rather than guessed at: is there a national-scale parking vendor or platform — meter payment company, permit software, anything — whose data would unlock many cities at once, the way Socrata/ArcGIS consolidate GIS hosting or Municode/American Legal consolidate legal-code hosting (see [municipal-code-hosting.md](municipal-code-hosting.md))?

**Short answer: no free shortcut exists. Every major vendor gates its data behind a commercial relationship, not a self-serve API.**

- **Meter payment vendors** (ParkMobile, Passport, PayByPhone, Flowbird, IPS Group) all have *an* API. None is open. **Passport** is the widest — its Parking Rights API normalizes rates/rules/restrictions across "hundreds of cities" (20,000+ zones claimed) into one feed — but it's partner-gated, built for OEMs and wayfinding apps that sign a business-dev agreement, not something Chalked could just plug into.
- **Real-time spot occupancy still doesn't meaningfully exist nationally.** The SFpark sensor program (retired 2014) never really came back at scale. What exists now — computer-vision curb cameras (Automotus, Cleverciti), INRIX's predictive modeling — covers a couple dozen cities at most, mostly loading zones for the camera approach; even INRIX's own real (non-predicted) occupancy data only covers 13 of its 126 US markets. Not a near-term feature to plan around.
- **Residential permit software** (T2 Systems, gtechna, iParq, Passport, Unity5, CityView) consolidates *operationally* — a handful of vendors run many cities' citizen-facing permit portals — but none of them publish open zone-boundary data. They're enforcement/citizen tools, not data publishers. Where permit-zone data is public at all, it's because an individual city's GIS team put it on their own portal — same city-by-city pattern as everything else in this research.
- **Citation-processing vendors** (Duncan Solutions, Complus Data Innovations — 200+ municipal clients across 25 states, Conduent) also consolidate operationally with zero open data — billing/collections back-ends, not datasets.
- **No federal/DOT standard exists** for municipal on-street parking, confirmed — parking is genuinely hyper-local governance, not federally standardized the way some transportation data is.

## The one real exception, worth chasing directly

The **Curb Data Specification (CDS)**, from the Open Mobility Foundation — initially written off as B2B-focused (built for dockless-vehicle and loading-zone management between cities and mobility operators) — turns out to have real, if early, adoption: roughly **11 US cities**, including **LA, SF, DC, and Seattle** — four cities already on Chalked's candidate list (see SPEC.md → First adapters to build).

CDS is a genuinely open, free, GTFS-like standard — not a gated vendor product. If these cities' actual CDS feeds cover sweeping/permit-relevant data, not just the loading-zone/curb-use data CDS was originally built for, that's a real shortcut: one schema parser instead of four bespoke per-city adapters.

**Scope unconfirmed** — needs a direct check against each city's actual published feed before assuming this solves anything. High-priority open item (see SPEC.md → Next steps).

## Worth knowing about, not free

**Parkopedia** licenses static rate/rule data across 1,000+ cities/towns via one paid API — functionally the closest "integrate once" product that actually exists, just commercial, with per-city freshness unverified.

## Verdict

Matches the per-city finding: every city is still effectively its own integration, just with a smaller menu of vendors behind the curtain. The CDS lead is the one thing worth checking before accepting that conclusion fully.

## Sources
- [Passport Open Parking Ecosystem](https://www.passportinc.com/parking-ecosystem/) · [Parking Rights API](https://developer.passportinc.com/docs/parking-rights/YXBpOjI1OTk0NDc2)
- [ParkMobile Developer Portal](https://developer.parkmobile.io/)
- [PayByPhone unofficial API docs](https://github.com/itsff/PayByPhone-api-docs)
- [Flowbird Open Platform](https://www.flowbird.com/our-solutions/parking-solutions/open-platform-for-parking-and-e-mobility/)
- [IPS Group Integration](https://ipsgroup.com/integration/)
- [SFpark — Wikipedia](https://en.wikipedia.org/wiki/SFpark)
- [INRIX Parking Data](https://inrix.com/products/parking-data-software/) · [INRIX–Automotus 13-city expansion](https://inrix.com/press-releases/inrix-expands-real-time-parking-and-loading-occupancy-coverage-to-13-new-cities-through-strategic-integration-with-automotus/)
- [Open Mobility Foundation — About CDS](https://www.openmobilityfoundation.org/about-cds/) · [CDS Users list](https://www.openmobilityfoundation.org/cds-users/) · [CDS GitHub spec](https://github.com/openmobilityfoundation/curb-data-specification)
- [Parkopedia Parking Data / Licensing](https://business.parkopedia.com/parking-data)
- [Duncan Solutions](https://www.duncansolutions.com/about/) · [Complus Data Innovations](https://www.crunchbase.com/organization/complus-data-innovations)
- [T2 Systems Municipal Parking](https://www.t2systems.com/municipalities/) · [gtechna Digital Permits](https://www.gtechna.com/product-category/digital-permits)
