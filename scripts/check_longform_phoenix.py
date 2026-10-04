#!/usr/bin/env python3
"""Fail when any indexed Longform destination falls outside Project Phoenix."""

from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
NAVIGATION = ROOT / "data" / "phoenix-navigation.json"
LONGFORM_HUB = ROOT / "longform.html"
REQUIRED = {
    "Phoenix page class": "phoenix-page",
    "Phoenix stylesheet": "/phoenix.css",
    "Phoenix script": "/phoenix.js",
    "site header": 'class="site-header"',
    "site footer": 'class="site-footer"',
    "mobile menu": 'id="mobile-menu"',
}
FORBIDDEN = ("components.js", "components22.js", 'id="header-placeholder"', 'id="footer-placeholder"')


def target_path(href: str) -> Path:
    relative = href.split("?", 1)[0].split("#", 1)[0].lstrip("/")
    if not relative.endswith(".html"):
        relative += ".html"
    return ROOT / relative


def entry_key(href: str) -> str:
    return target_path(href).relative_to(ROOT).as_posix()


def indexed_longform_entries() -> list[dict[str, str]]:
    html = LONGFORM_HUB.read_text(encoding="utf-8")
    scripts = re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    for payload in scripts:
        data = json.loads(payload)
        if data.get("@type") != "ItemList":
            continue
        entries: list[dict[str, str]] = []
        for item in data.get("itemListElement", []):
            url = item.get("url") or item.get("item")
            if not url:
                continue
            entries.append(
                {
                    "href": urlsplit(url).path,
                    "title": item.get("name", url),
                }
            )
        if entries:
            return entries
    raise RuntimeError("Longform hub does not contain an ItemList corpus")


def main() -> int:
    navigation = json.loads(NAVIGATION.read_text(encoding="utf-8"))
    failures: list[str] = []
    phoenix_styles = (ROOT / "phoenix.css").read_text(encoding="utf-8")
    if "body.phoenix-page .legacy-content :is(.callout,.highlight-box)" not in phoenix_styles:
        failures.append("Phoenix stylesheet does not provide theme-aware Longform text boxes")
    entries_by_href = {entry_key(entry["href"]): entry for entry in indexed_longform_entries()}
    for entry in navigation.get("longform", []):
        entries_by_href.setdefault(entry_key(entry["href"]), entry)
    entries = list(entries_by_href.values())
    for entry in entries:
        path = target_path(entry["href"])
        label = entry.get("title", entry["href"])
        if not path.is_file():
            failures.append(f"{label}: missing target {path.relative_to(ROOT)}")
            continue
        html = path.read_text(encoding="utf-8")
        for description, marker in REQUIRED.items():
            if marker not in html:
                failures.append(f"{label}: missing {description} ({marker})")
        for marker in FORBIDDEN:
            if marker in html:
                failures.append(f"{label}: legacy shell marker remains ({marker})")
        if html.count('class="site-header"') != 1:
            failures.append(f"{label}: expected exactly one Phoenix site header")
        if html.count('class="site-footer"') != 1:
            failures.append(f"{label}: expected exactly one Phoenix site footer")

    if failures:
        print("Phoenix Longform check failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print(f"Phoenix Longform corpus check passed: {len(entries)} destinations")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
