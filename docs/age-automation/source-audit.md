# Age & Automation — source and model audit

Date: 2026-10-15. Base production commit: f82786ee7f5a4712e0231e4a87843adf20ff9ebb.
Ownership: isolated codex/age-automation-20261015, .worktrees/age-automation-20261015. Home Trade-offs is dev only; its checkout and prototype excluded. Time Rich is LifeMeter only. Dirty original Dropbox checkout preserved.

## Source receipt

- Provider: UN DESA Population Division. World Population Prospects 2024, Online Edition.
- Catalog: https://population.un.org/wpp/assets/downloads.json (retrieved 2026-10-15). Current official catalog identifies 2024; no verified WPP2026 release was found. No edition splicing.
- File: POP/DB/WPP/Rev.2024/POP/F07-1, both sexes, dependency ratios; source URL in data/age-automation.json and extract_age_data.py.
- SHA256: 19e785ebc6bfbd9266fb32f5cca5af598cb102a63f5afe079a7fa4a36ca2b17c.
- Workbook row13 explicitly licenses CC BY3.0IGO; row14 supplies citation. Public derived subset credited, adaptation disclosed; no endorsement implied.
- Grain: 20 ISO3 economies × 31 annual years2020–2050 = 620 unique rows. Estimates2020–2023; Medium variant2024–2050. Display2026–2050 entirely projected. No missing retained fields or sentinel zeros.
- Workbook columns (zero based): ISO3=5, year=10, total dependency0–14&65+/15–64=11, child dependency=16, old dependency65+/15–64=21. Assert total≈child+old within0.003 because publisher rounds to0.001.
- Working-age share (%)=10000/(100+total dependency). No invented population totals; source-rounded derived share approximate.
- openpyxl read-only dimensions must be reset; workbook cached dimension truncates after column12. Extraction explicitly resets dimensions before reading21.
- Reproduce: download workbook URL in extraction script, run `python3 extract_age_data.py WORKBOOK.xlsx output.json` (openpyxl required), compare sha256 and canonical JSON with data/age-automation.json.

## Attachment assessment

Read all1729 lines of wealthmeter_flagship_aging_societies_automation_choices.html (Library attachment libfile_4e8d8ddd38a48191b52f93e215baee73,107221 bytes). Claims verified20-country data but supplies no row-level provenance/releases/years. Demographic values materially differ from official workbook (KOR2050 OADR75.610, SGP41.716; exact source JSON governs).

Removed every unsupported numeric series: historical productivity CAGR, LFPR, older LFPR, GDP/capPPP, AI exposure, robot density, invented ITU composite. No need to synthesize unknowns. Some IFR figures correspond to public2023 release, but full-country coverage/year/redistribution not established; no numeric technology table published. This is a deliberate narrower evidence scope, not a claim those observations are zero.

Original retirement effect arbitrarily assigns6.2% of65+ per extra retirement year; no age-specific population or employment basis. Removed slider and economic OADR. Original additive annual growth and endpoint forecasts omitted cross-products; replaced with exact identity. Original equally spaced2026/2030/2035/etc positions replaced with annual values on proportional time axis. Removed arbitrary technology-score coefficients and typology thresholds. No causal exposure→growth calculation, no capacity-as-forecast claim.

ILO source read: https://www.ilo.org/publications/workers%E2%80%99-exposure-ai-what-indicators-tell-us-%E2%80%93-and-what-they-don%E2%80%99t . Exposure is potential task interaction, not realized adoption, job loss or productivity.
IFR public definition read: https://ifr.org/ifr-press-releases/news/global-robot-density-in-factories-doubled-in-seven-years . Denominator manufacturingemployees, not wholeeconomy. Restricted full tables not fetched/republished.
ITU numerical series omitted; no incompatible historical splice or broadband-as-compute inference.
WDI numerical productivity history omitted; GDP per employed person is labour productivity, not TFP. No unverified historical CAGR window published.

## Exact model

Y/N=(Y/E)*(E/P15–64)*(P15–64/N). E is total employed, includes employment above65; E/P15–64 is an intensity ratio rather than an employment rate constrained0–100. Baseline level need not be invented because only relative changes enter the index. No participation/employment equivalence or retirement doublecount.
Let W=share2050/share2026, F=1+employmentChange/100, T=24. Required p=(1+goal/100)/(W*F)^(1/T)-1. Output index(t)=100*(1+pInput/100)^t*F^(t/24)*share(t)/share2026. Goal=100*(1+goal/100)^t. Productivity is total assumed annual output/employed growth, not an AI increment or adoption forecast. Hours embedded; not separately changed. No savings, taxes, distribution, capital dynamics or welfare inference.
No rounding until display; percent settings converted once; employment change cumulative relative%, not pp. Population series immutable under all slider changes. Default1%/1%/0% are illustrative choices. ±20% employment range is sensitivity only, feasibility unverified.

## Validation

tests/age-automation.test.cjs: 540 cross-country corner/base combinations; exact hurdle reaches goal2050 independently; all zero constant-share synthetic identity; zero-productivity direct demographic ratio; fixed KOR reference; source/status/coverage checks and immutability. UI, production checks and deployment results in release-verification.md.
