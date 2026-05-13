#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import re
import struct
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent.parent
DOMAIN = "https://wealthmeter.xyz"
DISPLAY_NAME = "WEALTHMETER.XYZ"
FEED_URL = f"{DOMAIN}/feed.xml"
RSS_LIMIT = 50
COMPONENT_VERSION = "2026-05-13.1"
PRIVATE_OR_STAGING = {"adsense_block.html"}
DESCRIPTION_FALLBACKS = {
    "data-lab.html": "Explore WealthMeter's analytical lab for distribution views, exploratory finance tools, and supporting wealth datasets.",
    "data-sources.html": "Review the primary datasets, sources, and reference inputs used across WealthMeter calculators and analysis pages.",
    "disclaimer.html": "Read the WealthMeter disclaimer covering educational use, methodology limits, and non-advisory scope.",
    "methodology.html": "Learn how WealthMeter constructs wealth ranks, comparison baselines, and supporting financial analysis methods.",
    "portfolio_alpha.html": "Model portfolio scenarios, allocation assumptions, and return sensitivity with the WealthMeter Portfolio Alpha Simulator.",
    "privacy.html": "Read the WealthMeter privacy policy covering analytics, cookies, and site-level data handling.",
    "reports.html": "Browse WealthMeter's advanced strategic reports on wealth structure, planning risk, and household resilience.",
    "runway_lab.html": "Estimate spending durability, yield assumptions, and financial runway under different WealthMeter planning scenarios.",
}

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
META_DESCRIPTION_RE = re.compile(
    r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
    re.IGNORECASE | re.DOTALL,
)
ROBOTS_RE = re.compile(
    r'(<meta[^>]+name=["\']robots["\'][^>]+content=["\'])(.*?)(["\'][^>]*>)',
    re.IGNORECASE | re.DOTALL,
)
CANONICAL_RE = re.compile(
    r'(<link[^>]+rel=["\']canonical["\'][^>]+href=["\'])(.*?)(["\'][^>]*>)',
    re.IGNORECASE | re.DOTALL,
)
OG_IMAGE_RE = re.compile(
    r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](.*?)["\']',
    re.IGNORECASE | re.DOTALL,
)
OG_ALT_RE = re.compile(
    r'<meta[^>]+property=["\']og:image:alt["\'][^>]+content=["\'](.*?)["\']',
    re.IGNORECASE | re.DOTALL,
)
OG_WIDTH_RE = re.compile(r'<meta[^>]+property=["\']og:image:width["\']', re.IGNORECASE)
OG_HEIGHT_RE = re.compile(r'<meta[^>]+property=["\']og:image:height["\']', re.IGNORECASE)
OG_TITLE_RE = re.compile(r'<meta[^>]+property=["\']og:title["\']', re.IGNORECASE)
OG_DESCRIPTION_RE = re.compile(r'<meta[^>]+property=["\']og:description["\']', re.IGNORECASE)
OG_TYPE_RE = re.compile(r'<meta[^>]+property=["\']og:type["\']', re.IGNORECASE)
OG_URL_RE = re.compile(r'<meta[^>]+property=["\']og:url["\']', re.IGNORECASE)
TWITTER_CARD_RE = re.compile(r'<meta[^>]+name=["\']twitter:card["\']', re.IGNORECASE)
TWITTER_TITLE_RE = re.compile(r'<meta[^>]+name=["\']twitter:title["\']', re.IGNORECASE)
TWITTER_DESCRIPTION_RE = re.compile(r'<meta[^>]+name=["\']twitter:description["\']', re.IGNORECASE)
TWITTER_IMAGE_RE = re.compile(r'<meta[^>]+name=["\']twitter:image["\']', re.IGNORECASE)
JSON_LD_RE = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>\s*(.*?)\s*</script>',
    re.IGNORECASE | re.DOTALL,
)
HEADER_RE = re.compile(r'<div id="header-placeholder">.*?</div>', re.DOTALL)
FOOTER_RE = re.compile(r'<div id="footer-placeholder">.*?</div>', re.DOTALL)
IMG_TAG_RE = re.compile(r"<img\b[^>]*>", re.IGNORECASE | re.DOTALL)
SRC_RE = re.compile(r'\bsrc=["\']([^"\']+)["\']', re.IGNORECASE)
WIDTH_RE = re.compile(r'\bwidth=["\']\d+["\']', re.IGNORECASE)
HEIGHT_RE = re.compile(r'\bheight=["\']\d+["\']', re.IGNORECASE)
RSS_RE = re.compile(r'<link[^>]+type=["\']application/rss\+xml["\']', re.IGNORECASE)
SCRIPT_COMPONENT_RE = re.compile(
    r'(<script[^>]+src=["\'])components\.js(?:\?v=[^"\']*)?(["\'][^>]*></script>)',
    re.IGNORECASE,
)
WEALTH_STYLE_RE = re.compile(r'\s*<style id="wealthmeter-component-styles">.*?</style>\s*', re.DOTALL)
BRIDGE_RE = re.compile(
    r"\s*<!-- generated-article-bridge:start -->.*?<!-- generated-article-bridge:end -->\s*",
    re.DOTALL,
)
PILLAR_GRID_RE = re.compile(
    r"\s*<!-- generated-pillar-grid:start -->.*?<!-- generated-pillar-grid:end -->\s*",
    re.DOTALL,
)
CRAWL_INDEX_RE = re.compile(r'(<section class="crawl-index".*?</section>)', re.DOTALL)


