#!/usr/bin/env python3
"""Check sitemap coverage of canonical, indexable reader pages."""
from pathlib import Path
from html.parser import HTMLParser
import sys
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent


class HeadMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = None
        self.robots = ""

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "link" and "canonical" in (attrs.get("rel") or "").lower().split():
            self.canonical = attrs.get("href")
        if tag == "meta" and (attrs.get("name") or "").lower() == "robots":
            self.robots = attrs.get("content") or ""


def canonical_reader_pages(root: Path, domain: str):
    """Exclude staging, cross-brand legacy pages and query-only templates."""
    for page in sorted(root.rglob("*.html")):
        relative = page.relative_to(root)
        if len(relative.parts) > 1 and relative.parts[0] not in ("stories", "features", "partners"):
            continue
        if page.name == "wealth-brief.html":
            continue
        body = page.read_text(errors="replace")
        metadata = HeadMetadata()
        metadata.feed(body)
        if metadata.canonical and urlparse(metadata.canonical).netloc == domain and "noindex" not in metadata.robots.lower():
            yield page, metadata.canonical



def main():
    urls = {element.text for element in ET.parse(ROOT / "sitemap.xml").getroot().iter() if element.tag.endswith("loc")}
    domains = {urlparse(url).netloc for url in urls}
    if len(domains) != 1:
        raise SystemExit("Sitemap contains mixed domains")
    missing = [f"{page.relative_to(ROOT)}: {canonical}" for page, canonical in canonical_reader_pages(ROOT, domains.pop()) if canonical not in urls]
    if missing:
        print("Indexable pages missing from sitemap:\n" + "\n".join(missing))
        return 1
    print(f"Search discovery coverage passed: {len(urls)} canonical URLs.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
