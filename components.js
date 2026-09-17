
// GA4 — Measurement ID G-8NF91REL39 (do not reuse Lexicon G-5MC05WB07R)
(function() {
  if (window.__wmGa4) return;
  window.__wmGa4 = true;
  var id = "G-8NF91REL39";
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + id;
  document.head.appendChild(s);
  gtag("js", new Date());
  gtag("config", id);
  try {
    var referrerHost = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
    if (/(^|\.)(chatgpt\.com|perplexity\.ai|claude\.ai|copilot\.microsoft\.com|gemini\.google\.com)$/.test(referrerHost)) {
      gtag("event", "ai_referral", { source_host: referrerHost, page_path: location.pathname });
    }
  } catch (_) {}
})();

// components.js - WealthMeter™ V25.1 Studio Standard

// Refresh marker for 2026-04-29 WealthMeter longform publish retry.
const GA_MEASUREMENT_ID = "G-8NF91REL39";

const ga4Snippet = `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-8NF91REL39"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-8NF91REL39');
    </script>`;

(function ensureGa4() {
    if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
    const loader = document.createElement("script");
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(loader);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID);
})();

const sharedStyles = `
<style id="wealthmeter-component-styles">
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
        max-width: 1580px;
        margin: 0 auto;
        padding: 0 1.75rem;
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
        margin-right: 2rem;
    }

    /* Navigation: Forces links to the right */
    nav {
        display: flex;
        gap: clamp(1.1rem, 1.7vw, 2.25rem);
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
    .sister-site-link {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        font-weight: 800;
        font-size: 0.85rem;
        color: #FF4B4B;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        white-space: nowrap;
    }
    .nav-group:hover .dropdown { display: block !important; }
    .nav-group.open .dropdown { display: block !important; }

    @media (max-width: 1360px) {
        .nav-container { padding: 0 1.25rem; }
        .brand-wrapper { margin-right: 1.25rem; }
        nav { gap: 1rem; }
        .nav-group-label,
        .sister-site-link { font-size: 0.76rem; letter-spacing: 0.09em; }
    }

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

    @media (max-width: 1024px) {
        header { position: relative; }
        .nav-container { height: auto; min-height: 72px; padding: 0.75rem 1rem; flex-direction: column; align-items: flex-start; gap: 0.75rem; }
        .brand-wrapper { margin-right: 0; }
        nav { width: 100%; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.25rem; -ms-overflow-style: none; scrollbar-width: none; }
        nav::-webkit-scrollbar { display: none; }
        .nav-group { height: auto; }
        .nav-group-label { display: inline-flex; align-items: center; min-height: 44px; padding: 0.25rem 0; font-size: 0.74rem; letter-spacing: 0.1em; }
        .sister-site-link { display: inline-flex; align-items: center; min-height: 44px; padding: 0.25rem 0; font-size: 0.74rem; letter-spacing: 0.1em; }
        .dropdown { position: fixed; left: 0.9rem; right: 0.9rem; top: 74px; min-width: 0; max-height: 70vh; overflow-y: auto; margin-top: 0; border-radius: 0.9rem; padding: 0.7rem 0; box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16); }
        .dropdown a { min-height: 44px; display: flex; align-items: center; font-size: 0.95rem; padding: 0.72rem 1.15rem; }
    }

    footer { padding: 5rem 2rem; text-align: center; border-top: 1px solid #e2e8f0; background: #f8fafc; margin-top: auto; }
    .cross-property-band {
        max-width: 980px;
        margin: 0 auto 1.5rem;
        padding: 1rem 1.25rem;
        border: 1px solid #dbe4f0;
        border-radius: 1rem;
        background: linear-gradient(135deg, #ffffff, #eef4ff 70%);
        color: #1e293b;
        font-weight: 700;
        line-height: 1.55;
    }
    .cross-property-band a {
        color: #2563eb;
        font-weight: 900;
        text-decoration: none;
    }
    .cross-property-band a:hover { text-decoration: underline; }
    .article-bridge-cta {
        margin: 2.5rem 0 0;
        padding: 1.25rem 1.35rem;
        border: 1px solid #dbe4f0;
        border-radius: 1rem;
        background: linear-gradient(135deg, #ffffff, #eef4ff 70%);
    }
    .article-bridge-label {
        display: inline-block;
        margin-bottom: 0.55rem;
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font-weight: 800;
        color: #2563eb;
    }
    .article-bridge-cta h2,
    .article-bridge-cta h3 {
        margin: 0 0 0.55rem;
        padding: 0;
        border: 0;
        color: #0f172a;
        font-size: 1.2rem;
        letter-spacing: -0.02em;
        text-transform: none;
    }
    .article-bridge-cta p {
        margin: 0 0 0.9rem;
        color: #334155;
    }
    .article-bridge-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin: 0 0 0.95rem;
    }
    .article-bridge-chip {
        display: inline-flex;
        align-items: center;
        border: 1px solid #bfdbfe;
        border-radius: 999px;
        padding: 0.34rem 0.65rem;
        background: #ffffff;
        color: #1d4ed8;
        font-size: 0.76rem;
        font-weight: 700;
    }
    .article-bridge-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
        align-items: center;
    }
    .article-bridge-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0.75rem 1rem;
        border-radius: 0.85rem;
        background: #2563eb;
        color: #ffffff;
        text-decoration: none;
        font-weight: 800;
    }
    .article-bridge-secondary {
        color: #2563eb;
        text-decoration: none;
        font-weight: 700;
    }
    .article-bridge-secondary:hover { text-decoration: underline; }
    .footer-links { display: flex; justify-content: center; gap: 4rem; flex-wrap: wrap; }
    .footer-links a { color: #64748b; text-decoration: none; font-weight: 700; font-size: 0.85rem; transition: color 0.2s; }

    .site-newsletter { max-width:720px; margin:2rem auto 0; padding:1.4rem; border:1px solid #dbe4f0; border-radius:1rem; background:#f8fbff; text-align:left; }
    .site-newsletter h2 { margin:0 0 .35rem; font-size:1.3rem; color:#0f172a; }
    .site-newsletter-copy { margin:0 0 1rem; color:#475569; line-height:1.55; }
    .site-newsletter-form { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
    .site-newsletter-field { display:grid; gap:.3rem; color:#334155; font-size:.76rem; font-weight:800; }
    .site-newsletter-field-email,.site-newsletter-actions { grid-column:1 / -1; }
    .site-newsletter-field input { width:100%; min-height:46px; padding:.75rem .8rem; border:1px solid #cbd5e1; border-radius:.7rem; background:#fff; color:#0f172a; font-family:inherit; font-size:1rem; font-weight:600; line-height:1.3; }
    .site-newsletter-actions { display:flex; align-items:center; gap:.85rem; flex-wrap:wrap; }
    .site-newsletter button { min-height:46px; padding:.75rem 1.15rem; border:0; border-radius:.7rem; background:#2563eb; color:#fff; font-family:inherit; font-size:.84rem; font-weight:800; line-height:1; cursor:pointer; }
    .site-newsletter button:disabled { opacity:.65; cursor:default; }
    .site-newsletter-status { margin:0; color:#475569; font-size:.86rem; font-weight:700; }
    .site-newsletter-note,.site-newsletter-address { margin:.85rem 0 0; color:#64748b; font-size:.78rem; line-height:1.5; }
    body.dark-mode .site-newsletter { background:#0f172a; border-color:#334155; }
    body.dark-mode .site-newsletter h2 { color:#f8fafc; }
    body.dark-mode .site-newsletter-copy,body.dark-mode .site-newsletter-status,body.dark-mode .site-newsletter-note,body.dark-mode .site-newsletter-address,body.dark-mode .site-newsletter-field { color:#cbd5e1; }
    body.dark-mode .site-newsletter-field input { background:#0b1220; border-color:#475569; color:#f8fafc; }
    @media (max-width:640px) { .site-newsletter-form { grid-template-columns:1fr; } .site-newsletter-field-email,.site-newsletter-actions { grid-column:1; } }

    main.article figure img {
        max-width: 100%;
        width: 100%;
        height: auto !important;
        object-fit: contain;
    }
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
                    <a href="us-household-wealth.html">U.S. Household Wealth</a>
                    <a href="global_ranker.html">Country-Specific Rank</a>
                    <a href="income_ranker.html">Income Percentile</a>
                    <a href="reports.html" style="color: #2563eb; border-top: 1px solid #e2e8f0; margin-top: 8px;">2026 Reports Hub</a>
                </div>
            </div>
            <div class="nav-group"><span class="nav-group-label label-rate">Rate</span>
                <div class="dropdown">
                    <a href="networth.html">Net Worth Calibration</a>
                    <a href="fire_timeline.html">FIRE Timeline Planner</a>
                    <a href="purchasing-power.html">FIRE &amp; Cost of Living</a>
                    <a href="portfolio_alpha.html">Portfolio Alpha Simulator</a>
                    <a href="runway_lab.html">Financial Runway Lab</a>
                    <a href="reports.html" style="color: #2563eb; border-top: 1px solid #e2e8f0; margin-top: 8px;">2026 Reports Hub</a>
                </div>
            </div>
            <div class="nav-group"><span class="nav-group-label label-analyze">Analyze</span>
                <div class="dropdown">
                    <a href="global_explorer.html">Wealth Explorer</a>
                    <a href="purchasing-power.html">Purchasing Power Hub</a>
                    <a href="live-better-for-less.html">Live Better for Less</a>
                    <a href="lifestyle-abroad.html">Lifestyle Abroad</a>
                    <a href="country-systems-atlas.html">Country Systems Atlas</a>
                    <a href="atlas.html">Longevity Atlas</a>
                    <a href="data-lab.html">Data Lab</a>
                    <a href="wealth-briefs.html">Wealth Briefs</a>
                    <a href="reports.html" style="color: #2563eb; border-top: 1px solid #e2e8f0; margin-top: 8px;">2026 Reports Hub</a>
                </div>
            </div>
            <div class="nav-group"><span class="nav-group-label label-longform">Longform</span>
                <div class="dropdown">
                    <a href="longform.html">Longform Hub</a>
                    <a href="job-loss-hurts-more-when-benefits-are-not-portable.html">Job Loss Hurts More When Benefits Are Not Portable</a>
                    <a href="disability-insurance-leaves-many-paychecks-unprotected.html">Disability Insurance Leaves Many Paychecks Unprotected</a>
                    <a href="america-is-second-by-average-wealth-fifteenth-by-median-wealth.html">America Is 2nd by Average Wealth, 15th by Median Wealth</a>
                    <a href="how-insurance-deductibles-become-a-household-balance-sheet-shock.html">How Insurance Deductibles Become a Household Balance-Sheet Shock</a>
                    <a href="home-equity-is-not-emergency-liquidity.html">Home Equity Is Not Emergency Liquidity</a>
                    <a href="sequence-risk-before-retirement-fragility-priced-too-late.html">Sequence Risk Before Retirement: The Fragility Nobody Prices Early Enough</a>
                    <a href="liquidity-illusion.html">The Liquidity Illusion</a>
                    <a href="property-tax-drag.html">The Property Tax Drag</a>
                    <a href="global-housing-divergence.html">The Global Housing Divergence</a>
                    <a href="yield-trap-high-rate-world.html">The Yield Trap in a High-Rate World</a>
                    <a href="freelance-freedom-tradeoff.html">The Freelance Freedom Tradeoff</a>
                    <a href="promotion-paradox.html">The Promotion Paradox</a>


                    <a href="reports.html" style="color: #2563eb; border-top: 1px solid #e2e8f0; margin-top: 8px;">2026 Reports Hub</a>
                </div>
            </div>
            <a href="https://lifemeter.xyz" target="_blank" rel="noopener" class="sister-site-link">LifeMeter ↗</a>
        </nav>
    </div>
</header>`;

