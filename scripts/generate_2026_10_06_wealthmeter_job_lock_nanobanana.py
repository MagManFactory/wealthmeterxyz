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
PROMPTS = {
 "health-insurance-job-lock-2026-oct06.png": "Premium 16:9 WealthMeter editorial illustration, warm white, navy, slate, restrained gold. A professional at a literal forked path between an office building with a plain unmarked shield shape and an open independent path with plain unmarked medical symbols and a calendar silhouette. Communicate career mobility and coverage cost through objects only. All surfaces must be blank. Absolutely no written language, letters, numerals, typographic symbols, signboards, logos, labels, watermark, or currency symbols. Sophisticated restrained vector art.",
 "coverage-transition-ledger-2026-oct06.png": "Premium 16:9 WealthMeter editorial illustration, warm white, navy, slate, restrained gold. Three distinct flowing paths, each containing abstract blank objects for a shield, a calendar, a network of dots, and a household wallet. Show differing timing and cost by spacing and flow width. All surfaces must be blank. Absolutely no written language, letters, numerals, typographic symbols, signboards, logos, labels, watermark, or currency symbols. Sophisticated restrained vector art."
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
