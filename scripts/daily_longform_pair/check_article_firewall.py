#!/usr/bin/env python3
"""Verify that a selected article has static, single-brand chrome."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
from pathlib import Path


FORBIDDEN_MARKERS = {
    "lifemeter": ("wealthmeter.xyz", "sister-site-link", "label-wealthmeter", ">wealthmeter"),
    "wealthmeter": ("lifemeter.xyz", "sister-site-link", ">lifemeter"),
}


class StaticPlaceholderParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.sections: dict[str, str] = {}
        self.active_id: str | None = None
        self.depth = 0
        self.chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {name.lower(): (value or "") for name, value in attrs}
        if self.active_id is None and tag.lower() == "div":
            placeholder_id = attributes.get("id")
            if placeholder_id in {"header-placeholder", "footer-placeholder"} and attributes.get("data-static-component") == "1":
                self.active_id, self.depth, self.chunks = placeholder_id, 1, [self.get_starttag_text()]
                return
        if self.active_id is not None:
            self.chunks.append(self.get_starttag_text())
            if tag.lower() == "div":
                self.depth += 1

    def handle_endtag(self, tag: str) -> None:
        if self.active_id is None:
            return
        self.chunks.append(f"</{tag}>")
        if tag.lower() == "div":
            self.depth -= 1
            if self.depth == 0:
                self.sections[self.active_id] = "".join(self.chunks).lower()
                self.active_id, self.chunks = None, []

    def handle_data(self, data: str) -> None:
        if self.active_id is not None:
            self.chunks.append(data)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", choices=sorted(FORBIDDEN_MARKERS), required=True)
    parser.add_argument("--article", type=Path, required=True)
    args = parser.parse_args()
    article = args.article.resolve()
    if not article.is_file():
        parser.error(f"Article does not exist: {article}")
    html_parser = StaticPlaceholderParser()
    html_parser.feed(article.read_text(encoding="utf-8"))
    missing = {"header-placeholder", "footer-placeholder"} - html_parser.sections.keys()
    if missing:
        raise SystemExit(f"Article chrome is not static or is incomplete: {', '.join(sorted(missing))}")
    joined = "".join(html_parser.sections.values())
    found = [marker for marker in FORBIDDEN_MARKERS[args.site] if marker in joined]
    if found:
        raise SystemExit(f"Cross-brand article chrome in {article.name}: {', '.join(found)}")
    print(f"article_firewall=pass site={args.site} article={article.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
