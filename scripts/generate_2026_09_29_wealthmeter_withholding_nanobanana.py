#!/usr/bin/env python3
"""Resumable Nano Banana visuals for the September 29 withholding longform."""
import base64, json, os
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "longform"
PROMPTS = {
 "withholding-change-events-2026-sep29.png": "Create a 16:9 institutional editorial decision map titled When to Check Tax Withholding. Show connected trigger cards: new job, income change, marriage or divorce, child, home purchase, January review. Clean white background, navy and teal, legible sans typography, no logos, no watermark, no photorealism.",
 "withholding-review-workflow-2026-sep29.png": "Create a 16:9 institutional editorial workflow titled A Withholding Review. Show five steps: current paystubs and tax records, IRS estimator, Form W-4 or W-4P, submit to employer or payer, recheck after a material change. Clean white background, navy and teal, legible sans typography, no logos, no watermark, no photorealism.",
}
def image(data):
 for c in data.get("candidates",[]):
  for p in c.get("content",{}).get("parts",[]):
   d=(p.get("inlineData") or p.get("inline_data") or {}).get("data")
   if d: return base64.b64decode(d)
def main():
 key=os.getenv("GOOGLE_API_KEY")
 if not key: raise SystemExit("Missing GOOGLE_API_KEY")
 OUT.mkdir(parents=True,exist_ok=True)
 for name,prompt in PROMPTS.items():
  target=OUT/name
  if target.exists() and target.stat().st_size>20000: print("Retaining",name); continue
  req=Request(f"https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key={key}",data=json.dumps({"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"responseModalities":["TEXT","IMAGE"]}}).encode(),headers={"Content-Type":"application/json"},method="POST")
  payload=image(json.loads(urlopen(req,timeout=240).read().decode()))
  if not payload or len(payload)<20000: raise SystemExit("No usable image for "+name)
  target.write_bytes(payload); print(name)
if __name__ == "__main__": main()
