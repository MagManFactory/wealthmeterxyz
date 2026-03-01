// components.js - WealthMeter™ V25 Studio Standard

const sharedStyles = `
<style>
    /* Monolith Pulse Animation */
    @keyframes monolithPulse {
        0% { transform: scaleY(1); }
        50% { transform: scaleY(1.25); }
        100% { transform: scaleY(1); }
    }
    .bar-rank { animation: monolithPulse 2s ease-in-out infinite; transform-origin: bottom; fill: #FF4B4B; }
    .bar-analyze { animation: monolithPulse 2.4s ease-in-out infinite; animation-delay: 0.2s; transform-origin: bottom; fill: #0f172a; }
    .bar-rate { animation: monolithPulse 1.8s ease-in-out infinite; animation-delay: 0.4s; transform-origin: bottom; fill: #0891b2; }

    /* Pillar Colors */
    .label-rank { color: #FF4B4B !important; }
    .label-rate { color: #00bcd4 !important; }
    .label-analyze { color: #2563eb !important; }
    .label-longform { color: #0ea5e9 !important; }

    /* Layout Standards */
    header { 
        width: 100%; 
        position: sticky; 
        top: 0; 
        background: rgba(255,255,255,0.98); 
        backdrop-filter: blur(12px); 
        border-bottom: 1px solid #e2e8f0; 
        z-index: 9999; 
    }
    .nav-container { 
        max-width: 1400px; 
        margin: 0 auto; 
        padding: 0 3rem; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        height: 90px; 
    }

    /* Brand Wrapper: Prevents collision with nav items */
    .brand-wrapper {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        margin-right: 3rem;
    }

    /* Navigation: Forces links to the right */
    nav { 
        display: flex; 
        gap: 3rem; 
        align-items: center; 
        height: 100%; 
        margin-left: auto; 
    }
    
    .nav-group { 
        position: relative; 
        cursor: pointer; 
        display: flex; 
        align-items: center; 
        height: 100%; 
        white-space: nowrap; 
    }
    .nav-group-label { font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.12em; }
    .nav-group:hover .dropdown { display: block !important; }
    .nav-group.open .dropdown { display: block !important; }
    
    .dropdown { 
        display: none; 
        position: absolute; 
        top: 100%; 
        left: 0; 
        background: white; 
        border: 1px solid #e2e8f0; 
        border-radius: 0.5rem; 
        padding: 1rem 0; 
        min-width: 260px; 
        box-shadow: 0 30px 60px rgba(0,0,0,0.1); 
        z-index: 10000; 
        margin-top: -5px; 
    }
    .dropdown a { 
        display: block; 
        padding: 0.8rem 1.5rem; 
        text-decoration: none; 
        color: #475569; 
        font-size: 0.9rem; 
        font-weight: 700; 
        transition: 0.2s; 
    }
    .dropdown a:hover { background: #f8fafc; color: #020617; }

    footer { padding: 5rem 2rem; text-align: center; border-top: 1px solid #e2e8f0; background: #f8fafc; margin-top: auto; }
    .footer-links { display: flex; justify-content: center; gap: 4rem; flex-wrap: wrap; }
    .footer-links a { color: #64748b; text-decoration: none; font-weight: 700; font-size: 0.85rem; transition: color 0.2s; }
</style>
`;

