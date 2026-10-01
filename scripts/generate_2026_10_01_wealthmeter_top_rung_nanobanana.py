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
PROMPTS = {
    "top-rung-wealth-share-2026-oct01.png": "Create a 16:9 institutional editorial comparison card titled 'The top rung moved'. NO chart, NO axes, NO plotted trajectory, NO invented intermediate values. Show only two large equal-size side-by-side numeric panels: left '2019 Q4' with '12.4%' and right '2026 Q2' with '15.0%'. Between them place one right-pointing arrow labeled '+2.6 percentage points'. Small subtitle 'Top 0.1% share of U.S. household wealth'. Small source line 'Federal Reserve Distributional Financial Accounts'. White background, navy and cyan, legible typography, no logos, no watermark, no human figures.",
    "top-rung-percentile-comparison-2026-oct01.png": "Create a 16:9 institutional editorial bar chart for WealthMeter titled 'Growth since 2019 Q4'. Show five clearly labeled wealth groups and net-worth multiples through 2026 Q2: Top 0.1% 2.09x; 99th-99.9th 1.68x; 90th-99th 1.59x; 50th-90th 1.75x; Bottom 50% 2.30x. Include note: Percentage growth from different starting bases; not household trajectories. Source: Federal Reserve DFA. White background, navy and cyan, clear typography, no logos, no watermark.",
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
