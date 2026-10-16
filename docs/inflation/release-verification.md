# What Inflation Costs You — release verification

Approved inflation-only integration, October 16, 2026. Existing project: `/Volumes/Dropbox_Local/Dropbox/CODEX/CODING ARCHIVE/wealthmeter`; isolated worktree: `.worktrees/inflation-20261016`, branch `codex/inflation-20261016`, base `5c710f7` (current production main when prepared). Main checkout has extensive unrelated edits; none are staged or published here. Other registered workers inspected; no other active inflation worker found. Existing Age & Automation worktree and its untracked receipt were left intact.

Source Library version 4 was retrieved through the supported materialization helper. SHA256 `8124681e3809d979097a87f0c217e2006db9888746e5c75c7c4e46ef449ab8c1` verified. Embedded source JSON and complete calculation/UI JavaScript are unchanged; script extracted into `/assets/inflation.js`. Scoped CSS and existing Phoenix header/footer/mobile menu integrate the tool. No gate was added. Claim Smart's access and all other feature access remain unchanged.

New reader URL: `https://wealthmeter.xyz/what-inflation-costs-you.html`. Title/H1 is What Inflation Costs You, with no year in the headline. Selected annual-average period is shown beside results. Original BLS attribution, 54 values, 648-observation ingestion validation metadata, housing OER caveat, base-year formulas, fixed-share limitations and incomplete 2025 annual-average explanation are retained. No API or personal financial data is required.

## Checks completed before release

- `node tests/inflation.test.cjs`: 78 independent calculation scenarios across six years, all presets, each single-category extreme and safe all-zero state. Default +23.1629058988%, headline +22.6991633321%, equal shares +18.1331486428%, eight 12.5% weights.
- `node scripts/wealth_calculators.test.cjs`: passed.
- `node tests/age-automation.test.cjs`: 540 scenarios passed.
- `node tests/claim-smart.test.cjs`: 6 suites of fixtures/regressions and 108 extremes passed.
- Repository content policy, longform order, navigation inventory, Phoenix longform corpus (78), Phoenix Specials (8), search coverage (148 canonical URLs), story search metadata (8 unchanged pages), and whitespace checks passed.
- Brave browser: observed actual CSS widths 1440, 1309, 390 and 354. No horizontal page overflow. Desktop header at 1440 and existing mobile dialog at narrower widths. Menu opens, includes the inflation link, and closes on Escape. Shared light/dark theme inspected; scoped SVG dark colors added for contrast.
- Browser keyboard Enter selects Housing and updates both pressed rows, detail heading and chart legend together. ArrowLeft changes selected year to 2023 and updates visible selected period. Filtering to Housing shows one allocation without changing basket weights; reset restores the default basket/year/filter/category.
- Browser equal shares displays eight 12.5% weights and +18.1%. All eight zero amounts display em dash basket/equivalent and a warning; SVG contains no NaN or Infinity.
- Browser JSON download completed to `price-memory-data-and-scenario (3).json`; independently read and reconciled with all 54 approved values, 2019 base, 2024 selected year and exact default basket. Browser download-event wait timed out after the successful download; filesystem readback confirmed completion.

## Deployment and rollback

Use the existing production mechanism: reviewed, scoped commit fast-forwarded to origin main, which triggers the existing GitHub Pages deployment. Preserve the dirty main checkout by publishing this isolated HEAD to main, as documented in the prior Age & Automation release. Run the validations from `publish_wealthmeter.sh` unchanged; its main-checkout guard is not edited. No competing workflow, SEO generator repair, security change, sharing change or credentials change is included.

After publication, record the exact commit, Pages deployment receipt, live HTTP/asset checksums, navigation/sitemap readbacks and live content/order checks in `deployment-receipt.json`. Rollback is a normal revert of the single inflation feature commit on current main, followed by the existing checks and ordinary push. Do not reset or force-push newer work. Pre-feature rollback reference: `5c710f7`.

Limitations: browser checks are Chromium/Brave, not a complete assistive-technology audit or physical touchscreen/Safari test. BLS data remain the approved historical 2019–2024 annual-average dataset, not a live inflation feed.