const siteHeader = `
<header>
    <div class="nav-container">
        <div class="brand-wrapper">
            <a href="/" style="display: flex; align-items: center; gap: 15px; text-decoration: none;">
                <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect class="bar-rank" x="15" y="45" width="16" height="40" rx="2"/>
                    <rect class="bar-analyze" x="42" y="25" width="16" height="60" rx="2"/>
                    <rect class="bar-rate" x="69" y="55" width="16" height="30" rx="2"/>
                </svg>
                <div style="font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 900; letter-spacing: -0.04em; display: flex; line-height: 1; white-space: nowrap;">
                    <span style="color: #0f172a;">WEALTH</span><span style="color: #2563eb;">METER</span><span style="color: #0891b2;">.XYZ</span>
                </div>
            </a>
        </div>
        <nav>
            <div class="nav-group"><span class="nav-group-label label-rank">Rank</span>
                <div class="dropdown">
                    <a href="/">Global Wealth Rank</a>
                    <a href="global_ranker.html">Country-Specific Rank</a>
                    <a href="income_ranker.html">Income Percentile</a>
                    <a href="reports.html" style="color: #2563eb; border-top: 1px solid #e2e8f0; margin-top: 8px;">2026 Reports Hub</a>
                </div>
            </div>
            <div class="nav-group"><span class="nav-group-label label-rate">Rate</span>
                <div class="dropdown">
                    <a href="networth.html">Net Worth Calibration</a>
                    <a href="fire_timeline.html">FIRE Timeline Planner</a>
                    <a href="portfolio_alpha.html">Portfolio Alpha Simulator</a>
                    <a href="runway_lab.html">Financial Runway Lab</a>
                    <a href="reports.html" style="color: #2563eb; border-top: 1px solid #e2e8f0; margin-top: 8px;">2026 Reports Hub</a>
                </div>
            </div>
            <div class="nav-group"><span class="nav-group-label label-analyze">Analyze</span>
                <div class="dropdown">
                    <a href="global_explorer.html">Wealth Explorer</a>
                    <a href="atlas.html">Longevity Atlas</a>
                    <a href="data-lab.html">Data Lab</a>
                    <a href="reports.html" style="color: #2563eb; border-top: 1px solid #e2e8f0; margin-top: 8px;">2026 Reports Hub</a>
                </div>
            </div>
            <div class="nav-group"><span class="nav-group-label label-longform">Longform</span>
                <div class="dropdown">
                    <a href="longform.html">Longform Hub</a>
                    <a href="inheritance-illusion.html">The Inheritance Illusion</a>
                    <a href="dual-income-trap.html">The Dual-Income Trap</a>
                    <a href="inside-wealth-germany-japan-canada.html">Inside Wealth: DE, JP, CA</a>
                    <a href="equity-compensation-trap.html">The Equity Compensation Trap</a>
                    <a href="retirement-age-lie.html">The Retirement Age Lie</a>
                    <a href="longevity-capital-living-to-120.html">Longevity Capital</a>
                    <a href="compounding-gap-after-1m.html">The Compounding Gap After $1M</a>
                    <a href="ai-boom-portfolios-personal-wealth.html">AI Boom Portfolios</a>
                    <a href="rich-or-just-in-a-bubble.html">Are You Rich or Just in a Bubble?</a>
                    <a href="great-baseline-war.html">The Great Baseline War</a>
                    <a href="one-salary-three-futures.html">One Salary, Three Futures</a>
                    <a href="crypto-etf-wealth-effect.html">Crypto ETF Wealth Effect</a>
                    <a href="new-middle-class-trap.html">The New Middle-Class Trap</a>
                    <a href="inside-wealth-china-india.html">Inside Wealth in China + India</a>
                    <a href="realistic-projections-ubi.html">Realistic Projections on UBI</a>
                    <a href="reports.html" style="color: #2563eb; border-top: 1px solid #e2e8f0; margin-top: 8px;">2026 Reports Hub</a>
                </div>
            </div>
            <a href="https://lifemeter.xyz" target="_blank" style="font-weight:900; font-size:0.85rem; color:#FF4B4B; text-decoration:none; text-transform:uppercase; letter-spacing:0.12em; white-space: nowrap;">LifeMeter ↗</a>
        </nav>
    </div>
</header>`;

const siteFooter = `
<footer>
    <div class="footer-links">
        <a href="data-sources.html">Data Sources</a>
        <a href="methodology.html">Methodology</a>
        <a href="privacy.html">Privacy Policy</a>
        <a href="disclaimer.html">Disclaimer</a>
    </div>
</footer>`;

