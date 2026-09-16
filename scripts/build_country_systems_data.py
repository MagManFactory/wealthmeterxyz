#!/usr/bin/env python3
"""Build the Phase 2 Country Systems Atlas snapshot from the World Bank API."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "country-systems-atlas.json"
START_YEAR = 2014
END_YEAR = date.today().year

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

NAME_OVERRIDES = {
    "BOL": "Bolivia",
    "COD": "Democratic Republic of the Congo",
    "COG": "Republic of the Congo",
    "CIV": "Côte d’Ivoire",
    "GMB": "Gambia",
    "HKG": "Hong Kong",
    "IRN": "Iran",
    "KGZ": "Kyrgyzstan",
    "LAO": "Laos",
    "RUS": "Russia",
    "SVK": "Slovakia",
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


def country_catalog() -> dict[str, dict]:
    payload = fetch_json(
        "https://api.worldbank.org/v2/country?format=json&per_page=400&source=2"
    )
    rows = payload[1] if isinstance(payload, list) and len(payload) > 1 else []
    return {
        row["id"]: row
        for row in rows
        if row.get("id")
        and row.get("region", {}).get("id")
        and row.get("region", {}).get("id") != "NA"
    }


def indicator_series(code: str) -> dict[str, list[dict]]:
    params = urllib.parse.urlencode(
        {"format": "json", "date": f"{START_YEAR}:{END_YEAR}", "per_page": "30000", "source": "2"}
    )
    url = f"https://api.worldbank.org/v2/country/all/indicator/{code}?{params}"
    payload = fetch_json(url)
    rows = payload[1] if isinstance(payload, list) and len(payload) > 1 else []
    grouped: dict[str, list[dict]] = {}
    for row in rows:
        country = row.get("countryiso3code")
        value = row.get("value")
        if country and value is not None:
            grouped.setdefault(country, []).append({"year": int(row["date"]), "value": value})
    for values in grouped.values():
        values.sort(key=lambda item: item["year"])
    return grouped


def main() -> None:
    catalog = country_catalog()
    series_by_indicator = {
        key: indicator_series(metadata["code"])
        for key, metadata in INDICATORS.items()
    }
    eligible = sorted(
        code for code in catalog
        if all(series_by_indicator[key].get(code) for key in INDICATORS)
    )
    country_rows = {
        code: {
            "code": code,
            "name": NAME_OVERRIDES.get(code, COUNTRIES.get(code, catalog[code]["name"])),
            "metrics": {},
        }
        for code in eligible
    }
    for key, metadata in INDICATORS.items():
        series = series_by_indicator[key]
        for country in eligible:
            values = series[country]
            latest = values[-1] if values else None
            country_rows[country]["metrics"][key] = {
                "latest": latest,
                "series": values,
            }

    output = {
        "schemaVersion": 1,
        "prototype": False,
        "generated": date.today().isoformat(),
        "coverage": {
            "countryCount": len(eligible),
            "indicatorCount": len(INDICATORS),
            "seriesStart": START_YEAR,
            "seriesEnd": END_YEAR,
            "selectionRule": "World Bank economies with at least one observation for all eight measures in the selected series window",
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
