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
PROMPTS = {'long-term-care-balance-sheet-2026-oct05.png': 'Create a premium 16:9 WealthMeter editorial '
                                                'illustration on warm white with navy, slate, and '
                                                'restrained gold. Show a household balance sheet '
                                                'with liquid reserve, home equity, retirement '
                                                'assets, and a long sequence of care invoices as '
                                                'separate physical objects. Make the timing and '
                                                'liquidity mismatch clear through visual '
                                                'placement, with no numerical scales. Precise, '
                                                'sober editorial vector style. No text, numerals, '
                                                'labels, logos, watermark, currency symbols, or '
                                                'photorealistic people.',
 'long-term-care-funding-paths-2026-oct05.png': 'Create a premium 16:9 WealthMeter editorial '
                                                'decision-map illustration on warm white with '
                                                'navy, slate, and restrained gold. Three parallel '
                                                'pathways converge on long-term personal care: '
                                                'household liquid savings, a private insurance '
                                                'policy document, and a state public-benefits '
                                                'building. Distinguish uncertain eligibility and '
                                                'timing with restrained branching lines. No text, '
                                                'numerals, labels, logos, watermark, currency '
                                                'symbols, or photorealistic people.'}

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