const longformRailStyles = `
<style>
    .wm-longform-rail {
        margin-top: 16px;
        padding: 12px 14px;
        border: 1px solid #dbe4f0;
        border-radius: 14px;
        background: rgba(248, 250, 252, 0.92);
    }
    .wm-longform-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
    }
    .wm-longform-eyebrow {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #64748b;
    }
    .wm-longform-all {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #2563eb;
        text-decoration: none;
        white-space: nowrap;
    }
    .wm-longform-window {
        min-height: 56px;
        overflow: hidden;
    }
    .wm-longform-link {
        display: block;
        text-decoration: none;
        color: #0f172a;
        transition: opacity 0.35s ease, transform 0.35s ease;
    }
    .wm-longform-window.is-swapping .wm-longform-link {
        opacity: 0.08;
        transform: translateY(8px);
    }
    .wm-longform-title {
        display: block;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.35;
        margin-bottom: 2px;
    }
    .wm-longform-desc {
        display: block;
        font-size: 12px;
        color: #64748b;
        line-height: 1.45;
    }
    .wm-longform-index {
        margin-top: 10px;
    }
    .wm-longform-index summary {
        cursor: pointer;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #64748b;
        list-style: none;
    }
    .wm-longform-index summary::-webkit-details-marker {
        display: none;
    }
    .wm-longform-list {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px 10px;
    }
    .wm-longform-list a {
        font-size: 12px;
        color: #334155;
        text-decoration: none;
        border-bottom: 1px solid rgba(51, 65, 85, 0.25);
    }
    .wm-longform-list a:hover {
        color: #2563eb;
        border-bottom-color: rgba(37, 99, 235, 0.5);
    }
    body.dark-mode .wm-longform-rail {
        background: rgba(15, 23, 42, 0.55);
        border-color: rgba(148, 163, 184, 0.35);
    }
    body.dark-mode .wm-longform-title {
        color: #e2e8f0;
    }
    body.dark-mode .wm-longform-desc,
    body.dark-mode .wm-longform-index summary {
        color: #94a3b8;
    }
    body.dark-mode .wm-longform-list a {
        color: #cbd5e1;
        border-bottom-color: rgba(148, 163, 184, 0.35);
    }
    @media (prefers-reduced-motion: reduce) {
        .wm-longform-link {
            transition: none;
        }
    }
</style>
`;

const longformRailArticles = [
    { href: "inheritance-illusion.html", title: "The Inheritance Illusion", desc: "Same inheritance headline, very different real resilience once liquidity is priced in." },
    { href: "dual-income-trap.html", title: "The Dual-Income Trap", desc: "Why two salaries can still produce weaker savings velocity and reserve depth." },
    { href: "inside-wealth-germany-japan-canada.html", title: "Inside Wealth: Germany, Japan, and Canada", desc: "What top-tier net worth means across three different asset cultures." },
    { href: "equity-compensation-trap.html", title: "The Equity Compensation Trap", desc: "How RSUs and ISOs can overstate wealth after tax and concentration risk." },
    { href: "retirement-age-lie.html", title: "The Retirement Age Lie", desc: "Why static retirement targets fail under current inflation and rate regimes." },
    { href: "longevity-capital-living-to-120.html", title: "Longevity Capital", desc: "How longer lifespans rewrite accumulation, drawdown, and transfer planning." },
    { href: "compounding-gap-after-1m.html", title: "The Compounding Gap After $1M", desc: "Why compounding becomes non-linear after access and capital-cost thresholds." },
    { href: "ai-boom-portfolios-personal-wealth.html", title: "AI Boom Portfolios", desc: "Capturing AI upside without allowing concentration to dominate your balance sheet." },
    { href: "rich-or-just-in-a-bubble.html", title: "Are You Rich or Just in a Bubble?", desc: "Reframing net worth through affordability and financing friction." },
    { href: "great-baseline-war.html", title: "The Great Baseline War", desc: "How population lens choice changes percentile interpretation." },
    { href: "one-salary-three-futures.html", title: "One Salary, Three Futures", desc: "The same income can compound very differently by city and cost base." },
    { href: "crypto-etf-wealth-effect.html", title: "Crypto ETF Wealth Effect", desc: "Separate temporary wealth effect from durable portfolio architecture." },
    { href: "new-middle-class-trap.html", title: "The New Middle-Class Trap", desc: "High earnings can coexist with fragile net worth conversion systems." },
    { href: "inside-wealth-china-india.html", title: "Inside Wealth in China + India", desc: "How ownership structure and access rails shape top-decile durability." },
    { href: "realistic-projections-ubi.html", title: "Realistic Projections on UBI", desc: "What policy trials imply for household planning under uncertainty." }
];

