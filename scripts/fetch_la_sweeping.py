#!/usr/bin/env python3
"""LA sweeping adapter: LADOT ArcGIS Feature Service -> Chalked's common schema.

Source: https://services1.arcgis.com/PTh9WC0Sf2WS7AAq/arcgis/rest/services/Posted_Street_Sweeping_Routes_Update/FeatureServer/0
Re-run this script to refresh data/la-sweeping.geojson (manual sync for now — see SPEC.md Data pipeline).
"""
import json
import re
import urllib.request
from datetime import datetime, timezone

SOURCE_URL = "https://services1.arcgis.com/PTh9WC0Sf2WS7AAq/arcgis/rest/services/Posted_Street_Sweeping_Routes_Update/FeatureServer/0"
FIELDS = "Route,Posted_Time,Posted_Day,Weeks,Odd_Even,Maint_District,MD_Name,Route_Type"
OUT_PATH = "data/la-sweeping.geojson"

WEEK_WORDS = {"1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5}


def parse_time(label):
    """'8 am' / '10 am' / '12 pm' -> 'HH:MM' 24-hour."""
    label = label.strip().lower().replace(".", "")
    m = re.match(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", label)
    if not m:
        return None
    hour, minute, meridiem = int(m.group(1)), int(m.group(2) or 0), m.group(3)
    if meridiem == "pm" and hour != 12:
        hour += 12
    if meridiem == "am" and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute:02d}"


def parse_time_range(posted_time):
    """'8 am - 10 am' -> ('08:00', '10:00')."""
    parts = posted_time.split("-")
    if len(parts) != 2:
        return None, None
    return parse_time(parts[0]), parse_time(parts[1])


def parse_weeks(weeks_str):
    """'1 & 3' -> [1, 3]."""
    return sorted(int(n) for n in re.findall(r"\d", weeks_str))


def fetch_all_features():
    url = (
        f"{SOURCE_URL}/query?where=1%3D1&outFields={FIELDS}"
        "&outSR=4326&f=geojson&resultRecordCount=2000"
    )
    with urllib.request.urlopen(url) as resp:
        return json.load(resp)


def transform(raw_geojson, synced_at):
    features = []
    skipped = 0
    for feat in raw_geojson.get("features", []):
        props = feat["properties"]
        start_time, end_time = parse_time_range(props.get("Posted_Time") or "")
        weeks = parse_weeks(props.get("Weeks") or "")
        if not start_time or not end_time or not weeks or not props.get("Posted_Day"):
            skipped += 1
            continue
        features.append(
            {
                "type": "Feature",
                "geometry": feat["geometry"],
                "properties": {
                    "jurisdiction": "Los Angeles, CA",
                    "category": "sweeping",
                    "route_id": props.get("Route"),
                    "day_of_week": props.get("Posted_Day"),
                    "start_time": start_time,
                    "end_time": end_time,
                    "weeks_of_month": weeks,
                    "side_of_street": (props.get("Odd_Even") or "").lower() or None,
                    "maintenance_district": props.get("Maint_District"),
                    "maintenance_district_name": props.get("MD_Name"),
                    "route_type": props.get("Route_Type"),
                    # data_as_of == last_synced here on purpose: this source is actively
                    # edited (see SPEC.md's LA correction), so the data's own vintage IS
                    # today's sync -- unlike permits, where the two diverge. See
                    # schema/common-schema.md for why both fields exist.
                    "data_as_of": synced_at,
                    "source": {
                        "name": "LADOT Posted Street Sweeping Routes",
                        "url": SOURCE_URL,
                        "last_synced": synced_at,
                    },
                },
            }
        )
    # ponytail: skips ~7 "Downtown"-type routes with non-biweekly cadence (Weeks="Weekly",
    # Posted_Day="Monday to Friday") — different shape than the standard 1st&3rd/2nd&4th
    # residential pattern this parser handles. Add day-range + weekly-cadence parsing if
    # downtown coverage matters later.
    print(f"Transformed {len(features)} routes, skipped {skipped} with unparseable fields.")
    return {"type": "FeatureCollection", "features": features}


def main():
    synced_at = datetime.now(timezone.utc).isoformat()
    raw = fetch_all_features()
    print(f"Fetched {len(raw.get('features', []))} raw features from LADOT.")
    out = transform(raw, synced_at)
    with open(OUT_PATH, "w") as f:
        json.dump(out, f)
    print(f"Wrote {len(out['features'])} features to {OUT_PATH}")


if __name__ == "__main__":
    main()
