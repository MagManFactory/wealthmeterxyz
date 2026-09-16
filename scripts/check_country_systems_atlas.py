#!/usr/bin/env python3
"""Fail closed on Country Systems Atlas production regressions."""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "country-systems-atlas.html"
JS = ROOT / "assets/country-systems.js"
DATA = ROOT / "data/country-systems-atlas.json"
RIGHTS = ROOT / "data/country-systems-rights.json"
COMPONENTS = ROOT / "components.js"
LEGACY_HTML = ROOT / "country-systems-phase1.html"
REDIRECTS = ROOT / "_redirects"
SITEMAP = ROOT / "sitemap.xml"
LLMS = ROOT / "llms.txt"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"Country Systems Atlas check failed: {message}")


def main() -> None:
    html = HTML.read_text(encoding="utf-8")
    js = JS.read_text(encoding="utf-8")
    components = COMPONENTS.read_text(encoding="utf-8")
    legacy_html = LEGACY_HTML.read_text(encoding="utf-8")
    redirects = REDIRECTS.read_text(encoding="utf-8")
    sitemap = SITEMAP.read_text(encoding="utf-8")
    llms = LLMS.read_text(encoding="utf-8")
    data = json.loads(DATA.read_text(encoding="utf-8"))
    rights = json.loads(RIGHTS.read_text(encoding="utf-8"))

    require('content="index, follow"' in html, "production page must be indexable")
    require('href="https://wealthmeter.xyz/country-systems-atlas.html"' in html, "missing production canonical")
    require('"@type":"WebApplication"' in html and '"@type":"Dataset"' in html, "missing structured data")
    require("images/country-systems-atlas-social.png" in html, "missing social image metadata")
    for hook in ("data-view-mode", "data-country-select", "data-share-preview", "data-download-card", "data-related-link"):
        require(hook in html, f"missing UI hook {hook}")
    for token in ('searchParams.set("view"', "ensureActiveUnique", "buildShareCanvas", "country_systems_share"):
        require(token in js, f"missing behavior {token}")
    require("country-systems-atlas.html" in components, "global components lack atlas link")
    require("/country-systems-phase1.html /country-systems-atlas.html 301" in redirects, "missing legacy redirect")
    require('window.location.replace("country-systems-atlas.html" + window.location.search + window.location.hash)' in legacy_html, "legacy GitHub Pages shim must preserve query and fragment")
    require("https://wealthmeter.xyz/country-systems-atlas.html" in sitemap, "sitemap lacks atlas")
    require("https://wealthmeter.xyz/country-systems-atlas.html" in llms, "llms.txt lacks atlas")

    countries = data.get("countries") or []
    indicators = data.get("indicators") or {}
    require(len(countries) >= 140, "expected at least 140 countries after the coverage expansion")
    require(data.get("coverage", {}).get("countryCount") == len(countries), "coverage country count is stale")
    require(data.get("prototype") is False, "production dataset must not be labelled as a prototype")
    require(len(indicators) == 8, "expected exactly eight indicators")
    require(len({country["code"] for country in countries}) == len(countries), "country codes must be unique")
    for country in countries:
        metrics = country.get("metrics") or {}
        require(set(metrics) == set(indicators), f"{country['code']} has incomplete indicator coverage")
        for key, metric in metrics.items():
            latest = metric.get("latest")
            require(latest is not None and {"value", "year"} <= set(latest), f"{country['code']} {key} latest observation is incomplete")

    for provider in ("itu", "who", "irena"):
        record = rights["providers"][provider]
        require(record.get("productionUse") is False, f"{provider} must remain excluded before permission")
        require(record.get("responseStatus") == "awaiting_response", f"{provider} response state is not tracked")

    print("Country Systems Atlas production checks passed.")


if __name__ == "__main__":
    main()