const longformRailTargets = {
    "/": [".glass-panel"],
    "/index.html": [".glass-panel"],
    "/global_ranker.html": [".input-card", ".results-container"],
    "/income_ranker.html": [".input-card", ".results-container"],
    "/networth.html": [".cta-section", ".summary-card"],
    "/fire_timeline.html": [".glass-panel"],
    "/portfolio_alpha.html": [".simulator-grid"],
    "/runway_lab.html": [".simulator-grid"]
};

function normalizePathname() {
    const raw = (window.location.pathname || "/").toLowerCase();
    if (raw.length > 1 && raw.endsWith("/")) return raw.slice(0, -1);
    return raw;
}

function shuffled(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

function mountLongformRail() {
    const path = normalizePathname();
    const targetSelectors = longformRailTargets[path];
    if (!targetSelectors || !longformRailArticles.length || document.getElementById("wm-longform-rail")) return;

    let anchor = null;
    for (const selector of targetSelectors) {
        const candidate = document.querySelector(selector);
        if (candidate) {
            anchor = candidate;
            break;
        }
    }
    if (!anchor) return;

    const rail = document.createElement("section");
    rail.id = "wm-longform-rail";
    rail.className = "wm-longform-rail";
    rail.setAttribute("aria-label", "Related longform articles");
    rail.innerHTML = `
        <div class="wm-longform-head">
            <span class="wm-longform-eyebrow">From Longform</span>
            <a class="wm-longform-all" href="longform.html">View all</a>
        </div>
        <div class="wm-longform-window" aria-live="polite">
            <a class="wm-longform-link" href="longform.html">
                <span class="wm-longform-title"></span>
                <span class="wm-longform-desc"></span>
            </a>
        </div>
        <details class="wm-longform-index">
            <summary>Browse all article links</summary>
            <div class="wm-longform-list"></div>
        </details>
    `;

    anchor.insertAdjacentElement("afterend", rail);

    const windowEl = rail.querySelector(".wm-longform-window");
    const linkEl = rail.querySelector(".wm-longform-link");
    const titleEl = rail.querySelector(".wm-longform-title");
    const descEl = rail.querySelector(".wm-longform-desc");
    const listEl = rail.querySelector(".wm-longform-list");

    longformRailArticles.forEach((article) => {
        const a = document.createElement("a");
        a.href = article.href;
        a.textContent = article.title;
        listEl.appendChild(a);
    });

    let order = shuffled(longformRailArticles);
    let cursor = 0;
    let paused = false;

    function renderArticle(article) {
        titleEl.textContent = article.title;
        descEl.textContent = article.desc;
        linkEl.href = article.href;
    }

    function nextArticle() {
        cursor += 1;
        if (cursor >= order.length) {
            order = shuffled(longformRailArticles);
            cursor = 0;
        }
        return order[cursor];
    }

    function rotate() {
        if (paused || document.hidden) return;
        windowEl.classList.add("is-swapping");
        window.setTimeout(() => {
            renderArticle(nextArticle());
            windowEl.classList.remove("is-swapping");
        }, 260);
    }

    renderArticle(order[cursor]);

    rail.addEventListener("mouseenter", () => { paused = true; });
    rail.addEventListener("mouseleave", () => { paused = false; });
    rail.addEventListener("focusin", () => { paused = true; });
    rail.addEventListener("focusout", () => { paused = false; });

    window.setInterval(rotate, 11000);
}

document.addEventListener("DOMContentLoaded", () => {
    document.head.insertAdjacentHTML("beforeend", sharedStyles);
    document.head.insertAdjacentHTML("beforeend", longformRailStyles);
    const headerEl = document.getElementById("header-placeholder");
    const footerEl = document.getElementById("footer-placeholder");
    if (headerEl) headerEl.innerHTML = siteHeader;
    if (footerEl) footerEl.innerHTML = siteFooter;
    mountLongformRail();
});
