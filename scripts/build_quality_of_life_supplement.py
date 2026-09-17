#!/usr/bin/env python3
"""Build the public-data supplement used by Live Better for Less."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "quality-of-life-supplement.json"
START_YEAR = 2018
END_YEAR = date.today().year

INDICATORS = {
    "internet_use": {
        "code": "IT.NET.USER.ZS",
        "label": "Individuals using the internet",
        "shortLabel": "Internet use",
        "unit": "percent of population",
        "format": "percent",
        "higherIsBetter": True,
        "sourceClass": "International Telecommunication Union estimates distributed by World Bank WDI",
    },
    "sanitation": {
        "code": "SH.STA.SMSS.ZS",
        "label": "People using safely managed sanitation services",
        "shortLabel": "Safe sanitation",
        "unit": "percent of population",
        "format": "percent",
        "higherIsBetter": True,
        "sourceClass": "WHO/UNICEF Joint Monitoring Programme distributed by World Bank WDI",
    },
    "homicide_rate": {
        "code": "VC.IHR.PSRC.P5",
        "label": "Intentional homicides",
        "shortLabel": "Homicide rate",
        "unit": "per 100,000 people",
        "format": "rate",
        "higherIsBetter": False,
        "sourceClass": "UNODC and national sources distributed by World Bank WDI",
    },
}


def fetch_json(url: str):
    request = urllib.request.Request(url, headers={"User-Agent": "WealthMeterQualityModel/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def indicator_latest(code: str) -> dict[str, dict]:
    params = urllib.parse.urlencode(
        {"format": "json", "date": f"{START_YEAR}:{END_YEAR}", "per_page": "30000", "source": "2"}
    )
    payload = fetch_json(f"https://api.worldbank.org/v2/country/all/indicator/{code}?{params}")
    rows = payload[1] if isinstance(payload, list) and len(payload) > 1 else []
    latest: dict[str, dict] = {}
    for row in rows:
        country = row.get("countryiso3code")
        value = row.get("value")
        if not country or value is None:
            continue
        point = {"year": int(row["date"]), "value": value}
        if country not in latest or point["year"] > latest[country]["year"]:
            latest[country] = point
    return latest


def main() -> None:
    values = {key: indicator_latest(metadata["code"]) for key, metadata in INDICATORS.items()}
    country_codes = sorted({code for series in values.values() for code in series})
    countries = []
    for code in country_codes:
        metrics = {key: series[code] for key, series in values.items() if code in series}
        if metrics:
            countries.append({"code": code, "metrics": metrics})

    output = {
        "schemaVersion": 1,
        "generated": date.today().isoformat(),
        "coverage": {
            "countryCount": len(countries),
            "seriesStart": START_YEAR,
            "seriesEnd": END_YEAR,
            "selectionRule": "Latest non-null World Development Indicators observation from 2018 onward; no imputation.",
        },
        "licence": {
            "publisher": "World Bank",
            "dataset": "World Development Indicators",
            "licence": "CC BY 4.0, subject to indicator-level metadata and third-party terms",
            "terms": "https://data.worldbank.org/summary-terms-of-use",
            "attribution": "World Bank, World Development Indicators; underlying source organizations are identified per measure.",
        },
        "indicators": INDICATORS,
        "countries": countries,
    }
    OUTPUT.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} with {len(countries)} country rows")


if __name__ == "__main__":
    main()
