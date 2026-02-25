// components.js - WealthMeter™ V25 Studio Standard

const sharedStyles = `
<style>
    :root {
        color-scheme: light;
        --base-font-size: 16px;
    }
    html {
        font-size: var(--base-font-size);
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
    }
    body { font-size: 1rem; }
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
    .nav-group-label { font-weight: 800; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.12em; }
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

    .global-theme-toggle {
        position: fixed;
        right: 18px;
        bottom: 18px;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(2, 6, 23, 0.15);
        z-index: 12000;
    }
    .global-theme-toggle:hover { transform: translateY(-1px); }

    body.dark-mode { 
        color-scheme: dark;
        --bg-body: #020617;
        --bg-gradient: radial-gradient(circle at 10% 20%, rgba(37,99,235,0.18) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(8,145,178,0.14) 0%, transparent 40%);
        --panel-bg: rgba(15,23,42,0.9);
        --panel-border: rgba(148,163,184,0.35);
        --panel-shadow: 0 40px 80px -20px rgba(0,0,0,0.72);
        --card-bg: rgba(30,41,59,0.55);
        --card-border: rgba(148,163,184,0.35);
        --text-main: #e2e8f0;
        --text-muted: #94a3b8;
        --input-bg: rgba(2,6,23,0.58);
        --input-border: rgba(148,163,184,0.35);
        --input-focus-bg: rgba(2,6,23,0.8);
        --flap-bg: #0f172a;
        --flap-text: #e2e8f0;
        --primary: #60a5fa;
    }
    body.dark-mode,
    body.dark-mode main,
    body.dark-mode section,
    body.dark-mode article { color: #e2e8f0; }
    body.dark-mode header { background: rgba(2, 6, 23, 0.94); border-bottom-color: #334155; }
    body.dark-mode footer { background: #0b1220; border-top-color: #334155; }
    body.dark-mode footer .footer-links a { color: #cbd5e1; }
    body.dark-mode footer .footer-links a:hover { color: #f8fafc; }
    body.dark-mode .dropdown { background: #0f172a; border-color: #334155; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
    body.dark-mode .dropdown a { color: #cbd5e1; }
    body.dark-mode .dropdown a:hover { background: #1e293b; color: #f8fafc; }
    body.dark-mode .global-theme-toggle { background: #0f172a; border-color: #334155; color: #f8fafc; }

    /* Readability guardrails for content templates with hard-coded light-mode text colors. */
    body.dark-mode main h1,
    body.dark-mode main h2,
    body.dark-mode main h3,
    body.dark-mode main h4,
    body.dark-mode main h5,
    body.dark-mode main h6,
    body.dark-mode .article h1,
    body.dark-mode .article h2,
    body.dark-mode .article h3,
    body.dark-mode .article h4,
    body.dark-mode .article h5,
    body.dark-mode .article h6,
    body.dark-mode .content-container h1,
    body.dark-mode .content-container h2,
    body.dark-mode .content-container h3,
    body.dark-mode .content-container h4,
    body.dark-mode .content-container h5,
    body.dark-mode .content-container h6,
    body.dark-mode .container h1,
    body.dark-mode .container h2,
    body.dark-mode .container h3,
    body.dark-mode .container h4,
    body.dark-mode .container h5,
    body.dark-mode .container h6 { color: #f8fafc !important; }
    body.dark-mode main p,
    body.dark-mode main li,
    body.dark-mode main dd,
    body.dark-mode main dt,
    body.dark-mode main blockquote,
    body.dark-mode .article p,
    body.dark-mode .article li,
    body.dark-mode .article dd,
    body.dark-mode .article dt,
    body.dark-mode .article blockquote,
    body.dark-mode .content-container p,
    body.dark-mode .content-container li,
    body.dark-mode .content-container dd,
    body.dark-mode .content-container dt,
    body.dark-mode .content-container blockquote,
    body.dark-mode .container p,
    body.dark-mode .container li,
    body.dark-mode .container dd,
    body.dark-mode .container dt,
    body.dark-mode .container blockquote { color: #cbd5e1 !important; }
    body.dark-mode main label,
    body.dark-mode .article label,
    body.dark-mode .content-container label,
    body.dark-mode .container label { color: #94a3b8 !important; }
    body.dark-mode main strong,
    body.dark-mode main b,
    body.dark-mode main em,
    body.dark-mode article strong,
    body.dark-mode article b,
    body.dark-mode article em,
    body.dark-mode .article strong,
    body.dark-mode .article b,
    body.dark-mode .article em,
    body.dark-mode .container strong,
    body.dark-mode .container b,
    body.dark-mode .container em { color: #f8fafc !important; }
    body.dark-mode main h2,
    body.dark-mode .article h2,
    body.dark-mode .content-container h2 { border-top-color: #334155 !important; }
    body.dark-mode main a,
    body.dark-mode .article a,
    body.dark-mode .content-container a { color: #93c5fd; }
    body.dark-mode main .card,
    body.dark-mode main .panel,
    body.dark-mode main .glass-panel,
    body.dark-mode main .highlight-box,
    body.dark-mode main .longevity-dashboard,
    body.dark-mode main .diagnostic-card,
    body.dark-mode .longevity-dashboard,
    body.dark-mode .diagnostic-card,
    body.dark-mode .highlight-box,
    body.dark-mode .summary,
    body.dark-mode .card {
        background: #0f172a !important;
        border-color: #334155 !important;
        color: #e2e8f0 !important;
    }
    body.dark-mode .hero-section {
        background: #020617 !important;
        border-bottom-color: #334155 !important;
    }
    body.dark-mode .hero-text p,
    body.dark-mode .help-text,
    body.dark-mode .subtitle,
    body.dark-mode .tutorial-meta,
    body.dark-mode .main-subtitle,
    body.dark-mode .secondary-subtitle { color: #94a3b8 !important; }
    body.dark-mode .callout,
    body.dark-mode main .callout,
    body.dark-mode article .callout,
    body.dark-mode .article .callout,
    body.dark-mode .container .callout {
        background: linear-gradient(130deg, #0f172a, #111c33) !important;
        border-left-color: #22d3ee !important;
    }
    body.dark-mode .callout p { color: #cbd5e1 !important; }
    body.dark-mode .btn-action {
        background: #1d4ed8 !important;
        color: #f8fafc !important;
        border: 1px solid #1d4ed8 !important;
    }
    body.dark-mode .btn-action:hover { background: #2563eb !important; }
    body.dark-mode .disclaimer-box {
        background: #3b0a0a !important;
        border-color: #7f1d1d !important;
        color: #fecaca !important;
    }

    body.dark-mode input,
    body.dark-mode select,
    body.dark-mode textarea {
        background-color: var(--input-bg) !important;
        color: var(--text-main) !important;
        border-color: var(--input-border) !important;
    }
    body.dark-mode [style*="background: white"],
    body.dark-mode [style*="background:#fff"],
    body.dark-mode [style*="background: #fff"],
    body.dark-mode [style*="background:#ffffff"],
    body.dark-mode [style*="background: #ffffff"],
    body.dark-mode [style*="background:#f8fafc"],
    body.dark-mode [style*="background: #f8fafc"],
    body.dark-mode [style*="background:#f1f5f9"],
    body.dark-mode [style*="background: #f1f5f9"] {
        background: #0f172a !important;
    }
    body.dark-mode [style*="color:#0f172a"],
    body.dark-mode [style*="color: #0f172a"],
    body.dark-mode [style*="color:#020617"],
    body.dark-mode [style*="color: #020617"],
    body.dark-mode [style*="color:#1e293b"],
    body.dark-mode [style*="color: #1e293b"],
    body.dark-mode [style*="color:#334155"],
    body.dark-mode [style*="color: #334155"],
    body.dark-mode [style*="color:#475569"],
    body.dark-mode [style*="color: #475569"] {
        color: #e2e8f0 !important;
    }

    @media (max-width: 1024px) {
        header { position: relative; }
        .nav-container { height: auto; min-height: 72px; padding: 0.75rem 1rem; flex-direction: column; align-items: flex-start; gap: 0.75rem; }
        nav {
            width: 100%;
            gap: 1rem;
            overflow-x: auto;
            padding-bottom: 0.25rem;
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        nav::-webkit-scrollbar { display: none; }
        .nav-group { height: auto; }
        .nav-group-label { font-size: 0.72rem; }
        .dropdown {
            position: fixed;
            left: 1rem;
            right: 1rem;
            top: 76px;
            min-width: 0;
            max-height: 68vh;
            overflow-y: auto;
            margin-top: 0;
        }
        .dropdown a { font-size: 0.95rem; }
    }
</style>
`;

