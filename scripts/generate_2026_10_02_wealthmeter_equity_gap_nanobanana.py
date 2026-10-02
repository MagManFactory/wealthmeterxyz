#!/usr/bin/env python3
"""Generate the two saved Federal Reserve DFA editorial visuals."""
import base64
import json
import os
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "longform"
PROMPTS = {'equity-ownership-distribution-2026-oct02.png': 'Create a 16:9 institutional WealthMeter editorial illustration on a '
                                                 'white background, navy and cyan, no numbers. Show three separate '
                                                 'household balance-sheet silhouettes with progressively different '
                                                 'proportions of equity, housing, pensions, and business ownership. '
                                                 'The top wealth group has a visibly larger direct-equity block; '
                                                 'middle upper groups have larger housing and pension blocks. Label '
                                                 "categories only, not values. Include subtitle 'Different asset "
                                                 "mixes, different market exposure'. Avoid people, logos, watermark, "
                                                 'invented charts or axes.',
 'equity-gap-risk-framework-2026-oct02.png': 'Create a 16:9 institutional WealthMeter editorial framework, white '
                                             "background, navy and cyan. A two-column decision map: 'Distributional "
                                             "finding' lists asset ownership, starting base, group movement; "
                                             "'Household decision' lists concentration, liquidity, retirement-account "
                                             "exposure. A center connector says 'Do not copy the top tail'. Sparse, "
                                             'accurate typography. No numerical data, no prediction arrows, no logos, '
                                             'no watermark.'}

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
