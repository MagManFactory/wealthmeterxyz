#!/usr/bin/env python3
"""Validate the published Data Lab snapshot and its source register."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "data-lab.json"
SOURCES_PATH = ROOT / "data" / "data-lab-sources.json"

EXPECTED_CORE_COUNTRIES = 50
COMPARISON_METRICS = {
    "top1_wealth",
    "top10_wealth",
    "top1_income",
    "top10_income",
    "bottom50_income",
    "gdp_per_capita_ppp",
    "consumption_per_capita",
    "population",
    "life_expectancy",
    "age65_share",
}
PLAUSIBLE_RANGES = {
    "top1_wealth": (0, 100),
    "top10_wealth": (0, 100),
    "top1_income": (0, 100),
    "top10_income": (0, 100),
    "bottom50_income": (0, 100),
    "gdp_per_capita_ppp": (0, 500_000),
    "consumption_per_capita": (0, 200_000),
    "population": (1, 2_000_000_000),
    "life_expectancy": (20, 100),
    "age65_share": (0, 100),
}


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))
    records = data["records"]

    identifiers = [record["id"] for record in records]
    require(len(identifiers) == len(set(identifiers)), "Record identifiers must be unique")
    require(data["coverage"]["coreCountries"] == EXPECTED_CORE_COUNTRIES, "Core-country count changed")
    require(not any("CONSRATIO" in identifier for identifier in identifiers), "Invalid mixed-unit ratio returned")
    require(set(sources["metrics"]) == COMPARISON_METRICS, "Comparison metric register changed")

    provider_ids = set(sources["providers"])
    for record in records:
        require(record["sourceId"] in provider_ids, f"Unknown provider on {record['id']}")
        require(record["status"] in {"current", "historical"}, f"Invalid status on {record['id']}")
        require(record["kind"] in {"observation", "derived"}, f"Invalid kind on {record['id']}")
        require(record.get("statement"), f"Missing statement on {record['id']}")
        if record["sourceId"] == "oecd-eo107":
            require(record["status"] == "historical", f"OECD EO107 record is not historical: {record['id']}")
        if record["metric"] in PLAUSIBLE_RANGES and record["kind"] == "observation":
            lower, upper = PLAUSIBLE_RANGES[record["metric"]]
            require(isinstance(record["value"], (int, float)), f"Non-numeric value on {record['id']}")
            require(lower <= record["value"] <= upper, f"Implausible value on {record['id']}")

    current_observations = [
        record for record in records
        if record["kind"] == "observation" and record["status"] == "current"
    ]
    country_codes = {
        record["countryCode"] for record in current_observations
        if record["metric"] in COMPARISON_METRICS and record.get("countryCode")
    }
    require(len(country_codes) >= EXPECTED_CORE_COUNTRIES, "Comparison coverage fell below 50 countries")

    print(
        f"Data Lab validated: {len(records):,} records, "
        f"{len(country_codes)} comparison countries, {len(provider_ids)} providers."
    )


if __name__ == "__main__":
    main()
