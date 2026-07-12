#!/usr/bin/env python3
"""Validates adapter output and the coverage registry against schema/common-schema.md
and schema/coverage-registry.md. Doesn't fetch anything -- pure structural checks on
files already on disk, so it runs with no network access (see CONTRIBUTING.md).

Usage:
    python3 scripts/validate_schema.py geojson data/la-sweeping.geojson
    python3 scripts/validate_schema.py geojson data/*.geojson
    python3 scripts/validate_schema.py registry data/coverage_registry.json
    python3 scripts/validate_schema.py all          # registry + every data/*.geojson present
"""
import glob
import json
import sys
from datetime import datetime

VALID_CATEGORIES = {"sweeping", "meters", "permits", "crime"}
VALID_CATEGORY_STATUSES = {"built", "in_progress", "gap", "not_applicable", "unconfirmed", "paused"}

# Category-specific fields a feature's properties must at least HAVE the key for (value
# may be null -- schema/common-schema.md's whole point is every field is independently
# nullable, this only checks the adapter didn't drop the key entirely).
CATEGORY_FIELDS = {
    "sweeping": ["route_id", "day_of_week", "start_time", "end_time", "weeks_of_month", "side_of_street"],
    "meters": ["space_id", "blockface", "rate_type", "rate", "time_limit", "schedule"],
    "permits": ["district_number", "district_name"],
    "crime": [],  # not yet specced -- crime is paused, see ETHICS.md
}


def parse_iso(value):
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except (ValueError, AttributeError):
        return False


def validate_feature(feature, index, errors):
    where = f"feature[{index}]"
    if feature.get("type") != "Feature":
        errors.append(f"{where}: type must be 'Feature'")
        return
    geom = feature.get("geometry")
    if not geom or "type" not in geom or "coordinates" not in geom:
        errors.append(f"{where}: geometry missing 'type'/'coordinates'")

    props = feature.get("properties")
    if not isinstance(props, dict):
        errors.append(f"{where}: properties missing or not an object")
        return

    for field in ("jurisdiction", "category", "data_as_of", "source"):
        if field not in props:
            errors.append(f"{where}: missing required common field '{field}'")

    category = props.get("category")
    if category is not None and category not in VALID_CATEGORIES:
        errors.append(f"{where}: category '{category}' not one of {sorted(VALID_CATEGORIES)}")

    data_as_of = props.get("data_as_of")
    if data_as_of is not None and not parse_iso(data_as_of):
        errors.append(f"{where}: data_as_of '{data_as_of}' isn't a parseable ISO date/datetime")

    source = props.get("source")
    if isinstance(source, dict):
        for field in ("name", "url", "last_synced"):
            if field not in source:
                errors.append(f"{where}: source missing '{field}'")
        if "last_synced" in source and not parse_iso(source["last_synced"]):
            errors.append(f"{where}: source.last_synced '{source['last_synced']}' isn't a parseable ISO datetime")
    elif source is not None:
        errors.append(f"{where}: source must be an object")

    if category in CATEGORY_FIELDS:
        for field in CATEGORY_FIELDS[category]:
            if field not in props:
                errors.append(f"{where}: category '{category}' missing expected key '{field}' (value may be null, key must exist)")


def validate_geojson_file(path):
    errors = []
    try:
        with open(path) as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        return [f"{path}: couldn't read/parse as JSON -- {e}"]

    if data.get("type") != "FeatureCollection":
        return [f"{path}: top-level type must be 'FeatureCollection'"]

    features = data.get("features", [])
    if not features:
        errors.append("zero features -- probably an adapter that failed silently, not a real empty dataset")

    for i, feature in enumerate(features):
        validate_feature(feature, i, errors)

    return [f"{path}: {e}" for e in errors]


def validate_registry_file(path):
    errors = []
    try:
        with open(path) as f:
            registry = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        return [f"{path}: couldn't read/parse as JSON -- {e}"]

    for place_id, entry in registry.items():
        where = f"{path}:{place_id}"
        for field in ("name", "state", "population", "categories"):
            if field not in entry:
                errors.append(f"{where}: missing required field '{field}'")

        if "population" in entry and not isinstance(entry["population"], int):
            errors.append(f"{where}: population must be an integer, got {type(entry['population']).__name__}")

        categories = entry.get("categories", {})
        if not isinstance(categories, dict):
            errors.append(f"{where}: categories must be an object mapping category -> status")
            continue
        for category, status in categories.items():
            if category not in VALID_CATEGORIES:
                errors.append(f"{where}: unknown category '{category}'")
            if status not in VALID_CATEGORY_STATUSES:
                errors.append(f"{where}: category '{category}' has invalid status '{status}' -- must be one of {sorted(VALID_CATEGORY_STATUSES)}")

    return errors


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)

    mode = args[0]
    all_errors = []

    if mode == "geojson":
        for path in args[1:]:
            all_errors += validate_geojson_file(path)
    elif mode == "registry":
        for path in args[1:]:
            all_errors += validate_registry_file(path)
    elif mode == "all":
        all_errors += validate_registry_file("data/coverage_registry.json")
        for path in sorted(glob.glob("data/*.geojson")):
            all_errors += validate_geojson_file(path)
    else:
        print(f"Unknown mode '{mode}' -- expected 'geojson', 'registry', or 'all'")
        sys.exit(1)

    if all_errors:
        print(f"{len(all_errors)} schema violation(s):")
        for e in all_errors:
            print(f"  - {e}")
        sys.exit(1)

    print("Schema OK.")


if __name__ == "__main__":
    main()
