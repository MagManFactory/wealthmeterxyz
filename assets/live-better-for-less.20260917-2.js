(function () {
  "use strict";

  const metricSpecs = {
    health: { label: "Life expectancy", source: "atlas", key: "life_expectancy", higher: true, span: 15, format: (v) => `${v.toFixed(1)} yr` },
    essentials: { label: "Electricity access", source: "atlas", key: "electricity_access", higher: true, span: 30, format: (v) => `${v.toFixed(1)}%` },
    connectivity: { label: "Internet use", source: "supplement", key: "internet_use", higher: true, span: 45, format: (v) => `${v.toFixed(1)}%` },
    sanitation: { label: "Safe sanitation", source: "supplement", key: "sanitation", higher: true, span: 40, format: (v) => `${v.toFixed(1)}%` },
    infrastructure: { label: "Transport infrastructure", source: "atlas", key: "lpi_infrastructure", higher: true, span: 2, format: (v) => `${v.toFixed(2)} / 5` },
    safety: { label: "Homicide rate", source: "supplement", key: "homicide_rate", higher: false, span: 20, format: (v) => `${v.toFixed(1)} / 100k` }
  };

  const floors = {
    close: { health: 2.5, essentials: 3, connectivity: 10, sanitation: 8, infrastructure: 0.45, safetyAdd: 2, safetyMult: 1.5, label: "Close match" },
    balanced: { health: 5, essentials: 8, connectivity: 20, sanitation: 18, infrastructure: 0.8, safetyAdd: 5, safetyMult: 2.5, label: "Balanced" },
    open: { health: 8, essentials: 15, connectivity: 35, sanitation: 30, infrastructure: 1.2, safetyAdd: 10, safetyMult: 4, label: "Open to tradeoffs" }
  };

  const state = { rows: [], home: null, results: [], selectedPriorities: [], monthly: 5000, floor: "close" };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  function metricPoint(country, id) {
    const spec = metricSpecs[id];
    const container = spec.source === "atlas" ? country.atlas : country.supplement;
    const point = container?.metrics?.[spec.key]?.latest || container?.metrics?.[spec.key] || null;
    return Number.isFinite(point?.value) ? point : null;
  }

  function preservation(home, candidate, priorities) {
    let weightedScore = 0;
    let weightTotal = 0;
    let available = 0;
    const details = {};
    Object.entries(metricSpecs).forEach(([id, spec]) => {
      const homePoint = metricPoint(home, id);
      const candidatePoint = metricPoint(candidate, id);
      if (!homePoint || !candidatePoint) {
        details[id] = { available: false, home: homePoint, candidate: candidatePoint };
        return;
      }
      available += 1;
      const shortfall = spec.higher
        ? Math.max(0, homePoint.value - candidatePoint.value)
        : Math.max(0, candidatePoint.value - homePoint.value);
      const score = Math.max(0, 100 * (1 - shortfall / spec.span));
      const weight = priorities.includes(id) ? 2.2 : 0.65;
      weightedScore += score * weight;
      weightTotal += weight;
      details[id] = { available: true, home: homePoint, candidate: candidatePoint, shortfall, score };
    });
    return { score: weightTotal ? weightedScore / weightTotal : 0, available, details };
  }

  function passesFloor(home, candidate, floorKey, details) {
    const limit = floors[floorKey];
    if (details.available < 5) return false;
    for (const required of ["health", "essentials", "connectivity", "sanitation"]) {
      if (!details.details[required]?.available) return false;
    }
    const checks = {
      health: limit.health,
      essentials: limit.essentials,
      connectivity: limit.connectivity,
      sanitation: limit.sanitation,
      infrastructure: limit.infrastructure
    };
    for (const [id, allowance] of Object.entries(checks)) {
      const detail = details.details[id];
      if (detail?.available && detail.shortfall > allowance) return false;
    }
    const safety = details.details.safety;
    if (safety?.available) {
      const homeValue = safety.home.value;
      const ceiling = Math.max(homeValue + limit.safetyAdd, homeValue * limit.safetyMult);
      if (safety.candidate.value > ceiling) return false;
    }
    return true;
  }

  function buildRows(atlas, supplement, ppw) {
    const atlasByCode = new Map(atlas.countries.map((country) => [country.code, country]));
    const supplementByCode = new Map(supplement.countries.map((country) => [country.code, country]));
    return ppw.countries.map((price) => ({
      code: price.code,
      name: atlasByCode.get(price.code)?.name || price.name,
      price,
      atlas: atlasByCode.get(price.code),
      supplement: supplementByCode.get(price.code)
    })).filter((row) => row.atlas && row.supplement);
  }

  function prioritySelection() {
    return $$(".lbl-chip-row input:checked").map((input) => input.value);
  }

  function updatePriorityControls(changed) {
    const selected = prioritySelection();
    if (selected.length > 3 && changed) changed.checked = false;
    const finalSelection = prioritySelection();
    $("[data-priority-status]").textContent = finalSelection.length < 2 ? "Choose at least two priorities." : "";
    $$(".lbl-chip-row input:not(:checked)").forEach((input) => { input.disabled = finalSelection.length >= 3; });
  }

  function populateHome() {
    const options = state.rows.slice().sort((a, b) => a.name.localeCompare(b.name)).map((row) => `<option value="${row.code}">${escapeHtml(row.name)}</option>`).join("");
    $("#home-country").innerHTML = options;
    const params = new URLSearchParams(location.search);
    const requested = params.get("home");
    $("#home-country").value = state.rows.some((row) => row.code === requested) ? requested : "USA";
    const spend = Number(params.get("spend"));
    if (Number.isFinite(spend) && spend >= 100) $("#monthly-spend").value = String(spend);
    const floor = params.get("floor");
    if (floors[floor]) $("#quality-floor").value = floor;
    const priorities = params.get("priorities")?.split(",").filter((id) => metricSpecs[id]).slice(0, 3);
    if (priorities?.length >= 2) {
      $$(".lbl-chip-row input").forEach((input) => { input.checked = priorities.includes(input.value); });
    }
    updatePriorityControls();
  }

  function calculate(options = {}) {
    const priorities = prioritySelection();
    if (priorities.length < 2) {
      $("[data-priority-status]").textContent = "Choose at least two priorities before comparing.";
      return;
    }
    const monthly = Math.max(100, Number($("#monthly-spend").value) || 0);
    const home = state.rows.find((row) => row.code === $("#home-country").value);
    const floorKey = $("#quality-floor").value;
    if (!home) return;
    const results = state.rows.filter((candidate) => candidate.code !== home.code).map((candidate) => {
      const required = monthly * candidate.price.price_level_usa100 / home.price.price_level_usa100;
      const savingsPct = (1 - required / monthly) * 100;
      const quality = preservation(home, candidate, priorities);
      const passes = savingsPct >= 3 && passesFloor(home, candidate, floorKey, quality);
      const valueScore = quality.score * 0.72 + Math.min(70, Math.max(0, savingsPct)) / 70 * 100 * 0.28;
      return { candidate, required, savingsPct, quality, passes, valueScore };
    }).filter((result) => result.passes).sort((a, b) => b.valueScore - a.valueScore || b.savingsPct - a.savingsPct);

    state.home = home;
    state.results = results;
    state.selectedPriorities = priorities;
    state.monthly = monthly;
    state.floor = floorKey;
    updateUrl();
    render(options.scroll !== false);
  }

  function updateUrl() {
    const url = new URL(location.href);
    url.searchParams.set("home", state.home.code);
    url.searchParams.set("spend", String(Math.round(state.monthly)));
    url.searchParams.set("floor", state.floor);
    url.searchParams.set("priorities", state.selectedPriorities.join(","));
    history.replaceState({}, "", url);
  }

  function resultDescription(result) {
    const better = [];
    const lower = [];
    Object.entries(result.quality.details).forEach(([id, detail]) => {
      if (!detail.available) return;
      const spec = metricSpecs[id];
      const directional = spec.higher ? detail.candidate.value - detail.home.value : detail.home.value - detail.candidate.value;
      if (directional >= spec.span * 0.04) better.push(spec.label.toLowerCase());
      if (directional < -spec.span * 0.04) lower.push(spec.label.toLowerCase());
    });
    if (!lower.length) return `Matches or exceeds the home benchmark across the available quality measures.`;
    const lead = lower.slice(0, 2).join(" and ");
    return `The clearest modeled tradeoffs are ${lead}${better.length ? `; ${better[0]} is stronger` : ""}.`;
  }

  function render(shouldScroll) {
    const panel = $("[data-results]");
    const empty = $("[data-empty]");
    const content = $("[data-result-content]");
    panel.hidden = false;
    empty.hidden = state.results.length > 0;
    content.hidden = !state.results.length;
    if (!state.results.length) {
      if (shouldScroll) panel.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const top = state.results[0];
    $("[data-result-hero]").innerHTML = `<div class="lbl-result-kicker">Best balance from ${escapeHtml(state.home.name)}</div><h2><em>${escapeHtml(top.candidate.name)}</em> may cost ${Math.round(top.savingsPct)}% less without breaking your quality floor.</h2><p>${money(state.monthly)} per month at home maps to about <strong>${money(top.required)} per month</strong> using national private-consumption price levels. The destination preserves ${Math.round(top.quality.score)}% of the selected quality benchmark across ${top.quality.available} available measures.</p>`;
    $("[data-summary-strip]").innerHTML = `<div class="lbl-stat"><span>Countries clearing the floor</span><strong>${state.results.length}</strong><small>of ${state.rows.length - 1} alternatives</small></div><div class="lbl-stat"><span>Quality setting</span><strong>${floors[state.floor].label}</strong><small>${state.selectedPriorities.map((id) => metricSpecs[id].label).join(" · ")}</small></div><div class="lbl-stat"><span>Top estimated monthly difference</span><strong>${money(state.monthly - top.required)}</strong><small>national-basket estimate</small></div>`;
    renderFrontier();
    $("[data-shortlist]").innerHTML = state.results.slice(0, 6).map(renderCard).join("");
    renderShare();
    bindCardLinks();
    if (shouldScroll) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCard(result, index) {
    const rows = Object.entries(metricSpecs).map(([id, spec]) => {
      const detail = result.quality.details[id];
      if (!detail.available) return `<div class="lbl-metric"><span class="lbl-metric-name">${escapeHtml(spec.label)}</span><span class="lbl-metric-value">Not available</span><span class="lbl-metric-delta warn">Not scored</span></div>`;
      const directional = spec.higher ? detail.candidate.value - detail.home.value : detail.home.value - detail.candidate.value;
      const deltaLabel = Math.abs(directional) < 0.05 ? "Similar" : `${Math.abs(directional).toFixed(spec.key === "lpi_infrastructure" ? 2 : 1)} ${directional > 0 ? "better" : "lower"}`;
      const years = detail.home.year === detail.candidate.year ? `${detail.candidate.year} data` : `${detail.home.year} home · ${detail.candidate.year} destination`;
      return `<div class="lbl-metric"><span class="lbl-metric-name">${escapeHtml(spec.label)}</span><span class="lbl-metric-value">${escapeHtml(spec.format(detail.candidate.value))}</span><span class="lbl-metric-delta ${directional >= 0 ? "good" : "warn"}">${escapeHtml(deltaLabel)}</span><span class="lbl-metric-year">${escapeHtml(years)} · home ${escapeHtml(spec.format(detail.home.value))}</span></div>`;
    }).join("");
    return `<article class="lbl-destination" id="destination-${escapeHtml(result.candidate.code)}"><div class="lbl-destination-head"><div class="lbl-rankline"><div><span class="lbl-eyebrow">#${index + 1} value match</span><h3>${escapeHtml(result.candidate.name)}</h3></div><div class="lbl-score"><strong>${Math.round(result.quality.score)}</strong><span>quality floor</span></div></div><div class="lbl-saving">${Math.round(result.savingsPct)}% less · <span>${money(result.required)}/mo</span></div><p class="lbl-tradeoff-summary">${escapeHtml(resultDescription(result))}</p></div><details><summary>See the six-measure comparison</summary><div class="lbl-metrics">${rows}</div></details></article>`;
  }

  function renderFrontier() {
    const rows = state.results.slice(0, 32);
    const width = 920, height = 390, left = 58, right = 28, top = 28, bottom = 48;
    const maxSavings = Math.max(20, Math.ceil(Math.max(...rows.map((row) => row.savingsPct)) / 10) * 10);
    const minQuality = Math.max(45, Math.floor(Math.min(...rows.map((row) => row.quality.score)) / 10) * 10);
    const x = (value) => left + value / maxSavings * (width - left - right);
    const y = (value) => top + (100 - value) / (100 - minQuality || 1) * (height - top - bottom);
    const xTicks = [0, .25, .5, .75, 1].map((ratio) => `<line class="lbl-gridline" x1="${x(maxSavings * ratio)}" x2="${x(maxSavings * ratio)}" y1="${top}" y2="${height - bottom}"/><text class="lbl-axis" x="${x(maxSavings * ratio)}" y="${height - 17}" text-anchor="middle">${Math.round(maxSavings * ratio)}%</text>`).join("");
    const yTicks = [minQuality, (minQuality + 100) / 2, 100].map((value) => `<line class="lbl-gridline" x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}"/><text class="lbl-axis" x="${left - 10}" y="${y(value) + 4}" text-anchor="end">${Math.round(value)}</text>`).join("");
    const points = rows.map((row, index) => {
      const pointX = x(row.savingsPct);
      const pointY = y(row.quality.score);
      let label = "";
      if (index < 6) {
        const placeLeft = pointX > width - right - 150;
        const labelX = placeLeft ? pointX - 10 : pointX + 10;
        const labelY = pointY - 8 < 14 ? pointY + 18 : pointY - 8;
        label = `<text class="lbl-point-label" x="${labelX}" y="${labelY}" text-anchor="${placeLeft ? "end" : "start"}">${escapeHtml(row.candidate.name)}</text>`;
      }
      return `<a href="#destination-${row.candidate.code}" aria-label="${escapeHtml(row.candidate.name)}: ${Math.round(row.savingsPct)} percent lower cost, ${Math.round(row.quality.score)} quality floor"><circle class="lbl-point" cx="${pointX}" cy="${pointY}" r="${index < 6 ? 7 : 4}" fill="${index === 0 ? "#f97316" : index < 6 ? "#2563eb" : "#94a3b8"}"/>${label}</a>`;
    }).join("");
    $("[data-frontier]").innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Scatter plot of estimated savings against quality-floor preservation"><title>Value frontier</title>${xTicks}${yTicks}${points}<text class="lbl-axis" x="${(left + width - right) / 2}" y="${height - 2}" text-anchor="middle">Estimated spending reduction</text><text class="lbl-axis" transform="translate(14 ${(top + height - bottom) / 2}) rotate(-90)" text-anchor="middle">Quality-floor preservation</text></svg><div class="lbl-frontier-note">Only countries passing the selected hard floors appear. Position does not include visas, taxes, housing tenure, or relocation eligibility.</div>`;
  }

  function productionUrl() {
    const url = new URL(location.href);
    if (["localhost", "127.0.0.1"].includes(url.hostname) || url.hostname.endsWith("pages.dev")) {
      url.protocol = "https:"; url.hostname = "wealthmeter.xyz"; url.port = "";
    }
    return url.toString();
  }

  function shareText() {
    const top = state.results[0];
    return `${top.candidate.name} may cost ${Math.round(top.savingsPct)}% less than ${state.home.name} while preserving ${Math.round(top.quality.score)}% of my selected quality floor. Compare the tradeoffs on WealthMeter.`;
  }

  function renderShare() {
    const top = state.results[0];
    $("[data-share-preview]").innerHTML = `<div class="lbl-share-brand"><strong>WEALTHMETER.XYZ</strong><span>LIVE BETTER FOR LESS</span></div><h3><span>${escapeHtml(top.candidate.name)}</span> may cost ${Math.round(top.savingsPct)}% less.</h3><p>${Math.round(top.quality.score)}% of the selected quality benchmark preserved · ${money(state.monthly)} at home → ${money(top.required)} there</p><div class="lbl-share-foot">National consumption-price and public systems comparison · Price-only screening, not relocation advice · wealthmeter.xyz</div>`;
  }

  function openShare(platform) {
    const url = productionUrl();
    const text = shareText();
    const endpoints = {
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent("Live Better for Less result")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(url).then(() => { $("[data-share-status]").textContent = "Link copied."; });
      return;
    }
    if (endpoints[platform]) window.open(endpoints[platform], "_blank", "noopener,noreferrer");
  }

  function downloadCard() {
    const top = state.results[0];
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 630;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#071427"); gradient.addColorStop(.65, "#0d2949"); gradient.addColorStop(1, "#075e68");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = "#facc15"; ctx.fillRect(72, 64, 10, 52);
    ctx.fillStyle = "#f8fafc"; ctx.font = "800 34px Arial"; ctx.fillText("WEALTHMETER.XYZ", 104, 102);
    ctx.fillStyle = "#7dd3fc"; ctx.font = "700 20px Arial"; ctx.fillText("LIVE BETTER FOR LESS", 72, 178);
    ctx.fillStyle = "#facc15"; ctx.font = "800 62px Arial"; ctx.fillText(top.candidate.name, 72, 260, 1020);
    ctx.fillStyle = "#f8fafc"; ctx.font = "800 54px Arial"; ctx.fillText(`may cost ${Math.round(top.savingsPct)}% less`, 72, 330, 1020);
    ctx.fillStyle = "#cbd5e1"; ctx.font = "600 28px Arial"; ctx.fillText(`${Math.round(top.quality.score)}% of my selected quality benchmark preserved`, 72, 391, 1020);
    ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(72, 430, 1056, 92);
    ctx.fillStyle = "#f8fafc"; ctx.font = "700 25px Arial"; ctx.fillText(`${money(state.monthly)} / month in ${state.home.name}`, 98, 470, 470);
    ctx.fillText(`≈ ${money(top.required)} / month there`, 630, 470, 470);
    ctx.fillStyle = "#94a3b8"; ctx.font = "500 17px Arial"; ctx.fillText("National consumption-price and public systems comparison · Not relocation advice", 72, 575);
    ctx.fillStyle = "#f8fafc"; ctx.font = "700 19px Arial"; ctx.fillText("wealthmeter.xyz", 1000, 575);
    const link = document.createElement("a");
    link.download = `wealthmeter-live-better-${top.candidate.code.toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png"); link.click();
  }

  function bindCardLinks() {
    $("[data-download]").onclick = downloadCard;
    $$('[data-share]').forEach((button) => { button.onclick = () => openShare(button.dataset.share); });
  }

  async function init() {
    try {
      const [atlas, supplement] = await Promise.all([
        fetch("data/country-systems-atlas.json").then((response) => response.ok ? response.json() : Promise.reject(new Error("Atlas data unavailable"))),
        fetch("data/quality-of-life-supplement.json").then((response) => response.ok ? response.json() : Promise.reject(new Error("Quality data unavailable")))
      ]);
      if (!window.PPW_REAL_DATA) throw new Error("Price data unavailable");
      state.rows = buildRows(atlas, supplement, window.PPW_REAL_DATA);
      $("[data-country-count]").textContent = state.rows.length;
      populateHome();
      $$(".lbl-chip-row input").forEach((input) => input.addEventListener("change", () => updatePriorityControls(input)));
      $("[data-run]").addEventListener("click", () => calculate());
      $("#monthly-spend").addEventListener("keydown", (event) => { if (event.key === "Enter") calculate(); });
      calculate({ scroll: false });
    } catch (error) {
      $(".lbl-controls").insertAdjacentHTML("afterend", `<div class="lbl-empty"><h2>The comparison data did not load.</h2><p>${escapeHtml(error.message)}. Reload the page or try again shortly.</p></div>`);
    }
  }

  init();
})();
