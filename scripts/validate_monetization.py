#!/usr/bin/env python3
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
errors = []
registry = json.loads((ROOT / "data" / "monetization-offers.json").read_text())
offers = {item["id"]: item for item in registry.get("offers", [])}

for offer in offers.values():
    if offer.get("status") != "active":
        continue
    for key in ("relationship", "title", "description", "cta", "url"):
        if not offer.get(key): errors.append(f"active offer {offer.get('id')} lacks {key}")
    url = offer.get("url", "")
    if offer.get("relationship") == "owned" and not (ROOT / url).is_file():
        errors.append(f"owned offer target does not exist: {url}")
    if offer.get("relationship") != "owned" and not offer.get("disclosure"):
        errors.append(f"external offer {offer.get('id')} lacks adjacent disclosure")

for placement in registry.get("placements", []):
    if placement.get("offerId") not in offers: errors.append(f"placement references unknown offer: {placement.get('offerId')}")
    if not placement.get("paths") or not placement.get("resultSelector"): errors.append(f"incomplete placement for {placement.get('offerId')}")

for required in ("commercial-policy.html", "assets/monetization.js", "data/email-sequences.json"):
    if not (ROOT / required).is_file(): errors.append(f"missing {required}")

script = (ROOT / "assets" / "monetization.js").read_text()
for sensitive_key in ('"net_worth":', '"income":', '"age":', '"result_value":'):
    if sensitive_key in script.lower(): errors.append(f"analytics appears to include sensitive value: {sensitive_key}")

if "commercial-policy.html" not in (ROOT / "components.js").read_text(): errors.append("shared footer does not link to commercial policy")
for html in ROOT.glob("*.html"):
    if "1234567890" in html.read_text(errors="ignore"): errors.append(f"placeholder ad slot remains in {html.name}")

if errors:
    print("Monetization validation failed:")
    for error in errors: print(f"- {error}")
    sys.exit(1)
print(f"Monetization validation passed: {len(offers)} active governed offers checked.")
