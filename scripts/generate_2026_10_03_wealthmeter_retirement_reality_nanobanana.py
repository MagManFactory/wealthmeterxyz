#!/usr/bin/env python3
"""Generate two retirement-balance-sheet visuals with Nano Banana."""
import base64
import json
import os
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "longform"
PROMPTS = {'retirement-asset-forms-2026-oct03.png': 'Create a premium 16:9 institutional WealthMeter editorial illustration on a white background in navy and cyan. Show five distinct balance-sheet asset forms as crisp abstract icons: market investments, residential property, defined contribution account, defined benefit pension payment stream, and private business. Beneath each, show a different path and timing toward spendable cash, with some paths longer or conditional. Avoid any values or implied recommendations. No text, numbers, logos, watermark, or photographic people.', 'retirement-spending-test-2026-oct03.png': 'Create a premium 16:9 institutional WealthMeter editorial framework on a white background in navy and cyan. Show a timeline of early retirement years with essential expenses, reliable income, liquid reserves, market exposure, housing costs, and a potential early market drawdown as distinct clean visual symbols. The composition should reveal which cash flows cover spending during a drawdown without implying a guaranteed outcome. No text, numbers, logos, watermark, or photographic people.'}

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
