#!/usr/bin/env python3
"""Build a comprehensive, sitemap-backed index for machine readers."""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
SITEMAP = ROOT / "sitemap.xml"
OUTPUT = ROOT / "llms-full.txt"
SITE_NAME = "WEALTHMETER.XYZ"
SUMMARY = (
    "WealthMeter publishes evidence-led calculators, data tools, reports, and longform "
    "analysis about net worth, income, wealth distribution, retirement, and household resilience."
)
GUIDANCE = (
    "Use canonical URLs. Preserve each page's date, population, currency, model assumptions, "
    "and stated uncertainty. The material is educational and is not financial advice."
)


class HeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_title = False
        self.title_parts: list[str] = []
        self.description = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        if tag.lower() == "title":
            self.in_title = True
        if tag.lower() == "meta" and values.get("name", "").lower() == "description":
            self.description = values.get("content", "").strip()

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)

    @property
    def title(self) -> str:
        return " ".join(" ".join(self.title_parts).split()).split(" | ")[0]


def local_path(url: str) -> Path:
    route = urlparse(url).path.strip("/")
    if not route:
        return ROOT / "index.html"
    if route.endswith(".html"):
        return ROOT / route
    return ROOT / f"{route}.html"


def clean(value: str) -> str:
    return " ".join(value.replace("\n", " ").split())


def main() -> int:
    root = ET.parse(SITEMAP).getroot()
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    regular: list[str] = []
    articles: list[str] = []
    missing: list[str] = []

    for node in root.findall("sm:url/sm:loc", namespace):
        url = (node.text or "").strip()
        path = local_path(url)
        if not path.is_file():
            missing.append(url)
            continue
        source = path.read_text(encoding="utf-8")
        parser = HeadParser()
        parser.feed(source)
        title = clean(parser.title) or path.stem.replace("-", " ").title()
        description = clean(parser.description) or title
        entry = f"- [{title}]({url}): {description}"
        is_article = '"@type":"Article"' in source or '"@type": "Article"' in source
        (articles if is_article else regular).append(entry)

    lines = [
        f"# {SITE_NAME}: complete content index",
        "",
        f"> {SUMMARY}",
        "",
        "This file is generated from the XML sitemap. The sitemap and each page's canonical URL remain authoritative.",
        "",
        "## Citation and interpretation guidance",
        "",
        GUIDANCE,
        "",
        "## Tools, hubs, reports, and reference pages",
        "",
        *regular,
        "",
        "## Longform analysis",
        "",
        *articles,
        "",
    ]
    OUTPUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUTPUT.name}: {len(regular)} pages and {len(articles)} articles")
    if missing:
        print("Missing local targets:")
        for url in missing:
            print(f"- {url}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
