#!/usr/bin/env python3
"""Migrate current Longform destinations into the Project Phoenix shell."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NAVIGATION = ROOT / "data" / "phoenix-navigation.json"
PHOENIX_MARKER = "phoenix-page"


def target_path(href: str) -> Path:
    relative = href.split("?", 1)[0].split("#", 1)[0].lstrip("/")
    if not relative.endswith(".html"):
        relative += ".html"
    return ROOT / relative


def current_longform_paths() -> list[Path]:
    navigation = json.loads(NAVIGATION.read_text(encoding="utf-8"))
    return [target_path(item["href"]) for item in navigation.get("longform", [])]


def find_template(paths: list[Path]) -> str:
    for path in paths:
        if not path.is_file():
            continue
        html = path.read_text(encoding="utf-8")
        if (
            PHOENIX_MARKER in html
            and 'class="site-header"' in html
            and 'class="site-footer"' in html
            and 'id="header-placeholder"' not in html
            and "components.js" not in html
            and "components22.js" not in html
        ):
            return html
    raise RuntimeError("No Phoenix Longform page is available as the shell template.")


def shell_parts(template: str) -> tuple[str, str, list[str]]:
    body = re.search(r'(<body\b[^>]*>.*?)(?=<main\b)', template, re.IGNORECASE | re.DOTALL)
    close = template.find("</main>")
    if body is None or close < 0:
        raise RuntimeError("Phoenix shell template has no body prefix or main closing tag.")
    assets = []
    head = template.split("</head>", 1)[0]
    for tag in re.findall(r'<(?:link|script)\b[^>]*?(?:href|src)=["\'][^"\']+["\'][^>]*>(?:</script>)?', head, re.IGNORECASE):
        if any(name in tag for name in ("/editorial.css", "/candidate.css", "/phoenix.css", "/editorial.js", "/candidate.js", "/phoenix.js")):
            assets.append(tag)
    return body.group(1), template[close + len("</main>"):], assets


def clean_legacy_head(head: str) -> str:
    head = re.sub(
        r'<link\b[^>]*href=["\'][^"\']*nav-dropdown\.css[^"\']*["\'][^>]*>\s*',
        "",
        head,
        flags=re.IGNORECASE,
    )
    def remove_legacy_component_style(match: re.Match[str]) -> str:
        block = match.group(0)
        if any(marker in block for marker in (".nav-container", "#theme-toggle", ".site-newsletter")):
            return ""
        return block

    head = re.sub(
        r'<style\b[^>]*>.*?</style>\s*',
        remove_legacy_component_style,
        head,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return head.rstrip()


def migrate(html: str, body_prefix: str, body_suffix: str, assets: list[str]) -> str:
    if (
        PHOENIX_MARKER in html
        and 'id="header-placeholder"' not in html
        and 'id="footer-placeholder"' not in html
        and "components.js" not in html
        and "components22.js" not in html
    ):
        return html
    head_end = html.find("</head>")
    main_start = html.find("<main")
    main_end = html.find("</main>", main_start)
    if min(head_end, main_start, main_end) < 0:
        raise ValueError("Page is missing a complete head or main element.")
    head = clean_legacy_head(html[:head_end])
    for asset in assets:
        if asset not in head:
            head += asset
    main = html[main_start:main_end + len("</main>")]
    return f"{head}</head>\n{body_prefix}{main}{body_suffix}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="Migrate legacy destinations in place.")
    mode.add_argument("--check", action="store_true", help="Fail when a destination still uses the legacy shell.")
    args = parser.parse_args()

    paths = current_longform_paths()
    template = find_template(paths)
    body_prefix, body_suffix, assets = shell_parts(template)
    changed: list[Path] = []
    failures: list[str] = []

    for path in paths:
        if not path.is_file():
            failures.append(f"missing target {path.relative_to(ROOT)}")
            continue
        original = path.read_text(encoding="utf-8")
        if PHOENIX_MARKER in original:
            continue
        if args.check:
            failures.append(f"legacy shell remains in {path.relative_to(ROOT)}")
            continue
        try:
            updated = migrate(original, body_prefix, body_suffix, assets)
        except ValueError as error:
            failures.append(f"{path.relative_to(ROOT)}: {error}")
            continue
        path.write_text(updated, encoding="utf-8")
        changed.append(path)

    if failures:
        print("Phoenix Longform migration failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    action = "migrated" if args.write else "validated"
    print(f"Phoenix Longform destinations {action}: {len(paths)} ({len(changed)} changed)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