const NEWSLETTER_ENDPOINT = "https://lifemeter.xyz/api/newsletter";

function newsletterHTML(source) {
    return `
<section class="site-newsletter" aria-labelledby="newsletter-heading-${source}">
    <h2 id="newsletter-heading-${source}">WealthMeter news and updates</h2>
    <p class="site-newsletter-copy">Receive new longform analysis, wealth brief updates, and report releases.</p>
    <form class="site-newsletter-form" data-newsletter-form data-source="${source}">
        <input type="hidden" name="newsletter" value="yes">
        <input type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden">
        <label class="site-newsletter-field">First name
            <input type="text" name="firstName" autocomplete="given-name" required>
        </label>
        <label class="site-newsletter-field">Last name
            <input type="text" name="lastName" autocomplete="family-name" required>
        </label>
        <label class="site-newsletter-field site-newsletter-field-email">Email address
            <input type="email" name="email" autocomplete="email" inputmode="email" required>
        </label>
        <div class="site-newsletter-actions">
            <button type="submit">Sign up</button>
            <p class="site-newsletter-status" data-newsletter-status aria-live="polite"></p>
        </div>
    </form>
    <p class="site-newsletter-note">Occasional WealthMeter news, report releases, and relevant commercial recommendations. Unsubscribe at any time. We do not sell subscriber information. See our <a href="privacy.html">Privacy Policy</a>.</p>
    <p class="site-newsletter-address">Mailing Address: 1968 S. Coast Hwy #5495, Laguna Beach, CA 92651</p>
</section>`;
}

