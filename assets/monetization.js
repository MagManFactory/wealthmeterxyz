(function () {
  "use strict";

  const registryUrl = "/data/monetization-offers.json";
  const reportPaths = new Set([
    "/report-wealth-thresholds",
    "/report-wealth-thresholds.html",
    "/report-velocity-of-capital",
    "/report-velocity-of-capital.html",
    "/report-geography-global-wealth",
    "/report-geography-global-wealth.html"
  ]);
  let calculatorStarted = false;
  let resultRecorded = false;

  function track(eventName, parameters) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", eventName, Object.assign({ site: "wealthmeter", page_path: window.location.pathname }, parameters || {}));
  }

  function pathMatches(paths) {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    return paths.some((candidate) => (candidate.replace(/\/$/, "") || "/") === path);
  }

  function calculatorId() {
    return (window.location.pathname.split("/").pop() || "wealthmeter").replace(/\.html$/, "");
  }

  function resultIsVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
  }

  function commercialModule(offer) {
    const section = document.createElement("aside");
    section.className = "commercial-module";
    section.dataset.commercialModule = offer.id;
    section.setAttribute("aria-labelledby", `commercial-title-${offer.id}`);
    section.innerHTML = `
      <p class="commercial-eyebrow">${offer.eyebrow}</p>
      <h2 id="commercial-title-${offer.id}">${offer.title}</h2>
      <p class="commercial-description">${offer.description}</p>
      <ul>${offer.bullets.map((item) => `<li>${item}</li>`).join("")}</ul>
      <a class="commercial-cta" href="${offer.url}" data-offer-id="${offer.id}" data-offer-relationship="${offer.relationship}">${offer.cta}</a>
      <p class="commercial-owner">Published by WealthMeter. Educational material, not individualized financial advice.</p>`;
    return section;
  }

  function addStyles() {
    if (document.getElementById("commercial-module-styles")) return;
    const style = document.createElement("style");
    style.id = "commercial-module-styles";
    style.textContent = `
      .commercial-module{max-width:920px;margin:2rem auto;padding:clamp(1.25rem,3vw,2rem);border:1px solid #bfdbfe;border-left:5px solid #2563eb;border-radius:1rem;background:linear-gradient(135deg,#fff,#eff6ff);color:#0f172a;text-align:left;box-shadow:0 16px 40px rgba(15,23,42,.08)}
      .commercial-module .commercial-eyebrow{margin:0 0 .45rem;color:#1d4ed8;font:800 .72rem/1.2 'Roboto Mono','JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase}
      .commercial-module h2{margin:0 0 .65rem;color:#0f172a;font-size:clamp(1.5rem,4vw,2.25rem);line-height:1.05;letter-spacing:-.035em;text-transform:none}
      .commercial-module .commercial-description{margin:0 0 1rem;color:#334155;line-height:1.6}
      .commercial-module ul{display:grid;gap:.35rem;margin:0 0 1.2rem;padding-left:1.2rem;color:#334155}
      .commercial-module .commercial-cta{display:inline-flex;min-height:46px;align-items:center;justify-content:center;padding:.8rem 1.1rem;border-radius:.75rem;background:linear-gradient(135deg,#2563eb,#0891b2);color:#fff!important;text-decoration:none;font-weight:900}
      .commercial-module .commercial-owner{margin:.8rem 0 0;color:#64748b;font-size:.76rem;line-height:1.45}
      body.dark-mode .commercial-module{background:linear-gradient(135deg,#0f172a,#082f49);border-color:#1d4ed8;color:#f8fafc}
      body.dark-mode .commercial-module h2{color:#f8fafc} body.dark-mode .commercial-module .commercial-description,body.dark-mode .commercial-module ul,body.dark-mode .commercial-module .commercial-owner{color:#cbd5e1}`;
    document.head.appendChild(style);
  }

  function observeModule(module, offer) {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      track("commercial_module_viewed", { offer_id: offer.id, relationship: offer.relationship });
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(module);
  }

  async function configurePlacement() {
    let registry;
    try {
      const response = await fetch(registryUrl, { credentials: "same-origin" });
      if (!response.ok) return;
      registry = await response.json();
    } catch (_) { return; }
    const placement = registry.placements.find((item) => pathMatches(item.paths));
    if (!placement) return;
    const offer = registry.offers.find((item) => item.id === placement.offerId && item.status === "active");
    if (!offer || !offer.url) return;

    const tryMount = () => {
      if (!calculatorStarted || document.querySelector(`[data-commercial-module="${offer.id}"]`)) return;
      const result = document.querySelector(placement.resultSelector);
      if (!resultIsVisible(result)) return;
      if (window.location.pathname === "/index.html" || window.location.pathname === "/") {
        const existing = result.querySelector(".report-offer");
        if (existing) {
          existing.dataset.commercialModule = offer.id;
          const existingLink = existing.querySelector("a[href]");
          if (existingLink) {
            existingLink.dataset.offerId = offer.id;
            existingLink.dataset.offerRelationship = offer.relationship;
          }
          observeModule(existing, offer);
        }
      } else {
        const module = commercialModule(offer);
        result.insertAdjacentElement("afterend", module);
        observeModule(module, offer);
      }
      if (!resultRecorded) {
        resultRecorded = true;
        track("calculator_completed", { calculator_id: calculatorId() });
        track("result_viewed", { calculator_id: calculatorId() });
      }
    };

    const start = () => {
      if (!calculatorStarted) track("calculator_started", { calculator_id: calculatorId() });
      calculatorStarted = true;
      window.setTimeout(tryMount, 150);
    };
    document.addEventListener("input", (event) => {
      if (event.target.closest("form, .calculator, .calculator-card, .input-panel, .control-panel, .lab-controls")) start();
    }, true);
    document.addEventListener("submit", start, true);
    document.addEventListener("click", (event) => {
      if (event.target.closest("button, [role='button'], .btn, select")) start();
    }, true);
    document.addEventListener("change", start, true);
    new MutationObserver(tryMount).observe(document.body, { attributes: true, childList: true, subtree: true });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a, button");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (link.matches("[data-offer-id]")) {
      track("report_detail_clicked", { offer_id: link.dataset.offerId, relationship: link.dataset.offerRelationship || "owned" });
    } else if (/payhip\.com\/buy/.test(href)) {
      track("checkout_clicked", { product_page: window.location.pathname });
    } else if (link.closest(".share-buttons,.share-actions,.social-grid,[data-share-actions]")) {
      track("share_created", { share_channel: (link.getAttribute("aria-label") || link.textContent || "unknown").trim().slice(0, 40) });
    }
  });
  window.addEventListener("newsletter:subscribed", (event) => {
    track("newsletter_subscribed", { source: event.detail && event.detail.source ? event.detail.source : "unknown" });
  });
  function initialize() {
    addStyles();
    if (reportPaths.has(window.location.pathname)) track("report_detail_viewed", { product_page: window.location.pathname });
    configurePlacement();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
