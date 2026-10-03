#!/usr/bin/env python3
"""Build and validate the shared Project Phoenix navigation inventory."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "phoenix-navigation.json"


@dataclass
class Node:
    tag: str
    attrs: dict[str, str] = field(default_factory=dict)
    children: list["Node | str"] = field(default_factory=list)


class TreeParser(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("document")
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag, {key: value or "" for key, value in attrs})
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.stack.pop()

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data: str) -> None:
        self.stack[-1].children.append(data)


def parse(path: Path) -> Node:
    parser = TreeParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.root


def classes(node: Node) -> set[str]:
    return set(node.attrs.get("class", "").split())


def descendants(node: Node, *, tag: str | None = None, class_name: str | None = None) -> list[Node]:
    found: list[Node] = []
    for child in node.children:
        if not isinstance(child, Node):
            continue
        if (tag is None or child.tag == tag) and (class_name is None or class_name in classes(child)):
            found.append(child)
        found.extend(descendants(child, tag=tag, class_name=class_name))
    return found


def first(node: Node, *, tag: str | None = None, class_name: str | None = None) -> Node | None:
    matches = descendants(node, tag=tag, class_name=class_name)
    return matches[0] if matches else None


def text(node: Node | None) -> str:
    if node is None:
        return ""
    parts: list[str] = []
    for child in node.children:
        parts.append(text(child) if isinstance(child, Node) else child)
    return re.sub(r"\s+", " ", html.unescape("".join(parts))).strip()


def href(value: str) -> str:
    value = value.strip()
    if value.endswith(".html"):
        value = value[:-5]
    if value and not value.startswith(("/", "http://", "https://", "#")):
        value = "/" + value
    return value


def unique(items: list[dict[str, str]], key: str = "href") -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    seen: set[str] = set()
    for item in items:
        marker = item.get(key, "")
        if not marker or marker in seen:
            continue
        seen.add(marker)
        result.append(item)
    return result


def longform_items() -> list[dict[str, str]]:
    root = parse(ROOT / "longform.html")
    items = []
    for anchor in descendants(root, tag="a", class_name="card"):
        title = text(first(anchor, tag="h2"))
        if title:
            items.append({"href": href(anchor.attrs.get("href", "")), "title": title})
    return unique(items)[:14]


def story_items(previous: list[dict[str, str]]) -> list[dict[str, str]]:
    root = parse(ROOT / "stories.html")
    discovered: list[dict[str, str]] = []
    for article in descendants(root, tag="article", class_name="story-card"):
        link = first(article, tag="a", class_name="card-photo") or first(article, tag="a")
        title = text(first(article, tag="h3"))
        image = first(article, tag="img")
        eyebrow = text(first(article, tag="p", class_name="eyebrow"))
        if link and title:
            discovered.append({
                "href": href(link.attrs.get("href", "")),
                "title": title,
                "image": image.attrs.get("src", "") if image else "",
                "meta": eyebrow,
            })
    discovered = unique(discovered)
    by_href = {item["href"]: item for item in discovered}
    previous_hrefs = {item.get("href", "") for item in previous}
    # Story cards are appended to the hub. Newly discovered cards therefore run newest-first here.
    new_items = list(reversed([item for item in discovered if item["href"] not in previous_hrefs]))
    retained = [dict(item, **by_href[item["href"]]) for item in previous if item.get("href") in by_href]
    return unique(new_items + retained)


def special_items() -> list[dict[str, str]]:
    root = parse(ROOT / "special-features.html")
    items = []
    for article in descendants(root, tag="article"):
        heading = first(article, tag="h2") or first(article, tag="h3")
        link = first(heading, tag="a") if heading else None
        description = text(first(article, tag="p"))
        if link and text(heading):
            items.append({"href": href(link.attrs.get("href", "")), "title": text(heading), "description": description})
    return unique(items)


def report_items() -> list[dict[str, str]]:
    root = parse(ROOT / "reports.html")
    items = []
    for heading in descendants(root, tag="h2") + descendants(root, tag="h3"):
        link = first(heading, tag="a")
        target = href(link.attrs.get("href", "")) if link else ""
        if target.startswith("/report-"):
            items.append({"href": target, "title": text(heading).removesuffix("↗").strip()})
    if items:
        return unique(items)
    for link in descendants(root, tag="a"):
        target = href(link.attrs.get("href", ""))
        if target.startswith("/report-"):
            label = text(link).removesuffix("↗").strip()
            if label:
                items.append({"href": target, "title": label})
    return unique(items)


def seed_from_index() -> tuple[list[dict[str, str]], list[dict[str, object]]]:
    root = parse(ROOT / "index.html")
    stories = []
    for link in descendants(root, tag="a", class_name="recent-story"):
        image = first(link, tag="img")
        stories.append({
            "href": href(link.attrs.get("href", "")),
            "title": text(first(link, tag="strong")),
            "image": image.attrs.get("src", "") if image else "",
            "meta": text(first(link, tag="small")),
        })
    groups: list[dict[str, object]] = []
    for section in descendants(root, tag="section", class_name="tool-group"):
        tools = []
        for link in descendants(section, tag="a"):
            title = text(first(link, class_name="menu-title"))
            if title:
                tools.append({"href": href(link.attrs.get("href", "")), "title": title})
        if tools:
            groups.append({"name": text(first(section, tag="h2")), "description": text(first(section, tag="p")), "tools": unique(tools)})
    return unique(stories), groups


def tool_items(previous_groups: list[dict[str, object]]) -> list[dict[str, object]]:
    root = parse(ROOT / "tools.html")
    discovered: list[dict[str, str]] = []
    for link in descendants(root, tag="a", class_name="tool-card"):
        title_node = first(link, class_name="tool-name") or first(link, tag="h2") or first(link, tag="h3") or first(link, tag="strong")
        title = text(title_node)
        if title:
            discovered.append({"href": href(link.attrs.get("href", "")), "title": title})
    discovered = unique(discovered)
    discovered_by_href = {item["href"]: item for item in discovered}
    assigned: set[str] = set()
    groups: list[dict[str, object]] = []
    for group in previous_groups:
        tools = []
        for prior in group.get("tools", []):
            if not isinstance(prior, dict) or prior.get("href") not in discovered_by_href:
                continue
            item = discovered_by_href[str(prior["href"])]
            tools.append(item)
            assigned.add(item["href"])
        if tools:
            groups.append({"name": str(group.get("name", "Tools")), "description": str(group.get("description", "")), "tools": tools})
    new_tools = [item for item in discovered if item["href"] not in assigned]
    if new_tools:
        groups.insert(0, {"name": "New", "description": "Recently added", "tools": new_tools})
    return groups


def build_manifest() -> dict[str, object]:
    previous: dict[str, object] = {}
    if OUTPUT.exists():
        previous = json.loads(OUTPUT.read_text(encoding="utf-8"))
    seeded_stories, seeded_groups = seed_from_index()
    old_stories = previous.get("stories", seeded_stories)
    old_groups = previous.get("toolGroups", seeded_groups)
    return {
        "version": 1,
        "site": "wealthmeter" if "wealth" in ROOT.name.lower() else "lifemeter",
        "longform": longform_items(),
        "stories": story_items(old_stories if isinstance(old_stories, list) else seeded_stories),
        "toolGroups": tool_items(old_groups if isinstance(old_groups, list) else seeded_groups),
        "reports": report_items(),
        "specials": special_items(),
    }


def serialized(manifest: dict[str, object]) -> str:
    return json.dumps(manifest, indent=2, ensure_ascii=False, sort_keys=False) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="Write the current hub inventory.")
    mode.add_argument("--check", action="store_true", help="Fail when the committed inventory is stale.")
    args = parser.parse_args()
    expected = serialized(build_manifest())
    current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
    if args.write:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        if current != expected:
            OUTPUT.write_text(expected, encoding="utf-8")
            print(f"Updated {OUTPUT.relative_to(ROOT)}")
        else:
            print("Phoenix navigation inventory is current.")
        return 0
    if current != expected:
        print("Phoenix navigation inventory is stale. Run scripts/sync_phoenix_navigation.py --write.", file=sys.stderr)
        return 1
    print("Phoenix navigation inventory is current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
