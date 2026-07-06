#!/usr/bin/env python3
"""LA permits adapter: LADOT Preferential Parking Districts -> Chalked's common schema.

Source: https://data.lacity.org/resource/s3st-6nwi.json (Socrata)
Re-run to refresh data/la-permits.geojson (manual sync for now — see SPEC.md Data pipeline).

Honest limitation: rowsUpdatedAt is 2015-08-13, same as creation -- no evidence this has
been refreshed in a decade despite a claimed "Committed Update Frequency: Annual." Any
PPD created/resized/retired since 2015 won't show up. Surfaced explicitly in every
feature's properties, not just in docs -- staleness should follow the data into the UI.
"""
import json
import urllib.request
from datetime import datetime, timezone

SOURCE_URL = "https://data.lacity.org/resource/s3st-6nwi.json"
OUT_PATH = "data/la-permits.geojson"
DATA_AS_OF = "2015-08-13"  # LADOT's own rowsUpdatedAt -- see docstring


def fetch_all():
    url = f"{SOURCE_URL}?$select=ppdnum,ppdname,the_geom&$limit=1000"
    with urllib.request.urlopen(url) as resp:
        return json.load(resp)


def transform(records, synced_at):
    features = []
    skipped = 0
    for r in records:
        geom = r.get("the_geom")
        if not geom:
            skipped += 1
            continue
        features.append(
            {
                "type": "Feature",
                "geometry": geom,
                "properties": {
                    "jurisdiction": "Los Angeles, CA",
                    "category": "permits",
                    "district_number": r.get("ppdnum"),
                    "district_name": r.get("ppdname"),
                    "data_as_of": DATA_AS_OF,
                    "source": {
                        "name": "LADOT Preferential Parking Districts",
                        "url": SOURCE_URL,
                        "last_synced": synced_at,
                    },
                },
            }
        )
    print(f"Transformed {len(features)} permit districts, skipped {skipped} without geometry.")
    return {"type": "FeatureCollection", "features": features}


def main():
    synced_at = datetime.now(timezone.utc).isoformat()
    records = fetch_all()
    print(f"Fetched {len(records)} raw PPD records from LADOT.")
    out = transform(records, synced_at)
    with open(OUT_PATH, "w") as f:
        json.dump(out, f)
    print(f"Wrote {len(out['features'])} features to {OUT_PATH}")


if __name__ == "__main__":
    main()