PILLAR_CONFIG = [
    {
        "slug": "income-architecture-pillar.html",
        "title": "Income Architecture",
        "description": "A WealthMeter pillar hub on salary conversion, concentration risk, household structure, and the gap between income and durable wealth.",
        "kicker": "Wealth Pillar",
        "lede": "Income becomes wealth only after taxes, fixed costs, concentration, and behavior have taken their share. That conversion process is the real architecture behind household resilience.",
        "sections": [
            "High-income households often underperform because the binding constraint is not headline salary. It is the structure around that salary: benefit dependence, liquidity runway, job mobility, and how raises are translated into assets rather than lifestyle overhead.",
            "The articles in this cluster examine why two households with similar earnings can diverge sharply in strategic freedom. Some of that divergence comes from city cost structure and some from compensation design, but much of it is simply whether income is allowed to compound before new obligations absorb it.",
            "This is the right starting point for readers who arrive through percentile curiosity. Rank tells you where a balance sheet stands today. Income architecture tells you whether that position is likely to strengthen, stall, or reverse under stress.",
        ],
        "articles": [
            "productivity-income-disconnect.html",
            "salary-ceiling-illusion.html",
            "one-salary-three-futures.html",
            "dual-income-trap.html",
            "new-middle-class-trap.html",
            "career-optionality-gap.html",
            "skill-obsolescence-curve.html",
            "golden-handcuffs-equation.html",
            "ai-boom-portfolios-personal-wealth.html",
        ],
    },
    {
        "slug": "housing-real-estate-pillar.html",
        "title": "Housing and Real Estate",
        "description": "A WealthMeter pillar hub on mortgage lock-in, housing affordability, ownership drag, and the role of real estate in household resilience.",
        "kicker": "Wealth Pillar",
        "lede": "Housing is not just a line item. It is leverage, mobility, maintenance burden, and often the largest source of hidden path dependence inside the household balance sheet.",
        "sections": [
            "The classic ownership narrative assumes that shelter, equity building, and status all move in the same direction. That assumption weakens when financing costs rise, owner carry widens, and labor mobility becomes more valuable than fixed property exposure.",
            "This cluster follows those second-order effects. It brings together affordability strain, mortgage lock-in, second-home drag, and the broader problem of valuing property-heavy wealth as if it were liquid and frictionless.",
            "For planning, the relevant question is not whether real estate matters. It is how much of the balance sheet is trapped inside one asset regime and what that implies for optionality when rates, jobs, or location priorities change.",
        ],
        "articles": [
            "housing-stall-2026-rates-inventory-delinquency.html",
            "mortgage-lock-in-trap.html",
            "rent-vs-buy-reversal.html",
            "hidden-costs-of-ownership.html",
            "second-home-wealth-drain.html",
            "asset-rich-cash-poor-paradox.html",
            "rich-or-just-in-a-bubble.html",
        ],
    },
    {
        "slug": "wealth-distribution-pillar.html",
        "title": "Wealth Distribution",
        "description": "A WealthMeter pillar hub on percentile logic, global versus local baselines, and how distribution framing changes the meaning of rank.",
        "kicker": "Wealth Pillar",
        "lede": "Percentile rank looks simple until the reference population changes. The same balance sheet can look secure, ordinary, or elite depending on which distribution is doing the measuring.",
        "sections": [
            "This cluster is about the meaning of position rather than the spectacle of position. It gathers the articles that show why nominal rank can mislead when purchasing power, housing burden, liquidity, and demographic frame are left out.",
            "That matters because distribution is often the entry point for new readers. A rank result is useful only if it is translated into what that percentile actually buys in real life, across different national and local systems.",
            "These articles therefore treat distribution as a calibration tool rather than a trophy. They show how relative standing can clarify resilience, but also how easily it can flatter a balance sheet that is structurally weaker than the percentile suggests.",
        ],
        "articles": [
            "scarcity-mindset-loop.html",
            "comparison-trap-digital-age.html",
            "great-baseline-war.html",
            "geographic-arbitrage-window.html",
            "inside-wealth-germany-japan-canada.html",
            "inside-wealth-china-india.html",
            "rich-but-not-famous-economy.html",
            "rich-or-just-in-a-bubble.html",
            "inflation-ladder-problem.html",
        ],
    },
    {
        "slug": "inheritance-transfer-pillar.html",
        "title": "Inheritance and Transfer",
        "description": "A WealthMeter pillar hub on inheritance structure, liquidity gaps, and the way transfer timing changes real wealth outcomes.",
        "kicker": "Wealth Pillar",
        "lede": "Inheritance headlines conceal structure. Two people can receive the same nominal transfer and end up with very different wealth trajectories depending on timing, liquidity, concentration, and tax friction.",
        "sections": [
            "The central question is not whether transfer occurred. It is what was transferred, when it became usable, and whether it arrived in a form that actually improved strategic flexibility instead of merely inflating nominal net worth.",
            "This cluster connects inheritance to broader planning horizons, especially where longer lives delay transfer timing or where concentrated assets create fragility rather than resilience. It frames inheritance as a systems problem rather than a one-time windfall.",
            "Readers should treat these pages as a reminder that intergenerational wealth is not only about size. Transfer quality, structure, and usability determine whether capital can support real decisions.",
        ],
        "articles": [
            "inheritance-illusion.html",
            "longevity-capital-living-to-120.html",
            "inside-wealth-germany-japan-canada.html",
            "inside-wealth-china-india.html",
        ],
    },
    {
        "slug": "compounding-yield-pillar.html",
        "title": "Compounding and Yield",
        "description": "A WealthMeter pillar hub on non-linear compounding, capital access, portfolio process, and the mechanics that make wealth acceleration durable.",
        "kicker": "Wealth Pillar",
        "lede": "Compounding is not one curve for everyone. Access, fees, tax handling, governance, and opportunity set change the slope once wealth reaches different thresholds.",
        "sections": [
            "That is why the first million matters less as symbolism than as a shift in operating conditions. Better financing terms, lower friction, and stronger optionality can make wealth growth accelerate structurally rather than arithmetically.",
            "The articles in this cluster examine that acceleration from multiple directions: public-market timing errors, concentration quality, private-market lock-up narratives, and the difference between paper gains and process-driven durability.",
            "This is the right hub for readers who want the mechanics rather than the motivational cliché. It focuses on the conditions under which returns become durable household wealth.",
        ],
        "articles": [
            "compounding-gap-after-1m.html",
            "crypto-etf-wealth-effect.html",
            "concentration-vs-diversification-tradeoff.html",
            "illiquidity-premium-myth.html",
            "cost-of-capital-trap.html",
            "timing-fallacy-public-markets.html",
            "loss-aversion-tax.html",
        ],
    },
    {
        "slug": "geographic-wealth-pillar.html",
        "title": "Geographic Wealth",
        "description": "A WealthMeter pillar hub on how place reshapes household wealth through housing, labor markets, taxes, mobility, and national baseline effects.",
        "kicker": "Wealth Pillar",
        "lede": "Place changes what wealth means. The same income or net worth can translate into radically different resilience once local housing, tax structure, and mobility constraints are priced in.",
        "sections": [
            "That is the logic behind this cluster. Nominal wealth has to be interpreted inside a local asset system, a local cost stack, and a local labor market rather than in abstraction from place.",
            "These articles compare developed and emerging-market wealth frames, city-level path divergence, and the difference between national rank and local decision reality. They show why geographic context often matters more than broad percentiles suggest.",
            "For readers interested in international comparison, this hub should be treated as a translation layer. It helps convert calculator outputs into place-specific meaning.",
        ],
        "articles": [
            "inside-wealth-germany-japan-canada.html",
            "inside-wealth-china-india.html",
            "one-salary-three-futures.html",
            "mobility-premium.html",
            "housing-stall-2026-rates-inventory-delinquency.html",
            "great-baseline-war.html",
        ],
    },
    {
        "slug": "retirement-planning-pillar.html",
        "title": "Retirement Planning",
        "description": "A WealthMeter pillar hub on retirement numbers, longevity planning, drawdown assumptions, and the fragility of standard retirement heuristics.",
        "kicker": "Wealth Pillar",
        "lede": "Retirement planning breaks first where time horizon and spending assumptions are too shallow. Higher rates, longer lives, and more expensive transitions widen the gap between nominal targets and real durability.",
        "sections": [
            "This cluster focuses on that gap. It links retirement assumptions to drawdown discipline, inflation pressure, liquidity quality, and the possibility that a long life changes the cost of time itself.",
            "The practical lesson is that retirement math is not one target number. It is a living system involving spending flexibility, medical uncertainty, income replacement, and the structure of the assets expected to fund later decades.",
            "For readers coming from either the wealth or longevity side of the portfolio, this hub is one of the most useful bridges because it shows how balance-sheet design and lifespan uncertainty interact directly.",
        ],
        "articles": [
            "retirement-age-lie.html",
            "longevity-capital-living-to-120.html",
            "asset-rich-cash-poor-paradox.html",
            "rich-or-just-in-a-bubble.html",
            "inflation-ladder-problem.html",
        ],
    },
    {
        "slug": "tax-benefits-pillar.html",
        "title": "Tax and Benefits",
        "description": "A WealthMeter pillar hub on tax drag, realization risk, state friction, and the way compensation and policy design influence real wealth durability.",
        "kicker": "Wealth Pillar",
        "lede": "Tax and benefits design often decides whether headline gains become durable wealth or evaporate during realization, relocation, concentrated vesting, or policy transition.",
        "sections": [
            "The important variable is not only the statutory rate. It is timing, structure, and the interaction between taxes, compensation design, subsidies, financing terms, and household behavior under stress.",
            "This cluster collects the repo’s strongest examples of those frictions. It includes equity compensation, tax-loss discipline, benefit dependence, and the way policy architecture shapes what gross wealth is actually worth after conversion.",
            "Readers should treat this hub as a reminder that net wealth is always partly a policy artifact. Planning quality improves when those frictions are modeled directly instead of treated as minor footnotes.",
        ],
        "articles": [
            "equity-compensation-trap.html",
            "loss-aversion-tax.html",
            "realistic-projections-ubi.html",
            "golden-handcuffs-equation.html",
            "ai-displacement-timeline.html",
        ],
    },
]


