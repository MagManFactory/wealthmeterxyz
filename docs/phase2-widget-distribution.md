# Phase 2 Wealth Rank distribution

Status: internal review. The branch contains no live distribution token, sponsor outreach, or paid placement.

`embed/wealth-rank.html` is a bounded version of the homepage UBS 2026 covered-market ranker. It uses the same adult denominator, threshold anchors, logarithmic interpolation, dated exchange rates, and below-$10,000 range treatment as the production calculator. Its canonical destination is the full WealthMeter calculator.

The loader requires a signed token. The token binds the widget to a D1 distribution record, partner, campaign, expiry, and approved publisher origin. Production embeds fail closed if the token is absent, expired, altered, revoked, mismatched to the widget, or used on an unapproved origin. Local review is permitted only on `localhost` or `127.0.0.1` with `?preview=phase2`.

Event definitions:

- `widget_loaded`: authorization completed and the widget initialized.
- `widget_impression`: at least 50% of the widget remained visible for one continuous second.
- `widget_interaction`: the first completed calculator submission in the frame.

Events include only widget, distribution partner, campaign, approved host origin, and time. They exclude input values, currency amount, rank, percentile, email, and persistent user identifiers.

The shared D1 schema and sponsorship control plane live in the LifeMeter Phase 2 branch. Both Pages projects must bind the same database as `METER_CONTROL` and use the same `WIDGET_SIGNING_SECRET`. Issue records and tokens with `scripts/issue_widget_distribution.mjs`; revoke them by changing the D1 distribution status to `revoked`.

The current capability sheet reports 20 sessions and 54 page views from the WealthMeter GA4 extract for 9–16 September 2026. It makes no unique-user, CPM, impression-floor, conversion, or delivery claim. The repository also carries the shared Health × Wealth package so both site review branches present the same portfolio offer. Michelle Martin remains the correspondence interface; the LifeMeter control-plane branch owns the state machine and owner gates.
