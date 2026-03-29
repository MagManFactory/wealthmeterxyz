#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path


DATA_PATH = Path("data/wealth-briefs.json")

# These patterns catch the obvious cross-domain optimization papers that drifted
# into the finance shelf because they share frontier/optimization language.
BANNED_TITLE_FRAGMENTS = (
    "uav",
    "robotics",
    "additive manufacturing",
    "liver allocation",
    "communication networks",
    "control agents",
    "power flow",
    "binary decision diagrams",
    "product offering and pricing",
    "data envelopment",
    "black-box",
    "mixed integer linear optimization problem",
    "probabilistic optimization",
)


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    sys.exit(1)


def main() -> None:
    if not DATA_PATH.exists():
        fail(f"Missing dataset: {DATA_PATH}")

    payload = json.loads(DATA_PATH.read_text())
    briefs = payload.get("briefs", [])
    if payload.get("count") != len(briefs):
        fail(f"count mismatch: payload={payload.get('count')} actual={len(briefs)}")

    category_counts = Counter(item.get("category") for item in briefs)
    if dict(category_counts) != payload.get("categories", {}):
        fail("category totals do not match dataset contents")

    source_type_counts = Counter(item.get("sourceType") for item in briefs)
    if dict(source_type_counts) != payload.get("sourceTypes", {}):
        fail("source type totals do not match dataset contents")

    featured_count = sum(1 for item in briefs if item.get("featured"))
    if featured_count != payload.get("featuredCount"):
        fail(
            f"featuredCount mismatch: payload={payload.get('featuredCount')} actual={featured_count}"
        )

    duplicate_ids = [item_id for item_id, count in Counter(item.get("id") for item in briefs).items() if count > 1]
    if duplicate_ids:
        fail(f"duplicate ids found: {duplicate_ids[:5]}")

    offenders = []
    for item in briefs:
        title = str(item.get("title", ""))
        lowered = title.lower()
        if any(fragment in lowered for fragment in BANNED_TITLE_FRAGMENTS):
            offenders.append(title)

    if offenders:
        fail(
            "cross-domain titles present in Wealth Briefs: "
            + "; ".join(offenders[:10])
        )

    print(
        f"OK: {len(briefs)} briefs, {featured_count} featured, "
        f"{len(category_counts)} categories"
    )


if __name__ == "__main__":
    main()
