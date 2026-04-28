#!/usr/bin/env python3
"""Generate Nano Banana Pro visuals for the 2026-04-28 WealthMeter topic-2 refresh."""

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
ARTIFACT_DIR = ROOT / "output" / "review" / "longform-pair-2026-04-28" / "wealthmeter-nanobanana"
OUT_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

API_URL_TMPL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "nano-banana-pro-preview:generateContent?key={api_key}"
)

STYLE_BLOCK = (
    "Institutional editorial infographic only. Use a clean white or warm-white background. "
    "Use only crisp, highly legible sans typography. Minimalist systems aesthetic. "
    "No logos, no watermarks, no decorative clutter, no fake user-interface chrome, no photorealism. "
    "Landscape 16:9 format, publication quality, with labels large enough to read."
)

PROMPTS: list[dict[str, str]] = [
    {
        "name": "cost-of-capital-hurdle-stack-2026-apr28.png",
        "title": "Cost of Capital Hurdle Stack",
        "prompt": (
            "Create a 16:9 editorial stack diagram titled "
            "'The Real Capital Hurdle'. "
            "Use six horizontal layers labeled 'headline rate', 'credit spread or equity premium', "
            "'tax drag', 'fees and upkeep carry', 'liquidity lock-up', and 'refinancing or exit risk'. "
            "Add three narrow side markers labeled 'household housing', 'private funds', and "
            "'operating business capital' to show that the full stack applies in each case. "
            "Add a footer line reading 'A project that clears the sticker price can still fail the full hurdle.'"
        ),
    },
    {
        "name": "cost-of-capital-clearance-grid-2026-apr28.png",
        "title": "Cost of Capital Clearance Grid",
        "prompt": (
            "Create a 16:9 editorial decision matrix titled "
            "'Which Assets Actually Clear The Hurdle?'. "
            "Use a 2x2 grid with horizontal axis 'headline return' and vertical axis 'hidden capital friction'. "
            "Label the quadrants 'stable but low spread', 'genuine spread', 'cash with option value', and 'trap zone'. "
            "Inside trap zone place 'illusory yield', 'weak exit market', 'refi risk', and 'carry eats spread'. "
            "Inside genuine spread place 'durable cash generation', 'after-tax edge', and 'liquid enough'. "
            "Use a clean, highly legible editorial layout with restrained color."
        ),
    },
]


def payload(prompt_text: str) -> dict[str, Any]:
    return {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }


def call_model(api_key: str, prompt_text: str) -> dict[str, Any]:
    req = Request(
        API_URL_TMPL.format(api_key=api_key),
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
        raise SystemExit("Missing API key. Set GOOGLE_API_KEY or pass --api-key.")

    ok = 0
    for idx, item in enumerate(PROMPTS, start=1):
        prompt_text = f"Create an infographic. {item['title']}. {item['prompt']} {STYLE_BLOCK}"
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
