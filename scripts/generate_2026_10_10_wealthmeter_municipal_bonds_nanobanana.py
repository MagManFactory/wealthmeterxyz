#!/usr/bin/env python3
"""Generate two October 10 editorial visuals with Nano Banana."""
import base64
import json
import os
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "longform"
PROMPTS = {'municipal-bond-yield-risk-map-2026-oct10.png': 'Premium 16:9 WealthMeter financial editorial illustration. Warm ivory background, midnight navy, muted teal and gold. A municipal bond cash-flow ribbon connects a civic building to an investor; three distinct unlabeled branches show tax treatment, issuer payment source, and market price movement. Precise restrained magazine illustration. No writing, words, letters, numbers, labels, watermark, logo or people.', 'municipal-bond-call-price-scenarios-2026-oct10.png': 'Premium 16:9 WealthMeter financial editorial illustration. Warm ivory background, midnight navy, muted teal and gold. Two side-by-side purely geometric paths. The upper path reaches a distant gold circle. The lower path ends early at a smaller teal circle, then curves toward a different gold circle. Small gold coin stacks at each path entrance; no implication of guaranteed return. There must be no typography or symbols: no words, no letters, no numbers, no labels, no watermark, no brand mark, no logo, no people.'}

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
