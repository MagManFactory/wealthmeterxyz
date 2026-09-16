#!/usr/bin/env python3
"""Generate Nano Banana Pro visuals for the 2026-07-06 WealthMeter sequence-risk longform."""

from __future__ import annotations

import argparse
import base64
import json
import os
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "images" / "longform"
ARTIFACT_DIR = ROOT / "output" / "review" / "longform-pair-2026-07-06" / "wealthmeter-nanobanana"
OUT_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

API_URL_TMPL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-3-pro-image:generateContent?key={api_key}"
)

STYLE_BLOCK = (
    "Institutional editorial infographic only. Use a clean white or warm-white background. "
    "Use only crisp, highly legible sans typography. Minimalist systems aesthetic. "
    "No logos, no watermarks, no decorative clutter, no fake user-interface chrome, no photorealism. "
    "Landscape 16:9 format, publication quality, with labels large enough to read."
)

PROMPTS: list[dict[str, str]] = [
    {
        "name": "sequence-risk-fragility-wedge-2026-jul06.png",
        "title": "Sequence Risk Fragility Wedge",
        "prompt": (
            "Create a 16:9 editorial wedge chart titled 'Sequence Risk Starts Before Retirement'. "
            "Show a household moving from age 50 to retirement with three widening pressure bands labeled "
            "'market drawdown', 'fixed-cost rigidity', and 'shrinking recovery time'. Add a red wedge labeled "
            "'forced plan reset' where these pressures overlap. Include defense markers labeled 'cash buffer', "
            "'lower carry', and 'retirement-date flexibility'."
        ),
    },
    {
        "name": "preretirement-defense-ladder-2026-jul06.png",
        "title": "Pre-Retirement Defense Ladder",
        "prompt": (
            "Create a 16:9 editorial ladder titled 'Defenses Against Pre-Retirement Sequence Fragility'. "
            "Rank six layers from strongest to weakest defense: 'cash and short reserves', 'low fixed debt', "
            "'flexible spending', 'bridge income capacity', 'diversified portfolio', and 'delayed retirement option'. "
            "For each layer add compact columns labeled 'timing protection', 'behavior protection', and 'portfolio relief'. "
            "Use blue for strong defenses, slate for moderate, and restrained amber where the defense is conditional."
        ),
    },
]


def call_model(api_key: str, prompt: str) -> dict[str, Any]:
    payload = {
        "contents": [{"parts": [{"text": f"{STYLE_BLOCK}\n\n{prompt}"}]}],
        "generationConfig": {"temperature": 0.4},
    }
    req = Request(
        API_URL_TMPL.format(api_key=api_key),
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req, timeout=180) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_image_bytes(response: dict[str, Any]) -> bytes:
    for candidate in response.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            inline = part.get("inlineData")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])
    raise ValueError("No inline image data returned by model response")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sleep", type=float, default=2.0)
    args = parser.parse_args()

    api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("GOOGLE_API_KEY is required")

    manifest: list[dict[str, str]] = []
    for item in PROMPTS:
        try:
            response = call_model(api_key, item["prompt"])
            image_bytes = extract_image_bytes(response)
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            raise SystemExit(f"Image generation failed for {item['name']}: {exc}") from exc

        out_path = OUT_DIR / item["name"]
        out_path.write_bytes(image_bytes)
        artifact_path = ARTIFACT_DIR / f"{out_path.stem}.json"
        artifact_path.write_text(json.dumps(response, indent=2))
        manifest.append({"file": str(out_path), "artifact": str(artifact_path), "title": item["title"]})
        time.sleep(args.sleep)

    (ARTIFACT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