@dataclass
class PageInfo:
    path: Path
    canonical_url: str
    title: str
    description: str
    robots: str
    is_article: bool
    is_hub: bool
    modified_at: datetime
    image_url: str | None
    image_alt: str | None
    html_text: str

    @property
    def is_indexable(self) -> bool:
        return "noindex" not in self.robots.lower()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str, apply: bool) -> bool:
    if not apply:
        return False
    current = path.read_text(encoding="utf-8") if path.exists() else None
    if current == content:
        return False
    path.write_text(content, encoding="utf-8")
    return True


def extract_template(js_path: Path, const_name: str) -> str:
    match = re.search(rf"const {re.escape(const_name)} = `(.*?)`;", read_text(js_path), re.DOTALL)
    if not match:
        raise RuntimeError(f"Could not extract {const_name} from {js_path}")
    return match.group(1).strip()


def title_of(text: str) -> str:
    match = TITLE_RE.search(text)
    return html.unescape(match.group(1).strip()) if match else ""


def description_of(text: str) -> str:
    match = META_DESCRIPTION_RE.search(text)
    return html.unescape(match.group(1).strip()) if match else ""


def robots_of(text: str) -> str:
    match = ROBOTS_RE.search(text)
    return match.group(2).strip() if match else "index, follow"


def canonical_of(text: str, path: Path) -> str:
    match = CANONICAL_RE.search(text)
    if match:
        return match.group(2).strip()
    if path.name == "index.html":
        return f"{DOMAIN}/"
    return f"{DOMAIN}/{path.name}"


def parse_json_ld_objects(text: str) -> list[dict]:
    payloads: list[dict] = []
    for block in JSON_LD_RE.findall(text):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        if isinstance(data, list):
            payloads.extend(item for item in data if isinstance(item, dict))
        elif isinstance(data, dict):
            payloads.append(data)
    return payloads


def has_schema(text: str, schema_type: str) -> bool:
    for payload in parse_json_ld_objects(text):
        schema = payload.get("@type")
        if schema == schema_type:
            return True
        if isinstance(schema, list) and schema_type in schema:
            return True
    return False


def article_urls_from_longform() -> set[str]:
    text = read_text(ROOT / "longform.html")
    return {
        match.group(1).strip()
        for match in re.finditer(r'<a class="card" href="([^"]+)"', text)
    }


def generated_hub_names() -> set[str]:
    return {pillar["slug"] for pillar in PILLAR_CONFIG} | {"longform.html"}


