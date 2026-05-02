#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


LONGFORM_BLOCK_RE = re.compile(
    r'<div class="nav-group"><span class="nav-group-label label-longform">Longform</span>\s*<div class="dropdown">(.*?)</div>',
    re.S,
)
HUB_CARD_RE = re.compile(r'<a class="card" href="([^"]+)"')
HREF_RE = re.compile(r'<a href="([^"]+)"')
COMPONENTS_SRC_RE = re.compile(r'<script[^>]+src="([^"]*components\.js[^"]*)"')


def load_local(path: Path) -> str:
    return path.read_text()


def load_remote(url: str) -> str:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urlopen(req, timeout=30) as resp:
            return resp.read().decode("utf-8")
    except HTTPError as exc:
        if exc.code not in {301, 302, 303, 307, 308}:
            raise
        location = exc.headers.get("Location")
        if not location:
            raise
        return load_remote(urljoin(url, location))


def extract_components_url(hub_html: str, hub_url: str) -> str:
    match = COMPONENTS_SRC_RE.search(hub_html)
    if not match:
        return urljoin(hub_url, "components.js")
    return urljoin(hub_url, match.group(1))


def extract_dropdown_order(js: str) -> list[str]:
    match = LONGFORM_BLOCK_RE.search(js)
    if not match:
        raise ValueError("Could not find WealthMeter longform dropdown block in components.js")
    hrefs = HREF_RE.findall(match.group(1))
    return [href for href in hrefs if href not in {"longform.html", "reports.html"}]


def extract_hub_order(html: str) -> list[str]:
    return HUB_CARD_RE.findall(html)


def require_no_duplicates(label: str, values: list[str]) -> None:
    seen: set[str] = set()
    dupes: list[str] = []
    for value in values:
        if value in seen and value not in dupes:
            dupes.append(value)
        seen.add(value)
    if dupes:
        raise ValueError(f"{label} contains duplicates: {', '.join(dupes)}")


def require_equal(label_a: str, a: list[str], label_b: str, b: list[str]) -> None:
    if a == b:
        return
    max_len = max(len(a), len(b))
    for idx in range(max_len):
        left = a[idx] if idx < len(a) else "<missing>"
        right = b[idx] if idx < len(b) else "<missing>"
        if left != right:
            raise ValueError(
                f"{label_a} and {label_b} differ at position {idx + 1}: {left} != {right}"
            )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", metavar="BASE_URL")
    args = parser.parse_args()

    if args.live:
        base = args.live.rstrip("/")
        hub_url = f"{base}/longform.html"
        hub = load_remote(hub_url)
        components = load_remote(extract_components_url(hub, hub_url))
        source_label = hub_url
    else:
        root = Path.cwd()
        components = load_local(root / "components.js")
        hub = load_local(root / "longform.html")
        source_label = str(root)

    dropdown = extract_dropdown_order(components)
    hub_order = extract_hub_order(hub)

    require_no_duplicates("Longform dropdown", dropdown)
    require_equal("Hub order", hub_order, "Dropdown order", dropdown)

    print(f"WealthMeter longform order OK: {source_label}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Longform order check failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
