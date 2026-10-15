# Claim Smart — release verification

## Pre-release

- Isolated fresh clone from origin/main4141903; original shared checkout left untouched. Origin/main refreshed and still4141903 before release.
- Node tests:12 Claim Smart tests, including108 extreme parameter combinations; independent annuity formula and SSA factor fixtures; zero benefit, zero/negative returns, all-spent, partial retention, future-dollar normalization, common deflation, reversed/equal ages and invalid inputs. Output in test-results.txt.
- Gate tests use mock requests only: absent/expired/valid tokens; direct/reload lock; returning mode; newsletter-only new subscriber; no financial payload fields; preview makes no requests. Live empty-token validation403 confirmed existing server denies access.
- Existing newsletter consent tests4pass; Wealth calculator regression suite passes; Age & Automation540scenario cases pass.
- Content policy, report routing, navigation inventory, Longform order, Longform shell78destinations, Specials6destinations, monetization3offers, JS syntax and diff whitespace checks pass.
- Browser UI: preview gate initially blocks actual inputs; reload relocks; returning mode works; development preview unlocks. Tested negative returns/all spent; custom estimate mode; future->automatic toggle; reversed/equal ages;70y1m rejected with results hidden. Desktop, effective mobile354px and intermediate1023/1351px widths inspected; mobile grid overflow fixed; scrollable tables stay inside layout. Annual table supplies chart values. Shared shell theme/mobile menu retained.
- Screenshots saved outside public repository in task workspace; preview screenshots contain hypothetical data only. Full-page screenshot provider clips scaled pages; final evidence uses viewport screenshots.
- No production signup, impersonated subscriber or lead record created. Successful existing-member/server-claim behavior tested with mocked responses; production readback checks unauthenticated gate and the unchanged server validate contract. No real subscriber identity used for testing.

## Deployment

Pending final production commit and live readback. Publish reviewed isolated HEAD to existing origin main without force; observe Pages and Content Policy workflows, then verify live bytes, title/canonical, navigation/sitemap, direct gate/reload, and prior-page smoke checks. Rollback is a revert of the scoped release commit; do not reset shared worktrees.
