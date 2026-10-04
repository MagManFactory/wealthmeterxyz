#!/usr/bin/env python3
"""Fail when a current Longform destination falls outside Project Phoenix."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NAVIGATION = ROOT / "data" / "phoenix-navigation.json"
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


def main() -> int:
    navigation = json.loads(NAVIGATION.read_text(encoding="utf-8"))
    failures: list[str] = []
    entries = navigation.get("longform", [])
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
    print(f"Phoenix Longform check passed: {len(entries)} destinations")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
