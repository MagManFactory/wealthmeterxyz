#!/usr/bin/env python3
"""Saved Nano Banana API workflow for the September 27 HSA-limits longform."""

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
    "2026-hsa-limit-deductible-2026-sep27.png": (
        "Create a 16:9 editorial benefits diagram titled '2026 HSA: Check the Plan First'. "
        "Show 'HSA-eligible plan?' leading to 'self-only $4,400' and 'family $8,750'. "
        "Include small labels 'minimum deductible $1,700 / $3,400' and 'out-of-pocket maximum $8,500 / $17,000'."
    ),
    "2026-hsa-decision-sequence-2026-sep27.png": (
        "Create a 16:9 editorial decision sequence titled 'HSA Contribution Sequence'. "
        "Show three connected steps: 'Confirm HSA eligibility', 'Coordinate payroll and employer contributions', "
        "and 'Choose an amount that fits cash flow'. Footer: 'The annual limit is a maximum, not a default.'"
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