const siteFooter = `
<footer>
    <section class="site-newsletter" aria-labelledby="newsletter-heading-footer">
        <h2 id="newsletter-heading-footer">WealthMeter news and updates</h2>
        <p class="site-newsletter-copy">Receive new longform analysis, wealth brief updates, and report releases.</p>
        <form class="site-newsletter-form" data-newsletter-form data-source="footer">
            <input type="hidden" name="newsletter" value="yes">
            <input type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden">
            <label class="site-newsletter-field">First name
                <input type="text" name="firstName" autocomplete="given-name" required>
            </label>
            <label class="site-newsletter-field">Last name
                <input type="text" name="lastName" autocomplete="family-name" required>
            </label>
            <label class="site-newsletter-field site-newsletter-field-email">Email address
                <input type="email" name="email" autocomplete="email" inputmode="email" required>
            </label>
            <div class="site-newsletter-actions">
                <button type="submit">Sign up</button>
                <p class="site-newsletter-status" data-newsletter-status aria-live="polite"></p>
            </div>
        </form>
        <p class="site-newsletter-note">Occasional WealthMeter news, report releases, and relevant commercial recommendations. Unsubscribe at any time. We do not sell subscriber information. See our <a href="privacy.html">Privacy Policy</a>.</p>
        <p class="site-newsletter-address">Mailing Address: 1968 S. Coast Hwy #5495, Laguna Beach, CA 92651</p>
    </section>
    <div class="footer-links">
        <a href="about.html">About</a>
        <a href="editorial-policy.html">Editorial Standards</a>
        <a href="data-sources.html">Data Sources</a>
        <a href="methodology.html">Methodology</a>
        <a href="privacy.html">Privacy Policy</a>
        <a href="partners.html">Partners</a>
        <a href="commercial-policy.html">Commercial Policy</a>
        <a href="disclaimer.html">Disclaimer</a>
    </div>
</footer>`;

