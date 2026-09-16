#!/usr/bin/env python3
"""Generate Nano Banana Pro visuals for the 2026-03-28 longform pair.

Usage:
  python3 scripts/generate_2026_03_28_longform_images_nanobanana.py --api-key "<GOOGLE_API_KEY>"

This script is the canonical generator for the March 28, 2026 LifeMeter and
WealthMeter longform pair. It intentionally mirrors the existing Nano Banana
workflow used elsewhere in this repo so future longform-pair runs can reuse the
same pattern instead of silently falling back to local illustrative rendering.
"""

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
ARTIFACT_DIR = ROOT / "output" / "review" / "longform-pair-2026-03-28" / "nanobanana"
OUT_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

API_URL_TMPL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "nano-banana-pro-preview:generateContent?key={api_key}"
)

STYLE_BLOCK = (
    "Appealing formatting and visuals. Use only these sans fonts: Arial, Nimbus Sans L, "
    "Liberation Sans, Calibri, Segoe UI, or Open Sans (static only). No variable or proprietary fonts. "
    "Keep all text live and highly legible. Clean white or very light background. "
    "Editorial infographic only. Minimalist systems aesthetic. No logos, no watermark, "
    "no decorative clutter, no fake UI chrome, no gibberish text, no photorealistic scenes."
)

PROMPTS: list[dict[str, str]] = [
    {
        "name": "multivitamin-clock-signal-boundary.png",
        "title": "COSMOS Multivitamin Clock Signal Boundary",
        "prompt": (
            "Create a 16:9 executive infographic titled "
            "'Do Multivitamins Slow Biological Aging?'. "
            "Split the canvas into two large columns. "
            "Left column header: 'What the trial established'. "
            "Bullet blocks: 'randomized COSMOS substudy', '958 older adults', "
            "'two-year daily multivitamin assignment', 'slower aging across five epigenetic clocks', "
            "'roughly four months less biological aging over two years'. "
            "Right column header: 'What it did not prove'. "
            "Bullet blocks: 'not proof of lifespan extension', 'not all formulations or ages', "
            "'not a substitute for training, diet, sleep, or biomarkers', "
            "'clock movement is not identical to hard clinical outcomes'. "
            "Bottom line: 'Best interpretation: probability update, not a miracle claim.'"
        ),
    },
    {
        "name": "clock-outcomes-decision-grid.png",
        "title": "Clock Outcomes Decision Grid",
        "prompt": (
            "Create a 16:9 matrix infographic titled "
            "'Clock Signal Versus Clinical Reality'. "
            "Three columns: 'Function improves', 'Function flat', 'Function worsens'. "
            "Three rows: 'Clock improves', 'Clock flat', 'Clock worsens'. "
            "Each cell should contain very short action text such as "
            "'continue and retest', 'audit weak links', 'escalate review', 'low signal', "
            "'do not celebrate', 'change course'. "
            "Use restrained color coding from green to yellow to red. "
            "Footer principle: 'Confidence rises when clock movement aligns with function and core biomarkers.'"
        ),
    },
    {
        "name": "mortgage-lock-in-mobility-trap.png",
        "title": "Mortgage Lock-In Mobility Trap",
        "prompt": (
            "Create a 16:9 systems infographic titled "
            "'The Mortgage Lock-In Trap'. "
            "Use three vertical panels. "
            "Panel 1 header: 'What the cheap loan preserves' with concise blocks "
            "'low monthly payment', 'cash-flow stability', 'rate protection'. "
            "Panel 2 header: 'What it can freeze' with concise blocks "
            "'job mobility', 'family relocation', 'house right-sizing', 'option value'. "
            "Panel 3 header: 'Wealth test' with concise prompts "
            "'would you still choose this house?', 'is equity truly usable?', "
            "'does staying still maximize earnings?'. "
            "Bottom strip: 'A financing asset is not automatically the best housing decision.'"
        ),
    },
    {
        "name": "housing-option-value-decision-grid.png",
        "title": "Housing Option Value Decision Grid",
        "prompt": (
            "Create a 16:9 comparison infographic titled "
            "'Housing Option Value Decision Grid'. "
            "Three large cards side by side titled "
            "'Stay and optimize', 'Rent and move', 'Sell and reset'. "
            "Each card should have three concise criteria bullets. "
            "Stay and optimize: 'house still fits', 'commute and labor market work', 'capex manageable'. "
            "Rent and move: 'spread worth keeping', 'landlord math survives realism', 'concentration risk acceptable'. "
            "Sell and reset: 'new location improves earnings or logistics', 'current house is obsolete', "
            "'new structure improves flexibility'. "
            "Footer question: 'If you lost the cheap mortgage tomorrow, would you still choose this exact house?'"
        ),
    },
]


