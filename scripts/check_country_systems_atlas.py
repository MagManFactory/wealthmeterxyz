#!/usr/bin/env python3
"""Fail closed on Country Systems Atlas review-build regressions."""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "country-systems-phase1.html"
JS = ROOT / "assets/country-systems.js"
DATA = ROOT / "data/country-systems-phase1.json"
RIGHTS = ROOT / "data/country-systems-rights.json"
COMPONENTS = ROOT / "components.js"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"Country Systems Atlas check failed: {message}")


def main() -> None:
    html = HTML.read_text(encoding="utf-8")
    js = JS.read_text(encoding="utf-8")
    components = COMPONENTS.read_text(encoding="utf-8")
    data = json.loads(DATA.read_text(encoding="utf-8"))
    rights = json.loads(RIGHTS.read_text(encoding="utf-8"))

    require('content="noindex, nofollow"' in html, "internal review page must remain noindex")
    for hook in ("data-view-mode", "data-country-select", "data-share-preview", "data-download-card", "data-related-link"):
        require(hook in html, f"missing UI hook {hook}")
    for token in ('searchParams.set("view"', "ensureActiveUnique", "buildShareCanvas", "country_systems_share"):
        require(token in js, f"missing behavior {token}")
    require("country-systems-phase1.html" in components, "global components lack atlas link")

    countries = data.get("countries") or []
    indicators = data.get("indicators") or {}
    require(len(countries) == 60, "expected exactly 60 countries")
    require(len(indicators) == 8, "expected exactly eight indicators")
    require(len({country["code"] for country in countries}) == len(countries), "country codes must be unique")
    for country in countries:
        metrics = country.get("metrics") or {}
        require(set(metrics) == set(indicators), f"{country['code']} has incomplete indicator coverage")
        for key, metric in metrics.items():
            latest = metric.get("latest")
            require(latest is None or {"value", "year"} <= set(latest), f"{country['code']} {key} latest observation is incomplete")

    for provider in ("itu", "who", "irena"):
        record = rights["providers"][provider]
        require(record.get("productionUse") is False, f"{provider} must remain excluded before permission")
        require(record.get("responseStatus") == "awaiting_response", f"{provider} response state is not tracked")

    print("Country Systems Atlas production-candidate checks passed.")


if __name__ == "__main__":
    main()