def classify_page(path: Path, html_text: str, article_urls: set[str]) -> PageInfo:
    image_match = OG_IMAGE_RE.search(html_text)
    alt_match = OG_ALT_RE.search(html_text)
    modified_at = (
        datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
        if path.exists()
        else datetime.now(timezone.utc)
    )
    return PageInfo(
        path=path,
        canonical_url=canonical_of(html_text, path),
        title=title_of(html_text),
        description=description_of(html_text),
        robots=robots_of(html_text),
        is_article=path.name in article_urls,
        is_hub=path.name in generated_hub_names(),
        modified_at=modified_at,
        image_url=image_match.group(1).strip() if image_match else None,
        image_alt=alt_match.group(1).strip() if alt_match else None,
        html_text=html_text,
    )


def xml_escape(value: str) -> str:
    return html.escape(value, quote=True)


def local_image_path(image_ref: str) -> Path | None:
    parsed = urlparse(image_ref)
    rel = parsed.path.lstrip("/") if parsed.scheme in {"http", "https"} else image_ref.lstrip("/")
    path = ROOT / rel
    return path if path.exists() else None


def image_size(path: Path) -> tuple[int, int] | None:
    if not path.exists() or path.is_dir():
        return None
    data = path.read_bytes()[:64]
    if len(data) >= 24 and data.startswith(b"\x89PNG\r\n\x1a\n"):
        return struct.unpack(">II", data[16:24])
    if data.startswith(b"\xff\xd8"):
        with path.open("rb") as handle:
            if handle.read(2) != b"\xff\xd8":
                return None
            while True:
                marker_prefix = handle.read(1)
                if not marker_prefix:
                    return None
                if marker_prefix != b"\xff":
                    continue
                marker = handle.read(1)
                while marker == b"\xff":
                    marker = handle.read(1)
                if marker in {b"\xc0", b"\xc1", b"\xc2", b"\xc3", b"\xc5", b"\xc6", b"\xc7", b"\xc9", b"\xca", b"\xcb", b"\xcd", b"\xce", b"\xcf"}:
                    _length = struct.unpack(">H", handle.read(2))[0]
                    handle.read(1)
                    height, width = struct.unpack(">HH", handle.read(4))
                    return width, height
                if marker in {b"\xd8", b"\xd9"}:
                    continue
                length_bytes = handle.read(2)
                if len(length_bytes) != 2:
                    return None
                length = struct.unpack(">H", length_bytes)[0]
                handle.seek(length - 2, 1)
    if path.suffix.lower() == ".svg":
        text = read_text(path)
        width_match = re.search(r'\bwidth=["\'](\d+(?:\.\d+)?)', text)
        height_match = re.search(r'\bheight=["\'](\d+(?:\.\d+)?)', text)
        if width_match and height_match:
            return int(float(width_match.group(1))), int(float(height_match.group(1)))
    return None


def replace_or_insert_meta(text: str, property_name: str, content: str) -> str:
    pattern = re.compile(
        rf'(<meta[^>]+property=["\']{re.escape(property_name)}["\'][^>]+content=["\'])(.*?)(["\'][^>]*>)',
        re.IGNORECASE | re.DOTALL,
    )
    escaped = html.escape(content, quote=True)
    if pattern.search(text):
        return pattern.sub(lambda match: f"{match.group(1)}{escaped}{match.group(3)}", text, count=1)
    return text.replace("</head>", f'    <meta property="{property_name}" content="{escaped}">\n</head>')


def replace_or_insert_named_meta(text: str, name: str, content: str) -> str:
    pattern = re.compile(
        rf'(<meta[^>]+name=["\']{re.escape(name)}["\'][^>]+content=["\'])(.*?)(["\'][^>]*>)',
        re.IGNORECASE | re.DOTALL,
    )
    escaped = html.escape(content, quote=True)
    if pattern.search(text):
        return pattern.sub(lambda match: f"{match.group(1)}{escaped}{match.group(3)}", text, count=1)
    return text.replace("</head>", f'    <meta name="{name}" content="{escaped}">\n</head>')


def replace_or_insert_canonical(text: str, canonical_url: str) -> str:
    escaped = html.escape(canonical_url, quote=True)
    if CANONICAL_RE.search(text):
        return CANONICAL_RE.sub(lambda match: f"{match.group(1)}{escaped}{match.group(3)}", text, count=1)
    return text.replace("</head>", f'    <link rel="canonical" href="{escaped}">\n</head>')


def ensure_meta_description(text: str, path: Path, title: str) -> str:
    if META_DESCRIPTION_RE.search(text):
        return text
    fallback = DESCRIPTION_FALLBACKS.get(path.name)
    if not fallback:
        base = title.split("|")[0].strip() or "WealthMeter page"
        fallback = f"{base} on WealthMeter.xyz."
    return text.replace("</head>", f'    <meta name="description" content="{html.escape(fallback, quote=True)}">\n</head>')


def ensure_feed_link(text: str) -> str:
    if RSS_RE.search(text):
        return text
    line = f'<link rel="alternate" type="application/rss+xml" title="{DISPLAY_NAME} Feed" href="{FEED_URL}">'
    return text.replace("</head>", f"    {line}\n</head>")


def collapse_component_styles(text: str) -> str:
    matches = list(WEALTH_STYLE_RE.finditer(text))
    if len(matches) <= 1:
        return text
    first_block = matches[0].group(0).strip()
    text = WEALTH_STYLE_RE.sub("", text)
    return text.replace("</head>", f"{first_block}\n</head>", 1)


def ensure_component_version(text: str) -> str:
    replacement = rf'\1components.js?v={COMPONENT_VERSION}\2'
    if SCRIPT_COMPONENT_RE.search(text):
        return SCRIPT_COMPONENT_RE.sub(replacement, text)
    return text


def ensure_static_components(text: str, shared_styles: str, header_html: str, footer_html: str) -> str:
    text = collapse_component_styles(text)
    if "wealthmeter-component-styles" not in text:
        text = text.replace("</head>", f"{shared_styles}\n</head>")
    header_markup = f'<div id="header-placeholder" data-static-component="1">\n{header_html}\n</div>'
    footer_markup = f'<div id="footer-placeholder" data-static-component="1">\n{footer_html}\n</div>'
    if HEADER_RE.search(text):
        text = HEADER_RE.sub(header_markup, text, count=1)
    if FOOTER_RE.search(text):
        text = FOOTER_RE.sub(footer_markup, text, count=1)
    return ensure_component_version(text)