def payload(prompt_text: str) -> dict[str, Any]:
    return {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }


def call_model(api_key: str, prompt_text: str) -> dict[str, Any]:
    url = API_URL_TMPL.format(api_key=api_key)
    req = Request(
        url,
        data=json.dumps(payload(prompt_text)).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req, timeout=240) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_image_bytes(resp: dict[str, Any]) -> bytes | None:
    for cand in resp.get("candidates", []):
        content = cand.get("content", {})
        for part in content.get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])
    return None


def extract_text(resp: dict[str, Any]) -> str:
    chunks: list[str] = []
    for cand in resp.get("candidates", []):
        content = cand.get("content", {})
        for part in content.get("parts", []):
            if "text" in part:
                chunks.append(part["text"])
    return "\n".join(chunks).strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-key", default=os.getenv("GOOGLE_API_KEY", ""))
    parser.add_argument("--sleep", type=float, default=1.5)
    parser.add_argument("--max-retries", type=int, default=3)
    args = parser.parse_args()

    if not args.api_key:
        raise SystemExit("Missing API key. Pass --api-key or set GOOGLE_API_KEY")

    ok = 0
    for idx, item in enumerate(PROMPTS, start=1):
        prompt_text = (
            f"Create an infographic. {item['title']}. {item['prompt']} "
            f"{STYLE_BLOCK} Landscape layout, 16:9, professional editorial quality."
        )
        out_png = OUT_DIR / item["name"]
        out_json = ARTIFACT_DIR / item["name"].replace(".png", ".json")
        out_txt = ARTIFACT_DIR / item["name"].replace(".png", ".txt")
        out_prompt = ARTIFACT_DIR / item["name"].replace(".png", ".prompt.txt")
        out_prompt.write_text(prompt_text)

        last_err = ""
        for attempt in range(1, args.max_retries + 1):
            try:
                resp = call_model(args.api_key, prompt_text)
                out_json.write_text(json.dumps(resp, indent=2))
                out_txt.write_text(extract_text(resp) or "")
                img = extract_image_bytes(resp)
                if img:
                    out_png.write_bytes(img)
                    if out_png.stat().st_size > 20_000:
                        ok += 1
                        print(f"[{idx:02d}/{len(PROMPTS)}] OK {item['name']} ({out_png.stat().st_size} bytes)")
                        break
                    last_err = "image too small"
                else:
                    last_err = "no inline image in response"
            except HTTPError as e:
                detail = ""
                try:
                    detail = e.read().decode("utf-8", errors="ignore")
                except Exception:
                    detail = str(e)
                last_err = f"HTTPError {e.code}: {detail[:400]}"
            except URLError as e:
                last_err = f"URLError: {e}"
            except Exception as e:
                last_err = str(e)

            print(f"[{idx:02d}/{len(PROMPTS)}] attempt {attempt} failed: {last_err}")
            time.sleep(args.sleep)
        else:
            print(f"[{idx:02d}/{len(PROMPTS)}] FAILED {item['name']}: {last_err}")

        time.sleep(args.sleep)

    print(f"Generated {ok}/{len(PROMPTS)} images to {OUT_DIR}")
    return 0 if ok == len(PROMPTS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
