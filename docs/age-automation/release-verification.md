# Age & Automation — release verification

Release date: 2026-10-15. Production target: https://wealthmeter.xyz/age-automation.html . Original production/base commit: f82786ee7f5a4712e0231e4a87843adf20ff9ebb.

## Changes

New Phoenix-shell special feature with locally bundled CSS/JS, UN-derived 20-country annual data, matching social card, accessible equivalent annual table, and explicit hypothetical model. Linked through existing special-features hub and its governed navigation inventory; sitemap entry added. Existing pages retain their source bytes except this hub, inventory and sitemap. Home Trade-offs dev prototype and Time Rich excluded.

## Completed checks before publication

- `node tests/age-automation.test.cjs`: 540 all-country/base/extreme scenarios. Exact required-productivity endpoint, constant-population zero-change case, pure-demographic case, fixed Korean reference and population immutability. 620 unique, finite source rows and estimate/projection boundaries verified.
- `bash scripts/check_content_policy.sh`: content and external-checkout routing pass.
- `python3 scripts/check_longform_order.py`: pass.
- `python3 scripts/check_longform_phoenix.py`: 78 destinations pass.
- `python3 scripts/check_specials_phoenix.py`: 6 destinations pass.
- `python3 scripts/validate_monetization.py`: 3 governed offers pass.
- `python3 scripts/sync_phoenix_navigation.py --check`: inventory current.
- `git diff --check`: pass. No production Tailwind runtime or latest-version external package.
- Official WPP workbook license and row definitions inspected; no restricted full technology tables published. See source-audit.md and extraction script.
- Mac in-app browser: desktop1440×1100, mobile390×844, mobile320×800. No horizontal page overflow at320/390. Charts resize their viewboxes and reduce year ticks at narrow widths. Visible buttons/selects at least44px; scrollable tables labelled and focusable. Light and dark theme visually checked. Reduced-motion override present; no animated chart effects.
- Keyboard Home/End extremes tested on all3 sliders; demographic ratio remains31.2→75.6 for Korea while scenario changes. Reset, all3 comparison presets, swap, primary dropdown, comparison dropdown, chart-metric switch,20-economy disclosure, annual-values disclosure, Nigeria table-row selection, keyboard Enter method disclosure and theme switch tested.25 annual chart-table rows verified. No console errors/warnings observed.
- Screenshot evidence in this folder: desktop1440, mobile390 full page and mobile320 dark viewport. Browser-based testing did not include native Safari, assistive-technology user testing, or a separate physical touchscreen.

## Generator issue contained

The existing `build_seo_artifacts.py --write` rewrote unrelated pages and broke required Phoenix shell markers on10 longform pages. All unrelated generator changes were restored from the clean base in this isolated worktree; no dirty original checkout was altered. The new feature's metadata is explicit, its sitemap URL is added directly, and the governed navigation generator alone is used. All required shell checks pass after restoration. No generator repair outside task scope included.

## Deployment and rollback

Deploy only after a fresh origin/main comparison confirms base f82786ee, all above checks pass and the scoped diff is committed. Push isolated reviewed HEAD to origin main without force. This follows existing repository production-main workflow while retaining the user-requested isolated branch. Then verify200 responses, SHA256 content readback, navigation/sitemap discovery, published model output, prior-page smoke checks and content-policy live script. Record exact deployed commit and live results in final deployment receipt.

Rollback with a new reverting commit on current main: `git revert <release_commit>`, repeat required checks, then ordinary push to main. Do not reset shared history or overwrite newer work. Base source remains f82786ee7f5a4712e0231e4a87843adf20ff9ebb. The new feature has no backend, credentials, migrations, spend or persistent permission changes.

## Final intermediate-width repair

A final1253px viewport check exposed crowding in the inherited desktop header. The new page now has an age-page class and uses the existing menu below1350px, scoped through its own CSS. Menu open/Escape verified at1253px; no horizontal page overflow at320,1253 or1440px after repair. Shared styles and all prior pages remain unchanged. CSS query version incremented for cache safety. Model/data unchanged.