def first_local_image_ref(text: str) -> str | None:
    for tag in IMG_TAG_RE.findall(text):
        src_match = SRC_RE.search(tag)
        if not src_match:
            continue
        src = src_match.group(1).strip()
        if local_image_path(src):
            return src
    return None


def absolute_asset_url(asset_ref: str) -> str:
    if asset_ref.startswith("http://") or asset_ref.startswith("https://"):
        return asset_ref
    return f"{DOMAIN}/{asset_ref.lstrip('/')}"


def ensure_social_metadata(text: str, page: PageInfo) -> str:
    title = page.title
    description = page.description or title
    if not OG_TITLE_RE.search(text):
        text = replace_or_insert_meta(text, "og:title", title)
    if not OG_DESCRIPTION_RE.search(text):
        text = replace_or_insert_meta(text, "og:description", description)
    if not OG_TYPE_RE.search(text):
        text = replace_or_insert_meta(text, "og:type", "article" if page.is_article else "website")
    if not OG_URL_RE.search(text):
        text = replace_or_insert_meta(text, "og:url", page.canonical_url)
    if not TWITTER_CARD_RE.search(text):
        text = replace_or_insert_named_meta(text, "twitter:card", "summary_large_image")
    if not TWITTER_TITLE_RE.search(text):
        text = replace_or_insert_named_meta(text, "twitter:title", title)
    if not TWITTER_DESCRIPTION_RE.search(text):
        text = replace_or_insert_named_meta(text, "twitter:description", description)
    image_match = OG_IMAGE_RE.search(text)
    og_image = image_match.group(1).strip() if image_match else None
    if og_image and not local_image_path(og_image):
        og_image = None
    if not og_image:
        fallback = first_local_image_ref(text)
        if fallback:
            og_image = absolute_asset_url(fallback)
            text = replace_or_insert_meta(text, "og:image", og_image)
    if og_image and not TWITTER_IMAGE_RE.search(text):
        text = replace_or_insert_named_meta(text, "twitter:image", og_image)
    return text


def ensure_og_image_metadata(text: str, page: PageInfo) -> str:
    match = OG_IMAGE_RE.search(text)
    if not match:
        return text
    path = local_image_path(match.group(1).strip())
    if not path:
        return text
    size = image_size(path)
    if size:
        width, height = size
        if not OG_WIDTH_RE.search(text):
            text = replace_or_insert_meta(text, "og:image:width", str(width))
        if not OG_HEIGHT_RE.search(text):
            text = replace_or_insert_meta(text, "og:image:height", str(height))
    if page.description and "og:image:alt" not in text:
        text = replace_or_insert_meta(text, "og:image:alt", page.description)
    return text


def ensure_img_dimensions(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        if WIDTH_RE.search(tag) and HEIGHT_RE.search(tag):
            return tag
        src_match = SRC_RE.search(tag)
        if not src_match:
            return tag
        path = local_image_path(src_match.group(1))
        if not path:
            return tag
        size = image_size(path)
        if not size:
            return tag
        width, height = size
        return tag[:-1] + f' width="{width}" height="{height}">'

    return IMG_TAG_RE.sub(repl, text)


def infer_duplicate_canonical(path: Path) -> str:
    if path.name == "adsense_block.html":
        return f"{DOMAIN}/"
    return f"{DOMAIN}/{path.name}"


def enforce_duplicate_controls(text: str, path: Path) -> str:
    if path.name in PRIVATE_OR_STAGING:
        text = replace_or_insert_named_meta(text, "robots", "noindex, nofollow")
        text = replace_or_insert_canonical(text, infer_duplicate_canonical(path))
    return text


def build_breadcrumb_schema(page: PageInfo) -> str | None:
    if has_schema(page.html_text, "BreadcrumbList"):
        return None
    items = [{"@type": "ListItem", "position": 1, "name": "WEALTHMETER.XYZ", "item": f"{DOMAIN}/"}]
    if page.path.name == "index.html":
        items[0]["name"] = "Home"
    elif page.path.name == "longform.html":
        items.append({"@type": "ListItem", "position": 2, "name": "Longform", "item": page.canonical_url})
    elif page.is_article:
        items.append({"@type": "ListItem", "position": 2, "name": "Longform", "item": f"{DOMAIN}/longform.html"})
        items.append({"@type": "ListItem", "position": 3, "name": page.title.split("|")[0].strip(), "item": page.canonical_url})
    else:
        items.append({"@type": "ListItem", "position": 2, "name": page.title.split("|")[0].strip(), "item": page.canonical_url})
    payload = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def hub_item_entries(text: str) -> list[dict]:
    card_re = re.compile(r'<a class="card" href="([^"]+)".*?<h2>(.*?)</h2>.*?<p>(.*?)</p>', re.IGNORECASE | re.DOTALL)
    entries = []
    for position, match in enumerate(card_re.finditer(text), start=1):
        href, title, description = match.groups()
        entries.append(
            {
                "@type": "ListItem",
                "position": position,
                "url": f"{DOMAIN}/{href.lstrip('/')}",
                "name": re.sub(r"\s+", " ", html.unescape(title)).strip(),
                "description": re.sub(r"\s+", " ", html.unescape(description)).strip(),
            }
        )
    return entries


def build_itemlist_schema(page: PageInfo) -> str | None:
    if not page.is_hub or has_schema(page.html_text, "ItemList"):
        return None
    items = hub_item_entries(page.html_text)
    if not items:
        return None
    payload = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": page.title.split("|")[0].strip(),
        "itemListOrder": "https://schema.org/ItemListOrderDescending",
        "numberOfItems": len(items),
        "itemListElement": items,
    }
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def inject_json_ld(text: str, payload_json: str | None) -> str:
    if not payload_json:
        return text
    return text.replace("</head>", f'    <script type="application/ld+json">{payload_json}</script>\n</head>')


