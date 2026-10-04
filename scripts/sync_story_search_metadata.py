#!/usr/bin/env python3
"""Build story search metadata from the actual headline and hero photograph."""
import argparse
import html
import json
from pathlib import Path
import re
import sys
from urllib.parse import urljoin
from check_search_discovery import HeadMetadata

ROOT = Path(__file__).resolve().parent.parent


def repair(path):
    text = path.read_text(encoding="utf-8")
    metadata = HeadMetadata()
    metadata.feed(text)
    canonical = metadata.canonical
    if not canonical or "noindex" in metadata.robots.lower():
        return text
    headline = html.unescape(re.search(r"<h1[^>]*>(.*?)</h1>", text, re.S)[1])
    headline = re.sub(r"<[^>]+>", "", headline)
    photo = re.search(r'<figure class="article-photo">\s*<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"', text, re.S)
    description = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', text)[1])
    if not photo or not (ROOT / photo[1].lstrip("/")).is_file():
        raise ValueError(f"Missing story hero image: {path}")
    image = urljoin(canonical, photo[1])
    home = canonical.split("/stories/")[0] + "/"
    brand = "LifeMeter" if "lifemeter.xyz" in home else "WealthMeter"
    payload = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": headline, "description": description,
        "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
        "image": [image], "inLanguage": "en",
        "publisher": {"@type": "Organization", "name": brand, "url": home}
    }
    # Do not invent bylines or publication dates absent from the published page.
    generated = (
        '<meta property="og:type" content="article">'
        + '<meta property="og:image" content="' + html.escape(image, quote=True) + '">'
        + '<meta property="og:image:alt" content="' + html.escape(html.unescape(photo[2]), quote=True) + '">'
        + '<meta name="twitter:card" content="summary_large_image">'
        + '<script type="application/ld+json" id="story-search-metadata">'
        + json.dumps(payload, ensure_ascii=False).replace("<", "\\u003c") + '</script>'
    )
    for pattern in (
        r'<meta (?:property="og:(?:type|image|image:alt)"|name="twitter:card")[^>]*>',
        r'<script type="application/ld\+json" id="story-search-metadata">.*?</script>'
    ):
        text = re.sub(pattern, "", text, flags=re.S)
    return text.replace("</head>", generated + "</head>", 1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    changed = []
    pages = sorted((ROOT / "stories").glob("*.html"))
    for path in pages:
        original = path.read_text(encoding="utf-8")
        updated = repair(path)
        if updated != original:
            changed.append(path.name)
            if args.write:
                path.write_text(updated, encoding="utf-8")
    if changed and not args.write:
        print("Story search metadata needs refresh: " + ", ".join(changed))
        return 1
    print(f"Story search metadata verified: {len(pages)} pages; {len(changed)} updated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
