#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "us-wealth-atlas.json"

with DATA.open(encoding="utf-8") as handle:
    atlas = json.load(handle)

assert atlas["vintage"] == "2026:Q2"
assert atlas["history"][0]["year"] == 1990
assert atlas["history"][-1]["year"] == 2026
assert len(atlas["history"]) == 37

for row in atlas["history"]:
    total = row["top1"] + row["next9"] + row["next40"] + row["bottom50"]
    assert abs(total - 100) <= 0.2, (row["year"], total)

for key, item in atlas["ownership"].items():
    assert len(item["values"]) == 4, key
    assert abs(sum(item["values"]) - 100) <= 0.2, (key, sum(item["values"]))

assert abs(sum(item["share"] for item in atlas["ageShares"]) - 100) <= 0.2
assert all(source["url"].startswith("https://www.federalreserve.gov/") for source in atlas["sources"])
print("U.S. Wealth Atlas data validation passed")
