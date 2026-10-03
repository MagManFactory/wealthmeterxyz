#!/usr/bin/env python3
"""Fail when a Special-feature destination falls outside the Phoenix shell."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NAVIGATION = ROOT / "data" / "phoenix-navigation.json"

REQUIRED_MARKERS = {
    "Phoenix page class": "phoenix-page",
    "Phoenix stylesheet": "/phoenix.css",
    "Phoenix script": "/phoenix.js",
    "site header": 'class="site-header"',
    "site footer": 'class="site-footer"',
    "mobile menu": 'id="mobile-menu"',
}
FORBIDDEN_MARKERS = ("/components.js", "/components22.js")


def target_path(href: str) -> Path:
    relative = href.split("?", 1)[0].split("#", 1)[0].lstrip("/")
    if not relative.endswith(".html"):
        relative += ".html"
    return ROOT / relative


def main() -> int:
    navigation = json.loads(NAVIGATION.read_text(encoding="utf-8"))
    failures: list[str] = []

    for special in navigation.get("specials", []):
        page = target_path(special["href"])
        label = special.get("title", special["href"])
        if not page.is_file():
            failures.append(f"{label}: missing target {page.relative_to(ROOT)}")
            continue

        html = page.read_text(encoding="utf-8")
        for description, marker in REQUIRED_MARKERS.items():
            if marker not in html:
                failures.append(f"{label}: missing {description} ({marker})")
        for marker in FORBIDDEN_MARKERS:
            if marker in html:
                failures.append(f"{label}: legacy shell dependency remains ({marker})")

    if failures:
        print("Phoenix Special-feature check failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(f"Phoenix Special-feature check passed: {len(navigation.get('specials', []))} destinations")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
