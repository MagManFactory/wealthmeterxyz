#!/usr/bin/env python3
"""Generate two October 8 editorial visuals with Nano Banana."""
import base64
import json
import os
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "longform"
PROMPTS = {
 "elder-care-cash-flow-map-2026-oct08.png": "Premium 16:9 WealthMeter financial editorial illustration, warm white background, dark navy, teal and muted amber. Show an older parent and adult child as simple human figures beside a household cash-flow stream. Several outflows are represented by home care, transport and prescription icon shapes; another outflow represents time away from paid work. Distinct visual channels, no readable text, numbers, labels, logos, watermarks or photorealistic people.",
 "elder-care-funding-sequence-2026-oct08.png": "Premium 16:9 WealthMeter financial editorial illustration, warm white background, dark navy, teal and muted amber. Show a clean sequence of a family budget ledger, older parent care needs, local support, and a protected emergency reserve. Use clear geometric shapes and restrained iconography, no readable text, numbers, labels, logos, watermarks or photorealistic people."
}

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
