# Phase 2 isolated deployment and synthetic test evidence

**Date:** 2026-09-16  
**Candidate:** `codex/phase2-distribution-20260916`  
**Production status:** Not deployed; explicit owner approval required

## Isolated infrastructure

- Isolated Cloudflare Pages projects for both the widget host and cross-origin publisher
- Isolated shared Cloudflare D1 database with migrations 0001 and 0002
- Synthetic widget distributions: revoked after testing

No production Pages project, production D1 database, production webhook, sponsor, invoice, or email was changed or contacted.

## Results

The exact candidate rendered and calculated in a real browser. Its signed attribution enforced widget identity, validity dates, D1 status, and exact publisher origin. Browser execution produced load, 50%-visible-for-one-second impression, and first-interaction events. Tampered tokens, wrong origins, and revoked distributions failed closed. The event table contains only distribution, site, widget, event type, approved host origin, and occurrence time; it has no calculator-input or result columns.

The shared LifeMeter sponsorship control plane separately passed the complete synthetic lifecycle, signature, idempotency, owner-gate, payment, and no-send tests documented in the LifeMeter copy of this report.

## Defect found and repaired

JSON event posts from a sandboxed cross-origin iframe triggered a browser preflight and failed. The widget now sends a simple request body with `keepalive`, and the server continues to parse the JSON payload. The validator rejects reintroduction of the preflight-triggering header, and the widget asset URL was versioned again to prevent stale browser delivery.

## Production gate

The tested WealthMeter branch head is `31ae4c5`. Production still requires an explicit owner decision covering the shared production `METER_CONTROL` binding, production signing secret, migration and release procedure. The synthetic test distributions remain revoked.
