# Claim Smart — source and method audit

Reviewed 2026-10-15. Release starts from production `4141903dce47faabe8705130fcfae04fb14e59b1` in a separate clone. Shared Dropbox checkout and Home Trade-offs development work were not edited. Original attachment was read in full (901 lines); it is not published or committed.

## Material corrections

- Replaced fixed FRA67 annual lookup with cohort FRA and monthly reductions/credits. Automatic mode covers workers born1943+ only. Jan1 uses prior birth-year cohort; users select eligible entitlement months. The interface and methods explicitly identify a planning approximation, not an exact SSA payment calendar.
- Removed personal-looking benefit tables/defaults and historical-average, premium, COLA and longevity claims. Initial-release defaults were a labeled hypothetical $2,000 FRA benefit, zero COLA and zero return; the beginner revision below makes the5%investment example explicit. No SSN, earnings record or authentication fields are collected by the calculator.
- Rebuilt executable JavaScript rather than retaining the broken escaped remainder operator.
- Separated cumulative gross receipts, spent benefits, retained zero-interest cash and hypothetical investment balances. Cash/investment rows are alternatives. Spending100% leaves no balance. No “safe cash,” guaranteed investment outcomes, fixed investment recommendations or personalized claiming advice.
- One dollar-reference age and COLA clock for both options. Common-dollar estimates receive a shared index; future-dollar estimates are normalized at claim time before subsequent COLA. Real display deflates totals using that same index. Nominal returns are converted implicitly through deflation, not treated as real returns.
- First deposit occurs one model month after entitlement. Model retains precision and displays rounded dollars. Birthdays, actual payment days, calendar COLAs and deferred application of some DRCs before70 are explicitly excluded. COLA uses common reference-age anniversaries. Negative COLA is a stress scenario, not SSA's legal COLA behavior.
- Break-even is the first strict monthly lead after a deficit. At0%/0COLA,62vs67 equality is78y8m; first strict lead78y9m.67vs70 equality82y6m; strict lead82y7m.62vs70 strict lead80y5m. No crossover by100 is not labeled “never.” Reversed ages normalize chronologically; equal ages have no waiting break-even, and differing manual benefits remain distinguishable in totals.

## Official source register

- https://www.ssa.gov/oact/quickcalc/early_late.html — 5/9 of1% for first36 early months,5/12 thereafter; monthly DRCs; paid following entitlement month; some credits applied next January.
- https://www.ssa.gov/oact/progdata/nra.html and https://www.ssa.gov/benefits/retirement/planner/ageincrease.html — FRA cohort schedule and Jan1 convention.
- https://www.ssa.gov/benefits/retirement/planner/agereduction.html and https://www.ssa.gov/benefits/retirement/planner/1959.html — retirement reductions, first-of-month convention and eligibility qualifications.
- https://www.ssa.gov/benefits/retirement/planner/delayret.html — 8%annual /2/3 of1% monthly for1943+, cap70; credits may be applied the next January before70.
- https://www.ssa.gov/benefits/retirement/planner/AnypiaApplet.html — today's-dollar versus inflated-dollar estimates, future earnings assumptions.
- https://www.ssa.gov/policy/docs/statcomps/supplement/2024/apnc.html — benefit calculation and preclaim COLAs.
- https://www.ssa.gov/benefits/retirement/planner/whileworking.html and https://www.ssa.gov/benefits/retirement/planner/credits.html — work/eligibility considerations; excluded from numerical model.

Scope: individual worker retirement benefits; no spouse/survivor household optimization, earnings-test withholding, earnings-record recomputation, tax, Medicare, bridge-portfolio withdrawals or legislation forecast. No annual COLA or benefit maximum is represented as current fact.

## Gate and data behavior

Uses existing WealthMeter subscriber endpoint, signed-access cookie and newsletter resource. No new credential system or permission change. Public explanation and methods remain visible; calculator is statically hidden/inert and initializes only after existing gate unlock. Direct URL/reload remains closed without successful validation. Development-host preview creates no subscription and transmits no form details.

The established gate is client-side newsletter access, not a secure content boundary or proof of email ownership. Public static assets can be downloaded. Strong access control would require a separately authorized backend change. This limitation was reported before publication and is stated in methods.

Returning-member toggle previously dereferenced a removed optional consent element. Narrow null guard fixes it. No promotional opt-in is added: `newsletter=yes`, `commercialUpdates=no`, empty commercial consent version. Only names/email, page/source and consent metadata enter signup; no benefit, age, return or other calculator input enters a network payload, browser storage or analytics event. New subscriber and valid-token success flows are mock-only tests, never real leads. A production validate-only empty-token probe returned403 `not_verified` without creating a subscriber.

## Beginner-first revision (2026-10-15)

User feedback prompted a presentation revision with the validated monthly model left unchanged. Both starting ages are selectable62–70 on the main path, with months in collapsed advanced settings. Main fields explain full-benefit monthly estimates before deductions, birth cohort, invested share and illustrative returns. Defaults are explicitly hypothetical: $2,000 benefit, cohort1960+, starts62/70,100% invested,5%constant annual return,0%inflation, compare85. Rates0/3/5/7 and ages75/85/95 are visible comparisons. Principal, growth/loss and final balance are separated; both options use identical investment assumptions. Monthly benefits and total/spent cash appear in an expandable detail table. Investment catch-up labels are bounded to the chosen comparison age. Advanced settings preserve custom/negative returns, month precision, inflation, reference dollars and separate SSA estimates. New view-model tests verify every sensitivity row against an independent closed-form annuity and check the visible explanatory contracts.
