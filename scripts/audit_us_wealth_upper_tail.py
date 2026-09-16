#!/usr/bin/env python3
"""Rebuild and verify the U.S. household calculator's SCF upper-tail ratios."""

from __future__ import annotations

import math
import os
import re
import tempfile
import urllib.request
import zipfile
from pathlib import Path

import pandas as pd


SCF_ZIP_URL = "https://www.federalreserve.gov/econres/files/scfp2022s.zip"
CPI_U_2022 = 292.655
CPI_U_2024 = 313.689
THRESHOLDS = [
    500_000,
    1_000_000,
    2_500_000,
    5_000_000,
    10_000_000,
    25_000_000,
    50_000_000,
    100_000_000,
    250_000_000,
    500_000_000,
    1_000_000_000,
]


def get_scf_extract(cache_dir: Path) -> Path:
    cache_dir.mkdir(parents=True, exist_ok=True)
    extract_path = cache_dir / "rscfp2022.dta"
    if extract_path.exists():
        return extract_path

    with tempfile.NamedTemporaryFile(suffix=".zip") as download:
        urllib.request.urlretrieve(SCF_ZIP_URL, download.name)
        with zipfile.ZipFile(download.name) as archive:
            archive.extract("rscfp2022.dta", cache_dir)
    return extract_path


def weighted_survival(frame: pd.DataFrame, threshold: float) -> float:
    return float(frame.loc[frame["networth_2024"] >= threshold, "wgt"].sum() / frame["wgt"].sum())


def embedded_ratios(page_path: Path) -> list[float]:
    page = page_path.read_text(encoding="utf-8")
    block = page.split("const SCF_UPPER_TAIL = [", 1)[1].split("];", 1)[0]
    return [float(value) for value in re.findall(r"lower:([0-9.]+)", block)]


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    configured_extract = os.environ.get("SCF_DTA_PATH")
    extract = Path(configured_extract) if configured_extract else get_scf_extract(Path("/tmp/scf2022-summary"))
    frame = pd.read_stata(extract, columns=["yy1", "y1", "wgt", "networth"])

    assert len(frame) == 22_975
    assert frame["yy1"].nunique() == 4_595
    assert frame.groupby("yy1").size().eq(5).all()
    assert frame[["wgt", "networth"]].notna().all().all()
    assert frame["wgt"].gt(0).all()

    frame["networth_2024"] = frame["networth"] * (CPI_U_2024 / CPI_U_2022)
    survival = {threshold: weighted_survival(frame, threshold) for threshold in THRESHOLDS}
    base = survival[500_000]
    ratios = [survival[threshold] / base for threshold in THRESHOLDS]
    supports = [frame.loc[frame["networth_2024"] >= threshold, "yy1"].nunique() for threshold in THRESHOLDS]

    embedded = embedded_ratios(repo_root / "us-household-wealth.html")
    assert len(embedded) == len(ratios)
    for calculated, published in zip(ratios, embedded):
        assert math.isclose(calculated, published, abs_tol=5e-9), (calculated, published)

    print("Federal Reserve 2022 SCF upper-tail audit")
    print(f"Rows: {len(frame):,}; sampled families: {frame['yy1'].nunique():,}; implicates per family: 5")
    print(f"Weighted family total: {frame['wgt'].sum():,.0f}")
    print(f"CPI-U factor, 2022 to 2024: {CPI_U_2024 / CPI_U_2022:.9f}")
    print(f"Weighted share at or above $500,000: {base:.8f}")
    print("\nThreshold       Conditional ratio    Supporting families")
    for threshold, ratio, support in zip(THRESHOLDS, ratios, supports):
        print(f"${threshold:>12,.0f}    {ratio:>17.8f}    {support:>19,}")
    print("\nPASS: Embedded calculator ratios match the rebuilt weighted SCF curve.")
    print("Caveat: Point estimates only; replicate-weight confidence intervals are not calculated.")


if __name__ == "__main__":
    main()