def wealth_to_lifemeter_query(page: PageInfo) -> tuple[str, list[str]]:
    title = page.title.lower()
    preset = {
        "age": "45",
        "netWorth": "1500000",
        "annualSpend": "90000",
        "targetYield": "0.05",
        "region": "77",
        "gender": "F",
        "health": "1.0",
    }
    if any(token in title for token in ("retirement", "longevity capital")):
        preset.update({"age": "58", "netWorth": "2400000", "annualSpend": "125000", "targetYield": "0.045"})
    elif any(token in title for token in ("housing", "mortgage", "rent", "ownership", "second-home")):
        preset.update({"age": "42", "netWorth": "900000", "annualSpend": "85000", "targetYield": "0.05", "health": "1.05"})
    elif any(token in title for token in ("income", "career", "equity", "job", "salary", "middle-class")):
        preset.update({"age": "39", "netWorth": "650000", "annualSpend": "78000", "targetYield": "0.05", "health": "1.0"})
    ordered = ["from", "age", "netWorth", "annualSpend", "targetYield", "region", "gender", "health"]
    params = {"from": "wealthmeter", **preset}
    url = "https://lifemeter.xyz/?" + "&".join(f"{key}={params[key]}" for key in ordered)
    chips = [
        f'Age {preset["age"]}',
        f'Net worth ${int(preset["netWorth"]):,}',
        f'Spending ${int(preset["annualSpend"]):,}',
        f'Yield {float(preset["targetYield"]) * 100:.1f}%',
    ]
    return url, chips


def article_bridge_markup(page: PageInfo) -> str | None:
    if not page.is_article or not page.is_indexable:
        return None
    href, chips = wealth_to_lifemeter_query(page)
    chip_html = "".join(f'<span class="article-bridge-chip">{chip}</span>' for chip in chips)
    return (
        "\n<!-- generated-article-bridge:start -->\n"
        '<section class="article-bridge-cta" aria-label="Paired LifeMeter scenario">\n'
        '  <span class="article-bridge-label">Run The Paired Scenario</span>\n'
        '  <h2>Stress-test the lifespan side of this balance-sheet story.</h2>\n'
        '  <p>Open the matching LifeMeter scenario with a prefilled planning profile so the wealth case and the health-runway case can be read together.</p>\n'
        f'  <div class="article-bridge-chips">{chip_html}</div>\n'
        '  <div class="article-bridge-actions">\n'
        f'    <a class="article-bridge-button" href="{href}" target="_blank" rel="noopener">Open Prefilled LifeMeter</a>\n'
        '    <a class="article-bridge-secondary" href="longform.html">Back to the wealth longform hub</a>\n'
        '  </div>\n'
        '</section>\n'
        "<!-- generated-article-bridge:end -->\n"
    )


def ensure_article_bridge(text: str, page: PageInfo) -> str:
    block = article_bridge_markup(page)
    updated = BRIDGE_RE.sub("", text)
    if not block:
        return updated
    return updated.replace("</main>", f"{block}</main>")


def article_card_markup(path: str, title: str, description: str) -> str:
    source_text = read_text(ROOT / path)
    image_match = OG_IMAGE_RE.search(source_text)
    image_ref = image_match.group(1).strip() if image_match else first_local_image_ref(source_text) or ""
    if image_ref.startswith(DOMAIN):
        image_ref = urlparse(image_ref).path.lstrip("/")
    alt = html.escape(description, quote=True)
    image_tag = ""
    if image_ref:
        size = image_size(local_image_path(image_ref) or Path())
        size_attrs = f' width="{size[0]}" height="{size[1]}"' if size else ""
        image_tag = f'        <img src="{image_ref}" alt="{alt}" loading="lazy"{size_attrs}>\n'
    return (
        f'<a class="card" href="{path}">\n'
        f"{image_tag}"
        '    <div class="content">\n'
        '        <div class="meta">Cluster Article</div>\n'
        f"        <h2>{html.escape(title)}</h2>\n"
        f"        <p>{html.escape(description)}</p>\n"
        "    </div>\n"
        "</a>"
    )


def page_description(path: str) -> str:
    return description_of(read_text(ROOT / path))


def page_title(path: str) -> str:
    return title_of(read_text(ROOT / path)).split("|")[0].strip()