const siteHeader = `
<header>
    <div class="nav-container">
        <div class="brand-wrapper">
            <a href="index.html" style="display: flex; align-items: center; gap: 15px; text-decoration: none;">
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
                    <a href="index.html">Global Wealth Rank</a>
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
                    <a href="longform.html" style="color: #2563eb; font-weight: 800;">Longform Hub</a>
                    <a href="ai-boom-portfolios-personal-wealth.html">AI Boom Portfolio Reality Map</a>
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
            <a href="https://lifemeter.xyz" target="_blank" style="font-weight:900; font-size:0.9rem; color:#FF4B4B; text-decoration:none; text-transform:uppercase; letter-spacing:0.12em; white-space: nowrap;">LifeMeter ↗</a>
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

function syncThemeToggleVisual(toggleEl) {
    if (!toggleEl) return;
    const dark = document.body.classList.contains("dark-mode");
    toggleEl.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    toggleEl.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
    if (toggleEl.classList.contains("global-theme-toggle") || !toggleEl.querySelector("svg")) {
        toggleEl.textContent = dark ? "☀" : "☾";
    }
}

function syncAllThemeToggles() {
    document.querySelectorAll(".global-theme-toggle, .theme-toggle").forEach(syncThemeToggleVisual);
}

function applyTheme(mode) {
    const dark = mode === "dark";
    document.body.classList.toggle("dark-mode", dark);
    localStorage.setItem("wealthmeter_theme", dark ? "dark" : "light");
    syncAllThemeToggles();
}

function toggleTheme() {
    const dark = document.body.classList.contains("dark-mode");
    applyTheme(dark ? "light" : "dark");
}

document.addEventListener("DOMContentLoaded", () => {
    document.head.insertAdjacentHTML("beforeend", sharedStyles);
    const headerEl = document.getElementById("header-placeholder");
    const footerEl = document.getElementById("footer-placeholder");
    if (headerEl) headerEl.innerHTML = siteHeader;
    if (footerEl) footerEl.innerHTML = siteFooter;

    const savedTheme = localStorage.getItem("wealthmeter_theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    document.querySelectorAll(".theme-toggle").forEach((toggleEl) => {
        toggleEl.removeAttribute("onclick");
        if (toggleEl.dataset.themeToggleBound === "1") return;
        toggleEl.addEventListener("click", (event) => {
            event.preventDefault();
            toggleTheme();
        });
        toggleEl.dataset.themeToggleBound = "1";
    });

    let globalToggle = document.querySelector(".global-theme-toggle");
    if (!globalToggle) {
        globalToggle = document.createElement("button");
        globalToggle.className = "global-theme-toggle";
        globalToggle.type = "button";
        document.body.appendChild(globalToggle);
    }
    if (globalToggle.dataset.themeToggleBound !== "1") {
        globalToggle.addEventListener("click", (event) => {
            event.preventDefault();
            toggleTheme();
        });
        globalToggle.dataset.themeToggleBound = "1";
    }
    syncAllThemeToggles();

    // Touch/mobile support: tap nav label to open/close dropdown menus.
    if (window.matchMedia("(max-width: 1024px)").matches) {
        const groups = Array.from(document.querySelectorAll(".nav-group"));
        groups.forEach((group) => {
            group.addEventListener("click", (event) => {
                event.stopPropagation();
                const wasOpen = group.classList.contains("open");
                groups.forEach((g) => g.classList.remove("open"));
                if (!wasOpen) group.classList.add("open");
            });
        });
        document.addEventListener("click", () => {
            groups.forEach((g) => g.classList.remove("open"));
        });
    }

    // Keep backward compatibility for pages using inline onclick="toggleTheme()".
    window.toggleTheme = toggleTheme;
});
