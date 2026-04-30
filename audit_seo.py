#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
CANONICAL_RE = re.compile(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\'](.*?)["\']', re.IGNORECASE)
DESC_RE = re.compile(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', re.IGNORECASE | re.DOTALL)
ROBOTS_RE = re.compile(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\'](.*?)["\']', re.IGNORECASE | re.DOTALL)
RSS_RE = re.compile(r'<link[^>]+type=["\']application/rss\+xml["\']', re.IGNORECASE)
OG_WIDTH_RE = re.compile(r'<meta[^>]+property=["\']og:image:width["\']', re.IGNORECASE)
OG_HEIGHT_RE = re.compile(r'<meta[^>]+property=["\']og:image:height["\']', re.IGNORECASE)
IMG_TAG_RE = re.compile(r"<img\b[^>]*>", re.IGNORECASE | re.DOTALL)
IMG_DIM_RE = re.compile(r'\bwidth=["\']\d+["\'].*\bheight=["\']\d+["\']|\bheight=["\']\d+["\'].*\bwidth=["\']\d+["\']', re.IGNORECASE | re.DOTALL)
JSON_LD_RE = re.compile(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.IGNORECASE | re.DOTALL)
SRC_RE = re.compile(r'\bsrc=["\']([^"\']+)["\']', re.IGNORECASE)
OG_IMAGE_RE = re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](.*?)["\']', re.IGNORECASE)


def title_of(text: str) -> str:
    match = TITLE_RE.search(text)
    return match.group(1).strip() if match else "MISSING TITLE"


def has_schema(text: str, schema_type: str) -> bool:
    return any(f'"@type":"{schema_type}"' in block or f'"@type": "{schema_type}"' in block for block in JSON_LD_RE.findall(text))


def main() -> int:
    files = sorted(ROOT.glob("*.html"))
    findings: list[tuple[str, str]] = []
    pillar_pages = {path.name for path in ROOT.glob("*pillar.html")}

    for path in files:
        text = path.read_text(encoding="utf-8")
        title = title_of(text)
        robots_match = ROBOTS_RE.search(text)
        robots = robots_match.group(1).strip().lower() if robots_match else "index, follow"
        indexable = "noindex" not in robots

        if not CANONICAL_RE.search(text):
            findings.append((path.name, "missing canonical"))
        if indexable and not DESC_RE.search(text):
            findings.append((path.name, "missing meta description"))
        if not RSS_RE.search(text):
            findings.append((path.name, "missing rss link"))
        if indexable and OG_IMAGE_RE.search(text) and not OG_WIDTH_RE.search(text):
            findings.append((path.name, "missing og:image:width"))
        if indexable and OG_IMAGE_RE.search(text) and not OG_HEIGHT_RE.search(text):
            findings.append((path.name, "missing og:image:height"))
        if indexable and not has_schema(text, "BreadcrumbList"):
            findings.append((path.name, "missing BreadcrumbList schema"))
        if path.name == "longform.html" and not has_schema(text, "ItemList"):
            findings.append((path.name, "missing ItemList schema"))
        if path.name in pillar_pages and not has_schema(text, "ItemList"):
            findings.append((path.name, "missing pillar ItemList schema"))

        for img_tag in IMG_TAG_RE.findall(text):
            if IMG_DIM_RE.search(img_tag):
                continue
            if "data:image" in img_tag or ".svg" in img_tag:
                continue
            src_match = SRC_RE.search(img_tag)
            if not src_match:
                continue
            src = src_match.group(1).strip()
            if src.startswith("http://") or src.startswith("https://"):
                continue
            asset_path = ROOT / src.lstrip("/")
            if not asset_path.exists():
                continue
            findings.append((path.name, "image missing width/height"))
            break

        print(f"{path.name:45} | {title[:58]:58} | {robots}")

    if findings:
        print("\nSEO findings:")
        for filename, issue in findings:
            print(f"- {filename}: {issue}")
        return 1

    print("\nSEO audit passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
