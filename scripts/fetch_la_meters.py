#!/usr/bin/env python3
"""LA meters adapter: LADOT Metered Parking Inventory & Policies -> Chalked's common schema.

Source: https://data.lacity.org/resource/s49e-q6j2.json (Socrata)
Re-run to refresh data/la-meters.geojson (manual sync for now — see SPEC.md Data pipeline).

Honest limitation: this dataset has rate/time-limit per space, but NO operating-hours or
day-of-week field at all -- no "free on weekends" signal exists in the source. Meters here
are shown as a cost/rate fact, not a schedule -- matches SPEC.md's "meters are a cost
question, not a restriction" call, but even more literally than expected: there's no
restriction-window data to show either way.
"""
import json
import urllib.request
from datetime import datetime, timezone

SOURCE_URL = "https://data.lacity.org/resource/s49e-q6j2.json"
OUT_PATH = "data/la-meters.geojson"
PAGE_SIZE = 5000


def fetch_all():
    records = []
    offset = 0
    while True:
        url = f"{SOURCE_URL}?$limit={PAGE_SIZE}&$offset={offset}"
        with urllib.request.urlopen(url) as resp:
            page = json.load(resp)
        if not page:
            break
        records.extend(page)
        offset += PAGE_SIZE
        if len(page) < PAGE_SIZE:
            break
    return records


def transform(records, synced_at):
    features = []
    skipped = 0
    for r in records:
        latlng = r.get("latlng")
        if not latlng or "latitude" not in latlng or "longitude" not in latlng:
            skipped += 1
            continue
        try:
            lat, lng = float(latlng["latitude"]), float(latlng["longitude"])
        except (TypeError, ValueError):
            skipped += 1
            continue
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lng, lat]},
                "properties": {
                    "jurisdiction": "Los Angeles, CA",
                    "category": "meters",
                    "space_id": r.get("spaceid"),
                    "blockface": r.get("blockface"),
                    "meter_type": r.get("metertype"),
                    "rate_type": r.get("ratetype"),
                    "rate": r.get("raterange"),
                    "time_limit": r.get("timelimit"),
                    "schedule": None,  # honestly absent from the source -- see module docstring
                    # data_as_of == last_synced: LADOT's own inventory is the live source of
                    # truth here, no separate vintage to track -- see schema/common-schema.md.
                    "data_as_of": synced_at,
                    "source": {
                        "name": "LADOT Metered Parking Inventory & Policies",
                        "url": SOURCE_URL,
                        "last_synced": synced_at,
                    },
                },
            }
        )
    print(f"Transformed {len(features)} meters, skipped {skipped} without coordinates.")
    return {"type": "FeatureCollection", "features": features}


def main():
    synced_at = datetime.now(timezone.utc).isoformat()
    records = fetch_all()
    print(f"Fetched {len(records)} raw meter records from LADOT.")
    out = transform(records, synced_at)
    with open(OUT_PATH, "w") as f:
        json.dump(out, f)
    print(f"Wrote {len(out['features'])} features to {OUT_PATH}")


if __name__ == "__main__":
    main()
