#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.request import Request, urlopen

DOMAIN = "https://wealthmeter.xyz"
KEY = "214a7fa11c70b4c48cd201563039f675"
ENDPOINT = "https://api.indexnow.org/indexnow"
ROOT = Path(__file__).resolve().parent.parent


def sitemap_urls() -> list[str]:
    tree = ET.parse(ROOT / "sitemap.xml")
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [node.text for node in tree.findall("s:url/s:loc", namespace) if node.text]


def main() -> int:
    urls = sys.argv[1:] or sitemap_urls()
    payload = json.dumps({
        "host": "wealthmeter.xyz",
        "key": KEY,
        "keyLocation": f"{DOMAIN}/{KEY}.txt",
        "urlList": urls,
    }).encode("utf-8")
    request = Request(ENDPOINT, data=payload, headers={"Content-Type": "application/json; charset=utf-8"}, method="POST")
    with urlopen(request, timeout=30) as response:
        if response.status not in {200, 202}:
            raise RuntimeError(f"IndexNow returned HTTP {response.status}")
    print(f"Submitted {len(urls)} WealthMeter URLs to IndexNow.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
