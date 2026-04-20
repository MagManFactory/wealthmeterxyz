// lifemeter-components.js - LifeMeter™ V25 Production Standard
const NAV_BUILD = "2026-02-18.10";

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
    @keyframes heartbeat {
        0% { transform: scale(1); }
        14% { transform: scale(1.12); }
        28% { transform: scale(1); }
        42% { transform: scale(1.12); }
        70% { transform: scale(1); }
    }
    .logo-heart { animation: heartbeat 1.5s ease-in-out infinite; transform-origin: center; }

    .label-calibrate { color: #00bcd4 !important; }
    .label-survive { color: #FF4B4B !important; }
    .label-analyze { color: #0056b3 !important; }
    .label-learn { color: #10b981 !important; }
    .label-reports { color: #6366f1 !important; }
    .label-longform { color: #0ea5e9 !important; }

    .nav-group:hover .dropdown { display: block !important; }
    .nav-group.open .dropdown { display: block !important; }
    .dropdown {
        display: none; position: absolute; top: 100%; left: 0;
        background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem;
        padding: 1rem 0; min-width: 280px; box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        z-index: 10000; margin-top: -5px;
    }
    .dropdown a { display: block; padding: 0.75rem 1.5rem; text-decoration: none; color: #475569; font-size: 0.9rem; font-weight: 600; transition: background 0.2s; }
    .dropdown a.link-report { color: #0056b3 !important; font-weight: 900; background: rgba(0, 86, 179, 0.04); }
    
    /* ORANGE COMMAND CENTER STYLE */
    .dropdown a.link-command { 
        color: #ff9800 !important; 
        font-weight: 900; 
        border-top: 1px solid #f1f5f9; 
        margin-top: 4px;
        background: rgba(255, 152, 0, 0.03);
    }
    
    .dropdown a:hover { background: #f8fafc; color: #020617; }

    header { width: 100%; position: sticky; top: 0; background: rgba(255,255,255,0.98); backdrop-filter: blur(12px); border-bottom: 1px solid #e2e8f0; z-index: 9999; }
    .nav-container { max-width: 1400px; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; height: 80px; }
    nav { display: flex; gap: 2.5rem; align-items: center; height: 100%; margin-left: auto; }
    .nav-group { position: relative; cursor: pointer; display: flex; align-items: center; height: 100%; white-space: nowrap; }
    .nav-group-label { font-weight: 800; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; }

    footer { padding: 4rem 2rem; text-align: center; border-top: 1px solid #e2e8f0; background: white; margin-top: auto; }
    .footer-links { 
        display: flex; 
        justify-content: center; 
        gap: 3rem; 
        flex-wrap: wrap; 
    }
    .footer-links a { 
        color: #475569; 
        text-decoration: none; 
        font-weight: 800; 
        font-size: 1.1rem; 
        transition: color 0.2s; 
    }
    .footer-links a:hover { color: #020617; }

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
        box-shadow: 0 10px 24px rgba(2, 6, 23, 0.18);
        z-index: 12000;
    }
    .global-theme-toggle:hover { transform: translateY(-1px); }

    body.dark-mode {
        color-scheme: dark;
        --primary: #60a5fa;
        --accent: #22d3ee;
        --dark: #e2e8f0;
        --slate: #94a3b8;
        --border: #334155;
        --bg-subtle: #0f172a;
    }
    body.dark-mode,
    body.dark-mode main,
    body.dark-mode section,
    body.dark-mode article { background-color: #020617; color: #e2e8f0; }
    body.dark-mode header { background: rgba(2,6,23,0.94); border-bottom-color: #334155; }
    body.dark-mode footer { background: #0b1220; border-top-color: #334155; }
    body.dark-mode footer .footer-links a { color: #cbd5e1; }
    body.dark-mode footer .footer-links a:hover { color: #f8fafc; }
    body.dark-mode .dropdown { background: #0f172a; border-color: #334155; box-shadow: 0 20px 40px rgba(0,0,0,0.45); }
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
    body.dark-mode .container .callout,
    body.dark-mode [class*="callout"],
    body.dark-mode [class*="insight"],
    body.dark-mode [class*="takeaway"] {
        background: linear-gradient(130deg, #0f172a, #111c33) !important;
        border-left-color: #22d3ee !important;
        border-color: #334155 !important;
    }
    body.dark-mode .callout p,
    body.dark-mode [class*="callout"] p,
    body.dark-mode [class*="insight"] p,
    body.dark-mode [class*="takeaway"] p { color: #e2e8f0 !important; }
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
    body.dark-mode .stage-card,
    body.dark-mode .sidebar,
    body.dark-mode .timeline-container,
    body.dark-mode .metric-box,
    body.dark-mode .lev-toggle {
        background: #0f172a !important;
        border-color: #334155 !important;
        color: #e2e8f0 !important;
        box-shadow: none !important;
    }
    body.dark-mode .c-btn { color: #cbd5e1 !important; }
    body.dark-mode .c-btn:hover { background: #1e293b !important; }
    body.dark-mode .c-btn.active { background: #1d4ed8 !important; color: #f8fafc !important; }
    body.dark-mode .region-head,
    body.dark-mode .m-label,
    body.dark-mode .axis-row,
    body.dark-mode .main-stat-label,
    body.dark-mode .lev-opt { color: #94a3b8 !important; }
    body.dark-mode .lev-opt.active { background: #1e293b !important; color: #f8fafc !important; }
    body.dark-mode .lev-opt.active-lev { background: #7c3aed !important; color: #f8fafc !important; }
    body.dark-mode .ribbon-track { background: #1e293b !important; }

    body.dark-mode input,
    body.dark-mode select,
    body.dark-mode textarea {
        background-color: #0b1220 !important;
        border-color: #334155 !important;
        color: #e2e8f0 !important;
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

        /* Calculator and guide mobile layout fixes */
        main { padding-left: 1rem !important; padding-right: 1rem !important; }
        .hero-section { padding: 2rem 1rem !important; }
        .hero-content { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
        .hero-text h1 { font-size: clamp(2.2rem, 11vw, 3.4rem) !important; line-height: 1.02 !important; }
        .hero h1 { font-size: clamp(2rem, 10vw, 3rem) !important; line-height: 1.08 !important; }
        .hero-text p,
        .hero p { font-size: 1rem !important; max-width: 100% !important; }

        .longevity-dashboard,
        .diagnostic-card,
        .glass-panel { padding: 1.25rem !important; border-radius: 1rem !important; box-shadow: none !important; }

        .input-grid,
        .tool-list,
        .comparison-grid,
        .crawl-grid { grid-template-columns: 1fr !important; }
        .full { grid-column: auto !important; }
        .input-group input,
        .input-group select,
        input,
        select,
        textarea { font-size: 16px !important; }

        body.system-active .aeronautical-terminal { padding: 1rem !important; max-height: 920px !important; }
        .terminal-viewport { grid-template-columns: 1fr !important; gap: 1rem !important; padding: 1rem !important; }
        .flap-row { padding: 0.45rem 0.75rem !important; gap: 0.5rem !important; }
        .intel-stream { height: 150px !important; }

        .disclaimer-box,
        .safety-alert { margin: 2rem 1rem 1rem !important; padding: 1rem !important; text-align: left !important; }
        .safety-alert { flex-direction: column !important; gap: 0.75rem !important; }

        .step-card { grid-template-columns: 1fr !important; gap: 1rem !important; padding: 1.25rem !important; border-radius: 1rem !important; }
        .step-info h2 { font-size: 1.6rem !important; }
        .step-content p { font-size: 1rem !important; }
        .container { padding: 1.25rem 1rem !important; }
        .page-header { margin-bottom: 1.25rem !important; }
        .page-title { font-size: clamp(1.9rem, 9vw, 2.5rem) !important; line-height: 1.08 !important; }
        .stage-card { padding: 1rem !important; border-radius: 1rem !important; }
        .country-head {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
            margin-bottom: 1.2rem !important;
        }
        .name-lockup { gap: 0.75rem !important; }
        .big-flag { font-size: 2.2rem !important; }
        .c-name { font-size: clamp(1.35rem, 8vw, 2rem) !important; line-height: 1.08 !important; }
        .timeline-container { padding: 1rem !important; border-radius: 1rem !important; margin-bottom: 1rem !important; }
        .main-stat { text-align: left !important; }
        .main-stat-val { font-size: 2.3rem !important; }
        .ribbon-track { height: 56px !important; }
        .segment { font-size: 0.62rem !important; padding: 0 4px !important; }
        .metrics-grid { grid-template-columns: 1fr !important; gap: 0.75rem !important; margin-top: 1rem !important; }
        .metric-box { padding: 1rem !important; }
        .m-val { font-size: 1.8rem !important; }
        .sidebar {
            position: static !important;
            top: auto !important;
            max-height: none !important;
            padding: 1rem !important;
        }
        .c-btn { padding: 0.75rem 0.85rem !important; font-size: 0.82rem !important; }
        .region-head { margin: 0.8rem 0 0.45rem !important; }

        .hud-wrapper { right: 12px !important; bottom: 12px !important; }
        .hud-main { max-width: 52px !important; padding: 12px !important; border-radius: 50% !important; }
        .hud-main .hud-text,
        .hud-main .hud-close { display: none !important; }

        #simOverlay { padding: 1rem !important; overflow-y: auto !important; }
        #simOverlay .terminal-box { width: 100% !important; max-width: 560px !important; }
        #simOverlay .results-container { width: 100% !important; padding: 1rem 0 !important; }
        #simOverlay .flip-display { width: min(42vw, 170px) !important; height: 130px !important; padding: 1rem !important; }
        #simOverlay .flip-val { font-size: 2.5rem !important; }
        #simOverlay .btn-close-overlay { width: 100% !important; padding: 1rem 1.25rem !important; }
        #simOverlay [style*="display: flex"][style*="justify-content: center"] { flex-wrap: wrap !important; gap: 1rem !important; }
    }

    @media (max-width: 640px) {
        .hero-section { padding: 1.5rem 0.85rem !important; }
        .hero-text h1 { font-size: clamp(1.9rem, 10vw, 2.6rem) !important; }
        .panel-label { font-size: 0.68rem !important; }
        .input-group label { font-size: 0.62rem !important; }
        .btn-action { padding: 1.1rem !important; font-size: 0.86rem !important; }
        .terminal-viewport { padding: 0.85rem !important; }
        .flap-text { font-size: 0.68rem !important; }
        .intel-item { font-size: 0.64rem !important; }
        .disclaimer-box,
        .safety-alert { font-size: 0.78rem !important; }
    }

    .lm-longform-rail {
        margin-top: 16px;
        padding: 12px 14px;
        border: 1px solid #dbe4f0;
        border-radius: 14px;
        background: rgba(248, 250, 252, 0.94);
    }
    .lm-longform-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 9px;
    }
    .lm-longform-eyebrow {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #64748b;
    }
    .lm-longform-all {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #0056b3;
        text-decoration: none;
    }
    .lm-longform-window {
        min-height: 56px;
        overflow: hidden;
    }
    .lm-longform-link {
        display: block;
        text-decoration: none;
        color: #0f172a;
        transition: opacity 0.35s ease, transform 0.35s ease;
    }
    .lm-longform-window.is-swapping .lm-longform-link {
        opacity: 0.08;
        transform: translateY(8px);
    }
    .lm-longform-title {
        display: block;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.35;
        margin-bottom: 2px;
    }
    .lm-longform-desc {
        display: block;
        font-size: 12px;
        color: #64748b;
        line-height: 1.45;
    }
    .lm-longform-index {
        margin-top: 10px;
    }
    .lm-longform-index summary {
        cursor: pointer;
        list-style: none;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #64748b;
    }
    .lm-longform-index summary::-webkit-details-marker { display: none; }
    .lm-longform-list {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px 10px;
    }
    .lm-longform-list a {
        font-size: 12px;
        text-decoration: none;
        color: #334155;
        border-bottom: 1px solid rgba(51, 65, 85, 0.25);
    }
    .lm-longform-list a:hover {
        color: #0056b3;
        border-bottom-color: rgba(0, 86, 179, 0.45);
    }
    body.dark-mode .lm-longform-rail {
        background: rgba(15, 23, 42, 0.6);
        border-color: #334155;
    }
    body.dark-mode .lm-longform-title { color: #f8fafc; }
    body.dark-mode .lm-longform-desc,
    body.dark-mode .lm-longform-eyebrow,
    body.dark-mode .lm-longform-index summary { color: #94a3b8; }
    body.dark-mode .lm-longform-list a {
        color: #cbd5e1;
        border-bottom-color: rgba(148, 163, 184, 0.35);
    }
    @media (prefers-reduced-motion: reduce) {
        .lm-longform-link { transition: none; }
    }

</style>
`;

const siteHeader = `
<header>
    <div class="nav-container">
        <div class="brand-wrapper">
            <a href="index.html" style="display: flex; align-items: center; gap: 12px; text-decoration: none;">
                <svg class="logo-heart" width="32" height="32" viewBox="0 0 24 24" fill="#FF4B4B" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <div style="font-size: 26px; font-weight: 900; letter-spacing: -0.05em; display: flex; line-height: 1; white-space: nowrap;">
                    <span style="color: #0056b3;">LIFE</span><span style="color: #FF4B4B;">METER</span><span style="color: #00bcd4;">.XYZ</span>
                </div>
            </a>
        </div>

        <nav>
            <div class="nav-group"><span class="nav-group-label label-calibrate">Calibrate</span>
                <div class="dropdown">
                    <a href="lev-preparedness.html">LEV Preparedness</a>
                    <a href="bioage.html">Bio Age</a>
                    <a href="expanded-bioage-survey.html">Expanded BioAge Survey</a>
                    <a href="biomarker-trend-analyzer.html">Biomarker Trend Analyzer</a>
                    <a href="invisible-age.html">Invisible Age</a>
                    <a href="functional-resilience.html">Functional Resilience</a>
                    <a href="wearable-synthesis.html">Wearable Synthesis</a>
                    <a href="commandcenterguidedot.html" class="link-command">Command Center</a>
                </div>
            </div>

            <div class="nav-group"><span class="nav-group-label label-survive">Survive</span>
                <div class="dropdown">
                    <a href="levbridge.html">LEV Bridge</a>
                    <a href="insolvency.html">Insolvency</a>
                    <a href="medical-black-swan.html">Medical Black Swan</a>
                    <a href="extreme-inflation.html">Extreme Inflation</a>
                    <a href="singularity-sequence.html">Singularity Sequence</a>
                    <a href="commandcenterguidedot.html" class="link-command">Command Center</a>
                </div>
            </div>

            <div class="nav-group"><span class="nav-group-label label-analyze">Analyze</span>
                <div class="dropdown">
                    <a href="indhorizon.html">The Independence Horizon</a>
                    <a href="atlas.html">Global Data Atlas</a>
                    <a href="health-wealth-mismatch.html">Mismatch Analyzer</a>
                    <a href="sync-paradox.html">Sync Paradox</a>
                    <a href="global-lev-index.html">Global LEV Index</a>
                    <a href="commandcenterguidedot.html" class="link-command">Command Center</a>
                </div>
            </div>

            <div class="nav-group"><span class="nav-group-label label-learn">Learn</span>
                <div class="dropdown">
                    <a href="tutorial-1-bridge-strategy.html">1. Bridge Strategy</a>
                    <a href="tutorial-2-lev-primer.html">2. LEV Primer</a>
                    <a href="tutorial-3-death-gap.html">3. The Death Gap</a>
                    <a href="tutorial-4-financial-planning.html">4. Financial Planning</a>
                    <a href="tutorial-5-biomarkers.html">5. Biomarkers</a>
                    <a href="commandcenterguidedot.html" class="link-command">Command Center</a>
                </div>
            </div>

            <div class="nav-group"><span class="nav-group-label label-reports">Reports</span>
                <div class="dropdown">
                    <a href="longevity-evidence-briefs.html">Longevity Evidence Briefs</a>
                    <a href="report-longevity-horizon.html">2026 Longevity Horizon Report</a>
                    <a href="report-biomarker-essentials.html">Biomarker Essentials Guide</a>
                    <a href="report-biomarker-mastery.html">Premium Biomarker Mastery Guide</a>
                    <a href="reports.html" class="link-report">Strategic Intelligence Hub</a>
                    <a href="commandcenterguidedot.html" class="link-command">Command Center</a>
                </div>
            </div>

            <div class="nav-group"><span class="nav-group-label label-longform">Longform</span>
                <div class="dropdown">
                    <a href="longform.html" class="link-report">Longform Hub</a>
                    <a href="hallmarks-of-aging-revisited-what-changed-since-2013.html">Hallmarks of Aging Revisited</a>
                    <a href="regulatory-barriers-to-anti-aging-drugs.html">Regulatory Barriers to Anti-Aging Drugs</a>
                    <a href="partial-cellular-reprogramming-reset-without-cancer-risk.html">Partial Cellular Reprogramming</a>
                    <a href="longevity-escape-velocity-realistic-or-misleading.html">Longevity Escape Velocity</a>
                    <a href="digital-twins-aging-predictive-biology-scale.html">Digital Twins for Aging</a>
                    <a href="extracellular-matrix-aging-forgotten-target.html">Extracellular Matrix Aging</a>
                    <a href="senomorphics-vs-senolytics-slowing-vs-removing-damage.html">Senomorphics vs Senolytics</a>
                    <a href="metformin-as-longevity-drug-evidence-vs-assumption.html">Metformin as a Longevity Drug</a>
                    <a href="yamanaka-factors-in-vivo-progress-constraints.html">Yamanaka Factors In Vivo</a>
                    <a href="nad-restoration-mechanism-hype-clinical-signal.html">NAD+ Restoration</a>
                    <a href="longevity-clinics-science-protocols-variability.html">Longevity Clinics</a>
                    <a href="is-aging-a-disease-or-an-adaptive-program.html">Is Aging a Disease?</a>
                    <a href="ai-designed-longevity-drugs-early-successes-limits.html">AI-Designed Longevity Drugs</a>
                    <a href="stem-cell-exhaustion-replenishment-strategies.html">Stem Cell Exhaustion Strategies</a>
                    <a href="caloric-restriction-mimetics-what-actually-works-humans.html">Caloric Restriction Mimetics</a>
                    <a href="partial-cellular-reprogramming-reset-without-cancer-risk.html">Partial Cellular Reprogramming</a>
                    <a href="alzheimers-biomarkers-outpace-treatment-2026.html">Alzheimer Biomarkers vs Drugs</a>
                    <a href="multivitamins-biological-aging-clocks.html">Multivitamins and Aging Clocks</a>
                    <a href="primary-care-alzheimers-pivot-blood-biomarkers.html">Primary-Care Alzheimer's Pivot</a>
                    <a href="oral-glp1-phase3-reality-convenience-adherence-longevity.html">Oral GLP-1 Phase 3 Reality</a>
                    <a href="intermittent-fasting-after-hype-cycle-2026.html">Intermittent Fasting After Hype</a>
                    <a href="dyslipidemia-2026-prevent-ascvd-lpa-apob.html">The 2026 Dyslipidemia Rewrite</a>
                    <a href="glp1-beyond-diabetes-cardiorenal-safety-boundaries.html">GLP-1 Beyond Type 2 Diabetes</a>
                    <a href="epigenetic-reprogramming-enters-human-trials.html">Epigenetic Reprogramming Trials</a>
                    <a href="ai-accelerated-drug-discovery-aging.html">AI-Accelerated Drug Discovery</a>
                    <a href="senolytics-clinical-translation.html">Senolytics in Translation</a>
                    <a href="glp1-drugs-as-longevity-bridge.html">GLP-1 as a Longevity Bridge</a>
                    <a href="ai-systems-biology-age-clocks.html">AI + Systems Biology Clocks</a>
                    <a href="biological-age-clocks-decision-tools.html">Biological Age Clocks as Decision Tools</a>
                    <a href="glp1-functional-age-weight-loss.html">GLP-1 and Functional Age</a>
                    <a href="did-ai-reverse-aging.html">Did AI Reverse Aging?</a>
                    <a href="one-injection-vs-lifetime-statins.html">One Injection vs Lifetime Statins</a>
                    <a href="alzheimers-blood-test-era.html">The Alzheimer's Blood Test Era</a>
                </div>
            </div>

            <a href="https://wealthmeter.xyz" target="_blank" style="font-weight:800; font-size:0.9rem; color:#0056b3; text-decoration:none;">WealthMeter</a>
        </nav>
    </div>
</header>
`;

const siteFooter = `
<footer>
    <div class="footer-links">
        <a href="privacy.html">Privacy Policy</a>
        <a href="methodology.html">Methodology</a>
        <a href="disclaimer.html">Disclaimer</a>
    </div>
</footer>
`;



const longformRailArticles = [
    { href: "caloric-restriction-mimetics-what-actually-works-humans.html", title: "Caloric Restriction Mimetics: What Actually Works in Humans", desc: "Some compounds move bounded human endpoints, but none has earned the stronger claim of true calorie-restriction replacement." },
    { href: "hallmarks-of-aging-revisited-what-changed-since-2013.html", title: "Hallmarks of Aging Revisited: What Changed Since 2013", desc: "The framework is stronger as a maintenance map, but it still does not rank human leverage points cleanly enough for broad clinical claims." },
    { href: "regulatory-barriers-to-anti-aging-drugs.html", title: "Regulatory Barriers to Anti-Aging Drugs", desc: "The biology can be plausible while the claim still fails because indication design, endpoints, and payer logic do not yet line up." },
    { href: "longevity-escape-velocity-realistic-or-misleading.html", title: "Longevity Escape Velocity: Realistic or Misleading?", desc: "LEV is a coherent strategic model for serial repair, but current biology does not justify treating it like a dated human countdown." },
    { href: "digital-twins-aging-predictive-biology-scale.html", title: "Digital Twins for Aging: Predictive Biology at Scale", desc: "Prediction stacks are improving fast, but causal intervention twins remain much less mature than the label implies." },
    { href: "extracellular-matrix-aging-forgotten-target.html", title: "Extracellular Matrix Aging: The Forgotten Target", desc: "The extracellular matrix is not background scaffold. It helps decide whether aging tissues can still repair, adapt, and respond to therapy." },
    { href: "senomorphics-vs-senolytics-slowing-vs-removing-damage.html", title: "Senomorphics vs Senolytics: Slowing vs Removing Damage", desc: "The real boundary in senescence medicine is when to suppress harmful signaling, when to remove the cell, and when neither move is yet justified." },
    { href: "metformin-as-longevity-drug-evidence-vs-assumption.html", title: "Metformin as a Longevity Drug: Evidence vs Assumption", desc: "Metformin is plausible and practical, but the strongest human evidence still sits below the broad longevity claim often made for it." },
    { href: "yamanaka-factors-in-vivo-progress-constraints.html", title: "Yamanaka Factors in Vivo: Progress and Constraints", desc: "The important shift is from whether reprogramming can work in animals to whether it can be controlled tightly enough for real therapy." },
    { href: "nad-restoration-mechanism-hype-clinical-signal.html", title: "NAD+ Restoration: Mechanism, Hype, and Clinical Signal", desc: "The pathway matters, but broad human anti-aging proof remains much thinner than precursor marketing suggests." },
    { href: "longevity-clinics-science-protocols-variability.html", title: "Longevity Clinics: Science, Protocols, and Variability", desc: "Most clinics combine evidence-based prevention with weaker aging-specific extrapolation and very different protocol logic." },
    { href: "is-aging-a-disease-or-an-adaptive-program.html", title: "Is Aging a Disease or an Adaptive Program?", desc: "Disease framing helps medicine, but the underlying biology still mixes damage, adaptation, and systems drift." },
    { href: "ai-designed-longevity-drugs-early-successes-limits.html", title: "AI-Designed Longevity Drugs: Early Successes and Limits", desc: "AI has improved the discovery funnel, but aging still bottlenecks at validation, endpoints, and regulation." },
    { href: "stem-cell-exhaustion-replenishment-strategies.html", title: "Stem Cell Exhaustion and Replenishment Strategies", desc: "Most realistic regeneration starts with niche repair and functional reset, not simple cell replacement." },
    { href: "partial-cellular-reprogramming-reset-without-cancer-risk.html", title: "Partial Cellular Reprogramming: Reset Without Cancer Risk?", desc: "The field has moved beyond the first teratoma scare, but it still lives inside a narrow safety window." },
    { href: "alzheimers-biomarkers-outpace-treatment-2026.html", title: "Alzheimer Biomarkers Are Moving Faster Than Alzheimer Drugs", desc: "Blood tests are improving fast, but March 2026 treatment data still imposes hard limits." },
    { href: "primary-care-alzheimers-pivot-blood-biomarkers.html", title: "The Primary-Care Alzheimer's Pivot", desc: "How blood biomarkers change triage speed, referral flow, and diagnostic boundaries." },
    { href: "oral-glp1-phase3-reality-convenience-adherence-longevity.html", title: "Oral GLP-1 Enters Phase 3 Reality", desc: "Convenience helps, but persistence economics and discontinuation risk still dominate outcomes." },
    { href: "intermittent-fasting-after-hype-cycle-2026.html", title: "Intermittent Fasting After the Hype Cycle", desc: "What 2026 evidence supports, what remains overstated, and how to decide quickly." },
    { href: "dyslipidemia-2026-prevent-ascvd-lpa-apob.html", title: "The 2026 Dyslipidemia Rewrite", desc: "PREVENT, apoB, Lp(a), and longer-horizon exposure logic for prevention strategy." },
    { href: "glp1-beyond-diabetes-cardiorenal-safety-boundaries.html", title: "GLP-1 Beyond Type 2 Diabetes", desc: "Cardiorenal signals, safety boundaries, and control of off-label drift risk." },
    { href: "epigenetic-reprogramming-enters-human-trials.html", title: "Epigenetic Reprogramming Enters Human Trials", desc: "From preclinical reset logic to first-in-human endpoint discipline." },
    { href: "ai-accelerated-drug-discovery-aging.html", title: "AI-Accelerated Drug Discovery in Aging", desc: "Discovery compression is real, but clinical bottlenecks still set timelines." },
    { href: "senolytics-clinical-translation.html", title: "Senolytics Moving into Clinical Translation", desc: "Where senolytic evidence is strong and what is still missing in humans." },
    { href: "glp1-drugs-as-longevity-bridge.html", title: "GLP-1 Drugs as Potential Longevity Agents", desc: "A near-term bridge if lean mass and function are actively protected." },
    { href: "ai-systems-biology-age-clocks.html", title: "AI + Systems Biology for Biological Age Clocks", desc: "Convert clock data into repeatable decisions with functional anchors." },
    { href: "biological-age-clocks-decision-tools.html", title: "Biological Age Clocks as Decision Tools", desc: "Use clocks as instruments inside a repeatable control loop, not as standalone truth." },
    { href: "glp1-functional-age-weight-loss.html", title: "GLP-1 and Functional Age", desc: "Preserve lean mass and fitness while targeting metabolic gains." },
    { href: "did-ai-reverse-aging.html", title: "Did AI Reverse Aging?", desc: "Separate validated progress from extrapolated timeline claims." },
    { href: "one-injection-vs-lifetime-statins.html", title: "One Injection vs Lifetime Statins", desc: "How evidence maturity differs between genomic lipid editing and standard care." },
    { href: "alzheimers-blood-test-era.html", title: "The Alzheimer's Blood Test Era", desc: "What blood biomarkers change in care pathways and what still requires confirmatory context." }
];

const longformRailTargets = {
    "/": [".longevity-dashboard"],
    "/index.html": [".longevity-dashboard"],
    "/levbridge": [".longevity-dashboard"],
    "/levbridge.html": [".longevity-dashboard"],
    "/insolvency": [".longevity-dashboard"],
    "/insolvency.html": [".longevity-dashboard"],
    "/medical-black-swan": [".longevity-dashboard"],
    "/medical-black-swan.html": [".longevity-dashboard"],
    "/extreme-inflation": [".longevity-dashboard"],
    "/extreme-inflation.html": [".longevity-dashboard"],
    "/singularity-sequence": [".longevity-dashboard"],
    "/singularity-sequence.html": [".longevity-dashboard"],
    "/bioage": [".longevity-dashboard"],
    "/bioage.html": [".longevity-dashboard"],
    "/expanded-bioage-survey": [".summary-card"],
    "/expanded-bioage-survey.html": [".summary-card"],
    "/sync-paradox": [".longevity-dashboard"],
    "/sync-paradox.html": [".longevity-dashboard"],
    "/indhorizon": [".stage-card"],
    "/indhorizon.html": [".stage-card"],
    "/global-lev-index": [".longevity-dashboard"],
    "/global-lev-index.html": [".longevity-dashboard"],
    "/biomarker-trend-analyzer": ["#entryGrid"],
    "/biomarker-trend-analyzer.html": ["#entryGrid"],
    "/health-wealth-mismatch": [".longevity-dashboard"],
    "/health-wealth-mismatch.html": [".longevity-dashboard"],
    "/longevityquiz": ["#intro-screen"],
    "/longevityquiz.html": ["#intro-screen"]
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
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

function mountLongformRail() {
    const path = normalizePathname();
    const targetSelectors = longformRailTargets[path];
    if (!targetSelectors || !longformRailArticles.length || document.getElementById("lm-longform-rail")) return;

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
    rail.id = "lm-longform-rail";
    rail.className = "lm-longform-rail";
    rail.setAttribute("aria-label", "Related longform articles");
    rail.innerHTML = `
        <div class="lm-longform-head">
            <span class="lm-longform-eyebrow">From Longform</span>
            <a class="lm-longform-all" href="longform.html">View all</a>
        </div>
        <div class="lm-longform-window" aria-live="polite">
            <a class="lm-longform-link" href="longform.html">
                <span class="lm-longform-title"></span>
                <span class="lm-longform-desc"></span>
            </a>
        </div>
        <details class="lm-longform-index">
            <summary>Browse all article links</summary>
            <div class="lm-longform-list"></div>
        </details>
    `;

    anchor.insertAdjacentElement("afterend", rail);

    const windowEl = rail.querySelector(".lm-longform-window");
    const linkEl = rail.querySelector(".lm-longform-link");
    const titleEl = rail.querySelector(".lm-longform-title");
    const descEl = rail.querySelector(".lm-longform-desc");
    const listEl = rail.querySelector(".lm-longform-list");

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
    localStorage.setItem("lifemeter_theme", dark ? "dark" : "light");
    syncAllThemeToggles();
}

function toggleTheme() {
    const dark = document.body.classList.contains("dark-mode");
    applyTheme(dark ? "light" : "dark");
}

// Mobile compatibility: some browsers throw on object-form scrollTo.
// Provide a resilient wrapper so calculator actions never fail on tap.
(() => {
    if (typeof window === "undefined" || typeof window.scrollTo !== "function") return;
    const nativeScrollTo = window.scrollTo.bind(window);
    window.scrollTo = (arg1, arg2) => {
        if (arg1 && typeof arg1 === "object") {
            const left = Number.isFinite(arg1.left) ? arg1.left : (Number.isFinite(arg1.x) ? arg1.x : 0);
            const top = Number.isFinite(arg1.top) ? arg1.top : (Number.isFinite(arg1.y) ? arg1.y : 0);
            try {
                nativeScrollTo(arg1);
            } catch (_error) {
                nativeScrollTo(left, top);
            }
            return;
        }
        const x = Number.isFinite(arg1) ? arg1 : 0;
        const y = Number.isFinite(arg2) ? arg2 : 0;
        nativeScrollTo(x, y);
    };
})();

document.addEventListener("DOMContentLoaded", () => {
    document.head.insertAdjacentHTML("beforeend", sharedStyles);
    
    const headerEl = document.getElementById("header-placeholder");
    const footerEl = document.getElementById("footer-placeholder");
    
    if (headerEl) headerEl.innerHTML = siteHeader;
    if (footerEl) footerEl.innerHTML = siteFooter;

    const savedTheme = localStorage.getItem("lifemeter_theme");
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
                if (event.target.closest(".dropdown a")) return;
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

    mountLongformRail();

    // Backward compatibility for pages using inline onclick="toggleTheme()".
    window.toggleTheme = toggleTheme;
});
