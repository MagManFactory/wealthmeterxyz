# U.S. Wealth Atlas 2026

## Production scope

The published special uses two Federal Reserve products:

- Distributional Financial Accounts through 2026 Q2 for distribution, asset, debt, and age-group aggregates.
- The 2025 Survey of Consumer Finances report for median family net worth by age, stated in 2025 dollars.

The page does not reproduce the submitted prototype's percentile interpolation, inheritance projection, or causal claims. Those methods were not supported by the cited public tables.

## Transformations

- Annual history selects the Q2 observation from each year from 1990 through 2026.
- The top 1 percent combines `TopPt1` and `RemainingTop1` from the DFA wealth-group tables.
- Asset and liability views add those same two top-group shares.
- Values are rounded to one decimal place for display. A tolerance of 0.2 percentage points permits published rounding.
- Aggregate age-group shares and levels use the 2026 Q2 DFA age tables.
- Median age-band net worth uses Table 2 of the 2025 SCF report.

Run `python3 scripts/validate_us_wealth_atlas.py` after editing the data file.

## Primary sources

- https://www.federalreserve.gov/releases/z1/dataviz/dfa/
- https://www.federalreserve.gov/publications/files/scf26.pdf
