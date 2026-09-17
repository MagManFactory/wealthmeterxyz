#!/usr/bin/env python3
"""Static release checks for the quality-adjusted purchasing-power tools."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"FAIL: {message}")


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def main() -> None:
    page = text("live-better-for-less.html")
    script = text("assets/live-better-for-less.js")
    lifestyle = text("lifestyle-abroad.html")
    components = text("components.js")
    methodology = text("methodology.html")
    redirects = text("_redirects")
    sitemap = text("sitemap.xml")
    llms = text("llms.txt")
    supplement = json.loads(text("data/quality-of-life-supplement.json"))

    require('meta name="robots" content="index, follow"' in page, "main tool must be indexable")
    require('href="https://wealthmeter.xyz/live-better-for-less.html"' in page, "missing canonical")
    require("data/quality-of-life-supplement.json" in script, "quality data is not loaded")
    require("passesFloor" in script and "details.available < 5" in script, "hard quality gate is missing")
    require("72%" in methodology and 'id="live-better-for-less"' in methodology, "methodology disclosure is incomplete")
    require("∞ runway" not in lifestyle and "4% + income" not in lifestyle, "retirement prototype leaked into production")
    require("city:PT-LIS" not in lifestyle and "filter(location => location.kind === 'country')" in lifestyle, "production lifestyle tool must remain country-only")
    require("live-better-for-less.html" in components, "global navigation lacks the tool")
    require("/where-richest-dev.html /live-better-for-less.html 301" in redirects, "legacy prototype redirect is missing")
    require("https://wealthmeter.xyz/live-better-for-less.html" in sitemap, "sitemap lacks main tool")
    require("Live Better for Less" in llms, "llms.txt lacks main tool")
    require(len(supplement["countries"]) >= 180, "quality supplement coverage is unexpectedly low")
    require(set(supplement["indicators"]) == {"internet_use", "sanitation", "homicide_rate"}, "quality supplement indicators drifted")
    require((ROOT / "images/live-better-for-less-social.png").stat().st_size > 20_000, "social image is missing or implausibly small")
    print("PASS: Live Better for Less static release checks")


if __name__ == "__main__":
    main()
