#!/usr/bin/env python3
"""Generate two bottom-half wealth editorial visuals with Nano Banana."""
import base64
import json
import os
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "longform"
PROMPTS = {'bottom-half-balance-sheet-2026-oct04.png': 'Create a premium 16:9 WealthMeter editorial balance-sheet illustration '
                                             'on a warm white background with dark navy, slate, and restrained gold. '
                                             'Separate a house and car as valuable but hard-to-spend assets, a debt '
                                             'obligation stack, and a small accessible cash reserve. Draw a clear '
                                             'visual route from accessible cash to essential expenses during an income '
                                             'interruption. Use structured panels and precise lines. No text, '
                                             'numerals, labels, logos, watermark, currency symbols, or photorealistic '
                                             'people.',
 'bottom-half-wealth-growth-2026-oct04.png': 'Create a premium 16:9 WealthMeter economic editorial illustration on a '
                                             'warm white background with dark navy, slate, and restrained gold '
                                             'accents. Show two distinct abstract views of growth from a small base: a '
                                             'steep percentage arrow rising from a narrow block, and a modest '
                                             'absolute-dollar block beside a much larger block. The chart is '
                                             'conceptual, not measured; avoid precise axes or bar heights. Include a '
                                             'subtle cluster of household silhouettes under the small base. No text, '
                                             'numerals, labels, logos, watermark, currency symbols, or photorealistic '
                                             'people.'}

def image(payload):
    for candidate in payload.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            data = (part.get("inlineData") or part.get("inline_data") or {}).get("data")
            if data:
                return base64.b64decode(data)
    return None

def main():
    key = os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise SystemExit("Missing GOOGLE_API_KEY")
    OUT.mkdir(parents=True, exist_ok=True)
    for name, prompt in PROMPTS.items():
        target = OUT / name
        if target.exists() and target.stat().st_size > 20000 and target.read_bytes().startswith(b"\x89PNG\r\n\x1a\n"):
            print("Retaining", name)
            continue
        request = Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key={key}",
            data=json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}}).encode(),
            headers={"Content-Type": "application/json"}, method="POST")
        result = image(json.loads(urlopen(request, timeout=240).read().decode()))
        if not result or len(result) < 20000:
            raise SystemExit("No usable image for " + name)
        target.write_bytes(result)
        if not result.startswith(b"\x89PNG\r\n\x1a\n"):
            converted = target.with_suffix(".converted.png")
            subprocess.run(["sips", "-s", "format", "png", str(target), "--out", str(converted)], check=True, stdout=subprocess.DEVNULL)
            converted.replace(target)
        if not target.read_bytes().startswith(b"\x89PNG\r\n\x1a\n"):
            raise SystemExit("Image is not a PNG: " + name)
        print(name)

if __name__ == "__main__":
    main()
