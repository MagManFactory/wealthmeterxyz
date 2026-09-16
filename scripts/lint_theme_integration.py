#!/usr/bin/env python3
"""Lint sitemap pages for shared theme integration and longform callout hygiene."""

from __future__ import annotations

import re
import sys
from pathlib import Path


def load_sitemap_pages(repo_root: Path) -> list[Path]:
    sitemap = repo_root / "sitemap.xml"
    if not sitemap.exists():
        return sorted(repo_root.glob("*.html"))

    text = sitemap.read_text(encoding="utf-8", errors="ignore")
    locs = re.findall(r"<loc>https?://[^/]+(/[^<]*)</loc>", text, flags=re.IGNORECASE)
    pages: list[Path] = []

    for loc in locs:
        rel = "index.html" if loc in ("", "/") else loc.lstrip("/")
        if rel.endswith(".html"):
            pages.append(repo_root / rel)

    deduped: list[Path] = []
    seen: set[str] = set()
    for page in pages:
        key = str(page)
        if key not in seen:
            deduped.append(page)
            seen.add(key)
    return deduped


def lint_page(page: Path) -> list[str]:
    issues: list[str] = []
    text = page.read_text(encoding="utf-8", errors="ignore")
    lower = text.lower()

    required = [
        ('id="header-placeholder"', "missing header placeholder"),
        ('id="footer-placeholder"', "missing footer placeholder"),
        ("components.js", "missing shared components.js include"),
    ]
    for needle, msg in required:
        if needle not in text:
            issues.append(msg)

    if 'onclick="toggleTheme()"' in text or "onclick='toggleTheme()'" in text:
        issues.append("inline toggleTheme handler found (use shared components.js binding)")

    if ".classlist.toggle(\"dark\")" in lower or ".classlist.toggle('dark')" in lower:
        issues.append("non-standard dark class toggle found (use dark-mode)")

    overstatement_pattern = re.compile(r"overstatement\s*[1-9]\s*:", flags=re.IGNORECASE)
    if overstatement_pattern.search(text):
        if 'class="callout"' not in lower and "class='callout'" not in lower:
            issues.append("overstatement/claim section present without .callout wrapper")

    return issues


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    pages = load_sitemap_pages(repo_root)
    if not pages:
        print("No HTML pages found to lint.")
        return 0

    failures: list[tuple[Path, list[str]]] = []
    for page in pages:
        if not page.exists():
            failures.append((page, ["file listed in sitemap but not found"]))
            continue
        issues = lint_page(page)
        if issues:
            failures.append((page, issues))

    if failures:
        print("Theme lint failed:")
        for page, issues in failures:
            rel = page.relative_to(repo_root)
            for issue in issues:
                print(f" - {rel}: {issue}")
        return 1

    print(f"Theme lint passed ({len(pages)} pages checked).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
