#!/usr/bin/env python3
"""Saved Nano Banana API workflow for the September 25 joint-account longform."""

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
    "joint-account-fdic-coverage-2026-sep25.png": (
        "Create a 16:9 editorial diagram titled 'How FDIC Joint-Account Coverage Works'. "
        "Show a $500,000 qualifying joint account split into two equal $250,000 ownership shares. "
        "Label each co-owner 'covered up to $250,000 across qualifying joint accounts at one bank'. "
        "Footer: 'Coverage depends on ownership category and bank records.'"
    ),
    "joint-account-fdic-checklist-2026-sep25.png": (
        "Create a 16:9 editorial checklist titled 'Check a Joint Account Before Relying on FDIC Coverage'. "
        "Five checks: 'each owner is a natural person', 'equal withdrawal rights', 'bank records establish co-ownership', "
        "'all qualifying joint balances at this bank', and 'beneficiaries may change the ownership category'. "
        "Final box: 'Use FDIC EDIE for a complex household.'"
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
