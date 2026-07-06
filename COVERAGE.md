# Coverage

What ParkPulse actually has, per state and city, alphabetically. This is the human-browsable version of the coverage registry described in SPEC.md — meant for anyone deciding whether to contribute, not just for the app itself.

**Status key:**
- ✅ **Confirmed, sourced** — a real, verified dataset with an exact link
- ⚠️ **Confirmed, with a caveat** — real data, but stale, a gap, or a different-than-expected shape (see note)
- 🔍 **Described, not independently verified** — came up in research or via a third-party tool, but ParkPulse hasn't traced the exact source itself yet
- ❌ **Gap** — no open source found
- *(blank)* — not yet researched at all

This list is early and growing — most of the country isn't researched yet. That's expected; it's also exactly the point (see the "not covered yet" state in SPEC.md). If you know a city's data landscape, open an issue or a PR against this file.

---

## California

### Glendale
- Sweeping: 🔍 aggregated via [sweep.la](https://sweep.la) — not independently sourced yet
- Meters, Permits, Crime: not yet researched

### Los Angeles
- Sweeping: ✅ [LADOT Posted Street Sweeping Routes](https://services1.arcgis.com/PTh9WC0Sf2WS7AAq/arcgis/rest/services/Posted_Street_Sweeping_Routes_Update/FeatureServer/0) — official LA Bureau of Street Services, actively edited
- Meters: ✅ [LADOT Metered Parking Inventory & Policies](https://data.lacity.org/Transportation/LADOT-Metered-Parking-Inventory-Policies/s49e-q6j2) — best-documented meter dataset of any city checked so far
- Permits: ⚠️ [LADOT Preferential Parking Districts](https://data.lacity.org/resource/s3st-6nwi.json) — real, but not updated since 2015-08-13
- Crime: ✅ [LA Crime Data 2020–Present](https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/2nrs-mtv8)

### Pasadena
- Sweeping: 🔍 aggregated via [sweep.la](https://sweep.la) — not independently sourced yet
- Meters, Permits, Crime: not yet researched

### San Francisco
- Sweeping: ✅ [DataSF `yhqp-riqs`](https://data.sfgov.org/resource/yhqp-riqs.json)
- Meters: ✅ [DataSF `8vzz-qzz9`](https://data.sfgov.org/resource/8vzz-qzz9.json)
- Permits/RPP: ⚠️ [DataSF `hi6h-neyh`](https://data.sfgov.org/resource/hi6h-neyh.json) — SFMTA's own 2017 set, flagged by the city as not comprehensively updated
- Crime/vehicle theft: ✅ [DataSF `ab4h-6ztd`](https://data.sfgov.org/resource/ab4h-6ztd.json) (citations), vehicle-theft-specific series also open
- **Already excellently covered by [CURB](https://curb.guide)** (open source, MIT, actively maintained) — ParkPulse does not need to build its own SF adapter. See SPEC.md.

### Santa Monica
- Sweeping: 🔍 aggregated via [sweep.la](https://sweep.la) — not independently sourced yet
- Meters, Permits, Crime: not yet researched

### West Hollywood
- Sweeping: 🔍 aggregated via [sweep.la](https://sweep.la) — not independently sourced yet
- Meters, Permits, Crime: not yet researched

---

## District of Columbia
*(Not a state — included as its own top-level entry, same as any other jurisdiction.)*

### Washington
- Sweeping: N/A — DC runs no residential sweeping program; snow-emergency/leaf-season rules apply instead
- Permits: ✅ [DC Residential Parking Permit Blocks](https://opendata.dc.gov/datasets/DCGIS::residential-parking-permit-blocks)
- Meters: 🔍 ParkDC referenced, exact open dataset not yet confirmed
- Crime: 🔍 described as open in research, exact dataset link not yet confirmed

---

## Illinois

### Chicago
- Sweeping: ✅ [Street Sweeping Schedule 2025](https://data.cityofchicago.org/Sanitation/Street-Sweeping-Schedule-2025/a2xx-z2ja)
- Permits: ✅ [Permit Parking Zones](https://data.cityofchicago.org/Transportation/Permit-Parking-Zones/qiag-khha)
- Meters: ❌ run by a private concessionaire (Chicago Parking Meters LLC), no open API — historically scraped by an unofficial community project ([stevevance/Chicago-Parking-Meters](https://github.com/stevevance/Chicago-Parking-Meters))
- Crime: ✅ [Motor Vehicle Theft](https://data.cityofchicago.org/Public-Safety/motor-vehicle-theft/7ac4-d9tk)

---

## Massachusetts

### Boston
- Meters: ✅ [Parking Meters (BostonMaps)](https://bostonopendata-boston.opendata.arcgis.com/maps/boston::parking-meters)
- Sweeping, Permits, Crime: not yet independently confirmed — worth the dashboard-tracing check (SPEC.md) before assuming absent

---

## New York

### New York City
- Regulations / time limits (NYC's sweeping-equivalent): ✅ [Parking Regulation Locations and Signs](https://data.cityofnewyork.us/Transportation/Parking-Regulation-Locations-and-Signs/nfid-uabd) — 439K rows, daily-updated
- Meters: ✅ [ParkNYC Block Faces](https://data.cityofnewyork.us/Transportation/Parking-Meters-ParkNYC-Blockfaces/s7zi-dgdx)
- Permits: ❌ no citywide residential permit-parking program comparable to SF/DC/Chicago — NYC uses alternate-side-parking instead of a sweeping/permit model
- Crime: ✅ [NYPD Complaint Data Historic](https://data.cityofnewyork.us/Public-Safety/NYPD-Complaint-Data-Historic/qgea-i56i)

---

## Washington

### Seattle
- Permits/RPZ: ✅ [Restricted Parking Zones](https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::restricted-parking-zones)
- Crime: ✅ [SPD Crime Data 2008–Present](https://data.seattle.gov/Public-Safety/SPD-Crime-Data-2008-Present/tazs-3rd5)
- Meters: 🔍 described in research as unusually rich (historical paid-occupancy by block-minute since 2012) — exact dataset link not yet confirmed
- Sweeping: not yet confirmed open — worth the dashboard-tracing check (SPEC.md) before assuming absent, given LA's sweeping data was initially missed the same way

---

## Not yet researched at all
Every other state and city. This is the overwhelming majority of the country — see SPEC.md's "First adapters to build" for the current prioritization logic (data completeness × population), and the CONTRIBUTING guide (once written) for how to add one.
