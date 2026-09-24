#!/usr/bin/env python3
"""Saved Nano Banana API workflow for the September 24 retirement-catch-up longform."""

import base64
import json
import os
from pathlib import Path
from typing import Optional
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "longform"
OUT.mkdir(parents=True, exist_ok=True)
STYLE = (
    "Institutional editorial infographic, clean white background, crisp legible "
    "sans typography, minimalist systems aesthetic, no logos, no watermark, "
    "no photorealism, landscape 16:9."
)
PROMPTS = {
    "retirement-catchup-window-2026-sep24.png": (
        "Create a 16:9 editorial diagram titled '2026 Retirement Catch-Up Window'. "
        "Show a timeline labelled Ages 50+, then highlight ages 60, 61, 62, and 63. "
        "Display '$24,500 regular deferral', '$8,000 general catch-up', and '$11,250 higher catch-up at ages 60-63'. "
        "Footer: 'Subject to plan terms and compensation.'"
    ),
    "retirement-catchup-decision-2026-sep24.png": (
        "Create a 16:9 editorial checklist titled 'Before You Raise a 2026 Payroll Deferral'. "
        "Five checks: 'eligible plan type', 'turn age 60-63 this year', 'remaining compensation and pay periods', "
        "'plan permits catch-ups', and 'Roth catch-up if prior-year wages exceeded $150,000'. "
        "Final box: 'confirm with the plan recordkeeper'."
    ),
}


def extract_image(response: dict) -> Optional[bytes]:
    for candidate in response.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data") or {}
            if data := inline.get("data"):
                return base64.b64decode(data)
    return None


def main() -> None:
    key = os.getenv("GOOGLE_API_KEY")
    if not key:
        raise SystemExit("Missing GOOGLE_API_KEY")
    for name, prompt in PROMPTS.items():
        target = OUT / name
        if target.exists() and target.stat().st_size > 20_000:
            print(f"Retaining {name}")
            continue
        request = Request(
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"nano-banana-pro-preview:generateContent?key={key}",
            data=json.dumps(
                {
                    "contents": [{"parts": [{"text": f"{prompt} {STYLE}"}]}],
                    "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
                }
            ).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        result = json.loads(urlopen(request, timeout=240).read().decode())
        data = extract_image(result)
        if not data or len(data) < 20_000:
            raise SystemExit(f"No usable image for {name}")
        target.write_bytes(data)
        print(name)


if __name__ == "__main__":
    main()