def pillar_page_html(pillar: dict, shared_styles: str, header_html: str, footer_html: str) -> str:
    cards = "\n\n".join(
        article_card_markup(article, page_title(article), page_description(article))
        for article in pillar["articles"]
        if (ROOT / article).exists()
    )
    cluster_links = "".join(
        f'<a href="{article}">{html.escape(page_title(article))}</a>'
        for article in pillar["articles"]
        if (ROOT / article).exists()
    )
    payload = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": pillar["title"],
        "url": f'{DOMAIN}/{pillar["slug"]}',
        "description": pillar["description"],
    }
    body = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(pillar["title"])} | WEALTHMETER.XYZ</title>
    <meta name="description" content="{html.escape(pillar["description"], quote=True)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{DOMAIN}/{pillar["slug"]}">
    <meta property="og:title" content="{html.escape(pillar["title"], quote=True)} | WEALTHMETER.XYZ">
    <meta property="og:description" content="{html.escape(pillar["description"], quote=True)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{DOMAIN}/{pillar["slug"]}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{html.escape(pillar["title"], quote=True)} | WEALTHMETER.XYZ">
    <meta name="twitter:description" content="{html.escape(pillar["description"], quote=True)}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --ink: #0f172a;
            --body: #475569;
            --line: #dbe4f0;
            --accent: #2563eb;
            --soft: #eef4ff;
        }}
        * {{ box-sizing: border-box; }}
        body {{ margin: 0; font-family: 'Outfit', sans-serif; color: var(--ink); background: #ffffff; }}
        .wrap {{ max-width: 1100px; margin: 0 auto; padding: 3rem 1.25rem 5rem; }}
        .hero {{ border: 1px solid var(--line); border-radius: 24px; padding: 2rem; background: linear-gradient(145deg, #ffffff, var(--soft)); }}
        .kicker {{ display:inline-block; margin-bottom:0.8rem; font-family:'JetBrains Mono', monospace; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.14em; color:var(--accent); font-weight:700; }}
        h1 {{ margin:0 0 0.8rem; font-size:clamp(2rem, 4.4vw, 3.25rem); line-height:1.02; letter-spacing:-0.03em; }}
        .hero p {{ margin:0.8rem 0 0; font-size:1.08rem; line-height:1.65; color:var(--body); max-width:820px; }}
        .cluster-nav {{ margin-top:1.2rem; display:flex; flex-wrap:wrap; gap:0.65rem; }}
        .cluster-nav a {{ display:inline-flex; align-items:center; border:1px solid #bfdbfe; border-radius:999px; padding:0.38rem 0.75rem; color:var(--accent); text-decoration:none; font-weight:700; font-size:0.82rem; }}
        .orientation {{ margin-top:1.5rem; border:1px solid var(--line); border-radius:20px; padding:1.5rem; background:#ffffff; }}
        .orientation h2 {{ margin:0 0 0.9rem; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; }}
        .orientation p {{ margin:0 0 1rem; color:var(--body); line-height:1.72; font-size:1.02rem; }}
        .grid {{ margin-top:1.5rem; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:1rem; }}
        .card {{ display:grid; grid-template-columns:1fr; border:1px solid var(--line); border-radius:18px; overflow:hidden; text-decoration:none; color:inherit; background:#fff; }}
        .card img {{ width:100%; height:auto; object-fit:cover; display:block; }}
        .content {{ padding:1.2rem 1.25rem; }}
        .meta {{ font-family:'JetBrains Mono', monospace; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; }}
        .content h2 {{ margin:0.55rem 0; font-size:1.2rem; line-height:1.2; }}
        .content p {{ margin:0; color:var(--body); line-height:1.65; }}
        .return-row {{ margin-top:1.25rem; display:flex; flex-wrap:wrap; gap:0.8rem; }}
        .return-row a {{ color:var(--accent); font-weight:800; text-decoration:none; }}
        @media (max-width: 860px) {{ .grid {{ grid-template-columns:1fr; }} }}
    </style>
    {shared_styles}
    <link rel="alternate" type="application/rss+xml" title="{DISPLAY_NAME} Feed" href="{FEED_URL}">
    <script type="application/ld+json">{json.dumps(payload, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
<body>
<div id="header-placeholder" data-static-component="1">
{header_html}
</div>
<main class="wrap">
    <section class="hero">
        <span class="kicker">{html.escape(pillar["kicker"])}</span>
        <h1>{html.escape(pillar["title"])}</h1>
        <p>{html.escape(pillar["lede"])}</p>
        <div class="cluster-nav">{cluster_links}</div>
    </section>
    <section class="orientation">
        <h2>Orientation</h2>
        <p>{html.escape(pillar["sections"][0])}</p>
        <p>{html.escape(pillar["sections"][1])}</p>
        <p>{html.escape(pillar["sections"][2])}</p>
        <div class="return-row">
            <a href="longform.html">Return to Longform Hub</a>
            <a href="/">Open Wealth Rank Tool</a>
        </div>
    </section>
    <section class="grid">
{cards}
    </section>
</main>
<div id="footer-placeholder" data-static-component="1">
{footer_html}
</div>
<script src="components.js?v={COMPONENT_VERSION}"></script>
</body>
</html>
"""
    page = classify_page(ROOT / pillar["slug"], body, article_urls_from_longform())
    body = ensure_social_metadata(body, page)
    body = ensure_og_image_metadata(body, page)
    body = inject_json_ld(body, build_breadcrumb_schema(classify_page(ROOT / pillar["slug"], body, article_urls_from_longform())))
    body = inject_json_ld(body, build_itemlist_schema(classify_page(ROOT / pillar["slug"], body, article_urls_from_longform())))
    return body


def generate_pillar_pages(apply: bool, shared_styles: str, header_html: str, footer_html: str) -> int:
    changes = 0
    for pillar in PILLAR_CONFIG:
        content = pillar_page_html(pillar, shared_styles, header_html, footer_html)
        changes += int(write_text(ROOT / pillar["slug"], content, apply))
    return changes


def build_pillar_grid() -> str:
    cards = []
    for pillar in PILLAR_CONFIG:
        cards.append(
            f'<a href="{pillar["slug"]}" style="display:block;text-decoration:none;color:inherit;border:1px solid #dbe4f0;border-radius:18px;padding:1rem 1.05rem;background:#fff;">'
            f'<div style="font-family:JetBrains Mono, monospace;font-size:0.74rem;text-transform:uppercase;letter-spacing:0.14em;color:#2563eb;margin-bottom:0.45rem;">Topical Cluster</div>'
            f'<h2 style="margin:0 0 0.45rem;font-size:1.1rem;line-height:1.2;">{html.escape(pillar["title"])}</h2>'
            f'<p style="margin:0;color:#475569;line-height:1.6;font-size:0.96rem;">{html.escape(pillar["description"])}</p>'
            '</a>'
        )
    return (
        '\n<!-- generated-pillar-grid:start -->\n'
        '<section aria-label="Wealth topical pillars" style="margin:1.3rem 0 1.6rem;">'
        '<div style="background:#fff;border:1px solid #dbe4f0;border-radius:20px;padding:1.2rem 1.2rem 1.3rem;">'
        '<div style="font-family:JetBrains Mono, monospace;font-size:0.76rem;text-transform:uppercase;letter-spacing:0.14em;color:#2563eb;margin-bottom:0.55rem;">Topical Clusters</div>'
        '<h2 style="margin:0 0 0.55rem;font-family:Outfit, sans-serif;font-size:1.45rem;line-height:1.15;color:#0f172a;">Explore Wealth Pillars</h2>'
        '<p style="margin:0 0 1rem;color:#475569;line-height:1.65;font-size:1rem;">Grouped entry pages for WealthMeter’s core themes: income architecture, real estate, distribution, transfer, compounding, geography, retirement, and tax friction.</p>'
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.8rem;">'
        + "".join(cards)
        + '</div></div></section>\n<!-- generated-pillar-grid:end -->\n'
    )


def ensure_pillar_grid(text: str) -> str:
    grid = build_pillar_grid()
    updated = PILLAR_GRID_RE.sub("", text)
    match = CRAWL_INDEX_RE.search(updated)
    if match:
        return updated.replace(match.group(1), match.group(1) + grid, 1)
    return updated.replace("</main>", f"{grid}</main>")


def update_html_inventory(apply: bool) -> tuple[list[PageInfo], int]:
    component_file = ROOT / "components.js"
    shared_styles = extract_template(component_file, "sharedStyles")
    header_html = extract_template(component_file, "siteHeader")
    footer_html = extract_template(component_file, "siteFooter")
    article_urls = article_urls_from_longform()
    pages: list[PageInfo] = []
    changes = 0
    for path in sorted(ROOT.glob("*.html")):
        original = read_text(path)
        page = classify_page(path, original, article_urls)
        updated = original
        updated = enforce_duplicate_controls(updated, path)
        page = classify_page(path, updated, article_urls)
        updated = ensure_meta_description(updated, path, page.title)
        updated = ensure_feed_link(updated)
        updated = ensure_static_components(updated, shared_styles, header_html, footer_html)
        if path.name == "longform.html":
            updated = ensure_pillar_grid(updated)
        updated = ensure_social_metadata(updated, page)
        updated = ensure_img_dimensions(updated)
        updated = ensure_og_image_metadata(updated, classify_page(path, updated, article_urls))
        updated = ensure_article_bridge(updated, classify_page(path, updated, article_urls))
        page = classify_page(path, updated, article_urls)
        updated = inject_json_ld(updated, build_breadcrumb_schema(page))
        page = classify_page(path, updated, article_urls)
        updated = inject_json_ld(updated, build_itemlist_schema(page))
        changes += int(write_text(path, updated, apply))
        pages.append(classify_page(path, updated, article_urls))
    return pages, changes


def sort_key(page: PageInfo) -> tuple[datetime, str]:
    return (page.modified_at, page.canonical_url)


def lastmod_value(page: PageInfo) -> str:
    return page.modified_at.date().isoformat()


def sitemap_priority(page: PageInfo) -> str:
    if page.path.name == "index.html":
        return "1.0"
    if page.path.name == "longform.html":
        return "0.9"
    if page.is_article:
        return "0.8"
    if any(token in page.path.name for token in ("privacy", "disclaimer", "method")):
        return "0.3"
    return "0.7"


def sitemap_changefreq(page: PageInfo) -> str:
    if page.path.name in {"index.html", "longform.html"}:
        return "daily"
    if page.is_article:
        return "weekly"
    return "monthly"


def generate_sitemap(pages: list[PageInfo]) -> str:
    deduped: dict[str, PageInfo] = {}
    for page in sorted(pages, key=sort_key, reverse=True):
        deduped.setdefault(page.canonical_url, page)
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for page in deduped.values():
        lines.extend([
            "  <url>",
            f"    <loc>{xml_escape(page.canonical_url)}</loc>",
            f"    <lastmod>{lastmod_value(page)}</lastmod>",
            f"    <changefreq>{sitemap_changefreq(page)}</changefreq>",
            f"    <priority>{sitemap_priority(page)}</priority>",
            "  </url>",
        ])
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def generate_sitemap_index() -> str:
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        "  <sitemap>",
        f"    <loc>{DOMAIN}/sitemap.xml</loc>",
        f"    <lastmod>{datetime.now(timezone.utc).date().isoformat()}</lastmod>",
        "  </sitemap>",
        "</sitemapindex>",
    ]
    return "\n".join(lines) + "\n"


def generate_feed(pages: list[PageInfo]) -> str:
    items = []
    for page in sorted((p for p in pages if p.is_article and p.is_indexable), key=sort_key, reverse=True)[:RSS_LIMIT]:
        title = page.title.split("|")[0].strip()
        enclosure = ""
        if page.image_url:
            ext = page.image_url.rsplit(".", 1)[-1].lower()
            enclosure = f'\n      <enclosure url="{xml_escape(page.image_url)}" type="image/{ext}"/>'
        items.append(
            "    <item>\n"
            f"      <title>{xml_escape(title)}</title>\n"
            f"      <link>{xml_escape(page.canonical_url)}</link>\n"
            f"      <guid>{xml_escape(page.canonical_url)}</guid>\n"
            f"      <pubDate>{format_datetime(page.modified_at.astimezone(timezone.utc))}</pubDate>\n"
            f"      <description>{xml_escape(page.description or title)}</description>{enclosure}\n"
            "    </item>"
        )
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0">',
        "  <channel>",
        f"    <title>{DISPLAY_NAME} Longform Feed</title>",
        f"    <link>{DOMAIN}/longform.html</link>",
        "    <description>Recent WealthMeter longform analysis on balance-sheet structure, resilience, and capital planning.</description>",
        "    <language>en-us</language>",
        f"    <lastBuildDate>{format_datetime(datetime.now(timezone.utc))}</lastBuildDate>",
        *items,
        "  </channel>",
        "</rss>",
    ]
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Rebuild WealthMeter SEO artifacts and harden HTML metadata.")
    parser.add_argument("--write", action="store_true", help="Write changes to disk.")
    args = parser.parse_args()

    component_file = ROOT / "components.js"
    shared_styles = extract_template(component_file, "sharedStyles")
    header_html = extract_template(component_file, "siteHeader")
    footer_html = extract_template(component_file, "siteFooter")

    pillar_changes = generate_pillar_pages(args.write, shared_styles, header_html, footer_html)
    pages, html_changes = update_html_inventory(args.write)
    indexable_pages = [page for page in pages if page.is_indexable]
    article_pages = [page for page in indexable_pages if page.is_article]

    generated_files = {
        ROOT / "sitemap.xml": generate_sitemap(indexable_pages),
        ROOT / "sitemaps.xml": generate_sitemap_index(),
        ROOT / "sitemap-index.xml": generate_sitemap_index(),
        ROOT / "feed.xml": generate_feed(article_pages),
    }

    file_changes = html_changes + pillar_changes
    for path, content in generated_files.items():
        file_changes += int(write_text(path, content, args.write))

    print(f"HTML pages scanned: {len(pages)}")
    print(f"Indexable WealthMeter pages: {len(indexable_pages)}")
    print(f"Wealth articles in feed: {len(article_pages[:RSS_LIMIT])}")
    print(f"Files changed: {file_changes}")
    if not args.write:
        print("Dry run only. Re-run with --write to persist changes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