document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-newsletter-form]");
    if (!form) return;
    event.preventDefault();
    if (!form.reportValidity()) return;

    const status = form.querySelector("[data-newsletter-status]");
    const button = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    if (status) status.textContent = "Signing you up...";
    if (button) button.disabled = true;

    try {
        const response = await fetch(NEWSLETTER_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                site: "wealthmeter",
                source: form.dataset.source || "footer",
                page: window.location.pathname || "/",
                newsletter: formData.get("newsletter"),
                commercialUpdates: "yes",
                company: formData.get("company"),
                firstName: formData.get("firstName"),
                lastName: formData.get("lastName"),
                email: formData.get("email")
            })
        });
        if (!response.ok) throw new Error("Newsletter request failed");
        form.reset();
        if (status) status.textContent = "You are signed up.";
        window.dispatchEvent(new CustomEvent("newsletter:subscribed", { detail: { source: form.dataset.source || "footer" } }));
    } catch (error) {
        if (status) status.textContent = "We could not complete the signup. Please try again.";
    } finally {
        if (button) button.disabled = false;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const sharedStyleEl = document.getElementById("wealthmeter-component-styles");
    if (!sharedStyleEl || !sharedStyleEl.textContent.trim()) {
        if (sharedStyleEl) {
            sharedStyleEl.outerHTML = sharedStyles;
        } else {
            document.head.insertAdjacentHTML("beforeend", sharedStyles);
        }
    }
    const headerEl = document.getElementById("header-placeholder");
    const footerEl = document.getElementById("footer-placeholder");
    if (headerEl && headerEl.dataset.staticComponent !== "1") {
        headerEl.innerHTML = siteHeader;
    }
    if (footerEl && footerEl.dataset.staticComponent !== "1") {
        footerEl.innerHTML = siteFooter;
    }

    function ensureNavLink(groupName, href, text, afterHref) {
        const group = Array.from(document.querySelectorAll(".nav-group")).find((candidate) => {
            const label = candidate.querySelector(".nav-group-label");
            return label && label.textContent.trim().toLowerCase() === groupName.toLowerCase();
        });
        const dropdown = group && group.querySelector(".dropdown");
        if (!dropdown || dropdown.querySelector(`a[href="${href}"]`)) return;
        const link = document.createElement("a");
        link.href = href;
        link.textContent = text;
        const predecessor = afterHref && dropdown.querySelector(`a[href="${afterHref}"]`);
        if (predecessor) predecessor.insertAdjacentElement("afterend", link);
        else dropdown.appendChild(link);
    }

    // Older pages carry static header snapshots. Repair their discovery paths
    // at runtime as well as keeping the canonical header template current.
    ensureNavLink("Rate", "purchasing-power.html", "FIRE & Cost of Living", "fire_timeline.html");
    ensureNavLink("Analyze", "purchasing-power.html", "Purchasing Power Hub", "global_explorer.html");
    ensureNavLink("Analyze", "live-better-for-less.html", "Live Better for Less", "purchasing-power.html");
    ensureNavLink("Analyze", "lifestyle-abroad.html", "Lifestyle Abroad", "live-better-for-less.html");
    document.querySelectorAll("footer .footer-links").forEach((links) => {
        if (!links.querySelector('a[href*="partners"]')) {
            const link = document.createElement("a");
            link.href = "partners.html";
            link.textContent = "Partners";
            links.appendChild(link);
        }
        if (!links.querySelector('a[href*="commercial-policy"]')) {
            const link = document.createElement("a");
            link.href = "commercial-policy.html";
            link.textContent = "Commercial Policy";
            links.appendChild(link);
        }
    });
    document.querySelectorAll(".site-newsletter-note").forEach((note) => {
        note.innerHTML = 'Occasional WealthMeter news, report releases, and relevant commercial recommendations. Unsubscribe at any time. We do not sell subscriber information. See our <a href="privacy.html">Privacy Policy</a>.';
    });
    const resultSlot = document.getElementById("result-feedback-slot");
    if (resultSlot && !resultSlot.querySelector("[data-newsletter-form]")) {
        resultSlot.innerHTML = newsletterHTML("result");
    }

    if (!document.querySelector('script[data-monetization-layer]')) {
        const monetizationScript = document.createElement("script");
        monetizationScript.src = "/assets/monetization.js?v=2026-09-16.1";
        monetizationScript.dataset.monetizationLayer = "1";
        document.body.appendChild(monetizationScript);
    }

    const isMobile = window.matchMedia("(max-width: 1024px)").matches;
    const navGroups = Array.from(document.querySelectorAll(".nav-group"));
    const labels = navGroups.map((group, index) => {
        const label = group.querySelector(".nav-group-label");
        const dropdown = group.querySelector(".dropdown");
        if (!label || !dropdown) return null;
        if (!dropdown.id) dropdown.id = `wm-nav-dropdown-${index + 1}`;
        label.setAttribute("role", "button");
        label.setAttribute("tabindex", "0");
        label.setAttribute("aria-haspopup", "true");
        label.setAttribute("aria-controls", dropdown.id);
        label.setAttribute("aria-expanded", "false");
        return label;
    }).filter(Boolean);

    const closeAllMenus = () => {
        navGroups.forEach((group) => group.classList.remove("open"));
        labels.forEach((label) => label.setAttribute("aria-expanded", "false"));
    };

    if (isMobile) {
        navGroups.forEach((group) => {
            const label = group.querySelector(".nav-group-label");
            if (!label) return;
            label.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const willOpen = !group.classList.contains("open");
                closeAllMenus();
                if (willOpen) {
                    group.classList.add("open");
                    label.setAttribute("aria-expanded", "true");
                }
            });
            label.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    label.click();
                }
            });
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".nav-group")) closeAllMenus();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeAllMenus();
        });

        document.querySelectorAll(".dropdown a").forEach((link) => {
            link.addEventListener("click", () => closeAllMenus());
        });
    }

});
