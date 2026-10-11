#!/usr/bin/env python3
"""Generate two October 11 editorial visuals with Nano Banana."""
import base64
import json
import os
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "longform"
PROMPTS = {'hsa-retirement-contribution-spending-timeline-2026-oct11.png': 'Premium 16:9 WealthMeter financial editorial illustration. Warm ivory, midnight navy, muted teal and gold. A horizontal timeline with HSA contributions flowing into an account in working years, then new contribution flow stops at a clear milestone while medical spending draws from the retained balance in later years. Geometric icons only, no arrows implying guaranteed growth. No words, letters, numbers, labels, watermark, logo, people, or medical cross.', 'hsa-retirement-withdrawal-paths-2026-oct11.png': 'Premium 16:9 WealthMeter financial editorial illustration. Warm ivory, midnight navy, muted teal and gold. One HSA account vessel branches into two clearly separate spending paths: one ends at a simple medical bill and one ends at a neutral household cash envelope. The second path has a subtle tax document shape, without implying a penalty after age 65. No numerical amounts, no words, letters, numbers, labels, watermark, logo, or people.'}

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
