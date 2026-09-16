#!/usr/bin/env python3
"""Saved Nano Banana API workflow for the September 15 deductible longform."""

import base64
import json
import os
from pathlib import Path
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
    "deductible-liquidity-waterfall-2026-sep15.png": (
        "Create a 16:9 editorial waterfall titled 'When a Deductible Becomes a "
        "Cash Shock'. Show a household cash reserve bar falling through ordered "
        "obligations: 'deductible due', 'coinsurance', 'housing and food', "
        "'income interruption'. End states: 'cash buffer holds' in blue and "
        "'expensive financing' in red. Footer: 'The test is payment timing, not "
        "net worth.'"
    ),
    "deductible-cashflow-test-2026-sep15.png": (
        "Create a 16:9 editorial checklist titled 'The Deductible Cash-Flow Test'. "
        "Four checkboxes: 'family deductible', 'out-of-pocket maximum', 'cash "
        "accessible within days', 'income and fixed bills during recovery'. Final "
        "box: 'financing gap if the claim arrives this month'."
    ),
}


def extract_image(response: dict) -> bytes | None:
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
