# Monetization Phase 0–1 operations

## Live scope

- GA4 records calculator starts, calculator completions, result views, owned-report module views, report-detail visits, Payhip checkout-link clicks, newsletter signups, and share actions.
- Event payloads contain page and content identifiers only. Calculator inputs, result values, names, and email addresses are excluded.
- Result pages may show only active entries in `data/monetization-offers.json`.
- The active WealthMeter inventory consists only of WealthMeter-owned reports.
- Placeholder advertising was removed. Programmatic advertising is not part of this release.

## Release control

`python3 scripts/validate_monetization.py` is required in continuous integration. It rejects incomplete active offers, missing owned-product targets, external offers without a disclosure, unknown placement references, placeholder ad slots, and sensitive analytics keys.

An external affiliate or sponsor can be activated only after the registry record contains an approved destination, the relationship type, adjacent disclosure text, and the placement has passed editorial and legal review. No external offer is active in this release.

## Newsletter handoff

Newsletter signups continue through the LifeMeter AgentMail endpoint to Michelle Martin's WealthMeter inbox, with the site source retained. The consent scope now covers site news, report releases, and relevant commercial recommendations. `data/email-sequences.json` is a reviewed content schedule, not an active autoresponder. It remains `prepared_not_sending` until a sending system supplies unsubscribe and suppression handling plus delivery monitoring.

## Operating review

Review the following weekly in GA4: calculator completion rate, result-to-report click rate, report-to-checkout click rate, newsletter signup rate, and share rate. Do not optimize against raw click volume alone. A placement should remain live only if it preserves calculator completion and produces measurable downstream intent.
