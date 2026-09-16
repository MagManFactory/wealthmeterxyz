#!/usr/bin/env python3
"""Build the Phase 2 Country Systems Atlas snapshot from the World Bank API."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "country-systems-phase1.json"

COUNTRIES = {
    "ARG": "Argentina",
    "AUS": "Australia",
    "AUT": "Austria",
    "BEL": "Belgium",
    "BGD": "Bangladesh",
    "BGR": "Bulgaria",
    "BRA": "Brazil",
    "KHM": "Cambodia",
    "CAN": "Canada",
    "CHL": "Chile",
    "CHN": "China",
    "COL": "Colombia",
    "CRI": "Costa Rica",
    "DEU": "Germany",
    "DNK": "Denmark",
    "EGY": "Egypt",
    "ETH": "Ethiopia",
    "ESP": "Spain",
    "FIN": "Finland",
    "FRA": "France",
    "GBR": "United Kingdom",
    "GRC": "Greece",
    "GHA": "Ghana",
    "HUN": "Hungary",
    "IDN": "Indonesia",
    "IND": "India",
    "IRL": "Ireland",
    "ISR": "Israel",
    "ITA": "Italy",
    "JPN": "Japan",
    "KEN": "Kenya",
    "KOR": "South Korea",
    "MEX": "Mexico",
    "MAR": "Morocco",
    "MYS": "Malaysia",
    "NGA": "Nigeria",
    "NLD": "Netherlands",
    "NOR": "Norway",
    "NZL": "New Zealand",
    "PAK": "Pakistan",
    "PER": "Peru",
    "PHL": "Philippines",
    "POL": "Poland",
    "PRT": "Portugal",
    "QAT": "Qatar",
    "ROU": "Romania",
    "SAU": "Saudi Arabia",
    "SEN": "Senegal",
    "SGP": "Singapore",
    "SWE": "Sweden",
    "CHE": "Switzerland",
    "TZA": "Tanzania",
    "THA": "Thailand",
    "TUR": "Turkey",
    "UGA": "Uganda",
    "UKR": "Ukraine",
    "ARE": "United Arab Emirates",
    "USA": "United States",
    "VNM": "Vietnam",
    "ZAF": "South Africa",
}

INDICATORS = {
    "gdp_ppp": {
        "code": "NY.GDP.PCAP.PP.CD",
        "label": "GDP per person, PPP",
        "shortLabel": "GDP / person",
        "domain": "Capital capacity",
        "unit": "current international dollars",
        "format": "currency",
        "higherIsBetter": True,
        "sourceClass": "World Bank ICP with OECD, Eurostat, IMF and national inputs",
    },
    "life_expectancy": {
        "code": "SP.DYN.LE00.IN",
        "label": "Life expectancy at birth",
        "shortLabel": "Life expectancy",
        "domain": "Life capacity",
        "unit": "years",
        "format": "years",
        "higherIsBetter": True,
        "sourceClass": "UN World Population Prospects and national statistical offices",
    },
    "electricity_access": {
        "code": "EG.ELC.ACCS.ZS",
        "label": "Population with electricity access",
        "shortLabel": "Electricity access",
        "domain": "Essential systems",
        "unit": "percent of population",
        "format": "percent",
        "higherIsBetter": True,
        "sourceClass": "World Bank SDG 7.1.1 Electrification Dataset",
    },
    "urban_population": {
        "code": "SP.URB.TOTL.IN.ZS",
        "label": "Urban population",
        "shortLabel": "Urban population",
        "domain": "Settlement pattern",
        "unit": "percent of population",
        "format": "percent",
        "higherIsBetter": None,
        "sourceClass": "UN World Urbanization Prospects",
    },
    "lpi_infrastructure": {
        "code": "LP.LPI.INFR.XQ",
        "label": "Trade and transport infrastructure quality",
        "shortLabel": "Transport infrastructure",
        "domain": "Movement and trade",
        "unit": "score from 1 to 5",
        "format": "score",
        "higherIsBetter": True,
        "sourceClass": "World Bank Logistics Performance Index",
    },
    "lpi_overall": {
        "code": "LP.LPI.OVRL.XQ",
        "label": "Logistics performance",
        "shortLabel": "Logistics performance",
        "domain": "Movement and trade",
        "unit": "score from 1 to 5",
        "format": "score",
        "higherIsBetter": True,
        "sourceClass": "World Bank Logistics Performance Index",
    },
    "manufacturing_share": {
        "code": "NV.IND.MANF.ZS",
        "label": "Manufacturing value added",
        "shortLabel": "Manufacturing share",
        "domain": "Productive capacity",
        "unit": "percent of GDP",
        "format": "percent",
        "higherIsBetter": None,
        "sourceClass": "National statistical offices, central banks and World Bank staff estimates",
    },
    "capital_formation": {
        "code": "NE.GDI.FTOT.ZS",
        "label": "Gross fixed capital formation",
        "shortLabel": "Capital formation",
        "domain": "Productive capacity",
        "unit": "percent of GDP",
        "format": "percent",
        "higherIsBetter": None,
        "sourceClass": "National statistical offices, central banks, OECD and World Bank staff estimates",
    },
}


def fetch_json(url: str):
    request = urllib.request.Request(url, headers={"User-Agent": "CountrySystemsAtlas/phase2"})
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response)


def indicator_series(code: str) -> dict[str, list[dict]]:
    country_path = ";".join(COUNTRIES)
    params = urllib.parse.urlencode(
        {"format": "json", "date": "2014:2025", "per_page": "2000", "source": "2"}
    )
    url = f"https://api.worldbank.org/v2/country/{country_path}/indicator/{code}?{params}"
    payload = fetch_json(url)
    rows = payload[1] if isinstance(payload, list) and len(payload) > 1 else []
    grouped: dict[str, list[dict]] = {country: [] for country in COUNTRIES}
    for row in rows:
        country = row.get("countryiso3code")
        value = row.get("value")
        if country in grouped and value is not None:
            grouped[country].append({"year": int(row["date"]), "value": value})
    for values in grouped.values():
        values.sort(key=lambda item: item["year"])
    return grouped


def main() -> None:
    country_rows = {
        code: {"code": code, "name": name, "metrics": {}}
        for code, name in COUNTRIES.items()
    }
    for key, metadata in INDICATORS.items():
        series = indicator_series(metadata["code"])
        for country, values in series.items():
            latest = values[-1] if values else None
            country_rows[country]["metrics"][key] = {
                "latest": latest,
                "series": values,
            }

    output = {
        "schemaVersion": 1,
        "prototype": True,
        "generated": date.today().isoformat(),
        "coverage": {
            "countryCount": len(COUNTRIES),
            "indicatorCount": len(INDICATORS),
            "seriesStart": 2014,
            "seriesEnd": 2025,
        },
        "licence": {
            "publisher": "World Bank",
            "dataset": "World Development Indicators",
            "licence": "CC BY 4.0, subject to indicator-level metadata and third-party terms",
            "terms": "https://data.worldbank.org/summary-terms-of-use",
            "attribution": "World Bank, World Development Indicators; indicator source organizations are shown in the interface.",
        },
        "indicators": INDICATORS,
        "countries": list(country_rows.values()),
    }
    OUTPUT.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
