#!/usr/bin/env python3
"""Generate two October 9 editorial visuals with Nano Banana."""
import base64
import json
import os
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "longform"
PROMPTS = {'asset-location-three-accounts-2026-oct09.png': 'Premium 16:9 WealthMeter financial editorial illustration. Warm ivory background, midnight navy, muted teal and gold. Three distinct unlabeled transparent account containers hold stylized stocks and bonds; small tax-flow arrows leave only the taxable container. Make the visual about account placement without suggesting different total asset allocation. Precise restrained magazine illustration, no labels, letters, numerals, watermark, logo or people.', 'asset-location-rebalancing-cost-2026-oct09.png': 'Premium 16:9 WealthMeter financial editorial illustration. Purely symbolic composition with warm ivory background, midnight navy, muted teal and gold. On the left, a balanced arrangement of simple geometric equity circles and fixed-income rectangles. In the middle, a path of small gold coins indicates the cost of moving an existing position. On the right, the same total shapes are distributed across three blank account frames. No jars, no paper, no icons resembling documents, no writing of any kind, no words, no letters, no numbers, no labels, no watermark, no logo, no people. Sophisticated restrained magazine illustration.'}

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
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={key}",
            data=json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["TEXT", "IMAGE"], "imageConfig": {"aspectRatio": "16:9"}}}).encode(),
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
