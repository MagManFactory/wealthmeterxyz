#!/usr/bin/env python3
"""Generate Nano Banana Pro visuals for the Safe Job Illusion longform article.

Usage:
  GOOGLE_API_KEY=... python3 scripts/generate_safe_job_illusion_visuals_nanobanana.py
  python3 scripts/generate_safe_job_illusion_visuals_nanobanana.py --api-key "..."
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
ARTIFACT_DIR = ROOT / "output" / "review" / "safe-job-illusion-2026-03-27" / "nanobanana"
OUT_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

API_URL_TMPL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "nano-banana-pro-preview:generateContent?key={api_key}"
)

STYLE_BLOCK = (
    "Institutional financial-research visual style. White or warm-white background. "
    "Sans-serif typography only. High contrast labels. No logos. No watermark. "
    "No decorative clutter. Output as 16:9 landscape 2400x1350 PNG."
)

PROMPTS: list[dict[str, str]] = [
    {
        "name": "ai-labor-deflation-transmission-map.png",
        "title": "White-Collar Labor Deflation Transmission Map",
        "prompt": (
            "A professional institutional systems flow diagram rendered as a clean 4K infographic at 16:9 landscape aspect ratio. "
            "Left-to-right causal chain with seven nodes and weighted directional arrows: "
            "(1) AI Adoption Velocity, (2) Task Automation Share by Workflow, (3) Hiring Demand by Role Level, "
            "(4) Compensation Growth Rate, (5) Promotion Velocity and Role Breadth, (6) Household Income Stability, "
            "(7) Balance Sheet and Liquidity Stress. "
            "Color-code nodes by category: technology nodes deep cobalt blue, labor-market nodes slate gray, household-impact nodes muted brick red. "
            "Each arrow includes short transmission labels such as reduces junior headcount, widens comp dispersion, narrows promotion ramp, extends search duration. "
            "Add branching sub-arrow from Hiring Demand to secondary amber node labeled Graduate Access Compression. "
            "Footer text: Sources: NBER w32966, Stanford DEL, Anthropic Economic Index | March 2026."
        ),
    },
    {
        "name": "entry-level-compression-role-fragmentation.png",
        "title": "Entry-Level Compression vs Senior Role Stability",
        "prompt": (
            "A two-panel institutional research chart rendered as 4K infographic, 16:9. "
            "Left panel line chart titled Relative Hiring Trend by Career Stage: 2022-2026, x-axis Q1 2022 to Q1 2026, "
            "three indexed lines starting at 100: entry-level coral red declines to about 72, mid-career steel blue near 95, senior dark navy near 108. "
            "Y-axis label Relative Hiring Index (Q1 2022 = 100). "
            "Right panel horizontal stacked bars titled Task Composition Shift in AI-Exposed Professional Roles with rows Junior Analyst, Associate, Manager, Director. "
            "Segments: Automatable Tasks coral red, Supervised AI Output amber, Judgment and Coordination dark blue. "
            "Include percentage labels, sparse grid, legend top-right. "
            "Footer: Illustrative estimates based on Anthropic Economic Index and NBER w32966 | March 2026."
        ),
    },
    {
        "name": "income-volatility-stress-by-cohort.png",
        "title": "Household Income Volatility Stress Matrix by Cohort",
        "prompt": (
            "A structured risk-matrix infographic, 4K, 16:9 landscape. "
            "Main heat-map matrix with columns Recent Graduates, Recently Unemployed Professionals, Career Changers. "
            "Rows: Expected Job Search Duration, Income Variance Risk, Debt-Service Sensitivity, Emergency Runway Requirement, Retraining Cost Burden. "
            "Cell colors: soft green low stress, amber moderate stress, muted red high stress. "
            "Each cell includes concise labels such as 3-6 months, high variance, 6-12 months. "
            "Right-side panel titled Recommended Liquidity Runway with vertical bars and labeled ranges. "
            "Bottom timelines for day-30, day-60, day-90 checkpoints with milestones: Burn rate set, Adjacent search opened, Skill audit complete. "
            "Footer: Author framework based on NBER w32966, Anthropic Economic Index, Stanford DEL | March 2026."
        ),
    },
    {
        "name": "career-transition-option-value-framework.png",
        "title": "Career Transition Option Value Framework",
        "prompt": (
            "A two-component strategic decision framework graphic, 4K, 16:9. "
            "Left two-thirds is a 2x2 matrix with axes Switching Cost low-to-high and Market Demand Clarity low-to-high. "
            "Quadrants: Adjacent Pivot Execute Now, Staged Transition Build Evidence First, Stay and Optimize Upgrade in Place, Defer Await Demand Signal. "
            "Place orange marker dot at axis center labeled Current Assessment Point. "
            "Right one-third is vertical four-stage pathway: Capability Audit, Market Test, Paid Validation, Full Transition. "
            "Between stages include Continue criteria in green and Kill criteria in red with explicit threshold label: "
            "Kill if less than 10 percent screen rate at 30 days. "
            "Footer: Author decision framework | March 2026."
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
    with urlopen(req, timeout=300) as resp:
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
                        print(
                            f"[{idx:02d}/{len(PROMPTS)}] OK {item['name']} "
                            f"({out_png.stat().st_size} bytes)"
                        )
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
                last_err = f"HTTPError {e.code}: {detail[:500]}"
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
    print(f"Artifacts stored in {ARTIFACT_DIR}")
    return 0 if ok == len(PROMPTS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
